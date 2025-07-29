// src/app/tools/pdf/merge-pdf/hooks/usePDFJS.js
import { useState, useEffect } from "react";

const usePDFJS = () => {
  const [pdfjs, setPdfjs] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsLoading(true);
      import("pdfjs-dist/build/pdf")
        .then((pdfjsModule) => {
          pdfjsModule.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
          setPdfjs(pdfjsModule);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error loading PDF.js:", error);
          setIsLoading(false);
        });
    }
  }, []);

  return { pdfjs, isLoading };
};

export default usePDFJS;
