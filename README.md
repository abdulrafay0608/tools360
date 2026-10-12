# Tech Tools 360

Tech Tools 360 is a fast, privacy-focused, browser-based web application providing everyday utility tools for documents, images, and calculations. All core processing executes 100% client-side in the user's browser—no user files or private data are ever uploaded to external servers.

---

## Live Tools Catalog

Tech Tools 360 currently features 18 live client-side tools across 3 categories:

### PDF Tools
- **Merge PDF** (`/tools/merge-pdf`): Combine multiple PDF documents in custom order.
- **Split PDF** (`/tools/split-pdf`): Extract page ranges or split into fixed-size chunks packaged as a ZIP.
- **Compress PDF** (`/tools/compress-pdf`): Optimize and reduce PDF file size in the browser.
- **Organize PDF** (`/tools/organize-pdf`): Reorder, rotate, delete, and duplicate pages with drag-and-drop.
- **Rotate PDF** (`/tools/rotate-pdf`): Rotate individual or all PDF pages at 90-degree increments.
- **Add Page Numbers** (`/tools/add-page-numbers`): Add customized page numbers with positioning, formatting, and margin controls.
- **PDF to JPG** (`/tools/pdf-to-jpg`): Convert PDF pages to high-resolution JPG images with DPI and quality settings.
- **JPG to PDF** (`/tools/jpg-to-pdf`): Convert JPG, PNG, and other images to standardized PDF documents.
- **Sign PDF** (`/tools/sign-pdf`): Draw, type, or upload signatures and place them on PDF pages.
- **Compare PDF** (`/tools/compare-pdf`): Compare two PDF documents with side-by-side, overlay, and diff-map views.

### Image Tools
- **Image Compressor** (`/tools/image-compressor`): Batch compress images (JPG, PNG, WebP) with live preview and savings calculation.
- **Image Resizer** (`/tools/image-resizer`): Resize images by exact pixels, percentage, or social media presets with aspect locking.
- **Image Converter** (`/tools/image-converter`): Convert between JPG, PNG, WebP, GIF, and BMP formats client-side.
- **SVG to PNG** (`/tools/svg-to-png`): Rasterize SVG vector graphics into high-resolution PNG images with sanitization.

### Calculators
- **Percentage Calculator** (`/tools/percentage-calculator`): Calculate percentage differences, increases, decreases, and fractions.
- **Loan EMI Calculator** (`/tools/loan-emi-calculator`): Compute monthly loan payments, total interest, and amortization breakdowns.
- **Age Calculator** (`/tools/age-calculator`): Calculate precise age in years, months, days, hours, and minutes.
- **Word Counter** (`/tools/word-counter`): Real-time analysis of words, characters, sentences, paragraphs, and reading time.

---

## Quick Start & Local Development

### Requirements
- Node.js 18+ (tested with Node 20 / 22 / 24)
- npm

### Installation & Server
```bash
# Install dependencies (automatically runs postinstall to copy pdf worker)
npm install

# Start local Next.js development server
npm run dev

# Run production build
npm run build

# Start production server
npm run start
```

---

## Scripts & Testing

### Package Scripts
- `npm run dev`: Launch the Next.js dev server at `http://localhost:3000`
- `npm run build`: Compile the production Next.js build
- `npm run start`: Serve the compiled production build
- `npm run lint`: Run ESLint across all codebase files (must report 0 errors, 0 warnings)
- `npm run test`: Run the native Node.js test runner (`node --test`)

### Running Unit Tests
Unit tests cover pure mathematical algorithms, parsing logic, boundary conditions, and data invariants:
```bash
npm test
```

### Generating Test Fixtures
To generate synthetic test fixtures for automated testing:
```bash
# PDF test fixtures (multipage, corrupted, protected, etc.)
node scripts/generate-fixtures.mjs

# Image test fixtures (large photos, transparent PNG, EXIF orientation, etc.)
node scripts/generate-image-fixtures.mjs

# SVG test fixtures (sanitization tests, viewBox, oversized, etc.)
node scripts/generate-svg-fixtures.mjs
```

### Running Automated Playwright Verifiers
Playwright verifiers execute end-to-end user journeys against a running server:
```bash
node scripts/verify-image-compressor.mjs
node scripts/verify-image-resizer.mjs
node scripts/verify-image-converter.mjs
node scripts/verify-svg-to-png.mjs
node scripts/verify-rotate-pdf.mjs
node scripts/verify-add-page-numbers.mjs
node scripts/verify-organize-pdf.mjs
node scripts/verify-four-calculators.mjs
node scripts/verify-ad-slots.mjs
```

---

## Documentation

- [Architecture Guide](docs/ARCHITECTURE.md): Comprehensive system design, data flow, and directory structure.
- [How to Add a Tool](docs/HOW_TO_ADD_A_TOOL.md): Step-by-step checklist and guide for implementing new tools.

---

## Privacy & Security

Tech Tools 360 processes all files and data strictly inside the user's web browser using WebAssembly, HTML5 Canvas, and client-side JavaScript. No document content, images, or calculation inputs are transmitted to or stored on any server.
