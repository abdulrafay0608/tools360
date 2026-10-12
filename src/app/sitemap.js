import { SITE_URL, SITE_LAST_UPDATED } from "../config/site.js";
import {
  getCategoriesWithLiveTools,
  getLiveTools,
} from "../data/toolsDataUtils.js";

export default function sitemap() {
  const availableTools = getLiveTools().map((tool) => ({
    url: `${SITE_URL}/tools/${tool.slug}`,
    lastModified: tool.updatedAt ? new Date(tool.updatedAt) : SITE_LAST_UPDATED,
  }));
  const categories = getCategoriesWithLiveTools().map((category) => ({
    url: `${SITE_URL}/tools/category/${category.id}`,
    lastModified: SITE_LAST_UPDATED,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: SITE_LAST_UPDATED,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: SITE_LAST_UPDATED,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: SITE_LAST_UPDATED,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: SITE_LAST_UPDATED,
    },
    ...categories,
    ...availableTools,
  ];
}
