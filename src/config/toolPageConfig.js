/**
 * toolPageConfig.js
 * Configuration registry for tool page presentation.
 * Defines display behaviors such as SEO content visibility, description toggling,
 * custom trust badge text, and FAQ schema inclusion per tool slug.
 */

export const DEFAULT_TOOL_PAGE_CONFIG = {
  hasSeoContent: false,
  hideDescription: false,
  trustText: undefined,
  showFaqSchema: false,
};

export const toolPageConfig = {
  "pdf-to-jpg": {
    hasSeoContent: true,
    hideDescription: false,
    trustText: undefined,
    showFaqSchema: true,
  },
  "merge-pdf": {
    hasSeoContent: false,
    hideDescription: false,
    trustText: undefined,
    showFaqSchema: false,
  },
  "split-pdf": {
    hasSeoContent: false,
    hideDescription: false,
    trustText: undefined,
    showFaqSchema: false,
  },
  "compress-pdf": {
    hasSeoContent: false,
    hideDescription: false,
    trustText: undefined,
    showFaqSchema: false,
  },
  "jpg-to-pdf": {
    hasSeoContent: false,
    hideDescription: false,
    trustText: undefined,
    showFaqSchema: false,
  },
  "sign-pdf": {
    hasSeoContent: false,
    hideDescription: false,
    trustText: undefined,
    showFaqSchema: false,
  },
  "compare-pdf": {
    hasSeoContent: false,
    hideDescription: false,
    trustText: undefined,
    showFaqSchema: false,
  },
  "organize-pdf": {
    hasSeoContent: false,
    hideDescription: false,
    trustText: undefined,
    showFaqSchema: false,
  },
  "rotate-pdf": {
    hasSeoContent: false,
    hideDescription: true,
    trustText: undefined,
    showFaqSchema: false,
  },
  "add-page-numbers": {
    hasSeoContent: false,
    hideDescription: true,
    trustText: undefined,
    showFaqSchema: false,
  },
  "image-compressor": {
    hasSeoContent: false,
    hideDescription: true,
    trustText: undefined,
    showFaqSchema: false,
  },
  "image-resizer": {
    hasSeoContent: false,
    hideDescription: true,
    trustText: undefined,
    showFaqSchema: false,
  },
  "image-converter": {
    hasSeoContent: false,
    hideDescription: true,
    trustText: undefined,
    showFaqSchema: false,
  },
  "svg-to-png": {
    hasSeoContent: false,
    hideDescription: true,
    trustText: undefined,
    showFaqSchema: false,
  },
  "percentage-calculator": {
    hasSeoContent: false,
    hideDescription: true,
    trustText: "Calculated in your browser. Nothing is stored or sent.",
    showFaqSchema: false,
  },
  "loan-emi-calculator": {
    hasSeoContent: false,
    hideDescription: true,
    trustText: "Calculated in your browser. Nothing is stored or sent.",
    showFaqSchema: false,
  },
  "age-calculator": {
    hasSeoContent: false,
    hideDescription: true,
    trustText: "Calculated in your browser. Nothing is stored or sent.",
    showFaqSchema: false,
  },
  "word-counter": {
    hasSeoContent: false,
    hideDescription: true,
    trustText: "Calculated in your browser. Nothing is stored or sent.",
    showFaqSchema: false,
  },
};

/**
 * Resolves the configuration for a given tool slug, falling back to defaults.
 * @param {string} slug
 * @returns {typeof DEFAULT_TOOL_PAGE_CONFIG}
 */
export function getToolPageConfig(slug) {
  const config = toolPageConfig[slug] || {};
  return {
    ...DEFAULT_TOOL_PAGE_CONFIG,
    ...config,
  };
}

export default toolPageConfig;
