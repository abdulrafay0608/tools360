/**
 * imageResizerData.js
 * Presets, fitting modes, and quality configuration for the Image Resizer tool.
 */

export const DEFAULT_QUALITY = 80;

export const RESIZE_MODES = [
  { value: "pixels", label: "By Pixels" },
  { value: "percentage", label: "By Percentage" },
];

export const FIT_MODES = [
  { value: "stretch", label: "Stretch (ignore aspect ratio)" },
  { value: "contain", label: "Contain (add background)" },
  { value: "cover", label: "Cover (center crop)" },
];

export const RESIZE_PRESETS = [
  { label: "Custom", width: null, height: null },
  { label: "Instagram Post (1080x1080)", width: 1080, height: 1080 },
  { label: "Instagram Story (1080x1920)", width: 1080, height: 1920 },
  { label: "Facebook Cover (820x312)", width: 820, height: 312 },
  { label: "YouTube Thumbnail (1280x720)", width: 1280, height: 720 },
  { label: "X Header (1500x500)", width: 1500, height: 500 },
  { label: "Passport (600x600)", width: 600, height: 600 },
];
