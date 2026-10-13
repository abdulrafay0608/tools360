import test from "node:test";
import assert from "node:assert/strict";
import {
  IMAGE_PROCESSING_LIMITS,
  assertCanvasDimensions,
  assertImageDimensions,
  assertPdfPageCount,
  assertSvgMarkup,
  validateFileSelection,
} from "../src/utils/fileProcessingLimits.js";

const file = (name, size, type = "image/png") => ({ name, size, type });

test("selection limits retain prior files and reject aggregate overflow", () => {
  const limits = { maxFiles: 3, maxFileBytes: 10, maxTotalBytes: 20 };
  const result = validateFileSelection({
    files: [file("okay.png", 5), file("too-many.png", 8)],
    existingFiles: [file("kept.png", 10)],
    limits,
    label: "image",
  });
  assert.deepEqual(result.accepted.map(({ name }) => name), ["okay.png"]);
  assert.equal(result.rejected.length, 1);
  assert.equal(result.totalBytes, 15);
});

test("selection limits reject empty, unsupported, and oversized files", () => {
  const result = validateFileSelection({
    files: [file("empty.png", 0), file("bad.txt", 2, "text/plain"), file("large.png", 11)],
    limits: { maxFiles: 3, maxFileBytes: 10, maxTotalBytes: 20 },
    isAccepted: (candidate) => candidate.type === "image/png",
    label: "image",
  });
  assert.equal(result.accepted.length, 0);
  assert.equal(result.rejected.length, 3);
});

test("image, canvas, PDF and SVG bounds reject unsafe work", () => {
  assert.throws(() => assertImageDimensions(9000, 10), /8192/);
  assert.throws(() => assertCanvasDimensions(5000, 5000), /too large/);
  assert.throws(() => assertPdfPageCount(201), /200 pages/);
  assert.throws(() => assertSvgMarkup("<svg>" + "<path/>".repeat(5001) + "</svg>"), /too many elements/);
});

test("representative image limit remains valid", () => {
  assert.doesNotThrow(() => assertImageDimensions(4000, 3000, IMAGE_PROCESSING_LIMITS));
});
