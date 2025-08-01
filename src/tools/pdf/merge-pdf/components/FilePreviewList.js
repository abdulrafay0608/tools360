// src/tools/pdf/merge-pdf/components/FilePreviewList.js
import React from "react";
import PDFPreviewItem from "@/components/pdf/PDFPreviewItem";

const FilePreviewList = ({
  files,
  thumbnails,
  onRemove,
  onReorder,
  pdfjsLoaded,
  isGenerating,
}) => {
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("index", index);
  };

  const handleDrop = (e, index) => {
    const draggedIndex = e.dataTransfer.getData("index");
    if (draggedIndex === "") return;
    onReorder(parseInt(draggedIndex), index);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
      {files.map((file, index) => (
        <PDFPreviewItem
          key={index}
          type="file"
          item={file}
          index={index}
          thumbnail={thumbnails[index]}
          onRemove={() => onRemove(index)}
          onDragStart={(e) => handleDragStart(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          pdfjsLoaded={pdfjsLoaded}
          isGenerating={isGenerating}
        />
      ))}
    </div>
  );
};

export default FilePreviewList;
