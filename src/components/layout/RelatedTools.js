// components/tools/RelatedTools.js
import React from "react";
import { FaArrowRight } from "react-icons/fa";
import Link from "next/link";
import { toolsData } from "@/data/tools-data";
import ToolCard from "../ui/ToolCard";

const RelatedTools = ({ currentCategory, currentToolSlug }) => {
  console.log("first", currentCategory, currentToolSlug);
  // Find the current category data
  const categoryData = toolsData.find(
    (cat) => cat.category === currentCategory
  );

  // Get all tools except the current one
  const relatedTools = categoryData
    ? categoryData.tools.filter((tool) => tool.slug !== currentToolSlug)
    : [];

  // Randomly select up to 4 tools
  const shuffled = [...relatedTools].sort(() => 0.5 - Math.random());
  const selectedTools = shuffled.slice(0, 4);

  if (selectedTools.length === 0) return null;

  return (
    <div className="mt-12 mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          More {currentCategory}
        </h2>
        <Link
          href={`/tools/${currentCategory.toLowerCase().replace(/\s+/g, "-")}`}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
        >
          View all tools <FaArrowRight className="ml-1" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {selectedTools.map((tool) => (
          <ToolCard
            key={tool.slug}
            name={tool.name}
            slug={tool.slug}
            description={tool.description}
            icon={tool.icon}
            // category={category.category}
          />
        ))}
      </div>
    </div>
  );
};

export default RelatedTools;
