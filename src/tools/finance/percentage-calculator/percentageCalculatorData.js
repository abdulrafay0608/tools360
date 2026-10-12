/**
 * percentageCalculatorData.js
 * Calculation modes, labels, and form fields for the Percentage Calculator tool.
 */

export const PERCENTAGE_MODES = [
  "percent-of",
  "is-what-percent",
  "change",
  "add-percent",
  "subtract-percent",
];

export const MODE_LABELS = {
  "percent-of": "X% of Y",
  "is-what-percent": "X is what % of Y",
  change: "Percentage change",
  "add-percent": "Add X% to Y",
  "subtract-percent": "Subtract X% from Y",
};

export const FIELD_LABELS = {
  "percent-of": ["Percentage (X)", "Value (Y)"],
  "is-what-percent": ["Part (X)", "Whole (Y)"],
  change: ["Original value", "New value"],
  "add-percent": ["Percentage (X)", "Value (Y)"],
  "subtract-percent": ["Percentage (X)", "Value (Y)"],
};
