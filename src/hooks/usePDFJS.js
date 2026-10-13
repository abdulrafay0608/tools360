// src/hooks/usePDFJS.js
import { useState, useEffect, useCallback } from "react";
import { initializePDFJS, PDFJS_LOAD_ERROR } from "./pdfjsLoader.js";

const usePDFJS = () => {
  const [pdfjs, setPdfjs] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsLoading(true);
      initializePDFJS({
        importPDFJS: () => import("pdfjs-dist/build/pdf"),
        origin: window.location.origin,
      })
        .then((pdfjsModule) => {
          setPdfjs(pdfjsModule);
          setError("");
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error loading PDF.js:", error);
          setPdfjs(null);
          setError(error.message || PDFJS_LOAD_ERROR);
          setIsLoading(false);
        });
    }
  }, [attempt]);

  return { pdfjs, isLoading, error, retry };
};

export default usePDFJS;
