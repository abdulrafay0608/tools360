"use client";

import React, { useEffect, useRef } from "react";
import { severityColor } from "../compareUtils.js";

/**
 * PageThumbnailStrip
 * Sidebar strip displaying page thumbnails and visual difference severity badges.
 */
export default function PageThumbnailStrip({
  thumbnails,
  pageDiffs,
  maxPages,
  doc0Pages,
  doc1Pages,
  currentPage,
  onPageSelect,
}) {
  const activeRef = useRef(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [currentPage]);

  return (
    <aside
      aria-label="Page navigation strip"
      className="flex w-20 shrink-0 flex-col gap-1 overflow-y-auto border-r border-[#dce5e0] bg-[#f4f7f5] py-2 sm:w-24"
      style={{ maxHeight: "70vh" }}
    >
      {Array.from({ length: maxPages }, (_, i) => {
        const pageNum = i + 1;
        const isActive = currentPage === pageNum;
        const diff = pageDiffs[i];
        const hasDiff = diff && diff.severity !== "none";
        const isMissing = pageNum > doc0Pages || pageNum > doc1Pages;
        const thumbUrl = thumbnails?.[i];
        const badgeColor = diff ? severityColor(diff.severity) : "#94a3b8";

        return (
          <button
            key={pageNum}
            ref={isActive ? activeRef : null}
            type="button"
            onClick={() => onPageSelect(pageNum)}
            aria-label={`Go to page ${pageNum}${hasDiff ? " (has differences)" : ""}`}
            aria-current={isActive ? "true" : undefined}
            className={`group relative mx-2 flex flex-col items-center gap-1 border p-1 text-center transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#235c4f] ${
              isActive
                ? "border-[#235c4f] bg-white shadow-sm"
                : "border-transparent hover:border-[#b8c9c0] hover:bg-white"
            }`}
          >
            {/* Thumbnail Box */}
            <div
              className="relative w-full overflow-hidden bg-white"
              style={{ aspectRatio: "0.7" }}
            >
              {thumbUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbUrl}
                  alt={`Page ${pageNum} preview`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-[#eef2ef]">
                  {isMissing ? (
                    <span className="text-[10px] text-[#94a3b8]">—</span>
                  ) : (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#dce5e0] border-t-[#235c4f]" />
                  )}
                </div>
              )}

              {/* Severity badge dot */}
              {diff && (
                <span
                  className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full ring-1 ring-white"
                  style={{ background: badgeColor }}
                  aria-hidden="true"
                />
              )}
            </div>

            <span
              className={`text-[10px] font-medium tabular-nums ${
                isActive ? "text-[#173d34]" : "text-[#708079]"
              }`}
            >
              {pageNum}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
