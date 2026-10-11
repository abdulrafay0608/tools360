"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useAdPauseWhile } from "@/hooks/useAdPause";
import { saveAs } from "file-saver";
import FileUploader from "@/components/pdf/file/FileUploader";
import SvgOptionsBar from "./SvgOptionsBar";
import SvgSummaryBar from "./SvgSummaryBar";
import SvgGrid from "./SvgGrid";
import SvgPasteArea from "./SvgPasteArea";
import {
  calculateTargetDimensions,
  createZipArchive,
  getConvertedFilename,
  renderSvgToPng,
  sanitizeAndParseSvg,
  MAX_FILES,
  MAX_FILE_SIZE_BYTES,
} from "../svgToPngUtils";
import { FaLock, FaCheckCircle, FaExclamationCircle, FaUpload, FaCode } from "react-icons/fa";

export default function SvgToPngTool() {
  const [activeTab, setActiveTab] = useState("upload"); // 'upload' | 'paste'
  const [items, setItems] = useState([]);
  const [options, setOptions] = useState({
    sizeOption: "original",
    scale: 1,
    customWidth: 1024,
    backgroundColor: "transparent",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const hiddenInputRef = useRef(null);
  const activeBatchIdRef = useRef(0);
  const isCancelledRef = useRef(false);
  const debounceTimerRef = useRef(null);
  const objectUrlsRef = useRef(new Set());
  const itemsRef = useRef([]);
  const optionsRef = useRef(options);

  // Ad pause integration
  useAdPauseWhile("svg-to-png-processing", isProcessing);
  useAdPauseWhile("svg-to-png-error", Boolean(error));
  useAdPauseWhile("svg-to-png-empty", items.length === 0);

  // Clean up object URLs on unmount
  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      clearTimeout(debounceTimerRef.current);
      activeBatchIdRef.current += 1;
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
      urls.clear();
    };
  }, []);

  const createTrackedUrl = useCallback((blob) => {
    const url = URL.createObjectURL(blob);
    objectUrlsRef.current.add(url);
    return url;
  }, []);

  const revokeTrackedUrl = useCallback((url) => {
    if (url && objectUrlsRef.current.delete(url)) {
      URL.revokeObjectURL(url);
    }
  }, []);

  const commitItems = useCallback((nextItems) => {
    itemsRef.current = nextItems;
    setItems(nextItems);
  }, []);

  /**
   * Sequential rendering engine.
   * Renders each SVG to Canvas and exports PNG Blob.
   */
  const processBatch = useCallback(
    async (itemsToProcess, currentOptions) => {
      const batchId = ++activeBatchIdRef.current;
      isCancelledRef.current = false;
      setIsProcessing(true);

      for (let i = 0; i < itemsToProcess.length; i++) {
        if (isCancelledRef.current || batchId !== activeBatchIdRef.current) {
          break;
        }

        const currentItem = itemsToProcess[i];
        if (currentItem.status === "error" && !currentItem.svgText) {
          continue;
        }

        // Set status to processing
        commitItems(
          itemsRef.current.map((item) =>
            item.id === currentItem.id ? { ...item, status: "processing" } : item
          )
        );

        // Allow UI to breathe
        await new Promise((resolve) => setTimeout(resolve, 10));

        if (isCancelledRef.current || batchId !== activeBatchIdRef.current) {
          break;
        }

        try {
          const { width: targetWidth, height: targetHeight, wasCapped } =
            calculateTargetDimensions(
              currentItem.origWidth,
              currentItem.origHeight,
              currentOptions
            );

          const pngBlob = await renderSvgToPng(
            currentItem.svgText,
            targetWidth,
            targetHeight,
            currentOptions.backgroundColor
          );

          if (isCancelledRef.current || batchId !== activeBatchIdRef.current) {
            break;
          }

          const previewUrl = createTrackedUrl(pngBlob);

          commitItems(
            itemsRef.current.map((item) => {
              if (item.id !== currentItem.id) return item;
              if (item.previewUrl && item.previewUrl !== previewUrl) {
                revokeTrackedUrl(item.previewUrl);
              }
              return {
                ...item,
                status: "done",
                blob: pngBlob,
                pngSize: pngBlob.size,
                targetWidth,
                targetHeight,
                wasCapped,
                previewUrl,
                error: "",
              };
            })
          );
        } catch (err) {
          if (isCancelledRef.current || batchId !== activeBatchIdRef.current) {
            break;
          }

          commitItems(
            itemsRef.current.map((item) =>
              item.id === currentItem.id
                ? {
                    ...item,
                    status: "error",
                    error: err?.message || "Failed to render SVG image.",
                  }
                : item
            )
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      if (batchId === activeBatchIdRef.current) {
        setIsProcessing(false);
      }
    },
    [commitItems, createTrackedUrl, revokeTrackedUrl]
  );

  /**
   * File upload and validation handler for .svg files.
   */
  const handleUpload = useCallback(
    async (newFiles, uploadNotice = "") => {
      const currentList = itemsRef.current;
      const remainingSlots = MAX_FILES - currentList.length;
      const selected = Array.from(newFiles);

      const isSvgFile = (file) =>
        (file.type || "").toLowerCase().includes("svg") || /\.svg$/i.test(file.name || "");

      const unsupported = selected.filter((file) => !isSvgFile(file));
      const oversized = selected.filter((file) => file.size > MAX_FILE_SIZE_BYTES);
      const eligible = selected.filter(
        (file) => isSvgFile(file) && file.size <= MAX_FILE_SIZE_BYTES
      );

      const validFiles = eligible.slice(0, Math.max(0, remainingSlots));
      const skippedByLimit = eligible.length - validFiles.length;

      const noticeParts = [
        uploadNotice,
        unsupported.length
          ? `${unsupported.length} non-SVG file(s) were skipped.`
          : "",
        oversized.length
          ? `${oversized.map((f) => f.name).join(", ")} exceeds the 5 MB file limit.`
          : "",
        skippedByLimit
          ? `${skippedByLimit} file(s) skipped; maximum limit is ${MAX_FILES} SVG files.`
          : "",
      ].filter(Boolean);

      setError(noticeParts.join(" "));

      if (validFiles.length === 0) return;

      const newItems = await Promise.all(
        validFiles.map(async (file, idx) => {
          const id = `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`;
          let svgText = "";
          let origWidth = 512;
          let origHeight = 512;
          let hasDefaultDimensions = false;
          let removedCount = 0;
          let errorMsg = "";

          try {
            svgText = await file.text();
            const parsed = sanitizeAndParseSvg(svgText);
            svgText = parsed.cleanSvgString;
            origWidth = parsed.origWidth;
            origHeight = parsed.origHeight;
            hasDefaultDimensions = parsed.hasDefaultDimensions;
            removedCount = parsed.removedCount;
          } catch (err) {
            errorMsg = err?.message || "Invalid SVG file.";
          }

          return {
            id,
            file,
            name: file.name,
            fileSize: file.size,
            svgText,
            origWidth,
            origHeight,
            targetWidth: origWidth,
            targetHeight: origHeight,
            hasDefaultDimensions,
            removedCount,
            wasCapped: false,
            outputFilename: getConvertedFilename(file.name),
            status: errorMsg ? "error" : "pending",
            blob: null,
            pngSize: null,
            previewUrl: null,
            error: errorMsg,
          };
        })
      );

      const updated = [...currentList, ...newItems];
      commitItems(updated);
      processBatch(updated, optionsRef.current);
    },
    [commitItems, processBatch]
  );

  /**
   * Adding pasted SVG code item to the queue.
   */
  const handleAddPastedSvg = useCallback(
    (pastedData) => {
      const currentList = itemsRef.current;
      if (currentList.length >= MAX_FILES) {
        setError(`Maximum limit of ${MAX_FILES} items reached.`);
        return;
      }

      const id = `${Date.now()}-paste-${Math.random().toString(36).slice(2, 7)}`;
      const newItem = {
        id,
        file: null,
        name: "pasted-svg.svg",
        fileSize: pastedData.size,
        svgText: pastedData.svgText,
        origWidth: pastedData.origWidth,
        origHeight: pastedData.origHeight,
        targetWidth: pastedData.origWidth,
        targetHeight: pastedData.origHeight,
        hasDefaultDimensions: pastedData.hasDefaultDimensions,
        removedCount: pastedData.removedCount,
        wasCapped: false,
        outputFilename: "svg-image.png",
        status: "pending",
        blob: null,
        pngSize: null,
        previewUrl: null,
        error: "",
      };

      const updated = [...currentList, newItem];
      commitItems(updated);
      processBatch(updated, optionsRef.current);
      setError("");
    },
    [commitItems, processBatch]
  );

  /**
   * Options change with debounced batch re-rendering.
   */
  const handleOptionChange = useCallback(
    (nextOptions) => {
      optionsRef.current = nextOptions;
      setOptions(nextOptions);

      // Cancel current running batch
      activeBatchIdRef.current += 1;
      isCancelledRef.current = true;
      setIsProcessing(false);
      clearTimeout(debounceTimerRef.current);

      // Mark valid items as pending
      const resetItems = itemsRef.current.map((item) => ({
        ...item,
        status: item.svgText ? "pending" : item.status,
      }));
      commitItems(resetItems);

      if (resetItems.length === 0) return;

      debounceTimerRef.current = setTimeout(() => {
        processBatch(itemsRef.current, nextOptions);
      }, 300);
    },
    [commitItems, processBatch]
  );

  const handleCancelBatch = useCallback(() => {
    isCancelledRef.current = true;
    activeBatchIdRef.current += 1;
    clearTimeout(debounceTimerRef.current);
    setIsProcessing(false);

    commitItems(
      itemsRef.current.map((item) =>
        item.status === "processing" || item.status === "pending"
          ? { ...item, status: "error", error: "Rendering cancelled" }
          : item
      )
    );
  }, [commitItems]);

  const handleRemove = useCallback(
    (id) => {
      const target = itemsRef.current.find((item) => item.id === id);
      if (target && target.previewUrl) {
        revokeTrackedUrl(target.previewUrl);
      }
      commitItems(itemsRef.current.filter((item) => item.id !== id));
    },
    [commitItems, revokeTrackedUrl]
  );

  const handleClearAll = useCallback(() => {
    isCancelledRef.current = true;
    activeBatchIdRef.current += 1;
    clearTimeout(debounceTimerRef.current);
    setIsProcessing(false);

    for (const item of itemsRef.current) {
      if (item.previewUrl) {
        revokeTrackedUrl(item.previewUrl);
      }
    }
    commitItems([]);
    setError("");
  }, [commitItems, revokeTrackedUrl]);

  const handleDownloadSingle = useCallback((item) => {
    if (!item.blob || !item.outputFilename) return;
    saveAs(item.blob, item.outputFilename);
  }, []);

  const handleDownloadAll = useCallback(async () => {
    const readyItems = itemsRef.current.filter((item) => item.blob && !item.error);
    if (readyItems.length === 0) return;

    if (readyItems.length === 1) {
      saveAs(readyItems[0].blob, readyItems[0].outputFilename);
      return;
    }

    try {
      const zipBlob = await createZipArchive(readyItems);
      saveAs(zipBlob, "svg-to-png.zip");
    } catch (err) {
      setError(err?.message || "Failed to create ZIP archive.");
    }
  }, []);

  const processedCount = items.filter((item) => item.status === "done").length;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Hidden file input for adding more SVGs */}
      <input
        ref={hiddenInputRef}
        type="file"
        accept="image/svg+xml,.svg"
        multiple
        onChange={(e) => {
          if (e.target.files?.length) {
            handleUpload(e.target.files);
          }
          e.target.value = "";
        }}
        className="hidden"
        aria-hidden="true"
      />

      {/* Trust & security badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-[#dce5e0] bg-[#f8faf9] px-4 py-3 text-xs text-[#527268]">
        <div className="flex items-center gap-2 font-medium text-[#173d34]">
          <FaLock className="h-3.5 w-3.5 text-[#235c4f]" />
          <span>100% Client-Side SVG to PNG — Files never leave your browser</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <FaCheckCircle className="h-3 w-3 text-[#235c4f]" /> Up to {MAX_FILES} SVGs
          </span>
          <span className="flex items-center gap-1.5">
            <FaCheckCircle className="h-3 w-3 text-[#235c4f]" /> Up to 5 MB each
          </span>
        </div>
      </div>

      {/* Mode Switch Tabs (Upload vs Paste) */}
      <div className="flex items-center gap-2 border-b border-[#dce5e0] pb-2">
        <button
          type="button"
          data-tab-upload="true"
          onClick={() => setActiveTab("upload")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-sm transition-all ${
            activeTab === "upload"
              ? "bg-[#235c4f] text-white shadow-xs"
              : "bg-white text-[#527268] hover:bg-[#f0f4f2]"
          }`}
        >
          <FaUpload className="h-3 w-3" />
          <span>Upload SVG Files</span>
        </button>

        <button
          type="button"
          data-tab-paste="true"
          onClick={() => setActiveTab("paste")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-sm transition-all ${
            activeTab === "paste"
              ? "bg-[#235c4f] text-white shadow-xs"
              : "bg-white text-[#527268] hover:bg-[#f0f4f2]"
          }`}
        >
          <FaCode className="h-3 w-3" />
          <span>Paste SVG Code</span>
        </button>
      </div>

      {/* Global error banner */}
      {error && (
        <div
          id="global-error-banner"
          className="flex items-start gap-2.5 rounded-sm border border-[#f3cfc8] bg-[#fdf4f3] p-4 text-sm text-[#a13c2f]"
          role="alert"
        >
          <FaExclamationCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#c24b38]" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            className="text-xs font-semibold uppercase hover:underline"
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Tab Area */}
      {activeTab === "upload" && items.length === 0 && (
        <FileUploader
          onUpload={handleUpload}
          accept="image/svg+xml,.svg"
          multiple={true}
          maxFiles={MAX_FILES}
          maxFileSizeBytes={MAX_FILE_SIZE_BYTES}
          allowPartial={true}
          fileTypeLabel="SVG file"
          titleText="Drop SVG files here or click to browse"
          onError={(msg) => setError(msg)}
        />
      )}

      {activeTab === "paste" && (
        <SvgPasteArea onAddPastedSvg={handleAddPastedSvg} />
      )}

      {/* Options, Summary, & Queue list */}
      {items.length > 0 && (
        <div className="space-y-5">
          <SvgOptionsBar
            options={options}
            onOptionsChange={handleOptionChange}
            disabled={isProcessing}
          />

          <SvgSummaryBar
            items={items}
            isProcessing={isProcessing}
            processedCount={processedCount}
            onDownloadAll={handleDownloadAll}
            onAddMore={() => hiddenInputRef.current?.click()}
            onClearAll={handleClearAll}
            onCancelBatch={handleCancelBatch}
          />

          <SvgGrid
            items={items}
            onDownloadSingle={handleDownloadSingle}
            onRemove={handleRemove}
          />
        </div>
      )}
    </div>
  );
}
