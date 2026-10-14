import test from "node:test";
import assert from "node:assert/strict";
import {
  detectImageFormat,
  getConvertedFilename,
  isAcceptedConvertInput,
  isPotentialTransparentFormat,
  resolveTargetMimeType,
  generateUniqueFilenames,
  TARGET_FORMATS,
  MAX_FILES,
  MAX_FILE_SIZE_BYTES,
  METADATA_BEHAVIOR,
} from "../src/tools/image/image-converter/imageConverterUtils.js";

test("detectImageFormat accurately identifies supported image formats", () => {
  assert.equal(detectImageFormat({ type: "image/jpeg", name: "photo.jpg" }), "JPG");
  assert.equal(detectImageFormat({ type: "image/jpeg", name: "photo.jpeg" }), "JPG");
  assert.equal(detectImageFormat({ type: "image/png", name: "graphic.png" }), "PNG");
  assert.equal(detectImageFormat({ type: "image/webp", name: "banner.webp" }), "WebP");
  assert.equal(detectImageFormat({ type: "image/gif", name: "anim.gif" }), "GIF");
  assert.equal(detectImageFormat({ type: "image/bmp", name: "bitmap.bmp" }), "BMP");
  assert.equal(detectImageFormat({ type: "image/x-ms-bmp", name: "bitmap.bmp" }), "BMP");
  assert.equal(detectImageFormat({ type: "image/avif", name: "modern.avif" }), "AVIF");
});

test("detectImageFormat rejects unsupported formats like SVG, PDF, HEIC", () => {
  assert.equal(detectImageFormat({ type: "image/svg+xml", name: "vector.svg" }), null);
  assert.equal(detectImageFormat({ type: "application/pdf", name: "doc.pdf" }), null);
  assert.equal(detectImageFormat({ type: "image/heic", name: "iphone.heic" }), null);
  assert.equal(detectImageFormat({ type: "text/plain", name: "notes.txt" }), null);
  assert.equal(detectImageFormat(null), null);
});

test("isAcceptedConvertInput returns true for supported inputs only", () => {
  assert.equal(isAcceptedConvertInput({ type: "image/jpeg", name: "test.jpg" }), true);
  assert.equal(isAcceptedConvertInput({ type: "image/png", name: "test.png" }), true);
  assert.equal(isAcceptedConvertInput({ type: "image/webp", name: "test.webp" }), true);
  assert.equal(isAcceptedConvertInput({ type: "image/gif", name: "test.gif" }), true);
  assert.equal(isAcceptedConvertInput({ type: "image/bmp", name: "test.bmp" }), true);
  assert.equal(isAcceptedConvertInput({ type: "image/avif", name: "test.avif" }), true);
  assert.equal(isAcceptedConvertInput({ type: "application/pdf", name: "test.pdf" }), false);
});

test("isPotentialTransparentFormat identifies PNG, WebP, GIF as transparency capable", () => {
  assert.equal(isPotentialTransparentFormat("PNG"), true);
  assert.equal(isPotentialTransparentFormat("WebP"), true);
  assert.equal(isPotentialTransparentFormat("GIF"), true);
  assert.equal(isPotentialTransparentFormat("JPG"), false);
  assert.equal(isPotentialTransparentFormat("BMP"), false);
});

test("getConvertedFilename replaces extension with target format extension", () => {
  assert.equal(getConvertedFilename("photo.png", "jpg"), "photo.jpg");
  assert.equal(getConvertedFilename("picture.jpeg", "png"), "picture.png");
  assert.equal(getConvertedFilename("vector.art.2026.png", "webp"), "vector.art.2026.webp");
  assert.equal(getConvertedFilename("image.webp", "jpg"), "image.jpg");
  assert.equal(getConvertedFilename("noext", "png"), "noext.png");
});

test("resolveTargetMimeType maps target formats to correct MIME types", () => {
  assert.equal(resolveTargetMimeType("jpg"), "image/jpeg");
  assert.equal(resolveTargetMimeType("jpeg"), "image/jpeg");
  assert.equal(resolveTargetMimeType("png"), "image/png");
  assert.equal(resolveTargetMimeType("webp"), "image/webp");
});

test("generateUniqueFilenames avoids naming collisions in ZIP archives", () => {
  const items = [
    { outputFilename: "image.jpg" },
    { outputFilename: "image.jpg" },
    { outputFilename: "image.jpg" },
    { outputFilename: "other.png" },
  ];
  const unique = generateUniqueFilenames(items);
  assert.deepEqual(unique, [
    "image.jpg",
    "image (1).jpg",
    "image (2).jpg",
    "other.png",
  ]);
});

test("constants enforce 30 files limit and 25 MB max size", () => {
  assert.equal(MAX_FILES, 30);
  assert.equal(MAX_FILE_SIZE_BYTES, 25 * 1024 * 1024);
  assert.equal(TARGET_FORMATS.length, 3);
});

test("metadata behavior distinguishes retained originals from re-encoded output", () => {
  assert.equal(METADATA_BEHAVIOR.RETAINED_ORIGINAL, "retained-original");
  assert.equal(METADATA_BEHAVIOR.STRIPPED_BY_REENCODE, "stripped-by-reencode");
});
