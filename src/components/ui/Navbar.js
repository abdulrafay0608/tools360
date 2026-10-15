"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaBars, FaChevronDown, FaTools, FaTimes } from "react-icons/fa";
import ToolIcon from "@/components/icons/ToolIcon";
import { getCategoriesWithLiveTools } from "@/data/toolsDataUtils";

const links = [
  { href: "/", label: "All tools" },
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const desktopCategoriesRef = useRef(null);
  const pathname = usePathname();
  const categories = getCategoriesWithLiveTools();

  const closeMenu = () => setIsOpen(false);
  const handleKeyDown = (event) => {
    if (event.key === "Escape" && isOpen) {
      closeMenu();
      menuButtonRef.current?.focus();
    }
  };

  return (
    <header onKeyDown={handleKeyDown} className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-[0_1px_3px_rgba(15,23,42,0.03)] backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-4 px-4 sm:px-8 lg:px-12">
        <Link href="/" aria-label="Tools360 home"
          className="inline-flex shrink-0 items-center gap-2.5 rounded-md text-lg font-semibold tracking-tight text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600">
          <span className="flex size-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <FaTools aria-hidden="true" className="size-4" />
          </span>
          <span>Tools360</span>
        </Link>

        <nav aria-label="Main navigation" className="ml-auto hidden h-full items-center gap-1 text-sm font-medium md:flex">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-lg px-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 ${pathname === href ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
              {label}
            </Link>
          ))}
          <details ref={desktopCategoriesRef} className="group relative"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.currentTarget.open = false;
                event.currentTarget.querySelector("summary")?.focus();
              }
            }}>
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg px-3 text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
              Categories <FaChevronDown aria-hidden="true" className="size-2.5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              {categories.map((category) => (
                <Link key={category.id} href={`/tools/category/${category.id}`}
                  onClick={() => { if (desktopCategoriesRef.current) desktopCategoriesRef.current.open = false; }}
                  className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
                  <ToolIcon icon={category.icon} className="size-4" />
                  {category.category}
                </Link>
              ))}
            </div>
          </details>
        </nav>

        <button ref={menuButtonRef} type="button" onClick={() => setIsOpen((open) => !open)}
          className="ml-auto flex size-11 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 md:hidden"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isOpen} aria-controls="mobile-navigation">
          {isOpen ? <FaTimes aria-hidden="true" className="size-4" /> : <FaBars aria-hidden="true" className="size-4" />}
        </button>
      </div>

      {isOpen && (
        <nav id="mobile-navigation" aria-label="Mobile navigation"
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-slate-200 bg-white px-4 py-3 shadow-lg sm:px-8 md:hidden">
          <div className="mx-auto max-w-7xl">
            {links.map(({ href, label }) => (
              <Link key={href} href={href} onClick={closeMenu} aria-current={pathname === href ? "page" : undefined}
                className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
                {label}
              </Link>
            ))}
            <p className="mt-3 border-t border-slate-200 px-3 pt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Categories</p>
            {categories.map((category) => (
              <Link key={category.id} href={`/tools/category/${category.id}`} onClick={closeMenu}
                className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
                <ToolIcon icon={category.icon} className="size-4" />{category.category}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
