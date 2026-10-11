"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useAdPauseWhile } from "@/hooks/useAdPause";
import { saveAs } from "file-saver";
import FileUploader from "@/components/pdf/file/FileUploader";
import ConverterOptionsBar from "./ConverterOptionsBar";
import ConverterSummaryBar from "./ConverterSummaryBar";
import ConverterGrid from "./ConverterGrid";
import {
  convertSingleImage,
  createZipArchive,
  detectImageFormat,
  getConvertedFilename,
  isAcceptedConvertInput,
  isPotentialTransparentFormat,
  DEFAULT_QUALITY,
  MAX_FILES,
  MAX_FILE_SIZE_BYTES,
} from "../imageConverterUtils";
import { FaLock, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

export default function ImageConverterTool() {
  const [images, setImages] = useState([]);
  const [options, setOptions] = useState({
    targetFormat: "jpg",
    quality: DEFAULT_QUALITY,
    backgroundColor: "#FFFFFF",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const hiddenInputRef = useRef(null);
  const activeBatchIdRef = useRef(0);
  const isCancelledRef = useRef(false);
  const debounceTimerRef = useRef(null);
  const objectUrlsRef = useRef(new Set());
  const imagesRef = useRef([]);
  const optionsRef = useRef(options);

  // Ad pause integration:
  useAdPauseWhile("image-converter-processing", isProcessing);
  useAdPauseWhile("image-converter-error", Boolean(error));
  useAdPauseWhile("image-converter-empty", images.length === 0);

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

  const commitImages = useCallback((nextImages) => {
    imagesRef.current = nextImages;
    setImages(nextImages);
  }, []);

  /**
   * Sequential batch conversion engine.
   * Processes images one by one with UI yielding, supporting cancellation.
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
        if (currentItem.status === "error" && !currentItem.file) {
          continue;
        }

        // Set status to processing
        commitImages(
          imagesRef.current.map((img) =>
            img.id === currentItem.id ? { ...img, status: "processing" } : img
          )
        );

        // Allow UI to breathe
        await new Promise((resolve) => setTimeout(resolve, 10));

        if (isCancelledRef.current || batchId !== activeBatchIdRef.current) {
          break;
        }

        try {
          const result = await convertSingleImage(currentItem.file, currentOptions);

          if (isCancelledRef.current || batchId !== activeBatchIdRef.current) {
            break;
          }

          const targetUrl = createTrackedUrl(result.blob);

          commitImages(
            imagesRef.current.map((img) => {
              if (img.id !== currentItem.id) return img;
              if (img.thumbnailUrl && img.thumbnailUrl !== targetUrl) {
                revokeTrackedUrl(img.thumbnailUrl);
              }
              return {
                ...img,
                status: result.isSkipped ? "skipped" : "done",
                blob: result.blob,
                outputFilename: result.outputFilename,
                originalFormat: result.originalFormat,
                targetFormat: result.targetFormat,
                originalSize: result.originalSize,
                convertedSize: result.convertedSize,
                width: result.width || img.width,
                height: result.height || img.height,
                note: result.note,
                thumbnailUrl: targetUrl,
                error: "",
              };
            })
          );
        } catch (err) {
          if (isCancelledRef.current || batchId !== activeBatchIdRef.current) {
            break;
          }

          commitImages(
            imagesRef.current.map((img) =>
              img.id === currentItem.id
                ? {
                    ...img,
                    status: "error",
                    error: err?.message || "Failed to convert image.",
                  }
                : img
            )
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      if (batchId === activeBatchIdRef.current) {
        setIsProcessing(false);
      }
    },
    [commitImages, createTrackedUrl, revokeTrackedUrl]
  );

  /**
   * File upload and validation handler.
   */
  const handleUpload = useCallback(
    (newFiles, uploadNotice = "") => {
      const currentList = imagesRef.current;
      const remainingSlots = MAX_FILES - currentList.length;
      const selected = Array.from(newFiles);

      const unsupported = selected.filter((file) => !isAcceptedConvertInput(file));
      const oversized = selected.filter((file) => file.size > MAX_FILE_SIZE_BYTES);
      const eligible = selected.filter(
        (file) => isAcceptedConvertInput(file) && file.size <= MAX_FILE_SIZE_BYTES
      );

      const validFiles = eligible.slice(0, Math.max(0, remainingSlots));
      const skippedByLimit = eligible.length - validFiles.length;

      const noticeParts = [
        uploadNotice,
        unsupported.length
          ? `${unsupported.length} unsupported file(s) (e.g., SVG, HEIC, PDF) were skipped.`
          : "",
        oversized.length
          ? `${oversized.map((f) => f.name).join(", ")} exceeds the 25 MB file limit.`
          : "",
        skippedByLimit
          ? `${skippedByLimit} image(s) skipped; maximum limit is ${MAX_FILES} images.`
          : "",
      ].filter(Boolean);

      setError(noticeParts.join(" "));

      if (validFiles.length === 0) return;

      const newItems = validFiles.map((file, idx) => {
        const id = `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`;
        const originalFormat = detectImageFormat(file) || "IMG";
        const thumbUrl = createTrackedUrl(file);
        return {
          id,
          file,
          name: file.name,
          originalSize: file.size,
          convertedSize: null,
          width: null,
          height: null,
          originalFormat,
          targetFormat: optionsRef.current.targetFormat.toUpperCase(),
          outputFilename: getConvertedFilename(file.name, optionsRef.current.targetFormat),
          status: "pending",
          blob: null,
          thumbnailUrl: thumbUrl,
          error: "",
          note: "",
        };
      });

      const updated = [...currentList, ...newItems];
      commitImages(updated);
      processBatch(updated, optionsRef.current);
    },
    [commitImages, createTrackedUrl, processBatch]
  );

  /**
   * Option changes with debounced batch re-processing.
   */
  const handleOptionChange = useCallback(
    (field, value) => {
      const nextOptions = { ...optionsRef.current, [field]: value };
      optionsRef.current = nextOptions;
      setOptions(nextOptions);

      // Cancel current running batch
      activeBatchIdRef.current += 1;
      isCancelledRef.current = true;
      setIsProcessing(false);
      clearTimeout(debounceTimerRef.current);

      // Reset items to pending with new target format
      const targetUpper = nextOptions.targetFormat.toUpperCase() === "JPEG" ? "JPG" : nextOptions.targetFormat.toUpperCase();
      const resetItems = imagesRef.current.map((img) => ({
        ...img,
        targetFormat: targetUpper,
        outputFilename: getConvertedFilename(img.file.name, nextOptions.targetFormat),
        status: "pending",
      }));
      commitImages(resetItems);

      if (resetItems.length === 0) return;

      // Debounce re-processing
      debounceTimerRef.current = setTimeout(() => {
        processBatch(imagesRef.current, nextOptions);
      }, 300);
    },
    [commitImages, processBatch]
  );

  const handleCancelBatch = useCallback(() => {
    isCancelledRef.current = true;
    activeBatchIdRef.current += 1;
    clearTimeout(debounceTimerRef.current);
    setIsProcessing(false);

    commitImages(
      imagesRef.current.map((img) =>
        img.status === "processing" || img.status === "pending"
          ? { ...img, status: "error", error: "Conversion cancelled" }
          : img
      )
    );
  }, [commitImages]);

  const handleRemove = useCallback(
    (id) => {
      const target = imagesRef.current.find((img) => img.id === id);
      if (target && target.thumbnailUrl) {
        revokeTrackedUrl(target.thumbnailUrl);
      }
      commitImages(imagesRef.current.filter((img) => img.id !== id));
    },
    [commitImages, revokeTrackedUrl]
  );

  const handleClearAll = useCallback(() => {
    isCancelledRef.current = true;
    activeBatchIdRef.current += 1;
    clearTimeout(debounceTimerRef.current);
    setIsProcessing(false);

    for (const img of imagesRef.current) {
      if (img.thumbnailUrl) {
        revokeTrackedUrl(img.thumbnailUrl);
      }
    }
    commitImages([]);
    setError("");
  }, [commitImages, revokeTrackedUrl]);

  const handleDownloadSingle = useCallback((item) => {
    if (!item.blob || !item.outputFilename) return;
    saveAs(item.blob, item.outputFilename);
  }, []);

  const handleDownloadAll = useCallback(async () => {
    const readyItems = imagesRef.current.filter(
      (img) => img.blob && (img.status === "done" || img.status === "skipped")
    );
    if (readyItems.length === 0) return;

    if (readyItems.length === 1) {
      saveAs(readyItems[0].blob, readyItems[0].outputFilename);
      return;
    }

    try {
      const zipBlob = await createZipArchive(readyItems);
      saveAs(zipBlob, "converted-images.zip");
    } catch (err) {
      setError(err?.message || "Failed to create ZIP archive.");
    }
  }, []);

  const hasTransparentToJpg =
    options.targetFormat === "jpg" &&
    images.some((img) => isPotentialTransparentFormat(img.originalFormat));

  const processedCount = images.filter(
    (img) => img.status === "done" || img.status === "skipped"
  ).length;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Hidden file input for adding more images */}
      <input
        ref={hiddenInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/bmp,image/gif,image/avif,.jpg,.jpeg,.png,.webp,.bmp,.gif,.avif"
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
          <span>100% Client-Side Conversion — Files never leave your browser</span>
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

      {/* Dropzone upload area */}
      {images.length === 0 && (
        <FileUploader
          onUpload={handleUpload}
          accept="image/jpeg,image/png,image/webp,image/bmp,image/gif,image/avif,.jpg,.jpeg,.png,.webp,.bmp,.gif,.avif"
          multiple={true}
          maxFiles={MAX_FILES}
          maxFileSizeBytes={MAX_FILE_SIZE_BYTES}
          allowPartial={true}
          fileTypeLabel="image"
          titleText="Drop JPG, PNG, WebP, BMP, GIF or AVIF images here"
          onError={(msg) => setError(msg)}
        />
      )}

      {/* Main active tool layout */}
      {images.length > 0 && (
        <div className="space-y-5">
          <ConverterOptionsBar
            options={options}
            onOptionsChange={handleOptionChange}
            hasTransparentToJpg={hasTransparentToJpg}
            disabled={isProcessing}
          />

          <ConverterSummaryBar
            images={images}
            isProcessing={isProcessing}
            processedCount={processedCount}
            onDownloadAll={handleDownloadAll}
            onAddMore={() => hiddenInputRef.current?.click()}
            onClearAll={handleClearAll}
            onCancelBatch={handleCancelBatch}
          />

          <ConverterGrid
            images={images}
            onDownloadSingle={handleDownloadSingle}
            onRemove={handleRemove}
          />
        </div>
      )}
    </div>
  );
}
