import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.resolve(ROOT, "..", "ad-slot-verification");
const PDF = path.join(ROOT, "tests", "fixtures", "sample-multipage.pdf");
const JPG = path.join(OUT_DIR, "sample.jpg");
const BASE = "http://127.0.0.1:3001";

const TOOLS = [
  { slug: "merge-pdf", name: "Merge" },
  { slug: "split-pdf", name: "Split" },
  { slug: "compress-pdf", name: "Compress" },
  { slug: "compare-pdf", name: "Compare" },
  { slug: "jpg-to-pdf", name: "JPG to PDF" },
  { slug: "pdf-to-jpg", name: "PDF to JPG" },
  { slug: "sign-pdf", name: "Sign PDF" },
];

const STATIC_PAGES = ["about", "privacy", "contact"];

function ensureOutDir() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  if (!fs.existsSync(JPG)) {
    const jpeg = Buffer.from(
      "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBUQEBIVFRUVFRUVFRUVFRUVFRUWFxUWFhUVFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGxAQGy0lHyUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAQMBIgACEQEDEQH/xAAbAAACAwEBAQAAAAAAAAAAAAADBAECBQYAB//EABQBAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ALQA//Z",
      "base64"
    );
    fs.writeFileSync(JPG, jpeg);
  }
}

function visibleSlots(slots, viewport) {
  return slots.filter((slot) => {
    if (!slot.box) return false;
    if (viewport === "mobile" && slot.placement === "tool-sidebar") return false;
    return (
      slot.box.width > 0 &&
      slot.box.height > 0 &&
      !slot.hiddenByClass &&
      slot.visibility !== "hidden"
    );
  });
}

async function collectSlots(page) {
  return page.evaluate(() => {
    const nodes = [...document.querySelectorAll("[data-ad-slot='true']")];
    return nodes.map((el) => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        placement: el.getAttribute("data-ad-placement"),
        paused: el.getAttribute("data-ad-paused"),
        hiddenByClass: style.display === "none",
        visibility: style.visibility,
        box: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
        },
      };
    });
  });
}

async function measureCls(page) {
  return page.evaluate(() => Number((window.__adSlotCls || 0).toFixed(4)));
}

async function dropzoneAboveFold(page) {
  return page.evaluate(() => {
    const drop = document.querySelector("[data-dropzone='true']");
    if (!drop) return { found: false, aboveFold: false, bottom: null };
    const rect = drop.getBoundingClientRect();
    return {
      found: true,
      aboveFold: rect.top < window.innerHeight && rect.bottom <= window.innerHeight + 8,
      top: rect.top,
      bottom: rect.bottom,
      viewport: window.innerHeight,
    };
  });
}

async function spacingCheck(page, minGap) {
  return page.evaluate((gap) => {
    const ads = [...document.querySelectorAll("[data-ad-slot='true']")].filter((el) => {
      const style = window.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden";
    });
    const interactive = [
      ...document.querySelectorAll(
        "button, [data-dropzone='true'], canvas, img, [aria-label^='Preview '], a[download], input[type='file'] + label, label[for]"
      ),
    ];
    const violations = [];
    const inflate = (r, g) => ({
      left: r.left - g,
      right: r.right + g,
      top: r.top - g,
      bottom: r.bottom + g,
    });
    const overlaps = (a, b) =>
      a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

    for (const ad of ads) {
      const adRect = ad.getBoundingClientRect();
      if (adRect.width === 0 || adRect.height === 0) continue;
      const padded = inflate(adRect, gap);
      for (const el of interactive) {
        if (ad.contains(el) || el.contains(ad)) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (overlaps(padded, r)) {
          violations.push({
            placement: ad.getAttribute("data-ad-placement"),
            other: el.tagName,
            text: (el.innerText || "").slice(0, 40),
          });
        }
      }
    }
    return violations;
  }, minGap);
}

async function waitForTool(page) {
  await page.waitForSelector("[data-dropzone='true']", {
    timeout: 20000,
  });
}

async function uploadPdf(page, files) {
  const input = page.locator("input[type='file']").first();
  await input.setInputFiles(files);
}

