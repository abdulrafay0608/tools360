// components/layout/ToolLayout.js
import React from "react";
import { FaFilePdf, FaLaptop } from "react-icons/fa";
import AdSlot from "@/components/ads/AdSlot";
import ToolAdFrame from "@/components/ads/ToolAdFrame";

/**
 * ToolLayout — Responsive layout for tool pages.
 *
 * Desktop (lg+): 2-column layout (tool content + sticky ad sidebar).
 * Mobile: 1-column layout, no sidebar.
 *
 * Ad placements (all from config):
 * - Desktop sidebar: sticky "tool-sidebar" (right column)
 * - Below tool: "tool-below" (horizontal, both breakpoints)
 * - Content section: "content-mid" (inside SEO content area)
 */
const ToolLayout = ({ title, description, children, seoContent }) => {
  return (
    <main className="min-h-[70vh] bg-[#f4f7f5] text-[#172c27]">
      <div className="border-b border-[#dce5e0] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8 sm:py-8 lg:px-12">
          <div className="max-w-4xl">
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#527268] sm:mb-4">
              <FaFilePdf aria-hidden="true" /> PDF workspace
            </div>
            <h1 className="text-2xl font-semibold leading-tight sm:text-4xl">
              {title}
            </h1>
            {description && (
              <p className="mt-2 min-h-12 max-w-2xl text-sm leading-6 text-[#5d706a] sm:mt-3 sm:min-h-14 sm:text-base sm:leading-7">
                {description}
              </p>
            )}

            <div className="mt-3 flex flex-wrap justify-start gap-x-5 gap-y-2 sm:mt-5">
              <div className="flex items-center gap-2 text-sm text-[#527268]">
                <FaLaptop className="mr-1" aria-hidden="true" /> Processed in your browser
              </div>
              <div className="flex items-center gap-2 text-sm text-[#527268]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Files are not uploaded
              </div>
              <div className="flex items-center gap-2 text-sm text-[#527268]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                No account required
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-8 sm:py-8 lg:px-12">
        <ToolAdFrame>
          <div className="flex flex-col lg:flex-row lg:gap-8">
            <div className="min-w-0 flex-1">
              <div className="border border-[#dce5e0] bg-white">{children}</div>

              <div className="mt-6 lg:mt-8">
                <AdSlot placement="tool-below" />
              </div>

              {seoContent ? (
                <div className="mt-8">
                  {seoContent}
                  <div className="mt-8">
                    <AdSlot placement="content-mid" />
                  </div>
                </div>
              ) : null}
            </div>

            <aside className="hidden w-[300px] shrink-0 lg:block">
              <div
                className="sticky top-8"
                style={{ maxHeight: "calc(100vh - 4rem)" }}
              >
                <AdSlot placement="tool-sidebar" />
              </div>
            </aside>
          </div>
        </ToolAdFrame>
      </div>
    </main>
  );
};

export default ToolLayout;
