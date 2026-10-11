import { toolsData } from "./tools-data.js";

export const SHOW_COMING_SOON = false;

function getCategorizedTools() {
  return toolsData.flatMap((category) =>
    category.tools.map((tool) => ({
      ...tool,
      categoryId: category.id,
      category: category.category,
    }))
  );
}

export function getLiveTools() {
  return getCategorizedTools().filter((tool) => tool.status === "live");
}

export function getPlannedTools() {
  return getCategorizedTools().filter((tool) => tool.status === "planned");
}

export function getVisibleTools() {
  return getCategorizedTools().filter(
    (tool) =>
      tool.status === "live" || (SHOW_COMING_SOON && tool.status === "planned")
  );
}

export function getCategoriesWithLiveTools() {
  const visibleTools = getVisibleTools();
  return [...toolsData]
    .sort((first, second) => first.sortOrder - second.sortOrder)
    .map((category) => ({
      ...category,
      tools: visibleTools.filter((tool) => tool.categoryId === category.id),
    }))
    .filter((category) =>
      category.tools.some((tool) => tool.status === "live")
    );
}

export function getCategories() {
  return [...toolsData].sort(
    (first, second) => first.sortOrder - second.sortOrder
  );
}

export function getToolsByCategory(categorySlug) {
  return (
    getCategoriesWithLiveTools().find((category) => category.id === categorySlug)
      ?.tools || []
  );
}

export function getAvailableTools() {
  return getLiveTools();
}

export function getCategoryBySlug(categorySlug) {
  return getCategoriesWithLiveTools().find(
    (category) => category.id === categorySlug
  ) || null;
}

export function getAvailableCategories() {
  return getCategoriesWithLiveTools();
}

export function getToolCategory(toolSlug) {
  const liveTool = getLiveTools().find((tool) => tool.slug === toolSlug);
  if (!liveTool) return null;
  return getCategoryBySlug(liveTool.categoryId);
}
