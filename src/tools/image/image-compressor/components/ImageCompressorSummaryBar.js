"use client";

import React from "react";
import { formatFileSize } from "../imageCompressorUtils";
import { FaDownload, FaFileArchive, FaPlus, FaTimes, FaBan } from "react-icons/fa";

export default function ImageCompressorSummaryBar({
  images,
  isProcessing,
  processedCount,
  onDownloadAllZip,
  onAddMore,
  onClearAll,
  onCancelBatch,
}) {
  const totalOriginal = images.reduce((acc, img) => acc + (img.originalSize || 0), 0);
  const totalCompressed = images.reduce(
    (acc, img) => acc + (img.compressedSize != null ? img.compressedSize : img.originalSize || 0),
    0
  );

  const totalSaved = Math.max(0, totalOriginal - totalCompressed);
  const totalPercentSaved =
    totalOriginal > 0 ? Math.round((totalSaved / totalOriginal) * 100) : 0;

  const readyToDownload = images.filter((img) => img.blob && !img.error).length;

  return (
    <div className="flex flex-col gap-4 rounded-sm border border-[#dce5e0] bg-[#f8faf9] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      {/* Stats summary */}
      <div className="space-y-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#527268]">
            Total Savings:
          </span>
          <span
            id="total-savings-percentage"
            className="text-lg font-bold text-[#173d34] sm:text-xl"
          >
            {totalPercentSaved > 0 ? `-${totalPercentSaved}%` : "0%"}
          </span>
          {totalSaved > 0 && (
            <span
              id="total-savings-bytes"
              className="rounded-full bg-[#eaf3ed] px-2 py-0.5 text-xs font-bold text-[#235c4f]"
            >
              Saved {formatFileSize(totalSaved)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#708079]">
          <span>
            Original: <strong className="text-[#263e36]">{formatFileSize(totalOriginal)}</strong>
          </span>
          <span>•</span>
          <span>
            Compressed: <strong className="text-[#263e36]">{formatFileSize(totalCompressed)}</strong>
          </span>
          <span>•</span>
          <span>
            {images.length} image{images.length !== 1 ? "s" : ""} (
            {processedCount}/{images.length} processed)
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {isProcessing && (
          <button
            type="button"
            id="cancel-batch-button"
            onClick={onCancelBatch}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-sm border border-[#e5b8b1] bg-[#fdf4f3] px-3.5 py-2 text-xs font-semibold text-[#a13c2f] transition-colors hover:bg-[#fae7e4]"
          >
            <FaBan className="h-3 w-3" />
            <span>Cancel</span>
          </button>
        )}

        <button
          type="button"
          id="add-more-button"
          onClick={onAddMore}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-sm border border-[#c8d6cf] bg-white px-3.5 py-2 text-xs font-semibold text-[#173d34] transition-colors hover:bg-[#f4f7f5]"
        >
          <FaPlus className="h-3 w-3" />
          <span>Add Images</span>
        </button>

        <button
          type="button"
          id="clear-all-button"
          onClick={onClearAll}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-sm border border-transparent px-3 py-2 text-xs font-medium text-[#708079] transition-colors hover:text-[#a13c2f]"
          title="Remove all images"
        >
          <FaTimes className="h-3 w-3" />
          <span className="hidden sm:inline">Clear All</span>
        </button>

        <button
          type="button"
          id="download-all-zip-button"
          onClick={onDownloadAllZip}
          disabled={readyToDownload === 0 || isProcessing}
          className="inline-flex min-h-10 items-center gap-2 rounded-sm bg-[#173d34] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#245b4c] disabled:cursor-not-allowed disabled:bg-[#a0b2aa]"
        >
          <FaFileArchive className="h-3.5 w-3.5" />
          <span>Download All (ZIP)</span>
        </button>
      </div>
    </div>
  );
}
