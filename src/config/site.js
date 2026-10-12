/**
 * site.js
 * Central site configuration for Tech Tools 360.
 */

export const PRODUCTION_SITE_URL = "https://techtools360.vercel.app";

/**
 * Normalize the configured public site URL to an origin.
 * Canonicals, Open Graph URLs, robots.txt, sitemap.xml, and JSON-LD must all
 * use the same value, so deployment configuration errors fail the build.
 */
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

export const SITE_NAME = "Tech Tools 360";

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "freetechtools360@gmail.com";

/**
 * Bump this date whenever tools or site content are added/updated.
 * Used as the default `lastModified` value in sitemap.js.
 */
export const SITE_LAST_UPDATED = new Date("2026-10-13T00:00:00.000Z");

export const siteConfig = {
  url: SITE_URL,
  name: SITE_NAME,
  contactEmail: CONTACT_EMAIL,
};

export default siteConfig;
