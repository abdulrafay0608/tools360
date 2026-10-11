import Link from "next/link";
import ToolCard from "@/components/ui/ToolCard";
import { getToolsByCategory } from "@/data/toolsDataUtils";

export default function RelatedTools({ category, currentToolSlug }) {
  if (!category) return null;
  const relatedTools = getToolsByCategory(category.id).filter(
    (tool) => tool.available === true && tool.slug !== currentToolSlug
  );
  if (relatedTools.length === 0) return null;

  return (
    <section
      aria-labelledby="related-tools-heading"
      className="mt-8 border border-[#dce5e0] bg-white p-5 sm:p-6"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 id="related-tools-heading" className="text-xl font-semibold text-[#173d34]">
          More {category.category}
        </h2>
        <Link
          href={`/tools/category/${category.id}`}
          className="text-sm font-medium text-[#235c4f] hover:underline"
        >
          View category →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {relatedTools.slice(0, 4).map((tool) => (
          <ToolCard
            key={tool.slug}
            name={tool.name}
            slug={tool.slug}
            description={tool.description}
            icon={tool.icon}
          />
        ))}
      </div>
    </section>
  );
}
