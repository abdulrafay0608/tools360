const MB = 1024 * 1024;

// A 16 MP RGBA canvas needs about 64 MiB before browser and encoder overhead.
// These limits leave room for a decoded source and an output canvas on typical phones.
export const IMAGE_PROCESSING_LIMITS = Object.freeze({
  maxFiles: 20,
  maxFileBytes: 25 * MB,
  maxTotalBytes: 100 * MB,
  maxDimension: 8192,
  maxSourcePixels: 24 * 1024 * 1024,
  maxCanvasPixels: 16 * 1024 * 1024,
});

export const PDF_PROCESSING_LIMITS = Object.freeze({
  maxFiles: 20,
  maxFileBytes: 50 * MB,
  maxTotalBytes: 150 * MB,
  maxPages: 200,
  maxRenderPixels: 16 * 1024 * 1024,
  maxThumbnailPixels: 2 * 1024 * 1024,
});

export const SVG_PROCESSING_LIMITS = Object.freeze({
  maxFiles: 20,
  maxFileBytes: 5 * MB,
  maxTotalBytes: 20 * MB,
  maxMarkupBytes: 1024 * 1024,
  maxElements: 5000,
  maxDimension: 8192,
  maxCanvasPixels: 16 * 1024 * 1024,
});

export function formatProcessingBytes(bytes) {
  return `${Math.round(bytes / MB)} MB`;
}

export function getTotalFileBytes(files = []) {
  return Array.from(files).reduce((total, file) => total + (Number(file?.size) || 0), 0);
}

export function validateFileSelection({
  files,
  existingFiles = [],
  limits,
  isAccepted = () => true,
  label = "file",
}) {
  const selected = Array.from(files || []);
  const existing = Array.from(existingFiles || []);
  const accepted = [];
  const rejected = [];
  let totalBytes = getTotalFileBytes(existing);
  let totalCount = existing.length;

  for (const file of selected) {
    if (!file || !Number.isFinite(file.size) || file.size < 0) {
      rejected.push("A selected file could not be read.");
    } else if (!isAccepted(file)) {
      rejected.push(`${file.name || "This file"} is not a supported ${label}.`);
    } else if (file.size === 0) {
      rejected.push(`${file.name || "This file"} is empty.`);
    } else if (file.size > limits.maxFileBytes) {
      rejected.push(`${file.name || "This file"} exceeds the ${formatProcessingBytes(limits.maxFileBytes)} per-file limit.`);
    } else if (totalCount >= limits.maxFiles) {
      rejected.push(`Maximum ${limits.maxFiles} ${label}s allowed.`);
    } else if (totalBytes + file.size > limits.maxTotalBytes) {
      rejected.push(`Selected ${label}s exceed the ${formatProcessingBytes(limits.maxTotalBytes)} total browser-processing limit.`);
    } else {
      accepted.push(file);
      totalBytes += file.size;
      totalCount += 1;
    }
  }

  return { accepted, rejected, totalBytes, totalCount };
}

export function assertPixelArea(width, height, maxPixels, label = "image") {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    throw new Error(`The ${label} has invalid dimensions.`);
  }
  if (width * height > maxPixels) {
    throw new Error(`The ${label} is too large to process safely in this browser.`);
  }
}

export function assertImageDimensions(width, height, limits = IMAGE_PROCESSING_LIMITS) {
  if (width > limits.maxDimension || height > limits.maxDimension) {
    throw new Error(`Images must be no larger than ${limits.maxDimension} pixels on either side.`);
  }
  assertPixelArea(width, height, limits.maxSourcePixels, "source image");
}

export function assertCanvasDimensions(width, height, maxPixels = IMAGE_PROCESSING_LIMITS.maxCanvasPixels) {
  assertPixelArea(width, height, maxPixels, "output canvas");
}

export function assertPdfPageCount(pageCount, limits = PDF_PROCESSING_LIMITS) {
  if (!Number.isInteger(pageCount) || pageCount < 1) {
    throw new Error("The PDF has no readable pages.");
  }
  if (pageCount > limits.maxPages) {
    throw new Error(`PDFs are limited to ${limits.maxPages} pages for browser processing.`);
  }
}

export function assertPdfViewport(viewport, maxPixels = PDF_PROCESSING_LIMITS.maxRenderPixels) {
  assertCanvasDimensions(Math.ceil(viewport.width), Math.ceil(viewport.height), maxPixels);
}

export function assertSvgMarkup(svgText) {
  const bytes = new Blob([svgText || ""]).size;
  if (!bytes) throw new Error("SVG markup is empty.");
  if (bytes > SVG_PROCESSING_LIMITS.maxMarkupBytes) {
    throw new Error(`Pasted SVG markup must be ${formatProcessingBytes(SVG_PROCESSING_LIMITS.maxMarkupBytes)} or smaller.`);
  }
  const elements = (svgText.match(/<\s*[a-zA-Z][\w:-]*/g) || []).length;
  if (elements > SVG_PROCESSING_LIMITS.maxElements) {
    throw new Error(`SVG markup contains too many elements to process safely.`);
  }
}
