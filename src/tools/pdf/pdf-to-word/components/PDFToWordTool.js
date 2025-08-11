"use client";

import React, { useState, useCallback } from "react";
import FileUploader from "@/components/pdf/file/FileUploader";
import FilePreviewList from "@/components/pdf/file/FilePreviewList";
import Button from "@/components/ui/Button";
import { FaDownload, FaFileWord, FaCloudUploadAlt } from "react-icons/fa";

export default function PdfToWordTool() {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState(null);
  const [error, setError] = useState("");
  const [progressText, setProgressText] = useState("");

  const handleUpload = useCallback((newFiles) => {
    setFiles(newFiles);
    setResultBlob(null);
    setError("");
    setProgressText("");
  }, []);

  const handleRemove = useCallback((idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const convert = async () => {
    if (!files?.length) return;
    setProcessing(true);
    setError("");
    setProgressText("Uploading...");

    try {
      const file = files[0];

      // Send raw file bytes to server. We'll set headers with filename.
      const uploadResp = await fetch("/api/convert-pdf-to-docx", {
        method: "POST",
        headers: {
          "x-filename": file.name,
          "content-type": file.type || "application/pdf",
        },
        body: await file.arrayBuffer(), // send raw ArrayBuffer
      });

      if (!uploadResp.ok) {
        const json = await uploadResp.json().catch(() => null);
        throw new Error(
          json?.error || `Conversion failed: ${uploadResp.status}`
        );
      }

      setProgressText("Downloading converted file...");
      const blob = await uploadResp.blob();
      setResultBlob(blob);
      setProgressText("Ready");
    } catch (err) {
      console.error(err);
      setError(err.message || "Conversion failed");
    } finally {
      setProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      files?.[0]?.name?.replace(/\.pdf$/i, ".docx") || "converted.docx";
    a.click();
    URL.revokeObjectURL(url);

    // reset so user can upload again
    setFiles([]);
    setResultBlob(null);
    setProgressText("");
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      {files.length === 0 ? (
        <FileUploader
          onUpload={handleUpload}
          accept="application/pdf"
          multiple={false}
        />
      ) : (
        <>
          <FilePreviewList
            files={files}
            thumbnails={[]} // optional: reuse your thumbnails hook if desired
            onRemove={handleRemove}
            pdfjsLoaded={false}
            isGenerating={false}
          />

          {!processing && !resultBlob && (
            <Button
              onClick={convert}
              variant="primary"
              size="md"
              icon={<FaCloudUploadAlt />}
              iconPosition="left"
              className="mt-4 w-full sm:w-auto"
            >
              Convert to Word
            </Button>
          )}

          {processing && (
            <div className="mt-4 text-gray-600 text-sm animate-pulse">
              {progressText}
            </div>
          )}

          {error && <div className="mt-3 text-red-600 text-sm">{error}</div>}

          {resultBlob && !processing && (
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
              <Button
                onClick={downloadResult}
                variant="primary"
                size="md"
                icon={<FaDownload />}
                iconPosition="left"
                className="w-full sm:w-auto"
              >
                Download .docx
              </Button>

              <div className="text-gray-600 text-sm">
                {((resultBlob.size || 0) / 1024).toFixed(1)} KB
              </div>

              <Button
                onClick={() => {
                  setFiles([]);
                  setResultBlob(null);
                }}
                variant="secondary"
                size="md"
                className="w-full sm:w-auto"
              >
                Convert another
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
