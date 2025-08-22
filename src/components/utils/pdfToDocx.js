// src/tools/pdf/pdf-to-word/lib/pdfToDocx.js
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  ImageRun,
} from "docx";

/** Configure pdf.js worker (CDN keeps bundle light) */
export function setupPdfJsWorker() {
  if (typeof window !== "undefined" && pdfjsLib?.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
}

/* ---------------------------
   Helpers / heuristics
---------------------------- */

// Robust number helper
const num = (v, d = 0) => (Number.isFinite(v) ? v : d);

/** Basic font-style mapping from pdf.js item */
function mapTextStyle(item, bodyMedian = 11) {
  const fontSize = Math.abs(num(item.transform?.[3], 10));
  const fontName = item.fontName || "";
  return {
    size: Math.max(18, Math.round(fontSize * 1.5)), // docx half-points
    bold:
      /Bold|Black|Heavy|Semibold|Demi/i.test(fontName) ||
      fontSize >= bodyMedian + 3,
    italics: /Italic|Oblique/i.test(fontName),
    color: "000000",
    fontSizePx: fontSize,
  };
}

/** Normalize text items to a simpler shape */
function normalizeItems(items) {
  const out = [];
  for (const it of items || []) {
    const str = (it.str || "").replace(/\s+/g, " ").trimEnd();
    if (!str) continue;
    const tr = it.transform || [1, 0, 0, 1, 0, 0];
    out.push({
      str,
      x: num(tr[4]),
      y: num(tr[5]),
      fontName: it.fontName || "",
      fontSize: Math.abs(num(tr[3], 10)),
      width: num(it.width, 0),
      dir: it.dir || "ltr",
      raw: it,
    });
  }
  return out;
}

/** Median utility */
function median(arr) {
  if (!arr.length) return 0;
  const a = [...arr].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

/** Group items into physical lines via Y clustering */
function groupIntoLines(items) {
  if (!items.length) return [];

  // y tolerance scales with font size
  const sizes = items.map((t) => t.fontSize);
  const bodyMedian = median(sizes) || 11;
  const yTol = Math.max(6, Math.min(14, bodyMedian * 1.1));

  // cluster by y rounded into buckets
  const buckets = new Map();
  for (const it of items) {
    const key = Math.round(it.y / yTol) * yTol;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(it);
  }

  // Each bucket becomes a “line”; sort tokens by x
  const lines = [];
  for (const [key, arr] of buckets.entries()) {
    arr.sort((a, b) => a.x - b.x);
    const yAvg = arr.reduce((s, t) => s + t.y, 0) / arr.length;
    lines.push({ yKey: key, yAvg, tokens: arr, startX: arr[0]?.x ?? 0 });
  }

  // Sort reading order top→bottom (higher y is usually lower on page in PDF coords; pdf.js has origin bottom-left)
  lines.sort((a, b) => b.yAvg - a.yAvg);
  return { lines, bodyMedian };
}

/** Detect 2-column layout using K=2 clustering on line startX */
function detectColumns(lines) {
  if (lines.length < 12) return null; // small pages usually single column

  const xs = lines.map((l) => l.startX);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  if (maxX - minX < 150) return null; // not spaced enough

  // simple k-means init
  let c1 = minX,
    c2 = maxX;
  let changed = true;
  let iter = 0;
  while (changed && iter++ < 6) {
    const g1 = [],
      g2 = [];
    for (const x of xs) {
      const d1 = Math.abs(x - c1);
      const d2 = Math.abs(x - c2);
      (d1 <= d2 ? g1 : g2).push(x);
    }
    const n1 = g1.length ? g1.reduce((s, v) => s + v, 0) / g1.length : c1;
    const n2 = g2.length ? g2.reduce((s, v) => s + v, 0) / g2.length : c2;
    changed = Math.abs(n1 - c1) > 1 || Math.abs(n2 - c2) > 1;
    c1 = n1;
    c2 = n2;
  }

  // Assign lines to clusters
  const leftCenter = Math.min(c1, c2);
  const rightCenter = Math.max(c1, c2);
  const left = [],
    right = [];
  for (const l of lines) {
    const dL = Math.abs(l.startX - leftCenter);
    const dR = Math.abs(l.startX - rightCenter);
    (dL <= dR ? left : right).push(l);
  }

  // Require both columns to have decent share
  const shareLeft = left.length / lines.length;
  const shareRight = right.length / lines.length;
  if (shareLeft < 0.3 || shareRight < 0.3) return null;

  // Sort each column top→bottom
  left.sort((a, b) => b.yAvg - a.yAvg);
  right.sort((a, b) => b.yAvg - a.yAvg);

  return { left, right };
}

/** Merge tokens on a line into TextRuns (preserving basic styles) */
function lineToRuns(line, bodyMedian) {
  const runs = [];
  const SPACE_GAP_FACTOR = 0.35; // add space if x-gap > factor * fontSize
  let prev = null;
  let bufferText = "";
  let currentStyle = null;

  const flush = () => {
    if (!bufferText) return;
    runs.push(
      new TextRun({
        text: bufferText,
        bold: currentStyle.bold,
        italics: currentStyle.italics,
        color: currentStyle.color,
        size: currentStyle.size,
      })
    );
    bufferText = "";
  };

  for (const t of line.tokens) {
    const style = mapTextStyle(t, bodyMedian);

    // space heuristic based on x gap
    let needsSpace = false;
    if (prev) {
      const gap = t.x - (prev.x + prev.width);
      const threshold = Math.max(
        2,
        (prev.fontSize || bodyMedian) * SPACE_GAP_FACTOR
      );
      needsSpace = gap > threshold;
    }

    // start or style changed → flush
    const styleChanged =
      !currentStyle ||
      currentStyle.bold !== style.bold ||
      currentStyle.italics !== style.italics ||
      currentStyle.size !== style.size;

    if (styleChanged) {
      flush();
      currentStyle = style;
    }

    // append token text
    if (needsSpace && bufferText && !bufferText.endsWith("-")) {
      bufferText += " ";
    }
    bufferText += t.str;

    prev = t;
  }
  flush();
  return runs;
}

/** Bullet / numbered list detection */
function classifyListLine(text) {
  const t = text.trim();
  if (/^(\u2022|•|-|\*)\s+/.test(t))
    return { type: "bullet", markerLen: t.indexOf(" ") + 1 };
  if (/^\(?\d+\)|^\d+\.\s+/.test(t)) {
    const m = t.match(/^\(?\d+\)|^\d+\./);
    return { type: "number", markerLen: (m?.[0]?.length || 0) + 1 };
  }
  return null;
}

/** Group lines into paragraphs inside each column */
function linesToParagraphs(orderedLines, bodyMedian) {
  const paras = [];
  const LINE_GAP_BREAK = Math.max(14, bodyMedian * 1.3);

  let cur = [];
  for (let i = 0; i < orderedLines.length; i++) {
    const L = orderedLines[i];
    const prev = orderedLines[i - 1];

    // convert tokens to runs and plain text
    const runs = lineToRuns(L, bodyMedian);
    const plain = runs.map((r) => r.options?.text || "").join("");

    // list detection
    const listInfo = classifyListLine(plain);

    // paragraph break heuristic (vertical gap)
    let newPara = false;
    if (prev) {
      const gap = Math.abs(prev.yAvg - L.yAvg);
      if (gap > LINE_GAP_BREAK) newPara = true;
    } else {
      newPara = true;
    }

    // hyphen-merge with previous line (inside same paragraph)
    if (!newPara && cur.length) {
      const prevRuns = cur[cur.length - 1].children;
      const prevText = prevRuns?.map((r) => r.options?.text || "").join("");
      if (/-$/.test(prevText?.trim()) && /^[a-z]/.test(plain.trim())) {
        // merge by removing hyphen + no extra space
        const fixedPrev = prevText.replace(/-+\s*$/, "");
        cur[cur.length - 1] = new Paragraph({
          children: [new TextRun({ text: fixedPrev })],
          spacing: { after: 0 },
        });
        cur.push(new Paragraph({ children: runs, spacing: { after: 0 } }));
        continue;
      }
    }

    // start a new paragraph if needed
    if (newPara && cur.length) {
      paras.push(...cur);
      cur = [];
    }

    // heading heuristic
    const avgSize = median(L.tokens.map((t) => t.fontSize));
    const isHeading1 = avgSize >= bodyMedian + 6;
    const isHeading2 = !isHeading1 && avgSize >= bodyMedian + 3;

    if (listInfo) {
      const trimmed = plain.slice(listInfo.markerLen).trimStart();
      const listRuns = [new TextRun({ text: trimmed })];
      cur.push(
        new Paragraph({
          children: listRuns,
          bullet: { level: listInfo.type === "bullet" ? 0 : undefined },
          numbering:
            listInfo.type === "number"
              ? { reference: "num", level: 0 }
              : undefined,
          spacing: { after: 120 },
        })
      );
    } else if (isHeading1 || isHeading2) {
      cur.push(
        new Paragraph({
          children: runs,
          heading: isHeading1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
          spacing: { after: 200 },
        })
      );
    } else {
      cur.push(new Paragraph({ children: runs, spacing: { after: 120 } }));
    }
  }

  if (cur.length) paras.push(...cur);
  return paras;
}

/** OPTIONAL: Render a page as PNG (preserve-layout mode) */
async function renderPageToPNG(page, scale = 1.2) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({ canvasContext: ctx, viewport }).promise;

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(new Uint8Array(reader.result));
        reader.readAsArrayBuffer(blob);
      },
      "image/png",
      0.92
    );
  });
}

