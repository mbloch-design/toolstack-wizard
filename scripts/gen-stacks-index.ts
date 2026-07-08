import { writeFileSync } from "node:fs";
import { STACKS } from "../src/data/stacks";

// The homepage carousel only ever shows STACK_MAX_PAGES(4) × STACK_PAGE_SIZE(3)
// = 12 stacks (the first 12), so the light index only needs those. If that cap
// grows in HomePageV2.tsx, bump this and re-run: node_modules/.bin/tsx scripts/gen-stacks-index.ts
const HOME_CAROUSEL_MAX = 12;

const index = STACKS.slice(0, HOME_CAROUSEL_MAX).map((s) => ({
  slug: s.slug,
  title: s.title,
  titleEn: s.titleEn,
  subtitle: s.subtitle,
  subtitleEn: s.subtitleEn,
  tools: (s.tools || []).map((t) => ({ slug: t.slug })),
}));

writeFileSync("src/data/stacks-index.json", JSON.stringify(index, null, 2) + "\n");
console.log(`stacks-index.json written: ${index.length} stacks`);
