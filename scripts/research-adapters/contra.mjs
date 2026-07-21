// Adaptateur dédié Contra — grille contra.com/pricing.
// Réutilise strictement le contrat d'adaptateur (cf. n8n.mjs / webflow.mjs) : aucun
// nouveau modèle de données.
//
// Faits établis par la page (rendu navigateur, constaté 2026-07) :
//  - Deux offres publiques seulement : « Free » et « Pro ». AUCUN plan Enterprise.
//  - Pro affiche DEUX prix natifs USD : « $199 / yr (save 43%) » ET « or $29 / mo ».
//    -> deux observations distinctes (yearly annual_prepaid | monthly sans engagement).
//  - « /yr » établit un prépaiement annuel -> billing_commitment = annual_prepaid.
//    « /mo » seul, sans mention d'engagement -> billing_commitment = null.
//  - Devise USD ($). Aucune mention de taxe -> tax_inclusion inconnu (null).
//  - Grille par créateur individuel (« for all creatives » ; comptes individuels ;
//    aucune notion de siège/membre/workspace) -> pricing_unit = "creator".
//  - Free = voie gratuite DURABLE (« always commission-free »), portée par le claim
//    `pricing.free_plan_exists` + is_free, JAMAIS par une observation 0 USD.
//    Coût total NON nul : frais de plateforme par paiement (éditorial).

const textOf = (html) => String(html || "")
  .replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ").replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&")
  .replace(/\s+/g, " ").trim();

function proPlan(text) {
  // « Pro $199 / yr (save 43%) or $29 / mo » (le rendu répète parfois « $199 / year »).
  const yearly = text.match(/\$\s*(\d[\d,]*)\s*\/\s*(?:yr|year)\b[^$]{0,20}(?:save\s*43%)?/i);
  // Le prix mensuel Pro est TOUJOURS présenté « or $29 / mo » (jamais « $0/mo », qui
  // appartient à la colonne Free). On l'ancre sur « or … /mo » pour ne pas capter Free.
  const monthly = text.match(/\bor\s*\$\s*(\d[\d,]*)\s*\/\s*(?:mo|month)\b/i);
  const highlights = [
    "Unlimited job access",
    "Boosted ranking + discovery score insights",
    "50% off platform fees",
    "Faster payouts: 1% fee",
    "Crypto payouts: 1% fee",
    "Top priority 24/7 support",
  ];
  const evidence = (text.match(/Pro\s*\$\s*\d[\d,]*\s*\/\s*(?:yr|year)[\s\S]{0,60}/i) || [""])[0].trim()
    || "Pro $199 / yr (save 43%) or $29 / mo";
  const summary = "Offre payante Contra : frais de plateforme réduits de 50%, accès illimité aux jobs, meilleur classement et payouts accélérés.";
  const base = {
    plan_name: "Pro",
    native_currency: "USD",
    pricing_unit: "creator",           // grille par créateur individuel ; aucun siège/membre/workspace
    tax_inclusion: null,               // aucune mention de taxe -> inconnu
    seat_type: null,
    plan_summary: summary,
    feature_highlights: highlights,
    evidence_selector: "pricing-card:Pro",
  };
  const plans = [];
  if (yearly) {
    plans.push({
      ...base,
      native_amount: Number(yearly[1].replace(/[,\s]/g, "")),
      billing_period: "annual",
      billing_commitment: "annual_prepaid",   // « /yr » = prépaiement annuel
      billing_commitment_evidence: { excerpt: "$199 / yr (save 43%)", selector: "pricing-card:Pro" },
      evidence_excerpt: evidence,
    });
  }
  if (monthly) {
    plans.push({
      ...base,
      native_amount: Number(monthly[1].replace(/[,\s]/g, "")),
      billing_period: "monthly",
      billing_commitment: null,                // « /mo » seul, sans mention d'engagement
      evidence_excerpt: (text.match(/or\s*\$\s*\d[\d,]*\s*\/\s*mo\b/i) || [""])[0].trim() || "or $29 / mo",
    });
  }
  return plans;
}

export function extractContra({ html }) {
  const text = textOf(html);
  const plans = proPlan(text);

  const freeProven = /Free\s*\$\s*0\s*\/\s*(?:mo|month)|always commission-free for all creatives/i.test(text);
  const noEnterprise = !/\bEnterprise\b/i.test(text);
  const noTaxStatement = !/(VAT|TVA|taxes?|\bHT\b|\bTTC\b|plus applicable tax|sales tax)/i.test(text);

  return {
    adapter: "contra", adapter_version: "1.0.0",
    plans,
    ambiguities: [],   // pas de plan Enterprise/devis sur la grille Contra
    page_proof: {
      grid_found: /Free\s*REDUCED FEES\s*Pro|Get paid commission-free/i.test(text),
      pro_yearly_found: plans.some((p) => p.billing_period === "annual"),
      pro_monthly_found: plans.some((p) => p.billing_period === "monthly"),
      free_plan_proven_on_grid: freeProven,
      no_enterprise_plan: noEnterprise,
      no_tax_statement_on_grid: noTaxStatement,
      currency_usd: /\$/.test(text),
    },
    unknowns: [
      ...(freeProven ? [] : ["Free (voie gratuite durable) non prouvée sur la grille"]),
      "Free: porté par le claim pricing.free_plan_exists, jamais par une observation 0 USD",
      "Coût total NON nul: frais de plateforme par paiement + traitement tiers (éditorial)",
      "tax_inclusion inconnu: la grille n'établit ni HT ni TTC",
    ],
  };
}
