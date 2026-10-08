import React from "react";
import { FaBan, FaDownload, FaPlus, FaTimes } from "react-icons/fa";
import { formatFileSize } from "../../utils/imageSharedUtils.js";

export default function ResizerSummaryBar({
  items,
  onDownloadAll,
  onAddMore,
  onClearAll,
  onCancel,
  isProcessing,
}) {
  if (!items?.length) return null;
  const readyItems = items.filter((item) => item.status === "done" && item.blob);
  const totalSize = readyItems.reduce((sum, item) => sum + item.blob.size, 0);
  const originalSize = items.reduce((sum, item) => sum + (item.file?.size || 0), 0);

  return (
    <div
      data-resizer-summary="true"
      className="flex flex-col gap-4 rounded-sm border border-[#dce5e0] bg-[#f8faf9] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#527268]">
            Resized:
          </span>
          <span className="text-lg font-bold text-[#173d34] sm:text-xl">
            {readyItems.length} / {items.length}
          </span>
          {readyItems.length > 0 && (
            <span className="rounded-full bg-[#eaf3ed] px-2 py-0.5 text-xs font-bold text-[#235c4f]">
              {formatFileSize(totalSize)} output
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#708079]">
          <span>
            Original: <strong className="text-[#263e36]">{formatFileSize(originalSize)}</strong>
          </span>
          <span>•</span>
          <span>{readyItems.length}/{items.length} images processed</span>
        </div>
        {readyItems.some((item) => item.wasUpscaled) && (
          <p className="pt-1 text-[11px] text-amber-800" role="status">
            Enlarging an image may reduce its sharpness.
          </p>
        )}
        {readyItems.some((item) => item.wasCapped) && (
          <p className="text-[11px] text-amber-800" role="status">
            Dimensions are capped at 8192 pixels per side.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isProcessing && (
          <button
            type="button"
            id="cancel-batch-button"
            onClick={onCancel}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-sm border border-[#e5b8b1] bg-[#fdf4f3] px-3.5 py-2 text-xs font-semibold text-[#a13c2f] transition-colors hover:bg-[#fae7e4]"
          >
            <FaBan className="h-3 w-3" /> Cancel
          </button>
        )}
        <button
          type="button"
          id="add-more-button"
          onClick={onAddMore}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-sm border border-[#c8d6cf] bg-white px-3.5 py-2 text-xs font-semibold text-[#173d34] transition-colors hover:bg-[#f4f7f5]"
        >
          <FaPlus className="h-3 w-3" /> Add Images
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
          id="download-all-resized-button"
          onClick={onDownloadAll}
          disabled={readyItems.length === 0 || isProcessing}
          className="inline-flex min-h-10 items-center gap-2 rounded-sm bg-[#173d34] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#245b4c] disabled:cursor-not-allowed disabled:bg-[#a0b2aa]"
        >
          <FaDownload className="h-3.5 w-3.5" />
          {readyItems.length > 1 ? "Download All (ZIP)" : "Download Resized Image"}
        </button>
      </div>
    </div>
  );
}
