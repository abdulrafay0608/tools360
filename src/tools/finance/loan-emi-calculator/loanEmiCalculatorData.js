/**
 * loanEmiCalculatorData.js
 * Currency options and tenure constraints for the Loan EMI Calculator tool.
 */

export const CURRENCY_OPTIONS = [
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "INR", label: "INR — Indian Rupee" },
  { code: "PKR", label: "PKR — Pakistani Rupee" },
  { code: "AED", label: "AED — UAE Dirham" },
  { code: "CUSTOM", label: "Custom symbol" },
];

export const MAX_TENURE_MONTHS = 40 * 12;
