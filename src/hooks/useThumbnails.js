// src/hooks/usePDFThumbnails.js
import { useState, useEffect, useMemo, useRef } from "react";
import {
  createPdfThumbnailLifecycle,
  createThumbnailGenerationGuard,
} from "./pdfThumbnailLifecycle.js";
import { PDF_PROCESSING_LIMITS, assertPdfPageCount, assertPdfViewport } from "@/utils/fileProcessingLimits";

const usePDFThumbnails = (files, pdfjs, mode = "file") => {
  const [thumbnails, setThumbnails] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const generationGuardRef = useRef(null);
  if (!generationGuardRef.current) generationGuardRef.current = createThumbnailGenerationGuard();

  // create a stable dependency for files
  const fileKeys = useMemo(() => {
    if (Array.isArray(files)) {
      return files.map((f) => f.name + "|" + f.size);
    } else if (files instanceof File) {
      return [files.name + "|" + files.size];
    }
    return [];
  }, [files]);

  useEffect(() => {
    let active = true;
    const lifecycle = createPdfThumbnailLifecycle();
    const thisGen = generationGuardRef.current.next();
    const isCurrent = () => generationGuardRef.current.isCurrent(thisGen, active);
    const generateThumbnails = async () => {
      if (
        !pdfjs ||
        ((!files || fileKeys.length === 0) &&
          (mode === "file" || mode === "page"))
      ) {
        setThumbnails([]);
        setTotalPages(0);
        setIsGenerating(false);
        return;
      }

      setIsGenerating(true);
      try {
        if (mode === "file") {
          // For merge tool - generate first page of each file
          const thumbs = [];
          for (const file of files) {
            if (!isCurrent()) break;
            let pdf = null;
            let loadingTask = null;
            try {
              const data = await file.arrayBuffer();
              if (!isCurrent()) break;
              loadingTask = pdfjs.getDocument({ data });
              lifecycle.addLoadingTask(loadingTask);
              pdf = await loadingTask.promise;
              assertPdfPageCount(pdf.numPages);
              lifecycle.removeLoadingTask(loadingTask);
              lifecycle.addDocument(pdf);
              if (!isCurrent()) break;
              const page = await pdf.getPage(1);
              if (!isCurrent()) break;
              const viewport = page.getViewport({ scale: 0.5 });
              assertPdfViewport(viewport, PDF_PROCESSING_LIMITS.maxThumbnailPixels);
              const canvas = document.createElement("canvas");
              canvas.width = Math.ceil(viewport.width);
              canvas.height = Math.ceil(viewport.height);
              const context = canvas.getContext("2d");
              if (!context) throw new Error("Canvas context unavailable");
              const renderTask = page.render({ canvasContext: context, viewport });
              lifecycle.addRenderTask(renderTask);
              await renderTask.promise;
              lifecycle.removeRenderTask(renderTask);
              thumbs.push(canvas.toDataURL());
            } catch (error) {
              if (!isCurrent()) break;
              console.error("Error generating thumbnail:", error);
              thumbs.push("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-family='Arial' font-size='12'%3EPDF%3C/text%3E%3C/svg%3E");
            } finally {
              if (loadingTask) lifecycle.removeLoadingTask(loadingTask);
              await lifecycle.destroyDocument(pdf);
            }
          }
          if (isCurrent()) setThumbnails(thumbs);
        } else {
          // For split tool - generate all pages of a single file
          const data = await files.arrayBuffer();
          if (!isCurrent()) return;
          const loadingTask = pdfjs.getDocument({ data });
          lifecycle.addLoadingTask(loadingTask);
          const pdf = await loadingTask.promise;
          assertPdfPageCount(pdf.numPages);
          lifecycle.removeLoadingTask(loadingTask);
          lifecycle.addDocument(pdf);
          if (!isCurrent()) return;
          setTotalPages(pdf.numPages);

          const thumbs = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            let renderTask = null;
            try {
              if (!isCurrent()) break;
              const page = await pdf.getPage(i);
              if (!isCurrent()) break;
              const viewport = page.getViewport({ scale: 0.5 });
              assertPdfViewport(viewport, PDF_PROCESSING_LIMITS.maxThumbnailPixels);

              const canvas = document.createElement("canvas");
              canvas.width = viewport.width;
              canvas.height = viewport.height;

              const context = canvas.getContext("2d");
              renderTask = page.render({
                canvasContext: context,
                viewport: viewport,
              });
              lifecycle.addRenderTask(renderTask);
              await renderTask.promise;
              lifecycle.removeRenderTask(renderTask);

              thumbs.push(canvas.toDataURL());
            } catch (error) {
              if (!isCurrent()) break;
              console.error(`Error generating thumbnail for page ${i}:`, error);
              thumbs.push(
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-family='Arial' font-size='12'%3EPDF%3C/text%3E%3C/svg%3E"
              );
            }
          }
          if (isCurrent()) {
            setThumbnails(thumbs);
            setTotalPages(pdf.numPages);
          }
          await lifecycle.destroyDocument(pdf);
        }
      } catch (error) {
        if (isCurrent()) console.error("Error generating thumbnails:", error);
      } finally {
        await lifecycle.cleanup();
        if (isCurrent()) setIsGenerating(false);
      }
    };
    generateThumbnails();
    return () => {
      active = false;
      generationGuardRef.current.next();
      void lifecycle.cleanup();
    };
  }, [files, fileKeys, pdfjs, mode]);

  return { thumbnails, isGenerating, totalPages };
};

export default usePDFThumbnails;
