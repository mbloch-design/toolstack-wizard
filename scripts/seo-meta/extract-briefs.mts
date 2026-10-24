/**
 * Writes one brief per published tool for the meta description rewrite:
 * the facts a writer may use, and nothing else. Usage:
 *   npx tsx scripts/seo-meta/extract-briefs.mts <out.json> [slug,slug,...]
 */
import fs from "node:fs";
import { toolPriceFacts, priceLabel, toolSeoDescription, toolSeoTitle, verifiedMonth, ratingLabel } from "../../src/lib/toolSeo";
import { hasConfirmedFreeTier } from "../../src/lib/pricing";

const tools = JSON.parse(fs.readFileSync("src/data/tools_v4.json", "utf8"));
const sitemap = fs.readFileSync("dist/sitemap.xml", "utf8");
const published = new Set([...sitemap.matchAll(/<loc>https:\/\/tooltrim\.com\/en\/tool\/([^/<]+)<\/loc>/g)].map((m) => m[1]));
const only = process.argv[3] ? new Set(process.argv[3].split(",")) : null;
const bySlug = new Map(tools.map((t: any) => [t.slug, t]));
const year = 2026;
const briefs = tools
  .filter((t: any) => published.has(t.slug) && (!only || only.has(t.slug)))
  .map((t: any) => {
    const { price, hasPrice, oneTime } = toolPriceFacts(t);
    const v5 = t.pricing_v5 || {};
    return {
      slug: t.slug,
      name: t.name,
      category: t.category,
      access: v5.compare_plan_kind || null,
      price: hasPrice ? { fr: priceLabel(t, price!, "fr"), en: priceLabel(t, price!, "en"), oneTime } : null,
      comparePlan: v5.compare_plan_name || null,
      freePlan: hasConfirmedFreeTier(t),
      verified: verifiedMonth(t, "en") ? { fr: verifiedMonth(t, "fr"), en: verifiedMonth(t, "en") } : null,
      rating: { fr: ratingLabel(t, "fr"), en: ratingLabel(t, "en") },
      usageBased: !!v5.usage_sensitive,
      lifecycle: t.lifecycle?.status || null,
      fr: {
        short: t.shortDescription, long: (t.longDescription || "").slice(0, 900),
        keepIf: t.verdict?.keepIf?.[0], avoidIf: t.verdict?.avoidIf?.[0], pros: (t.pros || []).slice(0, 3), cons: (t.cons || []).slice(0, 2),
        idealFor: t.seo?.idealForFr, caution: v5.cautions?.[0],
      },
      en: {
        short: t.shortDescriptionEn, long: (t.longDescriptionEn || "").slice(0, 900),
        keepIf: t.verdictEn?.keepIf?.[0], avoidIf: t.verdictEn?.avoidIf?.[0], pros: (t.prosEn || []).slice(0, 3), cons: (t.consEn || []).slice(0, 2),
        idealFor: t.seo?.idealForEn, caution: v5.cautionsEn?.[0] || t.pricing_v5En?.cautions?.[0],
      },
      alternatives: (t.alternatives || []).map((s: string) => (bySlug.get(s) as any)?.name).filter(Boolean).slice(0, 4),
      current: {
        presentation: { fr: toolSeoDescription(t, "presentation", "fr", year), en: toolSeoDescription(t, "presentation", "en", year) },
        titles: Object.fromEntries((["presentation", "prix", "alternatives", "avis"] as const).map((p) => [p, { fr: toolSeoTitle(t, p, "fr", year), en: toolSeoTitle(t, p, "en", year) }])),
      },
    };
  });
fs.writeFileSync(process.argv[2], JSON.stringify(briefs, null, 1));
console.log(`${briefs.length} briefs`);
