// components/PDFPreviewItem.js
import React, { memo } from "react";
import { IoIosClose } from "react-icons/io";

const PDFPreviewItem = ({
  mode = "file", // 'file' | 'page'
  item,
  index,
  thumbnail,
  isSelected = false,
  onSelect,
  onRemove,
  onDragStart,
  onDrop,
  pdfjsLoaded,
  isGenerating,
}) => {
  const isFileMode = mode === "file";
  const pageNumber = mode === "page" ? index + 1 : null;

  const containerClasses = isFileMode
    ? "border-gray-200 hover:border-blue-300 cursor-move"
    : isSelected
    ? "border-blue-500 shadow cursor-pointer"
    : "border-gray-200 hover:border-gray-300 cursor-pointer";

  return (
    <div
      className={`relative bg-white rounded-md border-2 px-2 py-4 transition-all ${containerClasses} group`}
      style={{ width: "160px" }} // ✅ fixed card width
      draggable={isFileMode}
      onClick={!isFileMode ? onSelect : undefined}
      onDragStart={isFileMode ? onDragStart : undefined}
      onDragOver={isFileMode ? (e) => e.preventDefault() : undefined}
      onDrop={isFileMode ? onDrop : undefined}
      role="button"
      aria-label={`Preview ${mode}`}
    >
      {/* Remove / index badge */}
      {isFileMode && (
        <div
          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium cursor-pointer transition-all duration-200 group-hover:bg-red-500 group-hover:text-white"
          onClick={onRemove}
        >
          {/* <span className="group-hover:hidden bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center">
            {index + 1}
          </span> */}
          <span className="hidden group-hover:block text-base leading-none">
            <IoIosClose />
          </span>
        </div>
      )}

      {/* Thumbnail */}
      <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
        {pdfjsLoaded ? (
          thumbnail ? (
            <img
              src={thumbnail}
              alt={
                isFileMode
                  ? `PDF file thumbnail ${index + 1}`
                  : `Page ${pageNumber}`
              }
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <span className="text-gray-500 text-xs">
                {isGenerating ? "Processing..." : "Generating preview..."}
              </span>
            </div>
          )
        ) : (
          <div className="text-center p-4">
            <div className="animate-pulse bg-gray-200 rounded-lg w-16 h-16 mx-auto mb-2"></div>
            <span className="text-gray-500 text-xs">Loading PDF engine...</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="mt-3">
        {isFileMode ? (
          <>
            <h4 className="text-xs font-medium text-gray-800 truncate">
              {item.name}
            </h4>
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>{(item.size / 1024).toFixed(1)} KB</span>
              <span className="text-blue-600">PDF</span>
            </div>
          </>
        ) : (
          <div className="text-center text-xs font-medium text-gray-700">
            Page {pageNumber}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(PDFPreviewItem);
