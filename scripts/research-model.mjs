/**
 * research-model — modèle canonique du dossier de recherche. v0.3.3
 *
 * Module PUR (aucun réseau, aucune I/O, aucune DB) : toute la logique de fond est
 * ici et donc testable en intégration sur un dossier temporaire.
 *
 * Invariants structurels :
 *  - `collector.sources[]` UNIFIÉ : la page pricing ET les sources documentaires
 *    (unité, plan gratuit) y vivent, chacune avec ses captures append-only ;
 *  - `collector.observations[]` APPEND-ONLY : jamais remplacé. Une observation est
 *    identifiée par `observation_id` = f(business_key, empreinte de valeur) ;
 *  - même fait + même valeur + même capture   => no-op ;
 *  - même valeur + NOUVELLE capture           => nouvelle preuve (evidence[] s'allonge) ;
 *  - valeur différente                        => les deux conservées, conflit ouvert,
 *                                                l'ancienne passe superseded_candidate ;
 *  - `plan_key` CANONIQUE vient d'un mapping déclaré. La slugification du nom
 *    observé n'existe que comme `observed_plan_key`, jamais comme clé de jointure.
 */

import { createHash } from "node:crypto";

const sha256 = (s) => createHash("sha256").update(s).digest("hex");
export const sortKeys = (v) =>
  Array.isArray(v) ? v.map(sortKeys)
  : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]))
  : v;

/* ─────────────────────────────── identités ──────────────────────────────── */
export const sourceIdOf = (url) => "src:" + sha256(String(url));
export const captureIdOf = (url, content_hash) => "cap:" + sha256(`${url}|${content_hash}`);

/**
 * Une observation incomplète puis complétée par une preuve documentaire n'est
 * pas un conflit de prix. Les faits économiques doivent être identiques et les
 * seuls écarts autorisés sont null/unknown -> valeur établie sur des métadonnées.
 */
export function isMetadataEnrichment(previous, current) {
  const economicKeys = [
    "plan_key", "seat_type", "native_amount", "native_currency", "billing_period",
    "billing_commitment", "observed_market", "observed_locale", "market_context",
    "market_context_candidate",
  ];
  if (economicKeys.some((k) => (previous?.[k] ?? null) !== (current?.[k] ?? null))) return false;
  const metadataKeys = ["pricing_unit", "tax_inclusion"];
  let enriched = false;
  for (const k of metadataKeys) {
    const before = previous?.[k] ?? null;
    const after = current?.[k] ?? null;
    const empty = before === null || before === "unknown";
    if (empty && after !== null && after !== "unknown") enriched = true;
    else if (before !== after) return false;
  }
  return enriched;
}

