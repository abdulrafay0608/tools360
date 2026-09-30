"use client";

import React from "react";
import { FaExchangeAlt, FaTimes, FaFilePdf } from "react-icons/fa";
import Button from "@/components/ui/Button";

/**
 * StatsBar - Displays summary count of unchanged, changed, and missing pages.
 */
function StatsBar({ pageDiffs, maxPages, doc0Pages, doc1Pages }) {
  if (!pageDiffs || pageDiffs.length === 0) return null;

  const changed = pageDiffs.filter((d) => d && d.severity !== "none").length;
  const unchanged = pageDiffs.filter((d) => d && d.severity === "none").length;
  const missing = (maxPages - doc0Pages) + (maxPages - doc1Pages);

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-[#52675e]">
      <span className="font-semibold text-[#263e36]">Summary:</span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf7f2] px-2.5 py-0.5 text-[#1b7a43] font-medium">
        <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
        {unchanged} identical page{unchanged !== 1 ? "s" : ""}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fdf2f2] px-2.5 py-0.5 text-[#b91c1c] font-medium">
        <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
        {changed} changed page{changed !== 1 ? "s" : ""}
      </span>
      {missing > 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[#475569] font-medium">
          <span className="h-2 w-2 rounded-full bg-[#94a3b8]" />
          {missing} missing page{missing !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

/**
 * CompareHeaderBar
 * Top header showing selected files info, swap order, stats summary, and change files action.
 */
export default function CompareHeaderBar({
  originalFile,
  revisedFile,
  doc0Pages,
  doc1Pages,
  maxPages,
  pageDiffs,
  onSwapFiles,
  onChangeFiles,
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-[#e5ece8] bg-white pb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Document titles */}
        <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
          {/* File 1 */}
          <div className="flex items-center gap-2 rounded-sm border border-[#dce5e0] bg-[#f8faf9] px-3 py-2">
            <FaFilePdf className="h-4 w-4 shrink-0 text-[#235c4f]" />
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#235c4f]">
                1. Original
              </span>
              <p className="truncate text-xs font-semibold text-[#1a3328]" title={originalFile?.name}>
                {originalFile?.name || "Original PDF"}
              </p>
            </div>
            {doc0Pages > 0 && (
              <span className="shrink-0 text-[10px] font-medium text-[#708079]">
                {doc0Pages} pgs
              </span>
            )}
          </div>

          {/* File 2 */}
          <div className="flex items-center gap-2 rounded-sm border border-[#dce5e0] bg-[#f8faf9] px-3 py-2">
            <FaFilePdf className="h-4 w-4 shrink-0 text-[#235c4f]" />
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#235c4f]">
                2. Revised
              </span>
              <p className="truncate text-xs font-semibold text-[#1a3328]" title={revisedFile?.name}>
                {revisedFile?.name || "Revised PDF"}
              </p>
            </div>
            {doc1Pages > 0 && (
              <span className="shrink-0 text-[10px] font-medium text-[#708079]">
                {doc1Pages} pgs
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSwapFiles}
            icon={<FaExchangeAlt />}
            iconPosition="left"
            title="Swap Original and Revised files"
          >
            Swap
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onChangeFiles}
            icon={<FaTimes />}
            iconPosition="left"
          >
            Change Files
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <StatsBar
        pageDiffs={pageDiffs}
        maxPages={maxPages}
        doc0Pages={doc0Pages}
        doc1Pages={doc1Pages}
      />
    </header>
  );
}
