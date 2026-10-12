import test from "node:test";
import assert from "node:assert/strict";
import {
  SITE_URL,
  SITE_NAME,
  CONTACT_EMAIL,
  SITE_LAST_UPDATED,
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
  assert.equal(SITE_LAST_UPDATED.toISOString().split("T")[0], "2026-10-12");

  assert.equal(siteConfig.url, SITE_URL);
  assert.equal(siteConfig.name, SITE_NAME);
  assert.equal(siteConfig.contactEmail, CONTACT_EMAIL);
});

test("siteConfig default fallback values match expected Wave 0 requirements", () => {
  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    assert.equal(SITE_URL, "https://techtools360.vercel.app");
  }
  if (!process.env.NEXT_PUBLIC_CONTACT_EMAIL) {
    assert.equal(CONTACT_EMAIL, "freetechtools360@gmail.com");
  }
});
