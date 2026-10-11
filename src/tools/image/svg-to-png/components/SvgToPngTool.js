"use client";

import React, { useState, useCallback, useRef } from "react";
import { useAdPauseWhile } from "@/hooks/useAdPause";
import useTrackedObjectUrls from "@/hooks/useTrackedObjectUrls";
import useImageBatchQueue from "@/hooks/useImageBatchQueue";
import {
  markBatchItemsCancelled,
  updateBatchItemStatus,
} from "@/hooks/imageBatchQueueUtils.js";
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
  const [error, setError] = useState("");

  const hiddenInputRef = useRef(null);
  const itemsRef = useRef([]);
  const optionsRef = useRef(options);
  const {
    isProcessing,
    processBatch,
    cancelBatch,
    scheduleReprocess,
    invalidateBatch,
    selectFiles,
    addItems,
    removeItem,
    clearItems,
  } = useImageBatchQueue();
  const { createTrackedUrl, revokeTrackedUrl } = useTrackedObjectUrls();

  // Ad pause integration
  useAdPauseWhile("svg-to-png-processing", isProcessing);
  useAdPauseWhile("svg-to-png-error", Boolean(error));
  useAdPauseWhile("svg-to-png-empty", items.length === 0);

  const commitItems = useCallback((nextItems) => {
    itemsRef.current = nextItems;
    setItems(nextItems);
  }, []);

  /**
   * Sequential rendering engine.
   * Renders each SVG to Canvas and exports PNG Blob.
   */
  const runBatch = useCallback((itemsToProcess, currentOptions) => processBatch(
    itemsToProcess,
    currentOptions,
    {
      shouldProcess: (item) => !(item.status === "error" && !item.svgText),
      onStart: (item) => commitItems(updateBatchItemStatus(
        itemsRef.current,
        item.id,
        "processing"
      )),
      processItem: async (item, batchOptions) => {
        const { width: targetWidth, height: targetHeight, wasCapped } =
          calculateTargetDimensions(item.origWidth, item.origHeight, batchOptions);
        const pngBlob = await renderSvgToPng(
          item.svgText,
          targetWidth,
          targetHeight,
          batchOptions.backgroundColor
        );
        return { pngBlob, targetWidth, targetHeight, wasCapped };
      },
      onSuccess: (item, result) => {
        const latestItem = itemsRef.current.find((current) => current.id === item.id);
        if (!latestItem) return;

        const previewUrl = createTrackedUrl(result.pngBlob);
        commitItems(itemsRef.current.map((current) => {
          if (current.id !== item.id) return current;
          if (current.previewUrl && current.previewUrl !== previewUrl) {
            revokeTrackedUrl(current.previewUrl);
          }
          return {
            ...current,
            status: "done",
            blob: result.pngBlob,
            pngSize: result.pngBlob.size,
            targetWidth: result.targetWidth,
            targetHeight: result.targetHeight,
            wasCapped: result.wasCapped,
            previewUrl,
            error: "",
          };
        }));
      },
      onError: (item, cause) => commitItems(updateBatchItemStatus(
        itemsRef.current,
        item.id,
        "error",
        { error: cause?.message || "Failed to render SVG image." }
      )),
    }
  ), [commitItems, createTrackedUrl, processBatch, revokeTrackedUrl]);

  /**
   * File upload and validation handler for .svg files.
   */
  const handleUpload = useCallback(
    async (newFiles, uploadNotice = "") => {
      const currentList = itemsRef.current;
      const isSvgFile = (file) =>
        (file.type || "").toLowerCase().includes("svg") || /\.svg$/i.test(file.name || "");
      const {
        validFiles,
        unsupported,
        oversized,
        skippedByLimit,
      } = selectFiles(
        newFiles,
        currentList.length,
        MAX_FILES,
        MAX_FILE_SIZE_BYTES,
        isSvgFile
      );

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

      const updated = addItems(currentList, newItems);
      commitItems(updated);
      runBatch(updated, optionsRef.current);
    },
    [addItems, commitItems, runBatch, selectFiles]
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

      const updated = addItems(currentList, [newItem]);
      commitItems(updated);
      runBatch(updated, optionsRef.current);
      setError("");
    },
    [addItems, commitItems, runBatch]
  );

  /**
   * Options change with debounced batch re-rendering.
   */
  const handleOptionChange = useCallback(
    (nextOptions) => {
      optionsRef.current = nextOptions;
      setOptions(nextOptions);

      // Mark valid items as pending
      const resetItems = itemsRef.current.map((item) => ({
        ...item,
        status: item.svgText ? "pending" : item.status,
      }));
      commitItems(resetItems);

      if (resetItems.length === 0) {
        invalidateBatch();
        return;
      }

      scheduleReprocess(() => runBatch(itemsRef.current, nextOptions));
    },
    [commitItems, invalidateBatch, runBatch, scheduleReprocess]
  );

  const handleCancelBatch = useCallback(() => {
    cancelBatch(() => commitItems(markBatchItemsCancelled(
      itemsRef.current,
      ["processing", "pending"],
      "error",
      { error: "Rendering cancelled" }
    )));
  }, [cancelBatch, commitItems]);

  const handleRemove = useCallback(
    (id) => {
      const target = itemsRef.current.find((item) => item.id === id);
      if (target && target.previewUrl) {
        revokeTrackedUrl(target.previewUrl);
      }
      commitItems(removeItem(itemsRef.current, id));
    },
    [commitItems, removeItem, revokeTrackedUrl]
  );

  const handleClearAll = useCallback(() => {
    invalidateBatch();

    for (const item of itemsRef.current) {
      if (item.previewUrl) {
        revokeTrackedUrl(item.previewUrl);
      }
    }
    commitItems(clearItems());
    setError("");
  }, [clearItems, commitItems, invalidateBatch, revokeTrackedUrl]);

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
