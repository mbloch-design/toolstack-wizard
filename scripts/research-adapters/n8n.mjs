// Adaptateur dédié n8n — grille Cloud n8n.io/pricing.
// Réutilise strictement le contrat d'adaptateur (cf. webflow.mjs) : aucun nouveau modèle.
//
// Faits établis par la page (2026, rendu navigateur) :
//  - « All plans include unlimited users & workflows… Pricing based on monthly
//    workflow executions » -> pricing_unit = instance hébergée, seat_type null,
//    quotas d'exécutions par palier (jamais facturé par étape/utilisateur).
//  - Grille affichée « billed annually » -> billing_period monthly, engagement annuel.
//  - Devise EUR (liée à l'egress/geo, pas au locale). Aucune mention de taxe sur la
//    grille -> tax_inclusion inconnu (null). Ne JAMAIS supposer HT/TTC.
//  - Enterprise = « Contact Sales » -> aucune observation de prix (ambiguïté).
//  - Community Edition auto-hébergée (GitHub) = voie gratuite DURABLE côté licence :
//    portée par une source/claim `pricing.free_plan_exists` + is_free, JAMAIS par une
//    observation 0 EUR artificielle. Infra/exploitation NON gratuites (éditorial).

const textOf = (html) => String(html || "")
  .replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ").replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&euro;/gi, "€")
  .replace(/\s+/g, " ").trim();

function section(text, start, end) {
  const i = text.indexOf(start);
  if (i < 0) return "";
  const j = end ? text.indexOf(end, i + start.length) : -1;
  return text.slice(i, j > i ? j : undefined);
}

// Un plan Cloud payant : « <montant>€ /mo, billed annually » + « <N>K workflow executions ».
function cloudPlan(block, name, summary) {
  const m = block.match(/(\d[\d.,]*)\s*€\s*\/\s*mo,\s*billed annually/i);
  const exec = block.match(/([\d.,]+\s*K)\s+workflow executions/i);
  if (!m) {
    return { ambiguity: { plan_name: name, reason: "prix EUR mensuel (billed annually) introuvable",
      missing: ["native_amount"], evidence_excerpt: block.slice(0, 260) } };
  }
  const hosting = /Self-hosted/i.test(block) && !/Hosted by n8n/i.test(block) ? "self_hosted"
    : /Hosted by n8n or Self-hosted/i.test(block) ? "cloud_or_self_hosted"
    : /Hosted by n8n/i.test(block) ? "cloud" : null;
  // surlignages : lignes de la liste « This plan includes / Everything in … plus: »
  const incl = block.split(/This plan includes:|Everything in [^:]+plus:/i)[1] || "";
  // Découpe SANS jamais casser un nombre (« 2,300 AI credits/month » reste intact) :
  // nouvelle puce = début de mot capitalisé, ou « <nombre> <mot minuscule> ».
  const highlights = incl.split(/(?=\b(?:[A-Z][a-z]|SSO|\d[\d,]*\s+[a-z]))/)
    .map((s) => s.trim()).filter((s) => s.length > 2 && s.length < 60).slice(0, 8);
  const quotaCombinedAcrossInstances = hosting === "self_hosted" || hosting === "cloud_or_self_hosted";
  return { plan: {
    plan_name: name,
    native_amount: Number(m[1].replace(/[,\s]/g, "")),
    native_currency: "EUR",
    billing_period: "monthly",
    billing_commitment: "annual_prepaid",           // « billed annually » + « annual term, no pro-rata refunds » (FAQ)
    billing_commitment_evidence: { excerpt: "billed annually", selector: `pricing-card:${name}` },
    pricing_unit: "workflow_execution",             // « Pricing based on monthly workflow executions », jamais par instance/siège
    pricing_unit_evidence: { excerpt: "All plans include unlimited users & workflows and every integration. Pricing based on monthly workflow executions, regardless of complexity", selector: "pricing:disclaimer" },
    tax_inclusion: null,                             // aucune mention de taxe -> inconnu
    seat_type: null,                                 // utilisateurs illimités
    execution_quota: exec ? exec[1].replace(/\s+/g, "") : null,   // palier d'exécutions/mois
    hosting,                                         // identité de déploiement (cloud | self_hosted | cloud_or_self_hosted)
    quota_combined_across_instances: quotaCombinedAcrossInstances, // Business/Enterprise self-hosted : quota cumulé multi-instances
    plan_summary: summary,
    feature_highlights: highlights,
    evidence_excerpt: block.slice(0, 340),
    evidence_selector: `pricing-card:${name}`,
  } };
}

export function extractN8n({ html }) {
  const text = textOf(html);
  const grid = section(text, "Pricing based on monthly workflow executions", "Looking for something else?") || text;

  const starterB = section(grid, "Starter", "Pro For solo builders");
  const proB = section(grid, "Pro For solo builders", "Business For companies");
  const businessB = section(grid, "Business For companies", "Enterprise For organisations");
  const enterpriseB = section(grid, "Enterprise For organisations", "Pay for full executions");

  const starter = cloudPlan(starterB, "Starter", "Pour démarrer et découvrir la puissance de n8n en Cloud.");
  const pro = cloudPlan(proB, "Pro", "Pour indépendants et petites équipes en production.");
  const business = cloudPlan(businessB, "Business", "Pour entreprises (< 100 employés) qui collaborent et passent à l'échelle.");

  // Enterprise : sur devis -> ambiguïté (jamais de prix inventé).
  const enterpriseAmbiguity = {
    plan_name: "Enterprise",
    reason: "tarif sur devis (Contact Sales) — aucun montant public",
    missing: ["native_amount"],
    evidence_excerpt: enterpriseB.slice(0, 260) || "Enterprise … Contact Sales",
  };

  // Community Edition : voie gratuite auto-hébergée (licence), établie par claim, pas par observation.
  const communityProven = /Community Edition[\s\S]{0,120}self-hosted version of n8n is available on GitHub/i.test(text);
  const noTaxStatement = !/(VAT|TVA|taxes?|HT\b|TTC\b|plus applicable tax)/i.test(grid);
  const executionBased = /Pricing based on monthly workflow executions/i.test(text);
  const perExecutionNotPerStep = /only pay when a workflow runs from start to finish|charge per step or user/i.test(text);

  return {
    adapter: "n8n", adapter_version: "1.0.0",
    plans: [starter.plan, pro.plan, business.plan].filter(Boolean),
    ambiguities: [starter.ambiguity, pro.ambiguity, business.ambiguity, enterpriseAmbiguity].filter(Boolean),
    page_proof: {
      grid_found: Boolean(section(text, "Starter", "Pro For solo builders")),
      execution_based_pricing: executionBased,
      per_execution_not_per_step: perExecutionNotPerStep,
      community_edition_free_selfhosted_proven: communityProven,
      no_tax_statement_on_grid: noTaxStatement,
      cloud_data_residency_eu: /data is stored within the EU|servers located in Frankfurt/i.test(text),
    },
    unknowns: [
      ...(communityProven ? [] : ["Community Edition (voie gratuite auto-hébergée) non prouvée sur la grille"]),
      "Enterprise: tarif sur devis, exclu des observations de prix",
      "tax_inclusion inconnu: la grille n'établit ni HT ni TTC",
      "Community Edition: licence sans coût, mais infrastructure/exploitation NON gratuites (éditorial)",
    ],
  };
}
