import {
  getCategoriesWithLiveTools,
  getLiveTools,
} from "../data/toolsDataUtils.js";
import { getAbsoluteUrl } from "../config/site.js";

export default function sitemap() {
  const availableTools = getLiveTools().map((tool) => ({
    url: getAbsoluteUrl(`/tools/${tool.slug}`),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));
  const categories = getCategoriesWithLiveTools().map((category) => ({
    url: getAbsoluteUrl(`/tools/category/${category.id}`),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    {
      url: getAbsoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: getAbsoluteUrl("/about"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: getAbsoluteUrl("/privacy"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: getAbsoluteUrl("/contact"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    ...categories,
    ...availableTools,
  ];
}
