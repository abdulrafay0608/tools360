/**
 * site.js
 * Central site configuration for Tech Tools 360.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://techtools360.vercel.app";

export const SITE_NAME = "Tech Tools 360";

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "freetechtools360@gmail.com";

/**
 * Bump this date whenever tools or site content are added/updated.
 * Used as the default `lastModified` value in sitemap.js.
 */
export const SITE_LAST_UPDATED = new Date("2026-10-12T00:00:00.000Z");

export const siteConfig = {
  url: SITE_URL,
  name: SITE_NAME,
  contactEmail: CONTACT_EMAIL,
};

export default siteConfig;
