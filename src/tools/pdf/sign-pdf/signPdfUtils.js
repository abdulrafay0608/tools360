/**
 * signPdfUtils.js
 * Browser-only utilities for generating signatures and embedding them into PDFs using pdf-lib.
 */

import { PDFDocument, degrees } from "pdf-lib";

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
    const { width: pWidth, height: pHeight } = page.getSize();
    const pageRotation = page.getRotation().angle || 0;

    for (const item of items) {
      const pngBytes = dataUrlToUint8Array(item.dataUrl);
      const embeddedImage = await pdfDoc.embedPng(pngBytes);

      const rX = item.xRatio;
      const rY = item.yRatio;
      const rW = item.widthRatio;
      const rH = item.heightRatio;

      let drawX, drawY, drawW, drawH, drawRotation;

      if (pageRotation === 90) {
        drawW = rH * pWidth;
        drawH = rW * pHeight;
        drawX = rY * pWidth;
        drawY = rX * pHeight;
        drawRotation = degrees(270);
      } else if (pageRotation === 180) {
        drawW = rW * pWidth;
        drawH = rH * pHeight;
        drawX = (1 - rX - rW) * pWidth;
        drawY = rY * pHeight;
        drawRotation = degrees(180);
      } else if (pageRotation === 270) {
        drawW = rH * pWidth;
        drawH = rW * pHeight;
        drawX = (1 - rY - rH) * pWidth;
        drawY = (1 - rX - rW) * pHeight;
        drawRotation = degrees(90);
      } else {
        // Standard 0 deg rotation
        drawW = rW * pWidth;
        drawH = rH * pHeight;
        drawX = rX * pWidth;
        drawY = (1 - rY - rH) * pHeight;
        drawRotation = degrees(0);
      }

      page.drawImage(embeddedImage, {
        x: drawX,
        y: drawY,
        width: drawW,
        height: drawH,
        rotate: drawRotation,
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}
