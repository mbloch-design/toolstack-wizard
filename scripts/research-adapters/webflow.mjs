const textOf = (html) => {
  return String(html || "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&euro;/gi, "€")
    .replace(/\s+/g, " ").trim();
};

function section(text, start, end) {
  const i = text.indexOf(start);
  const j = text.indexOf(end, i + start.length);
  return i >= 0 ? text.slice(i, j > i ? j : undefined) : "";
}

function paidPlan(sitePlans, name, nextName, summary) {
  const block = section(sitePlans, name, nextName);
  const m = block.match(/\$\s*([\d,]+(?:\.\d+)?)\s*\/\s*mo\s+billed yearly/i);
  if (!m) return { ambiguity: { plan_name: name, reason: "prix annuel équivalent mensuel introuvable", evidence_excerpt: block.slice(0, 260) } };
  const features = block.split(/Add plan/i)[1]?.split(/Free Starter Workspace/i)[0]?.trim() || "";
  return { plan: {
    plan_name: name,
    native_amount: Number(m[1].replace(/,/g, "")), native_currency: "USD",
    billing_period: "monthly", billing_commitment: null,
    pricing_unit: null, tax_inclusion: "ht", seat_type: null,
    plan_summary: summary,
    feature_highlights: features.split(/(?=[A-Z][^A-Z]{2,30}(?:\s|$))/).map((s) => s.trim()).filter(Boolean).slice(0, 6),
    evidence_excerpt: block.slice(0, 320), evidence_selector: `site-plans:${name}`,
  } };
}

export function extractWebflow({ html }) {
  const text = textOf(html);
  const sitePlans = section(text, "Site plans", "Platform plans");
  const basic = paidPlan(sitePlans, "Basic", "Premium", "Pour les sites simples sans CMS.");
  const premium = paidPlan(sitePlans, "Premium", "Platform plans", "Pour les sites riches en contenu avec CMS et davantage de trafic.");
  const starterBlock = section(sitePlans, "Starter", "Basic");
  const freePlanProven = /\bFree\b/i.test(starterBlock);
  return {
    adapter: "webflow", adapter_version: "1.0.0",
    plans: [basic.plan, premium.plan].filter(Boolean),
    ambiguities: [basic.ambiguity, premium.ambiguity].filter(Boolean),
    page_proof: {
      site_plan_section_found: Boolean(sitePlans), free_plan_proven: freePlanProven,
      platform_plans_excluded: /Platform plans/i.test(text),
      currency_unit_tax_proof: /All prices in USD, per site, plus applicable taxes added at checkout/i.test(text),
    },
    unknowns: [
      ...(freePlanProven ? [] : ["plan Starter gratuit non prouvé"]),
      "les plans Platform (Team/Enterprise) sont une famille distincte, exclus des observations Site plans",
    ],
  };
}
