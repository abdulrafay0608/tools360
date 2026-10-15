# Tech Tools 360 — Phase 1 launch audit

Audit date: 13 October 2026 (Asia/Karachi). Scope: existing repository and sampled public deployment at https://techtools360.vercel.app/. No application source, dependency, advertising, or deployment changes were made. This document records findings; it does not authorize Phase 2.

## Executive assessment

Keep the existing architecture. It already provides 18 browser tools, static route generation, useful shared components, local PDF processing, image queues, and a meaningful unit suite. A rebuild would delay the launch without addressing the actual defects.

The public deployment is inconsistent with this checkout and advertises three different hostnames through page delivery, canonical links, and discovery files. Resolve deployment identity before submitting a sitemap or promoting the site. Local production build and basic routes passed, but signature uploads, file resource lifecycle, bounded processing, and honest output descriptions need attention before treating the full catalog as reliable.

### Evidence labels

- **Confirmed / executed:** observed through a command, HTTP response, browser check, or direct fixture reproduction.
- **Confirmed / source:** a concrete behavior or missing safeguard visible in the current code. This does not imply every consequence was reproduced.
- **Recommendation / unverified risk:** an improvement or scenario needing further verification. These are not claimed vulnerabilities or measured production failures.

## Verification performed and limits

- `npm run lint`: exit 0, no reported warnings or errors.
- `npm test`: initially blocked by Windows sandbox `spawn EPERM`; this was an execution restriction, not 23 proven test defects.
- `node --test --test-isolation=none`: 120 tests passed, 0 failed. Because this mode shares a process, it is not a substitute for verifying the normal isolated command in CI.
- `npm run build`: initially compiled but failed while spawning page-data workers. Repeated with the process restriction lifted: exit 0; 31 generated pages, including all 18 tools and four live categories.
- `npm audit --omit=dev --json` and `npm audit --json`: both reported zero known vulnerabilities. This is the advisory result at audit time, not proof that dependencies are vulnerability-free.
- Local production server on `127.0.0.1:4317`: home, about, privacy, contact, 18 tool URLs, and four category URLs returned 200. Unknown tool and category returned 404. Valid pages had one H1; tool JSON-LD parsed successfully. Tools had WebApplication graphs; PDF-to-JPG also had FAQPage.
- `/robots.txt`, `/sitemap.xml`, `/ads.txt`, and `/pdf.worker.min.mjs` returned 200 locally. Worker response was 1,265,413 bytes; the copied worker is present in this installation.
- All 18 local tool empty states were checked at a 390 × 844 CSS-pixel viewport: document width was 390px, with no horizontal page overflow. This does not validate populated workspaces, landscape phones, zoom, or real-device performance.
- Chromium fixture-selection smoke checks covered all 14 file tools, including `svg/malicious.svg`. No page exceptions or observed external/non-GET requests occurred in these sampled selections. This is not an exhaustive privacy certification.
- Representative browser downloads: merge output reopened as 10 pages; compression output reopened as four pages; JPG-to-PDF reopened as one page. Split produced a ZIP with the expected local-file header; its members were not independently decoded in this audit.
- Direct signing reproduction: transparent PNG exported successfully; fixture JPG and WebP both failed with `The input is not a PNG file!`.
- JPG-to-PDF URL instrumentation: one selected image created two URLs without revocation; rotating it created a third without revocation.
- Public HTTP sampling confirmed deployment branding and URL drift, detailed below. Public user-file processing was not exercised.

No Lighthouse scores, field Core Web Vitals, coverage percentage, long-running heap profile, full browser matrix, full existing Playwright verifier run, AdSense approval, Search Console state, or analytics account access is claimed. A first ad hoc download check used a wrong button selector and timed out; the corrected four-flow check completed successfully. No failure from that selector attempt is attributed to the product.

## Current architecture

### Routing and rendering

`src/app` contains Next.js App Router pages for `/`, `/about`, `/privacy`, `/contact`, `/tools/[slug]`, and `/tools/category/[category]`, plus sitemap and robots generators. There are no product API routes, upload endpoints, server actions for files, database, authentication, or payment implementation in the inspected tree.

