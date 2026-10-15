import test from "node:test";
import assert from "node:assert/strict";
import { getLiveTools, getCategoriesWithLiveTools } from "../src/data/toolsDataUtils.js";
import { toolContent } from "../src/data/toolContent.js";
import { PRODUCTION_SITE_URL } from "../src/config/site.js";
import sitemap from "../src/app/sitemap.js";
import robots from "../src/app/robots.js";

test("each live tool has distinct, usable guidance and metadata copy", () => {
  const tools = getLiveTools();
  assert.equal(tools.length, 18);
  assert.deepEqual(
    Object.keys(toolContent).sort(),
    tools.map((tool) => tool.slug).sort()
  );

  const descriptions = new Set();
  const introductions = new Set();
  for (const tool of tools) {
    const content = toolContent[tool.slug];
    assert.ok(tool.description.length >= 55, `${tool.slug}: short description`);
    assert.ok(content.intro.length >= 55, `${tool.slug}: short introduction`);
    assert.equal(content.steps.length, 3, `${tool.slug}: steps`);
    assert.ok(content.steps.every((step) => step.length >= 20), `${tool.slug}: vague step`);
    assert.ok(content.limitations.length >= 60, `${tool.slug}: missing limitation`);
    assert.ok(!descriptions.has(tool.description), `${tool.slug}: duplicate description`);
    assert.ok(!introductions.has(content.intro), `${tool.slug}: duplicate introduction`);
    descriptions.add(tool.description);
    introductions.add(content.intro);
  }
});

test("sitemap contains every live route once, uses the production origin, and makes no invented update claims", () => {
  const expectedPaths = [
    "/", "/about", "/contact", "/privacy",
    ...getCategoriesWithLiveTools().map(({ id }) => `/tools/category/${id}`),
    ...getLiveTools().map(({ slug }) => `/tools/${slug}`),
  ];
  const entries = sitemap();
  assert.equal(entries.length, 26);
  assert.deepEqual(
    entries.map(({ url }) => new URL(url).pathname).sort(),
    expectedPaths.sort()
  );
  assert.equal(new Set(entries.map(({ url }) => url)).size, entries.length);
  assert.ok(entries.every(({ url, lastModified }) =>
    new URL(url).origin === PRODUCTION_SITE_URL && lastModified === undefined
  ));
  assert.equal(robots().sitemap, `${PRODUCTION_SITE_URL}/sitemap.xml`);
});

test("output and privacy disclosures cover the known pass-through and visible-stamp limits", () => {
  assert.match(toolContent["compress-pdf"].limitations, /smaller, unchanged, or larger/);
  assert.match(toolContent["compress-pdf"].limitations, /does not recompress scanned images/);
  assert.match(toolContent["image-compressor"].limitations, /original bytes and metadata/);
  assert.match(toolContent["image-converter"].limitations, /original bytes and metadata/);
  assert.match(toolContent["pdf-to-jpg"].limitations, /not guaranteed print-DPI metadata/);
  assert.match(toolContent["sign-pdf"].limitations, /not a certificate-backed digital signature/);
  assert.match(toolContent["compare-pdf"].limitations, /does not export a merged or annotated PDF/);
});
