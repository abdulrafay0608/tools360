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
    <div className="flex justify-center items-center">
      <div className="flex justify-center items-center p-2 border border-slate-200 rounded">
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
