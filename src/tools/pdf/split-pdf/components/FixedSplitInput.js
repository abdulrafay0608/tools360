// src/tools/pdf/split-pdf/components/FixedSplitInput.js
import React from "react";
import Button from "@/components/ui/Button";

const FixedSplitInput = ({
  fixedSplit,
  setFixedSplit,
  totalPages,
  rangeError,
  applyFixedSplit
}) => (
  <div className="mt-4 bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
    <div className="flex flex-col md:flex-row gap-3 items-start">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pages per Split
        </label>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max={totalPages}
              value={fixedSplit}
              onChange={(e) => setFixedSplit(parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <span className="text-sm text-gray-600 whitespace-nowrap">
              pages per document
            </span>
          </div>
          
          <Button
            variant="primary"
            onClick={applyFixedSplit}
            className="mt-2 sm:mt-0 w-full sm:w-auto text-sm"
          >
            Apply Split
          </Button>
        </div>
        
        {rangeError && (
          <p className="mt-2 text-xs sm:text-sm text-red-600">{rangeError}</p>
        )}
        
        <p className="mt-2 text-xs text-gray-500">
          PDF will be split into multiple documents with the specified pages each
        </p>
      </div>
    </div>
  </div>
);

export default FixedSplitInput;