import test from "node:test";
import assert from "node:assert/strict";
import {
  createDifferenceImageData,
  classifyDifference,
  severityColor,
} from "../src/tools/pdf/compare-pdf/compareUtils.js";

test("createDifferenceImageData reports no differences for identical pixels", () => {
  const pixels = new Uint8ClampedArray([
    255, 255, 255, 255,
    100, 150, 200, 255,
    0, 0, 0, 255,
    50, 60, 70, 255,
  ]);
  const result = createDifferenceImageData(pixels, pixels);
  assert.equal(result.changedPixels, 0);
  assert.equal(result.totalPixels, 4);
  assert.equal(result.changedPercent, 0);
  assert.equal(result.pixels.length, pixels.length);
});

test("createDifferenceImageData detects changes above threshold", () => {
  const original = new Uint8ClampedArray([
    255, 255, 255, 255, // pixel 1
    0, 0, 0, 255,       // pixel 2
  ]);
  const revised = new Uint8ClampedArray([
    255, 255, 255, 255, // matching
    200, 0, 0, 255,     // changed (delta R = 200 >= 30)
  ]);

  const result = createDifferenceImageData(original, revised, 30);
  assert.equal(result.changedPixels, 1);
  assert.equal(result.totalPixels, 2);
  assert.equal(result.changedPercent, 50);
});

test("createDifferenceImageData ignores subtle differences below threshold", () => {
  const original = new Uint8ClampedArray([100, 100, 100, 255]);
  const revised = new Uint8ClampedArray([110, 100, 100, 255]); // delta 10 < 30

  const result = createDifferenceImageData(original, revised, 30);
  assert.equal(result.changedPixels, 0);
  assert.equal(result.changedPercent, 0);
});

test("createDifferenceImageData throws error for mismatched dimensions", () => {
  const bufA = new Uint8ClampedArray(4);
  const bufB = new Uint8ClampedArray(8);
  assert.throws(() => createDifferenceImageData(bufA, bufB), {
    message: "Page pixel buffers must have matching RGBA dimensions.",
  });
});

test("classifyDifference accurately maps percentages to severity levels", () => {
  assert.equal(classifyDifference(0), "none");
  assert.equal(classifyDifference(0.5), "minor");
  assert.equal(classifyDifference(0.99), "minor");
  assert.equal(classifyDifference(1), "moderate");
  assert.equal(classifyDifference(5.5), "moderate");
  assert.equal(classifyDifference(9.99), "moderate");
  assert.equal(classifyDifference(10), "major");
  assert.equal(classifyDifference(75), "major");
  assert.equal(classifyDifference(100), "major");
});

test("severityColor returns appropriate badge colors", () => {
  assert.equal(severityColor("none"), "#22c55e");
  assert.equal(severityColor("minor"), "#eab308");
  assert.equal(severityColor("moderate"), "#f97316");
  assert.equal(severityColor("major"), "#ef4444");
  assert.equal(severityColor("unknown"), "#94a3b8");
});
