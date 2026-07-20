const textOf = (html) => {
  return String(html || "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&euro;/gi, "€")
    .replace(/\s+/g, " ").trim();
};
const between = (text, start, end) => {
  const i = text.indexOf(start); const j = text.indexOf(end, i + start.length);
  return i >= 0 ? text.slice(i, j > i ? j : undefined) : "";
};

const LABELS = [
  ["Basic", "Essentiel", "Pour lancer un site professionnel avec les fonctions essentielles."],
  ["Essentiel", "Plus", "Pour développer un site avec davantage de personnalisation et de commerce."],
  ["Plus", "Advanced", "Pour les activités qui veulent réduire les frais et développer la vente."],
  ["Advanced", "Comparer les forfaits", "Pour les activités à fort volume qui recherchent les frais les plus bas."],
];

function plan(text, name, nextName, summary) {
  const block = between(text, name, nextName);
  const m = block.match(/(\d+(?:[,.]\d+)?)\s*€\s*\/\s*mois/i);
  if (!m) return { ambiguity: { plan_name: name, reason: "montant EUR mensuel introuvable dans le rendu", evidence_excerpt: block.slice(0, 280) } };
  const features = block.match(/(?:2|Illimit[ée]s?) contributeurs?|Analyses[^.]{0,55}|CSS[^.]{0,55}|\d+\s*%[^.]{0,80}/gi)?.slice(0, 6) || [];
  return { plan: {
    plan_name: name, native_amount: Number(m[1].replace(",", ".")), native_currency: "EUR",
    billing_period: "monthly", billing_commitment: null, pricing_unit: null,
    tax_inclusion: "unknown", seat_type: null, plan_summary: summary,
    feature_highlights: features,
    evidence_excerpt: block.slice(0, 360), evidence_selector: `pricing-card:${name}`,
  } };
}

export function extractSquarespace({ html }) {
  const text = textOf(html);
  const pricing = between(text, "Paiement annuel", "Comparer les forfaits");
  const results = LABELS.map(([name, next, summary]) => plan(pricing, name, next, summary));
  return {
    adapter: "squarespace", adapter_version: "1.0.0",
    plans: results.map((r) => r.plan).filter(Boolean),
    ambiguities: results.map((r) => r.ambiguity).filter(Boolean),
    page_proof: {
      annual_toggle_selected: /Paiement annuel/i.test(text),
      trial_14_days: /(?:essai|p[ée]riode d'essai)[^.!?]{0,80}14 jours/i.test(text),
      no_free_plan: /(?:pas|aucun)[^.!?]{0,60}(?:forfait|plan)[^.!?]{0,30}gratuit/i.test(text),
    },
    unknowns: ["tax_inclusion non explicitée sur la grille tarifaire"],
  };
}
