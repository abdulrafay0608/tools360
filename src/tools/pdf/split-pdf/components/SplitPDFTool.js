// src/tools/pdf/split-pdf/components/SplitPDFTool.js
"use client";

import React, { useState, useEffect } from "react";
import PagePreviewList from "./PagePreviewList";
import ActionBar from "./ActionBar";
import { PDFDocument } from "pdf-lib";
import Button from "@/components/ui/Button";
import FileUploader from "@/components/pdf/file/FileUploader";
import usePDFJS from "@/hooks/usePDFJS";
import download from "downloadjs";
import { downloadZip } from "client-zip";
import SplitModeSelector from "./SplitModeSelector";
import RangeInputs from "./RangeInputs";
import FixedSplitInput from "./FixedSplitInput";
import usePDFThumbnails from "@/hooks/useThumbnails";

const SplitPDFTool = () => {
  const [file, setFile] = useState(null);
  const [selectedPages, setSelectedPages] = useState([]); // Initialized as empty array
  const [splitMode, setSplitMode] = useState("single");
  const [isSplitting, setIsSplitting] = useState(false);
  const [fixedSplit, setFixedSplit] = useState(1);
  const [rangeError, setRangeError] = useState("");
  const [ranges, setRanges] = useState([{ from: "", to: "" }]);

  const { pdfjs, isLoading: isPDFJSLoading } = usePDFJS();
  const { thumbnails, isGenerating, totalPages } = usePDFThumbnails(
    file,
    pdfjs,
    "page"
  );

  useEffect(() => {
    if (totalPages > 0) {
      setSelectedPages(Array.from({ length: totalPages }, (_, i) => i + 1));
    }
  }, [totalPages]);

  // Handle file upload
  const handleUpload = (uploadedFiles) => {
    const pdfFile = Array.from(uploadedFiles).find(
      (file) => file.type === "application/pdf"
    );
    if (!pdfFile) return;

    setFile(pdfFile);
    setRangeError("");
    setRanges([{ from: "", to: "" }]);
  };

  // Clear all selections
  const handleClear = () => {
    setFile(null);
    setSelectedPages([]);
    setRangeError("");
    setRanges([{ from: "", to: "" }]);
  };

  // Toggle page selection
  const togglePageSelection = (pageNumber) => {
    setSelectedPages((prev) =>
      prev.includes(pageNumber)
        ? prev.filter((p) => p !== pageNumber)
        : [...prev, pageNumber]
    );
  };

  // Select all pages
  const selectAllPages = () => {
    setSelectedPages(Array.from({ length: totalPages }, (_, i) => i + 1));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedPages([]);
  };

  // Add a new range
  const addRange = () => {
    setRanges([...ranges, { from: "", to: "" }]);
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

  // Validate and apply custom ranges
  const applyCustomRanges = () => {
    const pages = new Set();
    let hasError = false;

    for (const [idx, range] of ranges.entries()) {
      const from = parseInt(range.from);
      const to = parseInt(range.to);

      if (isNaN(from) || isNaN(to)) {
        setRangeError(`Range ${idx + 1} has invalid page numbers`);
        hasError = true;
        break;
      }

      if (from < 1 || to < 1 || from > totalPages || to > totalPages) {
        setRangeError(`Range ${idx + 1} is out of bounds (1-${totalPages})`);
        hasError = true;
        break;
      }

      if (from > to) {
        setRangeError(
          `In range ${idx + 1}, start page cannot be greater than end page`
        );
        hasError = true;
        break;
      }

      for (let i = from; i <= to; i++) {
        pages.add(i);
      }
    }

    if (hasError) return;

    setSelectedPages(Array.from(pages).sort((a, b) => a - b));
    setRangeError("");
  };

  // Apply fixed split
  const applyFixedSplit = () => {
    if (fixedSplit < 1) {
      setRangeError("Pages per split must be at least 1");
      return;
    }

    if (fixedSplit > totalPages) {
      setRangeError(
        `Cannot split into more than ${totalPages} pages per split`
      );
      return;
    }

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    setSelectedPages(pages);
    setRangeError("");
  };

  // Handle PDF splitting
  const handleSplit = async () => {
    if (!file) {
      alert("Please upload a PDF file");
      return;
    }

    let pagesToProcess = [];

    // Determine pages to process based on split mode
    if (splitMode === "single") {
      pagesToProcess = selectedPages;
      if (pagesToProcess.length === 0) {
        alert("Please select at least one page to split");
        return;
      }
    } else if (splitMode === "all") {
      pagesToProcess = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else if (splitMode === "range") {
      if (ranges.some((r) => !r.from || !r.to)) {
        setRangeError("Please complete all range fields");
        return;
      }

      applyCustomRanges();
      if (rangeError) return;

      pagesToProcess = selectedPages;
    } else if (splitMode === "fixed") {
      if (fixedSplit < 1) {
        setRangeError("Pages per split must be at least 1");
        return;
      }

      if (fixedSplit > totalPages) {
        setRangeError(
          `Cannot split into more than ${totalPages} pages per split`
        );
        return;
      }

      pagesToProcess = Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    setIsSplitting(true);
    try {
      await processSplit(file, pagesToProcess);
    } catch (error) {
      console.error("Error splitting PDF:", error);
      alert("Error splitting PDF. Please try again.");
    } finally {
      setIsSplitting(false);
    }
  };

  // Process the actual PDF splitting
  const processSplit = async (file, pagesToProcess) => {
    const fileBytes = await file.arrayBuffer();
    const originalPdf = await PDFDocument.load(fileBytes);

    if (splitMode === "fixed") {
      await processFixedSplit(originalPdf);
    } else if (splitMode === "single" || splitMode === "range") {
      await processSingleSplit(originalPdf, pagesToProcess);
    } else if (splitMode === "all") {
      await processAllPagesSplit(originalPdf, pagesToProcess);
    }
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

  // Process single split mode
  const processSingleSplit = async (originalPdf, pagesToProcess) => {
    const newPdf = await PDFDocument.create();
    const pages = await newPdf.copyPages(
      originalPdf,
      pagesToProcess.map((p) => p - 1)
    );
    pages.forEach((page) => newPdf.addPage(page));

    const newPdfBytes = await newPdf.save();
    const fileName = `split-document-${Date.now()}.pdf`;
    download(newPdfBytes, fileName, "application/pdf");
    alert("PDF created successfully! Download started.");
  };

  // Process all pages split mode
  const processAllPagesSplit = async (originalPdf, pagesToProcess) => {
    const files = await Promise.all(
      pagesToProcess.map(async (pageNum) => {
        const singlePagePdf = await PDFDocument.create();
        const [page] = await singlePagePdf.copyPages(originalPdf, [
          pageNum - 1,
        ]);
        singlePagePdf.addPage(page);

        const pageBytes = await singlePagePdf.save();
        return {
          name: `page-${pageNum}.pdf`,
          input: new Uint8Array(pageBytes),
          lastModified: new Date(),
        };
      })
    );

    const blob = await downloadZip(files).blob();
    const fileName = `split-pages-${Date.now()}.zip`;
    download(blob, fileName, "application/zip");
    alert(`${files.length} PDFs created! Download started.`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      {!file ? (
        <div className="max-w-2xl mx-auto">
          <FileUploader
            onUpload={handleUpload}
            accept="application/pdf"
            multiple={false}
          />
        </div>
      ) : (
        <div className="mt-6">
          <ActionBar
            file={file}
            selectedCount={selectedPages.length}
            totalPages={totalPages}
            onClear={handleClear}
            onSplit={handleSplit}
            isSplitting={isSplitting}
            canSplit={true}
          />

          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Split Options
              </h2>

              <SplitModeSelector
                splitMode={splitMode}
                setSplitMode={setSplitMode}
              />

              {splitMode === "range" && (
                <RangeInputs
                  ranges={ranges}
                  totalPages={totalPages}
                  rangeError={rangeError}
                  updateRange={updateRange}
                  removeRange={removeRange}
                  addRange={addRange}
                  applyCustomRanges={applyCustomRanges}
                />
              )}

              {splitMode === "fixed" && (
                <FixedSplitInput
                  fixedSplit={fixedSplit}
                  setFixedSplit={setFixedSplit}
                  totalPages={totalPages}
                  rangeError={rangeError}
                  applyFixedSplit={applyFixedSplit}
                />
              )}
            </div>

            <PagePreviewSection
              splitMode={splitMode}
              selectedPages={selectedPages || []} // Ensure array
              totalPages={totalPages}
              selectAllPages={selectAllPages}
              clearSelection={clearSelection}
              thumbnails={thumbnails}
              onPageSelect={togglePageSelection}
              pdfjsLoaded={!!pdfjs && !isPDFJSLoading}
              isGenerating={isGenerating}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Page Preview Section Component
const PagePreviewSection = ({
  splitMode,
  selectedPages,
  totalPages,
  selectAllPages,
  clearSelection,
  ...props
}) => (
  <div className="mt-6">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold text-gray-800">
        {splitMode === "range" ? "Selected Pages Preview" : "PDF Pages"}
      </h2>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={selectAllPages}
          disabled={selectedPages.length === totalPages}
        >
          Select All
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={clearSelection}
          disabled={selectedPages.length === 0}
        >
          Clear
        </Button>
      </div>
    </div>

    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium text-gray-700">
          <span className="text-blue-600">{selectedPages.length}</span> of{" "}
          <span>{totalPages}</span> pages selected
        </div>

        {splitMode === "range" && selectedPages.length > 0 && (
          <div className="text-sm text-gray-600">
            Pages: {selectedPages.join(", ")}
          </div>
        )}
      </div>

      <PagePreviewList {...props} />
    </div>
  </div>
);

export default SplitPDFTool;
