#!/usr/bin/env node
/**
 * Prints what the catalogue already knows about some tools, in a compact
 * form, so a research session starts from it instead of reading the 3 MB
 * tools_v4.json (reading it costs more than the research itself).
 *
 *   node scripts/research/seed.mjs framer figma
 *   node scripts/research/seed.mjs --batch 3        # slugs of batch 3 in research/queue.json
 *
 * Also lists, per tool, the catalogue slugs that may serve as alternatives
 * (same category or same substitution cluster): alternatives must be real
 * slugs, so the session picks from this list or reports a missing one.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const catalogue = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/tools_v4.json"), "utf8"));
const demand = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/tool_demand.json"), "utf8")).impressions || {};
const bySlug = new Map(catalogue.map((t) => [t.slug || t.id, t]));
const categoryOf = (t) => t.categoryId || t.category || "";

let slugs = process.argv.slice(2);
const batchFlag = slugs.indexOf("--batch");
if (batchFlag >= 0) {
  const queue = JSON.parse(fs.readFileSync(path.join(ROOT, "research/queue.json"), "utf8"));
  const batch = queue.batches.find((b) => String(b.id) === String(slugs[batchFlag + 1]));
  if (!batch) throw new Error(`batch ${slugs[batchFlag + 1]} not found in research/queue.json`);
  slugs = batch.slugs;
}

const trim = (v, n = 400) => (typeof v === "string" && v.length > n ? `${v.slice(0, n)}…` : v);
const out = slugs.map((slug) => {
  const t = bySlug.get(slug);
  if (!t) return { slug, error: "not in catalogue" };
  const cat = categoryOf(t);
  const cluster = t.substitution_cluster_v2;
  const candidates = catalogue
    .filter((o) => (o.slug || o.id) !== slug && (categoryOf(o) === cat || (cluster && o.substitution_cluster_v2 === cluster)))
    .sort((a, b) => (demand[b.slug || b.id] || 0) - (demand[a.slug || a.id] || 0))
    .slice(0, 40)
    .map((o) => `${o.slug || o.id} (${o.name})`);
  const v5 = t.pricing_v5 || {};
  return {
    slug,
    name: t.name,
    category: cat,
    searchImpressions3Months: demand[slug] || 0,
    websiteUrl: t.websiteUrl || t.website || null,
    shortDescription: { en: trim(t.shortDescriptionEn), fr: trim(t.shortDescription) },
    pricingText: { free: trim(t.pricing?.free, 300), paid: trim(t.pricing?.paid, 600) },
    pricingV5: {
      comparePriceMonthlyEur: v5.compare_price_monthly_eur ?? null,
      comparePlan: v5.compare_plan_name ?? null,
      kind: v5.compare_plan_kind ?? null,
      officialSourceUrl: v5.official_source_url ?? null,
      verifiedOn: v5.verified_on ?? null,
      plans: (v5.plans || []).map((p) => ({ name: p.displayName, amount: p.nativeAmount, currency: p.nativeCurrency, unit: p.pricingUnit, period: p.billingPeriod })),
    },
    currentAlternatives: t.alternatives || [],
    currentRating: t.toolTrimRating ? { ...t.toolTrimRating, evidence: undefined, evidenceEn: undefined } : null,
    alternativeCandidates: candidates,
  };
});
process.stdout.write(`${JSON.stringify(out, null, 1)}\n`);
