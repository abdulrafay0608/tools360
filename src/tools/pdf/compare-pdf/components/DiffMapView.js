"use client";

import React from "react";

/**
 * DiffMapView
 * Visual difference canvas highlighting changed pixel areas in red with contextual background.
 */
export default function DiffMapView({
  resultCanvasRef,
  comparisonStats,
  isRendering,
  comparisonAvailable,
}) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#f4f7f5]">
      {/* Diff Legend & Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dce5e0] bg-[#eef2ef] px-4 py-2 text-xs text-[#263e36]">
        <div className="flex items-center gap-3">
          <span className="font-semibold">Difference Map:</span>
          {comparisonStats && (
            <span
              className={`rounded px-2 py-0.5 font-bold text-white ${
                comparisonStats.changedPercent === 0
                  ? "bg-[#22c55e]"
                  : comparisonStats.changedPercent < 1
                  ? "bg-[#eab308]"
                  : comparisonStats.changedPercent < 10
                  ? "bg-[#f97316]"
                  : "bg-[#ef4444]"
              }`}
            >
              {comparisonStats.changedPercent.toFixed(2)}% changed
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] text-[#52675e]">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#ef4444]" />
            Red = Changed content
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 border border-[#94a3b8] bg-white" />
            Normal = Unchanged
          </span>
        </div>
      </div>

      {/* Canvas container */}
      <div
        className="flex-1 overflow-auto p-4 flex justify-center items-start"
        style={{ minHeight: "450px", maxHeight: "65vh" }}
      >
        {!comparisonAvailable ? (
          <div className="flex h-64 w-full items-center justify-center rounded border border-dashed border-[#cbd5e1] bg-white text-xs text-[#94a3b8]">
            Difference map is unavailable because page is missing in one document
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
