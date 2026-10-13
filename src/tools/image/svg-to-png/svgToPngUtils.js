/**
 * svgToPngUtils.js
 * Client-side SVG sanitization, dimension math, canvas rendering, and PNG export.
 */

import {
  createZipArchive as sharedCreateZipArchive,
  formatFileSize,
  generateUniqueFilenames as sharedGenerateUniqueFilenames,
  SVG_BATCH_MAX_FILES,
  SVG_FILE_MAX_SIZE_BYTES,
  IMAGE_OUTPUT_MAX_DIMENSION,
  formatFileSizeLimit,
} from "../utils/imageToolUtils.js";
import { assertCanvasDimensions, assertPixelArea, assertSvgMarkup, SVG_PROCESSING_LIMITS } from "../../../utils/fileProcessingLimits.js";

export { formatFileSize, formatFileSizeLimit };

export const MAX_FILES = SVG_BATCH_MAX_FILES;
export const MAX_FILE_SIZE_BYTES = SVG_FILE_MAX_SIZE_BYTES;
export const DEFAULT_DIMENSION = 512;
export const MAX_DIMENSION = IMAGE_OUTPUT_MAX_DIMENSION;

export const SCALE_OPTIONS = [
  { value: "1", label: "1x (Original)" },
  { value: "2", label: "2x" },
  { value: "3", label: "3x" },
  { value: "4", label: "4x" },
];

/**
 * Computes output filename by replacing .svg with .png.
 */
export function getConvertedFilename(originalName = "svg-image.svg") {
  if (!originalName || originalName.trim() === "") return "svg-image.png";
  const trimmed = originalName.trim();
  if (/\.svg$/i.test(trimmed)) {
    return trimmed.replace(/\.svg$/i, ".png");
  }
  return `${trimmed}.png`;
}

/**
 * Parses numeric dimensions, handling px, pt, mm, em, etc.
 */
export function parseSvgDimension(val) {
  if (val == null) return null;
  const num = parseFloat(String(val).trim());
  return Number.isFinite(num) && num > 0 ? num : null;
}

/**
 * Parses viewBox string "minX minY width height".
 */
export function parseViewBox(viewBoxStr) {
  if (!viewBoxStr) return null;
  const parts = viewBoxStr
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  if (parts.length === 4 && Number.isFinite(parts[2]) && Number.isFinite(parts[3]) && parts[2] > 0 && parts[3] > 0) {
    return {
      minX: parts[0],
      minY: parts[1],
      width: parts[2],
      height: parts[3],
    };
  }
  return null;
}

/**
 * Calculates target output dimensions given original dimensions, options, and 8192px cap.
 */
export function calculateTargetDimensions(origWidth, origHeight, options = {}) {
  const {
    sizeOption = "original",
    scale = 1,
    customWidth = null,
  } = options;

  const validOrigW = Math.max(1, Math.round(origWidth || DEFAULT_DIMENSION));
  const validOrigH = Math.max(1, Math.round(origHeight || DEFAULT_DIMENSION));

  let targetW = validOrigW;
  let targetH = validOrigH;

  if (sizeOption === "scale") {
    const scaleFactor = Math.max(0.1, Math.min(10, Number(scale) || 1));
    targetW = Math.round(validOrigW * scaleFactor);
    targetH = Math.round(validOrigH * scaleFactor);
  } else if (sizeOption === "customWidth") {
    const customW = Math.max(1, Math.round(Number(customWidth) || validOrigW));
    targetW = customW;
    targetH = Math.max(1, Math.round((validOrigH / validOrigW) * customW));
  }

  // Cap at 8192px per side preserving aspect ratio
  const scaleToCap = Math.min(1, MAX_DIMENSION / targetW, MAX_DIMENSION / targetH);
  const finalW = Math.max(1, Math.floor(targetW * scaleToCap));
  const finalH = Math.max(1, Math.floor(targetH * scaleToCap));

  return {
    width: finalW,
    height: finalH,
    wasCapped: scaleToCap < 1,
  };
}

/**
 * Strips script tags, event handlers, foreignObject, external references from SVG.
 * Never inserts SVG markup into the page DOM.
 */
