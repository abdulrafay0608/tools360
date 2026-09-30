# Tools360

Tools360 is a browser-based web app for common PDF tasks. The current codebase is an early product prototype, not yet a production-ready all-in-one toolkit.

See the [implementation plan](docs/implementation-plan.md) for the product roadmap, implementation order, and release criteria.

## Current Product Status

### Working tool routes

These are the only tools connected to implementations in the tool renderer:

- **Merge PDF** (`/tools/merge-pdf`): accepts multiple PDFs, previews pages, reorders files, and merges them in the browser.
- **Split PDF** (`/tools/split-pdf`): splits one PDF by custom page ranges or fixed-size page groups and downloads a ZIP.
- **Compress PDF** (`/tools/compress-pdf`): rewrites PDF structures and metadata in the browser and reports the actual output size. It does not downsample images, so it cannot promise a smaller output for every file.
- **Compare PDF** (`/tools/compare-pdf`): opens two PDFs and shows corresponding pages side by side. It does not automatically detect or mark text-level differences.

The catalog also advertises many other PDF, developer, SEO, and writing tools. Those entries do not have implementations connected to the renderer and should not be presented as available features.

### Important gaps to resolve

- Compare provides side-by-side page review only; automatic visual/text difference detection is not implemented.
- Previewing every page of a large PDF can still use substantial browser memory; bounded/lazy thumbnails and processing progress remain to be added.
- Contact, Privacy, and Terms pages are not implemented. Do not enable ads or collect nonessential analytics until these and a consent review are complete.
- There is no authentication, durable usage accounting, billing, ad integration, or CI configuration.
- `npm run lint` and `npm test` pass. Lint reports three existing warnings in PDF preview rendering and thumbnail dependencies.

## Local Development

### Requirements

- Node.js compatible with the Next.js 15 project dependencies
- npm

