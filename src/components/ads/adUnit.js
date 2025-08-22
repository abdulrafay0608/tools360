// components/ads/AdUnit.js
"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useAdSense } from "./hooks/useAdSense";
import { useResponsiveSize } from "./hooks/useResponsiveSize";
import { useIntersectionObserver } from "./hooks/useIntersectionObserver";
import { adConfigurations, layoutConfigurations } from "./adConfigurations";

const AdUnit = ({
  slot,
  size = "auto",
  className = "",
  format = "auto",
  responsive = true,
  style = {},
  layout = "default",
  adClient = process.env.NEXT_PUBLIC_ADSENSE_ID || "ca-pub-xxxxxxxxx",
  label = true,
  priority = false,
  testMode = false,
  onLoad = () => {},
  onError = () => {},
  ariaLabel,
}) => {
  const adRef = useRef(null);
  const [adState, setAdState] = useState({
    loaded: false,
    error: false,
    initialized: false,
  });

  // Get configuration
  const adConfig = adConfigurations[size] || adConfigurations.auto;
  const layoutConfig =
    layoutConfigurations[layout] || layoutConfigurations.default;

  // Custom hooks
  const responsiveSize = useResponsiveSize(adConfig, responsive);
  const { initializeAd, isReady } = useAdSense({
    enabled: process.env.NODE_ENV === "production" && !testMode,
    onLoad: () => {
      setAdState((prev) => ({ ...prev, loaded: true }));
      onLoad();
    },
    onError: (error) => {
      setAdState((prev) => ({ ...prev, error: true }));
      onError(error);
    },
  });

  // Memoized styles
  const containerStyles = useMemo(
    () => ({
      width:
        responsiveSize.width === "100%" ? "100%" : `${responsiveSize.width}px`,
      height:
        responsiveSize.height === "auto"
          ? "auto"
          : `${responsiveSize.height}px`,
      minHeight: responsiveSize.height === "auto" ? "90px" : "auto",
      maxWidth: "100%",
      ...style,
    }),
    [responsiveSize, style]
  );

  const insStyles = useMemo(
    () => ({
      display: responsiveSize.width === "100%" ? "block" : "inline-block",
      width:
        responsiveSize.width === "100%" ? "100%" : `${responsiveSize.width}px`,
      height:
        responsiveSize.height === "auto"
          ? "auto"
          : `${responsiveSize.height}px`,
      minHeight: responsiveSize.height === "auto" ? "90px" : "auto",
      maxWidth: "100%",
    }),
    [responsiveSize]
  );

  // Initialize ad when ready
  useEffect(() => {
    if (isReady && adRef.current && !adState.initialized) {
      setAdState((prev) => ({ ...prev, initialized: true }));
      initializeAd(adRef.current);
    }
  }, [isReady, initializeAd, adState.initialized]);

  // Development/Test mode placeholder
  if (process.env.NODE_ENV !== "production" || testMode) {
    return (
      <div
        className={`${layoutConfig.className} bg-gradient-to-br from-gray-50 to-white flex flex-col items-center justify-center ${className}`}
        style={containerStyles}
        role="img"
        aria-label={ariaLabel || `Advertisement placeholder - ${size}`}
      >
        {label && (
          <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-medium">
            Advertisement
          </div>
        )}
        <div className="text-center text-gray-500 px-4">
          <div className="text-sm font-medium text-gray-700 mb-1">
            {testMode ? "Test Mode" : "Dev Mode"}
          </div>
          <div className="text-xs text-gray-500">
            {size} • {responsiveSize.width}×{responsiveSize.height}
          </div>
          {slot && (
            <div className="text-xs text-gray-400 mt-1">Slot: {slot}</div>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (adState.error) {
    return (
      <div
        className={`rounded bg-red-50 p-4 text-center ${className}`}
        role="alert"
        aria-label="Advertisement failed to load"
      >
        <div className="text-red-600 text-sm font-medium">
          Unable to load advertisement
        </div>
      </div>
    );
  }

  return (
    <div
      className={`ad-container ${layoutConfig.className} rounded bg-white ${className}`}
      style={containerStyles}
      data-ad-size={size}
      data-priority={priority}
    >
      {label && !adState.loaded && (
        <div className="text-center py-2" aria-hidden="true">
          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            Advertisement
          </div>
        </div>
      )}

      <ins
        ref={adRef}
        className="adsbygoogle"
        style={insStyles}
        data-ad-client={adClient}
        data-ad-slot={slot}
        data-ad-format={responsive ? format : undefined}
        data-full-width-responsive={responsive ? "true" : "false"}
        data-ad-priority={priority ? "high" : "normal"}
        aria-label={ariaLabel || `Advertisement - ${size}`}
      />

      {/* Loading indicator */}
      {!adState.loaded && !adState.error && (
        <div
          className="flex items-center justify-center py-6"
          aria-hidden="true"
        >
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-300"></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Lazy Loading Component with better performance
export const LazyAdUnit = ({
  threshold = 200,
  placeholder = true,
  rootMargin,
  priority = false,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(priority); // High priority ads load immediately
  const containerRef = useRef(null);

  const { disconnect } = useIntersectionObserver(containerRef, {
    threshold: 0,
    rootMargin: rootMargin || `${threshold}px`,
    onIntersect: () => {
      setIsVisible(true);
    },
  });

  useEffect(() => {
    if (isVisible) {
      disconnect();
    }
  }, [isVisible, disconnect]);

  const getPlaceholderHeight = () => {
    const heights = {
      leaderboard: "90px",
      rectangle: "250px",
      "large-rectangle": "280px",
      banner: "50px",
      "mobile-banner": "100px",
      skyscraper: "600px",
      "wide-skyscraper": "600px",
      square: "250px",
      sidebar: "250px",
      button: "125px",
    };
    return heights[props.size] || "120px";
  };

  if (!isVisible && placeholder) {
    return (
      <div ref={containerRef} className="w-full">
        <div
          className="rounded bg-gradient-to-br from-gray-50 to-white flex items-center justify-center animate-pulse"
          style={{
            height: getPlaceholderHeight(),
            width: "100%",
          }}
          aria-label="Advertisement loading"
        >
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-medium">
              Advertisement
            </div>
            <div className="text-xs text-gray-400">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isVisible && !placeholder) {
    return (
      <div
        ref={containerRef}
        style={{ height: getPlaceholderHeight() }}
        aria-label="Advertisement placeholder"
      />
    );
  }

  return <AdUnit priority={priority} {...props} />;
};

// Specialized Ad Components with better configuration
export const HeaderAd = ({ priority = true, ...props }) => (
  <LazyAdUnit
    size="leaderboard"
    layout="clean"
    responsive={true}
    priority={priority}
    className="mx-auto max-w-full"
    ariaLabel="Header advertisement"
    {...props}
  />
);

export const ContentAd = (props) => (
  <LazyAdUnit
    size="rectangle"
    layout="card"
    responsive={true}
    className="mx-auto my-6"
    ariaLabel="Content advertisement"
    {...props}
  />
);

export const MobileAd = (props) => (
  <LazyAdUnit
    size="mobile-banner"
    layout="clean"
    responsive={true}
    className="w-full sm:hidden"
    ariaLabel="Mobile advertisement"
    {...props}
  />
);

export const SidebarAd = (props) => (
  <LazyAdUnit
    size="sidebar"
    layout="outlined"
    responsive={true}
    className="w-full"
    ariaLabel="Sidebar advertisement"
    {...props}
  />
);

export const FooterAd = (props) => (
  <LazyAdUnit
    size="banner"
    layout="minimal"
    responsive={true}
    className="w-full"
    ariaLabel="Footer advertisement"
    {...props}
  />
);

// Advanced Responsive Ad Component
export const ResponsiveAd = ({
  mobile,
  tablet,
  desktop,
  className = "",
  fallback,
  ...props
}) => {
  return (
    <div className={className}>
      {/* Mobile */}
      {mobile && (
        <div className="block sm:hidden">
          <AdUnit {...props} {...mobile} />
        </div>
      )}

      {/* Tablet */}
      {tablet && (
        <div className="hidden sm:block lg:hidden">
          <AdUnit {...props} {...tablet} />
        </div>
      )}

      {/* Desktop */}
      {desktop && (
        <div className="hidden lg:block">
          <AdUnit {...props} {...desktop} />
        </div>
      )}

      {/* Fallback for any missing configuration */}
      {fallback && !mobile && !tablet && !desktop && (
        <AdUnit {...props} {...fallback} />
      )}
    </div>
  );
};

// Ad Container for multiple ads with spacing
export const AdContainer = ({
  children,
  spacing = "space-y-6",
  className = "",
}) => (
  <div
    className={`${spacing} ${className}`}
    role="complementary"
    aria-label="Advertisements"
  >
    {children}
  </div>
);

// Ad Group for related ads
export const AdGroup = ({
  ads = [],
  layout = "vertical",
  gap = "gap-4",
  className = "",
}) => {
  const layoutClasses = {
    vertical: "flex flex-col",
    horizontal: "flex flex-row flex-wrap",
    grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  };

  return (
    <div
      className={`${layoutClasses[layout]} ${gap} ${className}`}
      role="complementary"
      aria-label="Advertisement group"
    >
      {ads.map((adProps, index) => (
        <AdUnit key={`ad-${index}`} {...adProps} />
      ))}
    </div>
  );
};

export default AdUnit;
