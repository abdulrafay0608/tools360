"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useAdPauseWhile } from "@/hooks/useAdPause";
import { saveAs } from "file-saver";
import { FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import FileUploader from "@/components/pdf/file/FileUploader";

import usePDFJS from "@/hooks/usePDFJS";
import SignHeaderBar from "./SignHeaderBar";
import PageNavigationStrip from "./PageNavigationStrip";
import PageSignCanvas from "./PageSignCanvas";
import SignatureModal from "./SignatureModal";
import {
  generateDateStamp,
  embedSignaturesIntoPdf,
} from "../signPdfUtils";

export default function SignPDFTool() {
  const [file, setFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [thumbnails, setThumbnails] = useState([]);
  const [placedSignatures, setPlacedSignatures] = useState([]);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [isRendering, setIsRendering] = useState(false);
  const [isRenderingThumbnails, setIsRenderingThumbnails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [fileWarning, setFileWarning] = useState("");
  const isLoadingPdf = Boolean(file && !pdfDoc && !error);
  useAdPauseWhile(
    "sign-processing",
    isProcessing || isRendering || isRenderingThumbnails || isLoadingPdf
  );
  useAdPauseWhile("sign-error", Boolean(error));
  useAdPauseWhile("sign-empty", !file);

  const { pdfjs } = usePDFJS();
  const activeDocRef = useRef(null);

  /* ── File Selection & Validation ── */
  const handleUpload = useCallback((uploadedFiles) => {
    const list = Array.from(uploadedFiles || []);
    const pdfFile = list.find(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );

    if (!pdfFile) {
      setError("Please select a valid PDF file.");
      return;
    }

    if (pdfFile.size > 50 * 1024 * 1024) {
      setFileWarning("This PDF is larger than 50MB. Processing may take longer in your browser.");
    } else {
      setFileWarning("");
    }

    setFile(pdfFile);
    setPdfDoc(null);
    setTotalPages(0);
    setCurrentPage(1);
    setThumbnails([]);
    setIsRenderingThumbnails(false);
    setPlacedSignatures([]);
    setError("");
  }, []);

  /* ── Clear File & Reset ── */
  const handleClear = useCallback(() => {
    setFile(null);
    setPdfDoc(null);
    setTotalPages(0);
    setCurrentPage(1);
    setThumbnails([]);
    setPlacedSignatures([]);
    setError("");
    setFileWarning("");
    setIsProcessing(false);
    setIsRenderingThumbnails(false);
  }, []);

  /* ── Load PDF Document via PDF.js ── */
  useEffect(() => {
    if (!pdfjs || !file) return undefined;

    let isActive = true;
    setError("");
    setIsRenderingThumbnails(false);

    (async () => {
      try {
        const buffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: buffer });
        activeDocRef.current = loadingTask;
        const doc = await loadingTask.promise;

        if (isActive) {
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          setCurrentPage(1);
          setThumbnails(new Array(doc.numPages).fill(""));

          setIsRenderingThumbnails(true);
          try {
            for (let p = 1; p <= doc.numPages; p++) {
              if (!isActive) break;
              try {
                const page = await doc.getPage(p);
                const vp = page.getViewport({ scale: 0.25 });
                const canvas = document.createElement("canvas");
                canvas.width = Math.ceil(vp.width);
                canvas.height = Math.ceil(vp.height);
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  await page.render({ canvasContext: ctx, viewport: vp }).promise;
                  const thumbData = canvas.toDataURL("image/jpeg", 0.7);
                  if (isActive) {
                    setThumbnails((prev) => {
                      const next = [...prev];
                      next[p - 1] = thumbData;
                      return next;
                    });
                  }
                }
              } catch (thumbErr) {
                console.warn(`Failed thumbnail for page ${p}:`, thumbErr);
              }
            }
          } finally {
            if (isActive) setIsRenderingThumbnails(false);
          }
        }
      } catch (err) {
        if (isActive) {
          console.error("PDF load error:", err);
          if (err?.name === "PasswordException") {
            setError(
              "This PDF is password-protected and encrypted. Please unlock it and try again."
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
      if (activeDocRef.current) {
        try {
          activeDocRef.current.destroy();
        } catch {
          // ignore
        }
      }
    };
  }, [file, pdfjs]);

  /* ── Adding Signature to Page ── */
  const handleSaveSignature = useCallback((dataUrl) => {
    const newSignature = {
      id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      pageNum: currentPage,
      dataUrl,
      xRatio: 0.35,
      yRatio: 0.45,
      widthRatio: 0.3,
      heightRatio: 0.1,
    };
    setPlacedSignatures((prev) => [...prev, newSignature]);
  }, [currentPage]);

  /* ── Adding Date Stamp to Page ── */
  const handleAddDateStamp = useCallback(() => {
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const dataUrl = generateDateStamp(today, "#0f2b5c");
    const newDateItem = {
      id: `date_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      pageNum: currentPage,
      dataUrl,
      xRatio: 0.38,
      yRatio: 0.48,
      widthRatio: 0.24,
      heightRatio: 0.05,
    };
    setPlacedSignatures((prev) => [...prev, newDateItem]);
  }, [currentPage]);

  /* ── Updating Position / Size ── */
  const handleUpdateSignaturePosition = useCallback((id, updates) => {
    setPlacedSignatures((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  /* ── Delete Signature ── */
  const handleDeleteSignature = useCallback((id) => {
    setPlacedSignatures((prev) => prev.filter((item) => item.id !== id));
  }, []);

  /* ── Zoom Controls ── */
  const handleZoomIn = () => setZoom((z) => Math.min(1.75, Number((z + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.75, Number((z - 0.15).toFixed(2))));

  /* ── Download Signed Document ── */
  const handleDownload = async () => {
    if (!file || placedSignatures.length === 0) return;
    setIsProcessing(true);
    setError("");

    try {
      const signedBlob = await embedSignaturesIntoPdf(file, placedSignatures);
      const originalName = file.name.replace(/\.[^/.]+$/, "");
      saveAs(signedBlob, `${originalName}_signed.pdf`);
    } catch (err) {
      console.error("Export signing error:", err);
      setError("Failed to generate signed PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Error Message */}
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-sm border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          <FaExclamationTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div className="flex-1">
            <p className="font-semibold">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Warning Message (e.g. Large File) */}
      {fileWarning && (
        <div className="mb-5 flex items-start gap-3 rounded-sm border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <FaExclamationTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="flex-1">{fileWarning}</p>
        </div>
      )}

      {!file ? (
        /* Upload Area */
        <FileUploader
          accept="application/pdf"
          multiple={false}
          onUpload={handleUpload}
          titleText="Choose a PDF file to sign"
        />
      ) : (
        /* Sign Workspace */
        <div>
          {/* Header / Top Action Bar */}
          <SignHeaderBar
            file={file}
            totalPages={totalPages}
            placedCount={placedSignatures.length}
            onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
            onAddDateStamp={handleAddDateStamp}
            onDownload={handleDownload}
            onClearFile={handleClear}
            isProcessing={isProcessing}
          />

          {/* Main Interactive Canvas & Sidebar */}
          <div className="mt-4 flex flex-col md:flex-row border border-[#dce5e0] rounded-sm overflow-hidden bg-white">
              {/* Left Page Thumbnails Strip */}
              <PageNavigationStrip
                totalPages={totalPages}
                thumbnails={thumbnails}
                currentPage={currentPage}
                placedSignatures={placedSignatures}
                onSelectPage={(pageNum) => setCurrentPage(pageNum)}
              />

              {/* Center Canvas Area */}
              <PageSignCanvas
                pdfDoc={pdfDoc}
                currentPage={currentPage}
                totalPages={totalPages}
                placedSignatures={placedSignatures}
                onUpdateSignaturePosition={handleUpdateSignaturePosition}
                onDeleteSignature={handleDeleteSignature}
                onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
                onNextPage={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                zoom={zoom}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                isRendering={isRendering}
                setIsRendering={setIsRendering}
              />

              {/* Desktop Options / Placed Items summary & ad sidebar */}
              <div className="hidden lg:flex w-64 shrink-0 flex-col gap-4 border-l border-[#dce5e0] bg-[#f8faf9] p-4">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-[#1a3328] uppercase tracking-wide">
                    Document Signatures
                  </h4>
                  <p className="text-[11px] text-[#708079]">
                    {placedSignatures.length === 0
                      ? "No signatures placed yet. Click 'Add Signature' to start."
                      : `${placedSignatures.length} item(s) across document.`}
                  </p>
                </div>

                {placedSignatures.length > 0 && (
                  <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
                    {placedSignatures.map((sig, idx) => (
                      <div
                        key={sig.id}
                        onClick={() => setCurrentPage(sig.pageNum)}
                        className={`flex cursor-pointer items-center justify-between rounded-sm border p-2 text-xs transition-colors ${
                          currentPage === sig.pageNum
                            ? "border-[#235c4f] bg-white font-medium text-[#173d34]"
                            : "border-[#dce5e0] bg-[#f4f7f5] text-[#52675e] hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FaCheckCircle className="h-3 w-3 text-[#16a34a] shrink-0" />
                          <span className="truncate">Page {sig.pageNum} item #{idx + 1}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSignature(sig.id);
                          }}
                          className="text-red-500 hover:text-red-700 ml-2"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

              </div>
          </div>

          {/* Signature Creation Modal */}
          <SignatureModal
            isOpen={isSignatureModalOpen}
            onClose={() => setIsSignatureModalOpen(false)}
            onSaveSignature={handleSaveSignature}
          />
        </div>
      )}

    </div>
  );
}
