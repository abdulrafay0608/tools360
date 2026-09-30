// src/tools/pdf/split-pdf/components/FixedSplitInput.js
import React from "react";

const FixedSplitInput = ({
  fixedSplit,
  onFixedSplitChange,
  totalPages,
  documentCount,
}) => {
  const message =
    documentCount === 1
      ? `The PDF will be split into 1 document with ${totalPages} pages`
      : `The PDF will be split into ${documentCount} documents with ${fixedSplit} pages each`;

  return (
    <div className="border border-[#dce5e0] bg-white p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-semibold text-[#263e36]">
            Pages per Document
          </label>

          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max={totalPages}
              value={fixedSplit}
              onChange={(e) => onFixedSplitChange(e.target.value)}
              className="w-24 rounded-sm border border-[#b8c9c0] bg-white px-3 py-2 text-sm text-[#172c27] outline-none focus-visible:ring-2 focus-visible:ring-[#527268]"
            />
            <span className="text-sm text-[#5d706a]">pages per document</span>
          </div>
        </div>

        <div className="my-2">
          <p className="text-sm text-[#405950]">{message}</p>
          {documentCount > 1 && (
            <p className="mt-1 text-xs text-[#708079]">
              The last document may have fewer pages
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FixedSplitInput;
