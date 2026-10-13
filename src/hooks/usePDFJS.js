// src/hooks/usePDFJS.js
import { useState, useEffect, useCallback } from "react";

const usePDFJS = () => {
  const [pdfjs, setPdfjs] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsLoading(true);
      import("pdfjs-dist/build/pdf")
        .then((pdfjsModule) => {
          // Use local same-origin worker from /public or fallback to exact version CDN
          pdfjsModule.GlobalWorkerOptions.workerSrc =
            window.location.origin + "/pdf.worker.min.mjs";
          setPdfjs(pdfjsModule);
          setError("");
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error loading PDF.js:", error);
          setPdfjs(null);
          setError("PDF processing could not start. Check your connection and retry.");
          setIsLoading(false);
        });
    }
  }, [attempt]);

  return { pdfjs, isLoading, error, retry };
};

export default usePDFJS;
