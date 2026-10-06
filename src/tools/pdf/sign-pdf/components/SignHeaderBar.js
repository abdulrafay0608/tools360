"use client";

import React from "react";
import {
  FaFilePdf,
  FaPen,
  FaCalendarAlt,
  FaDownload,
  FaRedo,
  FaCheckCircle,
} from "react-icons/fa";
import Button from "@/components/ui/Button";
import { formatFileSize } from "@/components/utils/pdfUtils";

/**
 * SignHeaderBar
 * Top header displaying PDF document info and primary signature actions.
 */
export default function SignHeaderBar({
  file,
  totalPages,
  placedCount,
  onOpenSignatureModal,
  onAddDateStamp,
  onDownload,
  onClearFile,
  isProcessing,
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#e5ece8] pb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Document Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#e6f0eb] text-[#235c4f]">
            <FaFilePdf className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#1a3328]" title={file.name}>
              {file.name}
            </p>
            <div className="flex items-center gap-2 text-xs text-[#708079]">
              <span>{formatFileSize(file.size)}</span>
              <span>·</span>
              <span>{totalPages} page{totalPages !== 1 ? "s" : ""}</span>
              {placedCount > 0 && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#16a34a]">
                    <FaCheckCircle className="h-3 w-3" />
                    {placedCount} signature{placedCount !== 1 ? "s" : ""} placed
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Change file */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClearFile}
          icon={<FaRedo />}
          iconPosition="left"
        >
          Choose another PDF
        </Button>
      </div>

      {/* Main Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-sm bg-[#f8faf9] p-3 border border-[#dce5e0]">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenSignatureModal}
            icon={<FaPen />}
            iconPosition="left"
            className="bg-white"
          >
            Add Signature
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddDateStamp}
            icon={<FaCalendarAlt />}
            iconPosition="left"
            className="bg-white"
          >
            Add Date Stamp
          </Button>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onDownload}
          disabled={isProcessing || placedCount === 0}
          icon={<FaDownload />}
          iconPosition="left"
          className="w-full sm:w-auto"
        >
          {isProcessing
            ? "Signing Document..."
            : placedCount === 0
            ? "Place a signature to download"
            : "Download Signed PDF"}
        </Button>
      </div>
    </div>
  );
}
