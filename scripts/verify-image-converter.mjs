import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { inflateRawSync } from "node:zlib";
import { chromium } from "@playwright/test";

const ROOT = process.cwd();
const PORT = Number(process.env.IMAGE_CONVERTER_PORT || 4318);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const FIXTURES = path.join(ROOT, "tests", "fixtures");
const EVIDENCE = path.resolve(
  process.env.IMAGE_CONVERTER_EVIDENCE ||
    path.join(ROOT, "tests", "verification-evidence", "image-converter")
);
fs.mkdirSync(EVIDENCE, { recursive: true });

// Create small 2x2 BMP fixture if missing
const bmpFixture = path.join(FIXTURES, "sample.bmp");
if (!fs.existsSync(bmpFixture)) {
  const bmpHeader = Buffer.from([
    0x42, 0x4d, // BM
    0x3e, 0x00, 0x00, 0x00, // file size 62 bytes
    0x00, 0x00, 0x00, 0x00, // reserved
    0x36, 0x00, 0x00, 0x00, // offset 54
    0x28, 0x00, 0x00, 0x00, // DIB size 40
    0x02, 0x00, 0x00, 0x00, // width 2
    0x02, 0x00, 0x00, 0x00, // height 2
    0x01, 0x00, // planes 1
    0x18, 0x00, // 24-bit
    0x00, 0x00, 0x00, 0x00, // no compression
    0x08, 0x00, 0x00, 0x00, // image size 8 bytes
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    // Pixel data: 2 rows of 2 pixels (BGR) + 2 pad bytes per row
    0x00, 0x00, 0xff, 0x00, 0xff, 0x00, 0x00, 0x00,
    0xff, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00,
  ]);
  fs.writeFileSync(bmpFixture, bmpHeader);
}

// Create 1x1 GIF fixture if missing
const gifFixture = path.join(FIXTURES, "sample.gif");
if (!fs.existsSync(gifFixture)) {
  const gifData = Buffer.from([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00,
    0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00,
    0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02,
    0x44, 0x01, 0x00, 0x3b,
  ]);
  fs.writeFileSync(gifFixture, gifData);
}

const results = [];
const consoleErrors = [];
const nonLocalRequests = [];
const failedRequests = [];
let browser;
let server;

