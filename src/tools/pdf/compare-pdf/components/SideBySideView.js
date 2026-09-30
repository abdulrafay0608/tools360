"use client";

import React from "react";

/**
 * SideBySideView
 * Synchronized dual-canvas viewer for side-by-side page comparison.
 */
export default function SideBySideView({
  pageNumber,
  doc0Pages,
  doc1Pages,
  originalFileName,
  revisedFileName,
  leftCanvasRef,
  rightCanvasRef,
  leftScrollRef,
  rightScrollRef,
  onLeftScroll,
  onRightScroll,
  isRendering,
}) {
  const isDoc0Missing = pageNumber > doc0Pages;
  const isDoc1Missing = pageNumber > doc1Pages;

  return (
    <div className="grid h-full flex-1 grid-cols-1 divide-y divide-[#dce5e0] md:grid-cols-2 md:divide-x md:divide-y-0">
      {/* Left Pane: Original Document */}
      <div className="flex flex-col overflow-hidden bg-[#f4f7f5]">
        <div className="flex items-center justify-between border-b border-[#dce5e0] bg-[#eef2ef] px-3 py-1.5 text-xs text-[#263e36]">
          <span className="font-semibold truncate" title={originalFileName}>
            Original: {originalFileName}
          </span>
          <span className="font-medium text-[#708079]">
            {isDoc0Missing ? "Page missing" : `Page ${pageNumber}`}
          </span>
        </div>

        <div
          ref={leftScrollRef}
          onScroll={onLeftScroll}
          className="flex-1 overflow-auto p-4 flex justify-center items-start"
          style={{ minHeight: "450px", maxHeight: "65vh" }}
        >
          {isDoc0Missing ? (
            <div className="flex h-64 w-full items-center justify-center rounded border border-dashed border-[#cbd5e1] bg-white text-xs text-[#94a3b8]">
              No page {pageNumber} in original file
            </div>
          ) : (
            <div className="relative shadow-md">
              <canvas ref={leftCanvasRef} className="block max-w-full bg-white" />
              {isRendering && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#dce5e0] border-t-[#235c4f]" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Revised Document */}
      <div className="flex flex-col overflow-hidden bg-[#f4f7f5]">
        <div className="flex items-center justify-between border-b border-[#dce5e0] bg-[#eef2ef] px-3 py-1.5 text-xs text-[#263e36]">
          <span className="font-semibold truncate" title={revisedFileName}>
            Revised: {revisedFileName}
          </span>
          <span className="font-medium text-[#708079]">
            {isDoc1Missing ? "Page missing" : `Page ${pageNumber}`}
          </span>
        </div>

        <div
          ref={rightScrollRef}
          onScroll={onRightScroll}
          className="flex-1 overflow-auto p-4 flex justify-center items-start"
          style={{ minHeight: "450px", maxHeight: "65vh" }}
        >
          {isDoc1Missing ? (
            <div className="flex h-64 w-full items-center justify-center rounded border border-dashed border-[#cbd5e1] bg-white text-xs text-[#94a3b8]">
              No page {pageNumber} in revised file
            </div>
          ) : (
            <div className="relative shadow-md">
              <canvas ref={rightCanvasRef} className="block max-w-full bg-white" />
              {isRendering && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#dce5e0] border-t-[#235c4f]" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
