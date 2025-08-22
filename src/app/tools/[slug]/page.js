import React from "react";
import { toolsData } from "@/data/tools-data";
import NotFoundTool from "@/components/layout/NotFoundTool";
import ToolLayout from "@/components/layout/ToolLayout";
import ToolRenderer from "@/components/layout/ToolRenderer";

export async function generateStaticParams() {
  const slugs = toolsData.flatMap((cat) =>
    cat.tools.map((tool) => ({ slug: tool.slug }))
  );
  return slugs;
}

export async function generateMetadata({ params }) {
  const allTools = toolsData.flatMap((cat) => cat.tools);
  const tool = allTools.find((t) => t.slug === params.slug);

  // Find the category for this tool
  let category = "PDF Tools"; // Default
  for (const cat of toolsData) {
    if (cat.tools.some((t) => t.slug === params.slug)) {
      category = cat.category;
      break;
    }
  }

  return {
    title: tool ? `${tool.name} | Tools360.com` : "Tool Not Found",
    description: tool?.description || "Explore PDF, Dev, SEO, and more tools.",
    category: category,
  };
}

export default function ToolPage({ params }) {
  const allTools = toolsData.flatMap((cat) => cat.tools);
  const tool = allTools.find((t) => t.slug === params.slug);

  // Find the category for this tool
  let category = "PDF Tools"; // Default
  for (const cat of toolsData) {
    if (cat.tools.some((t) => t.slug === params.slug)) {
      category = cat.category;
      break;
    }
  }

  if (!tool) return <NotFoundTool />;
  return (
    <ToolLayout
      title={tool.name}
      slug={tool.slug}
      description={tool.description}
      category={category}
    >
      <ToolRenderer slug={tool.slug} />
    </ToolLayout>
  );
}
