"use client";

import dynamic from "next/dynamic";
import ToolLoader from "./ToolLoader";
import NotFoundTool from "./NotFoundTool";

const toolMap = {
  "merge-pdf": dynamic(() => import("@/tools/pdf/merge-pdf/page"), {
    ssr: false,
    loading: () => <ToolLoader />,
  }),
  "split-pdf": dynamic(() => import("@/tools/pdf/split-pdf/page"), {
    ssr: false,
    loading: () => <ToolLoader />,
  }),
  // for future tools:
  // "compress-pdf": dynamic(() => import("@/tools/pdf/compress-pdf/page"), { ssr: false, loading: () => <ToolLoader /> }),
};

export default function ToolRenderer({ slug }) {
  const ToolComponent = toolMap[slug];
  if (!ToolComponent) return <NotFoundTool />;
  return <ToolComponent />;
}
