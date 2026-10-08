import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  formatFileSize,
  calculateSavings,
  getOutputFilename,
  resolveTargetMimeType,
  calculateTargetDimensions,
  generateUniqueFilenames,
  MAX_FILES,
  MAX_FILE_SIZE_BYTES,
  DEFAULT_QUALITY,
  SUPPORTED_MIME_TYPES,
  DOWNSCALE_PRESETS,
  FORMAT_PRESETS,
} from "../src/tools/image/image-compressor/imageCompressorUtils.js";

test("formatFileSize formats zero, bytes, KB, and MB accurately", () => {
  assert.equal(formatFileSize(0), "0 B");
  assert.equal(formatFileSize(-5), "0 B");
  assert.equal(formatFileSize(null), "0 B");
  assert.equal(formatFileSize(512), "512 B");
  assert.equal(formatFileSize(1024), "1.0 KB");
  assert.equal(formatFileSize(1536), "1.5 KB");
  assert.equal(formatFileSize(1024 * 1024), "1.00 MB");
  assert.equal(formatFileSize(2.5 * 1024 * 1024), "2.50 MB");
});

test("calculateSavings accurately reports saved bytes and percentages", () => {
  const result = calculateSavings(1000, 400);
  assert.equal(result.savedBytes, 600);
  assert.equal(result.percentageSaved, 60);
  assert.equal(result.isAlreadyOptimized, false);

  const half = calculateSavings(2000, 1000);
  assert.equal(half.savedBytes, 1000);
  assert.equal(half.percentageSaved, 50);
  assert.equal(half.isAlreadyOptimized, false);
});

test("calculateSavings marks files as already-optimized when compressed size is larger or equal", () => {
  const equal = calculateSavings(1000, 1000);
  assert.equal(equal.isAlreadyOptimized, true);
  assert.equal(equal.savedBytes, 0);
  assert.equal(equal.percentageSaved, 0);

  const larger = calculateSavings(500, 650);
  assert.equal(larger.isAlreadyOptimized, true);
  assert.equal(larger.savedBytes, 0);
  assert.equal(larger.percentageSaved, 0);
});

test("getOutputFilename formats filenames for original, jpg, webp, and png targets", () => {
  assert.equal(getOutputFilename("photo.jpeg", "original"), "photo-compressed.jpg");
  assert.equal(getOutputFilename("photo.jpg", "original"), "photo-compressed.jpg");
  assert.equal(getOutputFilename("graphic.png", "original"), "graphic-compressed.png");
  assert.equal(getOutputFilename("banner.webp", "original"), "banner-compressed.webp");

  assert.equal(getOutputFilename("banner.png", "jpg"), "banner-compressed.jpg");
  assert.equal(getOutputFilename("photo.jpg", "webp"), "photo-compressed.webp");
  assert.equal(getOutputFilename("photo.jpg", "png"), "photo-compressed.png");

  // Handles filenames with multiple dots
  assert.equal(
    getOutputFilename("my.vacation.photo.2026.png", "webp"),
    "my.vacation.photo.2026-compressed.webp"
  );
});

test("resolveTargetMimeType selects correct target MIME based on output format and source", () => {
  assert.equal(resolveTargetMimeType("image/jpeg", "original"), "image/jpeg");
  assert.equal(resolveTargetMimeType("image/png", "original"), "image/png");
  assert.equal(resolveTargetMimeType("image/webp", "original"), "image/webp");

  assert.equal(resolveTargetMimeType("image/png", "jpg"), "image/jpeg");
  assert.equal(resolveTargetMimeType("image/jpeg", "webp"), "image/webp");
  assert.equal(resolveTargetMimeType("image/jpeg", "png"), "image/png");
});

test("calculateTargetDimensions preserves aspect ratio and respects downscale limits", () => {
  // No downscale requested
  assert.deepEqual(
    calculateTargetDimensions(3000, 2000, "none"),
    { width: 3000, height: 2000, wasDownscaled: false }
  );

  // Dimensions already smaller than max limit
  assert.deepEqual(
    calculateTargetDimensions(1200, 800, "1920"),
    { width: 1200, height: 800, wasDownscaled: false }
  );

  // Landscape downscale to 1920
  const landscape = calculateTargetDimensions(3840, 2160, "1920");
  assert.equal(landscape.width, 1920);
  assert.equal(landscape.height, 1080);
  assert.equal(landscape.wasDownscaled, true);

  // Portrait downscale to 1280
  const portrait = calculateTargetDimensions(1800, 2400, "1280");
  assert.equal(portrait.width, 960);
  assert.equal(portrait.height, 1280);
  assert.equal(portrait.wasDownscaled, true);

  // 4K Ultra to 4096
  const ultra = calculateTargetDimensions(8000, 6000, "4096");
  assert.equal(ultra.width, 4096);
  assert.equal(ultra.height, 3072);
  assert.equal(ultra.wasDownscaled, true);
});

test("generateUniqueFilenames prevents duplicate filenames in ZIP export", () => {
  const items = [
    { outputFilename: "photo-compressed.jpg" },
    { outputFilename: "photo-compressed.jpg" },
    { outputFilename: "image-compressed.png" },
    { outputFilename: "photo-compressed.jpg" },
  ];

  const unique = generateUniqueFilenames(items);
  assert.deepEqual(unique, [
    "photo-compressed.jpg",
    "photo-compressed (1).jpg",
    "image-compressed.png",
    "photo-compressed (2).jpg",
  ]);
});

test("constants and presets match specification constraints", () => {
  assert.equal(MAX_FILES, 30);
  assert.equal(MAX_FILE_SIZE_BYTES, 25 * 1024 * 1024);
  assert.equal(DEFAULT_QUALITY, 75);
  assert.ok(SUPPORTED_MIME_TYPES.includes("image/jpeg"));
  assert.ok(SUPPORTED_MIME_TYPES.includes("image/png"));
  assert.ok(SUPPORTED_MIME_TYPES.includes("image/webp"));
  assert.ok(DOWNSCALE_PRESETS.some((p) => p.value === "1920"));
  assert.ok(FORMAT_PRESETS.some((f) => f.value === "webp"));
});

test("image fixtures exist in tests/fixtures outside /public", () => {
  assert.ok(fs.existsSync(path.resolve("tests/fixtures/large-photo.jpg")));
  assert.ok(fs.existsSync(path.resolve("tests/fixtures/transparent.png")));
  assert.ok(fs.existsSync(path.resolve("tests/fixtures/sample.webp")));
  assert.ok(fs.existsSync(path.resolve("tests/fixtures/tiny-optimized.jpg")));
  assert.ok(fs.existsSync(path.resolve("tests/fixtures/exif-orientation-6.jpg")));
  assert.ok(fs.existsSync(path.resolve("tests/fixtures/corrupted.jpg")));
  assert.ok(fs.existsSync(path.resolve("tests/fixtures/unsupported.svg")));
  assert.ok(fs.existsSync(path.resolve("tests/fixtures/huge-8000x6000.jpg")));
});
