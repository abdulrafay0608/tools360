// components/pdf/PDFPreviewItem.js
import React, { memo } from "react";
import { IoIosClose } from "react-icons/io";
import Button from "../ui/Button";

const PDFPreviewItem = ({
  mode = "file", // 'file' | 'page' | 'before' | 'after'
  item, // File object or page object
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
  const isPageMode = mode === "page";
  const isBeforeMode = mode === "before";
  const isAfterMode = mode === "after";
  const pageNumber = isPageMode ? index + 1 : null;

  // Determine container classes based on mode and selection
  let containerClasses = "border-gray-200 ";
  if (isPageMode) {
    containerClasses = isSelected
      ? "border-blue-500 shadow cursor-pointer"
      : "border-gray-200 hover:border-gray-300 cursor-pointer";
  } else if (isFileMode) {
    containerClasses = "border-gray-200 hover:border-blue-300 cursor-move";
  }

  return (
    <div
      className={`relative bg-white rounded-md border-2 px-2 py-4 transition-all ${containerClasses} group`}
      draggable={isFileMode}
      onClick={isPageMode ? onSelect : undefined}
      onDragStart={isFileMode ? onDragStart : undefined}
      onDragOver={(e) => e.preventDefault()}
      onDrop={isFileMode ? onDrop : undefined}
      role="button"
      aria-label={`Preview item (${mode})`}
    >
      {/* Hover switchable index/remove icon */}
      {isFileMode && (
        <div
          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium cursor-pointer transition-all duration-200 group-hover:bg-red-500 group-hover:text-white"
          onClick={onRemove}
        >
          {/* Number by default */}
          <span className="group-hover:hidden bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center ">
            {index + 1}
          </span>

          {/* Close icon on hover */}
          <span className="hidden group-hover:block text-base leading-none">
            <IoIosClose />
          </span>
        </div>
      )}

      {/* Page selection indicator */}
      {/* {isPageMode && (
        <div className="absolute top-2 right-2">
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center ${
              isSelected ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            {isSelected ? "✓" : pageNumber}
          </div>
        </div>
      )} */}

      {/* Thumbnail display area */}
      <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
        {pdfjsLoaded ? (
          thumbnail ? (
            <img
              src={thumbnail}
              alt={
                isFileMode
                  ? `PDF file thumbnail ${index + 1}`
                  : isPageMode
                  ? `Page ${pageNumber}`
                  : isBeforeMode
                  ? "Before processing"
                  : "After processing"
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

      {/* Details section */}
      <div className="mt-3">
        {isFileMode && (
          <>
            <h4 className="text-xs font-medium text-gray-800 truncate">
              {item.name}
            </h4>
            {/* <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>{(item.size / 1024).toFixed(1)} KB</span>
              <span className="text-blue-600">PDF</span>
            </div> */}
          </>
        )}
        {isPageMode && (
          <div className="text-center text-xs font-medium text-gray-700">
            Page {pageNumber}
          </div>
        )}
      </div>

      {/* Reorder hint for files */}
      {/* {isFileMode && (
        <div className="mt-3 flex justify-center">
          <div className="flex items-center text-xs text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
            Drag to reorder
          </div>
        </div>
      )} */}
    </div>
  );
};

export default memo(PDFPreviewItem);
