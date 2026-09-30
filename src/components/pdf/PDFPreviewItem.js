// components/pdf/PDFPreviewItem.js
import React, { memo } from "react";
import { IoIosClose } from "react-icons/io";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";

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
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
  pdfjsLoaded,
  isGenerating,
}) => {
  const isFileMode = mode === "file";
  const isPageMode = mode === "page";
  const isBeforeMode = mode === "before";
  const isAfterMode = mode === "after";
  const canReorder = isFileMode && Boolean(onDragStart);
  const pageNumber = isPageMode ? index + 1 : null;

  // Determine container classes based on mode and selection
  let containerClasses = "border-[#dce5e0] ";
  if (isPageMode) {
    containerClasses = isSelected
      ? "border-[#235c4f] ring-1 ring-[#235c4f] cursor-pointer"
      : "border-[#dce5e0] hover:border-[#91aa9c] cursor-pointer";
  } else if (isFileMode) {
    containerClasses = `border-[#dce5e0] hover:border-[#91aa9c] ${canReorder ? "cursor-move" : ""}`;
  }

  return (
    <div
      className={`group relative border bg-white px-3 py-3 transition-colors ${containerClasses}`}
      draggable={canReorder}
      onClick={isPageMode ? onSelect : undefined}
      onKeyDown={
        isPageMode && onSelect
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      tabIndex={isPageMode && onSelect ? 0 : undefined}
      onDragStart={canReorder ? onDragStart : undefined}
      onDragOver={canReorder ? (event) => event.preventDefault() : undefined}
      onDrop={canReorder ? onDrop : undefined}
      role={isPageMode && onSelect ? "button" : "group"}
      aria-label={isFileMode ? item.name : `Page ${pageNumber}`}
    >
      {isFileMode && (
        <>
          <span className="absolute left-2 top-2 flex size-6 items-center justify-center bg-[#eaf3ed] text-xs font-semibold text-[#235c4f]">
            {index + 1}
          </span>
          <div className="absolute right-2 top-2 flex items-center gap-1">
            {onMoveUp && (
              <button
                type="button"
                aria-label={`Move ${item.name} up`}
                title="Move up"
                disabled={!canMoveUp}
                onClick={onMoveUp}
                className="flex size-7 items-center justify-center text-[#527268] transition-colors hover:bg-[#edf3ef] disabled:cursor-not-allowed disabled:opacity-35"
              >
                <FaArrowUp aria-hidden="true" />
              </button>
            )}
            {onMoveDown && (
              <button
                type="button"
                aria-label={`Move ${item.name} down`}
                title="Move down"
                disabled={!canMoveDown}
                onClick={onMoveDown}
                className="flex size-7 items-center justify-center text-[#527268] transition-colors hover:bg-[#edf3ef] disabled:cursor-not-allowed disabled:opacity-35"
              >
                <FaArrowDown aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              aria-label={`Remove ${item.name}`}
              onClick={onRemove}
              className="flex size-7 items-center justify-center text-[#708079] transition-colors hover:bg-[#f9eeec] hover:text-[#a13c2f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a13c2f]"
            >
              <IoIosClose className="size-5" aria-hidden="true" />
            </button>
          </div>
        </>
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
      <div className="flex h-32 w-full items-center justify-center overflow-hidden bg-[#f4f7f5]">
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

      {/* Details section */}
      <div className="mt-3">
        {isFileMode && (
          <>
            <h4 className="truncate pr-6 text-xs font-medium text-[#263e36]">
              {item.name}
            </h4>
            <div className="mt-1 flex justify-between text-xs text-[#708079]">
              <span>{(item.size / 1024).toFixed(1)} KB</span>
              <span className="font-medium text-[#527268]">PDF</span>
            </div>
          </>
        )}
        {isPageMode && (
          <div className="text-center text-xs font-medium text-[#405950]">
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
