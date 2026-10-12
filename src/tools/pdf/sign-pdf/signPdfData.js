/**
 * signPdfData.js
 * Static typography and ink color options for the Sign PDF tool.
 */

export const FONT_STYLES = [
  {
    id: "style1",
    label: "Elegant Script",
    fontFamily: '"Brush Script MT", "Dancing Script", "Segoe Script", cursive',
  },
  {
    id: "style2",
    label: "Classic Cursive",
    fontFamily: '"Lucida Handwriting", "Great Vibes", "Apple Chancery", cursive',
  },
  {
    id: "style3",
    label: "Casual Hand",
    fontFamily: '"Comic Sans MS", "Caveat", "Chalkboard", cursive',
  },
];

export const COLOR_OPTIONS = [
  { id: "black", label: "Black", value: "#000000" },
  { id: "navy", label: "Navy Blue", value: "#0f2b5c" },
  { id: "blue", label: "Blue", value: "#1d4ed8" },
  { id: "red", label: "Red", value: "#b91c1c" },
];
