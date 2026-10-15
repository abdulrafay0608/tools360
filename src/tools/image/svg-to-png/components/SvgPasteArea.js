"use client";

import React, { useState, useEffect, useRef } from "react";
import { sanitizeAndParseSvg, formatFileSize } from "../svgToPngUtils";
import { SVG_PROCESSING_LIMITS, assertSvgMarkup } from "@/utils/fileProcessingLimits";
import { FaCode, FaCheck, FaShieldAlt, FaExclamationCircle } from "react-icons/fa";

export default function SvgPasteArea({ onAddPastedSvg }) {
  const [svgCode, setSvgCode] = useState("");
  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState("");
  const [previewBlobUrl, setPreviewBlobUrl] = useState("");
  const currentBlobUrlRef = useRef("");

  useEffect(() => {
    if (!svgCode.trim()) {
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
        currentBlobUrlRef.current = "";
      }
      setParsed(null);
      setParseError("");
      setPreviewBlobUrl("");
      return;
    }

    try {
      assertSvgMarkup(svgCode);
      const result = sanitizeAndParseSvg(svgCode);
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
      const blob = new Blob([result.cleanSvgString], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      currentBlobUrlRef.current = url;
      setPreviewBlobUrl(url);
      setParsed(result);
      setParseError("");
    } catch (err) {
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
        currentBlobUrlRef.current = "";
      }
      setPreviewBlobUrl("");
      setParsed(null);
      setParseError(err?.message || "Invalid SVG markup.");
    }
  }, [svgCode]);

  useEffect(() => {
    return () => {
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
    };
  }, []);

  const handleAdd = () => {
    if (!parsed) return;
    onAddPastedSvg({
      name: "svg-image.svg",
      svgText: parsed.cleanSvgString,
      origWidth: parsed.origWidth,
      origHeight: parsed.origHeight,
      hasDefaultDimensions: parsed.hasDefaultDimensions,
      removedCount: parsed.removedCount,
      size: new Blob([parsed.cleanSvgString]).size,
    });
    setSvgCode("");
  };

  const checkerboardStyle = {
    backgroundColor: "#ffffff",
    backgroundImage: `
      linear-gradient(45deg, #edf2ef 25%, transparent 25%),
      linear-gradient(-45deg, #edf2ef 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #edf2ef 75%),
      linear-gradient(-45deg, transparent 75%, #edf2ef 75%)
    `,
    backgroundSize: "16px 16px",
    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
  };

  return (
    <div
      data-paste-area="true"
      className="space-y-4 rounded-sm border border-[#dce5e0] bg-white p-4 sm:p-5"
    >
      <div className="flex items-center justify-between">
        <label
          htmlFor="svg-paste-textarea"
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1a3328]"
        >
          <FaCode className="h-3.5 w-3.5 text-[#235c4f]" />
          <span>Paste SVG Code</span>
        </label>
        <span className="text-[11px] text-[#708079]">
          Paste raw &lt;svg&gt; XML markup
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Textarea */}
        <div className="flex flex-col">
          <textarea
            id="svg-paste-textarea"
            data-svg-textarea="true"
            rows={8}
            value={svgCode}
            onChange={(e) => setSvgCode(e.target.value)}
            maxLength={SVG_PROCESSING_LIMITS.maxMarkupBytes}
            placeholder={`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">\n  <circle cx="50" cy="50" r="40" fill="#235c4f" />\n</svg>`}
            className="w-full font-mono text-xs text-[#1a3328] rounded-sm border border-[#c8d6cf] p-3 focus:border-[#2563eb] focus:outline-none"
          />

          {parseError && (
            <div
              id="paste-error-msg"
              className="mt-2 flex items-center gap-1.5 text-xs text-[#a13c2f]"
            >
              <FaExclamationCircle className="h-3 w-3 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {parsed && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#527268]">
              <span>
                Dimensions: <strong>{parsed.origWidth} × {parsed.origHeight}</strong>
              </span>
              {parsed.removedCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded bg-[#eaf3ed] px-1.5 py-0.5 text-[10px] text-[#235c4f]">
                  <FaShieldAlt className="h-2.5 w-2.5" />
                  <span>Sanitized ({parsed.removedCount} unsafe SVG items removed)</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Live Preview on Checkerboard */}
        <div className="flex flex-col">
          <div className="text-xs font-semibold text-[#263e36] mb-1.5">
            Live Preview
          </div>
          <div
            style={checkerboardStyle}
            className="flex h-48 w-full items-center justify-center overflow-hidden rounded-sm border border-[#e5ece8] p-4 sm:h-52"
          >
            {previewBlobUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={previewBlobUrl}
                alt="Pasted SVG live preview"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="text-xs text-[#a0b2aa]">
                Paste SVG code on the left to see live preview
              </span>
            )}
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              id="add-pasted-svg-button"
              data-add-pasted-button="true"
              onClick={handleAdd}
              disabled={!parsed}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-sm bg-[#2563eb] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-[#a0b2aa]"
            >
              <FaCheck className="h-3 w-3" />
              <span>Add to Conversion Queue</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
