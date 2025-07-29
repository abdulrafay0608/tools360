// src/app/tools/pdf/merge-pdf/components/FilePreviewItem.js
import Button from "@/components/ui/Button";
import React from "react";
import { IoIosClose } from "react-icons/io";

const FilePreviewItem = ({
  file,
  index,
  thumbnail,
  onRemove,
  onDragStart,
  onDrop,
  pdfjsLoaded,
  isGenerating,
}) => {
  return (
    <div
      className="bg-gray-50 rounded-lg p-2 flex flex-col border border-gray-200 hover:border-blue-300 transition-colors cursor-move group relative"
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <div className="absolute -top-2 -right-2 z-3 transition-opacity">
        <button
          onClick={onRemove}
          className="bg-red-500 text-white size-5 flex justify-center items-center rounded-full hover:bg-red-600 text-xl"
          title="Remove file"
        >
          <IoIosClose />
        </button>
      </div>
      <div className="absolute -top-2 -left-2 bg-blue-600 text-white size-5 rounded-full flex items-center justify-center text-xs font-medium">
        {index + 1}
      </div>

      <div className="relative w-full h-40 bg-white border border-gray-200 rounded-md flex items-center justify-center overflow-hidden">
        {pdfjsLoaded ? (
          thumbnail ? (
            <img
              src={thumbnail}
              alt="PDF thumbnail"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <span className="text-gray-500 text-xs">
                Generating preview...
              </span>
            </div>
          )
        ) : (
          <div className="text-center">
            <div className="animate-pulse bg-gray-200 rounded-lg w-16 h-16 mx-auto mb-2"></div>
            <span className="text-gray-500 text-xs">Loading PDF engine...</span>
          </div>
        )}

        {isGenerating && !thumbnail && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <span className="text-gray-500 text-xs">Processing...</span>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs flex items-center mt-3">
        <h4 className="text-xs font-medium text-gray-800 truncate">
          {file.name}
        </h4>
      </div>
      <div className="mt-1 text-xs text-gray-500 flex justify-between">
        <span>{(file.size / 1024).toFixed(1)} KB</span>
        <span className="text-blue-600">PDF</span>
      </div>

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
    </div>
  );
};

export default FilePreviewItem;
