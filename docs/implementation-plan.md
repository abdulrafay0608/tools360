# Tools360 Product Implementation Plan

## Goal

Turn Tools360 from a broad prototype catalog into a reliable, accessible, and maintainable toolkit that can earn user trust before ads or subscriptions are introduced. Work in small releases; only mark and index a tool as available after its complete workflow and failure states are verified.

## Current Baseline

- Next.js 15 App Router, React 19, Tailwind CSS 4.
- PDF processing libraries are already client-side (`pdf-lib`, PDF.js, `react-pdf`). No product API, database, auth, payment provider, ad integration, or CI workflow is currently present.
- Merge, Split, Compress, and Compare are wired into `ToolRenderer`. Compare currently provides side-by-side pages, not automatic difference detection. Other catalog entries remain unimplemented.
- The catalog mixes small browser utilities with services that need external data, expensive processing, credentials, or server infrastructure (for example, OCR, AI writing, currency rates, domain reputation, and website scanning).
- Existing PDF UX relies on alerts in places, does not consistently validate file content/limits, and renders thumbnails in ways that can use substantial memory.
- `npm run lint` works after `npm install` and reports three existing preview/hook warnings. `npm test` currently covers merge behavior and file-size formatting.

## Product and UX Principles

1. **Finish a vertical before expanding.** Complete and test the PDF experience before taking on every unrelated catalog category.
2. **Catalog means shipped.** A tool is visible as available only when it has a working route, meaningful empty/loading/error/success states, responsive behavior, metadata, and tests. Planned tools can live in a clearly labeled roadmap, not in the primary tool grid.
3. **Private by default.** Process PDFs in the browser where practical. Clearly disclose when a feature requires an upload or third-party service; do not promise secure deletion or confidentiality without proof.
4. **Simple, task-first interface.** Use one clear primary action, readable file/page status, inline errors, keyboard support, and a predictable upload → configure → process → download flow. Avoid placing ads beside actions.
5. **Progressive limits.** Start with transparent per-file/page limits needed for browser stability. Add account quotas only with server-side metering; client counters are not enforceable.
6. **Never fake capability.** Compression should report the real size change, external-data tools need a credible data source, and AI tools need a secured server integration and cost controls.

## Delivery Sequence

### Milestone 0 — Scope, routes, and quality baseline

- [ ] Audit every `toolsData` entry against an actual renderer and a defined support status.
- [ ] Split the catalog into `available`, `planned`, and `blocked-by-service` states; only `available` entries appear as usable tool links.
- [ ] Make route metadata and renderer registration derive from one registry to prevent dead links.
- [x] Fix the About navigation mismatch and keep only live PDF tools in the primary catalog and static route list.
- [ ] Add real Contact, Privacy, and Terms routes before linking to them.
- [ ] Confirm Next.js 15 build and lint behavior, resolve warnings in touched code, and add CI for install, lint, build, and tests.
- [ ] Record baseline mobile performance, keyboard navigation, and accessibility checks.

**Done when:** every visible link works, no placeholder is represented as a completed tool, and CI validates a clean checkout.

### Milestone 1 — Complete the core PDF release

#### 1A. Shared PDF foundation

- [x] Enforce the shared upload size/type policy and show inline errors for rejected files.
- [ ] Add PDF parser validation before a selected file enters each tool workflow.
- [ ] Choose and enforce a documented first-release limit for file size and page count. Make limits configurable per operation and avoid promising a universal 10 MB limit unless that is the actual policy.
- [ ] Centralize object URL, PDF.js document, worker, and canvas cleanup. Bound thumbnail resolution/count and render previews on demand for long documents.
- [x] Replace upload, merge, split, and compression alerts with inline status/error feedback. Preserve keyboard and screen-reader use.
- [ ] Ensure browser-only processing is communicated accurately and unsupported/encrypted PDFs fail clearly.

#### 1B. Existing tools

- [x] **Merge:** fail the whole operation if an input cannot be read; avoid silent partial success and preserve files after a failure.
- [x] **Split:** validate ranges and overlaps, use the loaded PDF page count, and report output status.
- [x] **Compress:** compare input/output sizes and explain when the rewrite does not reduce size.
- [x] **Compare MVP:** show corresponding pages side by side, handle differing page counts, and avoid claims of automatic text comparison.

#### 1C. PDF expansion, in value order

Each tool below needs a short product specification and a tested workflow before it is added to the available catalog. Start with operations that fit the existing browser libraries and avoid server upload:

1. Rotate PDF, organize/reorder pages, page extraction, page deletion, and add page numbers.
2. JPG/images to PDF and PDF pages to image downloads.
3. Watermark and crop PDF, with clear preview and page selection.
4. Protect/unlock PDF only after confirming supported encryption algorithms, compatibility, and honest security limitations.
5. Sign and edit PDF only after a usable editor, save/export fidelity, and accessibility are proven.
6. OCR, Word/Office conversion, PDF/A, repair, scan-to-PDF, redact, and URL-to-PDF require separate capability/security research. Redaction must remove underlying content, not merely cover it visually. Do not launch these as browser-only tools based on a UI mock.

