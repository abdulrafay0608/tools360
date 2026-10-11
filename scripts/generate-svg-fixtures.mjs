/**
 * generate-svg-fixtures.mjs
 * Creates all SVG test fixtures under tests/fixtures/svg/.
 * Run once before the verifier (the verifier also calls this automatically).
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "tests", "fixtures", "svg");
fs.mkdirSync(OUT, { recursive: true });

function write(name, content) {
  const file = path.join(OUT, name);
  fs.writeFileSync(file, content, "utf8");
  console.log(`  wrote ${path.relative(ROOT, file)} (${content.length} bytes)`);
  return file;
}

// 1. Simple shape with explicit width + height (100×100 green circle)
write(
  "simple-shape.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <circle cx="50" cy="50" r="40" fill="#235c4f"/>
</svg>`
);

// 2. viewBox-only (no width/height attributes) — 200×150 viewBox
write(
  "viewbox-only.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150">
  <rect x="10" y="10" width="180" height="130" fill="#1a3328"/>
</svg>`
);

// 3. Transparent (background should remain fully transparent alpha=0)
//    Semi-transparent rectangle inside, no background fill.
write(
  "transparent.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">
  <rect x="10" y="10" width="60" height="60" fill="rgba(35,92,79,0.5)"/>
</svg>`
);

// 4. With text elements
write(
  "with-text.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100">
  <rect width="300" height="100" fill="#f8faf9"/>
  <text x="150" y="60" font-family="sans-serif" font-size="24" text-anchor="middle" fill="#173d34">Hello SVG</text>
</svg>`
);

// 5. MALICIOUS: script tag, onload handler, javascript: URL in href,
//    external image URL in xlink:href, foreignObject, external style url().
//    The sanitizer MUST remove all of these.
write(
  "malicious.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
       width="200" height="200"
       onload="window.__SVG_SCRIPT_RAN=true">
  <script type="text/javascript">window.__SVG_SCRIPT_RAN = true;</script>
  <foreignObject width="200" height="200">
    <div xmlns="http://www.w3.org/1999/xhtml">XSS via foreignObject</div>
  </foreignObject>
  <a href="javascript:window.__SVG_SCRIPT_RAN=true">
    <rect x="0" y="0" width="100" height="100" fill="red" onclick="window.__SVG_SCRIPT_RAN=true"/>
  </a>
  <image xlink:href="https://evil.example.com/track.png" width="1" height="1"/>
  <image href="https://evil.example.com/track2.png" width="1" height="1"/>
  <circle cx="100" cy="100" r="50" fill="blue"
          style="background:url(https://evil.example.com/bg.png)"/>
  <style>
    .evil { background: url(https://evil.example.com/style.png); }
    @import url(https://evil.example.com/sheet.css);
  </style>
  <!-- Legitimate visible shape so canvas renders something -->
  <rect x="50" y="50" width="100" height="100" fill="#235c4f"/>
</svg>`
);

// 6. Invalid XML (not well-formed)
write(
  "invalid-xml.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <unclosed-tag
  <circle cx="50" cy="50" r="40" fill="red"/>
</svg>`
);

// 7. Oversized — 6 MB of content, exceeds the 5 MB limit
//    Build a valid SVG with lots of comment padding
const padding = "<!-- " + "x".repeat(100) + " -->\n";
const repeats = Math.ceil((6 * 1024 * 1024) / padding.length);
write(
  "oversized-6mb.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <circle cx="50" cy="50" r="40" fill="orange"/>
${padding.repeat(repeats)}</svg>`
);

// 8. No dimensions (neither width/height nor viewBox) — should default to 512×512
write(
  "no-dimensions.svg",
  `<svg xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" fill="#708079"/>
</svg>`
);

// 9. Large shape 1600×900 for cap/scale tests
write(
  "large-1600x900.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">
  <rect width="1600" height="900" fill="#1a3328"/>
  <circle cx="800" cy="450" r="300" fill="#235c4f"/>
</svg>`
);

console.log(`\nDone — fixtures written to ${path.relative(ROOT, OUT)}`);
