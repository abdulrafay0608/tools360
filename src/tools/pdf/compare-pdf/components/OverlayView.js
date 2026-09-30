"use client";

import React from "react";

/**
 * OverlayView
 * Blended overlay canvas with interactive opacity slider.
 */
export default function OverlayView({
  resultCanvasRef,
  overlayOpacity,
  onOpacityChange,
  isRendering,
  comparisonAvailable,
}) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#f4f7f5]">
      {/* Opacity slider bar */}
      <div className="flex items-center justify-between border-b border-[#dce5e0] bg-[#eef2ef] px-4 py-2 text-xs text-[#263e36]">
        <div className="flex items-center gap-3 w-full max-w-xs">
          <label htmlFor="overlay-opacity" className="font-semibold shrink-0">
            Opacity: {overlayOpacity}%
          </label>
          <input
            id="overlay-opacity"
            type="range"
            min="10"
            max="90"
            value={overlayOpacity}
            onChange={(e) => onOpacityChange(Number(e.target.value))}
            className="w-full h-1.5 bg-[#dce5e0] rounded-lg appearance-none cursor-pointer accent-[#235c4f]"
          />
        </div>
        <span className="hidden sm:inline text-xs text-[#708079]">
          Original (0%) ← Overlay → Revised (100%)
        </span>
      </div>

      {/* Canvas container */}
      <div
        className="flex-1 overflow-auto p-4 flex justify-center items-start"
        style={{ minHeight: "450px", maxHeight: "65vh" }}
      >
        {!comparisonAvailable ? (
          <div className="flex h-64 w-full items-center justify-center rounded border border-dashed border-[#cbd5e1] bg-white text-xs text-[#94a3b8]">
            Overlay is unavailable because page is missing in one document
          </div>
        ) : (
          <div className="relative shadow-md">
            <canvas ref={resultCanvasRef} className="block max-w-full bg-white" />
            {isRendering && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#dce5e0] border-t-[#235c4f]" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
