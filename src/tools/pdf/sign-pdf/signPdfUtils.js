/**
 * signPdfUtils.js
 * Browser-only utilities for generating signatures and embedding them into PDFs using pdf-lib.
 */

import { PDFDocument, degrees } from "pdf-lib";

export const SIGNATURE_IMAGE_LIMITS = Object.freeze({
  maxFileBytes: 10 * 1024 * 1024,
  maxDimension: 4096,
  maxPixelArea: 16 * 1024 * 1024,
});

const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** Detect a supported image from its bytes. File names and MIME declarations are ignored. */
export function detectSignatureImageFormat(bytes) {
  if (!bytes || bytes.length === 0) return null;
  if (PNG_HEADER.every((value, index) => bytes[index] === value)) return "png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return "webp";
  return null;
}

export function validateSignatureImageBytes(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length === 0) {
    throw new Error("The signature image is empty.");
  }
  if (bytes.length > SIGNATURE_IMAGE_LIMITS.maxFileBytes) {
    throw new Error("Signature images must be 10 MB or smaller.");
  }
  const format = detectSignatureImageFormat(bytes);
  if (!format) {
    throw new Error("Use a valid PNG, JPEG, or WebP signature image.");
  }
  return format;
}

async function readSignatureFile(file) {
  if (typeof FileReader === "undefined") return new Uint8Array(await file.arrayBuffer());
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The signature image could not be read."));
    reader.onabort = () => reject(new Error("Reading the signature image was cancelled."));
    reader.onload = () => resolve(new Uint8Array(reader.result));
    reader.readAsArrayBuffer(file);
  });
}

function assertDecodedDimensions(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    throw new Error("The signature image has invalid dimensions.");
  }
  if (width > SIGNATURE_IMAGE_LIMITS.maxDimension || height > SIGNATURE_IMAGE_LIMITS.maxDimension) {
    throw new Error("Signature images must be no larger than 4096 pixels on either side.");
  }
  if (width * height > SIGNATURE_IMAGE_LIMITS.maxPixelArea) {
    throw new Error("The signature image has too many pixels to process safely.");
  }
}

/** Decode and normalize an uploaded image to a PNG data URL entirely in the browser. */
export async function normalizeSignatureImage(file) {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new Error("Please choose a signature image.");
  }
  if (file.size === 0) throw new Error("The signature image is empty.");
  if (file.size > SIGNATURE_IMAGE_LIMITS.maxFileBytes) {
    throw new Error("Signature images must be 10 MB or smaller.");
  }

  const bytes = await readSignatureFile(file);
  const format = validateSignatureImageBytes(bytes);
  let bitmap = null;
  let objectUrl = null;
  try {
    if (typeof createImageBitmap === "function") {
      bitmap = await createImageBitmap(file);
    } else {
      objectUrl = URL.createObjectURL(file);
      bitmap = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("The signature image could not be decoded."));
        image.src = objectUrl;
      });
    }
    assertDecodedDimensions(bitmap.width, bitmap.height);

    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser cannot prepare this signature image.");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0);
    const dataUrl = canvas.toDataURL("image/png");
    if (!dataUrl.startsWith("data:image/png;base64,")) {
      throw new Error("The signature image could not be converted to PNG.");
    }
    return { dataUrl, format, width: bitmap.width, height: bitmap.height };
  } catch (error) {
    if (error?.message?.startsWith("The signature image") || error?.message?.startsWith("Signature images")) {
      throw error;
    }
    throw new Error("The signature image could not be decoded or converted.");
  } finally {
    if (bitmap && typeof bitmap.close === "function") bitmap.close();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

export function getCanvasPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  const touch = event.touches?.[0] || event;
  return {
    x: (touch.clientX - rect.left) * (canvas.width / rect.width),
    y: (touch.clientY - rect.top) * (canvas.height / rect.height),
  };
}

export function calculateSignaturePlacement(item, pageBox, pageRotation = 0) {
  const { x: cropX = 0, y: cropY = 0, width: pWidth, height: pHeight } = pageBox;
  const rX = item.xRatio;
  const rY = item.yRatio;
  const rW = item.widthRatio;
  const rH = item.heightRatio;
  const rotation = ((pageRotation % 360) + 360) % 360;
  if (rotation === 90) {
    return { x: cropX + rY * pWidth, y: cropY + rX * pHeight, width: rH * pWidth, height: rW * pHeight, rotate: 270 };
  }
  if (rotation === 180) {
    return { x: cropX + (1 - rX - rW) * pWidth, y: cropY + rY * pHeight, width: rW * pWidth, height: rH * pHeight, rotate: 180 };
  }
  if (rotation === 270) {
    return { x: cropX + (1 - rY - rH) * pWidth, y: cropY + (1 - rX - rW) * pHeight, width: rH * pWidth, height: rW * pHeight, rotate: 90 };
  }
  return { x: cropX + rX * pWidth, y: cropY + (1 - rY - rH) * pHeight, width: rW * pWidth, height: rH * pHeight, rotate: 0 };
}

