#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "src/data/tools_v4.json";
const outputPath = "src/data/tools_index.json";

const tools = JSON.parse(await readFile(sourcePath, "utf8"));

if (!Array.isArray(tools)) {
  throw new Error(`${sourcePath} doit contenir un tableau d’outils.`);
}

// Compare plan amounts as published, one per real currency, never converted.
// period: "monthly" | "annual" | "once".
function nativePricesOf(tool) {
  const out = [];
  for (const plan of [...(tool.pricing_v5?.plans || []), ...(tool.pricing_v5En?.plans || [])]) {
    if (!plan?.isComparePlan || plan.isFree || !(plan.nativeAmount > 0) || !plan.nativeCurrency) continue;
    if (out.some((entry) => entry.currency === plan.nativeCurrency)) continue;
    const period = plan.billingPeriod === "monthly" ? "monthly" : plan.billingPeriod === "annual" ? "annual" : "once";
    out.push({ amount: plan.nativeAmount, currency: plan.nativeCurrency, period });
  }
  return out;
}

const seen = new Set();
const summaries = tools.map((tool, index) => {
  const id = String(tool.id || tool.slug || "").trim();
  const slug = String(tool.slug || tool.id || "").trim();

  if (!id || !slug) {
    throw new Error(`Outil sans id/slug à l’index ${index}.`);
  }
  if (seen.has(slug)) {
    throw new Error(`Slug dupliqué dans ${sourcePath} : ${slug}`);
  }
  seen.add(slug);

  const pricing = tool.pricing || { free: "", paid: "" };
  const affiliateLink = tool.affiliateLink || "";
  const websiteUrl = tool.websiteUrl || affiliateLink;

  // Keep the browser index sparse. The client mapper restores these defaults,
  // so repeating empty arrays/nulls/default booleans for every tool only adds
  // transfer and parse cost without carrying information.
  return {
    id,
    slug,
    name: tool.name || id,
    categoryId: tool.category || tool.categoryId || "",
    shortDescription: tool.shortDescription || "",
    ...(tool.shortDescriptionEn && tool.shortDescriptionEn !== tool.shortDescription
      ? { shortDescriptionEn: tool.shortDescriptionEn }
      : {}),
    ...((typeof pricing === "string" && pricing) || pricing.free || pricing.paid ? { pricing } : {}),
    ...(tool.pricingEn ? { pricingEn: tool.pricingEn } : {}),
    ...(tool.defaultMonthlyPrice ? { defaultMonthlyPrice: tool.defaultMonthlyPrice } : {}),
    ...(tool.pricing_v5?.compare_price_monthly_eur != null
      ? { compareMonthlyPrice: tool.pricing_v5.compare_price_monthly_eur }
      : {}),
    // Attested entry price in the vendor's own currency (compare plan of
    // pricing_v5 / pricing_v5En): what light views (catalogue cards, My stack)
    // may show without reading prices out of editorial text or converting.
    ...(nativePricesOf(tool).length ? { nativePrices: nativePricesOf(tool) } : {}),
    // "Prix non public" sentinel: a 0 that means unknown, not free.
    ...(/non public/i.test(tool.pricing_v5?.compare_plan_name || "") ? { priceUndisclosed: true } : {}),
    ...(affiliateLink ? { affiliateLink } : {}),
    ...(websiteUrl && websiteUrl !== affiliateLink ? { websiteUrl } : {}),
    ...(tool.ogImageUrl ? { ogImageUrl: tool.ogImageUrl } : {}),
    ...(tool.logo ? { logo: tool.logo } : {}),
    ...(tool.tool_type && tool.tool_type !== "satellite" ? { tool_type: tool.tool_type } : {}),
    ...(tool.host_app ? { host_app: tool.host_app } : {}),
    ...(tool.bundle_parent ? { bundle_parent: tool.bundle_parent } : {}),
    ...(tool.substitution_cluster_v2 ? { substitution_cluster_v2: tool.substitution_cluster_v2 } : {}),
    ...(tool.functional_needs?.length ? { functional_needs: tool.functional_needs } : {}),
    ...(tool.verticals?.length ? { verticals: tool.verticals } : {}),
    ...(tool.relevantFor?.length ? { relevantFor: tool.relevantFor } : {}),
    // Editorial strength of the recommendation: the catalogue shelves rank on it.
    ...(tool.prescription_quality ? { prescription_quality: tool.prescription_quality } : {}),
    // Les pages piliers persona filtrent sur ce champ. Sans lui dans l'index,
    // le filtre tourne a vide cote application, meme si tools_v4.json le porte.
    ...(tool.personas?.length ? { personas: tool.personas } : {}),
    // Explicit catalogue alternatives (slugs): My stack shows the same
    // potential overlaps on its cards as in its Focus panel.
    ...(Array.isArray(tool.alternatives) && tool.alternatives.length
      ? { alternatives: tool.alternatives.map((alt) => (typeof alt === "string" ? alt : alt?.slug || alt?.id || alt?.tool)).filter(Boolean) }
      : {}),
    ...(tool.freeAlternative ? { freeAlternative: tool.freeAlternative } : {}),
    ...(tool.substitutable === false ? { substitutable: false } : {}),
    ...(tool.betterAlternative ? { betterAlternative: tool.betterAlternative } : {}),
  };
});

await writeFile(outputPath, `${JSON.stringify(summaries, null, 2)}\n`);
console.log(`${outputPath} écrit : ${summaries.length} outils, 0 slug dupliqué`);
