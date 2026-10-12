/**
 * addPageNumbersData.js
 * Static configuration options and label mappings for the Add Page Numbers tool.
 */

export const POSITION_LABELS = {
  "top-left": "Top left",
  "top-center": "Top center",
  "top-right": "Top right",
  "bottom-left": "Bottom left",
  "bottom-center": "Bottom center",
  "bottom-right": "Bottom right",
};

export const FORMAT_LABELS = {
  number: "1",
  "page-number": "Page 1",
  "number-of-total": "1 of N",
  "page-number-of-total": "Page 1 of N",
};

export const EMPTY_OPTIONS = {
  fromPage: "1",
  toPage: "1",
  startNumber: "1",
  position: "bottom-center",
  format: "number",
  font: "Helvetica",
  fontSize: 12,
  color: "#263e36",
  margin: 36,
  skipFirstPage: false,
  mirrorOddEven: false,
};
