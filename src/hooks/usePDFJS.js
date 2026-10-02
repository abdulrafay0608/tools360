// src/hooks/usePDFJS.js
import { useState, useEffect } from "react";

const usePDFJS = () => {
  const [pdfjs, setPdfjs] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsLoading(true);
      import("pdfjs-dist/build/pdf")
        .then((pdfjsModule) => {
          // Use local same-origin worker from /public or fallback to exact version CDN
          pdfjsModule.GlobalWorkerOptions.workerSrc =
            window.location.origin + "/pdf.worker.min.mjs";
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