### Start the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Available scripts in the current package manifest:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm test
```

The initial test suite covers merge behavior and file-size formatting. Add focused tests for each tool and browser workflows as part of production hardening.

## Production Readiness Plan

Deliver in the order below. Do not enable monetization on top of misleading tool listings or unstable core workflows.

### Phase 0: Make the product truthful and shippable

1. Define the first release scope. Keep only Merge, Split, and Compress visible as available; mark Compare as planned until its implementation and tests are complete. Remove or clearly label all other unimplemented catalog items.
2. Make catalog metadata and renderer registration come from a single source of truth, so a tool cannot be advertised without a real route/implementation.
3. Fix route and navigation mismatches. Add real About, Contact, Privacy Policy, and Terms routes before linking to them.
4. Replace inaccurate claims (for example, guaranteed compression, 10 MB enforcement, or no-storage guarantees that have not been verified) with behavior the app can prove.
5. Establish supported Node/npm versions, a clean install/build procedure, a working lint command, and CI checks. Resolve Next.js 15 App Router build/runtime diagnostics.

**Exit criteria:** a clean install builds, every visible tool opens a real implementation, every navigation/footer link resolves, and lint plus baseline automated checks pass in CI.

### Phase 1: Harden core PDF workflows

1. Centralize file validation: check extension and MIME as hints, inspect the PDF signature/parser result, enforce configured file/page limits, reject empty or malformed inputs, and show actionable errors.
2. Treat merge failures as failures. Do not silently skip input files; identify the offending file and never report success for a partial output.
3. Validate split ranges, including overlap policy and duplicate pages; prevent invalid ranges from reaching the PDF library.
4. Improve progress, cancellation/retry, download completion, and cleanup of temporary object URLs and PDF.js resources.
5. Reduce preview memory use (lazy/virtualized rendering, bounded preview resolution, and page-count limits) and test large-file behavior on mobile-class devices.
6. Add focused unit and browser tests for valid, invalid, encrypted, empty, boundary, multi-file, and large-document cases. Check keyboard operation, labels, focus, and screen-reader announcements.

**Exit criteria:** core workflows pass browser tests on desktop and mobile; invalid input never yields a misleading success; limits and error states are documented and enforced.

### Phase 2: Build the real product surface

1. Implement Compare PDF as a concrete, testable feature (for example, side-by-side page rendering with page alignment and a clear visual-difference mode) before listing it as ready.
2. Give each shipped tool a dedicated description, instructions, relevant limitations, metadata, and related links; avoid indexing placeholder tool pages as completed utilities.
3. Add search/category navigation and clear empty, loading, unsupported, and not-found states as the shipped catalog grows.
4. Add production metadata, canonical URLs, Open Graph data, sitemap, robots rules, and meaningful page titles/descriptions. Validate structured data and indexing behavior before launch.

**Exit criteria:** every indexed tool page has a useful working experience and unique metadata; sitemap and robots output matches the actual release scope.

### Phase 3: Trust, privacy, and operations

1. Publish accurate Privacy Policy, Terms, Contact, and About pages. Document local processing, data retention, cookies/analytics, subprocessors, and deletion behavior based on the final architecture.
2. Add consent-aware analytics and error monitoring with minimal collection; provide a way to disable nonessential tracking where required.
3. Add security headers, dependency/update checks, accessibility checks, uptime monitoring, backups for any account/billing data, and an incident/support process.
4. Add a staging environment and a documented release/rollback checklist. Verify keyboard navigation, contrast, responsive layout, performance, and browser compatibility.

**Exit criteria:** production policies match actual data flows, operational alerts are tested, and releases can be rolled back without losing customer entitlement records.

### Phase 4: Ads and subscription monetization

1. Start with a free product and measure task completion, return use, performance, and support burden. Ad revenue depends on qualified traffic and approval; it is not a substitute for product-market fit.
2. Apply for Google AdSense only after the site has original useful content, complete policy/contact pages, a stable navigation structure, and a reviewed privacy/consent setup. Never place ads where they resemble upload, process, or download controls; reserve stable ad slots so ads do not shift the workflow.
3. Design free limits around user value and real operating costs. Browser-only processing has no trusted server to enforce account quotas, and local counters can be bypassed. Do not sell a quota as enforceable until a backend records usage or the premium benefit is otherwise verifiable.
4. Before subscriptions, select an authentication and billing provider, define monthly/yearly plans, cancellation/refund/tax handling, webhook verification, entitlement state, account deletion, and support ownership. Keep payment secrets and entitlement decisions on the server; never trust client-supplied plan state.
5. Decide what subscribers receive (such as higher processing limits, batch workflows, saved presets, or an ad-free experience) and ensure every benefit is technically delivered before charging.
6. Add privacy-conscious usage metering, idempotent billing webhooks, failed-payment and cancellation handling, and end-to-end tests for upgrade, renewal, downgrade, and account deletion.

**Exit criteria:** ads pass platform review and do not obstruct core tasks; subscription entitlements are enforced server-side, billing lifecycle tests pass, and pricing/policies are published before checkout is enabled.

## Suggested Architecture Direction

- Keep ordinary PDF processing in the browser where practical, so user files are not uploaded by default. Explain browser/device limits and avoid promising confidentiality beyond verified behavior.
- Add a small server-side account/entitlement layer only when subscriptions or enforceable usage limits are introduced. Separate account data and billing webhooks from file content wherever possible.
- Treat tool availability, plan entitlements, and usage limits as explicit typed/configured data rather than scattered UI checks.
- Add tests and CI before adding more tools; the current project has no automated regression safety net.

## Release Checklist

- [ ] Release catalog lists only implemented and supported tools.
- [ ] Clean install, production build, lint, unit tests, and browser smoke tests pass in CI.
- [ ] PDF validation, limits, failures, progress, accessibility, and mobile behavior are verified.
- [ ] All public links, privacy/terms/contact pages, metadata, sitemap, and robots rules are correct.
- [ ] Analytics, consent, ads, and subscription data flows are documented and tested before activation.
- [ ] Monitoring, support, rollback, and billing incident procedures are ready for production.
