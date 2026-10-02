"use client";

import React from "react";
import { FaDownload, FaSlidersH, FaFileArchive } from "react-icons/fa";
import Button from "@/components/ui/Button";

/**
 * PdfToJpgOptionsBar
 * Options panel for setting JPG image quality, DPI scale resolution, and initiating conversion.
 */
export default function PdfToJpgOptionsBar({
  quality,
  onQualityChange,
  scalePreset,
  onScaleChange,
  selectedCount,
  totalPages,
  isConverting,
  progress,
  onConvert,
}) {
  const isMultiple = selectedCount > 1;

  return (
    <aside className="flex flex-col gap-5 rounded-sm border border-[#dce5e0] bg-[#f8faf9] p-4 sm:p-5">
      <div className="flex items-center gap-2 border-b border-[#dce5e0] pb-3 text-[#1a3328]">
        <FaSlidersH className="h-4 w-4 text-[#235c4f]" />
        <h3 className="text-sm font-semibold uppercase tracking-wider">
          Conversion Settings
        </h3>
      </div>

      {/* Image Quality setting */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-[#263e36]">
          Image Quality
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: "low", label: "Low (60%)", desc: "Smallest" },
            { id: "medium", label: "Medium (80%)", desc: "Balanced" },
            { id: "high", label: "High (95%)", desc: "Best" },
          ].map(({ id, label }) => {
            const active = quality === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onQualityChange(id)}
                className={`rounded-sm border py-2 text-xs font-semibold transition-colors ${
                  active
                    ? "border-[#235c4f] bg-[#173d34] text-white"
                    : "border-[#dce5e0] bg-white text-[#52675e] hover:border-[#7e9b8c] hover:bg-[#f4f7f5]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Image Resolution / Scale setting */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-[#263e36]">
          Image Resolution (DPI)
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: "1x", label: "1x (~96 DPI)" },
            { id: "1.5x", label: "1.5x (~150 DPI)" },
            { id: "2x", label: "2x (~300 DPI)" },
          ].map(({ id, label }) => {
            const active = scalePreset === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onScaleChange(id)}
                className={`rounded-sm border py-2 text-xs font-semibold transition-colors ${
                  active
                    ? "border-[#235c4f] bg-[#173d34] text-white"
                    : "border-[#dce5e0] bg-white text-[#52675e] hover:border-[#7e9b8c] hover:bg-[#f4f7f5]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selection summary */}
      <div className="rounded-sm bg-[#eaf3ed] p-3 text-xs text-[#235c4f]">
        <p className="font-semibold">
          {selectedCount === 0
            ? "No pages selected"
            : selectedCount === totalPages
            ? `All ${totalPages} pages selected`
            : `${selectedCount} of ${totalPages} pages selected`}
        </p>
        <p className="mt-0.5 text-[11px] text-[#527268]">
          {isMultiple
            ? "Pages will be converted and downloaded as a ZIP archive."
            : "Page will be downloaded directly as a JPG image."}
        </p>
      </div>

      {/* Conversion Progress Bar */}
      {isConverting && progress && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-[#263e36]">
            <span>Converting pages...</span>
            <span>
              {progress.current} / {progress.total}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#dce5e0]">
            <div
              className="h-full bg-[#235c4f] transition-all duration-200"
              style={{
                width: `${(progress.current / progress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Convert & Download Button */}
      <div className="pt-2">
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onConvert}
          disabled={isConverting || selectedCount === 0}
          icon={isMultiple ? <FaFileArchive /> : <FaDownload />}
          iconPosition="left"
          className="w-full justify-center"
        >
          {isConverting
            ? "Converting to JPG..."
            : isMultiple
            ? `Convert ${selectedCount} Pages to JPG (ZIP)`
            : "Convert & Download JPG"}
        </Button>
      </div>
    </aside>
  );
}
