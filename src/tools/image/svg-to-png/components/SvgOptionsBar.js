"use client";

import React from "react";
import { SCALE_OPTIONS } from "../svgToPngUtils";
import { FaShieldAlt, FaInfoCircle } from "react-icons/fa";

export default function SvgOptionsBar({
  options,
  onOptionsChange,
  disabled = false,
}) {
  const isCustomWidth = options.sizeOption === "customWidth";

  return (
    <div
      data-svg-options="true"
      className="space-y-4 rounded-sm border border-[#dce5e0] bg-white p-4 sm:p-5"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#1a3328]">
            PNG Export Settings
          </h2>
          <p className="text-xs text-[#708079]">
            Configure resolution and background. Previews update automatically.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-[#eaf3ed] px-3 py-1 text-xs font-medium text-[#235c4f] sm:self-auto">
          <FaShieldAlt className="h-3 w-3" />
          <span>Sanitized • Scripts & external links stripped</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Output Resolution Mode */}
        <div className="flex flex-col justify-between rounded-sm border border-[#e5ece8] bg-[#f8faf9] p-3">
          <label className="text-xs font-semibold text-[#263e36]">
            Resolution / Scale
          </label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SCALE_OPTIONS.map((opt) => {
              const isSelected =
                options.sizeOption === "scale" && String(options.scale) === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  data-scale-button={opt.value}
                  onClick={() =>
                    onOptionsChange({
                      ...options,
                      sizeOption: "scale",
                      scale: Number(opt.value),
                    })
                  }
                  disabled={disabled}
                  className={`rounded-sm border px-3 py-1.5 text-xs font-semibold transition-all ${
                    isSelected
                      ? "border-[#235c4f] bg-[#eaf3ed] text-[#173d34] ring-1 ring-[#235c4f]"
                      : "border-[#dce5e0] bg-white text-[#527268] hover:border-[#a0b2aa]"
                  } disabled:opacity-50`}
                >
                  {opt.label}
                </button>
              );
            })}
            <button
              type="button"
              data-custom-width-button="true"
              onClick={() =>
                onOptionsChange({
                  ...options,
                  sizeOption: "customWidth",
                  customWidth: options.customWidth || 1024,
                })
              }
              disabled={disabled}
              className={`rounded-sm border px-3 py-1.5 text-xs font-semibold transition-all ${
                isCustomWidth
                  ? "border-[#235c4f] bg-[#eaf3ed] text-[#173d34] ring-1 ring-[#235c4f]"
                  : "border-[#dce5e0] bg-white text-[#527268] hover:border-[#a0b2aa]"
              } disabled:opacity-50`}
            >
              Custom Width
            </button>
          </div>

          {isCustomWidth && (
            <div className="mt-3 flex items-center gap-2">
              <label htmlFor="custom-width-input" className="text-xs text-[#527268]">
                Width (px):
              </label>
              <input
                id="custom-width-input"
                type="number"
                min="16"
                max="8192"
                step="16"
                value={options.customWidth || 1024}
                onChange={(e) =>
                  onOptionsChange({
                    ...options,
                    sizeOption: "customWidth",
                    customWidth: Number(e.target.value),
                  })
                }
                disabled={disabled}
                className="w-24 rounded-sm border border-[#c8d6cf] bg-white px-2 py-1 text-xs font-semibold text-[#1a3328] focus:border-[#235c4f] focus:outline-none"
              />
              <span className="text-[11px] text-[#708079]">(Height auto-locked)</span>
            </div>
          )}

          <p className="mt-2 text-[11px] leading-tight text-[#708079]">
            Output is capped at 8192px per side to preserve browser memory.
          </p>
        </div>

        {/* Background Color */}
        <div className="flex flex-col justify-between rounded-sm border border-[#e5ece8] bg-[#f8faf9] p-3">
          <label className="text-xs font-semibold text-[#263e36]">
            Background
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-bg-transparent="true"
              onClick={() =>
                onOptionsChange({ ...options, backgroundColor: "transparent" })
              }
              disabled={disabled}
              className={`rounded-sm border px-3 py-1.5 text-xs font-semibold transition-all ${
                options.backgroundColor === "transparent"
                  ? "border-[#235c4f] bg-[#eaf3ed] text-[#173d34] ring-1 ring-[#235c4f]"
                  : "border-[#dce5e0] bg-white text-[#527268] hover:border-[#a0b2aa]"
              } disabled:opacity-50`}
            >
              Transparent
            </button>

            <button
              type="button"
              data-bg-white="true"
              onClick={() =>
                onOptionsChange({ ...options, backgroundColor: "#FFFFFF" })
              }
              disabled={disabled}
              className={`rounded-sm border px-3 py-1.5 text-xs font-semibold transition-all ${
                options.backgroundColor === "#FFFFFF"
                  ? "border-[#235c4f] bg-[#eaf3ed] text-[#173d34] ring-1 ring-[#235c4f]"
                  : "border-[#dce5e0] bg-white text-[#527268] hover:border-[#a0b2aa]"
              } disabled:opacity-50`}
            >
              White
            </button>

            <div className="flex items-center gap-1.5 ml-auto">
              <input
                id="svg-bg-color-picker"
                type="color"
                value={
                  options.backgroundColor === "transparent"
                    ? "#FFFFFF"
                    : options.backgroundColor
                }
                onChange={(e) =>
                  onOptionsChange({ ...options, backgroundColor: e.target.value })
                }
                disabled={disabled}
                className="h-8 w-10 cursor-pointer rounded border border-[#c8d6cf] bg-white p-0.5"
                title="Choose custom background color"
              />
              <span className="text-[11px] font-mono text-[#527268] uppercase">
                {options.backgroundColor}
              </span>
            </div>
          </div>

          <p className="mt-2 text-[11px] leading-tight text-[#708079]">
            Transparent background renders transparent pixels with alpha 0.
          </p>
        </div>

        {/* Font & Rendering Notice */}
        <div className="flex flex-col justify-between rounded-sm border border-[#e5ece8] bg-[#f8faf9] p-3 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#263e36]">
            <FaInfoCircle className="h-3 w-3 text-[#527268]" />
            <span>Rendering Notice</span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-[#708079]">
            External web fonts and remote linked images are blocked for privacy and
            security. Text elements will render using local system fallback fonts.
          </p>
          <div className="mt-2 text-[10px] text-[#235c4f] font-medium">
            Clean 32-bit PNG with full alpha channel
          </div>
        </div>
      </div>
    </div>
  );
}
