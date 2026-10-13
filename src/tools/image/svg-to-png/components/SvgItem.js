"use client";

import React from "react";
import { formatFileSize } from "../svgToPngUtils";
import { FaDownload, FaTrash, FaCheck, FaExclamationCircle, FaShieldAlt } from "react-icons/fa";

export default function SvgItem({
  item,
  onDownloadSingle,
  onRemove,
}) {
  const isDone = item.status === "done";
  const isProcessing = item.status === "processing";
  const isError = item.status === "error";

  const checkerboardStyle = {
    backgroundColor: "#ffffff",
    backgroundImage: `
      linear-gradient(45deg, #edf2ef 25%, transparent 25%),
      linear-gradient(-45deg, #edf2ef 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #edf2ef 75%),
      linear-gradient(-45deg, transparent 75%, #edf2ef 75%)
    `,
    backgroundSize: "12px 12px",
    backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
  };

  return (
    <article
      data-image-item={item.id}
      data-status={item.status}
      className="flex flex-col gap-3 rounded-sm border border-[#dce5e0] bg-white p-3.5 transition-shadow hover:shadow-xs sm:flex-row sm:items-center sm:justify-between"
    >
      {/* Thumbnail + Name & Info */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div
          style={checkerboardStyle}
          className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-[#e5ece8]"
        >
          {item.previewUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.previewUrl}
              alt={item.name}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="text-[11px] font-bold text-[#a0b2aa]">SVG</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="truncate text-xs font-semibold text-[#1a3328]"
            title={item.name}
          >
            {item.name}
          </p>

          {/* Dimensions */}
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[#708079]">
            {item.origWidth && item.origHeight ? (
              <span>
                SVG: {item.origWidth} × {item.origHeight}
                {item.hasDefaultDimensions && (
                  <span className="text-[#a16207]"> (default)</span>
                )}
              </span>
            ) : null}

            {item.targetWidth && item.targetHeight ? (
              <>
                <span>→</span>
                <span className="font-bold text-[#235c4f]">
                  PNG: {item.targetWidth} × {item.targetHeight}
                </span>
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

          {/* Size & Sanitization Badges */}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            {item.pngSize ? (
              <span className="font-semibold text-[#1a3328]">
                {formatFileSize(item.pngSize)}
              </span>
            ) : (
              <span className="text-[#708079]">
                {formatFileSize(item.fileSize)}
              </span>
            )}

            {item.hasDefaultDimensions && (
              <span className="rounded bg-[#fef9c3] px-1.5 py-0.5 text-[10px] font-medium text-[#854d0e]">
                No dimensions in SVG, used 512×512px
              </span>
            )}

            {item.removedCount > 0 && (
              <span
                data-sanitized-note="true"
                className="inline-flex items-center gap-1 rounded bg-[#eaf3ed] px-1.5 py-0.5 text-[10px] font-medium text-[#235c4f]"
              >
                <FaShieldAlt className="h-2.5 w-2.5" />
                <span>Sanitized ({item.removedCount} unsafe elements removed)</span>
              </span>
            )}

            {item.wasCapped && (
              <span className="rounded bg-[#fef3c7] px-1.5 py-0.5 text-[10px] font-medium text-[#92400e]">
                Capped at 8192px
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
              Rendering...
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
              <span className="max-w-[140px] truncate sm:max-w-[180px]">
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
            disabled={!item.blob || isProcessing || isError}
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[#c8d6cf] text-[#235c4f] transition-colors hover:bg-[#eaf3ed] disabled:cursor-not-allowed disabled:opacity-40"
            title="Download PNG"
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
