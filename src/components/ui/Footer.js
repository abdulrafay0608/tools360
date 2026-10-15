// components/Footer.tsx
import Link from "next/link";
import { FaTools } from "react-icons/fa";
import { getCategoriesWithLiveTools } from "@/data/toolsDataUtils";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const categories = getCategoriesWithLiveTools();

  return (
    <footer className="border-t border-slate-200 bg-white text-sm text-slate-600">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-9 px-4 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-12">
        <div className="max-w-xs">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded text-base font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
          >
            <FaTools aria-hidden="true" className="text-blue-600" />
            Tools360
          </Link>
          <p className="mt-3 leading-6">
            Straightforward PDF, image, writing, and calculator tools. Selected
            files and text are processed in your browser.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-800">
            Categories
          </h3>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/tools/category/${category.id}`}
                  className="rounded transition-colors hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  {category.category}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-800">
            Information
          </h3>
          <ul className="space-y-2">
            <li>
              <Link
                href="/"
                className="rounded transition-colors hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                All tools
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="rounded transition-colors hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                About Tools360
              </Link>
            </li>
            <li>
              <Link
                href="/privacy"
                className="rounded transition-colors hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Privacy
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="rounded transition-colors hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <span>© {currentYear} Tools360</span>
          <span>PDFs stay on your device while you work.</span>
        </div>
      </div>
    </footer>
  );
}
