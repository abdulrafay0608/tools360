"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAdPauseWhile } from "@/hooks/useAdPause";
import usePDFJS from "@/hooks/usePDFJS";
import {
  createDifferenceImageData,
  classifyDifference,
} from "../compareUtils.js";

import CompareUploadLanding from "./CompareUploadLanding";
import CompareHeaderBar from "./CompareHeaderBar";
import CompareControlsToolbar from "./CompareControlsToolbar";
import PageThumbnailStrip from "./PageThumbnailStrip";
import SideBySideView from "./SideBySideView";
import OverlayView from "./OverlayView";
import DiffMapView from "./DiffMapView";

/* ─────────────────────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────────────────────── */
const MAX_RENDER_DIMENSION = 1600;
const THUMBNAIL_SCALE = 0.18;
const ZOOM_LEVELS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const DEFAULT_ZOOM_INDEX = 2; // 1.0

/* ─────────────────────────────────────────────────────────────────────────────
   Canvas helpers
───────────────────────────────────────────────────────────────────────────── */
async function renderPageToCanvas(page, scale, renderTasks) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas rendering is unavailable.");

  const task = page.render({ canvasContext: ctx, viewport });
  renderTasks.push(task);
  await task.promise;
  return canvas;
}

function createAlignedCanvas(src, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas rendering is unavailable.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  if (src) {
    ctx.drawImage(
      src,
      Math.round((width - src.width) / 2),
      Math.round((height - src.height) / 2)
    );
  }
  return canvas;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main ComparePDFTool component
───────────────────────────────────────────────────────────────────────────── */
export default function ComparePDFTool() {
  /* ── State ── */
  const [originalFile, setOriginalFile] = useState(null);
  const [revisedFile, setRevisedFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [viewMode, setViewMode] = useState("side-by-side");
  const [overlayOpacity, setOverlayOpacity] = useState(50);
  const [error, setError] = useState("");
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [comparisonAvailable, setComparisonAvailable] = useState(false);
  const [comparisonStats, setComparisonStats] = useState(null);
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const [pageDiffs, setPageDiffs] = useState([]);
  const [thumbnails, setThumbnails] = useState([]);
  useAdPauseWhile(
    "compare-processing",
    isLoadingDocuments || isRendering
  );
  useAdPauseWhile("compare-error", Boolean(error));
  useAdPauseWhile("compare-empty", !originalFile || !revisedFile);

  /* ── Canvas & Scroll refs ── */
  const leftCanvasRef = useRef(null);
  const rightCanvasRef = useRef(null);
  const resultCanvasRef = useRef(null);
  const leftScrollRef = useRef(null);
  const rightScrollRef = useRef(null);
  const syncingLeft = useRef(false);
  const syncingRight = useRef(false);
  const currentAlignedRef = useRef({ left: null, right: null });

  const { pdfjs } = usePDFJS();

  const maxPages =
    documents.length === 2
      ? Math.max(documents[0].numPages, documents[1].numPages)
      : 0;
  const doc0Pages = documents[0]?.numPages ?? 0;
  const doc1Pages = documents[1]?.numPages ?? 0;
  const zoom = ZOOM_LEVELS[zoomIndex];

  /* ── Sync scroll side-by-side ── */
  const handleLeftScroll = useCallback(() => {
    if (syncingLeft.current) return;
    syncingRight.current = true;
    if (rightScrollRef.current && leftScrollRef.current) {
      rightScrollRef.current.scrollTop = leftScrollRef.current.scrollTop;
    }
    syncingRight.current = false;
  }, []);

  const handleRightScroll = useCallback(() => {
    if (syncingRight.current) return;
    syncingLeft.current = true;
    if (leftScrollRef.current && rightScrollRef.current) {
      leftScrollRef.current.scrollTop = rightScrollRef.current.scrollTop;
    }
    syncingLeft.current = false;
  }, []);

  /* ── Upload handlers ── */
  const handleBatchUpload = useCallback((files) => {
    const pdfFiles = Array.from(files).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (pdfFiles.length < 2) {
      setError("Please select at least two PDF files to compare.");
      return;
    }
    setOriginalFile(pdfFiles[0]);
    setRevisedFile(pdfFiles[1]);
    setError("");
  }, []);

  const handleSwapFiles = useCallback(() => {
    setOriginalFile(revisedFile);
    setRevisedFile(originalFile);
    setDocuments([]);
    setPageDiffs([]);
    setThumbnails([]);
  }, [originalFile, revisedFile]);

  const handleClearAll = useCallback(() => {
    setOriginalFile(null);
    setRevisedFile(null);
    setDocuments([]);
    setPageNumber(1);
    setPageInput("1");
    setViewMode("side-by-side");
    setError("");
    setPageDiffs([]);
    setThumbnails([]);
    setComparisonStats(null);
  }, []);

  /* ── Load PDF Documents ── */
  useEffect(() => {
    if (!pdfjs || !originalFile || !revisedFile) return undefined;

    let isActive = true;
    const loadingTasks = [];
    setIsLoadingDocuments(true);
    setError("");

    (async () => {
      try {
        const loaded = await Promise.all(
          [originalFile, revisedFile].map(async (file) => {
            const data = await file.arrayBuffer();
            const task = pdfjs.getDocument({ data });
            loadingTasks.push(task);
            return task.promise;
          })
        );
        if (isActive) {
          setDocuments(loaded);
          setPageNumber(1);
          setPageInput("1");
        }
      } catch (err) {
        if (isActive) {
          setError(
            err.name === "PasswordException"
              ? "Password-protected PDFs are not supported. Remove password and try again."
              : "One or both files could not be opened. Verify both files are valid PDFs."
          );
        }
      } finally {
        if (isActive) setIsLoadingDocuments(false);
      }
    })();

    return () => {
      isActive = false;
      loadingTasks.forEach((t) => t.destroy());
    };
  }, [originalFile, revisedFile, pdfjs]);

  /* ── Progressive Thumbnail & Diff Analysis ── */
  useEffect(() => {
    if (documents.length !== 2 || !pdfjs) return undefined;

    let isActive = true;
    const renderTasks = [];
    const pages = Math.max(documents[0].numPages, documents[1].numPages);
    const thumbs = new Array(pages).fill(null);
    const diffs = new Array(pages).fill(null);

    setThumbnails([]);
    setPageDiffs([]);

    (async () => {
      for (let i = 0; i < pages; i++) {
        if (!isActive) break;
        const pageNum = i + 1;
        try {
          const [p0, p1] = await Promise.all([
            pageNum <= documents[0].numPages
              ? documents[0].getPage(pageNum)
              : Promise.resolve(null),
            pageNum <= documents[1].numPages
              ? documents[1].getPage(pageNum)
              : Promise.resolve(null),
          ]);

          const thumbPage = p0 || p1;
          if (thumbPage) {
            const thumbVp = thumbPage.getViewport({ scale: THUMBNAIL_SCALE });
            const tc = document.createElement("canvas");
            tc.width = Math.ceil(thumbVp.width);
            tc.height = Math.ceil(thumbVp.height);
            const tctx = tc.getContext("2d");
            if (tctx) {
              const task = thumbPage.render({ canvasContext: tctx, viewport: thumbVp });
              renderTasks.push(task);
              await task.promise;
              thumbs[i] = tc.toDataURL("image/jpeg", 0.7);
            }
          }

          if (p0 && p1) {
            const scale = Math.min(
              0.75,
              MAX_RENDER_DIMENSION / Math.max(
                p0.getViewport({ scale: 1 }).width,
                p1.getViewport({ scale: 1 }).width
              )
            );
            const [c0, c1] = await Promise.all([
              renderPageToCanvas(p0, scale, renderTasks),
              renderPageToCanvas(p1, scale, renderTasks),
            ]);
            const maxW = Math.max(c0.width, c1.width);
            const maxH = Math.max(c0.height, c1.height);
            const a0 = createAlignedCanvas(c0, maxW, maxH);
            const a1 = createAlignedCanvas(c1, maxW, maxH);
            const ctx0 = a0.getContext("2d");
            const ctx1 = a1.getContext("2d");
            if (ctx0 && ctx1) {
              const diff = createDifferenceImageData(
                ctx0.getImageData(0, 0, maxW, maxH).data,
                ctx1.getImageData(0, 0, maxW, maxH).data
              );
              diffs[i] = {
                changedPercent: diff.changedPercent,
                changedPixels: diff.changedPixels,
                totalPixels: diff.totalPixels,
                severity: classifyDifference(diff.changedPercent),
              };
            }
          } else {
            diffs[i] = { changedPercent: 100, changedPixels: -1, totalPixels: -1, severity: "major" };
          }

          if (isActive) {
            setThumbnails([...thumbs]);
            setPageDiffs([...diffs]);
          }
        } catch {
          diffs[i] = null;
        }
      }
    })();

    return () => {
      isActive = false;
      renderTasks.forEach((t) => {
        try { t.cancel(); } catch { /* ignore */ }
      });
    };
  }, [documents, pdfjs]);

  /* ── Render Active Page to Canvases ── */
  useEffect(() => {
    if (documents.length !== 2) return undefined;

    let isActive = true;
    const renderTasks = [];
    const canvases = [leftCanvasRef.current, rightCanvasRef.current];
    setIsRendering(true);
    setError("");

    (async () => {
      try {
        const [p0, p1] = await Promise.all([
          pageNumber <= documents[0].numPages
            ? documents[0].getPage(pageNumber)
            : Promise.resolve(null),
          pageNumber <= documents[1].numPages
            ? documents[1].getPage(pageNumber)
            : Promise.resolve(null),
        ]);

        const pages = [p0, p1];
        const validPages = pages.filter(Boolean);
        if (validPages.length === 0) throw new Error("Neither document has this page.");

        const pageSizes = validPages.map((p) => p.getViewport({ scale: 1 }));
        const origW = Math.max(...pageSizes.map((v) => v.width));
        const origH = Math.max(...pageSizes.map((v) => v.height));

        const baseScale = Math.min(1.5, MAX_RENDER_DIMENSION / Math.max(origW, origH));
        const scale = baseScale * zoom;
        const width = Math.max(1, Math.ceil(origW * scale));
        const height = Math.max(1, Math.ceil(origH * scale));

        const sourceCanvases = await Promise.all(
          pages.map((page) => (page ? renderPageToCanvas(page, scale, renderTasks) : null))
        );
        if (!isActive) return;

        const aligned = sourceCanvases.map((c) => createAlignedCanvas(c, width, height));
        currentAlignedRef.current = { left: aligned[0], right: aligned[1] };

        aligned.forEach((src, idx) => {
          const target = canvases[idx];
          if (!target) return;
          target.width = width;
          target.height = height;
          const ctx = target.getContext("2d");
          if (!ctx) throw new Error("Canvas rendering is unavailable.");
          ctx.drawImage(src, 0, 0);
        });

        const bothPresent = Boolean(p0 && p1);
        setComparisonAvailable(bothPresent);

        if (!bothPresent) {
          setComparisonStats(null);
          return;
        }

        const resultCanvas = resultCanvasRef.current;
        const resultCtx = resultCanvas?.getContext("2d");
        if (!resultCanvas || !resultCtx) return;

        resultCanvas.width = width;
        resultCanvas.height = height;
        resultCtx.clearRect(0, 0, width, height);

        if (viewMode === "overlay") {
          resultCtx.drawImage(aligned[0], 0, 0);
          resultCtx.globalAlpha = overlayOpacity / 100;
          resultCtx.drawImage(aligned[1], 0, 0);
          resultCtx.globalAlpha = 1;
          setComparisonStats(null);
        } else if (viewMode === "difference") {
          const ctx0 = aligned[0].getContext("2d");
          const ctx1 = aligned[1].getContext("2d");
          if (ctx0 && ctx1) {
            const diff = createDifferenceImageData(
              ctx0.getImageData(0, 0, width, height).data,
              ctx1.getImageData(0, 0, width, height).data
            );
            const imageData = resultCtx.createImageData(width, height);
            imageData.data.set(diff.pixels);
            resultCtx.putImageData(imageData, 0, 0);
            setComparisonStats(diff);
          }
        }
      } catch (err) {
        if (isActive) setError(err.message || "These pages could not be compared.");
      } finally {
        if (isActive) setIsRendering(false);
      }
    })();

    return () => {
      isActive = false;
      renderTasks.forEach((t) => {
        try { t.cancel(); } catch { /* ignore */ }
      });
    };
  }, [documents, pageNumber, viewMode, overlayOpacity, zoom]);

  /* ── Keyboard navigation ── */
  useEffect(() => {
    if (documents.length !== 2) return undefined;

    const onKey = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.key === "ArrowLeft") setPageNumber((p) => Math.max(1, p - 1));
      else if (e.key === "ArrowRight") setPageNumber((p) => Math.min(maxPages, p + 1));
      else if (e.key === "1") setViewMode("side-by-side");
      else if (e.key === "2") setViewMode("overlay");
      else if (e.key === "3") setViewMode("difference");
      else if (e.key === "+" || e.key === "=") setZoomIndex((z) => Math.min(ZOOM_LEVELS.length - 1, z + 1));
      else if (e.key === "-") setZoomIndex((z) => Math.max(0, z - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [documents, maxPages]);

  useEffect(() => {
    setPageInput(String(pageNumber));
  }, [pageNumber]);

  const commitPageInput = () => {
    const n = parseInt(pageInput, 10);
    if (!isNaN(n) && n >= 1 && n <= maxPages) {
      setPageNumber(n);
    } else {
      setPageInput(String(pageNumber));
    }
  };

  const handleDownloadDiff = () => {
    const canvas = viewMode === "side-by-side" ? null : resultCanvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `pdf-diff-page-${pageNumber}.png`;
    a.click();
  };

  /* ── Initial Upload View ── */
  if (documents.length !== 2) {
    return (
      <div className="p-4 sm:p-6">
        <CompareUploadLanding
          originalFile={originalFile}
          revisedFile={revisedFile}
          onSelectOriginal={(file) => setOriginalFile(file)}
          onSelectRevised={(file) => setRevisedFile(file)}
          onBatchUpload={handleBatchUpload}
          onSwapFiles={handleSwapFiles}
          onClearOriginal={() => setOriginalFile(null)}
          onClearRevised={() => setRevisedFile(null)}
          onCompare={() => setError("")}
          error={error}
        />
        {isLoadingDocuments && (
          <div className="mt-4 text-center text-sm font-medium text-[#235c4f]">
            Loading PDF documents...
          </div>
        )}
      </div>
    );
  }

  /* ── Active Viewer View ── */
  return (
    <div className="p-4 sm:p-6">
      {/* Header Bar */}
      <CompareHeaderBar
        originalFile={originalFile}
        revisedFile={revisedFile}
        doc0Pages={doc0Pages}
        doc1Pages={doc1Pages}
        maxPages={maxPages}
        pageDiffs={pageDiffs}
        onSwapFiles={handleSwapFiles}
        onChangeFiles={handleClearAll}
      />

      {/* Main Comparison Interface */}
      <div className="flex flex-col rounded-sm border border-[#dce5e0] bg-white shadow-sm overflow-hidden">
        {/* Controls Toolbar */}
        <CompareControlsToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          pageNumber={pageNumber}
          maxPages={maxPages}
          pageInput={pageInput}
          onPageInputChange={(e) => setPageInput(e.target.value)}
          onPageInputCommit={commitPageInput}
          onPrevPage={() => setPageNumber((p) => Math.max(1, p - 1))}
          onNextPage={() => setPageNumber((p) => Math.min(maxPages, p + 1))}
          zoomIndex={zoomIndex}
          onZoomIn={() => setZoomIndex((z) => Math.min(ZOOM_LEVELS.length - 1, z + 1))}
          onZoomOut={() => setZoomIndex((z) => Math.max(0, z - 1))}
          onDownloadDiff={handleDownloadDiff}
        />

        {error && (
          <div className="bg-[#fdf4f3] px-4 py-2 text-xs text-[#a13c2f] border-b border-[#f3cfc8]" role="alert">
            {error}
          </div>
        )}

        {/* View Workspace: Sidebar + Mode View */}
        <div className="flex flex-1 overflow-hidden">
          {/* Page Thumbnails Sidebar */}
          <PageThumbnailStrip
            thumbnails={thumbnails}
            pageDiffs={pageDiffs}
            maxPages={maxPages}
            doc0Pages={doc0Pages}
            doc1Pages={doc1Pages}
            currentPage={pageNumber}
            onPageSelect={setPageNumber}
          />

          {/* Active View Mode Component */}
          {viewMode === "side-by-side" && (
            <SideBySideView
              pageNumber={pageNumber}
              doc0Pages={doc0Pages}
              doc1Pages={doc1Pages}
              originalFileName={originalFile?.name}
              revisedFileName={revisedFile?.name}
              leftCanvasRef={leftCanvasRef}
              rightCanvasRef={rightCanvasRef}
              leftScrollRef={leftScrollRef}
              rightScrollRef={rightScrollRef}
              onLeftScroll={handleLeftScroll}
              onRightScroll={handleRightScroll}
              isRendering={isRendering}
            />
          )}

          {viewMode === "overlay" && (
            <OverlayView
              resultCanvasRef={resultCanvasRef}
              overlayOpacity={overlayOpacity}
              onOpacityChange={setOverlayOpacity}
              isRendering={isRendering}
              comparisonAvailable={comparisonAvailable}
            />
          )}

          {viewMode === "difference" && (
            <DiffMapView
              resultCanvasRef={resultCanvasRef}
              comparisonStats={comparisonStats}
              isRendering={isRendering}
              comparisonAvailable={comparisonAvailable}
            />
          )}
        </div>
      </div>
    </div>
  );
}
