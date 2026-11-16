#!/usr/bin/env node
/**
 * Projects the « agent » block of each research file (research/bundle-editorial/<slug>.json,
 * facts.agent) into the catalogue (src/data/tools_v4.json, agentAccess).
 *
 *   node scripts/project-agent-access.mjs           # dry run: validates, prints what changes
 *   node scripts/project-agent-access.mjs --apply   # writes tools_v4.json, then run gen:tools-index
 *   node scripts/project-agent-access.mjs --check   # guard: exits 1 on a value outside the closed
 *                                                   # vocabularies or a catalogue out of step
 *
 * Rules (scripts/lib/agent-access.mjs): closed vocabularies, a block that does not validate is never
 * projected, clients only as catalogue slugs. A tool without a block loses any stale agentAccess:
 * the research file is the only source.
 */
import fs from "node:fs";
import path from "node:path";
import { projectAgentAccess, validateAgentBlock } from "./lib/agent-access.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CATALOGUE = path.join(ROOT, "src/data/tools_v4.json");
const RESEARCH = path.join(ROOT, "research/bundle-editorial");
const APPLY = process.argv.includes("--apply");
const CHECK = process.argv.includes("--check");

const tools = JSON.parse(fs.readFileSync(CATALOGUE, "utf8"));
const bySlug = new Map(tools.map((tool) => [tool.slug || tool.id, tool]));
const catalogSlugs = new Set(bySlug.keys());

const blocks = new Map();
const errors = [];
for (const file of fs.readdirSync(RESEARCH).filter((name) => name.endsWith(".json")).sort()) {
  const slug = file.slice(0, -5);
  const agent = JSON.parse(fs.readFileSync(path.join(RESEARCH, file), "utf8")).facts?.agent;
  if (agent === undefined) continue;
  const problems = validateAgentBlock(agent, { catalogSlugs });
  if (!bySlug.has(slug)) problems.push("aucune fiche à ce slug dans tools_v4.json");
  if (problems.length) errors.push(...problems.map((problem) => `${slug} : ${problem}`));
  else blocks.set(slug, projectAgentAccess(agent));
}

const changes = [];
for (const [slug, tool] of bySlug) {
  const next = blocks.get(slug);
  const before = JSON.stringify(tool.agentAccess ?? null);
  if (before === JSON.stringify(next ?? null)) continue;
  changes.push(`${slug} : ${next ? (tool.agentAccess ? "mis à jour" : "ajouté") : "retiré (plus de bloc)"}`);
  if (next) tool.agentAccess = next;
  else delete tool.agentAccess;
}

for (const error of errors) console.log(`✗ ${error}`);
console.log(`${blocks.size} bloc(s) valide(s), ${errors.length} erreur(s), ${changes.length} changement(s).`);
for (const change of changes) console.log(`  ${change}`);

if (CHECK) {
  if (changes.length) console.log("tools_v4.json n'est pas à jour : node scripts/project-agent-access.mjs --apply");
  process.exitCode = errors.length || changes.length ? 1 : 0;
} else if (errors.length) {
  process.exitCode = 1;
} else if (APPLY && changes.length) {
  fs.writeFileSync(CATALOGUE, `${JSON.stringify(tools, null, 2)}\n`);
  console.log("tools_v4.json écrit. Suite : npm run gen:tools-index");
}
