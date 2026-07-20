import { describe, it, expect, beforeEach } from "vitest";
import {
  canonicalPlanKey, observedPlanKey, businessKeyOf, valueFingerprintOf, observationIdOf,
  captureIdOf, sourceIdOf, upsertSource, appendCapture, findCapture, appendClaim,
  applyObservation, migrateLegacyObservation, resolveEffectiveMarketContext,
  approvedPreEligibility, contextPolicySatisfied,
  contextKeyOf, sourcesInvariant, ensureCollector, factFreshnessDate,
} from "./research-model.mjs";
import { hasGenuineFreeTier } from "../src/lib/pricing.ts";

/* ── contexte de test : un dossier TEMPORAIRE en mémoire ───────────────────── */
const MAPPING = { Light: "light", Essentiel: "core", Business: "business", "Business Plus": "business_elite", Gratuit: "free" };
const PRICING = "https://www.wix.com/premium-purchase-plan/dynamo";
const SUPPORT_UNIT = "https://support.wix.com/en/article/number-of-sites-associated-with-a-premium-plan";
const SUPPORT_FREE = "https://support.wix.com/en/article/building-a-website-for-free";
const H1 = "sha256:v1", H2 = "sha256:v2";

const candidate = (name, amount, hash = H1) => ({
  plan_name: name, plan_name_localized: name, seat_type: null,
  native_amount: amount, native_currency: "EUR", billing_period: "monthly",
  billing_commitment: "annual_prepaid", pricing_unit: "site",
  pricing_unit_evidence: { capture_id: captureIdOf(SUPPORT_UNIT, "sha256:u1"), source_url: SUPPORT_UNIT },
  tax_inclusion: "ttc", observed_market: null, observed_locale: null,
  market_context: null, market_context_candidate: "reference_fr",
  confidence: "medium", evidence_excerpt: "…", evidence_selector: '[data-hook="price-container"]',
  source_url: PRICING, content_hash: hash,
});

function freshDoc() {
  const doc = { slug: "wix", collector: {} };
  const src = upsertSource(doc, { url: PRICING, domain: "www.wix.com", source_type: "pricing", source_tier: 1, is_official: true, purpose: "pricing" });
  appendCapture(src, { accessed_at: "2026-07-17T10:00:00Z", content_hash: H1, http_status: 200, rendered_by: "browser" });
  const usrc = upsertSource(doc, { url: SUPPORT_UNIT, domain: "support.wix.com", source_type: "docs", source_tier: 1, is_official: true, purpose: "pricing_unit" });
  appendCapture(usrc, { accessed_at: "2026-07-17T10:00:00Z", content_hash: "sha256:u1", http_status: 200, rendered_by: "static" });
  return doc;
}
const runOnce = (doc, cands, { capture_id, now = "2026-07-17T10:00:00Z", run_id = "r1" }) =>
  cands.map((c) => applyObservation(doc, c, { capture_id, run_id, now, mapping: MAPPING, tool: "wix" }));

const CAP1 = captureIdOf(PRICING, H1);
const CAP2 = captureIdOf(PRICING, H2);
const FOUR = [candidate("Light", 16.8), candidate("Essentiel", 30), candidate("Business", 40.8), candidate("Business Plus", 178.8)];

/* ── 1. mapping canonique ─────────────────────────────────────────────────── */
describe("mapping canonique des plans", () => {
  it("mapping EXACT déclaré (jamais la slugification)", () => {
    expect(canonicalPlanKey(MAPPING, "Light")).toBe("light");
    expect(canonicalPlanKey(MAPPING, "Essentiel")).toBe("core");           // ≠ "essentiel"
    expect(canonicalPlanKey(MAPPING, "Business")).toBe("business");
    expect(canonicalPlanKey(MAPPING, "Business Plus")).toBe("business_elite"); // ≠ "business_plus"
    expect(canonicalPlanKey(MAPPING, "Gratuit")).toBe("free");
  });
  it("la clé dérivée existe seulement comme observed_plan_key", () => {
    expect(observedPlanKey("Business Plus")).toBe("business_plus");
    expect(canonicalPlanKey(MAPPING, "Business Plus")).not.toBe(observedPlanKey("Business Plus"));
  });
  it("plan non mappé => plan_key null (jamais inventé)", () => {
    expect(canonicalPlanKey(MAPPING, "Plan Inconnu")).toBeNull();
  });
  it("l'observation porte la clé canonique ET le nom localisé", () => {
    const doc = freshDoc();
    runOnce(doc, [candidate("Essentiel", 30)], { capture_id: CAP1 });
    const o = doc.collector.observations[0];
    expect(o.plan_key).toBe("core");
    expect(o.plan_name_localized).toBe("Essentiel");
    expect(o.observed_plan_key).toBe("essentiel");
    expect(o.business_key).toContain("|core|");
  });
});

