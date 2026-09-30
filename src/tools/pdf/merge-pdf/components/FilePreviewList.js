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
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/x-tools360-file-index", String(index));
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedIndex = Number(
      e.dataTransfer.getData("application/x-tools360-file-index")
    );
    if (!Number.isInteger(draggedIndex) || draggedIndex === index) return;
    onReorder(draggedIndex, index);
  };

  return (
    <div className="mt-6 border border-[#dce5e0] bg-white p-3">
      <p className="mb-3 text-xs text-[#708079]">
        PDFs are merged in this order. Drag a file to change its position.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {files.map((file, index) => (
        <PDFPreviewItem
          key={`${file.name}-${file.size}-${index}`}
          mode="file"
          item={file}
          index={index}
          thumbnail={thumbnails[index]}
          onRemove={() => onRemove(index)}
          onMoveUp={() => onReorder(index, index - 1)}
          onMoveDown={() => onReorder(index, index + 1)}
          canMoveUp={index > 0}
          canMoveDown={index < files.length - 1}
          onDragStart={(e) => handleDragStart(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          pdfjsLoaded={pdfjsLoaded}
          isGenerating={isGenerating}
        />
      ))}
      </div>
    </div>
  );
};

export default FilePreviewList;
