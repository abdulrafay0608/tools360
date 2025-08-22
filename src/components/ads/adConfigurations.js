// components/ads/adConfigurations.js

// Ad size configurations with responsive variants
export const adConfigurations = {
  // Header/Banner Ads
  leaderboard: {
    width: 728,
    height: 90,
    mobile: { width: 320, height: 50 },
    tablet: { width: 468, height: 60 },
    description: "Large banner for headers",
  },

  banner: {
    width: 320,
    height: 50,
    desktop: { width: 728, height: 90 },
    description: "Standard banner",
  },

  "mobile-banner": {
    width: 320,
    height: 100,
    small: { width: 300, height: 75 },
    description: "Mobile optimized banner",
  },

  // Content Ads
  rectangle: {
    width: 300,
    height: 250,
    mobile: { width: 300, height: 250 },
    description: "Medium rectangle for content",
  },

  "large-rectangle": {
    width: 336,
    height: 280,
    description: "Large rectangle for content",
  },

  // Sidebar Ads
  skyscraper: {
    width: 160,
    height: 600,
    wide: { width: 300, height: 600 },
    description: "Vertical sidebar ad",
  },

  "wide-skyscraper": {
    width: 300,
    height: 600,
    description: "Wide vertical sidebar ad",
  },

  sidebar: {
    width: 300,
    height: 250,
    tall: { width: 300, height: 600 },
    compact: { width: 250, height: 250 },
    description: "Flexible sidebar ad",
  },

  // Square Ads
  square: {
    width: 250,
    height: 250,
    small: { width: 200, height: 200 },
    large: { width: 300, height: 300 },
    description: "Square ad format",
  },

  "small-square": {
    width: 200,
    height: 200,
    description: "Small square ad",
  },

  // Button/Small Ads
  button: {
    width: 125,
    height: 125,
    description: "Small button ad",
  },

  // Responsive/Auto
  auto: {
    width: "100%",
    height: "auto",
    description: "Fully responsive ad",
  },

  // Custom sizes for specific use cases
  "header-mobile": {
    width: 320,
    height: 50,
    description: "Mobile header specific",
  },

  "content-mobile": {
    width: 300,
    height: 250,
    description: "Mobile content specific",
  },

  "footer-responsive": {
    width: "100%",
    height: 90,
    mobile: { width: 320, height: 50 },
    description: "Responsive footer ad",
  },
};

// Enhanced Layout style configurations with consistent border styling
export const layoutConfigurations = {
  default: {
    className: "bg-white border border-gray-200 rounded",
    description: "Standard white background with consistent border styling",
  },

  minimal: {
    className: "bg-transparent border-0",
    description: "No background or border",
  },

  clean: {
    className: "bg-gray-50 border border-gray-200 rounded",
    description: "Light gray background with consistent border",
  },

  card: {
    className: "bg-white border border-gray-200 rounded p-4",
    description: "Card style with padding and consistent border",
  },

  outlined: {
    className: "border border-gray-200 rounded bg-white",
    description: "Outlined style with consistent border",
  },

  flush: {
    className: "bg-white rounded",
    description: "Clean white without border",
  },

  subtle: {
    className: "bg-gray-25 border border-gray-200 rounded",
    description: "Very subtle styling with consistent border",
  },

  elevated: {
    className: "bg-white border border-gray-200 rounded shadow-sm",
    description: "Slightly elevated appearance with consistent border",
  },

  // Modern layouts with consistent border styling
  modern: {
    className: "bg-white border border-gray-200 rounded p-3",
    description: "Modern style with consistent border",
  },

  glass: {
    className: "bg-white/80 backdrop-blur-sm border border-gray-200 rounded",
    description: "Glass morphism effect with consistent border",
  },

  gradient: {
    className: "bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded",
    description: "Subtle gradient background with consistent border",
  },

  premium: {
    className: "bg-white border border-gray-200 rounded shadow-md p-4",
    description: "Premium ad styling with consistent border",
  },
};

// Breakpoint configurations
export const breakpoints = {
  mobile: 640,
  tablet: 1024,
  desktop: 1280,
  wide: 1536,
};

// Ad placement recommendations with updated styling
export const placementGuidelines = {
  header: {
    recommended: ["leaderboard", "banner", "header-mobile"],
    layout: "clean",
    priority: "high",
    description: "Above the fold placement",
  },

  content: {
    recommended: ["rectangle", "large-rectangle", "content-mobile"],
    layout: "card",
    priority: "medium",
    description: "Within or after content",
  },

  sidebar: {
    recommended: ["sidebar", "skyscraper", "wide-skyscraper", "square"],
    layout: "modern",
    priority: "medium",
    description: "Side navigation or complementary content",
  },

  footer: {
    recommended: ["banner", "footer-responsive"],
    layout: "outlined",
    priority: "low",
    description: "Bottom of page placement",
  },

  mobile: {
    recommended: ["mobile-banner", "rectangle", "banner"],
    layout: "clean",
    priority: "high",
    description: "Mobile-specific placements",
  },

  // New placement categories
  interstice: {
    recommended: ["large-rectangle", "rectangle"],
    layout: "premium",
    priority: "medium",
    description: "Between content sections",
  },

  inline: {
    recommended: ["square", "small-square", "button"],
    layout: "subtle",
    priority: "low",
    description: "Inline with text content",
  },
};

// Performance optimization settings
export const performanceSettings = {
  lazyLoading: {
    defaultThreshold: 200,
    mobileThreshold: 100,
    desktopThreshold: 300,
  },

  priorities: {
    high: ["header", "above-fold"],
    medium: ["content", "sidebar"],
    low: ["footer", "below-fold"],
  },

  limits: {
    maxAdsPerPage: 6,
    maxAdsPerScreen: 3,
    minSpacingBetweenAds: 200,
  },
};

// Color themes for different ad contexts
export const colorThemes = {
  light: {
    background: "bg-white",
    border: "border-gray-200",
    text: "text-gray-800",
  },
  dark: {
    background: "bg-gray-800",
    border: "border-gray-700",
    text: "text-gray-100",
  },
  blue: {
    background: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
  },
  gray: {
    background: "bg-gray-100",
    border: "border-gray-300",
    text: "text-gray-700",
  },
};

// Helper function to get ad configuration with proper styling
export const getAdConfig = (size, layout = "default", theme = "light") => {
  const sizeConfig = adConfigurations[size] || adConfigurations.auto;
  const layoutConfig = layoutConfigurations[layout] || layoutConfigurations.default;
  const themeConfig = colorThemes[theme] || colorThemes.light;
  
  return {
    ...sizeConfig,
    className: `${layoutConfig.className} ${themeConfig.background} ${themeConfig.border}`,
    themeClass: themeConfig.text,
  };
};

// Default configurations for common use cases
export const defaultConfigs = {
  headerAd: {
    size: "leaderboard",
    layout: "clean",
    theme: "light",
  },
  contentAd: {
    size: "rectangle",
    layout: "card",
    theme: "light",
  },
  sidebarAd: {
    size: "sidebar",
    layout: "modern",
    theme: "light",
  },
  mobileAd: {
    size: "mobile-banner",
    layout: "clean",
    theme: "light",
  },
};