import {
  adConfigurations,
  placementGuidelines,
  performanceSettings,
} from "../adConfigurations";

// Ad placement validation
export const validateAdPlacement = (placement, size) => {
  const guidelines = placementGuidelines[placement];
  if (!guidelines) return { valid: true, warnings: [] };

  const warnings = [];
  const isRecommended = guidelines.recommended.includes(size);

  if (!isRecommended) {
    warnings.push(`${size} is not recommended for ${placement} placement`);
  }

  return {
    valid: isRecommended,
    warnings,
    priority: guidelines.priority,
  };
};

// Calculate optimal ad spacing
export const calculateAdSpacing = (ads = []) => {
  const minSpacing = performanceSettings.limits.minSpacingBetweenAds;
  const spacing = Math.max(minSpacing, window.innerHeight * 0.3);

  return {
    spacing: `${spacing}px`,
    className: "space-y-8 md:space-y-12 lg:space-y-16",
  };
};

// Ad size optimizer based on viewport
export const optimizeAdSize = (preferredSize, placement = "content") => {
  if (typeof window === "undefined") return preferredSize;

  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  // Mobile optimization
  if (viewport.width < 640) {
    const mobileOptimized = {
      leaderboard: "banner",
      "wide-skyscraper": "rectangle",
      skyscraper: "rectangle",
    };
    return mobileOptimized[preferredSize] || preferredSize;
  }

  // Small desktop optimization
  if (viewport.width < 1024) {
    const tabletOptimized = {
      "wide-skyscraper": "rectangle",
      leaderboard: "rectangle",
    };
    return tabletOptimized[preferredSize] || preferredSize;
  }

  return preferredSize;
};

// Performance monitoring utilities
export const createAdLogger = (
  enabled = process.env.NODE_ENV === "development"
) => {
  if (!enabled) return { log: () => {}, error: () => {}, warn: () => {} };

  return {
    log: (message, data) => console.log(`[AdUnit] ${message}`, data),
    error: (message, error) =>
      console.error(`[AdUnit Error] ${message}`, error),
    warn: (message, data) => console.warn(`[AdUnit Warning] ${message}`, data),
  };
};

// Ad slot generator
export const generateAdSlot = (prefix = "ad", placement = "content") => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}-${placement}-${timestamp}-${random}`;
};

// Check if ad should be lazy loaded
export const shouldLazyLoad = (placement, priority = "medium") => {
  const highPriorityPlacements = performanceSettings.priorities.high;
  const isHighPriority =
    highPriorityPlacements.includes(placement) || priority === "high";

  return !isHighPriority;
};

// Ad configuration validator
export const validateAdConfig = (config) => {
  const required = ["slot"];
  const errors = [];

  required.forEach((field) => {
    if (!config[field]) {
      errors.push(`Required field '${field}' is missing`);
    }
  });

  if (config.size && !adConfigurations[config.size]) {
    errors.push(`Unknown ad size: ${config.size}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// components/ads/context/AdContext.js
import React, { createContext, useContext, useReducer, useEffect } from "react";

const AdContext = createContext();

const initialState = {
  adsLoaded: 0,
  totalAds: 0,
  failedAds: 0,
  settings: {
    maxAdsPerPage: 6,
    lazyLoadThreshold: 200,
    enableLazyLoading: true,
    enableAdBlock: true,
    debugMode: process.env.NODE_ENV === "development",
  },
  performance: {
    loadTimes: [],
    errors: [],
    blockedCount: 0,
  },
  adSlots: new Map(),
  isAdBlockEnabled: false,
};

// Action types
const AD_ACTIONS = {
  ADD_AD: "ADD_AD",
  AD_LOADED: "AD_LOADED",
  AD_FAILED: "AD_FAILED",
  UPDATE_SETTINGS: "UPDATE_SETTINGS",
  TRACK_PERFORMANCE: "TRACK_PERFORMANCE",
  SET_ADBLOCK_STATUS: "SET_ADBLOCK_STATUS",
  RESET_STATS: "RESET_STATS",
};

// Reducer function
const adReducer = (state, action) => {
  switch (action.type) {
    case AD_ACTIONS.ADD_AD:
      return {
        ...state,
        totalAds: state.totalAds + 1,
        adSlots: new Map(state.adSlots.set(action.payload.id, action.payload)),
      };

    case AD_ACTIONS.AD_LOADED:
      return {
        ...state,
        adsLoaded: state.adsLoaded + 1,
        performance: {
          ...state.performance,
          loadTimes: [
            ...state.performance.loadTimes,
            action.payload.loadTime || 0,
          ],
        },
      };

    case AD_ACTIONS.AD_FAILED:
      return {
        ...state,
        failedAds: state.failedAds + 1,
        performance: {
          ...state.performance,
          errors: [
            ...state.performance.errors,
            {
              timestamp: Date.now(),
              error: action.payload.error,
              adId: action.payload.adId,
            },
          ],
        },
      };

    case AD_ACTIONS.UPDATE_SETTINGS:
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case AD_ACTIONS.TRACK_PERFORMANCE:
      return {
        ...state,
        performance: { ...state.performance, ...action.payload },
      };

    case AD_ACTIONS.SET_ADBLOCK_STATUS:
      return {
        ...state,
        isAdBlockEnabled: action.payload,
        performance: {
          ...state.performance,
          blockedCount: action.payload
            ? state.performance.blockedCount + 1
            : state.performance.blockedCount,
        },
      };

    case AD_ACTIONS.RESET_STATS:
      return {
        ...state,
        adsLoaded: 0,
        totalAds: 0,
        failedAds: 0,
        performance: {
          loadTimes: [],
          errors: [],
          blockedCount: 0,
        },
        adSlots: new Map(),
      };

    default:
      return state;
  }
};

