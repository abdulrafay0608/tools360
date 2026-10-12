/**
 * imageConverterData.js
 * Formats, mime types, and quality defaults for the Image Converter tool.
 */

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
