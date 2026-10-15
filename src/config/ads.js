/**
 * Future advertising inventory. Activation requires publisher approval,
 * real slot IDs, consent handling where applicable, and a separate review.
 * No slot or script is rendered while ADS_ENABLED is false.
 */
export const ADS_ENABLED = false;
export const SHOW_DEV_PLACEHOLDERS = false;
export const PUBLISHER_ID = "ca-pub-XXXXXXXXXXXXXXXX";

/**
 * Fluid horizontal placements keep ads out of upload, preview, processing,
 * signature, and download controls. Min-heights apply only after activation.
 * Mobile inventory can fit approximately 320x100; desktop can expand to
 * responsive leaderboard widths instead of requiring a fixed 728px canvas.
 */
export const AD_SLOTS = {
  "home-after-tools": {
    slotId: "",
    format: "responsive",
    minHeight: { mobile: 100, desktop: 90 },
    description: "After the complete tool catalog",
  },
  "tool-after-content": {
    slotId: "",
    format: "responsive",
    minHeight: { mobile: 100, desktop: 90 },
    description: "After the workspace, guidance, and related tools",
  },
};

export const PAGE_AD_RULES = {
  home: { placements: ["home-after-tools"], maxVisibleDesktop: 1, maxVisibleMobile: 1 },
  tool: { placements: ["tool-after-content"], maxVisibleDesktop: 1, maxVisibleMobile: 1 },
  about: { placements: [], maxVisibleDesktop: 0, maxVisibleMobile: 0 },
  privacy: { placements: [], maxVisibleDesktop: 0, maxVisibleMobile: 0 },
  contact: { placements: [], maxVisibleDesktop: 0, maxVisibleMobile: 0 },
  error: { placements: [], maxVisibleDesktop: 0, maxVisibleMobile: 0 },
};

export const AD_SPACING = { mobile: 24, desktop: 32 };
