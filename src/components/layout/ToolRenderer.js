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
  "compress-pdf": dynamic(() => import("@/tools/pdf/compress-pdf/page"), {
    ssr: false,
    loading: () => <ToolLoader />,
  }),
  "compare-pdf": dynamic(() => import("@/tools/pdf/compare-pdf/page"), {
    ssr: false,
    loading: () => <ToolLoader />,
  }),
  "jpg-to-pdf": dynamic(() => import("@/tools/pdf/jpg-to-pdf/page"), {
    ssr: false,
    loading: () => <ToolLoader />,
  }),
  "pdf-to-jpg": dynamic(() => import("@/tools/pdf/pdf-to-jpg/page"), {
    ssr: false,
    loading: () => <ToolLoader />,
  }),
  "sign-pdf": dynamic(() => import("@/tools/pdf/sign-pdf/page"), {
    ssr: false,
    loading: () => <ToolLoader />,
  }),
  "organize-pdf": dynamic(() => import("@/tools/pdf/organize-pdf/page"), {
    ssr: false,
    loading: () => <ToolLoader />,
  }),
  "rotate-pdf": dynamic(() => import("@/tools/pdf/rotate-pdf/page"), {
    ssr: false,
    loading: () => <ToolLoader />,
  }),
};

export default function ToolRenderer({ slug }) {
  const ToolComponent = toolMap[slug];
  if (!ToolComponent) return <NotFoundTool />;
  return <ToolComponent />;
}