/* ── 2. premier run / second run identique ────────────────────────────────── */
describe("intégration : premier run puis second run identique", () => {
  let doc;
  beforeEach(() => { doc = freshDoc(); });

  it("premier run => 4 créées", () => {
    const out = runOnce(doc, FOUR, { capture_id: CAP1 });
    expect(out.map((o) => o.outcome)).toEqual(["created", "created", "created", "created"]);
    expect(doc.collector.observations).toHaveLength(4);
  });

  it("second run IDENTIQUE => 4 no-op, aucune création, aucun conflit", () => {
    runOnce(doc, FOUR, { capture_id: CAP1 });
    const out = runOnce(doc, FOUR, { capture_id: CAP1, run_id: "r2" });
    expect(out.map((o) => o.outcome)).toEqual(["unchanged", "unchanged", "unchanged", "unchanged"]);
    expect(doc.collector.observations).toHaveLength(4);          // append-only, pas de doublon
    expect(doc.collector.conflicts).toHaveLength(0);
    expect(doc.collector.observations.every((o) => o.evidence.length === 1)).toBe(true);
  });

  it("hash inchangé => aucune nouvelle version de capture", () => {
    const src = doc.collector.sources.find((s) => s.url === PRICING);
    const r = appendCapture(src, { accessed_at: "2026-07-17T11:00:00Z", content_hash: H1 });
    expect(r.added).toBe(false);
    expect(r.reason).toBe("hash_unchanged");
    expect(src.captures).toHaveLength(1);
  });
});

/* ── 3. même valeur, nouvelle capture => nouvelle preuve ──────────────────── */
describe("intégration : même valeur confirmée par une nouvelle capture", () => {
  it("=> confirmed, evidence s'allonge, aucune nouvelle observation", () => {
    const doc = freshDoc();
    runOnce(doc, [candidate("Light", 16.8, H1)], { capture_id: CAP1 });
    const src = doc.collector.sources.find((s) => s.url === PRICING);
    expect(appendCapture(src, { accessed_at: "2026-07-18T10:00:00Z", content_hash: H2 }).added).toBe(true);
    const out = runOnce(doc, [candidate("Light", 16.8, H2)], { capture_id: CAP2, now: "2026-07-18T10:00:00Z", run_id: "r2" });
    expect(out[0].outcome).toBe("confirmed");
    expect(doc.collector.observations).toHaveLength(1);
    expect(doc.collector.observations[0].evidence.map((e) => e.capture_id)).toEqual([CAP1, CAP2]);
    expect(doc.collector.observations[0].last_confirmed_on).toBe("2026-07-18");
  });
});

/* ── 4. changement de prix simulé => conflit, les DEUX conservées ─────────── */
describe("intégration : changement de prix simulé", () => {
  it("=> conflit ouvert, ancienne superseded_candidate, aucune suppression", () => {
    const doc = freshDoc();
    runOnce(doc, [candidate("Light", 16.8, H1)], { capture_id: CAP1 });
    const out = runOnce(doc, [candidate("Light", 17.9, H2)], { capture_id: CAP2, now: "2026-07-18T10:00:00Z", run_id: "r2" });
    expect(out[0].outcome).toBe("conflicted");
    expect(doc.collector.observations).toHaveLength(2);                    // les deux conservées
    const old = doc.collector.observations.find((o) => o.native_amount === 16.8);
    const neu = doc.collector.observations.find((o) => o.native_amount === 17.9);
    expect(old.status).toBe("superseded_candidate");
    expect(neu.status).toBe("observed");
    const conflict = doc.collector.conflicts.find((c) => c.status === "open");
    expect(conflict.observation_ids).toEqual(expect.arrayContaining([old.observation_id, neu.observation_id]));
  });
});

