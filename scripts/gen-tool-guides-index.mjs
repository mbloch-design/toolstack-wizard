#!/usr/bin/env node

/**
 * Builds the two-way index between guides and catalogue tools.
 *
 * Guides already carry a `toolId`, but nothing ever turned it into a link:
 * the field was read by the diagnostic types only, so a guide about Notion
 * and the Notion fiche had no path between them. This index is the shared,
 * build-time source both pages read, so neither has to scan the catalogue
 * at runtime (GuideDetailPage is deliberately network-free).
 *
 * A `toolId` is not always the tool's slug — `convertkit` is the id of the
 * tool now published as `kit`. Resolution goes through id first, then slug,
 * and an id that resolves to neither aborts the build rather than emitting
 * a link to a 404.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const LANGUAGES = ["fr", "en"];

const tools = JSON.parse(readFileSync(resolve("src/data/tools_index.json"), "utf8"));
const byId = new Map(tools.map((tool) => [tool.id, tool]));
const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));

/**
 * `/tool/:slug/prix` renders the fiche's pricing section and nothing else, so
 * linking to it for a tool with no `pricing_v5` would point at an empty page.
 * The flag is resolved here, at build time, rather than making the guide page
 * load the full catalogue to find out.
 */
const priced = new Set(
  JSON.parse(readFileSync(resolve("src/data/tools_v4.json"), "utf8"))
    .filter((tool) => tool.pricing_v5)
    .map((tool) => tool.slug || tool.id),
);

/** Guides whose category is editorial narrative, not tool advice. */
const NARRATIVE_CATEGORY = "Stories";

const byTool = {};
const byGuide = {};
const unresolved = [];

for (const lang of LANGUAGES) {
  const posts = JSON.parse(readFileSync(resolve(`src/data/posts-${lang}.json`), "utf8"));

  for (const post of posts) {
    if (!post.toolId) continue;
    if (post.category === NARRATIVE_CATEGORY) continue;

    const tool = byId.get(post.toolId) || bySlug.get(post.toolId);

    if (!tool) {
      unresolved.push(`${lang}/${post.slug} → toolId "${post.toolId}"`);
      continue;
    }

    const slug = tool.slug || tool.id;

    byTool[slug] ??= { fr: [], en: [] };
    byTool[slug][lang].push({
      slug: post.slug,
      title: post.title,
      date: post.date || null,
      category: post.category || null,
    });

    byGuide[`${lang}:${post.slug}`] = { slug, name: tool.name, hasPricing: priced.has(slug) };
  }
}

if (unresolved.length) {
  console.error("✖ toolId introuvable dans le catalogue :");
  for (const entry of unresolved) console.error(`  ${entry}`);
  console.error("  Corrige le toolId du guide ou publie la fiche avant de builder.");
  process.exit(1);
}

// Most recent first: a tool page showing several guides should lead with the
// freshest one, and guide dates are the only ordering signal available here.
for (const entry of Object.values(byTool)) {
  for (const lang of LANGUAGES) {
    entry[lang].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  }
}

const output = { byTool, byGuide };
writeFileSync(resolve("src/data/tool_guides_index.json"), `${JSON.stringify(output, null, 2)}\n`);

const pairs = Object.keys(byGuide).length;
console.log(
  `tool_guides_index.json written: ${pairs} guide→outil, ${Object.keys(byTool).length} outils couverts`,
);
