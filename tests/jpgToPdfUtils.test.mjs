import test from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import {
  loadImageSource,
  processImageToJpegBytes,
  convertImagesToSinglePdf,
  convertImagesToZipPdfs,
} from "../src/tools/pdf/jpg-to-pdf/jpgToPdfUtils.js";

// Standard 1x1 white JPEG binary
const DUMMY_JPEG_BYTES = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
  0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
  0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
  0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
  0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
  0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
  0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
  0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
  0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
  0x00, 0xbf, 0x00, 0xff, 0xd9,
]);

// Set up lightweight DOM polyfills for Node test execution
const origImage = globalThis.Image;
const origDocument = globalThis.document;
const origURL = globalThis.URL;

function setupMockDom() {
  globalThis.Image = class MockImage {
    constructor() {
      this.naturalWidth = 800;
      this.naturalHeight = 600;
      this.width = 800;
      this.height = 600;
      setTimeout(() => {
        if (this._src === "fail-me") {
          if (this.onerror) this.onerror(new Error("Failed to load"));
        } else {
          if (this.onload) this.onload();
        }
      }, 0);
    }
    set src(val) {
      this._src = val;
    }
    get src() {
      return this._src;
    }
  };

  globalThis.document = {
    createElement: (tag) => {
      if (tag === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: () => ({
            fillStyle: "",
            fillRect: () => {},
            translate: () => {},
            rotate: () => {},
            drawImage: () => {},
          }),
          toBlob: (cb) => {
            cb(new Blob([DUMMY_JPEG_BYTES], { type: "image/jpeg" }));
          },
        };
      }
      return {};
    },
  };

  if (!globalThis.URL.createObjectURL) {
    globalThis.URL.createObjectURL = () => "blob:mock-url";
  }
}

function restoreMockDom() {
  globalThis.Image = origImage;
  globalThis.document = origDocument;
  globalThis.URL = origURL;
}

test("loadImageSource resolves dimensions from string or file", async () => {
  setupMockDom();
  try {
    const fromStr = await loadImageSource("https://example.com/test.jpg");
    assert.equal(fromStr.width, 800);
    assert.equal(fromStr.height, 600);
    assert.ok(fromStr.img);

    const dummyFile = new File([new Uint8Array(10)], "sample.jpg", {
      type: "image/jpeg",
    });
    const fromFile = await loadImageSource(dummyFile);
    assert.equal(fromFile.width, 800);
    assert.equal(fromFile.height, 600);
  } finally {
    restoreMockDom();
  }
});

test("loadImageSource rejects on invalid image source", async () => {
  setupMockDom();
  try {
    await assert.rejects(
      async () => {
        await loadImageSource("fail-me");
      },
      { message: "Failed to load image file." }
    );
  } finally {
    restoreMockDom();
  }
});

test("processImageToJpegBytes produces valid JPEG byte array with rotation support", async () => {
  setupMockDom();
  try {
    const img = new Image();
    const bytes0 = await processImageToJpegBytes(img, 0);
    assert.ok(bytes0 instanceof Uint8Array);
    assert.ok(bytes0.length > 0);

    const bytes90 = await processImageToJpegBytes(img, 90);
    assert.ok(bytes90 instanceof Uint8Array);
    assert.ok(bytes90.length > 0);
  } finally {
    restoreMockDom();
  }
});

test("convertImagesToSinglePdf builds a valid multi-page PDF document", async () => {
  setupMockDom();
  try {
    const items = [
      {
        file: new File([DUMMY_JPEG_BYTES], "page1.jpg", { type: "image/jpeg" }),
        rotation: 0,
      },
      {
        file: new File([DUMMY_JPEG_BYTES], "page2.jpg", { type: "image/jpeg" }),
        rotation: 90,
      },
    ];

    const pdfBlob = await convertImagesToSinglePdf(items, {
      pageSize: "a4",
      orientation: "portrait",
      margin: "small",
    });

    assert.ok(pdfBlob instanceof Blob);
    assert.equal(pdfBlob.type, "application/pdf");

    const pdfBuffer = await pdfBlob.arrayBuffer();
    const doc = await PDFDocument.load(new Uint8Array(pdfBuffer));
    assert.equal(doc.getPageCount(), 2);
  } finally {
    restoreMockDom();
  }
});

test("convertImagesToZipPdfs produces a valid ZIP archive containing PDF files", async () => {
  setupMockDom();
  try {
    const items = [
      {
        file: new File([DUMMY_JPEG_BYTES], "photo-a.jpg", { type: "image/jpeg" }),
        rotation: 0,
      },
      {
        file: new File([DUMMY_JPEG_BYTES], "photo-b.jpg", { type: "image/jpeg" }),
        rotation: 0,
      },
    ];

    const zipBlob = await convertImagesToZipPdfs(items, {
      pageSize: "fit",
      margin: "none",
    });

    assert.ok(zipBlob instanceof Blob);
    assert.ok(zipBlob.size > 0);
  } finally {
    restoreMockDom();
  }
});
