"use client";

import React, { useCallback, useRef, useState } from "react";
import { useAdPauseWhile } from "@/hooks/useAdPause";
import useTrackedObjectUrls from "@/hooks/useTrackedObjectUrls";
import useImageBatchQueue from "@/hooks/useImageBatchQueue";
import { updateBatchItemStatus } from "@/hooks/imageBatchQueueUtils.js";
import { saveAs } from "file-saver";
import { FaCheckCircle, FaExclamationCircle, FaLock } from "react-icons/fa";
import FileUploader from "@/components/pdf/file/FileUploader";
import { IMAGE_PROCESSING_LIMITS } from "@/utils/fileProcessingLimits";
import {
  createZipArchive,
  getOutputFilename,
  isAcceptedImage,
  isPngFile,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES,
  formatFileSizeLimit,
} from "../../utils/imageToolUtils.js";
import {
  IMAGE_BATCH_MAX_FILES,
  IMAGE_FILE_MAX_SIZE_BYTES,
} from "../../utils/imageToolConfig.js";
import { DEFAULT_QUALITY, resizeSingleImage } from "../imageResizerUtils.js";
import ResizerOptionsBar from "./ResizerOptionsBar";
import ResizerSummaryBar from "./ResizerSummaryBar";
import ResizerGrid from "./ResizerGrid";

const DEFAULT_OPTIONS = {
  resizeMode: "pixels",
  width: null,
  height: null,
  percentage: 100,
  aspectLocked: true,
  aspectRatio: null,
  fitMode: "contain",
  outputFormat: "original",
  quality: DEFAULT_QUALITY,
  pngBackground: "#FFFFFF",
  selectedPreset: 0,
};

