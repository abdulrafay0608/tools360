"use client";

import React from "react";

export default function PDFJSStatus({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-sm border border-[#f3cfc8] bg-[#fdf4f3] px-4 py-3 text-sm text-[#a13c2f]" role="alert">
      <span>{error}</span>
      <button type="button" className="font-semibold underline" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
