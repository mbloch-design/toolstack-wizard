import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  normalizedText, contentHash, decideVersion, parseRobots, matchRobots,
  proveLocale, pageSignals, splitByHeadings, findAmounts, extractOffers,
  looksJsGated, retryDelayMs, assertWritable,
  decideMarketContext, frenchContentMarkers, extractWithAdapter,
  buildContextAttestation, approvedPreEligibility,
} from "./research-collector.mjs";
import { upsertSource, appendCapture, captureIdOf as captureRefOf } from "./research-model.mjs";

/* ── fixtures ───────────────────────────────────────────────────────────── */

// 1. page STATIQUE complète : plan + montant + devise + période + engagement + unité + taxe, servie en fr
const FIXTURE_STATIC_FR = `<!doctype html><html lang="fr"><body>
  <h2>Light</h2>
  <p>Pour les entrepreneurs individuels</p>
  <div class="price">€ 16 80 /mois</div>
  <p>Le prix comprend la TVA. Prix par site.</p>
  <h2>Business</h2>
  <div class="price">€ 40 80 /mois</div>
  <p>Le prix comprend la TVA. Prix par site.</p>
  <footer>Les prix affichés correspondent aux abonnements annuels, réglés en totalité au moment de l'achat.</footer>
</body></html>`;

// 2. page JS : la grille n'est pas dans le HTML initial
const FIXTURE_JS_GATED = `<!doctype html><html lang="fr"><head>
  <script>window.__PLANS__=[{name:"Light",price:1680}]</script></head>
  <body><div id="root"></div><noscript>Activez JavaScript</noscript></body></html>`;

// 3. page ambiguë : toggle mensuel/annuel + pas d'unité => aucune observation
const FIXTURE_AMBIGUOUS = `<!doctype html><html lang="fr"><body>
  <h2>Basic</h2><div>12 € /mois</div>
  <p>Paiement annuel</p><p>Paiement mensuel</p>
</body></html>`;

// 4. page en anglais alors qu'on demande fr-FR => marché/locale non prouvés
const FIXTURE_EN = `<!doctype html><html lang="en"><body>
  <h2>Pro</h2><div>$30/mo</div><p>billed annually. Price per site.</p></body></html>`;

/* ── tests ──────────────────────────────────────────────────────────────── */

describe("normalisation & hash", () => {
  it("retire scripts/styles/balises et normalise les espaces", () => {
    const t = normalizedText(`<div>A <script>var x=Date.now()</script> <style>.a{}</style>  B</div>`);
    expect(t).toBe("A B");
  });
  it("le hash ignore le bruit dynamique des scripts", () => {
    const a = `<html><script>var n=1</script><body><h2>P</h2><div>12 € /mois</div></body></html>`;
    const b = `<html><script>var n=999999</script><body><h2>P</h2><div>12 € /mois</div></body></html>`;
    expect(contentHash(normalizedText(a))).toBe(contentHash(normalizedText(b)));
  });
});

describe("idempotence : hash inchangé vs changement réel", () => {
  it("première capture => version", () => {
    expect(decideVersion(null, "sha256:aaa")).toEqual({ addVersion: true, reason: "first_capture" });
  });
  it("hash INCHANGÉ => aucune nouvelle version", () => {
    expect(decideVersion({ content_hash: "sha256:aaa" }, "sha256:aaa"))
      .toEqual({ addVersion: false, reason: "hash_unchanged" });
  });
  it("changement RÉEL => nouvelle version", () => {
    expect(decideVersion({ content_hash: "sha256:aaa" }, "sha256:bbb"))
      .toEqual({ addVersion: true, reason: "hash_changed" });
  });
  it("pas de capture (ex. 404) => jamais de version", () => {
    expect(decideVersion({ content_hash: "sha256:aaa" }, null))
      .toEqual({ addVersion: false, reason: "no_capture" });
  });
  it("un changement réel de contenu produit bien un hash différent", () => {
    const h1 = contentHash(normalizedText(FIXTURE_STATIC_FR));
    const h2 = contentHash(normalizedText(FIXTURE_STATIC_FR.replace("16 80", "17 90")));
    expect(h1).not.toBe(h2);
  });
});

