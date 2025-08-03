// components/layout/ToolLoader.js
import React from "react";
import { FaSpinner } from "react-icons/fa";

export default function ToolLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <FaSpinner className="animate-spin text-4xl text-blue-600 mb-4" />
      <p className="text-gray-600">Loading tool…</p>
    </div>
  );
}