async function exerciseTool(page, slug, viewport) {
  const result = {
    slug,
    steps: [],
    initialEmptyStatePaused: null,
    activePlacements: [],
    spacingViolations: [],
    dragPaused: null,
    dragResumed: null,
    pausedDuringAction: null,
    adsReturned: null,
    postActionPauseStateCorrect: null,
    download: null,
    error: null,
  };
  try {
    result.initialEmptyStatePaused = await page.evaluate(() => {
      const slots = [...document.querySelectorAll("[data-ad-slot='true']")];
      return slots.length > 0 && slots.every(
        (el) => el.getAttribute("data-ad-paused") === "true"
      );
    });
    await page.evaluate(() => {
      window.__adSlotPauseHistory = [];
      window.__adSlotUnpausedSince = null;
    });

    if (slug === "jpg-to-pdf") {
      await uploadPdf(page, JPG);
      result.steps.push("uploaded jpg");
    } else if (slug === "compare-pdf") {
      await uploadPdf(page, [PDF, PDF]);
      result.steps.push("uploaded two pdfs");
    } else if (slug === "merge-pdf") {
      await uploadPdf(page, [PDF, PDF]);
      result.steps.push("uploaded two pdfs");
    } else if (slug === "split-pdf") {
      await uploadPdf(page, PDF);
      result.steps.push("uploaded pdf");
    } else if (slug === "compress-pdf") {
      await uploadPdf(page, PDF);
      result.steps.push("uploaded pdf");
    } else if (slug === "pdf-to-jpg") {
      await uploadPdf(page, PDF);
      result.steps.push("uploaded pdf");
    } else if (slug === "sign-pdf") {
      await uploadPdf(page, PDF);
      result.steps.push("uploaded pdf");
    }

    await page.waitForFunction(
      () => {
        const slots = [...document.querySelectorAll("[data-ad-slot='true']")];
        const allUnpaused =
          slots.length > 0 &&
          slots.every((el) => el.getAttribute("data-ad-paused") === "false");
        if (!allUnpaused) {
          window.__adSlotUnpausedSince = null;
          return false;
        }
        if (window.__adSlotUnpausedSince === null) {
          window.__adSlotUnpausedSince = performance.now();
        }
        return performance.now() - window.__adSlotUnpausedSince >= 1000;
      },
      null,
      { timeout: 45000 }
    );
    result.steps.push("upload parsing and preview rendering completed");

    const minGap = viewport === "mobile" ? 24 : 32;
    result.activePlacements = visibleSlots(await collectSlots(page), viewport)
      .map((slot) => slot.placement);
    result.spacingViolations = await spacingCheck(page, minGap);

    if (slug === "merge-pdf") {
      const dragStarted = await page.evaluate(() => {
        const item = document.querySelector("[draggable='true']");
        if (!item) return false;
        item.dispatchEvent(
          new DragEvent("dragstart", {
            bubbles: true,
            dataTransfer: new DataTransfer(),
          })
        );
        return true;
      });
      if (dragStarted) {
        await page.waitForFunction(
          () => [...document.querySelectorAll("[data-ad-slot='true']")].every(
            (el) => el.getAttribute("data-ad-paused") === "true"
          ),
          null,
          { timeout: 5000 }
        );
        result.dragPaused = true;
        await page.evaluate(() => {
          document.querySelector("[draggable='true']")?.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, dataTransfer: new DataTransfer() })
          );
        });
        await page.waitForFunction(
          () => {
            const slots = [...document.querySelectorAll("[data-ad-slot='true']")];
            const allUnpaused =
              slots.length > 0 &&
              slots.every((el) => el.getAttribute("data-ad-paused") === "false");
            if (!allUnpaused) {
              window.__adSlotUnpausedSince = null;
              return false;
            }
            if (window.__adSlotUnpausedSince === null) {
              window.__adSlotUnpausedSince = performance.now();
            }
            return performance.now() - window.__adSlotUnpausedSince >= 1000;
          },
          null,
          { timeout: 10000 }
        );
        result.dragResumed = true;
      }
    }
    const startDownload = async (button, timeout = 25000) => {
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout }),
        button.click(),
      ]);
      result.download = download.suggestedFilename();
    };

    if (slug === "jpg-to-pdf") {
      await page.getByRole("button", { name: /Convert/i }).first().click({ timeout: 15000 });
      await page.getByRole("button", { name: /Download PDF Document|Download ZIP Archive/ }).waitFor();
      await startDownload(
        page.getByRole("button", { name: /Download PDF Document|Download ZIP Archive/ })
      );
    } else if (slug === "compare-pdf") {
      await page.waitForFunction(
        () => document.querySelectorAll("canvas").length >= 2,
        null,
        { timeout: 30000 }
      );
      result.steps.push("comparison rendered");
    } else if (slug === "merge-pdf") {
      await startDownload(page.getByRole("button", { name: /Merge \d+ PDFs/ }));
    } else if (slug === "split-pdf") {
      await startDownload(page.getByRole("button", { name: "Split PDF" }));
    } else if (slug === "compress-pdf") {
      await page.getByRole("button", { name: "Compress PDF" }).click({ timeout: 20000 });
      await page.getByRole("button", { name: "Download Compressed PDF" }).waitFor({
        timeout: 30000,
      });
      await startDownload(page.getByRole("button", { name: "Download Compressed PDF" }));
    } else if (slug === "pdf-to-jpg") {
      await startDownload(page.getByRole("button", { name: /Convert/i }).first(), 30000);
    } else if (slug === "sign-pdf") {
      await page.getByRole("button", { name: "Add Date Stamp" }).click({ timeout: 20000 });
      result.steps.push("added date stamp");
      await startDownload(page.getByRole("button", { name: "Download Signed PDF" }));
    }
    result.steps.push("tool action completed");

    await page.waitForTimeout(2500);
    const pauseHistory = await page.evaluate(() => window.__adSlotPauseHistory || []);
    result.pausedDuringAction = pauseHistory.some((transition) => transition.paused);
    const stillPaused = await page.locator("[data-ad-paused='true']").count();
    const shouldRemainPaused = slug === "merge-pdf" || slug === "compress-pdf";
    result.adsReturned = stillPaused === 0;
    result.postActionPauseStateCorrect =
      shouldRemainPaused ? stillPaused > 0 : stillPaused === 0;
    result.afterActionAlerts = await page.locator("[role='alert']").allTextContents();
  } catch (err) {
    result.error = err.message;
  }
  return result;
}

