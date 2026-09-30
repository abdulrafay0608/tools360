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
    <div className="w-full overflow-hidden border border-[#dce5e0] bg-white">
      <div className="border-b border-[#dce5e0] bg-[#f4f7f5] py-2 text-center text-sm font-medium text-[#405950]">
        Range {rangeNumber} ({totalPagesInRange} pages)
      </div>

      <div className="flex justify-center items-center gap-3 p-4">
        {showLoading ? (
          // Loading state
          <>
            <div className="flex h-32 w-24 items-center justify-center bg-[#f4f7f5]">
              <div className="size-6 animate-spin rounded-full border-2 border-[#dce5e0] border-b-[#235c4f]"></div>
            </div>
            {totalPagesInRange > 1 && (
              <>
                <div className="flex h-16 w-12 items-center justify-center text-[#708079]">
                  <FaEllipsisH />
                </div>
                <div className="flex h-32 w-24 items-center justify-center bg-[#f4f7f5]">
                  <div className="size-6 animate-spin rounded-full border-2 border-[#dce5e0] border-b-[#235c4f]"></div>
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
                <div className="flex h-16 w-12 items-center justify-center text-[#708079]">
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
