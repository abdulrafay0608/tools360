import test from "node:test";
import assert from "node:assert/strict";
import {
  PRODUCTION_SITE_URL,
  SITE_URL,
  SITE_NAME,
  CONTACT_EMAIL,
  SITE_LAST_UPDATED,
  getAbsoluteUrl,
  normalizeSiteUrl,
  siteConfig,
} from "../src/config/site.js";

test("siteConfig exports valid constants and default configuration", () => {
  assert.equal(typeof SITE_URL, "string");
  assert.ok(SITE_URL.startsWith("http://") || SITE_URL.startsWith("https://"));
  assert.ok(!SITE_URL.endsWith("/"), "SITE_URL should not have a trailing slash");

  assert.equal(typeof SITE_NAME, "string");
  assert.equal(SITE_NAME, "Tech Tools 360");

  assert.equal(typeof CONTACT_EMAIL, "string");
  assert.ok(CONTACT_EMAIL.includes("@"));

  assert.ok(SITE_LAST_UPDATED instanceof Date);
  assert.equal(SITE_LAST_UPDATED.toISOString().split("T")[0], "2026-10-13");

  assert.equal(siteConfig.url, SITE_URL);
  assert.equal(siteConfig.name, SITE_NAME);
  assert.equal(siteConfig.contactEmail, CONTACT_EMAIL);
});

test("siteConfig default fallback values match expected Wave 0 requirements", () => {
  assert.equal(PRODUCTION_SITE_URL, "https://techtools360.vercel.app");
  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    assert.equal(SITE_URL, PRODUCTION_SITE_URL);
  }
  if (!process.env.NEXT_PUBLIC_CONTACT_EMAIL) {
    assert.equal(CONTACT_EMAIL, "freetechtools360@gmail.com");
  }
});

test("site URL normalization accepts origins and rejects ambiguous deployment values", () => {
  assert.equal(
    normalizeSiteUrl(" https://techtools360.vercel.app/ "),
    PRODUCTION_SITE_URL
  );
  assert.equal(normalizeSiteUrl("http://localhost:3000"), "http://localhost:3000");

  for (const invalidValue of [
    "tools360.com",
    "ftp://techtools360.vercel.app",
    "https://user:secret@techtools360.vercel.app",
    "https://techtools360.vercel.app/tools",
    "https://techtools360.vercel.app?preview=1",
    "https://techtools360.vercel.app#top",
  ]) {
    assert.throws(() => normalizeSiteUrl(invalidValue), /NEXT_PUBLIC_SITE_URL/);
  }
});

test("absolute site URLs always use the configured canonical origin", () => {
  assert.equal(getAbsoluteUrl("/"), SITE_URL);
  assert.equal(getAbsoluteUrl("/about"), `${SITE_URL}/about`);
  assert.equal(
    getAbsoluteUrl("/tools/merge-pdf"),
    `${SITE_URL}/tools/merge-pdf`
  );
  assert.throws(() => getAbsoluteUrl("tools/merge-pdf"), /must start/);
  assert.throws(() => getAbsoluteUrl("//example.com/tool"), /must start/);
  assert.throws(() => getAbsoluteUrl("/tools\\merge-pdf"), /must start/);
});
