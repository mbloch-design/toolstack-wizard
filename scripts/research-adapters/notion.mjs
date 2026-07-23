// Adaptateur dédié Notion — grille notion.com/pricing (rendu navigateur playwright, constaté 2026-07).
// Réutilise strictement le contrat d'adaptateur (cf. linear.mjs) : aucun nouveau modèle.
//
// Faits établis par la page (grille servie en EUR depuis un egress FR) :
//  - Colonnes : Free, Plus, Business, Enterprise.
//  - Free « €0 per member / month » : voie gratuite DURABLE, portée par le claim
//    `pricing.free_plan_exists`, JAMAIS par une observation 0.
//  - Plus « €9.50 per member / month » (« For small teams and professionals »).
//  - Business « €19.50 per member / month » (« For growing businesses »).
//    « per member / month » fixe l'unité mensuelle -> billing_period="monthly" ; l'engagement
//    (annual_prepaid) est porté par le registre, donc billing_commitment=null ici.
//  - Enterprise : sur devis, non observable (ambiguïté).
//  - Devise EUR (€) via géolocalisation FR -> market_context CANDIDAT reference_fr, tranché à la
//    revue (jamais prouvé ni auto-approuvé par l'adaptateur).
//  - Modules HORS plans de siège, exclus des observations : crédits IA « $10 per 1,000 monthly
//    Notion credits » et domaines personnalisés « $8/month/domain ».

const ADAPTER_VERSION = "1.0.0";

const textOf = (html) => String(html || "")
  .replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ").replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&")
  .replace(/\s+/g, " ").trim();

// Prix ancré sur la description propre du plan (les cartes exposent « €<n> per member / month <desc> »).
const PAID = [
  {
    plan_name: "Plus",
    re: /€\s*(\d+(?:[.,]\d+)?)\s*per\s*member\s*\/\s*month\s*For small teams/i,
    plan_summary: "Premier palier payant de Notion : collaboration en petite équipe au-delà des limites du plan gratuit.",
    feature_highlights: ["Everything in Free", "Unlimited blocks for teams", "Unlimited file uploads", "30 day page history", "Invite 100 guests"],
  },
  {
    plan_name: "Business",
    re: /€\s*(\d+(?:[.,]\d+)?)\s*per\s*member\s*\/\s*month\s*For growing businesses/i,
    plan_summary: "Pour des entreprises en croissance : contrôles avancés et collaboration à plus grande échelle.",
    feature_highlights: ["Everything in Plus", "Private teamspaces", "Bulk PDF export", "Advanced page analytics", "90 day page history", "Invite 250 guests"],
  },
];

export function extractNotion({ html }) {
  const text = textOf(html);
  const plans = [];
  const ambiguities = [];

  for (const def of PAID) {
    const m = text.match(def.re);
    if (!m) {
      ambiguities.push({
        plan_name: def.plan_name,
        reason: "prix « per member / month » non lisible sur la grille rendue — non observable",
        missing: ["native_amount"],
        evidence_excerpt: `${def.plan_name}: montant per member/month introuvable dans le rendu`,
      });
      continue;
    }
    const amount = Number(m[1].replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      ambiguities.push({
        plan_name: def.plan_name,
        reason: "montant per member/month illisible ou non numérique — non observable",
        missing: ["native_amount"], evidence_excerpt: m[0].trim(),
      });
      continue;
    }
    plans.push({
      plan_name: def.plan_name,
      native_amount: amount,
      native_currency: "EUR",
      billing_period: "monthly",   // « per member / month »
      billing_commitment: null,    // décision registre (annual_prepaid), pas ici
      pricing_unit: null,          // « member » -> seat, posé par le registre
      tax_inclusion: null,
      seat_type: null,
      plan_summary: def.plan_summary,
      feature_highlights: def.feature_highlights,
      evidence_excerpt: `${def.plan_name} €${amount} per member / month`,
      evidence_selector: `pricing-card:${def.plan_name}`,
    });
  }

  // Enterprise : sur devis -> non observable.
  if (/\bEnterprise\b[\s\S]{0,80}?(Contact Sales|Get in touch|Custom)/i.test(text)) {
    ambiguities.push({
      plan_name: "Enterprise",
      reason: "tarif sur devis — prix non ferme, non observable",
      missing: ["firm_price"], evidence_excerpt: "Enterprise — Contact Sales",
    });
  }

  const freeProven = /\bFree\b[\s\S]{0,20}?€\s*0\b/i.test(text) || /€\s*0\s*per\s*member\s*\/\s*month/i.test(text);
  const noTaxStatement = !/(VAT|TVA|taxes?|\bHT\b|\bTTC\b|plus applicable tax|sales tax)/i.test(text);

  return {
    adapter: "notion",
    adapter_version: ADAPTER_VERSION,
    plans,
    ambiguities,
    page_proof: {
      plus_found: plans.some((p) => p.plan_name === "Plus"),
      business_found: plans.some((p) => p.plan_name === "Business"),
      plus_amount: plans.find((p) => p.plan_name === "Plus")?.native_amount ?? null,
      business_amount: plans.find((p) => p.plan_name === "Business")?.native_amount ?? null,
      enterprise_quote_only: ambiguities.some((a) => a.plan_name === "Enterprise"),
      free_plan_proven_on_grid: freeProven,
      currency_eur: /€/.test(text),
      no_tax_statement_on_grid: noTaxStatement,
      per_member_month_display: /per\s*member\s*\/\s*month/i.test(text),
    },
  };
}