// Context Provider
export const AdProvider = ({ children, config = {} }) => {
  const [state, dispatch] = useReducer(adReducer, {
    ...initialState,
    settings: { ...initialState.settings, ...config },
  });

  // Actions
  const addAd = (adConfig) => {
    dispatch({
      type: AD_ACTIONS.ADD_AD,
      payload: { ...adConfig, id: generateAdSlot() },
    });
  };

  const trackAdLoad = (adId, loadTime) => {
    dispatch({
      type: AD_ACTIONS.AD_LOADED,
      payload: { adId, loadTime },
    });
  };

  const trackAdError = (adId, error) => {
    dispatch({
      type: AD_ACTIONS.AD_FAILED,
      payload: { adId, error },
    });
  };

  const updateSettings = (newSettings) => {
    dispatch({
      type: AD_ACTIONS.UPDATE_SETTINGS,
      payload: newSettings,
    });
  };

  const setAdBlockStatus = (isBlocked) => {
    dispatch({
      type: AD_ACTIONS.SET_ADBLOCK_STATUS,
      payload: isBlocked,
    });
  };

  const resetStats = () => {
    dispatch({ type: AD_ACTIONS.RESET_STATS });
  };

  // Computed values
  const getStats = () => ({
    totalAds: state.totalAds,
    loadedAds: state.adsLoaded,
    failedAds: state.failedAds,
    successRate:
      state.totalAds > 0 ? (state.adsLoaded / state.totalAds) * 100 : 0,
    averageLoadTime:
      state.performance.loadTimes.length > 0
        ? state.performance.loadTimes.reduce((a, b) => a + b, 0) /
          state.performance.loadTimes.length
        : 0,
    isAdBlockEnabled: state.isAdBlockEnabled,
  });

  const canLoadMoreAds = () => {
    return state.totalAds < state.settings.maxAdsPerPage;
  };

  const value = {
    ...state,
    dispatch,
    addAd,
    trackAdLoad,
    trackAdError,
    updateSettings,
    setAdBlockStatus,
    resetStats,
    getStats,
    canLoadMoreAds,
  };

  return <AdContext.Provider value={value}>{children}</AdContext.Provider>;
};

// Custom hook to use Ad Context
export const useAdContext = () => {
  const context = useContext(AdContext);
  if (!context) {
    throw new Error("useAdContext must be used within an AdProvider");
  }
  return context;
};

// HOC for components that need ad context
export const withAdContext = (Component) => {
  return function WrappedComponent(props) {
    return (
      <AdProvider>
        <Component {...props} />
      </AdProvider>
    );
  };
};

// Ad Manager utility class
export class AdManager {
  constructor() {
    this.ads = new Map();
    this.observers = new Map();
    this.performanceMonitor = {
      startTime: Date.now(),
      metrics: {
        totalRequests: 0,
        successfulLoads: 0,
        failures: 0,
        averageLoadTime: 0,
      },
    };
  }

  registerAd(id, config) {
    this.ads.set(id, {
      ...config,
      id,
      status: "registered",
      timestamp: Date.now(),
    });
    this.performanceMonitor.metrics.totalRequests++;
  }

  markAdLoaded(id, loadTime = 0) {
    const ad = this.ads.get(id);
    if (ad) {
      ad.status = "loaded";
      ad.loadTime = loadTime;
      this.performanceMonitor.metrics.successfulLoads++;
      this.updateAverageLoadTime(loadTime);
    }
  }

  markAdFailed(id, error) {
    const ad = this.ads.get(id);
    if (ad) {
      ad.status = "failed";
      ad.error = error;
      this.performanceMonitor.metrics.failures++;
    }
  }

  updateAverageLoadTime(newLoadTime) {
    const current = this.performanceMonitor.metrics.averageLoadTime;
    const count = this.performanceMonitor.metrics.successfulLoads;
    this.performanceMonitor.metrics.averageLoadTime =
      (current * (count - 1) + newLoadTime) / count;
  }

  getPerformanceReport() {
    return {
      ...this.performanceMonitor.metrics,
      successRate:
        this.performanceMonitor.metrics.totalRequests > 0
          ? (this.performanceMonitor.metrics.successfulLoads /
              this.performanceMonitor.metrics.totalRequests) *
            100
          : 0,
      uptime: Date.now() - this.performanceMonitor.startTime,
    };
  }

  getAdStatus(id) {
    return this.ads.get(id);
  }

  cleanup() {
    this.ads.clear();
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  }
}

// Global ad manager instance
export const globalAdManager = new AdManager();

// Advanced ad utilities
export const adUtilities = {
  // Check viewport visibility
  isInViewport: (element) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  // Calculate ad density on page
  calculateAdDensity: () => {
    const ads = document.querySelectorAll("[data-ad-size]");
    const contentHeight = document.body.scrollHeight;
    return ads.length / (contentHeight / 1000); // ads per 1000px
  },

  // Get optimal ad positions
  getOptimalAdPositions: (contentElement) => {
    if (!contentElement) return [];

    const positions = [];
    const paragraphs = contentElement.querySelectorAll("p");
    const minDistance = 300; // minimum pixels between ads

    paragraphs.forEach((p, index) => {
      if (index > 0 && index % 3 === 0) {
        // Every 3rd paragraph
        const rect = p.getBoundingClientRect();
        const lastPosition = positions[positions.length - 1];

        if (!lastPosition || rect.top - lastPosition > minDistance) {
          positions.push(rect.top + window.scrollY);
        }
      }
    });

    return positions;
  },

  // Preload critical ads
  preloadAds: (adConfigs) => {
    adConfigs.forEach((config) => {
      if (config.priority === "high") {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "script";
        link.href =
          "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
        document.head.appendChild(link);
      }
    });
  },
};

