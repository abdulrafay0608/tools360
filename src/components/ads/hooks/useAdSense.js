// components/ads/hooks/useAdSense.js
import { useState, useEffect, useCallback } from "react";

export const useAdSense = ({ enabled = true, onLoad, onError }) => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return;

    // Check if already loaded
    if (window.adsbygoogle) {
      setIsReady(true);
      return;
    }

    // Prevent multiple script loads
    if (isLoading) return;

    setIsLoading(true);

    const script = document.createElement("script");
    script.async = true;
    script.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
    script.crossOrigin = "anonymous";

    script.onload = () => {
      setIsReady(true);
      setIsLoading(false);
    };

    script.onerror = (err) => {
      const errorMsg = "Failed to load AdSense script";
      setError(errorMsg);
      setIsLoading(false);
      onError?.(errorMsg);
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [enabled, isLoading, onError]);

  const initializeAd = useCallback(
    (adElement) => {
      if (!isReady || !adElement) return;

      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        onLoad?.();
      } catch (err) {
        const errorMsg = "Failed to initialize ad";
        setError(errorMsg);
        onError?.(err);
      }
    },
    [isReady, onLoad, onError]
  );

  return { isReady, isLoading, error, initializeAd };
};










