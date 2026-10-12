import { getAbsoluteUrl } from "../config/site.js";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: getAbsoluteUrl("/sitemap.xml"),
  };
}