export function sanitizeAndParseSvg(svgText) {
  if (!svgText || typeof svgText !== "string" || svgText.trim().length === 0) {
    throw new Error("SVG file is empty.");
  }
  assertSvgMarkup(svgText);

  if (typeof DOMParser === "undefined") {
    // Fallback for non-browser environments / tests
    return {
      cleanSvgString: svgText,
      origWidth: DEFAULT_DIMENSION,
      origHeight: DEFAULT_DIMENSION,
      hasDefaultDimensions: true,
      removedCount: 0,
    };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");

  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    throw new Error("Invalid or corrupted SVG / XML document.");
  }

  const root = doc.documentElement;
  if (!root || root.tagName.toLowerCase() !== "svg") {
    throw new Error("Not a valid SVG image (root element is not <svg>).");
  }

  let removedCount = 0;

  // 1. Remove <script> elements
  const scripts = Array.from(doc.querySelectorAll("script"));
  for (const s of scripts) {
    s.parentNode?.removeChild(s);
    removedCount += 1;
  }

  // 2. Remove <foreignObject> elements
  const foreignObjects = Array.from(doc.querySelectorAll("foreignObject"));
  for (const fo of foreignObjects) {
    fo.parentNode?.removeChild(fo);
    removedCount += 1;
  }

  // 3. Scan all elements for inline event handlers and external references
  const allElements = Array.from(doc.querySelectorAll("*"));
  for (const el of allElements) {
    const attrs = Array.from(el.attributes);
    for (const attr of attrs) {
      const name = attr.name.toLowerCase();
      const val = attr.value;

      // Event handlers (on*)
      if (name.startsWith("on")) {
        el.removeAttribute(attr.name);
        removedCount += 1;
        continue;
      }

      // External links / javascript: in href, xlink:href, src
      if (
        name === "href" ||
        name === "xlink:href" ||
        name === "src" ||
        name.endsWith(":href")
      ) {
        if (/^\s*(javascript:|data:text\/html|https?:|\/\/)/i.test(val)) {
          el.removeAttribute(attr.name);
          removedCount += 1;
          continue;
        }
      }

      // Inline styles with external urls
      if (name === "style" && /url\s*\(\s*['"]?(https?:|\/\/)/i.test(val)) {
        el.removeAttribute(attr.name);
        removedCount += 1;
        continue;
      }
    }
  }

  // 4. Sanitize <style> tag content (strip @import and external url())
  const styles = Array.from(doc.querySelectorAll("style"));
  for (const style of styles) {
    let css = style.textContent || "";
    if (/@import\s+(url\()?['"]?(https?:|\/\/)[^;]+;?/gi.test(css) || /url\s*\(\s*['"]?(https?:|\/\/)/gi.test(css)) {
      css = css.replace(/@import\s+[^;]+;?/gi, "");
      css = css.replace(/url\s*\(\s*['"]?(https?:|\/\/)[^)]+['"]?\s*\)/gi, "none");
      style.textContent = css;
      removedCount += 1;
    }
  }

  // 5. Dimension extraction
  let origWidth = parseSvgDimension(root.getAttribute("width"));
  let origHeight = parseSvgDimension(root.getAttribute("height"));
  let hasDefaultDimensions = false;

  const viewBox = parseViewBox(root.getAttribute("viewBox"));

  if (!origWidth && viewBox) {
    origWidth = viewBox.width;
  }
  if (!origHeight && viewBox) {
    origHeight = viewBox.height;
  }

  if (!origWidth || !origHeight) {
    origWidth = DEFAULT_DIMENSION;
    origHeight = DEFAULT_DIMENSION;
    hasDefaultDimensions = true;
  }
  if (origWidth > SVG_PROCESSING_LIMITS.maxDimension || origHeight > SVG_PROCESSING_LIMITS.maxDimension) {
    throw new Error(`SVG dimensions must be no larger than ${SVG_PROCESSING_LIMITS.maxDimension} pixels on either side.`);
  }
  assertPixelArea(origWidth, origHeight, SVG_PROCESSING_LIMITS.maxCanvasPixels, "SVG image");

  // Explicitly set width, height, and viewBox on root for reliable canvas rasterization
  root.setAttribute("width", String(origWidth));
  root.setAttribute("height", String(origHeight));
  if (!root.getAttribute("viewBox")) {
    root.setAttribute("viewBox", `0 0 ${origWidth} ${origHeight}`);
  }

  const serializer = new XMLSerializer();
  const cleanSvgString = serializer.serializeToString(doc);

  return {
    cleanSvgString,
    origWidth,
    origHeight,
    hasDefaultDimensions,
    removedCount,
  };
}

/**
 * Renders sanitized SVG to Canvas and exports PNG Blob.
 * Uses <img> from Blob URL (never DOM insertion, scripts do not execute).
 */
export async function renderSvgToPng(cleanSvgString, targetWidth, targetHeight, backgroundColor = "transparent") {
  assertCanvasDimensions(targetWidth, targetHeight, SVG_PROCESSING_LIMITS.maxCanvasPixels);
  const blob = new Blob([cleanSvgString], { type: "image/svg+xml;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);

  let image;
  try {
    image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to render SVG image."));
      img.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas 2D context unavailable.");
  }

  if (backgroundColor && backgroundColor !== "transparent") {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else {
    ctx.clearRect(0, 0, targetWidth, targetHeight);
  }

  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  const pngBlob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error("Failed to encode PNG image."));
    }, "image/png");
  });

  return pngBlob;
}

/**
 * Unique filenames generator for ZIP downloads.
 */
export function generateUniqueFilenames(items) {
  return sharedGenerateUniqueFilenames(items, "svg-image.png");
}

/**
 * Packages multiple converted PNG items into a ZIP archive.
 */
export function createZipArchive(items) {
  return sharedCreateZipArchive(items, {
    emptyMessage: "No PNG images available to download.",
    fallbackFilename: "svg-image.png",
  });
}
