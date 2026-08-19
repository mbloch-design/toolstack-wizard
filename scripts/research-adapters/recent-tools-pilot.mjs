const textOf = (html) => String(html || "")
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/&#x27;|&#39;/gi, "'")
  .replace(/\s+/g, " ")
  .trim();

const basePlan = ({ name, amount, period, commitment, unit = "account", evidence }) => ({
  plan_name: name,
  native_amount: amount,
  native_currency: "USD",
  billing_period: period,
  billing_commitment: commitment,
  pricing_unit: unit,
  tax_inclusion: null,
  seat_type: null,
  plan_summary: null,
  feature_highlights: [],
  evidence_excerpt: evidence,
  evidence_selector: `pricing-card:${name}`,
});

export function extractAudionotes({ html }) {
  const text = textOf(html);
  const match = text.match(/Pro(?:\s+Most Popular)?\s*\$\s*(\d+(?:\.\d+)?)\s*\/\s*year/i);
  const plans = match ? [basePlan({
    name: "Pro",
    amount: Number(match[1]),
    period: "annual",
    commitment: "annual_prepaid",
    evidence: match[0],
  })] : [];
  return {
    adapter: "audionotes",
    adapter_version: "1.0.0",
    plans,
    ambiguities: /Enterprise\s+Custom/i.test(text) ? [{ plan_name: "Enterprise", reason: "tarif sur devis", missing: ["firm_price"], evidence_excerpt: "Enterprise Custom" }] : [],
    page_proof: { pro_found: plans.length === 1, free_found: /Free\s*\$0 forever/i.test(text) },
    unknowns: ["Free est porté par le claim pricing.free_plan_exists, sans observation de prix", "tax_inclusion inconnu"],
  };
}

export function extractVisualcv({ html }) {
  const text = textOf(html);
  const quarterly = text.match(/Pro Quarterly\s*\$\s*(\d+(?:\.\d+)?)\s*USD\s*Per Month\s*\(Billed quarterly\s*\)/i);
  return {
    adapter: "visualcv",
    adapter_version: "1.0.0",
    plans: [],
    ambiguities: quarterly ? [{
      plan_name: "Pro",
      reason: "prix mensuel affiché avec prépaiement trimestriel non représentable par le contrat canonique actuel",
      missing: ["supported_billing_commitment"],
      evidence_excerpt: quarterly[0],
    }] : [],
    page_proof: { quarterly_offer_found: Boolean(quarterly), free_found: /Free Account\s*\$0\s*Always free/i.test(text) },
    unknowns: ["Pro trimestriel conservé en ambiguïté, aucun prix fabriqué", "tax_inclusion inconnu"],
  };
}

export function extractJenni({ html }) {
  const text = textOf(html);
  const plans = [];
  for (const name of ["Plus", "Pro"]) {
    const match = text.match(new RegExp(`${name}\\s*\\$\\s*(\\d+(?:\\.\\d+)?)\\s*\\/month`, "i"));
    if (match) plans.push(basePlan({ name, amount: Number(match[1]), period: "monthly", commitment: "monthly", evidence: match[0] }));
  }
  return {
    adapter: "jenni",
    adapter_version: "1.0.0",
    plans,
    ambiguities: [],
    page_proof: { plus_found: plans.some((p) => p.plan_name === "Plus"), pro_found: plans.some((p) => p.plan_name === "Pro"), free_found: /Free\s*\$0\s*\/month/i.test(text) },
    unknowns: ["Free est porté par le claim pricing.free_plan_exists, sans observation de prix", "tax_inclusion inconnu", "tarification locale disponible uniquement dans l'application"],
  };
}
