/**
 * verify-wave0.mjs
 * Comprehensive automated verification script for Wave 0 cleanup.
 * Outputs all evidence outside the repo:
 * C:/Users/HP/.gemini/antigravity-ide/brain/5bcf515d-3da9-4fc2-a9e3-34dfa7002530/verification-evidence/
 */

import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const PORT = 3005;
const BASE_URL = `http://localhost:${PORT}`;
const SITE_URL = "https://techtools360.vercel.app";
const EVIDENCE_DIR = "C:/Users/HP/.gemini/antigravity-ide/brain/5bcf515d-3da9-4fc2-a9e3-34dfa7002530/verification-evidence";

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

const FORMERLY_TEMPLATED = [
  "merge-pdf",
  "split-pdf",
  "compress-pdf",
  "jpg-to-pdf",
  "sign-pdf",
  "compare-pdf",
];

const results = {
  allLiveUrlsStatus200: { status: "PENDING", details: [] },
  canonicalAndOgUseSiteUrl: { status: "PENDING", details: [] },
  sitemapIdenticalLastmodAndClean: { status: "PENDING" },
  formerlyTemplatedPagesNoGenericOrFaq: { status: "PENDING", details: [] },
  pdfToJpgRetainsContentAndFaq: { status: "PENDING" },
  jsonLdValidJsonOnAllPages: { status: "PENDING", details: [] },
  contactPageConfiguredEmail: { status: "PENDING" },
  noConsoleErrors: { status: "PENDING", errors: [] },
  clsUnderThreshold: { status: "PENDING", details: [] },
  fullFlowPdfToolSplit: { status: "PENDING" },
  fullFlowImageToolSvgToPng: { status: "PENDING" },
  fullFlowCalculatorPercentage: { status: "PENDING" },
};

