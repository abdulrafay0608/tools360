import { getAbsoluteUrl } from "@/config/site";

const pageUrl = getAbsoluteUrl("/contact");

export const metadata = {
  title: "Contact | Tools360",
  description: "Contact Tools360 with product feedback, a tool issue, or a privacy question; please do not email confidential files.",
  alternates: { canonical: pageUrl },
  openGraph: {
    title: "Contact | Tools360",
    description: "Contact Tools360 with product feedback, a tool issue, or a privacy question; please do not email confidential files.",
    url: pageUrl,
  },
};

export default function ContactPage() {
  return (
    <main className="min-h-[70vh] bg-slate-50 px-4 py-10 text-slate-900 sm:px-8 sm:py-14">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-700">
          Contact
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Get in touch</h1>
        <p className="mt-5 leading-7 text-slate-600">
          Tools360 offers browser-based utilities. For product
          questions, privacy questions, or to report a problem with a tool,
          email{" "}
          <a
            href="mailto:hello@tools360.com"
            className="text-blue-700 underline underline-offset-2 hover:text-blue-800"
          >
            hello@tools360.com
          </a>
          .
        </p>
        <p className="mt-4 leading-7 text-slate-600">
          Please do not send confidential PDFs. The live tools process files
          only in your browser; email is not an upload path for documents.
        </p>
      </article>
    </main>
  );
}
