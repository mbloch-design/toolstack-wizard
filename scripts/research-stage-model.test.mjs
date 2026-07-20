import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildStagingProposal, editorialRowsFromLegacy, planRegistryFromResearch, validateStagingProposal } from "./research-stage-model.mjs";
import { stagingProfileFor } from "./research-stage-profiles.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WIX = path.join(ROOT, "research", "tool-pages", "wix.json");
const hash = (value) => createHash("sha256").update(value).digest("hex");
const PLAN_REGISTRY = {
  free: { is_free: true, pricing_unit: "site", seat_type: null, is_compare_plan: false, display_order: 0 },
  light: { is_free: false, pricing_unit: "site", seat_type: null, is_compare_plan: true, display_order: 1 },
  core: { is_free: false, pricing_unit: "site", seat_type: null, is_compare_plan: false, display_order: 2 },
  business: { is_free: false, pricing_unit: "site", seat_type: null, is_compare_plan: false, display_order: 3 },
  business_elite: { is_free: false, pricing_unit: "site", seat_type: null, is_compare_plan: false, display_order: 4 },
};

async function wix() { return JSON.parse(await readFile(WIX, "utf8")); }
async function wixRegistry() {
  const registry = JSON.parse(await readFile(path.join(ROOT, "research", "sources-registry.json"), "utf8"));
  return registry.sources.wix;
}

