// Short, server-rendered guidance for the live tools. Keep claims aligned with
// their browser workspaces; planned tools must not appear here.
export const toolContent = {
  "merge-pdf": {
    intro: "Combine several PDF documents into one file in the order you choose.",
    steps: ["Select the PDF files to combine.", "Review and reorder the files.", "Merge and download the combined PDF."],
    limitations: "Password-protected or damaged PDFs may not open. The tool joins pages; it does not edit their contents.",
  },
  "split-pdf": {
    intro: "Extract page ranges or divide a PDF into smaller documents.",
    steps: ["Select a PDF and review its page thumbnails.", "Enter non-overlapping ranges or choose a fixed number of pages per split.", "Download the resulting PDFs in a ZIP file."],
    limitations: "A page can belong to only one range in a single export. Password-protected or damaged PDFs may not open.",
  },
  "compress-pdf": {
    intro: "Rewrite a PDF in your browser and clear basic document metadata where supported.",
    steps: ["Select the PDF you want to rewrite.", "Run the PDF rewrite and review the reported size change.", "Download the rewritten document."],
    limitations: "This does not recompress scanned images. The result can be smaller, unchanged, or larger; review the downloaded file before sharing.",
  },
  "pdf-to-jpg": {
    intro: "Render selected PDF pages as JPG images at a chosen pixel scale.",
    steps: ["Select a PDF and choose the pages to render.", "Choose 1x, 1.5x, or 2x scale and a JPG quality setting.", "Download one page as JPG or several pages in a ZIP file."],
    limitations: "Scale changes pixel dimensions, not guaranteed print-DPI metadata. JPG is lossy, and large pages may exceed browser rendering limits.",
  },
  "jpg-to-pdf": {
    intro: "Make PDFs from JPG, PNG, or WebP images, with image order and page settings under your control.",
    steps: ["Add images and arrange or rotate them.", "Choose page size, orientation, and one combined PDF or separate PDFs.", "Convert and download the PDF or ZIP file."],
    limitations: "Large images and batches are subject to browser safety limits. Separate PDFs are packaged in a ZIP when multiple images are selected.",
  },
  "sign-pdf": {
    intro: "Place a drawn, typed, or uploaded signature image visibly on a PDF page.",
    steps: ["Select a PDF and open the signature dialog.", "Draw, type, or upload a signature, then place it on a page.", "Review its position and download the stamped PDF."],
    limitations: "This creates a visible signature stamp, not a certificate-backed digital signature. Verify placement and legal requirements before using the result.",
  },
  "rotate-pdf": {
    intro: "Change the orientation of selected PDF pages and save a rotated copy.",
    steps: ["Select a PDF and review its pages.", "Rotate individual pages or a selection left or right.", "Download the rotated PDF."],
    limitations: "Rotation changes the page view; it does not edit text or images within the PDF.",
  },
  "organize-pdf": {
    intro: "Reorder, duplicate, rotate, or remove PDF pages before exporting a new document.",
    steps: ["Select a PDF and review the page grid.", "Move, duplicate, rotate, or remove the pages you need.", "Download the organized PDF or selected pages."],
    limitations: "This changes page order and selection, not the existing text or images on a page. Review the final page sequence before sharing.",
  },
  "add-page-numbers": {
    intro: "Stamp page numbers onto a PDF with a selectable range and placement.",
    steps: ["Select a PDF and preview its pages.", "Choose the page range and number placement.", "Download the numbered PDF."],
    limitations: "The numbers are added as visible marks; existing PDF text is not edited. Check placement on pages with unusual margins or rotation.",
  },
  "compare-pdf": {
    intro: "Visually inspect corresponding pages from two PDFs side by side, overlaid, or as a pixel difference.",
    steps: ["Select an original and a revised PDF.", "Move between pages and switch comparison views.", "If needed, download a PNG image of the overlay or difference view."],
    limitations: "This is a visual comparison, not a semantic text diff. It does not export a merged or annotated PDF.",
  },
  "image-compressor": {
    intro: "Re-encode JPG, PNG, or WebP images with selected quality and size settings.",
    steps: ["Add images and choose output settings.", "Review each result's size and metadata notice.", "Download an image or a ZIP of processed results."],
    limitations: "A smaller file is not guaranteed. If re-encoding is larger, the original bytes and metadata may be retained; re-encoded results do not copy source metadata.",
  },
  "image-resizer": {
    intro: "Resize JPG, PNG, or WebP images by dimensions, percentage, or a preset.",
    steps: ["Add images and select a sizing mode.", "Choose dimensions, fit behavior, and output format.", "Review the results and download one image or a ZIP."],
    limitations: "Upscaling cannot create missing detail. JPG does not support transparency, so transparent areas need a fill color when exporting to JPG.",
  },
  "image-converter": {
    intro: "Convert images your browser can decode into JPG, PNG, or WebP files.",
    steps: ["Add supported images and choose an output format.", "Set quality or a background color where relevant.", "Review and download converted files individually or in a ZIP."],
    limitations: "Same-format files may keep their original bytes and metadata. Re-encoded outputs do not copy source metadata; format decoding depends on browser support.",
  },
  "svg-to-png": {
    intro: "Rasterize SVG files or pasted SVG artwork as PNG images in your browser.",
    steps: ["Add SVG files or paste SVG markup.", "Choose dimensions, scale, and background options.", "Download a PNG or a ZIP of multiple results."],
    limitations: "PNG output is raster rather than editable vector artwork. Complex or oversized SVG input may be rejected by browser safety limits.",
  },
  "loan-emi-calculator": {
    intro: "Estimate a fixed monthly loan payment and view a principal-and-interest schedule.",
    steps: ["Enter the loan amount, annual interest rate, and term.", "Review monthly payment, total interest, and the amortization schedule.", "Optionally download the schedule as CSV."],
    limitations: "This is an estimate based on the entered rate and term; it does not include lender fees, changing rates, taxes, or an approval decision.",
  },
  "age-calculator": {
    intro: "Calculate elapsed years, months, and days from a birth date to a selected date.",
    steps: ["Enter a date of birth.", "Use today's date or choose another comparison date.", "Review the age and next-birthday figures."],
    limitations: "February 29 birthdays are treated as February 28 in non-leap years. This is a date calculation, not an identity check.",
  },
  "percentage-calculator": {
    intro: "Calculate a percent of a value, percentage change, or a value after adding or subtracting a percentage.",
    steps: ["Choose the calculation type.", "Enter the two numbers requested by that mode.", "Review the result and formula, then copy the value if needed."],
    limitations: "Results use the numbers entered and may be rounded for display. Check the formula before using a result for a financial decision.",
  },
  "word-counter": {
    intro: "Count words and characters in text you enter in the browser.",
    steps: ["Paste or type text into the editor.", "Review the live word, character, and paragraph counts.", "Edit the text to see updated counts."],
    limitations: "Counts follow the tool's text rules and may differ from a word processor for punctuation, emoji, or unusual spacing.",
  },
};