async function runViewport(browser, viewportName, size) {
  const context = await browser.newContext({
    viewport: size,
    acceptDownloads: true,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const adRequests = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("request", (req) => {
    const url = req.url();
    if (/googlesyndication|doubleclick|pagead2|adservice\.google|googleadservices/i.test(url)) {
      adRequests.push(url);
    }
  });
  await page.addInitScript(() => {
    window.__adSlotCls = 0;
    window.__adSlotPauseHistory = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__adSlotCls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
    window.__adSlotUnpausedSince = null;
    new MutationObserver((records) => {
      for (const record of records) {
        window.__adSlotPauseHistory.push({
          paused: record.target.getAttribute("data-ad-paused") === "true",
          time: performance.now(),
        });
      }
    }).observe(document, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-ad-paused"],
    });
  });

  const report = {
    viewport: viewportName,
    tools: [],
    staticPages: [],
    consoleErrors,
    pageErrors,
    adRequests,
  };

  for (const tool of TOOLS) {
    const url = `${BASE}/tools/${tool.slug}`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await waitForTool(page);
    await page.waitForFunction(
      () => {
        const slots = [...document.querySelectorAll("[data-ad-slot='true']")];
        return slots.length > 0 && slots.every(
          (el) => el.getAttribute("data-ad-paused") === "true"
        );
      },
      null,
      { timeout: 15000 }
    );
    await page.waitForTimeout(1500);
    const slots = await collectSlots(page);
    const vis = visibleSlots(slots, viewportName);
    const cls = await measureCls(page);
    const drop = await dropzoneAboveFold(page);
    const gap = viewportName === "mobile" ? 24 : 32;
    const spacing = await spacingCheck(page, gap);
    const shot = path.join(OUT_DIR, `${tool.slug}-${viewportName}.png`);
    await page.screenshot({ path: shot, fullPage: true });

    const e2e = await exerciseTool(page, tool.slug, viewportName);
    const afterShot = path.join(OUT_DIR, `${tool.slug}-${viewportName}-after.png`);
    await page.screenshot({ path: afterShot, fullPage: true });

    report.tools.push({
      name: tool.name,
      slug: tool.slug,
      emptyStateVisibleSlotCount: vis.length,
      emptyStatePaused: e2e.initialEmptyStatePaused,
      activeSlotCount: e2e.activePlacements.length,
      activePlacements: e2e.activePlacements,
      allPlacements: slots.map((s) => `${s.placement}:${s.visibility}`),
      cls,
      dropzone: drop,
      initialSpacingViolations: spacing,
      activeSpacingViolations: e2e.spacingViolations,
      screenshot: shot,
      afterScreenshot: afterShot,
      e2e,
    });
  }

  for (const slug of STATIC_PAGES) {
    await page.goto(`${BASE}/${slug}`, { waitUntil: "networkidle", timeout: 30000 });
    const slots = await collectSlots(page);
    const shot = path.join(OUT_DIR, `${slug}-${viewportName}.png`);
    await page.screenshot({ path: shot, fullPage: true });
    report.staticPages.push({
      slug,
      adCount: slots.length,
      screenshot: shot,
    });
  }

  await context.close();
  return report;
}

ensureOutDir();
const browser = await chromium.launch({ headless: true });
try {
  const desktop = await runViewport(browser, "desktop", { width: 1440, height: 900 });
  const mobile = await runViewport(browser, "mobile", { width: 375, height: 667 });
  const output = { generatedAt: new Date().toISOString(), desktop, mobile };
  const jsonPath = path.join(OUT_DIR, "report.json");
  fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
  console.log(`\nWrote ${jsonPath}`);
} finally {
  await browser.close();
}