describe("404 / réponses non-OK", () => {
  it("une page 404 ne produit aucun montant exploitable", () => {
    const ex = extractOffers({ html: `<html lang="fr"><body><h1>404</h1><p>Page introuvable</p></body></html>`,
      url: "https://carrd.co/pricing", headers: {}, market: "FR", locale: "fr-FR" });
    expect(ex.observations).toHaveLength(0);
    expect(ex.weak_claims).toHaveLength(0);
  });
  it("decideVersion refuse toute version sans capture (contrat non-OK => contrôle/erreur)", () => {
    expect(decideVersion(null, null).addVersion).toBe(false);
  });
});

describe("détection page JS (renderer auto)", () => {
  it("page JS => bascule navigateur nécessaire", () => {
    expect(looksJsGated(FIXTURE_JS_GATED)).toBe(true);
  });
  it("page statique complète => pas de bascule", () => {
    expect(looksJsGated(FIXTURE_STATIC_FR)).toBe(false);
  });
});

describe("extraction de montants", () => {
  it("gère la décimale scindée « € 16 80 /mois »", () => {
    const a = findAmounts(normalizedText(`<div>€ 16 80 /mois</div>`));
    expect(a[0]).toMatchObject({ native_amount: 16.8, native_currency: "EUR", billing_period: "monthly" });
  });
  it("gère « $30/mo » et « 14 USD »", () => {
    expect(findAmounts("$30/mo")[0]).toMatchObject({ native_amount: 30, native_currency: "USD", billing_period: "monthly" });
    expect(findAmounts("USD 14/month")[0]).toMatchObject({ native_amount: 14, native_currency: "USD" });
  });
});

describe("signaux de page", () => {
  it("engagement annuel détecté", () => {
    expect(pageSignals("abonnements annuels, réglés en totalité").billing_commitment).toBe("annual_prepaid");
  });
  it("toggle mensuel+annuel => engagement AMBIGU (null)", () => {
    const s = pageSignals("Paiement annuel Paiement mensuel");
    expect(s.billing_commitment).toBeNull();
    expect(s.commitment_ambiguous).toBe(true);
  });
  it("TVA incluse => ttc ; hors taxes => ht", () => {
    expect(pageSignals("Le prix comprend la TVA").tax_inclusion).toBe("ttc");
    expect(pageSignals("prices are hors taxes").tax_inclusion).toBe("ht");
  });
});

describe("preuve marché/locale — jamais déduite", () => {
  it("html lang=fr => fr-FR prouvé", () => {
    const p = proveLocale({ headers: {}, html: FIXTURE_STATIC_FR, url: "https://x.com/p", market: "FR", locale: "fr-FR" });
    expect(p.proven).toBe(true);
    expect(p.market_context).toBe("reference_fr");
  });
  it("html lang=en alors qu'on demande fr-FR => NON prouvé, contexte null", () => {
    const p = proveLocale({ headers: {}, html: FIXTURE_EN, url: "https://x.com/p", market: "FR", locale: "fr-FR" });
    expect(p.proven).toBe(false);
    expect(p.observed_market).toBeNull();
    expect(p.observed_locale).toBeNull();
    expect(p.market_context).toBeNull();
  });
  it("hôte fr.* => preuve d'hôte", () => {
    const p = proveLocale({ headers: {}, html: "<html><body></body></html>", url: "https://fr.squarespace.com/tarifs", market: "FR", locale: "fr-FR" });
    expect(p.proven).toBe(true);
    expect(p.evidence.host_is_fr).toBe("fr.squarespace.com");
  });
});

