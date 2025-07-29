// components/Footer.tsx
import { toolsData } from "@/data/tools-data";
import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // Show up to 4 tools per category in the footer
  const maxToolsPerCategory = 6;

  return (
    <footer className="bg-gray-50 border-t mt-16 text-gray-600 text-sm">
      <div className="container mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {/* Brand Info */}
        <div>
          <h2 className="text-lg font-semibold text-blue-600 mb-2">Tools360</h2>
          <p>
            A collection of free and powerful web tools for developers, writers,
            SEO experts, and more.
          </p>
        </div>

        {/* Dynamic Category Sections */}
        {toolsData.slice(0).map((section) => (
          <div key={section.category}>
            <h3 className="font-semibold mb-3 text-gray-800">
              {section.category}
            </h3>
            <ul className="space-y-2">
              {section?.tools?.slice(0, maxToolsPerCategory)?.map((tool) => (
                <li key={tool.slug}>
                  <Link
                    href={`/tools/${tool.slug}`}
                    className="hover:text-blue-500 transition-colors duration-200"
                  >
                    {tool.name}
                  </Link>
                </li>
              ))}
              {/* {section.tools.length > maxToolsPerCategory && (
                <li>
                  <Link
                    href={`/tools?category=${encodeURIComponent(
                      section.category
                    )}`}
                    className="text-blue-600 hover:underline transition-colors duration-200"
                  >
                    See all {section.category}
                  </Link>
                </li>
              )} */}
            </ul>
          </div>
        ))}

        {/* Quick Links */}
        <div>
          <h3 className="font-semibold mb-3 text-gray-800">Quick Links</h3>
          <ul className="space-y-2">
            <li>
              <Link
                href="/"
                className="hover:text-blue-500 transition-colors duration-200"
              >
                All Tools
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="hover:text-blue-500 transition-colors duration-200"
              >
                About Us
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="hover:text-blue-500 transition-colors duration-200"
              >
                Contact
              </Link>
            </li>
            <li>
              <Link
                href="/privacy"
                className="hover:text-blue-500 transition-colors duration-200"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className="hover:text-blue-500 transition-colors duration-200"
              >
                Terms & Conditions
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Line */}
      <div className="border-t pt-6 pb-4 text-center text-gray-400 text-xs">
        © {currentYear} DevTools Hub. All rights reserved.
      </div>
    </footer>
  );
}