**Done when:** every launched PDF tool passes valid, malformed, encrypted, boundary, and resource-limit cases; outputs open in common PDF readers; no failed job reports success.

### Milestone 2 — Shared UI and product navigation

- [ ] Establish shared design tokens for surfaces, text, borders, focus, status, and a restrained accent palette; use consistent typography, spacing, and compact radii.
- [x] Refresh homepage as a working tool directory with only implemented tools and scan-friendly cards.
- [x] Refresh Navbar and mobile menu with semantic links, visible focus, active state, and a clear path back to tools.
- [x] Refresh ToolLayout with concise copy, accurate browser-processing statements, and a responsive workspace.
- [ ] Standardize file rows, preview lists, loading/error/success states, and disabled states across all tools.
- [ ] Add responsive checks at narrow phone, tablet, and desktop widths; prevent text overflow, layout shifts, and ad-like content near task controls.
- [ ] Remove placeholder components/imports or correct them before wiring them into production navigation.

**Done when:** the home-to-tool workflow is usable at mobile and desktop sizes, all key controls are keyboard accessible, and shared states look and behave consistently.

### Milestone 3 — Other browser-first tools

- [ ] Inventory Developer, Writer, Finance/Utility, Productivity, Web/Network, and Design tools by user value, data source, privacy risk, and implementation complexity.
- [ ] Implement deterministic offline tools first (for example, JSON formatting, Base64, UUID, word/character counting, text case conversion, calculators, and color utilities).
- [ ] Add input limits, copy/download affordances, validation, localization-safe numeric/date handling, and unit tests for each deterministic tool.
- [ ] Require a decision record before tools that need remote access, credentials, changing reference data, AI inference, IP/port scanning, reputation data, or browser permissions. Use a backend with rate limits, abuse controls, secrets handling, and SSRF protections where appropriate.
- [ ] Remove unsupported claims such as live currency rates, plagiarism detection, domain authority, or website-wide broken-link checking unless a reliable licensed service is integrated.

**Done when:** each category is enabled only for tools whose data freshness, privacy, abuse risk, and operating cost are understood.

### Milestone 4 — Trust, SEO, and operations

- [ ] Publish accurate About, Contact, Privacy, and Terms pages; include the actual file processing, analytics, cookies, retention, subprocessors, and support details.
- [ ] Add unique metadata, canonical URL strategy, Open Graph images, sitemap, and robots rules. Keep planned tools out of the sitemap.
- [ ] Add consent-aware, minimal analytics and error reporting. Do not send document names or PDF contents to analytics.
- [ ] Add security headers, dependency scanning/update process, uptime/error alerts, staging, deployment rollback, and support/incident procedures.
- [ ] Add automated unit tests for pure operations and browser tests for key tool workflows, navigation, upload failures, mobile layouts, and accessibility.

**Done when:** published policies reflect live data flows, SEO exposes only useful shipped pages, and production incidents can be detected and recovered from.

### Milestone 5 — Ads, free limits, and subscriptions

- [ ] Establish useful free workflows and measure task completion, retention, performance, and support demand before adding monetization.
- [ ] Apply for AdSense only when the site has substantial original utility, complete policy/contact pages, and a reviewed consent setup. Reserve stable ad placements away from upload/process/download controls and test layout shift.
- [ ] Set limits from browser/device capabilities and real operating cost; explain them before upload. Do not use a local counter as a paid-plan entitlement.
- [ ] Select auth, database, and billing providers only after deciding what paid features provide actual value. Keep payment secrets and plan authorization server-side.
- [ ] Define plan pricing, taxes, cancellation/refunds, account deletion, support, webhook signature validation, idempotency, grace periods, and entitlement revocation.
- [ ] Add server-side usage accounting and test checkout, renewal, failed payment, cancellation, upgrade/downgrade, refund, and account deletion before enabling checkout.

**Done when:** ads comply with platform policy without harming the tool workflow and every paid entitlement is delivered and enforced server-side.

## First Implementation Sprint

Recommended immediate order:

1. [x] Create this roadmap and link it from the root README.
2. [x] Bring the visible catalog into alignment with implemented routes.
3. [x] Enforce the shared upload size/type policy and show inline rejection errors.
4. [x] Fix Merge partial-success behavior and Split range validation.
5. [x] Make Compress outcomes truthful and add the Compare MVP.
6. [x] Refresh shared navigation, homepage, tool layout, uploader, and tool cards.
7. [ ] Expand automated coverage and confirm final lint/build on the updated worktree.

## Release Gate

A milestone is not complete until all of the following are true:

- [ ] The feature works from a fresh page load using mouse and keyboard.
- [ ] Empty, valid, malformed, unsupported, boundary, processing, and failure states are covered.
- [ ] The feature is responsive and does not leak temporary browser resources.
- [ ] The catalog description, limits, metadata, and privacy statement match observed behavior.
- [ ] Automated checks pass and any remaining warnings/limitations are documented.
