/**
 * categories.js
 * Catalog category definitions and sorting order.
 */

export const CATEGORIES = [
  {
    "id": "pdf-tools",
    "category": "PDF Tools",
    "description": "Edit, organize, convert, and manage PDF documents.",
    "icon": "pdf",
    "sortOrder": 1
  },
  {
    "id": "developer-tools",
    "category": "Developer Tools",
    "description": "Format, inspect, and work with code and developer data.",
    "icon": "code",
    "sortOrder": 4
  },
  {
    "id": "generators-utilities",
    "category": "Generators & Utilities",
    "description": "Generate useful codes, credentials, and random values.",
    "icon": "productivity",
    "sortOrder": 5
  },
  {
    "id": "seo-tools",
    "category": "SEO Tools",
    "description": "Create and review the building blocks of search visibility.",
    "icon": "seo",
    "sortOrder": 6
  },
  {
    "id": "writer-blogging-tools",
    "category": "Writer & Blogging Tools",
    "description": "Tools for drafting, checking, and improving written content.",
    "icon": "text",
    "sortOrder": 7
  },
  {
    "id": "finance-calculators",
    "category": "Finance & Calculators",
    "description": "Calculate costs, percentages, dates, and financial estimates.",
    "icon": "finance",
    "sortOrder": 3
  },
  {
    "id": "typing-productivity",
    "category": "Typing & Productivity",
    "description": "Build typing skills and organize everyday work.",
    "icon": "productivity",
    "sortOrder": 8
  },
  {
    "id": "web-network-tools",
    "category": "Web & Network Tools",
    "description": "Check network details and preview web experiences.",
    "icon": "network",
    "sortOrder": 9
  },
  {
    "id": "design-color-tools",
    "category": "Design & Color Tools",
    "description": "Choose colors and create useful visual design assets.",
    "icon": "color",
    "sortOrder": 10
  },
  {
    "id": "resume-career-tools",
    "category": "Resume & Career Tools",
    "description": "Prepare application materials and explore career readiness.",
    "icon": "career",
    "sortOrder": 11
  },
  {
    "id": "image-tools",
    "category": "Image Tools",
    "description": "Resize, convert, compress, and prepare image files.",
    "icon": "image",
    "sortOrder": 2
  }
];

export const plannedPriorityBySlug = {
  "percentage-calculator": 1,
  "loan-emi-calculator": 1,
  "age-calculator": 1,
  "sip-calculator": 1,
  "unit-converter": 1,
  "gst-calculator": 1,
  "word-counter": 1,
  "character-counter": 1,
  "case-converter": 1,
  "json-formatter-validator": 1,
  "base64-encode-decode": 1,
  "uuid-generator": 1,
  "jwt-decoder": 1,
  "regex-tester": 1,
  "typing-speed-test": 1,
  "watermark-pdf": 1,
  "crop-pdf": 1,
  "lorem-ipsum-generator": 2,
  "minifier": 2,
  "code-beautifier": 2,
  "meta-tag-generator": 2,
  "robots-generator": 2,
  "serp-snippet-preview": 2,
  "readability-checker": 2,
  "timer-stopwatch": 2,
  "pomodoro-timer": 2,
  "gradient-generator": 2,
  "color-picker": 2,
  "palette-generator": 2,
  "hex-rgb-converter": 2,
  "favicon-generator": 2,
  "scan-to-pdf": 2,
  "split-bill-calculator": 2,
  "fuel-cost-estimator": 2,
  "edit-pdf": 3,
  "unlock-pdf": 3,
  "protect-pdf": 3,
  "ocr-pdf": 3,
  "text-to-speech": 3,
  "notes-taking-tool": 3,
  "daily-planner": 3,
  "ip-address-finder": 3,
  "dns-lookup": 3,
  "h1-h6-checker": 3,
  "resume-builder": 3,
  "ats-resume-checker": 3
};

export const disabledToolReasons = {
  "pdf-to-word": "Requires server-side document conversion.",
  "pdf-to-ppt": "Requires server-side document conversion.",
  "pdf-to-excel": "Requires server-side document conversion.",
  "word-to-pdf": "Requires a server or paid document-conversion API.",
  "ppt-to-pdf": "Requires a server or paid document-conversion API.",
  "excel-to-pdf": "Requires a server or paid document-conversion API.",
  "html-to-pdf": "Reliable web-page rendering requires a server.",
  "pdf-to-pdfa": "Standards-compliant conversion requires specialized processing.",
  "repair-pdf": "Reliable repair requires specialized server-side processing.",
  "redact-pdf": "Secure redaction cannot be guaranteed by a browser-only tool.",
  "api-tester": "Sending requests requires a server-side proxy.",
  "keyword-suggestion": "Requires paid search data or external crawling.",
  "sitemap-generator": "Requires crawling a live website.",
  "broken-link-checker": "Requires crawling and checking a live website.",
  "domain-authority-checker": "Requires paid external SEO data.",
  "backlink-checker": "Requires paid external SEO data and crawling.",
  "redirect-checker": "Checking remote redirects requires a server.",
  "grammar-checker": "Requires an external AI service.",
  "plagiarism-checker": "Requires external content indexing and matching.",
  "paraphraser": "Requires an external AI service.",
  "text-summarizer": "Requires an external AI service.",
  "blog-title-generator": "Requires an external AI service.",
  "essay-rewriter": "Requires an external AI service.",
  "tone-detector": "Requires an external AI service.",
  "currency-converter": "Live exchange rates require a paid data API.",
  "income-tax-calculator": "Tax rules vary and require maintained jurisdiction-specific data.",
  "clipboard-manager": "Persistent clipboard access is restricted by browsers.",
  "mind-mapping-tool": "A reliable editing experience is not practical for this site currently.",
  "internet-speed-test": "Accurate measurement requires server infrastructure.",
  "ping-checker": "Browser security prevents reliable raw network pings.",
  "port-scanner": "Network scanning requires server-side network access.",
  "whois-lookup": "Requires server access to domain registration services.",
  "website-screenshot": "Capturing remote pages requires a server.",
  "ssl-checker": "Inspecting remote certificates requires server access.",
  "responsive-preview": "Reliable remote-page framing is restricted by browser security.",
  "cover-letter-generator": "Requires an external AI service.",
  "job-description-scanner": "Requires an external AI service.",
  "interview-qa-generator": "Requires an external AI service.",
  "skill-analyzer": "Requires an external AI service.",
  "background-remover": "Requires a paid image-processing API."
};
