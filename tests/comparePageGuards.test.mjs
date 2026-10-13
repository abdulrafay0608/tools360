import test from "node:test";
import assert from "node:assert/strict";
import { validateComparePageViewport } from "../src/tools/pdf/compare-pdf/compareUtils.js";

test("compare page guard accepts a normal PDF viewport", () => {
  assert.deepEqual(
    validateComparePageViewport({ width: 612, height: 792 }, 16 * 1024 * 1024),
    { width: 612, height: 792 }
  );
});

test("compare page guard rejects an oversized render area", () => {
  assert.throws(
    () => validateComparePageViewport({ width: 20_000, height: 20_000 }, 16 * 1024 * 1024),
    /too large for safe browser rendering/
  );
});

test("compare page guard rejects invalid dimensions", () => {
  assert.throws(
    () => validateComparePageViewport({ width: 0, height: 792 }, 16 * 1024 * 1024),
    /invalid dimensions/
  );
});
