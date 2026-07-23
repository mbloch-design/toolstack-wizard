// Adaptateur dédié Google Workspace — grille workspace.google.com/pricing (rendu playwright, 2026-07).
// Contrat d'adaptateur identique (cf. notion.mjs) : aucun nouveau modèle.
//
// Faits établis par la page (grille EUR servie depuis un egress FR) :
//  - Trois offres Business chiffrées + Enterprise sur devis, dans cet ordre :
//      Business Starter  « € 6,80 par utilisateur et par mois »
//      Business Standard « € 13,60 par utilisateur et par mois »
//      Business Plus     « € 21,10 par utilisateur et par mois »
//  - AUCUN palier gratuit (essai uniquement) → pas de plan free ; free_plan_exists NON déclaré.
//  - Enterprise : sur devis, non observable.
//  - Devise EUR (€) via géolocalisation FR → market_context CANDIDAT reference_fr (tranché à la revue).
//  - « par utilisateur et par mois » fixe l'unité mensuelle → billing_period="monthly" ; l'engagement
//    (annual_prepaid) est porté par le registre, donc billing_commitment=null ici.

const ADAPTER_VERSION = "1.0.0";

const textOf = (html) => String(html || "")
  .replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ").replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&")
  .replace(/\s+/g, " ").trim();

// Les trois offres Business chiffrées, dans l'ordre des cartes de la grille.
const PAID_SEQUENCE = [
  { plan_name: "Business Starter",  plan_summary: "Offre d'entrée de Google Workspace : messagerie pro, visioconférence et 30 Go de stockage par utilisateur.", feature_highlights: ["Gmail professionnel", "Meet 100 participants", "30 Go / utilisateur", "Contrôles de sécurité standard"] },
  { plan_name: "Business Standard", plan_summary: "Offre intermédiaire : plus de stockage et des réunions enrichies pour les équipes qui collaborent au quotidien.", feature_highlights: ["Tout Business Starter", "2 To / utilisateur", "Meet 150 participants + enregistrement", "Espaces partagés"] },
  { plan_name: "Business Plus",     plan_summary: "Offre avancée : stockage étendu, contrôles de sécurité et conformité renforcés pour les organisations exigeantes.", feature_highlights: ["Tout Business Standard", "5 To / utilisateur", "Meet 500 participants", "Vault + gestion des terminaux avancée"] },
];

// Un montant « par utilisateur et par mois » en euros ; on prend les occurrences dans l'ordre du document.
const PRICE_RE = /€\s*(\d{1,3}(?:[.,]\d{2})?)\s*€?\s*\*{0,2}\s*par\s*utilisateur\s*et\s*par\s*mois/gi;

export function extractGoogleWorkspace({ html }) {
  const text = textOf(html);
  const plans = [];
  const ambiguities = [];

  const amounts = [...text.matchAll(PRICE_RE)].map((m) => Number(m[1].replace(",", ".")))
    .filter((n) => Number.isFinite(n) && n > 0);

  for (let i = 0; i < PAID_SEQUENCE.length; i++) {
    const def = PAID_SEQUENCE[i];
    const amount = amounts[i];
    if (amount == null) {
      ambiguities.push({
        plan_name: def.plan_name,
        reason: "montant « par utilisateur et par mois » non lisible à sa position — non observable",
        missing: ["native_amount"],
        evidence_excerpt: `${def.plan_name}: prix EUR introuvable (occurrence #${i + 1})`,
      });
      continue;
    }
    plans.push({
      plan_name: def.plan_name,
      native_amount: amount,
      native_currency: "EUR",
      billing_period: "monthly",   // « par utilisateur et par mois »
      billing_commitment: null,    // décision registre (annual_prepaid), pas ici
      pricing_unit: null,          // « utilisateur » → seat, posé par le registre
      tax_inclusion: null,
      seat_type: null,
      plan_summary: def.plan_summary,
      feature_highlights: def.feature_highlights,
      evidence_excerpt: `${def.plan_name} € ${amount} par utilisateur et par mois`,
      evidence_selector: `pricing-card:${def.plan_name}`,
    });
  }

  if (/\bEnterprise\b[\s\S]{0,120}?(Contact|devis|sales|nous contacter)/i.test(text)) {
    ambiguities.push({
      plan_name: "Enterprise",
      reason: "tarif sur devis — prix non ferme, non observable",
      missing: ["firm_price"], evidence_excerpt: "Enterprise — sur devis",
    });
  }

  const noTaxStatement = !/(VAT|TVA|taxes?|\bHT\b|\bTTC\b|plus applicable tax|sales tax)/i.test(text);
  return {
    adapter: "google-workspace",
    adapter_version: ADAPTER_VERSION,
    plans,
    ambiguities,
    page_proof: {
      starter_amount: plans.find((p) => p.plan_name === "Business Starter")?.native_amount ?? null,
      standard_amount: plans.find((p) => p.plan_name === "Business Standard")?.native_amount ?? null,
      plus_amount: plans.find((p) => p.plan_name === "Business Plus")?.native_amount ?? null,
      paid_plans_found: plans.length,
      enterprise_quote_only: ambiguities.some((a) => a.plan_name === "Enterprise"),
      currency_eur: /€/.test(text),
      no_free_tier: !/\b(gratuit à vie|forfait gratuit|free plan|free tier)\b/i.test(text),
      no_tax_statement_on_grid: noTaxStatement,
      per_user_month_display: /par\s*utilisateur\s*et\s*par\s*mois/i.test(text),
    },
  };
}