/** OPTIONAL: extremely naive table detector (columns by aligned x) */
function detectTablesFromItems(items) {
  if (!items?.length) return null;

  // bucket x’s
  const colsMap = {};
  for (const it of items) {
    const x = Math.round(num(it.transform?.[4]) / 12) * 12;
    if (!colsMap[x]) colsMap[x] = 0;
    colsMap[x]++;
  }
  const cols = Object.entries(colsMap)
    .filter(([, n]) => n > 6)
    .map(([x]) => Number(x))
    .sort((a, b) => a - b);

  if (cols.length < 2) return null;

  // group rows by y
  const rowMap = {};
  for (const it of items) {
    const y = Math.round(num(it.transform?.[5]) / 12) * 12;
    const x = Math.round(num(it.transform?.[4]) / 12) * 12;
    if (!rowMap[y]) rowMap[y] = {};
    rowMap[y][x] = (rowMap[y][x] || "") + (it.str || "");
  }

  const sortedY = Object.keys(rowMap)
    .map(Number)
    .sort((a, b) => b - a);
  const rows = sortedY.map((y) =>
    cols.map((x) => (rowMap[y]?.[x] || "").trim())
  );
  if (!rows.length) return null;
  return { rows };
}

/* ---------------------------
   Main conversion
---------------------------- */

