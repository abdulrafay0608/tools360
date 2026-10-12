import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const PORT = process.env.PORT || 3008;
const BASE_URL = `http://localhost:${PORT}`;
const OUT_DIR = "C:/Users/HP/.gemini/antigravity-ide/brain/5bcf515d-3da9-4fc2-a9e3-34dfa7002530/wave05-evidence/baseline";

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const PAGES = [
  { id: "home", path: "/" },
  { id: "about", path: "/about" },
  { id: "contact", path: "/contact" },
  { id: "privacy", path: "/privacy" },
  { id: "category-pdf", path: "/tools/category/pdf-tools" },
  { id: "tool-merge-pdf", path: "/tools/merge-pdf" },
  { id: "tool-pdf-to-jpg", path: "/tools/pdf-to-jpg" },
  { id: "tool-word-counter", path: "/tools/word-counter" },
  { id: "tool-loan-emi-calculator", path: "/tools/loan-emi-calculator" },
  { id: "tool-image-converter", path: "/tools/image-converter" },
];

async function capture() {
  console.log(`Capturing baseline from ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const baseline = {};

  for (const item of PAGES) {
    const url = `${BASE_URL}${item.path}`;
    await page.goto(url, { waitUntil: "networkidle" });
    const title = await page.title();
    const metaDesc = (await page.getAttribute('meta[name="description"]', 'content')) || "";
    const innerText = await page.evaluate(() => document.body.innerText);

    baseline[item.id] = {
      path: item.path,
      title,
      metaDesc,
      innerText
    };
    console.log(`Captured ${item.id}: title="${title}", textLength=${innerText.length}`);
  }

  await browser.close();

  const outPath = path.join(OUT_DIR, "baseline-pages.json");
  fs.writeFileSync(outPath, JSON.stringify(baseline, null, 2), "utf-8");
  console.log(`Saved baseline to ${outPath}`);
}

capture().catch((err) => {
  console.error("Baseline capture error:", err);
  process.exit(1);
});
