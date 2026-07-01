/** fix-better-alternative-reason-slugs.mjs
 * Bug: StickyDecisionCard renders betterAlternative.reason verbatim in the
 * "Alternative recommandée" sidebar card. ~21 tools have a slug-like
 * placeholder there (e.g. "plus-adapte-tech") instead of a real sentence,
 * so the slug itself was showing up on the live page. Replace each with
 * the existing performanceGain sentence, which is already clean prose.
 */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));

const SLUGS = [
  "amplitude", "confluence", "deepseek", "github-copilot", "jira", "mem-ai",
  "notion-ai", "otter-ai", "podia", "productboard", "replit", "ae-rubberhose",
  "anchor-spotify", "substack", "suno", "tabnine", "thinkific", "zapier",
  "zeplin", "kling-ai",
];

let updated = 0;
for (const slug of SLUGS) {
  const tool = tools.find((x) => (x.slug || x.id) === slug);
  if (!tool || !tool.betterAlternative) { console.warn(`⚠️  ${slug} not found or no betterAlternative`); continue; }
  const gain = tool.betterAlternative.performanceGain;
  if (!gain) { console.warn(`⚠️  ${slug} has no performanceGain to fall back on`); continue; }
  const old = tool.betterAlternative.reason;
  tool.betterAlternative.reason = gain;
  updated++;
  console.log(`✓ ${slug}: "${old}" -> "${gain}"`);
}
writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log(`\n${updated} fiches corrigées.`);