export const FONT_STYLES = [
  {
    id: "style1",
    label: "Elegant Script",
    fontFamily: '"Brush Script MT", "Dancing Script", "Segoe Script", cursive',
  },
  {
    id: "style2",
    label: "Classic Cursive",
    fontFamily: '"Lucida Handwriting", "Great Vibes", "Apple Chancery", cursive',
  },
  {
    id: "style3",
    label: "Casual Hand",
    fontFamily: '"Comic Sans MS", "Caveat", "Chalkboard", cursive',
  },
];

export const COLOR_OPTIONS = [
  { id: "black", label: "Black", value: "#000000" },
  { id: "navy", label: "Navy Blue", value: "#0f2b5c" },
  { id: "blue", label: "Blue", value: "#1d4ed8" },
  { id: "red", label: "Red", value: "#b91c1c" },
];

/**
 * Generates a transparent PNG data URL from typed text using HTML5 Canvas.
 * @param {string} text - Signature text
 * @param {string} fontId - Chosen font style id
 * @param {string} color - Hex color code
 * @returns {string} Data URL of transparent PNG
 */
export function generateTypedSignature(text, fontId = "style1", color = "#0f2b5c") {
  const fontObj = FONT_STYLES.find((f) => f.id === fontId) || FONT_STYLES[0];
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const fontSize = 72;
  ctx.font = `italic ${fontSize}px ${fontObj.fontFamily}`;

  const metrics = ctx.measureText(text || "Signature");
  const width = Math.max(300, Math.ceil(metrics.width + 40));
  const height = 140;

  canvas.width = width;
  canvas.height = height;

  ctx.clearRect(0, 0, width, height);
  ctx.font = `italic ${fontSize}px ${fontObj.fontFamily}`;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(text || "Signature", width / 2, height / 2);

  return canvas.toDataURL("image/png");
}

/**
 * Generates a date stamp PNG data URL.
 * @param {string} dateString
 * @param {string} color
 * @returns {string} Data URL
 */
export function generateDateStamp(dateString, color = "#000000") {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const fontSize = 32;
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;

  const metrics = ctx.measureText(dateString);
  const width = Math.ceil(metrics.width + 30);
  const height = 60;

  canvas.width = width;
  canvas.height = height;

  ctx.clearRect(0, 0, width, height);
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(dateString, width / 2, height / 2);

  return canvas.toDataURL("image/png");
}

/**
 * Converts a data URL into Uint8Array for pdf-lib embedding.
 * @param {string} dataUrl
 * @returns {Uint8Array}
 */
export function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.split(",")[1];
  if (!base64) throw new Error("The signature image data is invalid.");
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Embeds all placed signatures onto their respective PDF pages.
 *
 * @param {File} pdfFile - Original PDF file
 * @param {Array<{ id: string, pageNum: number, dataUrl: string, xRatio: number, yRatio: number, widthRatio: number, heightRatio: number }>} placedItems
 * @returns {Promise<Blob>} Signed PDF Blob
 */
export async function embedSignaturesIntoPdf(pdfFile, placedItems) {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  // Group items by page number
  const itemsByPage = new Map();
  for (const item of placedItems) {
    if (!itemsByPage.has(item.pageNum)) {
      itemsByPage.set(item.pageNum, []);
    }
    itemsByPage.get(item.pageNum).push(item);
  }

  for (const [pageNum, items] of itemsByPage.entries()) {
    if (pageNum > pdfDoc.getPageCount()) continue;
    const page = pdfDoc.getPage(pageNum - 1);
    const cropBox = page.getCropBox();
    const pageRotation = page.getRotation().angle || 0;

    for (const item of items) {
      const imageBytes = dataUrlToUint8Array(item.dataUrl);
      const mimeType = (item.dataUrl.match(/^data:([^;,]+)/i) || [])[1]?.toLowerCase();
      const embeddedImage = mimeType === "image/jpeg"
        ? await pdfDoc.embedJpg(imageBytes)
        : await pdfDoc.embedPng(imageBytes);
      const placement = calculateSignaturePlacement(item, cropBox, pageRotation);

      page.drawImage(embeddedImage, {
        x: placement.x,
        y: placement.y,
        width: placement.width,
        height: placement.height,
        rotate: degrees(placement.rotate),
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}
