// components/FilePreviewList.js
import React from "react";
import PDFPreviewItem from "./PDFPreviewItem";

const FilePreviewList = ({
  files,
  thumbnails,
  onRemove,
  pdfjsLoaded,
  isGenerating,
}) => {
  if (!files?.length) return null; // avoid rendering empty wrapper

  return (
    <div className="flex items-center justify-center">
      <div className="flex max-w-full items-center justify-center overflow-x-auto border border-[#dce5e0] bg-white p-3">
        {files.map((file, index) => (
          <PDFPreviewItem
            key={`${file.name}-${index}`} // more stable unique key
            mode="file"
            item={file}
            index={index}
            thumbnail={thumbnails?.[index]}
            onRemove={() => onRemove(index)}
            pdfjsLoaded={pdfjsLoaded}
            isGenerating={isGenerating}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(FilePreviewList);
