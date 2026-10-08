"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAdPauseWhile } from "@/hooks/useAdPause";
import { saveAs } from "file-saver";
import { FaCheckCircle, FaExclamationCircle, FaLock } from "react-icons/fa";
import FileUploader from "@/components/pdf/file/FileUploader";
import {
  createZipArchive,
  getOutputFilename,
  isAcceptedImage,
  isPngFile,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES,
} from "../../utils/imageSharedUtils.js";
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

const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve, 10));

export default function ImageResizerTool() {
  const [items, setItems] = useState([]);
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const hiddenInputRef = useRef(null);
  const itemsRef = useRef([]);
  const optionsRef = useRef(DEFAULT_OPTIONS);
  const batchIdRef = useRef(0);
  const debounceTimerRef = useRef(null);
  const objectUrlsRef = useRef(new Set());

  useAdPauseWhile("image-resizer-processing", isProcessing);
  useAdPauseWhile("image-resizer-error", Boolean(error));
  useAdPauseWhile("image-resizer-empty", items.length === 0);

  const commitItems = useCallback((nextItems) => {
    itemsRef.current = nextItems;
    setItems(nextItems);
  }, []);

  const createTrackedUrl = useCallback((blob) => {
    const url = URL.createObjectURL(blob);
    objectUrlsRef.current.add(url);
    return url;
  }, []);

  const revokeTrackedUrl = useCallback((url) => {
    if (!url || !objectUrlsRef.current.delete(url)) return;
    URL.revokeObjectURL(url);
  }, []);

  useEffect(() => () => {
    clearTimeout(debounceTimerRef.current);
    batchIdRef.current += 1;
    for (const url of objectUrlsRef.current) URL.revokeObjectURL(url);
    objectUrlsRef.current.clear();
  }, []);

  const processBatch = useCallback(async (itemsToProcess, currentOptions) => {
    const batchId = ++batchIdRef.current;
    setIsProcessing(true);

    for (const currentItem of itemsToProcess) {
      if (batchId !== batchIdRef.current) break;
      const before = itemsRef.current.find((item) => item.id === currentItem.id);
      if (!before) continue;
      commitItems(itemsRef.current.map((item) =>
        item.id === currentItem.id
          ? { ...item, status: "resizing", progress: 15, error: "" }
          : item
      ));
      await yieldToBrowser();
      if (batchId !== batchIdRef.current) break;

      try {
        const result = await resizeSingleImage(currentItem.file, currentOptions);
        if (batchId !== batchIdRef.current) break;
        if (!optionsRef.current.aspectRatio) {
          const nextOptions = {
            ...optionsRef.current,
            aspectRatio: result.originalWidth / result.originalHeight,
          };
          optionsRef.current = nextOptions;
          setOptions(nextOptions);
        }
        const thumbnailUrl = createTrackedUrl(result.blob);
        const latestItem = itemsRef.current.find((item) => item.id === currentItem.id);
        if (!latestItem) {
          revokeTrackedUrl(thumbnailUrl);
          continue;
        }

        commitItems(itemsRef.current.map((item) =>
          item.id === currentItem.id
            ? {
                ...item,
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
            : item
        ));
        if (latestItem.thumbnailUrl !== thumbnailUrl) {
          revokeTrackedUrl(latestItem.thumbnailUrl);
        }
      } catch (cause) {
        if (batchId !== batchIdRef.current) break;
        const message = cause instanceof Error
          ? cause.message
          : "Unable to resize this image.";
        commitItems(itemsRef.current.map((item) =>
          item.id === currentItem.id
            ? { ...item, status: "error", progress: 0, error: message }
            : item
        ));
      }
      await yieldToBrowser();
    }

    if (batchId === batchIdRef.current) setIsProcessing(false);
  }, [commitItems, createTrackedUrl, revokeTrackedUrl]);

  const handleUpload = useCallback((newFiles, uploadNotice = "") => {
    const currentItems = itemsRef.current;
    const remainingSlots = MAX_FILES - currentItems.length;
    const selectedFiles = Array.from(newFiles);
    const unsupportedCount = selectedFiles.filter((file) => !isAcceptedImage(file)).length;
    const oversizedFiles = selectedFiles.filter((file) => file.size > MAX_FILE_SIZE_BYTES);
    const eligibleFiles = selectedFiles.filter(
      (file) => isAcceptedImage(file) && file.size <= MAX_FILE_SIZE_BYTES
    );
    const validFiles = eligibleFiles.slice(0, Math.max(remainingSlots, 0));
    const skippedByLimit = eligibleFiles.length - validFiles.length;
    const notices = [
      uploadNotice,
      unsupportedCount ? `${unsupportedCount} unsupported image file(s) were skipped.` : "",
      oversizedFiles.length
        ? `${oversizedFiles.map((file) => file.name).join(", ")} exceeds the 25 MB file limit.`
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
    const combined = [...currentItems, ...added];
    commitItems(combined);
    processBatch(combined, optionsRef.current);
  }, [commitItems, createTrackedUrl, processBatch]);

  const handleOptionChange = useCallback((nextOptions) => {
    optionsRef.current = nextOptions;
    setOptions(nextOptions);
    batchIdRef.current += 1;
    setIsProcessing(false);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    const pending = itemsRef.current.map((item) => ({
      ...item,
      status: "pending",
      progress: 0,
      outputFilename: getOutputFilename(item.file.name, nextOptions.outputFormat),
    }));
    commitItems(pending);
    if (!pending.length) return;
    debounceTimerRef.current = setTimeout(() => {
      processBatch(itemsRef.current, nextOptions);
    }, 300);
  }, [commitItems, processBatch]);

  const handleCancel = useCallback(() => {
    batchIdRef.current += 1;
    clearTimeout(debounceTimerRef.current);
    setIsProcessing(false);
    commitItems(itemsRef.current.map((item) =>
      item.status === "pending" || item.status === "resizing"
        ? { ...item, status: "cancelled", progress: 0 }
        : item
    ));
  }, [commitItems]);

  const handleRemove = useCallback((id) => {
    const removed = itemsRef.current.find((item) => item.id === id);
    if (removed) {
      revokeTrackedUrl(removed.thumbnailUrl);
      if (removed.initialThumb !== removed.thumbnailUrl) {
        revokeTrackedUrl(removed.initialThumb);
      }
    }
    commitItems(itemsRef.current.filter((item) => item.id !== id));
  }, [commitItems, revokeTrackedUrl]);

  const handleClearAll = useCallback(() => {
    batchIdRef.current += 1;
    clearTimeout(debounceTimerRef.current);
    setIsProcessing(false);
    for (const item of itemsRef.current) {
      revokeTrackedUrl(item.thumbnailUrl);
      if (item.initialThumb !== item.thumbnailUrl) {
        revokeTrackedUrl(item.initialThumb);
      }
    }
    commitItems([]);
    setError("");
  }, [commitItems, revokeTrackedUrl]);

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