/* ── 5. retour à une ancienne valeur ──────────────────────────────────────── */
describe("intégration : retour à une ancienne valeur", () => {
  it("=> l'ancienne observation est re-confirmée, rien n'est recréé ni perdu", () => {
    const doc = freshDoc();
    runOnce(doc, [candidate("Light", 16.8, H1)], { capture_id: CAP1 });
    runOnce(doc, [candidate("Light", 17.9, H2)], { capture_id: CAP2, now: "2026-07-18T10:00:00Z", run_id: "r2" });
    const H3 = "sha256:v3", CAP3 = captureIdOf(PRICING, H3);
    const out = runOnce(doc, [candidate("Light", 16.8, H3)], { capture_id: CAP3, now: "2026-07-19T10:00:00Z", run_id: "r3" });
    expect(out[0].outcome).toBe("confirmed");                              // pas "created"
    expect(doc.collector.observations).toHaveLength(2);                    // toujours 2 faits distincts
    const back = doc.collector.observations.find((o) => o.native_amount === 16.8);
    expect(back.status).toBe("observed");                                  // réactivée
    expect(back.evidence.map((e) => e.capture_id)).toEqual([CAP1, CAP3]);
    expect(doc.collector.observations.find((o) => o.native_amount === 17.9)).toBeTruthy(); // conservée
  });
});

/* ── 6. source support versionnée séparément ──────────────────────────────── */
describe("intégration : sources unifiées, support versionné séparément", () => {
  it("pricing et support vivent dans collector.sources[] avec leurs captures propres", () => {
    const doc = freshDoc();
    const urls = doc.collector.sources.map((s) => s.url);
    expect(urls).toEqual(expect.arrayContaining([PRICING, SUPPORT_UNIT]));
    expect(doc.collector.sources.every((s) => s.source_id.startsWith("src:"))).toBe(true);
  });
  it("une nouvelle version du support n'affecte pas les captures pricing", () => {
    const doc = freshDoc();
    const usrc = doc.collector.sources.find((s) => s.url === SUPPORT_UNIT);
    const psrc = doc.collector.sources.find((s) => s.url === PRICING);
    expect(appendCapture(usrc, { accessed_at: "2026-08-01T10:00:00Z", content_hash: "sha256:u2" }).added).toBe(true);
    expect(usrc.captures).toHaveLength(2);
    expect(psrc.captures).toHaveLength(1);                                 // indépendantes
    expect(usrc.captures[1].version).toBe(2);
  });
  it("aucun stockage parallèle : pas d'additional_sources/unit_claims", () => {
    const doc = freshDoc();
    expect(doc.collector.additional_sources).toBeUndefined();
    expect(doc.collector.unit_claims).toBeUndefined();
  });
});

/* ── 7. chaque observation/claim résout ses captures ──────────────────────── */
describe("intégration : résolution des captures", () => {
  it("l'observation résout sa capture pricing", () => {
    const doc = freshDoc();
    runOnce(doc, [candidate("Light", 16.8)], { capture_id: CAP1 });
    const o = doc.collector.observations[0];
    const cap = findCapture(doc, o.capture_ref);
    expect(cap).toBeTruthy();
    expect(cap.content_hash).toBe(o.content_hash);
    expect(cap.source.url).toBe(PRICING);
  });
  it("le claim pricing.unit résout la capture de la source SUPPORT", () => {
    const doc = freshDoc();
    const cid = captureIdOf(SUPPORT_UNIT, "sha256:u1");
    appendClaim(doc, { key: "pricing.unit", value_native: "site", capture_id: cid, source_id: sourceIdOf(SUPPORT_UNIT),
                       source_url: SUPPORT_UNIT, evidence: "A site plan cannot be used for multiple sites.",
                       confidence: "high", observed_on: "2026-07-17" });
    const claim = doc.collector.claims[0];
    expect(claim.claim_id).toMatch(/^clm:/);
    const cap = findCapture(doc, claim.capture_id);
    expect(cap.source.url).toBe(SUPPORT_UNIT);
    expect(cap.source.purpose).toBe("pricing_unit");
  });
  it("claim identique + même capture => no-op ; capture neuve => confirmé", () => {
    const doc = freshDoc();
    const c1 = captureIdOf(SUPPORT_UNIT, "sha256:u1");
    const base = { key: "pricing.unit", value_native: "site", source_url: SUPPORT_UNIT, confidence: "high", observed_on: "2026-07-17" };
    expect(appendClaim(doc, { ...base, capture_id: c1 }).outcome).toBe("created");
    expect(appendClaim(doc, { ...base, capture_id: c1 }).outcome).toBe("unchanged");
    expect(appendClaim(doc, { ...base, capture_id: captureIdOf(SUPPORT_UNIT, "sha256:u2"), observed_on: "2026-08-01" }).outcome).toBe("confirmed");
    expect(doc.collector.claims).toHaveLength(1);
    expect(doc.collector.claims[0].evidence_captures).toHaveLength(2);
  });
});

