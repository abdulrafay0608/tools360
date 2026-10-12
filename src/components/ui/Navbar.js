"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaFilePdf } from "react-icons/fa";
import { getCategoriesWithLiveTools } from "@/data/toolsDataUtils";
import { SITE_NAME } from "@/config/site";
import { NAV_LINKS } from "@/content/site/navigation";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const categories = getCategoriesWithLiveTools();

  return (
    <header className="border-b border-[#dce5e0] bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-5 sm:px-8 lg:px-12">
        <Link
          href="/"
          aria-label={`${SITE_NAME} home`}
          className="inline-flex shrink-0 items-center gap-2.5 text-lg font-semibold text-[#173d34] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#235c4f]"
        >
          <span className="flex size-8 items-center justify-center bg-[#eaf3ed] text-[#235c4f]">
            <FaFilePdf aria-hidden="true" className="h-4 w-4" />
          </span>
          <span>{SITE_NAME}</span>
        </Link>

        <nav aria-label="Main navigation" className="ml-auto hidden h-full items-center gap-7 text-sm font-medium md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={`flex h-full items-center border-b-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#235c4f] ${
                pathname === href
                  ? "border-[#235c4f] text-[#173d34]"
                  : "border-transparent text-[#62746d] hover:text-[#173d34]"
              }`}
            >
              {label}
            </Link>
          ))}
          <details className="group relative flex h-full items-center">
            <summary className="flex h-full cursor-pointer list-none items-center border-b-2 border-transparent text-[#62746d] transition-colors hover:text-[#173d34] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#235c4f]">
              Categories
            </summary>
            <div className="absolute right-0 top-full z-30 min-w-56 border border-[#dce5e0] bg-white p-2 shadow-lg">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/tools/category/${category.id}`}
                  className="block px-3 py-2 text-sm text-[#405950] hover:bg-[#f4f7f5] hover:text-[#173d34]"
                >
                  {category.category}
                </Link>
              ))}
            </div>
          </details>
        </nav>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="ml-auto flex size-10 items-center justify-center text-[#235c4f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#235c4f] md:hidden"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
        >
          {isOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {isOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="border-t border-[#e6ece9] bg-white px-5 py-2 sm:px-8 md:hidden"
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className="block border-b border-[#edf1ef] py-3 text-sm font-medium text-[#405950] last:border-0"
              onClick={() => setIsOpen(false)}
            >
              {label}
            </Link>
          ))}
          <details className="border-b border-[#edf1ef] py-2">
            <summary className="cursor-pointer py-2 text-sm font-medium text-[#405950]">
              Categories
            </summary>
            <div className="pl-3">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/tools/category/${category.id}`}
                  className="block py-2 text-sm text-[#62746d]"
                  onClick={() => setIsOpen(false)}
                >
                  {category.category}
                </Link>
              ))}
            </div>
          </details>
        </nav>
      )}
    </header>
  );
}
