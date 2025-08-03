// src/tools/pdf/split-pdf/components/PagePreviewList.js
import React from "react";
import PDFPreviewItem from "@/components/pdf/PDFPreviewItem";
import { FaEllipsisH } from "react-icons/fa";

const PagePreviewList = ({
  thumbnails = [],
  pdfjsLoaded,
  isGenerating,
  rangeNumber = 1,
  totalPagesInRange = 0,
}) => {
  const showLoading = !pdfjsLoaded || isGenerating || thumbnails.length === 0;
  const totalPages = thumbnails.length;
  const firstPageIndex = 0;
  const lastPageIndex = totalPages - 1;

  return (
    <div className="w-full border border-slate-300 rounded overflow-hidden">
      <div className="text-center font-medium py-2 border-b border-slate-300 bg-slate-100">
        Range {rangeNumber} ({totalPagesInRange} pages)
      </div>

      <div className="flex justify-center items-center gap-3 p-4">
        {showLoading ? (
          // Loading state
          <>
            <div className="h-32 w-24 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
            {totalPagesInRange > 1 && (
              <>
                <div className="w-12 h-16 flex items-center justify-center text-gray-500">
                  <FaEllipsisH />
                </div>
                <div className="h-32 w-24 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              </>
            )}
          </>
        ) : (
          // Thumbnails preview
          <>
            <PDFPreviewItem
              mode="page"
              item={{}}
              index={firstPageIndex}
              thumbnail={thumbnails[firstPageIndex]}
              pdfjsLoaded={pdfjsLoaded}
              isGenerating={isGenerating}
              className="h-32"
            />

            {totalPages > 1 && (
              <>
                <div className="w-12 h-16 flex items-center justify-center text-gray-500">
                  <FaEllipsisH />
                </div>
                <PDFPreviewItem
                  mode="page"
                  item={{}}
                  index={lastPageIndex}
                  thumbnail={thumbnails[lastPageIndex]}
                  pdfjsLoaded={pdfjsLoaded}
                  isGenerating={isGenerating}
                  className="h-32"
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PagePreviewList;
