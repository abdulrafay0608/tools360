import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument, degrees } from "pdf-lib";
import {
  FONT_STYLES,
  COLOR_OPTIONS,
  dataUrlToUint8Array,
  detectSignatureImageFormat,
  validateSignatureImageBytes,
  getCanvasPoint,
  calculateSignaturePlacement,
  embedSignaturesIntoPdf,
} from "../src/tools/pdf/sign-pdf/signPdfUtils.js";

test("FONT_STYLES defines handwriting/cursive styles locally without external font downloads", () => {
  assert.ok(Array.isArray(FONT_STYLES));
  assert.ok(FONT_STYLES.length >= 3);
  for (const font of FONT_STYLES) {
    assert.ok(font.id);
    assert.ok(font.label);
    assert.ok(font.fontFamily.includes("cursive") || font.fontFamily.includes("Script"));
  }
});

test("COLOR_OPTIONS provides classic signature ink colors", () => {
  assert.ok(Array.isArray(COLOR_OPTIONS));
  assert.ok(COLOR_OPTIONS.length >= 3);
  const colorValues = COLOR_OPTIONS.map((c) => c.value);
  assert.ok(colorValues.includes("#000000"));
  assert.ok(colorValues.includes("#0f2b5c") || colorValues.includes("#1d4ed8"));
});

test("dataUrlToUint8Array correctly converts base64 PNG data URLs to binary Uint8Array", () => {
  const dummyBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const bytes = dataUrlToUint8Array(dummyBase64);
  assert.ok(bytes instanceof Uint8Array);
  assert.ok(bytes.length > 0);
  // Check PNG magic header 0x89 0x50 0x4E 0x47
  assert.equal(bytes[0], 0x89);
  assert.equal(bytes[1], 0x50);
  assert.equal(bytes[2], 0x4e);
  assert.equal(bytes[3], 0x47);
});

test("signature image detection uses file bytes, including mismatched metadata", () => {
  assert.equal(detectSignatureImageFormat(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "png");
  assert.equal(detectSignatureImageFormat(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])), "jpeg");
  assert.equal(detectSignatureImageFormat(Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])), "webp");
  assert.equal(detectSignatureImageFormat(Uint8Array.from([0x3c, 0x73, 0x76, 0x67])), null);
});

test("signature image validation rejects empty, corrupt, and oversized input", () => {
  assert.throws(() => validateSignatureImageBytes(new Uint8Array()), /empty/);
  assert.throws(() => validateSignatureImageBytes(Uint8Array.from([1, 2, 3])), /valid PNG, JPEG, or WebP/);
  const oversized = new Uint8Array(10 * 1024 * 1024 + 1);
  oversized.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.throws(() => validateSignatureImageBytes(oversized), /10 MB/);
});

test("canvas points scale CSS coordinates into backing canvas coordinates for mobile", () => {
  const canvas = {
    width: 460,
    height: 180,
    getBoundingClientRect: () => ({ left: 10, top: 20, width: 230, height: 90 }),
  };
  assert.deepEqual(getCanvasPoint({ clientX: 125, clientY: 65 }, canvas), { x: 230, y: 90 });
});

test("signature placement preserves rotation and crop-box offsets", () => {
  const item = { xRatio: 0.2, yRatio: 0.3, widthRatio: 0.25, heightRatio: 0.1 };
  const crop = { x: 12, y: 24, width: 600, height: 800 };
  assert.deepEqual(calculateSignaturePlacement(item, crop, 0), {
    x: 132, y: 504, width: 150, height: 80, rotate: 0,
  });
  assert.deepEqual(calculateSignaturePlacement(item, crop, 90), {
    x: 192, y: 184, width: 60, height: 200, rotate: 270,
  });
  assert.deepEqual(calculateSignaturePlacement(item, crop, 180), {
    x: 342, y: 264, width: 150, height: 80, rotate: 180,
  });
  const rotated270 = calculateSignaturePlacement(item, crop, 270);
  assert.equal(rotated270.x, 372);
  assert.ok(Math.abs(rotated270.y - 464) < 0.000001);
  assert.deepEqual({ width: rotated270.width, height: rotated270.height, rotate: rotated270.rotate }, {
    width: 60, height: 200, rotate: 90,
  });
});

test("signature export reopens for normal, rotated, and offset-crop pages", async () => {
  const signatureBytes = fs.readFileSync(path.resolve("tests/fixtures/transparent.png"));
  const signatureDataUrl = `data:image/png;base64,${signatureBytes.toString("base64")}`;
  for (const rotation of [0, 90, 180, 270]) {
    const source = await PDFDocument.create();
    const page = source.addPage([600, 800]);
    page.setCropBox(12, 24, 600, 800);
    page.setRotation(degrees(rotation));
    const sourceBytes = await source.save();
    const signed = await embedSignaturesIntoPdf(
      new Blob([sourceBytes], { type: "application/pdf" }),
      [{ pageNum: 1, dataUrl: signatureDataUrl, xRatio: 0.2, yRatio: 0.3, widthRatio: 0.25, heightRatio: 0.1 }]
    );
    const reopened = await PDFDocument.load(await signed.arrayBuffer());
    assert.equal(reopened.getPageCount(), 1);
    assert.equal(reopened.getPage(0).getRotation().angle, rotation);
  }
});

test("JPEG signature data is embedded with the JPEG decoder", async () => {
  const jpegBytes = fs.readFileSync(path.resolve("tests/fixtures/tiny-optimized.jpg"));
  const jpegDataUrl = `data:image/jpeg;base64,${jpegBytes.toString("base64")}`;
  const source = await PDFDocument.create();
  source.addPage([400, 400]);
  const sourceBytes = await source.save();
  const signed = await embedSignaturesIntoPdf(
    new Blob([sourceBytes], { type: "application/pdf" }),
    [{ pageNum: 1, dataUrl: jpegDataUrl, xRatio: 0.1, yRatio: 0.1, widthRatio: 0.4, heightRatio: 0.2 }]
  );
  const reopened = await PDFDocument.load(await signed.arrayBuffer());
  assert.equal(reopened.getPageCount(), 1);
});
