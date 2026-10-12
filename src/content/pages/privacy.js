/**
 * privacy.js
 * Static content data for Privacy Policy page.
 */

export function getPrivacyContent({ siteName }) {
  return {
    metaTitle: "Privacy Policy",
    metaDescription: `How ${siteName} handles files, cookies, advertising, and analytics.`,
    eyebrow: "Privacy",
    title: "Privacy policy",
    intro: `This page explains how ${siteName} works with your files and what third-party services may run in the browser. We keep the wording plain so you can decide whether the tools are a good fit.`,
    sections: [
      {
        heading: "Files stay on your device",
        paragraphs: [
          "PDF and image tools on this site run in your browser. Your files are not uploaded to our servers for processing, and we do not store the contents of those files. If you download a result, that file is created locally on your device.",
        ],
      },
      {
        heading: "Advertising and cookies",
        paragraphs: [
          "We reserve space on tool pages for advertisements. Real ad scripts are not enabled yet. When advertising is turned on, third-party ad and analytics providers may set cookies or similar storage, and may collect data such as your IP address, browser type, and pages you visit in order to show and measure ads.",
          {
            lead: "Those providers operate under their own policies. Google's advertising policies are published at ",
            linkText: "Google Ads policies",
            linkHref: "https://support.google.com/adspolicy/answer/6008942",
            trail: ". We do not use your uploaded documents as advertising data because those files never leave your browser.",
          },
        ],
      },
      {
        heading: "Contact",
        paragraphs: [
          {
            lead: "Questions about this policy can be sent through the ",
            linkText: "contact page",
            linkHref: "/contact",
            trail: ".",
          },
        ],
      },
    ],
  };
}
