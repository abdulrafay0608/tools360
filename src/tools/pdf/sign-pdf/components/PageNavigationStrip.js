"use client";

import React, { useRef, useEffect } from "react";
import { FaCheckCircle } from "react-icons/fa";

/**
 * PageNavigationStrip
 * Sidebar thumbnail navigator for jumping across PDF pages with signature placement indicators.
 */
export default function PageNavigationStrip({
  totalPages,
  thumbnails,
  currentPage,
  placedSignatures,
  onSelectPage,
}) {
  const activeRef = useRef(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [currentPage]);

  return (
    <aside
      aria-label="PDF Page thumbnails"
      className="flex w-24 shrink-0 flex-col gap-1.5 overflow-y-auto border-r border-[#dce5e0] bg-[#f8faf9] p-2"
      style={{ maxHeight: "650px" }}
    >
      {Array.from({ length: totalPages }, (_, i) => {
        const pageNum = i + 1;
        const isActive = currentPage === pageNum;
        const pageHasSignature = placedSignatures.some((s) => s.pageNum === pageNum);
        const thumbUrl = thumbnails[i];

        return (
          <button
            key={pageNum}
            ref={isActive ? activeRef : null}
            type="button"
            onClick={() => onSelectPage(pageNum)}
            aria-label={`Go to page ${pageNum}`}
            aria-current={isActive ? "true" : undefined}
            className={`group relative flex flex-col items-center gap-1 rounded-sm border p-1 text-center transition-all ${
              isActive
                ? "border-[#235c4f] bg-white shadow-sm ring-1 ring-[#235c4f]"
                : "border-transparent hover:border-[#b8c9c0] hover:bg-white"
            }`}
          >
            {/* Thumbnail Box */}
            <div
              className="relative w-full overflow-hidden bg-white shadow-2xs"
              style={{ aspectRatio: "0.72" }}
            >
              {thumbUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbUrl}
                  alt={`Page ${pageNum} thumbnail`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-[#f4f7f5]">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#dce5e0] border-t-[#235c4f]" />
                </div>
              )}

              {/* Signed indicator badge */}
              {pageHasSignature && (
                <span
                  className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#16a34a] text-white shadow-xs"
                  title="Page has signatures"
                >
                  <FaCheckCircle className="h-2.5 w-2.5" />
                </span>
              )}
            </div>

            <span
              className={`text-[10px] font-semibold tabular-nums ${
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
