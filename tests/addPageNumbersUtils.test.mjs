import test from "node:test";
import assert from "node:assert/strict";
import { PDFDocument, degrees } from "pdf-lib";
import {
  exportPdfPageNumbers,
  formatPageNumber,
  getMirroredPageNumberPosition,
  getPageNumberForPage,
  getPageNumberPosition,
  getPageNumberRange,
} from "../src/components/utils/pdfPageUtils.js";

test("page number formats include all supported layouts", () => {
  assert.equal(formatPageNumber("number", 5, 12), "5");
  assert.equal(formatPageNumber("page-number", 5, 12), "Page 5");
  assert.equal(formatPageNumber("number-of-total", 5, 12), "5 of 12");
  assert.equal(formatPageNumber("page-number-of-total", 5, 12), "Page 5 of 12");
  assert.throws(() => formatPageNumber("unsupported", 1, 1), /supported/);
});

test("page range validates boundaries and skips the cover without consuming its number", () => {
  assert.deepEqual(
    getPageNumberRange(12, {
      fromPage: "1",
      toPage: "6",
      skipFirstPage: true,
    }),
    { pages: [2, 3, 4, 5, 6], error: "" }
  );
  assert.equal(
    getPageNumberForPage(2, 6, {
      fromPage: 1,
      toPage: 6,
      skipFirstPage: true,
      startNumber: 5,
    }),
    5
  );
  assert.equal(
    getPageNumberForPage(1, 6, {
      fromPage: 1,
      toPage: 6,
      skipFirstPage: true,
      startNumber: 5,
    }),
    null
  );
});

test("invalid, reversed, empty and out-of-bounds ranges are reported", () => {
  for (const options of [
    { fromPage: "0", toPage: "6" },
    { fromPage: "2", toPage: "1" },
    { fromPage: "1.5", toPage: "6" },
    { fromPage: "1", toPage: "13" },
    { fromPage: "", toPage: "6" },
  ]) {
    assert.match(getPageNumberRange(12, options).error, /valid page range/);
  }
  assert.match(
    getPageNumberRange(1, {
      fromPage: "1",
      toPage: "1",
      skipFirstPage: true,
    }).error,
    /do not include any pages/
  );
});

test("position math accounts for edge, center, text width and crop-box offsets", () => {
  const pageBox = { x: 10, y: 20, width: 200, height: 300 };
  const common = {
    pageBox,
    rotation: 0,
    margin: 10,
    fontSize: 10,
    textWidth: 30,
  };
  assert.deepEqual(
    getPageNumberPosition({ ...common, position: "top-left" }),
    {
      x: 20,
      y: 300,
      rotate: degrees(0),
      visualX: 10,
      visualBaselineY: 20,
      visualWidth: 200,
      visualHeight: 300,
    }
  );
  assert.equal(
    getPageNumberPosition({ ...common, position: "bottom-center" }).visualX,
    85
  );
  assert.equal(
    getPageNumberPosition({ ...common, position: "bottom-right" }).x,
    170
  );
  const expectedCoordinates = {
    "top-left": [20, 300],
    "top-center": [95, 300],
    "top-right": [170, 300],
    "bottom-left": [20, 32],
    "bottom-center": [95, 32],
    "bottom-right": [170, 32],
  };
  for (const [position, [x, y]] of Object.entries(expectedCoordinates)) {
    const coordinates = getPageNumberPosition({ ...common, position });
    assert.deepEqual([coordinates.x, coordinates.y], [x, y]);
  }
});

test("position math maps six visual corners onto 90/180/270 degree page boxes", () => {
  const pageBox = { x: 10, y: 20, width: 200, height: 300 };
  const common = {
    pageBox,
    margin: 10,
    fontSize: 10,
    textWidth: 30,
  };

  const at = (rotation, position) =>
    getPageNumberPosition({ ...common, rotation, position });

  assert.deepEqual(
    [at(90, "bottom-right").x, at(90, "bottom-right").y],
    [198, 280]
  );
  assert.deepEqual(
    [at(180, "bottom-left").x, at(180, "bottom-left").y],
    [200, 308]
  );
  assert.deepEqual(
    [at(270, "bottom-left").x, at(270, "bottom-left").y],
    [22, 310]
  );
  assert.equal(at(90, "top-left").rotate.angle, 90);
});

test("mirroring swaps left and right on even pages only", () => {
  assert.equal(getMirroredPageNumberPosition("bottom-left", 1, true), "bottom-left");
  assert.equal(getMirroredPageNumberPosition("top-left", 2, true), "top-right");
  assert.equal(getMirroredPageNumberPosition("bottom-right", 4, true), "bottom-left");
  assert.equal(getMirroredPageNumberPosition("top-center", 2, true), "top-center");
  assert.equal(getMirroredPageNumberPosition("top-left", 2, false), "top-left");
});

test("standard Helvetica, Times, and Courier fonts are embedded for export", async () => {
  const source = await PDFDocument.create();
  source.addPage([400, 600]);
  const sourceBytes = await source.save();

  for (const font of ["Helvetica", "Times", "Courier"]) {
    const outputBytes = await exportPdfPageNumbers(sourceBytes, {
      fromPage: 1,
      toPage: 1,
      startNumber: 1,
      format: "number",
      position: "bottom-center",
      font,
      fontSize: 12,
      color: "#123456",
      margin: 36,
      mirrorOddEven: false,
    });
    const output = await PDFDocument.load(outputBytes);
    assert.equal(output.getPageCount(), 1);
  }
});

test("export numbers only selected pages, preserves existing page rotations and crop box", async () => {
  const source = await PDFDocument.create();
  [0, 90, 180, 270, 0, 90].forEach((rotation, index) => {
    const page = source.addPage([500, 700]);
    page.setMediaBox(10, 20, 500, 700);
    page.setCropBox(35, 55, 420, 620);
    page.setRotation(degrees(rotation));
    page.drawText(`Source page ${index + 1}`, { x: 50, y: 100 });
  });
  const sourceBytes = await source.save();
  const outputBytes = await exportPdfPageNumbers(sourceBytes, {
    fromPage: 1,
    toPage: 6,
    skipFirstPage: true,
    startNumber: 5,
    format: "page-number-of-total",
    position: "bottom-center",
    font: "Helvetica",
    fontSize: 12,
    color: "#123456",
    margin: 24,
    mirrorOddEven: false,
  });
  const result = await PDFDocument.load(outputBytes);
  assert.deepEqual(
    result.getPages().map((page) => page.getRotation().angle),
    [0, 90, 180, 270, 0, 90]
  );
  assert.deepEqual(
    result.getPages().map((page) => page.getCropBox()),
    source.getPages().map((page) => page.getCropBox())
  );
  assert.ok(outputBytes.length > sourceBytes.length);
});
