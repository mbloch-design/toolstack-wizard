// Adaptateur dédié Linear — grille linear.app/pricing.
// Réutilise strictement le contrat d'adaptateur (cf. calendly.mjs / contra.mjs) : aucun
// nouveau modèle de données.
//
// Faits établis par la page (rendu navigateur playwright, constaté 2026-07) :
//  - Quatre colonnes : Free, Basic, Business, Enterprise.
//  - Basic  « $10 per user/month — Billed yearly ».
//  - Business « $16 per user/month — Billed yearly ».
//    L'affichage « per user/month » fixe l'unité de prix mensuelle -> billing_period="monthly".
//    « Billed yearly » = modalité de facturation ; le registre porte l'engagement annuel
//    via annual_prepaid, donc ici billing_commitment=null (décision registre).
//  - Devise USD ($). Aucune mention de taxe sur la grille -> tax_inclusion inconnu (null).
//  - Enterprise « Custom — Annual billing only — Contact sales » : sur devis, prix non
//    ferme ni observable -> ambiguïté (needs_review), jamais une observation propre.
//  - Free « $0 — Free for everyone » : voie gratuite DURABLE, portée par le claim
//    `pricing.free_plan_exists`, JAMAIS par une observation 0 USD.

const ADAPTER_VERSION = "1.0.0";

const textOf = (html) => String(html || "")
  .replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ").replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&")
  .replace(/\s+/g, " ").trim();

// Chaque plan payant : le prix est ancré sur « <Nom> $<n> per user/month ».
const PAID = [
  {
    plan_name: "Basic",
    re: /\bBasic\b[\s\S]{0,40}?\$\s*(\d[\d,]*)\s*per\s*user\s*\/\s*month/i,
    plan_summary: "Offre payante d'entrée de Linear : au-delà du Free, jusqu'à 5 équipes, issues et uploads illimités, rôles admin.",
    feature_highlights: [
      "All Free features",
      "5 teams",
      "Unlimited issues",
      "Unlimited file uploads",
      "Admin roles",
    ],
  },
  {
    plan_name: "Business",
    re: /\bBusiness\b[\s\S]{0,40}?\$\s*(\d[\d,]*)\s*per\s*user\s*\/\s*month/i,
    plan_summary: "Offre intermédiaire de Linear : équipes illimitées, équipes privées et invités, Triage Intelligence, intégrations avancées.",
    feature_highlights: [
      "All Basic features",
      "Unlimited teams",
      "Private teams and guests",
      "Triage Intelligence",
      "Zendesk and Intercom integrations",
    ],
  },
];

export function extractLinear({ html }) {
  const text = textOf(html);

  const plans = [];
  const ambiguities = [];

  for (const def of PAID) {
    const m = text.match(def.re);
    if (!m) {
      // Prix attendu mais illisible sur la grille -> ambiguïté (jamais de prix inventé).
      ambiguities.push({
        plan_name: def.plan_name,
        reason: "prix « per user/month » non lisible sur la grille rendue — non observable",
        missing: ["native_amount"],
        evidence_excerpt: `${def.plan_name}: montant per user/month introuvable dans le rendu`,
      });
      continue;
    }
    const amount = Number(m[1].replace(/[,\s]/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      ambiguities.push({
        plan_name: def.plan_name,
        reason: "montant per user/month illisible ou non numérique — non observable",
        missing: ["native_amount"],
        evidence_excerpt: m[0].trim(),
      });
      continue;
    }
    plans.push({
      plan_name: def.plan_name,
      native_amount: amount,
      native_currency: "USD",
      // « per user/month » -> unité mensuelle, donc billing_period="monthly"
      // (« Billed yearly » = modalité de facturation, portée ailleurs par le registre).
      billing_period: "monthly",
      billing_commitment: null,   // décision registre : annual_prepaid posé par le registre, pas ici
      pricing_unit: null,
      tax_inclusion: null,        // aucune mention de taxe sur la grille -> inconnu
      seat_type: null,
      plan_summary: def.plan_summary,
      feature_highlights: def.feature_highlights,
      evidence_excerpt: `${def.plan_name} $${amount} per user/month — Billed yearly`,
      evidence_selector: `pricing-card:${def.plan_name}`,
    });
  }

  // Enterprise : « Custom — Annual billing only — Contact sales » -> sur devis, non observable.
  if (/\bEnterprise\b[\s\S]{0,60}?(Custom|Contact sales|Annual billing only)/i.test(text)) {
    ambiguities.push({
      plan_name: "Enterprise",
      reason: "tarif sur devis (« Custom », « Contact sales ») — prix non ferme, non observable",
      missing: ["firm_price"],
      evidence_excerpt: "Enterprise Custom — Annual billing only — Contact sales",
    });
  }

  const freeProven = /\bFree\b[\s\S]{0,20}?\$\s*0\b[\s\S]{0,40}?Free for everyone/i.test(text)
    || /Free for everyone/i.test(text);
  const noTaxStatement = !/(VAT|TVA|taxes?|\bHT\b|\bTTC\b|plus applicable tax|sales tax)/i.test(text);

  return {
    adapter: "linear",
    adapter_version: ADAPTER_VERSION,
    plans,
    ambiguities,
    page_proof: {
      basic_found: plans.some((p) => p.plan_name === "Basic"),
      business_found: plans.some((p) => p.plan_name === "Business"),
      basic_amount: plans.find((p) => p.plan_name === "Basic")?.native_amount ?? null,
      business_amount: plans.find((p) => p.plan_name === "Business")?.native_amount ?? null,
      enterprise_quote_only: ambiguities.some((a) => a.plan_name === "Enterprise"),
      free_plan_proven_on_grid: freeProven,
      currency_usd: /\$/.test(text),
      no_tax_statement_on_grid: noTaxStatement,
      per_user_month_display: /per\s*user\s*\/\s*month/i.test(text),
      billed_yearly_display: /Billed yearly/i.test(text),
    },
    unknowns: [
      ...(freeProven ? [] : ["Free (voie gratuite durable) non prouvée sur la grille"]),
      "Free: porté par le claim pricing.free_plan_exists, jamais par une observation 0 USD",
      "Enterprise: tarif « Custom » sur devis (contact sales) — non observable (éditorial)",
      "« Billed yearly »: engagement annuel posé par le registre (annual_prepaid), pas par l'adaptateur",
      "tax_inclusion inconnu: la grille n'établit ni HT ni TTC",
    ],
  };
}
