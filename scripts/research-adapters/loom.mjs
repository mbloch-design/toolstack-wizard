// Adaptateur dédié Loom — grille loom.com/pricing (rendu navigateur playwright, constaté 2026-07).
// Réutilise strictement le contrat d'adaptateur (cf. linear.mjs / calendly.mjs) : aucun nouveau modèle.
//
// Faits établis par la page :
//  - Colonnes : Starter (gratuit), Business, Business + AI, Enterprise.
//  - Starter « $0 » : voie gratuite DURABLE, portée par le claim `pricing.free_plan_exists`,
//    JAMAIS par une observation 0 USD.
//  - Business « $18 per user / month ».
//  - Business + AI « $24 per user / month ».
//    « per user / month » fixe l'unité mensuelle -> billing_period="monthly" ; l'engagement
//    (annual_prepaid) est porté par le registre, donc billing_commitment=null ici.
//  - Enterprise « Let's Talk / Contact Sales » : sur devis, non observable (ambiguïté).
//  - Devise USD ($). Aucune mention de taxe sur la grille -> tax_inclusion inconnu (null).

const ADAPTER_VERSION = "1.0.0";

const textOf = (html) => String(html || "")
  .replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ").replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&")
  .replace(/\s+/g, " ").trim();

// Chaque plan payant : prix ancré sur la description propre du plan pour éviter que « Business »
// ne capte le prix de « Business + AI ».
const PAID = [
  {
    plan_name: "Business",
    re: /\bBusiness\b(?!\s*\+)[\s\S]{0,80}?\$\s*(\d[\d,]*)\s*per\s*user\s*\/\s*month/i,
    plan_summary: "Offre payante de référence de Loom : vidéos illimitées et édition de base pour faire avancer le travail.",
    feature_highlights: ["Everything in Starter", "Unlimited videos", "Unlimited recording length", "Custom branding", "Engagement insights"],
  },
  {
    plan_name: "Business + AI",
    re: /\bBusiness\s*\+\s*AI\b[\s\S]{0,160}?\$\s*(\d[\d,]*)\s*per\s*user\s*\/\s*month/i,
    plan_summary: "Business enrichi de Loom AI : vidéos améliorées et montées automatiquement.",
    feature_highlights: ["Everything in Business", "Loom AI", "AI-enhanced videos", "Auto-editing"],
  },
];

export function extractLoom({ html }) {
  const text = textOf(html);
  const plans = [];
  const ambiguities = [];

  for (const def of PAID) {
    const m = text.match(def.re);
    if (!m) {
      ambiguities.push({
        plan_name: def.plan_name,
        reason: "prix « per user / month » non lisible sur la grille rendue — non observable",
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
        missing: ["native_amount"], evidence_excerpt: m[0].trim(),
      });
      continue;
    }
    plans.push({
      plan_name: def.plan_name,
      native_amount: amount,
      native_currency: "USD",
      billing_period: "monthly",   // « per user / month »
      billing_commitment: null,    // décision registre (annual_prepaid), pas ici
      pricing_unit: null,
      tax_inclusion: null,
      seat_type: null,
      plan_summary: def.plan_summary,
      feature_highlights: def.feature_highlights,
      evidence_excerpt: `${def.plan_name} $${amount} per user / month`,
      evidence_selector: `pricing-card:${def.plan_name}`,
    });
  }

  // Enterprise : sur devis -> non observable.
  if (/\bEnterprise\b[\s\S]{0,80}?(Let['’]s Talk|Contact Sales)/i.test(text)) {
    ambiguities.push({
      plan_name: "Enterprise",
      reason: "tarif sur devis (« Contact Sales ») — prix non ferme, non observable",
      missing: ["firm_price"], evidence_excerpt: "Enterprise — Let's Talk / Contact Sales",
    });
  }

  const freeProven = /\bStarter\b[\s\S]{0,60}?\$\s*0\b/i.test(text) || /Get started with video communication[\s\S]{0,20}?\$\s*0/i.test(text);
  const noTaxStatement = !/(VAT|TVA|taxes?|\bHT\b|\bTTC\b|plus applicable tax|sales tax)/i.test(text);

  return {
    adapter: "loom",
    adapter_version: ADAPTER_VERSION,
    plans,
    ambiguities,
    page_proof: {
      business_found: plans.some((p) => p.plan_name === "Business"),
      business_ai_found: plans.some((p) => p.plan_name === "Business + AI"),
      business_amount: plans.find((p) => p.plan_name === "Business")?.native_amount ?? null,
      business_ai_amount: plans.find((p) => p.plan_name === "Business + AI")?.native_amount ?? null,
      enterprise_quote_only: ambiguities.some((a) => a.plan_name === "Enterprise"),
      free_plan_proven_on_grid: freeProven,
      currency_usd: /\$/.test(text),
      no_tax_statement_on_grid: noTaxStatement,
      per_user_month_display: /per\s*user\s*\/\s*month/i.test(text),
    },
  };
}
