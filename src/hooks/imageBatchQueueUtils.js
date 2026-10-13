export function selectEligibleFiles(
  files,
  currentCount,
  maxFiles,
  maxFileSizeBytes,
  isAccepted,
  currentTotalBytes = 0,
  maxTotalBytes = Infinity
) {
  const selected = Array.from(files);
  const accepted = selected.filter(isAccepted);
  const perFileValid = accepted.filter((file) => file.size > 0 && file.size <= maxFileSizeBytes);
  const remainingSlots = Math.max(0, maxFiles - currentCount);
  const validFiles = [];
  const overTotal = [];
  let totalBytes = currentTotalBytes;
  for (const file of perFileValid.slice(0, remainingSlots)) {
    if (totalBytes + file.size > maxTotalBytes) {
      overTotal.push(file);
    } else {
      validFiles.push(file);
      totalBytes += file.size;
    }
  }

  return {
    selected,
    validFiles,
    unsupported: selected.filter((file) => !isAccepted(file)),
    oversized: selected.filter((file) => file.size === 0 || file.size > maxFileSizeBytes),
    overTotal,
    skippedByLimit: Math.max(0, perFileValid.length - remainingSlots),
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
