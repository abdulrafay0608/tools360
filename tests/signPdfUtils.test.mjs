import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  FONT_STYLES,
  COLOR_OPTIONS,
  dataUrlToUint8Array,
} from "../src/tools/pdf/sign-pdf/signPdfUtils.js";

test("FONT_STYLES defines handwriting/cursive styles locally without external font downloads", () => {
  assert.ok(Array.isArray(FONT_STYLES));
  assert.ok(FONT_STYLES.length >= 3);
  for (const font of FONT_STYLES) {
    assert.ok(font.id);
    assert.ok(font.label);
    assert.ok(font.fontFamily.includes("cursive") || font.fontFamily.includes("Script"));
  }
});

test("COLOR_OPTIONS provides classic signature ink colors", () => {
  assert.ok(Array.isArray(COLOR_OPTIONS));
  assert.ok(COLOR_OPTIONS.length >= 3);
  const colorValues = COLOR_OPTIONS.map((c) => c.value);
  assert.ok(colorValues.includes("#000000"));
  assert.ok(colorValues.includes("#0f2b5c") || colorValues.includes("#1d4ed8"));
});

test("dataUrlToUint8Array correctly converts base64 PNG data URLs to binary Uint8Array", () => {
  const dummyBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const bytes = dataUrlToUint8Array(dummyBase64);
  assert.ok(bytes instanceof Uint8Array);
  assert.ok(bytes.length > 0);
  // Check PNG magic header 0x89 0x50 0x4E 0x47
  assert.equal(bytes[0], 0x89);
  assert.equal(bytes[1], 0x50);
  assert.equal(bytes[2], 0x4e);
  assert.equal(bytes[3], 0x47);
});
