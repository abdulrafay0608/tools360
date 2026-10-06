export const metadata = {
  title: "Contact | Tools360",
  description: "How to reach Tools360 about the browser-based PDF tools.",
};

export default function ContactPage() {
  return (
    <main className="min-h-[70vh] bg-[#f4f7f5] px-5 py-16 text-[#172c27] sm:px-8">
      <article className="mx-auto max-w-3xl border border-[#dce5e0] bg-white p-6 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#527268]">
          Contact
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Get in touch</h1>
        <p className="mt-5 leading-7 text-[#5d706a]">
          Tools360 is a small set of browser-based PDF utilities. For product
          questions, privacy questions, or to report a problem with a tool,
          email{" "}
          <a
            href="mailto:hello@tools360.com"
            className="text-[#235c4f] underline underline-offset-2 hover:text-[#173d34]"
          >
            hello@tools360.com
          </a>
          .
        </p>
        <p className="mt-4 leading-7 text-[#5d706a]">
          Please do not send confidential PDFs. The live tools process files
          only in your browser; email is not an upload path for documents.
        </p>
      </article>
    </main>
  );
}
