"use client";

import React from "react";

/**
 * AdSlot Component
 * Client-side placeholder with fixed min-height to prevent Cumulative Layout Shift (CLS).
 * When real AdSense is ready, the script will be added in the root layout and ads will render here.
 */
export default function AdSlot({
  slotId = "default-slot",
  format = "horizontal", // 'horizontal' | 'rectangle' | 'responsive'
  className = "",
}) {
  const minHeightClass =
    format === "horizontal"
      ? "min-h-[90px]"
      : format === "rectangle"
      ? "min-h-[250px]"
      : "min-h-[100px]";

  return (
    <div
      id={`ad-slot-${slotId}`}
      aria-hidden="true"
      className={`w-full overflow-hidden rounded border border-dashed border-[#e2e8f0] bg-[#fafafa] flex items-center justify-center text-xs text-[#94a3b8] ${minHeightClass} ${className}`}
    >
      {/* Placeholder content — replaced when AdSense script is activated */}
      <span className="select-none tracking-wide uppercase text-[10px] font-medium text-[#cbd5e1]">
        Advertisement
      </span>
    </div>
  );
}
