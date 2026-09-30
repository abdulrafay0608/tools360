import { toolsData } from "@/data/tools-data";
import ToolLayout from "@/components/layout/ToolLayout";
import ToolRenderer from "@/components/layout/ToolRenderer";
import { notFound } from "next/navigation";

export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = toolsData.flatMap((cat) =>
    cat.tools
      .filter((tool) => tool.available)
      .map((tool) => ({ slug: tool.slug }))
  );
  return slugs;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const allTools = toolsData.flatMap((cat) => cat.tools);
  const tool = allTools.find((t) => t.slug === slug && t.available);

  return {
    title: tool ? `${tool.name} | Tools360.com` : "Tool Not Found",
    description: tool?.description || "Explore PDF, Dev, SEO, and more tools.",
  };
}

export default async function ToolPage({ params }) {
  const { slug } = await params;
  const allTools = toolsData.flatMap((cat) => cat.tools);
  const tool = allTools.find((t) => t.slug === slug && t.available);
  if (!tool) notFound();

  return (
    <ToolLayout title={tool.name} description={tool.description} category={""}>
      <ToolRenderer slug={tool.slug}  />
    </ToolLayout>
  );
}
