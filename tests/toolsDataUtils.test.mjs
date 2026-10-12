import test from "node:test";
import assert from "node:assert/strict";
import { toolsData } from "../src/data/tools-data.js";
import {
  SHOW_COMING_SOON,
  getCategories,
  getCategoryBySlug,
  getCategoriesWithLiveTools,
  getLiveTools,
  getPlannedTools,
  getToolsByCategory,
  getVisibleTools,
} from "../src/data/toolsDataUtils.js";
import sitemap from "../src/app/sitemap.js";
import robots from "../src/app/robots.js";
import { SITE_URL } from "../src/config/site.js";

test("all tools belong to exactly one uniquely slugged category", () => {
  const categories = getCategories();
  const ids = categories.map((category) => category.id);
  const slugs = categories.flatMap((category) => category.tools.map((tool) => tool.slug));

  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.ok(categories.every((category) =>
    category.id && category.category && category.description && category.icon &&
    Number.isInteger(category.sortOrder)
  ));
  const allTools = toolsData.flatMap((category) => category.tools);
  const allSlugs = allTools.map((tool) => tool.slug);
  assert.equal(new Set(allSlugs).size, allSlugs.length);
  assert.ok(allTools.every((tool) => tool.status));
  assert.ok(allTools.filter((tool) => tool.status !== "live").every((tool) => tool.available === false));
  assert.ok(allTools.filter((tool) => tool.status === "planned").every((tool) =>
    [1, 2, 3].includes(tool.priority)
  ));
  assert.ok(allTools.filter((tool) => tool.status === "disabled").every((tool) =>
    typeof tool.disabledReason === "string" && tool.disabledReason.length > 0
  ));
});

test("category helpers keep the catalog complete and expose only live categories", () => {
  assert.ok(getCategories().some((category) => category.id === "developer-tools"));
  const categories = getCategoriesWithLiveTools();
  assert.deepEqual(
    categories.map((category) => category.sortOrder),
    [...categories.map((category) => category.sortOrder)].sort((a, b) => a - b)
  );
  assert.ok(categories.every((category) =>
    category.tools.some((tool) => tool.status === "live")
  ));
  assert.equal(getCategoryBySlug("image-tools")?.category, "Image Tools");
  assert.deepEqual(
    getToolsByCategory("image-tools").map((tool) => tool.slug),
    ["image-compressor", "image-resizer", "image-converter", "svg-to-png"]
  );
  assert.deepEqual(getToolsByCategory("missing-category"), []);
  assert.equal(getCategoryBySlug("developer-tools"), null);
  assert.ok(getCategoryBySlug("finance-calculators"));
  assert.ok(getCategoryBySlug("writer-blogging-tools"));
});

test("visible tools exclude planned and disabled tools while coming soon is off", () => {
  assert.equal(SHOW_COMING_SOON, false);
  const visibleTools = getVisibleTools();
  assert.ok(visibleTools.length > 0);
  assert.ok(visibleTools.every((tool) => tool.status === "live" && tool.available === true));
  assert.deepEqual(visibleTools.map((tool) => tool.slug), getLiveTools().map((tool) => tool.slug));
  assert.ok(getPlannedTools().length > 0);
  assert.ok(!visibleTools.some((tool) =>
    tool.status === "planned" || tool.status === "disabled"
  ));
});

test("existing live tools retain their categories and four calculators are live", () => {
  const expected = {
    "merge-pdf": "pdf-tools",
    "split-pdf": "pdf-tools",
    "compress-pdf": "pdf-tools",
    "pdf-to-jpg": "pdf-tools",
    "jpg-to-pdf": "pdf-tools",
    "sign-pdf": "pdf-tools",
    "rotate-pdf": "pdf-tools",
    "organize-pdf": "pdf-tools",
    "add-page-numbers": "pdf-tools",
    "compare-pdf": "pdf-tools",
    "image-compressor": "image-tools",
    "image-resizer": "image-tools",
    "image-converter": "image-tools",
    "svg-to-png": "image-tools",
    "percentage-calculator": "finance-calculators",
    "loan-emi-calculator": "finance-calculators",
    "age-calculator": "finance-calculators",
    "word-counter": "writer-blogging-tools",
  };
  const actual = Object.fromEntries(
    getLiveTools().map((tool) => [tool.slug, tool.categoryId])
  );
  for (const [slug, categoryId] of Object.entries(expected)) {
    assert.equal(actual[slug], categoryId);
  }
  assert.equal(Object.keys(actual).length, 18);
});

test("sitemap contains only live tools and categories with live tools", () => {
  const entries = sitemap();
  const urls = entries.map((entry) => entry.url);
  const liveToolUrls = getLiveTools().map(
    (tool) => `${SITE_URL}/tools/${tool.slug}`
  );
  const liveCategoryUrls = getCategoriesWithLiveTools().map(
    (category) =>
      `${SITE_URL}/tools/category/${category.id}`
  );

  assert.ok(liveToolUrls.every((url) => urls.includes(url)));
  assert.ok(liveCategoryUrls.every((url) => urls.includes(url)));
  assert.equal(
    urls.filter((url) => url.includes("/tools/")).length,
    liveToolUrls.length + liveCategoryUrls.length
  );
  assert.ok(
    !urls.some((url) =>
      getPlannedTools().some((tool) => url.endsWith(`/tools/${tool.slug}`))
    )
  );
  assert.ok(
    !urls.some((url) =>
      toolsData
        .flatMap((category) => category.tools)
        .filter((tool) => tool.status === "disabled")
        .some((tool) => url.endsWith(`/tools/${tool.slug}`))
    )
  );
});

test("sitemap and robots use one canonical production origin", () => {
  const entries = sitemap();
  assert.ok(entries.length > 0);
  assert.ok(entries.every((entry) => new URL(entry.url).origin === SITE_URL));
  assert.equal(robots().sitemap, `${SITE_URL}/sitemap.xml`);
});
