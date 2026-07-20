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

function paidPlan(text, name, nextName, summary) {
  const block = between(text, name, nextName);
  const m = block.match(/\$\s*([\d,]+(?:\.\d+)?)\s+per month/i);
  if (!m) return { ambiguity: { plan_name: name, reason: "montant introuvable", evidence_excerpt: block.slice(0, 260) } };
  const afterPrice = block.slice(m.index + m[0].length);
  return { plan: {
    plan_name: name, native_amount: Number(m[1].replace(/,/g, "")), native_currency: "USD",
    billing_period: "monthly", billing_commitment: null, pricing_unit: null,
    tax_inclusion: "ht", seat_type: null, plan_summary: summary,
    feature_highlights: afterPrice.match(/Free custom domain|\d+ CMS collections|\d+ GB bandwidth|Built-in SEO|Site redirects|Staging environment|Branching with previews/g)?.slice(0, 6) || [],
    evidence_excerpt: block.slice(0, 340), evidence_selector: `pricing-card:${name}`,
  } };
}

export function extractFramer({ html }) {
  const text = textOf(html);
  const pricing = between(text, "Yearly billing", "Additional editors");
  const basic = paidPlan(pricing, "Basic", "Pro", "Pour les sites personnels créatifs.");
  const pro = paidPlan(pricing, "Pro", "Enterprise", "Pour les sites professionnels en croissance.");
  const miniAbsent = !/\bMini\b/.test(pricing);
  return {
    adapter: "framer", adapter_version: "1.0.0",
    plans: [basic.plan, pro.plan].filter(Boolean),
    ambiguities: [basic.ambiguity, pro.ambiguity].filter(Boolean),
    page_proof: {
      yearly_billing_selected: /Yearly billing/i.test(text),
      free_plan_proven: /Free Try for free \$0/i.test(pricing),
      enterprise_custom: /Enterprise Mission critical sites Custom/i.test(pricing),
      mini_absent_from_current_grid: miniAbsent,
    },
    unknowns: [
      "Enterprise est sur devis : identité de plan conservée, aucune observation de prix",
      "les tarifs d'éditeurs additionnels sont des frais par siège distincts des Site plans",
      ...(miniAbsent ? ["Mini absent de la grille actuelle : ancien plan à traiter comme superseded_candidate"] : []),
    ],
  };
}
