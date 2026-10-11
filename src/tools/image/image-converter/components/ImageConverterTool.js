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
  formatFileSizeLimit,
} from "../imageConverterUtils";
import { FaLock, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

export default function ImageConverterTool() {
  const [images, setImages] = useState([]);
  const [options, setOptions] = useState({
    targetFormat: "jpg",
    quality: DEFAULT_QUALITY,
    backgroundColor: "#FFFFFF",
  });
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
  const [error, setError] = useState("");

  const hiddenInputRef = useRef(null);
  const imagesRef = useRef([]);
  const optionsRef = useRef(options);
  const { createTrackedUrl, revokeTrackedUrl } = useTrackedObjectUrls();

  // Ad pause integration:
  useAdPauseWhile("image-converter-processing", isProcessing);
  useAdPauseWhile("image-converter-error", Boolean(error));
  useAdPauseWhile("image-converter-empty", images.length === 0);

  const commitImages = useCallback((nextImages) => {
    imagesRef.current = nextImages;
    setImages(nextImages);
  }, []);

  const runBatch = useCallback((itemsToProcess, currentOptions) => processBatch(
    itemsToProcess,
    currentOptions,
    {
      shouldProcess: (item) => !(item.status === "error" && !item.file),
      onStart: (item) => commitImages(updateBatchItemStatus(
        imagesRef.current,
        item.id,
        "processing"
      )),
      processItem: (item, batchOptions) => convertSingleImage(item.file, batchOptions),
      onSuccess: (item, result) => {
        const targetUrl = createTrackedUrl(result.blob);
        commitImages(imagesRef.current.map((image) => {
          if (image.id !== item.id) return image;
          if (image.thumbnailUrl && image.thumbnailUrl !== targetUrl) {
            revokeTrackedUrl(image.thumbnailUrl);
          }
          return {
            ...image,
            status: result.isSkipped ? "skipped" : "done",
            blob: result.blob,
            outputFilename: result.outputFilename,
            originalFormat: result.originalFormat,
            targetFormat: result.targetFormat,
            originalSize: result.originalSize,
            convertedSize: result.convertedSize,
            width: result.width || image.width,
            height: result.height || image.height,
            note: result.note,
            thumbnailUrl: targetUrl,
            error: "",
          };
        }));
      },
      onError: (item, cause) => commitImages(imagesRef.current.map((image) =>
        image.id === item.id
          ? {
              ...image,
              status: "error",
              error: cause?.message || "Failed to convert image.",
            }
          : image
      )),
    }
  ), [commitImages, createTrackedUrl, processBatch, revokeTrackedUrl]);

  /**
   * File upload and validation handler.
   */
  const handleUpload = useCallback(
    (newFiles, uploadNotice = "") => {
      const currentList = imagesRef.current;
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
        isAcceptedConvertInput
      );

      const noticeParts = [
        uploadNotice,
        unsupported.length
          ? `${unsupported.length} unsupported file(s) (e.g., SVG, HEIC, PDF) were skipped.`
          : "",
        oversized.length
          ? `${oversized.map((f) => f.name).join(", ")} exceeds the ${formatFileSizeLimit(MAX_FILE_SIZE_BYTES)} file limit.`
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

      const updated = addItems(currentList, newItems);
      commitImages(updated);
      runBatch(updated, optionsRef.current);
    },
    [addItems, commitImages, createTrackedUrl, runBatch, selectFiles]
  );

  /**
   * Option changes with debounced batch re-processing.
   */
  const handleOptionChange = useCallback(
    (field, value) => {
      const nextOptions = { ...optionsRef.current, [field]: value };
      optionsRef.current = nextOptions;
      setOptions(nextOptions);

      // Reset items to pending with new target format
      const targetUpper = nextOptions.targetFormat.toUpperCase() === "JPEG" ? "JPG" : nextOptions.targetFormat.toUpperCase();
      const resetItems = imagesRef.current.map((img) => ({
        ...img,
        targetFormat: targetUpper,
        outputFilename: getConvertedFilename(img.file.name, nextOptions.targetFormat),
        status: "pending",
      }));
      commitImages(resetItems);

      if (resetItems.length === 0) {
        invalidateBatch();
        return;
      }

      scheduleReprocess(() => runBatch(imagesRef.current, nextOptions));
    },
    [commitImages, invalidateBatch, runBatch, scheduleReprocess]
  );

  const handleCancelBatch = useCallback(() => {
    cancelBatch(() => commitImages(markBatchItemsCancelled(
      imagesRef.current,
      ["processing", "pending"],
      "error",
      { error: "Conversion cancelled" }
    )));
  }, [cancelBatch, commitImages]);

  const handleRemove = useCallback(
    (id) => {
      const target = imagesRef.current.find((img) => img.id === id);
      if (target && target.thumbnailUrl) {
        revokeTrackedUrl(target.thumbnailUrl);
      }
      commitImages(removeItem(imagesRef.current, id));
    },
    [commitImages, removeItem, revokeTrackedUrl]
  );

  const handleClearAll = useCallback(() => {
    invalidateBatch();

    for (const img of imagesRef.current) {
      if (img.thumbnailUrl) {
        revokeTrackedUrl(img.thumbnailUrl);
      }
    }
    commitImages(clearItems());
    setError("");
  }, [clearItems, commitImages, invalidateBatch, revokeTrackedUrl]);

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
            <FaCheckCircle className="h-3 w-3 text-[#235c4f]" /> Up to {formatFileSizeLimit(MAX_FILE_SIZE_BYTES)} each
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
