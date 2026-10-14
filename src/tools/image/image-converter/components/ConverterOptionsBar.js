"use client";

import React from "react";
import { TARGET_FORMATS } from "../imageConverterUtils";
import { FaShieldAlt, FaExclamationTriangle } from "react-icons/fa";

export default function ConverterOptionsBar({
  options,
  onOptionsChange,
  hasTransparentToJpg,
  disabled = false,
}) {
  const isLosslessPng = options.targetFormat === "png";
  const isJpg = options.targetFormat === "jpg";

  return (
    <div
      data-converter-options="true"
      className="space-y-4 rounded-sm border border-[#dce5e0] bg-white p-4 sm:p-5"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#1a3328]">
            Conversion Settings
          </h2>
          <p className="text-xs text-[#708079]">
            Choose target format and output quality. Re-processing runs automatically.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-[#eaf3ed] px-3 py-1 text-xs font-medium text-[#235c4f] sm:self-auto">
          <FaShieldAlt className="h-3 w-3" />
          <span>Re-encoded outputs omit source metadata • same-format files retain original metadata</span>
        </div>
      </div>

      {/* Target Format - 3 Big Buttons */}
      <div>
        <label className="block text-xs font-semibold text-[#263e36] mb-2">
          Target Format
        </label>
        <div className="grid grid-cols-3 gap-3">
          {TARGET_FORMATS.map((fmt) => {
            const isSelected = options.targetFormat === fmt.value;
            return (
              <button
                key={fmt.value}
                type="button"
                data-format-button={fmt.value}
                onClick={() => onOptionsChange("targetFormat", fmt.value)}
                disabled={disabled}
                className={`flex flex-col items-center justify-center rounded-sm border py-3 px-2 text-center transition-all ${
                  isSelected
                    ? "border-[#235c4f] bg-[#eaf3ed] text-[#173d34] shadow-xs font-bold ring-1 ring-[#235c4f]"
                    : "border-[#dce5e0] bg-[#f8faf9] text-[#527268] hover:border-[#a0b2aa] hover:bg-white"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <span className="text-sm sm:text-base font-extrabold">{fmt.label}</span>
                <span className="text-[10px] sm:text-xs text-[#708079] mt-0.5">
                  {fmt.value === "png"
                    ? "Lossless, transparent"
                    : fmt.value === "jpg"
                    ? "Universal, compact"
                    : "Modern, high compression"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Quality slider */}
        <div className="flex flex-col justify-between rounded-sm border border-[#e5ece8] bg-[#f8faf9] p-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="converter-quality-slider"
              className="text-xs font-semibold text-[#263e36]"
            >
              Output Quality
            </label>
            <span
              id="converter-quality-value"
              className="rounded bg-[#eaf3ed] px-2 py-0.5 text-xs font-bold text-[#235c4f]"
            >
              {isLosslessPng ? "100% (Lossless)" : `${options.quality}%`}
            </span>
          </div>

          <div className="mt-2">
            <input
              id="converter-quality-slider"
              type="range"
              min="10"
              max="100"
              step="5"
              value={options.quality}
              onChange={(e) => onOptionsChange("quality", Number(e.target.value))}
              disabled={isLosslessPng || disabled}
              aria-label="Conversion quality percentage"
              className="h-2 w-full cursor-pointer accent-[#235c4f] disabled:cursor-not-allowed disabled:opacity-40"
            />
          </div>

          <p className="mt-1 text-[11px] leading-tight text-[#708079]">
            {isLosslessPng
              ? "PNG is a lossless format — quality slider is disabled."
              : "Quality slider applies to JPG & WebP (80–90% recommended)."}
          </p>
        </div>

        {/* Background color for transparent images */}
        <div className="flex flex-col justify-between rounded-sm border border-[#e5ece8] bg-[#f8faf9] p-3">
          <label
            htmlFor="converter-bg-color"
            className="text-xs font-semibold text-[#263e36]"
          >
            JPG Background Fill
          </label>
          <div className="mt-2 flex items-center gap-2.5">
            <input
              id="converter-bg-color"
              type="color"
              value={options.backgroundColor}
              onChange={(e) => onOptionsChange("backgroundColor", e.target.value)}
              disabled={!isJpg || disabled}
              className="h-8 w-10 cursor-pointer rounded border border-[#c8d6cf] bg-white p-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              title="Choose fill color for transparent pixels"
            />
            <span className="text-xs font-mono text-[#527268] uppercase">
              {options.backgroundColor}
            </span>
            <button
              type="button"
              onClick={() => onOptionsChange("backgroundColor", "#FFFFFF")}
              disabled={!isJpg || disabled || options.backgroundColor === "#FFFFFF"}
              className="ml-auto text-[11px] text-[#235c4f] underline hover:text-[#173d34] disabled:opacity-30 disabled:no-underline"
            >
              Reset to White
            </button>
          </div>
          <p className="mt-1 text-[11px] leading-tight text-[#708079]">
            Used when converting transparent PNG, WebP or GIF images to JPG.
          </p>
        </div>
      </div>

      {/* Transparency Warning Notice */}
      {isJpg && hasTransparentToJpg && (
        <div
          id="transparency-warning-banner"
          className="flex items-start gap-2.5 rounded-sm border border-[#f5dfb8] bg-[#fdfaf2] p-3 text-xs text-[#8c5e14]"
          role="status"
        >
          <FaExclamationTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#b57a1e]" />
          <span>
            Converting transparent image(s) to JPG fills background with the selected color.
          </span>
        </div>
      )}
    </div>
  );
}
