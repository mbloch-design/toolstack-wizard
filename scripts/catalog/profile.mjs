// Profil déclaratif unifié — fusionne le registre de sources et le profil de staging en un
// seul objet, validé AVANT tout réseau. Aucun code spécifique par outil.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { STAGING_PROFILES } from "../research-stage-profiles.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const registry = () => JSON.parse(readFileSync(path.join(ROOT, "research", "sources-registry.json"), "utf8"));

/** Valide un profil unifié. Retourne { ok, errors }. Un profil invalide est rejeté avant réseau. */
export function validateProfile(p) {
  const e = [];
  if (!p?.slug || !/^[a-z0-9][a-z0-9-]*$/.test(p.slug)) e.push("slug invalide");
  if (!p?.pricing_url) e.push("pricing_url requis");
  if (!p?.renderer_hint) e.push("renderer_hint requis");
  if (!(p?.source_tier >= 1 && p?.source_tier <= 3)) e.push("source_tier ∈ {1,2,3}");
  if (!Array.isArray(p?.planOrder) || p.planOrder.length === 0) e.push("planOrder explicite requis");
  if (!p?.comparePlanKey || !p.planOrder?.includes(p.comparePlanKey)) e.push("comparePlanKey doit être dans planOrder");
  if (p?.freePlanKey && !p.planOrder?.includes(p.freePlanKey)) e.push("freePlanKey doit être dans planOrder");
  if (!p?.locale) e.push("locale requise");
  if (p?.marketContext && !["reference_fr", "market_localized", "global_usd_fallback"].includes(p.marketContext))
    e.push(`marketContext invalide: ${p.marketContext}`);
  if (p?.editorialSource && !["research", "legacy"].includes(p.editorialSource)) e.push("editorialSource ∈ {research,legacy}");
  // plan_key_mapping doit couvrir planOrder (hors freePlanKey non mappé si porté par claim)
  if (p?.plan_key_mapping) {
    const mapped = new Set(Object.values(p.plan_key_mapping));
    for (const k of p.planOrder) if (!mapped.has(k)) e.push(`planOrder '${k}' absent de plan_key_mapping`);
  }
  return { ok: e.length === 0, errors: e };
}

/** Charge le profil unifié d'un slug (registre + staging), validé. Lève si invalide. */
export function loadProfile(slug) {
  const src = registry().sources?.[slug];
  if (!src) throw new Error(`profil: ${slug} absent du registre de sources`);
  const staging = STAGING_PROFILES[slug];
  if (!staging) throw new Error(`profil: ${slug} sans profil de staging validé`);
  const profile = {
    slug,
    pricing_url: src.pricing_url, renderer_hint: src.renderer_hint, adapter: src.adapter ?? null,
    source_type: src.source_type, source_tier: src.source_tier, is_official: src.is_official,
    plan_key_mapping: src.plan_key_mapping ?? null, additional_sources: src.additional_sources ?? [],
    marketContext: src.market_context_declared ?? null,   // null => candidat dérivé (reference_fr) à la revue
    market_context_justification: src.market_context_justification ?? null,
    planOrder: staging.planOrder, comparePlanKey: staging.comparePlanKey,
    freePlanKey: staging.freePlanKey ?? null, locale: staging.locale,
    editorialSource: staging.editorialSource ?? "legacy",
  };
  const v = validateProfile(profile);
  if (!v.ok) throw new Error(`profil invalide (${slug}): ${v.errors.join("; ")}`);
  return profile;
}

/** Liste des slugs disposant d'un profil complet (registre + staging). */
export function profiledSlugs() {
  const reg = registry().sources ?? {};
  return Object.keys(STAGING_PROFILES).filter((s) => reg[s]);
}
