import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument, degrees } from "pdf-lib";
import {
  addPageRotation,
  createPageEntries,
  exportPdfRotations,
  normalizePdfRotation,
  rotatePages,
} from "../src/components/utils/pdfPageUtils.js";

test("rotation actions wrap to right angles and leave unselected pages unchanged", () => {
  const pages = createPageEntries(5);
  const rotated = rotatePages(pages, pages.map((page) => page.id), 90);
  const onePageLeft = rotatePages(rotated, ["page-1"], -90);
  const oddPages180 = rotatePages(
    onePageLeft,
    ["page-1", "page-3", "page-5"],
    180
  );

  assert.deepEqual(
    oddPages180.map((page) => page.rotation),
    [180, 90, 270, 90, 270]
  );
  assert.deepEqual(pages.map((page) => page.rotation), [0, 0, 0, 0, 0]);
  assert.deepEqual(rotatePages(pages, ["missing-page"], 90), pages);
});

test("PDF rotations normalize to 0, 90, 180, or 270 degrees", () => {
  assert.equal(normalizePdfRotation(-90), 270);
  assert.equal(normalizePdfRotation(450), 90);
  assert.equal(normalizePdfRotation(181), 180);
  assert.equal(addPageRotation(270, 90), 0);
  assert.equal(addPageRotation(180, -90), 90);
});

test("export adds each selected rotation to existing page rotations", async () => {
  const source = await PDFDocument.create();
  const originalRotations = [0, 90, 180, 270, 90, 180];
  originalRotations.forEach((rotation, index) => {
    const page = source.addPage([400 + index * 10, 600]);
    page.setRotation(degrees(rotation));
  });

  const rotations = [90, -90, 180, 90, 0, 270];
  const outputBytes = await exportPdfRotations(await source.save(), rotations);
  const output = await PDFDocument.load(outputBytes);

  assert.deepEqual(
    output.getPages().map((page) => page.getRotation().angle),
    [90, 0, 0, 0, 90, 90]
  );
  assert.deepEqual(
    output.getPages().map((page) => page.getSize().width),
    [400, 410, 420, 430, 440, 450]
  );
});

test("rotating the existing rotated fixture preserves its page count and size", async () => {
  const fixturePath = path.resolve(
    "tests/fixtures/organize-six-page-rotated.pdf"
  );
  const fixtureBytes = fs.readFileSync(fixturePath);
  const source = await PDFDocument.load(fixtureBytes);
  const sourceRotations = source
    .getPages()
    .map((page) => normalizePdfRotation(page.getRotation().angle));
  assert.ok(sourceRotations.some((rotation) => rotation === 90));
  assert.ok(sourceRotations.some((rotation) => rotation === 270));

  const changes = [90, 180, 270, -90, 0, 180];
  const outputBytes = await exportPdfRotations(fixtureBytes, changes);
  const output = await PDFDocument.load(outputBytes);

  assert.deepEqual(
    output.getPages().map((page) => page.getRotation().angle),
    sourceRotations.map((rotation, index) =>
      addPageRotation(rotation, changes[index])
    )
  );
  assert.equal(output.getPageCount(), source.getPageCount());
  assert.ok(
    outputBytes.length < fixtureBytes.length * 1.15,
    `Output grew from ${fixtureBytes.length} to ${outputBytes.length} bytes`
  );
});

test("export preserves existing 0, 90, 180 and 270 degree rotations without rasterizing", async () => {
  const source = await PDFDocument.create();
  const originalRotations = [0, 90, 180, 270, 90, 180];
  originalRotations.forEach((rotation, index) => {
    const page = source.addPage([420 + index * 8, 600]);
    page.setRotation(degrees(rotation));
    page.drawText(`Keep vector page ${index + 1}`, { x: 20, y: 40 });
  });
  const sourceBytes = await source.save();

  const changes = [90, 0, -90, 180, 270, -180];
  const outputBytes = await exportPdfRotations(sourceBytes, changes);
  const output = await PDFDocument.load(outputBytes);

  assert.deepEqual(
    output.getPages().map((page) => page.getRotation().angle),
    originalRotations.map((rotation, index) =>
      addPageRotation(rotation, changes[index])
    )
  );
  assert.ok(
    outputBytes.length < sourceBytes.length * 1.15,
    `Output grew from ${sourceBytes.length} to ${outputBytes.length} bytes`
  );
});
