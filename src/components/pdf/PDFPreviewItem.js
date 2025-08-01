// components/pdf/PDFPreviewItem.js
import React from "react";
import { IoIosClose } from "react-icons/io";
import Button from "../ui/Button";

const PDFPreviewItem = ({
  type = "file", // 'file' or 'page'
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
  const isFileType = type === "file";
  const isPageType = type === "page";
  const pageNumber = isPageType ? index + 1 : null;

  return (
    <div
      className={`relative bg-white rounded-md border-2 p-2 transition-all ${
        isPageType
          ? isSelected
            ? "border-blue-500 shadow cursor-pointer"
            : "border-gray-200 hover:border-gray-300 cursor-pointer"
          : "border-gray-200 hover:border-blue-300 cursor-move"
      }`}
      draggable={isFileType}
      onClick={isPageType ? onSelect : undefined}
      onDragStart={isFileType ? onDragStart : undefined}
      onDragOver={(e) => e.preventDefault()}
      onDrop={isFileType ? onDrop : undefined}
    >
      {/* Remove button (for files) */}
      {isFileType && onRemove && (
        <div className="absolute -top-2 -right-2 z-10">
          <Button
            variant="icon"
            size="xs"
            onClick={onRemove}
            className="bg-red-500 text-white hover:bg-red-600 rounded-full"
            aria-label="Remove file"
          >
            <IoIosClose className="text-xl" />
          </Button>
        </div>
      )}

      {/* Position indicator (for files) */}
      {isFileType && (
        <div className="absolute -top-2 -left-2 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium">
          {index + 1}
        </div>
      )}

      {/* Selection indicator (for pages) */}
      {isPageType && (
        <div className="absolute top-2 right-2">
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center ${
              isSelected ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            {isSelected ? "✓" : pageNumber}
          </div>
        </div>
      )}

      {/* Thumbnail container */}
      <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
        {pdfjsLoaded ? (
          thumbnail ? (
            <img
              src={thumbnail}
              alt={isFileType ? "PDF thumbnail" : `Page ${pageNumber}`}
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

      {/* Content details */}
      <div className="mt-3">
        {isFileType ? (
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

      {/* Reorder indicator (for files) */}
      {isFileType && (
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
      )}
    </div>
  );
};

export default PDFPreviewItem;
