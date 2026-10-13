/**
 * imageConverterUtils.js
 * Client-side image format conversion, EXIF handling, and ZIP archiving utilities.
 */

import {
  createZipArchive as sharedCreateZipArchive,
  formatFileSize,
  formatFileSizeLimit,
  generateUniqueFilenames as sharedGenerateUniqueFilenames,
} from "../utils/imageToolUtils.js";
import { assertCanvasDimensions, assertImageDimensions } from "../../../utils/fileProcessingLimits.js";

export {
  formatFileSize,
  formatFileSizeLimit,
  IMAGE_FILE_MAX_SIZE_BYTES as MAX_FILE_SIZE_BYTES,
  IMAGE_BATCH_MAX_FILES as MAX_FILES,
} from "../utils/imageToolUtils.js";

export const DEFAULT_QUALITY = 85;

export const TARGET_FORMATS = [
  { value: "jpg", label: "JPG", ext: ".jpg", mime: "image/jpeg" },
  { value: "png", label: "PNG", ext: ".png", mime: "image/png" },
  { value: "webp", label: "WebP", ext: ".webp", mime: "image/webp" },
];

export const SUPPORTED_INPUT_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".bmp",
  ".gif",
  ".avif",
];

export const SUPPORTED_INPUT_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/bmp",
  "image/x-ms-bmp",
  "image/gif",
  "image/avif",
];

/**
 * Detects the input format normalized as "JPG", "PNG", "WebP", "GIF", "BMP", "AVIF".
 */
export function detectImageFormat(file) {
  if (!file) return null;
  const mime = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();

  if (mime === "image/jpeg" || /\.(jpe?g)$/i.test(name)) return "JPG";
  if (mime === "image/png" || /\.png$/i.test(name)) return "PNG";
  if (mime === "image/webp" || /\.webp$/i.test(name)) return "WebP";
  if (mime === "image/gif" || /\.gif$/i.test(name)) return "GIF";
  if (mime === "image/bmp" || mime === "image/x-ms-bmp" || /\.bmp$/i.test(name)) return "BMP";
  if (mime === "image/avif" || /\.avif$/i.test(name)) return "AVIF";

  return null;
}

/**
 * Returns true if format can contain transparent pixels.
 */
export function isPotentialTransparentFormat(format) {
  const normalized = (format || "").toUpperCase();
  return normalized === "PNG" || normalized === "WEBP" || normalized === "GIF";
}

/**
 * Checks if a file is an accepted input format.
 */
export function isAcceptedConvertInput(file) {
  if (!file) return false;
  return detectImageFormat(file) !== null;
}

/**
 * Computes output filename by replacing the extension with the target format.
 */
export function getConvertedFilename(originalName, targetFormat = "jpg") {
  if (!originalName) return `converted.${targetFormat === "jpeg" ? "jpg" : targetFormat}`;
  const lastDot = originalName.lastIndexOf(".");
  const baseName = lastDot > 0 ? originalName.slice(0, lastDot) : originalName;
  const ext = targetFormat === "jpeg" ? "jpg" : targetFormat.toLowerCase();
  return `${baseName}.${ext}`;
}

/**
 * Resolves target MIME type.
 */
export function resolveTargetMimeType(targetFormat = "jpg") {
  const lower = (targetFormat || "").toLowerCase();
  if (lower === "jpg" || lower === "jpeg") return "image/jpeg";
  if (lower === "png") return "image/png";
  if (lower === "webp") return "image/webp";
  return "image/jpeg";
}

/**
 * Generates unique filenames for export.
 */
export function generateUniqueFilenames(items) {
  return sharedGenerateUniqueFilenames(items, "converted-image.jpg");
}

/**
 * Packages multiple converted items into a ZIP archive.
 */
export function createZipArchive(items) {
  return sharedCreateZipArchive(items, {
    emptyMessage: "No converted images available to download.",
    fallbackFilename: "converted-image.jpg",
  });
}

