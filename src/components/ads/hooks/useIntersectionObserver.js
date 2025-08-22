// components/ads/hooks/useIntersectionObserver.js
import { useEffect, useCallback, useRef } from "react";

export const useIntersectionObserver = (elementRef, options = {}) => {
  const observerRef = useRef(null);
  const { onIntersect, threshold = 0, rootMargin = "0px" } = options;

  const disconnect = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
  }, []);

  useEffect(() => {
    const element = elementRef?.current;
    if (!element || !onIntersect) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onIntersect(entry);
        }
      },
      { threshold, rootMargin }
    );

    observerRef.current.observe(element);

    return () => disconnect();
  }, [elementRef, onIntersect, threshold, rootMargin, disconnect]);

  return { disconnect };
};