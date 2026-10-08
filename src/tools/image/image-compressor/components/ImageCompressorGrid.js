"use client";

import React from "react";
import ImageCompressorItem from "./ImageCompressorItem";

export default function ImageCompressorGrid({
  images,
  onDownloadSingle,
  onRemove,
}) {
  if (images.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {images.map((item, index) => (
        <ImageCompressorItem
          key={item.id}
          item={item}
          index={index}
          onDownloadSingle={onDownloadSingle}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
