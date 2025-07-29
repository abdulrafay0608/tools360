// src/app/tools/pdf/merge-pdf/components/FilePreviewList.js
import React from "react";
import FilePreviewItem from "./FilePreviewItem";

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
    <div className="mt-6">
      {/* <h3 className="text-lg font-medium text-gray-800 mb-4">Your Files</h3> */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[600px] overflow-auto p-4">
        {files.map((file, index) => (
          <FilePreviewItem
            key={index}
            file={file}
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
    </div>
  );
};

export default FilePreviewList;
