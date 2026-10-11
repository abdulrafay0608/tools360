export function selectEligibleFiles(files, currentCount, maxFiles, maxFileSizeBytes, isAccepted) {
  const selected = Array.from(files);
  const accepted = selected.filter(isAccepted);
  const validFiles = accepted.filter((file) => file.size <= maxFileSizeBytes);
  const remainingSlots = Math.max(0, maxFiles - currentCount);
  const acceptedFiles = validFiles.slice(0, remainingSlots);

  return {
    selected,
    validFiles: acceptedFiles,
    unsupported: selected.filter((file) => !isAccepted(file)),
    oversized: selected.filter((file) => file.size > maxFileSizeBytes),
    skippedByLimit: Math.max(0, validFiles.length - acceptedFiles.length),
  };
}

export function addBatchItems(items, additions) {
  return [...items, ...additions];
}

export function removeBatchItem(items, itemId) {
  return items.filter((item) => item.id !== itemId);
}

export function removeBatchItemAt(items, index) {
  return items.filter((_, itemIndex) => itemIndex !== index);
}

export function clearBatchItems() {
  return [];
}

export function updateBatchItemStatus(items, itemId, status, update = {}) {
  return items.map((item) =>
    item.id === itemId ? { ...item, ...update, status } : item
  );
}

export function markBatchItemsCancelled(items, activeStatuses, cancelledStatus, update = {}) {
  const statuses = new Set(activeStatuses);
  return items.map((item) =>
    statuses.has(item.status) ? { ...item, ...update, status: cancelledStatus } : item
  );
}

export function isBatchActive(currentBatchId, batchId) {
  return currentBatchId === batchId;
}
