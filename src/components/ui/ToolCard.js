import Link from "next/link";
import ToolIcon from "@/components/icons/ToolIcon";

export default function ToolCard({ name, slug, description, icon }) {
  return (
    <Link
      href={`/tools/${slug}`}
      className="group flex min-h-48 flex-col border border-[#dce5e0] bg-white p-5 transition-colors hover:border-[#527268] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#235c4f]"
    >
      <div className="flex items-start justify-between">
        <span className="flex size-11 items-center justify-center bg-[#eaf3ed] text-[#235c4f]">
          <ToolIcon icon={icon} className="h-5 w-5" />
        </span>
        <span className="text-sm text-[#71827c] transition-transform group-hover:translate-x-1" aria-hidden="true">
          →
        </span>
      </div>
      <h3 className="mt-6 text-lg font-semibold text-[#172c27]">
        {name}
      </h3>

      <p className="mt-2 text-sm leading-6 text-[#5d706a]">
        {description}
      </p>
    </Link>
  );
}
