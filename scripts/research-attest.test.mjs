import { describe, it, expect } from "vitest";
import { SUPPORTED_DECISIONS, buildReviewAttestation, findDuplicate, semanticFingerprint } from "./research-attest.mjs";
import { resolveEffectiveMarketContext, approvedPreEligibility, attestationReadiness,
         captureIdOf as captureRefOf, observedPlanKey as planKeyOf,
         upsertSource, appendCapture } from "./research-model.mjs";

/** Dossier minimal : le gate exige désormais la provenance (sources + captures). */
const MAPPING_T = { Light: "light", Essentiel: "core", Business: "business", "Business Plus": "business_elite", Gratuit: "free" };
function docWith(obs, atts = []) {
  const doc = { slug: "wix", collector: {}, review_attestations: atts };
  const s1 = upsertSource(doc, { url: obs.source_url, domain: "www.wix.com", source_type: "pricing", source_tier: 1, is_official: true, purpose: "pricing" });
  appendCapture(s1, { accessed_at: "2026-07-17T12:00:00Z", content_hash: obs.content_hash, http_status: 200 });
  const s2 = upsertSource(doc, { url: "https://support.wix.com/en/article/number-of-sites-associated-with-a-premium-plan",
                                 domain: "support.wix.com", source_type: "docs", source_tier: 1, is_official: true, purpose: "pricing_unit" });
  appendCapture(s2, { accessed_at: "2026-07-17T12:00:00Z", content_hash: "sha256:u1", http_status: 200 });
  doc.collector.context_attestations = [CTX_OK];
  return doc;
}

const SRC = "https://www.wix.com/premium-purchase-plan/dynamo";
const HASH = "sha256:8278b53421e7b9c70fc957a99951accf4a897866215bbe1aac73b961dbd05a16";
const CAPREF = captureRefOf(SRC, HASH);

/** Faisceau conforme (celui réellement mesuré sur Wix). */
const CTX_OK = {
  attestation_id: "sha256:ctx-ok", source_url: SRC, content_hash: HASH, run_id: "r1",
  accessed_at: "2026-07-17T12:40:48.852Z", final_url: SRC,
  egress_country: "FR", egress_measured_from: "playwright_context",
  egress_source: "https://www.cloudflare.com/cdn-cgi/trace",
  locale_requested: "fr-FR", navigator_language: "fr-FR", resolved_locale: "fr-FR",
  timezone: "Europe/Paris", visible_markers: ["TVA", "/mois", "abonnement annuel", "€", "forfait"],
  currency_symbols_seen: ["€"], html_lang: null, content_language: null,
};

const OBS = {
  plan_name: "Light", plan_name_localized: "Light", plan_key: "light", business_key: "wix|light|·|·|·|annual_prepaid",
  confidence: "medium",
  pricing_unit_evidence: { capture_id: captureRefOf("https://support.wix.com/en/article/number-of-sites-associated-with-a-premium-plan", "sha256:u1") },
  native_amount: 16.8, native_currency: "EUR",
  billing_period: "monthly", billing_commitment: "annual_prepaid", pricing_unit: "site",
  tax_inclusion: "ttc", market_context: null, market_context_candidate: "reference_fr",
  capture_ref: CAPREF, source_url: SRC, content_hash: HASH, observed_on: "2026-07-17",
  evidence_excerpt: "…", evidence_selector: '[data-hook="price-container"]',
};

const ATT = buildReviewAttestation({
  slug: "wix", attest: "market_context", value: "reference_fr", basis: "sha256:ctx-ok",
  applies_to_capture_ref: CAPREF, content_hash: HASH, source_url: SRC,
  by: "Mike Bloch", note: null, at: "2026-07-17T13:00:00.000Z",
});

const verify = (ctx) => SUPPORTED_DECISIONS.market_context.reference_fr.verify(ctx);

/* ── décisions supportées ─────────────────────────────────────────────────── */
describe("décisions supportées uniquement", () => {
  it("market_context=reference_fr est supportée", () => {
    expect(SUPPORTED_DECISIONS.market_context.reference_fr).toBeTruthy();
  });
  it("NÉGATIF — une décision non déclarée n'existe pas", () => {
    expect(SUPPORTED_DECISIONS.market_context?.reference_us).toBeUndefined();
    expect(SUPPORTED_DECISIONS.pricing_unit).toBeUndefined();
    expect(SUPPORTED_DECISIONS.billing_commitment).toBeUndefined();
  });
});

