import { getAbsoluteUrl, SITE_LAST_UPDATED } from "../config/site.js";
import {
  getCategoriesWithLiveTools,
  getLiveTools,
} from "../data/toolsDataUtils.js";

export default function sitemap() {
  const availableTools = getLiveTools().map((tool) => ({
    url: getAbsoluteUrl(`/tools/${tool.slug}`),
    lastModified: tool.updatedAt ? new Date(tool.updatedAt) : SITE_LAST_UPDATED,
  }));
  const categories = getCategoriesWithLiveTools().map((category) => ({
    url: getAbsoluteUrl(`/tools/category/${category.id}`),
    lastModified: SITE_LAST_UPDATED,
  }));

  return [
    {
      url: getAbsoluteUrl("/"),
      lastModified: SITE_LAST_UPDATED,
    },
    {
      url: getAbsoluteUrl("/about"),
      lastModified: SITE_LAST_UPDATED,
    },
    {
      url: getAbsoluteUrl("/privacy"),
      lastModified: SITE_LAST_UPDATED,
    },
    {
      url: getAbsoluteUrl("/contact"),
      lastModified: SITE_LAST_UPDATED,
    },
    ...categories,
    ...availableTools,
  ];
}
