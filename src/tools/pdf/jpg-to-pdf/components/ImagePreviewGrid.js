"use client";

import React from "react";
import {
  FaUndo,
  FaRedo,
  FaTrashAlt,
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
} from "react-icons/fa";
import Button from "@/components/ui/Button";
import { formatFileSize } from "@/components/utils/pdfUtils";

/**
 * ImagePreviewGrid
 * Interactive grid of uploaded image thumbnails with reordering, rotation, and deletion controls.
 */
export default function ImagePreviewGrid({
  images,
  onRotate,
  onMove,
  onRemove,
  onClearAll,
  onAddMore,
}) {
  return (
    <div className="space-y-4">
      {/* Header bar for image list */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5ece8] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#1a3328]">
            Uploaded Images ({images.length})
          </span>
          <span className="text-xs text-[#708079]">
            (Drag or use arrows to reorder)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddMore}
            icon={<FaPlus />}
            iconPosition="left"
          >
            Add Images
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClearAll}
            icon={<FaTrashAlt />}
            iconPosition="left"
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Grid of Image Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {images.map((item, index) => {
          const previewUrl = URL.createObjectURL(item.file);

          return (
            <div
              key={item.id || `${item.file.name}-${index}`}
              className="group relative flex flex-col justify-between rounded-sm border border-[#dce5e0] bg-white p-2.5 shadow-sm transition-all hover:border-[#7e9b8c] hover:shadow"
            >
              {/* Index badge */}
              <div className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#173d34] text-xs font-bold text-white shadow-sm">
                {index + 1}
              </div>

              {/* Image Preview Box */}
              <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded bg-[#f4f7f5] p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt={item.file.name}
                  style={{
                    transform: `rotate(${item.rotation || 0}deg)`,
                  }}
                  className="max-h-full max-w-full object-contain transition-transform duration-200"
                />
              </div>

              {/* File Info */}
              <div className="mt-2 text-center">
                <p
                  className="truncate text-xs font-medium text-[#1a3328]"
                  title={item.file.name}
                >
                  {item.file.name}
                </p>
                <p className="text-[10px] text-[#708079]">
                  {formatFileSize(item.file.size)}
                </p>
              </div>

              {/* Action Toolbar on Card */}
              <div className="mt-2.5 flex items-center justify-between border-t border-[#eef2ef] pt-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onMove(index, index - 1)}
                    disabled={index === 0}
                    title="Move left"
                    aria-label="Move image left"
                    className="flex h-7 w-7 items-center justify-center rounded text-[#52675e] transition-colors hover:bg-[#eef2ef] disabled:opacity-30"
                  >
                    <FaChevronLeft className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMove(index, index + 1)}
                    disabled={index === images.length - 1}
                    title="Move right"
                    aria-label="Move image right"
                    className="flex h-7 w-7 items-center justify-center rounded text-[#52675e] transition-colors hover:bg-[#eef2ef] disabled:opacity-30"
                  >
                    <FaChevronRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onRotate(index)}
                    title="Rotate 90 degrees"
                    aria-label="Rotate image"
                    className="flex h-7 w-7 items-center justify-center rounded text-[#235c4f] transition-colors hover:bg-[#eef2ef]"
                  >
                    <FaRedo className="h-3 w-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    title="Remove image"
                    aria-label="Remove image"
                    className="flex h-7 w-7 items-center justify-center rounded text-[#a13c2f] transition-colors hover:bg-[#fdf4f3]"
                  >
                    <FaTrashAlt className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
