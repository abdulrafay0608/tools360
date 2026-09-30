// components/layout/ToolLayout.js
import React from "react";
import { FaFilePdf, FaLaptop } from "react-icons/fa";

const ToolLayout = ({ title, description, children }) => {
  return (
    <main className="min-h-[70vh] bg-[#f4f7f5] text-[#172c27]">
      {/* Tool Header */}
      <div className="border-b border-[#dce5e0] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12">
          <div className="max-w-4xl">
            <div className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#527268]">
              <FaFilePdf aria-hidden="true" /> PDF workspace
            </div>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              {title}
            </h1>
            {description && (
              <p className="mt-3 max-w-2xl text-base leading-7 text-[#5d706a]">
                {description}
              </p>
            )}

            {/* Features Banner */}
            <div className="mt-5 flex flex-wrap justify-start gap-x-5 gap-y-2">
              <div className="flex items-center gap-2 text-sm text-[#527268]">
                <FaLaptop className="mr-1" aria-hidden="true" /> Processed in your browser
              </div>
              <div className="flex items-center gap-2 text-sm text-[#527268]">
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
                Files are not uploaded
              </div>
              <div className="flex items-center gap-2 text-sm text-[#527268]">
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
                No account required
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tool Content Area */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:px-12">
        <div className="border border-[#dce5e0] bg-white">{children}</div>

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
    </main>
  );
};

export default ToolLayout;