`src/app/tools/[slug]/page.js:10` derives static parameters from live tools, disables unknown dynamic parameters, generates per-tool metadata, and renders a server-side title, breadcrumb, trust text, and optional editorial content. `src/components/layout/ToolRenderer.js:9` loads each interactive implementation with `next/dynamic`, `ssr: false`. Files are selected and processed inside those client components. Implementation files named `src/tools/**/page.js` are imports, not additional App Router URLs.

`src/data/tools-data.js` aggregates 11 category modules, assigning live/planned/disabled status. `src/data/toolsDataUtils.js` filters the catalog for home cards, category lists, related tools, static paths, and the sitemap. `SHOW_COMING_SOON=false` prevents unfinished tools being exposed. There are 18 live tools, 79 planned entries, and additional disabled entries with reasons. Only four categories currently contain live tools.

`src/config/site.js` centralizes brand, contact address, canonical base, and a fixed last-update date. `src/config/toolPageConfig.js` controls descriptions, trust text, editorial content, and FAQ schema. `src/content` separates page copy and tool-specific copy from layout.

### File engines and shared services

- `pdf-lib`: PDF merging, splitting, rewriting, rotation, organization, numbering, image embedding, signature stamping. Its exports run in the client; there is no custom export worker.
- PDF.js: local byte-array parsing and previews. `src/hooks/usePDFJS.js:14` sets a same-origin worker path; `scripts/copy-worker.mjs` copies the matching installed worker on postinstall. No actual CDN fallback is implemented despite the hook comment.
- Canvas / ImageBitmap / OffscreenCanvas: image decode, resize, rasterization and encode. An OffscreenCanvas created in a client utility is not automatically a separate application worker.
- `client-zip`: browser ZIP generation. `file-saver` and temporary anchor URLs implement downloads.
- `useImageBatchQueue`, `useTrackedObjectUrls`, and shared image helpers provide sequential work, between-item yields, stale-generation invalidation, filename collision handling, and URL cleanup for the newer image tools.
- `pdfPageUtils.js` centralizes newer PDF export operations and crop-box/rotation-aware numbering. Rotate, organize, and numbering tools have more explicit task/document/render cleanup than the older thumbnail hook.
- `ToolAdFrame` supplies an ad-pause context. Ads are disabled; placeholders remain rendered in production.

### Dependencies

Manifest: Next `^16.3.8`, React/React DOM `^19.3.0`, Tailwind/PostCSS 4, PDF.js `^6.3.289`, pdf-lib `^1.17.1`, dnd-kit, client-zip, file-saver, react-icons, plus the apparently unused packages below. `package-lock.json` is present. Installed Next declares Node `>=20.9.0`; installed PDF.js version is 6.3.289. Next font imports are built through `next/font/google`; this is separate from user-file processing and is not evidence that files are sent to Google.

## Implemented features and exposure

All entries below have `available=true`, a renderer import, page configuration, generated tool route, home/category exposure, and local sitemap membership. No implemented tool missing from the live registry or renderer was found. Exposure verification is separate from functional correctness.

### PDF tools — `/tools/category/pdf-tools`

1. `/tools/merge-pdf` — ordered multi-file merge, previews, drag and arrow reordering, PDF download. Implementation: `src/tools/pdf/merge-pdf/components/MergePDFTool.js`; export: `src/components/utils/pdfUtils.js`.
2. `/tools/split-pdf` — nonoverlapping custom ranges or fixed-size groups, thumbnail previews, ZIP download. Implementation: `src/tools/pdf/split-pdf/components/SplitPDFTool.js`.
3. `/tools/compress-pdf` — one-file metadata clearing and object-stream rewrite, output size display, PDF download. Implementation: `src/tools/pdf/compress-pdf/components/CompressPDFTool.js`. This is not image recompression.
4. `/tools/pdf-to-jpg` — selectable pages, resolution scale and JPEG quality, individual JPG or ZIP. Implementation: `src/tools/pdf/pdf-to-jpg/components/PdfToJpgTool.js` and `pdfToJpgUtils.js`.
5. `/tools/jpg-to-pdf` — image rotation and arrow ordering, page size/orientation/margins, combined PDF or individual PDFs in ZIP. Implementation: `src/tools/pdf/jpg-to-pdf/components/JpgToPdfTool.js` and `jpgToPdfUtils.js`.
6. `/tools/sign-pdf` — drawn/typed/uploaded signature images, date stamps, placement and resizing, PDF download. Implementation: `src/tools/pdf/sign-pdf/components/SignPDFTool.js` and `signPdfUtils.js`. It stamps images; it does not produce certificate-backed digital signatures.
7. `/tools/rotate-pdf` — selected/all page rotation, existing rotation preservation, PDF export. Implementation: `src/tools/pdf/rotate-pdf/components/RotatePDFTool.js`.
8. `/tools/organize-pdf` — reordering, duplication, deletion, rotation, bounded undo history, PDF export. Implementation: `src/tools/pdf/organize-pdf/components/OrganizePDFTool.js`.
9. `/tools/add-page-numbers` — range, start number, format, position, font/color/margin, cover skip, mirrored odd/even placement and PDF export. Implementation: `src/tools/pdf/add-page-numbers/components/AddPageNumbersTool.js`.
10. `/tools/compare-pdf` — aligned side-by-side, overlay, pixel difference map, page thumbnails, zoom and keyboard shortcuts. Implementation: `src/tools/pdf/compare-pdf/components/ComparePDFTool.js`. It compares rendered pixels, not semantic text or authenticated document changes.

