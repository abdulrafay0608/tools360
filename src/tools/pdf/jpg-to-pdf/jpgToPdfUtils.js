/**
 * jpgToPdfUtils.js
 * Utility functions for converting image files into PDF document(s) using pdf-lib and client-zip.
 */

import { PDFDocument, PageSizes } from "pdf-lib";
import { downloadZip } from "client-zip";

/**
 * Loads an Image object from a File or Data URL to get width/height.
 * @param {File|string} source
 * @returns {Promise<{ img: HTMLImageElement, width: number, height: number }>}
 */
export function loadImageSource(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      resolve({
        img,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      });
    };
    img.onerror = () => reject(new Error("Failed to load image file."));

    if (typeof source === "string") {
      img.src = source;
    } else {
      const url = URL.createObjectURL(source);
      img.src = url;
    }
  });
}

/**
 * Draws image onto a canvas with optional rotation (0, 90, 180, 270) and returns JPEG Uint8Array.
 * @param {HTMLImageElement} img
 * @param {number} rotation
 * @returns {Promise<Uint8Array>}
 */
export async function processImageToJpegBytes(img, rotation = 0) {
  const canvas = document.createElement("canvas");
  const rad = (rotation * Math.PI) / 180;
  const is90or270 = rotation % 180 !== 0;

  const w = is90or270 ? img.naturalHeight : img.naturalWidth;
  const h = is90or270 ? img.naturalWidth : img.naturalHeight;

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  ctx.translate(w / 2, h / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode canvas to image blob"));
          return;
        }
        const buffer = await blob.arrayBuffer();
        resolve(new Uint8Array(buffer));
      },
      "image/jpeg",
      0.92
    );
  });
}

/**
 * Helper to embed one image into a PDF page according to page options.
 */
async function addImageToPdfPage(pdfDoc, item, options) {
  const { pageSize = "a4", orientation = "auto", margin = "small" } = options;
  const marginPt = margin === "none" ? 0 : margin === "small" ? 20 : 45;

  const { img } = await loadImageSource(item.file);
  const jpegBytes = await processImageToJpegBytes(img, item.rotation || 0);
  const pdfImage = await pdfDoc.embedJpg(jpegBytes);

  const imgW = pdfImage.width;
  const imgH = pdfImage.height;

  let pageW, pageH;

  if (pageSize === "fit") {
    pageW = imgW + marginPt * 2;
    pageH = imgH + marginPt * 2;
  } else {
    const baseDim = pageSize === "letter" ? PageSizes.Letter : PageSizes.A4;
    const targetW = baseDim[0];
    const targetH = baseDim[1];

    let isLandscape = false;
    if (orientation === "landscape") {
      isLandscape = true;
    } else if (orientation === "portrait") {
      isLandscape = false;
    } else {
      isLandscape = imgW > imgH;
    }

    if (isLandscape) {
      pageW = Math.max(targetW, targetH);
      pageH = Math.min(targetW, targetH);
    } else {
      pageW = Math.min(targetW, targetH);
      pageH = Math.max(targetW, targetH);
    }
  }

  const page = pdfDoc.addPage([pageW, pageH]);
  const availW = pageW - marginPt * 2;
  const availH = pageH - marginPt * 2;

  const scale = Math.min(availW / imgW, availH / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;

  const posX = marginPt + (availW - drawW) / 2;
  const posY = marginPt + (availH - drawH) / 2;

  page.drawImage(pdfImage, {
    x: posX,
    y: posY,
    width: drawW,
    height: drawH,
  });
}

/**
 * Converts all images into 1 single multi-page PDF Blob.
 */
export async function convertImagesToSinglePdf(imageItems, options = {}) {
  const pdfDoc = await PDFDocument.create();

  for (const item of imageItems) {
    await addImageToPdfPage(pdfDoc, item, options);
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}

/**
 * Converts each image into a separate PDF file and packages them into a ZIP Blob.
 */
export async function convertImagesToZipPdfs(imageItems, options = {}) {
  const zipEntries = [];

  for (let i = 0; i < imageItems.length; i++) {
    const item = imageItems[i];
    const pdfDoc = await PDFDocument.create();
    await addImageToPdfPage(pdfDoc, item, options);

    const pdfBytes = await pdfDoc.save();
    const cleanOriginalName = item.file.name.replace(/\.[^/.]+$/, "");
    const pdfName = `${cleanOriginalName || `page-${i + 1}`}.pdf`;

    zipEntries.push({
      name: pdfName,
      input: pdfBytes,
    });
  }

  const zipBlob = await downloadZip(zipEntries).blob();
  return zipBlob;
}
