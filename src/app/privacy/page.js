import { getAbsoluteUrl } from "@/config/site";

const pageUrl = getAbsoluteUrl("/privacy");

export const metadata = {
  title: "Privacy Policy | Tools360",
  description:
    "How Tools360 processes selected files locally and handles website requests while advertising and analytics are disabled.",
  alternates: { canonical: pageUrl },
  openGraph: {
    title: "Privacy Policy | Tools360",
    description:
      "How Tools360 processes selected files locally and handles website requests while advertising and analytics are disabled.",
    url: pageUrl,
  },
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
        <p className="mt-3 leading-7 text-[#5d706a]">
          Using the site still involves ordinary requests for the page,
          scripts, styles, fonts, and browser worker assets. Those requests
          are separate from the selected file bytes; advertising and analytics
          are currently disabled, and the tools do not send files to a
          processing API.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-[#173d34]">
          Advertising and cookies
        </h2>
        <p className="mt-3 leading-7 text-[#5d706a]">
          Advertising slots and scripts are currently disabled. If advertising
          is turned on later, third-party ad
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
          . The tools do not use selected documents as advertising data.
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
