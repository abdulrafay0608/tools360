import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { SCALE_PRESETS, QUALITY_PRESETS } from "../src/tools/pdf/pdf-to-jpg/pdfToJpgUtils.js";

test("SCALE_PRESETS has valid standard DPI multiplier settings", () => {
  assert.equal(SCALE_PRESETS["1x"], 1.0);
  assert.equal(SCALE_PRESETS["1.5x"], 1.5);
  assert.equal(SCALE_PRESETS["2x"], 2.0);
});

test("QUALITY_PRESETS has valid compression quality values", () => {
  assert.equal(QUALITY_PRESETS.low, 0.6);
  assert.equal(QUALITY_PRESETS.medium, 0.8);
  assert.equal(QUALITY_PRESETS.high, 0.95);
});

test("Test fixtures exist for multi-page, corrupted, and protected PDFs", () => {
  assert.ok(fs.existsSync(path.resolve("tests/fixtures/sample-multipage.pdf")));
  assert.ok(fs.existsSync(path.resolve("tests/fixtures/corrupted.pdf")));
  assert.ok(fs.existsSync(path.resolve("tests/fixtures/sample-protected.pdf")));
  assert.ok(fs.existsSync(path.resolve("tests/fixtures/invalid.txt")));
});
