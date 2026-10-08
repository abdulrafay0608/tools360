import React from "react";
import ResizerItem from "./ResizerItem";

export default function ResizerGrid({ items, onRemove, onDownload }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#527268]">
          Resized Images
        </h2>
        <span className="text-xs text-[#708079]">{items.length} selected</span>
      </div>
      <div className="space-y-2.5">
        {items.map((item) => (
          <ResizerItem
            key={item.id}
            item={item}
            onRemove={onRemove}
            onDownload={onDownload}
          />
        ))}
      </div>
    </div>
  );
}
