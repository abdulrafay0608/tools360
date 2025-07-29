import { toolsData } from "@/data/tools-data";
import ToolLayout from "@/components/layout/ToolLayout";
import ToolRenderer from "@/components/layout/ToolRenderer";
import NotFoundTool from "@/components/layout/NotFoundTool";

export async function generateStaticParams() {
  const slugs = toolsData.flatMap((cat) =>
    cat.tools.map((tool) => ({ slug: tool.slug }))
  );
  return slugs;
}

export async function generateMetadata({ params }) {
  const allTools = toolsData.flatMap((cat) => cat.tools);
  const tool = allTools.find((t) => t.slug === params.slug);

  return {
    title: tool ? `${tool.name} | Tools360.com` : "Tool Not Found",
    description: tool?.description || "Explore PDF, Dev, SEO, and more tools.",
  };
}

export default function ToolPage({ params }) {
  const allTools = toolsData.flatMap((cat) => cat.tools);
  const tool = allTools.find((t) => t.slug === params.slug);
  if (!tool) return <NotFoundTool />;

  return (
    <ToolLayout title={tool.name} description={tool.description} category={""}>
      <ToolRenderer slug={tool.slug}  />
    </ToolLayout>
  );
}
