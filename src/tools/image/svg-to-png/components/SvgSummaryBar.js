"use client";

import React from "react";
import { formatFileSize } from "../svgToPngUtils";
import { FaDownload, FaPlus, FaTimes, FaBan } from "react-icons/fa";

export default function SvgSummaryBar({
  items,
  isProcessing,
  processedCount,
  onDownloadAll,
  onAddMore,
  onClearAll,
  onCancelBatch,
}) {
  const readyToDownload = items.filter((img) => img.blob && !img.error).length;
  const totalPngSize = items.reduce((acc, img) => acc + (img.pngSize || 0), 0);

  return (
    <div
      data-svg-summary="true"
      className="flex flex-col gap-4 rounded-sm border border-[#dce5e0] bg-[#f8faf9] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#527268]">
            Conversion Status:
          </span>
          <span
            id="svg-status-count"
            className="text-lg font-bold text-[#173d34] sm:text-xl"
          >
            {processedCount} / {items.length} Ready
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#708079]">
          <span>
            {items.length} file{items.length !== 1 ? "s" : ""}
          </span>
          {readyToDownload > 0 && (
            <>
              <span>•</span>
              <span>
                Total Output: <strong className="text-[#263e36]">{formatFileSize(totalPngSize)}</strong>
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isProcessing && (
          <button
            type="button"
            id="svg-cancel-button"
            onClick={onCancelBatch}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-sm border border-[#e5b8b1] bg-[#fdf4f3] px-3.5 py-2 text-xs font-semibold text-[#a13c2f] transition-colors hover:bg-[#fae7e4]"
          >
            <FaBan className="h-3 w-3" />
            <span>Cancel</span>
          </button>
        )}

        <button
          type="button"
          id="svg-add-more-button"
          onClick={onAddMore}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-sm border border-[#c8d6cf] bg-white px-3.5 py-2 text-xs font-semibold text-[#173d34] transition-colors hover:bg-[#f4f7f5]"
        >
          <FaPlus className="h-3 w-3" />
          <span>Add More</span>
        </button>

        <button
          type="button"
          id="svg-clear-all-button"
          onClick={onClearAll}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-sm border border-transparent px-3 py-2 text-xs font-medium text-[#708079] transition-colors hover:text-[#a13c2f]"
          title="Remove all SVGs"
        >
          <FaTimes className="h-3 w-3" />
          <span className="hidden sm:inline">Clear All</span>
        </button>

        <button
          type="button"
          id="svg-download-all-button"
          data-download-all="true"
          onClick={onDownloadAll}
          disabled={readyToDownload === 0 || isProcessing}
          className="inline-flex min-h-10 items-center gap-2 rounded-sm bg-[#235c4f] px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1a473d] disabled:cursor-not-allowed disabled:bg-[#a0b2aa]"
        >
          <FaDownload className="h-3.5 w-3.5" />
          <span>
            {readyToDownload > 1
              ? `Download All (${readyToDownload}) ZIP`
              : "Download PNG"}
          </span>
        </button>
      </div>
    </div>
  );
}
