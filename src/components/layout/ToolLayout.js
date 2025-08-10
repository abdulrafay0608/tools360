// components/layout/ToolLayout.js
import React from "react";
import { FaLightbulb, FaArrowRight, FaShieldAlt } from "react-icons/fa";

const ToolLayout = ({ title, description, children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Tool Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center bg-blue-50 text-blue-600 rounded-full p-2 mb-2">
              <FaLightbulb className="h-6 w-6" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
              {title}
            </h1>
            {description && (
              <p className="mt-3 max-w-2xl mx-auto text-base text-gray-600">
                {description}
              </p>
            )}

            {/* Features Banner */}
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <div className="flex items-center bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs">
                <FaShieldAlt className="mr-1" /> Secure Processing
              </div>
              <div className="flex items-center bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                No File Storage
              </div>
              <div className="flex items-center bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                100% Free
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tool Content Area */}
      <div className="max-w-5xl mx-auto px-2 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded border border-slate-200">
          <div className="bg-slate-200 m-3 sm:m-6 p-2 sm:p-2.5">
            <div className="bg-white m-2 sm:m-3">{children}</div>
          </div>
        </div>

        {/* Related Tools Section */}
        {/* <div className="mt-12 mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">More PDF Tools</h2>
            <a
              href="#"
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
            >
              View all tools <FaArrowRight className="ml-1" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Split PDF",
                description: "Separate one PDF into multiple files",
              },
              {
                title: "Compress PDF",
                description: "Reduce file size while optimizing quality",
              },
              {
                title: "PDF to Word",
                description: "Convert PDFs to editable Word documents",
              },
              {
                title: "PDF to JPG",
                description: "Convert each PDF page to a JPG image",
              },
            ].map((tool, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
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
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-800">
                      {tool.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {tool.description}
                    </p>
                    <button className="mt-3 text-sm text-blue-600 font-medium hover:text-blue-800">
                      Use Tool
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default ToolLayout;
