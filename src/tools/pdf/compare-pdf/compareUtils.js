/**
 * compareUtils.js
 * Core pixel-level comparison utilities for the Compare PDF tool.
 */

/**
 * Computes a visual difference image between two same-sized RGBA pixel buffers.
 * Changed pixels are rendered with a semi-transparent red highlight layered over
 * the original, keeping document context visible.
 *
 * @param {Uint8ClampedArray} originalPixels  RGBA pixel data from the original page
 * @param {Uint8ClampedArray} revisedPixels   RGBA pixel data from the revised page
 * @param {number}            threshold       Min channel delta to count as changed (default 30)
 * @returns {{ pixels: Uint8ClampedArray, changedPixels: number, totalPixels: number, changedPercent: number }}
 */
export function createDifferenceImageData(
  originalPixels,
  revisedPixels,
  threshold = 30
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

  for (let i = 0; i < originalPixels.length; i += 4) {
    const dr = Math.abs(originalPixels[i] - revisedPixels[i]);
    const dg = Math.abs(originalPixels[i + 1] - revisedPixels[i + 1]);
    const db = Math.abs(originalPixels[i + 2] - revisedPixels[i + 2]);
    const colorDifference = Math.max(dr, dg, db);

    if (colorDifference >= threshold) {
      // Show original page content with a strong red highlight overlay
      // Blend: original dimmed + red overlay
      pixels[i] = Math.min(255, Math.round(originalPixels[i] * 0.35 + 220));
      pixels[i + 1] = Math.min(255, Math.round(originalPixels[i + 1] * 0.35 + 30));
      pixels[i + 2] = Math.min(255, Math.round(originalPixels[i + 2] * 0.35 + 30));
      pixels[i + 3] = 255;
      changedPixels += 1;
    } else {
      // Unchanged pixels: render original at slightly reduced saturation
      pixels[i] = originalPixels[i];
      pixels[i + 1] = originalPixels[i + 1];
      pixels[i + 2] = originalPixels[i + 2];
      pixels[i + 3] = originalPixels[i + 3];
    }
  }

  return {
    pixels,
    changedPixels,
    totalPixels,
    changedPercent: totalPixels ? (changedPixels / totalPixels) * 100 : 0,
  };
}

/**
 * Classifies the severity of a page difference.
 * @param {number} changedPercent  0–100
 * @returns {'none'|'minor'|'moderate'|'major'}
 */
export function classifyDifference(changedPercent) {
  if (changedPercent === 0) return "none";
  if (changedPercent < 1) return "minor";
  if (changedPercent < 10) return "moderate";
  return "major";
}

/**
 * Returns a CSS color string for a diff severity badge.
 * @param {'none'|'minor'|'moderate'|'major'} severity
 * @returns {string}
 */
export function severityColor(severity) {
  switch (severity) {
    case "none":     return "#22c55e"; // green
    case "minor":    return "#eab308"; // yellow
    case "moderate": return "#f97316"; // orange
    case "major":    return "#ef4444"; // red
    default:         return "#94a3b8";
  }
}