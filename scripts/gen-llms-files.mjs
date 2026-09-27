#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { editorialRecord, editorialUrls, toolRecords } from "./lib/llms-catalogue.mjs";

const toolsPath = "src/data/tools_index.json";
const llmsPath = "public/llms.txt";
const llmsFullPath = "public/llms-full.txt";
const llmsEditorialPath = "public/llms-editorial.txt";

const tools = JSON.parse(await readFile(toolsPath, "utf8"));
if (!Array.isArray(tools)) throw new Error(`${toolsPath} doit contenir un tableau.`);

const catalogue = toolRecords(tools);
// Run after prerender and SEO validation: the sitemap and generated HTML are
// the publication authority, including translated slugs and standalone guides.
const urls = editorialUrls(await readFile("dist/sitemap.xml", "utf8"));
const editorial = await Promise.all(urls.map(async (url) => editorialRecord(
  url, await readFile(`dist${new URL(url).pathname}/index.html`, "utf8"),
)));
const guideCount = editorial.filter(({ type }) => type === "guide").length;
const comparisonCount = editorial.length - guideCount;
const missingSummaries = editorial.filter(({ summary }) => !summary);
if (missingSummaries.length) {
  console.warn(`LLM : ${missingSummaries.length} page(s) sans résumé source : ${missingSummaries.map(({ url }) => url).join(", ")}`);
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
- [Editorial index: guide and comparison summaries](https://tooltrim.com/llms-editorial.txt)
- ${guideCount} localized guide pages and ${comparisonCount} localized comparison pages are included in the editorial index, generated from the same build as the sitemap.
- Editorial records provide localized titles, summaries and canonical URLs, not full articles. Read the linked page for the complete analysis.
- Pricing text retains the stated currency and billing period. Missing prices are unknown, not zero; annual or lifetime offers are not converted into monthly EUR prices.
- Prices and descriptions are editorial data, not a promise that a vendor has not changed its offer since publication.
- Check the cited vendor website and the relevant ToolTrim page before quoting a current price.

## Citation

When citing ToolTrim, link to the canonical localized page and state the page consulted. Do not cite query-string filter URLs or legacy \`/article/\` URLs.

## Contact

- [Contact ToolTrim](https://tooltrim.com/fr/contact)
`;

const llmsFull = `# ToolTrim canonical tool catalogue
# Generated from ${toolsPath}
# Records: ${catalogue.length}
# Prices can change; verify current vendor pricing before citation.
# Pricing text preserves the stated currency and billing period. No inferred monthly EUR price; missing means unknown, not free.
# Localized guides and comparisons: https://tooltrim.com/llms-editorial.txt

${JSON.stringify(catalogue, null, 2)}
`;

const llmsEditorial = `# ToolTrim editorial index
# Generated from dist/sitemap.xml and its canonical prerendered pages.
# Records: ${editorial.length} (${guideCount} guides, ${comparisonCount} comparisons, localized FR/EN pages)
# Titles and available source summaries only. A missing summary is not inferred. Consult each canonical URL for full content and current offers.

${JSON.stringify(editorial, null, 2)}
`;

await Promise.all([
  [llmsPath, llms], [llmsFullPath, llmsFull], [llmsEditorialPath, llmsEditorial],
].flatMap(([file, content]) => [file, file.replace(/^public\//, "dist/")]
  .map((target) => writeFile(target, content, "utf8"))));

console.log(`Fichiers LLM écrits dans public et dist : ${catalogue.length} outils, ${guideCount} guides, ${comparisonCount} comparatifs localisés.`);
