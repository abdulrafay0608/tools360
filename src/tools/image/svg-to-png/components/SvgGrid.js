"use client";

import React from "react";
import SvgItem from "./SvgItem";

export default function SvgGrid({
  items,
  onDownloadSingle,
  onRemove,
}) {
  if (!items || items.length === 0) return null;

  return (
    <div
      data-svg-grid="true"
      className="space-y-2.5"
    >
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#527268]">
          SVG Files ({items.length})
        </h3>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <SvgItem
            key={item.id}
            item={item}
            onDownloadSingle={onDownloadSingle}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}