describe("promotion en observation : seulement si TOUT est résolu", () => {
  it("page statique fr complète => observations `observed`, jamais `approved`", () => {
    const ex = extractOffers({ html: FIXTURE_STATIC_FR, url: "https://x.com/p", headers: {}, market: "FR", locale: "fr-FR" });
    expect(ex.observations.length).toBeGreaterThan(0);
    const o = ex.observations.find((x) => x.plan_name === "Light");
    expect(o).toMatchObject({
      plan_name: "Light", native_amount: 16.8, native_currency: "EUR",
      billing_period: "monthly", billing_commitment: "annual_prepaid",
      pricing_unit: "site", tax_inclusion: "ttc",
      observed_market: "FR", observed_locale: "fr-FR", market_context: "reference_fr",
      status: "observed",
    });
    expect(o.evidence_excerpt).toBeTruthy();
    expect(ex.observations.some((x) => x.status === "approved")).toBe(false);
  });
  it("engagement ambigu => AUCUNE observation, seulement des weak_claims", () => {
    const ex = extractOffers({ html: FIXTURE_AMBIGUOUS, url: "https://x.com/p", headers: {}, market: "FR", locale: "fr-FR" });
    expect(ex.observations).toHaveLength(0);
    expect(ex.weak_claims.length).toBeGreaterThan(0);
    expect(ex.weak_claims[0].missing).toContain("billing_commitment");
  });
  it("locale non prouvée => AUCUNE observation même si le prix est lisible", () => {
    const ex = extractOffers({ html: FIXTURE_EN, url: "https://x.com/p", headers: {}, market: "FR", locale: "fr-FR" });
    expect(ex.observations).toHaveLength(0);
    expect(ex.weak_claims[0].missing.join()).toMatch(/observed_market/);
  });
});

describe("v0.3 — contexte marché : prouvé | déclaré | candidat", () => {
  const PROOF_UNPROVEN = { proven: false, evidence: {}, observed_market: null, observed_locale: null, market_context: null };
  const PROOF_FR = { proven: true, evidence: { html_lang_attr: "fr" }, observed_market: "FR", observed_locale: "fr-FR", market_context: "reference_fr" };
  const FR_TEXT = "Forfaits Premium € 16 80 /mois Le prix comprend la TVA abonnements annuels";

  it("PROUVÉ : signal déclaré => market_context=reference_fr", () => {
    const d = decideMarketContext({ proof: PROOF_FR, registryEntry: {}, text: FR_TEXT, market: "FR", locale: "fr-FR" });
    expect(d.market_context).toBe("reference_fr");
    expect(d.market_context_candidate).toBeNull();
    expect(d.market_context_source).toBe("proven");
  });

  it("TEXTE FRANÇAIS SEUL => JAMAIS reference_fr, seulement un CANDIDAT soumis à revue", () => {
    const d = decideMarketContext({ proof: PROOF_UNPROVEN, registryEntry: {}, text: FR_TEXT, market: "FR", locale: "fr-FR" });
    expect(d.market_context).toBeNull();                      // jamais déduit
    expect(d.market_context_candidate).toBe("reference_fr");  // candidat seulement
    expect(d.observed_market).toBeNull();
    expect(d.observed_locale).toBeNull();
    expect(d.market_context_source).toBe("content_markers_candidate_review_required");
  });

  it("DÉCLARÉ au registre => global_usd_fallback avec marché/locale nuls", () => {
    const d = decideMarketContext({
      proof: PROOF_UNPROVEN,
      registryEntry: { market_context_declared: "global_usd_fallback", market_context_justification: "grille mondiale USD" },
      text: "Pro $30/mo billed annually", market: "FR", locale: "fr-FR",
    });
    expect(d.market_context).toBe("global_usd_fallback");
    expect(d.observed_market).toBeNull();
    expect(d.observed_locale).toBeNull();
    expect(d.market_context_source).toBe("declared_in_registry");
    expect(d.market_evidence.registry_justification).toMatch(/mondiale/);
  });

  it("NI prouvé NI déclaré NI marqueurs => contexte null, aucun candidat", () => {
    const d = decideMarketContext({ proof: PROOF_UNPROVEN, registryEntry: {}, text: "Pro $30/mo", market: "FR", locale: "fr-FR" });
    expect(d.market_context).toBeNull();
    expect(d.market_context_candidate).toBeNull();
    expect(d.market_context_source).toBe("unproven");
  });

  it("les marqueurs FR sont listés comme preuves faibles", () => {
    expect(frenchContentMarkers(FR_TEXT)).toEqual(expect.arrayContaining(["TVA", "/mois", "€"]));
  });
});

