import { degrees, PDFDocument } from "pdf-lib";

export const MAX_PDF_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export function createPageEntries(pageCount) {
  return Array.from({ length: pageCount }, (_, index) => ({
    id: `page-${index + 1}`,
    sourceIndex: index,
    rotation: 0,
    deleted: false,
  }));
}

export function normalizeRotation(rotation) {
  return ((rotation % 360) + 360) % 360;
}

export function normalizePdfRotation(rotation) {
  return normalizeRotation(Math.round(rotation / 90) * 90);
}

export function addPageRotation(currentRotation, additionalRotation) {
  return normalizePdfRotation(
    normalizePdfRotation(currentRotation) + additionalRotation
  );
}

export function rotatePages(pages, pageIds, rotation) {
  const selected = new Set(pageIds);
  const normalizedRotation = normalizeRotation(rotation);
  if (normalizedRotation === 0) return pages;

  return pages.map((page) =>
    selected.has(page.id)
      ? { ...page, rotation: normalizeRotation(page.rotation + normalizedRotation) }
      : page
  );
}

export function getPdfLoadErrorMessage(error) {
  if (
    error?.name === "PasswordException" ||
    error?.name === "NeedPasswordException" ||
    /password|encrypted/i.test(error?.message || "")
  ) {
    return "This PDF is encrypted or password-protected. Unlock it and try again.";
  }
  return "This PDF could not be opened. It may be corrupted or unsupported.";
}

export function applyAdditionalPageRotation(page, additionalRotation) {
  page.setRotation(
    degrees(addPageRotation(page.getRotation().angle, additionalRotation))
  );
}

export async function exportPdfPages(sourceBytes, pages) {
  const activePages = pages.filter((page) => !page.deleted);
  if (activePages.length === 0) {
    throw new Error("Keep at least one page before exporting.");
  }

  const source = await PDFDocument.load(sourceBytes);
  const output = await PDFDocument.create();
  const copiedPages = await output.copyPages(
    source,
    activePages.map((page) => page.sourceIndex)
  );

  copiedPages.forEach((page, index) => {
    applyAdditionalPageRotation(page, activePages[index].rotation);
    output.addPage(page);
  });

  return output.save();
}

export async function exportPdfRotations(sourceBytes, rotations) {
  const output = await PDFDocument.load(sourceBytes);
  const pages = output.getPages();

  if (pages.length !== rotations.length) {
    throw new Error("The page rotation list does not match the PDF.");
  }

  pages.forEach((page, index) => {
    applyAdditionalPageRotation(page, rotations[index]);
  });

  return output.save();
}
