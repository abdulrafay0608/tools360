// src/hooks/usePDFThumbnails.js
import { useState, useEffect, useMemo, useRef } from "react";

const usePDFThumbnails = (files, pdfjs, mode = "file") => {
  const [thumbnails, setThumbnails] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const genRef = useRef(0); // for stale-async guard

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
    const loadingTasks = new Set();
    const documents = new Set();
    const renderTasks = new Set();
    const thisGen = ++genRef.current;
    const isCurrent = () => active && thisGen === genRef.current;
    const destroyDocument = async (pdf) => {
      if (!pdf) return;
      documents.delete(pdf);
      try { await pdf.cleanup?.(); } catch { /* ignore cleanup failures */ }
      try { await pdf.destroy?.(); } catch { /* ignore destroy failures */ }
    };
    const cancelRender = (task) => {
      if (!task) return;
      try { task.cancel?.(); } catch { /* ignore cancellation failures */ }
      renderTasks.delete(task);
    };
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
              loadingTasks.add(loadingTask);
              pdf = await loadingTask.promise;
              loadingTasks.delete(loadingTask);
              documents.add(pdf);
              if (!isCurrent()) break;
              const page = await pdf.getPage(1);
              if (!isCurrent()) break;
              const viewport = page.getViewport({ scale: 0.5 });
              const canvas = document.createElement("canvas");
              canvas.width = Math.ceil(viewport.width);
              canvas.height = Math.ceil(viewport.height);
              const context = canvas.getContext("2d");
              if (!context) throw new Error("Canvas context unavailable");
              const renderTask = page.render({ canvasContext: context, viewport });
              renderTasks.add(renderTask);
              await renderTask.promise;
              renderTasks.delete(renderTask);
              thumbs.push(canvas.toDataURL());
            } catch (error) {
              if (!isCurrent()) break;
              console.error("Error generating thumbnail:", error);
              thumbs.push("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-family='Arial' font-size='12'%3EPDF%3C/text%3E%3C/svg%3E");
            } finally {
              if (loadingTask) loadingTasks.delete(loadingTask);
              await destroyDocument(pdf);
            }
          }
          if (isCurrent()) setThumbnails(thumbs);
        } else {
          // For split tool - generate all pages of a single file
          const data = await files.arrayBuffer();
          if (!isCurrent()) return;
          const loadingTask = pdfjs.getDocument({ data });
          loadingTasks.add(loadingTask);
          const pdf = await loadingTask.promise;
          loadingTasks.delete(loadingTask);
          documents.add(pdf);
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

              const canvas = document.createElement("canvas");
              canvas.width = viewport.width;
              canvas.height = viewport.height;

              const context = canvas.getContext("2d");
              renderTask = page.render({
                canvasContext: context,
                viewport: viewport,
              });
              renderTasks.add(renderTask);
              await renderTask.promise;
              renderTasks.delete(renderTask);

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
          await destroyDocument(pdf);
        }
      } catch (error) {
        if (isCurrent()) console.error("Error generating thumbnails:", error);
      } finally {
        for (const task of loadingTasks) {
          try { task.destroy?.(); } catch { /* ignore cancellation failures */ }
        }
        loadingTasks.clear();
        for (const pdf of [...documents]) {
          await destroyDocument(pdf);
        }
        if (isCurrent()) setIsGenerating(false);
      }
    };
    generateThumbnails();
    return () => {
      active = false;
      genRef.current += 1;
      for (const task of renderTasks) cancelRender(task);
      for (const task of loadingTasks) {
        try { task.destroy?.(); } catch { /* ignore cancellation failures */ }
      }
      loadingTasks.clear();
      for (const pdf of documents) {
        void destroyDocument(pdf);
      }
      documents.clear();
    };
  }, [files, fileKeys, pdfjs, mode]);

  return { thumbnails, isGenerating, totalPages };
};

export default usePDFThumbnails;
