#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const batch = process.argv.find((arg) => arg.startsWith("--batch="))?.split("=")[1];
if (!batch) throw new Error("Usage: node scripts/apply-catalog-review-batch.mjs --batch=<id>");

const manifest = JSON.parse(readFileSync(path.join(root, "research/review-work-orders", batch, "manifest.json"), "utf8"));
const ledger = JSON.parse(readFileSync(path.join(root, "research/catalog-review-ledger.json"), "utf8"));
const statusBySlug = new Map(ledger.entries.map((entry) => [entry.slug, entry.status]));
const catalogFile = path.join(root, "src/data/tools_v4.json");
const tools = JSON.parse(readFileSync(catalogFile, "utf8"));
const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));
const applied = [];
const skipped = [];

for (const item of manifest.tools) {
  const slug = item.slug;
  const bundleFile = path.join(root, "research/bundle-editorial", `${slug}.json`);
  const mediaFile = path.join(root, "research/media-evidence", `${slug}.json`);
  const tool = bySlug.get(slug);
  if (!tool || !existsSync(bundleFile) || !existsSync(mediaFile) || ["PUBLISHED", "DUPLICATE", "DISCONTINUED", "BLOCKED", "REVIEW_REQUIRED"].includes(statusBySlug.get(slug))) {
    skipped.push(slug);
    continue;
  }
  const bundle = JSON.parse(readFileSync(bundleFile, "utf8"));
  const media = JSON.parse(readFileSync(mediaFile, "utf8"));
  const featuresFr = (bundle.facts.key_features || []).join(" ; ");
  const freeDetail = bundle.facts.free_tier?.detail || bundle.facts.pricing_note || "Voir les conditions tarifaires officielles.";
  const plans = Array.isArray(bundle.facts.plans) ? bundle.facts.plans : [];
  tool.description = `${bundle.facts.what}\n\nFonctions clés : ${featuresFr}.\n\n${bundle.fr.verdict.threshold}`;
  tool.longDescription = tool.description;
  tool.longDescriptionEn = `${bundle.facts.what_en}\n\nKey strengths: ${bundle.en.pros.join("; ")}.\n\n${bundle.en.verdict.threshold}`;
  tool.shortDescription = bundle.facts.what;
  tool.shortDescriptionEn = bundle.facts.what_en;
  tool.verdict = bundle.fr.verdict;
  tool.verdictEn = bundle.en.verdict;
  tool.pros = bundle.fr.pros;
  tool.prosEn = bundle.en.pros;
  tool.cons = bundle.fr.cons;
  tool.consEn = bundle.en.cons;
  tool.useCases = bundle.fr.use_cases;
  tool.useCasesEn = bundle.en.use_cases;
  tool.relevantFor = bundle.fr.relevant_for || tool.relevantFor || [];
  tool.pricing = {
    free: freeDetail,
    paid: plans.map((plan) => `${plan.name}: ${plan.price}`).join(" ; ") || bundle.facts.pricing_note || "Voir le tarif officiel.",
  };
  tool.pricingEn = tool.pricing;
  tool.pricing_v5 = {
    ...(tool.pricing_v5 || {}),
    verified_on: bundle.verified_on,
    official_source_url: bundle.sources[0]?.url || tool.websiteUrl,
    source_domain: new URL(bundle.sources[0]?.url || tool.websiteUrl).hostname.replace(/^www\./, ""),
    verification_status: "official_explicit",
  };
  tool.ogImageUrl = media.items[0]?.url || tool.ogImageUrl || null;
  if (media.items.length > 1) {
    tool.galleryImages = media.items.slice(1).map((entry) => entry.url);
  } else if (!Array.isArray(tool.galleryImages)) {
    tool.galleryImages = [];
  }
  applied.push(slug);
}

writeFileSync(catalogFile, `${JSON.stringify(tools, null, 2)}\n`);
console.log(JSON.stringify({ batch, applied, skipped }, null, 2));