/* ── 8. plan gratuit : claim, jamais une observation 0 EUR ────────────────── */
describe("plan gratuit", () => {
  it("le fait est un CLAIM lié à sa capture support — aucune observation 0 EUR inventée", () => {
    const doc = freshDoc();
    const fsrc = upsertSource(doc, { url: SUPPORT_FREE, domain: "support.wix.com", source_type: "docs", source_tier: 1, is_official: true, purpose: "free_plan" });
    appendCapture(fsrc, { accessed_at: "2026-07-17T10:00:00Z", content_hash: "sha256:f1" });
    appendClaim(doc, { key: "pricing.free_plan_exists", value_native: true, capture_id: captureIdOf(SUPPORT_FREE, "sha256:f1"),
                       source_url: SUPPORT_FREE, evidence: "There is no obligation to upgrade unless you want to make use of our premium features.",
                       confidence: "high", observed_on: "2026-07-17" });
    const claim = doc.collector.claims.find((c) => c.key === "pricing.free_plan_exists");
    expect(claim.value_native).toBe(true);
    expect(findCapture(doc, claim.capture_id).source.purpose).toBe("free_plan");
    expect(doc.collector.observations.filter((o) => o.native_amount === 0)).toHaveLength(0);  // rien d'inventé
  });
  it("hasGenuineFreeTier reste exactement true sur le texte legacy Wix", () => {
    expect(hasGenuineFreeTier("Fonctionnalités de base")).toBe(true);       // préservé à l'identique
    expect(hasGenuineFreeTier("Essai gratuit 14 jours")).toBe(false);       // essai ≠ gratuit
  });
});

