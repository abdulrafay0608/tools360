import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

const ROOT = process.cwd();
const PORT = Number(process.env.ROTATE_PDF_PORT || 4331);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const EVIDENCE = path.resolve(
  process.env.ROTATE_PDF_EVIDENCE ||
    path.join(ROOT, "tests", "verification-evidence", "svg-to-png", "rotate-pdf-isolated")
);
const FIXTURE = path.join(ROOT, "tests", "fixtures", "organize-six-page-rotated.pdf");
fs.mkdirSync(EVIDENCE, { recursive: true });

let server;
let browser;

async function waitForServer() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 60000) {
    if (server?.exitCode !== null && server?.exitCode !== undefined) {
      throw new Error(`Production server exited with code ${server.exitCode}.`);
    }
    try {
      const response = await fetch(`${BASE_URL}/tools/rotate-pdf`);
      if (response.ok) return;
    } catch {
      // The production server is not ready yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`Production server did not become ready at ${BASE_URL}.`);
}

try {
  const occupied = await fetch(`${BASE_URL}/tools/rotate-pdf`).catch(() => null);
  if (occupied?.ok) throw new Error(`Port ${PORT} is already serving a page.`);
  if (!fs.existsSync(path.join(ROOT, ".next", "BUILD_ID"))) {
    throw new Error("Production build is missing. Run npm run build first.");
  }

  server = spawn(
    process.execPath,
    [
      path.join(ROOT, "node_modules", "next", "dist", "bin", "next"),
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(PORT),
    ],
    { cwd: ROOT, stdio: "inherit", env: { ...process.env, PORT: String(PORT) } }
  );
  await waitForServer();

  browser = await chromium.launch();
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(`${BASE_URL}/tools/rotate-pdf`, { waitUntil: "networkidle" });
  await page.locator("[data-dropzone='true']").waitFor();
  await page.locator("input[type='file']").first().setInputFiles(FIXTURE);
  await page.locator("article[data-page-source]").first().waitFor({ timeout: 30000 });

  const originalPdf = await PDFDocument.load(fs.readFileSync(FIXTURE));
  const originalRotations = originalPdf.getPages().map((pdfPage) => pdfPage.getRotation().angle);
  const pageCards = await page.locator("article[data-page-source]").count();
  assert.equal(pageCards, originalPdf.getPageCount());

  await page.getByRole("button", { name: "Rotate all right" }).click();
  await page.waitForFunction(
    (rotations) => {
      const cards = [...document.querySelectorAll("article[data-page-source]")];
      return cards.length === rotations.length && cards.every((card, index) =>
        Number(card.dataset.pageRotation) === ((rotations[index] + 90) % 360)
      );
    },
    originalRotations,
    { timeout: 10000 }
  );

  const outputPath = path.join(EVIDENCE, "rotated-result.pdf");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download rotated PDF" }).click(),
  ]);
  await download.saveAs(outputPath);

  const exportedPdf = await PDFDocument.load(fs.readFileSync(outputPath));
  const exportedRotations = exportedPdf.getPages().map((pdfPage) => pdfPage.getRotation().angle);
  const expectedRotations = originalRotations.map((rotation) => (rotation + 90) % 360);
  assert.equal(exportedPdf.getPageCount(), originalPdf.getPageCount());
  assert.deepEqual(exportedRotations, expectedRotations);
  assert.deepEqual(consoleErrors, []);

  await page.screenshot({
    path: path.join(EVIDENCE, "rotate-pdf-isolated.png"),
    fullPage: true,
  });
  const report = {
    result: "PASS",
    fixture: path.relative(ROOT, FIXTURE),
    pageCards,
    filename: download.suggestedFilename(),
    expectedRotations,
    exportedRotations,
    consoleErrors,
    outputPath,
  };
  fs.writeFileSync(path.join(EVIDENCE, "results.json"), JSON.stringify(report, null, 2));
  console.log("PASS isolated Rotate PDF upload → rotate → download → reopen flow");
  console.log(JSON.stringify(report, null, 2));
} finally {
  if (browser) await browser.close();
  if (server && server.exitCode === null) {
    server.kill();
    await new Promise((resolve) => {
      const timeout = setTimeout(resolve, 5000);
      server.once("exit", () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }
}
