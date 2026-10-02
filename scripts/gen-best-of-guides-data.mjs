#!/usr/bin/env node
/**
 * Instantané des outils cités par les pages « meilleurs outils »
 * (src/data/bestOfGuides.json), écrit dans src/data/bestOfGuidesData.json.
 *
 * Il existe pour que le prérendu et le client lisent les mêmes données sans
 * charger tools_v4.json (plusieurs Mo) : la page n'a besoin que d'une
 * quarantaine d'outils et d'une partie de leurs champs. Échoue si un outil
 * listé n'existe pas au catalogue, pour qu'une page ne perde pas une ligne en
 * silence.
 */
import fs from "node:fs";

const config = JSON.parse(fs.readFileSync("src/data/bestOfGuides.json", "utf8"));
const tools = JSON.parse(fs.readFileSync("src/data/tools_v4.json", "utf8"));
const bySlug = new Map(tools.map((t) => [t.slug, t]));
const demand = JSON.parse(fs.readFileSync("src/data/tool_demand.json", "utf8")).impressions || {};

// Plans utiles à l'affichage d'un prix : le plan de comparaison et les plans
// gratuits, dans les deux versions (la grille en dollars vit sur la version
// anglaise quand l'éditeur publie aussi des euros).
const trimPricing = (v5) => v5 && {
  verified_on: v5.verified_on || null,
  compare_plan_name: v5.compare_plan_name || null,
  usage_sensitive: !!v5.usage_sensitive,
  plans: (v5.plans || [])
    .filter((p) => p.isComparePlan || p.isFree)
    .map((p) => ({
      planKey: p.planKey,
      displayName: p.displayName,
      isComparePlan: !!p.isComparePlan,
      isFree: !!p.isFree,
      nativeAmount: p.nativeAmount ?? null,
      nativeCurrency: p.nativeCurrency || null,
      billingPeriod: p.billingPeriod ?? null,
      billingCommitment: p.billingCommitment ?? null,
      pricingUnit: p.pricingUnit || null,
    })),
};

const first = (list) => (Array.isArray(list) ? list.slice(0, 2) : []);

const missing = [];
const snapshot = {};
for (const guide of config.guides) {
  for (const slug of guide.tools) {
    const t = bySlug.get(slug);
    if (!t) { missing.push(`${guide.id}: ${slug}`); continue; }
    snapshot[slug] = {
      id: t.id || t.slug,
      slug: t.slug,
      name: t.name,
      logo: t.logo || null,
      websiteUrl: t.websiteUrl || null,
      tagline: t.tagline || null,
      shortDescription: t.shortDescription || "",
      shortDescriptionEn: t.shortDescriptionEn || "",
      pricing: t.pricing || null,
      pricingEn: t.pricingEn || null,
      defaultMonthlyPrice: t.defaultMonthlyPrice ?? 0,
      pricing_v5: trimPricing(t.pricing_v5),
      pricing_v5En: trimPricing(t.pricing_v5En),
      toolTrimRating: t.toolTrimRating
        ? { ...Object.fromEntries(["valeurAjoutee", "simplicite", "utilisation", "puissance", "reversibilite"].map((a) => [a, t.toolTrimRating[a] ?? null])), lastActivityVerifiedOn: t.toolTrimRating.lastActivityVerifiedOn || null }
        : null,
      verdict: t.verdict ? { keepIf: first(t.verdict.keepIf), avoidIf: first(t.verdict.avoidIf), threshold: t.verdict.threshold || "", billingTraps: t.verdict.billingTraps || [] } : null,
      verdictEn: t.verdictEn ? { keepIf: first(t.verdictEn.keepIf), avoidIf: first(t.verdictEn.avoidIf), threshold: t.verdictEn.threshold || "", billingTraps: t.verdictEn.billingTraps || [] } : null,
      pros: first(t.pros),
      prosEn: first(t.prosEn),
      cons: first(t.cons),
      consEn: first(t.consEn),
      researchedOn: t.research?.researchedOn || null,
      demand: demand[t.slug] || 0,
    };
  }
}

if (missing.length) {
  console.error(`Outils absents du catalogue : ${missing.join(", ")}`);
  process.exit(1);
}

fs.writeFileSync("src/data/bestOfGuidesData.json", JSON.stringify(snapshot, null, 2) + "\n");
console.log(`Pages « meilleurs outils » : ${config.guides.length} pages, ${Object.keys(snapshot).length} outils.`);
