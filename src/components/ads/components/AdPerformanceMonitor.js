// Performance Monitoring Component
// components/AdPerformanceMonitor.js

import React from 'react';
import { useAdContext } from '../components/ads/context/AdContext';

const AdPerformanceMonitor = () => {
  const { getStats, performance } = useAdContext();
  const stats = getStats();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs max-w-xs">
      <div className="font-bold mb-2">Ad Performance</div>
      <div className="space-y-1">
        <div>Total: {stats.totalAds}</div>
        <div>Loaded: {stats.loadedAds}</div>
        <div>Failed: {stats.failedAds}</div>
        <div>Success: {stats.successRate.toFixed(1)}%</div>
        <div>Avg Load: {stats.averageLoadTime.toFixed(0)}ms</div>
        <div>Errors: {performance.errors.length}</div>
        {stats.isAdBlockEnabled && <div className="text-red-300">AdBlock: ON</div>}
      </div>
    </div>
  );
};
