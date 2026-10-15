import {
  getCategoriesWithLiveTools,
  getLiveTools,
} from "../data/toolsDataUtils.js";
import { getAbsoluteUrl } from "../config/site.js";

export default function sitemap() {
  const availableTools = getLiveTools().map((tool) => ({
    url: getAbsoluteUrl(`/tools/${tool.slug}`),
  }));
  const categories = getCategoriesWithLiveTools().map((category) => ({
    url: getAbsoluteUrl(`/tools/category/${category.id}`),
  }));

  return [
    {
      url: getAbsoluteUrl("/"),
    },
    {
      url: getAbsoluteUrl("/about"),
    },
    {
      url: getAbsoluteUrl("/privacy"),
    },
    {
      url: getAbsoluteUrl("/contact"),
    },
    ...categories,
    ...availableTools,
  ];
}
