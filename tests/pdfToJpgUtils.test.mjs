import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { SCALE_PRESETS, QUALITY_PRESETS } from "../src/tools/pdf/pdf-to-jpg/pdfToJpgUtils.js";
import { describeCompressionResult } from "../src/tools/pdf/compress-pdf/compressPdfUtils.js";

test("SCALE_PRESETS has valid standard DPI multiplier settings", () => {
  assert.equal(SCALE_PRESETS["1x"], 1.0);
  assert.equal(SCALE_PRESETS["1.5x"], 1.5);
  assert.equal(SCALE_PRESETS["2x"], 2.0);
});

test("PDF point scales map to accurate pixel-per-inch equivalents", () => {
  const pdfPointsPerInch = 72;
  assert.equal(pdfPointsPerInch * SCALE_PRESETS["1x"], 72);
  assert.equal(pdfPointsPerInch * SCALE_PRESETS["1.5x"], 108);
  assert.equal(pdfPointsPerInch * SCALE_PRESETS["2x"], 144);
});

test("QUALITY_PRESETS has valid compression quality values", () => {
  assert.equal(QUALITY_PRESETS.low, 0.6);
  assert.equal(QUALITY_PRESETS.medium, 0.8);
  assert.equal(QUALITY_PRESETS.high, 0.95);
});

test("compression result messages distinguish smaller, unchanged, and larger rewrites", () => {
  assert.match(describeCompressionResult(1000, 800), /reduced by 20\.0%/);
  assert.match(describeCompressionResult(1000, 1000), /same size/);
  assert.match(describeCompressionResult(1000, 1200), /larger/);
});

test("Test fixtures exist for multi-page, corrupted, and protected PDFs", () => {
  assert.ok(fs.existsSync(path.resolve("tests/fixtures/sample-multipage.pdf")));
  assert.ok(fs.existsSync(path.resolve("tests/fixtures/corrupted.pdf")));
  assert.ok(fs.existsSync(path.resolve("tests/fixtures/sample-protected.pdf")));
  assert.ok(fs.existsSync(path.resolve("tests/fixtures/invalid.txt")));
});
