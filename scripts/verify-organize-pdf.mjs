import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

const ROOT = process.cwd();
const OUTPUT_DIR = path.resolve(ROOT, "..", "organize-pdf-verification");
const BASE_URL = "http://127.0.0.1:3001";
const MULTIPAGE_FIXTURE = path.join(ROOT, "tests", "fixtures", "sample-multipage.pdf");
const ORGANIZER_FIXTURE = path.join(
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
    buffer,
  });
}

async function waitForLoadedPages(page, count) {
  await page.waitForFunction(
    (expected) => {
      const cards = [...document.querySelectorAll("[data-page-id]")];
      const canvases = [...document.querySelectorAll("[data-page-id] canvas")];
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

async function readPageOrder(page) {
  return page.locator("[data-page-id]").evaluateAll((cards) =>
    cards.map((card) => ({
      id: card.getAttribute("data-page-id"),
      source: Number(card.getAttribute("data-page-source")),
      deleted: card.getAttribute("data-page-deleted") === "true",
    }))
  );
}

async function inspectExport(
  downloadPromise,
  suggestedName,
  expectedWidths,
  expectedRotations,
  outputName = suggestedName
) {
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), suggestedName);
  const savedPath = path.join(OUTPUT_DIR, outputName);
  await download.saveAs(savedPath);
  const exported = await PDFDocument.load(await fs.promises.readFile(savedPath));
  const pages = exported.getPages();
  assert.equal(pages.length, expectedWidths.length);
  assert.deepEqual(pages.map((page) => page.getSize().width), expectedWidths);
  assert.deepEqual(pages.map((page) => page.getRotation().angle), expectedRotations);
  return savedPath;
}

async function checkNoAdOverlap(page) {
  return page.evaluate(() => {
    const slots = [...document.querySelectorAll("[data-ad-slot='true']")].filter(
      (slot) => {
        const style = getComputedStyle(slot);
        return style.display !== "none" && style.visibility !== "hidden";
      }
    );
    const targets = [
      ...document.querySelectorAll("[data-page-id], button, canvas"),
    ];
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
            target: target.getAttribute("data-page-id") || target.innerText,
          });
        }
      }
    }
    return violations;
  });
}

