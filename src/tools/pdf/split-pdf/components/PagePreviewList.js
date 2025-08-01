// src/tools/pdf/split-pdf/components/PagePreviewList.js
import React from "react";
import PDFPreviewItem from "@/components/pdf/PDFPreviewItem";

const PagePreviewList = ({
  thumbnails = [],
  selectedPages = [], // Default to empty array
  onPageSelect,
  pdfjsLoaded,
  isGenerating,
}) => {
  if (thumbnails.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
      {thumbnails.map((thumbnail, index) => {
        const pageNumber = index + 1;
        return (
          <PDFPreviewItem
            key={`page-${pageNumber}-${selectedPages.includes(pageNumber)}`}
            type="page"
            item={{}}
            index={index}
            thumbnail={thumbnail}
            isSelected={selectedPages.includes(pageNumber)}
            onSelect={() => onPageSelect(pageNumber)}
            pdfjsLoaded={pdfjsLoaded}
            isGenerating={isGenerating}
            className="h-32 sm:h-40" // Responsive height
          />
        );
      })}
    </div>
  );
};

export default PagePreviewList;
