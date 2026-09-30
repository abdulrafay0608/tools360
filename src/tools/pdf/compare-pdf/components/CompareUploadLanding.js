"use client";

import React, { useRef } from "react";
import {
  FaExchangeAlt,
  FaColumns,
  FaLayerGroup,
  FaTrashAlt,
  FaFilePdf,
  FaArrowRight,
} from "react-icons/fa";
import FileUploader from "@/components/pdf/file/FileUploader";
import Button from "@/components/ui/Button";
import { formatFileSize } from "@/components/utils/pdfUtils";

/**
 * CompareUploadLanding
 * Consistent initial upload layout matching Merge/Split/Compress tools.
 * Supports batch 2-file upload or individual Original/Revised document selection.
 */
export default function CompareUploadLanding({
  originalFile,
  revisedFile,
  onSelectOriginal,
  onSelectRevised,
  onBatchUpload,
  onSwapFiles,
  onClearOriginal,
  onClearRevised,
  onCompare,
  error,
}) {
  const originalInputRef = useRef(null);
  const revisedInputRef = useRef(null);

  const handleSingleUpload = (e, slot) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return;
    }
    if (slot === "original") {
      onSelectOriginal(file);
    } else {
      onSelectRevised(file);
    }
    e.target.value = "";
  };

  const hasBothFiles = Boolean(originalFile && revisedFile);

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="border-b border-[#e5ece8] pb-4">
        <h2 className="text-xl font-semibold text-[#1a3328] sm:text-2xl">
          Compare PDF Documents
        </h2>
        <p className="mt-1 text-sm text-[#52675e]">
          Upload the <strong>original</strong> and <strong>revised</strong> PDF files to analyze changes side-by-side, overlay transparency, or visual diffs. Processing is fast and 100% private in your browser.
        </p>
      </div>

      {error && (
        <div className="rounded-sm border border-[#f3cfc8] bg-[#fdf4f3] px-4 py-3 text-sm text-[#a13c2f]" role="alert">
          {error}
        </div>
      )}

      {/* Upload Choice Area */}
      {!originalFile && !revisedFile ? (
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#708079]">
            Select 2 PDF files to compare
          </p>
          <FileUploader
            onUpload={onBatchUpload}
            accept="application/pdf,.pdf"
            multiple
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Document Slot Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Slot 1: Original Document */}
            <div className="flex flex-col justify-between rounded-sm border border-[#dce5e0] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#eef2ef] pb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#235c4f]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e6f0eb] text-[11px] text-[#173d34]">
                    1
                  </span>
                  Original Document
                </span>
                {originalFile && (
                  <button
                    type="button"
                    onClick={onClearOriginal}
                    className="p-1 text-[#708079] transition-colors hover:text-[#a13c2f]"
                    title="Remove original file"
                    aria-label="Remove original file"
                  >
                    <FaTrashAlt className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {originalFile ? (
                <div className="my-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#e6f0eb] text-[#235c4f]">
                    <FaFilePdf className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#1a3328]" title={originalFile.name}>
                      {originalFile.name}
                    </p>
                    <p className="text-xs text-[#708079]">{formatFileSize(originalFile.size)}</p>
                  </div>
                </div>
              ) : (
                <div className="my-6 flex flex-col items-center justify-center rounded-sm border border-dashed border-[#b8c9c0] p-4 text-center">
                  <p className="text-xs text-[#708079]">Select original version</p>
                  <input
                    ref={originalInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(e) => handleSingleUpload(e, "original")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => originalInputRef.current?.click()}
                  >
                    Choose Original File
                  </Button>
                </div>
              )}
            </div>

            {/* Slot 2: Revised Document */}
            <div className="flex flex-col justify-between rounded-sm border border-[#dce5e0] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#eef2ef] pb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#235c4f]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e6f0eb] text-[11px] text-[#173d34]">
                    2
                  </span>
                  Revised Document
                </span>
                {revisedFile && (
                  <button
                    type="button"
                    onClick={onClearRevised}
                    className="p-1 text-[#708079] transition-colors hover:text-[#a13c2f]"
                    title="Remove revised file"
                    aria-label="Remove revised file"
                  >
                    <FaTrashAlt className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {revisedFile ? (
                <div className="my-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#e6f0eb] text-[#235c4f]">
                    <FaFilePdf className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#1a3328]" title={revisedFile.name}>
                      {revisedFile.name}
                    </p>
                    <p className="text-xs text-[#708079]">{formatFileSize(revisedFile.size)}</p>
                  </div>
                </div>
              ) : (
                <div className="my-6 flex flex-col items-center justify-center rounded-sm border border-dashed border-[#b8c9c0] p-4 text-center">
                  <p className="text-xs text-[#708079]">Select revised version</p>
                  <input
                    ref={revisedInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(e) => handleSingleUpload(e, "revised")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => revisedInputRef.current?.click()}
                  >
                    Choose Revised File
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Action Bar for Upload State */}
          <div className="flex flex-col items-center justify-between gap-3 rounded-sm bg-[#f8faf9] p-4 border border-[#dce5e0] sm:flex-row">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSwapFiles}
                disabled={!originalFile && !revisedFile}
                icon={<FaExchangeAlt />}
                iconPosition="left"
              >
                Swap Original & Revised
              </Button>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={!hasBothFiles}
              onClick={onCompare}
              icon={<FaArrowRight />}
              iconPosition="right"
              className="w-full sm:w-auto"
            >
              Compare Documents
            </Button>
          </div>
        </div>
      )}

      {/* Tool Features Summary */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            title: "Side-by-Side View",
            desc: "View original and revised pages in synchronized scrollable panels.",
            icon: FaColumns,
          },
          {
            title: "Transparency Overlay",
            desc: "Blend both pages with live opacity adjustment to spot position shifts.",
            icon: FaLayerGroup,
          },
          {
            title: "Difference Highlight",
            desc: "Visual pixel diff highlights added, removed, or modified content in red.",
            icon: FaExchangeAlt,
          },
        ].map(({ title, desc, icon: Icon }) => (
          <div
            key={title}
            className="flex flex-col gap-2 rounded-sm border border-[#dce5e0] bg-[#f8faf9] p-4 transition-colors hover:bg-white"
          >
            <div className="flex h-9 w-9 items-center justify-center bg-[#e6f0eb] text-[#235c4f]">
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold text-[#263e36]">{title}</p>
            <p className="text-xs leading-5 text-[#627a6e]">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
