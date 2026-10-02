import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "node:fs";
import path from "node:path";

const fixturesDir = path.resolve("tests/fixtures");
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

async function createFixtures() {
  // 1. Valid 4-page PDF with distinctive colors and titles
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const textFont = await doc.embedFont(StandardFonts.Helvetica);

  const colors = [
    rgb(0.14, 0.36, 0.31), // Forest green
    rgb(0.1, 0.3, 0.6),    // Royal blue
    rgb(0.7, 0.2, 0.1),    // Crimson
    rgb(0.5, 0.1, 0.5),    // Purple
  ];

  for (let i = 1; i <= 4; i++) {
    const page = doc.addPage([595.28, 841.89]); // A4
    page.drawRectangle({
      x: 30,
      y: 770,
      width: 535,
      height: 40,
      color: colors[i - 1],
    });

    page.drawText(`Document Report - Page ${i}`, {
      x: 45,
      y: 782,
      size: 18,
      font,
      color: rgb(1, 1, 1),
    });

    page.drawText(`This is page ${i} of our 4-page test PDF document.`, {
      x: 45,
      y: 720,
      size: 14,
      font: textFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(`Testing PDF to JPG high-resolution rasterization and individual/ZIP export.`, {
      x: 45,
      y: 690,
      size: 12,
      font: textFont,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  const validBytes = await doc.save();
  fs.writeFileSync(path.join(fixturesDir, "sample-multipage.pdf"), Buffer.from(validBytes));
  console.log("Created: tests/fixtures/sample-multipage.pdf");

  // 2. Corrupted PDF (invalid header/body)
  fs.writeFileSync(
    path.join(fixturesDir, "corrupted.pdf"),
    Buffer.from("%PDF-1.7\n%corrupted binary stream\n%%EOF_CORRUPT_DATA_RANDOM_BYTES_123456789")
  );
  console.log("Created: tests/fixtures/corrupted.pdf");

  // 3. Password protected PDF structure
  const protectedPdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
4 0 obj
<<
  /Filter /Standard
  /V 2
  /R 3
  /O <2bbf7090ae86ace085dc504a41f7eefebd511f592bdf9602e132dcee137a2202>
  /U <0123456789abcdef0123456789abcdef00000000000000000000000000000000>
  /P -3904
>>
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000187 00000 n 
trailer
<<
  /Size 5
  /Root 1 0 R
  /Encrypt 4 0 R
  /ID [<0123456789abcdef0123456789abcdef> <0123456789abcdef0123456789abcdef>]
>>
startxref
340
%%EOF`;
  fs.writeFileSync(path.join(fixturesDir, "sample-protected.pdf"), Buffer.from(protectedPdf));
  console.log("Created: tests/fixtures/sample-protected.pdf");

  // 4. Non-PDF invalid file
  fs.writeFileSync(
    path.join(fixturesDir, "invalid.txt"),
    Buffer.from("This is a plain text file, not a PDF document.")
  );
  console.log("Created: tests/fixtures/invalid.txt");
}

createFixtures().catch(console.error);
