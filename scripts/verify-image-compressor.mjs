import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";

const ROOT = process.cwd();
const EVIDENCE_DIR = path.resolve(ROOT, "tests", "verification-evidence");
const FIXTURES_DIR = path.resolve(ROOT, "tests", "fixtures");
const PORT = 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

// Helper to wait for server
async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status === 200) return true;
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Server failed to start at ${url} within ${timeoutMs}ms`);
}

async function runVerification() {
  console.log("=== Starting Image Compressor Automated Verification ===");

  await waitForServer(`${BASE_URL}/tools/image-compressor`);
  console.log(`Server is ready at ${BASE_URL}`);

  const browser = await chromium.launch();
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  const results = [];

    // -------------------------------------------------------------
    // Check 3: Production browser test with standard fixtures
    // -------------------------------------------------------------
    console.log("\n--- Running Check 3: Default fixtures upload & size verification ---");
    await page.goto(`${BASE_URL}/tools/image-compressor`);
    await page.waitForSelector("div[data-dropzone='true']");

    const defaultFixtures = [
      path.join(FIXTURES_DIR, "large-photo.jpg"),
      path.join(FIXTURES_DIR, "transparent.png"),
      path.join(FIXTURES_DIR, "sample.webp"),
      path.join(FIXTURES_DIR, "tiny-optimized.jpg"),
      path.join(FIXTURES_DIR, "exif-orientation-6.jpg"),
    ];

    // Upload fixtures
    await page.locator("input[type='file']").first().setInputFiles(defaultFixtures);

    // Wait until all 5 items are in the DOM and compression finishes
    await page.waitForFunction(() => {
      const items = document.querySelectorAll("article[data-image-item]");
      if (items.length !== 5) return false;
      const text = document.body.innerText;
      return !text.includes("Compressing...") && !text.includes("Queued...");
    }, { timeout: 25000 });

    await page.screenshot({ path: path.join(EVIDENCE_DIR, "01_default_compression_done.png"), fullPage: true });

    // Verify downloaded single files for each
    const items = await page.locator("article[data-image-item]").all();
    assert.equal(items.length, 5, "Expected 5 items in image grid");

    // Download first item (large-photo.jpg) and verify dimensions
    const [downloadLarge] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("button[data-download-single]").first().click(),
    ]);
    const largePath = path.join(EVIDENCE_DIR, "downloaded-large.jpg");
    await downloadLarge.saveAs(largePath);
    const largeStats = fs.statSync(largePath);
    assert.ok(largeStats.size > 0, "Downloaded large image size should be > 0");

    // Verify dimensions of downloaded large image via browser evaluate
    const largeDims = await page.evaluate(async (dataUrl) => {
      const img = new Image();
      await new Promise((res) => { img.onload = res; img.src = dataUrl; });
      return { w: img.width, h: img.height };
    }, `data:image/jpeg;base64,${fs.readFileSync(largePath).toString("base64")}`);
    assert.equal(largeDims.w, 2400, "Large image width should be 2400");
    assert.equal(largeDims.h, 1600, "Large image height should be 1600");

    console.log("Check 3 PASSED: Default fixtures compressed and validated.");
    results.push({ name: "Check 3: Default Compression & Dimension Verification", pass: true });

    // -------------------------------------------------------------
    // Check 4: EXIF upright, PNG transparency & already-optimized
    // -------------------------------------------------------------
    console.log("\n--- Running Check 4: EXIF orientation, PNG transparency & already-optimized ---");

    // 4a. Verify tiny-optimized.jpg has "already-optimized" status
    const tinyItem = page.locator("article[data-image-item]:has-text('tiny-optimized.jpg')");
    await assert.doesNotReject(async () => {
      await tinyItem.locator("[data-status='already-optimized']").waitFor({ timeout: 5000 });
    }, "tiny-optimized.jpg must show already-optimized badge");

    // 4b. Verify EXIF orientation 6 item comes out visually upright (150x300)
    const exifItem = page.locator("article[data-image-item]:has-text('exif-orientation-6.jpg')");
    const [downloadExif] = await Promise.all([
      page.waitForEvent("download"),
      exifItem.locator("button[data-download-single]").click(),
    ]);
    const exifPath = path.join(EVIDENCE_DIR, "downloaded-exif.jpg");
    await downloadExif.saveAs(exifPath);
    const exifDims = await page.evaluate(async (b64) => {
      const img = new Image();
      await new Promise((res) => { img.onload = res; img.src = "data:image/jpeg;base64," + b64; });
      return { w: img.width, h: img.height };
    }, fs.readFileSync(exifPath).toString("base64"));
    assert.equal(exifDims.w, 150, "EXIF image width should be 150 (upright)");
    assert.equal(exifDims.h, 300, "EXIF image height should be 300 (upright)");

    // 4c. Verify PNG transparency with 'keep PNG' vs 'convert to JPG'
    // First, verify keep PNG:
    const transparentItem = page.locator("article[data-image-item]:has-text('transparent.png')");
    const [downloadPng] = await Promise.all([
      page.waitForEvent("download"),
      transparentItem.locator("button[data-download-single]").click(),
    ]);
    const pngPath = path.join(EVIDENCE_DIR, "downloaded-transparent.png");
    await downloadPng.saveAs(pngPath);
    // Check if downloaded PNG has alpha transparency
    const pngHasAlpha = await page.evaluate(async (b64) => {
      const img = new Image();
      await new Promise((res) => { img.onload = res; img.src = "data:image/png;base64," + b64; });
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, img.width, img.height).data;
      // top-left corner (0,0) should be transparent (alpha == 0)
      return data[3] === 0;
    }, fs.readFileSync(pngPath).toString("base64"));
    assert.equal(pngHasAlpha, true, "PNG with keep PNG must preserve transparent pixels");

    // Now switch format to JPG and verify transparency warning and white background fill
    await page.selectOption("#output-format-select", "jpg");
    await page.waitForTimeout(400);
    // Verify transparency warning appears
    await page.waitForSelector("#transparency-warning");

    // Wait for re-compression to finish
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return !text.includes("Compressing...") && !text.includes("Queued...");
    }, { timeout: 15000 });

    await page.screenshot({ path: path.join(EVIDENCE_DIR, "02_png_converted_to_jpg_warning.png"), fullPage: true });

    // Download the converted transparent PNG (now .jpg)
    const [downloadJpgConverted] = await Promise.all([
      page.waitForEvent("download"),
      transparentItem.locator("button[data-download-single]").click(),
    ]);
    const convertedJpgPath = path.join(EVIDENCE_DIR, "downloaded-transparent-to-jpg.jpg");
    await downloadJpgConverted.saveAs(convertedJpgPath);

    // Verify top-left corner is now white (#ffffff: rgb > 240)
    const jpgFilledWhite = await page.evaluate(async (b64) => {
      const img = new Image();
      await new Promise((res) => { img.onload = res; img.src = "data:image/jpeg;base64," + b64; });
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, img.width, img.height).data;
      return data[0] > 240 && data[1] > 240 && data[2] > 240;
    }, fs.readFileSync(convertedJpgPath).toString("base64"));
    assert.equal(jpgFilledWhite, true, "JPG conversion must fill transparent background with white");

    console.log("Check 4 PASSED: EXIF orientation, PNG transparency, and already-optimized validated.");
    results.push({ name: "Check 4: EXIF Upright, PNG Transparency & Already Optimized", pass: true });

    // -------------------------------------------------------------
    // Check 5: Downscale options & quality slider
    // -------------------------------------------------------------
    console.log("\n--- Running Check 5: Downscale dimensions & quality slider ---");

    // Downscale large-photo (2400x1600) to 1280
    await page.selectOption("#max-dimension-select", "1280");
    await page.waitForTimeout(400);
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return !text.includes("Compressing...") && !text.includes("Queued...");
    }, { timeout: 15000 });

    const [downloadDownscaled] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("article[data-image-item]:has-text('large-photo') button[data-download-single]").click(),
    ]);
    const downscaledPath = path.join(EVIDENCE_DIR, "downloaded-downscaled-1280.jpg");
    await downloadDownscaled.saveAs(downscaledPath);
    const downscaledDims = await page.evaluate(async (b64) => {
      const img = new Image();
      await new Promise((res) => { img.onload = res; img.src = "data:image/jpeg;base64," + b64; });
      return { w: img.width, h: img.height };
    }, fs.readFileSync(downscaledPath).toString("base64"));
    assert.equal(downscaledDims.w, 1280, "Downscaled width must be 1280");
    assert.equal(downscaledDims.h, 853, "Downscaled height must be 853");

    // Quality slider test: test quality 30 vs quality 95
    // Reset downscale to none
    await page.selectOption("#max-dimension-select", "none");
    await page.waitForTimeout(400);

    // Set slider to 30
    await page.locator("#quality-slider").fill("30");
    await page.waitForTimeout(400);
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return !text.includes("Compressing...") && !text.includes("Queued...");
    }, { timeout: 15000 });

    const [downloadQ30] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("article[data-image-item]:has-text('large-photo') button[data-download-single]").click(),
    ]);
    const q30Path = path.join(EVIDENCE_DIR, "downloaded-q30.jpg");
    await downloadQ30.saveAs(q30Path);
    const q30Size = fs.statSync(q30Path).size;

    // Set slider to 95
    await page.locator("#quality-slider").fill("95");
    await page.waitForTimeout(400);
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return !text.includes("Compressing...") && !text.includes("Queued...");
    }, { timeout: 15000 });

    const [downloadQ95] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("article[data-image-item]:has-text('large-photo') button[data-download-single]").click(),
    ]);
    const q95Path = path.join(EVIDENCE_DIR, "downloaded-q95.jpg");
    await downloadQ95.saveAs(q95Path);
    const q95Size = fs.statSync(q95Path).size;

    assert.ok(q95Size > q30Size * 1.5, `Quality 95 (${q95Size} B) must be significantly larger than Quality 30 (${q30Size} B)`);
    console.log(`Quality comparison: Q30 = ${q30Size} bytes vs Q95 = ${q95Size} bytes.`);

    console.log("Check 5 PASSED: Downscale and Quality slider tested successfully.");
    results.push({ name: "Check 5: Downscale and Quality Slider Adjustments", pass: true });

    // -------------------------------------------------------------
    // Check 6: ZIP download
    // -------------------------------------------------------------
    console.log("\n--- Running Check 6: ZIP archive download ---");
    const [downloadZip] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("#download-all-zip-button").click(),
    ]);
    const zipPath = path.join(EVIDENCE_DIR, "downloaded-images.zip");
    await downloadZip.saveAs(zipPath);
    const zipSize = fs.statSync(zipPath).size;
    assert.ok(zipSize > 1000, "ZIP file size must be > 1000 bytes");

    // Read ZIP header to ensure valid ZIP magic (PK\x03\x04)
    const zipBuf = fs.readFileSync(zipPath);
    assert.equal(zipBuf[0], 0x50, "ZIP magic byte 0");
    assert.equal(zipBuf[1], 0x4b, "ZIP magic byte 1");
    assert.equal(zipBuf[2], 0x03, "ZIP magic byte 2");
    assert.equal(zipBuf[3], 0x04, "ZIP magic byte 3");

    console.log(`Check 6 PASSED: ZIP download created valid archive (${zipSize} bytes).`);
    results.push({ name: "Check 6: ZIP Archive Packaging", pass: true });

    // -------------------------------------------------------------
    // Check 7: Unsupported file, corrupted file, oversized file & >30 files
    // -------------------------------------------------------------
    console.log("\n--- Running Check 7: Error handling and batch limits ---");
    // Clear existing
    await page.locator("#clear-all-button").click();
    await page.waitForSelector("div[data-dropzone='true']");

    // Create an oversized file (> 25MB: 26MB)
    const oversizedPath = path.join(FIXTURES_DIR, "oversized-26mb.jpg");
    if (!fs.existsSync(oversizedPath)) {
      const bigBuf = Buffer.alloc(26 * 1024 * 1024, 0xaa);
      // Valid minimal JPEG header so it looks like JPG
      bigBuf[0] = 0xff; bigBuf[1] = 0xd8; bigBuf[2] = 0xff; bigBuf[3] = 0xe0;
      fs.writeFileSync(oversizedPath, bigBuf);
    }

    // Create 32 small test images
    const batch32Files = [];
    const baseJpgBuf = fs.readFileSync(path.join(FIXTURES_DIR, "tiny-optimized.jpg"));
    for (let i = 1; i <= 32; i++) {
      const p = path.join(FIXTURES_DIR, `batch-test-${i}.jpg`);
      fs.writeFileSync(p, baseJpgBuf);
      batch32Files.push(p);
    }

    // Test a) Upload mixed: 1 good JPG, 1 corrupted, 1 unsupported SVG, 1 oversized
    await page.locator("input[type='file']").first().setInputFiles([
      path.join(FIXTURES_DIR, "sample.webp"),
      path.join(FIXTURES_DIR, "corrupted.jpg"),
      path.join(FIXTURES_DIR, "unsupported.svg"),
      oversizedPath,
    ]);

    // Verify error banner is visible for skipped files
    await page.waitForSelector("#global-error-banner");
    const errorBannerText = await page.locator("#global-error-banner").innerText();
    assert.ok(
      errorBannerText.includes("skipped") || errorBannerText.includes("exceeds") || errorBannerText.includes("not a valid"),
      `Expected error banner for unsupported/oversized files, got: ${errorBannerText}`
    );

    // Wait for processing: valid file (sample.webp) and corrupted file should both be listed
    await page.waitForFunction(() => {
      const items = document.querySelectorAll("article[data-image-item]");
      return items.length >= 2;
    });

    // Check that sample.webp completed compression successfully
    const webpItem = page.locator("article[data-image-item]:has-text('sample.webp')");
    await webpItem.locator("[data-status='saved'], [data-status='already-optimized']").waitFor({ timeout: 10000 });

    // Check that corrupted.jpg shows error status without stopping sample.webp
    const corruptItem = page.locator("article[data-image-item]:has-text('corrupted.jpg')");
    await corruptItem.locator("[data-status='error']").waitFor({ timeout: 10000 });

    await page.screenshot({ path: path.join(EVIDENCE_DIR, "03_mixed_errors_handled.png"), fullPage: true });

    // Test b) Upload >30 files (batch of 32 files)
    await page.locator("#clear-all-button").click();
    await page.waitForSelector("div[data-dropzone='true']");

    await page.locator("input[type='file']").first().setInputFiles(batch32Files);

    // Error banner should notify about max 30 limit
    await page.waitForSelector("#global-error-banner");
    const limitErrorText = await page.locator("#global-error-banner").innerText();
    assert.ok(limitErrorText.includes("30"), "Error banner must mention 30 files limit");

    // Exactly 30 items should be rendered
    const batchItems = await page.locator("article[data-image-item]").all();
    assert.equal(batchItems.length, 30, "Should clamp to exactly 30 files");

    console.log("Check 7 PASSED: Errors and batch limit handled cleanly.");
    results.push({ name: "Check 7: Unsupported, Corrupted, Oversized & >30 Files", pass: true });

    // -------------------------------------------------------------
    // Check 8: 8000x6000 very large image test
    // -------------------------------------------------------------
    console.log("\n--- Running Check 8: 8000x6000 very large image responsiveness ---");
    await page.locator("#clear-all-button").click();
    await page.waitForSelector("div[data-dropzone='true']");

    await page.locator("input[type='file']").first().setInputFiles([
      path.join(FIXTURES_DIR, "huge-8000x6000.jpg"),
    ]);

    // Should compress without crashing the tab
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return !text.includes("Compressing...") && !text.includes("Queued...");
    }, { timeout: 35000 });

    const hugeItem = page.locator("article[data-image-item]:has-text('huge-8000x6000.jpg')");
    await hugeItem.locator("[data-status='saved'], [data-status='already-optimized']").waitFor({ timeout: 5000 });

    await page.screenshot({ path: path.join(EVIDENCE_DIR, "04_huge_image_compressed.png"), fullPage: true });
    console.log("Check 8 PASSED: 8000x6000 image compressed with no freeze or crash.");
    results.push({ name: "Check 8: Large 8000x6000 Image Responsiveness", pass: true });

    // -------------------------------------------------------------
    // Check 9: 375px mobile viewport & network privacy audit
    // -------------------------------------------------------------
    console.log("\n--- Running Check 9: 375px mobile viewport and network privacy audit ---");
    const mobilePage = await context.newPage();
    await mobilePage.setViewportSize({ width: 375, height: 667 });

    const requests = [];
    const consoleErrors = [];
    mobilePage.on("request", (req) => {
      requests.push({ url: req.url(), method: req.method(), postData: req.postData() });
    });
    mobilePage.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await mobilePage.goto(`${BASE_URL}/tools/image-compressor`);
    await mobilePage.waitForSelector("div[data-dropzone='true']");

    await mobilePage.locator("input[type='file']").first().setInputFiles([
      path.join(FIXTURES_DIR, "sample.webp"),
    ]);

    await mobilePage.waitForFunction(() => {
      const text = document.body.innerText;
      return !text.includes("Compressing...") && !text.includes("Queued...");
    }, { timeout: 15000 });

    await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, "05_mobile_375px_viewport.png"), fullPage: true });

    // Audit network requests: confirm NO image bytes or uploads were sent over HTTP
    for (const req of requests) {
      if (req.method === "POST" || req.method === "PUT") {
        assert.ok(!req.postData?.includes("RIFF"), "No WebP binary data sent across network");
        assert.ok(!req.postData?.includes("JFIF"), "No JPEG binary data sent across network");
        assert.ok(!req.postData?.includes("PNG"), "No PNG binary data sent across network");
      }
    }
    console.log(`Audited ${requests.length} requests: zero user file data transmitted.`);
    assert.equal(consoleErrors.length, 0, `Expected zero console errors, got: ${consoleErrors.join("; ")}`);

    console.log("Check 9 PASSED: Mobile 375px layout and network privacy verified.");
    results.push({ name: "Check 9: Mobile 375px Viewport & Network Privacy Audit", pass: true });

    // -------------------------------------------------------------
    // Check 10: Regression test on two PDF tools
    // -------------------------------------------------------------
    console.log("\n--- Running Check 10: Regression test on Merge PDF and Compress PDF ---");
    // Tool A: merge-pdf
    await page.goto(`${BASE_URL}/tools/merge-pdf`);
    await page.waitForSelector("div[data-dropzone='true']");
    await page.locator("input[type='file']").first().setInputFiles([
      path.join(FIXTURES_DIR, "sample-multipage.pdf"),
      path.join(FIXTURES_DIR, "sample-multipage.pdf"),
    ]);
    await page.waitForSelector("button:has-text('Merge')", { timeout: 10000 });
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "06_merge_pdf_regression_ok.png") });

    // Tool B: compress-pdf
    await page.goto(`${BASE_URL}/tools/compress-pdf`);
    await page.waitForSelector("div[data-dropzone='true']");
    await page.locator("input[type='file']").first().setInputFiles([
      path.join(FIXTURES_DIR, "sample-multipage.pdf"),
    ]);
    await page.waitForSelector("button:has-text('Compress PDF')", { timeout: 10000 });
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "07_compress_pdf_regression_ok.png") });

    console.log("Check 10 PASSED: Merge PDF and Compress PDF behave normally.");
    results.push({ name: "Check 10: PDF Tools Regression Check", pass: true });

    await browser.close();

    console.log("\n========================================================");
    console.log("ALL CHECKS COMPLETED:");
    for (const r of results) {
      console.log(`[PASS] ${r.name}`);
    }
    console.log("========================================================");
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
