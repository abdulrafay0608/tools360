"use client";

import React from "react";
import {
  DOWNSCALE_PRESETS,
  FORMAT_PRESETS,
} from "../imageCompressorUtils";
import { FaShieldAlt, FaExclamationTriangle } from "react-icons/fa";

export default function ImageCompressorOptionsBar({
  options,
  onOptionsChange,
  hasPngWithJpgTarget,
  isProcessing,
}) {
  const isLosslessPng = options.outputFormat === "png";

  return (
    <div className="space-y-4 rounded-sm border border-[#dce5e0] bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#1a3328]">
            Compression Settings
          </h2>
          <p className="text-xs text-[#708079]">
            Adjust quality, output format, and max resolution. Changes apply automatically.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-[#eaf3ed] px-3 py-1 text-xs font-medium text-[#235c4f] sm:self-auto">
          <FaShieldAlt className="h-3 w-3" />
          <span>Metadata & EXIF stripped locally</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Quality slider */}
        <div className="flex flex-col justify-between rounded-sm border border-[#e5ece8] bg-[#f8faf9] p-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="quality-slider"
              className="text-xs font-semibold text-[#263e36]"
            >
              Quality Level
            </label>
            <span
              id="quality-value"
              className="rounded bg-[#eaf3ed] px-2 py-0.5 text-xs font-bold text-[#235c4f]"
            >
              {options.quality}%
            </span>
          </div>

          <div className="mt-2">
            <input
              id="quality-slider"
              type="range"
              min="10"
              max="100"
              step="1"
              value={options.quality}
              onChange={(e) => onOptionsChange("quality", Number(e.target.value))}
              disabled={isLosslessPng}
              aria-label="Compression quality percentage"
              className="h-2 w-full cursor-pointer accent-[#235c4f] disabled:cursor-not-allowed disabled:opacity-40"
            />
          </div>

          <p className="mt-1 text-[11px] leading-tight text-[#708079]">
            {isLosslessPng
              ? "Quality slider disabled for lossless PNG."
              : "Affects JPG & WebP (70–80% recommended)."}
          </p>
        </div>

        {/* Output format */}
        <div className="flex flex-col justify-between rounded-sm border border-[#e5ece8] bg-[#f8faf9] p-3">
          <label
            htmlFor="output-format-select"
            className="text-xs font-semibold text-[#263e36]"
          >
            Output Format
          </label>
          <div className="mt-2">
            <select
              id="output-format-select"
              value={options.outputFormat}
              onChange={(e) => onOptionsChange("outputFormat", e.target.value)}
              className="w-full rounded-sm border border-[#c8d6cf] bg-white px-2.5 py-1.5 text-xs font-medium text-[#1a3328] focus:border-[#235c4f] focus:outline-none focus:ring-1 focus:ring-[#235c4f]"
            >
              {FORMAT_PRESETS.map((fmt) => (
                <option key={fmt.value} value={fmt.value}>
                  {fmt.label}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1 text-[11px] leading-tight text-[#708079]">
            WebP provides 25–35% smaller sizes than JPG.
          </p>
        </div>

        {/* Max dimensions (Downscale) */}
        <div className="flex flex-col justify-between rounded-sm border border-[#e5ece8] bg-[#f8faf9] p-3">
          <label
            htmlFor="max-dimension-select"
            className="text-xs font-semibold text-[#263e36]"
          >
            Max Dimensions (Resize)
          </label>
          <div className="mt-2">
            <select
              id="max-dimension-select"
              value={options.maxDimension}
              onChange={(e) => onOptionsChange("maxDimension", e.target.value)}
              className="w-full rounded-sm border border-[#c8d6cf] bg-white px-2.5 py-1.5 text-xs font-medium text-[#1a3328] focus:border-[#235c4f] focus:outline-none focus:ring-1 focus:ring-[#235c4f]"
            >
              {DOWNSCALE_PRESETS.map((dim) => (
                <option key={dim.value} value={dim.value}>
                  {dim.label}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1 text-[11px] leading-tight text-[#708079]">
            Downscale large camera images to fit standard screens.
          </p>
        </div>
      </div>

      {/* Transparency conversion warning */}
      {hasPngWithJpgTarget && (
        <div
          id="transparency-warning"
          className="flex items-start gap-2 rounded-sm border border-[#f5dfb8] bg-[#fef9ed] p-3 text-xs text-[#92540c]"
          role="alert"
        >
          <FaExclamationTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#b45309]" />
          <div>
            <span className="font-semibold">Transparency Warning:</span> Converting
            transparent PNG images to JPG will fill transparent backgrounds with white,
            because JPEG does not support transparency. To preserve transparency, keep PNG or
            convert to WebP.
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="flex items-center gap-2 text-xs text-[#527268]">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#235c4f] border-t-transparent" />
          <span>Applying compression settings...</span>
        </div>
      )}
    </div>
  );
}
