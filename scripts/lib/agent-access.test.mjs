import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { SITUATION_SCENES, agentAccessIndex, projectAgentAccess, validateAgentBlock, validateMcpSheet, validateNeeds, validateRecipes } from "./agent-access.mjs";

const official = {
  mcp: "official",
  verified_on: "2026-11-16",
  sources: [{ label: "Vendor docs", url: "https://example.com/mcp" }],
  servers: [
    { name: "Remote", transport: "remote", auth: ["oauth", "key"], access: "read_write", plan: "all", plan_note: "Tous.", plan_note_en: "All.", docs_url: "https://example.com/remote" },
    { name: "Desktop", transport: "local", access: "read", plan: "specific", plan_note: "Siège Dev.", plan_note_en: "Dev seat.", clients: ["claude"], docs_url: "https://example.com/local" },
  ],
  status: "beta",
  capabilities: [{ kind: "read", fr: "Lire", en: "Read" }, { kind: "pay", fr: "Payer, avec confirmation", en: "Pay, with confirmation" }],
  setup: [{ assistant: "claude", how: "connector" }, { assistant: "other", how: "url" }],
  safeguards: ["human_confirmation"],
};
const catalogSlugs = new Set(["claude", "cursor"]);

describe("agent block guard", () => {
  it("accepts a block written in the closed vocabularies", () => {
    expect(validateAgentBlock(official, { catalogSlugs })).toEqual([]);
    expect(validateAgentBlock({ mcp: "none", verified_on: "2026-11-16", sources: official.sources, servers: [] })).toEqual([]);
  });

  it("refuses a value outside the vocabularies, as form_factor does", () => {
    const loose = structuredClone(official);
    loose.mcp = "community";
    loose.servers[0].access = "account_scoped";
    loose.servers[0].auth = ["api_key"];
    loose.servers[1].transport = "stdio";
    const errors = validateAgentBlock(loose, { catalogSlugs }).join("\n");
    for (const word of ["community", "account_scoped", "api_key", "stdio"]) expect(errors).toContain(word);
  });

  it("refuses tool-level values outside the vocabularies", () => {
    const loose = structuredClone(official);
    loose.status = "preview";
    loose.capabilities[0].kind = "export";
    loose.setup.push({ assistant: "claude", how: "connector" }, { assistant: "perplexity", how: "app" });
    loose.safeguards = ["read_only"];
    const errors = validateAgentBlock(loose, { catalogSlugs }).join("\n");
    for (const word of ["preview", "export", "doublon claude/connector", "perplexity", "app", "read_only"]) expect(errors).toContain(word);
    expect(validateAgentBlock({ mcp: "none", verified_on: "2026-11-16", sources: official.sources, servers: [], safeguards: [] }).join()).toContain("sans objet");
    expect(validateAgentBlock({ ...official, capabilities: [] }).join()).toContain("1 à 5");
  });

  it("refuses what the schema rules out", () => {
    const wrong = structuredClone(official);
    delete wrong.verified_on;
    wrong.servers[1].clients = ["claude-code"];
    wrong.servers[1].plan_note = "";
    wrong.servers[0].install = "npx something";
    const errors = validateAgentBlock(wrong, { catalogSlugs }).join("\n");
    expect(errors).toContain("verified_on");
    expect(errors).toContain("claude-code");
    expect(errors).toContain("specific exige plan_note");
    expect(errors).toContain("install");
    expect(validateAgentBlock({ ...official, mcp: "none" })).toContain("mcp none : servers doit être vide");
  });

  it("projects camelCase and a reduced index", () => {
    const access = projectAgentAccess(official);
    expect(access.servers[0]).toEqual({ name: "Remote", transport: "remote", auth: ["oauth", "key"], access: "read_write", plan: "all", planNote: "Tous.", planNoteEn: "All.", docsUrl: "https://example.com/remote" });
    expect(access).toMatchObject({ status: "beta", setup: official.setup, safeguards: ["human_confirmation"] });
    expect(access.capabilities).toHaveLength(2);
    expect(agentAccessIndex(access)).toEqual({ mcp: "official", transport: ["remote", "local"], access: "read_write", verifiedOn: "2026-11-16" });
    expect(agentAccessIndex(null)).toBeNull();
  });
});

