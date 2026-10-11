"use client";

import { useEffect, useRef } from "react";
import { createObjectUrlTracker } from "./trackedObjectUrlUtils.js";

export default function useTrackedObjectUrls() {
  const trackerRef = useRef(null);
  if (!trackerRef.current) trackerRef.current = createObjectUrlTracker();
  const tracker = trackerRef.current;

  useEffect(() => () => tracker.revokeAll(), [tracker]);

  return {
    createTrackedUrl: tracker.create,
    revokeTrackedUrl: tracker.revoke,
    revokeAllTrackedUrls: tracker.revokeAll,
  };
}
