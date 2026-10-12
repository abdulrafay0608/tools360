// components/Footer.tsx
import Link from "next/link";
import { FaFilePdf } from "react-icons/fa";
import { getCategoriesWithLiveTools } from "@/data/toolsDataUtils";
import { SITE_NAME } from "@/config/site";
import { FOOTER_INFO_LINKS, FOOTER_COPY } from "@/content/site/footer";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const categories = getCategoriesWithLiveTools();

  return (
    <footer className="border-t border-[#dce5e0] bg-white text-sm text-[#5d706a]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-9 px-5 py-9 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-12">
        <div className="max-w-xs">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-base font-semibold text-[#173d34] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#235c4f]"
          >
            <FaFilePdf aria-hidden="true" className="text-[#527268]" />
            {SITE_NAME}
          </Link>
          <p className="mt-3 leading-6">
            {FOOTER_COPY.tagline}
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#405950]">
            {FOOTER_COPY.categoriesHeading}
          </h3>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/tools/category/${category.id}`}
                  className="transition-colors hover:text-[#173d34] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#235c4f]"
                >
                  {category.category}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#405950]">
            {FOOTER_COPY.informationHeading}
          </h3>
          <ul className="space-y-2">
            {FOOTER_INFO_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-[#173d34] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#235c4f]"
                >
                  {link.isBrandLink ? `${link.label} ${SITE_NAME}` : link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-[#e8eeea]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-4 text-xs text-[#71827c] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <span>© {currentYear} {SITE_NAME}</span>
          <span>{FOOTER_COPY.copyrightNote}</span>
        </div>
      </div>
    </footer>
  );
}
