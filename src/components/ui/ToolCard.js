import Link from "next/link";
import ToolIcon from "@/components/icons/ToolIcon";

export default function ToolCard({
  name,
  slug,
  description,
  icon,
  available = true,
  categoryLabel,
  categoryId,
}) {
  const accents = {
    "pdf-tools": "bg-rose-50 text-rose-700",
    "image-tools": "bg-violet-50 text-violet-700",
    "finance-calculators": "bg-emerald-50 text-emerald-700",
    "writer-blogging-tools": "bg-amber-50 text-amber-700",
  };
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span aria-hidden="true" className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${accents[categoryId] || "bg-blue-50 text-blue-700"}`}>
          <ToolIcon icon={icon} className="h-5 w-5" />
        </span>
        {available ? (
          <span className="text-lg text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-700" aria-hidden="true">
            →
          </span>
        ) : (
          <span className="rounded-full border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500">
            Coming soon
          </span>
        )}
      </div>
      {categoryLabel && <span className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">{categoryLabel}</span>}
      <h3 className={`${categoryLabel ? "mt-2" : "mt-5"} text-lg font-semibold text-slate-900`}>
        {name}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {description}
      </p>
    </>
  );

  const className = `group flex min-h-48 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-[border-color,box-shadow] ${
    available ? "hover:border-blue-300 hover:shadow-md" : "opacity-80"
  }`;

  if (!available) {
    return (
      <article
        data-tool-card={slug}
        data-available="false"
        aria-label={`${name}, coming soon`}
        className={className}
      >
        {content}
      </article>
    );
  }

  return (
    <Link
      href={`/tools/${slug}`}
      data-tool-card={slug}
      data-available="true"
      className={`${className} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600`}
    >
      {content}
    </Link>
  );
}
