// Writes validated titles and metas into tools_v4.json:
// seo.<page>Title{Fr,En} and seo.<page>MetaDescription{Fr,En}.
//   node scripts/seo-meta/apply.mjs <metas.json> [...]
import fs from "node:fs";
const file = "src/data/tools_v4.json";
const tools = JSON.parse(fs.readFileSync(file, "utf8"));
const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));
let n = 0;
for (const input of process.argv.slice(2)) {
  const metas = JSON.parse(fs.readFileSync(input, "utf8"));
  for (const [slug, pages] of Object.entries(metas)) {
    const tool = bySlug.get(slug);
    if (!tool) throw new Error(`Unknown slug ${slug}`);
    tool.seo = tool.seo || {};
    for (const [page, kinds] of Object.entries(pages)) {
      for (const [kind, langs] of Object.entries(kinds)) {
        const field = kind === "title" ? "Title" : "MetaDescription";
        for (const [lang, text] of Object.entries(langs)) {
          tool.seo[`${page}${field}${lang === "fr" ? "Fr" : "En"}`] = text;
          n++;
        }
      }
    }
  }
}
fs.writeFileSync(file, JSON.stringify(tools, null, 2) + "\n");
console.log(`${n} titles and descriptions written`);
