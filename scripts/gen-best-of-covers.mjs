/**
 * Couvertures des pages « meilleurs outils » (src/data/bestOfCovers.json) :
 * les 4 premiers outils de chaque page (slug, nom, logo, site), le nombre
 * d'outils comparés et la dernière date de vérification des prix.
 *
 * L'index des guides et le bloc « Autres comparatifs » n'ont besoin que de
 * ça ; importer bestOfGuidesData.json (184 Ko) pour une mosaïque de logos
 * alourdirait chaque page. Appelé par gen-best-of-guides-data.mjs, peut aussi
 * tourner seul après une retouche de la config.
 */
import fs from "node:fs";

const config = JSON.parse(fs.readFileSync("src/data/bestOfGuides.json", "utf8"));
const data = JSON.parse(fs.readFileSync("src/data/bestOfGuidesData.json", "utf8"));

const covers = {};
for (const guide of config.guides) {
  const tools = guide.tools.map((slug) => data[slug]).filter(Boolean);
  const checked = tools
    .flatMap((tool) => [tool.pricing_v5?.verified_on, tool.pricing_v5En?.verified_on])
    .filter(Boolean)
    .sort()
    .pop() || null;
  covers[guide.id] = {
    count: tools.length,
    checkedOn: checked,
    tools: tools.slice(0, 4).map((tool) => ({ slug: tool.slug, name: tool.name, logo: tool.logo || undefined, websiteUrl: tool.websiteUrl || undefined })),
  };
}

fs.writeFileSync("src/data/bestOfCovers.json", JSON.stringify(covers, null, 2) + "\n");
console.log(`Couvertures « meilleurs outils » : ${Object.keys(covers).length} pages.`);
