import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateTargetDimensions,
  getConvertedFilename,
  parseSvgDimension,
  parseViewBox,
  MAX_FILES,
  MAX_FILE_SIZE_BYTES,
  DEFAULT_DIMENSION,
  MAX_DIMENSION,
  SCALE_OPTIONS,
} from "../src/tools/image/svg-to-png/svgToPngUtils.js";

test("getConvertedFilename replaces .svg with .png accurately", () => {
  assert.equal(getConvertedFilename("logo.svg"), "logo.png");
  assert.equal(getConvertedFilename("graphic.SVG"), "graphic.png");
  assert.equal(getConvertedFilename("complex.name.2026.svg"), "complex.name.2026.png");
  assert.equal(getConvertedFilename("noextension"), "noextension.png");
  assert.equal(getConvertedFilename(""), "svg-image.png");
});

test("parseSvgDimension handles numeric and unit strings", () => {
  assert.equal(parseSvgDimension("100"), 100);
  assert.equal(parseSvgDimension("250px"), 250);
  assert.equal(parseSvgDimension("120.5pt"), 120.5);
  assert.equal(parseSvgDimension("0"), null);
  assert.equal(parseSvgDimension("-10"), null);
  assert.equal(parseSvgDimension(null), null);
  assert.equal(parseSvgDimension("abc"), null);
});

test("parseViewBox extracts minX, minY, width, height", () => {
  assert.deepEqual(parseViewBox("0 0 800 600"), {
    minX: 0,
    minY: 0,
    width: 800,
    height: 600,
  });
  assert.deepEqual(parseViewBox("-10, -20, 100, 200"), {
    minX: -10,
    minY: -20,
    width: 100,
    height: 200,
  });
  assert.equal(parseViewBox("0 0 -50 100"), null);
  assert.equal(parseViewBox("invalid"), null);
  assert.equal(parseViewBox(null), null);
});

test("calculateTargetDimensions handles original, scale, and custom width modes", () => {
  // 1. Original
  const original = calculateTargetDimensions(400, 200, { sizeOption: "original" });
  assert.deepEqual(original, { width: 400, height: 200, wasCapped: false });

  // 2. Scale 2x
  const scale2 = calculateTargetDimensions(400, 200, { sizeOption: "scale", scale: 2 });
  assert.deepEqual(scale2, { width: 800, height: 400, wasCapped: false });

  // 3. Scale 4x
  const scale4 = calculateTargetDimensions(400, 200, { sizeOption: "scale", scale: 4 });
  assert.deepEqual(scale4, { width: 1600, height: 800, wasCapped: false });

  // 4. Custom width with aspect ratio lock
  const custom = calculateTargetDimensions(400, 200, {
    sizeOption: "customWidth",
    customWidth: 1000,
  });
  assert.deepEqual(custom, { width: 1000, height: 500, wasCapped: false });
});

test("calculateTargetDimensions caps output at 8192px per side preserving aspect ratio", () => {
  const capped = calculateTargetDimensions(4000, 2000, {
    sizeOption: "customWidth",
    customWidth: 20000,
  });
  assert.equal(capped.width, 8192);
  assert.equal(capped.height, 4096);
  assert.equal(capped.wasCapped, true);
});

test("constants enforce 20 files limit, 5MB max size, and 8192px max dimension", () => {
  assert.equal(MAX_FILES, 20);
  assert.equal(MAX_FILE_SIZE_BYTES, 5 * 1024 * 1024);
  assert.equal(DEFAULT_DIMENSION, 512);
  assert.equal(MAX_DIMENSION, 8192);
  assert.equal(SCALE_OPTIONS.length, 4);
});
