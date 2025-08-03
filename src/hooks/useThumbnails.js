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
    const generateThumbnails = async () => {
      const thisGen = ++genRef.current; // increment generation ID
      if (
        !pdfjs ||
        ((!files || fileKeys.length === 0) &&
          (mode === "file" || mode === "page"))
      ) {
        setThumbnails([]);
        setTotalPages(0);
        return;
      }

      setIsGenerating(true);
      try {
        if (mode === "file") {
          // For merge tool - generate first page of each file
          const thumbs = await Promise.all(
            files.map(async (file) => {
              try {
                const data = await file.arrayBuffer();
                const pdf = await pdfjs.getDocument({ data }).promise;
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 0.5 });

                const canvas = document.createElement("canvas");
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                const context = canvas.getContext("2d");
                await page.render({
                  canvasContext: context,
                  viewport: viewport,
                }).promise;

                return canvas.toDataURL();
              } catch (error) {
                console.error("Error generating thumbnail:", error);
                return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-family='Arial' font-size='12'%3EPDF%3C/text%3E%3C/svg%3E";
              }
            })
          );
          if (thisGen === genRef.current) setThumbnails(thumbs);
        } else {
          // For split tool - generate all pages of a single file
          const data = await files.arrayBuffer();
          const pdf = await pdfjs.getDocument({ data }).promise;
          setTotalPages(pdf.numPages);

          const thumbs = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            try {
              const page = await pdf.getPage(i);
              const viewport = page.getViewport({ scale: 0.5 });

              const canvas = document.createElement("canvas");
              canvas.width = viewport.width;
              canvas.height = viewport.height;

              const context = canvas.getContext("2d");
              await page.render({
                canvasContext: context,
                viewport: viewport,
              }).promise;

              thumbs.push(canvas.toDataURL());
            } catch (error) {
              console.error(`Error generating thumbnail for page ${i}:`, error);
              thumbs.push(
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-family='Arial' font-size='12'%3EPDF%3C/text%3E%3C/svg%3E"
              );
            }
          }
          if (thisGen === genRef.current) {
            setThumbnails(thumbs);
            setTotalPages(pdf.numPages);
          }
        }
      } catch (error) {
        console.error("Error generating thumbnails:", error);
      } finally {
        if (thisGen === genRef.current) setIsGenerating(false);
      }
    };
    generateThumbnails();
  }, [fileKeys, pdfjs, mode]);

  return { thumbnails, isGenerating, totalPages };
};

export default usePDFThumbnails;
