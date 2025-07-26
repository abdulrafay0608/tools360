// export const tools = [
//     {
//       name: "Merge PDF",
//       description:
//         "Combine PDFs in the order you want with the easiest PDF merger available.",
//     },
//     {
//       name: "Split PDF",
//       description:
//         "Separate one page or a whole set for easy conversion into independent PDF files.",
//     },
//     {
//       name: "Compress PDF",
//       description:
//         "Reduce file size while optimizing for maximal PDF quality.",
//     },
//     {
//       name: "PDF to Word",
//       description:
//         "Easily convert your PDF files into easy to edit DOC and DOCX documents. The converted WORD document is almost 100% accurate.",
//     },
//     {
//       name: "PDF to PowerPoint",
//       description:
//         "Turn your PDF files into easy to edit PPT and PPTX slideshows.",
//     },
//     {
//       name: "PDF to Excel",
//       description:
//         "Pull data straight from PDFs into Excel spreadsheets in a few short seconds.",
//     },
//     {
//       name: "Word to PDF",
//       description:
//         "Make DOC and DOCX files easy to read by converting them to PDF.",
//     },
//     {
//       name: "PowerPoint to PDF",
//       description:
//         "Make PPT and PPTX slideshows easy to view by converting them to PDF.",
//     },
//     {
//       name: "Excel to PDF",
//       description:
//         "Make EXCEL spreadsheets easy to read by converting them to PDF.",
//     },
//     {
//       name: "Edit PDF",
//       description:
//         "Add text, images, shapes or freehand annotations to a PDF document.",
//     },
//     {
//       name: "PDF to JPG",
//       description:
//         "Convert each PDF page into a JPG or extract all images contained in a PDF.",
//     },
//     {
//       name: "JPG to PDF",
//       description:
//         "Convert JPG images to PDF in seconds. Easily adjust orientation and margins.",
//     },
//     {
//       name: "Sign PDF",
//       description:
//         "Sign yourself or request electronic signatures from others.",
//     },
//     {
//       name: "Watermark",
//       description:
//         "Stamp an image or text over your PDF in seconds. Choose typography, transparency and position.",
//     },
//     {
//       name: "Rotate PDF",
//       description:
//         "Rotate your PDFs the way you need them. You can even rotate multiple PDFs at once!",
//     },
//     {
//       name: "HTML to PDF",
//       description:
//         "Convert webpages in HTML to PDF. Paste the URL and convert it to PDF with a click.",
//     },
//     {
//       name: "Unlock PDF",
//       description:
//         "Remove PDF password security, giving you the freedom to use your PDFs as you want.",
//     },
//     {
//       name: "Protect PDF",
//       description:
//         "Encrypt PDF documents with a password to prevent unauthorized access.",
//     },
//     {
//       name: "Organize PDF",
//       description:
//         "Sort, delete, or add PDF pages however you like.",
//     },
//     {
//       name: "PDF to PDF/A",
//       description:
//         "Transform your PDF to PDF/A, ISO-standardized for long-term archiving.",
//     },
//     {
//       name: "Repair PDF",
//       description:
//         "Repair a damaged PDF and recover data from corrupt files.",
//     },
//     {
//       name: "Page numbers",
//       description:
//         "Add page numbers into PDFs with ease. Choose position, size, and font.",
//     },
//     {
//       name: "Scan to PDF",
//       description:
//         "Capture document scans from your mobile and send them to your browser.",
//     },
//     {
//       name: "OCR PDF",
//       description:
//         "Convert scanned PDF into searchable and selectable documents.",
//     },
//     {
//       name: "Compare PDF",
//       description:
//         "Side-by-side comparison to easily spot changes between different versions.",
//     },
//     {
//       name: "Redact PDF",
//       description:
//         "Permanently remove sensitive text and graphics from a PDF.",
//     },
//     {
//       name: "Crop PDF",
//       description:
//         "Crop margins or select specific areas of PDF pages.",
//     },
//   ];

