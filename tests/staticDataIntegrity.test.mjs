import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NAV_LINKS } from "../src/content/site/navigation.js";
import { FOOTER_INFO_LINKS, FOOTER_COPY } from "../src/content/site/footer.js";
import { HOME_CONTENT } from "../src/content/site/home.js";
import { TRUST_POINTS } from "../src/content/site/common.js";
import { getAboutContent } from "../src/content/pages/about.js";
import { getContactContent } from "../src/content/pages/contact.js";
import { getPrivacyContent } from "../src/content/pages/privacy.js";
import { getToolContent, getContentWords } from "../src/content/tools/index.js";
import { toolsData } from "../src/data/tools-data.js";
import { CATEGORIES } from "../src/data/categories.js";
import { getCategoriesWithLiveTools, getLiveTools } from "../src/data/toolsDataUtils.js";

test("navigation and footer link integrity and route resolution", () => {
  const liveSlugs = new Set(getLiveTools().map((t) => t.slug));
  const liveCategoryIds = new Set(getCategoriesWithLiveTools().map((c) => c.id));
  const staticRoutes = new Set(["/", "/about", "/privacy", "/contact"]);

  for (const link of NAV_LINKS) {
    assert.ok(link.href.startsWith("/"), `Navigation link ${link.href} must start with /`);
    assert.ok(link.label.trim().length > 0, `Navigation label for ${link.href} must not be empty`);
    assert.ok(staticRoutes.has(link.href), `Navigation link ${link.href} must resolve to a valid route`);
  }

  for (const link of FOOTER_INFO_LINKS) {
    assert.ok(link.href.startsWith("/"), `Footer info link ${link.href} must start with /`);
    assert.ok(link.label.trim().length > 0, `Footer info label for ${link.href} must not be empty`);
    assert.ok(staticRoutes.has(link.href), `Footer info link ${link.href} must resolve to a valid route`);
  }

  assert.ok(FOOTER_COPY.tagline.length > 0);
  assert.ok(FOOTER_COPY.copyrightNote.length > 0);
});

test("site and common content data integrity", () => {
  assert.ok(HOME_CONTENT.hero.title.length > 0);
  assert.ok(HOME_CONTENT.hero.subtitle.length > 0);
  assert.equal(typeof HOME_CONTENT.viewAllCategoryTemplate, "function");

  assert.ok(TRUST_POINTS.processedInBrowser.length > 0);
  assert.ok(TRUST_POINTS.filesNotUploaded.length > 0);
  assert.ok(TRUST_POINTS.noAccountRequired.length > 0);
});

test("structured page content definitions (about, contact, privacy)", () => {
  const dummyProps = { siteName: "Tech Tools 360", contactEmail: "test@example.com" };

  const about = getAboutContent(dummyProps);
  assert.ok(about.metaTitle.length > 0);
  assert.ok(about.eyebrow.includes("Tech Tools 360"));
  assert.ok(about.paragraphs.length >= 2);
  assert.ok(about.paragraphs.every((p) => p.length > 0));

  const contact = getContactContent(dummyProps);
  assert.ok(contact.metaTitle.length > 0);
  assert.equal(contact.contactEmail, "test@example.com");
  assert.ok(contact.introLead.includes("Tech Tools 360"));

  const privacy = getPrivacyContent(dummyProps);
  assert.ok(privacy.metaTitle.length > 0);
  assert.ok(privacy.sections.length >= 3);
  for (const sec of privacy.sections) {
    assert.ok(sec.heading.length > 0);
    assert.ok(sec.paragraphs.length > 0);
    for (const p of sec.paragraphs) {
      if (typeof p === "object") {
        assert.ok(p.linkHref.startsWith("https://") || p.linkHref.startsWith("/"), "Links must use https or internal /");
      }
    }
  }
});

test("getContentWords returns word list for tool content", () => {
  const words = getContentWords("pdf-to-jpg");
  assert.ok(Array.isArray(words));
  assert.ok(words.length > 20, "pdf-to-jpg content should contain word tokens");
  assert.ok(words.includes("pdf"));
  assert.ok(words.includes("jpg"));

  const emptyWords = getContentWords("non-existent-tool-slug");
  assert.deepEqual(emptyWords, []);
});

test("canonical toolsData equality with pre-split baseline", () => {
  const currentCanonical = toolsData.map((c) => ({
    id: c.id,
    category: c.category,
    sortOrder: c.sortOrder,
    tools: c.tools.map((t) => ({
      slug: t.slug,
      name: t.name,
      description: t.description,
      icon: t.icon,
      status: t.status,
      priority: t.priority ?? null,
      available: t.available,
      categoryId: c.id,
      categoryOrder: c.sortOrder,
    })),
  }));

  const savedPath = "C:/Users/HP/.gemini/antigravity-ide/brain/5bcf515d-3da9-4fc2-a9e3-34dfa7002530/wave05-evidence/canonical-tools-data.json";
  if (fs.existsSync(savedPath)) {
    const saved = JSON.parse(fs.readFileSync(savedPath, "utf-8"));
    assert.deepEqual(currentCanonical, saved, "Aggregated toolsData must be 100% identical to baseline");
  }
});

test("category and tool files integrity: no duplicate keys or empty values", () => {
  assert.equal(CATEGORIES.length, 11);
  const categoryIds = new Set();
  for (const cat of CATEGORIES) {
    assert.ok(cat.id && !categoryIds.has(cat.id), `Duplicate or empty category id: ${cat.id}`);
    categoryIds.add(cat.id);
    assert.ok(cat.category && cat.category.length > 0);
    assert.ok(cat.description && cat.description.length > 0);
    assert.ok(cat.icon && cat.icon.length > 0);
    assert.ok(Number.isInteger(cat.sortOrder));
  }

  const allSlugs = new Set();
  for (const cat of toolsData) {
    for (const tool of cat.tools) {
      assert.ok(tool.slug && !allSlugs.has(tool.slug), `Duplicate or empty tool slug: ${tool.slug}`);
      allSlugs.add(tool.slug);
      assert.ok(tool.name && tool.name.length > 0);
      assert.ok(tool.description && tool.description.length > 0);
      assert.ok(tool.icon && tool.icon.length > 0);
      assert.ok(["live", "planned", "disabled"].includes(tool.status));
    }
  }
});
