// components/ads/hooks/useResponsiveSize.js
import { useState, useEffect } from "react";
import { breakpoints } from "../adConfigurations";

// Utility functions
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const useResponsiveSize = (adConfig, responsive = true) => {
  const [currentSize, setCurrentSize] = useState(adConfig);

  useEffect(() => {
    if (!responsive || typeof window === "undefined") return;

    const calculateSize = () => {
      const width = window.innerWidth;

      if (width < breakpoints.mobile && adConfig.mobile) {
        setCurrentSize(adConfig.mobile);
      } else if (width < breakpoints.tablet && adConfig.tablet) {
        setCurrentSize(adConfig.tablet);
      } else if (width >= breakpoints.desktop && adConfig.desktop) {
        setCurrentSize(adConfig.desktop);
      } else if (width >= breakpoints.wide && adConfig.wide) {
        setCurrentSize(adConfig.wide);
      } else {
        setCurrentSize(adConfig);
      }
    };

    calculateSize();

    const debouncedResize = debounce(calculateSize, 250);
    window.addEventListener("resize", debouncedResize);

    return () => window.removeEventListener("resize", debouncedResize);
  }, [adConfig, responsive]);

  return currentSize;
};
