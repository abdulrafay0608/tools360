import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { degrees, PDFDocument } from "pdf-lib";

const ROOT = process.cwd();
const OUTPUT_DIR = path.resolve(ROOT, "..", "rotate-pdf-verification");
const BASE_URL = "http://127.0.0.1:3001";
const ROTATED_FIXTURE = path.join(
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
      const canvases = [...document.querySelectorAll("article canvas")];
      return (
        cards.length === expected &&
        canvases.length === expected &&
        canvases.every((canvas) => canvas.width > 0 && canvas.height > 0)
      );
    },
    count,
    { timeout: 30000 }
  );
}

async function readRotations(page) {
  return page.locator("article[data-page-source]").evaluateAll((cards) =>
    cards.map((card) => Number(card.getAttribute("data-page-rotation")))
  );
}

async function readSelectedPages(page) {
  return page.locator("article[data-page-source]").evaluateAll((cards) =>
    cards.flatMap((card, index) =>
      card.querySelector("button[aria-pressed='true']") ? [index + 1] : []
    )
  );
}

async function saveAndVerifyExport(page, filename, expectedRotations, sourceBytes) {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download rotated PDF" }).click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), filename);
  const outputPath = path.join(OUTPUT_DIR, filename);
  await download.saveAs(outputPath);
  const outputBytes = await fs.promises.readFile(outputPath);
  const output = await PDFDocument.load(outputBytes);
  assert.deepEqual(
    output.getPages().map((pdfPage) => pdfPage.getRotation().angle),
    expectedRotations
  );
  assert.ok(
    outputBytes.length < sourceBytes.length * 1.15,
    `Output grew from ${sourceBytes.length} to ${outputBytes.length} bytes`
  );
  return outputBytes.length;
}