export default function ImageResizerTool() {
  const [items, setItems] = useState([]);
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [error, setError] = useState("");
  const hiddenInputRef = useRef(null);
  const itemsRef = useRef([]);
  const optionsRef = useRef(DEFAULT_OPTIONS);
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

  useAdPauseWhile("image-resizer-processing", isProcessing);
  useAdPauseWhile("image-resizer-error", Boolean(error));
  useAdPauseWhile("image-resizer-empty", items.length === 0);

  const commitItems = useCallback((nextItems) => {
    itemsRef.current = nextItems;
    setItems(nextItems);
  }, []);

  const runBatch = useCallback((itemsToProcess, currentOptions) => processBatch(
    itemsToProcess,
    currentOptions,
    {
      shouldProcess: (item) => itemsRef.current.some((current) => current.id === item.id),
      onStart: (item) => commitItems(updateBatchItemStatus(
        itemsRef.current,
        item.id,
        "resizing",
        { progress: 15, error: "" }
      )),
      processItem: (item, batchOptions) => resizeSingleImage(item.file, batchOptions),
      onSuccess: (item, result) => {
        if (!optionsRef.current.aspectRatio) {
          const nextOptions = {
            ...optionsRef.current,
            aspectRatio: result.originalWidth / result.originalHeight,
          };
          optionsRef.current = nextOptions;
          setOptions(nextOptions);
        }

        const thumbnailUrl = createTrackedUrl(result.blob);
        const latestItem = itemsRef.current.find((current) => current.id === item.id);
        if (!latestItem) {
          revokeTrackedUrl(thumbnailUrl);
          return;
        }

        commitItems(itemsRef.current.map((current) =>
          current.id === item.id
            ? {
                ...current,
                status: "done",
                progress: 100,
                blob: result.blob,
                outputFilename: result.outputFilename,
                originalWidth: result.originalWidth,
                originalHeight: result.originalHeight,
                targetWidth: result.targetWidth,
                targetHeight: result.targetHeight,
                resizedSize: result.resizedSize,
                wasCapped: result.wasCapped,
                wasUpscaled: result.wasUpscaled,
                thumbnailUrl,
                warning: result.wasUpscaled
                  ? "Upscaling may reduce image sharpness."
                  : "",
                error: "",
              }
            : current
        ));
        if (latestItem.thumbnailUrl !== thumbnailUrl) {
          revokeTrackedUrl(latestItem.thumbnailUrl);
        }
      },
      onError: (item, cause) => {
        const message = cause instanceof Error
          ? cause.message
          : "Unable to resize this image.";
        commitItems(updateBatchItemStatus(
          itemsRef.current,
          item.id,
          "error",
          { progress: 0, error: message }
        ));
      },
    }
  ), [commitItems, createTrackedUrl, processBatch, revokeTrackedUrl]);

  const handleUpload = useCallback((newFiles, uploadNotice = "") => {
    const currentItems = itemsRef.current;
    const {
      validFiles,
      unsupported,
      oversized: oversizedFiles,
      overTotal,
      skippedByLimit,
    } = selectFiles(
      newFiles,
      currentItems.length,
      IMAGE_BATCH_MAX_FILES,
      IMAGE_FILE_MAX_SIZE_BYTES,
      isAcceptedImage,
      currentItems.reduce((total, item) => total + (item.file?.size || 0), 0),
      IMAGE_PROCESSING_LIMITS.maxTotalBytes
    );
    const unsupportedCount = unsupported.length;
    const notices = [
      uploadNotice,
      unsupportedCount ? `${unsupportedCount} unsupported image file(s) were skipped.` : "",
      oversizedFiles.length
        ? `${oversizedFiles.map((file) => file.name).join(", ")} exceeds the ${formatFileSizeLimit(IMAGE_FILE_MAX_SIZE_BYTES)} file limit.`
        : "",
      overTotal.length
        ? `Selected images exceed the ${Math.round(IMAGE_PROCESSING_LIMITS.maxTotalBytes / (1024 * 1024))} MB total browser-processing limit.`
        : "",
      skippedByLimit
        ? `${skippedByLimit} image(s) skipped; the limit is ${MAX_FILES} files.`
        : "",
    ].filter(Boolean);
    setError(notices.join(" "));
    if (!validFiles.length) return;

    const added = validFiles.map((file, index) => {
      const id = `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
      const initialThumb = createTrackedUrl(file);
      return {
        id,
        file,
        status: "pending",
        progress: 0,
        thumbnailUrl: initialThumb,
        initialThumb,
        outputFilename: getOutputFilename(file.name, optionsRef.current.outputFormat),
        originalWidth: 0,
        originalHeight: 0,
        targetWidth: 0,
        targetHeight: 0,
        error: "",
      };
    });
    const combined = addItems(currentItems, added);
    commitItems(combined);
    runBatch(combined, optionsRef.current);
  }, [addItems, commitItems, createTrackedUrl, runBatch, selectFiles]);

  const handleOptionChange = useCallback((nextOptions) => {
    optionsRef.current = nextOptions;
    setOptions(nextOptions);
    const pending = itemsRef.current.map((item) => ({
      ...item,
      status: "pending",
      progress: 0,
      outputFilename: getOutputFilename(item.file.name, nextOptions.outputFormat),
    }));
    commitItems(pending);
    if (!pending.length) {
      invalidateBatch();
      return;
    }
    scheduleReprocess(() => runBatch(itemsRef.current, nextOptions));
  }, [commitItems, invalidateBatch, runBatch, scheduleReprocess]);

  const handleCancel = useCallback(() => {
    cancelBatch(() => commitItems(itemsRef.current.map((item) =>
      item.status === "pending" || item.status === "resizing"
        ? { ...item, status: "cancelled", progress: 0 }
        : item
    )));
  }, [cancelBatch, commitItems]);

  const handleRemove = useCallback((id) => {
    const removed = itemsRef.current.find((item) => item.id === id);
    if (removed) {
      revokeTrackedUrl(removed.thumbnailUrl);
      if (removed.initialThumb !== removed.thumbnailUrl) {
        revokeTrackedUrl(removed.initialThumb);
      }
    }
    commitItems(removeItem(itemsRef.current, id));
  }, [commitItems, removeItem, revokeTrackedUrl]);

  const handleClearAll = useCallback(() => {
    invalidateBatch();
    for (const item of itemsRef.current) {
      revokeTrackedUrl(item.thumbnailUrl);
      if (item.initialThumb !== item.thumbnailUrl) {
        revokeTrackedUrl(item.initialThumb);
      }
    }
    commitItems(clearItems());
    setError("");
  }, [clearItems, commitItems, invalidateBatch, revokeTrackedUrl]);

  const handleDownloadAll = useCallback(async () => {
    const ready = itemsRef.current.filter((item) => item.status === "done" && item.blob);
    try {
      if (ready.length === 1) {
        saveAs(ready[0].blob, ready[0].outputFilename);
      } else if (ready.length > 1) {
        saveAs(await createZipArchive(ready), "resized-images.zip");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to create the ZIP archive.");
    }
  }, []);

  const hasPngWithJpgTarget = options.outputFormat === "jpg" &&
    items.some((item) => isPngFile(item.file));

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <input
        ref={hiddenInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        multiple
        onChange={(event) => {
          if (event.target.files?.length) handleUpload(event.target.files);
          event.target.value = "";
        }}
        className="hidden"
        aria-hidden="true"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-[#dce5e0] bg-[#f8faf9] px-4 py-3 text-xs text-[#527268]">
        <div className="flex items-center gap-2 font-medium text-[#173d34]">
          <FaLock className="h-3.5 w-3.5 text-[#235c4f]" />
          <span>100% Client-Side Resizing — Files never leave your browser</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <FaCheckCircle className="h-3 w-3 text-[#235c4f]" /> Up to {MAX_FILES} images
          </span>
          <span className="flex items-center gap-1.5">
            <FaCheckCircle className="h-3 w-3 text-[#235c4f]" /> Up to 25 MB each
          </span>
        </div>
      </div>

      {error && (
        <div id="global-error-banner" className="flex items-start gap-2.5 rounded-sm border border-[#f3cfc8] bg-[#fdf4f3] p-4 text-sm text-[#a13c2f]" role="alert">
          <FaExclamationCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss notice">×</button>
        </div>
      )}

      {items.length === 0 && (
        <FileUploader
          onUpload={handleUpload}
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          multiple
          maxFiles={MAX_FILES}
          maxFileSizeBytes={MAX_FILE_SIZE_BYTES}
          allowPartial
          fileTypeLabel="image"
          titleText="Drop JPG, PNG, or WebP images here"
          onError={setError}
        />
      )}

      {items.length > 0 && (
        <div className="space-y-5">
          <ResizerOptionsBar options={options} onChange={handleOptionChange} />
          {hasPngWithJpgTarget && (
            <p id="transparency-warning" className="rounded-sm border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="status">
              Converting PNG transparency to JPG fills transparent areas with the selected background color.
            </p>
          )}
          <ResizerSummaryBar
            items={items}
            onDownloadAll={handleDownloadAll}
            onAddMore={() => hiddenInputRef.current?.click()}
            onClearAll={handleClearAll}
            onCancel={handleCancel}
            isProcessing={isProcessing}
          />
          <ResizerGrid items={items} onRemove={handleRemove} />
        </div>
      )}
    </div>
  );
}