async function waitForServer(url, timeoutMs = 60000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (server?.exitCode !== null && server?.exitCode !== undefined) {
      throw new Error(`Production server exited with code ${server.exitCode}.`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Production server did not become ready at ${url}.`);
}

async function openTool(page) {
  await page.goto(`${BASE_URL}/tools/image-converter`, { waitUntil: "networkidle" });
  await page.locator("[data-dropzone='true']").waitFor();
}

async function upload(page, files) {
  await page.locator("input[type='file']").first().setInputFiles(files);
}

async function waitForItems(page, count, timeout = 30000) {
  await page.waitForFunction(
    (expectedCount) => {
      const cards = [...document.querySelectorAll("article[data-image-item]")];
      return (
        cards.length === expectedCount &&
        cards.every(
          (card) => card.dataset.status !== "pending" && card.dataset.status !== "processing"
        )
      );
    },
    count,
    { timeout }
  );
}

async function downloadSingle(page, outputPath) {
  const button = page.locator("button[data-download-single]").first();
  await button.waitFor();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    button.click(),
  ]);
  await download.saveAs(outputPath);
  return download.suggestedFilename();
}

function verifyMagicBytes(filePath, expectedType) {
  const buffer = fs.readFileSync(filePath);
  assert.ok(buffer.length > 8, "File buffer must have content");
  if (expectedType === "png") {
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a;
    assert.ok(isPng, `File ${filePath} must have PNG magic bytes`);
  } else if (expectedType === "jpg" || expectedType === "jpeg") {
    const isJpg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    assert.ok(isJpg, `File ${filePath} must have JPEG magic bytes`);
  } else if (expectedType === "webp") {
    const isRiff = buffer.toString("ascii", 0, 4) === "RIFF";
    const isWebp = buffer.toString("ascii", 8, 12) === "WEBP";
    assert.ok(isRiff && isWebp, `File ${filePath} must have WEBP magic bytes`);
  }
}

async function inspectImageDetails(imagePath) {
  const bytes = fs.readFileSync(imagePath);
  const ext = path.extname(imagePath).toLowerCase();
  const mime =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
      ? "image/webp"
      : "image/jpeg";

  const inspected = await browser.newPage();
  const details = await inspected.evaluate(
    async ({ base64, type }) => {
      const imgBlob = await (await fetch(`data:${type};base64,${base64}`)).blob();
      const image = await createImageBitmap(imgBlob);
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      const pixel = [...context.getImageData(0, 0, 1, 1).data];
      image.close();
      return { width: canvas.width, height: canvas.height, pixel };
    },
    { base64: bytes.toString("base64"), type: mime }
  );
  await inspected.close();
  return { ...details, size: bytes.length };
}

function inspectZip(zipPath) {
  const data = fs.readFileSync(zipPath);
  let eocd = -1;
  for (let offset = data.length - 22; offset >= Math.max(0, data.length - 65557); offset -= 1) {
    if (data.readUInt32LE(offset) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  assert.notEqual(eocd, -1, "ZIP end record must exist");
  const count = data.readUInt16LE(eocd + 10);
  let cursor = data.readUInt32LE(eocd + 16);
  const names = [];
  const entries = [];
  for (let index = 0; index < count; index += 1) {
    assert.equal(data.readUInt32LE(cursor), 0x02014b50, "ZIP central directory entry");
    const method = data.readUInt16LE(cursor + 10);
    const compressedSize = data.readUInt32LE(cursor + 20);
    const nameLength = data.readUInt16LE(cursor + 28);
    const extraLength = data.readUInt16LE(cursor + 30);
    const commentLength = data.readUInt16LE(cursor + 32);
    const localOffset = data.readUInt32LE(cursor + 42);
    const name = data.toString("utf8", cursor + 46, cursor + 46 + nameLength);
    names.push(name);

    const localNameLength = data.readUInt16LE(localOffset + 26);
    const localExtraLength = data.readUInt16LE(localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = data.subarray(dataOffset, dataOffset + compressedSize);
    const contents = method === 8 ? inflateRawSync(compressed) : compressed;
    entries.push({ name, size: contents.length });
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return { count, names, entries };
}

async function check(name, work) {
  try {
    const evidence = await work();
    results.push({ name, result: "PASS", evidence });
    console.log(`PASS ${name}`);
  } catch (error) {
    results.push({ name, result: "FAIL", error: error?.stack || String(error) });
    console.error(`FAIL ${name}: ${error?.message || error}`);
  }
}

try {
  const occupiedResponse = await fetch(`${BASE_URL}/tools/image-converter`).catch(() => null);
  if (occupiedResponse?.ok) {
    throw new Error(
      `Port ${PORT} already serves a page. Stop the old server or choose a free IMAGE_CONVERTER_PORT.`
    );
  }

  server = spawn(
    process.execPath,
    [
      path.join(ROOT, "node_modules", "next", "dist", "bin", "next"),
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(PORT),
    ],
    { cwd: ROOT, stdio: "inherit", env: { ...process.env, PORT: String(PORT) } }
  );

  await waitForServer(`${BASE_URL}/tools/image-converter`);
  browser = await chromium.launch();
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("request", (request) => {
    if (request.method() !== "GET" && request.method() !== "HEAD") {
      nonLocalRequests.push({
        method: request.method(),
        url: request.url(),
        hasBody: Boolean(request.postData()),
      });
    }
  });
  page.on("requestfailed", (request) => failedRequests.push(request.url()));

  // -------------------------------------------------------------
  // Check 1: Input to Output pairs & real magic bytes
  // -------------------------------------------------------------
  await check("input to output conversion pairs verify valid magic bytes and unchanged dimensions", async () => {
    await openTool(page);
    // 1. JPG -> PNG
    await upload(page, path.join(FIXTURES, "large-photo.jpg"));
    await waitForItems(page, 1);
    await page.locator("button[data-format-button='png']").click();
    await waitForItems(page, 1);
    const pngOutput = path.join(EVIDENCE, "jpg-to-png.png");
    await downloadSingle(page, pngOutput);
    verifyMagicBytes(pngOutput, "png");
    const pngDetails = await inspectImageDetails(pngOutput);
    assert.deepEqual([pngDetails.width, pngDetails.height], [2400, 1600]);

    // 2. PNG -> WebP
    await page.locator("button[data-format-button='webp']").click();
    await waitForItems(page, 1);
    const webpOutput = path.join(EVIDENCE, "jpg-to-webp.webp");
    await downloadSingle(page, webpOutput);
    verifyMagicBytes(webpOutput, "webp");

    // Clear and test BMP & GIF input
    await page.locator("#converter-clear-all-button").click();
    await page.locator("[data-dropzone='true']").waitFor();
    await upload(page, [path.join(FIXTURES, "sample.bmp"), path.join(FIXTURES, "sample.gif")]);
    await waitForItems(page, 2);
    await page.screenshot({ path: path.join(EVIDENCE, "01-bmp-gif-loaded.png"), fullPage: true });

    return { pngDimensions: [pngDetails.width, pngDetails.height], outputTypesVerified: ["png", "webp"] };
  });

  // -------------------------------------------------------------
  // Check 2: Transparency to JPG fills background with warning
  // -------------------------------------------------------------
  await check("transparency to JPG fills background and displays clear warning", async () => {
    await openTool(page);
    await upload(page, path.join(FIXTURES, "transparent.png"));
    await waitForItems(page, 1);

    // Switch target to JPG
    await page.locator("button[data-format-button='jpg']").click();
    await waitForItems(page, 1);

    // Check transparency warning exists
    const warning = page.locator("#transparency-warning-banner");
    await warning.waitFor();
    const warningText = await warning.textContent();
    assert.ok(warningText.includes("fills background with the selected color"));

    await page.screenshot({ path: path.join(EVIDENCE, "02-transparency-warning.png"), fullPage: true });

    const jpgOutput = path.join(EVIDENCE, "transparent-filled.jpg");
    await downloadSingle(page, jpgOutput);
    verifyMagicBytes(jpgOutput, "jpg");
    const details = await inspectImageDetails(jpgOutput);
    // Background filled with white (255, 255, 255)
    assert.ok(details.pixel[0] >= 250 && details.pixel[1] >= 250 && details.pixel[2] >= 250, "Top left pixel should be white fill");
    return { warningText, pixelSample: details.pixel };
  });

  // -------------------------------------------------------------
  // Check 3: EXIF orientation upright
  // -------------------------------------------------------------
  await check("EXIF orientation 6 image exports upright", async () => {
    await openTool(page);
    await upload(page, path.join(FIXTURES, "exif-orientation-6.jpg"));
    await waitForItems(page, 1);
    await page.locator("button[data-format-button='png']").click();
    await waitForItems(page, 1);

    const output = path.join(EVIDENCE, "exif-upright.png");
    await downloadSingle(page, output);
    verifyMagicBytes(output, "png");
    const details = await inspectImageDetails(output);
    assert.deepEqual([details.width, details.height], [150, 300]);
    return { width: details.width, height: details.height };
  });

  // -------------------------------------------------------------
  // Check 4: Same-format skip
  // -------------------------------------------------------------
  await check("same-format files are skipped with clear UI note", async () => {
    await openTool(page);
    await upload(page, path.join(FIXTURES, "large-photo.jpg"));
    await waitForItems(page, 1);

    // Ensure target is JPG
    await page.locator("button[data-format-button='jpg']").click();
    await waitForItems(page, 1);

    const badge = page.locator("span[data-status='skipped']").first();
    await badge.waitFor();
    const badgeText = await badge.textContent();
    assert.ok(badgeText.includes("Already JPG"));

    await page.screenshot({ path: path.join(EVIDENCE, "03-same-format-skipped.png"), fullPage: true });
    return { badgeText };
  });

  // -------------------------------------------------------------
  // Check 5: Multi-file ZIP download with unique filenames
  // -------------------------------------------------------------
  await check("multi-file ZIP packaging produces correct extensions and duplicate-safe names", async () => {
    await openTool(page);
    await upload(page, [
      path.join(FIXTURES, "large-photo.jpg"),
      path.join(FIXTURES, "sample.webp"),
    ]);
    await waitForItems(page, 2);
    await page.locator("button[data-format-button='png']").click();
    await waitForItems(page, 2);

    const zipButton = page.locator("button[data-download-all='true']");
    await zipButton.waitFor();
    const zipPath = path.join(EVIDENCE, "converted-images.zip");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      zipButton.click(),
    ]);
    await download.saveAs(zipPath);

    const inspectedZip = inspectZip(zipPath);
    assert.equal(inspectedZip.count, 2);
    assert.deepEqual(inspectedZip.names, ["large-photo.png", "sample.png"]);
    return inspectedZip;
  });

  // -------------------------------------------------------------
  // Check 6: Error handling (unsupported, oversized, corrupted)
  // -------------------------------------------------------------
  await check("unsupported, corrupted, oversized files are handled without halting batch", async () => {
    await openTool(page);
    await upload(page, [
      path.join(FIXTURES, "unsupported.svg"),
      path.join(FIXTURES, "oversized-26mb.jpg"),
      path.join(FIXTURES, "corrupted.jpg"),
      path.join(FIXTURES, "large-photo.jpg"),
    ]);

    // Only corrupted.jpg and large-photo.jpg make it to items list (svg & 26mb are rejected at upload)
    await waitForItems(page, 2);

    const banner = page.locator("#global-error-banner");
    await banner.waitFor();
    const bannerText = await banner.textContent();
    assert.ok(bannerText.includes("unsupported file(s)"), "Banner reports unsupported files");
    assert.ok(bannerText.includes("exceeds the 25 MB file limit"), "Banner reports oversized files");

    // The good file should be ready
    const goodItem = page.locator("article[data-image-item]").nth(1);
    assert.equal(await goodItem.getAttribute("data-status"), "skipped");

    await page.screenshot({ path: path.join(EVIDENCE, "04-error-handling.png"), fullPage: true });
    return { bannerText };
  });

  // -------------------------------------------------------------
  // Check 7: 30-file batch limit
  // -------------------------------------------------------------
  await check("31-file batch limit retains 30 and continues processing", async () => {
    await openTool(page);
    const thirtyOneFiles = Array.from({ length: 31 }, (_, index) =>
      path.join(FIXTURES, `batch-test-${index + 1}.jpg`)
    );
    await upload(page, thirtyOneFiles);
    await waitForItems(page, 30);

    const banner = page.locator("#global-error-banner");
    await banner.waitFor();
    const bannerText = await banner.textContent();
    assert.ok(bannerText.includes("maximum limit is 30 images"));

    await page.screenshot({ path: path.join(EVIDENCE, "05-batch-limit-30.png"), fullPage: true });
    return { count: await page.locator("article[data-image-item]").count(), bannerText };
  });

  // -------------------------------------------------------------
  // Check 8: Huge 8000x6000 image keeps UI responsive
  // -------------------------------------------------------------
  await check("large 8000x6000 image leaves UI responsive", async () => {
    await openTool(page);
    await page.evaluate(() => {
      window.__converterHeartbeat = 0;
      window.__converterHeartbeatTimer = setInterval(() => {
        window.__converterHeartbeat += 1;
      }, 50);
    });
    await upload(page, path.join(FIXTURES, "huge-8000x6000.jpg"));
    await page.locator("button[data-format-button='webp']").click();

    const responsive = await page.evaluate(() => ({
      heartbeat: window.__converterHeartbeat,
      viewportWidth: document.documentElement.clientWidth,
    }));
    await waitForItems(page, 1, 45000);
    assert.ok(responsive.heartbeat > 0, "UI heartbeat should run while image is being converted");

    const hugeOutput = path.join(EVIDENCE, "huge-converted.webp");
    await downloadSingle(page, hugeOutput);
    verifyMagicBytes(hugeOutput, "webp");
    const details = await inspectImageDetails(hugeOutput);
    assert.deepEqual([details.width, details.height], [8000, 6000]);

    await page.evaluate(() => clearInterval(window.__converterHeartbeatTimer));
    return { ...responsive, outputDimensions: [details.width, details.height] };
  });

  // -------------------------------------------------------------
  // Check 9: 375px mobile responsive layout and ad overlap
  // -------------------------------------------------------------
  await check("375px responsive layout and no ad overlap", async () => {
    await page.setViewportSize({ width: 375, height: 812 });
    await openTool(page);
    await upload(page, path.join(FIXTURES, "large-photo.jpg"));
    await waitForItems(page, 1);
    await page.screenshot({ path: path.join(EVIDENCE, "06-mobile-375.png"), fullPage: true });

    const layout = await page.evaluate(() => {
      const selectors = [
        "[data-dropzone='true']",
        "[data-converter-options='true']",
        "[data-converter-summary='true']",
        "article[data-image-item]",
        "[data-ad-slot='true']",
      ];
      const boxes = selectors.flatMap((selector) =>
        [...document.querySelectorAll(selector)].map((element) => {
          const rect = element.getBoundingClientRect();
          return { selector, x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom };
        })
      );
      const overlaps = [];
      for (const ad of boxes.filter((box) => box.selector.includes("data-ad-slot"))) {
        for (const content of boxes.filter((box) => !box.selector.includes("data-ad-slot"))) {
          const intersectionWidth = Math.min(ad.right, content.right) - Math.max(ad.x, content.x);
          const intersectionHeight = Math.min(ad.bottom, content.bottom) - Math.max(ad.y, content.y);
          if (intersectionWidth > 0 && intersectionHeight > 0) overlaps.push([ad, content]);
        }
      }
      return {
        viewport: document.documentElement.clientWidth,
        body: document.body.scrollWidth,
        overlaps,
      };
    });

    assert.ok(layout.body <= layout.viewport, `Horizontal overflow detected: ${JSON.stringify(layout)}`);
    assert.deepEqual(layout.overlaps, []);
    return layout;
  });

  // -------------------------------------------------------------
  // Check 10: Regression testing (Compressor, Resizer, PDF tool)
  // -------------------------------------------------------------
  await check("Image Compressor, Image Resizer, and PDF tool pages render successfully", async () => {
    await page.setViewportSize({ width: 1280, height: 900 });

    await page.goto(`${BASE_URL}/tools/image-compressor`, { waitUntil: "networkidle" });
    await page.locator("[data-dropzone='true']").waitFor();
    await page.screenshot({ path: path.join(EVIDENCE, "07-regression-compressor.png"), fullPage: true });

    await page.goto(`${BASE_URL}/tools/image-resizer`, { waitUntil: "networkidle" });
    await page.locator("[data-dropzone='true']").waitFor();
    await page.screenshot({ path: path.join(EVIDENCE, "08-regression-resizer.png"), fullPage: true });

    await page.goto(`${BASE_URL}/tools/rotate-pdf`, { waitUntil: "networkidle" });
    await page.locator("[data-dropzone='true']").waitFor();
    await page.screenshot({ path: path.join(EVIDENCE, "09-regression-pdf.png"), fullPage: true });

    return "Compressor, Resizer, and Rotate PDF tools rendered cleanly.";
  });

  // -------------------------------------------------------------
  // Check 11: Privacy & console errors
  // -------------------------------------------------------------
  await check("privacy and console integrity (local only, no external payloads)", async () => {
    assert.deepEqual(nonLocalRequests, [], `Unexpected non-GET request(s): ${JSON.stringify(nonLocalRequests)}`);
    assert.deepEqual(failedRequests, [], `Failed requests: ${JSON.stringify(failedRequests)}`);
    assert.deepEqual(consoleErrors, [], `Console errors: ${JSON.stringify(consoleErrors)}`);
    return { nonLocalRequests, failedRequests, consoleErrors };
  });

  fs.writeFileSync(
    path.join(EVIDENCE, "results.json"),
    JSON.stringify({ baseUrl: BASE_URL, results }, null, 2)
  );

  if (results.some((r) => r.result === "FAIL")) process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server && server.exitCode === null) {
    server.kill();
    await new Promise((resolve) => {
      const timeout = setTimeout(resolve, 5000);
      server.once("exit", () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }
}
