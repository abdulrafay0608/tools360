import { toolsData } from "./utils/constant";
import CategorySection from "./components/CategorySection";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="bg-blue-50 py-16 text-center ">
        <div className="container mx-auto px-6 ">
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-600 mb-8 mx-auto max-w-[900px]">
            Your Free All‑in‑One Toolkit for PDFs, SEO, Coding & More
          </h1>
          <p className="max-w-5xl mx-auto text-lg text-gray-700">
            DevTools Hub brings you the smartest collection of free online
            utilities—PDF converters, SEO generators, code formatters, and
            everyday productivity tools—all in one place. No downloads, no
            surprise fees: just lightning‑fast, browser‑based tools designed to
            boost your workflow and save you time.
          </p>
        </div>
      </section>

      {/* Tools by Category */}
      <main className="container mx-auto px-6 py-12 max-w-[1250px]">
        {toolsData.map((categoryData) => (
          <CategorySection
            key={categoryData.category}
            category={categoryData.category}
            tools={categoryData.tools}
          />
        ))}
      </main>

      <Footer />
    </>
  );
}
