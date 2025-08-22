import { NextResponse } from "next/server";
import FormData from "form-data";
import fetch from "node-fetch";

export async function POST(req) {
  try {
    const data = await req.formData();
    const file = data.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    console.log("process.env", process.env);
    const apiKey = process.env.CLOUDCONVERT_API_KEY;
    console.log("apiKey", apiKey);
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    // ✅ Upload file to CloudConvert
    const jobRes = await fetch(
      "https://api.cloudconvert.com/v2/import/upload",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );
    const uploadTask = await jobRes.json();

    const uploadUrl = uploadTask.data.result.form.url;
    const uploadParams = uploadTask.data.result.form.parameters;

    const uploadForm = new FormData();
    for (const [k, v] of Object.entries(uploadParams)) {
      uploadForm.append(k, v);
    }
    uploadForm.append("file", file);

    await fetch(uploadUrl, { method: "POST", body: uploadForm });

    // ✅ Create convert job
    const jobConvert = await fetch("https://api.cloudconvert.com/v2/jobs", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tasks: {
          import: {
            operation: "import/upload",
            result: uploadTask.data.result,
          },
          convert: {
            operation: "convert",
            input: "import",
            output_format: "docx",
          },
          export: {
            operation: "export/url",
            input: "convert",
          },
        },
      }),
    });

    const job = await jobConvert.json();
    const exportTask = job.data.tasks.find((t) => t.operation === "export/url");

    // ✅ Poll until export ready
    let fileUrlOut = null;
    for (let i = 0; i < 15; i++) {
      const statusRes = await fetch(
        `https://api.cloudconvert.com/v2/tasks/${exportTask.id}`,
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );
      const statusJson = await statusRes.json();
      if (statusJson.data.status === "finished") {
        fileUrlOut = statusJson.data.result.files[0].url;
        break;
      }
      await new Promise((res) => setTimeout(res, 2000));
    }

    if (!fileUrlOut) {
      return NextResponse.json(
        { error: "Conversion timed out" },
        { status: 500 }
      );
    }

    return NextResponse.json({ downloadUrl: fileUrlOut });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
