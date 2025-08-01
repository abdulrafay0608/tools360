// src/tools/pdf/split-pdf/components/SplitModeSelector.js
import React from "react";
import Button from "@/components/ui/Button";
import { 
  FaDownload, FaRandom, FaList, FaDivide 
} from "react-icons/fa";

const SplitModeSelector = ({ splitMode, setSplitMode }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
    <Button
      variant={splitMode === "single" ? "primary" : "secondary"}
      onClick={() => setSplitMode("single")}
      icon={<FaDownload className="text-sm" />}
      className="h-full text-xs sm:text-sm py-2"
    >
      Extract Pages
    </Button>
    
    <Button
      variant={splitMode === "all" ? "primary" : "secondary"}
      onClick={() => setSplitMode("all")}
      icon={<FaRandom className="text-sm" />}
      className="h-full text-xs sm:text-sm py-2"
    >
      Split All
    </Button>
    
    <Button
      variant={splitMode === "range" ? "primary" : "secondary"}
      onClick={() => setSplitMode("range")}
      icon={<FaList className="text-sm" />}
      className="h-full text-xs sm:text-sm py-2"
    >
      By Range
    </Button>
    
    <Button
      variant={splitMode === "fixed" ? "primary" : "secondary"}
      onClick={() => setSplitMode("fixed")}
      icon={<FaDivide className="text-sm" />}
      className="h-full text-xs sm:text-sm py-2"
    >
      Fixed Split
    </Button>
  </div>
);

export default SplitModeSelector;