"use client";

import React from "react";
import { FaFilePdf, FaExclamationTriangle, FaRedo } from "react-icons/fa";
import Button from "@/components/ui/Button";
import { formatFileSize } from "@/components/utils/pdfUtils";

/**
 * PdfToJpgHeader
 * Top summary header bar showing selected PDF metadata, large file warning, and change file action.
 */
export default function PdfToJpgHeader({
  file,
  totalPages,
  onClear,
}) {
  const isLargeFile = file && file.size > 100 * 1024 * 1024; // >100MB

  return (
    <div className="space-y-3 border-b border-[#e5ece8] pb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#e6f0eb] text-[#235c4f]">
            <FaFilePdf className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#1a3328]" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-[#708079]">
              {formatFileSize(file.size)}
              {totalPages > 0 ? ` · ${totalPages} page${totalPages !== 1 ? "s" : ""}` : ""}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClear}
          icon={<FaRedo />}
          iconPosition="left"
        >
          Choose another PDF
        </Button>
      </div>

      {isLargeFile && (
        <div className="flex items-center gap-2 rounded-sm border border-[#fed7aa] bg-[#fff7ed] px-3.5 py-2 text-xs text-[#9a3412]">
          <FaExclamationTriangle className="h-4 w-4 shrink-0 text-[#ea580c]" />
          <span>
            <strong>Large PDF detected (&gt;100 MB).</strong> Conversion runs entirely on your device and may take a moment depending on your available memory.
          </span>
        </div>
      )}
    </div>
  );
}
