#!/usr/bin/env node
/**
 * Merges validated research dossiers (research/dossiers/<slug>.json, stage
 * "full") into the catalogue, src/data/tools_v4.json.
 *
 *   node scripts/research/merge.mjs notion hotjar          # dry run: prints what changes
 *   node scripts/research/merge.mjs notion hotjar --apply  # writes tools_v4.json
 *   node scripts/research/merge.mjs --all --apply          # every full-stage dossier
 *
 * Rules:
 *   - a dossier is merged only if it validates at stage "full";
 *   - prices stay in the vendor's currency on each plan; only the comparison
 *     price is converted to EUR, at the site rate (src/lib/currencyRates.ts);
 *   - the comparison price is derived from comparePlanKey, never typed;
 *   - fields the dossier does not cover are left untouched (categories,
 *     prescription, clusters, covers, functional_needs…).
 *
 * After --apply: regenerate the index (node scripts/gen-tools-index.mjs) and
 * list the slugs in docs/SUPABASE_REPRISE.md for re-injection.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const CATALOGUE = path.join(ROOT, "src/data/tools_v4.json");
const DOSSIERS = path.join(ROOT, "research/dossiers");

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
let slugs = args.filter((a) => !a.startsWith("--"));
if (args.includes("--all")) slugs = fs.readdirSync(DOSSIERS).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
if (!slugs.length) {
  console.log("usage: merge.mjs <slug…> | --all [--apply]");
  process.exit(1);
}

// Same rate as the site, read from its source so the two never drift.
const ratesSource = fs.readFileSync(path.join(ROOT, "src/lib/currencyRates.ts"), "utf8");
const EUR_TO = {
  EUR: 1,
  USD: Number(ratesSource.match(/EUR_TO_USD\s*=\s*([\d.]+)/)[1]),
  GBP: Number(ratesSource.match(/EUR_TO_GBP\s*=\s*([\d.]+)/)[1]),
};
const toEur = (amount, currency) => {
  if (!EUR_TO[currency]) throw new Error(`no EUR rate for ${currency}`);
  return Math.round((amount / EUR_TO[currency]) * 100) / 100;
};

const money = (amount, currency, lang) => {
  const symbol = { EUR: "€", USD: "$", GBP: "£" }[currency] || currency;
  const fixed = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  if (lang === "fr") return `${fixed.replace(".", ",")} ${symbol}`;
  return symbol.length === 1 ? `${symbol}${fixed}` : `${fixed} ${symbol}`;
};

const catalogue = JSON.parse(fs.readFileSync(CATALOGUE, "utf8"));
const bySlug = new Map(catalogue.map((t) => [t.slug || t.id, t]));
let merged = 0;

for (const slug of slugs) {
  const file = path.join(DOSSIERS, `${slug}.json`);
  if (!fs.existsSync(file)) { console.log(`✖ ${slug}: no dossier`); continue; }
  // Facts-only dossiers wait for local completion: not an error.
  if (JSON.parse(fs.readFileSync(file, "utf8")).status === "facts_collected") continue;
  try {
    execFileSync("node", [path.join(ROOT, "scripts/research/validate.mjs"), slug], { stdio: "pipe" });
  } catch {
    console.log(`✖ ${slug}: does not validate at stage "full" (run validate.mjs ${slug})`);
    continue;
  }
  const d = JSON.parse(fs.readFileSync(file, "utf8"));
  if (d.hold) {
    console.log(`⏸ ${slug}: on hold (${d.hold})`);
    continue;
  }
  // A price is published only from an official source: when the compared
  // plan cites independent sources only (official page blocked or rendered
  // by script), the fiche waits for a manual check.
  const tierOf = new Map(d.sources.map((s) => [s.id, s.tier]));
  const comparePlan = d.pricing.plans.find((plan) => plan.key === d.pricing.comparePlanKey);
  if (comparePlan && !(comparePlan.sourceIds || []).some((id) => tierOf.get(id) === 1)) {
    console.log(`⏸ ${slug}: compared price has no official source, kept for a manual check`);
    continue;
  }
  const tool = bySlug.get(slug);
  if (!tool) { console.log(`✖ ${slug}: not in catalogue`); continue; }

  const before = JSON.stringify(tool);
  applyDossier(tool, d);
  const changed = before !== JSON.stringify(tool);
  merged++;
  const v5 = tool.pricing_v5;
  console.log(`${changed ? "✔" : "="} ${slug}: compare ${v5.compare_plan_name ?? "-"} ${v5.compare_price_monthly_eur} EUR/mo · ${v5.plans.length} plans · rating ${["valeurAjoutee", "simplicite", "utilisation", "puissance", "reversibilite"].map((k) => tool.toolTrimRating[k]).join("/")} · ${tool.alternatives.length} alternatives`);
}

if (APPLY && merged) {
  fs.writeFileSync(CATALOGUE, `${JSON.stringify(catalogue, null, 2)}\n`);
  console.log(`\n${merged} tool(s) written to src/data/tools_v4.json. Next: node scripts/gen-tools-index.mjs`);
} else {
  console.log(`\nDry run: ${merged} tool(s) would change. Add --apply to write.`);
}

function applyDossier(tool, d) {
  const p = d.pricing;
  const src = new Map(d.sources.map((s) => [s.id, s.url]));
  const firstUrl = (ids) => src.get((ids || [])[0]) || p.pricingUrl || null;
  const L = (v, lang) => (v ? v[lang] || v.en || "" : "");

  // Identity: only a vendor move changes the site address.
  if (d.identity.urlStatus === "moved" && d.identity.officialUrl) {
    const old = tool.websiteUrl;
    tool.websiteUrl = d.identity.officialUrl;
    if (tool.website === old) tool.website = d.identity.officialUrl;
    if (tool.affiliateLink === old) tool.affiliateLink = d.identity.officialUrl;
  }
  tool.lifecycle = { status: d.identity.productStatus, note: d.identity.statusNote || null, checkedOn: d.researchedOn };

  // Pricing.
  const compare = p.plans.find((plan) => plan.key === p.comparePlanKey) || null;
  const compareNative = compare ? (compare.price.annualPerMonth ?? compare.price.monthly ?? null) : null;
  const kindByModel = { one_time: "one_time", usage: "usage", quote: "quote", free: "free", open_source: "open_source", bundle_only: "bundle" };
  const kind = kindByModel[p.model] || (compare?.unit === "seat" ? "seat" : "account");
  const cautions = (lang) => (p.cautions || []).map((c) => L(c, lang)).filter(Boolean);
  const isFreePlan = (plan) => !plan.onQuote && [plan.price.monthly, plan.price.annualPerMonth, plan.price.oneTime].some((v) => v === 0);

  const planSummary = (plan, lang) => {
    const fr = lang === "fr";
    const pr = plan.price;
    const parts = [];
    const promo = plan.promoPrice ? (plan.promoPrice.annualPerMonth ?? plan.promoPrice.monthly ?? null) : null;
    if (promo != null) parts.push(fr ? `Offre de lancement à ${money(promo, p.currency, lang)}/mois sur la première période ; prix de renouvellement non publié.` : `Introductory offer at ${money(promo, p.currency, lang)}/mo for the first term; renewal price not published.`);
    if (plan.onQuote) parts.push(fr ? "Sur devis." : "Custom quote.");
    else if (pr.oneTime != null && pr.oneTime > 0) parts.push(fr ? "Licence à vie, paiement unique." : "Lifetime license, one-time payment.");
    // The card already says "annual subscription paid upfront": only the
    // monthly alternative is worth adding.
    else if (pr.annualPerMonth != null && pr.annualPerMonth > 0 && pr.monthly != null) parts.push(fr ? `${money(pr.monthly, p.currency, lang)}/mois sans engagement.` : `${money(pr.monthly, p.currency, lang)}/mo billed monthly.`);
    if (plan.unit === "seat" && !isFreePlan(plan)) parts.push(fr ? `Par utilisateur${plan.minSeats > 1 ? `, ${plan.minSeats} minimum` : ""}.` : `Per user${plan.minSeats > 1 ? `, ${plan.minSeats} minimum` : ""}.`);
    return parts.join(" ") || null;
  };

  const buildV5 = (lang) => ({
    ...(lang === "fr" ? tool.pricing_v5 || {} : tool.pricing_v5En || {}),
    compare_price_monthly_eur: compareNative != null && p.model !== "one_time" ? toEur(compareNative, p.currency) : 0,
    compare_plan_name: p.model === "quote" || p.regularPriceUnknown ? "Prix non public" : compare?.name || null,
    compare_plan_kind: kind,
    price_reliability: "high",
    verification_status: "official_explicit",
    verified_on: p.verifiedOn,
    official_source_url: p.pricingUrl || null,
    source_domain: p.pricingUrl ? new URL(p.pricingUrl).hostname.replace(/^www\./, "") : null,
    usage_sensitive: p.model === "usage" || p.plans.some((plan) => plan.unit === "usage"),
    cautions: cautions(lang),
    ...(lang === "fr" ? { cautionsEn: cautions("en") } : {}),
    ...(compare?.minSeats > 1 ? { minSeats: compare.minSeats } : {}),
    plans: p.plans.map((plan) => {
      const pr = plan.price;
      const amount = plan.onQuote ? null : (pr.annualPerMonth ?? pr.monthly ?? pr.oneTime ?? null);
      return {
        planKey: plan.key,
        displayName: plan.name,
        summary: planSummary(plan, lang),
        featureHighlights: (plan.keyLimits || []).map((k) => L(k, lang)).filter(Boolean).slice(0, 3),
        detailsSourceUrl: firstUrl(plan.sourceIds),
        pricingUnit: p.model === "open_source" && isFreePlan(plan) ? "open_source" : plan.unit,
        isFree: isFreePlan(plan),
        isComparePlan: plan.key === p.comparePlanKey,
        nativeAmount: amount,
        nativeCurrency: p.currency,
        billingPeriod: pr.oneTime != null && pr.monthly == null && pr.annualPerMonth == null ? null : "monthly",
        billingCommitment: pr.annualPerMonth != null ? "annual_prepaid" : pr.monthly != null ? "monthly" : null,
        taxInclusion: p.taxIncluded === true ? "ttc" : p.taxIncluded === false ? "ht" : "unknown",
        observedMarket: p.region || null,
        observedOn: p.verifiedOn,
        lastConfirmedOn: p.verifiedOn,
      };
    }),
  });
  tool.pricing_v5 = buildV5("fr");
  tool.pricing_v5En = buildV5("en");
  tool.defaultMonthlyPrice = tool.pricing_v5.compare_price_monthly_eur;

  // Short free/paid texts: read by the free-plan detection and fallbacks.
  const freeText = (lang) => {
    const fr = lang === "fr";
    if (p.freePlan.exists) return `${fr ? "Plan gratuit" : "Free plan"}${p.freePlan.limits ? ` : ${L(p.freePlan.limits, lang) || p.freePlan.limits}` : "."}`.replace(" : ", fr ? " : " : ": ");
    if (p.trial) return fr ? `Pas de plan gratuit permanent, essai de ${p.trial.days} jours.` : `No permanent free plan, ${p.trial.days}-day trial.`;
    return fr ? "Pas de plan gratuit." : "No free plan.";
  };
  const paidText = (lang) => {
    const fr = lang === "fr";
    if (p.model === "quote") return fr ? "Prix non public, sur devis." : "Price not public, custom quote.";
    if (p.regularPriceUnknown) return fr ? "Plans payants affichés à prix promotionnel ; prix hors promotion non publié." : "Paid plans shown at promotional prices; regular price not published.";
    if (p.model === "free" || p.model === "open_source") return fr ? "Pas d'offre payante obligatoire." : "No paid plan required.";
    if (!compare) return "";
    const amount = compare.price.oneTime ?? compare.price.annualPerMonth ?? compare.price.monthly;
    const per = compare.price.oneTime != null ? (fr ? " (licence à vie)" : " (lifetime license)") : fr ? "/mois" : "/mo";
    return fr ? `Dès ${money(amount, p.currency, "fr")}${per}, plan ${compare.name}.` : `From ${money(amount, p.currency, "en")}${per}, ${compare.name} plan.`;
  };
  tool.pricing = { free: freeText("fr"), paid: paidText("fr") };
  tool.pricingEn = { free: freeText("en"), paid: paidText("en") };

  // Alternatives: real catalogue slugs only (validated).
  tool.alternatives = (d.alternatives || []).map((a) => a.slug);

  // Rating on the five-axis grid.
  const axes = ["valeurAjoutee", "simplicite", "utilisation", "puissance", "reversibilite"];
  tool.toolTrimRating = {
    ...Object.fromEntries(axes.map((axis) => [axis, d.rating[axis]])),
    evidence: Object.fromEntries(axes.map((axis) => [axis, d.rating.evidence[axis].fr])),
    evidenceEn: Object.fromEntries(axes.map((axis) => [axis, d.rating.evidence[axis].en])),
    lastActivityVerifiedOn: d.rating.lastActivityVerifiedOn || null,
    notedOn: d.researchedOn,
  };

  // Editorial, English first in the dossier, both languages on the record.
  const e = d.editorial;
  const list = (items, lang) => (items || []).map((item) => L(item, lang)).filter(Boolean);
  tool.tagline = { fr: e.tagline.fr, en: e.tagline.en };
  tool.shortDescription = e.shortDescription.fr;
  tool.shortDescriptionEn = e.shortDescription.en;
  if (e.longDescription) {
    tool.longDescription = e.longDescription.fr;
    tool.longDescriptionEn = e.longDescription.en;
  }
  if (e.pros) { tool.pros = list(e.pros, "fr"); tool.prosEn = list(e.pros, "en"); }
  if (e.cons) { tool.cons = list(e.cons, "fr"); tool.consEn = list(e.cons, "en"); }
  if (d.useCases) { tool.useCases = list(d.useCases, "fr"); tool.useCasesEn = list(d.useCases, "en"); }
  if (e.verdict) {
    const verdict = (lang) => {
      const existing = (lang === "fr" ? tool.verdict : tool.verdictEn) || {};
      const trap = e.verdict.billingTraps ? L(e.verdict.billingTraps, lang) : "";
      return {
        ...existing,
        keepIf: [L(e.verdict.keepIf, lang)],
        avoidIf: [L(e.verdict.avoidIf, lang)],
        threshold: L(e.verdict.threshold, lang),
        ...(trap ? { billingTraps: [{ title: lang === "fr" ? "Avant de payer" : "Before you pay", text: trap }] } : {}),
      };
    };
    tool.verdict = verdict("fr");
    tool.verdictEn = verdict("en");
  }
  if (d.audience) {
    tool.personas = d.audience.persona === "OTHER" ? [] : [d.audience.persona];
    tool.soloRelevance = d.audience.soloRelevance;
    tool.teamRelevance = d.audience.teamRelevance;
    tool.seo = { ...(tool.seo || {}), idealForFr: d.audience.description.fr, idealForEn: d.audience.description.en };
  }

  // Provenance: where every published fact comes from.
  tool.research = { dossier: `research/dossiers/${d.slug}.json`, researchedOn: d.researchedOn, sources: d.sources.length };
}