/**
 * Converts a single image in the browser using HTML5 Canvas or OffscreenCanvas.
 * Preserves dimensions, strips metadata, respects EXIF orientation.
 * Skips files already in the target format.
 */
export async function convertSingleImage(file, options = {}) {
  const {
    targetFormat = "jpg",
    quality = DEFAULT_QUALITY,
    backgroundColor = "#FFFFFF",
  } = options;

  const originalFormat = detectImageFormat(file);
  if (!originalFormat) {
    throw new Error(`Unsupported image format: ${file.name || "Unknown file"}`);
  }

  const targetNormalized = targetFormat.toUpperCase() === "JPEG" ? "JPG" : targetFormat.toUpperCase();
  const isAlreadyInTargetFormat = originalFormat === targetNormalized;
  const targetMime = resolveTargetMimeType(targetFormat);
  const outputFilename = getConvertedFilename(file.name, targetFormat);

  // If already in target format, skip re-encoding
  if (isAlreadyInTargetFormat) {
    // Quick dimension read for UI display
    let width = 0;
    let height = 0;
    try {
      const bitmap = await createImageBitmap(file);
      width = bitmap.width;
      height = bitmap.height;
      assertImageDimensions(width, height);
      if (typeof bitmap.close === "function") bitmap.close();
    } catch (error) {
      throw new Error(error?.message || "Corrupted or unsupported image file.");
    }

    return {
      blob: file,
      outputFilename,
      originalFormat,
      targetFormat: targetNormalized,
      originalSize: file.size,
      convertedSize: file.size,
      width,
      height,
      isSkipped: true,
      note: `Already in ${targetNormalized} format (kept original)`,
      targetMime,
    };
  }

  // Load and decode image respecting EXIF orientation
  let bitmap;
  let usedOrientationFallback = false;

  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      usedOrientationFallback = true;
    }
  }

  if (usedOrientationFallback || !bitmap) {
    bitmap = await new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        if (originalFormat === "AVIF") {
          reject(new Error("AVIF decoding is not supported by your browser."));
        } else {
          reject(new Error("Corrupted or unsupported image file."));
        }
      };
      img.src = objectUrl;
    });
  }

  const width = bitmap.width;
  const height = bitmap.height;

  if (!width || !height) {
    if (typeof bitmap.close === "function") bitmap.close();
    throw new Error("Unable to read image dimensions (file may be corrupted).");
  }
  assertImageDimensions(width, height);
  assertCanvasDimensions(width, height);

  let canvas;
  let ctx;

  if (typeof OffscreenCanvas !== "undefined") {
    canvas = new OffscreenCanvas(width, height);
    ctx = canvas.getContext("2d");
  } else {
    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext("2d");
  }

  if (!ctx) {
    if (typeof bitmap.close === "function") bitmap.close();
    throw new Error("Canvas 2D context unavailable.");
  }

  // Handle transparency when target is JPG
  if (targetMime === "image/jpeg") {
    ctx.fillStyle = backgroundColor || "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }

  // Draw image at full original resolution (strips metadata)
  ctx.drawImage(bitmap, 0, 0, width, height);

  if (typeof bitmap.close === "function") {
    bitmap.close();
  }

  const qualityRatio = quality != null ? Math.max(0.01, Math.min(1.0, Number(quality) / 100)) : 0.85;
  const encodeQuality = targetMime === "image/png" ? undefined : qualityRatio;

  let outputBlob;
  if (typeof canvas.convertToBlob === "function") {
    outputBlob = await canvas.convertToBlob({
      type: targetMime,
      quality: encodeQuality,
    });
  } else {
    outputBlob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), targetMime, encodeQuality);
    });
  }

  if (!outputBlob) {
    throw new Error(`Failed to encode image to ${targetNormalized}.`);
  }

  return {
    blob: outputBlob,
    outputFilename,
    originalFormat,
    targetFormat: targetNormalized,
    originalSize: file.size,
    convertedSize: outputBlob.size,
    width,
    height,
    isSkipped: false,
    note: "",
    targetMime,
  };
}
