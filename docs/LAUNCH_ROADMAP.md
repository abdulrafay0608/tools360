# Tech Tools 360 — launch roadmap

Prepared 13 October 2026. This is a proposed implementation sequence, not authorization to implement Phase 2. Preserve the current Next.js application, registry, components and browser-only file processing. No rebuild, upload API or ad activation is needed to launch.

Audit IDs refer to LAUNCH_AUDIT.md. Estimates are planning ranges for one engineer familiar with this codebase, including meaningful regression checks. They are not delivery commitments; complex PDFs, real-device access and deployment/account permissions can extend them.

## P0 — release blockers (historical plan; Tasks 1–3 complete)

### 1. ✅ Complete — Reconcile the production deployment and authoritative URL

Dependency: owner decision on the primary hostname and access to Vercel deployment/environment configuration. Public observations show `techtools360.vercel.app`, `tools360.com` canonicals and `techtools360.com.pk` sitemap entries; ownership of the other domains is unverified. Local `SITE_URL` already centralizes URL generation.

Work: confirm intended host and current deployed commit; review `NEXT_PUBLIC_SITE_URL`; prepare a reviewed production candidate, add missing page self-canonicals, and verify metadata after deployment. If moving hosts, establish owned-host redirects and a deliberate migration plan. Do not canonicalize to an unverified domain. Audit: A01, A13.

Acceptance:

- Home, information pages, every live tool, categories, Open Graph URLs, robots sitemap directive and every sitemap entry agree with the intended primary origin.
- All live routes and assets work from the deployed build; unknown routes return 404.
- Public branding matches Tech Tools 360 and the reviewed repository.
- Deployment commit/environment evidence is recorded; Search Console submission follows this verification.

Estimate: 0.5–1.5 days of engineering, excluding access delays. This is the single highest-priority task. Deployment itself remains outside Phase 1.

### 2. ✅ Complete — Repair signature image ingestion and output

Dependency: existing Canvas and pdf-lib; no new package required. Normalize JPEG/WebP/PNG to a validated local PNG with file-byte and decoded-pixel limits, or deliberately support embedding by format. Add read/decode errors and a bounded signature canvas. Audit: A02, A10. The remaining cross-tool picker bounds are covered by Task 4 (A04, A06).

Acceptance: all advertised formats produce a readable stamped PDF; corrupt/disallowed/oversized images fail clearly before placement; no file content leaves the browser. Verify positions on rotated and offset-crop PDFs, desktop and phone layouts. Typed/drawn PNG behavior remains intact. State clearly that this is a visual signature stamp.

Estimate: 1–2 days, longer if placement regressions need repair.

### 3. ✅ Complete — Make file resources and asynchronous results reliable

Dependency: existing tracked URL and queue patterns. Fix JPG-to-PDF URL ownership, older PDF thumbnail task/document cleanup, stale `totalPages` updates and unmount behavior. Snapshot output options/type; cancel or disable incompatible edits during exports; discard stale results after reset/replacement. Audit: A03, A05, A11, A12.

Acceptance: create/revoke counts balance for released URLs after remove/reset/unmount; active URLs remain usable until no longer needed; PDF loading/render tasks are canceled or destroyed; no old thumbnail/error/download appears after replacement. Normal reorder, rotate, retry and download flows still work. Worker/import failure produces an actionable error, and missing worker artifacts fail release checks.

Estimate: 2–3 days. Keep changes focused on existing hooks and tool orchestrators rather than introducing a new framework.

### 4. Bound every file-processing entry path

Dependency: resource-lifecycle work and realistic fixture/device checks. Centralize validation used by both initial and secondary pickers. Set count, total-byte, per-file, decoded-image-area, rendered-page-area and page-count policies; reject unsupported files before allocation where practical. Replace eager legacy parallel/all-page rendering with bounded work. Audit: A04, A06.

Acceptance: limits apply cumulatively across repeated adds and every input path; huge page/image dimensions produce a clear error; input MIME/extension hints do not replace actual decode; valid supported files still export without silent omission. Measure one large but supported workload on a midrange phone and desktop, and document the selected limits. Add cancellation checkpoints; do not imply synchronous encoding is interruptible if it is not.

