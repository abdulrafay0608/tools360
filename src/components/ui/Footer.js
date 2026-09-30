// components/Footer.tsx
import { toolsData } from "@/data/tools-data";
import Link from "next/link";
import { FaFilePdf } from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const availableCategories = toolsData
    .map((category) => ({
      ...category,
      tools: category.tools.filter((tool) => tool.available),
    }))
    .filter((category) => category.tools.length > 0);

  return (
    <footer className="border-t border-[#dce5e0] bg-white text-sm text-[#5d706a]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-9 px-5 py-9 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-12">
        <div className="max-w-xs">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-base font-semibold text-[#173d34] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#235c4f]"
          >
            <FaFilePdf aria-hidden="true" className="text-[#527268]" />
            Tools360
          </Link>
          <p className="mt-3 leading-6">
            Straightforward tools for common PDF tasks. Files are processed in
            your browser.
          </p>
        </div>

        {availableCategories.map((section) => (
          <div key={section.category}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#405950]">
              PDF tools
            </h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-1">
              {section.tools.map((tool) => (
                <li key={tool.slug}>
                  <Link
                    href={`/tools/${tool.slug}`}
                    className="transition-colors hover:text-[#173d34] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#235c4f]"
                  >
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#405950]">
            Information
          </h3>
          <ul className="space-y-2">
            <li>
              <Link
                href="/"
                className="transition-colors hover:text-[#173d34] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#235c4f]"
              >
                All PDF tools
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="transition-colors hover:text-[#173d34] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#235c4f]"
              >
                About Tools360
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#e8eeea]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-4 text-xs text-[#71827c] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <span>© {currentYear} Tools360</span>
          <span>PDFs stay on your device while you work.</span>
        </div>
      </div>
    </footer>
  );
}
