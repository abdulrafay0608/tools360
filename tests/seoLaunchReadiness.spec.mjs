import { test, expect } from "@playwright/test";
import { getLiveTools, getCategoriesWithLiveTools } from "../src/data/toolsDataUtils.js";
import { toolContent } from "../src/data/toolContent.js";
import { PRODUCTION_SITE_URL } from "../src/config/site.js";

test.use({ baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4352" });

const toolPaths = getLiveTools().map(({ slug }) => `/tools/${slug}`);
const categoryPaths = getCategoriesWithLiveTools().map(({ id }) => `/tools/category/${id}`);
const paths = ["/", "/about", "/contact", "/privacy", ...categoryPaths, ...toolPaths];

test("all public routes have unique metadata, self-canonicals, and useful headings", async ({ page }) => {
  const descriptions = new Set();
  const internalLinks = new Set();
  for (const path of paths) {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status(), path).toBe(200);
    expect(await page.locator("h1").count(), path).toBe(1);
    expect(await page.title(), path).toBeTruthy();
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description?.length, path).toBeGreaterThan(50);
    expect(descriptions.has(description), `${path}: duplicate description`).toBe(false);
    descriptions.add(description);
    const absoluteUrl = path === "/" ? PRODUCTION_SITE_URL : `${PRODUCTION_SITE_URL}${path}`;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", absoluteUrl);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", absoluteUrl);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", description);
    if (toolPaths.includes(path)) {
      expect(await page.locator("h2").count(), path).toBeGreaterThanOrEqual(2);
      const content = toolContent[path.split("/").at(-1)];
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.getByRole("heading", { name: /^How to use / }).locator("..").locator("ol li")).toHaveCount(3);
      await expect(page.getByText(content.intro, { exact: true })).toBeVisible();
      await expect(page.getByText(content.limitations, { exact: true })).toBeVisible();
      const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
      const app = schemas.map((value) => JSON.parse(value)).find((value) => value["@type"] === "WebApplication");
      expect(app?.url, path).toBe(absoluteUrl);
    }
    for (const href of await page.locator('a[href^="/"]').evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
      internalLinks.add(href.split(/[?#]/)[0]);
    }
  }
  expect([...internalLinks].filter((path) => path && !paths.includes(path))).toEqual([]);
});

test("robots and sitemap list only the 26 live production routes", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain(`Sitemap: ${PRODUCTION_SITE_URL}/sitemap.xml`);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  expect(urls).toHaveLength(paths.length);
  expect(new Set(urls).size).toBe(paths.length);
  expect(urls.every((url) => url.startsWith(PRODUCTION_SITE_URL))).toBe(true);
  expect(sitemap).not.toContain("<lastmod>");
});

test("representative routes stay readable at mobile and tablet widths with ads disabled", async ({ browser }) => {
  for (const width of [360, 390, 768]) {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    for (const path of ["/", "/tools/merge-pdf", "/tools/image-converter", "/about", "/privacy"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const bounds = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: window.innerWidth }));
      expect(bounds.page, `${width}px ${path}: horizontal page overflow`).toBeLessThanOrEqual(bounds.viewport + 1);
      expect(await page.locator("h1").isVisible(), `${width}px ${path}: heading`).toBe(true);
      expect(await page.locator("ins.adsbygoogle, [aria-label='Advertisement']").count(), `${width}px ${path}: inactive ad`).toBe(0);
    }
    await page.close();
  }
});

test("unknown tool routes return 404", async ({ page }) => {
  const response = await page.goto("/tools/not-a-live-tool", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(404);
});
