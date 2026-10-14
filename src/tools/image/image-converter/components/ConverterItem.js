"use client";

import React from "react";
import { formatFileSize } from "../imageConverterUtils";
import { FaDownload, FaTrash, FaCheck, FaExclamationCircle } from "react-icons/fa";

export default function ConverterItem({
  item,
  onDownloadSingle,
  onRemove,
}) {
  const isDone = item.status === "done";
  const isSkipped = item.status === "skipped";
  const isProcessing = item.status === "processing";
  const isError = item.status === "error";

  return (
    <article
      data-image-item={item.id}
      data-status={item.status}
      className="flex flex-col gap-3 rounded-sm border border-[#dce5e0] bg-white p-3.5 transition-shadow hover:shadow-xs sm:flex-row sm:items-center sm:justify-between"
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
            <div className="text-xs font-semibold text-[#a0b2aa]">
              {item.originalFormat || "IMG"}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="truncate text-xs font-semibold text-[#1a3328]"
            title={item.name}
          >
            {item.name}
          </p>

          {/* Formats and Dimensions */}
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[#708079]">
            <span className="font-semibold text-[#173d34]">
              {item.originalFormat}
            </span>
            <span>→</span>
            <span className="font-bold text-[#235c4f]">
              {item.targetFormat}
            </span>

            {item.width && item.height ? (
              <>
                <span>•</span>
                <span>{item.width} × {item.height}</span>
              </>
            ) : null}

            {item.outputFilename && (
              <>
                <span>•</span>
                <span className="truncate max-w-[150px] text-[#527268]">
                  {item.outputFilename}
                </span>
              </>
            )}
          </div>

          {/* Size change & Note */}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[#708079]">
              {formatFileSize(item.originalSize)}
            </span>

            {isDone && (
              <>
                <span className="text-[#a0b2aa]">→</span>
                <span className="font-semibold text-[#1a3328]">
                  {formatFileSize(item.convertedSize)}
                </span>
              </>
            )}

            {isSkipped && (
              <span className="text-xs font-medium text-[#708079]">
                (Same format; original bytes and metadata retained)
              </span>
            )}

            {isDone && item.note && (
              <span className="text-xs font-medium text-[#708079]">
                {item.note}
              </span>
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
              Converting...
            </span>
          )}

          {isSkipped && (
            <span
              data-status="skipped"
              className="inline-flex items-center gap-1 rounded-full bg-[#f0f4f2] px-2.5 py-1 text-[11px] font-medium text-[#527268]"
            >
              <span>Already {item.targetFormat}</span>
            </span>
          )}

          {isDone && (
            <span
              data-status="done"
              className="inline-flex items-center gap-1 rounded-full bg-[#eaf3ed] px-2.5 py-1 text-xs font-medium text-[#235c4f]"
            >
              <FaCheck className="h-3 w-3" />
              <span>Ready</span>
            </span>
          )}

          {isError && (
            <span
              data-status="error"
              className="inline-flex items-center gap-1 rounded-full bg-[#fdf4f3] px-2.5 py-1 text-xs font-medium text-[#a13c2f]"
              title={item.error}
            >
              <FaExclamationCircle className="h-3 w-3 shrink-0" />
              <span className="max-w-[120px] truncate sm:max-w-[160px]">
                {item.error}
              </span>
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            data-download-single="true"
            onClick={() => onDownloadSingle(item)}
            disabled={!item.blob || isProcessing}
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[#c8d6cf] text-[#235c4f] transition-colors hover:bg-[#eaf3ed] disabled:cursor-not-allowed disabled:opacity-40"
            title="Download converted file"
            aria-label={`Download ${item.outputFilename}`}
          >
            <FaDownload className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            data-remove-item="true"
            onClick={() => onRemove(item.id)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-transparent text-[#708079] transition-colors hover:text-[#a13c2f]"
            title="Remove from list"
            aria-label={`Remove ${item.name}`}
          >
            <FaTrash className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
