export const metadata = {
  title: "About Tools360",
  description: "Learn about Tools360's browser-based PDF tools.",
};

export default function AboutPage() {
  return (
    <main className="min-h-[70vh] bg-[#f4f7f5] px-5 py-16 text-[#172c27] sm:px-8">
      <article className="mx-auto max-w-3xl border border-[#dce5e0] bg-white p-6 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#527268]">
          About Tools360
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Useful tools, kept simple.</h1>
        <p className="mt-5 leading-7 text-[#5d706a]">
          Tools360 is building a focused set of browser-based utilities for
          everyday PDF work. The available tools process files in your browser;
          your documents are not uploaded to our servers.
        </p>
        <p className="mt-4 leading-7 text-[#5d706a]">
          We add tools as their workflows are ready and tested. The catalog
          currently includes PDF merge, split, comparison, and compression
          utilities.
        </p>
      </article>
    </main>
  );
}