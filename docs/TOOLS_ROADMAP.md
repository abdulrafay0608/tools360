# Tools roadmap

Catalog counts: 18 live, 79 planned, and 40 disabled. Planned and disabled
tools are hidden from the site by default. Disabled tools are not candidates for
the roadmap unless their stated limitation changes.

## Live tools

### PDF Tools
- Add Page Numbers (`add-page-numbers`)
- Compare PDF (`compare-pdf`)
- Compress PDF (`compress-pdf`)
- JPG to PDF (`jpg-to-pdf`)
- Merge PDF (`merge-pdf`)
- Organize PDF (`organize-pdf`)
- PDF to JPG (`pdf-to-jpg`)
- Rotate PDF (`rotate-pdf`)
- Sign PDF (`sign-pdf`)
- Split PDF (`split-pdf`)

### Image Tools
- Image Compressor (`image-compressor`)
- Image Converter (`image-converter`)
- Image Resizer (`image-resizer`)
- SVG to PNG Converter (`svg-to-png`)

### Finance & Calculators
- Age Calculator (`age-calculator`)
- Loan EMI Calculator (`loan-emi-calculator`)
- Percentage Calculator (`percentage-calculator`)

### Writer & Blogging Tools
- Word Counter (`word-counter`)

## Planned tools

### Priority 1
- PDF Tools: Crop PDF (`crop-pdf`), PDF to Text (`pdf-to-text`), Watermark PDF (`watermark-pdf`)
- Image Tools: Compress Image to Size (`compress-image-to-size`), Crop Image (`crop-image`), HEIC to JPG (`heic-to-jpg`)
- Finance & Calculators: BMI Calculator (`bmi-calculator`), Compound Interest Calculator (`compound-interest-calculator`), GST Calculator (`gst-calculator`), Mortgage Calculator (`mortgage-calculator`), SIP Calculator (`sip-calculator`), Unit Converter (`unit-converter`)
- Developer Tools: Base64 Encode/Decode (`base64-encode-decode`), JSON Formatter & Validator (`json-formatter-validator`), JWT Decoder (`jwt-decoder`), Regex Tester (`regex-tester`), UUID Generator (`uuid-generator`)
- Generators & Utilities: Password Generator (`password-generator`), QR Code Generator (`qr-code-generator`)
- Typing & Productivity: Character Counter (`character-counter`), Text Case Converter (`case-converter`), Typing Speed Test (`typing-speed-test`)

### Priority 2
- PDF Tools: Delete PDF Pages (`delete-pdf-pages`), Extract PDF Pages (`extract-pdf-pages`), PDF to PNG (`pdf-to-png`), PNG to PDF (`png-to-pdf`), Scan to PDF (`scan-to-pdf`)
- Image Tools: Image Color Picker (`image-color-picker`), Image to Base64 (`image-to-base64`), Rotate & Flip Image (`rotate-flip-image`), Watermark Image (`watermark-image`)
- Finance & Calculators: Date Difference Calculator (`date-difference-calculator`), Discount Calculator (`discount-calculator`), Fuel Cost Estimator (`fuel-cost-estimator`), Profit Margin Calculator (`profit-margin-calculator`), Split Bill Calculator (`split-bill-calculator`), Tip Calculator (`tip-calculator`), VAT Calculator (`vat-calculator`)
- Developer Tools: Code Beautifier (`code-beautifier`), CSV to JSON Converter (`csv-json-converter`), Diff Checker (`diff-checker`), Hash Generator (`hash-generator`), HTML, CSS, JS Minifier (`minifier`), Lorem Ipsum Generator (`lorem-ipsum-generator`), Timestamp Converter (`timestamp-converter`), URL Encode / Decode (`url-encode-decode`)
- SEO Tools: Keyword Density Checker (`keyword-density-checker`), Meta Tag Generator (`meta-tag-generator`), Open Graph Generator (`open-graph-generator`), Robots.txt Generator (`robots-generator`), SERP Snippet Preview (`serp-snippet-preview`), Slug Generator (`slug-generator`), UTM Builder (`utm-builder`)
- Writer & Blogging Tools: Readability Checker (`readability-checker`), Remove Duplicate Lines (`remove-duplicate-lines`)
- Typing & Productivity: Pomodoro Timer (`pomodoro-timer`), Timer / Stopwatch (`timer-stopwatch`)
- Design & Color Tools: Color Picker (`color-picker`), Contrast Checker (`contrast-checker`), Favicon Generator (`favicon-generator`), Gradient Generator (`gradient-generator`), HEX ↔ RGB Converter (`hex-rgb-converter`), Palette Generator (`palette-generator`)

