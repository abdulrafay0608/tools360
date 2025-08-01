import dynamic from "next/dynamic";

const toolMap = {
  "merge-pdf": dynamic(() => import("@/tools/pdf/merge-pdf/page")),
  // "split-pdf": dynamic(() => import("@/tools/pdf/split-pdf/page")),
};

export default function ToolRenderer({ slug }) {
  const ToolComponent = toolMap[slug];
  return ToolComponent ? (
    <ToolComponent />
  ) : (
    <div className="py-10 md:px-4">Tool coming soon...</div>
  );
}