### Image tools — `/tools/category/image-tools`

11. `/tools/image-compressor` — batch JPEG/PNG/WebP, quality, downscale, format/background settings, savings, individual and ZIP download. Implementation: `src/tools/image/image-compressor/components/ImageCompressorTool.js`.
12. `/tools/image-resizer` — pixel/percentage/preset dimensions, aspect lock, contain/cover/stretch, batch download. Implementation: `src/tools/image/image-resizer/components/ImageResizerTool.js`.
13. `/tools/image-converter` — JPEG/PNG/WebP/GIF/BMP/AVIF inputs, browser-dependent decode, JPEG/PNG/WebP outputs, batch/ZIP download. Implementation: `src/tools/image/image-converter/components/ImageConverterTool.js`; supported targets: `imageConverterData.js:9`. GIF/BMP are not output formats.
14. `/tools/svg-to-png` — file/paste SVG, script/reference stripping, dimension/scale/background choices, PNG/ZIP export. Implementation: `src/tools/image/svg-to-png/components/SvgToPngTool.js` and `svgToPngUtils.js`.

### Finance and writing

15. `/tools/percentage-calculator` — percentage modes, validation, formula explanations; `src/tools/finance/percentage-calculator`.
16. `/tools/loan-emi-calculator` — fixed-rate EMI, monthly/yearly amortization, currency display, CSV download; `src/tools/finance/loan-emi-calculator`. It is an estimate without lender-specific fees or varying rates.
17. `/tools/age-calculator` — calendar age and intervals, selected comparison date, leap-day handling; `src/tools/finance/age-calculator`.
18. `/tools/word-counter` — multilingual segmentation, characters/words/sentences/paragraphs/lines, keywords, reading/speaking time and copy; `src/tools/writing/word-counter`. Catalog category is `writer-blogging-tools`, not finance.

## Confirmed issues with exact references

### A01 — P0: deployment URL and branding drift [resolved in Phase 2]

Public `/` returned title `Tools360 | Simple PDF Tools`; this checkout builds `Tech Tools 360 | Free PDF, Image & Calculator Tools`. Sampled public merge, image-resizer, word-counter and category pages canonicalize to `https://tools360.com/...`. Public `/sitemap.xml` lists 26 URLs under `https://techtools360.com.pk`; public `/robots.txt` advertises `https://tools360.com/sitemap.xml`. The actual sampled delivery host is `techtools360.vercel.app`.

Local configuration is coherent: `src/config/site.js:6`, `src/app/tools/[slug]/page.js:32`, `src/app/tools/category/[category]/page.js:23`, `src/app/sitemap.js`, `src/app/robots.js`. The specific remote commit and Vercel environment settings were not accessible. This is confirmed deployed inconsistency, not a claim that those local files currently generate the wrong hostname. Select the authoritative host, review build environment/commit, and verify the resulting deployment. External domains' ownership and redirects were not checked.

### A02 — P0: accepted signature formats fail export [resolved in Phase 2]