### Priority 3
- PDF Tools: Edit PDF (`edit-pdf`), OCR PDF (`ocr-pdf`), Protect PDF (`protect-pdf`), Unlock PDF (`unlock-pdf`)
- Developer Tools: Markdown Previewer (`markdown-previewer`), YAML to JSON Converter (`yaml-json-converter`)
- Generators & Utilities: Random Number Generator (`random-number-generator`)
- SEO Tools: H1-H6 Checker (`h1-h6-checker`)
- Writer & Blogging Tools: Text to Speech (`text-to-speech`), Word Frequency Counter (`word-frequency-counter`)
- Typing & Productivity: Daily Planner / To-do (`daily-planner`), Notes Taking Tool (`notes-taking-tool`)
- Web & Network Tools: DNS Lookup (`dns-lookup`), IP Address Finder (`ip-address-finder`)
- Resume & Career Tools: ATS Resume Checker (`ats-resume-checker`), Resume Builder (`resume-builder`)

## Disabled tools

Disabled tools are excluded from the UI and sitemap.

### PDF Tools
- Excel to PDF (`excel-to-pdf`) — Requires a server or paid document-conversion API.
- HTML to PDF (`html-to-pdf`) — Reliable web-page rendering requires a server.
- PDF to Excel (`pdf-to-excel`) — Requires server-side document conversion.
- PDF to PDF/A (`pdf-to-pdfa`) — Standards-compliant conversion requires specialized processing.
- PDF to PowerPoint (`pdf-to-ppt`) — Requires server-side document conversion.
- PDF to Word (`pdf-to-word`) — Requires server-side document conversion.
- PowerPoint to PDF (`ppt-to-pdf`) — Requires a server or paid document-conversion API.
- Redact PDF (`redact-pdf`) — Secure redaction cannot be guaranteed by a browser-only tool.
- Repair PDF (`repair-pdf`) — Reliable repair requires specialized server-side processing.
- Word to PDF (`word-to-pdf`) — Requires a server or paid document-conversion API.

### Image Tools
- Background Remover (`background-remover`) — Requires a paid image-processing API.

### Finance & Calculators
- Currency Converter (`currency-converter`) — Live exchange rates require a paid data API.
- Income Tax Calculator (`income-tax-calculator`) — Tax rules vary and require maintained jurisdiction-specific data.

### Developer Tools
- API Tester (Mock JSON) (`api-tester`) — Sending requests requires a server-side proxy.

### SEO Tools
- Backlink Checker (`backlink-checker`) — Requires paid external SEO data and crawling.
- Broken Link Checker (`broken-link-checker`) — Requires crawling and checking a live website.
- Domain Authority Checker (`domain-authority-checker`) — Requires paid external SEO data.
- Keywords Suggestion Tool (`keyword-suggestion`) — Requires paid search data or external crawling.
- Redirect Checker (`redirect-checker`) — Checking remote redirects requires a server.
- Sitemap Generator (`sitemap-generator`) — Requires crawling a live website.

### Writer & Blogging Tools
- AI Blog Title Generator (`blog-title-generator`) — Requires an external AI service.
- Essay Rewriter (`essay-rewriter`) — Requires an external AI service.
- Grammar Checker (OpenAI API) (`grammar-checker`) — Requires an external AI service.
- Paraphraser (`paraphraser`) — Requires an external AI service.
- Plagiarism Checker (`plagiarism-checker`) — Requires external content indexing and matching.
- Text Summarizer (`text-summarizer`) — Requires an external AI service.
- Tone Detector (`tone-detector`) — Requires an external AI service.

### Typing & Productivity
- Clipboard Manager (`clipboard-manager`) — Persistent clipboard access is restricted by browsers.
- Mind Mapping Tool (`mind-mapping-tool`) — A reliable editing experience is not practical for this site currently.

### Web & Network Tools
- Internet Speed Test (`internet-speed-test`) — Accurate measurement requires server infrastructure.
- Ping Checker (`ping-checker`) — Browser security prevents reliable raw network pings.
- Port Scanner (`port-scanner`) — Network scanning requires server-side network access.
- Responsive Web Preview Tool (`responsive-preview`) — Reliable remote-page framing is restricted by browser security.
- SSL Checker (`ssl-checker`) — Inspecting remote certificates requires server access.
- Website Screenshot Tool (`website-screenshot`) — Capturing remote pages requires a server.
- WHOIS Lookup (`whois-lookup`) — Requires server access to domain registration services.

### Resume & Career Tools
- Cover Letter Generator (`cover-letter-generator`) — Requires an external AI service.
- Interview Q/A Generator (`interview-qa-generator`) — Requires an external AI service.
- Job Description Scanner (`job-description-scanner`) — Requires an external AI service.
- Skill Analyzer (`skill-analyzer`) — Requires an external AI service.

## Recommended build order

1. **Wave 1 — Finance + text:** Build priority 1 finance and text tools first.
2. **Wave 2 — Developer + generators:** Build priority 1 developer tools and generators.
3. **Wave 3 — PDF/image additions:** Add browser-feasible priority 1 PDF and image tools.
4. **Wave 4 — Large projects:** Revisit priority 2/3 tools and complex projects after the focused tools are established.
