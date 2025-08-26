import { toolsData } from "@/data/tools-data";
import Link from "next/link";
import { FaHeart } from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const maxToolsPerCategory = 6;

  return (
    <footer className="bg-gradient-to-b from-gray-50 to-white text-gray-700 border-t border-gray-100 mt-20">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-xl mr-3 shadow-md">
                T
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Tools360
              </span>
            </div>
            <p className="mb-6 max-w-md text-gray-600">
              A comprehensive collection of free and powerful web tools for
              developers, writers, SEO experts, and creative professionals. No
              registration required.
            </p>
          </div>

          {/* Tools Categories */}
          {toolsData.slice(0, 2).map((section) => (
            <div key={section.category}>
              <h3 className="font-semibold text-gray-900 mb-4 text-lg relative pb-2 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-10 after:h-0.5 after:bg-gradient-to-r after:from-blue-400 after:to-indigo-400">
                {section.category}
              </h3>
              <ul className="space-y-3">
                {section.tools.slice(0, maxToolsPerCategory).map((tool) => (
                  <li key={tool.slug}>
                    <Link
                      href={`/tools/${tool.slug}`}
                      className="hover:text-blue-600 transition-colors duration-200 flex items-center group"
                    >
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full mr-3 group-hover:bg-blue-500 transition-colors duration-200"></span>
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 text-lg relative pb-2 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-10 after:h-0.5 after:bg-gradient-to-r after:from-blue-400 after:to-indigo-400">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="hover:text-blue-600 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full mr-3 group-hover:bg-blue-500 transition-colors duration-200"></span>
                  All Tools
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="hover:text-blue-600 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full mr-3 group-hover:bg-blue-500 transition-colors duration-200"></span>
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-blue-600 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full mr-3 group-hover:bg-blue-500 transition-colors duration-200"></span>
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-blue-600 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full mr-3 group-hover:bg-blue-500 transition-colors duration-200"></span>
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-blue-600 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full mr-3 group-hover:bg-blue-500 transition-colors duration-200"></span>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-blue-600 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full mr-3 group-hover:bg-blue-500 transition-colors duration-200"></span>
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-8 pb-6 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <span className="text-gray-500 mr-2">
              © {currentYear} Tools360. Made with
            </span>
            <FaHeart className="text-red-500 mx-1" />
            <span className="text-gray-500 ml-1">for the community</span>
          </div>

          <div className="flex items-center space-x-6 text-gray-500 text-sm">
            <Link
              href="/privacy"
              className="hover:text-blue-600 transition-colors duration-200"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-blue-600 transition-colors duration-200"
            >
              Terms
            </Link>
            <Link
              href="/contact"
              className="hover:text-blue-600 transition-colors duration-200"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
