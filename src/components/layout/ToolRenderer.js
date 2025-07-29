import dynamic from "next/dynamic";

const toolMap = {
  "merge-pdf": dynamic(() => import("@/tools/pdf/merge-pdf/page")),
};

export default function ToolRenderer({ slug }) {
  const ToolComponent = toolMap[slug];
  return ToolComponent ? <ToolComponent /> : <div>Tool coming soon...</div>;
}
