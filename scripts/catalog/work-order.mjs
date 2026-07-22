// Work order COMPACT et DÉTERMINISTE par outil : le seul contexte qu'un sous-agent reçoit.
// N'inclut PAS les anciens rapports ni l'historique complet — uniquement les faits actionnables.
// "même input => même work order" : dérivation pure du dossier + profil + validateurs, sans timestamp/aléa.
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadProfile } from "./profile.mjs";
import { localControls, failingControls } from "./controls.mjs";
import { stableStringify } from "./stable-json.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const WO_DIR = path.join(ROOT, "research", "work-orders");
const dossierPath = (slug) => path.join(ROOT, "research", "tool-pages", `${slug}.json`);
export const workOrderPath = (slug) => path.join(WO_DIR, `${slug}.json`);

export function buildWorkOrder(slug) {
  if (!existsSync(dossierPath(slug))) throw new Error(`dossier absent: ${slug}`);
  const doc = JSON.parse(readFileSync(dossierPath(slug), "utf8"));
  const profile = loadProfile(slug);
  const c = doc.collector || {};

  // Source officielle + captures utiles (id + hash, sans le texte brut).
  const official = (c.sources || []).find((s) => s.is_official) || (c.sources || [])[0] || null;
  const captures = (official?.captures || []).map((cap) => ({
    capture_id: cap.capture_id, content_hash: cap.content_hash, source_url: official.url,
  }));

  // Claims confirmés / conflictuels (compacts).
  const claims = (doc.claims || c.claims || []).map((cl) => ({
    key: cl.key ?? cl.claim_key, value: cl.value, status: cl.status ?? (cl.conflict ? "conflict" : "confirmed"),
  }));
  const conflicts = (c.conflicts || []).map((x) => x.claim_key ?? x.key ?? String(x));

  // Observations tarifaires (structurées, sans prose).
  const observations = (c.observations || []).map((o) => ({
    plan_key: o.plan_key, native_amount: o.native_amount, native_currency: o.native_currency,
    billing_commitment: o.billing_commitment, pricing_unit: o.pricing_unit,
    market_context: o.market_context || o.market_context_candidate || null,
    status: o.status, content_hash: o.content_hash,
  }));

  // Champs éditoriaux manquants + erreurs exactes des validateurs (contrôles en échec uniquement).
  const failing = failingControls(localControls(slug));

  // Relations candidates (depuis l'éditorial : outils cités).
  const relations = [...new Set([...(doc.editorial_drafts?.fr?.covers || []), ...(doc.editorial_drafts?.fr?.relevant_for || [])])]
    .filter((x) => typeof x === "string");

  // Décisions humaines encore requises.
  const decisions = [];
  if (observations.some((o) => o.market_context === "reference_fr"))
    decisions.push("attestation reference_fr (auto-signable si faisceau fort)");
  for (const u of c.extraction_unknowns || doc.unknowns || []) decisions.push(`unknown: ${typeof u === "string" ? u : u.field || JSON.stringify(u)}`);

  return {
    slug,
    tool_id: doc.identity?.tool_id || doc.slug || slug,
    profile: {
      pricing_url: profile.pricing_url, adapter: profile.adapter, locale: profile.locale,
      planOrder: profile.planOrder, comparePlanKey: profile.comparePlanKey,
      freePlanKey: profile.freePlanKey, marketContext: profile.marketContext, openSource: profile.openSource,
    },
    source: official ? { url: official.url, source_id: official.source_id, tier: official.source_tier, is_official: !!official.is_official } : null,
    captures,
    claims,
    conflicts,
    observations,
    relations_candidates: relations,
    validator_failures: failing,
    human_decisions: decisions,
  };
}

export function writeWorkOrder(slug) {
  mkdirSync(WO_DIR, { recursive: true });
  const wo = buildWorkOrder(slug);
  const tmp = `${workOrderPath(slug)}.tmp-${process.pid}`;
  writeFileSync(tmp, stableStringify(wo));   // sérialisation déterministe (clés triées)
  renameSync(tmp, workOrderPath(slug));
  return wo;
}