/** Clé LOCALE dérivée du nom observé. Jamais une clé de jointure canonique. */
export function observedPlanKey(plan_name) {
  return String(plan_name || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || null;
}
/** Clé CANONIQUE : uniquement via le mapping déclaré au registre. null si non mappé. */
export function canonicalPlanKey(mapping, plan_name) {
  if (!mapping || !plan_name) return null;
  if (mapping[plan_name]) return mapping[plan_name];
  const hit = Object.entries(mapping).find(([k]) => k.toLowerCase() === String(plan_name).toLowerCase());
  return hit ? hit[1] : null;
}

/**
 * v0.3.3.1 — dimension de CONTEXTE de la clé métier.
 *   1. marché/locale observés s'ils existent      -> "FR/fr-FR"
 *   2. sinon le market_context établi             -> "global_usd_fallback"
 *   3. sinon le candidat, préfixé                 -> "candidate:reference_fr"
 * Ainsi une observation `candidate:reference_fr` ne peut JAMAIS entrer en
 * collision avec `global_usd_fallback` ni avec une autre locale.
 */
export function contextKeyOf({ observed_market, observed_locale, market_context, market_context_candidate }) {
  if (observed_market && observed_locale) return `${observed_market}/${observed_locale}`;
  if (observed_market) return `${observed_market}/·`;
  if (market_context) return market_context;
  if (market_context_candidate) return `candidate:${market_context_candidate}`;
  return "·";
}

/** Clé métier : tool + plan_key + seat_type + context_key + engagement. */
export const BUSINESS_KEY_SCHEMA = 2;
export function businessKeyOf({ tool, plan_key, seat_type, billing_commitment, ...ctx }) {
  return [tool, plan_key, seat_type ?? "·", contextKeyOf(ctx), billing_commitment ?? "·"].join("|");
}
/** Empreinte de VALEUR : ce qui, s'il change, constitue un fait différent. */
export function valueFingerprintOf(o) {
  return [o.native_amount, o.native_currency, o.billing_period, o.pricing_unit ?? "·", o.tax_inclusion ?? "·"].join("|");
}
export const observationIdOf = (business_key, value_fp) => "obs:" + sha256(`${business_key}#${value_fp}`);
export const claimIdOf = (key, value) => "clm:" + sha256(`${key}#${JSON.stringify(value)}`);

/* ───────────────────────── sources & captures (unifiées) ─────────────────── */
/** Garantit la forme du dossier : tous les tableaux canoniques existent toujours. */
export function ensureCollector(doc) {
  const c = (doc.collector ??= {});
  c.sources ??= []; c.claims ??= []; c.observations ??= []; c.conflicts ??= []; c.context_attestations ??= [];
  // v0.3.3.1 — INVARIANT : toute source porte un source_id valide (backfill des
  // sources créées par une version antérieure, y compris la source pricing).
  for (const s of c.sources) if (!s.source_id && s.url) s.source_id = sourceIdOf(s.url);
  return c;
}
/** Invariant vérifiable : chaque source a un source_id valide et cohérent avec son URL. */
export function sourcesInvariant(doc) {
  const bad = (doc.collector?.sources ?? []).filter((s) => !s.source_id || s.source_id !== sourceIdOf(s.url));
  return { ok: bad.length === 0, invalid: bad.map((s) => ({ url: s.url, source_id: s.source_id ?? null })) };
}
export function upsertSource(doc, meta) {
  const c = ensureCollector(doc);
  let src = c.sources.find((s) => s.url === meta.url);
  if (!src) {
    src = { source_id: sourceIdOf(meta.url), url: meta.url, domain: meta.domain ?? null,
            source_type: meta.source_type ?? null, source_tier: meta.source_tier ?? null,
            is_official: meta.is_official ?? null, purpose: meta.purpose ?? "pricing", captures: [] };
    c.sources.push(src);
  }
  for (const k of ["domain", "source_type", "source_tier", "is_official", "purpose", "robots", "is_accessible", "last_checked_at"]) {
    if (meta[k] !== undefined) src[k] = meta[k];
  }
  src.captures ??= [];
  return src;
}
/** Capture append-only : une nouvelle VERSION seulement si le content_hash change. */
export function appendCapture(source, capture) {
  const capture_id = captureIdOf(source.url, capture.content_hash);
  const existing = source.captures.find((c) => c.capture_id === capture_id);
  if (existing) return { added: false, reason: "hash_unchanged", capture_id };
  const last = source.captures[source.captures.length - 1] ?? null;
  source.captures.push({ capture_id, version: (last?.version ?? 0) + 1, ...capture });
  return { added: true, reason: last ? "hash_changed" : "first_capture", capture_id };
}
export const findCapture = (doc, capture_id) =>
  (doc.collector?.sources ?? []).flatMap((s) => (s.captures ?? []).map((c) => ({ ...c, source: s })))
    .find((c) => c.capture_id === capture_id) ?? null;

/* ──────────────────────────── claims (append-only) ───────────────────────── */
export function appendClaim(doc, claim) {
  const c = ensureCollector(doc);
  const claim_id = claimIdOf(claim.key, claim.value_native);
  const existing = c.claims.find((x) => x.claim_id === claim_id);
  if (existing) {
    if (!existing.evidence_captures.includes(claim.capture_id)) {   // même valeur, capture neuve => preuve
      existing.evidence_captures.push(claim.capture_id);
      existing.last_confirmed_on = claim.observed_on;
      return { outcome: "confirmed", claim_id };
    }
    return { outcome: "unchanged", claim_id };
  }
  const conflicting = c.claims.filter((x) => x.key === claim.key && x.status !== "superseded_candidate");
  c.claims.push({ claim_id, ...claim, status: "observed",
                  evidence_captures: [claim.capture_id],
                  first_observed_on: claim.observed_on, last_confirmed_on: claim.observed_on });
  if (conflicting.length) {
    // v0.3.3.1 — AUCUN superseded silencieux : un conflit structuré est ouvert et
    // relie explicitement les deux claim_id. Rien n'est supprimé.
    for (const x of conflicting) x.status = "superseded_candidate";
    let cf = c.conflicts.find((x) => x.kind === "claim" && x.claim_key === claim.key && x.status === "open");
    if (!cf) { cf = { kind: "claim", claim_key: claim.key, status: "open", opened_at: claim.observed_on ?? null, claim_ids: [] }; c.conflicts.push(cf); }
    for (const id of [...conflicting.map((x) => x.claim_id), claim_id]) if (!cf.claim_ids.includes(id)) cf.claim_ids.push(id);
    cf.values = [...conflicting.map((x) => x.value_native), claim.value_native];
    return { outcome: "conflicted", claim_id, conflict: cf };
  }
  return { outcome: "created", claim_id };
}

/* ───────────────────── observations (append-only + conflits) ─────────────── */
/** Migration non destructive d'un enregistrement antérieur (v0.3.2) vers le modèle. */
export function migrateLegacyObservation(o, { mapping, tool }) {
  // v0.3.3.1 : re-clé si le schéma de clé est antérieur (ajout de context_key).
  // Les FAITS ne changent pas ; seules les clés dérivées sont recalculées.
  if (o.observation_id && o.key_schema === BUSINESS_KEY_SCHEMA) return o;
  const plan_name_localized = o.plan_name_localized ?? o.plan_name ?? null;
  const plan_key = canonicalPlanKey(mapping, plan_name_localized);
  const business_key = businessKeyOf({ tool, plan_key, seat_type: o.seat_type,
    observed_market: o.observed_market, observed_locale: o.observed_locale,
    market_context: o.market_context, market_context_candidate: o.market_context_candidate,
    billing_commitment: o.billing_commitment });
  const value_fp = valueFingerprintOf(o);
  return {
    ...o, plan_name_localized, plan_key,
    plan_key_source: plan_key ? "registry.plan_key_mapping" : null,
    observed_plan_key: o.observed_plan_key ?? observedPlanKey(plan_name_localized),
    key_schema: BUSINESS_KEY_SCHEMA, context_key: contextKeyOf(o),
    business_key, value_fingerprint: value_fp, observation_id: observationIdOf(business_key, value_fp),
    evidence: o.evidence ?? (o.capture_ref ? [{ capture_id: o.capture_ref, observed_on: o.observed_on ?? null }] : []),
    first_observed_on: o.first_observed_on ?? o.observed_on ?? null,
    last_confirmed_on: o.last_confirmed_on ?? o.observed_on ?? null,
    status: o.status === "approved" ? "observed" : (o.status ?? "observed"),
    migrated_from: "v0.3.2",
  };
}

/**
 * Applique un candidat au dossier, sans jamais écraser.
 * @returns {outcome:'unchanged'|'confirmed'|'created'|'conflicted', observation_id}
 */
export function applyObservation(doc, cand, { capture_id, run_id, now, mapping, tool }) {
  const c = ensureCollector(doc);
  const plan_key = canonicalPlanKey(mapping, cand.plan_name_localized ?? cand.plan_name);
  const business_key = businessKeyOf({ tool, plan_key, seat_type: cand.seat_type,
    observed_market: cand.observed_market, observed_locale: cand.observed_locale,
    market_context: cand.market_context, market_context_candidate: cand.market_context_candidate,
    billing_commitment: cand.billing_commitment });
  const value_fp = valueFingerprintOf(cand);
  const observation_id = observationIdOf(business_key, value_fp);
  const observed_on = (now ?? new Date().toISOString()).slice(0, 10);

  const same = c.observations.find((o) => o.observation_id === observation_id);
  if (same) {
    if (same.evidence.some((e) => e.capture_id === capture_id)) return { outcome: "unchanged", observation_id };
    same.evidence.push({ capture_id, observed_on, run_id });          // même valeur, capture neuve
    same.last_confirmed_on = observed_on;
    if (same.status === "superseded_candidate") same.status = "observed";  // retour d'une ancienne valeur
    return { outcome: "confirmed", observation_id };
  }

  const siblings = c.observations.filter((o) => o.business_key === business_key);
  const record = {
    observation_id, business_key, value_fingerprint: value_fp, tool,
    key_schema: BUSINESS_KEY_SCHEMA, context_key: contextKeyOf(cand),
    plan_key, plan_key_source: plan_key ? "registry.plan_key_mapping" : null,
    plan_name_localized: cand.plan_name_localized ?? cand.plan_name ?? null,
    observed_plan_key: observedPlanKey(cand.plan_name_localized ?? cand.plan_name),
    seat_type: cand.seat_type ?? null,
    native_amount: cand.native_amount, native_currency: cand.native_currency,
    billing_period: cand.billing_period, billing_commitment: cand.billing_commitment,
    billing_commitment_evidence: cand.billing_commitment_evidence ?? null,
    pricing_unit: cand.pricing_unit ?? null, pricing_unit_evidence: cand.pricing_unit_evidence ?? null,
    tax_inclusion: cand.tax_inclusion ?? null, tax_evidence: cand.tax_evidence ?? null,
    observed_market: cand.observed_market ?? null, observed_locale: cand.observed_locale ?? null,
    market_context: cand.market_context ?? null, market_context_candidate: cand.market_context_candidate ?? null,
    market_context_source: cand.market_context_source ?? null, market_evidence: cand.market_evidence ?? null,
    evidence_excerpt: cand.evidence_excerpt ?? null, evidence_selector: cand.evidence_selector ?? null,
    plan_summary: cand.plan_summary ?? null,
    feature_highlights: Array.isArray(cand.feature_highlights) ? cand.feature_highlights : [],
    confidence: cand.confidence ?? "medium", status: "observed",
    source_url: cand.source_url ?? null, content_hash: cand.content_hash ?? null,
    capture_ref: capture_id, observed_on,
    evidence: [{ capture_id, observed_on, run_id }],
    first_observed_on: observed_on, last_confirmed_on: observed_on,
  };
  c.observations.push(record);                                        // append-only

  if (siblings.length) {                                              // valeur différente => conflit
    for (const s of siblings) if (s.status === "observed") s.status = "superseded_candidate";
    if (siblings.every((s) => isMetadataEnrichment(s, record))) {
      c.conflicts.push({
        business_key, kind: "metadata_enrichment", status: "resolved",
        opened_at: now ?? null, resolved_at: now ?? null,
        resolution: "observation complétée par une preuve documentaire ; faits économiques inchangés",
        observation_ids: [...siblings.map((s) => s.observation_id), observation_id],
      });
      return { outcome: "created", observation_id, metadata_enrichment: true };
    }
    let conflict = c.conflicts.find((x) => x.business_key === business_key && x.status === "open");
    if (!conflict) { conflict = { business_key, status: "open", opened_at: now ?? null, observation_ids: [] }; c.conflicts.push(conflict); }
    for (const id of [...siblings.map((s) => s.observation_id), observation_id])
      if (!conflict.observation_ids.includes(id)) conflict.observation_ids.push(id);
    return { outcome: "conflicted", observation_id };
  }
  return { outcome: "created", observation_id };
}

/* ─────────────────── résolution du contexte marché (sans mutation) ────────── */
/** Contexte -> couple marché/locale impliqué. Table explicite, jamais déduite. */
export const CONTEXT_MARKET_LOCALE = { reference_fr: { market: "FR", locale: "fr-FR" } };

/**
 * Résout SANS MUTER le brut. Retourne aussi le marché/locale effectifs impliqués
 * par le contexte attesté (le gate vérifie ensuite leur cohérence).
 */
export function resolveEffectiveMarketContext(observation, reviewAttestations = []) {
  const nil = { effective_market_context: null, effective_observed_market: null, effective_observed_locale: null, applied_attestation_id: null };
  if (observation?.market_context) {
    const m = CONTEXT_MARKET_LOCALE[observation.market_context] ?? null;
    return { ...nil, effective_market_context: observation.market_context,
             effective_observed_market: observation.observed_market ?? m?.market ?? null,
             effective_observed_locale: observation.observed_locale ?? m?.locale ?? null,
             resolution: "proven_or_declared" };
  }
  const cand = observation?.market_context_candidate ?? null;
  if (!cand) return { ...nil, resolution: "no_candidate" };
  const hit = (reviewAttestations || []).find((a) =>
    a && a.attests === "market_context" && a.value === cand &&
    !a.revoked_at && a.active !== false &&          // révoquée OU inactive => jamais applicable
    a.applies_to_capture_ref === observation.capture_ref && a.content_hash === observation.content_hash);
  if (!hit) return { ...nil, resolution: "candidate_without_applicable_attestation" };
  const m = CONTEXT_MARKET_LOCALE[cand] ?? null;
  return { effective_market_context: cand,
           effective_observed_market: m?.market ?? null, effective_observed_locale: m?.locale ?? null,
           resolution: "human_review_attestation", applied_attestation_id: hit.review_attestation_id };
}

/** Fraîcheur du FAIT : dernière confirmation, à défaut première observation. */
export function factFreshnessDate(o) { return o?.last_confirmed_on ?? o?.observed_on ?? null; }

/** Politique de contexte exigée pour attester reference_fr (re-vérifiée par le gate). */
export function contextPolicySatisfied(ctx) {
  if (!ctx) return { ok: false, fails: ["basis absente"] };
  const fails = [];
  if (ctx.egress_country !== "FR") fails.push("egress_country ≠ FR");
  if (ctx.egress_measured_from !== "playwright_context") fails.push("egress non mesuré depuis le contexte Playwright");
  if (ctx.locale_requested !== "fr-FR") fails.push("locale_requested ≠ fr-FR");
  if (!/^fr-FR$/i.test(ctx.navigator_language ?? "")) fails.push("navigator_language ≠ fr-FR");
  if (!/^fr-FR$/i.test(ctx.resolved_locale ?? "")) fails.push("resolved_locale ≠ fr-FR");
  if (ctx.timezone !== "Europe/Paris") fails.push("timezone ≠ Europe/Paris");
  const syms = ctx.currency_symbols_seen ?? [];
  if (!syms.includes("€") && !(ctx.visible_markers ?? []).includes("€")) fails.push("marqueur EUR absent");
  if (!(ctx.visible_markers ?? []).includes("TVA")) fails.push("marqueur TVA absent");
  if (syms.some((x) => x !== "€")) fails.push("devises incohérentes");
  return { ok: fails.length === 0, fails };
}

export function attestationReadiness(o) {
  const missing = [];
  for (const k of ["plan_key", "capture_ref", "source_url", "content_hash", "observed_on"]) if (!o?.[k]) missing.push(k);
  return { ready: missing.length === 0, missing };
}

/* ────────────── gate : reçoit le DOSSIER (provenance), pas l'obs isolée ───── */
export function approvedPreEligibility(o, doc = {}, { mapping = null, now = new Date().toISOString(), freshnessDays = 90 } = {}) {
  const blockers = [];
  const reviewAtts = doc.review_attestations ?? [];
  const res = resolveEffectiveMarketContext(o, reviewAtts);

  // champs
  if (!o?.plan_name_localized && !o?.plan_name) blockers.push("plan_name manquant");
  if (!o?.plan_key) blockers.push("plan_key manquant");
  else if (mapping && !Object.values(mapping).includes(o.plan_key)) blockers.push(`plan_key hors mapping canonique validé (${o.plan_key})`);
  if (o?.native_amount == null) blockers.push("native_amount manquant");
  if (!o?.native_currency) blockers.push("native_currency manquante");
  if (!o?.billing_period) blockers.push("billing_period manquante");
  if ((o?.native_amount ?? 0) > 0 && !o?.billing_commitment) blockers.push("billing_commitment manquant (prix payant)");
  if (!o?.pricing_unit) blockers.push("pricing_unit manquante");
  if (!o?.observed_on) blockers.push("observed_on manquant");
  if (!o?.evidence_excerpt && !o?.evidence_selector) blockers.push("preuve absente");
  if (!["medium", "high"].includes(o?.confidence)) blockers.push(`confidence insuffisante (${o?.confidence ?? "null"})`);

  // provenance : la source doit exister dans le dossier, officielle niveau 1
  const src = (doc.collector?.sources ?? []).find((s) => s.url === o?.source_url);
  if (!src) blockers.push("source absente de collector.sources");
  else {
    if (src.source_tier !== 1) blockers.push(`source non niveau 1 (tier=${src.source_tier})`);
    if (!src.is_official) blockers.push("source non officielle");
  }
  // capture_ref doit résoudre une capture EXISTANTE de cette source
  if (!o?.capture_ref) blockers.push("capture_ref manquant");
  else {
    const cap = src ? (src.captures ?? []).find((c) => c.capture_id === o.capture_ref) : null;
    if (!cap) blockers.push("capture_ref ne résout aucune capture de cette source");
    else if (o.content_hash && cap.content_hash !== o.content_hash) blockers.push("content_hash incohérent avec la capture");
  }
  if (!o?.content_hash) blockers.push("content_hash manquant");

  // pricing_unit_evidence doit résoudre la capture de la source support
  if (o?.pricing_unit) {
    const ev = o.pricing_unit_evidence;
    if (!ev?.capture_id) blockers.push("pricing_unit_evidence sans capture_id");
    else if (!findCapture(doc, ev.capture_id)) blockers.push("pricing_unit_evidence ne résout aucune capture");
  }

  // cohérence is_free / montant
  const freeClaim = (doc.collector?.claims ?? []).find((c) => c.key === "pricing.free_plan_exists" && c.status === "observed");
  if (o?.plan_key === "free" && (o?.native_amount ?? null) !== 0) blockers.push("plan gratuit avec montant ≠ 0");
  if (o?.plan_key !== "free" && o?.native_amount === 0) blockers.push("montant 0 sur un plan non gratuit");
  if (o?.is_free === true && (o?.native_amount ?? 0) > 0) blockers.push("is_free incohérent avec native_amount > 0");
  void freeClaim;

  // conflit ouvert sur la clé métier
  const openConflict = (doc.collector?.conflicts ?? []).find((c) => c.business_key === o?.business_key && c.status === "open");
  if (openConflict) blockers.push("conflit ouvert sur la clé métier");
  if (o?.status === "superseded_candidate") blockers.push("observation superseded_candidate");

  // fraîcheur du FAIT : dernière confirmation, à défaut première observation
  const freshRef = factFreshnessDate(o);
  if (freshRef) {
    const age = (Date.parse(now) - Date.parse(freshRef)) / 86400000;
    if (!Number.isFinite(age)) blockers.push("date de fraîcheur invalide");
    else if (age > freshnessDays) blockers.push(`fraîcheur dépassée (${Math.round(age)} j > ${freshnessDays}, réf. ${freshRef})`);
  }

  // contexte marché : attestation valide, non révoquée, basis existante ET conforme
  if (!res.effective_market_context) {
    blockers.push(res.resolution === "candidate_without_applicable_attestation"
      ? "market_context : candidat sans attestation de revue applicable (candidat ≠ preuve)"
      : "market_context non établi");
  } else {
    // cohérence OBLIGATOIRE : le contexte effectif implique son marché/locale
    const expect = CONTEXT_MARKET_LOCALE[res.effective_market_context] ?? null;
    if (expect && (res.effective_observed_market !== expect.market || res.effective_observed_locale !== expect.locale)) {
      blockers.push(`incohérence contexte effectif : ${res.effective_market_context} implique ${expect.market}/${expect.locale}, obtenu ${res.effective_observed_market ?? "null"}/${res.effective_observed_locale ?? "null"}`);
    }
  }
  if (res.resolution === "human_review_attestation") {
    const att = reviewAtts.find((a) => a.review_attestation_id === res.applied_attestation_id);
    const basis = (doc.collector?.context_attestations ?? []).find((a) => a.attestation_id === att?.basis_attestation_id);
    if (!basis) blockers.push("attestation de revue : basis introuvable dans le dossier");
    else {
      const pol = contextPolicySatisfied(basis);
      if (!pol.ok) blockers.push(`attestation de revue : la basis ne satisfait plus la politique (${pol.fails.join(", ")})`);
    }
  }
  return { eligible: blockers.length === 0, blockers, ...res };
}