describe("proposition staging Wix — aucune I/O et aucun approved", () => {
  it("dérive les plans des preuves et limite le profil aux décisions métier", async () => {
    const doc = await wix();
    const planRegistry = planRegistryFromResearch(doc, await wixRegistry(), stagingProfileFor("wix"));
    expect(planRegistry).toEqual(PLAN_REGISTRY);
  });

  it("prépare deux contenus éditoriaux draft sans perdre les blocs actifs", async () => {
    const tools = JSON.parse(await readFile(path.join(ROOT, "src", "data", "tools_v4.json"), "utf8"));
    const wixTool = tools.find((tool) => tool.slug === "wix");
    const rows = editorialRowsFromLegacy(wixTool, "wix");
    expect(rows.map((row) => row.lang)).toEqual(["fr", "en"]);
    expect(rows.every((row) => row.status === "draft" && row.published_at === null)).toBe(true);
    expect(rows.every((row) => /^sha256:[0-9a-f]{64}$/.test(row.content_hash))).toBe(true);
    expect(rows[0].short_description).toBe(wixTool.shortDescription);
    expect(rows[1].short_description).toBe(wixTool.shortDescriptionEn);
    expect(rows[0].pricing_guidance).toMatchObject({ price_reliability: "low", usage_sensitive: false });
    expect(rows[0].pricing_guidance).not.toHaveProperty("compare_price_monthly_eur");
  });

  it("mappe les lignes attendues sans perdre les payloads", async () => {
    const proposal = buildStagingProposal(await wix(), { planRegistry: PLAN_REGISTRY });
    expect(proposal.mode).toBe("STAGING_PROPOSAL_ONLY");
    expect(proposal.counts).toMatchObject({
      tool_sources: 3,
      tool_source_captures: 3,
      tool_context_attestations: 17,
      tool_review_attestations: 2,
      tool_review_events: 2,
      tool_plans: 5,
      tool_price_observations: 4,
      tool_claims: 2,
      tool_plan_localizations: 4,
      tool_relationships: 0,
    });
    expect(proposal.approved_rows).toBe(0);
    expect(proposal.tables.tool_sources.every((row) => row.collector_payload?.url)).toBe(true);
    expect(proposal.tables.tool_price_observations.every((row) => row.collector_payload?.evidence_selector)).toBe(true);
    expect(proposal.tables.tool_review_attestations.every((row) => row.collector_payload?.review_attestation_id)).toBe(true);
  });

  it("conserve l'incident révoqué et applique l'attestation ToolTrim active", async () => {
    const proposal = buildStagingProposal(await wix(), { planRegistry: PLAN_REGISTRY });
    // l'incident historique reste conservé au ledger (enregistré puis révoqué)
    expect(proposal.tables.tool_review_events.map((event) => event.event_type).sort())
      .toEqual(["attestation_revoked", "incident_recorded"]);
    // deux attestations coexistent : l'incident (Test) et l'acte humain actif (ToolTrim — Mike)
    const atts = proposal.tables.tool_review_attestations;
    expect(atts).toHaveLength(2);
    expect(atts.some((a) => a.attested_by === "Test")).toBe(true);
    expect(atts.some((a) => a.attested_by === "ToolTrim — Mike" && a.revoked_at == null)).toBe(true);
    // l'attestation active rend les observations éligibles (market_context attesté)…
    expect(proposal.tables.tool_price_observations.every((row) =>
      row.review_status === "observed" && row.market_context === "reference_fr" && row.context_attestation_id !== null)).toBe(true);
    // … sans jamais les approuver : aucune ligne approved.
    expect(proposal.approved_rows).toBe(0);
  });

  it("porte D13 sans inventer une observation de prix gratuite", async () => {
    const proposal = buildStagingProposal(await wix(), { planRegistry: PLAN_REGISTRY });
    const free = proposal.tables.tool_plans.find((plan) => plan.plan_key === "free");
    expect(free).toMatchObject({ is_free: true, is_compare_plan: false, pricing_unit: "site" });
    expect(proposal.tables.tool_price_observations.some((row) => row.plan_ref.plan_key === "free")).toBe(false);
    expect(proposal.tables.tool_claims.some((claim) => claim.claim_key === "pricing.free_plan_exists" && claim.value_json === true)).toBe(true);
  });

  it("est déterministe et ne modifie pas Wix", async () => {
    const before = await readFile(WIX);
    const a = buildStagingProposal(JSON.parse(before), { planRegistry: PLAN_REGISTRY });
    const b = buildStagingProposal(JSON.parse(before), { planRegistry: PLAN_REGISTRY });
    expect(a).toEqual(b);
    expect(a.proposal_hash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(hash(await readFile(WIX))).toBe(hash(before));
  });

  it("refuse une référence de capture inconnue", async () => {
    const doc = await wix();
    doc.collector.observations[0].capture_ref = "cap:" + "0".repeat(64);
    expect(() => buildStagingProposal(doc, { planRegistry: PLAN_REGISTRY })).toThrow(/observation sans capture/);
  });

  it("mappe une relation expliquée vers une cible publiée, sans l'approuver", async () => {
    const doc = await wix();
    const capture = doc.collector.sources[0].captures[0];
    doc.collector.relationships = [{
      target_slug: "squarespace",
      relationship_type: "substitutes",
      direction: "directed",
      reason_fr: "Alternative de création de site avec hébergement intégré.",
      capture_ref: capture.capture_id,
      observed_on: "2026-07-17",
      confidence: "medium",
      status: "proposed",
    }];
    const proposal = buildStagingProposal(doc, {
      planRegistry: PLAN_REGISTRY,
      publishedTools: new Map([["wix", "wix"], ["squarespace", "squarespace"]]),
    });
    expect(proposal.tables.tool_relationships).toHaveLength(1);
    expect(proposal.tables.tool_relationships[0]).toMatchObject({
      tool_id: "wix",
      related_tool_id: "squarespace",
      rel_type: "substitutes",
      status: "proposed",
      approval_event_id: null,
      capture_collector_id: capture.capture_id,
    });
    expect(proposal.tables.tool_relationships[0].collector_id).toMatch(/^rel:[0-9a-f]{64}$/);
    expect(proposal.tables.tool_relationships[0].collector_payload.reason_fr).toBeTruthy();
  });

  it("refuse une relation sans manifeste, vers un brouillon ou sans explication", async () => {
    const doc = await wix();
    doc.collector.relationships = [{ target_slug: "draft-tool", relationship_type: "substitutes", reason_fr: "Raison" }];
    expect(() => buildStagingProposal(doc, { planRegistry: PLAN_REGISTRY })).toThrow(/catalogue publié requis/);
    expect(() => buildStagingProposal(doc, { planRegistry: PLAN_REGISTRY, publishedTools: new Map([["wix", "wix"]]) }))
      .toThrow(/cible de relation non publiée/);
    doc.collector.relationships[0].target_slug = "squarespace";
    delete doc.collector.relationships[0].reason_fr;
    expect(() => buildStagingProposal(doc, { planRegistry: PLAN_REGISTRY, publishedTools: new Map([["wix", "wix"], ["squarespace", "squarespace"]]) }))
      .toThrow(/sans explication/);
    doc.collector.relationships[0].reason_fr = "Raison sourcée";
    expect(() => buildStagingProposal(doc, { planRegistry: PLAN_REGISTRY, publishedTools: new Map([["wix", "wix"], ["squarespace", "squarespace"]]) }))
      .toThrow(/sans provenance de capture/);
  });

  it("sépare le slug public de l'identifiant SQL des relations", async () => {
    const doc = await wix();
    const capture = doc.collector.sources[0].captures[0];
    doc.slug = "kit";
    doc.collector.relationships = [{
      target_slug: "aircall",
      relationship_type: "complements",
      reason_fr: "Connexion documentée entre les deux outils.",
      capture_ref: capture.capture_id,
    }];
    const proposal = buildStagingProposal(doc, {
      planRegistry: PLAN_REGISTRY,
      toolId: "convertkit",
      publishedTools: new Map([["kit", "convertkit"], ["aircall", "aircall-inc"]]),
    });
    expect(proposal).toMatchObject({ tool_slug: "kit", tool_id: "convertkit" });
    expect(proposal.tables.tool_relationships[0]).toMatchObject({
      related_tool_slug: "aircall",
      related_tool_id: "aircall-inc",
    });
  });

  it("le validateur détecte un doublon et un approved injecté", async () => {
    const proposal = buildStagingProposal(await wix(), { planRegistry: PLAN_REGISTRY });
    const tables = structuredClone(proposal.tables);
    tables.tool_claims.push({ ...tables.tool_claims[0], status: "approved" });
    const result = validateStagingProposal(tables);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/claim dupliqué/);
    expect(result.errors.join(" ")).toMatch(/approved interdit/);
  });

  it("le validateur interdit toute publication éditoriale implicite", async () => {
    const proposal = buildStagingProposal(await wix(), { planRegistry: PLAN_REGISTRY });
    const tables = structuredClone(proposal.tables);
    tables.tool_editorial_content = [{
      tool_id: "wix", lang: "fr", content_version: 1, status: "published",
      content_hash: `sha256:${"1".repeat(64)}`,
    }];
    const result = validateStagingProposal(tables);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/publication éditoriale interdite/);
  });
});
