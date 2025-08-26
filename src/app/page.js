import ToolCard from "@/components/ui/ToolCard";
import { toolsData } from "@/data/tools-data";

export default function Home() {
  return (
    <>
      {/* Enhanced Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-indigo-50 py-20 text-center overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-8 left-1/3 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="container relative mx-auto px-3 min-h-2/3 lg:pt-20 pt-14">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 mx-auto max-w-4xl leading-tight">
            Your Free All‑in‑One Toolkit for{" "}
            <span className="text-blue-600">PDFs, SEO, Coding</span> & More
          </h1>
          <p className="max-w-3xl mx-auto text-lg lg:text-xl text-gray-700 mb-10">
            DevTools Hub brings you the smartest collection of free online
            utilities—all in one place. No downloads, no surprise fees: just
            lightning‑fast, browser‑based tools.
          </p>

          {/* <div className="flex flex-wrap justify-center gap-4 mb-16">
            <div className="bg-white rounded-full px-6 py-3 shadow-md flex items-center">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
              <span className="text-sm font-medium">100% Free Tools</span>
            </div>
            <div className="bg-white rounded-full px-6 py-3 shadow-md flex items-center">
              <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
              <span className="text-sm font-medium">
                No Registration Needed
              </span>
            </div>
            <div className="bg-white rounded-full px-6 py-3 shadow-md flex items-center">
              <div className="w-3 h-3 bg-purple-400 rounded-full mr-2"></div>
              <span className="text-sm font-medium">Secure & Private</span>
            </div>
          </div> */}
        </div>
      </section>

      {/* Tools by Category */}
      <main className="container mx-auto px-6 py-16 max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Explore Our Tools
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Browse our categorized collection of tools designed to boost your
            productivity
          </p>
        </div>

        <div className="space-y-16">
          {toolsData.map((category) => (
            <div key={category.category} className="mb-12">
              <div className="flex items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  {category.category}
                </h2>
                <div className="ml-4 h-px flex-1 bg-gradient-to-r from-gray-300 to-transparent"></div>
                <span className="ml-4 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {category.tools.length} tools
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {category.tools.map((tool) => (
                  <ToolCard
                    key={tool.slug}
                    name={tool.name}
                    slug={tool.slug}
                    description={tool.description}
                    icon={tool.icon}
                    category={category.category}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* CTA Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Need Something Else?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            We're constantly adding new tools to our collection. Let us know
            what you'd like to see next!
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-full transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl">
            Suggest a Tool
          </button>
        </div>
      </section>
    </>
  );
}
