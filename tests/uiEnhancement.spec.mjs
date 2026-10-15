import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getLiveTools } from "../src/data/toolsDataUtils.js";

test.use({ baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4357" });
const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

test("homepage search and category filters keep all live tools discoverable", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const cards = page.locator('[data-tool-card][data-available="true"]');
  await expect(cards).toHaveCount(getLiveTools().length);
  await expect(page.getByRole("heading", { name: "Quick access" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "All tools" })).toBeVisible();

  const search = page.getByRole("searchbox", { name: "What do you need to do?" });
  await search.fill("image converter");
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toHaveAttribute("href", "/tools/image-converter");
  await search.fill("");

  const imageFilter = page.getByRole("button", { name: "Image Tools" });
  await imageFilter.focus();
  await page.keyboard.press("Space");
  await expect(imageFilter).toHaveAttribute("aria-pressed", "true");
  await expect(cards).toHaveCount(4);
  await expect(page.getByRole("link", { name: /View category/ })).toHaveAttribute("href", "/tools/category/image-tools");

  await search.fill("no-match-for-this-catalog");
  await expect(page.getByText("No tools match that search.")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(cards).toHaveCount(getLiveTools().length);
  await expect(page.getByRole("button", { name: "All 18" })).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({ path: testInfo.outputPath("home-desktop.png") });
});

test("mobile navigation, keyboard controls, reduced motion, and disabled ads", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const menu = page.getByRole("button", { name: "Open navigation menu" });
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "All tools" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open navigation menu" })).toBeFocused();
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
  await expect(page.locator('ins.adsbygoogle, [data-ad-slot], [aria-label="Advertisement"], script[src*="adsbygoogle"]')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("home-mobile.png") });

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const categoriesMenu = page.getByRole("navigation", { name: "Main navigation" }).locator("details");
  const categoriesTrigger = categoriesMenu.locator("summary");
  await categoriesTrigger.focus();
  await page.keyboard.press("Enter");
  await expect(categoriesMenu).toHaveAttribute("open", "");
  await page.keyboard.press("Escape");
  await expect(categoriesMenu).not.toHaveAttribute("open", "");
  await expect(categoriesTrigger).toBeFocused();
});

test("all 18 live tool workspaces mount an interactive control", async ({ page }) => {
  for (const tool of getLiveTools()) {
    const response = await page.goto(`/tools/${tool.slug}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), tool.slug).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: tool.name })).toBeVisible();
    const workspace = page.getByRole("region", { name: `${tool.name} workspace` });
    await expect.poll(
      () => workspace.locator("button, input, textarea, select, [data-dropzone]").count(),
      { message: `${tool.slug} has an interactive workspace` }
    ).toBeGreaterThan(0);
  }
});

test("populated PDF and image workspaces stay usable without file-bearing requests", async ({ page }, testInfo) => {
  const requests = [];
  page.on("request", (request) => {
    if (/^https?:/.test(request.url())) {
      requests.push({ url: request.url(), body: request.postData() || "" });
    }
  });

  await page.goto("/tools/merge-pdf", { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-dropzone]")).toBeVisible();
  await page.locator('input[type="file"]').first().setInputFiles([
    path.join(fixtures, "sample-multipage.pdf"),
    path.join(fixtures, "sample-multipage.pdf"),
  ]);
  await expect(page.getByRole("button", { name: /Merge/ })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("merge-populated.png") });

  await page.goto("/tools/image-converter", { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-dropzone]")).toBeVisible();
  await page.locator('input[type="file"]').first().setInputFiles(path.join(fixtures, "transparent.png"));
  await expect(page.getByText("transparent.png", { exact: true }).first()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("converter-populated.png") });

  expect(requests.some(({ url, body }) =>
    /sample-multipage\.pdf|transparent\.png/i.test(url + body) ||
    /%PDF-|data:image\/png;base64/i.test(body)
  )).toBe(false);
  expect(requests.filter(({ body }) => body.length > 0)).toEqual([]);
});

test("homepage and representative workspaces fit narrow, tablet, desktop, and 200% CSS zoom", async ({ browser }, testInfo) => {
  for (const width of [320, 360, 390, 768, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    for (const path of ["/", "/tools/merge-pdf", "/tools/image-converter", "/tools/age-calculator", "/tools/word-counter"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      if (path === "/tools/merge-pdf" || path === "/tools/image-converter") {
        await expect(page.locator("[data-dropzone]")).toBeVisible();
      }
      const bounds = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: window.innerWidth }));
      expect(bounds.page, `${path} at ${width}px`).toBeLessThanOrEqual(bounds.viewport + 1);
      await expect(page.locator('ins.adsbygoogle, [data-ad-slot], [aria-label="Advertisement"], script[src*="adsbygoogle"]')).toHaveCount(0);
      if (width === 390 && path === "/tools/merge-pdf") {
        await page.screenshot({ path: testInfo.outputPath("merge-mobile.png") });
      }
      if (width === 1280 && path === "/tools/image-converter") {
        await page.screenshot({ path: testInfo.outputPath("converter-desktop.png") });
      }
    }
    if (width === 1280) {
      for (const path of ["/", "/tools/merge-pdf"]) {
        await page.goto(path, { waitUntil: "domcontentloaded" });
        await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
        const bounds = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: window.innerWidth }));
        expect(bounds.page, `${path} at 200% CSS zoom`).toBeLessThanOrEqual(bounds.viewport + 1);
      }
    }
    await page.close();
  }
});
