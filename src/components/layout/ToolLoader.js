// components/layout/ToolLoader.js
import React from "react";
import { FaSpinner, FaTools, FaCog } from "react-icons/fa";

export default function ToolLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      {/* Animated spinner with tools icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center justify-center">
          <FaTools className="text-3xl text-blue-500 opacity-80" />
        </div>
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
      </div>
      
      {/* Loading text with animation */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Initializing Tool
        </h3>
        <p className="text-gray-600 mb-4 max-w-md">
          Preparing your specialized PDF tool for use. This usually takes just a moment.
        </p>
        
        {/* Animated progress dots */}
        <div className="flex justify-center space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
      
      {/* Optional: Loading tips that cycle through messages */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg max-w-md text-center">
        <div className="flex items-center justify-center text-sm text-blue-700">
          <FaCog className="mr-2 animate-spin" style={{ animationDuration: "3s" }} />
          <span>Tip: You can drag and drop files directly onto the tool</span>
        </div>
      </div>
    </div>
  );
}