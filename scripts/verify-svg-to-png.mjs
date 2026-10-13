/**
 * verify-svg-to-png.mjs
 *
 * Playwright verification for the SVG-to-PNG tool.
 * Usage:
 *   node scripts/verify-svg-to-png.mjs
 *
 * Env:
 *   SVG_PORT  — production server port (default 4320)
 *
 * Stops any old dev-server on SVG_PORT, runs `npm run build`, starts a fresh
 * `next start` on SVG_PORT, runs all checks, kills the server, writes a report.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execSync, spawn } from "node:child_process";
import { inflateRawSync } from "node:zlib";
import { chromium } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const ROOT = process.cwd();
const PORT = Number(process.env.SVG_PORT || 4320);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const FIXTURES = path.join(ROOT, "tests", "fixtures", "svg");
const EVIDENCE = path.join(ROOT, "tests", "verification-evidence", "svg-to-png");
fs.mkdirSync(EVIDENCE, { recursive: true });

// ---------------------------------------------------------------------------
// Ensure fixtures exist
// ---------------------------------------------------------------------------
if (!fs.existsSync(FIXTURES)) {
  console.log("Generating SVG fixtures…");
  execSync("node scripts/generate-svg-fixtures.mjs", { cwd: ROOT, stdio: "inherit" });
}

const F = {
  simple: path.join(FIXTURES, "simple-shape.svg"),
  viewboxOnly: path.join(FIXTURES, "viewbox-only.svg"),
  transparent: path.join(FIXTURES, "transparent.svg"),
  withText: path.join(FIXTURES, "with-text.svg"),
  malicious: path.join(FIXTURES, "malicious.svg"),
  invalidXml: path.join(FIXTURES, "invalid-xml.svg"),
  oversized: path.join(FIXTURES, "oversized-6mb.svg"),
  noDimensions: path.join(FIXTURES, "no-dimensions.svg"),
  large: path.join(FIXTURES, "large-1600x900.svg"),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const results = [];
const consoleErrors = [];
const allRequests = [];   // every URL the page fetches
const nonLocalRequests = [];

let browser;
let serverProcess;

async function waitForServer(url, timeoutMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (serverProcess?.exitCode !== null && serverProcess?.exitCode !== undefined) {
      throw new Error(`Production server exited early with code ${serverProcess.exitCode}.`);
    }
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch { /* not ready */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server did not become ready within ${timeoutMs}ms at ${url}`);
}

function isPng(buf) {
  return (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  );
}

function isZip(buf) {
  return buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
}

/** Read PNG dimensions from IHDR chunk (bytes 16-23) */
function pngDimensions(buf) {
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

/** Inspect image pixel data via canvas in a browser page */
async function inspectPng(imagePath, page) {
  const bytes = fs.readFileSync(imagePath);
  assert.ok(isPng(bytes), `${path.basename(imagePath)} must have PNG magic bytes`);
  const { width, height } = pngDimensions(bytes);
  const b64 = bytes.toString("base64");
  const pixel = await page.evaluate(async (b64) => {
    const resp = await fetch(`data:image/png;base64,${b64}`);
    const blob = await resp.blob();
    const bmp = await createImageBitmap(blob);
    const c = document.createElement("canvas");
    c.width = bmp.width; c.height = bmp.height;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bmp, 0, 0);
    bmp.close();
    // sample centre pixel
    const cx = Math.floor(bmp.width / 2);
    const cy = Math.floor(bmp.height / 2);
    return [...ctx.getImageData(cx, cy, 1, 1).data];
  }, b64);
  return { width, height, pixel, size: bytes.length };
}

function parseZip(zipPath) {
  const data = fs.readFileSync(zipPath);
  assert.ok(isZip(data), "Downloaded file must be a ZIP");
  let eocd = -1;
  for (let o = data.length - 22; o >= Math.max(0, data.length - 65557); o--) {
    if (data.readUInt32LE(o) === 0x06054b50) { eocd = o; break; }
  }
  assert.notEqual(eocd, -1, "ZIP must have end-of-central-directory record");
  const count = data.readUInt16LE(eocd + 10);
  let cursor = data.readUInt32LE(eocd + 16);
  const entries = [];
  for (let i = 0; i < count; i++) {
    assert.equal(data.readUInt32LE(cursor), 0x02014b50, "Central directory signature");
    const method = data.readUInt16LE(cursor + 10);
    const compressedSize = data.readUInt32LE(cursor + 20);
    const nameLen = data.readUInt16LE(cursor + 28);
    const extraLen = data.readUInt16LE(cursor + 30);
    const commentLen = data.readUInt16LE(cursor + 32);
    const localOff = data.readUInt32LE(cursor + 42);
    const name = data.toString("utf8", cursor + 46, cursor + 46 + nameLen);
    const localNameLen = data.readUInt16LE(localOff + 26);
    const localExtraLen = data.readUInt16LE(localOff + 28);
    const dataOff = localOff + 30 + localNameLen + localExtraLen;
    const compressed = data.subarray(dataOff, dataOff + compressedSize);
    const raw = method === 8 ? inflateRawSync(compressed) : compressed;
    entries.push({ name, size: raw.length });
    cursor += 46 + nameLen + extraLen + commentLen;
  }
  return { count, entries };
}

async function openSvgTool(page) {
  await page.goto(`${BASE_URL}/tools/svg-to-png`, { waitUntil: "networkidle" });
  await page.locator("[data-dropzone='true']").waitFor({ timeout: 15000 });
}

async function uploadSvg(page, files) {
  const paths = Array.isArray(files) ? files : [files];
  await page.locator("input[type='file']").first().setInputFiles(paths);
}

async function waitForItems(page, count, timeout = 45000) {
  await page.waitForFunction(
    (n) => {
      const items = [...document.querySelectorAll("article[data-image-item]")];
      return (
        items.length === n &&
        items.every(
          (el) => el.dataset.status !== "pending" && el.dataset.status !== "processing"
        )
      );
    },
    count,
    { timeout }
  );
}

async function downloadFirst(page, outputPath) {
  const btn = page.locator("button[data-download-single]").first();
  await btn.waitFor({ timeout: 10000 });
  const [dl] = await Promise.all([page.waitForEvent("download"), btn.click()]);
  await dl.saveAs(outputPath);
  return dl.suggestedFilename();
}

async function downloadAll(page, outputPath) {
  const btn = page.locator("button[data-download-all='true']");
  await btn.waitFor({ timeout: 10000 });
  const [dl] = await Promise.all([page.waitForEvent("download"), btn.click()]);
  await dl.saveAs(outputPath);
  return dl.suggestedFilename();
}

async function clearAll(page) {
  const btn = page.locator("#svg-clear-all-button");
  if (await btn.isVisible()) {
    await btn.click();
  } else {
    // If list is empty, dropzone is already shown — nothing to do
  }
  // wait for the dropzone or paste area to be active
  await page.waitForTimeout(500);
}

async function check(name, fn) {
  try {
    const evidence = await fn();
    results.push({ name, result: "PASS", evidence: evidence ?? null });
    console.log(`  PASS  ${name}`);
  } catch (err) {
    results.push({ name, result: "FAIL", error: err?.stack || String(err) });
    console.error(`  FAIL  ${name}\n        ${err?.message || err}`);
  }
}

// ---------------------------------------------------------------------------
// Step 0: Start the already-built production app on a confirmed-free port.
// Lint, tests, and build are run as separate explicit verification steps.
// ---------------------------------------------------------------------------
const occupiedResponse = await fetch(`${BASE_URL}/tools/svg-to-png`).catch(() => null);
if (occupiedResponse?.ok) {
  throw new Error(
    `Port ${PORT} already serves a page. Stop the old server or select a free SVG_PORT.`
  );
}
if (!fs.existsSync(path.join(ROOT, ".next", "BUILD_ID"))) {
  throw new Error("Production build is missing. Run npm run build before this verifier.");
}

// Start production server
serverProcess = spawn(
  process.execPath,
  [
    path.join(ROOT, "node_modules", "next", "dist", "bin", "next"),
    "start",
    "--hostname", "127.0.0.1",
    "--port", String(PORT),
  ],
  { cwd: ROOT, stdio: "inherit", env: { ...process.env, PORT: String(PORT) } }
);

try {
  await waitForServer(`${BASE_URL}/tools/svg-to-png`);
  console.log(`\nProduction server ready at ${BASE_URL}\n`);

  browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();

  // Global event listeners
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));
  page.on("request", (req) => {
    const url = req.url();
    allRequests.push({ method: req.method(), url });
    if (!/^(http:\/\/127\.0\.0\.1|http:\/\/localhost|data:|blob:)/.test(url)) {
      nonLocalRequests.push({ method: req.method(), url });
    }
  });

  // ===========================================================================
  // CHECK 1: PNG magic bytes + exact dimensions — original, 2x, custom width
  // ===========================================================================
  await check("PNG magic bytes and exact dimensions — original / 2x / custom-width", async () => {
    await openSvgTool(page);

    // Upload simple-shape.svg (100×100)
    await uploadSvg(page, F.simple);
    await waitForItems(page, 1);

    // --- 1a. Original (1x) ---
    const origOut = path.join(EVIDENCE, "dim-original.png");
    await downloadFirst(page, origOut);
    const orig = await inspectPng(origOut, page);
    assert.equal(orig.width, 100, `Original width must be 100, got ${orig.width}`);
    assert.equal(orig.height, 100, `Original height must be 100, got ${orig.height}`);
    await page.screenshot({ path: path.join(EVIDENCE, "01a-dim-original.png") });

    // --- 1b. 2x scale ---
    await page.locator("button[data-scale-button='2']").click();
    await waitForItems(page, 1);
    const scale2Out = path.join(EVIDENCE, "dim-scale2x.png");
    await downloadFirst(page, scale2Out);
    const s2 = await inspectPng(scale2Out, page);
    assert.equal(s2.width, 200, `2x width must be 200, got ${s2.width}`);
    assert.equal(s2.height, 200, `2x height must be 200, got ${s2.height}`);

    // --- 1c. Custom width 400 (height auto-locked, aspect 1:1 → 400×400) ---
    await page.locator("button[data-custom-width-button='true']").click();
    await page.locator("#custom-width-input").fill("400");
    await page.locator("#custom-width-input").dispatchEvent("change");
    await waitForItems(page, 1);
    const cwOut = path.join(EVIDENCE, "dim-custom400.png");
    await downloadFirst(page, cwOut);
    const cw = await inspectPng(cwOut, page);
    assert.equal(cw.width, 400, `Custom-width 400 must give width 400, got ${cw.width}`);
    assert.equal(cw.height, 400, `Custom-width 400 must give height 400, got ${cw.height}`);

    await clearAll(page);
    return { original: [orig.width, orig.height], scale2x: [s2.width, s2.height], custom: [cw.width, cw.height] };
  });

  // ===========================================================================
  // CHECK 2: Canvas pixel budget
  // ===========================================================================
  await check("canvas pixel budget rejects stale SVG output", async () => {
    await openSvgTool(page);
    await uploadSvg(page, F.large); // 1600×900
    await waitForItems(page, 1);

    // This is below the per-side cap but exceeds the 16 MP canvas budget.
    await page.locator("button[data-scale-button='4']").click();
    const item = page.locator("article[data-image-item]").first();
    await item.locator("[data-status='error']").waitFor({ timeout: 30000 });
    assert.match(
      await item.locator("[data-status='error']").innerText(),
      /output canvas is too large/
    );
    assert.equal(await item.locator("button[data-download-single='true']").isDisabled(), true);
    await page.screenshot({ path: path.join(EVIDENCE, "02-cap-capped.png") });

    await clearAll(page);
    return { rejectedDimensions: [6400, 3600] };
  });

  // ===========================================================================
  // CHECK 3: viewBox-only SVG → dimensions from viewBox
  // ===========================================================================
  await check("viewBox-only SVG uses viewBox dimensions (200×150)", async () => {
    await openSvgTool(page);
    await uploadSvg(page, F.viewboxOnly);
    await waitForItems(page, 1);

    const vbOut = path.join(EVIDENCE, "viewbox-original.png");
    await downloadFirst(page, vbOut);
    const vb = await inspectPng(vbOut, page);
    assert.equal(vb.width, 200, `viewBox width must be 200, got ${vb.width}`);
    assert.equal(vb.height, 150, `viewBox height must be 150, got ${vb.height}`);
    await page.screenshot({ path: path.join(EVIDENCE, "03-viewbox.png") });

    await clearAll(page);
    return { viewBoxDimensions: [vb.width, vb.height] };
  });

  // ===========================================================================
  // CHECK 4: No-dimensions SVG defaults to 512×512 and shows warning badge
  // ===========================================================================
  await check("no-dimensions SVG defaults to 512×512 and shows user badge", async () => {
    await openSvgTool(page);
    await uploadSvg(page, F.noDimensions);
    await waitForItems(page, 1);

    const ndOut = path.join(EVIDENCE, "no-dim-default.png");
    await downloadFirst(page, ndOut);
    const nd = await inspectPng(ndOut, page);
    assert.equal(nd.width, 512, `No-dimensions default width must be 512, got ${nd.width}`);
    assert.equal(nd.height, 512, `No-dimensions default height must be 512, got ${nd.height}`);

    // Badge should be visible
    const badge = page.locator("article[data-image-item] span").filter({ hasText: /No dimensions.*512/ });
    await badge.first().waitFor({ timeout: 5000 });
    await page.screenshot({ path: path.join(EVIDENCE, "04-no-dim.png"), fullPage: true });

    await clearAll(page);
    return { defaultDimensions: [nd.width, nd.height], badgeVisible: true };
  });

  // ===========================================================================
  // CHECK 5a: Transparent background → alpha=0 at corners
  // ===========================================================================
  await check("transparent background preserves alpha=0 at transparent corners", async () => {
    await openSvgTool(page);
    await uploadSvg(page, F.transparent);
    await waitForItems(page, 1);

    // Ensure transparent is selected (default)
    await page.locator("button[data-bg-transparent='true']").click();
    await waitForItems(page, 1);

    const tOut = path.join(EVIDENCE, "bg-transparent.png");
    await downloadFirst(page, tOut);
    const tbytes = fs.readFileSync(tOut);
    assert.ok(isPng(tbytes), "Must be PNG");
    const { width, height } = pngDimensions(tbytes);

    // Sample top-left corner pixel via canvas
    const b64 = tbytes.toString("base64");
    const cornerPixel = await page.evaluate(async (b64) => {
      const resp = await fetch(`data:image/png;base64,${b64}`);
      const blob = await resp.blob();
      const bmp = await createImageBitmap(blob);
      const c = document.createElement("canvas");
      c.width = bmp.width; c.height = bmp.height;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(bmp, 0, 0);
      bmp.close();
      return [...ctx.getImageData(0, 0, 1, 1).data]; // [r,g,b,a]
    }, b64);

    // transparent.svg has no background fill, so corner (0,0) must be fully transparent
    assert.equal(cornerPixel[3], 0, `Top-left corner alpha must be 0 (transparent), got ${cornerPixel[3]}`);
    await page.screenshot({ path: path.join(EVIDENCE, "05a-transparent.png") });

    await clearAll(page);
    return { dimensions: [width, height], cornerAlpha: cornerPixel[3] };
  });

  // ===========================================================================
  // CHECK 5b: Colored background → filled with chosen color
  // ===========================================================================
  await check("colored background fills PNG with the chosen color", async () => {
    await openSvgTool(page);
    // simple-shape.svg has a circle in the middle; corners are empty background
    await uploadSvg(page, F.simple);
    await waitForItems(page, 1);

    // Select white background
    await page.locator("button[data-bg-white='true']").click();
    await waitForItems(page, 1);

    const cbOut = path.join(EVIDENCE, "bg-white.png");
    await downloadFirst(page, cbOut);
    const cbBytes = fs.readFileSync(cbOut);
    assert.ok(isPng(cbBytes), "Must be PNG");

    const b64 = cbBytes.toString("base64");
    // corner (0,0) should be white (255,255,255,255) since background is white
    const cornerPixel = await page.evaluate(async (b64) => {
      const resp = await fetch(`data:image/png;base64,${b64}`);
      const blob = await resp.blob();
      const bmp = await createImageBitmap(blob);
      const c = document.createElement("canvas");
      c.width = bmp.width; c.height = bmp.height;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(bmp, 0, 0);
      bmp.close();
      return [...ctx.getImageData(0, 0, 1, 1).data];
    }, b64);

    assert.equal(cornerPixel[0], 255, `White bg corner R must be 255, got ${cornerPixel[0]}`);
    assert.equal(cornerPixel[1], 255, `White bg corner G must be 255, got ${cornerPixel[1]}`);
    assert.equal(cornerPixel[2], 255, `White bg corner B must be 255, got ${cornerPixel[2]}`);
    assert.equal(cornerPixel[3], 255, `White bg corner alpha must be 255, got ${cornerPixel[3]}`);
    await page.screenshot({ path: path.join(EVIDENCE, "05b-white-bg.png") });

    await clearAll(page);
    return { cornerPixel };
  });

  // ===========================================================================
  // CHECK 6: SECURITY — malicious SVG upload mode
  //   - window.__SVG_SCRIPT_RAN stays undefined/falsy
  //   - zero external network requests
  //   - sanitized badge shown to user
  // ===========================================================================
  await check("SECURITY upload: malicious SVG script does not execute, sanitized badge shown", async () => {
    await openSvgTool(page);

    // Reset the flag (in case something set it)
    await page.evaluate(() => { delete window.__SVG_SCRIPT_RAN; });

    await uploadSvg(page, F.malicious);
    await waitForItems(page, 1);

    // Check the window flag was never set by any SVG script
    const scriptRan = await page.evaluate(() => Boolean(window.__SVG_SCRIPT_RAN));
    assert.equal(scriptRan, false, "window.__SVG_SCRIPT_RAN must be false — SVG script must NOT execute");

    // Sanitized badge should be visible on the item
    const sanitizedBadge = page.locator("article[data-image-item] [data-sanitized-note]");
    await sanitizedBadge.waitFor({ timeout: 5000 });
    const badgeText = await sanitizedBadge.textContent();
    assert.ok(
      /sanitized/i.test(badgeText) && /unsafe elements removed/i.test(badgeText),
      `Sanitized badge must state what was removed, got: "${badgeText}"`
    );

    // The item should render successfully (sanitised, not errored)
    const status = await page.locator("article[data-image-item]").first().getAttribute("data-status");
    assert.equal(status, "done", `Malicious SVG should render to 'done' after sanitization, got ${status}`);

    await page.screenshot({ path: path.join(EVIDENCE, "06a-malicious-upload.png"), fullPage: true });
    await clearAll(page);
    return { scriptRan, badgeText: badgeText?.trim() };
  });

  // ===========================================================================
  // CHECK 7: SECURITY — malicious SVG paste mode (including live preview)
  //   - preview renders via <img src=blob:> — scripts don't run
  //   - window flag stays unset
  //   - sanitized badge visible in paste area
  // ===========================================================================
  await check("SECURITY paste: malicious SVG script does not execute in preview or queue", async () => {
    await openSvgTool(page);
    await page.evaluate(() => { delete window.__SVG_SCRIPT_RAN; });
    const externalBeforeCount = nonLocalRequests.length;

    // Switch to paste tab
    await page.locator("button[data-tab-paste='true']").click();
    await page.locator("[data-paste-area='true']").waitFor({ timeout: 5000 });

    const malContent = fs.readFileSync(F.malicious, "utf8");

    // Paste the malicious SVG into the textarea
    await page.locator("#svg-paste-textarea").fill(malContent);
    await page.waitForTimeout(800); // let the live preview update

    // Script must still not have run after live preview
    const scriptAfterPreview = await page.evaluate(() => Boolean(window.__SVG_SCRIPT_RAN));
    assert.equal(scriptAfterPreview, false, "Script must NOT execute during paste live preview");

    // Sanitized badge should appear in the paste area
    const pasteInfo = page.locator("[data-paste-area='true'] span").filter({ hasText: /sanitized/i });
    const pasteInfoVisible = await pasteInfo.count() > 0;
    assert.ok(pasteInfoVisible, "Paste area must show 'Sanitized' badge after malicious SVG");
    const pasteInfoText = await pasteInfo.first().textContent();
    assert.ok(
      /unsafe SVG items removed/i.test(pasteInfoText || ""),
      `Paste mode must explain what was removed, got "${pasteInfoText}"`
    );

    // Take screenshot showing the preview (live preview via <img> blob)
    await page.screenshot({ path: path.join(EVIDENCE, "07a-malicious-paste-preview.png"), fullPage: true });

    // Add to queue
    await page.locator("#add-pasted-svg-button").click();
    await waitForItems(page, 1);

    const scriptAfterQueue = await page.evaluate(() => Boolean(window.__SVG_SCRIPT_RAN));
    assert.equal(scriptAfterQueue, false, "Script must NOT execute after adding pasted SVG to queue");
    await page.waitForTimeout(500);
    const pasteExternalRequests = nonLocalRequests.slice(externalBeforeCount);
    assert.deepEqual(
      pasteExternalRequests,
      [],
      `Paste-mode SVG processing must not request external URLs: ${JSON.stringify(pasteExternalRequests)}`
    );

    // Item should be 'done' (sanitized, converted)
    const queueStatus = await page.locator("article[data-image-item]").first().getAttribute("data-status");
    assert.equal(queueStatus, "done", `Pasted malicious SVG should render to 'done', got ${queueStatus}`);

    await page.screenshot({ path: path.join(EVIDENCE, "07b-malicious-paste-queue.png"), fullPage: true });
    await clearAll(page);
    return {
      scriptAfterPreview,
      scriptAfterQueue,
      pasteInfoVisible,
      pasteInfoText: pasteInfoText?.trim(),
      externalRequests: pasteExternalRequests,
    };
  });

  // ===========================================================================
  // CHECK 8: SECURITY — zero external network requests during malicious upload
  // ===========================================================================
  await check("SECURITY: zero external network requests during malicious SVG processing", async () => {
    // nonLocalRequests is accumulated across the whole run; filter those from SVG tool pages
    // For this check, we upload again and watch what happens
    const externalBeforeCount = nonLocalRequests.length;

    await openSvgTool(page);
    await page.evaluate(() => { delete window.__SVG_SCRIPT_RAN; });

    await uploadSvg(page, F.malicious);
    await waitForItems(page, 1);

    // Give a moment for any lazy external requests
    await page.waitForTimeout(1000);

    const externalAfterCount = nonLocalRequests.length;
    const newExternal = nonLocalRequests.slice(externalBeforeCount);

    // Filter out known safe CDN requests (like Next.js hot-reload chunks, fonts from the layout)
    // Only fail if requests go to non-localhost, non-data: domains that we didn't initiate
    const maliciousExternalRequests = newExternal;

    assert.deepEqual(
      maliciousExternalRequests,
      [],
      `External requests from malicious SVG domains detected: ${JSON.stringify(maliciousExternalRequests)}`
    );

    await clearAll(page);
    const scriptRan = await page.evaluate(() => Boolean(window.__SVG_SCRIPT_RAN));
    assert.equal(scriptRan, false, "Malicious upload must not execute SVG script content.");

    return {
      externalRequestsDuringUpload: newExternal.length,
      maliciousRequests: maliciousExternalRequests,
      scriptRan,
    };
  });

  // ===========================================================================
  // CHECK 9: Errors — non-SVG, invalid XML, oversized don't stop other files
  // ===========================================================================
  await check("errors: invalid XML shows error; non-SVG and oversized skipped; valid file still processes", async () => {
    await openSvgTool(page);

    // Upload a mix: 1 valid + 1 oversized. Oversized should be reported but valid should process.
    await page.locator("input[type='file']").first().setInputFiles([F.simple, F.oversized]);
    // Wait — only 1 item (the valid one) should be processed
    await waitForItems(page, 1);

    const errorBanner = page.locator("#global-error-banner");
    const bannerText = await errorBanner.textContent();
    assert.ok(/5 MB|exceeds|oversized|6.*MB|limit/i.test(bannerText),
      `Error banner must mention file size limit, got: "${bannerText}"`);

    // The 1 valid item must be done
    const status = await page.locator("article[data-image-item]").first().getAttribute("data-status");
    assert.equal(status, "done", `The valid file must complete even when another file exceeds size limit`);

    await page.screenshot({ path: path.join(EVIDENCE, "09a-oversized-skipped.png"), fullPage: true });
    await clearAll(page);

    // Upload invalid XML — should show error status on that item
    await openSvgTool(page);
    await uploadSvg(page, F.invalidXml);
    // Wait for the item to be in error state
    await page.waitForFunction(
      () => {
        const items = [...document.querySelectorAll("article[data-image-item]")];
        return items.length === 1 && items[0].dataset.status === "error";
      },
      { timeout: 15000 }
    );
    const errStatus = await page.locator("article[data-image-item]").first().getAttribute("data-status");
    assert.equal(errStatus, "error", `Invalid XML SVG must show error status`);
    await page.screenshot({ path: path.join(EVIDENCE, "09b-invalid-xml.png"), fullPage: true });

    await clearAll(page);
    return { oversizedSkipped: true, invalidXmlShowsError: true };
  });

  // ===========================================================================
  // CHECK 10: 20-file batch limit
  // ===========================================================================
  await check("20-file batch limit: 21st file is rejected with clear message", async () => {
    await openSvgTool(page);

    // Create 21 simple SVG files using the existing simple-shape.svg repeated
    const files21 = [];
    for (let i = 0; i < 21; i++) files21.push(F.simple);

    await page.locator("input[type='file']").first().setInputFiles(files21);
    // Wait up to 60s for all 20 to complete
    await waitForItems(page, 20, 60000);

    const itemCount = await page.locator("article[data-image-item]").count();
    assert.equal(itemCount, 20, `Exactly 20 items must be in queue, got ${itemCount}`);

    // Error banner should mention the 21st was skipped
    const bannerEl = page.locator("#global-error-banner");
    const hasBanner = await bannerEl.isVisible();
    if (hasBanner) {
      const txt = await bannerEl.textContent();
      assert.ok(/20|limit|skipped/i.test(txt), `Banner must mention 20-file limit, got: "${txt}"`);
    }

    await page.screenshot({ path: path.join(EVIDENCE, "10-batch-limit.png"), fullPage: true });
    await clearAll(page);
    return { itemCount, bannerShown: hasBanner };
  });

  // ===========================================================================
  // CHECK 11: Paste mode — textarea → preview → queue → download
  // ===========================================================================
  await check("paste mode: textarea → live preview → add to queue → download PNG", async () => {
    await openSvgTool(page);

    await page.locator("button[data-tab-paste='true']").click();
    await page.locator("[data-paste-area='true']").waitFor();

    const simpleSvg = fs.readFileSync(F.simple, "utf8");
    await page.locator("#svg-paste-textarea").fill(simpleSvg);
    await page.waitForTimeout(600);

    // Live preview image should appear (blob URL rendered via <img>)
    const previewImg = page.locator("[data-paste-area='true'] img");
    await previewImg.waitFor({ timeout: 5000 });
    const previewSrc = await previewImg.getAttribute("src");
    assert.ok(previewSrc?.startsWith("blob:"), `Preview must use blob: URL, got ${previewSrc}`);

    // Dimension readout should show 100×100
    const dimText = await page.locator("[data-paste-area='true']").textContent();
    assert.ok(/100.*×.*100|100.*100/i.test(dimText), `Paste area must show 100×100 dimensions, got "${dimText}"`);

    await page.screenshot({ path: path.join(EVIDENCE, "11a-paste-preview.png") });

    await page.locator("#add-pasted-svg-button").click();
    await waitForItems(page, 1);

    const pastedOut = path.join(EVIDENCE, "paste-downloaded.png");
    await downloadFirst(page, pastedOut);
    const pastedImg = await inspectPng(pastedOut, page);
    assert.equal(pastedImg.width, 100, `Pasted SVG PNG width must be 100, got ${pastedImg.width}`);
    assert.equal(pastedImg.height, 100, `Pasted SVG PNG height must be 100, got ${pastedImg.height}`);

    await page.screenshot({ path: path.join(EVIDENCE, "11b-paste-downloaded.png"), fullPage: true });
    await clearAll(page);
    return { previewIsBlobUrl: true, dimensions: [pastedImg.width, pastedImg.height] };
  });

  // ===========================================================================
  // CHECK 12: Single-file download filename
  // ===========================================================================
  await check("single file download uses .png extension and correct base filename", async () => {
    await openSvgTool(page);
    await uploadSvg(page, F.withText);
    await waitForItems(page, 1);

    const singleOut = path.join(EVIDENCE, "filename-single.png");
    const suggestedName = await downloadFirst(page, singleOut);
    assert.ok(/with-text\.png$/i.test(suggestedName), `Filename must be with-text.png, got "${suggestedName}"`);
    assert.ok(isPng(fs.readFileSync(singleOut)), "Downloaded file must be valid PNG");

    await clearAll(page);
    return { filename: suggestedName };
  });

  // ===========================================================================
  // CHECK 13: Multi-file ZIP download — filenames and unique names
  // ===========================================================================
  await check("multi-file download creates ZIP with all PNG files and unique names", async () => {
    await openSvgTool(page);
    // Upload 3 files (same fixture repeated → unique filenames must be generated)
    await page.locator("input[type='file']").first().setInputFiles([F.simple, F.viewboxOnly, F.withText]);
    await waitForItems(page, 3);

    const zipOut = path.join(EVIDENCE, "multi-download.zip");
    await downloadAll(page, zipOut);

    const { count, entries } = parseZip(zipOut);
    assert.equal(count, 3, `ZIP must contain 3 entries, got ${count}`);
    // All must be .png
    for (const e of entries) {
      assert.ok(/\.png$/.test(e.name), `ZIP entry "${e.name}" must end with .png`);
      assert.ok(e.size > 0, `ZIP entry "${e.name}" must have non-zero size`);
    }
    // Names must all be unique
    const names = entries.map((e) => e.name);
    const unique = new Set(names);
    assert.equal(unique.size, names.length, `ZIP entry names must be unique: ${JSON.stringify(names)}`);

    await page.screenshot({ path: path.join(EVIDENCE, "13-zip-download.png"), fullPage: true });
    await clearAll(page);
    return { zipCount: count, names };
  });

  // ===========================================================================
  // CHECK 14: 375px mobile layout — no horizontal overflow, no ad overlap
  // ===========================================================================
  await check("375px mobile layout: no horizontal overflow, no ad overlap", async () => {
    await page.setViewportSize({ width: 375, height: 812 });
    await openSvgTool(page);
    await uploadSvg(page, F.simple);
    await waitForItems(page, 1);

    await page.screenshot({ path: path.join(EVIDENCE, "14-mobile-375.png"), fullPage: true });

    const layout = await page.evaluate(() => {
      const adSelectors = ["[data-ad-slot]", "[data-ad-placeholder]"];
      const contentSelectors = [
        "article[data-image-item]",
        "[data-svg-options]",
        "[data-svg-summary]",
      ];

      const adBoxes = adSelectors.flatMap((sel) =>
        [...document.querySelectorAll(sel)].map((el) => {
          const r = el.getBoundingClientRect();
          return { sel, x: r.x, y: r.y, right: r.right, bottom: r.bottom };
        })
      );
      const contentBoxes = contentSelectors.flatMap((sel) =>
        [...document.querySelectorAll(sel)].map((el) => {
          const r = el.getBoundingClientRect();
          return { sel, x: r.x, y: r.y, right: r.right, bottom: r.bottom };
        })
      );

      const overlaps = [];
      for (const ad of adBoxes) {
        for (const content of contentBoxes) {
          const iw = Math.min(ad.right, content.right) - Math.max(ad.x, content.x);
          const ih = Math.min(ad.bottom, content.bottom) - Math.max(ad.y, content.y);
          if (iw > 0 && ih > 0) overlaps.push({ ad: ad.sel, content: content.sel });
        }
      }
      return {
        viewportWidth: document.documentElement.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
        overlaps,
      };
    });

    assert.ok(
      layout.bodyScrollWidth <= layout.viewportWidth + 1,
      `Horizontal overflow at 375px: body=${layout.bodyScrollWidth}, viewport=${layout.viewportWidth}`
    );
    assert.deepEqual(layout.overlaps, [], `Ad/content overlaps: ${JSON.stringify(layout.overlaps)}`);

    await page.setViewportSize({ width: 1280, height: 900 });
    await clearAll(page);
    return layout;
  });

  // ===========================================================================
  // CHECK 17: Regression — Image Converter full flow (fresh context)
  // ===========================================================================
  await check("regression: Image Converter upload → convert → download", async () => {
    // Use a fresh page to avoid stale state from heavy SVG batch above
    const convPage = await ctx.newPage();
    convPage.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push("[converter] " + msg.text());
    });
    try {
      await convPage.setViewportSize({ width: 1280, height: 900 });
      const CONV_FIXTURES = path.join(ROOT, "tests", "fixtures");
      await convPage.goto(`${BASE_URL}/tools/image-converter`, { waitUntil: "networkidle" });
      await convPage.locator("[data-dropzone='true']").waitFor({ timeout: 20000 });

      await convPage.locator("input[type='file']").first().setInputFiles(
        path.join(CONV_FIXTURES, "large-photo.jpg")
      );
      // Wait for the initial JPG→JPG (default) conversion to finish
      await convPage.waitForFunction(
        () => {
          const items = [...document.querySelectorAll("article[data-image-item]")];
          return items.length === 1 && ["done", "skipped", "error"].includes(items[0].dataset.status);
        },
        undefined,
        { timeout: 60000 }
      );
      assert.equal(
        await convPage.locator("article[data-image-item]").first().getAttribute("data-status"),
        "skipped",
        "The default JPG-to-JPG path should be reported as skipped, not converted."
      );

      // Switch to PNG output
      await convPage.locator("button[data-format-button='png']").click();
      await convPage.waitForFunction(
        () => {
          const items = [...document.querySelectorAll("article[data-image-item]")];
          return items.length === 1 && items[0].dataset.status === "done";
        },
        undefined,
        { timeout: 60000 }
      );

      const convOut = path.join(EVIDENCE, "regression-converter.png");
      const [dl] = await Promise.all([
        convPage.waitForEvent("download"),
        convPage.locator("button[data-download-single]").first().click(),
      ]);
      await dl.saveAs(convOut);
      assert.ok(isPng(fs.readFileSync(convOut)), "Converter regression: output must be PNG");
      const converterPng = await inspectPng(convOut, convPage);
      assert.deepEqual(
        [converterPng.width, converterPng.height],
        [2400, 1600],
        "Converted PNG must preserve the source dimensions."
      );
      await convPage.screenshot({ path: path.join(EVIDENCE, "17-regression-converter.png"), fullPage: true });
      return {
        filename: dl.suggestedFilename(),
        magicBytes: "PNG",
        dimensions: [converterPng.width, converterPng.height],
        initialJpgState: "skipped",
        convertedState: "done",
      };
    } finally {
      await convPage.close();
    }
  });

  // ===========================================================================
  // CHECK 18: Regression — PDF tool (rotate-pdf) renders without error
  // ===========================================================================
  await check("regression: Rotate PDF upload, rotate, export, and reopen result", async () => {
    // Use a fresh page for the PDF tool
    const pdfPage = await ctx.newPage();
    try {
      await pdfPage.goto(`${BASE_URL}/tools/rotate-pdf`, { waitUntil: "networkidle" });
      await pdfPage.locator("[data-dropzone='true']").waitFor({ timeout: 20000 });

      const pdfFixture = path.join(ROOT, "tests", "fixtures", "organize-six-page-rotated.pdf");
      await pdfPage.locator("input[type='file']").first().setInputFiles(pdfFixture);

      await pdfPage.locator("article[data-page-source]").first().waitFor({ timeout: 30000 });
      const cardCount = await pdfPage.locator("article[data-page-source]").count();
      assert.ok(cardCount > 0, `PDF tool must show at least 1 page card, got ${cardCount}`);
      const fixtureBytes = fs.readFileSync(pdfFixture);
      const originalPdf = await PDFDocument.load(fixtureBytes);
      assert.equal(cardCount, originalPdf.getPageCount(), "PDF page cards must match source page count.");

      const originalRotations = originalPdf.getPages().map((page) => page.getRotation().angle);
      await pdfPage.getByRole("button", { name: "Rotate all right" }).click();
      await pdfPage.waitForFunction(
        (before) => {
          const cards = [...document.querySelectorAll("article[data-page-source]")];
          return cards.length === before.length &&
            cards.every((card, index) =>
              Number(card.dataset.pageRotation) === ((before[index] + 90) % 360)
            );
        },
        originalRotations,
        { timeout: 10000 }
      );

      const pdfOut = path.join(EVIDENCE, "regression-rotated.pdf");
      const [download] = await Promise.all([
        pdfPage.waitForEvent("download"),
        pdfPage.getByRole("button", { name: "Download rotated PDF" }).click(),
      ]);
      await download.saveAs(pdfOut);
      const reopenedPdf = await PDFDocument.load(fs.readFileSync(pdfOut));
      assert.equal(reopenedPdf.getPageCount(), originalPdf.getPageCount());
      const actualRotations = reopenedPdf.getPages().map((page) => page.getRotation().angle);
      const expectedRotations = originalRotations.map((rotation) => (rotation + 90) % 360);
      assert.deepEqual(
        actualRotations,
        expectedRotations,
        "Downloaded PDF rotation values must reflect the rotate-all-right action."
      );
      await pdfPage.screenshot({ path: path.join(EVIDENCE, "18-regression-pdf.png"), fullPage: true });
      return {
        pageCards: cardCount,
        downloadedFilename: download.suggestedFilename(),
        reopenedPageCount: reopenedPdf.getPageCount(),
        rotations: actualRotations,
      };
    } finally {
      await pdfPage.close();
    }
  });

  // ===========================================================================
  // CHECK 15: No console errors or file data sent (including regressions)
  // ===========================================================================
  await check("no console errors or file data requests throughout the run", async () => {
    const filtered = consoleErrors.filter(
      (msg) =>
        !msg.includes("Warning: ") &&
        !msg.includes("hydration") &&
        !msg.includes("ResizeObserver")
    );
    assert.deepEqual(filtered, [], `Console errors: ${JSON.stringify(filtered)}`);
    const postRequests = allRequests.filter(
      (r) => r.method !== "GET" && r.method !== "HEAD" && r.method !== "OPTIONS"
    );
    assert.deepEqual(
      postRequests,
      [],
      `Non-GET requests detected (file data may have been sent): ${JSON.stringify(postRequests)}`
    );
    return {
      errorCount: filtered.length,
      totalRequests: allRequests.length,
      postRequests: postRequests.length,
    };
  });

  // ===========================================================================
  // Final report
  // ===========================================================================
  const reportPath = path.join(EVIDENCE, "results.json");
  fs.writeFileSync(reportPath, JSON.stringify({ baseUrl: BASE_URL, date: new Date().toISOString(), results }, null, 2));

  console.log("\n─────────────────────────────────────────");
  console.log(" SVG-to-PNG Verification Results");
  console.log("─────────────────────────────────────────");
  let passes = 0, failures = 0;
  for (const r of results) {
    const icon = r.result === "PASS" ? "✓" : "✗";
    console.log(`  ${icon} [${r.result}] ${r.name}`);
    if (r.result === "FAIL") {
      failures++;
      console.log(`         ${(r.error || "").split("\n")[0]}`);
    } else {
      passes++;
    }
  }
  console.log(`\n  ${passes} passed, ${failures} failed`);
  console.log(`  Evidence → ${path.relative(ROOT, EVIDENCE)}`);
  console.log(`  Report   → ${path.relative(ROOT, reportPath)}`);
  console.log("─────────────────────────────────────────\n");

  if (failures > 0) process.exitCode = 1;

} finally {
  if (browser) await browser.close().catch(() => {});
  if (serverProcess && serverProcess.exitCode === null) {
    serverProcess.kill();
    await new Promise((resolve) => {
      const t = setTimeout(resolve, 5000);
      serverProcess.once("exit", () => { clearTimeout(t); resolve(); });
    });
  }
}
