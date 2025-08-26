"use client";
import Link from "next/link";
import { useState, useMemo, useCallback } from "react";

// Icon mapping component for better maintainability
const ToolIcon = ({ iconType }) => {
  const iconMap = useMemo(
    () => ({
      pdf: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
      code: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      ),
      image: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      text: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
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
      ),
      seo: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
      data: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      default: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
    }),
    []
  );

  return iconMap[iconType] || iconMap.default;
};

// Category badge component for better reusability
const CategoryBadge = ({ category }) => {
  const categoryColors = useMemo(
    () => ({
      PDF: "from-red-500 to-pink-500",
      SEO: "from-green-500 to-emerald-500",
      Coding: "from-blue-500 to-indigo-500",
      Images: "from-purple-500 to-fuchsia-500",
      Text: "from-amber-500 to-orange-500",
      Data: "from-cyan-500 to-teal-500",
      default: "from-gray-500 to-gray-700",
    }),
    []
  );

  const colorClass = categoryColors[category] || categoryColors.default;

  return (
    <div className="absolute top-2 right-2">
      <span
        className={`bg-gradient-to-r ${colorClass} text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md`}
      >
        {category}
      </span>
    </div>
  );
};

// Main ToolCard component
export default function ToolCard({ name, slug, description, icon, category }) {
  const [isHovered, setIsHovered] = useState(false);

  // Memoize handlers to prevent unnecessary re-renders
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  // Memoize the icon type to avoid recalculating
  const iconType = useMemo(() => icon || "default", [icon]);

  return (
    <Link
      href={`/tools/${slug}`}
      className="block h-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-2xl"
      aria-label={`Open ${name} tool`}
    >
      <div
        className="group bg-white rounded-xl border border-gray-100 shadow hover:shadow-xl transition-all duration-300 ease-out p-0.5 transform hover:-translate-y-1 relative overflow-hidden h-full flex flex-col"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Animated gradient border on hover */}
        <div
          className={`absolute -inset-0.5 bg-gradient-to-r rounded-xl blur-sm transition-opacity duration-300 ${
            isHovered
              ? "opacity-100 blur-md from-blue-200 to-indigo-200"
              : "opacity-0"
          }`}
        ></div>

        {/* Content container */}
        <div className="relative z-10 flex flex-col h-full bg-white rounded-xl p-4">
          {/* Category badge */}
          {category && <CategoryBadge category={category} />}

          {/* Icon */}
          <div className="flex mb-5">
            <div className="relative">
              <div className="flex items-center justify-center h-20 w-20 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 rounded-3xl transition-all duration-300 group-hover:from-blue-100 group-hover:to-indigo-100 group-hover:scale-110 shadow-inner">
                <ToolIcon iconType={iconType} />
              </div>
              {/* <div
                className={`absolute -inset-3 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-3xl -z-10 blur transition-opacity duration-300 ${
                  isHovered ? "opacity-50" : "opacity-0"
                }`}
              ></div> */}
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col flex-grow">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 mb-3">
              {name}
            </h3>
            <p className="text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors duration-300 flex-grow line-clamp-3">
              {description}
            </p>

            {/* CTA with animated arrow */}
            <div className="mt-6 pt-4 border-t border-gray-100 group-hover:border-blue-100 transition-colors duration-300">
              <div className="flex items-center text-blue-600 font-semibold group-hover:text-indigo-600 transition-colors duration-300">
                <span className="mr-2">Use Tool</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 transform group-hover:translate-x-2 transition-transform duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle background pattern that appears on hover */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            isHovered ? "opacity-5" : "opacity-0"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl"></div>
        </div>
      </div>
    </Link>
  );
}
