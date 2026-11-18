#!/usr/bin/env node
/**
 * Projects the agents section (S1): server sheets (research/mcp/<server>.json) and skill sheets
 * (research/skills/<skill>.json) into the public JSON catalogue (R3 principle):
 *   src/data/agents/mcp_index.json     cards of /mcp (filters included)
 *   src/data/agents/skills_index.json  cards of /skills
 *   src/data/agents/catalog.json       the sheets, read by /mcp/:slug and /skills/:slug
 *   src/data/agents/needs.json         the hub's needs (research/agents/needs.json), each resolved to its sheet
 *   src/data/agents/checked_none.json  catalogue tools checked with no official server (the hub's « not yet »)
 *   src/data/agents/advice.json        ToolTrim's words per server (one example request, for whom), for the tool pages
 *   src/data/agents/recipes.json       recipes between two plugged tools (research/agents/recipes.json), checked against the sheets
 *
 *   node scripts/project-agents.mjs           # writes (refuses anything outside the vocabularies)
 *   node scripts/project-agents.mjs --check   # guard: exits 1 when invalid or out of step
 */
import fs from "node:fs";
import path from "node:path";
import { validateMcpSheet, validateNeeds, validateRecipes, validateSkillSheet } from "./lib/agent-access.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CHECK = process.argv.includes("--check");
const read = (dir) => fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith(".json")).sort()
  .map((f) => JSON.parse(fs.readFileSync(path.join(ROOT, dir, f), "utf8")));
const servers = read("research/mcp");
const skills = read("research/skills");
const tools = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/tools_v4.json"), "utf8"));
const catalogSlugs = new Set(tools.map((t) => t.slug || t.id));
const serverSlugs = new Set(servers.map((s) => s.slug));
const skillSlugs = new Set(skills.map((s) => s.slug));
const needsTable = JSON.parse(fs.readFileSync(path.join(ROOT, "research/agents/needs.json"), "utf8"));
const recipesTable = JSON.parse(fs.readFileSync(path.join(ROOT, "research/agents/recipes.json"), "utf8"));
// How many of the catalogue's stacks hold each tool (step 8, 18/11): the hub's « À la une » order.
const catalogStacks = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/stacks-catalog-index.json"), "utf8")).stacks;
const inStacks = (slug) => catalogStacks.filter((stack) => (stack.tools ?? []).some((tool) => tool.slug === slug)).length;

const errors = [
  ...servers.flatMap((s) => validateMcpSheet(s, { catalogSlugs, skillSlugs })),
  ...skills.flatMap((s) => validateSkillSheet(s, { catalogSlugs, serverSlugs })),
  ...validateNeeds(needsTable, servers),
  ...validateRecipes(recipesTable, servers),
];
for (const server of servers) for (const skill of skills.filter((k) => k.server === server.slug)) {
  if (!(server.skills ?? []).includes(skill.slug)) errors.push(`${server.slug} : ne liste pas son skill ${skill.slug}`);
}

const KINDS = ["read", "write", "delete", "send", "pay"];
const ONE_CLICK = ["connector", "plugin"];
const kindsOf = (s) => KINDS.filter((k) => (s.capabilities ?? []).some((c) => c.kind === k) || (s.tools ?? []).some((t) => t.kind === k));
const mcpIndex = servers.map((s) => ({
  slug: s.slug, name: s.name, publisher: s.publisher, host_tool: s.host_tool, category: s.category, summary: s.summary, ...(s.card ? { card: s.card } : {}),
  ...(s.status ? { status: s.status } : {}), ...(s.transport ? { transport: s.transport } : {}), ...(s.auth ? { auth: s.auth } : {}),
  ...(s.access ? { access: s.access } : {}), plan: s.plan, kinds: kindsOf(s),
  // The risk said in words follows the capability lines shown on the sheet; the tools only when there are none.
  capability_kinds: s.capabilities?.length ? KINDS.filter((k) => s.capabilities.some((c) => c.kind === k)) : kindsOf(s),
  one_click: [...new Set((s.setup ?? []).filter((w) => ONE_CLICK.includes(w.how) && w.assistant !== "other").map((w) => w.assistant))],
  ...(s.clients ? { clients: s.clients } : {}), ...(s.setup ? { setup: s.setup } : {}), ...(s.safeguards ? { safeguards: s.safeguards } : {}),
  ...(s.for ? { for: s.for, not_for: s.not_for } : {}), tools: s.tools?.length ?? 0, skills: s.skills?.length ?? 0, in_stacks: inStacks(s.host_tool), verified_on: s.verified_on,
}));
const skillsIndex = skills.map((k) => ({
  slug: k.slug, name: k.name, publisher: k.publisher, host_tool: k.host_tool, server: k.server, category: k.category,
  summary: k.summary, agents: k.agents, verified_on: k.verified_on,
  // Usable without a coding tool: nothing to install, it ships with the connected server (step 5, 17/11; forEveryone in src/lib/agents.ts).
  everyone: !(k.install ?? []).length,
}));

const bySlug = new Map(servers.map((s) => [s.slug, s]));
const needs = (needsTable.needs ?? []).filter((need) => bySlug.get(need.server)?.examples?.[need.example]).map((need) => ({
  id: need.id, fr: need.fr, en: need.en, server: need.server, example: bySlug.get(need.server).examples[need.example], also: need.also ?? [],
}));
// The tool page's gateway says one request and our view: only those travel to its bundle.
const advice = Object.fromEntries(servers.filter((s) => s.examples || s.for).map((s) => [s.slug, {
  ...(s.examples ? { examples: s.examples.slice(0, 1) } : {}), ...(s.for ? { for: s.for } : {}),
}]));

// A recipe travels with each side's host tool and the gravest consequence of the tools it uses there (not the server's).
const GRAVITY = ["pay", "delete", "send", "write", "read"];
const recipes = (recipesTable.recipes ?? []).map((recipe) => ({
  id: recipe.id, request: recipe.request,
  sides: recipe.servers.map((slug) => {
    const server = bySlug.get(slug);
    const kinds = (recipe.uses[slug] ?? []).map((name) => server.tools.find((tool) => tool.name === name)?.kind);
    return { server: slug, host_tool: server.host_tool, tools: recipe.uses[slug], gravest: GRAVITY.find((kind) => kinds.includes(kind)) };
  }),
}));

const outputs = {
  "src/data/agents/mcp_index.json": mcpIndex,
  "src/data/agents/skills_index.json": skillsIndex,
  "src/data/agents/catalog.json": { servers, skills },
  "src/data/agents/needs.json": needs,
  "src/data/agents/advice.json": advice,
  "src/data/agents/recipes.json": recipes,
  "src/data/agents/checked_none.json": tools.filter((t) => t.agentAccess?.mcp === "none").map((t) => t.slug || t.id).sort(),
};
for (const error of errors) console.log(`✗ ${error}`);
let stale = 0;
for (const [file, data] of Object.entries(outputs)) {
  const text = `${JSON.stringify(data, null, 2)}\n`;
  const target = path.join(ROOT, file);
  const same = fs.existsSync(target) && fs.readFileSync(target, "utf8") === text;
  if (same) continue;
  stale++;
  if (!CHECK && !errors.length) { fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, text); console.log(`écrit : ${file}`); }
  else if (CHECK) console.log(`pas à jour : ${file} (node scripts/project-agents.mjs)`);
}
console.log(`${servers.length} serveur(s), ${skills.length} skill(s), ${errors.length} erreur(s).`);
process.exitCode = errors.length || (CHECK && stale) ? 1 : 0;
