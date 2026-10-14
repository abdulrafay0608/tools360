export function describeCompressionResult(originalSize, processedSize) {
  if (processedSize < originalSize) {
    return `File size reduced by ${(((originalSize - processedSize) / originalSize) * 100).toFixed(1)}%.`;
  }

  if (processedSize === originalSize) {
    return "The rewritten file is the same size. It may already be optimized, and embedded scanned images are not recompressed.";
  }

  return "The rewritten file is larger. This tool does not recompress embedded scanned images, so the original may already be more compact.";
}
