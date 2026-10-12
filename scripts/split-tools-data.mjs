import fs from "node:fs";

const rawFile = fs.readFileSync("./src/data/tools-data.js", "utf-8");

// Extract the file parts cleanly
const codeToRun = rawFile.replace("export const toolsData =", "globalThis.__DATA__ = { rawToolsData, plannedPriorityBySlug, disabledToolReasons };\nconst dummy =");
new Function(codeToRun)();

const { rawToolsData, plannedPriorityBySlug, disabledToolReasons } = globalThis.__DATA__;

fs.mkdirSync("./src/data/tools", { recursive: true });

const categoriesMeta = rawToolsData.map(c => ({
  id: c.id,
  category: c.category,
  description: c.description,
  icon: c.icon,
  sortOrder: c.sortOrder
}));

const categoriesContent = `/**
 * categories.js
 * Catalog category definitions and sorting order.
 */

export const CATEGORIES = ${JSON.stringify(categoriesMeta, null, 2)};

export const plannedPriorityBySlug = ${JSON.stringify(plannedPriorityBySlug, null, 2)};

export const disabledToolReasons = ${JSON.stringify(disabledToolReasons, null, 2)};
`;

fs.writeFileSync("./src/data/categories.js", categoriesContent, "utf-8");
console.log("Wrote src/data/categories.js");

for (const cat of rawToolsData) {
  const exportName = cat.id.replace(/-/g, "_") + "_tools";
  const filePath = `./src/data/tools/${cat.id}.js`;
  const fileContent = `/**
 * ${cat.id}.js
 * Tool catalog entries for ${cat.category}.
 */

export const ${exportName} = ${JSON.stringify(cat.tools, null, 2)};

export default ${exportName};
`;
  fs.writeFileSync(filePath, fileContent, "utf-8");
  console.log(`Wrote ${filePath} (${cat.tools.length} tools)`);
}
