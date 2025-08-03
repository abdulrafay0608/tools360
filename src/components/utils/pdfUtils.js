import { PDFDocument } from "pdf-lib";

// ✅ Merge PDFs with error handling
export const mergePDFs = async (files, onProgress) => {
  const mergedPdf = await PDFDocument.create();

  for (const [i, file] of files.entries()) {
    try {
      const fileBytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(fileBytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

      pages.forEach((page) => mergedPdf.addPage(page));
    } catch (err) {
      console.warn(`⛔ Failed to load or merge: ${file.name}`, err);
      continue; // skip this file and go to the next
    }

    // ✅ Optional: Call progress callback if passed
    if (onProgress) {
      onProgress(Math.round(((i + 1) / files.length) * 100)); // e.g. 30%, 50%
    }
  }

  const mergedPdfBytes = await mergedPdf.save();
  return new Blob([mergedPdfBytes], { type: "application/pdf" });
};

// ✅ Format file sizes from bytes to KB, MB, GB
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " bytes";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
  else return (bytes / 1073741824).toFixed(1) + " GB";
};
