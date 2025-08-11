// pages/api/convert-pdf-to-docx.js
import FormData from "form-data";
import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: false, // we'll parse the raw stream ourselves
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.CONVERTAPI_SECRET;
  if (!secret) {
    return res
      .status(500)
      .json({ error: "Missing ConvertAPI secret on server" });
  }

  try {
    // We need to read incoming multipart (client sends FormData with file)
    // We'll pipe the incoming request to a new FormData for ConvertAPI.
    // Simpler approach: collect the file buffer from req and append to form-data.

    // Collect buffer
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // The client should send content-type and filename in headers
    // We'll read optional headers set by client:
    const filename = req.headers["x-filename"] || "uploaded.pdf";
    const contentType = req.headers["content-type"] || "application/pdf";

    const form = new FormData();
    form.append("File", buffer, {
      filename,
      contentType,
      knownLength: buffer.length,
    });

    // ConvertAPI endpoint (v2) for pdf -> docx
    const url = `https://v2.convertapi.com/convert/pdf/to/docx?Secret=${encodeURIComponent(
      secret
    )}`;

    const convertRes = await fetch(url, {
      method: "POST",
      body: form,
      headers: form.getHeaders ? form.getHeaders() : {},
      // large timeouts might be needed for big files
    });

    if (!convertRes.ok) {
      const text = await convertRes.text();
      console.error("ConvertAPI error:", convertRes.status, text);
      return res
        .status(502)
        .json({ error: "Conversion failed", details: text });
    }

    // ConvertAPI often responds with JSON containing Result array with Urls.
    // But if we set Accept to octet-stream, it may return binary.
    // The API returns JSON by default. We'll parse JSON and fetch the file URL.

    const json = await convertRes.json();

    // ConvertAPI returns an object with Files/Files[0].Url
    // Check structure (common keys: Files[0].Url)
    const resultFileUrl =
      json?.Files?.[0]?.Url ||
      json?.files?.[0]?.Url ||
      json?.Result?.Files?.[0]?.Url;

    if (!resultFileUrl) {
      console.error("Unexpected ConvertAPI response:", json);
      return res
        .status(502)
        .json({ error: "No result url from ConvertAPI", details: json });
    }

    // Fetch the converted docx binary
    const fileResp = await fetch(resultFileUrl);
    if (!fileResp.ok) {
      const txt = await fileResp.text();
      console.error("Failed to download converted file:", fileResp.status, txt);
      return res
        .status(502)
        .json({ error: "Failed to download converted file" });
    }

    const arrayBuffer = await fileResp.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);

    // Send back to client with proper headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="converted.docx"`
    );
    res.status(200).send(buf);
  } catch (err) {
    console.error("Server conversion error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}
