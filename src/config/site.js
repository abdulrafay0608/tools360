/**
 * Canonical public origin used by metadata, discovery files, and structured data.
 */
export const PRODUCTION_SITE_URL = "https://techtools360.vercel.app";

export function normalizeSiteUrl(value = PRODUCTION_SITE_URL) {
  const configuredValue = String(value || "").trim();
  if (!configuredValue) return PRODUCTION_SITE_URL;

  let url;
  try {
    url = new URL(configuredValue);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must be an absolute http(s) origin, for example https://techtools360.vercel.app."
    );
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must contain only an http(s) origin without credentials, a path, query, or hash."
    );
  }

  return url.origin;
}

export const SITE_URL = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_SITE_URL
);

export function getAbsoluteUrl(pathname = "/") {
  if (pathname === "/" || pathname === "") return SITE_URL;
  if (
    typeof pathname !== "string" ||
    !pathname.startsWith("/") ||
    pathname.startsWith("//") ||
    pathname.includes("\\")
  ) {
    throw new Error("Site paths must start with '/'.");
  }

  return new URL(pathname, `${SITE_URL}/`).toString();
}
