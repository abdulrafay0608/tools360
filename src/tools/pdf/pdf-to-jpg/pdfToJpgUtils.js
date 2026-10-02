/**
 * pdfToJpgUtils.js
 * Browser-only utilities for rendering PDF pages to JPG and zipping with client-zip.
 */

import { downloadZip } from "client-zip";

/**
 * Scale factors for resolution settings.
 */
export const SCALE_PRESETS = {
  "1x": 1.0,   // ~72-96 DPI
  "1.5x": 1.5, // ~150 DPI
  "2x": 2.0,   // ~300 DPI
};

/**
 * Quality levels for JPEG encoding.
 */
export const QUALITY_PRESETS = {
  low: 0.6,
  medium: 0.8,
  high: 0.95,
};

/**
 * Renders a single PDF page to a JPEG Blob using HTML5 Canvas.
 * @param {Object} page - PDFJS PageProxy
 * @param {number} scale - Scale factor
 * @param {number} quality - JPEG compression quality (0.0 to 1.0)
 * @returns {Promise<{ blob: Blob, dataUrl: string, width: number, height: number }>}
 */
export async function renderPageToJpg(page, scale = 1.0, quality = 0.8) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Canvas 2D context is not available.");

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  // Fill canvas with white background before rendering (PDFs might have transparent backgrounds)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: ctx,
    viewport,
  };

  await page.render(renderContext).promise;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to export page canvas to JPEG."));
          return;
        }
        resolve({
          blob,
          width: canvas.width,
          height: canvas.height,
        });
      },
      "image/jpeg",
      quality
    );
  });
}

/**
 * Generates a low-resolution thumbnail Data URL for preview grids.
 * @param {Object} page - PDFJS PageProxy
 * @param {number} maxDimension - Max width or height of thumbnail
 * @returns {Promise<string>} Data URL
 */
export async function generatePageThumbnail(page, maxDimension = 200) {
  const unscaledViewport = page.getViewport({ scale: 1.0 });
  const scale = Math.min(
    maxDimension / unscaledViewport.width,
    maxDimension / unscaledViewport.height,
    0.35
  );

  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return "";

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvasContext: ctx, viewport }).promise;

  return canvas.toDataURL("image/jpeg", 0.7);
}

/**
 * Renders multiple selected PDF pages to JPG and packages them in a ZIP archive.
 * @param {Object} pdfDoc - PDFJS DocumentProxy
 * @param {number[]} pageNumbers - Array of 1-based page numbers to convert
 * @param {number} scale - Scale factor
 * @param {number} quality - JPEG compression quality (0.0 to 1.0)
 * @param {string} baseFilename - Original PDF filename without extension
 * @param {Function} onProgress - Progress callback (current, total)
 * @returns {Promise<Blob>} ZIP Blob
 */
export async function convertPagesToZip(
  pdfDoc,
  pageNumbers,
  scale = 1.5,
  quality = 0.85,
  baseFilename = "document",
  onProgress = null
) {
  const zipEntries = [];
  const total = pageNumbers.length;

  for (let i = 0; i < total; i++) {
    const pageNum = pageNumbers[i];
    const page = await pdfDoc.getPage(pageNum);
    const { blob } = await renderPageToJpg(page, scale, quality);
    const buffer = await blob.arrayBuffer();

    const paddedNum = String(pageNum).padStart(String(pdfDoc.numPages).length, "0");
    const entryName = `${baseFilename}-page-${paddedNum}.jpg`;

    zipEntries.push({
      name: entryName,
      input: new Uint8Array(buffer),
    });

    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  const zipBlob = await downloadZip(zipEntries).blob();
  return zipBlob;
}