/* ── vérification automatique du faisceau ─────────────────────────────────── */
describe("faisceau vérifié automatiquement dans la basis", () => {
  it("POSITIF — faisceau Wix réel => ok", () => {
    expect(verify(CTX_OK)).toEqual({ ok: true, fails: [] });
  });
  it("NÉGATIF — basis US (egress_country=US) => refus", () => {
    const r = verify({ ...CTX_OK, egress_country: "US" });
    expect(r.ok).toBe(false);
    expect(r.fails.join(" ")).toMatch(/egress_country=US/);
  });
  it("NÉGATIF — egress mesuré hors contexte Playwright => refus", () => {
    const r = verify({ ...CTX_OK, egress_measured_from: "node_fetch" });
    expect(r.ok).toBe(false);
    expect(r.fails.join(" ")).toMatch(/egress_measured_from=node_fetch/);
  });
  it("NÉGATIF — locale différente (navigator en-US) => refus", () => {
    const r = verify({ ...CTX_OK, navigator_language: "en-US", resolved_locale: "en-US" });
    expect(r.ok).toBe(false);
    expect(r.fails.join(" ")).toMatch(/navigator_language=en-US/);
  });
  it("NÉGATIF — locale demandée différente => refus", () => {
    expect(verify({ ...CTX_OK, locale_requested: "en-US" }).ok).toBe(false);
  });
  it("NÉGATIF — timezone hors Europe/Paris => refus", () => {
    const r = verify({ ...CTX_OK, timezone: "America/New_York" });
    expect(r.ok).toBe(false);
    expect(r.fails.join(" ")).toMatch(/timezone=America\/New_York/);
  });
  it("NÉGATIF — marqueurs EUR/TVA incohérents ($ vu) => refus", () => {
    const r = verify({ ...CTX_OK, currency_symbols_seen: ["€", "$"] });
    expect(r.ok).toBe(false);
    expect(r.fails.join(" ")).toMatch(/devises incohérentes/);
  });
  it("NÉGATIF — aucun marqueur TVA => refus", () => {
    const r = verify({ ...CTX_OK, visible_markers: ["/mois", "€"] });
    expect(r.ok).toBe(false);
    expect(r.fails.join(" ")).toMatch(/TVA/);
  });
});

/* ── portée stricte : capture + hash ──────────────────────────────────────── */
describe("portée : capture exacte, jamais une future version", () => {
  it("l'attestation porte applies_to_capture_ref et le content_hash exact", () => {
    expect(ATT.applies_to_capture_ref).toBe(CAPREF);
    expect(ATT.content_hash).toBe(HASH);
    expect(ATT.scope_note).toMatch(/nouvelle capture exige une nouvelle attestation/);
  });
  it("POSITIF — attestation applicable => effective = reference_fr", () => {
    const r = resolveEffectiveMarketContext(OBS, [ATT]);
    expect(r.effective_market_context).toBe("reference_fr");
    expect(r.resolution).toBe("human_review_attestation");
    expect(r.applied_attestation_id).toBe(ATT.review_attestation_id);
  });
  it("NÉGATIF — hash différent (même capture_ref) => NON applicable", () => {
    const r = resolveEffectiveMarketContext({ ...OBS, content_hash: "sha256:autre" }, [ATT]);
    expect(r.effective_market_context).toBeNull();
    expect(r.resolution).toBe("candidate_without_applicable_attestation");
  });
  it("NÉGATIF — NOUVELLE CAPTURE (le contenu a changé) => l'attestation ne s'applique pas", () => {
    const newHash = "sha256:nouvelle-version";
    const newObs = { ...OBS, content_hash: newHash, capture_ref: captureRefOf(SRC, newHash) };
    expect(newObs.capture_ref).not.toBe(CAPREF);
    const r = resolveEffectiveMarketContext(newObs, [ATT]);
    expect(r.effective_market_context).toBeNull();       // jamais implicite
  });
  it("NÉGATIF — attestation inconnue/vide => non résolu", () => {
    expect(resolveEffectiveMarketContext(OBS, []).effective_market_context).toBeNull();
    expect(resolveEffectiveMarketContext(OBS, [{ review_attestation_id: "sha256:inconnue" }]).effective_market_context).toBeNull();
  });
  it("NÉGATIF — attestation révoquée => non applicable", () => {
    expect(resolveEffectiveMarketContext(OBS, [{ ...ATT, revoked_at: "2026-07-18" }]).effective_market_context).toBeNull();
  });
  it("NÉGATIF — attestation d'une autre valeur => non applicable", () => {
    expect(resolveEffectiveMarketContext(OBS, [{ ...ATT, value: "market_localized" }]).effective_market_context).toBeNull();
  });
});

