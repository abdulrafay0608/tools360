import Link from "next/link";
import ToolCard from "@/components/ui/ToolCard";
import { getCategoriesWithLiveTools } from "@/data/toolsDataUtils";
import { HOME_CONTENT } from "@/content/site/home";

export default function Home() {
  const categories = getCategoriesWithLiveTools();

  return (
    <main className="min-h-[75vh] bg-[#f4f7f5] text-[#172c27]">
      <section className="border-b border-[#dce5e0] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
          <div className="max-w-4xl">
            <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-[#173d34] sm:text-4xl">
              {HOME_CONTENT.hero.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5d706a] sm:text-base">
              {HOME_CONTENT.hero.subtitle}
            </p>
          </div>
        </div>
      </section>

      <nav
        aria-label={HOME_CONTENT.categoriesNavAriaLabel}
        className="sticky top-0 z-20 border-b border-[#dce5e0] bg-white/95 backdrop-blur"
      >
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-3 sm:px-8 lg:px-12">
          {categories.map((category) => (
            <a
              key={category.id}
              href={`#${category.id}`}
              className="shrink-0 border border-[#dce5e0] px-3 py-2 text-xs font-medium text-[#405950] hover:border-[#527268] hover:text-[#173d34] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#235c4f]"
            >
              {category.category}
            </a>
          ))}
        </div>
      </nav>

      {categories.map((category) => (
        <section
          key={category.id}
          id={category.id}
          data-category-section={category.id}
          className="mx-auto max-w-7xl scroll-mt-16 px-5 py-7 sm:px-8 md:py-9 lg:px-12"
        >
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3 border-b border-[#d7e0dc] pb-5">
            <div>
              <p className="text-sm font-medium text-[#527268]">{HOME_CONTENT.browseCategoryLabel}</p>
              <h2 className="mt-1 text-2xl font-semibold">{category.category}</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[#5d706a]">
              {category.description}
            </p>
          </div>
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
          {category.tools.some((tool) => tool.available === true) && (
            <Link
              href={`/tools/category/${category.id}`}
              className="mt-5 inline-flex text-sm font-medium text-[#235c4f] hover:underline"
            >
              {HOME_CONTENT.viewAllCategoryTemplate(category.category)}
            </Link>
          )}
        </section>
      ))}
    </main>
  );
}
