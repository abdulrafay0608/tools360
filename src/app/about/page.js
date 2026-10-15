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
    <main className="min-h-[70vh] bg-slate-50 px-4 py-10 text-slate-900 sm:px-8 sm:py-14">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-700">
          About Tools360
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Useful tools, kept simple.</h1>
        <p className="mt-5 leading-7 text-slate-600">
          Tools360 offers free browser-based PDF and image tools, a word
          counter, and calculators. Selected files and text are processed
          locally in your browser rather than sent to a processing server.
        </p>
        <p className="mt-4 leading-7 text-slate-600">
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
