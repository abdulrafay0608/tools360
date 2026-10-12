/**
 * Static map of tool content modules keyed by tool slug.
 */
import pdfToJpgContent from "./pdf-to-jpg.js";

const toolContentMap = {
  "pdf-to-jpg": pdfToJpgContent,
};

/**
 * Returns custom content for a tool by slug, or null if no content file exists.
 * @param {string} slug
 * @returns {object|null}
 */
export function getToolContent(slug) {
  return toolContentMap[slug] || null;
}

/**
 * Extracts all words from a tool's content file for analysis, keyword checking, or ad density planning.
 * Returns an array of lowercase string tokens.
 * @param {string} slug
 * @returns {string[]}
 */
export function getContentWords(slug) {
  const content = getToolContent(slug);
  if (!content) return [];

  const pieces = [];

  if (Array.isArray(content.howTo)) {
    for (const step of content.howTo) {
      if (step.title) pieces.push(step.title);
      if (step.description) pieces.push(step.description);
    }
  }

  if (Array.isArray(content.tips)) {
    pieces.push(...content.tips);
  }

  if (content.privacyText) {
    pieces.push(content.privacyText);
  }

  if (Array.isArray(content.faqs)) {
    for (const faq of content.faqs) {
      if (faq.question) pieces.push(faq.question);
      if (faq.answer) pieces.push(faq.answer);
    }
  }

  const combined = pieces.join(" ");
  const matches = combined.toLowerCase().match(/\b[a-z0-9]+(?:'[a-z0-9]+)?\b/gi) || [];
  return matches;
}

export default toolContentMap;
