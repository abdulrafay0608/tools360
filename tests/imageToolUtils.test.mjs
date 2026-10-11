import test from "node:test";
import assert from "node:assert/strict";
import {
  createZipArchive,
  formatFileSize,
  formatFileSizeLimit,
  generateUniqueFilenames,
  getOutputFilename,
  IMAGE_BATCH_MAX_FILES,
  IMAGE_FILE_MAX_SIZE_BYTES,
  IMAGE_OUTPUT_MAX_DIMENSION,
  IMAGE_REPROCESS_DEBOUNCE_MS,
  IMAGE_BATCH_YIELD_DELAY_MS,
  SVG_BATCH_MAX_FILES,
  SVG_FILE_MAX_SIZE_BYTES,
} from "../src/tools/image/utils/imageToolUtils.js";

test("shared image helpers preserve size formatting and the common file-size labels", () => {
  assert.equal(formatFileSize(0), "0 B");
  assert.equal(formatFileSize(1024), "1.0 KB");
  assert.equal(formatFileSize(1024 * 1024), "1.00 MB");
  assert.equal(formatFileSizeLimit(25 * 1024 * 1024), "25 MB");
  assert.equal(formatFileSizeLimit(5 * 1024 * 1024), "5 MB");
});

test("shared filename generation preserves suffixes and duplicate-safe ZIP names", () => {
  assert.equal(getOutputFilename("my.photo.jpeg", "original", "compressed"), "my.photo-compressed.jpg");
  assert.equal(getOutputFilename("photo.png", "webp", "resized"), "photo-resized.webp");
  assert.deepEqual(
    generateUniqueFilenames([
      { outputFilename: "photo.png" },
      { outputFilename: "photo.png" },
      { name: "other.jpg" },
      {},
    ], "fallback.png"),
    ["photo.png", "photo (1).png", "other.jpg", "fallback.png"]
  );
});

test("shared ZIP builder includes valid blobs and preserves duplicate-safe filenames", async () => {
  const archive = await createZipArchive([
    { outputFilename: "same.png", blob: new Blob(["first"]) },
    { outputFilename: "same.png", blob: new Blob(["second"]) },
  ]);
  assert.ok(archive.size > 0);
  await assert.rejects(
    createZipArchive([]),
    { message: "No processed images available to download." }
  );
});

test("image limits, output cap, and queue timing are centralized at existing values", () => {
  assert.equal(IMAGE_BATCH_MAX_FILES, 30);
  assert.equal(IMAGE_FILE_MAX_SIZE_BYTES, 25 * 1024 * 1024);
  assert.equal(SVG_BATCH_MAX_FILES, 20);
  assert.equal(SVG_FILE_MAX_SIZE_BYTES, 5 * 1024 * 1024);
  assert.equal(IMAGE_OUTPUT_MAX_DIMENSION, 8192);
  assert.equal(IMAGE_REPROCESS_DEBOUNCE_MS, 300);
  assert.equal(IMAGE_BATCH_YIELD_DELAY_MS, 10);
});
