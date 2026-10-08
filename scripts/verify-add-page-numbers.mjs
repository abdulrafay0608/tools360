import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { degrees, PDFDocument, rgb } from "pdf-lib";

const ROOT = process.cwd();
const OUTPUT_DIR = path.resolve(ROOT, "..", "add-page-numbers-verification");
const BASE_URL =
  process.env.VERIFICATION_BASE_URL || "http://127.0.0.1:3002";
const PDFJS_MODULE_BASE64 = fs
  .readFileSync(path.join(ROOT, "node_modules", "pdfjs-dist", "build", "pdf.min.mjs"))
  .toString("base64");
const FIXTURE_PATH = path.join(
  ROOT,
  "tests",
  "fixtures",
  "organize-six-page-rotated.pdf"
);

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function upload(page, name, buffer, mimeType = "application/pdf") {
  await page.locator("input[type='file']").setInputFiles({
    name,
    mimeType,
    buffer: Buffer.from(buffer),
  });
}

async function waitForLoadedPages(page, count) {
  await page.waitForFunction(
    (expected) => {
      const cards = [...document.querySelectorAll("article[data-page-source]")];
      return (
        cards.length === expected &&
        cards.every((card) => {
          const canvas = card.querySelector("canvas");
          return canvas && canvas.width > 0 && canvas.height > 0;
        })
      );
    },
    count,
    { timeout: 30000 }
  );
}

async function readPreviewNumber(page, pageNumber) {
  return page
    .locator(`article[data-page-source='${pageNumber}']`)
    .getAttribute("data-page-number");
}

async function assertPreviewPosition(page, position) {
  const card = page.locator("article[data-page-source='1']");
  const canvas = await card.locator("canvas").boundingBox();
  const label = await card.locator("[data-page-number-preview='true']").boundingBox();
  assert.ok(canvas && label, `Missing preview or number at ${position}`);

  const [vertical, horizontal] = position.split("-");
  if (vertical === "top") {
    assert.ok(label.y < canvas.y + canvas.height / 2, `${position} was not at the top`);
  } else {
    assert.ok(
      label.y + label.height > canvas.y + canvas.height / 2,
      `${position} was not at the bottom`
    );
  }
  if (horizontal === "left") {
    assert.ok(label.x < canvas.x + canvas.width / 2, `${position} was not left aligned`);
  } else if (horizontal === "right") {
    assert.ok(
      label.x + label.width > canvas.x + canvas.width / 2,
      `${position} was not right aligned`
    );
  } else {
    assert.ok(
      Math.abs(label.x + label.width / 2 - (canvas.x + canvas.width / 2)) < 3,
      `${position} was not centered`
    );
  }
}

async function checkNoAdOverlap(page) {
  return page.evaluate(() => {
    const slots = [...document.querySelectorAll("[data-ad-slot='true']")].filter(
      (slot) => {
        const style = getComputedStyle(slot);
        return style.display !== "none" && style.visibility !== "hidden";
      }
    );
    const targets = [...document.querySelectorAll("article, button, canvas, input, select")];
    const gap = innerWidth < 640 ? 24 : 32;
    const violations = [];
    for (const slot of slots) {
      const ad = slot.getBoundingClientRect();
      for (const target of targets) {
        if (slot.contains(target) || target.contains(slot)) continue;
        const rect = target.getBoundingClientRect();
        if (!rect.width || !rect.height || !ad.width || !ad.height) continue;
        const separated =
          rect.right + gap <= ad.left ||
          ad.right + gap <= rect.left ||
          rect.bottom + gap <= ad.top ||
          ad.bottom + gap <= rect.top;
        if (!separated) {
          violations.push({
            placement: slot.getAttribute("data-ad-placement"),
            target: target.getAttribute("aria-label") || target.innerText,
          });
        }
      }
    }
    return violations;
  });
}

async function createOffsetRotationPdf() {
  const pdf = await PDFDocument.create();
  const rotations = [0, 90, 180, 270, 90, 180];
  rotations.forEach((rotation, index) => {
    const page = pdf.addPage([500, 700]);
    page.setMediaBox(10, 20, 500, 700);
    page.setCropBox(35, 55, 420, 620);
    page.setRotation(degrees(rotation));
    page.drawRectangle({
      x: 38,
      y: 58,
      width: 414,
      height: 614,
      borderColor: rgb(0.7, 0.1, 0.1),
      borderWidth: 1,
    });
    page.drawText(`OFFSET TEST PAGE ${index + 1}`, {
      x: 80,
      y: 110,
      size: 18,
      color: rgb(0.1, 0.2, 0.7),
    });
  });
  return pdf.save();
}