/* ── 9. gate complet ──────────────────────────────────────────────────────── */
describe("gate : reçoit le dossier et liste TOUS les bloqueurs", () => {
  const CTX_OK = { attestation_id: "sha256:ctx", content_hash: "sha256:v1", egress_country: "FR",
    egress_measured_from: "playwright_context", locale_requested: "fr-FR", navigator_language: "fr-FR",
    resolved_locale: "fr-FR", timezone: "Europe/Paris", visible_markers: ["TVA", "€"], currency_symbols_seen: ["€"] };
  const attFor = (doc) => ({ review_attestation_id: "sha256:ra", attests: "market_context", value: "reference_fr",
    basis_attestation_id: "sha256:ctx", applies_to_capture_ref: CAP1, content_hash: H1, attested_by: "Mike" });

  const ready = () => {
    const doc = freshDoc();
    doc.collector.context_attestations = [CTX_OK];
    runOnce(doc, [candidate("Light", 16.8)], { capture_id: CAP1 });
    return doc;
  };

  it("sans attestation => bloqué UNIQUEMENT sur le marché", () => {
    const doc = ready();
    const g = approvedPreEligibility(doc.collector.observations[0], doc, { mapping: MAPPING, now: "2026-07-17T10:00:00Z" });
    expect(g.eligible).toBe(false);
    expect(g.blockers).toEqual(["market_context : candidat sans attestation de revue applicable (candidat ≠ preuve)"]);
  });

  it("POSITIF — attestation valide dont la basis satisfait la politique => éligible", () => {
    const doc = ready();
    doc.review_attestations = [attFor(doc)];
    const g = approvedPreEligibility(doc.collector.observations[0], doc, { mapping: MAPPING, now: "2026-07-17T10:00:00Z" });
    expect(g.blockers).toEqual([]);
    expect(g.eligible).toBe(true);
    expect(g.effective_market_context).toBe("reference_fr");
  });

  it("NÉGATIF — basis ne satisfait plus la politique (egress US) => bloqué", () => {
    const doc = ready();
    doc.collector.context_attestations = [{ ...CTX_OK, egress_country: "US" }];
    doc.review_attestations = [attFor(doc)];
    const g = approvedPreEligibility(doc.collector.observations[0], doc, { mapping: MAPPING, now: "2026-07-17T10:00:00Z" });
    expect(g.eligible).toBe(false);
    expect(g.blockers.join(" ")).toMatch(/la basis ne satisfait plus la politique/);
  });

  it("NÉGATIF — basis introuvable => bloqué", () => {
    const doc = ready();
    doc.collector.context_attestations = [];
    doc.review_attestations = [attFor(doc)];
    const g = approvedPreEligibility(doc.collector.observations[0], doc, { mapping: MAPPING, now: "2026-07-17T10:00:00Z" });
    expect(g.blockers.join(" ")).toMatch(/basis introuvable/);
  });

  it("NÉGATIF — source absente du dossier / capture non résolue / fraîcheur / conflit / plan_key hors mapping", () => {
    const doc = ready();
    doc.review_attestations = [attFor(doc)];
    const o = doc.collector.observations[0];
    const g = approvedPreEligibility({ ...o, source_url: "https://autre.example/x", capture_ref: "cap:inconnue",
      plan_key: "plan_bidon", observed_on: "2020-01-01", last_confirmed_on: "2020-01-01", confidence: "low" }, doc,
      { mapping: MAPPING, now: "2026-07-17T10:00:00Z" });
    expect(g.eligible).toBe(false);
    expect(g.blockers).toEqual(expect.arrayContaining([
      "source absente de collector.sources",
      "capture_ref ne résout aucune capture de cette source",
      "plan_key hors mapping canonique validé (plan_bidon)",
      "confidence insuffisante (low)",
    ]));
    expect(g.blockers.some((b) => /fraîcheur dépassée/.test(b))).toBe(true);
    expect(g.blockers.length).toBeGreaterThan(4);              // TOUS les bloqueurs, pas seulement le marché
  });

  it("NÉGATIF — conflit ouvert sur la clé métier => bloqué", () => {
    const doc = ready();
    doc.review_attestations = [attFor(doc)];
    runOnce(doc, [candidate("Light", 17.9, H2)], { capture_id: CAP2, now: "2026-07-18T10:00:00Z", run_id: "r2" });
    const neu = doc.collector.observations.find((x) => x.native_amount === 17.9);
    const g = approvedPreEligibility(neu, doc, { mapping: MAPPING, now: "2026-07-18T10:00:00Z" });
    expect(g.blockers).toContain("conflit ouvert sur la clé métier");
  });

  it("NÉGATIF — pricing_unit_evidence ne résout aucune capture => bloqué", () => {
    const doc = ready();
    doc.review_attestations = [attFor(doc)];
    const o = { ...doc.collector.observations[0], pricing_unit_evidence: { capture_id: "cap:fantome" } };
    expect(approvedPreEligibility(o, doc, { mapping: MAPPING, now: "2026-07-17T10:00:00Z" }).blockers)
      .toContain("pricing_unit_evidence ne résout aucune capture");
  });
});

/* ── migration non destructive ────────────────────────────────────────────── */
describe("migration v0.3.2 -> v0.3.3", () => {
  it("recalcule les ids depuis les faits, sans rien perdre, avec la clé canonique", () => {
    const legacy = { plan_name: "Business Plus", plan_key: "business_plus", native_amount: 178.8,
      native_currency: "EUR", billing_period: "monthly", billing_commitment: "annual_prepaid",
      pricing_unit: "site", tax_inclusion: "ttc", capture_ref: CAP1, content_hash: H1,
      observed_on: "2026-07-17", status: "observed" };
    const m = migrateLegacyObservation(legacy, { mapping: MAPPING, tool: "wix" });
    expect(m.plan_key).toBe("business_elite");            // canonique, pas la slugification
    expect(m.observed_plan_key).toBe("business_plus");
    expect(m.plan_name_localized).toBe("Business Plus");
    expect(m.observation_id).toBe(observationIdOf(m.business_key, valueFingerprintOf(legacy)));
    expect(m.evidence).toEqual([{ capture_id: CAP1, observed_on: "2026-07-17" }]);
    expect(m.native_amount).toBe(178.8);                  // fait intact
  });
});


