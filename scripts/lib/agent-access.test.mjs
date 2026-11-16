import { describe, expect, it } from "vitest";
import { agentAccessIndex, projectAgentAccess, validateAgentBlock } from "./agent-access.mjs";

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
