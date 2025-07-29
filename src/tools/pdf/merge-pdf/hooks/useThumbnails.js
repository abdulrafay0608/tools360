// src/app/tools/pdf/merge-pdf/hooks/useThumbnails.js
import { useState, useEffect } from "react";

const useThumbnails = (files, pdfjs) => {
  const [thumbnails, setThumbnails] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const generateThumbnails = async () => {
      if (!pdfjs || files.length === 0) {
        setThumbnails([]);
        return;
      }

      setIsGenerating(true);
      try {
        const thumbs = await Promise.all(
          files.map(async (file) => {
            try {
              const data = await file.arrayBuffer();
              const pdf = await pdfjs.getDocument({ data }).promise;
              const page = await pdf.getPage(1);
              const viewport = page.getViewport({ scale: 0.5 });

              // Create canvas directly in memory
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
              // Return a placeholder image on error
              return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-family='Arial' font-size='12'%3EPDF%3C/text%3E%3C/svg%3E";
            }
          })
        );
        setThumbnails(thumbs);
      } catch (error) {
        console.error("Error generating thumbnails:", error);
      } finally {
        setIsGenerating(false);
      }
    };

    generateThumbnails();
  }, [files, pdfjs]);

  return { thumbnails, isGenerating };
};

export default useThumbnails;
