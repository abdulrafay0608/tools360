// components/ads/hooks/useAdBlockDetection.js
import { useState, useEffect } from "react";

export const useAdBlockDetection = () => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const detectAdBlock = async () => {
      try {
        // Create a test element that ad blockers typically block
        const testAd = document.createElement("div");
        testAd.innerHTML = "&nbsp;";
        testAd.className = "adsbox";
        testAd.style.position = "absolute";
        testAd.style.left = "-10000px";

        document.body.appendChild(testAd);

        // Wait for ad blockers to process
        await new Promise((resolve) => setTimeout(resolve, 100));

        const isHidden = testAd.offsetHeight === 0;
        setIsBlocked(isHidden);

        document.body.removeChild(testAd);
      } catch (error) {
        console.warn("Ad block detection failed:", error);
        setIsBlocked(false);
      } finally {
        setIsChecking(false);
      }
    };

    detectAdBlock();
  }, []);

  return { isBlocked, isChecking };
};
