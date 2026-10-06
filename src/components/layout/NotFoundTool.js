"use client";

import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import { useAdPauseWhile } from "@/hooks/useAdPause";

export default function NotFoundTool() {
  useAdPauseWhile("empty-tool", true);

  return (
    <div className="py-20 text-center">
      <FaExclamationTriangle className="text-5xl text-amber-500 mb-4 mx-auto" />
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Tool Not Found</h2>
      <p className="text-gray-600">Sorry, we couldn’t find that PDF tool.</p>
    </div>
  );
}
