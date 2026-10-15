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
      className="min-h-[70vh] bg-slate-50 px-4 py-8 text-slate-900 sm:px-8 sm:py-10 lg:px-12"
    >
      <div className="mx-auto max-w-7xl">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-600">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="rounded hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="font-medium text-slate-900">
              {category.category}
            </li>
          </ol>
        </nav>

        <header className="mb-7 border-b border-slate-200 pb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Browse tools</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {category.category}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            {category.description}
          </p>
        </header>

        <h2 className="mb-4 text-xl font-semibold text-slate-900">Available tools</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {category.tools.map((tool) => (
            <ToolCard
              key={tool.slug}
              name={tool.name}
              slug={tool.slug}
              description={tool.description}
              icon={tool.icon}
              categoryId={category.id}
              available={tool.available === true}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
