import React from "react";
import { saveAs } from "file-saver";
import { FaCheck, FaDownload, FaExclamationCircle, FaTrash } from "react-icons/fa";
import { formatFileSize } from "../../utils/imageSharedUtils.js";

export default function ResizerItem({ item, onRemove, onDownload }) {
  const {
    id,
    file,
    status,
    error,
    blob,
    progress = 0,
    outputFilename,
    originalWidth,
    originalHeight,
    targetWidth,
    targetHeight,
    thumbnailUrl,
    warning,
    wasCapped,
  } = item;
  const isResizing = status === "resizing";
  const isDone = status === "done";
  const isError = status === "error";

  const handleDownload = () => {
    if (!blob || !outputFilename) return;
    if (onDownload) onDownload(item);
    else saveAs(blob, outputFilename);
  };

  return (
    <article
      data-image-item={id}
      data-status={status}
      className="flex flex-col gap-3 rounded-sm border border-[#dce5e0] bg-white p-3.5 transition-shadow hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-[#e5ece8] bg-[#f8faf9]">
          {thumbnailUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={thumbnailUrl} alt={file.name} className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-[#a0b2aa]">IMG</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-[#1a3328]" title={file.name}>
            {file.name}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[#708079]">
            {originalWidth && originalHeight ? (
              <span>
                {originalWidth} × {originalHeight}
                {targetWidth && targetHeight && (
                  <span className="font-medium text-[#235c4f]">
                    {" "}→ {targetWidth} × {targetHeight}
                  </span>
                )}
              </span>
            ) : (
              <span>Reading dimensions…</span>
            )}
            {outputFilename && (
              <>
                <span>•</span>
                <span className="max-w-[180px] truncate text-[#527268]">{outputFilename}</span>
              </>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[#708079]">{formatFileSize(file.size)}</span>
            {isDone && blob && (
              <>
                <span className="text-[#a0b2aa]">→</span>
                <span className="font-semibold text-[#1a3328]">{formatFileSize(blob.size)}</span>
              </>
            )}
          </div>
          {isResizing && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#e5ece8]">
              <div
                className="h-full rounded-full bg-[#235c4f] transition-all duration-300"
                style={{ width: `${Math.max(5, progress)}%` }}
              />
            </div>
          )}
          {warning && isDone && (
            <p className="mt-1 text-[11px] text-amber-800" role="status">{warning}</p>
          )}
          {wasCapped && isDone && (
            <p className="mt-1 text-[11px] text-amber-800" role="status">
              Output capped at 8192 px per side.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <div className="text-right">
          {isResizing && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf3ed] px-2.5 py-1 text-xs font-medium text-[#235c4f]">
              <span className="h-2 w-2 animate-ping rounded-full bg-[#235c4f]" />
              Resizing…
            </span>
          )}
          {isDone && (
            <span className="inline-flex items-center gap-1 rounded bg-[#eaf3ed] px-2.5 py-1 text-xs font-bold text-[#235c4f]">
              <FaCheck className="h-2.5 w-2.5" /> Resized
            </span>
          )}
          {isError && (
            <span
              className="inline-flex max-w-[180px] items-center gap-1 rounded bg-[#fdf4f3] px-2.5 py-1 text-xs font-medium text-[#a13c2f]"
              title={error}
              data-status="error"
            >
              <FaExclamationCircle className="h-3 w-3 shrink-0" />
              <span className="truncate">{error || "Error"}</span>
            </span>
          )}
          {status === "pending" && <span className="text-xs text-[#708079]">Queued…</span>}
          {status === "cancelled" && <span className="text-xs text-[#708079]">Cancelled</span>}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            data-download-single={id}
            onClick={handleDownload}
            disabled={!blob || isResizing || isError}
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[#c8d6cf] text-[#173d34] transition-colors hover:bg-[#eaf3ed] disabled:cursor-not-allowed disabled:opacity-30"
            title="Download resized image"
            aria-label={`Download resized ${file.name}`}
          >
            <FaDownload className="h-3 w-3" />
          </button>
          <button
            type="button"
            data-remove-single={id}
            onClick={() => onRemove(id)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[#e5ece8] text-[#708079] transition-colors hover:border-[#f3cfc8] hover:bg-[#fdf4f3] hover:text-[#a13c2f]"
            title="Remove image"
            aria-label={`Remove ${file.name}`}
          >
            <FaTrash className="h-3 w-3" />
          </button>
        </div>
      </div>
    </article>
  );
}
