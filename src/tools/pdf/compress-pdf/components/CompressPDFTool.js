"use client";

import React, { useState, useCallback } from "react";
import { useAdPauseWhile } from "@/hooks/useAdPause";
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
import PDFJSStatus from "@/components/pdf/PDFJSStatus";
import { describeCompressionResult } from "../compressPdfUtils";

/**
 * Rewrite a PDF locally, clearing basic metadata where supported.
 * pdf-lib does not recompress embedded scanned images; the output may be
 * unchanged or larger than the input.
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
  });

  return new Blob([compressedBytes], { type: "application/pdf" });
}

const CompressPDFTool = () => {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [compressedBlob, setCompressedBlob] = useState(null);
  const [error, setError] = useState("");

  const { pdfjs, isLoading: isPDFJSLoading, error: pdfjsError, retry: retryPDFJS } = usePDFJS();
  const { thumbnails, isGenerating } = usePDFThumbnails(files, pdfjs);
  useAdPauseWhile("compress-processing", processing || isGenerating);
  useAdPauseWhile("compress-error", Boolean(error));
  useAdPauseWhile("compress-empty", files.length === 0);

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
      <PDFJSStatus error={pdfjsError} onRetry={retryPDFJS} />
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
  <p className="mb-4 text-xs leading-relaxed text-[#708079]" role="note">
    This browser-only rewrite clears basic PDF metadata and optimizes the PDF
    structure where possible. It does not recompress embedded scanned images,
    so the downloaded file may be the same size or larger.
  </p>
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
        {describeCompressionResult(files[0].size, compressedBlob.size)}
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