/* ── v0.3.3.1 : fraîcheur, invariants, non-collision ──────────────────────── */
describe("v0.3.3.1 — fraîcheur du fait (last_confirmed_on, fallback observed_on)", () => {
  it("observation ANCIENNE mais CONFIRMÉE récemment => FRAÎCHE", () => {
    const doc = freshDoc();
    doc.collector.context_attestations = [{ attestation_id: "sha256:ctx", content_hash: H1, egress_country: "FR",
      egress_measured_from: "playwright_context", locale_requested: "fr-FR", navigator_language: "fr-FR",
      resolved_locale: "fr-FR", timezone: "Europe/Paris", visible_markers: ["TVA", "€"], currency_symbols_seen: ["€"] }];
    runOnce(doc, [candidate("Light", 16.8)], { capture_id: CAP1, now: "2026-01-01T10:00:00Z" });
    const o = doc.collector.observations[0];
    o.last_confirmed_on = "2026-07-15";                 // reconfirmée il y a 2 jours
    expect(o.observed_on).toBe("2026-01-01");           // observée il y a ~6 mois
    const g = approvedPreEligibility(o, doc, { mapping: MAPPING, now: "2026-07-17T10:00:00Z" });
    expect(g.blockers.some((b) => /fraîcheur dépassée/.test(b))).toBe(false);
  });
  it("observation ancienne SANS reconfirmation => périmée", () => {
    const doc = freshDoc();
    runOnce(doc, [candidate("Light", 16.8)], { capture_id: CAP1, now: "2026-01-01T10:00:00Z" });
    const o = doc.collector.observations[0];
    const g = approvedPreEligibility(o, doc, { mapping: MAPPING, now: "2026-07-17T10:00:00Z" });
    expect(g.blockers.some((b) => /fraîcheur dépassée/.test(b))).toBe(true);
  });
});

describe("v0.3.3.1 — invariant source_id", () => {
  it("toute source porte un source_id valide", () => {
    const doc = freshDoc();
    expect(sourcesInvariant(doc).ok).toBe(true);
  });
  it("NÉGATIF — source pricing SANS source_id => invariant violé, puis backfillé", () => {
    const doc = freshDoc();
    delete doc.collector.sources[0].source_id;          // source pricing héritée d'une version antérieure
    expect(sourcesInvariant(doc).ok).toBe(false);
    expect(sourcesInvariant(doc).invalid[0].url).toBe(PRICING);
    ensureCollector(doc);                               // backfill
    expect(sourcesInvariant(doc).ok).toBe(true);
    expect(doc.collector.sources[0].source_id).toBe(sourceIdOf(PRICING));
  });
  it("NÉGATIF — source_id incohérent avec l'URL => invariant violé", () => {
    const doc = freshDoc();
    doc.collector.sources[0].source_id = "src:bidon";
    expect(sourcesInvariant(doc).ok).toBe(false);
  });
});

