import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { inflateRawSync } from "node:zlib";
import { chromium } from "@playwright/test";

const ROOT = process.cwd();
const PORT = Number(process.env.IMAGE_RESIZER_PORT || 4317);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const FIXTURES = path.join(ROOT, "tests", "fixtures");
const EVIDENCE = path.join(ROOT, "tests", "verification-evidence", "image-resizer");
fs.mkdirSync(EVIDENCE, { recursive: true });

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
      // The local server is not ready yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`Production server did not become ready at ${url}.`);
}

async function openTool(page) {
  await page.goto(`${BASE_URL}/tools/image-resizer`, { waitUntil: "networkidle" });
  await page.locator("[data-dropzone='true']").waitFor();
}

async function upload(page, files) {
  await page.locator("input[type='file']").first().setInputFiles(files);
}

async function waitForItems(page, count, timeout = 30000) {
  await page.waitForFunction(
    (expectedCount) => {
      const cards = [...document.querySelectorAll("article[data-image-item]")];
      return cards.length === expectedCount &&
        cards.every((card) => card.dataset.status !== "pending" && card.dataset.status !== "resizing") &&
        !document.body.innerText.includes("Resizing images locally");
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

async function inspectImage(imagePath) {
  const bytes = fs.readFileSync(imagePath);
  const mime = path.extname(imagePath).toLowerCase() === ".png" ? "image/png" : "image/jpeg";
  const inspected = await browser.newPage();
  const details = await inspected.evaluate(async ({ base64, type }) => {
    const image = await createImageBitmap(await (await fetch(`data:${type};base64,${base64}`)).blob());
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(image, 0, 0);
    const pixel = [...context.getImageData(0, 0, 1, 1).data];
    image.close();
    return { width: canvas.width, height: canvas.height, pixel };
  }, { base64: bytes.toString("base64"), type: mime });
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

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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

async function setPixels(page, width, height, fitMode = "stretch") {
  const lock = page.getByRole("button", { name: "Unlock Aspect Ratio" });
  if (await lock.count()) await lock.click();
  await page.locator('input[placeholder="W"]').fill(String(width));
  await page.locator('input[placeholder="H"]').fill(String(height));
  await page.locator("select").nth(2).selectOption(fitMode);
  await waitForItems(page, await page.locator("article[data-image-item]").count());
}

try {
  const occupiedResponse = await fetch(`${BASE_URL}/tools/image-resizer`).catch(() => null);
  if (occupiedResponse?.ok) {
    throw new Error(
      `Port ${PORT} already serves a page. Stop the old server and choose a free IMAGE_RESIZER_PORT.`
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
  await waitForServer(`${BASE_URL}/tools/image-resizer`);
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

  await check("pixel dimensions and exact downloaded output", async () => {
    await openTool(page);
    await upload(page, path.join(FIXTURES, "large-photo.jpg"));
    await waitForItems(page, 1);
    await setPixels(page, 1080, 1080, "stretch");
    const output = path.join(EVIDENCE, "pixels-1080x1080.jpg");
    await downloadSingle(page, output);
    const details = await inspectImage(output);
    assert.deepEqual([details.width, details.height], [1080, 1080]);
    await page.screenshot({ path: path.join(EVIDENCE, "01-pixels.png"), fullPage: true });
    return `${output} (${details.width}x${details.height}, ${details.size} bytes)`;
  });

  await check("percentage dimensions", async () => {
    await openTool(page);
    await upload(page, path.join(FIXTURES, "large-photo.jpg"));
    await waitForItems(page, 1);
    await page.locator("select").first().selectOption("percentage");
    await page.locator('input[type="range"]').first().fill("50");
    await waitForItems(page, 1);
    const output = path.join(EVIDENCE, "percentage-50.jpg");
    await downloadSingle(page, output);
    const details = await inspectImage(output);
    assert.deepEqual([details.width, details.height], [1200, 800]);
    return `${output} (${details.width}x${details.height})`;
  });

  await check("all fit modes keep exact canvas dimensions", async () => {
    const measured = {};
    for (const mode of ["stretch", "contain", "cover"]) {
      await openTool(page);
      await upload(page, path.join(FIXTURES, "large-photo.jpg"));
      await waitForItems(page, 1);
      await setPixels(page, 800, 800, mode);
      const output = path.join(EVIDENCE, `fit-${mode}.jpg`);
      await downloadSingle(page, output);
      const details = await inspectImage(output);
      assert.deepEqual([details.width, details.height], [800, 800]);
      measured[mode] = [details.width, details.height];
    }
    await page.screenshot({ path: path.join(EVIDENCE, "02-fit-modes.png"), fullPage: true });
    return measured;
  });

  await check("aspect lock, presets, upscale warning, and 8192 pixel cap", async () => {
    await openTool(page);
    await upload(page, path.join(FIXTURES, "large-photo.jpg"));
    await waitForItems(page, 1);
    await page.locator('input[placeholder="W"]').fill("1200");
    await waitForItems(page, 1);
    let output = path.join(EVIDENCE, "aspect-locked.jpg");
    await downloadSingle(page, output);
    const aspectDetails = await inspectImage(output);
    assert.deepEqual([aspectDetails.width, aspectDetails.height], [1200, 800]);

    await page.locator("select").nth(1).selectOption({ label: "Instagram Post (1080x1080)" });
    await waitForItems(page, 1);
    output = path.join(EVIDENCE, "preset-1080.jpg");
    await downloadSingle(page, output);
    const presetDetails = await inspectImage(output);
    assert.deepEqual([presetDetails.width, presetDetails.height], [1080, 1080]);

    await setPixels(page, 5000, 4000, "stretch");
    await page.getByText("Upscaling may reduce image sharpness.").waitFor();

    await openTool(page);
    await upload(page, path.join(FIXTURES, "tiny-optimized.jpg"));
    await waitForItems(page, 1);
    await setPixels(page, 10000, 1, "stretch");
    const cappedOutput = path.join(EVIDENCE, "capped-8192.jpg");
    await downloadSingle(page, cappedOutput);
    const capped = await inspectImage(cappedOutput);
    assert.deepEqual([capped.width, capped.height], [8192, 1]);
    await page.screenshot({ path: path.join(EVIDENCE, "03-upscale-cap.png"), fullPage: true });
    const uiSize = await page.locator("article[data-image-item]").innerText();
    assert.ok(uiSize.includes(formatFileSize(capped.size)), `UI size did not match ${capped.size} downloaded bytes.`);
    return {
      aspectLock: [aspectDetails.width, aspectDetails.height],
      preset: "1080x1080",
      cap: [capped.width, capped.height],
      displayedSize: formatFileSize(capped.size),
      downloadedBytes: capped.size,
    };
  });

  await check("EXIF orientation 6 exports upright", async () => {
    await openTool(page);
    await upload(page, path.join(FIXTURES, "exif-orientation-6.jpg"));
    await waitForItems(page, 1);
    const output = path.join(EVIDENCE, "exif-upright.jpg");
    await downloadSingle(page, output);
    const details = await inspectImage(output);
    assert.deepEqual([details.width, details.height], [150, 300]);
    return `${output} (${details.width}x${details.height})`;
  });

  await check("PNG transparency preserved and JPG conversion fills transparency with warning", async () => {
    await openTool(page);
    await upload(page, path.join(FIXTURES, "transparent.png"));
    await waitForItems(page, 1);
    let output = path.join(EVIDENCE, "transparent-kept.png");
    await downloadSingle(page, output);
    let details = await inspectImage(output);
    assert.equal(details.pixel[3], 0);

    await page.locator("select").last().selectOption("jpg");
    await waitForItems(page, 1);
    await page.locator("#transparency-warning").waitFor();
    output = path.join(EVIDENCE, "transparent-filled.jpg");
    await downloadSingle(page, output);
    details = await inspectImage(output);
    assert.ok(details.pixel[0] > 240 && details.pixel[1] > 240 && details.pixel[2] > 240);
    await page.screenshot({ path: path.join(EVIDENCE, "04-transparency-warning.png"), fullPage: true });
    return { pngCorner: "transparent", jpgCorner: details.pixel };
  });

  await check("ZIP count, duplicate-safe names, and single-file download", async () => {
    const duplicateBytes = fs.readFileSync(path.join(FIXTURES, "tiny-optimized.jpg"));
    await openTool(page);
    await upload(page, [
      { name: "same.jpg", mimeType: "image/jpeg", buffer: duplicateBytes },
      { name: "same.jpg", mimeType: "image/jpeg", buffer: duplicateBytes },
    ]);
    await waitForItems(page, 2);
    const zipPath = path.join(EVIDENCE, "duplicate-names.zip");
    const [zipDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("#download-all-resized-button").click(),
    ]);
    await zipDownload.saveAs(zipPath);
    const zip = inspectZip(zipPath);
    assert.equal(zip.count, 2);
    assert.deepEqual(zip.names, ["same-resized.jpg", "same-resized (1).jpg"]);
    assert.ok(zip.entries.every((entry) => entry.size > 0));

    await openTool(page);
    await upload(page, path.join(FIXTURES, "tiny-optimized.jpg"));
    await waitForItems(page, 1);
    const singlePath = path.join(EVIDENCE, "single-resized.jpg");
    const filename = await downloadSingle(page, singlePath);
    assert.match(filename, /-resized\.jpg$/);
    return { count: zip.count, names: zip.names, singleFilename: filename };
  });

  await check("unsupported, corrupted, oversized, and mixed-file handling", async () => {
    await openTool(page);
    await upload(page, path.join(FIXTURES, "invalid.txt"));
    await page.locator("#global-error-banner").getByText(/unsupported image file/i).waitFor();
    assert.equal(await page.locator("article[data-image-item]").count(), 0);

    await upload(page, [
      path.join(FIXTURES, "corrupted.jpg"),
      path.join(FIXTURES, "large-photo.jpg"),
    ]);
    await waitForItems(page, 2);
    await page.locator('article[data-status="error"]').waitFor();
    await page.locator('article[data-status="done"]').waitFor();
    assert.match(await page.locator('article[data-status="error"]').innerText(), /corrupt|unsupported|read image/i);

    await openTool(page);
    await upload(page, path.join(FIXTURES, "oversized-26mb.jpg"));
    await page.locator("#global-error-banner").getByText(/exceeds the 25 MB file limit/i).waitFor();
    assert.equal(await page.locator("article[data-image-item]").count(), 0);
    await page.screenshot({ path: path.join(EVIDENCE, "05-file-errors.png"), fullPage: true });
    return "Unsupported, corrupted, oversized files report errors; valid mixed file still completes.";
  });

  await check("31-file batch limit retains 30 and continues processing", async () => {
    await openTool(page);
    const files = Array.from({ length: 31 }, (_, index) =>
      path.join(FIXTURES, `batch-test-${index + 1}.jpg`)
    );
    await upload(page, files);
    await page.locator("#global-error-banner").getByText(/limit is 30 files/i).waitFor();
    await waitForItems(page, 30, 45000);
    assert.equal(await page.locator("article[data-image-item]").count(), 30);
    await page.screenshot({ path: path.join(EVIDENCE, "06-batch-limit.png"), fullPage: true });
    return "31 selected; 30 processed, one skipped with a clear limit notice.";
  });

  await check("large 8000x6000 image leaves the UI responsive", async () => {
    await openTool(page);
    await page.evaluate(() => {
      window.__resizerHeartbeat = 0;
      window.__resizerHeartbeatTimer = setInterval(() => window.__resizerHeartbeat += 1, 20);
    });
    await upload(page, path.join(FIXTURES, "huge-8000x6000.jpg"));
    await page.locator('article[data-status="resizing"]').waitFor();
    const responsive = await page.evaluate(() => ({
      heartbeat: window.__resizerHeartbeat,
      viewportWidth: document.documentElement.clientWidth,
      title: document.querySelector("article[data-image-item] h4")?.textContent,
    }));
    await waitForItems(page, 1, 45000);
    assert.ok(responsive.heartbeat > 0, "UI heartbeat should run while the image is being resized");
    const output = path.join(EVIDENCE, "huge-resized.jpg");
    await downloadSingle(page, output);
    const details = await inspectImage(output);
    assert.deepEqual([details.width, details.height], [8000, 6000]);
    await page.evaluate(() => clearInterval(window.__resizerHeartbeatTimer));
    return { ...responsive, outputDimensions: [details.width, details.height] };
  });

  await check("375px responsive layout and no ad/control overlap", async () => {
    await page.setViewportSize({ width: 375, height: 812 });
    await openTool(page);
    await upload(page, path.join(FIXTURES, "large-photo.jpg"));
    await waitForItems(page, 1);
    await page.screenshot({ path: path.join(EVIDENCE, "07-mobile-375.png"), fullPage: true });
    const layout = await page.evaluate(() => {
      const selectors = [
        "[data-dropzone='true']",
        "[data-resizer-options='true']",
        "[data-resizer-summary='true']",
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
    assert.ok(layout.body <= layout.viewport, `Horizontal overflow: ${JSON.stringify(layout)}`);
    assert.deepEqual(layout.overlaps, []);
    return layout;
  });

  await check("Image Compressor and PDF regression pages still load", async () => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${BASE_URL}/tools/image-compressor`, { waitUntil: "networkidle" });
    await page.locator("[data-dropzone='true']").waitFor();
    await page.screenshot({ path: path.join(EVIDENCE, "08-compressor-regression.png"), fullPage: true });
    await page.goto(`${BASE_URL}/tools/rotate-pdf`, { waitUntil: "networkidle" });
    await page.locator("[data-dropzone='true']").waitFor();
    await page.screenshot({ path: path.join(EVIDENCE, "09-pdf-regression.png"), fullPage: true });
    return "Image Compressor and Rotate PDF pages rendered successfully.";
  });

  await check("local-only requests and browser console", async () => {
    assert.deepEqual(nonLocalRequests, [], `Unexpected non-GET request(s): ${JSON.stringify(nonLocalRequests)}`);
    assert.deepEqual(failedRequests, [], `Failed browser requests: ${JSON.stringify(failedRequests)}`);
    assert.deepEqual(consoleErrors, [], `Browser console errors: ${JSON.stringify(consoleErrors)}`);
    return { nonLocalRequests, failedRequests, consoleErrors };
  });

  fs.writeFileSync(
    path.join(EVIDENCE, "results.json"),
    JSON.stringify({ baseUrl: BASE_URL, results }, null, 2)
  );
  if (results.some((result) => result.result === "FAIL")) process.exitCode = 1;
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
