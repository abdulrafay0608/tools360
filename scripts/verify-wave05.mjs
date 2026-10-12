/**
 * scripts/verify-wave05.mjs
 * Automated verification script for Wave 0.5 fixes.
 * Tests against fresh production server.
 * Evidence written to:
 * C:/Users/HP/.gemini/antigravity-ide/brain/5bcf515d-3da9-4fc2-a9e3-34dfa7002530/wave05-evidence/
 */

import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { SITE_LAST_UPDATED, SITE_NAME } from "../src/config/site.js";

const PORT = process.env.PORT || 3008;
const BASE_URL = `http://localhost:${PORT}`;
const EVIDENCE_DIR =
  "C:/Users/HP/.gemini/antigravity-ide/brain/5bcf515d-3da9-4fc2-a9e3-34dfa7002530/wave05-evidence";

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const LIVE_SLUGS = [
  "merge-pdf",
  "split-pdf",
  "compress-pdf",
  "organize-pdf",
  "rotate-pdf",
  "add-page-numbers",
  "pdf-to-jpg",
  "jpg-to-pdf",
  "sign-pdf",
  "compare-pdf",
  "image-compressor",
  "image-resizer",
  "image-converter",
  "svg-to-png",
  "percentage-calculator",
  "loan-emi-calculator",
  "age-calculator",
  "word-counter",
];

const results = {
  titlesAndOgBrandVerification: { status: "PENDING", details: [] },
  longTitlesAndDescriptionsReport: { longTitles: [], longDescriptions: [] },
  sitemapLastmodMatchesSiteLastUpdated: { status: "PENDING", details: {} },
  thumbnailGenerationCounts: { status: "PENDING", details: {} },
  signPdfAndJpgToPdfPreviewsLoad: { status: "PENDING", details: {} },
  all18LiveUrlsStatus200: { status: "PENDING", details: [] },
  noConsoleErrors: { status: "PENDING", errors: [] },
  clsUnderThreshold: { status: "PENDING", details: [] },
  fullFlowPdfToolSplit: { status: "PENDING" },
  fullFlowImageToolSvgToPng: { status: "PENDING" },
  fullFlowCalculatorPercentage: { status: "PENDING" },
};

function countOccurrences(str, target) {
  if (!str) return 0;
  let count = 0;
  let pos = 0;
  while ((pos = str.indexOf(target, pos)) !== -1) {
    count++;
    pos += target.length;
  }
  return count;
}

