// components/ads/hooks/useAdPerformance.js
import { useState, useEffect, useCallback } from "react";

export const useAdPerformance = () => {
  const [metrics, setMetrics] = useState({
    totalAds: 0,
    loadedAds: 0,
    failedAds: 0,
    loadTimes: [],
  });

  const trackAdLoad = useCallback((loadTime) => {
    setMetrics((prev) => ({
      ...prev,
      loadedAds: prev.loadedAds + 1,
      loadTimes: [...prev.loadTimes, loadTime],
    }));
  }, []);

  const trackAdError = useCallback(() => {
    setMetrics((prev) => ({
      ...prev,
      failedAds: prev.failedAds + 1,
    }));
  }, []);

  const trackAdMount = useCallback(() => {
    setMetrics((prev) => ({
      ...prev,
      totalAds: prev.totalAds + 1,
    }));
  }, []);

  const getAverageLoadTime = useCallback(() => {
    if (metrics.loadTimes.length === 0) return 0;
    return (
      metrics.loadTimes.reduce((a, b) => a + b, 0) / metrics.loadTimes.length
    );
  }, [metrics.loadTimes]);

  const getSuccessRate = useCallback(() => {
    if (metrics.totalAds === 0) return 0;
    return (metrics.loadedAds / metrics.totalAds) * 100;
  }, [metrics.totalAds, metrics.loadedAds]);

  return {
    metrics,
    trackAdLoad,
    trackAdError,
    trackAdMount,
    getAverageLoadTime,
    getSuccessRate,
  };
};
