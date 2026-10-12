/**
 * tools-data.js
 * Aggregator module for catalog categories and category-specific tool lists.
 * Preserves the exact toolsData export shape and invariants.
 */

import {
  CATEGORIES,
  plannedPriorityBySlug,
  disabledToolReasons,
} from "./categories.js";

import pdfTools from "./tools/pdf-tools.js";
import imageTools from "./tools/image-tools.js";
import financeCalculators from "./tools/finance-calculators.js";
import developerTools from "./tools/developer-tools.js";
import generatorsUtilities from "./tools/generators-utilities.js";
import seoTools from "./tools/seo-tools.js";
import writerBloggingTools from "./tools/writer-blogging-tools.js";
import typingProductivity from "./tools/typing-productivity.js";
import webNetworkTools from "./tools/web-network-tools.js";
import designColorTools from "./tools/design-color-tools.js";
import resumeCareerTools from "./tools/resume-career-tools.js";

const toolsByCategory = {
  "pdf-tools": pdfTools,
  "image-tools": imageTools,
  "finance-calculators": financeCalculators,
  "developer-tools": developerTools,
  "generators-utilities": generatorsUtilities,
  "seo-tools": seoTools,
  "writer-blogging-tools": writerBloggingTools,
  "typing-productivity": typingProductivity,
  "web-network-tools": webNetworkTools,
  "design-color-tools": designColorTools,
  "resume-career-tools": resumeCareerTools,
};

const rawToolsData = CATEGORIES.map((cat) => ({
  ...cat,
  tools: toolsByCategory[cat.id] || [],
}));

export const toolsData = rawToolsData
  .map((category) => ({
    ...category,
    tools: category.tools.map((tool) => {
      if (tool.available === true) {
        return { ...tool, status: "live", available: true };
      }

      const disabledReason = disabledToolReasons[tool.slug];
      if (disabledReason) {
        return {
          ...tool,
          status: "disabled",
          available: false,
          disabledReason,
        };
      }

      return {
        ...tool,
        status: "planned",
        available: false,
        priority: plannedPriorityBySlug[tool.slug] || tool.priority || 3,
      };
    }),
  }))
  .sort((first, second) => first.sortOrder - second.sortOrder);

export default toolsData;
