# Tech Tools 360 Architecture

Tech Tools 360 is a fast, privacy-focused, browser-based web application providing everyday utility tools for documents, images, and calculations. All core processing executes 100% client-side in the user's browser—no user files or private data are ever uploaded to external servers.

---

## 1. Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) 16 (App Router)
- **UI Library**: [React](https://react.dev/) 19
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) 4
- **Client-Side Engines**:
  - PDF manipulation: `pdf-lib`, `pdfjs-dist` (PDF.js)
  - ZIP archives: `client-zip`
  - File saving: `file-saver`
  - Canvas & Rasterization: Native HTML5 Canvas API
- **Testing & Verification**:
  - Unit tests: Node.js native test runner (`node --test`)
  - Integration & e2e verifiers: Playwright (`@playwright/test`)

---

## 2. Core Architectural Principles

1. **Local, Zero-Upload Processing**: All file parsing, transformation, rasterization, and calculations happen inside the user's browser thread or Web Worker.
2. **Unified Data Catalog**: A single source of truth (`src/data/tools-data.js`) defines all tools, categories, live availability status, and metadata.
3. **Registry-Driven Presentation**: Tool page UI features (SEO sections, description visibility, trust badges, FAQ JSON-LD schemas) are decoupled and configured via `src/config/toolPageConfig.js`.
4. **Isolated Tool Implementations**: Each tool encapsulates its own state management, options toolbar, UI preview components, and pure calculation/processing utility functions.

---

## 3. Directory Structure

```
tools360/
├── src/
│   ├── app/                                # Next.js App Router routes
│   │   ├── [slug]/                         # Legacy redirection / catch-alls
│   │   ├── tools/
│   │   │   ├── [slug]/page.js              # Server-rendered dynamic tool page route
│   │   │   └── category/[category]/page.js # Category detail page route
│   │   ├── about/page.js                   # About page
│   │   ├── contact/page.js                 # Contact page
│   │   ├── privacy/page.js                 # Privacy policy
│   │   ├── layout.js                       # Root layout with site metadataBase & fonts
│   │   ├── page.js                         # Homepage category grid
│   │   ├── robots.js                       # Search engine crawler directives
│   │   └── sitemap.js                      # XML sitemap generator
│   ├── config/                             # Central configuration
│   │   ├── site.js                         # SITE_URL, SITE_NAME, CONTACT_EMAIL
│   │   ├── ads.js                          # Ad slot IDs and responsive configurations
│   │   └── toolPageConfig.js               # Tool page presentation registry
│   ├── content/                            # Tool SEO & informational content
│   │   └── tools/                          # Static content modules (how-tos, tips, faqs)
│   │       ├── index.js                    # Content loader map
│   │       └── pdf-to-jpg.js               # Custom content for PDF to JPG
│   ├── data/                               # Catalog data & query utilities
│   │   ├── tools-data.js                   # Master tool & category catalog
│   │   └── toolsDataUtils.js               # Live tools, category filters, and sitemap queries
│   ├── components/                         # Shared UI and layout components
│   │   ├── ads/                            # Ad frame wrappers and slots
│   │   ├── layout/                         # ToolLayout, ToolRenderer, RelatedTools
│   │   ├── icons/                          # Tool and category iconography
│   │   └── ui/                             # Navbar, Footer, Button, Card primitives
│   └── tools/                              # Dedicated tool implementations
│       ├── pdf/                            # PDF tools (merge, split, compress, compare, etc.)
│       ├── image/                          # Image tools (compressor, resizer, converter, etc.)
│       └── calculator/                     # Financial & everyday utility calculators
├── scripts/                                # Verification and test-fixture generation scripts
├── tests/                                  # Unit tests executed via `node --test`
└── docs/                                   # Architectural guides and documentation
```

---

## 4. Routing & Page Life Cycle

### Dynamic Tool Route (`/tools/[slug]`)
1. **Static Param Generation**: `generateStaticParams()` queries `getLiveTools()` from `src/data/toolsDataUtils.js` at build time to statically pre-render all available tool pages.
2. **Metadata Generation**: `generateMetadata()` configures canonical URLs (`SITE_URL/tools/[slug]`), OpenGraph tags, and Twitter cards.
3. **Presentation Registry Lookup**: `getToolPageConfig(slug)` resolves display options:
   - `hideDescription`: Whether to omit the hero description (useful for compact workspace layouts).
   - `hasSeoContent`: Whether to look up rich how-to/tips/faq content.
   - `trustText`: Custom trust badge copy (e.g., calculator-specific vs. file-specific).
   - `showFaqSchema`: Controls whether FAQPage JSON-LD schema is outputted.
4. **SEO Content & Structured Data**: If `hasSeoContent` is true and a content module exists, `ToolSEOContent` renders server-side and an `application/ld+json` FAQPage graph is embedded alongside the WebApplication schema.
5. **Tool Rendering**: `ToolRenderer` maps the slug to its interactive client-side component (e.g., `<MergePDFTool />`, `<ImageCompressorTool />`).

---

## 5. Site Configuration Registry

All environment-dependent values are centralized in `src/config/site.js`:
- `SITE_URL`: Configured via `NEXT_PUBLIC_SITE_URL` (default: `https://techtools360.vercel.app`).
- `SITE_NAME`: Central brand name (`Tech Tools 360`).
- `CONTACT_EMAIL`: Configured via `NEXT_PUBLIC_CONTACT_EMAIL` (default: `freetechtools360@gmail.com`).

No component, page, or metadata generator hardcodes URLs or email addresses directly.

---

## 6. Testing Strategy

- **Unit Tests (`tests/*.test.mjs`)**:
  - Test pure transformation algorithms, math, validation limits, date handling, parsing, and data invariants.
  - Run via `npm test` (`node --test`).
  - No DOM dependencies required for pure utils.
- **Verification Scripts (`scripts/verify-*.mjs`)**:
  - End-to-end headless browser verifiers using Playwright.
  - Test complete user journeys: file drag-and-drop, interactive previews, conversions, and ZIP downloads.