async function checkNoAdOverlap(page) {
  return page.evaluate(() => {
    const slots = [...document.querySelectorAll("[data-ad-slot='true']")].filter(
      (slot) => {
        const style = getComputedStyle(slot);
        return style.display !== "none" && style.visibility !== "hidden";
      }
    );
    const targets = [...document.querySelectorAll("article, button, canvas")];
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

async function createMixedRotationPdf() {
  const pdf = await PDFDocument.create();
  const rotations = [0, 90, 180, 270, 90, 180];
  rotations.forEach((rotation, index) => {
    const page = pdf.addPage([420 + index * 8, 600]);
    page.setRotation(degrees(rotation));
    page.drawText(`Vector page ${index + 1}`, { x: 24, y: 48 });
  });
  return pdf.save();
}

async function createLargePdf(pageCount) {
  const pdf = await PDFDocument.create();
  for (let index = 0; index < pageCount; index += 1) {
    pdf.addPage([420, 600]).drawText(`Lazy thumbnail test ${index + 1}`, {
      x: 24,
      y: 48,
    });
  }
  return pdf.save();
}

async function main() {
  const fixtureBytes = await fs.promises.readFile(ROTATED_FIXTURE);
  const corruptedBytes = await fs.promises.readFile(
    path.join(ROOT, "tests", "fixtures", "corrupted.pdf")
  );
  const encryptedBytes = await fs.promises.readFile(
    path.join(ROOT, "tests", "fixtures", "sample-protected.pdf")
  );
  const browser = await chromium.launch({ headless: true });
  const networkRequests = [];
  const networkErrors = [];
  const consoleErrors = [];
  const results = { checks: [], screenshots: [], exportBytes: {}, errors: {} };

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
        networkErrors.push({
          url: response.url(),
          status: response.status(),
        });
      }
    });
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    await page.goto(`${BASE_URL}/tools/rotate-pdf`, {
      waitUntil: "networkidle",
    });
    assert.match(await page.title(), /Rotate PDF Online/);
    const sitemap = await page.request.get(`${BASE_URL}/sitemap.xml`);
    assert.equal(sitemap.ok(), true);
    assert.match(await sitemap.text(), /\/tools\/rotate-pdf/);
    assert.equal(await page.getByText("Files are not uploaded").count(), 1);
    assert.equal(await page.getByText("How to use Rotate PDF online").count(), 0);
    assert.equal(
      await page.locator('script[type="application/ld+json"]').textContent().then(
        (json) => json?.includes("FAQPage") ?? false
      ),
      false
    );
    await upload(page, "six-pages-with-rotations.pdf", fixtureBytes);
    await waitForLoadedPages(page, 6);
    assert.equal(
      await page.getByRole("button", { name: "Download rotated PDF" }).isDisabled(),
      true
    );
    assert.match(await page.locator("body").innerText(), /Rotate at least one page/);

    await page.getByRole("button", { name: "Select page 1" }).click();
    await page.getByRole("button", { name: "Select page 3" }).click({
      modifiers: ["Shift"],
    });
    assert.match(await page.locator("body").innerText(), /3 selected/);
    assert.deepEqual(await readSelectedPages(page), [1, 2, 3]);
    await page.getByRole("button", { name: "Select none" }).click();
    assert.match(await page.locator("body").innerText(), /0 selected/);
    await page.getByRole("button", { name: "Select all" }).click();
    assert.deepEqual(await readSelectedPages(page), [1, 2, 3, 4, 5, 6]);
    await page.getByRole("button", { name: "Select none" }).click();
    await page.getByRole("button", { name: "Even pages" }).click();
    assert.deepEqual(await readSelectedPages(page), [2, 4, 6]);
    await page.getByRole("button", { name: "Select none" }).click();

    await page.getByRole("button", { name: "Rotate all right" }).click();
    assert.deepEqual(await readRotations(page), [90, 180, 90, 90, 0, 90]);
    await page.getByRole("button", { name: "Rotate page 2 left" }).click();
    assert.deepEqual(await readRotations(page), [90, 90, 90, 90, 0, 90]);
    await page.getByRole("button", { name: "Odd pages" }).click();
    assert.match(await page.locator("body").innerText(), /3 selected/);
    assert.deepEqual(await readSelectedPages(page), [1, 3, 5]);
    await page.getByRole("button", { name: "Rotate selected 180°" }).click();
    const expectedFixtureRotations = [270, 90, 270, 90, 180, 90];
    assert.deepEqual(await readRotations(page), expectedFixtureRotations);
    results.exportBytes.fixture = await saveAndVerifyExport(
      page,
      "six-pages-with-rotations-rotated.pdf",
      expectedFixtureRotations,
      fixtureBytes
    );
    assert.equal((await checkNoAdOverlap(page)).length, 0);
    const desktopScreenshot = path.join(OUTPUT_DIR, "rotate-desktop-exported.png");
    await page.screenshot({ path: desktopScreenshot, fullPage: true });
    results.screenshots.push(desktopScreenshot);
    results.checks.push(
      "six-page fixture: right all, left one, odd pages 180, export rotations and filename"
    );
    results.checks.push(
      "shift selection, select all/none, odd/even shortcuts and disabled no-change export"
    );
    results.checks.push("desktop ad slots do not overlap controls or the page grid");

    await page.getByRole("button", { name: "Choose another PDF" }).click();
    const mixedRotations = [0, 90, 180, 270, 90, 180];
    const mixedBytes = await createMixedRotationPdf();
    await upload(page, "mixed-source-rotations.pdf", mixedBytes);
    await waitForLoadedPages(page, mixedRotations.length);
    assert.deepEqual(await readRotations(page), mixedRotations);
    await page.getByRole("button", { name: "Rotate all right" }).click();
    assert.deepEqual(await readRotations(page), [90, 180, 270, 0, 180, 270]);
    await page.getByRole("button", { name: "Reset" }).click();
    assert.deepEqual(await readRotations(page), mixedRotations);
    assert.equal(
      await page.getByRole("button", { name: "Download rotated PDF" }).isDisabled(),
      true
    );
    results.checks.push("Reset restores original page rotations and disables unchanged export");
    await page.getByRole("button", { name: "Rotate all left" }).click();
    const expectedMixedRotations = [270, 0, 90, 180, 0, 90];
    assert.deepEqual(await readRotations(page), expectedMixedRotations);
    results.exportBytes.mixed = await saveAndVerifyExport(
      page,
      "mixed-source-rotations-rotated.pdf",
      expectedMixedRotations,
      mixedBytes
    );
    results.checks.push(
      "0/90/180/270 source rotations preserved additively with less than 15% size growth"
    );

    await page.getByRole("button", { name: "Choose another PDF" }).click();
    await upload(page, "not-a-pdf.txt", Buffer.from("plain text"), "text/plain");
    const wrongTypeAlert = page
      .getByRole("alert")
      .filter({ hasText: /not a valid PDF file/ });
    await wrongTypeAlert.waitFor();
    results.errors.wrongFileType = await wrongTypeAlert.innerText();

    await upload(page, "corrupted.pdf", corruptedBytes);
    const corruptedAlert = page
      .getByRole("alert")
      .filter({ hasText: /corrupted or unsupported/ });
    await corruptedAlert.waitFor();
    results.errors.corrupted = await corruptedAlert.innerText();

    await page.getByRole("button", { name: "Choose another PDF" }).click();
    await upload(page, "password-protected.pdf", encryptedBytes);
    const encryptedAlert = page
      .getByRole("alert")
      .filter({ hasText: /encrypted or password-protected/ });
    await encryptedAlert.waitFor({ timeout: 20000 });
    results.errors.encrypted = await encryptedAlert.innerText();

    await page.getByRole("button", { name: "Choose another PDF" }).click();
    const oversizedPdf = Buffer.alloc(50 * 1024 * 1024 + 1);
    oversizedPdf.write("%PDF-1.7");
    const oversizedPath = path.join(OUTPUT_DIR, "rotate-over-limit.pdf");
    await fs.promises.writeFile(oversizedPath, oversizedPdf);
    await page.locator("input[type='file']").setInputFiles(oversizedPath);
    await fs.promises.unlink(oversizedPath);
    const oversizedAlert = page
      .getByRole("alert")
      .filter({ hasText: /exceeds the 50 MB file limit/ });
    await oversizedAlert.waitFor();
    results.errors.oversized = await oversizedAlert.innerText();
    results.checks.push("wrong type, corrupted, encrypted and >50 MB file error messages");

    await page.evaluate(() => {
      const dropzone = document.querySelector("[data-dropzone='true']");
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(new File(["drag"], "drag.pdf", {
        type: "application/pdf",
      }));
      dropzone.dispatchEvent(
        new DragEvent("dragenter", {
          bubbles: true,
          dataTransfer,
        })
      );
    });
    await page.waitForFunction(() =>
      document
        .querySelector("[data-dropzone='true']")
        ?.className.includes("bg-[#eaf3ed]")
    );
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll("[data-ad-slot='true']")].some(
          (slot) => slot.getAttribute("data-ad-paused") === "true"
        )
    );
    await page.evaluate(() => {
      document
        .querySelector("[data-dropzone='true']")
        .dispatchEvent(new DragEvent("dragleave", { bubbles: true }));
    });
    results.checks.push("ad pause is wired to PDF dropzone drag state");

    await upload(page, "six-pages-with-rotations.pdf", fixtureBytes);
    await waitForLoadedPages(page, 6);
    const largeBytes = await createLargePdf(110);
    await page.getByRole("button", { name: "Choose another PDF" }).click();
    await upload(page, "lazy-110-pages.pdf", largeBytes);
    await page.locator("article[data-page-source='110']").waitFor({
      timeout: 30000,
    });
    const renderedInitially = await page.locator("article canvas").evaluateAll(
      (canvases) =>
        canvases.filter((canvas) => canvas.width > 0 && canvas.height > 0).length
    );
    assert.ok(renderedInitially < 110, `${renderedInitially} pages rendered eagerly`);
    await page.locator("article[data-page-source='110']").scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const canvas = document.querySelector(
        "article[data-page-source='110'] canvas"
      );
      return canvas && canvas.width > 0 && canvas.height > 0;
    });
    results.checks.push(
      `110-page document rendered lazily (${renderedInitially} initial canvases; last page rendered on scroll)`
    );
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
        networkErrors.push({
          url: response.url(),
          status: response.status(),
        });
      }
    });
    mobilePage.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    mobilePage.on("pageerror", (error) => consoleErrors.push(error.message));
    await mobilePage.goto(`${BASE_URL}/tools/rotate-pdf`, {
      waitUntil: "networkidle",
    });
    await upload(mobilePage, "six-pages-with-rotations.pdf", fixtureBytes);
    await waitForLoadedPages(mobilePage, 6);
    const mobileLayout = await mobilePage.evaluate(() => ({
      viewportWidth: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      cards: [...document.querySelectorAll("article")].map((card) => {
        const rect = card.getBoundingClientRect();
        return { left: rect.left, right: rect.right };
      }),
    }));
    assert.ok(
      mobileLayout.documentWidth <= mobileLayout.viewportWidth,
      JSON.stringify(mobileLayout)
    );
    assert.ok(
      mobileLayout.cards.every(
        (card) => card.left >= 0 && card.right <= mobileLayout.viewportWidth
      ),
      JSON.stringify(mobileLayout)
    );
    await mobilePage.getByRole("button", { name: "Rotate all 180°" }).tap();
    assert.deepEqual(await readRotations(mobilePage), [180, 270, 180, 180, 90, 180]);
    assert.equal((await checkNoAdOverlap(mobilePage)).length, 0);
    const mobileScreenshot = path.join(OUTPUT_DIR, "rotate-mobile-375px.png");
    await mobilePage.screenshot({ path: mobileScreenshot, fullPage: true });
    results.screenshots.push(mobileScreenshot);
    results.checks.push("375px layout fits viewport, controls work, no ad overlap");
    await mobile.close();
  } finally {
    await browser.close();
  }

  const networkProblems = networkRequests.filter(
    (request) => !["GET", "HEAD"].includes(request.method) || request.hasBody
  );
  assert.deepEqual(networkProblems, [], JSON.stringify(networkProblems));
  assert.deepEqual(networkErrors, [], JSON.stringify(networkErrors));
  assert.deepEqual(consoleErrors, []);
  results.checks.push(
    "no non-GET requests, request bodies, failed/HTTP-error requests or browser console errors"
  );
  results.requestCount = networkRequests.length;
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
