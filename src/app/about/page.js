import { getAbsoluteUrl } from "@/config/site";

const pageUrl = getAbsoluteUrl("/about");

export const metadata = {
  title: "About Tools360",
  description: "Learn how Tools360's free PDF, image, writing, and calculator tools work locally in your browser.",
  alternates: { canonical: pageUrl },
  openGraph: {
    title: "About Tools360",
    description: "Learn how Tools360's free PDF, image, writing, and calculator tools work locally in your browser.",
    url: pageUrl,
  },
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
          Tools360 offers free browser-based PDF and image tools, a word
          counter, and calculators. Selected files and text are processed
          locally in your browser rather than sent to a processing server.
        </p>
        <p className="mt-4 leading-7 text-[#5d706a]">
          The live catalog includes PDF merge, split, comparison, page organization,
          conversion, and visible-signature tools. Image tools resize, convert,
          compress, or rasterize supported formats. Each tool page describes
          its inputs and limits so you can check whether it fits your task.
          Advertising is currently disabled; ordinary website asset requests
          still occur when you visit a page.
        </p>
      </article>
    </main>
  );
}
