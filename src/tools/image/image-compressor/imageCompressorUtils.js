/**
 * imageCompressorUtils.js
 * Client-side image compression, format conversion, and ZIP archiving utilities.
 */

import {
  MAX_FILES,
  MAX_FILE_SIZE_BYTES,
  SUPPORTED_MIME_TYPES,
  SUPPORTED_EXTENSIONS,
  FORMAT_PRESETS,
  formatFileSize,
  getOutputFilename as sharedGetOutputFilename,
  resolveTargetMimeType,
  generateUniqueFilenames as sharedGenerateUniqueFilenames,
  isPngFile,
  isAcceptedImage,
  createZipArchive as sharedCreateZipArchive
} from "../utils/imageSharedUtils.js";

export {
  MAX_FILES,
  MAX_FILE_SIZE_BYTES,
  SUPPORTED_MIME_TYPES,
  SUPPORTED_EXTENSIONS,
  FORMAT_PRESETS,
  formatFileSize,
  resolveTargetMimeType,
  isPngFile,
  isAcceptedImage,
};

export const DEFAULT_QUALITY = 75;

export const DOWNSCALE_PRESETS = [
  { value: "none", label: "Original dimensions" },
  { value: "4096", label: "4096 px (4K Ultra)" },
  { value: "2560", label: "2560 px (2K QHD)" },
  { value: "1920", label: "1920 px (Full HD)" },
  { value: "1280", label: "1280 px (HD / Web)" },
];

export function calculateSavings(originalSize, compressedSize) {
  if (!originalSize || originalSize <= 0) {
    return { savedBytes: 0, percentageSaved: 0, isAlreadyOptimized: true };
  }
  if (compressedSize >= originalSize) {
    return { savedBytes: 0, percentageSaved: 0, isAlreadyOptimized: true };
  }
  const savedBytes = originalSize - compressedSize;
  const percentageSaved = Math.round((savedBytes / originalSize) * 100);
  return { savedBytes, percentageSaved, isAlreadyOptimized: false };
}

export function getOutputFilename(originalName, outputFormat = "original") {
  return sharedGetOutputFilename(originalName, outputFormat, "compressed");
}

export function generateUniqueFilenames(items) {
  return sharedGenerateUniqueFilenames(items, "compressed-image.jpg");
}

export function createZipArchive(items) {
  return sharedCreateZipArchive(items, {
    emptyMessage: "No compressed images available to download.",
    fallbackFilename: "compressed-image.jpg",
  });
}

export function calculateTargetDimensions(originalWidth, originalHeight, maxDimension) {
  const maxDim = Number(maxDimension);
  if (!maxDim || isNaN(maxDim) || maxDim <= 0 || (originalWidth <= maxDim && originalHeight <= maxDim)) {
    return { width: originalWidth, height: originalHeight, wasDownscaled: false };
  }

  if (originalWidth >= originalHeight) {
    const width = maxDim;
    const height = Math.round((originalHeight * maxDim) / originalWidth);
    return { width: Math.max(1, width), height: Math.max(1, height), wasDownscaled: true };
  } else {
    const height = maxDim;
    const width = Math.round((originalWidth * maxDim) / originalHeight);
    return { width: Math.max(1, width), height: Math.max(1, height), wasDownscaled: true };
  }
}



/**
 * Compresses a single image in the browser using HTML5 Canvas or OffscreenCanvas.
 * Strips EXIF/GPS metadata, respects EXIF orientation, supports downscaling and background fill.
 */
export async function compressSingleImage(file, options = {}) {
  const {
    quality = DEFAULT_QUALITY,
    outputFormat = "original",
    maxDimension = "none",
    pngBackground = "#FFFFFF",
  } = options;

  let bitmap;
  let usedOrientationFallback = false;

  try {
    // Respect EXIF orientation natively:
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
        reject(new Error("Corrupted or unsupported image file."));
      };
      img.src = objectUrl;
    });
  }

  const origWidth = bitmap.width;
  const origHeight = bitmap.height;

  if (!origWidth || !origHeight) {
    if (typeof bitmap.close === "function") bitmap.close();
    throw new Error("Unable to read image dimensions (file may be corrupted).");
  }

  const { width: targetWidth, height: targetHeight, wasDownscaled } =
    calculateTargetDimensions(origWidth, origHeight, maxDimension);

  const targetMime = resolveTargetMimeType(file.type, outputFormat);

  let canvas;
  let ctx;

  if (typeof OffscreenCanvas !== "undefined") {
    canvas = new OffscreenCanvas(targetWidth, targetHeight);
    ctx = canvas.getContext("2d");
  } else {
    canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    ctx = canvas.getContext("2d");
  }

  if (!ctx) {
    if (typeof bitmap.close === "function") bitmap.close();
    throw new Error("Canvas 2D context unavailable.");
  }

  // If converting to JPEG, fill solid background to preserve transparent PNGs gracefully
  if (targetMime === "image/jpeg") {
    ctx.fillStyle = pngBackground || "#FFFFFF";
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else {
    ctx.clearRect(0, 0, targetWidth, targetHeight);
  }

  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

  if (typeof bitmap.close === "function") {
    bitmap.close();
  }

  const qualityRatio = quality != null ? Math.max(0.01, Math.min(1.0, Number(quality) / 100)) : 0.75;
  const encodeQuality = targetMime === "image/png" ? undefined : qualityRatio;

  let outputBlob;
  if (typeof canvas.convertToBlob === "function") {
    outputBlob = await canvas.convertToBlob({
      type: targetMime,
      quality: encodeQuality,
    });
  } else {
    outputBlob = await new Promise((resolve) => {
      canvas.toBlob(
        (b) => resolve(b),
        targetMime,
        encodeQuality
      );
    });
  }

  if (!outputBlob) {
    throw new Error("Failed to encode compressed image.");
  }

  const isBigger = outputBlob.size >= file.size;
  const keepOriginal = isBigger && !wasDownscaled && (outputFormat === "original" || targetMime === file.type);

  const finalBlob = keepOriginal ? file : outputBlob;
  const isAlreadyOptimized = keepOriginal || (outputBlob.size >= file.size);
  const finalSize = finalBlob.size;

  const { savedBytes, percentageSaved } = calculateSavings(file.size, finalSize);
  const outputFilename = getOutputFilename(file.name, outputFormat);

  return {
    blob: finalBlob,
    outputFilename,
    originalSize: file.size,
    compressedSize: finalSize,
    savedBytes: isAlreadyOptimized ? 0 : savedBytes,
    percentageSaved: isAlreadyOptimized ? 0 : percentageSaved,
    isAlreadyOptimized,
    originalWidth: origWidth,
    originalHeight: origHeight,
    targetWidth,
    targetHeight,
    wasDownscaled,
    targetMime,
  };
}
