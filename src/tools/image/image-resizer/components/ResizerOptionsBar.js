import React from "react";
import { FORMAT_PRESETS } from "../../utils/imageSharedUtils.js";
import { FIT_MODES, RESIZE_MODES, RESIZE_PRESETS } from "../imageResizerUtils";
import { FaShieldAlt } from "react-icons/fa";

export default function ResizerOptionsBar({
  options,
  onChange,
  disabled,
}) {
  const handleChange = (key, value) => {
    onChange({ ...options, [key]: value });
  };

  const handlePresetChange = (e) => {
    const idx = parseInt(e.target.value, 10);
    if (isNaN(idx)) return;
    const preset = RESIZE_PRESETS[idx];
    if (preset.width === null && preset.height === null) {
      onChange({ ...options, selectedPreset: 0 });
    } else {
      onChange({
        ...options,
        resizeMode: "pixels",
        width: preset.width,
        height: preset.height,
        aspectLocked: false,
        fitMode: "contain", // Default fit mode for presets
        selectedPreset: idx,
      });
    }
  };

  const isPixels = options.resizeMode === "pixels";
  const isPercentage = options.resizeMode === "percentage";

  return (
    <div data-resizer-options="true" className="space-y-4 rounded-sm border border-[#dce5e0] bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#1a3328]">
            Resize Settings
          </h2>
          <p className="text-xs text-[#708079]">
            Set dimensions, fit, and output format. Changes apply automatically.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-[#eaf3ed] px-3 py-1 text-xs font-medium text-[#235c4f] sm:self-auto">
          <FaShieldAlt className="h-3 w-3" />
          <span>Processed locally in your browser</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Resize Mode */}
        <div className="flex flex-col justify-between rounded-sm border border-[#e5ece8] bg-[#f8faf9] p-3">
          <label className="mb-2 block text-xs font-semibold text-[#263e36]">
            Resize Mode
          </label>
          <select
            value={options.resizeMode}
            onChange={(e) => handleChange("resizeMode", e.target.value)}
            disabled={disabled}
            className="w-full rounded-sm border border-[#c8d6cf] bg-white px-2.5 py-2 text-xs font-medium text-[#1a3328] focus:border-[#235c4f] focus:outline-none focus:ring-1 focus:ring-[#235c4f] disabled:opacity-50"
          >
            {RESIZE_MODES.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
        </div>

        {/* Dimensions / Percentage Input */}
        <div className="flex flex-col justify-between rounded-sm border border-[#e5ece8] bg-[#f8faf9] p-3">
          {isPercentage ? (
            <div>
              <label className="mb-2 flex justify-between text-xs font-semibold text-[#263e36]">
                <span>Percentage</span>
                <span className="text-[#235c4f]">{options.percentage}%</span>
              </label>
              <input
                type="range"
                min="10"
                max="200"
                step="1"
                value={options.percentage}
                onChange={(e) => handleChange("percentage", Number(e.target.value))}
                disabled={disabled}
                className="h-2 w-full cursor-pointer accent-[#235c4f] disabled:cursor-not-allowed disabled:opacity-40"
              />
            </div>
          ) : (
            <div>
              <label className="mb-2 flex justify-between text-xs font-semibold text-[#263e36]">
                <span>Dimensions (px)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  placeholder="W"
                  value={options.width || ""}
                  onChange={(e) => {
                    const width = e.target.value ? Number(e.target.value) : null;
                    onChange({
                      ...options,
                      width,
                      ...(options.aspectLocked && width && options.aspectRatio
                        ? { height: Math.max(1, Math.round(width / options.aspectRatio)) }
                        : {}),
                      selectedPreset: 0,
                    });
                  }}
                  disabled={disabled}
                  className="w-full rounded-sm border border-[#c8d6cf] bg-white px-2.5 py-2 text-xs text-[#1a3328] focus:border-[#235c4f] focus:outline-none focus:ring-1 focus:ring-[#235c4f] disabled:opacity-50"
                />
                <button
                  onClick={() => handleChange("aspectLocked", !options.aspectLocked)}
                  type="button"
                  className={`rounded-sm border p-2 ${
                    options.aspectLocked 
                      ? "border-[#c8d6cf] bg-[#eaf3ed] text-[#235c4f]" 
                      : "border-[#e5ece8] bg-[#f8faf9] text-[#708079]"
                  }`}
                  title={options.aspectLocked ? "Unlock Aspect Ratio" : "Lock Aspect Ratio"}
                  disabled={disabled}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {options.aspectLocked ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    )}
                  </svg>
                </button>
                <input
                  type="number"
                  min="1"
                  placeholder="H"
                  value={options.height || ""}
                  onChange={(e) => {
                    const height = e.target.value ? Number(e.target.value) : null;
                    onChange({
                      ...options,
                      height,
                      ...(options.aspectLocked && height && options.aspectRatio
                        ? { width: Math.max(1, Math.round(height * options.aspectRatio)) }
                        : {}),
                      selectedPreset: 0,
                    });
                  }}
                  disabled={disabled}
                  className="w-full rounded-sm border border-[#c8d6cf] bg-white px-2.5 py-2 text-xs text-[#1a3328] focus:border-[#235c4f] focus:outline-none focus:ring-1 focus:ring-[#235c4f] disabled:opacity-50"
                />
              </div>
            </div>
          )}
        </div>

        {/* Presets and Fit Mode */}
        {isPixels && (
          <>
            <div className="flex flex-col justify-between rounded-sm border border-[#e5ece8] bg-[#f8faf9] p-3">
              <label className="mb-2 block text-xs font-semibold text-[#263e36]">
                Presets
              </label>
              <select
                onChange={handlePresetChange}
                disabled={disabled}
                value={options.selectedPreset ?? "0"}
                className="w-full rounded-sm border border-[#c8d6cf] bg-white px-2.5 py-2 text-xs font-medium text-[#1a3328] focus:border-[#235c4f] focus:outline-none focus:ring-1 focus:ring-[#235c4f] disabled:opacity-50"
              >
                {RESIZE_PRESETS.map((p, idx) => (
                  <option key={idx} value={idx}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-between rounded-sm border border-[#e5ece8] bg-[#f8faf9] p-3">
              <label className="mb-2 block text-xs font-semibold text-[#263e36]">
                Fit Mode (when W & H are set)
              </label>
              <select
                value={options.fitMode}
                onChange={(e) => handleChange("fitMode", e.target.value)}
                disabled={disabled}
                className="w-full rounded-sm border border-[#c8d6cf] bg-white px-2.5 py-2 text-xs font-medium text-[#1a3328] focus:border-[#235c4f] focus:outline-none focus:ring-1 focus:ring-[#235c4f] disabled:opacity-50"
              >
                {FIT_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Output Format & Quality */}
        <div className="flex flex-col justify-between rounded-sm border border-[#e5ece8] bg-[#f8faf9] p-3">
          <label className="mb-2 block text-xs font-semibold text-[#263e36]">
            Output Format
          </label>
          <select
            value={options.outputFormat}
            onChange={(e) => handleChange("outputFormat", e.target.value)}
            disabled={disabled}
            className="mb-3 w-full rounded-sm border border-[#c8d6cf] bg-white px-2.5 py-2 text-xs font-medium text-[#1a3328] focus:border-[#235c4f] focus:outline-none focus:ring-1 focus:ring-[#235c4f] disabled:opacity-50"
          >
            {FORMAT_PRESETS.map((fmt) => (
              <option key={fmt.value} value={fmt.value}>
                {fmt.label}
              </option>
            ))}
          </select>

          {(options.outputFormat === "jpg" || options.outputFormat === "webp" || options.outputFormat === "original") && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#263e36]">
                  Quality
                </label>
                <span className="text-xs font-bold text-[#235c4f]">{options.quality}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={options.quality}
                onChange={(e) => handleChange("quality", Number(e.target.value))}
                disabled={disabled}
                className="h-2 w-full cursor-pointer accent-[#235c4f] disabled:cursor-not-allowed disabled:opacity-40"
              />
            </div>
          )}
        </div>
      </div>

      {options.outputFormat === "jpg" && (
        <div id="resizer-format-warning" className="mt-4 flex items-start gap-2 rounded-sm border border-[#f5dfb8] bg-[#fef9ed] p-3 text-xs text-[#92540c]">
          <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>
            Converting to JPG will remove transparency from PNG/WebP images. They will be filled with a white background.
          </p>
        </div>
      )}
    </div>
  );
}
