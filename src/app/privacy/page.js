export const metadata = {
  title: "Privacy Policy | Tools360",
  description:
    "How Tools360 handles files, cookies, advertising, and analytics.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-[70vh] bg-[#f4f7f5] px-5 py-16 text-[#172c27] sm:px-8">
      <article className="mx-auto max-w-3xl border border-[#dce5e0] bg-white p-6 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#527268]">
          Privacy
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Privacy policy</h1>
        <p className="mt-5 leading-7 text-[#5d706a]">
          This page explains how Tools360 works with your files and what
          third-party services may run in the browser. We keep the wording
          plain so you can decide whether the tools are a good fit.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-[#173d34]">
          Files stay on your device
        </h2>
        <p className="mt-3 leading-7 text-[#5d706a]">
          PDF and image tools on this site run in your browser. Your files are
          not uploaded to our servers for processing, and we do not store the
          contents of those files. If you download a result, that file is
          created locally on your device.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-[#173d34]">
          Advertising and cookies
        </h2>
        <p className="mt-3 leading-7 text-[#5d706a]">
          We reserve space on tool pages for advertisements. Real ad scripts
          are not enabled yet. When advertising is turned on, third-party ad
          and analytics providers may set cookies or similar storage, and may
          collect data such as your IP address, browser type, and pages you
          visit in order to show and measure ads.
        </p>
        <p className="mt-3 leading-7 text-[#5d706a]">
          Those providers operate under their own policies. Google&apos;s
          advertising policies are published at{" "}
          <a
            href="https://support.google.com/adspolicy/answer/6008942"
            className="text-[#235c4f] underline underline-offset-2 hover:text-[#173d34]"
          >
            Google Ads policies
          </a>
          . We do not use your uploaded documents as advertising data because
          those files never leave your browser.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-[#173d34]">Contact</h2>
        <p className="mt-3 leading-7 text-[#5d706a]">
          Questions about this policy can be sent through the{" "}
          <a
            href="/contact"
            className="text-[#235c4f] underline underline-offset-2 hover:text-[#173d34]"
          >
            contact page
          </a>
          .
        </p>
      </article>
    </main>
  );
}
