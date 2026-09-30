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
    <div className="border border-[#dce5e0] bg-white p-4">
      <h2 className="mb-4 text-sm font-semibold text-[#263e36]">
        Page Ranges
      </h2>

      {ranges.map((range, index) => (
        <div key={index} className="relative flex items-start gap-3 mb-3">
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-[#708079]">From</label>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={range.from}
                onChange={(e) => updateRange(index, "from", e.target.value)}
                placeholder="Start"
                className="w-full rounded-sm border border-[#b8c9c0] bg-white px-3 py-2 text-sm text-[#172c27] outline-none focus-visible:ring-2 focus-visible:ring-[#527268]"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-[#708079]">To</label>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={range.to}
                onChange={(e) => updateRange(index, "to", e.target.value)}
                placeholder="End"
                className="w-full rounded-sm border border-[#b8c9c0] bg-white px-3 py-2 text-sm text-[#172c27] outline-none focus-visible:ring-2 focus-visible:ring-[#527268]"
              />
            </div>
          </div>

          {ranges.length > 1 && (
            <button
              type="button"
              onClick={() => removeRange(index)}
              aria-label={`Remove range ${index + 1}`}
              className="mt-6 flex size-10 shrink-0 items-center justify-center text-[#a13c2f] transition-colors hover:bg-[#f9eeec] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a13c2f]"
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

      <p className="mt-3 text-xs leading-5 text-[#708079]">
        Specify custom ranges to split PDF (e.g., 1-3, 5-8). You can add
        multiple ranges.
      </p>
    </div>
  );
};

export default RangeInputs;