/* ── doublon ──────────────────────────────────────────────────────────────── */
describe("doublon : même empreinte sémantique active", () => {
  // empreinte STABLE (hors horodatage) de l'acte de référence
  const FP = semanticFingerprint({ attest: "market_context", value: "reference_fr", basis: "sha256:ctx-ok",
    applies_to_capture_ref: CAPREF, content_hash: HASH, by: "Mike Bloch" });
  it("détecté => no-op (empreinte identique, malgré un attested_at différent)", () => {
    // même acte ré-émis à un autre instant : ID horodaté différent mais MÊME empreinte
    const later = buildReviewAttestation({ slug: "wix", attest: "market_context", value: "reference_fr", basis: "sha256:ctx-ok",
      applies_to_capture_ref: CAPREF, content_hash: HASH, source_url: SRC, by: "Mike Bloch", note: null, at: "2026-07-20T09:00:00.000Z" });
    expect(later.review_attestation_id).not.toBe(ATT.review_attestation_id); // horodatage => ID distinct
    expect(later.semantic_fingerprint).toBe(FP);                              // ... mais même empreinte
    const d = findDuplicate([ATT], FP);
    expect(d).toBeTruthy();
    expect(d.review_attestation_id).toBe(ATT.review_attestation_id);
  });
  it("autre reviewer => pas un doublon", () => {
    const fp = semanticFingerprint({ attest: "market_context", value: "reference_fr", basis: "sha256:ctx-ok",
      applies_to_capture_ref: CAPREF, content_hash: HASH, by: "Autre Personne" });
    expect(findDuplicate([ATT], fp)).toBeNull();
  });
  it("autre capture => pas un doublon", () => {
    const fp = semanticFingerprint({ attest: "market_context", value: "reference_fr", basis: "sha256:ctx-ok",
      applies_to_capture_ref: "cap:autre", content_hash: HASH, by: "Mike Bloch" });
    expect(findDuplicate([ATT], fp)).toBeNull();
  });
  it("attestation révoquée => pas un doublon (ré-attestation permise)", () => {
    expect(findDuplicate([{ ...ATT, revoked_at: "2026-07-18" }], FP)).toBeNull();
  });
  it("attestation inactive => pas un doublon (ré-attestation permise)", () => {
    expect(findDuplicate([{ ...ATT, active: false }], FP)).toBeNull();
  });
});

/* ── résolution sans mutation + gate complet ──────────────────────────────── */
describe("résolution sans mutation de la donnée brute", () => {
  it("la donnée brute reste candidate après résolution", () => {
    const before = JSON.stringify(OBS);
    const r = resolveEffectiveMarketContext(OBS, [ATT]);
    expect(r.effective_market_context).toBe("reference_fr");
    expect(JSON.stringify(OBS)).toBe(before);          // aucune mutation
    expect(OBS.market_context).toBeNull();             // brut inchangé
    expect(OBS.market_context_candidate).toBe("reference_fr");
  });
});

describe("gate complet : TOUS les bloqueurs, pas seulement le marché", () => {
  it("POSITIF — observation complète + attestation applicable => éligible", () => {
    const g = approvedPreEligibility(OBS, docWith(OBS, [ATT]), { mapping: MAPPING_T, now: "2026-07-17T13:00:00Z" });
    expect(g.eligible).toBe(true);
    expect(g.blockers).toEqual([]);
    expect(g.effective_market_context).toBe("reference_fr");
  });
  it("sans attestation => bloqué sur le marché uniquement", () => {
    const g = approvedPreEligibility(OBS, docWith(OBS, []), { mapping: MAPPING_T, now: "2026-07-17T13:00:00Z" });
    expect(g.eligible).toBe(false);
    expect(g.blockers).toEqual(["market_context : candidat sans attestation de revue applicable (candidat ≠ preuve)"]);
  });
  it("NÉGATIF — plusieurs manques => TOUS les bloqueurs listés", () => {
    const g = approvedPreEligibility({ ...OBS, plan_key: null, pricing_unit: null, billing_commitment: null, content_hash: null },
                                     docWith(OBS, []), { mapping: MAPPING_T, now: "2026-07-17T13:00:00Z" });
    expect(g.eligible).toBe(false);
    expect(g.blockers).toEqual(expect.arrayContaining([
      "plan_key manquant", "pricing_unit manquante",
      "billing_commitment manquant (prix payant)", "content_hash manquant",
    ]));
    expect(g.blockers.length).toBeGreaterThan(4);      // pas seulement le contexte marché
  });
});

/* ── prérequis de traçabilité avant l'acte humain ─────────────────────────── */
describe("l'acte humain n'est pas sollicité sans traçabilité", () => {
  it("POSITIF — observation tracée => prête", () => {
    expect(attestationReadiness(OBS)).toEqual({ ready: true, missing: [] });
  });
  it("NÉGATIF — champs de traçabilité manquants => non prête", () => {
    const r = attestationReadiness({ ...OBS, plan_key: null, capture_ref: null, observed_on: null });
    expect(r.ready).toBe(false);
    expect(r.missing).toEqual(expect.arrayContaining(["plan_key", "capture_ref", "observed_on"]));
  });
  it("plan_key est déterministe et dérivé du nom observé", () => {
    expect(planKeyOf("Business Plus")).toBe("business_plus");
    expect(planKeyOf("Essentiel")).toBe("essentiel");
  });
});
