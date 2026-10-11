import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

const ROOT = process.cwd();
const BASE_URL = process.env.VERIFY_BASE_URL || "http://127.0.0.1:4321";
const EVIDENCE_DIR =
  process.env.VERIFY_EVIDENCE_DIR ||
  path.resolve(ROOT, "..", "four-calculators-verification");
const TOOL_SLUGS = [
  "percentage-calculator",
  "loan-emi-calculator",
  "age-calculator",
  "word-counter",
];
const CATEGORIES = [
  "finance-calculators",
  "writer-blogging-tools",
];

await fs.mkdir(EVIDENCE_DIR, { recursive: true });

function watchPage(page, results) {
  page.on("console", (message) => {
    if (message.type() === "error") results.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => results.consoleErrors.push(error.message));
  page.on("request", (request) => {
    if (request.method() === "POST" && request.postDataBuffer()?.length) {
      results.postRequests.push({
        url: request.url(),
        bytes: request.postDataBuffer().length,
      });
    }
  });
}

async function readStat(page, name) {
  return page.locator(`[data-stat="${name}"]`).innerText();
}

async function checkNoAdOverlap(page) {
  return page.evaluate(() => {
    const ads = [...document.querySelectorAll("[data-ad-slot='true']")].filter(
      (slot) => {
        const style = getComputedStyle(slot);
        const box = slot.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && box.width && box.height;
      }
    );
    const controls = [
      ...document.querySelectorAll(
        "button, input, select, textarea, article, canvas, [data-testid='amortization-scroll']"
      ),
    ];
    const gap = innerWidth < 640 ? 24 : 32;
    const violations = [];
    for (const ad of ads) {
      const adBox = ad.getBoundingClientRect();
      for (const control of controls) {
        if (ad.contains(control) || control.contains(ad)) continue;
        const box = control.getBoundingClientRect();
        if (!box.width || !box.height) continue;
        const separated =
          box.right + gap <= adBox.left ||
          adBox.right + gap <= box.left ||
          box.bottom + gap <= adBox.top ||
          adBox.bottom + gap <= box.top;
        if (!separated) {
          violations.push(ad.getAttribute("data-ad-placement") || "unknown");
        }
      }
    }
    return violations;
  });
}

async function saveScreenshot(page, filename) {
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, filename),
    fullPage: true,
  });
}

