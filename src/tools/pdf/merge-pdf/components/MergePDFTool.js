// src/app/tools/pdf/merge-pdf/components/MergePDFTool.js
"use client";

import React, { useState } from "react";
import FileUploader from "./FileUploader";
import FilePreviewList from "./FilePreviewList";
import ActionBar from "./ActionBar";
import usePDFJS from "../hooks/usePDFJS";
import useThumbnails from "../hooks/useThumbnails";
import { mergePDFs } from "../utils/pdfUtils";


const MergePDFTool = () => {
  const [files, setFiles] = useState([]);
  const { pdfjs, isLoading: isPDFJSLoading } = usePDFJS();
  const { thumbnails, isGenerating } = useThumbnails(files, pdfjs);
  const [isMerging, setIsMerging] = useState(false);

  const handleUpload = (uploadedFiles) => {
    const newFiles = Array.from(uploadedFiles).filter(
      (file) => file.type === "application/pdf"
    );

    if (newFiles.length === 0) return;
    setFiles((prev) => [...prev, ...newFiles]);
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
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      alert("Please upload at least 2 PDF files to merge");
      return;
    }

    setIsMerging(true);
    try {
      const mergedBlob = await mergePDFs(files);

      // Create download
      const url = URL.createObjectURL(mergedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `merged-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setFiles([]);
      alert("PDFs merged successfully! Download started.");
    } catch (error) {
      console.error("Error merging PDFs:", error);
      alert("Error merging PDFs. Please try again.");
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="">
        <FileUploader onUpload={handleUpload} />
      </div>

      {files.length > 0 && (
        <div className="">
          <FilePreviewList
            files={files}
            thumbnails={thumbnails}
            onRemove={handleRemove}
            onReorder={handleReorder}
            pdfjsLoaded={!!pdfjs && !isPDFJSLoading}
            isGenerating={isGenerating}
          />
          <ActionBar
            fileCount={files.length}
            onClearAll={handleClearAll}
            onMerge={handleMerge}
            isMerging={isMerging}
            canMerge={files.length >= 2}
          />
        </div>
      )}
    </div>
  );
};

export default MergePDFTool;
