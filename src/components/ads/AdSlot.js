"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ADS_ENABLED,
  SHOW_DEV_PLACEHOLDERS,
  AD_SLOTS,
} from "@/config/ads";
import { useAdPause } from "@/hooks/useAdPause";

/**
 * AdSlot — Professional ad placement component.
 *
 * Features:
 * - Reads config from src/config/ads.js by placement name.
 * - Reserves fixed min-height per breakpoint (CLS prevention).
 * - IntersectionObserver lazy loading (renders ad content only when near viewport).
 * - Client-only rendering (no SSR mismatch).
 * - Subtle "Advertisement" label for policy compliance.
 * - Hides visually during processing/drag without collapsing reserved space.
 *
 * Props:
 *   placement        — Key from AD_SLOTS config (e.g. "tool-sidebar", "tool-below")
 *   className        — Additional CSS classes
 *   hideWhenProcessing — Legacy alias; prefer useAdPause from tools
 *
 * Legacy props (backward compatible):
 *   slotId, format   — Used if `placement` is not provided
 */
export default function AdSlot({
  placement,
  className = "",
  hideWhenProcessing = false,
  slotId,
  format,
}) {
  const [isClient, setIsClient] = useState(false);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const containerRef = useRef(null);
  const { paused } = useAdPause();
  const visuallyHidden = paused || hideWhenProcessing;

  const config = placement ? AD_SLOTS[placement] : null;

  const resolvedFormat = config?.format || format || "horizontal";
  const resolvedSlotId = config?.slotId || slotId || placement || "default-slot";
  const resolvedDescription = config?.description || placement || "Ad";
  const isDesktopOnly = config?.desktopOnly || false;
  const isMobileOnly = config?.mobileOnly || false;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !containerRef.current) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isClient]);

  const mobileMinH =
    config?.minHeight?.mobile ??
    (resolvedFormat === "horizontal" ? 90 : resolvedFormat === "rectangle" ? 250 : 100);
  const desktopMinH = config?.minHeight?.desktop ?? mobileMinH;

  const visibilityClass = isDesktopOnly
    ? "hidden lg:block"
    : isMobileOnly
    ? "block lg:hidden"
    : "";

  return (
    <div
      ref={containerRef}
      id={`ad-slot-${resolvedSlotId || placement}`}
      data-ad-slot="true"
      data-ad-placement={placement || resolvedSlotId}
      data-ad-paused={visuallyHidden ? "true" : "false"}
      aria-hidden="true"
      role="complementary"
      aria-label="Advertisement"
      className={`w-full overflow-hidden ${visibilityClass} ${className} ${
        visuallyHidden ? "invisible pointer-events-none" : ""
      }`}
      style={{
        minHeight: `${mobileMinH}px`,
        maxWidth: config?.maxWidth?.desktop
          ? `${config.maxWidth.desktop}px`
          : undefined,
        "--ad-min-desktop": `${desktopMinH}px`,
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (min-width: 1024px) {
              #ad-slot-${resolvedSlotId || placement} {
                min-height: ${desktopMinH}px !important;
              }
            }
          `,
        }}
      />

      {isClient && isNearViewport ? (
        ADS_ENABLED && resolvedSlotId ? (
          <ins
            className="adsbygoogle"
            style={{ display: "block", width: "100%", minHeight: "inherit" }}
            data-ad-slot={resolvedSlotId}
            data-ad-format={resolvedFormat === "vertical" ? "vertical" : "auto"}
            data-full-width-responsive="true"
          />
        ) : (
          <div
            className={`flex h-full items-center justify-center rounded border border-dashed text-xs ${
              SHOW_DEV_PLACEHOLDERS
                ? "border-[#94b8a8] bg-[#eef5f1] text-[#527268]"
                : "border-[#e2e8f0] bg-[#fafafa] text-[#cbd5e1]"
            }`}
            style={{ minHeight: "inherit" }}
          >
            <div className="flex flex-col items-center gap-1 select-none">
              <span className="tracking-wide uppercase text-[10px] font-medium">
                Advertisement
              </span>
              {SHOW_DEV_PLACEHOLDERS && (
                <span className="text-[9px] opacity-60">
                  {resolvedDescription} • {resolvedFormat}
                </span>
              )}
            </div>
          </div>
        )
      ) : (
        <div
          className="flex h-full items-center justify-center rounded border border-dashed border-[#e2e8f0] bg-[#fafafa]"
          style={{ minHeight: "inherit" }}
        >
          <span className="select-none tracking-wide uppercase text-[10px] font-medium text-[#cbd5e1]">
            Advertisement
          </span>
        </div>
      )}
    </div>
  );
}
