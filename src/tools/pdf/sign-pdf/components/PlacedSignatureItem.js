"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { FaTrashAlt, FaArrowsAlt } from "react-icons/fa";
import { useAdPauseWhile } from "@/hooks/useAdPause";

/**
 * PlacedSignatureItem
 * Draggable and resizable signature overlay item on the PDF page canvas.
 * Supports both mouse and touch interactions for mobile.
 */
export default function PlacedSignatureItem({
  item,
  containerRef,
  onUpdatePosition,
  onDelete,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startItemRef = useRef({ ...item });
  useAdPauseWhile(
    `signature-drag-${item.id}`,
    isDragging || isResizing
  );

  /** Extract clientX/Y from either mouse or touch events */
  const getPointer = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  /* ── Begin Drag ── */
  const handleDragStart = useCallback((e) => {
    e.stopPropagation();
    if (e.target.closest(".resize-handle") || e.target.closest(".delete-btn")) return;

    // Prevent default touch scroll
    if (e.cancelable) e.preventDefault();

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const pointer = getPointer(e);

    startPosRef.current = {
      x: pointer.x,
      y: pointer.y,
      containerW: rect.width,
      containerH: rect.height,
    };
    startItemRef.current = { ...item };
    setIsDragging(true);
  }, [containerRef, item]);

  /* ── Begin Resize ── */
  const handleResizeStart = useCallback((e) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const pointer = getPointer(e);

    startPosRef.current = {
      x: pointer.x,
      y: pointer.y,
      containerW: rect.width,
      containerH: rect.height,
    };
    startItemRef.current = { ...item };
    setIsResizing(true);
  }, [containerRef, item]);

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging && !isResizing) return;
      const pointer = getPointer(e);
      const { x: startX, y: startY, containerW, containerH } = startPosRef.current;
      const dx = pointer.x - startX;
      const dy = pointer.y - startY;

      if (isDragging) {
        const dRatioX = dx / containerW;
        const dRatioY = dy / containerH;

        const newX = Math.max(0, Math.min(1 - startItemRef.current.widthRatio, startItemRef.current.xRatio + dRatioX));
        const newY = Math.max(0, Math.min(1 - startItemRef.current.heightRatio, startItemRef.current.yRatio + dRatioY));

        onUpdatePosition(item.id, {
          xRatio: newX,
          yRatio: newY,
          widthRatio: item.widthRatio,
          heightRatio: item.heightRatio,
        });
      } else if (isResizing) {
        const dRatioW = dx / containerW;
        const dRatioH = dy / containerH;

        const minW = 0.08;
        const minH = 0.04;
        const maxW = 1 - startItemRef.current.xRatio;
        const maxH = 1 - startItemRef.current.yRatio;

        const newW = Math.max(minW, Math.min(maxW, startItemRef.current.widthRatio + dRatioW));
        const newH = Math.max(minH, Math.min(maxH, startItemRef.current.heightRatio + dRatioH));

        onUpdatePosition(item.id, {
          xRatio: item.xRatio,
          yRatio: item.yRatio,
          widthRatio: newW,
          heightRatio: newH,
        });
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleMove, { passive: false });
      window.addEventListener("touchend", handleEnd);
      window.addEventListener("touchcancel", handleEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
      window.removeEventListener("touchcancel", handleEnd);
    };
  }, [isDragging, isResizing, item, onUpdatePosition]);

  return (
    <div
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      style={{
        left: `${item.xRatio * 100}%`,
        top: `${item.yRatio * 100}%`,
        width: `${item.widthRatio * 100}%`,
        height: `${item.heightRatio * 100}%`,
        touchAction: "none",
      }}
      className={`group absolute select-none border-2 border-dashed transition-shadow ${
        isDragging || isResizing
          ? "border-[#235c4f] bg-[#235c4f]/10 shadow-lg cursor-grabbing"
          : "border-[#235c4f]/60 hover:border-[#235c4f] hover:bg-[#235c4f]/5 cursor-grab"
      }`}
    >
      {/* Signature Graphic */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.dataUrl}
        alt="Placed signature"
        draggable={false}
        className="pointer-events-none h-full w-full object-contain"
      />

      {/* Action Toolbar on Hover */}
      <div className="absolute -top-7 right-0 z-20 flex items-center gap-1 opacity-90 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="delete-btn flex h-6 w-6 items-center justify-center rounded-full bg-[#b91c1c] text-white shadow-sm hover:bg-[#991b1b]"
          title="Delete signature"
          aria-label="Delete signature"
        >
          <FaTrashAlt className="h-2.5 w-2.5" />
        </button>
      </div>

      {/* Resize Handle at bottom right */}
      <div
        onMouseDown={handleResizeStart}
        onTouchStart={handleResizeStart}
        className="resize-handle absolute -bottom-1.5 -right-1.5 z-20 flex h-5 w-5 cursor-se-resize items-center justify-center rounded-full bg-[#235c4f] text-white shadow-xs hover:scale-125"
        title="Resize"
        aria-label="Resize signature"
      >
        <FaArrowsAlt className="h-2 w-2" />
      </div>
    </div>
  );
}
