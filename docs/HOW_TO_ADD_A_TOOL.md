# How to Add a New Tool to Tech Tools 360

Follow this step-by-step checklist to implement, wire up, test, and ship a new browser-based tool on Tech Tools 360.

---

## Quick Checklist

- [ ] **1. Catalog Definition**: Add tool entry to `src/data/tools-data.js`
- [ ] **2. Tool Implementation**: Create tool component & pure utility functions in `src/tools/<category>/<slug>/`
- [ ] **3. ToolRenderer Entry**: Register the tool component in `src/components/layout/ToolRenderer.js`
- [ ] **4. Tool Page Config**: Define display options in `src/config/toolPageConfig.js`
- [ ] **5. Content File (Optional)**: Add rich SEO how-to/tips/faqs in `src/content/tools/<slug>.js`
- [ ] **6. Unit Tests**: Write unit tests for pure utils in `tests/<slug>Utils.test.mjs` and run `npm test`
- [ ] **7. Verifier Script**: Create an automated Playwright verification script in `scripts/verify-<slug>.mjs`
- [ ] **8. Bump Sitemap Date**: Update `SITE_LAST_UPDATED` in `src/config/site.js` to today's date
- [ ] **9. Verification**: Run `npm run lint`, `npm test`, and `npm run build`

---

## Detailed Step-by-Step Guide

### Step 1: Add Tool Entry to `src/data/tools-data.js`
Locate the relevant category array in `rawToolsData` (e.g., `PDF Tools`, `Image Tools`, `Calculators`) and add your tool definition:

```javascript
{
  name: "New Tool Name",
  slug: "new-tool-slug",
  icon: "toolIconKey",
  available: true, // Mark true only when ready to ship
  description: "Brief 1-2 sentence description explaining what the tool does.",
}
```

### Step 2: Build the Tool Component & Utilities
Create your tool directory structure under `src/tools/<category>/<tool-slug>/`:

```
src/tools/<category>/<tool-slug>/
├── components/
│   ├── NewToolOrchestrator.js   # Client-side component ("use client")
│   └── ...                      # UI subcomponents (options bar, previews, etc.)
└── newToolUtils.js              # Pure computation / transformation algorithms
```

Rules:
- Keep all processing client-side. Do not introduce server upload endpoints.
- Separate pure algorithms (math, parsing, file formatting) into `newToolUtils.js` for clean unit testing without DOM dependencies.
- For file downloads, use `saveAs` from `file-saver` or `client-zip` for ZIP archives.

### Step 3: Wire into `ToolRenderer.js`
Open `src/components/layout/ToolRenderer.js` and register your component in the renderer map:

```javascript
import NewToolOrchestrator from "@/tools/<category>/<tool-slug>/components/NewToolOrchestrator";

// Inside ToolRenderer:
case "new-tool-slug":
  return <NewToolOrchestrator />;
```

### Step 4: Configure `src/config/toolPageConfig.js`
Add an entry for your slug in `toolPageConfig` specifying display behavior:

```javascript
"new-tool-slug": {
  hasSeoContent: false,      // Set to true if a content file exists
  hideDescription: false,    // Set to true to hide hero description
  trustText: undefined,     // Custom trust badge string, or undefined for default
  showFaqSchema: false,     // Set to true to emit FAQPage schema
},
```

### Step 5: Add Rich SEO Content (Optional)
If your tool includes rich how-to steps, pro tips, privacy notes, and FAQs:
1. Create `src/content/tools/new-tool-slug.js`:
   ```javascript
   export const newToolContent = {
     howTo: [
       { step: 1, title: "Step title", description: "Step description" },
     ],
     tips: ["Helpful tip for optimal results"],
     privacyText: "Your files are processed locally in your browser...",
     faqs: [
       { question: "FAQ question?", answer: "FAQ answer." },
     ],
   };
   export default newToolContent;
   ```
2. Register the module in `src/content/tools/index.js`:
   ```javascript
   import newToolContent from "./new-tool-slug.js";
   // Add to toolContentMap:
   "new-tool-slug": newToolContent,
   ```
3. Set `hasSeoContent: true` and `showFaqSchema: true` in `src/config/toolPageConfig.js`.

### Step 6: Write Unit Tests
Create `tests/newToolUtils.test.mjs` testing all mathematical invariants, validation limits, boundary cases, and error handling. Run tests with:

```bash
npm test
```

### Step 7: Create a Verifier Script
Add a Playwright script in `scripts/verify-new-tool-slug.mjs` to test real browser interaction:
- Uploading fixtures or entering inputs
- Changing settings/options
- Generating the result and validating download payloads
- Testing responsive layout (desktop & mobile)

### Step 8: Bump Sitemap Date
Update `SITE_LAST_UPDATED` in `src/config/site.js` to the release date (e.g., `new Date("YYYY-MM-DD")`). This timestamp is automatically used in `src/app/sitemap.js` for all static routes and tool pages that do not specify a separate `updatedAt`, ensuring search engines discover newly added tools and refreshed content.

### Step 9: Quality Checks
Before committing:
1. `npm run lint` — Must report 0 errors and 0 warnings.
2. `npm test` — All test suites must pass.
3. `npm run build` — Production build must compile without errors.
