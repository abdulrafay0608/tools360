/**
 * src/config/ads.js
 *
 * Central advertising configuration for Tools360.
 *
 * To activate real AdSense:
 * 1. Set `enabled` to true.
 * 2. Replace `publisherId` with your real ca-pub-XXXXXXXXXXXXXXXX.
 * 3. Fill in the `slotId` values with real AdSense slot IDs.
 * 4. Add the AdSense `<Script>` tag in src/app/layout.js (use next/script).
 *
 * Everything else (placement, sizing, CLS) is already handled by <AdSlot />.
 */

/** Master switch — set to true when AdSense is approved and script is loaded. */
export const ADS_ENABLED = false;

/** Google AdSense Publisher ID (placeholder until approval). */
export const PUBLISHER_ID = "ca-pub-XXXXXXXXXXXXXXXX";

/**
 * Show placeholder boxes in development mode.
 * In production with ADS_ENABLED=false, slots render reserved empty space
 * with a subtle "Advertisement" label for CLS prevention.
 */
export const SHOW_DEV_PLACEHOLDERS = process.env.NODE_ENV === "development";

/**
 * Sticky bottom anchor ad on mobile.
 * Default OFF — enable only if it doesn't cover tool buttons.
 */
export const MOBILE_ANCHOR_ENABLED = false;

/**
 * Ad slot definitions.
 * Each key is a placement name used by <AdSlot placement="..." />.
 *
 * Properties:
 *   slotId       — AdSense slot ID (fill in after approval)
 *   format       — 'horizontal' | 'rectangle' | 'vertical' | 'responsive'
 *   minHeight    — { mobile: px, desktop: px } to prevent CLS
 *   description  — human-readable label for dev placeholders
 */
export const AD_SLOTS = {
  // ── Tool page placements ──────────────────────────────────
  "tool-sidebar": {
    slotId: "",
    format: "vertical",
    minHeight: { mobile: 0, desktop: 600 },
    maxWidth: { mobile: 0, desktop: 300 },
    description: "Desktop sidebar (sticky)",
    desktopOnly: true,
  },
  "tool-below": {
    slotId: "",
    format: "horizontal",
    minHeight: { mobile: 90, desktop: 90 },
    description: "Below tool area",
  },
  "content-mid": {
    slotId: "",
    format: "responsive",
    minHeight: { mobile: 100, desktop: 250 },
    description: "Inside content section",
  },
  "mobile-anchor": {
    slotId: "",
    format: "horizontal",
    minHeight: { mobile: 50, desktop: 0 },
    description: "Mobile bottom anchor",
    mobileOnly: true,
    requiresFlag: "MOBILE_ANCHOR_ENABLED",
  },
};

/**
 * Per-page-type ad rules.
 * Lists which placement names are allowed on each page type.
 * Max visible: 3 desktop, 2 mobile (enforced by component visibility classes).
 */
export const PAGE_AD_RULES = {
  tool: {
    placements: ["tool-sidebar", "tool-below", "content-mid"],
    maxVisibleDesktop: 3,
    maxVisibleMobile: 2,
  },
  home: {
    placements: ["content-mid"],
    maxVisibleDesktop: 1,
    maxVisibleMobile: 1,
  },
  // No ads on these pages
  about: { placements: [], maxVisibleDesktop: 0, maxVisibleMobile: 0 },
  privacy: { placements: [], maxVisibleDesktop: 0, maxVisibleMobile: 0 },
  contact: { placements: [], maxVisibleDesktop: 0, maxVisibleMobile: 0 },
  error: { placements: [], maxVisibleDesktop: 0, maxVisibleMobile: 0 },
};

/**
 * Spacing rules for AdSense policy & usability compliance.
 * Minimum gap (px) between ad slots and interactive elements.
 */
export const AD_SPACING = {
  mobile: 24,
  desktop: 32,
};
