"use client";

import React from "react";
import { FaFilePdf, FaCog } from "react-icons/fa";
import Button from "@/components/ui/Button";

/**
 * JpgToPdfOptionsBar
 * Options panel for setting page orientation, size, margins, and output filename.
 */
export default function JpgToPdfOptionsBar({
  options,
  onOptionsChange,
  filename,
  onFilenameChange,
  onConvert,
  isConverting,
  imageCount,
}) {
  return (
    <aside className="flex flex-col gap-5 rounded-sm border border-[#dce5e0] bg-[#f8faf9] p-4 sm:p-5">
      <div className="flex items-center gap-2 border-b border-[#dce5e0] pb-3 text-[#1a3328]">
        <FaCog className="h-4 w-4 text-[#235c4f]" />
        <h3 className="text-sm font-semibold uppercase tracking-wider">
          PDF Settings
        </h3>
      </div>

      {/* Output Mode (Separate ZIP vs Single PDF) */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-[#263e36]">
          Output Mode
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: "zip", label: "Separate PDFs (ZIP)" },
            { id: "single", label: "One Single PDF" },
          ].map(({ id, label }) => {
            const active = (options.outputMode || "zip") === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onOptionsChange("outputMode", id)}
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

      {/* Page Orientation */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-[#263e36]">
          Page Orientation
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: "auto", label: "Auto" },
            { id: "portrait", label: "Portrait" },
            { id: "landscape", label: "Landscape" },
          ].map(({ id, label }) => {
            const active = options.orientation === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onOptionsChange("orientation", id)}
                className={`rounded-sm border py-1.5 text-xs font-semibold transition-colors ${
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

      {/* Page Size */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-[#263e36]">
          Page Size
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: "fit", label: "Fit Image" },
            { id: "a4", label: "A4 Page" },
            { id: "letter", label: "US Letter" },
          ].map(({ id, label }) => {
            const active = options.pageSize === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onOptionsChange("pageSize", id)}
                className={`rounded-sm border py-1.5 text-xs font-semibold transition-colors ${
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

      {/* Margins */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-[#263e36]">
          Page Margin
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: "none", label: "No Margin" },
            { id: "small", label: "Small" },
            { id: "big", label: "Big" },
          ].map(({ id, label }) => {
            const active = options.margin === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onOptionsChange("margin", id)}
                className={`rounded-sm border py-1.5 text-xs font-semibold transition-colors ${
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

      {/* Output Filename */}
      <div className="space-y-1.5">
        <label htmlFor="filename-input" className="block text-xs font-semibold text-[#263e36]">
          Output Filename
        </label>
        <input
          id="filename-input"
          type="text"
          value={filename}
          onChange={(e) => onFilenameChange(e.target.value)}
          placeholder="converted.pdf"
          className="w-full rounded-sm border border-[#dce5e0] bg-white px-3 py-2 text-xs text-[#1a3328] focus:border-[#235c4f] focus:outline-none"
        />
      </div>

      {/* Convert Button */}
      <div className="pt-2">
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onConvert}
          disabled={isConverting || imageCount === 0}
          icon={<FaFilePdf />}
          iconPosition="left"
          className="w-full justify-center"
        >
          {isConverting ? "Converting Images..." : `Convert ${imageCount} Image${imageCount !== 1 ? "s" : ""} to PDF`}
        </Button>
      </div>
    </aside>
  );
}
