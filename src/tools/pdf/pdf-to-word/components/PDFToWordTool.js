"use client";

import React, { useState } from "react";
import FileUploader from "@/components/pdf/file/FileUploader";
import FilePreviewList from "@/tools/pdf/compress-pdf/components/FilePreviewList";
import Button from "@/components/ui/Button";

export default function PDFToWordTool() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);

  // ✅ file selection
  const handleFileSelect = (uploadedFiles) => {
    setFiles(uploadedFiles);
    setDownloadUrl(null);
    setError(null);
  };

  // ✅ Convert PDF → Word
  const handleConvert = async () => {
    if (!files.length) {
      setError("⚠️ Please upload a PDF file first.");
      return;
    }

    setLoading(true);
    setError(null);
    setDownloadUrl(null);

    try {
      const formData = new FormData();
      formData.append("file", files[0].file);

      const res = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Conversion failed.");
      }

      const data = await res.json();
      if (data.downloadUrl) {
        setDownloadUrl(data.downloadUrl);
      } else {
        throw new Error("Conversion did not return a file.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-2xl border border-gray-200">
      <h2 className="text-2xl font-semibold">📄 PDF to Word Converter</h2>
      <p className="text-gray-600 text-sm text-center">
        Upload a PDF file and convert it into an editable Word document (DOCX).
      </p>

      {/* ✅ File Upload */}
      <FileUploader
        onUpload={handleFileSelect}
        accept="application/pdf"
        multiple={false}
      />

      {/* ✅ File Preview */}
      {files.length > 0 && (
        <FilePreviewList files={files} setFiles={setFiles} />
      )}

      {/* ✅ Convert Button */}
      <Button
        onClick={handleConvert}
        disabled={loading || files.length === 0}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {loading ? "⏳ Converting..." : "Convert to Word"}
      </Button>

      {/* ✅ Error Message */}
      {error && (
        <p className="text-red-500 text-sm text-center w-full">{error}</p>
      )}

      {/* ✅ Download Link */}
      {downloadUrl && (
        <a
          href={downloadUrl}
          download={
            files[0]?.file?.name?.replace(/\.pdf$/i, "") + "_converted.docx"
          }
          className="w-full text-center mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg"
        >
          ⬇ Download Word File
        </a>
      )}
    </div>
  );
}
