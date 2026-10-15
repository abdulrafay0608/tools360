"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FaArrowRight, FaSearch } from "react-icons/fa";
import AdSlot from "@/components/ads/AdSlot";
import ToolIcon from "@/components/icons/ToolIcon";
import ToolCard from "@/components/ui/ToolCard";
import { ADS_ENABLED } from "@/config/ads";

const quickAccessSlugs = ["merge-pdf", "split-pdf", "image-compressor", "image-converter"];

export default function HomeExplorer({ categories }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const allTools = useMemo(() => categories.flatMap((category) => category.tools), [categories]);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleTools = allTools.filter((tool) =>
    (activeCategory === "all" || tool.categoryId === activeCategory) &&
    (!normalizedQuery || `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(normalizedQuery))
  );
  const selectedCategory = categories.find((category) => category.id === activeCategory);
  const quickAccess = quickAccessSlugs.map((slug) => allTools.find((tool) => tool.slug === slug)).filter(Boolean);

  return (
    <main className="min-h-[75vh] bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.75fr)] lg:items-center lg:gap-16 lg:px-12 lg:py-20">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Free browser-based tools</p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">Tools for everyday tasks.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Find focused PDF, image, writing, and calculator tools. Work with files and text locally in your browser, without an account.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
              <span>{allTools.length} ready-to-use tools</span><span aria-hidden="true" className="text-slate-300">•</span><span>No account required</span>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm sm:p-6">
            <label htmlFor="tool-search" className="block text-sm font-semibold text-slate-900">What do you need to do?</label>
            <div className="relative mt-3">
              <FaSearch aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="tool-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)}
                placeholder="Search PDF, image and other tools" aria-controls="all-tools-grid"
                className="min-h-12 w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:border-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Your search stays in this browser. Selected files are processed locally; normal website assets still load from the host.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-12 lg:px-12">
        {!normalizedQuery && <section aria-labelledby="quick-access-heading">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Popular tools</p>
              <h2 id="quick-access-heading" className="mt-1 text-xl font-semibold text-slate-900 sm:text-2xl">Quick access</h2>
            </div>
            <a href="#all-tools-heading" className="text-sm font-semibold text-blue-700 hover:text-blue-800 focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
              Browse all tools <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickAccess.map((tool) => (
              <Link key={tool.slug} href={`/tools/${tool.slug}`}
                className="group flex min-h-16 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <ToolIcon icon={tool.icon} className="size-4" />
                </span>
                <span className="min-w-0 flex-1">{tool.name}</span>
                <FaArrowRight aria-hidden="true" className="size-3 text-slate-400 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </section>}

        <section aria-labelledby="all-tools-heading" className={`${normalizedQuery ? "" : "mt-12"} scroll-mt-24`}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Explore by task</p>
          <h2 id="all-tools-heading" className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">All tools</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Choose a category or search for a task. Every listed tool is ready to use.</p>
          <div role="group" aria-label="Filter tools by category" className="mt-6 flex flex-wrap gap-2">
            <button type="button" aria-pressed={activeCategory === "all"} onClick={() => setActiveCategory("all")}
              className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${activeCategory === "all" ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700"}`}>
              All <span className="ml-1 opacity-75">{allTools.length}</span>
            </button>
            {categories.map((category) => (
              <button key={category.id} type="button" aria-pressed={activeCategory === category.id} onClick={() => setActiveCategory(category.id)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${activeCategory === category.id ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700"}`}>
                <ToolIcon icon={category.icon} className="size-4" />{category.category}
              </button>
            ))}
          </div>
          {selectedCategory && (
            <div className="mt-5 flex flex-wrap items-start justify-between gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <p className="max-w-2xl leading-6">{selectedCategory.description}</p>
              <Link href={`/tools/category/${selectedCategory.id}`} className="font-semibold text-blue-700 hover:underline focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
                View category <span aria-hidden="true">→</span>
              </Link>
            </div>
          )}
          <p role="status" aria-live="polite" className="mt-6 text-sm text-slate-600">Showing {visibleTools.length} of {allTools.length} tools</p>
          {visibleTools.length ? (
            <div id="all-tools-grid" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleTools.map((tool) => (
                <ToolCard key={tool.slug} name={tool.name} slug={tool.slug} description={tool.description}
                  icon={tool.icon} categoryId={tool.categoryId} categoryLabel={tool.category} />
              ))}
            </div>
          ) : (
            <div id="all-tools-grid" className="mt-4 rounded-xl border border-slate-200 bg-white p-8 text-center">
              <p className="font-semibold text-slate-900">No tools match that search.</p>
              <p className="mt-2 text-sm text-slate-600">Try another term or view all tools.</p>
              <button type="button" onClick={() => { setQuery(""); setActiveCategory("all"); }}
                className="mt-4 min-h-11 rounded-lg border border-blue-600 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                Clear filters
              </button>
            </div>
          )}
        </section>
        {ADS_ENABLED && <aside aria-label="Advertisement" className="mt-12 border-t border-slate-200 pt-8"><AdSlot placement="home-after-tools" /></aside>}
      </div>
    </main>
  );
}
