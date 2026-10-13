import test from "node:test";
import assert from "node:assert/strict";
import { initializePDFJS, PDFJS_LOAD_ERROR } from "../src/hooks/pdfjsLoader.js";

test("PDF.js initialization reports a worker/import failure", async () => {
  await assert.rejects(
    initializePDFJS({
      origin: "https://example.test",
      importPDFJS: async () => { throw new Error("worker unavailable"); },
    }),
    (error) => error.message === PDFJS_LOAD_ERROR && error.cause?.message === "worker unavailable"
  );
});

test("a retry can initialize PDF.js after a failed attempt", async () => {
  let attempts = 0;
  const pdfjsModule = { GlobalWorkerOptions: {} };
  const importPDFJS = async () => {
    attempts += 1;
    if (attempts === 1) throw new Error("transient import failure");
    return pdfjsModule;
  };

  await assert.rejects(initializePDFJS({ origin: "https://example.test", importPDFJS }));
  const recovered = await initializePDFJS({ origin: "https://example.test", importPDFJS });
  assert.equal(recovered, pdfjsModule);
  assert.equal(pdfjsModule.GlobalWorkerOptions.workerSrc, "https://example.test/pdf.worker.min.mjs");
  assert.equal(attempts, 2);
});

