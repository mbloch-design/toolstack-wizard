// Contrôles DÉTERMINISTES de la factory — déplacés des yeux de Claude vers le script.
// Claude ne reçoit QUE les contrôles en échec (failingControls). Aucune décision sémantique ici :
// uniquement des invariants vérifiables mécaniquement. Deux familles :
//   - localControls(slug)         : sur le dossier research (aucun réseau)
//   - remoteControls(sql, slug…)  : sur Supabase (read-only), délègue aux invariants existants
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadProfile } from "./profile.mjs";
import { validateEditorial } from "./editorial-contract.mjs";
import { untouchedFingerprint } from "./verify-batch.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const MONEY = /(?:[$€£]\s?\d|\d[\d.,]*\s?(?:€|\$|£|USD|EUR|GBP|\/\s?mo|\/\s?mois|par mois))/i;
const TRIAL = /\b(trial|essai|free trial|days? free|jours? gratuits?)\b/i;
const dossierPath = (slug) => path.join(ROOT, "research", "tool-pages", `${slug}.json`);

const ok = (id) => ({ id, ok: true });
const ko = (id, detail) => ({ id, ok: false, detail });

/** Contrôles locaux (dossier). Retourne la liste complète {id, ok, detail?}. */
export function localControls(slug) {
  const out = [];
  if (!existsSync(dossierPath(slug))) return [ko("dossier_present", `dossier absent: ${slug}`)];
  const doc = JSON.parse(readFileSync(dossierPath(slug), "utf8"));
  let profile;
  try { profile = loadProfile(slug); } catch (e) { return [ko("profile_valide", e.message)]; }
  const c = doc.collector || {};
  const obs = c.observations || [];
  const sources = c.sources || [];

  // 1. Source officielle et provenance.
  const official = sources.find((s) => s.is_official);
  out.push(official ? ok("source_officielle") : ko("source_officielle", "aucune source is_official dans le dossier"));

  // 2. Cohérence source_id / capture_id / content_hash.
  const captures = sources.flatMap((s) => (s.captures || []).map((cap) => ({ ...cap, source_id: s.source_id })));
  const badCap = captures.find((cap) => !cap.capture_id || !cap.source_id || !/^sha256:[0-9a-f]{64}$/.test(cap.content_hash || ""));
  out.push(badCap ? ko("provenance_coherente", `capture sans id/source_id/content_hash valide: ${badCap.capture_id || "?"}`) : ok("provenance_coherente"));

  // 3. Unicité du plan comparatif (exactement un plan_key == comparePlanKey).
  const cmp = obs.filter((o) => o.plan_key === profile.comparePlanKey);
  out.push(cmp.length === 1 ? ok("plan_comparatif_unique")
    : ko("plan_comparatif_unique", `plan comparatif "${profile.comparePlanKey}" présent ${cmp.length}× (attendu 1)`));

  // 4. Cohérence plan_key (tout plan observé ⊆ planOrder).
  const known = new Set(profile.planOrder || []);
  const strayPlan = obs.map((o) => o.plan_key).find((k) => k && !known.has(k));
  out.push(strayPlan ? ko("plan_key_coherent", `plan_key hors planOrder: ${strayPlan}`) : ok("plan_key_coherent"));

  // 5. Marché / locale / devise cohérents (devise native présente, locale observée non contradictoire).
  const paid = obs.filter((o) => Number(o.native_amount) > 0);
  const noCur = paid.find((o) => !o.native_currency);
  out.push(noCur ? ko("marche_locale_devise", `observation payante sans native_currency: ${noCur.plan_key}`) : ok("marche_locale_devise"));

  // 6. Engagement de facturation (toute observation payante porte un billing_commitment).
  const noCommit = paid.find((o) => !o.billing_commitment);
  out.push(noCommit ? ko("engagement_facturation", `payant sans billing_commitment: ${noCommit.plan_key}`) : ok("engagement_facturation"));

  // 7. is_free distinct d'un essai (le plan gratuit n'est pas un trial déguisé).
  const freeObs = profile.freePlanKey ? obs.find((o) => o.plan_key === profile.freePlanKey) : null;
  const freeIsTrial = freeObs && TRIAL.test(JSON.stringify(freeObs.plan_summary || freeObs.plan_name_localized || ""));
  out.push(freeIsTrial ? ko("is_free_non_trial", `plan gratuit "${profile.freePlanKey}" décrit comme essai`) : ok("is_free_non_trial"));

  // 8. Aucun fait tarifaire dans la prose éditoriale + complétude FR/EN.
  const ve = validateEditorial(doc.editorial_drafts, { slug });
  out.push(ve.ok ? ok("editorial_complet_sans_prix") : ko("editorial_complet_sans_prix", ve.errors.slice(0, 3).join("; ")));
  const proseMoney = JSON.stringify(doc.editorial_drafts || {}).match(MONEY);
  out.push(proseMoney ? ko("prose_sans_montant", `montant en prose: ${proseMoney[0]}`) : ok("prose_sans_montant"));

  return out;
}

/** Contrôles distants (Supabase READ-ONLY) : relations publiées, fingerprint hors lot, idempotence, projection.
 *  `expected.untouchedFingerprint` = empreinte de référence avant lot (si fournie). */
export async function remoteControls(sql, slug, { batchIds = [slug], expected = {} } = {}) {
  const out = [];
  // Relations candidates → cibles publiées uniquement.
  const rel = await sql`select related_tool_id, status from catalog_private.tool_relationships
    where tool_id = ${slug}`;
  const unpublished = [];
  for (const r of rel) {
    const [t] = await sql`select data_contract from public.tools where id = ${r.related_tool_id}`;
    if (!t || t.data_contract === "legacy") unpublished.push(r.related_tool_id);
  }
  out.push(unpublished.length ? ko("relations_publiees", `relations vers non-publiés: ${unpublished.join(",")}`) : ok("relations_publiees"));

  // Fingerprint hors lot (aucune mutation collatérale).
  const fp = await untouchedFingerprint(sql, batchIds);
  if (expected.untouchedFingerprint != null)
    out.push(fp.fingerprint === expected.untouchedFingerprint ? ok("fingerprint_hors_lot")
      : ko("fingerprint_hors_lot", "empreinte hors lot divergente"));

  // État de projection : outil canonical => exactement 2 lignes (fr,en).
  const [proj] = await sql`select count(*)::int n from catalog_api.published_tool_projection where tool_id = ${slug}`;
  const [tool] = await sql`select data_contract from public.tools where id = ${slug}`;
  if (tool?.data_contract === "canonical")
    out.push(proj.n === 2 ? ok("projection_2_lignes") : ko("projection_2_lignes", `${proj.n} lignes de projection (attendu 2)`));

  return out;
}

/** Ne renvoie QUE les contrôles en échec — c'est tout ce que Claude/l'arbitre doit voir. */
export function failingControls(controls) {
  return controls.filter((c) => !c.ok).map(({ id, detail }) => ({ id, detail }));
}
