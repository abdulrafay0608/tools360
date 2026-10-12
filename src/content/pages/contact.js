/**
 * contact.js
 * Static content data for Contact page.
 */

export function getContactContent({ siteName, contactEmail }) {
  return {
    metaTitle: "Contact",
    metaDescription: `How to reach ${siteName} regarding our browser-based PDF, image, and calculator tools.`,
    eyebrow: "Contact",
    title: "Get in touch",
    introLead: `${siteName} provides a growing suite of browser-based utilities including PDF editors, image tools, and quick calculators. For product questions, feature feedback, privacy questions, or to report a problem with a tool, email `,
    contactEmail,
    warningParagraph:
      "Please do not send confidential files or personal data. All active tools process files and calculations directly on your device; email is not an upload path for documents or data.",
  };
}
