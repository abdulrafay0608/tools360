// components/tools/RelatedTools.js
import React from "react";
import { FaArrowRight } from "react-icons/fa";
import Link from "next/link";
import { toolsData } from "@/data/toolsData"; // Adjust the path as needed

const RelatedTools = ({ currentCategory, currentToolSlug }) => {
  // Find the current category data
  const categoryData = toolsData.find(cat => cat.category === currentCategory);
  
  // Get all tools except the current one
  const relatedTools = categoryData 
    ? categoryData.tools.filter(tool => tool.slug !== currentToolSlug)
    : [];
  
  // Randomly select up to 4 tools
  const shuffled = [...relatedTools].sort(() => 0.5 - Math.random());
  const selectedTools = shuffled.slice(0, 4);

  if (selectedTools.length === 0) return null;

  return (
    <div className="mt-12 mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">More {currentCategory}</h2>
        <Link 
          href={`/tools/${currentCategory.toLowerCase().replace(/\s+/g, '-')}`} 
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
        >
          View all tools <FaArrowRight className="ml-1" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {selectedTools.map((tool, index) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </div>
  );
};

// ToolCard component for consistent tool display
const ToolCard = ({ tool }) => {
  // Map icons to actual SVG components
  const renderIcon = () => {
    // This is a placeholder - you should implement your actual icon mapping
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow group">
      <Link href={`/tools/${tool.slug}`} className="block">
        <div className="flex items-start">
          <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
            {renderIcon()}
          </div>
          <div className="ml-4">
            <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
              {tool.name}
            </h3>
            <p className="mt-1 text-sm text-gray-600">{tool.description}</p>
            <div className="mt-3 text-sm text-blue-600 font-medium group-hover:text-blue-800 transition-colors">
              Use Tool →
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default RelatedTools;