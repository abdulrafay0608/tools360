// src/tools/pdf/split-pdf/components/SplitPDFTool.js
"use client";

import React, { useState, useEffect, useCallback } from "react";
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

const SplitPDFTool = () => {
  const [mode, setMode] = useState("range"); // 'range' or 'fixed'
  const [file, setFile] = useState(null);
  const [ranges, setRanges] = useState([]);
  const [fixedSplit, setFixedSplit] = useState(1);
  const [error, setError] = useState("");
  const [isSplitting, setIsSplitting] = useState(false);

  const { pdfjs, isLoading: isPDFJSLoading } = usePDFJS();
  const { thumbnails, isGenerating, totalPages } = usePDFThumbnails(
    file,
    pdfjs,
    "page"
  );

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
      (file) => file.type === "application/pdf"
    );
    if (!pdfFile) return;

    setFile(pdfFile);
    setError("");
    setRanges([]);
  };

  // Clear all selections
  const handleClear = () => {
    setFile(null);
    setError("");
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
  const validateRanges = () => {
    for (const [idx, range] of ranges.entries()) {
      const from = parseInt(range.from);
      const to = parseInt(range.to);

      if (!from || !to) {
        setError(`Range ${idx + 1} has empty fields`);
        return false;
      }

      if (from < 1 || to < 1 || from > totalPages || to > totalPages) {
        setError(`Range ${idx + 1} is out of bounds (1-${totalPages})`);
        return false;
      }

      if (from > to) {
        setError(
          `In range ${idx + 1}, start page cannot be greater than end page`
        );
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
    try {
      const fileBytes = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(fileBytes);

      if (mode === "range") {
        if (!validateRanges()) return;
        await processRangeSplit(originalPdf);
      } else {
        if (fixedSplit < 1) {
          setError("Pages per split must be at least 1");
          return;
        }
        if (fixedSplit > totalPages) {
          setError(`Cannot split into more than ${totalPages} pages per split`);
          return;
        }
        await processFixedSplit(originalPdf);
      }
    } catch (error) {
      console.error("Error splitting PDF:", error);
      setError("Error splitting PDF. Please try again.");
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
    alert(`${files.length} PDFs created! Download started.`);
  };

  // Process fixed split mode
  const processFixedSplit = async (originalPdf) => {
    const files = [];
    const numGroups = Math.ceil(totalPages / fixedSplit);

    for (let group = 0; group < numGroups; group++) {
      const startPage = group * fixedSplit;
      const endPage = Math.min((group + 1) * fixedSplit, totalPages);
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
    alert(`${files.length} PDFs created! Download started.`);
  };

  // Handle mode change
  const handleModeChange = (newMode) => {
    setMode(newMode);
    setError("");
  };

  // Calculate fixed split groups
  const fixedSplitGroups = getFixedSplitGroups();

  return (
    <div className="max-w-5xl mx-auto p-4">
      {!file ? (
        <div>
          <FileUploader
            onUpload={handleUpload}
            accept="application/pdf"
            multiple={false}
          />
        </div>
      ) : (
        <>
          {/* <div className="mb-6 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">Split PDF</h1>
            
          </div> */}

          <div className="flex flex-col lg:flex-row gap-4 w-full">
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
              <div className="flex border border-gray-300 rounded overflow-hidden mb-2">
                <button
                  className={`flex-1 py-3 text-center ${
                    mode === "range"
                      ? "bg-blue-600 text-white"
                      : "bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => handleModeChange("range")}
                >
                  Custom Range
                </button>
                <button
                  className={`flex-1 py-3 text-center ${
                    mode === "fixed"
                      ? "bg-blue-600 text-white"
                      : "bg-white hover:bg-gray-50"
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

              {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}

              <div className="flex gap-2 mt-6">
                <Button
                  className="w-full py-3"
                  variant="outline"
                  onClick={handleClear}
                >
                  Clear File
                </Button>
                <Button
                  onClick={handleSplit}
                  disabled={isSplitting}
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