describe("v0.3 — dispatch adaptateur Wix via le moteur", () => {
  const wixHtml = readFileSync(path.join(process.cwd(), "scripts/fixtures/wix-premium-fr.html"), "utf8");
  const ex = extractWithAdapter({
    adapter: "wix", html: wixHtml, url: "https://www.wix.com/premium-purchase-plan/dynamo",
    headers: {}, market: "FR", locale: "fr-FR",
    registryEntry: { market_context_declared: null },
  });

  it("produit exactement 4 observations `observed`, jamais `approved`", () => {
    expect(ex.observations).toHaveLength(4);
    expect(ex.observations.every((o) => o.status === "observed")).toBe(true);
    expect(JSON.stringify(ex)).not.toMatch(/"status":\s*"approved"/);
  });

  it("Wix : contexte marché NON prouvé => candidat soumis à revue, market_context null", () => {
    expect(ex.observations.every((o) => o.market_context === null)).toBe(true);
    expect(ex.observations.every((o) => o.market_context_candidate === "reference_fr")).toBe(true);
    expect(ex.unknowns.join(" ")).toMatch(/soumis à revue/);
  });

  it("pricing_unit reste null (non prouvée par la page)", () => {
    expect(ex.observations.every((o) => o.pricing_unit === null)).toBe(true);
  });
});

describe("v0.3.1 — billing_commitment resserré", () => {
  it("« réglés en totalité » => annual_prepaid (phrase Wix réelle, preuve VALIDE)", () => {
    const s = pageSignals("Les prix affichés correspondent aux abonnements annuels, réglés en totalité au moment de l'achat.");
    expect(s.billing_commitment).toBe("annual_prepaid");
    expect(s.signals_found.annual_prepaid_proof).toBe(true);
  });
  it("« paid in full » => annual_prepaid", () => {
    expect(pageSignals("billed yearly, paid in full upfront").billing_commitment).toBe("annual_prepaid");
  });
  // TEST NÉGATIF exigé : le signal faible seul ne doit RIEN établir
  it("NÉGATIF — « facturé annuellement » SEUL => null (ambigu, needs_review)", () => {
    const s = pageSignals("Basic 15 $/mois facturé annuellement");
    expect(s.billing_commitment).toBeNull();
    expect(s.commitment_ambiguous).toBe(true);
    expect(s.signals_found.annual_billed_weak).toBe(true);
    expect(s.signals_found.annual_prepaid_proof).toBe(false);
  });
  it("NÉGATIF — « billed annually » SEUL => null", () => {
    expect(pageSignals("Basic $15/mo billed annually").billing_commitment).toBeNull();
  });
  it("NÉGATIF — un prix avec « facturé annuellement » seul n'est jamais promu en observation", () => {
    const html = `<html lang="fr"><body><h2>Basic</h2><div>15 € /mois</div>
      <p>facturé annuellement. Prix par site.</p></body></html>`;
    const ex = extractOffers({ html, url: "https://x.com/p", headers: {}, market: "FR", locale: "fr-FR" });
    expect(ex.observations).toHaveLength(0);
    expect(ex.weak_claims[0].missing).toContain("billing_commitment");
  });
});

