import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const fixturesDir = path.resolve("tests/fixtures");
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Helper to get buffer from dataUrl
  function dataUrlToBuffer(dataUrl) {
    const base64 = dataUrl.split(",")[1];
    return Buffer.from(base64, "base64");
  }

  // 1. Large JPG Photo (e.g. 2400x1600)
  const largeJpgData = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2400;
    canvas.height = 1600;
    const ctx = canvas.getContext("2d");
    // Draw rich gradient
    const grad = ctx.createLinearGradient(0, 0, 2400, 1600);
    grad.addColorStop(0, "#1e3a8a");
    grad.addColorStop(0.5, "#10b981");
    grad.addColorStop(1, "#f59e0b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2400, 1600);

    // Draw some shapes
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 96px sans-serif";
    ctx.fillText("High-Resolution Test Photo", 100, 200);

    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(${i * 5}, ${255 - i * 4}, 180, 0.7)`;
      ctx.beginPath();
      ctx.arc((i * 47) % 2400, (i * 31) % 1600, 40 + (i % 30), 0, Math.PI * 2);
      ctx.fill();
    }
    return canvas.toDataURL("image/jpeg", 0.95);
  });
  fs.writeFileSync(path.join(fixturesDir, "large-photo.jpg"), dataUrlToBuffer(largeJpgData));
  console.log("Created large-photo.jpg");

  // 2. PNG with transparency (400x400, circle with clear transparent area)
  const transparentPngData = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 400, 400);

    // Draw a semi-transparent colored circle
    ctx.fillStyle = "rgba(220, 38, 38, 0.8)";
    ctx.beginPath();
    ctx.arc(200, 200, 150, 0, Math.PI * 2);
    ctx.fill();

    // Center star / text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Transparent", 200, 210);

    return canvas.toDataURL("image/png");
  });
  fs.writeFileSync(path.join(fixturesDir, "transparent.png"), dataUrlToBuffer(transparentPngData));
  console.log("Created transparent.png");

  // 3. WebP Image (800x600)
  const sampleWebpData = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px sans-serif";
    ctx.fillText("Sample WebP Image", 50, 100);
    return canvas.toDataURL("image/webp", 0.85);
  });
  fs.writeFileSync(path.join(fixturesDir, "sample.webp"), dataUrlToBuffer(sampleWebpData));
  console.log("Created sample.webp");

  // 4. Tiny already-optimized JPG (32x32 at very low quality so recompressing at 75% is larger)
  const tinyOptimizedData = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#888888";
    ctx.fillRect(0, 0, 32, 32);
    return canvas.toDataURL("image/jpeg", 0.1);
  });
  fs.writeFileSync(path.join(fixturesDir, "tiny-optimized.jpg"), dataUrlToBuffer(tinyOptimizedData));
  console.log("Created tiny-optimized.jpg");

  // 5. JPG with EXIF orientation 6 (Rotate 90 CW)
  // Let's draw an asymmetric image: 300 wide x 150 high. Top left has a red square.
  const baseJpgForExif = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 150;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, 300, 150);

    // Red square in top-left
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(10, 10, 50, 50);

    ctx.fillStyle = "#111827";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText("Top-Left Red", 70, 45);

    return canvas.toDataURL("image/jpeg", 0.9);
  });

  const baseJpgBuffer = dataUrlToBuffer(baseJpgForExif);

  // Build standard EXIF APP1 payload with Orientation tag (0x0112) = 6
  // SOI is bytes 0..1 (FF D8)
  const exifApp1 = Buffer.from([
    0xff, 0xe1, // APP1 marker
    0x00, 0x22, // length = 34 bytes
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // "Exif\0\0"
    0x49, 0x49, 0x2a, 0x00, // TIFF little-endian header, magic 42
    0x08, 0x00, 0x00, 0x00, // offset of 0th IFD (8)
    0x01, 0x00, // 1 directory entry
    0x12, 0x01, // Tag 0x0112 (Orientation)
    0x03, 0x00, // Type: SHORT (3)
    0x01, 0x00, 0x00, 0x00, // Count: 1
    0x06, 0x00, 0x00, 0x00, // Value: 6 (Rotate 90 CW)
    0x00, 0x00, 0x00, 0x00  // Next IFD: 0
  ]);

  // Insert APP1 directly after SOI (0xFF, 0xD8)
  const exifJpgBuffer = Buffer.concat([
    baseJpgBuffer.subarray(0, 2),
    exifApp1,
    baseJpgBuffer.subarray(2)
  ]);
  fs.writeFileSync(path.join(fixturesDir, "exif-orientation-6.jpg"), exifJpgBuffer);
  console.log("Created exif-orientation-6.jpg");

  // 6. Corrupted JPG
  fs.writeFileSync(
    path.join(fixturesDir, "corrupted.jpg"),
    Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x11, 0x22, 0x33, 0x44, 0x55])
  );
  console.log("Created corrupted.jpg");

  // 7. Unsupported SVG & HEIC
  fs.writeFileSync(
    path.join(fixturesDir, "unsupported.svg"),
    Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="red"/></svg>')
  );
  console.log("Created unsupported.svg");

  // 8. 8000x6000 image for responsiveness test
  const hugeJpgData = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 8000;
    canvas.height = 6000;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(0, 0, 8000, 6000);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 200px sans-serif";
    ctx.fillText("8000x6000 Huge Image", 500, 1000);
    return canvas.toDataURL("image/jpeg", 0.5);
  });
  fs.writeFileSync(path.join(fixturesDir, "huge-8000x6000.jpg"), dataUrlToBuffer(hugeJpgData));
  console.log("Created huge-8000x6000.jpg");

  await browser.close();
  console.log("All fixtures generated successfully!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
