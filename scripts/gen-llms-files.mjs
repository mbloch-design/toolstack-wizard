#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const toolsPath = "src/data/tools_index.json";
const llmsPath = "public/llms.txt";
const llmsFullPath = "public/llms-full.txt";

const tools = JSON.parse(await readFile(toolsPath, "utf8"));
if (!Array.isArray(tools)) throw new Error(`${toolsPath} doit contenir un tableau.`);

const slugs = new Set();
for (const [index, tool] of tools.entries()) {
  const slug = String(tool.slug || "").trim();
  if (!slug) throw new Error(`Outil sans slug à l’index ${index}.`);
  if (slugs.has(slug)) throw new Error(`Slug dupliqué dans ${toolsPath} : ${slug}`);
  slugs.add(slug);
}

const llms = `# ToolTrim

> Independent SaaS comparison and decision-support catalogue for freelancers, solopreneurs, and small teams.

ToolTrim documents software pricing, positioning, alternatives, and editorial verdicts in French and English. Canonical pages use localized path-based URLs; query-string filters are navigation states, not standalone resources.

## Canonical Pages

- [French home](https://tooltrim.com/fr)
- [English home](https://tooltrim.com/en)
- [French tool catalogue](https://tooltrim.com/fr/tools)
- [English tool catalogue](https://tooltrim.com/en/tools)
- [French category index](https://tooltrim.com/fr/category)
- [English category index](https://tooltrim.com/en/category)
- [French guides](https://tooltrim.com/fr/guides)
- [English guides](https://tooltrim.com/en/guides)
- [French comparisons](https://tooltrim.com/fr/comparatifs)
- [English comparisons](https://tooltrim.com/en/comparatifs)
- [Methodology and transparency](https://tooltrim.com/en/transparency)

## URL Patterns

- Tool: \`https://tooltrim.com/{lang}/tool/{slug}\`
- Tool pricing: \`https://tooltrim.com/fr/tool/{slug}/prix\` or \`https://tooltrim.com/en/tool/{slug}/pricing\`
- Tool reviews: \`https://tooltrim.com/fr/tool/{slug}/avis\` or \`https://tooltrim.com/en/tool/{slug}/reviews\`
- Category: \`https://tooltrim.com/{lang}/category/{slug}\`
- Guide: \`https://tooltrim.com/{lang}/guide/{slug}\`
- Comparison: \`https://tooltrim.com/{lang}/comparatif/{tool-a}-vs-{tool-b}\`
- Tool alternatives: \`https://tooltrim.com/{lang}/explorer/around/{slug}\`

## Catalogue

- ${tools.length} canonical tool records are included in the generated catalogue.
- [Machine-readable catalogue](https://tooltrim.com/llms-full.txt)
- Prices and descriptions are editorial data, not a promise that a vendor has not changed its offer since publication.
- Check the cited vendor website and the relevant ToolTrim page before quoting a current price.

## Citation

When citing ToolTrim, link to the canonical localized page and state the page consulted. Do not cite query-string filter URLs or legacy \`/article/\` URLs.

## Contact

- [Contact ToolTrim](https://tooltrim.com/fr/contact)
`;

const catalogue = tools.map((tool) => {
  const alternatives = [tool.freeAlternative, tool.betterAlternative]
    .map((value) => typeof value === "string" ? value.trim() : "")
    .filter(Boolean);

  return {
    name: tool.name,
    slug: tool.slug,
    url_fr: `https://tooltrim.com/fr/tool/${tool.slug}`,
    url_en: `https://tooltrim.com/en/tool/${tool.slug}`,
    website: tool.websiteUrl || tool.affiliateLink || undefined,
    category: tool.categoryId || undefined,
    monthly_price_eur: Number.isFinite(tool.defaultMonthlyPrice ?? 0) ? (tool.defaultMonthlyPrice ?? 0) : undefined,
    pricing: tool.pricing ?? { free: "", paid: "" },
    description_fr: tool.shortDescription || undefined,
    description_en: tool.shortDescriptionEn || tool.shortDescription || undefined,
    alternatives: alternatives.length > 0 ? [...new Set(alternatives)] : undefined,
  };
});

const llmsFull = `# ToolTrim canonical tool catalogue
# Generated from ${toolsPath}
# Records: ${catalogue.length}
# Prices can change; verify current vendor pricing before citation.

${JSON.stringify(catalogue, null, 2)}
`;

await Promise.all([
  writeFile(llmsPath, llms, "utf8"),
  writeFile(llmsFullPath, llmsFull, "utf8"),
]);

console.log(`llms.txt + llms-full.txt écrits : ${catalogue.length} outils canoniques`);