Estimate: 1.5–3 days. Do not promise an exact memory ceiling before measurements.

### 5. 🚧 In progress locally — Make output/privacy claims match actual results

Dependency: no external service. Correct pass-through metadata statements; fail same-format corrupt-image decoding rather than marking success; explain PDF rewrite savings and correct PDF-to-JPG pixel/DPI labels. Specify unsupported animated/HEIC outputs and financial/signature limitations. Audit: A07–A09.

Acceptance: a retained original is explicitly identified as retaining metadata; a promised metadata-removal path is tested against metadata-bearing fixtures. Compression reports no savings/larger output honestly. Displayed resolution matches exported dimensions for a known physical PDF page. Shared UI, catalog descriptions and editorial content agree. No guaranteed traffic, earnings, compression ratio or legal validity claims.

Estimate: 0.5–1.5 days for copy/behavior alignment; additional sanitization features can be scoped separately.

Task 5 local status: the PDF rewrite path no longer passes an unsupported pdf-lib option; its UI distinguishes smaller, unchanged and larger rewrites and explains that scanned images are not recompressed. Image converter/compressor disclosures now distinguish re-encoded outputs from retained originals and their metadata behavior. PDF-to-JPG labels use 72/108/144 pixel-per-inch equivalents for the 1x/1.5x/2x point scales, and privacy copy distinguishes local file processing from ordinary site-asset requests. Production verification is pending; this local branch is not a completed release.

## P1 — prelaunch quality improvements

### 6. Finish essential accessibility and populated mobile workflows

Use the existing layouts. Repair signature-pad coordinate scaling; provide dialog semantics/focus/Escape behavior, an associated text label, keyboard-accessible upload and keyboard movement/resize alternatives. Check compare/organize selection, error/status announcements, narrow settings columns and touch controls. Fix split's nested `lg:w-2/3`/`lg:w-1/3` inside its explicit grid if populated-layout checks confirm cramped content. Audit: A10, A15.

Acceptance: representative tasks can be completed without a pointer; focus survives dialogs/reset; no populated-page overflow at 360/390/768px or 200% zoom; controls are comfortably operable; iOS users can save/download results. Automated checks complement manual keyboard/device checks.

Estimate: 1–2 days. Launch only tools with an understandable, completable workflow; do not redesign the site.

### 7. Add useful tool content and finish search basics

Reuse `src/content/tools`, `toolPageConfig` and the current server route. Start with merge, split, image compressor, resizer, converter and signing, then complete the other live tools. Include a short task-specific introduction, steps, supported inputs/outputs, limits, privacy handling and genuinely useful answers. Avoid repeated filler. Keep content concise enough that the tool stays prominent.

Acceptance: every live tool explains its actual behavior and failure cases in crawlable HTML; content and any schema agree; titles/descriptions/canonicals are valid and distinct; internal links resolve only to live pages. Sitemap stays live-only and uses truthful change dates. Add a branded share image; extra schema is optional and must not invent reviews/ratings. Submit the verified production sitemap and inspect representative URLs in Search Console.

Estimate: 1.5–3 days of engineering/editorial work, overlapping release verification where practical.

### 8. Harden packaging, documentation and regression execution

Keep the lockfile; update the documented Node requirement and current registration instructions. Align eslint-config-next after compatibility verification. Remove apparently unused downloadjs/react-dropzone/react-pdf only if dependency inspection and fresh build/tests prove safe. Make worker copying/checks explicit. Standardize verifier base URL/output directory, use a shared CI entry point and report failures correctly. Audit: A12, A15.

Acceptance: supported fresh install, normal isolated `npm test`, lint and production build pass; worker version is consistent; reusable Chromium verifiers run with local evidence paths; no accidental writes to historical user directories; critical regressions are part of repeatable release checks. Source registration and renderer drift is detected automatically. Preserve existing test coverage while removing duplicated assertions.

Replace the optional historical baseline at `tests/staticDataIntegrity.test.mjs:105` with a portable fixture or explicit missing-prerequisite result, so a passing suite does not silently omit that comparison.

Estimate: 0.5–1.5 days. Broad component consolidation can wait.

### 9. Privacy defense and baseline performance

