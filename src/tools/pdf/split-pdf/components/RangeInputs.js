// src/tools/pdf/split-pdf/components/RangeInputs.js
import React from "react";
import Button from "@/components/ui/Button";
import { FaPlus, FaTrash } from "react-icons/fa";

const RangeInputs = ({
  ranges,
  totalPages,
  rangeError,
  updateRange,
  removeRange,
  addRange,
  applyCustomRanges,
}) => (
  <div className="mt-4 bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Page Ranges
      </label>

      {ranges.map((range, index) => (
        <div
          key={index}
          className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3"
        >
          <div className="flex items-center gap-2 flex-1">
            <input
              type="number"
              min="1"
              max={totalPages}
              value={range.from}
              onChange={(e) => updateRange(index, "from", e.target.value)}
              placeholder="From"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <span className="text-gray-500 text-sm hidden sm:block">to</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={range.to}
              onChange={(e) => updateRange(index, "to", e.target.value)}
              placeholder="To"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <Button
            variant="icon"
            onClick={() => removeRange(index)}
            className="text-red-600 hover:text-red-800 self-end sm:self-auto"
            disabled={ranges.length === 1}
          >
            <FaTrash className="text-base" />
          </Button>
        </div>
      ))}

      <div className="flex flex-col sm:flex-row gap-2 mt-3">
        <Button
          variant="secondary"
          onClick={addRange}
          icon={<FaPlus className="text-xs" />}
          className="text-xs sm:text-sm py-2"
        >
          Add Another Range
        </Button>
        <Button
          variant="primary"
          onClick={applyCustomRanges}
          className="text-xs sm:text-sm py-2"
        >
          Apply Ranges
        </Button>
      </div>
    </div>

    {rangeError && (
      <p className="mt-2 text-xs sm:text-sm text-red-600">{rangeError}</p>
    )}

    <p className="mt-3 text-xs text-gray-500">
      Enter page ranges to extract (e.g., 1-3, 5-7). You can add multiple
      ranges.
    </p>
  </div>
);

export default RangeInputs;
