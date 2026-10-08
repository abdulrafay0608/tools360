"use client";

import React from "react";
import { formatFileSize } from "../imageCompressorUtils";
import { FaDownload, FaTrash, FaCheck, FaExclamationCircle } from "react-icons/fa";

export default function ImageCompressorItem({
  item,
  index,
  onDownloadSingle,
  onRemove,
}) {
  const isDone = item.status === "done";
  const isAlreadyOptimized = item.status === "already-optimized";
  const isProcessing = item.status === "processing";
  const isError = item.status === "error";

  return (
    <article
      data-image-item={item.id}
      className="flex flex-col gap-3 rounded-sm border border-[#dce5e0] bg-white p-3.5 transition-shadow hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      {/* Thumbnail + Name & Info */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-[#e5ece8] bg-[#f8faf9]">
          {item.thumbnailUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.thumbnailUrl}
              alt={item.name}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="text-xs text-[#a0b2aa]">IMG</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="truncate text-xs font-semibold text-[#1a3328]"
            title={item.name}
          >
            {item.name}
          </p>

          {/* Dimensions / Formats */}
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[#708079]">
            {item.originalWidth && item.originalHeight ? (
              <span>
                {item.originalWidth} × {item.originalHeight}
                {item.wasDownscaled && item.targetWidth && item.targetHeight ? (
                  <span className="font-medium text-[#235c4f]">
                    {" "}
                    → {item.targetWidth} × {item.targetHeight}
                  </span>
                ) : null}
              </span>
            ) : null}
            {item.outputFilename && (
              <>
                <span>•</span>
                <span className="truncate max-w-[140px] text-[#527268]">
                  {item.outputFilename}
                </span>
              </>
            )}
          </div>

          {/* Size change comparison */}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[#708079]">
              {formatFileSize(item.originalSize)}
            </span>

            {(isDone || isAlreadyOptimized) && (
              <>
                <span className="text-[#a0b2aa]">→</span>
                <span className="font-semibold text-[#1a3328]">
                  {formatFileSize(item.compressedSize)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Status Badge + Actions */}
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        {/* Status indicator */}
        <div className="text-right">
          {isProcessing && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf3ed] px-2.5 py-1 text-xs font-medium text-[#235c4f]">
              <span className="h-2 w-2 animate-ping rounded-full bg-[#235c4f]" />
              Compressing...
            </span>
          )}

          {isAlreadyOptimized && (
            <span
              data-status="already-optimized"
              className="inline-flex items-center gap-1 rounded bg-[#f3f4f6] px-2.5 py-1 text-xs font-semibold text-[#4b5563]"
            >
              <FaCheck className="h-2.5 w-2.5 text-[#6b7280]" />
              Already optimized
            </span>
          )}

          {isDone && (
            <span
              data-status="saved"
              className="inline-flex items-center gap-1 rounded bg-[#eaf3ed] px-2.5 py-1 text-xs font-bold text-[#235c4f]"
            >
              -{item.percentageSaved}%
            </span>
          )}

          {isError && (
            <span
              data-status="error"
              className="inline-flex items-center gap-1 rounded bg-[#fdf4f3] px-2.5 py-1 text-xs font-medium text-[#a13c2f]"
              title={item.errorMessage}
            >
              <FaExclamationCircle className="h-3 w-3 shrink-0" />
              <span className="max-w-[150px] truncate">{item.errorMessage || "Error"}</span>
            </span>
          )}

          {item.status === "pending" && (
            <span className="text-xs text-[#708079]">Queued...</span>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            data-download-single={item.id}
            onClick={() => onDownloadSingle(item)}
            disabled={!item.blob || isProcessing || isError}
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[#c8d6cf] text-[#173d34] transition-colors hover:bg-[#eaf3ed] disabled:cursor-not-allowed disabled:opacity-30"
            title="Download this compressed image"
            aria-label={`Download compressed ${item.name}`}
          >
            <FaDownload className="h-3 w-3" />
          </button>

          <button
            type="button"
            data-remove-single={item.id}
            onClick={() => onRemove(index)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[#e5ece8] text-[#708079] transition-colors hover:border-[#f3cfc8] hover:bg-[#fdf4f3] hover:text-[#a13c2f]"
            title="Remove image"
            aria-label={`Remove ${item.name}`}
          >
            <FaTrash className="h-3 w-3" />
          </button>
        </div>
      </div>
    </article>
  );
}
