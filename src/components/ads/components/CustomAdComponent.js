// Advanced Usage Example with Custom Hooks
// components/CustomAdComponent.js

import React, { useEffect } from 'react';
import { useAdContext } from '../components/ads/context/AdContext';
import { useAdPerformance } from '../components/ads/hooks/useAdPerformance';
import { useAdBlockDetection } from '../components/ads/hooks/useAdBlockDetection';
import AdUnit from '../components/ads/AdUnit';

const CustomAdComponent = ({ placement = 'content' }) => {
  const { getStats, canLoadMoreAds, trackAdLoad, trackAdError } = useAdContext();
  const { metrics, trackAdMount } = useAdPerformance();
  const { isBlocked, isChecking } = useAdBlockDetection();

  useEffect(() => {
    trackAdMount();
  }, [trackAdMount]);

  // Don't show ad if ad blocker is detected
  if (isBlocked) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <p className="text-blue-700 text-sm">
          Please consider disabling your ad blocker to support our content.
        </p>
      </div>
    );
  }

  // Don't show ad if we've reached the limit
  if (!canLoadMoreAds()) {
    return null;
  }

  return (
    <div className="my-6">
      <AdUnit
        slot="custom-slot-123"
        size="rectangle"
        layout="card"
        placement={placement}
        onLoad={() => trackAdLoad(Date.now())}
        onError={(error) => trackAdError(error)}
        ariaLabel={`${placement} advertisement`}
      />
      
      {/* Development stats */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-500">
          <div>Success Rate: {getStats().successRate.toFixed(1)}%</div>
          <div>Avg Load Time: {getStats().averageLoadTime.toFixed(0)}ms</div>
          <div>Total Ads: {getStats().totalAds}</div>
        </div>
      )}
    </div>
  );
};
