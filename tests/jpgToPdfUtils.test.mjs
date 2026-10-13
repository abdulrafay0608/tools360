import test from "node:test";
import assert from "node:assert/strict";
import { loadImageSource } from "../src/tools/pdf/jpg-to-pdf/jpgToPdfUtils.js";

const originalImage = globalThis.Image;
const originalUrl = globalThis.URL;

class FakeImage {
  naturalWidth = 120;
  naturalHeight = 80;
  set src(value) {
    this.currentSrc = value;
    if (value) queueMicrotask(() => this.onload?.());
  }
}

test.afterEach(() => {
  globalThis.Image = originalImage;
  globalThis.URL = originalUrl;
});

test("loadImageSource releases file object URLs exactly once", async () => {
  const created = [];
  const revoked = [];
  globalThis.Image = FakeImage;
  globalThis.URL = {
    createObjectURL(file) {
      const url = `blob:${file.name}`;
      created.push(url);
      return url;
    },
    revokeObjectURL(url) {
      revoked.push(url);
    },
  };

  const result = await loadImageSource({ name: "sample.jpg" });
  assert.equal(result.width, 120);
  assert.equal(result.height, 80);
  result.release();
  result.release();
  assert.deepEqual(created, ["blob:sample.jpg"]);
  assert.deepEqual(revoked, ["blob:sample.jpg"]);
});

test("loadImageSource revokes a file object URL when decoding fails", async () => {
  const revoked = [];
  globalThis.URL = {
    createObjectURL: () => "blob:broken",
    revokeObjectURL: (url) => revoked.push(url),
  };
  globalThis.Image = class extends FakeImage {
    set src(value) {
      this.currentSrc = value;
      if (value) queueMicrotask(() => this.onerror?.());
    }
  };

  await assert.rejects(
    loadImageSource({ name: "broken.jpg" }),
    /Failed to load image file/
  );
  assert.deepEqual(revoked, ["blob:broken"]);
});
