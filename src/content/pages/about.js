/**
 * about.js
 * Static content data for About page.
 */

export function getAboutContent({ siteName }) {
  return {
    metaTitle: "About",
    metaDescription: `Learn about ${siteName}'s browser-based PDF, image, and calculator tools.`,
    eyebrow: `About ${siteName}`,
    title: "Useful tools, kept simple.",
    paragraphs: [
      `${siteName} is building a focused set of browser-based utilities for everyday tasks. The available tools process files and data in your browser; your documents and calculation inputs are never uploaded to our servers.`,
      "We add tools as their workflows are ready and thoroughly tested. The catalog currently includes PDF manipulation, image conversion and optimization, and everyday financial and utility calculators. Tool pages may show reserved advertisement space; files and calculations you process are always handled only in your browser.",
    ],
  };
}