describe("v0.3.3.1 — non-collision de contexte (context_key)", () => {
  const ctxCand = { market_context_candidate: "reference_fr" };
  const ctxGlobal = { market_context: "global_usd_fallback" };
  it("candidate reference_fr ≠ global_usd_fallback", () => {
    expect(contextKeyOf(ctxCand)).toBe("candidate:reference_fr");
    expect(contextKeyOf(ctxGlobal)).toBe("global_usd_fallback");
    expect(contextKeyOf(ctxCand)).not.toBe(contextKeyOf(ctxGlobal));
  });
  it("FR/fr-FR prouvé ≠ candidate:reference_fr", () => {
    expect(contextKeyOf({ observed_market: "FR", observed_locale: "fr-FR" })).toBe("FR/fr-FR");
    expect(contextKeyOf({ observed_market: "FR", observed_locale: "fr-FR" })).not.toBe(contextKeyOf(ctxCand));
  });
  it("FR ≠ US", () => {
    expect(contextKeyOf({ observed_market: "FR", observed_locale: "fr-FR" }))
      .not.toBe(contextKeyOf({ observed_market: "US", observed_locale: "en-US" }));
  });
  it("deux observations de même prix mais contextes différents NE COLLISIONNENT PAS", () => {
    const doc = freshDoc();
    const cand = { ...candidate("Light", 16.8), market_context: null, market_context_candidate: "reference_fr" };
    const glob = { ...candidate("Light", 16.8), market_context: "global_usd_fallback", market_context_candidate: null };
    const a = applyObservation(doc, cand, { capture_id: CAP1, run_id: "r1", now: "2026-07-17T10:00:00Z", mapping: MAPPING, tool: "wix" });
    const b = applyObservation(doc, glob, { capture_id: CAP1, run_id: "r1", now: "2026-07-17T10:00:00Z", mapping: MAPPING, tool: "wix" });
    expect(a.outcome).toBe("created");
    expect(b.outcome).toBe("created");                  // PAS "conflicted" : contextes distincts
    expect(a.observation_id).not.toBe(b.observation_id);
    expect(doc.collector.conflicts.filter((x) => x.status === "open")).toHaveLength(0);
    expect(doc.collector.observations.every((o) => o.status === "observed")).toBe(true);
  });
  it("FR vs US : même plan/prix, aucun conflit", () => {
    const doc = freshDoc();
    const fr = { ...candidate("Light", 16.8), observed_market: "FR", observed_locale: "fr-FR", market_context: "reference_fr" };
    const us = { ...candidate("Light", 16.8), observed_market: "US", observed_locale: "en-US", market_context: "market_localized" };
    applyObservation(doc, fr, { capture_id: CAP1, run_id: "r1", now: "2026-07-17T10:00:00Z", mapping: MAPPING, tool: "wix" });
    const b = applyObservation(doc, us, { capture_id: CAP1, run_id: "r1", now: "2026-07-17T10:00:00Z", mapping: MAPPING, tool: "wix" });
    expect(b.outcome).toBe("created");
    expect(doc.collector.conflicts.filter((x) => x.status === "open")).toHaveLength(0);
  });
});

describe("v0.3.3.1 — conflit de claim documentaire structuré", () => {
  it("claim true puis false => conflit append-only reliant les DEUX claim_id", () => {
    const doc = freshDoc();
    const base = { key: "pricing.free_plan_exists", source_url: SUPPORT_FREE, confidence: "high" };
    const r1 = appendClaim(doc, { ...base, value_native: true, capture_id: captureIdOf(SUPPORT_FREE, "sha256:f1"), observed_on: "2026-07-17" });
    const r2 = appendClaim(doc, { ...base, value_native: false, capture_id: captureIdOf(SUPPORT_FREE, "sha256:f2"), observed_on: "2026-08-01" });
    expect(r2.outcome).toBe("conflicted");
    expect(doc.collector.claims).toHaveLength(2);                     // les deux conservées
    const cf = doc.collector.conflicts.find((x) => x.kind === "claim");
    expect(cf.status).toBe("open");
    expect(cf.claim_ids).toEqual(expect.arrayContaining([r1.claim_id, r2.claim_id]));
    expect(cf.values).toEqual(expect.arrayContaining([true, false]));
    expect(doc.collector.claims.find((c) => c.claim_id === r1.claim_id).status).toBe("superseded_candidate");
  });
});

describe("v0.3.3.1 — résolution effective marché/locale", () => {
  const ATT = { review_attestation_id: "sha256:ra", attests: "market_context", value: "reference_fr",
                basis_attestation_id: "sha256:ctx", applies_to_capture_ref: CAP1, content_hash: H1 };
  it("reference_fr attesté => effective FR / fr-FR, brut NON muté", () => {
    const doc = freshDoc();
    runOnce(doc, [candidate("Light", 16.8)], { capture_id: CAP1 });
    const o = doc.collector.observations[0];
    const before = JSON.stringify(o);
    const r = resolveEffectiveMarketContext(o, [ATT]);
    expect(r.effective_market_context).toBe("reference_fr");
    expect(r.effective_observed_market).toBe("FR");
    expect(r.effective_observed_locale).toBe("fr-FR");
    expect(JSON.stringify(o)).toBe(before);            // aucune mutation
    expect(o.observed_market).toBeNull();
  });
});