// S1 bis (17/11/2026): the hub starts from needs, the sheets tell a story with ToolTrim's words.
const readJson = (file) => JSON.parse(fs.readFileSync(new URL(`../../${file}`, import.meta.url), "utf8"));
const servers = fs.readdirSync(new URL("../../research/mcp/", import.meta.url)).filter((f) => f.endsWith(".json")).map((f) => readJson(`research/mcp/${f}`));

describe("agents hub and sheet contract", () => {
  it("leads every need to a server sheet and one of its example requests", () => {
    const table = readJson("research/agents/needs.json");
    expect(validateNeeds(table, servers)).toEqual([]);
    for (const need of table.needs) expect(servers.find((s) => s.slug === need.server).examples[need.example].fr).toBeTruthy();
  });

  it("refuses a need without a sheet, a missing example or a repeated alternative", () => {
    const table = { needs: Array.from({ length: 6 }, (_, i) => ({ id: `n${"abcdef"[i]}`, fr: "Besoin", en: "Need", server: "notion-mcp", example: 0, also: [] })) };
    table.needs[0].server = "nowhere-mcp";
    table.needs[1].example = 9;
    table.needs[2].also = ["notion-mcp"];
    const errors = validateNeeds(table, servers).join("\n");
    for (const word of ["nowhere-mcp", "demande type 9", "also"]) expect(errors).toContain(word);
  });

  it("accepts 2 or 3 example requests and a view that goes in pairs", () => {
    const notion = servers.find((s) => s.slug === "notion-mcp");
    expect(validateMcpSheet(notion)).toEqual([]);
    const loose = { ...structuredClone(notion), examples: [notion.examples[0]] };
    delete loose.not_for;
    const errors = validateMcpSheet(loose).join("\n");
    expect(errors).toContain("examples");
    expect(errors).toContain("for et not_for");
  });

  it("takes a situation's pencil scene from the closed list, and lets a situation go without one", () => {
    const notion = servers.find((s) => s.slug === "notion-mcp");
    const bare = structuredClone(notion);
    delete bare.advice.situations[0].scene;
    expect(validateMcpSheet(bare)).toEqual([]);
    const odd = structuredClone(notion);
    odd.advice.situations[0].scene = "notion-elsewhere";
    expect(validateMcpSheet(odd).join("\n")).toContain("scène hors liste (notion-elsewhere)");
  });

  it("keeps the guard's scene list and the SituationScene type the same (TypeScript checks the drawings against the type)", () => {
    const source = fs.readFileSync("src/lib/agents.ts", "utf8");
    const union = source.match(/export type SituationScene =([^;]+);/)[1];
    const typed = [...union.matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]);
    expect([...typed].sort()).toEqual([...SITUATION_SCENES].sort());
  });

  it("never draws the same scene twice on one sheet (a situation without a scene keeps its round)", () => {
    for (const server of servers.filter((s) => s.advice)) {
      const scenes = server.advice.situations.map((x) => x.scene).filter(Boolean);
      expect(new Set(scenes).size, server.slug).toBe(scenes.length);
    }
  });
});

describe("recipes between two tools (step 6)", () => {
  const servers = [
    { slug: "calendly-mcp", host_tool: "calendly", tools: [{ name: "meetings-list_events", kind: "read" }] },
    { slug: "notion-mcp", host_tool: "notion", tools: [{ name: "notion-create-pages", kind: "write" }] },
  ];
  const recipe = (uses) => ({ recipes: [{ id: "r", servers: ["calendly-mcp", "notion-mcp"], uses, request: { fr: "Prépare…", en: "Prepare…" } }] });

  it("accepts tools listed on each sheet", () => {
    expect(validateRecipes(recipe({ "calendly-mcp": ["meetings-list_events"], "notion-mcp": ["notion-create-pages"] }), servers)).toEqual([]);
  });

  it("refuses a tool the server sheet does not list, and a side with no tool", () => {
    expect(validateRecipes(recipe({ "calendly-mcp": ["meetings-delete_everything"], "notion-mcp": ["notion-create-pages"] }), servers).join(" ")).toMatch(/absent de la fiche calendly-mcp/);
    expect(validateRecipes(recipe({ "calendly-mcp": ["meetings-list_events"] }), servers).join(" ")).toMatch(/aucun outil cité pour notion-mcp/);
  });
});
