"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useAdPauseWhile } from "@/hooks/useAdPause";
import { saveAs } from "file-saver";
import FileUploader from "@/components/pdf/file/FileUploader";
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
} from "../imageCompressorUtils";
import { FaLock, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

export default function ImageCompressorTool() {
  const [images, setImages] = useState([]);
  const [options, setOptions] = useState({
    quality: DEFAULT_QUALITY,
    outputFormat: "original",
    maxDimension: "none",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const hiddenInputRef = useRef(null);
  const activeBatchIdRef = useRef(0);
  const isCancelledRef = useRef(false);
  const objectUrlsRef = useRef(new Set());

  // Ad pause integration:
  useAdPauseWhile("image-compressor-processing", isProcessing);
  useAdPauseWhile("image-compressor-error", Boolean(error));
  useAdPauseWhile("image-compressor-empty", images.length === 0);

  // Clean up all allocated object URLs on unmount
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      for (const url of objectUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  const createTrackedUrl = useCallback((blob) => {
    const url = URL.createObjectURL(blob);
    objectUrlsRef.current.add(url);
    return url;
  }, []);

  const revokeTrackedUrl = useCallback((url) => {
    if (url) {
      objectUrlsRef.current.delete(url);
      URL.revokeObjectURL(url);
    }
  }, []);

  /**
   * Sequential compression engine.
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
        setImages((prev) =>
          prev.map((img) =>
            img.id === currentItem.id ? { ...img, status: "processing" } : img
          )
        );

        // Allow UI to breathe
        await new Promise((resolve) => setTimeout(resolve, 10));

        try {
          const result = await compressSingleImage(currentItem.file, currentOptions);

          if (isCancelledRef.current || batchId !== activeBatchIdRef.current) {
            break;
          }

          // Revoke prior thumbnail URL if different
          if (currentItem.thumbnailUrl && currentItem.thumbnailUrl !== currentItem.initialThumb) {
            revokeTrackedUrl(currentItem.thumbnailUrl);
          }

          const newThumbnail = createTrackedUrl(result.blob);

          setImages((prev) =>
            prev.map((img) => {
              if (img.id !== currentItem.id) return img;
              return {
                ...img,
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
              };
            })
          );
        } catch (err) {
          if (isCancelledRef.current || batchId !== activeBatchIdRef.current) {
            break;
          }

          setImages((prev) =>
            prev.map((img) => {
              if (img.id !== currentItem.id) return img;
              return {
                ...img,
                status: "error",
                error: true,
                errorMessage: err.message || "Failed to compress",
              };
            })
          );
        }

        // Allow UI to update between images
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      if (batchId === activeBatchIdRef.current) {
        setIsProcessing(false);
      }
    },
    [createTrackedUrl, revokeTrackedUrl]
  );

  /**
   * Upload handler for FileUploader and Add More
   */
  const handleUpload = useCallback(
    (newFiles, uploadNotice) => {
      const currentTotal = images.length;
      const remainingSlots = MAX_FILES - currentTotal;

      if (remainingSlots <= 0) {
        setError(`Batch limit reached: maximum ${MAX_FILES} images allowed.`);
        return;
      }

      let filesArray = Array.from(newFiles);
      let limitNotice = "";

      if (filesArray.length > remainingSlots) {
        limitNotice = `Maximum ${MAX_FILES} images allowed. Added ${remainingSlots} images, skipped ${
          filesArray.length - remainingSlots
        }. `;
        filesArray = filesArray.slice(0, remainingSlots);
      }

      const validFiles = [];
      const skippedErrors = [];

      for (const file of filesArray) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          const maxMb = Math.floor(MAX_FILE_SIZE_BYTES / (1024 * 1024));
          skippedErrors.push(`${file.name} exceeds ${maxMb} MB limit`);
        } else if (!isAcceptedImage(file)) {
          skippedErrors.push(`${file.name} is not a valid image format`);
        } else {
          validFiles.push(file);
        }
      }

      const combinedError = `${uploadNotice ? `${uploadNotice} ` : ""}${limitNotice}${
        skippedErrors.length > 0
          ? `${skippedErrors.length} file(s) skipped: ${skippedErrors.slice(0, 2).join(", ")}${
              skippedErrors.length > 2 ? ` (+${skippedErrors.length - 2} more)` : ""
            }.`
          : ""
      }`.trim();

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
        const combined = [...prev, ...newItems];
        processBatch(newItems, options);
        return combined;
      });
    },
    [images.length, createTrackedUrl, processBatch, options]
  );

  /**
   * Options change handler with debouncing
   */
  const debounceTimerRef = useRef(null);

  const handleOptionChange = useCallback(
    (key, value) => {
      setOptions((prev) => {
        const next = { ...prev, [key]: value };
        setIsProcessing(true);

        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
          setImages((currImages) => {
            if (currImages.length > 0) {
              const itemsToRecompress = currImages.map((img) => ({
                ...img,
                status: "pending",
              }));
              processBatch(itemsToRecompress, next);
              return itemsToRecompress;
            }
            setIsProcessing(false);
            return currImages;
          });
        }, 300);

        return next;
      });
    },
    [processBatch]
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
        return prev.filter((_, i) => i !== index);
      });
    },
    [revokeTrackedUrl]
  );

  /**
   * Clear all images
   */
  const handleClearAll = useCallback(() => {
    isCancelledRef.current = true;
    activeBatchIdRef.current++;
    setIsProcessing(false);

    images.forEach((img) => {
      if (img.thumbnailUrl) revokeTrackedUrl(img.thumbnailUrl);
      if (img.initialThumb && img.initialThumb !== img.thumbnailUrl) {
        revokeTrackedUrl(img.initialThumb);
      }
    });

    setImages([]);
    setError("");
  }, [images, revokeTrackedUrl]);

  /**
   * Cancel batch
   */
  const handleCancelBatch = useCallback(() => {
    isCancelledRef.current = true;
    activeBatchIdRef.current++;
    setIsProcessing(false);
    setImages((prev) =>
      prev.map((img) => (img.status === "processing" || img.status === "pending" ? { ...img, status: "pending" } : img))
    );
  }, []);

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
            Batch up to 30 files
          </span>
          <span className="flex items-center gap-1.5">
            <FaCheckCircle className="h-3 w-3 text-[#235c4f]" />
            Up to 25 MB each
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
