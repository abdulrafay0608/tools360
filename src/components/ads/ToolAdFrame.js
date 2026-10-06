"use client";

import { AdPauseProvider } from "@/hooks/useAdPause";

/**
 * Client boundary so tool pages can pause ads.
 * Layout markup stays in the server ToolLayout; SEO content is passed as children.
 */
export default function ToolAdFrame({ children }) {
  return <AdPauseProvider>{children}</AdPauseProvider>;
}
