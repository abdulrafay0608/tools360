"use client";

import dynamic from "next/dynamic";
import ToolLoader from "./ToolLoader";
import NotFoundTool from "./NotFoundTool";
import { useEffect, useState } from "react";

// Predefined tool mappings for better performance and tree shaking
const toolComponents = {
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
  "pdf-to-word": dynamic(() => import("@/tools/pdf/pdf-to-word/page"), {
    ssr: false,
    loading: () => <ToolLoader />,
  }),
};

// Error boundary component for better error handling
const ToolErrorBoundary = ({ children, slug }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset error state when slug changes
    setHasError(false);
  }, [slug]);

  if (hasError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
        <h3 className="text-lg font-medium text-red-800 mb-2">
          Something went wrong
        </h3>
        <p className="text-red-600">
          Failed to load the {slug} tool. Please try again.
        </p>
        <button
          onClick={() => setHasError(false)}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  try {
    return children;
  } catch (error) {
    console.error(`Error loading tool ${slug}:`, error);
    setHasError(true);
    return null;
  }
};

export default function ToolRenderer({ slug }) {
  const [isValidTool, setIsValidTool] = useState(false);

  // Validate the slug on component mount and when slug changes
  useEffect(() => {
    setIsValidTool(Boolean(slug) && slug in toolComponents);
  }, [slug]);

  if (!isValidTool) {
    return <NotFoundTool />;
  }

  const ToolComponent = toolComponents[slug];

  return (
    <ToolErrorBoundary slug={slug}>
      <ToolComponent />
    </ToolErrorBoundary>
  );
}
