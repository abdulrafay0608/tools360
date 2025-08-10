"use client";

import React, { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { FaDownload, FaCompress } from "react-icons/fa";
import { TbReload } from "react-icons/tb";

import FileUploader from "@/components/pdf/file/FileUploader";
import FilePreviewList from "./FilePreviewList";
import Button from "@/components/ui/Button";
import usePDFJS from "@/hooks/usePDFJS";
import usePDFThumbnails from "@/hooks/useThumbnails";

/**
 * Compress a PDF file by removing metadata and enabling compression.
 * @param {File} file
 * @returns {Promise<Blob>}
 */
async function compressPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, {
    ignoreEncryption: true,
  });

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

  const { pdfjs, isLoading: isPDFJSLoading } = usePDFJS();
  const { thumbnails, isGenerating } = usePDFThumbnails(files, pdfjs);

  const handleUpload = useCallback((newFiles) => {
    setFiles(newFiles);
    setCompressedBlob(null); // Reset previous compression result
  }, []);

  const handleRemove = useCallback(
    (index) => setFiles((prev) => prev.filter((_, i) => i !== index)),
    []
  );

  const handleCompress = useCallback(async () => {
    if (!files.length) return;
    setProcessing(true);
    try {
      const compressed = await compressPdf(files[0]);
      setCompressedBlob(compressed);
    } catch (err) {
      console.error("Compression failed:", err);
    } finally {
      setProcessing(false);
    }
  }, [files]);

  const handleReload = useCallback(() => {
    setFiles([]);
    setCompressedBlob(null);
  }, []);

  const handleDownload = useCallback(() => {
    if (!compressedBlob) return;
    saveAs(compressedBlob, "techtools360-compressed.pdf");
    handleReload();
  }, [compressedBlob, handleReload]);

  return (
    <div className="max-w-5xl mx-auto p-4">
      {files.length === 0 ? (
        <FileUploader
          onUpload={handleUpload}
          accept="application/pdf"
          multiple={false}
        />
      ) : (
       <div className="text-center px-2">
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
    <div className="mt-4 text-gray-600 animate-pulse text-sm sm:text-base">
      Compressing your PDF...
    </div>
  )}

  {/* Download result */}
  {compressedBlob && !processing && (
    <>
      <div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
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
        <span className="text-gray-600 text-xs sm:text-sm">
          Size: {(compressedBlob.size / 1024).toFixed(1)} KB
        </span>
      </div>
      <Button
        onClick={handleReload}
        variant="secondary"
        size="md"
        icon={<TbReload />}
        iconPosition="left"
        className="mt-3 w-full sm:w-auto"
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
