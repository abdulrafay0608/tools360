# Tools360

Tools360 is a fast, browser-based web application for common PDF tasks and developer utilities. All processing runs 100% client-side in the browser for privacy and speed.

---

## Working Tool Routes

- **Merge PDF** (`/tools/merge-pdf`): Accepts multiple PDFs, previews pages with draggable reordering, and merges them directly in the browser.
- **Split PDF** (`/tools/split-pdf`): Splits a PDF by custom page ranges or fixed-size page groups and downloads a ZIP file.
- **Compress PDF** (`/tools/compress-pdf`): Rewrites PDF structures and metadata in the browser and reports actual size savings.
- **Compare PDF** (`/tools/compare-pdf`): Advanced dual-document comparison tool featuring side-by-side view, transparency overlay (10-90% opacity), visual difference map, and progressive background scanning.
- **JPG to PDF** (`/tools/jpg-to-pdf`): Converts single or multiple JPG, PNG, WEBP, or BMP images into individual PDFs (ZIP) or a single combined PDF document. Includes page orientation controls, page size presets, margins, and individual rotation.
- **PDF to JPG** (`/tools/pdf-to-jpg`): Converts PDF pages into high-resolution JPG images with adjustable image quality (Low/Medium/High) and DPI scaling (1x ~96 DPI, 1.5x ~150 DPI, 2x ~300 DPI). Supports instant single-page JPG downloads or batch selected-pages ZIP export.

---

## Component Architecture

### PDF to JPG (`src/tools/pdf/pdf-to-jpg/`)
```
src/tools/pdf/pdf-to-jpg/
├── page.js                             # Tool route entry point
├── pdfToJpgUtils.js                    # PDF.js rasterization & ZIP packaging engine
└── components/
    ├── PdfToJpgTool.js                # State orchestrator component
    ├── PdfToJpgHeader.js              # Selected PDF summary bar & size warnings
    ├── PdfToJpgPageGrid.js            # Page thumbnails grid with selection & quick download
    └── PdfToJpgOptionsBar.js          # Settings panel for quality, DPI resolution, and ZIP export
```

### JPG to PDF (`src/tools/pdf/jpg-to-pdf/`)
```
src/tools/pdf/jpg-to-pdf/
├── page.js                             # Tool route entry point
├── jpgToPdfUtils.js                    # pdf-lib image embedding & page positioning engine
└── components/
    ├── JpgToPdfTool.js                # State orchestrator component
    ├── ImagePreviewGrid.js            # Interactive grid of images with reorder, rotate & delete
    └── JpgToPdfOptionsBar.js          # Settings panel for orientation, page size, margins & filename
```

### Compare PDF (`src/tools/pdf/compare-pdf/`)
```
src/tools/pdf/compare-pdf/
├── page.js                             # Tool route entry point
├── compareUtils.js                     # Pixel diff algorithm & severity calculations
└── components/
    ├── ComparePDFTool.js              # State orchestrator & layout container
    ├── CompareUploadLanding.js        # Consistent initial 2-slot file uploader
    ├── CompareHeaderBar.js            # Selected files bar, swap button, & stats summary
    ├── CompareControlsToolbar.js      # View mode tabs, page navigation & zoom controls
    ├── PageThumbnailStrip.js          # Sidebar thumbnail list with diff status badges
    ├── SideBySideView.js              # Synchronized dual-pane page viewer
    ├── OverlayView.js                 # Transparency overlay page viewer with opacity slider
    ├── DiffMapView.js                 # Pixel difference map viewer & legend
    └── KeyboardShortcutsModal.js      # Accessible keyboard shortcut guide popover
```

---

## Local Development

### Requirements

- Node.js (18+ recommended)
- npm

### Quick Start

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Run linting
npm run lint

# Run unit tests
npm test

# Run production build
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## License & Privacy

All file processing runs locally inside the user's browser context. No uploaded documents are sent to any external server.
