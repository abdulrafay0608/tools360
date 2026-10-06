// src/tools/pdf/split-pdf/components/SplitPDFTool.js
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAdPauseWhile } from "@/hooks/useAdPause";
import { PDFDocument } from "pdf-lib";
import FileUploader from "@/components/pdf/file/FileUploader";
import usePDFJS from "@/hooks/usePDFJS";
import download from "downloadjs";
import { downloadZip } from "client-zip";
import RangeInputs from "./RangeInputs";
import FixedSplitInput from "./FixedSplitInput";
import usePDFThumbnails from "@/hooks/useThumbnails";
import PagePreviewList from "./PagePreviewList";
import Button from "@/components/ui/Button";
import FixedSplitPreview from "./FixedSplitPreview";
import { formatFileSize } from "@/components/utils/pdfUtils";

const SplitPDFTool = () => {
  const [mode, setMode] = useState("range"); // 'range' or 'fixed'
  const [file, setFile] = useState(null);
  const [ranges, setRanges] = useState([]);
  const [fixedSplit, setFixedSplit] = useState(1);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSplitting, setIsSplitting] = useState(false);

  const { pdfjs, isLoading: isPDFJSLoading } = usePDFJS();
  const { thumbnails, isGenerating, totalPages } = usePDFThumbnails(
    file,
    pdfjs,
    "page"
  );
  useAdPauseWhile("split-processing", isSplitting || isGenerating);
  useAdPauseWhile("split-error", Boolean(error));
  useAdPauseWhile("split-empty", !file);

  // Initialize with default range when file is uploaded
  useEffect(() => {
    if (totalPages > 0 && ranges.length === 0) {
      setRanges([{ from: "1", to: totalPages.toString() }]);
    }
  }, [totalPages, ranges.length]);

  // Calculate fixed split groups
  const getFixedSplitGroups = useCallback(() => {
    if (!totalPages) return [];

    const groups = [];
    const numGroups = Math.ceil(totalPages / fixedSplit);

    for (let i = 0; i < numGroups; i++) {
      const start = i * fixedSplit + 1;
      const end = Math.min((i + 1) * fixedSplit, totalPages);
      groups.push({ start, end });
    }

    return groups;
  }, [totalPages, fixedSplit]);

  // Handle file upload
  const handleUpload = (uploadedFiles) => {
    const pdfFile = Array.from(uploadedFiles).find(
      (file) =>
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    );
    if (!pdfFile) return;

    setFile(pdfFile);
    setError("");
    setStatusMessage("");
    setRanges([]);
  };

  // Clear all selections
  const handleClear = () => {
    setFile(null);
    setError("");
    setStatusMessage("");
    setRanges([]);
    setFixedSplit(1);
  };

  // Add a new range with sensible defaults
  const addRange = () => {
    let nextStart = 1;

    // Find the next available starting page
    if (ranges.length > 0) {
      const lastRange = ranges[ranges.length - 1];
      const lastEnd = parseInt(lastRange.to);
      if (!isNaN(lastEnd) && lastEnd < totalPages) {
        nextStart = lastEnd + 1;
      }
    }

    const newRange = {
      from: nextStart.toString(),
      to: Math.min(nextStart + 1, totalPages).toString(),
    };

    setRanges([...ranges, newRange]);
  };

  // Remove a range
  const removeRange = (index) => {
    if (ranges.length === 1) return;
    const newRanges = [...ranges];
    newRanges.splice(index, 1);
    setRanges(newRanges);
  };

  // Update a range value
  const updateRange = (index, field, value) => {
    const newRanges = [...ranges];
    newRanges[index][field] = value;
    setRanges(newRanges);
  };

  // Update fixed split value
  const handleFixedSplitChange = (value) => {
    const newValue = Math.max(1, Math.min(totalPages, parseInt(value) || 1));
    setFixedSplit(newValue);
  };

  // Validate ranges
  const validateRanges = (pageCount) => {
    if (ranges.length === 0) {
      setError("Add at least one page range.");
      return false;
    }

    for (const [idx, range] of ranges.entries()) {
      const from = Number(range.from);
      const to = Number(range.to);

      if (!Number.isInteger(from) || !Number.isInteger(to)) {
        setError(`Enter whole page numbers for range ${idx + 1}.`);
        return false;
      }

      if (from < 1 || to < 1 || from > pageCount || to > pageCount) {
        setError(`Range ${idx + 1} must be between page 1 and ${pageCount}.`);
        return false;
      }

      if (from > to) {
        setError(`Range ${idx + 1} must start before it ends.`);
        return false;
      }

      const overlaps = ranges.some((otherRange, otherIndex) => {
        if (otherIndex === idx) return false;
        const otherFrom = Number(otherRange.from);
        const otherTo = Number(otherRange.to);
        return Number.isInteger(otherFrom) &&
          Number.isInteger(otherTo) &&
          from <= otherTo &&
          to >= otherFrom;
      });

      if (overlaps) {
        setError("Page ranges cannot overlap. Each page can be in one output.");
        return false;
      }
    }
    return true;
  };

  // Handle PDF splitting
  const handleSplit = async () => {
    if (!file) {
      setError("Please upload a PDF file");
      return;
    }

    setIsSplitting(true);
    setError("");
    setStatusMessage("");
    try {
      const fileBytes = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(fileBytes);
      const pageCount = originalPdf.getPageCount();

      if (mode === "range") {
        if (!validateRanges(pageCount)) return;
        await processRangeSplit(originalPdf);
      } else {
        if (fixedSplit < 1) {
          setError("Pages per split must be at least 1");
          return;
        }
        if (fixedSplit > pageCount) {
          setError(`Pages per split cannot exceed ${pageCount}.`);
          return;
        }
        await processFixedSplit(originalPdf, pageCount);
      }
    } catch (error) {
      console.error("Error splitting PDF:", error);
      setError(error.message || "The PDF could not be split. Please try again.");
    } finally {
      setIsSplitting(false);
    }
  };

  // Process range split mode
  const processRangeSplit = async (originalPdf) => {
    const files = [];

    for (const range of ranges) {
      const from = parseInt(range.from);
      const to = parseInt(range.to);
      const pageNumbers = Array.from(
        { length: to - from + 1 },
        (_, i) => from + i
      );

      const newPdf = await PDFDocument.create();
      const pages = await newPdf.copyPages(
        originalPdf,
        pageNumbers.map((p) => p - 1)
      );
      pages.forEach((page) => newPdf.addPage(page));

      const newPdfBytes = await newPdf.save();
      files.push({
        name: `pages-${from}-${to}.pdf`,
        input: new Uint8Array(newPdfBytes),
        lastModified: new Date(),
      });
    }

    const blob = await downloadZip(files).blob();
    const fileName = `split-document-${Date.now()}.zip`;
    download(blob, fileName, "application/zip");
    setStatusMessage(`${files.length} PDF files are ready. ZIP download started.`);
  };

  // Process fixed split mode
  const processFixedSplit = async (originalPdf, pageCount) => {
    const files = [];
    const numGroups = Math.ceil(pageCount / fixedSplit);

    for (let group = 0; group < numGroups; group++) {
      const startPage = group * fixedSplit;
      const endPage = Math.min((group + 1) * fixedSplit, pageCount);
      const groupPages = Array.from(
        { length: endPage - startPage },
        (_, i) => startPage + i + 1
      );

      const newPdf = await PDFDocument.create();
      const pages = await newPdf.copyPages(
        originalPdf,
        groupPages.map((p) => p - 1)
      );
      pages.forEach((page) => newPdf.addPage(page));

      const newPdfBytes = await newPdf.save();
      files.push({
        name: `pages-${startPage + 1}-${endPage}.pdf`,
        input: new Uint8Array(newPdfBytes),
        lastModified: new Date(),
      });
    }

    const blob = await downloadZip(files).blob();
    const fileName = `split-document-${Date.now()}.zip`;
    download(blob, fileName, "application/zip");
    setStatusMessage(`${files.length} PDF files are ready. ZIP download started.`);
  };

  // Handle mode change
  const handleModeChange = (newMode) => {
    setMode(newMode);
    setError("");
  };

  // Calculate fixed split groups
  const fixedSplitGroups = getFixedSplitGroups();

  return (
    <div className="p-4 sm:p-6">
      {!file ? (
        <FileUploader
          onUpload={handleUpload}
          accept="application/pdf,.pdf"
          multiple={false}
        />
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-3 border-b border-[#e5ece8] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-[#708079]">
                Selected PDF
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-[#263e36]">
                {file.name}
              </p>
              <p className="mt-1 text-xs text-[#708079]">
                {formatFileSize(file.size)}
                {totalPages > 0 ? ` · ${totalPages} pages` : ""}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleClear}>
              Choose another PDF
            </Button>
          </div>

          <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="w-full lg:w-2/3">
              {mode === "range" ? (
                ranges.map((range, index) => {
                  const from = parseInt(range.from);
                  const to = parseInt(range.to);

                  // Skip invalid ranges
                  if (
                    !from ||
                    !to ||
                    from > to ||
                    from < 1 ||
                    to > totalPages
                  ) {
                    return null;
                  }

                  const pagesInRange = to - from + 1;
                  let thumbnailsSubset = [];

                  // Only get thumbnails if available
                  if (thumbnails.length >= to) {
                    thumbnailsSubset = thumbnails.slice(from - 1, to);
                  }

                  return (
                    <PagePreviewList
                      key={index}
                      thumbnails={thumbnailsSubset}
                      pdfjsLoaded={!!pdfjs && !isPDFJSLoading}
                      isGenerating={isGenerating}
                      rangeNumber={index + 1}
                      totalPagesInRange={pagesInRange}
                    />
                  );
                })
              ) : (
                // In SplitPDFTool.js
                <div className="space-y-4">
                  {fixedSplitGroups.map((group, index) => (
                    <FixedSplitPreview
                      key={index}
                      groupNumber={index + 1}
                      startPage={group.start}
                      endPage={group.end}
                      thumbnails={thumbnails.slice(group.start - 1, group.end)}
                      pdfjsLoaded={!!pdfjs && !isPDFJSLoading}
                      isGenerating={isGenerating}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="w-full lg:w-1/3">
              <div
                className="mb-3 grid grid-cols-2 border border-[#dce5e0] bg-[#f4f7f5] p-1"
                role="group"
                aria-label="Split mode"
              >
                <button
                  type="button"
                  aria-pressed={mode === "range"}
                  className={`min-h-10 px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#235c4f] ${
                    mode === "range"
                      ? "bg-[#173d34] text-white"
                      : "text-[#52675e] hover:bg-white"
                  }`}
                  onClick={() => handleModeChange("range")}
                >
                  Custom Range
                </button>
                <button
                  type="button"
                  aria-pressed={mode === "fixed"}
                  className={`min-h-10 px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#235c4f] ${
                    mode === "fixed"
                      ? "bg-[#173d34] text-white"
                      : "text-[#52675e] hover:bg-white"
                  }`}
                  onClick={() => handleModeChange("fixed")}
                >
                  Fixed Pages
                </button>
              </div>

              {mode === "range" ? (
                <RangeInputs
                  ranges={ranges}
                  totalPages={totalPages}
                  updateRange={updateRange}
                  removeRange={removeRange}
                  addRange={addRange}
                />
              ) : (
                <FixedSplitInput
                  fixedSplit={fixedSplit}
                  onFixedSplitChange={handleFixedSplitChange}
                  totalPages={totalPages}
                  documentCount={fixedSplitGroups.length}
                />
              )}

              {error && (
                <p className="mt-4 text-sm text-[#a13c2f]" role="alert">
                  {error}
                </p>
              )}
              {statusMessage && (
                <p className="mt-4 text-sm text-[#235c4f]" role="status">
                  {statusMessage}
                </p>
              )}

              <div className="flex gap-2 mt-6">
                <Button
                  onClick={handleSplit}
                  disabled={isSplitting || !totalPages}
                  className="w-full py-3"
                >
                  {isSplitting ? "Splitting..." : "Split PDF"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SplitPDFTool;
