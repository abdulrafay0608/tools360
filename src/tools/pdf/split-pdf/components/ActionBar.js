// src/tools/pdf/split-pdf/components/ActionBar.js
import React from "react";
import Button from "@/components/ui/Button";
import { FaTrash, FaCut, FaCheck, FaTimes } from "react-icons/fa";

const ActionBar = ({
  file,
  selectedCount,
  totalPages,
  onClear,
  onSplit,
  isSplitting,
  canSplit,
  splitMode,
  onSelectAll,
  onClearSelection,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
        <Button
          variant="secondary"
          size="xs"
          icon={<FaCheck className="text-xs" />}
          onClick={onSelectAll}
          className="text-xs px-2 py-1"
        >
          All
        </Button>

        <Button
          variant="secondary"
          size="xs"
          icon={<FaTimes className="text-xs" />}
          onClick={onClearSelection}
          className="text-xs px-2 py-1"
        >
          Clear
        </Button>

        <Button
          variant="secondary"
          size="xs"
          icon={<FaTrash className="text-xs" />}
          onClick={onClear}
          className="text-xs px-2 py-1"
        >
          File
        </Button>
      </div>

      <Button
        variant="primary"
        icon={<FaCut className="text-sm" />}
        onClick={onSplit}
        disabled={isSplitting || !canSplit}
        isLoading={isSplitting}
        className="w-full sm:w-auto text-xs sm:text-sm px-4 py-2"
      >
        {splitMode === "single"
          ? `Extract ${selectedCount} Pages`
          : `Split ${selectedCount} Pages`}
      </Button>
    </div>
  );
};

export default ActionBar;
