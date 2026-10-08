import {
  createPageEntries,
  exportPdfPages,
  getPdfLoadErrorMessage,
  MAX_PDF_FILE_SIZE_BYTES,
  rotatePages,
} from "../../../components/utils/pdfPageUtils.js";

export const MAX_ORGANIZE_FILE_SIZE_BYTES = MAX_PDF_FILE_SIZE_BYTES;
export const MAX_UNDO_STEPS = 20;
export { createPageEntries, exportPdfPages, getPdfLoadErrorMessage, rotatePages };

export function getActivePageCount(pages) {
  return pages.filter((page) => !page.deleted).length;
}

export function movePage(pages, activeId, overId) {
  const fromIndex = pages.findIndex((page) => page.id === activeId);
  const toIndex = pages.findIndex((page) => page.id === overId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return pages;

  const reordered = [...pages];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);
  return reordered;
}

export function movePageBy(pages, pageId, direction) {
  const fromIndex = pages.findIndex((page) => page.id === pageId);
  const toIndex = fromIndex + direction;
  if (fromIndex < 0 || toIndex < 0 || toIndex >= pages.length) return pages;
  return movePage(pages, pageId, pages[toIndex].id);
}

export function markPagesDeleted(pages, pageIds) {
  const selected = new Set(pageIds);
  return pages.map((page) =>
    selected.has(page.id) ? { ...page, deleted: true } : page
  );
}

export function duplicatePage(pages, pageId, duplicateId) {
  const index = pages.findIndex((page) => page.id === pageId);
  if (index < 0) return pages;
  const original = pages[index];
  const duplicate = { ...original, id: duplicateId, deleted: false };
  const next = [...pages];
  next.splice(index + 1, 0, duplicate);
  return next;
}

export function pushHistory(history, pages) {
  return [...history, pages].slice(-MAX_UNDO_STEPS);
}

export function getOrganizedFilename(filename) {
  const baseName = filename.replace(/\.[^/.]+$/, "");
  return `${baseName}-organized.pdf`;
}
