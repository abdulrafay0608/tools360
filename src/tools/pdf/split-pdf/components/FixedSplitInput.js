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
    <div className="bg-white p-4 border border-gray-200 rounded">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-2">
            Pages per Document
          </label>

          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max={totalPages}
              value={fixedSplit}
              onChange={(e) => onFixedSplitChange(e.target.value)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <span className="text-sm text-gray-600">pages per document</span>
          </div>
        </div>

        <div className="my-2">
          <p className="text-sm text-gray-700">{message}</p>
          {documentCount > 1 && (
            <p className="text-xs text-gray-600 mt-1">
              The last document may have fewer pages
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FixedSplitInput;