Strengthen SVG resource allowlisting/fail-closed behavior and adversarial browser checks. Test compatible security headers rather than adding a policy that blocks necessary local blob/worker/canvas operations. Review PDF.js local font/CMap/WASM asset needs using CJK, standard-font and image-heavy fixtures; do not add remote fallbacks for user processing. Gate disabled ad reservations to restore workspace space.

Acceptance: file-bearing values never appear in network bodies, query parameters, telemetry, replay or logs; malicious SVG fixtures issue no unexpected requests or script execution; static assets remain same-origin; blocked-worker/library conditions recover. Record performance on home plus representative populated tools with a documented device/network profile. Use field Core Web Vitals when sufficient data exists; a Lighthouse lab result alone is not a field result.

Estimate: 1–2 days. Custom workers are a later response to measured blocking, not a prerequisite for all tools.

## Practical order and launch gate

1. Resolve URL/deployment identity first and establish the reviewed production candidate.
2. Fix signing, URLs and task cleanup before expanding supported file sizes.
3. Apply unified bounds and stale-result handling, then align claims.
4. Finish essential accessible/mobile flows and content on the existing components.
5. Make CI/worker packaging reproducible; run final cross-tool output/privacy checks.
6. Deploy the candidate only in an approved implementation phase, recheck actual public HTML/assets, then submit its sitemap.
7. Launch without advertising; observe failures and indexing before expanding the catalog or integrating ads.

A realistic focused launch-hardening pass is approximately 10–15 working days for one engineer, with overlapping content work and a small regression buffer. Do not sum every worst-case task estimate as a guaranteed schedule. Reserve additional time if rotated signing exports or browser compatibility prove more involved. AdSense review timing is external and not part of this engineering estimate.

Release acceptance gate:

- Completed Tasks 1–3 are accepted; Task 4's processing bounds and the remaining launch checks below are complete before broad launch.
- Normal tests, lint and production build pass in the release environment.
- Each of 14 file tools has at least one representative successful workflow with reopened outputs where applicable and a corrupt/unsupported-input case. ZIP members are checked, not just download events.
- Privacy tests cover processing/download/reset with an explicit network allowlist and checks beyond POST; no file-bearing requests or content telemetry.
- Large supported input, over-limit input, rapid replacement and repeated reset do not leave active stale resources/results.
- Chromium plus targeted Firefox/WebKit and actual iOS download checks pass; keyboard and populated mobile workflows have evidence.
- Deployed branding, canonical origin, robots and sitemap agree; all listed routes return intended responses and matching worker assets.
- Advertising remains disabled. Public privacy/contact/about content is accurate.

## P2 — after-launch tools ranked by value and maintenance

These are product judgments based on reuse, task usefulness and engineering cost, not measured keyword demand. Validate demand through actual Search Console queries and feedback. Do not implement all 79 planned entries.

1. **Image cropper / rotate / flip:** strong reuse of current decode/canvas/export and queue code; useful alongside resizer. Medium UI complexity, low-to-medium ongoing maintenance. Estimate 2–4 days. Acceptance: crop geometry, aspect presets, EXIF orientation, transparency, bounds and accessible numeric controls match output pixels. Highest-value next addition if user feedback supports image workflows.
2. **Text case / whitespace / duplicate-line utilities:** natural Word Counter companions. Low complexity and maintenance; 0.5–1.5 days for a focused combined workflow. Acceptance: Unicode-aware behavior, explicit destructive transforms, original-text recovery and no remote processing.
3. **JSON formatter / validator:** useful for developers and support teams; browser-native parsing/stringification, no eval. Low-to-medium complexity, low maintenance; 1–2 days. Acceptance: clear parse errors, large-input limits, precision caveat, copy/download, no execution or telemetry of pasted data.
4. **File checksum calculator:** privacy-aligned integrity utility using local bytes/Web Crypto. Medium complexity, low maintenance; 1–2 days initially. Acceptance: known SHA-256 vectors, binary/text consistency and honest full-buffer memory limits. Do not promise streaming for algorithms/APIs that buffer the input.
5. **PDF text extractor:** reuses PDF.js for searchable PDFs. Medium complexity/maintenance; 2–3 days. Acceptance: page selection/order, Unicode fixtures, local TXT download and explicit “scanned PDFs require OCR” limitation. Never silently send scans to an OCR service.
6. **Image metadata remover:** useful and aligned with the current privacy-claim defect, but fidelity/format/animation behavior must be explicit. Medium complexity/maintenance; 1–3 days. Acceptance: actual metadata-bearing fixtures, orientation preservation, output verification and warning when animation or other data is flattened.
7. **QR generator:** useful, modest interface, low maintenance after an audited encoder is chosen. Medium complexity and possible later dependency decision; 2–3 days. Acceptance: independently decoded output, content never sent to a QR API, robust length/error-correction limits and local PNG download. Dependencies are not added during Phase 1.

