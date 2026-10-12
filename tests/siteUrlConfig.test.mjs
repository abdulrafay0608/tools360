import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import robots from "../src/app/robots.js";
import sitemap from "../src/app/sitemap.js";
import {
  PRODUCTION_SITE_URL,
  SITE_URL,
  getAbsoluteUrl,
  normalizeSiteUrl,
} from "../src/config/site.js";

test("production URL defaults to the deployed Tech Tools 360 origin", () => {
  assert.equal(PRODUCTION_SITE_URL, "https://techtools360.vercel.app");
  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    assert.equal(SITE_URL, PRODUCTION_SITE_URL);
  }
});

test("site URL normalization accepts origins and rejects malformed configuration", () => {
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

test("invalid deployment URL configuration fails module initialization clearly", () => {
  const moduleUrl = new URL("../src/config/site.js", import.meta.url).href;
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "--eval", `await import(${JSON.stringify(moduleUrl)})`],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        NEXT_PUBLIC_SITE_URL: "https://techtools360.vercel.app/invalid-path",
      },
    }
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /NEXT_PUBLIC_SITE_URL/);
});

test("absolute URLs, sitemap entries, and robots share one origin", () => {
  assert.equal(getAbsoluteUrl("/"), SITE_URL);
  assert.equal(getAbsoluteUrl("/about"), `${SITE_URL}/about`);
  assert.equal(getAbsoluteUrl("/tools/merge-pdf"), `${SITE_URL}/tools/merge-pdf`);
  assert.throws(() => getAbsoluteUrl("tools/merge-pdf"), /must start/);
  assert.throws(() => getAbsoluteUrl("//example.com/tool"), /must start/);
  assert.throws(() => getAbsoluteUrl("/tools\\merge-pdf"), /must start/);

  const entries = sitemap();
  assert.ok(entries.length > 0);
  assert.ok(entries.every((entry) => new URL(entry.url).origin === SITE_URL));
  assert.equal(robots().sitemap, `${SITE_URL}/sitemap.xml`);
});
