import {
  degrees,
  PDFDocument,
  rgb,
  StandardFonts,
} from "pdf-lib";

export const MAX_PDF_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export const PAGE_NUMBER_FORMATS = [
  "number",
  "page-number",
  "number-of-total",
  "page-number-of-total",
];

export const PAGE_NUMBER_POSITIONS = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

const PAGE_NUMBER_FONT_MAP = {
  Helvetica: StandardFonts.Helvetica,
  Times: StandardFonts.TimesRoman,
  Courier: StandardFonts.Courier,
};

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

export function formatPageNumber(format, pageNumber, totalPages) {
  switch (format) {
    case "number":
      return String(pageNumber);
    case "page-number":
      return `Page ${pageNumber}`;
    case "number-of-total":
      return `${pageNumber} of ${totalPages}`;
    case "page-number-of-total":
      return `Page ${pageNumber} of ${totalPages}`;
    default:
      throw new Error("Choose a supported page number format.");
  }
}

export function getPageNumberRange(totalPages, options) {
  const { fromPage, toPage, skipFirstPage = false } = options;
  const first = Number(fromPage);
  const last = Number(toPage);
  if (
    !Number.isInteger(first) ||
    !Number.isInteger(last) ||
    first < 1 ||
    last > totalPages ||
    first > last
  ) {
    return {
      pages: [],
      error: `Enter a valid page range from 1 to ${totalPages}, with the start page no later than the end page.`,
    };
  }

  const pages = Array.from(
    { length: last - first + 1 },
    (_, index) => first + index
  ).filter((pageNumber) => !(skipFirstPage && pageNumber === 1));

  if (pages.length === 0) {
    return {
      pages,
      error: "The selected options do not include any pages to number.",
    };
  }

  return { pages, error: "" };
}

export function getPageNumberForPage(pageNumber, totalPages, options) {
  if (!Number.isInteger(Number(options.startNumber)) || Number(options.startNumber) < 1) {
    return null;
  }
  const range = getPageNumberRange(totalPages, options);
  if (range.error) return null;
  const rangeIndex = range.pages.indexOf(pageNumber);
  if (rangeIndex < 0) return null;
  return Number(options.startNumber) + rangeIndex;
}

export function getMirroredPageNumberPosition(position, pageNumber, mirrorOddEven) {
  if (!mirrorOddEven || pageNumber % 2 === 1) return position;
  if (position.endsWith("-left")) return position.replace("-left", "-right");
  if (position.endsWith("-right")) return position.replace("-right", "-left");
  return position;
}

export function getVisualPageDimensions(pageBox, rotation) {
  const normalized = normalizePdfRotation(rotation);
  return normalized === 90 || normalized === 270
    ? { width: pageBox.height, height: pageBox.width }
    : { width: pageBox.width, height: pageBox.height };
}

export function getPageNumberPosition({
  pageBox,
  rotation,
  position,
  margin,
  fontSize,
  textWidth,
}) {
  if (!PAGE_NUMBER_POSITIONS.includes(position)) {
    throw new Error("Choose a supported page number position.");
  }

  const normalizedRotation = normalizePdfRotation(rotation);
  const visual = getVisualPageDimensions(pageBox, normalizedRotation);
  const horizontal = position.split("-")[1];
  const vertical = position.split("-")[0];
  const visualX =
    horizontal === "left"
      ? margin
      : horizontal === "right"
        ? visual.width - margin - textWidth
        : (visual.width - textWidth) / 2;
  const visualBaselineY =
    vertical === "top"
      ? margin + fontSize
      : visual.height - margin - fontSize * 0.2;
  const left = pageBox.x;
  const bottom = pageBox.y;
  const right = pageBox.x + pageBox.width;
  const top = pageBox.y + pageBox.height;

  let x;
  let y;
  switch (normalizedRotation) {
    case 90:
      x = left + visualBaselineY;
      y = bottom + visualX;
      break;
    case 180:
      x = right - visualX;
      y = bottom + visualBaselineY;
      break;
    case 270:
      x = right - visualBaselineY;
      y = top - visualX;
      break;
    default:
      x = left + visualX;
      y = top - visualBaselineY;
  }

  return {
    x,
    y,
    rotate: degrees(normalizedRotation),
    visualX,
    visualBaselineY,
    visualWidth: visual.width,
    visualHeight: visual.height,
  };
}

function parseHexColor(value) {
  const match = /^#([0-9a-f]{6})$/i.exec(value);
  if (!match) throw new Error("Choose a valid text color.");
  const color = match[1];
  return rgb(
    Number.parseInt(color.slice(0, 2), 16) / 255,
    Number.parseInt(color.slice(2, 4), 16) / 255,
    Number.parseInt(color.slice(4, 6), 16) / 255
  );
}

export async function exportPdfPageNumbers(sourceBytes, options) {
  const pdfDoc = await PDFDocument.load(sourceBytes);
  const pages = pdfDoc.getPages();
  const range = getPageNumberRange(pages.length, options);
  if (range.error) throw new Error(range.error);

  const startNumber = Number(options.startNumber);
  if (!Number.isInteger(startNumber) || startNumber < 1) {
    throw new Error("Start number must be a positive whole number.");
  }
  if (!Number.isInteger(options.fontSize) || options.fontSize < 8 || options.fontSize > 36) {
    throw new Error("Font size must be between 8 and 36 points.");
  }
  if (!Number.isFinite(options.margin) || options.margin < 0 || options.margin > 100) {
    throw new Error("Margin must be between 0 and 100 points.");
  }

  const fontName = PAGE_NUMBER_FONT_MAP[options.font];
  if (!fontName) throw new Error("Choose Helvetica, Times, or Courier.");
  const font = await pdfDoc.embedFont(fontName);
  const color = parseHexColor(options.color);

  range.pages.forEach((pageNumber, index) => {
    const page = pages[pageNumber - 1];
    const shownPageNumber = startNumber + index;
    const text = formatPageNumber(options.format, shownPageNumber, pages.length);
    const position = getMirroredPageNumberPosition(
      options.position,
      pageNumber,
      options.mirrorOddEven
    );
    const cropBox = page.getCropBox();
    const textWidth = font.widthOfTextAtSize(text, options.fontSize);
    const coordinates = getPageNumberPosition({
      pageBox: cropBox,
      rotation: page.getRotation().angle,
      position,
      margin: options.margin,
      fontSize: options.fontSize,
      textWidth,
    });
    page.drawText(text, {
      x: coordinates.x,
      y: coordinates.y,
      rotate: coordinates.rotate,
      font,
      size: options.fontSize,
      color,
    });
  });

  return pdfDoc.save();
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
