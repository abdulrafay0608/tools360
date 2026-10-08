import { downloadZip } from "client-zip";

export const MAX_FILES = 30;
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

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

export function getOutputFilename(originalName, outputFormat = "original", suffix = "processed") {
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

  return `${baseName}-${suffix}.${ext}`;
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

export function generateUniqueFilenames(items, fallbackFilename = "processed-image.jpg") {
  const seen = new Map();
  return items.map((item) => {
    const filename = item.outputFilename || item.name || fallbackFilename;
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

export async function createZipArchive(
  items,
  {
    emptyMessage = "No processed images available to download.",
    fallbackFilename = "processed-image.jpg",
  } = {}
) {
  const readyItems = items.filter((item) => item.blob && !item.error);
  if (readyItems.length === 0) {
    throw new Error(emptyMessage);
  }

  const uniqueNames = generateUniqueFilenames(readyItems, fallbackFilename);

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