describe("v0.3.1 — attestation de contexte immuable", () => {
  const base = {
    slug: "wix", source_url: "https://www.wix.com/premium-purchase-plan/dynamo",
    content_hash: "sha256:abc", run_id: "run-1", accessed_at: "2026-07-17T10:00:00.000Z",
    final_url: "https://www.wix.com/premium-purchase-plan/dynamo", rendered_by: "browser", http_status: 200,
    browser_context: {
      egress_country: "FR", egress_source: "https://www.cloudflare.com/cdn-cgi/trace", egress_measured_from: "playwright_context",
      locale_requested: "fr-FR", navigator_language: "fr-FR", resolved_locale: "fr-FR", timezone: "Europe/Paris",
      visible_markers: ["TVA", "/mois"], currency_symbols_seen: ["€"], html_lang_attr: null, content_language_header: null,
    },
  };
  it("référence tous les champs exigés", () => {
    const a = buildContextAttestation(base);
    for (const k of ["source_url","content_hash","run_id","accessed_at","final_url","egress_country","egress_source",
                     "locale_requested","navigator_language","resolved_locale","timezone","visible_markers",
                     "html_lang","content_language"]) {
      expect(a, `champ manquant: ${k}`).toHaveProperty(k);
    }
    expect(a.egress_measured_from).toBe("playwright_context");
  });
  it("content-addressed : même contenu => même id (immuable)", () => {
    expect(buildContextAttestation(base).attestation_id).toBe(buildContextAttestation(base).attestation_id);
  });
  it("toute altération change l'id (inviolable)", () => {
    const a = buildContextAttestation(base);
    const b = buildContextAttestation({ ...base, browser_context: { ...base.browser_context, egress_country: "US" } });
    expect(b.attestation_id).not.toBe(a.attestation_id);
  });
  it("une attestation est produite même si le hash est inchangé (contrôle ≠ version)", () => {
    const a1 = buildContextAttestation({ ...base, run_id: "run-1", accessed_at: "2026-07-17T10:00:00.000Z" });
    const a2 = buildContextAttestation({ ...base, run_id: "run-2", accessed_at: "2026-07-17T10:05:00.000Z" });
    expect(a1.content_hash).toBe(a2.content_hash);          // même version de contenu
    expect(a2.attestation_id).not.toBe(a1.attestation_id);  // mais attestation distincte
    expect(decideVersion({ content_hash: a1.content_hash }, a2.content_hash).addVersion).toBe(false);
  });
});

