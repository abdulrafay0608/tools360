"use client";

import React, { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { FaDownload, FaCompress } from "react-icons/fa";
import { TbReload } from "react-icons/tb";

import FileUploader from "@/components/pdf/file/FileUploader";
import FilePreviewList from "./FilePreviewList";
import Button from "@/components/ui/Button";
import { formatFileSize } from "@/components/utils/pdfUtils";
import usePDFJS from "@/hooks/usePDFJS";
import usePDFThumbnails from "@/hooks/useThumbnails";

/**
 * Compress a PDF file by removing metadata and enabling compression.
 * @param {File} file
 * @returns {Promise<Blob>}
 */
async function compressPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  // Clear metadata
  pdfDoc.setTitle("");
  pdfDoc.setAuthor("");
  pdfDoc.setSubject("");
  pdfDoc.setKeywords([]);
  pdfDoc.setProducer("");
  pdfDoc.setCreator("");
  const now = new Date();
  pdfDoc.setCreationDate(now);
  pdfDoc.setModificationDate(now);

  // Save compressed
  const compressedBytes = await pdfDoc.save({
    useObjectStreams: true,
    compress: true,
  });

  return new Blob([compressedBytes], { type: "application/pdf" });
}

const CompressPDFTool = () => {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [compressedBlob, setCompressedBlob] = useState(null);
  const [error, setError] = useState("");

  const { pdfjs, isLoading: isPDFJSLoading } = usePDFJS();
  const { thumbnails, isGenerating } = usePDFThumbnails(files, pdfjs);

  const handleUpload = useCallback((newFiles) => {
    setFiles(newFiles);
    setCompressedBlob(null); // Reset previous compression result
    setError("");
  }, []);

  const handleRemove = useCallback(
    (index) => setFiles((prev) => prev.filter((_, i) => i !== index)),
    []
  );

  const handleCompress = useCallback(async () => {
    if (!files.length) return;
    setProcessing(true);
    setError("");
    try {
      const compressed = await compressPdf(files[0]);
      setCompressedBlob(compressed);
    } catch (err) {
      console.error("Compression failed:", err);
      setError(
        err.message || "This PDF could not be processed. Try another file."
      );
    } finally {
      setProcessing(false);
    }
  }, [files]);

  const handleReload = useCallback(() => {
    setFiles([]);
    setCompressedBlob(null);
    setError("");
  }, []);

  const handleDownload = useCallback(() => {
    if (!compressedBlob) return;
    saveAs(compressedBlob, "techtools360-compressed.pdf");
    handleReload();
  }, [compressedBlob, handleReload]);

  return (
    <div className="p-4 sm:p-6">
      {files.length === 0 ? (
        <FileUploader
          onUpload={handleUpload}
          accept="application/pdf"
          multiple={false}
        />
      ) : (
      <div className="space-y-4 px-1">
  {error && (
    <p className="mb-4 text-sm text-[#a13c2f]" role="alert">
      {error}
    </p>
  )}
  {/* Preview only if not yet compressed */}
  {!compressedBlob && (
    <FilePreviewList
      files={files}
      thumbnails={thumbnails}
      onRemove={handleRemove}
      pdfjsLoaded={!!pdfjs && !isPDFJSLoading}
      isGenerating={isGenerating}
    />
  )}

  {/* Compress button */}
  {!processing && !compressedBlob && (
    <Button
      onClick={handleCompress}
      variant="primary"
      size="md"
      icon={<FaCompress />}
      iconPosition="left"
      className="mt-4 w-full sm:w-auto"
    >
      Compress PDF
    </Button>
  )}

  {/* Processing state */}
  {processing && (
    <div className="text-sm text-[#527268]" role="status">
      Compressing your PDF...
    </div>
  )}

  {/* Download result */}
  {compressedBlob && !processing && (
    <>
      <div className="mx-auto mt-5 grid max-w-xl grid-cols-2 border border-[#dce5e0] text-left">
        <div className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[#708079]">Original</p>
          <p className="mt-1 font-semibold text-[#263e36]">{formatFileSize(files[0].size)}</p>
        </div>
        <div className="border-l border-[#dce5e0] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[#708079]">Processed</p>
          <p className="mt-1 font-semibold text-[#263e36]">{formatFileSize(compressedBlob.size)}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-[#527268]" role="status">
        {compressedBlob.size < files[0].size
          ? `File size reduced by ${(((files[0].size - compressedBlob.size) / files[0].size) * 100).toFixed(1)}%.`
          : "This file did not get smaller. It may already be optimized or contain content that cannot be reduced by this tool."}
      </p>
      <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
        <Button
          onClick={handleDownload}
          variant="primary"
          size="md"
          icon={<FaDownload />}
          iconPosition="left"
          className="w-full sm:w-auto"
        >
          Download Compressed PDF
        </Button>
      </div>
      <Button
        onClick={handleReload}
        variant="secondary"
        size="md"
        icon={<TbReload />}
        iconPosition="left"
        className="w-full sm:w-auto"
      >
        Upload Another PDF
      </Button>
    </>
  )}
</div>

      )}
    </div>
  );
};

export default CompressPDFTool;
