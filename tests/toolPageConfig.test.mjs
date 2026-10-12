import test from "node:test";
import assert from "node:assert/strict";
import { getLiveTools } from "../src/data/toolsDataUtils.js";
import { toolsData } from "../src/data/tools-data.js";
import {
  toolPageConfig,
  getToolPageConfig,
  DEFAULT_TOOL_PAGE_CONFIG,
} from "../src/config/toolPageConfig.js";

test("every live tool resolves a valid config and has expected schema", () => {
  const liveTools = getLiveTools();
  assert.ok(liveTools.length > 0, "There should be live tools");

  for (const tool of liveTools) {
    const config = getToolPageConfig(tool.slug);
    assert.ok(config, `Config for ${tool.slug} should exist`);
    assert.equal(typeof config.hasSeoContent, "boolean");
    assert.equal(typeof config.hideDescription, "boolean");
    assert.equal(typeof config.showFaqSchema, "boolean");
    if (config.trustText !== undefined) {
      assert.equal(typeof config.trustText, "string");
    }
  }
});

test("no unknown slugs exist in toolPageConfig", () => {
  const allKnownSlugs = new Set(
    toolsData.flatMap((category) => category.tools.map((t) => t.slug))
  );

  for (const slug of Object.keys(toolPageConfig)) {
    assert.ok(
      allKnownSlugs.has(slug),
      `Slug "${slug}" in toolPageConfig must exist in master tools-data catalog`
    );
  }
});

test("getToolPageConfig falls back to default values for unregistered slug", () => {
  const fallback = getToolPageConfig("non-existent-dummy-slug");
  assert.deepEqual(fallback, DEFAULT_TOOL_PAGE_CONFIG);
});

test("pdf-to-jpg is configured for SEO content and FAQ schema", () => {
  const config = getToolPageConfig("pdf-to-jpg");
  assert.equal(config.hasSeoContent, true);
  assert.equal(config.showFaqSchema, true);
  assert.equal(config.hideDescription, false);
});

test("calculator tools have custom trust text and hide description", () => {
  const calcSlugs = [
    "percentage-calculator",
    "loan-emi-calculator",
    "age-calculator",
    "word-counter",
  ];

  for (const slug of calcSlugs) {
    const config = getToolPageConfig(slug);
    assert.equal(config.hideDescription, true);
    assert.equal(
      config.trustText,
      "Calculated in your browser. Nothing is stored or sent."
    );
    assert.equal(config.hasSeoContent, false);
    assert.equal(config.showFaqSchema, false);
  }
});

test("tools without custom content have hasSeoContent and showFaqSchema disabled", () => {
  const noContentSlugs = [
    "merge-pdf",
    "split-pdf",
    "compress-pdf",
    "jpg-to-pdf",
    "sign-pdf",
    "compare-pdf",
  ];

  for (const slug of noContentSlugs) {
    const config = getToolPageConfig(slug);
    assert.equal(config.hasSeoContent, false);
    assert.equal(config.showFaqSchema, false);
  }
});
