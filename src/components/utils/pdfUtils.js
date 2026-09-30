import { PDFDocument } from "pdf-lib";

// ✅ Merge PDFs with error handling
export const mergePDFs = async (files, onProgress) => {
  if (!files.length) {
    throw new Error("Select at least one PDF file to merge.");
  }

  const mergedPdf = await PDFDocument.create();

  for (const [i, file] of files.entries()) {
    try {
      const fileBytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(fileBytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

      pages.forEach((page) => mergedPdf.addPage(page));
    } catch (err) {
      throw new Error(
        `Could not read ${file.name}. The file may be damaged or password-protected.`
      );
    }

    if (onProgress) {
      onProgress(Math.round(((i + 1) / files.length) * 100));
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
