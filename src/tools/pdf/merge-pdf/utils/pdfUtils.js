// src/app/tools/pdf/merge-pdf/utils/pdfUtils.js
import { PDFDocument } from "pdf-lib";

export const mergePDFs = async (files) => {
  const mergedPdf = await PDFDocument.create();

  // Copy pages from each PDF
  for (const file of files) {
    const fileBytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(fileBytes);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }

  // Save merged PDF
  const mergedPdfBytes = await mergedPdf.save();
  return new Blob([mergedPdfBytes], { type: "application/pdf" });
};

export const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " bytes";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  else return (bytes / 1048576).toFixed(1) + " MB";
};
