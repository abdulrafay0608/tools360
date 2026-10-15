import Link from "next/link";
import { FaFilePdf, FaLaptop } from "react-icons/fa";
import AdSlot from "@/components/ads/AdSlot";
import ToolAdFrame from "@/components/ads/ToolAdFrame";
import ToolIcon from "@/components/icons/ToolIcon";
import RelatedTools from "@/components/layout/RelatedTools";
import { ADS_ENABLED } from "@/config/ads";

const ToolLayout = ({
  title,
  description,
  children,
  seoContent,
  category,
  currentToolSlug,
  trustText = "Files are not uploaded",
}) => (
  <main className="min-h-[70vh] bg-slate-50 text-slate-900">
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-10 lg:px-12">
        {category && (
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-600">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href="/" className="rounded hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">Home</Link></li>
              <li aria-hidden="true" className="text-slate-400">/</li>
              <li>
                <Link href={`/tools/category/${category.id}`} className="inline-flex items-center gap-1.5 rounded hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
                  <ToolIcon icon={category.icon} className="size-3.5" />{category.category}
                </Link>
              </li>
              <li aria-hidden="true" className="text-slate-400">/</li>
              <li aria-current="page" className="font-medium text-slate-900">{title}</li>
            </ol>
          </nav>
        )}
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-blue-700">
          {category ? <ToolIcon icon={category.icon} className="size-3.5" /> : <FaFilePdf aria-hidden="true" />}
          {category?.category || "Tools workspace"}
        </div>
        <h1 className="max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{description}</p>}
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-slate-600 sm:text-sm">
          <span className="inline-flex items-center gap-2"><FaLaptop aria-hidden="true" className="text-blue-600" />Processed in your browser</span>
          <span className="inline-flex items-center gap-2">
            <svg aria-hidden="true" className="size-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {trustText}
          </span>
          <span className="inline-flex items-center gap-2">
            <svg aria-hidden="true" className="size-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            No account required
          </span>
        </div>
      </div>
    </div>

    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8 lg:px-12">
      <ToolAdFrame>
        <section aria-label={`${title} workspace`} className="tool-workspace min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {children}
        </section>
        {seoContent && <div className="mt-8">{seoContent}</div>}
        <RelatedTools category={category} currentToolSlug={currentToolSlug} />
        {ADS_ENABLED && (
          <aside aria-label="Advertisement" className="mt-10 border-t border-slate-200 pt-8">
            <AdSlot placement="tool-after-content" />
          </aside>
        )}
      </ToolAdFrame>
    </div>
  </main>
);

export default ToolLayout;
