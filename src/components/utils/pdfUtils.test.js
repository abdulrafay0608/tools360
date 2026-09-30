import assert from "node:assert/strict";
import test from "node:test";
import { PDFDocument } from "pdf-lib";
import { formatFileSize, mergePDFs } from "./pdfUtils.js";
import { createDifferenceImageData } from "../../tools/pdf/compare-pdf/compareUtils.js";

async function createPdfFile(name, pageCount) {
  const document = await PDFDocument.create();
  for (let page = 0; page < pageCount; page += 1) {
    document.addPage();
  }

  const bytes = await document.save();
  return {
    name,
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  };
}

test("mergePDFs copies pages from every file and reports progress", async () => {
  const files = [
    await createPdfFile("one-page.pdf", 1),
    await createPdfFile("two-pages.pdf", 2),
  ];
  const progress = [];

  const result = await mergePDFs(files, (value) => progress.push(value));
  const mergedDocument = await PDFDocument.load(await result.arrayBuffer());

  assert.equal(mergedDocument.getPageCount(), 3);
  assert.deepEqual(progress, [50, 100]);
});

test("mergePDFs rejects unreadable files instead of returning a partial PDF", async () => {
  const invalidFile = {
    name: "broken.pdf",
    arrayBuffer: async () => new TextEncoder().encode("not a PDF").buffer,
  };

  await assert.rejects(mergePDFs([invalidFile]), /broken\.pdf/);
});

test("mergePDFs rejects an empty selection", async () => {
  await assert.rejects(mergePDFs([]), /at least one PDF/);
});

test("formatFileSize formats common boundaries", () => {
  assert.equal(formatFileSize(12), "12 bytes");
  assert.equal(formatFileSize(1024), "1.0 KB");
  assert.equal(formatFileSize(1048576), "1.0 MB");
});

test("createDifferenceImageData reports no differences for matching pixels", () => {
  const pixels = new Uint8ClampedArray([255, 255, 255, 255, 30, 30, 30, 255]);

  const result = createDifferenceImageData(pixels, pixels);

  assert.equal(result.changedPixels, 0);
  assert.equal(result.changedPercent, 0);
  assert.deepEqual([...result.pixels], [0, 0, 0, 0, 0, 0, 0, 0]);
});

test("createDifferenceImageData highlights pixels beyond the threshold", () => {
  const original = new Uint8ClampedArray([255, 255, 255, 255, 100, 100, 100, 255]);
  const revised = new Uint8ClampedArray([255, 255, 255, 255, 20, 100, 100, 255]);

  const result = createDifferenceImageData(original, revised, 36);

  assert.equal(result.changedPixels, 1);
  assert.equal(result.totalPixels, 2);
  assert.equal(result.changedPercent, 50);
  assert.deepEqual([...result.pixels], [0, 0, 0, 0, 190, 60, 46, 255]);
});

test("createDifferenceImageData rejects pages with mismatched dimensions", () => {
  assert.throws(
    () => createDifferenceImageData(new Uint8ClampedArray(4), new Uint8ClampedArray(8)),
    /matching RGBA dimensions/
  );
});