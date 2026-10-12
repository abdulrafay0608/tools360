import React from "react";

/**
 * ArticlePageLayout
 * Reusable presentational shell for informational pages (About, Contact, Privacy).
 * Guarantees identical wrapper markup, styles, and typographic structure.
 */
export default function ArticlePageLayout({ eyebrow, title, children }) {
  return (
    <main className="min-h-[70vh] bg-[#f4f7f5] px-5 py-16 text-[#172c27] sm:px-8">
      <article className="mx-auto max-w-3xl border border-[#dce5e0] bg-white p-6 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#527268]">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-semibold">{title}</h1>
        {children}
      </article>
    </main>
  );
}