async function main() {
  const organizerFixture = await fs.promises.readFile(ORGANIZER_FIXTURE);
  const corruptedBytes = await fs.promises.readFile(
    path.join(ROOT, "tests", "fixtures", "corrupted.pdf")
  );
  const encryptedBytes = await fs.promises.readFile(
    path.join(ROOT, "tests", "fixtures", "sample-protected.pdf")
  );
  const samplePdf = await fs.promises.readFile(MULTIPAGE_FIXTURE);
  const browser = await chromium.launch({ headless: true });
  const networkRequests = [];
  const consoleErrors = [];
  const results = { checks: [], screenshots: [], exports: [], errors: {} };

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
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    await page.goto(`${BASE_URL}/tools/organize-pdf`, { waitUntil: "networkidle" });
    assert.equal(await page.getByText("How to use Organize PDF online").count(), 0);
    assert.equal(
      await page.locator('script[type="application/ld+json"]').textContent().then(
        (json) => json?.includes("FAQPage") ?? false
      ),
      false
    );
    await upload(page, "six-pages-with-rotations.pdf", organizerFixture);
    await waitForLoadedPages(page, 6);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "organize-desktop-loaded.png"),
      fullPage: true,
    });
    results.screenshots.push(path.join(OUTPUT_DIR, "organize-desktop-loaded.png"));

    const dragSource = page.locator(
      '[data-page-id="page-6"] button[aria-label="Drag page 6"]'
    );
    await dragSource.scrollIntoViewIfNeeded();
    const sourceBox = await dragSource.boundingBox();
    const targetBox = await page
      .locator('[data-page-id="page-1"] button[aria-label="Drag page 1"]')
      .boundingBox();
    await page.mouse.move(
      sourceBox.x + sourceBox.width / 2,
      sourceBox.y + sourceBox.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(sourceBox.x + sourceBox.width / 2 + 12, sourceBox.y + 12, {
      steps: 2,
    });
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll("[data-ad-slot='true']")].some(
          (slot) => slot.getAttribute("data-ad-paused") === "true"
        ),
      { timeout: 5000 }
    );
    await page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + targetBox.height / 2,
      { steps: 12 }
    );
    await page.mouse.up();
    await page.waitForFunction(
      () => document.querySelector("[data-page-id]")?.getAttribute("data-page-id") === "page-6",
      { timeout: 5000 }
    );
    assert.equal((await readPageOrder(page))[0].id, "page-6");
    await page.getByRole("button", { name: "Reset" }).click();
    assert.equal((await readPageOrder(page))[0].id, "page-1");
    results.checks.push("desktop drag-and-drop page reorder");

    await page.getByRole("button", { name: "Move page 1 right" }).click();
    assert.equal((await readPageOrder(page))[1].id, "page-1");
    await page.locator('[data-page-id="page-3"]').getByRole("button", {
      name: "Delete page 3",
    }).click();
    await page.locator('[data-page-id="page-2"]').getByRole("button", {
      name: "Rotate page 1 left",
    }).click();
    await page.locator('[data-page-id="page-4"]').getByRole("button", {
      name: "Duplicate page 4",
    }).click();
    const expectedOrder = await readPageOrder(page);
    assert.deepEqual(
      expectedOrder.map((item) => [item.id, item.source, item.deleted]),
      [
        ["page-2", 2, false],
        ["page-1", 1, false],
        ["page-3", 3, true],
        ["page-4", 4, false],
        ["duplicate-1", 4, false],
        ["page-5", 5, false],
        ["page-6", 6, false],
      ]
    );
    assert.match(await page.locator("body").innerText(), /6 of 7 pages/);
    assert.equal((await checkNoAdOverlap(page)).length, 0);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "organize-desktop-before-export.png"),
      fullPage: true,
    });
    results.screenshots.push(
      path.join(OUTPUT_DIR, "organize-desktop-before-export.png")
    );

    const fullExport = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download organized PDF" }).click();
    results.exports.push(
      await inspectExport(fullExport, "six-pages-with-rotations-organized.pdf", [
        420, 400, 460, 460, 480, 500,
      ], [0, 0, 0, 0, 270, 0])
    );

    await page.locator('[data-page-id="page-1"]').getByRole("button", {
      name: "Select page 2",
    }).click();
    await page.locator('[data-page-id="page-5"]').getByRole("button", {
      name: "Select page 6",
    }).click();
    const extractExport = page.waitForEvent("download");
    await page.getByRole("button", { name: "Extract selected pages" }).click();
    results.exports.push(
      await inspectExport(extractExport, "six-pages-with-rotations-organized.pdf", [
        400, 480,
      ], [0, 270], "extract-selected-pages.pdf")
    );

    await page.getByRole("button", { name: "Undo" }).click();
    assert.equal((await readPageOrder(page)).length, 6);
    await page.getByRole("button", { name: "Reset" }).click();
    assert.deepEqual(
      (await readPageOrder(page)).map((item) => item.source),
      [1, 2, 3, 4, 5, 6]
    );
    results.checks.push("page reorder/delete/rotate/duplicate/export/extract/undo/reset");

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
    const oversizedPath = path.join(OUTPUT_DIR, "very-large.pdf");
    await fs.promises.writeFile(oversizedPath, oversizedPdf);
    await page.locator("input[type='file']").setInputFiles(oversizedPath);
    await fs.promises.unlink(oversizedPath);
    const oversizedAlert = page
      .getByRole("alert")
      .filter({ hasText: /exceeds the 50 MB file limit/ });
    await oversizedAlert.waitFor();
    results.errors.oversized = await oversizedAlert.innerText();
    results.checks.push("wrong type, corrupted, encrypted and oversized file errors");
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
    mobilePage.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    mobilePage.on("pageerror", (error) => consoleErrors.push(error.message));
    await mobilePage.goto(`${BASE_URL}/tools/organize-pdf`, {
      waitUntil: "networkidle",
    });
    await upload(mobilePage, "six-pages-with-rotations.pdf", organizerFixture);
    await waitForLoadedPages(mobilePage, 6);
    const mobileDropzone = await mobilePage.locator("[data-page-id]").first().evaluate(
      (card) => card.getBoundingClientRect().top
    );
    assert.ok(mobileDropzone < 667);
    await mobilePage.getByRole("button", { name: "Move page 1 right" }).tap();
    assert.equal((await readPageOrder(mobilePage))[1].id, "page-1");
    assert.equal((await checkNoAdOverlap(mobilePage)).length, 0);
    await mobilePage.screenshot({
      path: path.join(OUTPUT_DIR, "organize-mobile-reordered.png"),
      fullPage: true,
    });
    results.screenshots.push(
      path.join(OUTPUT_DIR, "organize-mobile-reordered.png")
    );
    results.checks.push("375px touch viewport move controls reorder pages");
    await mobile.close();

    for (const [slug, fileCount, buttonName] of [
      ["merge-pdf", 2, /Merge \d+ PDFs/],
      ["split-pdf", 1, "Split PDF"],
    ]) {
      const regression = await browser.newPage({
        viewport: { width: 1280, height: 800 },
        acceptDownloads: true,
      });
      await regression.goto(`${BASE_URL}/tools/${slug}`, {
        waitUntil: "networkidle",
      });
      const files = Array.from({ length: fileCount }, (_, index) => ({
        name: `regression-${index + 1}.pdf`,
        mimeType: "application/pdf",
        buffer: samplePdf,
      }));
      await regression.locator("input[type='file']").setInputFiles(files);
      const action = regression.getByRole("button", { name: buttonName });
      await action.waitFor({ timeout: 20000 });
      await regression.waitForFunction(
        (button) => !button.disabled,
        await action.elementHandle(),
        { timeout: 20000 }
      );
      assert.equal(await action.isEnabled(), true, `${slug} action remained disabled`);
      await regression.close();
      results.checks.push(`${slug} upload and primary action regression`);
    }
  } finally {
    await browser.close();
  }

  const networkProblems = networkRequests.filter(
    (request) => request.method !== "GET" && request.method !== "HEAD"
  );
  const adRequests = networkRequests.filter((request) =>
    /googlesyndication|doubleclick|googleadservices|adservice|adsystem/i.test(
      request.url
    )
  );
  assert.equal(networkProblems.length, 0, JSON.stringify(networkProblems));
  assert.deepEqual(adRequests, [], JSON.stringify(adRequests));
  assert.equal(
    networkRequests.some((request) => request.hasBody),
    false,
    "A network request carried a body."
  );
  assert.deepEqual(consoleErrors, []);
  results.checks.push("no request bodies, non-GET requests or console errors");
  results.checks.push("no requests to known ad networks");
  results.requestCount = networkRequests.length;
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
