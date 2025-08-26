// components/layout/NotFoundTool.js
import React from "react";
import {
  FaExclamationTriangle,
  FaHome,
  FaSearch,
  FaTools,
} from "react-icons/fa";
import Link from "next/link";

export default function NotFoundTool() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-4">
          <div className="relative inline-flex">
            <div className="absolute inset-0 bg-amber-100 rounded-full animate-ping opacity-75"></div>
            <FaExclamationTriangle className="relative text-5xl text-amber-500" />
          </div>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Tool Not Found
        </h2>
        <p className="text-gray-600 mb-8">
          Sorry, we couldn&apos;t find the PDF tool you&apos;re looking for. It might have
          been moved or doesn&apos;t exist.
        </p>

        {/* Action Buttons */}
        {/* <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaHome className="text-sm" />
            Go Home
          </Link>

          <Link
            href="/tools"
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FaTools className="text-sm" />
            Browse Tools
          </Link>
        </div> */}

        {/* Search Suggestion */}
        {/* <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center text-sm text-gray-600 mb-2">
            <FaSearch className="mr-2" />
            Can't find what you're looking for?
          </div>
          <p className="text-xs text-gray-500">
            Try searching for tools or{" "}
            <a href="/contact" className="text-blue-600 hover:underline">
              contact support
            </a>
          </p>
        </div> */}
      </div>
    </div>
  );
}
