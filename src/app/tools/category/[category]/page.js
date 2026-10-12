import Link from "next/link";
import { notFound } from "next/navigation";
import ToolCard from "@/components/ui/ToolCard";
import {
  getAvailableCategories,
  getCategoryBySlug,
} from "@/data/toolsDataUtils";
import { getAbsoluteUrl } from "@/config/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAvailableCategories().map((category) => ({ category: category.id }));
}

export async function generateMetadata({ params }) {
  const { category: categorySlug } = await params;
  const category = getCategoryBySlug(categorySlug);
  if (!category || !category.tools.some((tool) => tool.available === true)) {
    return { title: "Category Not Found | Tools360" };
  }

  const title = `${category.category} | Tools360`;
  const url = getAbsoluteUrl(`/tools/category/${category.id}`);
  return {
    title,
    description: category.description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: category.description,
      url,
      siteName: "Tools360",
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }) {
  const { category: categorySlug } = await params;
  const category = getCategoryBySlug(categorySlug);
  if (!category || !category.tools.some((tool) => tool.available === true)) notFound();

  return (
    <main
      data-category-page={category.id}
      className="min-h-[70vh] bg-[#f4f7f5] px-5 py-8 text-[#172c27] sm:px-8 sm:py-10 lg:px-12"
    >
      <div className="mx-auto max-w-7xl">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-[#62746d]">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:text-[#173d34]">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="font-medium text-[#173d34]">
              {category.category}
            </li>
          </ol>
        </nav>

        <header className="mb-7 border-b border-[#d7e0dc] pb-5">
          <h1 className="text-3xl font-semibold text-[#173d34] sm:text-4xl">
            {category.category}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5d706a] sm:text-base">
            {category.description}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {category.tools.map((tool) => (
            <ToolCard
              key={tool.slug}
              name={tool.name}
              slug={tool.slug}
              description={tool.description}
              icon={tool.icon}
              available={tool.available === true}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