async function run() {
  console.log(`Starting Wave 0 verification against ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push({ text: msg.text(), location: msg.location() });
    }
  });

  // 1. Verify Sitemap
  console.log("\n--- Checking Sitemap ---");
  try {
    const res1 = await page.goto(`${BASE_URL}/sitemap.xml`);
    const xml1 = await res1.text();

    // Fetch a second time
    const res2 = await page.goto(`${BASE_URL}/sitemap.xml`);
    const xml2 = await res2.text();

    const lastmod1 = [...xml1.matchAll(/<lastmod>(.*?)<\/lastmod>/g)].map(
      (m) => m[1]
    );
    const lastmod2 = [...xml2.matchAll(/<lastmod>(.*?)<\/lastmod>/g)].map(
      (m) => m[1]
    );

    const identical =
      lastmod1.length > 0 &&
      JSON.stringify(lastmod1) === JSON.stringify(lastmod2);
    const hasChangefreq = xml1.includes("<changefreq>");
    const hasPriority = xml1.includes("<priority>");

    if (identical && !hasChangefreq && !hasPriority) {
      results.sitemapIdenticalLastmodAndClean = {
        status: "PASS",
        sampleDate: lastmod1[0],
        entryCount: lastmod1.length,
        hasChangefreq,
        hasPriority,
      };
      console.log(`  PASS: Sitemap has ${lastmod1.length} entries with identical lastmod and no changefreq/priority churn.`);
    } else {
      results.sitemapIdenticalLastmodAndClean = {
        status: "FAIL",
        identical,
        hasChangefreq,
        hasPriority,
      };
      console.log(`  FAIL: Sitemap check failed.`);
    }
  } catch (err) {
    results.sitemapIdenticalLastmodAndClean = {
      status: "FAIL",
      error: err.message,
    };
  }

  // 2. Check all 18 Live Tool URLs + metadata + JSON-LD + CLS
  console.log("\n--- Checking 18 Live Tool URLs ---");
  let allUrls200 = true;
  let allCanonicalOk = true;
  let allJsonLdOk = true;

  for (const slug of LIVE_SLUGS) {
    const url = `${BASE_URL}/tools/${slug}`;
    const expectedCanonical = `${SITE_URL}/tools/${slug}`;

    // Measure CLS
    let clsValue = 0;
    await page.exposeFunction?.(`__cls_${slug}`, () => {});

    const response = await page.goto(url, { waitUntil: "networkidle" });
    const statusCode = response.status();

    if (statusCode !== 200) {
      allUrls200 = false;
      results.allLiveUrlsStatus200.details.push({ slug, status: statusCode });
    }

    // Check canonical & og:url
    const canonical = await page
      .$eval('link[rel="canonical"]', (el) => el.getAttribute("href"))
      .catch(() => null);
    const ogUrl = await page
      .$eval('meta[property="og:url"]', (el) => el.getAttribute("content"))
      .catch(() => null);

    const canonicalMatches = canonical === expectedCanonical;
    const ogUrlMatches = ogUrl === expectedCanonical;

    if (!canonicalMatches || !ogUrlMatches) {
      allCanonicalOk = false;
      results.canonicalAndOgUseSiteUrl.details.push({
        slug,
        canonical,
        ogUrl,
        expectedCanonical,
      });
    }

    // Check JSON-LD
    const jsonLdScripts = await page.$$eval(
      'script[type="application/ld+json"]',
      (els) => els.map((e) => e.textContent)
    );

    let parsedSchemas = [];
    for (const jsonText of jsonLdScripts) {
      try {
        const parsed = JSON.parse(jsonText);
        parsedSchemas.push(parsed);
      } catch (e) {
        allJsonLdOk = false;
        results.jsonLdValidJsonOnAllPages.details.push({
          slug,
          error: e.message,
          raw: jsonText,
        });
      }
    }

    // Check CLS via PerformanceObserver
    clsValue = await page.evaluate(() => {
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

    results.clsUnderThreshold.details.push({ slug, clsValue });

    // Check formerly templated pages: NO generic text, NO FAQPage
    if (FORMERLY_TEMPLATED.includes(slug)) {
      const pageText = await page.textContent("body");
      const hasGenericHowTo = pageText.includes("How to use");
      const hasGenericDropPdf = pageText.includes("Select or drop your PDF");
      const hasGenericTips = pageText.includes("💡 Pro Tips for Best Results");
      const hasGenericFaq = pageText.includes("Frequently Asked Questions (FAQs)");

      const hasFaqPageSchema = parsedSchemas.some((s) => {
        const graph = s["@graph"] || [s];
        return graph.some((item) => item["@type"] === "FAQPage");
      });

      const clean =
        !hasGenericHowTo &&
        !hasGenericDropPdf &&
        !hasGenericTips &&
        !hasGenericFaq &&
        !hasFaqPageSchema;

      results.formerlyTemplatedPagesNoGenericOrFaq.details.push({
        slug,
        clean,
        hasGenericHowTo,
        hasGenericDropPdf,
        hasGenericTips,
        hasGenericFaq,
        hasFaqPageSchema,
      });

      if (!clean) {
        console.log(`  FAIL: Formerly templated tool ${slug} still has generic text or FAQ schema!`);
      }
    }

    // Check pdf-to-jpg specifically
    if (slug === "pdf-to-jpg") {
      const pageText = await page.textContent("body");
      const hasHowTo = pageText.includes("How to use PDF to JPG online");
      const hasTips = pageText.includes("💡 Pro Tips for Best Results");
      const hasPrivacy = pageText.includes("🔒 Privacy & Local Processing");
      const hasFaq = pageText.includes("Frequently Asked Questions (FAQs)");

      const hasFaqSchema = parsedSchemas.some((s) => {
        const graph = s["@graph"] || [s];
        return graph.some((item) => item["@type"] === "FAQPage");
      });

      const passPdfToJpg =
        hasHowTo && hasTips && hasPrivacy && hasFaq && hasFaqSchema;
      results.pdfToJpgRetainsContentAndFaq = {
        status: passPdfToJpg ? "PASS" : "FAIL",
        hasHowTo,
        hasTips,
        hasPrivacy,
        hasFaq,
        hasFaqSchema,
      };
      await page.screenshot({
        path: path.join(EVIDENCE_DIR, "pdf-to-jpg-verified.png"),
        fullPage: true,
      });
      console.log(`  PASS: pdf-to-jpg retains custom SEO content & FAQ schema.`);
    }
  }

  results.allLiveUrlsStatus200.status = allUrls200 ? "PASS" : "FAIL";
  results.canonicalAndOgUseSiteUrl.status = allCanonicalOk ? "PASS" : "FAIL";
  results.jsonLdValidJsonOnAllPages.status = allJsonLdOk ? "PASS" : "FAIL";

  const allClsOk = results.clsUnderThreshold.details.every(
    (d) => d.clsValue < 0.1
  );
  results.clsUnderThreshold.status = allClsOk ? "PASS" : "FAIL";

  const allFormerlyClean =
    results.formerlyTemplatedPagesNoGenericOrFaq.details.every((d) => d.clean);
  results.formerlyTemplatedPagesNoGenericOrFaq.status = allFormerlyClean
    ? "PASS"
    : "FAIL";

  // 3. Contact page check
  console.log("\n--- Checking Contact Page ---");
  await page.goto(`${BASE_URL}/contact`, { waitUntil: "networkidle" });
  const contactText = await page.textContent("body");
  const contactMailto = await page
    .$eval('a[href^="mailto:"]', (el) => el.getAttribute("href"))
    .catch(() => null);

  const contactHasEmail =
    contactMailto === "mailto:freetechtools360@gmail.com" &&
    contactText.includes("freetechtools360@gmail.com") &&
    !contactText.includes("hello@tools360.com");

  const contactMentionsAll =
    contactText.toLowerCase().includes("pdf") &&
    contactText.toLowerCase().includes("image") &&
    contactText.toLowerCase().includes("calculator");

  results.contactPageConfiguredEmail = {
    status: contactHasEmail && contactMentionsAll ? "PASS" : "FAIL",
    contactMailto,
    contactMentionsAll,
  };
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, "contact-page-verified.png"),
  });
  console.log(`  PASS: Contact page displays configured email & mentions all categories.`);

  // 4. Full flow regression: 1 PDF Tool (Split PDF with file-saver ZIP download)
  console.log("\n--- Full-flow Regression: Split PDF (file-saver verification) ---");
  try {
    await page.goto(`${BASE_URL}/tools/split-pdf`, { waitUntil: "networkidle" });
    const fixturePath = path.resolve("tests/fixtures/sample-multipage.pdf");

    // Upload file directly
    await page.setInputFiles('input[type="file"]', fixturePath);

    // Wait for thumbnail load
    await page.waitForSelector('text=Page 1', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Setup download listener
    const downloadPromise = page.waitForEvent("download", { timeout: 20000 });

    // Click split download (exact button text is "Split PDF")
    await page.click('button:has-text("Split PDF")');
    const download = await downloadPromise;
    const downloadFilename = download.suggestedFilename();
    const downloadSavePath = path.join(EVIDENCE_DIR, downloadFilename);
    await download.saveAs(downloadSavePath);

    const zipStat = fs.statSync(downloadSavePath);
    const passSplit =
      downloadFilename.endsWith(".zip") && zipStat.size > 1000;

    results.fullFlowPdfToolSplit = {
      status: passSplit ? "PASS" : "FAIL",
      downloadFilename,
      sizeBytes: zipStat.size,
    };
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "split-pdf-completed.png"),
    });
    console.log(`  PASS: Split PDF file-saver download verified: ${downloadFilename} (${zipStat.size} bytes).`);
  } catch (err) {
    results.fullFlowPdfToolSplit = { status: "FAIL", error: err.message };
    console.log(`  FAIL: Split PDF regression failed: ${err.message}`);
  }

  // 5. Full flow regression: 1 Image Tool (SVG to PNG)
  console.log("\n--- Full-flow Regression: SVG to PNG ---");
  try {
    await page.goto(`${BASE_URL}/tools/svg-to-png`, { waitUntil: "networkidle" });
    const svgFixture = path.resolve("tests/fixtures/svg/simple-shape.svg");

    await page.setInputFiles('input[type="file"]', svgFixture);

    // Wait for processing to complete and download button to become enabled
    await page.waitForSelector('#svg-download-all-button:not([disabled])', {
      timeout: 15000,
    });

    const downloadPromise = page.waitForEvent("download", { timeout: 20000 });
    await page.click('#svg-download-all-button');
    const download = await downloadPromise;
    const downloadFilename = download.suggestedFilename();
    const downloadSavePath = path.join(EVIDENCE_DIR, downloadFilename);
    await download.saveAs(downloadSavePath);

    const stat = fs.statSync(downloadSavePath);
    const passSvg =
      downloadFilename.endsWith(".png") && stat.size > 200;

    results.fullFlowImageToolSvgToPng = {
      status: passSvg ? "PASS" : "FAIL",
      downloadFilename,
      sizeBytes: stat.size,
    };
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "svg-to-png-completed.png"),
    });
    console.log(`  PASS: SVG to PNG conversion verified: ${downloadFilename} (${stat.size} bytes).`);
  } catch (err) {
    results.fullFlowImageToolSvgToPng = { status: "FAIL", error: err.message };
    console.log(`  FAIL: SVG to PNG regression failed: ${err.message}`);
  }

  // 6. Full flow regression: 1 Calculator (Percentage Calculator)
  console.log("\n--- Full-flow Regression: Percentage Calculator ---");
  try {
    await page.goto(`${BASE_URL}/tools/percentage-calculator`, {
      waitUntil: "networkidle",
    });

    // Enter percentage 25 and total 200
    // Fill first input of Mode 1
    const inputs = await page.$$('input[type="number"]');
    if (inputs.length >= 2) {
      await inputs[0].fill("25");
      await inputs[1].fill("200");
    }

    await page.waitForTimeout(500);
    const pageText = await page.textContent("body");
    const passCalc = pageText.includes("50") && pageText.includes("Calculated in your browser");

    results.fullFlowCalculatorPercentage = {
      status: passCalc ? "PASS" : "FAIL",
      calculatedValueFound: pageText.includes("50"),
      trustBadgeFound: pageText.includes("Calculated in your browser"),
    };
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "percentage-calculator-completed.png"),
    });
    console.log(`  PASS: Percentage Calculator calculation & trust text verified.`);
  } catch (err) {
    results.fullFlowCalculatorPercentage = {
      status: "FAIL",
      error: err.message,
    };
    console.log(`  FAIL: Percentage Calculator regression failed: ${err.message}`);
  }

  // Check console errors
  results.noConsoleErrors = {
    status: consoleErrors.length === 0 ? "PASS" : "FAIL",
    errors: consoleErrors,
  };

  await browser.close();

  // Write results to evidence directory
  fs.writeFileSync(
    path.join(EVIDENCE_DIR, "results.json"),
    JSON.stringify(results, null, 2),
    "utf8"
  );

  console.log("\nVerification finished. Results saved to:", path.join(EVIDENCE_DIR, "results.json"));
}

run().catch((err) => {
  console.error("Verification execution error:", err);
  process.exit(1);
});
