export function createDifferenceImageData(
  originalPixels,
  revisedPixels,
  threshold = 36
) {
  if (
    originalPixels.length !== revisedPixels.length ||
    originalPixels.length % 4 !== 0
  ) {
    throw new Error("Page pixel buffers must have matching RGBA dimensions.");
  }

  const pixels = new Uint8ClampedArray(originalPixels.length);
  const totalPixels = originalPixels.length / 4;
  let changedPixels = 0;

  for (let index = 0; index < originalPixels.length; index += 4) {
    const colorDifference = Math.max(
      Math.abs(originalPixels[index] - revisedPixels[index]),
      Math.abs(originalPixels[index + 1] - revisedPixels[index + 1]),
      Math.abs(originalPixels[index + 2] - revisedPixels[index + 2]),
      Math.abs(originalPixels[index + 3] - revisedPixels[index + 3])
    );

    if (colorDifference >= threshold) {
      pixels[index] = 190;
      pixels[index + 1] = 60;
      pixels[index + 2] = 46;
      pixels[index + 3] = 255;
      changedPixels += 1;
    }
  }

  return {
    pixels,
    changedPixels,
    totalPixels,
    changedPercent: totalPixels
      ? (changedPixels / totalPixels) * 100
      : 0,
  };
}