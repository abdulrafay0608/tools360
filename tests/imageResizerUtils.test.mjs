import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateFitGeometry,
  calculateResizedDimensions,
  getOutputFilename,
  RESIZE_PRESETS,
} from "../src/tools/image/image-resizer/imageResizerUtils.js";

test("pixel dimensions use requested bounds and preserve locked aspect ratio", () => {
  assert.deepEqual(
    calculateResizedDimensions(1600, 900, {
      resizeMode: "pixels",
      width: 800,
      aspectLocked: true,
    }),
    { width: 800, height: 450, wasCapped: false, wasUpscaled: false }
  );
  assert.deepEqual(
    calculateResizedDimensions(1600, 900, {
      resizeMode: "pixels",
      height: 450,
      aspectLocked: true,
    }),
    { width: 800, height: 450, wasCapped: false, wasUpscaled: false }
  );
  assert.deepEqual(
    calculateResizedDimensions(1600, 900, {
      resizeMode: "pixels",
      width: 800,
      height: 800,
      aspectLocked: false,
    }),
    { width: 800, height: 800, wasCapped: false, wasUpscaled: false }
  );
});

test("percentage mode scales both dimensions and clamps percentage to 10-200", () => {
  assert.deepEqual(
    calculateResizedDimensions(640, 480, {
      resizeMode: "percentage",
      percentage: 50,
    }),
    { width: 320, height: 240, wasCapped: false, wasUpscaled: false }
  );
  assert.deepEqual(
    calculateResizedDimensions(640, 480, {
      resizeMode: "percentage",
      percentage: 500,
    }),
    { width: 1280, height: 960, wasCapped: false, wasUpscaled: true }
  );
});

test("all fixed presets have usable pixel dimensions", () => {
  const fixedPresets = RESIZE_PRESETS.filter((preset) => preset.width && preset.height);
  assert.equal(fixedPresets.length, 6);
  for (const preset of fixedPresets) {
    assert.ok(preset.width > 0 && preset.height > 0, `${preset.label} dimensions`);
    assert.deepEqual(
      calculateResizedDimensions(3000, 2000, {
        resizeMode: "pixels",
        width: preset.width,
        height: preset.height,
        aspectLocked: false,
      }),
      {
        width: preset.width,
        height: preset.height,
        wasCapped: false,
        wasUpscaled: false,
      }
    );
  }
});

test("stretch, contain, and cover produce their intended draw geometry", () => {
  const stretch = calculateFitGeometry(400, 200, 200, 200, "stretch");
  assert.deepEqual(stretch, {
    sourceX: 0,
    sourceY: 0,
    sourceWidth: 400,
    sourceHeight: 200,
    targetX: 0,
    targetY: 0,
    targetDrawWidth: 200,
    targetDrawHeight: 200,
  });

  const contain = calculateFitGeometry(400, 200, 200, 200, "contain");
  assert.deepEqual(contain, {
    sourceX: 0,
    sourceY: 0,
    sourceWidth: 400,
    sourceHeight: 200,
    targetX: 0,
    targetY: 50,
    targetDrawWidth: 200,
    targetDrawHeight: 100,
  });

  const cover = calculateFitGeometry(400, 200, 200, 200, "cover");
  assert.deepEqual(cover, {
    sourceX: 100,
    sourceY: 0,
    sourceWidth: 200,
    sourceHeight: 200,
    targetX: 0,
    targetY: 0,
    targetDrawWidth: 200,
    targetDrawHeight: 200,
  });
});

test("dimensions are capped at 8192 pixels per side without changing aspect ratio", () => {
  assert.deepEqual(
    calculateResizedDimensions(4000, 2000, {
      resizeMode: "pixels",
      width: 20000,
      height: 10000,
      aspectLocked: false,
    }),
    { width: 8192, height: 4096, wasCapped: true, wasUpscaled: true }
  );
});

test("upscale detection reflects the final output dimensions", () => {
  assert.equal(
    calculateResizedDimensions(4000, 3000, {
      resizeMode: "pixels",
      width: 5000,
      height: 4000,
      aspectLocked: false,
    }).wasUpscaled,
    true
  );
  assert.equal(
    calculateResizedDimensions(10000, 5000, {
      resizeMode: "pixels",
      width: 20000,
      height: 10000,
      aspectLocked: false,
    }).wasUpscaled,
    false
  );
});

test("resized filenames preserve dotted names and use the selected output extension", () => {
  assert.equal(getOutputFilename("my.photo.2026.jpg", "original"), "my.photo.2026-resized.jpg");
  assert.equal(getOutputFilename("photo.jpeg", "jpg"), "photo-resized.jpg");
  assert.equal(getOutputFilename("graphic.png", "webp"), "graphic-resized.webp");
  assert.equal(getOutputFilename("graphic.png", "png"), "graphic-resized.png");
});
