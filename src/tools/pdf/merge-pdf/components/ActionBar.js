// src/app/tools/pdf/merge-pdf/components/ActionBar.js
import React from "react";
import { FaTrash, FaObjectGroup, FaArrowRight } from "react-icons/fa";
import Button from "@/components/ui/Button";

const ActionBar = ({ fileCount, onClearAll, onMerge, isMerging, canMerge }) => {
  return (
    <div className="flex  justify-end gap-3 p-2">
      <Button
        variant="secondary"
        size="sm"
        icon={<FaTrash />}
        onClick={onClearAll}
      >
        Clear All
      </Button>

      <Button
        variant="primary"
        size="sm"
        icon={<FaObjectGroup />}
        onClick={onMerge}
        disabled={isMerging || !canMerge}
        isLoading={isMerging}
      >
        {isMerging ? "Merging..." : `Merge ${fileCount} PDFs`}
      </Button>
    </div>
  );
};

export default ActionBar;
