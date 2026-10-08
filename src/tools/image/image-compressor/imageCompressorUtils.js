/**
 * imageCompressorUtils.js
 * Client-side image compression, format conversion, and ZIP archiving utilities.
 */

import { downloadZip } from "client-zip";

export const MAX_FILES = 30;
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
export const DEFAULT_QUALITY = 75;

export const SUPPORTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const SUPPORTED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
];

export const DOWNSCALE_PRESETS = [
  { value: "none", label: "Original dimensions" },
  { value: "4096", label: "4096 px (4K Ultra)" },
  { value: "2560", label: "2560 px (2K QHD)" },
  { value: "1920", label: "1920 px (Full HD)" },
  { value: "1280", label: "1280 px (HD / Web)" },
];

export const FORMAT_PRESETS = [
  { value: "original", label: "Keep original" },
  { value: "jpg", label: "Convert to JPG" },
  { value: "webp", label: "Convert to WebP" },
  { value: "png", label: "Keep PNG (lossless)" },
];

export function formatFileSize(bytes) {
  if (bytes == null || isNaN(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

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
  const lastDot = originalName.lastIndexOf(".");
  const baseName = lastDot > 0 ? originalName.slice(0, lastDot) : originalName;
  const origExt = lastDot > 0 ? originalName.slice(lastDot + 1).toLowerCase() : "";

  let ext = origExt;
  if (outputFormat === "original") {
    if (origExt === "jpeg" || origExt === "jpg") ext = "jpg";
    else if (origExt === "png") ext = "png";
    else if (origExt === "webp") ext = "webp";
    else ext = origExt || "jpg";
  } else if (outputFormat === "jpg" || outputFormat === "jpeg") {
    ext = "jpg";
  } else if (outputFormat === "webp") {
    ext = "webp";
  } else if (outputFormat === "png") {
    ext = "png";
  }

  return `${baseName}-compressed.${ext}`;
}

export function resolveTargetMimeType(originalType, outputFormat = "original") {
  if (outputFormat === "jpg" || outputFormat === "jpeg") return "image/jpeg";
  if (outputFormat === "webp") return "image/webp";
  if (outputFormat === "png") return "image/png";

  const lower = (originalType || "").toLowerCase();
  if (lower.includes("png")) return "image/png";
  if (lower.includes("webp")) return "image/webp";
  return "image/jpeg";
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

export function generateUniqueFilenames(items) {
  const seen = new Map();
  return items.map((item) => {
    const filename = item.outputFilename || item.name || "compressed-image.jpg";
    const lastDot = filename.lastIndexOf(".");
    const base = lastDot > 0 ? filename.slice(0, lastDot) : filename;
    const ext = lastDot > 0 ? filename.slice(lastDot) : "";

    const count = seen.get(filename) || 0;
    seen.set(filename, count + 1);

    if (count === 0) return filename;
    return `${base} (${count})${ext}`;
  });
}

export function isPngFile(file) {
  if (!file) return false;
  if (file.type === "image/png") return true;
  return /\.png$/i.test(file.name || "");
}

export function isAcceptedImage(file) {
  if (!file) return false;
  const type = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  if (type === "image/jpeg" || type === "image/png" || type === "image/webp") return true;
  return /\.(jpg|jpeg|png|webp)$/i.test(name);
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

/**
 * Packages multiple compressed items into a single ZIP archive.
 */
export async function createZipArchive(items) {
  const readyItems = items.filter((item) => item.blob && !item.error);
  if (readyItems.length === 0) {
    throw new Error("No compressed images available to download.");
  }

  const uniqueNames = generateUniqueFilenames(readyItems);

  const zipEntries = await Promise.all(
    readyItems.map(async (item, index) => {
      const buffer = await item.blob.arrayBuffer();
      return {
        name: uniqueNames[index],
        input: new Uint8Array(buffer),
      };
    })
  );

  const zipBlob = await downloadZip(zipEntries).blob();
  return zipBlob;
}
