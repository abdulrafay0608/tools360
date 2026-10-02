import fs from "node:fs";
import path from "node:path";

const src = path.resolve("node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const destDir = path.resolve("public");
const dest = path.join(destDir, "pdf.worker.min.mjs");

if (fs.existsSync(src)) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
  console.log("✓ Copied pdf.worker.min.mjs to public/");
}