Further follow-ups: batch watermarking, color/contrast calculators and epoch/date utilities are reasonable small additions. Favor adding one well-supported workflow and its content/tests at a time.

Defer advanced OCR, background removal models, full PDF editing, DOCX/PPT conversions and legally significant tax calculators until their fidelity, payload and maintenance costs are understood. Remote SEO/network diagnostics do not fit the strict file/text privacy boundary if they require proxying or transmitting user content. Existing disabled reasons are conservative product decisions, not universal claims that browser technology can never support an offline alternative. Do not build a cosmetic PDF redaction tool that merely covers text.

## Postlaunch maintenance and monetization dependencies

Review error categories and indexing weekly initially, using scrubbed aggregate metrics or manual feedback. Track task completion/reliability before adding tools. Set a periodic dependency/worker compatibility review and keep browser fixtures current. Broad preview/download-helper consolidation can follow only after safety regressions exist.

AdSense preparation is a separate postlaunch project governed by MONETIZATION_READINESS.md: useful publisher content, correct identity, account/site review, certified consent where applicable, approved ad code/IDs, privacy separation and real-creative performance/usability checks. None is activated by this roadmap.

## Phase 2 completion update — 14 October 2026

The first three Phase 2 tasks are complete in production:

- **Task 1 — production hostname consistency:** PR #3, production merge `4828b1b02a3380cd2b84f555ea5fd6e67efa6f45`. Live canonical URLs, Open Graph URLs, robots sitemap directive and sitemap entries use `https://techtools360.vercel.app`.
- **Task 2 — Sign PDF image export:** PR #4, production merge `98216edc3132c3b63e1c95a0f5584af554c53408` (head `65a4bd3`). The reviewed implementation supports validated PNG, JPEG and WebP signature inputs while retaining drawn and typed signatures.
- **Task 3 — resource lifecycle:** PR #5, production merge `a34a6beebed413a480d79806d07bc5d3fc9eb9ee` (head `34174ad`). Production smoke tests covered Merge, Split, Compress and JPG-to-PDF; local controlled tests cover URL ownership, PDF.js lifecycle cleanup, stale generations and initialization retry.

Task 3 evidence: `npm test` passed with 112 tests; lint passed with two existing image optimization warnings; production build and `git diff --check` passed. Live smoke tests loaded the four representative tools, completed JPG-to-PDF and Merge workflows, rendered Split pages, and reached the Compress download state. No file-bearing requests were observed. Direct heap-memory guarantees, browser task counters in production, and protected Vercel preview HTML remain limitations.

### Focused UI/UX launch checklist

- Empty, processing, success and error states are understandable at 390px and desktop widths.
- Upload, reset, retry, reorder, rotate, remove and download controls have clear labels and disabled states.
- Processing controls cannot mutate an in-flight snapshot; stale results do not replace current work.
- Populated tool layouts do not create horizontal overflow, obscure actions or trap keyboard focus.
- Error and status messages are visible and announced; downloads have descriptive filenames.
- Ads remain disabled until reviewed placements preserve workspace space and never obstruct upload, processing, error or download actions.

### Remaining launch blockers

Proceed next with **Phase 2 Task 4 — unified processing bounds**. Define and enforce cumulative file count/byte limits, decoded image pixel-area limits, PDF page limits and rendering-area limits across every picker and secondary input. Add clear errors, cancellation checkpoints and representative large/oversized fixtures before widening limits. Do not add new tools or dependencies for this task.
