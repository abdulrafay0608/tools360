"use client";

import React from "react";
import {
  FaColumns,
  FaLayerGroup,
  FaExchangeAlt,
  FaChevronLeft,
  FaChevronRight,
  FaSearchMinus,
  FaSearchPlus,
  FaDownload,
} from "react-icons/fa";
import KeyboardShortcutsModal from "./KeyboardShortcutsModal";

const ZOOM_LEVELS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

/**
 * ZoomControl component
 */
function ZoomControl({ zoomIndex, onZoomIn, onZoomOut }) {
  const level = ZOOM_LEVELS[zoomIndex] ?? 1.0;
  return (
    <div className="flex items-center gap-1 rounded-sm border border-[#dce5e0] bg-white">
      <button
        type="button"
        onClick={onZoomOut}
        disabled={zoomIndex <= 0}
        aria-label="Zoom out"
        className="flex h-8 w-8 items-center justify-center text-[#52675e] transition-colors hover:bg-[#f4f7f5] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FaSearchMinus className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-[3rem] select-none text-center text-xs font-semibold tabular-nums text-[#263e36]">
        {Math.round(level * 100)}%
      </span>
      <button
        type="button"
        onClick={onZoomIn}
        disabled={zoomIndex >= ZOOM_LEVELS.length - 1}
        aria-label="Zoom in"
        className="flex h-8 w-8 items-center justify-center text-[#52675e] transition-colors hover:bg-[#f4f7f5] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FaSearchPlus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/**
 * CompareControlsToolbar
 * Responsive control toolbar for Compare PDF tool.
 */
export default function CompareControlsToolbar({
  viewMode,
  onViewModeChange,
  pageNumber,
  maxPages,
  pageInput,
  onPageInputChange,
  onPageInputCommit,
  onPrevPage,
  onNextPage,
  zoomIndex,
  onZoomIn,
  onZoomOut,
  onDownloadDiff,
}) {
  const viewModes = [
    { id: "side-by-side", label: "Side by side", icon: FaColumns },
    { id: "overlay", label: "Overlay", icon: FaLayerGroup },
    { id: "difference", label: "Difference", icon: FaExchangeAlt },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dce5e0] bg-[#f8faf9] px-3 py-2 sm:px-4">
      {/* View Mode Switcher */}
      <div className="flex items-center gap-1 rounded-sm border border-[#dce5e0] bg-white p-1">
        {viewModes.map(({ id, label, icon: Icon }) => {
          const isActive = viewMode === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onViewModeChange(id)}
              aria-pressed={isActive}
              className={`flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-[#173d34] text-white"
                  : "text-[#52675e] hover:bg-[#f4f7f5] hover:text-[#173d34]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Page Navigation */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevPage}
          disabled={pageNumber <= 1}
          aria-label="Previous page"
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#dce5e0] bg-white text-[#52675e] transition-colors hover:bg-[#f4f7f5] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FaChevronLeft className="h-3.5 w-3.5" />
        </button>

        <div className="flex items-center gap-1 text-xs font-medium text-[#263e36]">
          <span>Page</span>
          <input
            type="text"
            value={pageInput}
            onChange={onPageInputChange}
            onBlur={onPageInputCommit}
            onKeyDown={(e) => e.key === "Enter" && onPageInputCommit()}
            aria-label="Page number"
            className="w-10 rounded-sm border border-[#dce5e0] bg-white px-1.5 py-1 text-center font-semibold text-[#1a3328] focus:border-[#235c4f] focus:outline-none"
          />
          <span>of {maxPages}</span>
        </div>

        <button
          type="button"
          onClick={onNextPage}
          disabled={pageNumber >= maxPages}
          aria-label="Next page"
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#dce5e0] bg-white text-[#52675e] transition-colors hover:bg-[#f4f7f5] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FaChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Zoom, Download & Shortcut Tools */}
      <div className="flex items-center gap-2">
        <ZoomControl
          zoomIndex={zoomIndex}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
        />

        {viewMode !== "side-by-side" && (
          <button
            type="button"
            onClick={onDownloadDiff}
            aria-label="Download comparison image"
            title="Download PNG image"
            className="flex h-8 items-center gap-1.5 rounded-sm border border-[#dce5e0] bg-white px-2.5 text-xs font-semibold text-[#235c4f] transition-colors hover:bg-[#f4f7f5]"
          >
            <FaDownload className="h-3 w-3" />
            <span className="hidden md:inline">Export</span>
          </button>
        )}

        <KeyboardShortcutsModal />
      </div>
    </div>
  );
}
