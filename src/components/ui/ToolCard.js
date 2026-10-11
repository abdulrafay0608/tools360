import Link from "next/link";
import ToolIcon from "@/components/icons/ToolIcon";

export default function ToolCard({
  name,
  slug,
  description,
  icon,
  available = true,
  categoryLabel,
}) {
  const content = (
    <>
      <div className="flex items-start justify-between">
        <span className="flex size-11 items-center justify-center bg-[#eaf3ed] text-[#235c4f]">
          <ToolIcon icon={icon} className="h-5 w-5" />
        </span>
        {available ? (
          <span className="text-sm text-[#71827c] transition-transform group-hover:translate-x-1" aria-hidden="true">
            →
          </span>
        ) : (
          <span className="border border-[#dce5e0] px-2 py-1 text-xs font-medium text-[#71827c]">
            Coming soon
          </span>
        )}
      </div>
      {categoryLabel && <span className="mt-4 text-xs font-medium text-[#527268]">{categoryLabel}</span>}
      <h3 className="mt-6 text-lg font-semibold text-[#172c27]">
        {name}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[#5d706a]">
        {description}
      </p>
    </>
  );

  const className = `group flex min-h-48 flex-col border border-[#dce5e0] bg-white p-5 transition-colors ${
    available ? "hover:border-[#527268]" : "opacity-80"
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
      className={`${className} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#235c4f]`}
    >
      {content}
    </Link>
  );
}