async function inspectPdf(page, bytes, filenamePrefix) {
  const pages = await page.evaluate(
    async ({ moduleBase64, pdfBytes }) => {
      if (!window.__pageNumberVerificationPdfjs) {
        const moduleUrl = `data:text/javascript;base64,${moduleBase64}`;
        const library = await import(moduleUrl);
        library.GlobalWorkerOptions.workerSrc = `${location.origin}/pdf.worker.min.mjs`;
        window.__pageNumberVerificationPdfjs = library;
      }

      const library = window.__pageNumberVerificationPdfjs;
      const documentProxy = await library.getDocument({
        data: new Uint8Array(pdfBytes),
      }).promise;
      const renderedPages = [];
      for (let index = 1; index <= documentProxy.numPages; index += 1) {
        const pdfPage = await documentProxy.getPage(index);
        const textContent = await pdfPage.getTextContent();
        const viewport = pdfPage.getViewport({ scale: 1 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await pdfPage.render({
          canvasContext: canvas.getContext("2d"),
          viewport,
        }).promise;
        renderedPages.push({
          rotation: pdfPage.rotate,
          width: viewport.width,
          height: viewport.height,
          text: textContent.items.map((item) => item.str).join(" "),
          items: textContent.items.map((item) => ({
            str: item.str,
            transform: item.transform,
            visualTransform: library.Util.transform(
              viewport.transform,
              item.transform
            ),
            width: item.width,
            height: item.height,
          })),
          png: canvas.toDataURL("image/png"),
        });
      }
      await documentProxy.cleanup();
      return renderedPages;
    },
    {
      moduleBase64: PDFJS_MODULE_BASE64,
      pdfBytes: [...bytes],
    }
  );

  for (const [index, pdfPage] of pages.entries()) {
    const pngPath = path.join(
      OUTPUT_DIR,
      `${filenamePrefix}-page-${index + 1}.png`
    );
    await fs.promises.writeFile(
      pngPath,
      Buffer.from(pdfPage.png.split(",")[1], "base64")
    );
    delete pdfPage.png;
    pdfPage.pngPath = pngPath;
  }
  return pages;
}

async function createEncryptedPdf() {
  return fs.promises.readFile(
    path.join(ROOT, "tests", "fixtures", "sample-protected.pdf")
  );
}

async function main() {
  const fixtureBytes = await fs.promises.readFile(FIXTURE_PATH);
  const rotatedOffsetBytes = await createOffsetRotationPdf();
  const corruptedBytes = await fs.promises.readFile(
    path.join(ROOT, "tests", "fixtures", "corrupted.pdf")
  );
  const encryptedBytes = await createEncryptedPdf();
  const browser = await chromium.launch({ headless: true });
  const networkRequests = [];
  const networkErrors = [];
  const consoleErrors = [];
  const results = { checks: [], screenshots: [], errors: {}, networkErrors };

  try {
    const desktop = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      acceptDownloads: true,
    });
    const page = await desktop.newPage();
    page.on("request", (request) => {
      networkRequests.push({
        method: request.method(),
        url: request.url(),
        hasBody: Boolean(request.postData()),
      });
    });
    page.on("requestfailed", (request) => {
      networkErrors.push({
        url: request.url(),
        error: request.failure()?.errorText,
      });
    });
    page.on("response", (response) => {
      if (response.status() >= 400) {
        networkErrors.push({ url: response.url(), status: response.status() });
      }
    });
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    await page.goto(`${BASE_URL}/tools/add-page-numbers`, {
      waitUntil: "networkidle",
    });
    assert.match(await page.title(), /Add Page Numbers Online/);
    assert.equal(await page.getByText("Files are not uploaded").count(), 1);
    assert.equal(
      await page.getByText("How to use Add Page Numbers online").count(),
      0
    );
    assert.equal(
      await page.locator('script[type="application/ld+json"]').textContent().then(
        (json) => json?.includes("FAQPage") ?? false
      ),
      false
    );
    const sitemap = await page.request.get(`${BASE_URL}/sitemap.xml`);
    assert.equal(sitemap.ok(), true);
    assert.match(await sitemap.text(), /\/tools\/add-page-numbers/);

    await upload(page, "six-page-rotated-fixture.pdf", fixtureBytes);
    await waitForLoadedPages(page, 6);
    assert.equal(await readPreviewNumber(page, 1), "1");

    const positionOptions = [
      ["top-left", "Top left"],
      ["top-center", "Top center"],
      ["top-right", "Top right"],
      ["bottom-left", "Bottom left"],
      ["bottom-center", "Bottom center"],
      ["bottom-right", "Bottom right"],
    ];
    for (const [position, label] of positionOptions) {
      await page.getByRole("button", { name: label }).click();
      await assertPreviewPosition(page, position);
    }
    results.checks.push("all six position options update preview to the matching visual corner");

    const formats = [
      ["1", "1"],
      ["Page 1", "Page 1"],
      ["1 of N", "1 of 6"],
      ["Page 1 of N", "Page 1 of 6"],
    ];
    for (const [choice, preview] of formats) {
      await page.getByRole("button", { name: choice, exact: true }).click();
      assert.equal(await readPreviewNumber(page, 1), preview);
    }
    results.checks.push("all four number formats update live preview");

    await page.getByLabel("Font", { exact: true }).selectOption("Times");
    await page.getByLabel("Font size", { exact: true }).fill("18");
    await page.getByLabel("Text color").evaluate((input) => {
      input.value = "#c02020";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.getByLabel("Margin in points").fill("30");
    await page.getByLabel("Mirror left/right on odd and even pages").check();
    await page.getByLabel("Mirror left/right on odd and even pages").uncheck();
    await page.getByLabel("Font", { exact: true }).selectOption("Helvetica");
    await page.getByLabel("Font size", { exact: true }).fill("12");
    await page.getByLabel("Text color").fill("#263e36");
    await page.getByLabel("Margin in points").fill("36");

    await page.getByLabel("Range from page").fill("4");
    await page.getByLabel("Range to page").fill("2");
    await page.getByRole("alert").filter({ hasText: /valid page range/ }).waitFor();
    assert.equal(
      await page.getByRole("button", { name: "Download numbered PDF" }).isDisabled(),
      true
    );
    await page.getByLabel("Range from page").fill("1");
    await page.getByLabel("Range to page").fill("6");
    await page.getByLabel("Start number").fill("5");
    await page.getByRole("button", { name: "Page 1 of N", exact: true }).click();
    await page.getByRole("button", { name: "Bottom center" }).click();
    await page.getByLabel("Skip first page (cover)").check();
    const expectedPreview = ["", "Page 5 of 6", "Page 6 of 6", "Page 7 of 6", "Page 8 of 6", "Page 9 of 6"];
    for (let number = 1; number <= 6; number += 1) {
      assert.equal(await readPreviewNumber(page, number), expectedPreview[number - 1]);
    }
    results.checks.push("invalid page range message and disabled export");

    const desktopScreenshot = path.join(OUTPUT_DIR, "add-page-numbers-desktop.png");
    assert.deepEqual(await checkNoAdOverlap(page), []);
    results.checks.push("desktop ad slots do not overlap controls or the page grid");
    await page.screenshot({ path: desktopScreenshot, fullPage: true });
    results.screenshots.push(desktopScreenshot);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download numbered PDF" }).click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), "six-page-rotated-fixture-numbered.pdf");
    const exportedPath = path.join(OUTPUT_DIR, download.suggestedFilename());
    await download.saveAs(exportedPath);
    const exportedBytes = await fs.promises.readFile(exportedPath);
    const numberedPages = await inspectPdf(page, exportedBytes, "numbered-export");
    assert.equal(numberedPages.length, 6);
    for (let index = 0; index < numberedPages.length; index += 1) {
      const expected = expectedPreview[index];
      if (expected) assert.ok(numberedPages[index].text.includes(expected));
      else assert.ok(!numberedPages[index].text.includes("Page 5 of 6"));
    }
    assert.ok(!numberedPages[0].text.includes("Page 5 of 6"));
    results.checks.push(
      "six-page export text extraction confirms start=5, Page X of 6 format and unnumbered cover"
    );

    await page.getByRole("button", { name: "Choose another PDF" }).click();
    await upload(page, "offset-rotated-pages.pdf", rotatedOffsetBytes);
    await waitForLoadedPages(page, 6);
    await page.getByLabel("Range from page").fill("1");
    await page.getByLabel("Range to page").fill("6");
    await page.getByLabel("Start number").fill("1");
    await page.getByRole("button", { name: "1", exact: true }).click();
    await page.getByRole("button", { name: "Bottom center" }).click();
    await page.getByLabel("Skip first page (cover)").uncheck();

    const rotatedDownloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download numbered PDF" }).click();
    const rotatedDownload = await rotatedDownloadPromise;
    assert.equal(rotatedDownload.suggestedFilename(), "offset-rotated-pages-numbered.pdf");
    const rotatedExportPath = path.join(OUTPUT_DIR, rotatedDownload.suggestedFilename());
    await rotatedDownload.saveAs(rotatedExportPath);
    const rotatedExportBytes = await fs.promises.readFile(rotatedExportPath);
    const visualPages = await inspectPdf(
      page,
      rotatedExportBytes,
      "rotated-cropbox-export"
    );
    assert.deepEqual(
      visualPages.map((pdfPage) => pdfPage.rotation),
      [0, 90, 180, 270, 90, 180]
    );
    for (const [index, pdfPage] of visualPages.entries()) {
      const label = pdfPage.items.find((item) =>
        item.str === String(index + 1)
      );
      assert.ok(label, `Page ${index + 1} was missing its extracted page number`);
      assert.ok(
        Math.abs(label.visualTransform[1]) < 0.1,
        `Page ${index + 1} number is not visually horizontal: ${label.visualTransform}`
      );
      assert.ok(
        label.visualTransform[0] > 0 && label.visualTransform[3] < 0,
        `Page ${index + 1} number is not visually upright: ${label.visualTransform}`
      );
      assert.ok(
        Math.abs(
          label.visualTransform[4] + label.width / 2 - pdfPage.width / 2
        ) < 8,
        `Page ${index + 1} number is not bottom centered`
      );
      assert.ok(
        Math.abs(pdfPage.height - label.visualTransform[5] - 36) < 12,
        `Page ${index + 1} number is not near the bottom margin`
      );
    }
    results.checks.push(
      "rotated 0/90/180/270 pages with offset MediaBox/CropBox retain horizontal bottom-center numbers in visual coordinates"
    );
    results.screenshots.push(...visualPages.map((pdfPage) => pdfPage.pngPath));

    await page.getByRole("button", { name: "Choose another PDF" }).click();
    await upload(page, "invalid.txt", Buffer.from("not a PDF"), "text/plain");
    const typeError = page.getByRole("alert").filter({ hasText: /not a valid PDF file/ });
    await typeError.waitFor();
    results.errors.wrongType = await typeError.innerText();

    await upload(page, "corrupted.pdf", corruptedBytes);
    const corruptedError = page.getByRole("alert").filter({ hasText: /corrupted or unsupported/ });
    await corruptedError.waitFor();
    results.errors.corrupted = await corruptedError.innerText();

    await page.getByRole("button", { name: "Choose another PDF" }).click();
    await upload(page, "encrypted.pdf", encryptedBytes);
    const encryptedError = page.getByRole("alert").filter({
      hasText: /encrypted or password-protected/,
    });
    await encryptedError.waitFor({ timeout: 20000 });
    results.errors.encrypted = await encryptedError.innerText();

    await page.getByRole("button", { name: "Choose another PDF" }).click();
    const tooLarge = Buffer.alloc(50 * 1024 * 1024 + 1);
    tooLarge.write("%PDF-1.7");
    const oversizedPath = path.join(OUTPUT_DIR, "over-50-mb.pdf");
    await fs.promises.writeFile(oversizedPath, tooLarge);
    await page.locator("input[type='file']").setInputFiles(oversizedPath);
    await fs.promises.unlink(oversizedPath);
    const sizeError = page.getByRole("alert").filter({ hasText: /exceeds the 50 MB file limit/ });
    await sizeError.waitFor();
    results.errors.oversized = await sizeError.innerText();
    results.checks.push("wrong type, corrupted, encrypted and over-50MB errors");

    await desktop.close();

    const mobile = await browser.newContext({
      viewport: { width: 375, height: 667 },
      isMobile: true,
      hasTouch: true,
      acceptDownloads: true,
    });
    const mobilePage = await mobile.newPage();
    mobilePage.on("request", (request) => {
      networkRequests.push({
        method: request.method(),
        url: request.url(),
        hasBody: Boolean(request.postData()),
      });
    });
    mobilePage.on("requestfailed", (request) => {
      networkErrors.push({
        url: request.url(),
        error: request.failure()?.errorText,
      });
    });
    mobilePage.on("response", (response) => {
      if (response.status() >= 400) {
        networkErrors.push({ url: response.url(), status: response.status() });
      }
    });
    mobilePage.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    mobilePage.on("pageerror", (error) => consoleErrors.push(error.message));
    await mobilePage.goto(`${BASE_URL}/tools/add-page-numbers`, {
      waitUntil: "networkidle",
    });
    await upload(mobilePage, "six-page-rotated-fixture.pdf", fixtureBytes);
    await waitForLoadedPages(mobilePage, 6);
    const mobileLayout = await mobilePage.evaluate(() => ({
      viewportWidth: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      cards: [...document.querySelectorAll("article")].map((card) => {
        const bounds = card.getBoundingClientRect();
        return [bounds.left, bounds.right];
      }),
    }));
    assert.ok(mobileLayout.documentWidth <= mobileLayout.viewportWidth, JSON.stringify(mobileLayout));
    assert.ok(
      mobileLayout.cards.every(([left, right]) => left >= 0 && right <= mobileLayout.viewportWidth),
      JSON.stringify(mobileLayout)
    );
    await mobilePage.getByRole("button", { name: "Top right" }).tap();
    await assertPreviewPosition(mobilePage, "top-right");
    assert.deepEqual(await checkNoAdOverlap(mobilePage), []);
    const mobileScreenshot = path.join(OUTPUT_DIR, "add-page-numbers-mobile-375px.png");
    await mobilePage.screenshot({ path: mobileScreenshot, fullPage: true });
    results.screenshots.push(mobileScreenshot);
    results.checks.push("375px viewport fits, live preview positions and ad slots do not overlap");
    await mobile.close();

    const regressions = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      acceptDownloads: true,
    });
    for (const slug of ["rotate-pdf", "organize-pdf"]) {
      const regressionPage = await regressions.newPage();
      regressionPage.on("request", (request) => {
        networkRequests.push({
          method: request.method(),
          url: request.url(),
          hasBody: Boolean(request.postData()),
        });
      });
      regressionPage.on("requestfailed", (request) => {
        networkErrors.push({
          url: request.url(),
          error: request.failure()?.errorText,
        });
      });
      regressionPage.on("response", (response) => {
        if (response.status() >= 400) {
          networkErrors.push({ url: response.url(), status: response.status() });
        }
      });
      regressionPage.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      regressionPage.on("pageerror", (error) => consoleErrors.push(error.message));
      await regressionPage.goto(`${BASE_URL}/tools/${slug}`, {
        waitUntil: "networkidle",
      });
      await upload(regressionPage, "fixture.pdf", fixtureBytes);
      await waitForLoadedPages(regressionPage, 6);

      const rotations =
        slug === "rotate-pdf" ? [90, 180, 90, 90, 0, 90] : [270, 90, 0, 0, 270, 0];
      const actionName =
        slug === "rotate-pdf"
          ? "Rotate all right"
          : "Rotate page 1 left";
      await regressionPage.getByRole("button", { name: actionName }).click();
      const exportName =
        slug === "rotate-pdf"
          ? "fixture-rotated.pdf"
          : "fixture-organized.pdf";
      const exportButton =
        slug === "rotate-pdf"
          ? "Download rotated PDF"
          : "Download organized PDF";
      const downloadPromise = regressionPage.waitForEvent("download");
      await regressionPage.getByRole("button", { name: exportButton }).click();
      const regressionDownload = await downloadPromise;
      assert.equal(regressionDownload.suggestedFilename(), exportName);
      const regressionPath = path.join(OUTPUT_DIR, exportName);
      await regressionDownload.saveAs(regressionPath);
      const regressionPdf = await PDFDocument.load(
        await fs.promises.readFile(regressionPath)
      );
      assert.deepEqual(
        regressionPdf.getPages().map((pdfPage) => pdfPage.getRotation().angle),
        rotations
      );
      results.checks.push(`${slug} export behavior regression`);
      await regressionPage.close();
    }
    await regressions.close();
  } finally {
    await browser.close();
  }

  const requestProblems = networkRequests.filter(
    (request) => !["GET", "HEAD"].includes(request.method) || request.hasBody
  );
  assert.deepEqual(requestProblems, [], JSON.stringify(requestProblems));
  assert.deepEqual(networkErrors, [], JSON.stringify(networkErrors));
  assert.deepEqual(consoleErrors, []);
  results.checks.push(
    "no non-GET requests, request bodies/file uploads, failed requests or console errors"
  );
  results.networkRequestCount = networkRequests.length;
  results.networkErrors = networkErrors;
  results.consoleErrors = consoleErrors;
  results.generatedAt = new Date().toISOString();
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "report.json"),
    JSON.stringify(results, null, 2)
  );
  console.log(JSON.stringify(results, null, 2));
  console.log(`\nWrote ${path.join(OUTPUT_DIR, "report.json")}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
