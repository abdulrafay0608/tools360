// src/app/tools/pdf/merge-pdf/components/MergePDFTool.js
"use client";

import React, { useState } from "react";
import { useAdPauseWhile } from "@/hooks/useAdPause";
import usePDFJS from "@/hooks/usePDFJS";
import useThumbnails from "@/hooks/useThumbnails";
import { mergePDFs } from "@/components/utils/pdfUtils";
import ActionBar from "./ActionBar";
import FileUploader from "@/components/pdf/file/FileUploader";
import FilePreviewList from "@/tools/pdf/merge-pdf/components/FilePreviewList";

const MergePDFTool = () => {
  const [files, setFiles] = useState([]);
  const { pdfjs, isLoading: isPDFJSLoading } = usePDFJS();
  const { thumbnails, isGenerating } = useThumbnails(files, pdfjs);
  const [isMerging, setIsMerging] = useState(false);
  const [message, setMessage] = useState("");
  const hasError =
    Boolean(message) && message !== "Your merged PDF is ready. The download has started.";
  useAdPauseWhile("merge-processing", isMerging || isGenerating);
  useAdPauseWhile("merge-error", hasError);
  useAdPauseWhile("merge-empty", files.length === 0);

  const handleUpload = (uploadedFiles) => {
    const newFiles = Array.from(uploadedFiles).filter(
      (file) =>
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    );
    if (newFiles.length === 0) return;
    setFiles((prev) => [...prev, ...newFiles]);
    setMessage("");
  };

  const handleRemove = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReorder = (fromIndex, toIndex) => {
    setFiles((prev) => {
      const updatedFiles = [...prev];
      const [movedFile] = updatedFiles.splice(fromIndex, 1);
      updatedFiles.splice(toIndex, 0, movedFile);
      return updatedFiles;
    });
  };

  const handleClearAll = () => {
    setFiles([]);
    setMessage("");
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setMessage("Select at least two PDF files to merge.");
      return;
    }

    setIsMerging(true);
    setMessage("");
    try {
      const mergedBlob = await mergePDFs(files);
      const url = URL.createObjectURL(mergedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `merged-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setFiles([]);
      setMessage("Your merged PDF is ready. The download has started.");
    } catch (error) {
      console.error("Error merging PDFs:", error);
      setMessage(error.message || "The PDFs could not be merged. Try again.");
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <FileUploader
        onUpload={handleUpload}
        accept="application/pdf,.pdf"
        multiple
      />

      {files.length > 0 && (
        <div>
          {message && (
            <p className="mb-4 text-sm text-[#a13c2f]" role="alert">
              {message}
            </p>
          )}
          <FilePreviewList
            files={files}
            thumbnails={thumbnails}
            onRemove={handleRemove}
            onReorder={handleReorder}
            pdfjsLoaded={!!pdfjs && !isPDFJSLoading}
            isGenerating={isGenerating}
          />

          {/* Action buttons / custom actions */}
          <ActionBar
            fileCount={files.length}
            onClearAll={handleClearAll}
            onMerge={handleMerge}
            isMerging={isMerging}
            canMerge={files.length >= 2}
          />
        </div>
      )}
      {files.length === 0 && message && (
        <p className="mt-4 text-sm text-[#527268]" role="status">
          {message}
        </p>
      )}
    </div>
  );
};

export default MergePDFTool;
