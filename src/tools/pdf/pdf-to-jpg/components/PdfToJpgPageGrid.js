"use client";

import React from "react";
import { FaDownload, FaCheck, FaCheckSquare, FaSquare } from "react-icons/fa";
import Button from "@/components/ui/Button";

/**
 * PdfToJpgPageGrid
 * Grid of PDF page thumbnails with page selection checkboxes and single-page quick download.
 */
export default function PdfToJpgPageGrid({
  totalPages,
  thumbnails,
  selectedPages,
  onTogglePage,
  onSelectAll,
  onDeselectAll,
  onDownloadSinglePage,
  isConverting,
}) {
  const allSelected = selectedPages.length === totalPages;

  return (
    <div className="space-y-4">
      {/* Grid header toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5ece8] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#1a3328]">
            PDF Pages ({selectedPages.length}/{totalPages} selected)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={allSelected ? onDeselectAll : onSelectAll}
            icon={allSelected ? <FaSquare /> : <FaCheckSquare />}
            iconPosition="left"
          >
            {allSelected ? "Deselect All" : "Select All"}
          </Button>
        </div>
      </div>

      {/* Thumbnails grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: totalPages }, (_, i) => {
          const pageNum = i + 1;
          const isSelected = selectedPages.includes(pageNum);
          const thumbUrl = thumbnails[i];

          return (
            <div
              key={pageNum}
              onClick={() => onTogglePage(pageNum)}
              className={`group relative flex cursor-pointer flex-col justify-between rounded-sm border p-2 transition-all ${
                isSelected
                  ? "border-[#235c4f] bg-white shadow-sm ring-1 ring-[#235c4f]"
                  : "border-[#dce5e0] bg-[#f8faf9] opacity-70 hover:border-[#b8c9c0] hover:opacity-100"
              }`}
            >
              {/* Checkbox badge */}
              <div
                className={`absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded transition-colors ${
                  isSelected
                    ? "bg-[#173d34] text-white"
                    : "border border-[#b8c9c0] bg-white"
                }`}
                aria-label={`Select page ${pageNum}`}
              >
                {isSelected && <FaCheck className="h-2.5 w-2.5" />}
              </div>

              {/* Page Number badge */}
              <div className="absolute right-2 top-2 z-10 rounded bg-[#173d34]/80 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                {pageNum}
              </div>

              {/* Thumbnail Container */}
              <div
                className="relative my-4 flex items-center justify-center overflow-hidden bg-white"
                style={{ aspectRatio: "0.72" }}
              >
                {thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbUrl}
                    alt={`Page ${pageNum} preview`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#f4f7f5]">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#dce5e0] border-t-[#235c4f]" />
                  </div>
                )}
              </div>

              {/* Single page quick download button */}
              <div className="border-t border-[#eef2ef] pt-2 text-center" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  disabled={isConverting}
                  onClick={() => onDownloadSinglePage(pageNum)}
                  title={`Download page ${pageNum} as JPG`}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-sm bg-[#eaf3ed] py-1 text-xs font-semibold text-[#235c4f] transition-colors hover:bg-[#d6ebd9] disabled:opacity-50"
                >
                  <FaDownload className="h-2.5 w-2.5" />
                  <span>JPG</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
