"use client";

import React from "react";
import ConverterItem from "./ConverterItem";

export default function ConverterGrid({
  images,
  onDownloadSingle,
  onRemove,
}) {
  if (!images || images.length === 0) return null;

  return (
    <div
      data-converter-grid="true"
      className="space-y-2.5"
    >
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#527268]">
          Files to Convert ({images.length})
        </h3>
      </div>

      <div className="space-y-2">
        {images.map((item, index) => (
          <ConverterItem
            key={item.id}
            item={item}
            index={index}
            onDownloadSingle={onDownloadSingle}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}