`src/tools/pdf/sign-pdf/components/SignatureModal.js:92` reads the original upload as a data URL; line 318 accepts PNG, JPEG and WebP. `src/tools/pdf/sign-pdf/signPdfUtils.js:119` always calls `embedPng`. PNG succeeded and JPG/WebP failed in direct fixture export. Normalize accepted images to PNG locally or embed supported formats deliberately; apply byte/pixel limits, decode checks, and read errors before allowing placement.

### A03 — P0: JPG-to-PDF object URLs leak [resolved in Phase 2]

`src/tools/pdf/jpg-to-pdf/components/ImagePreviewGrid.js:67` creates a fresh URL in render, with no revocation. `src/tools/pdf/jpg-to-pdf/jpgToPdfUtils.js:30` creates another URL for image loading without success/error cleanup. Browser instrumentation confirmed counts increased on rotation with zero revocations. Reuse the existing tracked URL helper or equivalent lifecycle-managed URLs; release decode URLs, preview URLs, and references on remove/reset/unmount.

### A04 — P0: secondary image selection bypasses safeguards [source]

`src/tools/pdf/jpg-to-pdf/components/JpgToPdfTool.js:62` sends the hidden “Add Images” input directly to `handleUpload`; line 32 filters loosely by `image/*`/extension but applies no size, total byte, count, or decoded-pixel limit. The initial `FileUploader` at line 159 has its default 10MB per-file limit; the secondary path does not. `SignatureModal.js:92` similarly lacks size/type/decode enforcement beyond an HTML accept hint. Apply validation at the common processing boundary, not only the visible first picker. A specific browser OOM was not reproduced.

SVG paste is another unbounded entry path: `src/tools/image/svg-to-png/components/SvgPasteArea.js:25` parses on every text change without the file picker’s 5MB limit or a debounce; `SvgToPngTool.js:215` accepts the sanitized pasted item subject only to count. Apply text-byte/complexity bounds before DOM parsing and queue insertion as well.

### A05 — P0: older PDF thumbnails have incomplete lifecycle [resolved in Phase 2]

`src/hooks/useThumbnails.js:40` opens every selected PDF concurrently; both modes load PDF.js documents without destroying loading tasks/documents or canceling render tasks. Its effect has no cleanup return. A generation guard protects some state writes, but `setTotalPages` at line 70 can run for stale work, and loops continue after replacing/removing a file. Merge, split and compress use this hook. Fix cancellation, generation checks, document cleanup and bounded concurrency together; test replacement during `arrayBuffer`, load and render, including unmount.

### A06 — P0: file byte limits do not bound processing memory [source]

Merge accepts unlimited appended files (`MergePDFTool.js:25`, picker at line 91 has no `maxFiles`). JPG-to-PDF accepts unlimited accumulated images. `pdfToJpgUtils.js:40` allocates the page viewport without a pixel-area cap. `imageConverterUtils.js:202` renders original dimensions; `imageCompressorUtils.js:72` keeps original dimensions for “none,” with no universal area cap. Modern resizer/SVG cap each output side at 8192, but a square RGBA canvas at that size alone is about 256MiB, excluding decoded inputs and copies. Image batches allow 30 × 25MiB input; SVG batches allow 20 × 5MiB.

Add conservative total input bytes, file/page counts, source/output pixel-area budgets and explicit failure messages. Choose limits through real-device checks rather than treating current constants as measured safe limits. Avoid eager rendering of all PDF pages. There is no measured crash threshold in this audit.

### A07 — P1: compression claim exceeds implementation [source]

`src/tools/pdf/compress-pdf/components/CompressPDFTool.js:22` clears basic metadata and saves with object streams; `compress: true` at line 40 is not a supported pdf-lib SaveOptions field and is ignored by the installed save implementation. No scanned-image downsampling/recompression is present. `src/data/tools/pdf-tools.js:27` promises reduction without explaining limits. The small multipage fixture did shrink (2453 to 2403 bytes in direct reproduction; browser result 2405 bytes), which does not establish effectiveness on scanned PDFs. Label the operation honestly, report unchanged/larger results, and avoid promising guaranteed savings. Preserve readable text and quality; do not replace this with silent destructive rasterization.

