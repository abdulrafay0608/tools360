export const PDFJS_LOAD_ERROR = "PDF processing could not start. Check your connection and retry.";

export async function initializePDFJS({ importPDFJS, origin }) {
  try {
    const pdfjsModule = await importPDFJS();
    pdfjsModule.GlobalWorkerOptions.workerSrc = `${origin}/pdf.worker.min.mjs`;
    return pdfjsModule;
  } catch (error) {
    const failure = new Error(PDFJS_LOAD_ERROR);
    failure.cause = error;
    throw failure;
  }
}
