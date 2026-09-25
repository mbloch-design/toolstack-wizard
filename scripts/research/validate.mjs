#!/usr/bin/env node
/**
 * Validates tool research dossiers (schemaVersion 2) before anything is
 * merged into the catalogue. Plain Node, no dependency: it must run in a
 * fresh cloud session without `npm install`.
 *
 *   node scripts/research/validate.mjs framer figma      # given slugs
 *   node scripts/research/validate.mjs --all             # every v2 dossier
 *   node scripts/research/validate.mjs --stage facts a b # cloud output: facts only
 *
 * Stage "facts" is what a cloud session delivers: identity, sources,
 * pricing, product facts and alternatives, in English only. The rating,
 * audience and bilingual editorial are added locally afterwards, and the
 * default stage "full" then checks the whole dossier.
 *
 * Exit code 1 when any dossier has an error. Warnings never block.
 * The contract lives in docs/CLOUD_RESEARCH_BRIEF.md.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
// v2 dossiers live apart from research/tool-pages/, which holds the
// attestation pipeline files (scripts/research-attest.mjs) and must not be
// overwritten.
const DIR = path.join(ROOT, "research/dossiers");
const catalogue = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/tools_v4.json"), "utf8"));
const SLUGS = new Set(catalogue.map((t) => t.slug || t.id));

const PRICING_MODELS = ["free", "freemium", "subscription", "per_seat", "usage", "one_time", "subscription_and_perpetual", "quote", "open_source", "bundle_only"];
const PLAN_UNITS = ["account", "seat", "workspace", "site", "usage", "one_time"];
const URL_STATUS = ["ok", "moved", "parked", "dead", "blocked"];
const PRODUCT_STATUS = ["active", "discontinued", "acquired", "renamed"];
const PERSONAS = ["THEO", "SOFIA", "MARC", "ALIX", "CLAIRE", "OTHER"];
const LEVELS = ["low", "medium", "high"];
const AXES = ["valeurAjoutee", "simplicite", "utilisation", "puissance", "reversibilite"];
const TIERS = ["A", "B"];

const rawArgs = process.argv.slice(2);
const stageAt = rawArgs.indexOf("--stage");
const STAGE = stageAt >= 0 ? rawArgs[stageAt + 1] : "full";
if (!["facts", "full"].includes(STAGE)) throw new Error(`unknown stage "${STAGE}" (facts | full)`);
const args = stageAt >= 0 ? rawArgs.filter((_, i) => i !== stageAt && i !== stageAt + 1) : rawArgs;
const FACTS = STAGE === "facts";
const LANGS = FACTS ? ["en"] : ["en", "fr"];
const files = args.includes("--all")
  ? fs.readdirSync(DIR).filter((f) => f.endsWith(".json"))
  : args.map((slug) => `${slug}.json`);

let failed = 0;
for (const file of files) {
  const errors = [];
  const warnings = [];
  const full = path.join(DIR, file);
  if (!fs.existsSync(full)) {
    console.log(`✖ ${file}: missing`);
    failed++;
    continue;
  }
  let d;
  try {
    d = JSON.parse(fs.readFileSync(full, "utf8"));
  } catch (e) {
    console.log(`✖ ${file}: invalid JSON (${e.message})`);
    failed++;
    continue;
  }
  if (d.schemaVersion !== 2) {
    if (args.includes("--all")) continue; // v1 pilots are legacy, not checked
    errors.push("schemaVersion must be 2");
  }
  validate(d, errors, warnings);
  if (errors.length) failed++;
  const mark = errors.length ? "✖" : warnings.length ? "⚠" : "✔";
  console.log(`${mark} ${file}${errors.length ? ` (${errors.length} error(s))` : ""}${warnings.length ? ` (${warnings.length} warning(s))` : ""}`);
  for (const e of errors) console.log(`    error: ${e}`);
  for (const w of warnings) console.log(`    warn:  ${w}`);
}
console.log(`\n${files.length} dossier(s), ${failed} with errors`);
process.exit(failed ? 1 : 0);

function validate(d, errors, warnings) {
  const isDate = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const isUrl = (v) => typeof v === "string" && /^https?:\/\/\S+$/.test(v);
  const bi = (v, where, { required = true } = {}) => {
    if (v == null) { if (required) errors.push(`${where}: missing {${LANGS.join(", ")}}`); return; }
    for (const lang of LANGS) {
      if (typeof v[lang] !== "string" || !v[lang].trim()) errors.push(`${where}.${lang}: empty`);
      else if (v[lang].includes("—")) errors.push(`${where}.${lang}: em dash (—) is not allowed`);
    }
    if (v.en && v.fr && v.en.trim() === v.fr.trim() && v.en.split(" ").length > 3) warnings.push(`${where}: en and fr are identical`);
  };

  if (!SLUGS.has(d.slug)) errors.push(`slug "${d.slug}" is not in the catalogue`);
  if (!TIERS.includes(d.tier)) errors.push(`tier must be one of ${TIERS.join(", ")}`);
  if (!isDate(d.researchedOn)) errors.push("researchedOn must be YYYY-MM-DD");
  const expectedStatus = FACTS ? "facts_collected" : "needs_review";
  if (d.status !== expectedStatus) errors.push(`status must be "${expectedStatus}" at stage ${STAGE} (only a human approves)`);

  // Sources: every fact points to one of these.
  const sources = Array.isArray(d.sources) ? d.sources : [];
  if (!sources.length) errors.push("sources: at least one source required");
  const sourceIds = new Set();
  for (const s of sources) {
    if (!s.id) errors.push("sources[]: id missing");
    sourceIds.add(s.id);
    if (!isUrl(s.url)) errors.push(`sources.${s.id}: invalid url`);
    if (![1, 2].includes(s.tier)) errors.push(`sources.${s.id}: tier must be 1 (official) or 2 (independent)`);
    if (!isDate(s.accessedOn)) errors.push(`sources.${s.id}: accessedOn must be YYYY-MM-DD`);
  }
  const cite = (ids, where) => {
    const list = Array.isArray(ids) ? ids : ids ? [ids] : [];
    if (!list.length) { errors.push(`${where}: no source`); return; }
    for (const id of list) if (!sourceIds.has(id)) errors.push(`${where}: unknown source "${id}"`);
  };

  // Identity
  const id = d.identity || {};
  if (!id.officialName) errors.push("identity.officialName missing");
  if (!isUrl(id.officialUrl)) errors.push("identity.officialUrl invalid");
  if (!URL_STATUS.includes(id.urlStatus)) errors.push(`identity.urlStatus must be one of ${URL_STATUS.join(", ")}`);
  if (!PRODUCT_STATUS.includes(id.productStatus)) errors.push(`identity.productStatus must be one of ${PRODUCT_STATUS.join(", ")}`);
  if (id.productStatus !== "active" && !id.statusNote) errors.push("identity.statusNote required when the product is not active");

  // Pricing: the strictest block.
  const p = d.pricing || {};
  if (!PRICING_MODELS.includes(p.model)) errors.push(`pricing.model must be one of ${PRICING_MODELS.join(", ")}`);
  if (!isDate(p.verifiedOn)) errors.push("pricing.verifiedOn must be YYYY-MM-DD");
  if (!isUrl(p.pricingUrl) && p.model !== "open_source") errors.push("pricing.pricingUrl missing");
  if (typeof p.currency !== "string" || !/^[A-Z]{3}$/.test(p.currency)) errors.push("pricing.currency must be an ISO code (USD, EUR…)");
  if (typeof p.freePlan?.exists !== "boolean") errors.push("pricing.freePlan.exists must be true or false");
  if (p.freePlan?.exists) cite(p.freePlan.sourceIds, "pricing.freePlan");
  if (p.trial) {
    if (!Number.isInteger(p.trial.days) || p.trial.days <= 0) errors.push("pricing.trial.days must be a positive integer");
    cite(p.trial.sourceIds, "pricing.trial");
  }
  const plans = Array.isArray(p.plans) ? p.plans : [];
  if (!plans.length && !["quote", "open_source"].includes(p.model)) errors.push("pricing.plans: at least one plan required");
  const planKeys = new Set();
  for (const [i, plan] of plans.entries()) {
    const at = `pricing.plans[${i}] (${plan.name || "?"})`;
    if (!plan.key || !/^[a-z0-9-]+$/.test(plan.key)) errors.push(`${at}: key must be kebab-case`);
    if (planKeys.has(plan.key)) errors.push(`${at}: duplicate key`);
    planKeys.add(plan.key);
    if (!plan.name) errors.push(`${at}: name missing`);
    if (!PLAN_UNITS.includes(plan.unit)) errors.push(`${at}: unit must be one of ${PLAN_UNITS.join(", ")}`);
    const pr = plan.price || {};
    const amounts = ["monthly", "annualPerMonth", "oneTime"].map((k) => pr[k]);
    for (const [k, v] of Object.entries(pr)) {
      if (v != null && (typeof v !== "number" || v < 0)) errors.push(`${at}: price.${k} must be a number ≥ 0 or null`);
    }
    if (!plan.onQuote && amounts.every((v) => v == null)) errors.push(`${at}: no price and not onQuote`);
    if (plan.onQuote && amounts.some((v) => v != null && v > 0)) errors.push(`${at}: onQuote plan cannot carry a price`);
    if (pr.oneTime != null && (pr.monthly != null || pr.annualPerMonth != null)) warnings.push(`${at}: one-time and recurring price on the same plan`);
    if (pr.annualPerMonth != null && pr.monthly != null && pr.annualPerMonth > pr.monthly) warnings.push(`${at}: annual billing costs more per month than monthly billing`);
    if (plan.minSeats != null && (!Number.isInteger(plan.minSeats) || plan.minSeats < 1)) errors.push(`${at}: minSeats must be an integer ≥ 1`);
    if (plan.unit === "seat" && plan.minSeats == null) warnings.push(`${at}: per-seat plan without minSeats (use 1 when there is no minimum)`);
    cite(plan.sourceIds, at);
  }
  if (p.freePlan?.exists && !plans.some((plan) => plan.price?.monthly === 0 || plan.price?.annualPerMonth === 0)) {
    warnings.push("pricing.freePlan.exists but no plan priced 0");
  }
  if (p.comparePlanKey != null && !planKeys.has(p.comparePlanKey)) errors.push(`pricing.comparePlanKey "${p.comparePlanKey}" is not a plan key`);
  if (p.comparePlanKey == null && !["free", "open_source", "quote"].includes(p.model)) errors.push("pricing.comparePlanKey required (see the comparison rule in the brief)");
  for (const [i, a] of (p.addOns || []).entries()) cite(a.sourceIds, `pricing.addOns[${i}]`);
  for (const [i, c] of (p.cautions || []).entries()) { bi(c, `pricing.cautions[${i}]`); cite(c.sourceIds, `pricing.cautions[${i}]`); }

  // Alternatives: real slugs only; missing competitors go to their own list.
  for (const [i, a] of (d.alternatives || []).entries()) {
    if (!SLUGS.has(a.slug)) errors.push(`alternatives[${i}]: slug "${a.slug}" not in catalogue (use missingAlternatives)`);
    if (a.slug === d.slug) errors.push(`alternatives[${i}]: a tool is not its own alternative`);
    bi(a.reason, `alternatives[${i}].reason`);
  }
  for (const [i, m] of (d.missingAlternatives || []).entries()) {
    if (!m.name || !isUrl(m.officialUrl)) errors.push(`missingAlternatives[${i}]: name and officialUrl required`);
  }

  // Product facts are collected at both stages for tier A.
  if (d.tier === "A") {
    for (const key of ["capabilities", "limitations"]) {
      const list = d.product?.[key] || [];
      if (list.length < 2) errors.push(`product.${key}: at least 2 expected for tier A`);
      list.forEach((item, i) => { bi(item, `product.${key}[${i}]`); cite(item.sourceIds, `product.${key}[${i}]`); });
    }
  }

  // Rating, audience and editorial are written locally, not in the cloud.
  if (!FACTS) {
    // Rating: five axes, each with evidence tied to sources. No favours.
    const r = d.rating || {};
    for (const axis of AXES) {
      if (![1, 2, 3, 4, 5].includes(r[axis])) errors.push(`rating.${axis} must be an integer 1-5`);
      const ev = r.evidence?.[axis];
      bi(ev, `rating.evidence.${axis}`);
      if (ev) cite(ev.sourceIds, `rating.evidence.${axis}`);
    }
    if (r.lastActivityVerifiedOn != null && !isDate(r.lastActivityVerifiedOn)) errors.push("rating.lastActivityVerifiedOn must be YYYY-MM-DD or null");

    // Editorial drafts: tier B needs the essentials, tier A the full fiche.
    const e = d.editorial || {};
    bi(e.tagline, "editorial.tagline");
    if (e.tagline) for (const lang of ["en", "fr"]) {
      const words = String(e.tagline[lang] || "").trim().split(/\s+/).length;
      if (words > 4) errors.push(`editorial.tagline.${lang}: ${words} words, 2 to 3 expected`);
    }
    bi(e.shortDescription, "editorial.shortDescription");
    if (d.tier === "A") {
      const a = d.audience || {};
      if (!PERSONAS.includes(a.persona)) errors.push(`audience.persona must be one of ${PERSONAS.join(", ")} (one target only)`);
      bi(a.description, "audience.description");
      if (!LEVELS.includes(a.soloRelevance)) errors.push(`audience.soloRelevance must be ${LEVELS.join(" | ")}`);
      if (!LEVELS.includes(a.teamRelevance)) errors.push(`audience.teamRelevance must be ${LEVELS.join(" | ")}`);
      if ((d.useCases || []).length < 2) errors.push("useCases: at least 2 expected for tier A");
      (d.useCases || []).forEach((u, i) => bi(u, `useCases[${i}]`));
      bi(e.longDescription, "editorial.longDescription");
      for (const key of ["pros", "cons"]) {
        if ((e[key] || []).length < 2) errors.push(`editorial.${key}: at least 2 expected for tier A`);
        (e[key] || []).forEach((item, i) => bi(item, `editorial.${key}[${i}]`));
      }
      for (const key of ["keepIf", "avoidIf", "threshold"]) bi(e.verdict?.[key], `editorial.verdict.${key}`);
      if ((d.alternatives || []).length + (d.missingAlternatives || []).length < 2) warnings.push("fewer than 2 alternatives for a tier A tool");
    }
  }

  // Honesty checks on the whole dossier.
  const text = JSON.stringify(d);
  if (/—/.test(text)) errors.push("em dash (—) found somewhere in the dossier");
  const hype = text.match(/\b(powerful|robust|revolutionary|seamless|game[- ]changer|puissant|robuste|révolutionnaire)\b/gi);
  if (hype) warnings.push(`generic superlatives: ${[...new Set(hype.map((w) => w.toLowerCase()))].join(", ")}`);
  if (!Array.isArray(d.unknowns)) errors.push("unknowns must be an array (empty when nothing is unknown)");
}