export async function convertPdfArrayBufferToDocx(arrayBuffer, options = {}) {
  const {
    includePageSnapshots = false, // add per-page image
    headingOnFirstPage = true, // top heading
    includeNaiveTables = false, // experimental
  } = options;

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const docChildren = [];

  if (headingOnFirstPage) {
    docChildren.push(
      new Paragraph({
        text: "Converted from PDF",
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 300 },
      })
    );
  }

  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex++) {
    const page = await pdf.getPage(pageIndex);

    // TEXT CONTENT
    const content = await page.getTextContent({ includeMarkedContent: false });
    const items = normalizeItems(content.items);
    const { lines, bodyMedian } = groupIntoLines(items);

    // Multi-column detection (if any)
    let orderedLines;
    const columns = detectColumns(lines);
    if (columns) {
      // read left column top→bottom, then right top→bottom
      orderedLines = [...columns.left, ...columns.right];
    } else {
      // single column → just top→bottom
      orderedLines = lines;
    }

    // Convert to Paragraphs
    const paragraphs = linesToParagraphs(orderedLines, bodyMedian);
    if (paragraphs.length) {
      docChildren.push(...paragraphs);
    } else {
      // keep page spacer for blank pages
      docChildren.push(new Paragraph(""));
    }

    // TABLES (experimental)
    if (includeNaiveTables) {
      const tSpec = detectTablesFromItems(content.items);
      if (tSpec?.rows?.length) {
        const tRows = tSpec.rows.map(
          (cols) =>
            new TableRow({
              children: cols.map(
                (txt) =>
                  new TableCell({
                    width: {
                      size: 100 / Math.max(1, cols.length),
                      type: WidthType.PERCENTAGE,
                    },
                    children: [new Paragraph(String(txt || ""))],
                  })
              ),
            })
        );
        docChildren.push(
          new Paragraph({ text: "" }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tRows,
          }),
          new Paragraph({ text: "" })
        );
      }
    }

    // OPTIONAL PAGE SNAPSHOT (preserve-layout fallback)
    if (includePageSnapshots && typeof window !== "undefined") {
      const pngBytes = await renderPageToPNG(page, 1.25);
      if (pngBytes) {
        docChildren.push(
          new Paragraph({ text: "" }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: pngBytes,
                transformation: { width: 600, height: Math.round(600 * 0.75) },
              }),
            ],
          }),
          new Paragraph({ text: "" })
        );
      }
    }

    // Page break (except after last page)
    if (pageIndex < pdf.numPages) {
      docChildren.push(
        new Paragraph({
          children: [new TextRun({ text: "", break: 1 })],
          spacing: { before: 200, after: 200 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children: docChildren }],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}