describe("v0.3.1/0.3.2 — gate de pré-éligibilité approved", () => {
  // v0.3.2 : le gate exige aussi la traçabilité (plan_key, capture_ref,
  // source_url, content_hash, observed_on) — le fixture la porte donc.
  const ok = {
    plan_name: "Light", plan_name_localized: "Light", plan_key: "light", confidence: "medium",
    native_amount: 16.8, native_currency: "EUR",
    billing_period: "monthly", billing_commitment: "annual_prepaid", pricing_unit: "site",
    market_context: "reference_fr",
    source_url: "https://www.wix.com/premium-purchase-plan/dynamo",
    content_hash: "sha256:abc", observed_on: "2026-07-17",
    capture_ref: captureRefOf("https://www.wix.com/premium-purchase-plan/dynamo", "sha256:abc"),
    // le gate exige que pricing_unit soit ADOSSÉE à la capture d'une source officielle
    pricing_unit_evidence: { capture_id: captureRefOf("https://support.wix.com/en/article/number-of-sites-associated-with-a-premium-plan", "sha256:u1") },
    evidence_excerpt: "…", evidence_selector: '[data-hook="price-container"]',
  };
  const docOk = () => {
    const doc = { slug: "wix", collector: {} };
    const s1 = upsertSource(doc, { url: ok.source_url, domain: "www.wix.com", source_type: "pricing", source_tier: 1, is_official: true, purpose: "pricing" });
    appendCapture(s1, { accessed_at: "2026-07-17T12:00:00Z", content_hash: ok.content_hash });
    const s2 = upsertSource(doc, { url: "https://support.wix.com/en/article/number-of-sites-associated-with-a-premium-plan",
                                   domain: "support.wix.com", source_type: "docs", source_tier: 1, is_official: true, purpose: "pricing_unit" });
    appendCapture(s2, { accessed_at: "2026-07-17T12:00:00Z", content_hash: "sha256:u1" });
    return doc;
  };
  it("complet => éligible", () => expect(approvedPreEligibility(ok, docOk(), { now: "2026-07-17T13:00:00Z" }).eligible).toBe(true));
  it("pricing_unit null => BLOQUÉ (renforcement v0.3.1)", () => {
    const r = approvedPreEligibility({ ...ok, pricing_unit: null }, docOk(), { now: "2026-07-17T13:00:00Z" });
    expect(r.eligible).toBe(false);
    expect(r.blockers).toContain("pricing_unit manquante");
  });
  it("market_context candidat seul, sans attestation => BLOQUÉ (candidat ≠ preuve)", () => {
    const r = approvedPreEligibility({ ...ok, market_context: null, market_context_candidate: "reference_fr" }, docOk(), { now: "2026-07-17T13:00:00Z" });
    expect(r.eligible).toBe(false);
    expect(r.blockers.join(" ")).toMatch(/candidat sans attestation de revue applicable/);
  });
  it("engagement manquant sur prix payant => BLOQUÉ", () => {
    expect(approvedPreEligibility({ ...ok, billing_commitment: null }, docOk(), { now: "2026-07-17T13:00:00Z" }).eligible).toBe(false);
  });
  it("v0.3.2 — traçabilité manquante => BLOQUÉ (tous les bloqueurs listés)", () => {
    const r = approvedPreEligibility({ ...ok, plan_key: null, capture_ref: null, observed_on: null }, docOk(), { now: "2026-07-17T13:00:00Z" });
    expect(r.eligible).toBe(false);
    expect(r.blockers).toEqual(expect.arrayContaining(["plan_key manquant", "capture_ref manquant", "observed_on manquant"]));
  });
});

describe("robots.txt", () => {
  const r = parseRobots(`User-agent: *\nDisallow: /ref\nUser-agent: BadBot\nDisallow: /`);
  it("autorise /pro", () => expect(matchRobots(r.groups, "/pro").allowed).toBe(true));
  it("interdit /ref", () => expect(matchRobots(r.groups, "/ref/x").allowed).toBe(false));
});

describe("backoff / Retry-After", () => {
  it("respecte Retry-After en secondes", () => expect(retryDelayMs(1, "5")).toBe(5000));
  it("backoff exponentiel par défaut 2s→4s→8s", () => {
    expect(retryDelayMs(1, null)).toBe(2000);
    expect(retryDelayMs(2, null)).toBe(4000);
    expect(retryDelayMs(3, null)).toBe(8000);
  });
});

describe("liste blanche d'écriture", () => {
  const root = "/tmp/x";
  it("autorise research/tool-pages", () => expect(assertWritable("/tmp/x/research/tool-pages/a.json", root)).toBeTruthy());
  it("autorise research/runs", () => expect(assertWritable("/tmp/x/research/runs/r.json", root)).toBeTruthy());
  it("autorise research/cohorts", () => expect(assertWritable("/tmp/x/research/cohorts/c.json", root)).toBeTruthy());
  it("autorise .cache/tooltrim/research", () => expect(assertWritable("/tmp/x/.cache/tooltrim/research/h.json", root)).toBeTruthy());
  it("REFUSE src/data", () => expect(() => assertWritable("/tmp/x/src/data/tools_v4.json", root)).toThrow(/WRITE DENIED/));
  it("REFUSE docs", () => expect(() => assertWritable("/tmp/x/docs/x.md", root)).toThrow(/WRITE DENIED/));
});
