"use client";

import React, { useState } from "react";
import { FaKeyboard } from "react-icons/fa";

/**
 * KeyboardShortcutsModal
 * Accessible popover modal displaying keyboard shortcuts.
 */
export default function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Keyboard shortcuts"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#dce5e0] bg-white text-[#52675e] transition-colors hover:bg-[#f4f7f5]"
        title="Keyboard Shortcuts"
      >
        <FaKeyboard className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-56 rounded-sm border border-[#dce5e0] bg-white p-3 shadow-lg">
          <p className="mb-2 text-xs font-semibold text-[#263e36]">Keyboard Shortcuts</p>
          <ul className="space-y-1.5 text-xs text-[#52675e]">
            {[
              ["← / →", "Previous / Next page"],
              ["1", "Side-by-side view"],
              ["2", "Overlay view"],
              ["3", "Difference map view"],
              ["+ / -", "Zoom in / Zoom out"],
            ].map(([key, label]) => (
              <li key={key} className="flex items-center justify-between gap-2">
                <kbd className="rounded bg-[#f4f7f5] px-1.5 py-0.5 font-mono text-[10px] text-[#173d34]">
                  {key}
                </kbd>
                <span className="text-right text-[11px]">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
