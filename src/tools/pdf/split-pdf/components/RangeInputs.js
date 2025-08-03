// src/tools/pdf/split-pdf/components/RangeInputs.js
import React from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import Button from "@/components/ui/Button";

const RangeInputs = ({
  ranges,
  totalPages,
  updateRange,
  removeRange,
  addRange,
}) => {
  return (
    <div className="bg-white p-4 border border-gray-200 rounded">
      <label className="block text-sm font-semibold text-gray-700 mb-4">
        Page Ranges
      </label>

      {ranges.map((range, index) => (
        <div key={index} className="relative flex items-start gap-3 mb-3">
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">From</label>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={range.from}
                onChange={(e) => updateRange(index, "from", e.target.value)}
                placeholder="Start"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">To</label>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={range.to}
                onChange={(e) => updateRange(index, "to", e.target.value)}
                placeholder="End"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {ranges.length > 1 && (
            <button
              type="button"
              onClick={() => removeRange(index)}
              className="text-red-600 hover:text-red-800 mt-6"
            >
              <FaTrash />
            </button>
          )}
        </div>
      ))}

      <div className="flex gap-2 mt-4">
        <Button
          variant="outline"
          onClick={addRange}
          icon={<FaPlus className="text-xs" />}
          className="text-sm py-2"
        >
          Add Range
        </Button>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Specify custom ranges to split PDF (e.g., 1-3, 5-8). You can add
        multiple ranges.
      </p>
    </div>
  );
};

export default RangeInputs;