export const toolsData = [
  {
    category: "PDF Tools",
    tools: [
      {
        name: "Merge PDF",
        slug: "merge-pdf",
        icon: "merge",
        description:
          "Combine PDFs in the order you want with the easiest PDF merger available.",
      },
      {
        name: "Split PDF",
        slug: "split-pdf",
        icon: "split",
        description:
          "Separate one page or a whole set for easy conversion into independent PDF files.",
      },
      {
        name: "Compress PDF",
        slug: "compress-pdf",
        icon: "compress",
        description:
          "Reduce file size while optimizing for maximal PDF quality.",
      },
      {
        name: "PDF to Word",
        slug: "pdf-to-word",
        icon: "word",
        description:
          "Convert your PDF files into editable DOC and DOCX documents.",
      },
      {
        name: "PDF to PowerPoint",
        slug: "pdf-to-ppt",
        icon: "ppt",
        description: "Convert PDFs to editable PPT and PPTX slideshows.",
      },
      {
        name: "PDF to Excel",
        slug: "pdf-to-excel",
        icon: "excel",
        description: "Pull data from PDFs into Excel spreadsheets quickly.",
      },
      {
        name: "Word to PDF",
        slug: "word-to-pdf",
        icon: "word",
        description: "Convert Word (DOC/DOCX) files into PDF.",
      },
      {
        name: "PowerPoint to PDF",
        slug: "ppt-to-pdf",
        icon: "ppt",
        description: "Convert PowerPoint presentations to PDF.",
      },
      {
        name: "Excel to PDF",
        slug: "excel-to-pdf",
        icon: "excel",
        description: "Convert Excel spreadsheets to PDF.",
      },
      {
        name: "Edit PDF",
        slug: "edit-pdf",
        icon: "edit",
        description:
          "Add text, images, shapes or annotations to a PDF document.",
      },
      {
        name: "PDF to JPG",
        slug: "pdf-to-jpg",
        icon: "image",
        description: "Convert PDF pages into JPG images or extract images.",
      },
      {
        name: "JPG to PDF",
        slug: "jpg-to-pdf",
        icon: "image",
        description: "Convert JPG images to PDF in seconds.",
      },
      {
        name: "Sign PDF",
        slug: "sign-pdf",
        icon: "signature",
        description: "Digitally sign PDF or request e-signatures from others.",
      },
      {
        name: "Watermark PDF",
        slug: "watermark-pdf",
        icon: "watermark",
        description: "Stamp a watermark over your PDF — text or image.",
      },
      {
        name: "Rotate PDF",
        slug: "rotate-pdf",
        icon: "rotate",
        description: "Rotate PDFs as you like — even multiple at once!",
      },
      {
        name: "HTML to PDF",
        slug: "html-to-pdf",
        icon: "code",
        description: "Convert webpages (URLs) to PDF instantly.",
      },
      {
        name: "Unlock PDF",
        slug: "unlock-pdf",
        icon: "unlock",
        description: "Remove password protection from secured PDF files.",
      },
      {
        name: "Protect PDF",
        slug: "protect-pdf",
        icon: "lock",
        description: "Encrypt PDF files with a password to prevent access.",
      },
      {
        name: "Organize PDF",
        slug: "organize-pdf",
        icon: "organize",
        description: "Sort, delete, or add PDF pages however you like.",
      },
      {
        name: "PDF to PDF/A",
        slug: "pdf-to-pdfa",
        icon: "archive",
        description: "Convert PDF to ISO-standard PDF/A for archiving.",
      },
      {
        name: "Repair PDF",
        slug: "repair-pdf",
        icon: "repair",
        description: "Fix corrupted PDF files and recover data.",
      },
      {
        name: "Add Page Numbers",
        slug: "add-page-numbers",
        icon: "numbers",
        description: "Add page numbers to PDF easily with positioning.",
      },
      {
        name: "Scan to PDF",
        slug: "scan-to-pdf",
        icon: "camera",
        description: "Scan physical documents and save as PDF.",
      },
      {
        name: "OCR PDF",
        slug: "ocr-pdf",
        icon: "ocr",
        description: "Convert scanned PDFs into searchable documents.",
      },
      {
        name: "Compare PDF",
        slug: "compare-pdf",
        icon: "compare",
        description: "See visual difference between two PDFs.",
      },
      {
        name: "Redact PDF",
        slug: "redact-pdf",
        icon: "redact",
        description: "Permanently remove sensitive text/images.",
      },
      {
        name: "Crop PDF",
        slug: "crop-pdf",
        icon: "crop",
        description: "Trim margins or selected areas of PDF pages.",
      },
    ],
  },
  {
    category: "Developer Tools",
    tools: [
      {
        name: "JSON Formatter & Validator",
        slug: "json-formatter-validator",
        icon: "code",
        description: "Beautify, minify, and validate JSON data.",
      },
      {
        name: "Base64 Encode/Decode",
        slug: "base64-encode-decode",
        icon: "code",
        description: "Convert text to/from Base64 encoding.",
      },
      {
        name: "HTML, CSS, JS Minifier",
        slug: "minifier",
        icon: "code",
        description: "Minify HTML, CSS, and JavaScript files.",
      },
      {
        name: "Regex Tester",
        slug: "regex-tester",
        icon: "code",
        description: "Test and debug your regular expressions.",
      },
      {
        name: "UUID Generator",
        slug: "uuid-generator",
        icon: "code",
        description: "Generate random UUIDs.",
      },
      {
        name: "Lorem Ipsum Generator",
        slug: "lorem-ipsum-generator",
        icon: "code",
        description: "Create placeholder text for your designs.",
      },
      {
        name: "JWT Decoder",
        slug: "jwt-decoder",
        icon: "code",
        description: "Decode and inspect JSON Web Tokens.",
      },
      {
        name: "Code Beautifier",
        slug: "code-beautifier",
        icon: "code",
        description: "Format your source code for readability.",
      },
      {
        name: "API Tester (Mock JSON)",
        slug: "api-tester",
        icon: "code",
        description: "Send mock API requests and view JSON responses.",
      },
    ],
  },
  {
    category: "SEO Tools",
    tools: [
      {
        name: "Meta Tag Generator",
        slug: "meta-tag-generator",
        icon: "seo",
        description: "Generate SEO meta tags for your website.",
      },
      {
        name: "Keywords Suggestion Tool",
        slug: "keyword-suggestion",
        icon: "seo",
        description: "Find keyword ideas for your content.",
      },
      {
        name: "Robots.txt Generator",
        slug: "robots-generator",
        icon: "seo",
        description: "Create a robots.txt file easily.",
      },
      {
        name: "Sitemap Generator",
        slug: "sitemap-generator",
        icon: "seo",
        description: "Generate XML sitemaps for search engines.",
      },
      {
        name: "SERP Snippet Preview",
        slug: "serp-snippet-preview",
        icon: "seo",
        description: "Preview how your page appears in search results.",
      },
      {
        name: "H1-H6 Checker",
        slug: "h1-h6-checker",
        icon: "seo",
        description: "Validate heading structure for SEO.",
      },
      {
        name: "Broken Link Checker",
        slug: "broken-link-checker",
        icon: "seo",
        description: "Find broken links on your website.",
      },
      {
        name: "Domain Authority Checker",
        slug: "domain-authority-checker",
        icon: "seo",
        description: "Check the authority score of a domain.",
      },
      {
        name: "Backlink Checker",
        slug: "backlink-checker",
        icon: "seo",
        description: "Analyze backlinks to your site.",
      },
      {
        name: "Redirect Checker",
        slug: "redirect-checker",
        icon: "seo",
        description: "Test URL redirects and HTTP status codes.",
      },
    ],
  },
  {
    category: "Writer & Blogging Tools",
    tools: [
      {
        name: "Grammar Checker (OpenAI API)",
        slug: "grammar-checker",
        icon: "text",
        description: "Check grammar and spelling using AI.",
      },
      {
        name: "Plagiarism Checker",
        slug: "plagiarism-checker",
        icon: "text",
        description: "Detect duplicate content across the web.",
      },
      {
        name: "Word Counter",
        slug: "word-counter",
        icon: "text",
        description: "Count words, characters, and paragraphs.",
      },
      {
        name: "Paraphraser",
        slug: "paraphraser",
        icon: "text",
        description: "Rewrite text to improve uniqueness.",
      },
      {
        name: "Readability Checker",
        slug: "readability-checker",
        icon: "text",
        description: "Assess the readability score of text.",
      },
      {
        name: "Text Summarizer",
        slug: "text-summarizer",
        icon: "text",
        description: "Generate concise summaries of text.",
      },
      {
        name: "AI Blog Title Generator",
        slug: "blog-title-generator",
        icon: "text",
        description: "Create catchy blog post titles using AI.",
      },
      {
        name: "Essay Rewriter",
        slug: "essay-rewriter",
        icon: "text",
        description: "Rewrite essays with improved style.",
      },
      {
        name: "Text to Speech",
        slug: "text-to-speech",
        icon: "text",
        description: "Convert text to natural-sounding speech.",
      },
      {
        name: "Tone Detector",
        slug: "tone-detector",
        icon: "text",
        description: "Detect formal or casual tone in text.",
      },
    ],
  },
  {
    category: "Finance & Utility Tools",
    tools: [
      {
        name: "Loan EMI Calculator",
        slug: "loan-emi-calculator",
        icon: "finance",
        description: "Calculate monthly EMI for loans.",
      },
      {
        name: "GST Calculator",
        slug: "gst-calculator",
        icon: "finance",
        description: "Compute GST inclusive/exclusive values.",
      },
      {
        name: "Currency Converter",
        slug: "currency-converter",
        icon: "finance",
        description: "Convert between various currencies.",
      },
      {
        name: "Income Tax Calculator",
        slug: "income-tax-calculator",
        icon: "finance",
        description: "Estimate income tax liability.",
      },
      {
        name: "SIP Calculator",
        slug: "sip-calculator",
        icon: "finance",
        description: "Plan systematic investment returns.",
      },
      {
        name: "Age Calculator",
        slug: "age-calculator",
        icon: "finance",
        description: "Calculate age from date of birth.",
      },
      {
        name: "Unit Converter",
        slug: "unit-converter",
        icon: "finance",
        description: "Convert units of measurement.",
      },
      {
        name: "Fuel Cost Estimator",
        slug: "fuel-cost-estimator",
        icon: "finance",
        description: "Estimate trip fuel costs.",
      },
      {
        name: "Split Bill Calculator",
        slug: "split-bill-calculator",
        icon: "finance",
        description: "Split bills among friends easily.",
      },
      {
        name: "Percentage Calculator",
        slug: "percentage-calculator",
        icon: "finance",
        description: "Calculate percentages quickly.",
      },
    ],
  },
  {
    category: "Typing & Productivity",
    tools: [
      {
        name: "Typing Speed Test",
        slug: "typing-speed-test",
        icon: "productivity",
        description: "Measure your typing speed and accuracy.",
      },
      {
        name: "Timer / Stopwatch",
        slug: "timer-stopwatch",
        icon: "productivity",
        description: "Track time with a timer or stopwatch.",
      },
      {
        name: "Pomodoro Timer",
        slug: "pomodoro-timer",
        icon: "productivity",
        description: "Use Pomodoro technique for focus.",
      },
      {
        name: "Text Case Converter",
        slug: "case-converter",
        icon: "text",
        description: "Convert text to UPPERCASE, lowercase, or Capitalize.",
      },
      {
        name: "Character Counter",
        slug: "character-counter",
        icon: "text",
        description: "Count characters for social media limits.",
      },
      {
        name: "Notes Taking Tool",
        slug: "notes-taking-tool",
        icon: "productivity",
        description: "Write and save quick notes.",
      },
      {
        name: "Clipboard Manager",
        slug: "clipboard-manager",
        icon: "productivity",
        description: "Manage copied items easily.",
      },
      {
        name: "Daily Planner / To-do",
        slug: "daily-planner",
        icon: "productivity",
        description: "Organize your tasks and schedule.",
      },
      {
        name: "Mind Mapping Tool",
        slug: "mind-mapping-tool",
        icon: "productivity",
        description: "Create mind maps for ideas.",
      },
    ],
  },
  {
    category: "Web & Network Tools",
    tools: [
      {
        name: "Internet Speed Test",
        slug: "internet-speed-test",
        icon: "network",
        description: "Check your connection speed.",
      },
      {
        name: "IP Address Finder",
        slug: "ip-address-finder",
        icon: "network",
        description: "Find your public IP address.",
      },
      {
        name: "Ping Checker",
        slug: "ping-checker",
        icon: "network",
        description: "Test latency to servers.",
      },
      {
        name: "Port Scanner",
        slug: "port-scanner",
        icon: "network",
        description: "Scan open ports on a host.",
      },
      {
        name: "WHOIS Lookup",
        slug: "whois-lookup",
        icon: "network",
        description: "Get domain registration details.",
      },
      {
        name: "DNS Lookup",
        slug: "dns-lookup",
        icon: "network",
        description: "Resolve DNS records.",
      },
      {
        name: "Website Screenshot Tool",
        slug: "website-screenshot",
        icon: "network",
        description: "Capture webpage screenshots.",
      },
      {
        name: "SSL Checker",
        slug: "ssl-checker",
        icon: "network",
        description: "Check SSL certificate validity.",
      },
      {
        name: "Responsive Web Preview Tool",
        slug: "responsive-preview",
        icon: "network",
        description: "Preview website on different screen sizes.",
      },
    ],
  },
  {
    category: "Design & Color Tools",
    tools: [
      {
        name: "Color Picker",
        slug: "color-picker",
        icon: "color",
        description: "Select and copy color codes.",
      },
      {
        name: "Gradient Generator",
        slug: "gradient-generator",
        icon: "color",
        description: "Create CSS gradients visually.",
      },
      {
        name: "Image Compressor",
        slug: "image-compressor",
        icon: "image",
        description: "Reduce image size without losing quality.",
      },
      {
        name: "Image Resizer",
        slug: "image-resizer",
        icon: "image",
        description: "Resize images to specific dimensions.",
      },
      {
        name: "Favicon Generator",
        slug: "favicon-generator",
        icon: "color",
        description: "Generate favicon from images.",
      },
      {
        name: "Palette Generator",
        slug: "palette-generator",
        icon: "color",
        description: "Generate color palettes.",
      },
      {
        name: "HEX ↔ RGB Converter",
        slug: "hex-rgb-converter",
        icon: "color",
        description: "Convert between HEX and RGB color formats.",
      },
      {
        name: "SVG to PNG Converter",
        slug: "svg-to-png",
        icon: "image",
        description: "Convert SVG images to PNG format.",
      },
      {
        name: "Background Remover",
        slug: "background-remover",
        icon: "image",
        description: "Remove background from images (API-based).",
      },
    ],
  },
  {
    category: "Resume & Career Tools",
    tools: [
      {
        name: "Resume Builder",
        slug: "resume-builder",
        icon: "career",
        description: "Create professional resumes with templates.",
      },
      {
        name: "Cover Letter Generator",
        slug: "cover-letter-generator",
        icon: "career",
        description: "Generate cover letters tailored to jobs.",
      },
      {
        name: "Job Description Scanner",
        slug: "job-description-scanner",
        icon: "career",
        description: "Scan job descriptions for keywords.",
      },
      {
        name: "ATS Resume Checker",
        slug: "ats-resume-checker",
        icon: "career",
        description: "Optimize resumes for Applicant Tracking Systems.",
      },
      {
        name: "Interview Q/A Generator",
        slug: "interview-qa-generator",
        icon: "career",
        description: "Generate common interview questions and answers.",
      },
      {
        name: "Skill Analyzer",
        slug: "skill-analyzer",
        icon: "career",
        description: "Analyze and suggest skills based on your resume.",
      },
    ],
  },
];
