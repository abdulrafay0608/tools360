"use client";

import { useCallback, useEffect, useRef } from "react";
import { createObjectUrlTracker } from "./trackedObjectUrlUtils.js";

export default function useTrackedObjectUrls() {
  const trackerRef = useRef(null);
  if (!trackerRef.current) trackerRef.current = createObjectUrlTracker();
  const tracker = trackerRef.current;

  useEffect(() => () => tracker.revokeAll(), [tracker]);

  return {
    createTrackedUrl: useCallback((blob) => tracker.create(blob), [tracker]),
    revokeTrackedUrl: useCallback((url) => tracker.revoke(url), [tracker]),
    revokeAllTrackedUrls: useCallback(() => tracker.revokeAll(), [tracker]),
  };
}
