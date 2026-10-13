"use client";

import React, { useState, useCallback, useRef } from "react";
import { useAdPauseWhile } from "@/hooks/useAdPause";
import useTrackedObjectUrls from "@/hooks/useTrackedObjectUrls";
import useImageBatchQueue from "@/hooks/useImageBatchQueue";
import { updateBatchItemStatus } from "@/hooks/imageBatchQueueUtils.js";
import { saveAs } from "file-saver";
import FileUploader from "@/components/pdf/file/FileUploader";
import { IMAGE_PROCESSING_LIMITS, validateFileSelection } from "@/utils/fileProcessingLimits";
import ImageCompressorOptionsBar from "./ImageCompressorOptionsBar";
import ImageCompressorSummaryBar from "./ImageCompressorSummaryBar";
import ImageCompressorGrid from "./ImageCompressorGrid";
import {
  compressSingleImage,
  createZipArchive,
  isPngFile,
  isAcceptedImage,
  MAX_FILES,
  MAX_FILE_SIZE_BYTES,
  DEFAULT_QUALITY,
  formatFileSizeLimit,
} from "../imageCompressorUtils";
import { FaLock, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

export default function ImageCompressorTool() {
  const [images, setImages] = useState([]);
  const [options, setOptions] = useState({
    quality: DEFAULT_QUALITY,
    outputFormat: "original",
    maxDimension: "none",
  });
  const {
    isProcessing,
    processBatch,
    cancelBatch,
    scheduleReprocess,
    invalidateBatch,
    addItems,
    removeItemAt,
    clearItems,
  } = useImageBatchQueue();
  const [error, setError] = useState("");

  const hiddenInputRef = useRef(null);
  const { createTrackedUrl, revokeTrackedUrl } = useTrackedObjectUrls();

  // Ad pause integration:
  useAdPauseWhile("image-compressor-processing", isProcessing);
  useAdPauseWhile("image-compressor-error", Boolean(error));
  useAdPauseWhile("image-compressor-empty", images.length === 0);

  const runBatch = useCallback((itemsToProcess, currentOptions) => processBatch(
    itemsToProcess,
    currentOptions,
    {
      shouldProcess: (item) => !(item.status === "error" && !item.file),
      onStart: (item) => setImages((prev) =>
        updateBatchItemStatus(prev, item.id, "processing")
      ),
      processItem: (item, batchOptions) => compressSingleImage(item.file, batchOptions),
      onSuccess: (item, result) => {
        if (item.thumbnailUrl && item.thumbnailUrl !== item.initialThumb) {
          revokeTrackedUrl(item.thumbnailUrl);
        }
        const newThumbnail = createTrackedUrl(result.blob);
        setImages((prev) => prev.map((image) => image.id === item.id
          ? {
              ...image,
              status: result.isAlreadyOptimized ? "already-optimized" : "done",
              blob: result.blob,
              outputFilename: result.outputFilename,
              compressedSize: result.compressedSize,
              savedBytes: result.savedBytes,
              percentageSaved: result.percentageSaved,
              originalWidth: result.originalWidth,
              originalHeight: result.originalHeight,
              targetWidth: result.targetWidth,
              targetHeight: result.targetHeight,
              wasDownscaled: result.wasDownscaled,
              thumbnailUrl: newThumbnail,
              error: false,
              errorMessage: "",
            }
          : image
        ));
      },
      onError: (item, cause) => setImages((prev) => prev.map((image) =>
        image.id === item.id
          ? {
              ...image,
              status: "error",
              error: true,
              errorMessage: cause.message || "Failed to compress",
            }
          : image
      )),
    }
  ), [createTrackedUrl, processBatch, revokeTrackedUrl]);

  /**
   * Upload handler for FileUploader and Add More
   */
  const handleUpload = useCallback(
    (newFiles, uploadNotice) => {
      const selection = validateFileSelection({
        files: newFiles,
        existingFiles: images.map((item) => item.file),
        limits: IMAGE_PROCESSING_LIMITS,
        isAccepted: isAcceptedImage,
        label: "image",
      });
      const validFiles = selection.accepted;
      const combinedError = `${uploadNotice ? `${uploadNotice} ` : ""}${selection.rejected.slice(0, 2).join(" ")}`.trim();

      setError(combinedError);

      if (validFiles.length === 0) {
        return;
      }

      const newItems = validFiles.map((file, idx) => {
        const thumbUrl = createTrackedUrl(file);
        return {
          id: `${file.name}-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          file,
          name: file.name,
          originalSize: file.size,
          status: "pending",
          thumbnailUrl: thumbUrl,
          initialThumb: thumbUrl,
        };
      });

      setImages((prev) => {
        const combined = addItems(prev, newItems);
        runBatch(newItems, options);
        return combined;
      });
    },
    [addItems, images, createTrackedUrl, runBatch, options]
  );

  /**
   * Options change handler with debouncing
   */
  const handleOptionChange = useCallback(
    (key, value) => {
      setOptions((prev) => {
        const next = { ...prev, [key]: value };
        scheduleReprocess(() => {
          setImages((currImages) => {
            if (currImages.length > 0) {
              const itemsToRecompress = currImages.map((img) => ({
                ...img,
                status: "pending",
              }));
              runBatch(itemsToRecompress, next);
              return itemsToRecompress;
            }
            return currImages;
          });
        }, true);

        return next;
      });
    },
    [runBatch, scheduleReprocess]
  );

  /**
   * Single file download
   */
  const handleDownloadSingle = useCallback((item) => {
    if (!item.blob) return;
    saveAs(item.blob, item.outputFilename || "compressed-image.jpg");
  }, []);

  /**
   * Download all ready files as ZIP
   */
  const handleDownloadAllZip = useCallback(async () => {
    try {
      const zipBlob = await createZipArchive(images);
      saveAs(zipBlob, "compressed-images.zip");
    } catch (err) {
      setError(err.message || "Failed to create ZIP archive.");
    }
  }, [images]);

  /**
   * Remove single image
   */
  const handleRemove = useCallback(
    (index) => {
      setImages((prev) => {
        const itemToRemove = prev[index];
        if (itemToRemove?.thumbnailUrl) {
          revokeTrackedUrl(itemToRemove.thumbnailUrl);
        }
        if (itemToRemove?.initialThumb && itemToRemove.initialThumb !== itemToRemove.thumbnailUrl) {
          revokeTrackedUrl(itemToRemove.initialThumb);
        }
        return removeItemAt(prev, index);
      });
    },
    [removeItemAt, revokeTrackedUrl]
  );

  /**
   * Clear all images
   */
  const handleClearAll = useCallback(() => {
    invalidateBatch();

    images.forEach((img) => {
      if (img.thumbnailUrl) revokeTrackedUrl(img.thumbnailUrl);
      if (img.initialThumb && img.initialThumb !== img.thumbnailUrl) {
        revokeTrackedUrl(img.initialThumb);
      }
    });

    setImages(clearItems());
    setError("");
  }, [clearItems, images, invalidateBatch, revokeTrackedUrl]);

  /**
   * Cancel batch
   */
  const handleCancelBatch = useCallback(() => {
    cancelBatch();
    setImages((prev) =>
      prev.map((img) => (img.status === "processing" || img.status === "pending" ? { ...img, status: "pending" } : img))
    );
  }, [cancelBatch]);

  const handleAddMoreClick = () => {
    if (hiddenInputRef.current) {
      hiddenInputRef.current.click();
    }
  };

  const handleHiddenFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files);
    }
    e.target.value = "";
  };

  const hasPngWithJpgTarget =
    options.outputFormat === "jpg" && images.some((img) => isPngFile(img.file));

  const processedCount = images.filter(
    (img) => img.status === "done" || img.status === "already-optimized"
  ).length;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Hidden file input for '+ Add Images' */}
      <input
        ref={hiddenInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        multiple
        onChange={handleHiddenFileInputChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Trust & Guarantee Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-[#dce5e0] bg-[#f8faf9] px-4 py-3 text-xs text-[#527268]">
        <div className="flex items-center gap-2 font-medium text-[#173d34]">
          <FaLock className="h-3.5 w-3.5 text-[#235c4f]" />
          <span>100% Client-Side Compression — Files never leave your browser</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <FaCheckCircle className="h-3 w-3 text-[#235c4f]" />
            Batch up to {MAX_FILES} files
          </span>
          <span className="flex items-center gap-1.5">
            <FaCheckCircle className="h-3 w-3 text-[#235c4f]" />
            Up to {formatFileSizeLimit(MAX_FILE_SIZE_BYTES)} each
          </span>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div
          id="global-error-banner"
          className="flex items-start gap-2.5 rounded-sm border border-[#f3cfc8] bg-[#fdf4f3] p-4 text-xs text-[#a13c2f]"
          role="alert"
        >
          <FaExclamationCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#c2410c]" />
          <div className="flex-1">
            <span className="font-semibold">Notice:</span> {error}
          </div>
          <button
            type="button"
            onClick={() => setError("")}
            className="text-[#a13c2f] hover:text-[#7f2d1d]"
          >
            ✕
          </button>
        </div>
      )}

      {/* State 1: Upload Dropzone (When no images uploaded yet) */}
      {images.length === 0 && (
        <div>
          <FileUploader
            onUpload={handleUpload}
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            multiple
            maxFiles={MAX_FILES}
            maxFileSizeBytes={MAX_FILE_SIZE_BYTES}
            allowPartial={true}
            fileTypeLabel="image"
            titleText="Drop JPG, PNG, or WebP images here"
            onError={(err) => setError(err)}
          />
        </div>
      )}

      {/* State 2: Images loaded — options bar, summary bar, and image grid */}
      {images.length > 0 && (
        <div className="space-y-5">
          {/* Options toolbar */}
          <ImageCompressorOptionsBar
            options={options}
            onOptionsChange={handleOptionChange}
            hasPngWithJpgTarget={hasPngWithJpgTarget}
            isProcessing={isProcessing}
          />

          {/* Stats summary & batch actions */}
          <ImageCompressorSummaryBar
            images={images}
            isProcessing={isProcessing}
            processedCount={processedCount}
            onDownloadAllZip={handleDownloadAllZip}
            onAddMore={handleAddMoreClick}
            onClearAll={handleClearAll}
            onCancelBatch={handleCancelBatch}
          />

          {/* Images preview list */}
          <ImageCompressorGrid
            images={images}
            onDownloadSingle={handleDownloadSingle}
            onRemove={handleRemove}
          />
        </div>
      )}
    </div>
  );
}
