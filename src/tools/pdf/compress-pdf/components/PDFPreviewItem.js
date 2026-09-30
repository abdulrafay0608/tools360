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
    ? "border-[#dce5e0] hover:border-[#91aa9c] cursor-move"
    : isSelected
    ? "border-[#235c4f] ring-1 ring-[#235c4f] cursor-pointer"
    : "border-[#dce5e0] hover:border-[#91aa9c] cursor-pointer";

  return (
    <div
      className={`group relative w-40 shrink-0 border bg-white px-3 py-3 transition-colors ${containerClasses}`}
      draggable={isFileMode}
      onClick={!isFileMode ? onSelect : undefined}
      onDragStart={isFileMode ? onDragStart : undefined}
      onDragOver={isFileMode ? (e) => e.preventDefault() : undefined}
      onDrop={isFileMode ? onDrop : undefined}
      role={isFileMode ? "group" : "button"}
      aria-label={`Preview ${mode}`}
    >
      {/* Remove / index badge */}
      {isFileMode && (
        <div
          role="button"
          tabIndex={0}
          aria-label={`Remove ${item.name}`}
          className="absolute right-2 top-2 flex size-7 cursor-pointer items-center justify-center bg-white text-[#708079] transition-colors hover:bg-[#f9eeec] hover:text-[#a13c2f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a13c2f]"
          onClick={onRemove}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onRemove();
            }
          }}
        >
          <span className="hidden group-hover:block text-base leading-none">
            <IoIosClose />
          </span>
        </div>
      )}

      {/* Thumbnail */}
      <div className="flex h-32 items-center justify-center overflow-hidden bg-[#f4f7f5]">
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
              <div className="mx-auto mb-2 size-7 animate-spin rounded-full border-2 border-[#dce5e0] border-b-[#235c4f]"></div>
              <span className="text-xs text-[#708079]">
                {isGenerating ? "Processing..." : "Generating preview..."}
              </span>
            </div>
          )
        ) : (
          <div className="text-center p-4">
            <div className="mx-auto mb-2 size-14 animate-pulse bg-[#e4ece7]"></div>
            <span className="text-xs text-[#708079]">Loading PDF engine...</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="mt-3">
        {isFileMode ? (
          <>
            <h4 className="truncate pr-6 text-xs font-medium text-[#263e36]">
              {item.name}
            </h4>
            <div className="mt-1 flex justify-between text-xs text-[#708079]">
              <span>{(item.size / 1024).toFixed(1)} KB</span>
              <span className="font-medium text-[#527268]">PDF</span>
            </div>
          </>
        ) : (
          <div className="text-center text-xs font-medium text-[#405950]">
            Page {pageNumber}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(PDFPreviewItem);
