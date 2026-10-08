import {
  getOutputFilename as sharedGetOutputFilename,
  resolveTargetMimeType,
} from "../utils/imageSharedUtils.js";

export const DEFAULT_QUALITY = 80;

export const RESIZE_MODES = [
  { value: "pixels", label: "By Pixels" },
  { value: "percentage", label: "By Percentage" },
];

export const FIT_MODES = [
  { value: "stretch", label: "Stretch (ignore aspect ratio)" },
  { value: "contain", label: "Contain (add background)" },
  { value: "cover", label: "Cover (center crop)" },
];

export const RESIZE_PRESETS = [
  { label: "Custom", width: null, height: null },
  { label: "Instagram Post (1080x1080)", width: 1080, height: 1080 },
  { label: "Instagram Story (1080x1920)", width: 1080, height: 1920 },
  { label: "Facebook Cover (820x312)", width: 820, height: 312 },
  { label: "YouTube Thumbnail (1280x720)", width: 1280, height: 720 },
  { label: "X Header (1500x500)", width: 1500, height: 500 },
  { label: "Passport (600x600)", width: 600, height: 600 },
];

export function calculateFitGeometry(
  originalWidth,
  originalHeight,
  targetWidth,
  targetHeight,
  fitMode
) {
  if (fitMode === "stretch") {
    return {
      sourceX: 0,
      sourceY: 0,
      sourceWidth: originalWidth,
      sourceHeight: originalHeight,
      targetX: 0,
      targetY: 0,
      targetDrawWidth: targetWidth,
      targetDrawHeight: targetHeight,
    };
  }

  const sourceAspect = originalWidth / originalHeight;
  const targetAspect = targetWidth / targetHeight;
  if (fitMode === "contain") {
    const targetDrawWidth = sourceAspect > targetAspect
      ? targetWidth
      : targetHeight * sourceAspect;
    const targetDrawHeight = sourceAspect > targetAspect
      ? targetWidth / sourceAspect
      : targetHeight;
    return {
      sourceX: 0,
      sourceY: 0,
      sourceWidth: originalWidth,
      sourceHeight: originalHeight,
      targetX: (targetWidth - targetDrawWidth) / 2,
      targetY: (targetHeight - targetDrawHeight) / 2,
      targetDrawWidth,
      targetDrawHeight,
    };
  }

  const sourceWidth = sourceAspect > targetAspect
    ? originalHeight * targetAspect
    : originalWidth;
  const sourceHeight = sourceAspect > targetAspect
    ? originalHeight
    : originalWidth / targetAspect;
  return {
    sourceX: (originalWidth - sourceWidth) / 2,
    sourceY: (originalHeight - sourceHeight) / 2,
    sourceWidth,
    sourceHeight,
    targetX: 0,
    targetY: 0,
    targetDrawWidth: targetWidth,
    targetDrawHeight: targetHeight,
  };
}

export function getOutputFilename(originalName, outputFormat = "original") {
  return sharedGetOutputFilename(originalName, outputFormat, "resized");
}

export function calculateResizedDimensions(
  origWidth,
  origHeight,
  options
) {
  const {
    resizeMode = "pixels",
    percentage = 100,
    width = null,
    height = null,
    aspectLocked = true,
  } = options;

  let targetWidth = origWidth;
  let targetHeight = origHeight;

  if (resizeMode === "percentage") {
    const percentageValue = Number(percentage);
    const scale = Math.max(0.1, Math.min(2.0, (Number.isFinite(percentageValue) ? percentageValue : 100) / 100));
    targetWidth = Math.round(origWidth * scale);
    targetHeight = Math.round(origHeight * scale);
  } else if (resizeMode === "pixels") {
    const hasWidth = width != null && width > 0;
    const hasHeight = height != null && height > 0;

    if (aspectLocked) {
      if (hasWidth && hasHeight) {
        targetWidth = width;
        targetHeight = height;
      } else if (hasWidth && !hasHeight) {
        targetWidth = width;
        targetHeight = Math.round(origHeight * (width / origWidth));
      } else if (!hasWidth && hasHeight) {
        targetHeight = height;
        targetWidth = Math.round(origWidth * (height / origHeight));
      }
    } else {
      // Unlocked or both provided
      targetWidth = hasWidth ? width : origWidth;
      targetHeight = hasHeight ? height : origHeight;
    }
  }

  targetWidth = Math.max(1, Math.round(Number(targetWidth) || 1));
  targetHeight = Math.max(1, Math.round(Number(targetHeight) || 1));
  const scaleToCap = Math.min(1, 8192 / targetWidth, 8192 / targetHeight);

  return {
    width: Math.max(1, Math.floor(targetWidth * scaleToCap)),
    height: Math.max(1, Math.floor(targetHeight * scaleToCap)),
    wasCapped: scaleToCap < 1,
    wasUpscaled:
      Math.floor(targetWidth * scaleToCap) > origWidth ||
      Math.floor(targetHeight * scaleToCap) > origHeight,
  };
}

/**
 * Resizes a single image in the browser.
 */
export async function resizeSingleImage(file, options = {}) {
  const {
    quality = DEFAULT_QUALITY,
    outputFormat = "original",
    pngBackground = "#FFFFFF",
    fitMode = "cover",
  } = options;

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

  const {
    width: targetWidth,
    height: targetHeight,
    wasCapped,
    wasUpscaled,
  } = calculateResizedDimensions(
    origWidth,
    origHeight,
    options
  );

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

  if (targetMime === "image/jpeg") {
    ctx.fillStyle = pngBackground || "#FFFFFF";
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else {
    ctx.clearRect(0, 0, targetWidth, targetHeight);
  }

  const fit = calculateFitGeometry(
    origWidth,
    origHeight,
    targetWidth,
    targetHeight,
    fitMode
  );
  ctx.drawImage(
    bitmap,
    fit.sourceX,
    fit.sourceY,
    fit.sourceWidth,
    fit.sourceHeight,
    fit.targetX,
    fit.targetY,
    fit.targetDrawWidth,
    fit.targetDrawHeight
  );

  if (typeof bitmap.close === "function") {
    bitmap.close();
  }

  const qualityRatio = quality != null ? Math.max(0.01, Math.min(1.0, Number(quality) / 100)) : 0.8;
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
    throw new Error("Failed to encode resized image.");
  }

  const finalBlob = outputBlob;
  const finalSize = finalBlob.size;
  const outputFilename = getOutputFilename(file.name, outputFormat);

  return {
    blob: finalBlob,
    outputFilename,
    originalSize: file.size,
    resizedSize: finalSize,
    originalWidth: origWidth,
    originalHeight: origHeight,
    targetWidth,
    targetHeight,
    targetMime,
    wasCapped,
    wasUpscaled,
  };
}