API reference: [pdf-lib SaveOptions](https://pdf-lib.js.org/docs/api/interfaces/saveoptions). The installed `node_modules/pdf-lib/es/api/PDFDocument.js:1246` also confirms the actual options consumed.

Task 5 local change: removed the unsupported `compress` save option, described the operation as a local PDF rewrite, and added separate user-visible messages for smaller, unchanged and larger outputs. The implementation still does not recompress embedded scanned images. Production verification is pending.

### A08 — P1: inaccurate PDF-to-JPG DPI labels [source]

`src/tools/pdf/pdf-to-jpg/components/PdfToJpgOptionsBar.js:70` labels 1x/1.5x/2x as roughly 96/150/300 DPI. `pdfToJpgUtils.js:33` simply multiplies PDF.js viewport dimensions. For a standard 612-point page width, those scales produce 612/918/1224 pixels, corresponding to 72/108/144 pixels per physical inch. Canvas JPEG density metadata is a separate concern. `src/content/tools/pdf-to-jpg.js:28` and :49 repeat the labels; Markdown bold markers in tips are rendered as ordinary text. Use accurate pixel scales or implement and verify an explicit DPI conversion.

Task 5 local change: labels now describe the 72/108/144 pixel-per-inch equivalents and explain that JPEG output stores pixel dimensions without a guaranteed print-DPI metadata value. Production verification is pending.

### A09 — P0: metadata-removal assurance is false for pass-through images [source]

`imageConverterUtils.js:130` returns the original file when its format matches the target, including metadata and, after a decode failure, potentially invalid content. `src/tools/image/image-converter/components/ConverterOptionsBar.js:33` says “Metadata stripped.” `imageCompressorUtils.js:202` may preserve the original when larger re-encoding is avoided; `ImageCompressorOptionsBar.js:32` says metadata/EXIF is stripped. This can mislead a user preparing sensitive photos for sharing. Correct conditional copy or provide an explicit always-reencode sanitization mode with metadata assertions. No external transmission was observed.

Task 5 local change: same-format and already-optimized paths now disclose retained original bytes and metadata, while re-encoded outputs disclose that source metadata is not copied. Corrupt same-format inputs continue to fail during decode validation. Production verification is pending.

### A10 — P1: signing UX and accessibility defects [source]

`SignatureModal.js:36` and :61 use CSS pointer coordinates without scaling to the canvas's 460 × 180 intrinsic pixels; the canvas at :195 has `w-full`. Drawing coordinates therefore diverge when the pad is displayed narrower on mobile. The modal at :125 has no dialog role, accessible title connection, initial focus, focus containment/restoration or Escape handling; its typed input label is not associated with an ID, and its upload input is `hidden`. `PlacedSignatureItem.js:150` supplies mouse/touch drag but no keyboard position/resize controls. Correct these within the existing UI. Signed-export placement for nonzero crop boxes and rotations needs visual regression coverage; it was not certified here.

### A11 — P1: asynchronous UI can outlive current inputs [source / risk consequence]

`JpgToPdfTool.js:70`, :81 and :102 allow editing while conversion runs and do not invalidate that in-flight work. `JpgToPdfOptionsBar.js:43` keeps output-mode controls active; only Convert is disabled. Result download uses current `isZipMode` at `JpgToPdfTool.js:129`, while bytes were created using the earlier conversion state. Settings are hidden after success, so this is an in-flight race, not a normal after-success settings flow. Older merge/split/compress export callbacks also lack a cancellation/generation contract. Snapshot options/result type, disable incompatible mutations or cancel/discard stale results. A wrong-extension race was not reproduced in this audit.

### A12 — P1: PDF.js initialization failures are not actionable [source]

`src/hooks/usePDFJS.js:19` logs import failure and clears loading without returning an error/retry state. Several tools wait for `pdfjs` indefinitely after file selection. `scripts/copy-worker.mjs:8` silently succeeds if the source worker is absent; only postinstall copies it and the generated public worker is ignored. The worker worked in this local build, but a lifecycle-skipped install can ship a missing/stale worker. Fail explicitly, validate worker version/existence in CI/build checks, and expose a recoverable error in dependent tools.

### A13 — P1: sparse server-rendered instructions and canonical gaps [source and executed]

Only PDF-to-JPG has a tool editorial module and `hasSeoContent=true` (`src/content/tools/index.js`, `src/config/toolPageConfig.js:17`). The other 17 do not have equivalent server-rendered how-to, limitations, output semantics and FAQ content. Some client tools contain instructions, so they are not all content-free. Useful task-specific guidance remains thin and dependent on JS. Home and about/privacy/contact lack explicit canonicals (`src/app/page.js`, `src/app/layout.js:17`, and their page metadata); absence was confirmed in local HTML. Add concise distinct guidance, accurate limitations, and self-canonicals. No ranking penalty or traffic impact is asserted.

Task 7 local update (not yet released): the current route already has self-canonicals for home, information, category, and tool pages. The remaining content issue was generic FAQ/instructions on some tools and absent server-rendered guidance on others. The Task 7 branch replaces that filler with per-tool steps and limitations for all 18 live tools, adjusts misleading output/privacy copy, and removes unsupported FAQ markup. Production verification and Search Console setup remain pending.

### A14 — P1: empty advertising reservations waste workspace [source]

`src/components/layout/ToolLayout.js:136` always dedicates a 300px desktop sidebar even with `ADS_ENABLED=false`. `AdSlot.js:117` renders labeled empty placeholders in production. This reduces working width and leaves ad space without revenue; it is not an activated ad. Preserve the scaffold but gate inactive inventory before launch. Ad readiness gaps are enumerated in MONETIZATION_READINESS.md.

### A15 — P1/P2: dependency, documentation and duplication drift [source]

- `package.json:19`, :26, :28: no imports of `downloadjs`, `react-dropzone` or `react-pdf` were found in application/scripts/tests. They appear removable after dependency/build verification; installed packages are not necessarily shipped to clients merely because listed.
- `package.json:35`: eslint-config-next 15.4.4 differs from Next 16.3.8. Lint passed, so this is maintenance drift, not a demonstrated failure.
- `README.md:40` recommends Node 18+, below installed Next's Node >=20.9 requirement. README says three categories although there are four live catalog categories, and its converter wording implies GIF/BMP output.
- `docs/HOW_TO_ADD_A_TOOL.md:24` and :59 describe editing inline raw catalog data and a switch-case renderer; current code uses category modules and a dynamic import map. `docs/ARCHITECTURE.md` includes a nonexistent legacy `[slug]` route and a calculator directory where actual tools use `finance`/`writing`.
- Old/new PDF preview components coexist (`src/components/pdf/PDFPreviewItem.js`, `src/tools/pdf/compress-pdf/components/PDFPreviewItem.js`), as do size-formatting functions and multiple download patterns. Compare pixel-diff assertions are duplicated between `src/components/utils/pdfUtils.test.js` and `tests/compareUtils.test.mjs`. Consolidate incrementally after regressions, not as a prelaunch rewrite.
- `ImagePreviewGrid.js:36` says drag reordering is available, but this component implements arrow controls without drag handlers. Fix the instruction or add the supported interaction later.

## Privacy and security assessment

### Confirmed strengths

No file-upload fetch/XHR/FormData/server-action path was found in application source. FileReader/arrayBuffer read local inputs, PDF.js receives bytes, and results use Blob/data URLs and browser downloads. No active ad or analytics script is present in root layout. Modern tracked URLs and queue cleanup support safe local resource handling. Protected/corrupted PDFs have dedicated handling in several tools, and merge rejects unreadable input instead of silently downloading a partial result (unit verified).

### Recommendations and remaining risks

- Preserve the distinction between “files never uploaded” and “no network activity”: the app fetches ordinary scripts/fonts/workers and hosting observes page requests. Hosting logs and future analytics need truthful policy wording.
- `svgToPngUtils.js:118` returns unsanitized input if DOMParser is missing. Its browser sanitizer blocks common HTTP/protocol-relative href/style values but is not a strict allowlist: relative/root-relative URLs, other schemes, CSS escapes, and URL-valued presentation attributes are not comprehensively excluded. SVG is rendered through an image URL rather than inserted into page DOM; do not equate this gap with demonstrated script execution or exfiltration. Strengthen to permitted embedded raster resources and local fragment references, fail closed, and test a broader corpus plus actual request observation.
- `parseSvgDimension` at line 45 parses numeric prefixes without converting physical units or percentages. `width="10mm"` becomes 10, not its CSS pixel equivalent. Fix dimension semantics and test nonfinite viewBox origins. Expansion/complexity limits are also prudent.
- No application-defined CSP/security-header policy is configured in `next.config.mjs`. Hosting may add headers, which were not comprehensively assessed. Evaluate a compatible CSP including worker/blob/data needs, restrictive connections, frame/object restrictions and referrer policy. Never claim CSP alone proves privacy.
- Future third-party scripts in a tool page execute with page privileges and can access DOM/state-exposed data. An iframe ad creative is not a guarantee that its parent loader cannot inspect the page. The strongest initial deployment is ad-free processing workspaces, with any monetization confined to approved content areas under a tested integration.
- PDF rewriting/copying is not secure redaction, sanitization, or preservation of certificate signatures. Existing signatures, forms, outlines and document-level features need an explicit supported-behavior policy and fixtures. Do not advertise guarantees that only page-copy tests cannot support.
- Avoid logging file names/content into future remote error reporting; scrub stack context, breadcrumbs, screenshots and session replay. Current console errors are local, but forwarding them could change the privacy model.

## SEO, internal links and performance

Local strengths: live-only sitemap (26 entries: four static pages, four categories, 18 tools), robots allow crawling, tool/category self-canonicals, unique tool titles, root metadataBase, English document language, visible breadcrumbs, related-tool links, and server-rendered navigation/cards. Planned/disabled tools are not promoted as working pages. Fixed `SITE_LAST_UPDATED` avoids a timestamp changing on every sitemap call; there are no per-tool update dates yet.

Recommendations: add home/information-page canonicals, verify authoritative-host redirects and trailing slash behavior on the actual deployment, provide a branded share image (large-image Twitter cards currently have no specified image), and optionally add truthful Organization/BreadcrumbList schema. Do not add fabricated ratings or expect FAQ markup to guarantee a search feature. Verify present Google feature support before spending time on additional schema; visible useful answers matter independently.

PDF.js is dynamically loaded and the worker is same-origin. Core HTML is statically generated, which is a good launch foundation. Remaining performance risks are eager all-page previews, parallel legacy parsing, base64 preview storage, repeated whole-thumbnail-array copies, decoded pixel amplification, accumulated ZIP buffers, and main-thread PDF/image/pixel-diff work. `useImageBatchQueue` yields between items and discards stale results but cannot interrupt an already running encode. `WordCounterTool.js:29` debounces work but still analyzes text on the main thread; the million-character unit test completed in about 694ms on this host, not a mobile INP measurement.

Measure LCP/INP/CLS and task durations on realistic devices before introducing custom workers everywhere. Virtualize/lazily render page grids first; move proven costly pure operations into workers incrementally, preserving local processing. Reserved ad dimensions are preparation, not measured CLS compliance with actual creatives.

## Current tests and critical coverage gaps

There are 23 discovered Node test files and 120 passing assertions in the executed alternative mode. Coverage includes catalog/content/config invariants, merge failures and page counts, percentage/age/EMI math, multilingual word statistics, pixel diff helpers, page rotations, numbering/crop-box math, organization/export, image sizing/format selection, queue helpers, URL tracking and filename/ZIP helpers. JPG-to-PDF DOM behavior is mocked; SVG unit tests mostly cover dimension/filename logic rather than an actual DOM sanitizer. Signature tests cover constants and data conversion, not all export formats/placement.

Existing Playwright scripts under `scripts/verify-*.mjs` cover numerous image/PDF/calculator/ad-slot scenarios and some request monitoring. They are standalone scripts, not run by `npm test`; no committed shared Playwright configuration or CI workflow was found. Some use fixed ports/hosts and historical output directories outside the repository (`scripts/verify-wave0.mjs:15`, `verify-wave05.mjs:16`). Their existence is not evidence they currently pass. This audit used ad hoc read-only browser checks instead of executing those external-writing scripts.

The test named “canonical toolsData equality with pre-split baseline” in `tests/staticDataIntegrity.test.mjs:105` reads a historical absolute-path baseline only if it exists. When absent, the test passes without comparing anything and without reporting a skip. Commit a portable fixture or make the missing prerequisite explicit; the 120-pass count must not be interpreted as proof that this external baseline comparison ran.

Critical next coverage:

1. Every file tool: local input, valid reopened output where applicable, zero file-bearing network requests (including GET query strings, beacon, WebSocket, workers and future telemetry), and request allowlist monitoring. Merely asserting no POST is insufficient.
2. Signature JPEG/WebP/PNG, corrupt/oversized images, mobile drawing alignment, keyboard placement, crop-box offsets and 0/90/180/270 exported visual positions.
3. URL/task cleanup, rapid replace/reset/unmount, clear during export, option changes during export and stale downloads.
4. Shared picker and “Add Images” parity: empty files, wrong MIME/extension, corrupt decode, total batch limits, huge dimensions, huge page boxes and page counts.
5. Split exact boundaries, fixed groups, overlapping ranges, encrypted/corrupt inputs, actual ZIP members/pages; compression larger/no-savings cases and preservation behavior.
6. Image transparency, EXIF orientation, retained-versus-stripped metadata, same-format corrupted inputs, unsupported WebP encode fallback, animated GIF first-frame behavior and Unicode/duplicate ZIP names.
7. Ad scaffold disabled paths, consent denial/withdrawal, approved initialization exactly once, route transitions, blocked scripts, zero-width slots and filled/unfilled inventory before activation.
8. Populated mobile layouts, keyboard-only flows, focus, accessible names/status messages, zoom and Firefox/WebKit plus a real iOS download smoke test.
9. Deployed URL/canonical/robots/sitemap agreement, unknown routes, broken internal links, schema parsing and production worker delivery/version.

## Launch decision

The static application shell, registry wiring, local-file architecture, canonical generation for local tools/categories, unit-tested helper behavior, and four sampled download flows provide a solid base. They are verified foundations, not a certification of all 18 tools.

Before broad launch: complete the unified processing bounds work in Task 4, close the remaining accessibility/content/privacy-claim checks, and run the release acceptance checks in LAUNCH_ROADMAP.md. Content/accessibility improvements can be staged by tool, but misleading claims and inability to complete a supported workflow should not remain public promises. New tools, custom workers for unmeasured bottlenecks, broad refactors and advertising can wait.

Single highest-priority remaining task: define and enforce unified file-processing bounds across every file-entry path. The hostname, deployed commit and public metadata/discovery files were reconciled by the completed Phase 2 tasks.

## Phase 2 Task 6 local status — 15 October 2026

Confirmed UI findings addressed locally: production no longer renders empty ad slots or reserves the disabled desktop sidebar; reduced-motion preferences are honored; and the Sign PDF signature modal now exposes dialog semantics, keyboard focus containment/restoration, Escape close behavior, accessible method/color controls and an associated typed-signature label. Production verification and populated cross-device accessibility checks remain pending.

## Phase 2 verification update — 14 October 2026

The following audit findings are resolved in production and should not be treated as current blockers:

| Finding | Status and evidence |
|---|---|
| A01/A13 hostname and deployment identity | Resolved by PR #3 and production merge `4828b1b`; live representative pages, robots and sitemap use `https://techtools360.vercel.app`. |
| A02/A10 Sign PDF image ingestion | Resolved by PR #4 and production merge `98216ed`; validated PNG/JPEG/WebP handling and existing drawn/typed flows are covered by the release tests. A04 remains open for the secondary image-picker validation gap. |
| A03 JPG-to-PDF object URLs | Resolved by PR #5; preview and decoding URL ownership is deterministic and measured cleanup reaches 10/10 after delayed download cleanup. |
| A05 PDF.js thumbnail lifecycle | Resolved by PR #5; loading-task, render-task and document cleanup are implemented and covered by controlled lifecycle tests. |
| A11 stale asynchronous output | Resolved by PR #5; conversion snapshots and generation guards reject stale completions after replacement/reset. |
| A12 PDF.js initialization errors | Resolved by PR #5; initialization failures expose an actionable message and retry path, with deterministic failure/recovery tests. |

Production merge evidence: PR #5 merged as `a34a6beebed413a480d79806d07bc5d3fc9eb9ee`; Vercel reported Ready for that commit. Live checks returned 200 for home, information pages, representative PDF/image tools and category pages; unknown tool routes returned 404. Canonicals and Open Graph URLs matched the production origin, robots referenced the production sitemap, and the sitemap contained 26 production-origin entries.

Remaining confirmed launch work is concentrated in unified file-processing bounds (A04/A06), populated mobile/accessibility checks, content completeness, privacy/claim alignment and reproducible cross-browser release checks. No full heap-memory safety guarantee is claimed from URL counters or unit tests alone.
