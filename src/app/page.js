import ToolCard from "@/components/ui/ToolCard";
import { toolsData } from "@/data/tools-data";

export default function Home() {
  const availableCategories = toolsData
    .map((category) => ({
      ...category,
      tools: category.tools.filter((tool) => tool.available),
    }))
    .filter((category) => category.tools.length > 0);

  return (
    <main className="min-h-[75vh] bg-[#f4f7f5] text-[#172c27]">
      <section className="border-b border-[#dce5e0] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
          <div className="max-w-4xl">
            <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-[#173d34] sm:text-4xl">
              PDF tools for everyday tasks.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5d706a] sm:text-base">
              Merge files, split pages, compare revisions, or reduce file size.
              Your PDFs are processed in this browser, not uploaded.
            </p>
          </div>
        </div>
      </section>

      <section
        id="pdf-tools"
        className="mx-auto max-w-7xl px-5 py-7 sm:px-8 md:py-9 lg:px-12"
      >
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3 border-b border-[#d7e0dc] pb-5">
          <div>
            <p className="text-sm font-medium text-[#527268]">Choose a task</p>
            <h2 className="mt-1 text-2xl font-semibold">PDF tools</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[#5d706a]">
            Choose a task to get started.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {availableCategories.map((category) =>
            category.tools.map((tool) => (
                  <ToolCard
                    key={tool.slug}
                    name={tool.name}
                    slug={tool.slug}
                    description={tool.description}
                    icon={tool.icon}
                  />
            ))
          )}
        </div>
      </section>
    </main>
  );
}
