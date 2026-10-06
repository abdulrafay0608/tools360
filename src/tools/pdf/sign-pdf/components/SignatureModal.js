"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  FaTimes,
  FaPen,
  FaFont,
  FaUpload,
  FaEraser,
  FaCheck,
} from "react-icons/fa";
import Button from "@/components/ui/Button";
import {
  FONT_STYLES,
  COLOR_OPTIONS,
  generateTypedSignature,
} from "../signPdfUtils";

export default function SignatureModal({
  isOpen,
  onClose,
  onSaveSignature,
}) {
  const [activeTab, setActiveTab] = useState("draw"); // 'draw' | 'type' | 'upload'
  const [selectedColor, setSelectedColor] = useState("#0f2b5c");
  const [typedText, setTypedText] = useState("");
  const [selectedFont, setSelectedFont] = useState("style1");
  const [uploadedDataUrl, setUploadedDataUrl] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const canvasRef = useRef(null);
  const lastPointRef = useRef({ x: 0, y: 0 });

  /* ── Canvas Drawing Logic ── */
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    lastPointRef.current = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const currentX = clientX - rect.left;
    const currentY = clientY - rect.top;

    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    lastPointRef.current = { x: currentX, y: currentY };
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }, []);

  /* ── Handle Image Upload ── */
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  /* ── Final Save Signature ── */
  const handleSave = () => {
    if (activeTab === "draw") {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      const dataUrl = canvas.toDataURL("image/png");
      onSaveSignature(dataUrl);
    } else if (activeTab === "type") {
      if (!typedText.trim()) return;
      const dataUrl = generateTypedSignature(typedText, selectedFont, selectedColor);
      onSaveSignature(dataUrl);
    } else if (activeTab === "upload") {
      if (!uploadedDataUrl) return;
      onSaveSignature(uploadedDataUrl);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex w-full max-w-lg flex-col rounded-sm border border-[#dce5e0] bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#eef2ef] bg-[#f8faf9] px-5 py-3.5">
          <h3 className="text-base font-semibold text-[#1a3328]">
            Create Your Signature
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded p-1 text-[#708079] transition-colors hover:bg-[#eef2ef] hover:text-[#1a3328]"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-3 border-b border-[#eef2ef] bg-[#f8faf9]">
          {[
            { id: "draw", label: "Draw", icon: FaPen },
            { id: "type", label: "Type", icon: FaFont },
            { id: "upload", label: "Upload Image", icon: FaUpload },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-colors border-b-2 ${
                activeTab === id
                  ? "border-[#235c4f] bg-white text-[#173d34]"
                  : "border-transparent text-[#52675e] hover:bg-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Color palette selector for Draw and Type tabs */}
          {activeTab !== "upload" && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#263e36]">Ink Color:</span>
              <div className="flex items-center gap-2">
                {COLOR_OPTIONS.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setSelectedColor(col.value)}
                    style={{ backgroundColor: col.value }}
                    title={col.label}
                    className={`h-6 w-6 rounded-full transition-transform ${
                      selectedColor === col.value
                        ? "ring-2 ring-offset-2 ring-[#235c4f] scale-110"
                        : "hover:scale-105 opacity-80"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* TAB 1: Draw on Canvas */}
          {activeTab === "draw" && (
            <div className="space-y-2">
              <div className="relative rounded border border-[#dce5e0] bg-[#fcfdfd]">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full cursor-crosshair touch-none"
                />
                {!hasDrawn && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-[#94a3b8]">
                    Draw your signature here with mouse or touch
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="flex items-center gap-1 text-xs text-[#708079] transition-colors hover:text-[#a13c2f]"
                >
                  <FaEraser className="h-3 w-3" />
                  <span>Clear pad</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Type Signature */}
          {activeTab === "type" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#263e36] mb-1">
                  Type Your Name or Initials:
                </label>
                <input
                  type="text"
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  placeholder="e.g. John Doe"
                  maxLength={40}
                  className="w-full rounded border border-[#dce5e0] px-3 py-2 text-sm text-[#1a3328] focus:border-[#235c4f] focus:outline-none"
                />
              </div>

              {/* Font Style Selection */}
              <div className="space-y-2">
                <span className="block text-xs font-semibold text-[#263e36]">
                  Choose Font Style:
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {FONT_STYLES.map((f) => {
                    const isSelected = selectedFont === f.id;
                    const previewText = typedText.trim() || "Your Signature";

                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFont(f.id)}
                        className={`flex items-center justify-between rounded border p-3 text-left transition-all ${
                          isSelected
                            ? "border-[#235c4f] bg-[#eaf3ed] shadow-xs"
                            : "border-[#dce5e0] bg-white hover:border-[#b8c9c0]"
                        }`}
                      >
                        <span
                          style={{
                            fontFamily: f.fontFamily,
                            color: selectedColor,
                            fontSize: "22px",
                            fontStyle: "italic",
                          }}
                          className="truncate max-w-[320px]"
                        >
                          {previewText}
                        </span>
                        <span className="text-[10px] text-[#708079] uppercase font-bold">
                          {f.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Upload Image */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              {uploadedDataUrl ? (
                <div className="flex flex-col items-center justify-center rounded border border-[#dce5e0] bg-[#fcfdfd] p-4">
                  <div className="relative flex h-32 w-full items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={uploadedDataUrl}
                      alt="Uploaded signature"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedDataUrl("")}
                    className="mt-2 text-xs text-[#a13c2f] hover:underline"
                  >
                    Remove and choose another image
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center rounded-sm border-2 border-dashed border-[#b8c9c0] bg-[#f8faf9] p-8 text-center cursor-pointer transition-colors hover:border-[#235c4f] hover:bg-white">
                  <FaUpload className="h-6 w-6 text-[#235c4f] mb-2" />
                  <span className="text-xs font-semibold text-[#1a3328]">
                    Click to upload signature image
                  </span>
                  <span className="mt-1 text-[11px] text-[#708079]">
                    PNG, JPG or WEBP (transparent background recommended)
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[#eef2ef] bg-[#f8faf9] px-5 py-3">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={
              (activeTab === "draw" && !hasDrawn) ||
              (activeTab === "type" && !typedText.trim()) ||
              (activeTab === "upload" && !uploadedDataUrl)
            }
            icon={<FaCheck />}
            iconPosition="left"
          >
            Use Signature
          </Button>
        </div>
      </div>
    </div>
  );
}
