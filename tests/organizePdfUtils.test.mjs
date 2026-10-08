import test from "node:test";
import assert from "node:assert/strict";
import { PDFDocument, degrees } from "pdf-lib";
import {
  createPageEntries,
  duplicatePage,
  exportPdfPages,
  getActivePageCount,
  getOrganizedFilename,
  getPdfLoadErrorMessage,
  markPagesDeleted,
  movePage,
  movePageBy,
  pushHistory,
  rotatePages,
} from "../src/tools/pdf/organize-pdf/organizePdfUtils.js";

test("page operations reorder, mark deleted, rotate and duplicate entries", () => {
  const pages = createPageEntries(4);
  const reordered = movePage(pages, "page-1", "page-3");
  assert.deepEqual(
    reordered.map((page) => page.sourceIndex),
    [1, 2, 0, 3]
  );

  const moved = movePageBy(reordered, "page-3", 1);
  assert.deepEqual(
    moved.map((page) => page.sourceIndex),
    [1, 0, 2, 3]
  );

  const rotated = rotatePages(moved, ["page-2"], -90);
  assert.equal(rotated[0].rotation, 270);
  const deleted = markPagesDeleted(rotated, ["page-3"]);
  assert.equal(deleted.find((page) => page.id === "page-3").deleted, true);
  assert.equal(getActivePageCount(deleted), 3);

  const duplicated = duplicatePage(deleted, "page-4", "duplicate-1");
  assert.deepEqual(
    duplicated.slice(-2).map((page) => page.sourceIndex),
    [3, 3]
  );
});

test("history is limited to the most recent twenty changes", () => {
  const history = Array.from({ length: 25 }, (_, index) => [index]);
  const next = pushHistory(history, ["current"]);
  assert.equal(next.length, 20);
  assert.deepEqual(next[0], [6]);
  assert.deepEqual(next.at(-1), ["current"]);
});

test("filename retains the original name and adds the organized suffix", () => {
  assert.equal(getOrganizedFilename("report.final.pdf"), "report.final-organized.pdf");
});

test("PDF load errors distinguish encrypted from corrupted documents", () => {
  assert.match(
    getPdfLoadErrorMessage({ name: "PasswordException" }),
    /encrypted or password-protected/
  );
  assert.match(
    getPdfLoadErrorMessage(new Error("Invalid PDF")),
    /corrupted or unsupported/
  );
});

test("export applies additional rotation, selected order, deletion and duplicates", async () => {
  const source = await PDFDocument.create();
  const rotations = [0, 90, 180, 270, 0, 0];
  for (let index = 0; index < rotations.length; index += 1) {
    const page = source.addPage([400 + index * 10, 600]);
    page.setRotation(degrees(rotations[index]));
  }

  const pages = createPageEntries(6);
  const reordered = movePage(pages, "page-1", "page-4");
  const deleted = markPagesDeleted(reordered, ["page-2"]);
  const rotated = rotatePages(deleted, ["page-3"], 90);
  const duplicated = duplicatePage(rotated, "page-5", "duplicate-5");

  const outputBytes = await exportPdfPages(await source.save(), duplicated);
  const output = await PDFDocument.load(outputBytes);
  const outputPages = output.getPages();

  assert.equal(outputPages.length, 6);
  assert.deepEqual(
    outputPages.map((page) => page.getSize().width),
    [420, 430, 400, 440, 440, 450]
  );
  assert.deepEqual(
    outputPages.map((page) => page.getRotation().angle),
    [270, 270, 0, 0, 0, 0]
  );
});

test("export refuses an empty active page list", async () => {
  await assert.rejects(
    exportPdfPages(new Uint8Array(), [{ id: "deleted", sourceIndex: 0, deleted: true }]),
    /Keep at least one page/
  );
});
