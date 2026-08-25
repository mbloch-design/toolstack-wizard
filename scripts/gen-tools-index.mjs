#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "src/data/tools_v4.json";
const outputPath = "src/data/tools_index.json";

const tools = JSON.parse(await readFile(sourcePath, "utf8"));

if (!Array.isArray(tools)) {
  throw new Error(`${sourcePath} doit contenir un tableau d’outils.`);
}

const seen = new Set();
const summaries = tools.map((tool, index) => {
  const id = String(tool.id || tool.slug || "").trim();
  const slug = String(tool.slug || tool.id || "").trim();

  if (!id || !slug) {
    throw new Error(`Outil sans id/slug à l’index ${index}.`);
  }
  if (seen.has(slug)) {
    throw new Error(`Slug dupliqué dans ${sourcePath} : ${slug}`);
  }
  seen.add(slug);

  return {
    id,
    slug,
    name: tool.name || id,
    categoryId: tool.category || tool.categoryId || "",
    shortDescription: tool.shortDescription || "",
    shortDescriptionEn: tool.shortDescriptionEn || "",
    pricing: tool.pricing || { free: "", paid: "" },
    defaultMonthlyPrice: tool.defaultMonthlyPrice ?? 0,
    affiliateLink: tool.affiliateLink || "",
    websiteUrl: tool.websiteUrl || tool.affiliateLink || "",
    ogImageUrl: tool.ogImageUrl || "",
    logo: tool.logo || "",
    tool_type: tool.tool_type || "satellite",
    host_app: tool.host_app || null,
    bundle_parent: tool.bundle_parent || null,
    substitution_cluster_v2: tool.substitution_cluster_v2 || null,
    functional_needs: tool.functional_needs || [],
    verticals: tool.verticals || [],
    relevantFor: tool.relevantFor || [],
    freeAlternative: tool.freeAlternative || null,
    substitutable: tool.substitutable ?? true,
    betterAlternative: tool.betterAlternative || null,
  };
});

await writeFile(outputPath, `${JSON.stringify(summaries, null, 2)}\n`);
console.log(`${outputPath} écrit : ${summaries.length} outils, 0 slug dupliqué`);
