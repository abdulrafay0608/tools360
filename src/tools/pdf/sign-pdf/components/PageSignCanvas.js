"use client";

import React, { useRef, useEffect } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaSearchMinus,
  FaSearchPlus,
} from "react-icons/fa";
import PlacedSignatureItem from "./PlacedSignatureItem";

/**
 * PageSignCanvas
 * Renders active PDF page and manages the interactive draggable/resizable signature overlay.
 */
export default function PageSignCanvas({
  pdfDoc,
  currentPage,
  totalPages,
  placedSignatures,
  onUpdateSignaturePosition,
  onDeleteSignature,
  onPrevPage,
  onNextPage,
  zoom,
  onZoomIn,
  onZoomOut,
  isRendering,
  setIsRendering,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const renderTaskRef = useRef(null);

  const currentPageSignatures = placedSignatures.filter(
    (s) => s.pageNum === currentPage
  );

  /* ── Render Page Canvas with PDF.js ── */
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return undefined;

    let isActive = true;
    setIsRendering(true);

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        // ignore cancellation
      }
    }

    (async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const unscaledViewport = page.getViewport({ scale: 1.0 });

        // Calculate responsive scale based on viewport width and zoom
        const baseScale = Math.min(1.4, 800 / unscaledViewport.width);
        const scale = baseScale * zoom;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const renderTask = page.render({
          canvasContext: ctx,
          viewport,
        });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err) {
        if (err?.name !== "RenderingCancelledException") {
          console.warn("PDF page render error:", err);
        }
      } finally {
        if (isActive) setIsRendering(false);
      }
    })();

    return () => {
      isActive = false;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [pdfDoc, currentPage, zoom, setIsRendering]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#f4f7f5]">
      {/* Page Navigation & Zoom Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#dce5e0] bg-[#eef2ef] px-4 py-2 text-xs text-[#263e36]">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            aria-label="Previous page"
            className="flex h-7 w-7 items-center justify-center rounded border border-[#dce5e0] bg-white text-[#52675e] transition-colors hover:bg-[#f4f7f5] disabled:opacity-40"
          >
            <FaChevronLeft className="h-3 w-3" />
          </button>
          <span className="font-semibold text-[#1a3328] tabular-nums">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
            className="flex h-7 w-7 items-center justify-center rounded border border-[#dce5e0] bg-white text-[#52675e] transition-colors hover:bg-[#f4f7f5] disabled:opacity-40"
          >
            <FaChevronRight className="h-3 w-3" />
          </button>
        </div>

        {/* Tip */}
        <span className="hidden md:inline text-[11px] text-[#708079]">
          💡 Click & drag placed signatures to reposition them anywhere on the page
        </span>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onZoomOut}
            disabled={zoom <= 0.75}
            aria-label="Zoom out"
            className="flex h-7 w-7 items-center justify-center rounded border border-[#dce5e0] bg-white text-[#52675e] transition-colors hover:bg-[#f4f7f5] disabled:opacity-40"
          >
            <FaSearchMinus className="h-3 w-3" />
          </button>
          <span className="min-w-[2.5rem] text-center text-xs font-semibold text-[#263e36] tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={onZoomIn}
            disabled={zoom >= 1.75}
            aria-label="Zoom in"
            className="flex h-7 w-7 items-center justify-center rounded border border-[#dce5e0] bg-white text-[#52675e] transition-colors hover:bg-[#f4f7f5] disabled:opacity-40"
          >
            <FaSearchPlus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Main Page Workspace */}
      <div
        className="flex flex-1 items-start justify-center overflow-auto p-4 sm:p-6"
        style={{ minHeight: "520px", maxHeight: "72vh" }}
      >
        <div
          ref={containerRef}
          className="relative shadow-lg ring-1 ring-black/5"
          style={{ maxWidth: "100%" }}
        >
          {/* PDF Page Canvas */}
          <canvas ref={canvasRef} className="block max-w-full bg-white" />

          {/* Loading Overlay */}
          {isRendering && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-2xs">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#dce5e0] border-t-[#235c4f]" />
            </div>
          )}

          {/* Signature Overlay Layer */}
          <div className="absolute inset-0 pointer-events-auto">
            {currentPageSignatures.map((sigItem) => (
              <PlacedSignatureItem
                key={sigItem.id}
                item={sigItem}
                containerRef={containerRef}
                onUpdatePosition={onUpdateSignaturePosition}
                onDelete={onDeleteSignature}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
