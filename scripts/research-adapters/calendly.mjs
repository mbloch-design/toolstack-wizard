// Adaptateur dédié Calendly — grille calendly.com/pricing.
// Réutilise strictement le contrat d'adaptateur (cf. contra.mjs / n8n.mjs) : aucun
// nouveau modèle de données.
//
// Faits établis par la page (JSON-LD Offer structuré, constaté 2026-07) :
//  - La page émet des Offers en 3 devises (USD/GBP/EUR) pour chaque plan. Décision
//    registre : global_usd_fallback -> on ne promeut QUE les Offers USD.
//  - Free Plan (USD) = 0.00 : voie gratuite DURABLE (« Always free », « For personal
//    use »). Portée par le claim `pricing.free_plan_exists`, JAMAIS par une observation 0 USD.
//  - Standard Plan (USD) = 10.00, Teams Plan (USD) = 16.00. priceSpecification :
//    unitText « seat/month » -> pricing_unit=seat, billing_period=monthly (prix « /mo »).
//    billingDuration « P1Y » (affiché « Billed yearly »/« Save 16-20% ») -> annual_prepaid.
//  - Enterprise Plan (USD) porte « Starting at $15,000/year. Contact us for details;
//    price may vary » : plancher sur devis (contact sales), PAS un prix ferme observable
//    -> ambiguïté (needs_review), jamais une observation seat propre.
//  - Aucune mention de taxe sur la grille -> tax_inclusion inconnu (null).

const OFFER_RE = /\{\s*"@type"\s*:\s*"Offer"[\s\S]*?"priceCurrency"\s*:\s*"([A-Z]{3})"[\s\S]*?\}(?:\s*\})?/g;

// Extrait toutes les Offers JSON-LD de façon robuste (chaque bloc ld+json parsé).
function jsonLdOffers(html) {
  const offers = [];
  const blocks = [...String(html || "").matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(walk);
    const types = [].concat(node["@type"] || []).map(String);
    if (types.some((t) => /Offer/i.test(t)) && node.priceCurrency) offers.push(node);
    for (const v of Object.values(node)) if (v && typeof v === "object") walk(v);
  };
  for (const b of blocks) { try { walk(JSON.parse(b)); } catch { /* JSON-LD invalide ignoré */ } }
  return offers;
}

const num = (s) => Number(String(s).replace(/[,\s]/g, ""));
const periodOf = (unitText) => /month|mo\b/i.test(unitText || "") ? "monthly"
  : /yr|year/i.test(unitText || "") ? "annual" : null;

export function extractCalendly({ html }) {
  const offers = jsonLdOffers(html);
  const usd = offers.filter((o) => String(o.priceCurrency).toUpperCase() === "USD");

  const plans = [];
  const ambiguities = [];

  for (const o of usd) {
    const name = String(o.name || "").replace(/\s*\((USD|GBP|EUR)\)\s*$/i, "").trim();
    const spec = o.priceSpecification || {};
    const amount = num(o.price ?? spec.price);
    const desc = String(spec.description || "");

    // Free : porté par le claim pricing.free_plan_exists, jamais d'observation 0 USD.
    if (/^Free\b/i.test(name) || amount === 0) continue;

    // Enterprise : plancher sur devis (« Contact us »/« price may vary ») -> ambiguïté.
    if (/^Enterprise\b/i.test(name) || /contact us|price may vary|starting at/i.test(desc)) {
      ambiguities.push({
        plan_name: name || "Enterprise",
        reason: "plancher tarifaire sur devis (contact sales) — prix non ferme, non observable",
        missing: ["firm_price"],
        evidence_excerpt: desc || `${name}: contact sales`,
      });
      continue;
    }

    if (!Number.isFinite(amount) || amount <= 0 || !name) continue;

    const unitText = spec.unitText || "";
    const annual = /P1Y/i.test(spec.billingDuration || "");
    plans.push({
      plan_name: name,
      native_amount: amount,
      native_currency: "USD",
      billing_period: periodOf(unitText) || "monthly",
      billing_commitment: annual ? "annual_prepaid" : null,
      billing_commitment_evidence: annual
        ? { excerpt: `${name} $${amount} /seat/mo — Billed yearly (billingDuration P1Y)`, selector: "jsonld:Offer:priceSpecification" }
        : undefined,
      pricing_unit: /seat/i.test(unitText) ? "seat" : null,
      tax_inclusion: null,   // aucune mention de taxe sur la grille -> inconnu
      seat_type: null,
      plan_summary: null,
      feature_highlights: [],
      evidence_excerpt: `JSON-LD Offer: ${name} ${amount} USD (${unitText}${annual ? ", P1Y" : ""})`,
      evidence_selector: "jsonld:Offer",
    });
  }

  const text = String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const freeProven = /Always free|Free Plan \(USD\)/i.test(html) || /Always free/i.test(text);

  return {
    adapter: "calendly", adapter_version: "1.0.0",
    plans,
    ambiguities,
    page_proof: {
      jsonld_offers_total: offers.length,
      usd_offers: usd.length,
      paid_plans_promoted: plans.length,
      standard_found: plans.some((p) => /Standard/i.test(p.plan_name)),
      teams_found: plans.some((p) => /Teams/i.test(p.plan_name)),
      enterprise_quote_only: ambiguities.some((a) => /Enterprise/i.test(a.plan_name)),
      free_plan_proven_on_grid: freeProven,
      seat_unit: plans.every((p) => p.pricing_unit === "seat"),
    },
    unknowns: [
      ...(freeProven ? [] : ["Free (voie gratuite durable) non prouvée sur la grille"]),
      "Free: porté par le claim pricing.free_plan_exists, jamais par une observation 0 USD",
      "Enterprise: plancher « Starting at $15,000/year » sur devis (contact sales) — non observable (éditorial)",
      "tax_inclusion inconnu: la grille n'établit ni HT ni TTC",
    ],
  };
}
