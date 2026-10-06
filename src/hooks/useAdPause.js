"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

const AdPauseContext = createContext(null);

export function AdPauseProvider({ children }) {
  const [reasons, setReasons] = useState(() => new Set());

  const setReason = useCallback((reason, active) => {
    if (!reason) return;
    setReasons((prev) => {
      const has = prev.has(reason);
      if (Boolean(active) === has) return prev;
      const next = new Set(prev);
      if (active) next.add(reason);
      else next.delete(reason);
      return next;
    });
  }, []);

  const paused = reasons.size > 0;

  const value = useMemo(
    () => ({ paused, setReason }),
    [paused, setReason]
  );

  useEffect(() => {
    const pauseForDrag = () => setReason("native-drag", true);
    const resumeAfterDrag = () => setReason("native-drag", false);

    document.addEventListener("dragstart", pauseForDrag, true);
    document.addEventListener("dragend", resumeAfterDrag, true);
    document.addEventListener("drop", resumeAfterDrag, true);

    return () => {
      document.removeEventListener("dragstart", pauseForDrag, true);
      document.removeEventListener("dragend", resumeAfterDrag, true);
      document.removeEventListener("drop", resumeAfterDrag, true);
    };
  }, [setReason]);

  return (
    <AdPauseContext.Provider value={value}>{children}</AdPauseContext.Provider>
  );
}

export function useAdPause() {
  const ctx = useContext(AdPauseContext);
  return ctx || { paused: false, setReason: () => {} };
}

/**
 * Pause ads while `active` is true. Layout space is still reserved by AdSlot.
 * Safe to call outside AdPauseProvider (no-op).
 */
export function useAdPauseWhile(reason, active) {
  const { setReason } = useAdPause();

  useLayoutEffect(() => {
    setReason(reason, Boolean(active));
    return () => setReason(reason, false);
  }, [reason, active, setReason]);
}