async function openCalculator(page, slug) {
  await page.goto(`${BASE_URL}/tools/${slug}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const cls = await page.evaluate(() => window.__cls);
  assert.ok(cls < 0.1, `${slug} CLS was ${cls}`);
  assert.deepEqual(await checkNoAdOverlap(page), [], `${slug} has ad overlap`);
  return cls;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = {
    evidenceDirectory: EVIDENCE_DIR,
    checks: [],
    consoleErrors: [],
    postRequests: [],
  };
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
  });

  try {
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: BASE_URL,
    });
    const page = await context.newPage();
    watchPage(page, results);
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((entries) => {
        for (const entry of entries.getEntries()) {
          if (!entry.hadRecentInput) window.__cls += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });

    const home = await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    assert.equal(home.status(), 200);
    for (const [category, slugs] of [
      ["finance-calculators", TOOL_SLUGS.slice(0, 3)],
      ["writer-blogging-tools", TOOL_SLUGS.slice(3)],
    ]) {
      const section = page.locator(`[data-category-section="${category}"]`);
      for (const slug of slugs) {
        assert.equal(await section.locator(`[data-tool-card="${slug}"]`).count(), 1);
      }
    }
    const cls = await page.evaluate(() => window.__cls);
    assert.ok(cls < 0.1, `Homepage CLS was ${cls}`);
    await saveScreenshot(page, "homepage-desktop.png");
    results.checks.push({
      name: "Homepage categories, four tool cards, and CLS below 0.1",
      pass: true,
      cls,
    });

    const expectedPerCategory = {
      "finance-calculators": TOOL_SLUGS.slice(0, 3),
      "writer-blogging-tools": TOOL_SLUGS.slice(3),
    };
    for (const category of CATEGORIES) {
      const response = await page.goto(`${BASE_URL}/tools/category/${category}`, {
        waitUntil: "networkidle",
      });
      assert.equal(response.status(), 200);
      const slugs = await page
        .locator("[data-tool-card]")
        .evaluateAll((cards) =>
          cards.map((card) => card.getAttribute("data-tool-card"))
        );
      for (const slug of expectedPerCategory[category]) {
        assert.ok(slugs.includes(slug));
      }
      results.checks.push({
        name: `${category} category page contains new live tools`,
        pass: true,
      });
    }

    for (const slug of TOOL_SLUGS) {
      const response = await page.request.get(`${BASE_URL}/tools/${slug}`);
      assert.equal(response.status(), 200, `${slug} returned ${response.status()}`);
    }
    const sitemapResponse = await page.request.get(`${BASE_URL}/sitemap.xml`);
    assert.equal(sitemapResponse.status(), 200);
    const sitemap = await sitemapResponse.text();
    for (const slug of TOOL_SLUGS) {
      assert.ok(sitemap.includes(`/tools/${slug}`), `${slug} missing from sitemap`);
    }
    for (const category of CATEGORIES) {
      assert.ok(sitemap.includes(`/tools/category/${category}`));
    }
    results.checks.push({
      name: "Four new tool routes and both category pages are in sitemap",
      pass: true,
    });

    const percentageCLS = await openCalculator(page, "percentage-calculator");
    assert.equal(await page.getByText("Calculated in your browser. Nothing is stored or sent.").count(), 1);
    const percentageCases = [
      ["X% of Y", "Percentage (X)", "20", "Value (Y)", "150", "30"],
      ["X is what % of Y", "Part (X)", "30", "Whole (Y)", "150", "20"],
      ["Percentage change", "Original value", "80", "New value", "100", "25"],
      ["Add X% to Y", "Percentage (X)", "10", "Value (Y)", "200", "220"],
      ["Subtract X% from Y", "Percentage (X)", "10", "Value (Y)", "200", "180"],
    ];
    for (const [mode, firstName, first, secondName, second, expected] of percentageCases) {
      await page.getByLabel("Calculation").selectOption({ label: mode });
      await page.getByLabel(firstName).fill(first);
      await page.getByLabel(secondName).fill(second);
      assert.equal(await page.getByTestId("percentage-result").innerText(), expected);
      assert.ok((await page.getByTestId("percentage-formula").innerText()).length > 0);
    }
    await page.getByLabel("Calculation").selectOption({ label: "X is what % of Y" });
    await page.getByLabel("Part (X)").fill("5");
    await page.getByLabel("Whole (Y)").fill("0");
    assert.match(await page.getByRole("status").innerText(), /cannot be zero/);
    await page.getByLabel("Whole (Y)").fill("10");
    await page.getByRole("button", { name: "Copy result" }).click();
    assert.match(await page.getByTestId("percentage-copy-status").innerText(), /copied/i);
    await page.getByRole("button", { name: "Clear" }).click();
    assert.match(await page.getByRole("status").innerText(), /Enter percentage/);
    await saveScreenshot(page, "percentage-calculator.png");
    results.checks.push({
      name: "All percentage modes, formula, empty/divide-by-zero errors, copy and clear",
      pass: true,
      cls: percentageCLS,
    });

    const emiCLS = await openCalculator(page, "loan-emi-calculator");
    assert.ok(await page.getByText("$8,884.88", { exact: true }).count() > 0);
    const monthlyTable = page.locator("[data-testid='amortization-scroll'] tbody tr");
    assert.equal(await monthlyTable.count(), 12);
    assert.match(await monthlyTable.last().innerText(), /0\.00/);
    await page.getByRole("button", { name: "yearly", exact: true }).click();
    await page.waitForFunction(
      () => document.querySelectorAll("[data-testid='amortization-scroll'] tbody tr").length === 1
    );
    await page.getByRole("button", { name: "monthly", exact: true }).click();
    await page.waitForFunction(
      () => document.querySelectorAll("[data-testid='amortization-scroll'] tbody tr").length === 12
    );
    const csvDownloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download CSV" }).click();
    const csvDownload = await csvDownloadPromise;
    const csvPath = path.join(EVIDENCE_DIR, csvDownload.suggestedFilename());
    await csvDownload.saveAs(csvPath);
    const csv = await fs.readFile(csvPath, "utf8");
    const csvRows = csv.trim().split(/\r?\n/);
    assert.equal(csvRows[0], "Month,EMI,Principal,Interest,Balance");
    assert.equal(csvRows.length, 13);
    const csvData = csvRows.slice(1).map((row) => row.split(",").map(Number));
    const csvPayments = csvData.map((row) => row[1]);
    const csvPrincipals = csvData.map((row) => row[2]);
    const csvInterest = csvData.map((row) => row[3]);
    const csvBalances = csvData.map((row) => row[4]);
    const csvPaymentTotal = Number(csvPayments.reduce((sum, amount) => sum + amount, 0).toFixed(2));
    const csvPrincipalTotal = Number(csvPrincipals.reduce((sum, amount) => sum + amount, 0).toFixed(2));
    const csvInterestTotal = Number(csvInterest.reduce((sum, amount) => sum + amount, 0).toFixed(2));
    const summaryPayment = Number(
      (await page.getByTestId("total-payment").innerText()).replace(/[^\d.-]/g, "")
    );
    assert.equal(csvPaymentTotal, summaryPayment);
    assert.equal(csvPrincipalTotal, 100000);
    assert.equal(Number((csvPrincipalTotal + csvInterestTotal).toFixed(2)), summaryPayment);
    assert.equal(csvBalances.at(-1), 0);
    await page.getByLabel("Annual interest rate").fill("0");
    assert.ok(await page.getByText("$0.00", { exact: true }).count() > 0);
    await page.getByLabel("Loan amount").fill("-1");
    assert.match(await page.locator("p[role='alert']").innerText(), /amount greater than zero/);
    await page.getByLabel("Loan amount").fill("100000");
    await page.getByLabel("Annual interest rate").fill("12");
    await page.getByLabel("Loan tenure").fill("41");
    await page.getByLabel("Tenure unit").selectOption("years");
    assert.match(await page.locator("p[role='alert']").innerText(), /cannot exceed 40 years/);
    await page.getByLabel("Loan tenure").fill("12");
    await page.getByLabel("Tenure unit").selectOption("months");
    await page.getByLabel("Currency").selectOption("CUSTOM");
    await page.getByLabel("Custom currency symbol").fill("Rs");
    assert.match(await page.getByTestId("monthly-emi").innerText(), /Rs/);
    await saveScreenshot(page, "loan-emi-calculator.png");
    results.checks.push({
      name: "EMI known value, amortization totals/end balance, CSV, yearly toggle, zero rate and invalid inputs",
      pass: true,
      csvRows: csvRows.length - 1,
      csvPaymentTotal,
      cls: emiCLS,
    });

    const ageCLS = await openCalculator(page, "age-calculator");
    await page.getByLabel("Date of birth").fill("2000-02-29");
    await page.getByLabel("Age on date").fill("2021-02-28");
    assert.equal(await page.getByTestId("exact-age").innerText(), "21 years, 0 months, 0 days");
    await page.getByLabel("Age on date").fill("2021-03-01");
    assert.equal(await page.getByTestId("exact-age").innerText(), "21 years, 0 months, 1 day");
    const today = await page.evaluate(() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    });
    await page.getByLabel("Date of birth").fill(today);
    await page.getByLabel("Age on date").fill(today);
    assert.equal(await page.getByTestId("exact-age").innerText(), "0 years, 0 months, 0 days");
    assert.match(await page.locator("body").innerText(), /Days until next birthday\s+365|Days until next birthday\s+366/);
    await page.getByLabel("Date of birth").fill("2027-01-01");
    assert.match(await page.locator("p[role='alert']").innerText(), /cannot be before/);
    await saveScreenshot(page, "age-calculator.png");
    results.checks.push({
      name: "Age leap day, birthday on date, future birth-date error",
      pass: true,
      cls: ageCLS,
    });

    const wordCLS = await openCalculator(page, "word-counter");
    const textArea = page.getByLabel("Text to count");
    await textArea.fill("Hello world. Hello!");
    await page.waitForFunction(() => document.querySelector("[data-stat='words']")?.textContent === "3");
    assert.equal(await readStat(page, "sentences"), "2");
    assert.equal(await readStat(page, "paragraphs"), "1");
    await textArea.fill("یہ ایک اردو متن ہے۔");
    await page.waitForFunction(() => document.querySelector("[data-stat='words']")?.textContent === "5");
    assert.equal(await readStat(page, "characters"), "19");
    await page.getByRole("button", { name: "Copy text" }).click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), "یہ ایک اردو متن ہے۔");
    const largeTextStart = Date.now();
    await textArea.fill("a ".repeat(500000));
    await page.waitForFunction(
      () => document.querySelector("[data-stat='words']")?.textContent === "500,000",
      { timeout: 30000 }
    );
    const largeTextElapsedMs = Date.now() - largeTextStart;
    assert.ok(largeTextElapsedMs < 10000, `1M-character UI update took ${largeTextElapsedMs} ms`);
    assert.equal(await readStat(page, "characters"), "1,000,000");
    await saveScreenshot(page, "word-counter-one-million-characters.png");
    await page.getByRole("button", { name: "Clear" }).click();
    assert.equal(await readStat(page, "words"), "0");
    await saveScreenshot(page, "word-counter.png");
    results.checks.push({
      name: "English and Urdu word counts, 1M-character analysis, clear",
      pass: true,
      oneMillionCharacterUpdateMs: largeTextElapsedMs,
      cls: wordCLS,
    });

    const mobile = await browser.newPage({
      viewport: { width: 375, height: 667 },
      acceptDownloads: true,
    });
    watchPage(mobile, results);
    for (const slug of TOOL_SLUGS) {
      await mobile.goto(`${BASE_URL}/tools/${slug}`, { waitUntil: "networkidle" });
      const widths = await mobile.evaluate(() => ({
        viewport: innerWidth,
        document: document.documentElement.scrollWidth,
      }));
      assert.ok(widths.document <= 375, `${slug} horizontal overflow: ${JSON.stringify(widths)}`);
      const firstControl = await mobile.locator("input, textarea, select").first().boundingBox();
      assert.ok(firstControl && firstControl.y < 667, `${slug} calculator control is below the fold`);
      const primaryInputSelector = {
        "percentage-calculator": "section[aria-label='Percentage inputs']",
        "loan-emi-calculator": "section[aria-label='Loan details']",
        "age-calculator": "section[aria-label='Age dates']",
        "word-counter": "#word-counter-text",
      }[slug];
      const primaryInput = await mobile.locator(primaryInputSelector).boundingBox();
      assert.ok(
        primaryInput && primaryInput.y + primaryInput.height <= 667,
        `${slug} calculator inputs extend below the 667px fold`
      );
      if (slug === "loan-emi-calculator") {
        const scroll = await mobile.locator("[data-testid='amortization-scroll']").evaluate((element) => ({
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
        }));
        assert.ok(scroll.scrollWidth > scroll.clientWidth, "Amortization table should scroll within its own container.");
      }
      assert.equal((await checkNoAdOverlap(mobile)).length, 0, `${slug} has ad overlap`);
      await saveScreenshot(mobile, `${slug}-mobile-375.png`);
    }
    results.checks.push({
      name: "All four calculator layouts at 375x667; schedule scrolls in its container",
      pass: true,
    });

    await page.goto(`${BASE_URL}/tools/rotate-pdf`, { waitUntil: "networkidle" });
    const pdfFixture = path.join(ROOT, "tests", "fixtures", "organize-six-page-rotated.pdf");
    const sourcePdf = await fs.readFile(pdfFixture);
    await page.locator("input[type='file']").setInputFiles(pdfFixture);
    await page.waitForFunction(
      () => document.querySelectorAll("article[data-page-source] canvas").length === 6,
      { timeout: 30000 }
    );
    await page.getByRole("button", { name: "Rotate all right" }).click();
    const pdfDownloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download rotated PDF" }).click();
    const pdfDownload = await pdfDownloadPromise;
    const pdfPath = path.join(EVIDENCE_DIR, pdfDownload.suggestedFilename());
    await pdfDownload.saveAs(pdfPath);
    const exportedPdf = await PDFDocument.load(await fs.readFile(pdfPath));
    assert.deepEqual(
      exportedPdf.getPages().map((pdfPage) => pdfPage.getRotation().angle),
      [90, 180, 90, 90, 0, 90]
    );
    assert.ok((await fs.stat(pdfPath)).size < sourcePdf.length * 1.15);
    assert.equal((await checkNoAdOverlap(page)).length, 0);
    results.checks.push({
      name: "PDF regression upload/rotate/export flow",
      pass: true,
    });

    await page.goto(`${BASE_URL}/tools/image-compressor`, { waitUntil: "networkidle" });
    const imageFixture = path.join(ROOT, "tests", "fixtures", "large-photo.jpg");
    await page.locator("input[type='file']").first().setInputFiles(imageFixture);
    await page.waitForFunction(
      () => {
        const button = document.querySelector("button[data-download-single]");
        return button && !button.disabled;
      },
      { timeout: 30000 }
    );
    const imageDownloadPromise = page.waitForEvent("download");
    await page.locator("button[data-download-single]").first().click();
    const imageDownload = await imageDownloadPromise;
    const imagePath = path.join(EVIDENCE_DIR, imageDownload.suggestedFilename());
    await imageDownload.saveAs(imagePath);
    const imageBytes = await fs.readFile(imagePath);
    assert.deepEqual([...imageBytes.subarray(0, 2)], [0xff, 0xd8]);
    assert.equal((await checkNoAdOverlap(page)).length, 0);
    results.checks.push({
      name: "Image regression upload/process/download flow",
      pass: true,
      jpegBytes: imageBytes.length,
    });

    assert.deepEqual(results.postRequests, []);
    assert.deepEqual(results.consoleErrors, []);
    results.checks.push({
      name: "No browser console errors or file-upload POST requests",
      pass: true,
    });
    await fs.writeFile(
      path.join(EVIDENCE_DIR, "results.json"),
      JSON.stringify(results, null, 2)
    );
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await context.close();
    await browser.close();
  }
}

await main();