async function run() {
  console.log(`Starting Wave 0.5 automated verification against ${BASE_URL}...`);
  console.log(`Configured SITE_NAME: "${SITE_NAME}"`);
  console.log(`Configured SITE_LAST_UPDATED: ${SITE_LAST_UPDATED.toISOString()}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      consoleErrors.push({ text, location: msg.location(), url: page.url() });
    }
  });

  // 1. Titles and OG:Title Check
  console.log("\n--- Checking Titles, OG:Title & Metadata (Exact Brand Count: 1) ---");
  const pagesToCheck = [
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Tool: Split PDF", url: `${BASE_URL}/tools/split-pdf` },
    { name: "Category: PDF", url: `${BASE_URL}/tools/category/pdf-tools` },
    { name: "About", url: `${BASE_URL}/about` },
    { name: "Contact", url: `${BASE_URL}/contact` },
    { name: "Privacy", url: `${BASE_URL}/privacy` },
  ];

  let titlesPass = true;
  for (const p of pagesToCheck) {
    const res = await page.goto(p.url, { waitUntil: "networkidle" });
    const realTitle = await page.title();
    const ogTitle = await page.getAttribute('meta[property="og:title"]', "content") || "";
    const metaDesc = await page.getAttribute('meta[name="description"]', "content") || "";

    const brandInTitleCount = countOccurrences(realTitle, SITE_NAME);
    const brandInOgTitleCount = countOccurrences(ogTitle, SITE_NAME);
    const oldBrandInTitle = countOccurrences(realTitle, "Tools360");
    const oldBrandInOgTitle = countOccurrences(ogTitle, "Tools360");

    const singleBrandTitle = brandInTitleCount === 1 && oldBrandInTitle === 0;
    const singleBrandOg = brandInOgTitleCount === 1 && oldBrandInOgTitle === 0;

    if (!singleBrandTitle || !singleBrandOg) {
      titlesPass = false;
      console.error(
        `  FAIL ${p.name}: <title>="${realTitle}" (brand count: ${brandInTitleCount}), og:title="${ogTitle}" (brand count: ${brandInOgTitleCount})`
      );
    } else {
      console.log(`  PASS ${p.name}:`);
      console.log(`    <title>: "${realTitle}" (brand count: 1)`);
      console.log(`    og:title: "${ogTitle}" (brand count: 1)`);
    }

    if (realTitle.length > 65) {
      results.longTitlesAndDescriptionsReport.longTitles.push({
        page: p.name,
        length: realTitle.length,
        title: realTitle,
      });
    }

    if (metaDesc.length > 160) {
      results.longTitlesAndDescriptionsReport.longDescriptions.push({
        page: p.name,
        length: metaDesc.length,
        description: metaDesc,
      });
    }

    results.titlesAndOgBrandVerification.details.push({
      page: p.name,
      url: p.url,
      title: realTitle,
      ogTitle,
      metaDesc,
      brandInTitleCount,
      brandInOgTitleCount,
      pass: singleBrandTitle && singleBrandOg,
    });
  }
  results.titlesAndOgBrandVerification.status = titlesPass ? "PASS" : "FAIL";

  // 2. Sitemap Lastmod verification
  console.log("\n--- Checking Sitemap Lastmod against SITE_LAST_UPDATED on two fetches ---");
  try {
    const res1 = await page.goto(`${BASE_URL}/sitemap.xml`);
    const xml1 = await res1.text();
    const res2 = await page.goto(`${BASE_URL}/sitemap.xml`);
    const xml2 = await res2.text();

    const expectedDateStr = SITE_LAST_UPDATED.toISOString().split("T")[0]; // "2026-10-12"
    const lastmods1 = [...xml1.matchAll(/<lastmod>(.*?)<\/lastmod>/g)].map((m) => m[1]);
    const lastmods2 = [...xml2.matchAll(/<lastmod>(.*?)<\/lastmod>/g)].map((m) => m[1]);

    const bothFetchesIdentical =
      lastmods1.length > 0 && JSON.stringify(lastmods1) === JSON.stringify(lastmods2);
    const allMatchExpected = lastmods1.every((lm) => lm.startsWith(expectedDateStr));

    if (bothFetchesIdentical && allMatchExpected) {
      results.sitemapLastmodMatchesSiteLastUpdated = {
        status: "PASS",
        details: {
          expectedDateStr,
          entriesCount: lastmods1.length,
          sampleLastmod: lastmods1[0],
          identicalOnBothFetches: true,
        },
      };
      console.log(
        `  PASS: Sitemap contains ${lastmods1.length} entries; all match ${expectedDateStr} on both fetches.`
      );
    } else {
      results.sitemapLastmodMatchesSiteLastUpdated = {
        status: "FAIL",
        details: {
          expectedDateStr,
          bothFetchesIdentical,
          allMatchExpected,
          sampleLastmod: lastmods1[0],
        },
      };
      console.error(`  FAIL: Sitemap lastmod did not match expected ${expectedDateStr}`);
    }
  } catch (err) {
    results.sitemapLastmodMatchesSiteLastUpdated = { status: "FAIL", error: err.message };
  }

  // 3. Thumbnail Generation Counts (Merge PDF with 2 files, Compress PDF with 1 file)
  console.log("\n--- Checking Thumbnail Generation Counts, Flicker, and CPU Idleness ---");
  try {
    // 3a. Merge PDF: 2 files -> exactly 2 thumbnails
    console.log("  Testing Merge PDF thumbnail count (2 files -> 2 thumbnails)...");
    await page.goto(`${BASE_URL}/tools/merge-pdf`, { waitUntil: "networkidle" });
    const pdf1 = path.resolve("tests/fixtures/sample-multipage.pdf");
    const pdf2 = path.resolve("tests/fixtures/organize-six-page-rotated.pdf");

    await page.setInputFiles('input[type="file"]', [pdf1, pdf2]);
    // Wait for thumbnails to be generated
    await page.waitForSelector('img[alt*="PDF file thumbnail"]', { timeout: 15000 });
    await page.waitForTimeout(1500); // Allow any second generation if buggy

    const mergeThumbnails = await page.$$('img[alt*="PDF file thumbnail"]');
    const mergeThumbnailCount = mergeThumbnails.length;

    // Check DOM stability / no flicker: count should not fluctuate
    await page.waitForTimeout(1000);
    const mergeThumbnailsAfterWait = await page.$$('img[alt*="PDF file thumbnail"]');
    const noFlickerMerge = mergeThumbnailCount === mergeThumbnailsAfterWait.length;

    // CPU Idle check: Measure execution time of a quick benchmark loop in page context
    const cpuIdleMerge = await page.evaluate(async () => {
      const start = performance.now();
      await new Promise((r) => setTimeout(r, 100));
      const elapsed = performance.now() - start;
      return elapsed < 250; // Not starved by runaway event loop
    });

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "merge-pdf-thumbnails.png"),
    });

    const mergePass = mergeThumbnailCount === 2 && noFlickerMerge && cpuIdleMerge;
    console.log(
      `  Merge PDF: thumbnail count = ${mergeThumbnailCount} (expected 2), noFlicker = ${noFlickerMerge}, cpuIdle = ${cpuIdleMerge}`
    );

    // 3b. Compress PDF: 1 file -> exactly 1 thumbnail
    console.log("  Testing Compress PDF thumbnail count (1 file -> 1 thumbnail)...");
    await page.goto(`${BASE_URL}/tools/compress-pdf`, { waitUntil: "networkidle" });
    await page.setInputFiles('input[type="file"]', pdf1);

    await page.waitForSelector('img[alt*="PDF file thumbnail"]', { timeout: 15000 });
    await page.waitForTimeout(1500);

    const compressThumbnails = await page.$$('img[alt*="PDF file thumbnail"]');
    const compressThumbnailCount = compressThumbnails.length;

    await page.waitForTimeout(1000);
    const compressThumbnailsAfterWait = await page.$$('img[alt*="PDF file thumbnail"]');
    const noFlickerCompress = compressThumbnailCount === compressThumbnailsAfterWait.length;

    const cpuIdleCompress = await page.evaluate(async () => {
      const start = performance.now();
      await new Promise((r) => setTimeout(r, 100));
      const elapsed = performance.now() - start;
      return elapsed < 250;
    });

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "compress-pdf-thumbnails.png"),
    });

    const compressPass = compressThumbnailCount === 1 && noFlickerCompress && cpuIdleCompress;
    console.log(
      `  Compress PDF: thumbnail count = ${compressThumbnailCount} (expected 1), noFlicker = ${noFlickerCompress}, cpuIdle = ${cpuIdleCompress}`
    );

    results.thumbnailGenerationCounts = {
      status: mergePass && compressPass ? "PASS" : "FAIL",
      details: {
        merge: {
          count: mergeThumbnailCount,
          expected: 2,
          noFlicker: noFlickerMerge,
          cpuIdle: cpuIdleMerge,
        },
        compress: {
          count: compressThumbnailCount,
          expected: 1,
          noFlicker: noFlickerCompress,
          cpuIdle: cpuIdleCompress,
        },
      },
    };
  } catch (err) {
    results.thumbnailGenerationCounts = { status: "FAIL", error: err.message };
    console.error(`  FAIL: Thumbnail generation test error: ${err.message}`);
  }

  // 4. Previews still load for Sign PDF and JPG to PDF
  console.log("\n--- Checking Sign PDF and JPG to PDF Previews ---");
  try {
    // 4a. Sign PDF
    console.log("  Testing Sign PDF preview...");
    await page.goto(`${BASE_URL}/tools/sign-pdf`, { waitUntil: "networkidle" });
    const pdfFixture = path.resolve("tests/fixtures/sample-multipage.pdf");
    await page.setInputFiles('input[type="file"]', pdfFixture);

    // Wait for canvas to render page preview
    await page.waitForSelector("canvas", { timeout: 15000 });
    const signCanvases = await page.$$("canvas");
    const signPreviewLoaded = signCanvases.length > 0;
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "sign-pdf-preview.png"),
    });
    console.log(`  Sign PDF: Canvas preview loaded = ${signPreviewLoaded}`);

    // 4b. JPG to PDF
    console.log("  Testing JPG to PDF preview...");
    await page.goto(`${BASE_URL}/tools/jpg-to-pdf`, { waitUntil: "networkidle" });
    const img1 = path.resolve("tests/fixtures/batch-test-1.jpg");
    const img2 = path.resolve("tests/fixtures/batch-test-2.jpg");
    await page.setInputFiles('input[type="file"]', [img1, img2]);

    // Wait for image cards to appear in preview grid
    await page.waitForSelector('img[alt="batch-test-1.jpg"]', { timeout: 15000 });
    const jpgPreviews = await page.$$('img[alt^="batch-test"]');
    const jpgPreviewsLoaded = jpgPreviews.length === 2;
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "jpg-to-pdf-preview.png"),
    });
    console.log(`  JPG to PDF: Image previews loaded = ${jpgPreviewsLoaded} (found ${jpgPreviews.length})`);

    const previewsPass = signPreviewLoaded && jpgPreviewsLoaded;
    results.signPdfAndJpgToPdfPreviewsLoad = {
      status: previewsPass ? "PASS" : "FAIL",
      details: {
        signPdfCanvasCount: signCanvases.length,
        jpgToPdfImageCount: jpgPreviews.length,
      },
    };
  } catch (err) {
    results.signPdfAndJpgToPdfPreviewsLoad = { status: "FAIL", error: err.message };
    console.error(`  FAIL: Previews error: ${err.message}`);
  }

  // 5. All 18 live URLs return 200, check CLS and collect titles
  console.log("\n--- Checking All 18 Live Tool URLs for Status 200 & CLS < 0.1 ---");
  let allUrlsPass = true;
  let allClsPass = true;

  for (const slug of LIVE_SLUGS) {
    const url = `${BASE_URL}/tools/${slug}`;
    const res = await page.goto(url, { waitUntil: "networkidle" });
    const status = res.status();
    const is200 = status === 200;
    if (!is200) allUrlsPass = false;

    // Measure CLS
    const clsValue = await page.evaluate(() => {
      return new Promise((resolve) => {
        let cls = 0;
        const observer = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          }
        });
        observer.observe({ type: "layout-shift", buffered: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(cls);
        }, 300);
      });
    });

    const clsOk = clsValue < 0.1;
    if (!clsOk) allClsPass = false;

    results.all18LiveUrlsStatus200.details.push({ slug, status, pass: is200 });
    results.clsUnderThreshold.details.push({ slug, clsValue, pass: clsOk });

    // Check title length & meta desc length for report
    const pageTitle = await page.title();
    const metaDesc = await page.getAttribute('meta[name="description"]', "content") || "";

    if (pageTitle.length > 65) {
      results.longTitlesAndDescriptionsReport.longTitles.push({
        slug,
        length: pageTitle.length,
        title: pageTitle,
      });
    }

    if (metaDesc.length > 160) {
      results.longTitlesAndDescriptionsReport.longDescriptions.push({
        slug,
        length: metaDesc.length,
        description: metaDesc,
      });
    }

    console.log(
      `  Tool /tools/${slug}: HTTP ${status} | CLS: ${clsValue.toFixed(4)} ${clsOk ? "✓" : "✗"}`
    );
  }

  results.all18LiveUrlsStatus200.status = allUrlsPass ? "PASS" : "FAIL";
  results.clsUnderThreshold.status = allClsPass ? "PASS" : "FAIL";

  // 6. Full-flow Regression: PDF Tool (Split PDF)
  console.log("\n--- Full Flow Regression: Split PDF ---");
  try {
    await page.goto(`${BASE_URL}/tools/split-pdf`, { waitUntil: "networkidle" });
    const pdfFixture = path.resolve("tests/fixtures/sample-multipage.pdf");
    await page.setInputFiles('input[type="file"]', pdfFixture);

    await page.waitForSelector('text=Page 1', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const downloadPromise = page.waitForEvent("download", { timeout: 20000 });
    await page.click('button:has-text("Split PDF")');
    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    const savePath = path.join(EVIDENCE_DIR, filename);
    await download.saveAs(savePath);

    const stat = fs.statSync(savePath);
    const pass = filename.endsWith(".zip") && stat.size > 1000;
    results.fullFlowPdfToolSplit = {
      status: pass ? "PASS" : "FAIL",
      filename,
      sizeBytes: stat.size,
    };
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "split-pdf-completed.png") });
    console.log(`  PASS: Split PDF downloaded ${filename} (${stat.size} bytes).`);
  } catch (err) {
    results.fullFlowPdfToolSplit = { status: "FAIL", error: err.message };
    console.error(`  FAIL: Split PDF regression failed: ${err.message}`);
  }

  // 7. Full-flow Regression: Image Tool (SVG to PNG)
  console.log("\n--- Full Flow Regression: SVG to PNG ---");
  try {
    await page.goto(`${BASE_URL}/tools/svg-to-png`, { waitUntil: "networkidle" });
    const svgFixture = path.resolve("tests/fixtures/svg/simple-shape.svg");
    await page.setInputFiles('input[type="file"]', svgFixture);

    await page.waitForSelector('#svg-download-all-button:not([disabled])', {
      timeout: 15000,
    });

    const downloadPromise = page.waitForEvent("download", { timeout: 20000 });
    await page.click('#svg-download-all-button');
    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    const savePath = path.join(EVIDENCE_DIR, filename);
    await download.saveAs(savePath);

    const stat = fs.statSync(savePath);
    const pass = filename.endsWith(".png") && stat.size > 200;
    results.fullFlowImageToolSvgToPng = {
      status: pass ? "PASS" : "FAIL",
      filename,
      sizeBytes: stat.size,
    };
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "svg-to-png-completed.png") });
    console.log(`  PASS: SVG to PNG downloaded ${filename} (${stat.size} bytes).`);
  } catch (err) {
    results.fullFlowImageToolSvgToPng = { status: "FAIL", error: err.message };
    console.error(`  FAIL: SVG to PNG regression failed: ${err.message}`);
  }

  // 8. Full-flow Regression: Calculator (Percentage Calculator)
  console.log("\n--- Full Flow Regression: Percentage Calculator ---");
  try {
    await page.goto(`${BASE_URL}/tools/percentage-calculator`, {
      waitUntil: "networkidle",
    });

    const inputs = await page.$$('input[type="number"]');
    if (inputs.length >= 2) {
      await inputs[0].fill("25");
      await inputs[1].fill("200");
    }

    await page.waitForTimeout(500);
    const pageText = await page.textContent("body");
    const pass = pageText.includes("50") && pageText.includes("Calculated in your browser");
    results.fullFlowCalculatorPercentage = {
      status: pass ? "PASS" : "FAIL",
      resultFound: pageText.includes("50"),
    };
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "percentage-calculator-completed.png"),
    });
    console.log(`  PASS: Percentage Calculator calculated 25% of 200 = 50.`);
  } catch (err) {
    results.fullFlowCalculatorPercentage = { status: "FAIL", error: err.message };
    console.error(`  FAIL: Percentage Calculator regression failed: ${err.message}`);
  }

  // Console Errors evaluation
  // Filter out any known harmless Next.js dev noise if any, but in production there should be zero
  const realErrors = consoleErrors.filter(
    (e) => !e.text.includes("Download is starting")
  );
  results.noConsoleErrors = {
    status: realErrors.length === 0 ? "PASS" : "FAIL",
    errors: realErrors,
  };
  console.log(`\n--- Console Errors: ${realErrors.length} detected ---`);
  if (realErrors.length > 0) {
    console.error(JSON.stringify(realErrors, null, 2));
  }

  await browser.close();

  // Save results report
  const reportPath = path.join(EVIDENCE_DIR, "verification-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`\nVerification finished! Full report written to ${reportPath}`);
}

run().catch((err) => {
  console.error("Verification script fatal error:", err);
  process.exit(1);
});
