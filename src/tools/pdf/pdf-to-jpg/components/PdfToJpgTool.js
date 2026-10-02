"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { saveAs } from "file-saver";
import { FaImage, FaSlidersH, FaShieldAlt } from "react-icons/fa";
import FileUploader from "@/components/pdf/file/FileUploader";
import usePDFJS from "@/hooks/usePDFJS";
import PdfToJpgHeader from "./PdfToJpgHeader";
import PdfToJpgPageGrid from "./PdfToJpgPageGrid";
import PdfToJpgOptionsBar from "./PdfToJpgOptionsBar";
import {
  renderPageToJpg,
  generatePageThumbnail,
  convertPagesToZip,
  SCALE_PRESETS,
  QUALITY_PRESETS,
} from "../pdfToJpgUtils";

export default function PdfToJpgTool() {
  const [file, setFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [thumbnails, setThumbnails] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [quality, setQuality] = useState("medium");
  const [scalePreset, setScalePreset] = useState("1.5x");
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");

  const { pdfjs } = usePDFJS();
  const activeDocRef = useRef(null);

  /* ── Handle File Upload ── */
  const handleUpload = useCallback((uploadedFiles) => {
    const pdfFile = Array.from(uploadedFiles).find(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );

    if (!pdfFile) {
      setError("Please select a valid PDF file.");
      return;
    }

    setFile(pdfFile);
    setPdfDoc(null);
    setTotalPages(0);
    setThumbnails([]);
    setSelectedPages([]);
    setError("");
  }, []);

  /* ── Clear File ── */
  const handleClear = useCallback(() => {
    setFile(null);
    setPdfDoc(null);
    setTotalPages(0);
    setThumbnails([]);
    setSelectedPages([]);
    setError("");
    setProgress(null);
    setIsConverting(false);
  }, []);

  /* ── Load PDF Document via PDF.js ── */
  useEffect(() => {
    if (!pdfjs || !file) return undefined;

    let isActive = true;
    setError("");

    (async () => {
      try {
        const buffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: buffer });
        activeDocRef.current = loadingTask;
        const doc = await loadingTask.promise;

        if (isActive) {
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          // By default, select all pages
          const allNums = Array.from({ length: doc.numPages }, (_, i) => i + 1);
          setSelectedPages(allNums);
          setThumbnails(new Array(doc.numPages).fill(""));
        }
      } catch (err) {
        if (isActive) {
          console.error("PDF load error:", err);
          if (err?.name === "PasswordException") {
            setError(
              "Password-protected PDFs are not supported. Please remove the password and try again."
            );
          } else {
            setError(
              "This PDF file could not be opened or is corrupted. Please try another file."
            );
          }
        }
      }
    })();

    return () => {
      isActive = false;
      if (activeDocRef.current?.destroy) {
        activeDocRef.current.destroy();
      }
    };
  }, [file, pdfjs]);

  /* ── Progressively Generate Page Thumbnails ── */
  useEffect(() => {
    if (!pdfDoc || totalPages === 0) return undefined;

    let isActive = true;
    const thumbs = new Array(totalPages).fill("");

    (async () => {
      for (let i = 0; i < totalPages; i++) {
        if (!isActive) break;
        const pageNum = i + 1;
        try {
          const page = await pdfDoc.getPage(pageNum);
          const dataUrl = await generatePageThumbnail(page, 220);
          if (isActive) {
            thumbs[i] = dataUrl;
            setThumbnails([...thumbs]);
          }
        } catch (err) {
          console.warn(`Failed to render thumbnail for page ${pageNum}:`, err);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [pdfDoc, totalPages]);

  /* ── Page Selection Handlers ── */
  const handleTogglePage = useCallback((pageNum) => {
    setSelectedPages((prev) =>
      prev.includes(pageNum) ? prev.filter((p) => p !== pageNum) : [...prev, pageNum].sort((a, b) => a - b)
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (!totalPages) return;
    const all = Array.from({ length: totalPages }, (_, i) => i + 1);
    setSelectedPages(all);
  }, [totalPages]);

  const handleDeselectAll = useCallback(() => {
    setSelectedPages([]);
  }, []);

  /* ── Single Page Instant Download ── */
  const handleDownloadSinglePage = useCallback(
    async (pageNum) => {
      if (!pdfDoc) return;
      try {
        const page = await pdfDoc.getPage(pageNum);
        const scale = SCALE_PRESETS[scalePreset] || 1.5;
        const qual = QUALITY_PRESETS[quality] || 0.8;
        const { blob } = await renderPageToJpg(page, scale, qual);

        const baseName = file?.name?.replace(/\.[^/.]+$/, "") || "document";
        const paddedNum = String(pageNum).padStart(String(totalPages).length, "0");
        saveAs(blob, `${baseName}-page-${paddedNum}.jpg`);
      } catch (err) {
        console.error("Single page export failed:", err);
        setError("Failed to export page as JPG. Please try again.");
      }
    },
    [pdfDoc, scalePreset, quality, file, totalPages]
  );

  /* ── Batch / Selected Pages Conversion ── */
  const handleConvert = useCallback(async () => {
    if (!pdfDoc || selectedPages.length === 0) return;

    setIsConverting(true);
    setProgress({ current: 0, total: selectedPages.length });
    setError("");

    try {
      const scale = SCALE_PRESETS[scalePreset] || 1.5;
      const qual = QUALITY_PRESETS[quality] || 0.8;
      const baseName = file?.name?.replace(/\.[^/.]+$/, "") || "document";

      if (selectedPages.length === 1) {
        // Single page export
        const pageNum = selectedPages[0];
        const page = await pdfDoc.getPage(pageNum);
        const { blob } = await renderPageToJpg(page, scale, qual);
        const paddedNum = String(pageNum).padStart(String(totalPages).length, "0");
        saveAs(blob, `${baseName}-page-${paddedNum}.jpg`);
      } else {
        // Multi-page ZIP export
        const zipBlob = await convertPagesToZip(
          pdfDoc,
          selectedPages,
          scale,
          qual,
          baseName,
          (current, total) => setProgress({ current, total })
        );
        saveAs(zipBlob, `${baseName}-images.zip`);
      }
    } catch (err) {
      console.error("Batch conversion failed:", err);
      setError(err.message || "Failed to convert PDF to JPG images. Please try again.");
    } finally {
      setIsConverting(false);
      setProgress(null);
    }
  }, [pdfDoc, selectedPages, scalePreset, quality, file, totalPages]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {error && (
        <div className="rounded-sm border border-[#f3cfc8] bg-[#fdf4f3] px-4 py-3 text-sm text-[#a13c2f]" role="alert">
          {error}
        </div>
      )}

      {/* State 1: No file selected */}
      {!file && (
        <div className="space-y-8">
          <FileUploader
            onUpload={handleUpload}
            accept="application/pdf,.pdf"
            multiple={false}
            fileTypeLabel="PDF file"
            titleText="Drop PDF file here"
          />

          {/* Feature Highlight Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                title: "High Quality JPGs",
                desc: "Render PDF pages at up to 300 DPI for crisp, crystal-clear image exports.",
                icon: FaImage,
              },
              {
                title: "Custom Selection & Scale",
                desc: "Choose individual pages or entire documents with customizable DPI scale.",
                icon: FaSlidersH,
              },
              {
                title: "100% Private & Fast",
                desc: "All rendering runs inside your browser. No files are uploaded to any server.",
                icon: FaShieldAlt,
              },
            ].map(({ title, desc, icon: Icon }) => (
              <div
                key={title}
                className="flex flex-col gap-2 rounded-sm border border-[#dce5e0] bg-[#f8faf9] p-4 transition-colors hover:bg-white"
              >
                <div className="flex h-9 w-9 items-center justify-center bg-[#e6f0eb] text-[#235c4f]">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-[#263e36]">{title}</p>
                <p className="text-xs leading-5 text-[#627a6e]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* State 2: PDF file loaded */}
      {file && (
        <div className="space-y-6">
          <PdfToJpgHeader
            file={file}
            totalPages={totalPages}
            onClear={handleClear}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            {/* Page thumbnails grid */}
            <PdfToJpgPageGrid
              totalPages={totalPages}
              thumbnails={thumbnails}
              selectedPages={selectedPages}
              onTogglePage={handleTogglePage}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onDownloadSinglePage={handleDownloadSinglePage}
              isConverting={isConverting}
            />

            {/* Conversion settings panel */}
            <PdfToJpgOptionsBar
              quality={quality}
              onQualityChange={setQuality}
              scalePreset={scalePreset}
              onScaleChange={setScalePreset}
              selectedCount={selectedPages.length}
              totalPages={totalPages}
              isConverting={isConverting}
              progress={progress}
              onConvert={handleConvert}
            />
          </div>
        </div>
      )}
    </div>
  );
}
