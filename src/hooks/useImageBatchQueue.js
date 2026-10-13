"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  IMAGE_BATCH_YIELD_DELAY_MS,
  IMAGE_REPROCESS_DEBOUNCE_MS,
} from "@/tools/image/utils/imageToolConfig.js";
import {
  addBatchItems,
  clearBatchItems,
  isBatchActive,
  removeBatchItem,
  removeBatchItemAt,
  selectEligibleFiles,
} from "./imageBatchQueueUtils.js";

const yieldToBrowser = (delay) =>
  new Promise((resolve) => setTimeout(resolve, delay));

export default function useImageBatchQueue() {
  const [isProcessing, setIsProcessing] = useState(false);
  const batchIdRef = useRef(0);
  const debounceTimerRef = useRef(null);

  const processBatch = useCallback(async (
    items,
    options,
    {
      shouldProcess = () => true,
      onStart,
      processItem,
      onSuccess,
      onError,
    }
  ) => {
    const batchId = ++batchIdRef.current;
    setIsProcessing(true);

    for (const item of items) {
      if (!isBatchActive(batchIdRef.current, batchId)) break;
      if (!shouldProcess(item)) continue;

      onStart(item);
      await yieldToBrowser(IMAGE_BATCH_YIELD_DELAY_MS);
      if (!isBatchActive(batchIdRef.current, batchId)) break;

      try {
        const result = await processItem(item, options);
        if (!isBatchActive(batchIdRef.current, batchId)) break;
        onSuccess(item, result);
      } catch (error) {
        if (!isBatchActive(batchIdRef.current, batchId)) break;
        onError(item, error);
      }

      await yieldToBrowser(IMAGE_BATCH_YIELD_DELAY_MS);
    }

    if (isBatchActive(batchIdRef.current, batchId)) setIsProcessing(false);
  }, []);

  const cancelBatch = useCallback((onCancel) => {
    batchIdRef.current += 1;
    clearTimeout(debounceTimerRef.current);
    setIsProcessing(false);
    onCancel?.();
  }, []);

  const scheduleReprocess = useCallback((callback, processingDuringDelay = false) => {
    batchIdRef.current += 1;
    clearTimeout(debounceTimerRef.current);
    setIsProcessing(processingDuringDelay);
    debounceTimerRef.current = setTimeout(
      callback,
      IMAGE_REPROCESS_DEBOUNCE_MS
    );
  }, []);

  const invalidateBatch = useCallback(() => {
    batchIdRef.current += 1;
    clearTimeout(debounceTimerRef.current);
    setIsProcessing(false);
  }, []);

  const selectFiles = useCallback(
    (files, currentCount, maxFiles, maxFileSizeBytes, isAccepted, currentTotalBytes, maxTotalBytes) =>
      selectEligibleFiles(files, currentCount, maxFiles, maxFileSizeBytes, isAccepted, currentTotalBytes, maxTotalBytes),
    []
  );

  useEffect(() => () => {
    batchIdRef.current += 1;
    clearTimeout(debounceTimerRef.current);
  }, []);

  return {
    isProcessing,
    processBatch,
    cancelBatch,
    scheduleReprocess,
    invalidateBatch,
    selectFiles,
    addItems: addBatchItems,
    removeItem: removeBatchItem,
    removeItemAt: removeBatchItemAt,
    clearItems: clearBatchItems,
  };
}
