import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { SITE_NAME } from "../src/config/site.js";

function getFilesRecursively(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getFilesRecursively(fullPath));
    } else if (
      entry.isFile() &&
      /\.(js|jsx|ts|tsx|mjs|cjs|css)$/.test(entry.name)
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

test("brand consistency: SITE_NAME is the only source of the brand outside site.js", () => {
  assert.equal(SITE_NAME, "Tech Tools 360");

  const srcDir = path.resolve("src");
  const siteConfigPath = path.resolve("src/config/site.js");
  const allSrcFiles = getFilesRecursively(srcDir);

  const brandHardcodeViolations = [];
  const oldBrandViolations = [];

  for (const filePath of allSrcFiles) {
    // site.js is the designated single source of truth defining the brand
    if (path.resolve(filePath) === siteConfigPath) {
      continue;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, idx) => {
      // Check for hardcoded brand string "Tech Tools 360" outside site.js
      if (line.includes(SITE_NAME)) {
        brandHardcodeViolations.push({
          file: path.relative(process.cwd(), filePath),
          line: idx + 1,
          content: line.trim(),
        });
      }

      // Check for legacy brand string "Tools360"
      if (line.includes("Tools360")) {
        oldBrandViolations.push({
          file: path.relative(process.cwd(), filePath),
          line: idx + 1,
          content: line.trim(),
        });
      }
    });
  }

  assert.deepEqual(
    brandHardcodeViolations,
    [],
    `Brand string "${SITE_NAME}" must not be hardcoded in src/ outside site.js. Found violations:\n` +
      JSON.stringify(brandHardcodeViolations, null, 2)
  );

  assert.deepEqual(
    oldBrandViolations,
    [],
    `Legacy brand string "Tools360" must not exist in src/. Found violations:\n` +
      JSON.stringify(oldBrandViolations, null, 2)
  );
});
