#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stableStringify } from "./catalog/stable-json.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_CATALOG = path.join(ROOT, "src", "data", "tools_v4.json");
const DEFAULT_LEDGER = path.join(ROOT, "research", "catalog-review-ledger.json");
const BUNDLE_DIR = path.join(ROOT, "research", "bundle-editorial");
const MEDIA_EVIDENCE_DIR = path.join(ROOT, "research", "media-evidence");
const REVIEW_WORK_ORDER_DIR = path.join(ROOT, "research", "review-work-orders");

export const REVIEW_STATES = [
  "QUEUED",
  "RESEARCHED",
  "EDITORIAL_READY",
  "MEDIA_READY",
  "VALIDATED",
  "RENDER_VERIFIED",
  "PUBLISHED",
  "REVIEW_REQUIRED",
  "BLOCKED",
  "STALE",
  "DISCONTINUED",
  "DUPLICATE",
];

const TERMINAL_REVIEW_STATES = new Set(["VALIDATED", "RENDER_VERIFIED", "PUBLISHED"]);
const FINGERPRINT_LOCKED_STATES = new Set(["MEDIA_READY", "VALIDATED", "RENDER_VERIFIED", "PUBLISHED"]);
const ALLOWED_TRANSITIONS = {
  QUEUED: new Set(["RESEARCHED", "REVIEW_REQUIRED", "BLOCKED", "DISCONTINUED", "DUPLICATE"]),
  RESEARCHED: new Set(["EDITORIAL_READY", "REVIEW_REQUIRED", "BLOCKED", "DISCONTINUED", "DUPLICATE"]),
  EDITORIAL_READY: new Set(["MEDIA_READY", "REVIEW_REQUIRED", "BLOCKED"]),
  MEDIA_READY: new Set(["VALIDATED", "REVIEW_REQUIRED", "BLOCKED"]),
  VALIDATED: new Set(["RENDER_VERIFIED", "REVIEW_REQUIRED", "STALE"]),
  RENDER_VERIFIED: new Set(["PUBLISHED", "REVIEW_REQUIRED", "STALE"]),
  PUBLISHED: new Set(["STALE", "REVIEW_REQUIRED", "DISCONTINUED", "DUPLICATE"]),
  REVIEW_REQUIRED: new Set(["RESEARCHED", "EDITORIAL_READY", "VALIDATED", "BLOCKED", "DISCONTINUED", "DUPLICATE"]),
  BLOCKED: new Set(["RESEARCHED", "REVIEW_REQUIRED", "DISCONTINUED", "DUPLICATE"]),
  STALE: new Set(["RESEARCHED", "REVIEW_REQUIRED", "BLOCKED", "DISCONTINUED", "DUPLICATE"]),
  DISCONTINUED: new Set(["REVIEW_REQUIRED"]),
  DUPLICATE: new Set(["REVIEW_REQUIRED"]),
};

function argValue(name, fallback = null) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
}

function sha(value) {
  return `sha256:${createHash("sha256").update(stableStringify(value)).digest("hex")}`;
}

function normalizedCategory(tool) {
  return String(tool.category || "uncategorized")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "uncategorized";
}

function sourceUrl(tool) {
  return tool.pricing_v5?.official_source_url || tool.websiteUrl || tool.affiliateLink || null;
}

function verifiedOn(tool) {
  return tool.pricing_v5?.verified_on || null;
}

function hasPaidPrice(tool) {
  const compare = Number(tool.pricing_v5?.compare_price_monthly_eur);
  return compare > 0 || Number(tool.defaultMonthlyPrice) > 0 || Boolean(tool.pricing?.paid);
}

function editorialDepth(tool) {
  return Math.max(
    String(tool.longDescription || "").trim().length,
    String(tool.description || "").trim().length,
  );
}

function ageInDays(date, today) {
  if (!date) return null;
  const ms = Date.parse(today) - Date.parse(date);
  return Number.isFinite(ms) ? Math.max(0, Math.floor(ms / 86400000)) : null;
}

export function priorityFor(tool, { bundleExists, mediaEvidenceStatus = "MISSING", today }) {
  let score = 0;
  const reasons = [];
  if (tool.affiliateLink) { score += 100; reasons.push("affiliate_link"); }
  if (hasPaidPrice(tool)) { score += 80; reasons.push("paid_price"); }
  if (!sourceUrl(tool)) { score += 70; reasons.push("missing_official_source"); }
  if (!bundleExists) { score += 50; reasons.push("missing_fact_bundle"); }
  if (mediaEvidenceStatus !== "VALID") { score += 40; reasons.push("missing_or_invalid_media_evidence"); }
  if (!tool.longDescriptionEn) { score += 45; reasons.push("missing_english_editorial"); }
  if (editorialDepth(tool) < 280) { score += 40; reasons.push("shallow_editorial"); }
  if (!tool.ogImageUrl && !(tool.galleryImages || []).length) { score += 25; reasons.push("missing_media"); }
  const age = ageInDays(verifiedOn(tool), today);
  if (age == null) { score += 35; reasons.push("undated_source"); }
  else if (age > 365) { score += 30; reasons.push("source_older_than_year"); }
  else if (age > 180) { score += 15; reasons.push("source_older_than_six_months"); }
  return { score, reasons };
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || ""));
}

export function validateMediaEvidence(evidence, expectedSlug) {
  const errors = [];
  if (!evidence || typeof evidence !== "object") return ["media_evidence_missing"];
  if (evidence.slug !== expectedSlug) errors.push("media_slug_mismatch");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(evidence.verified_on || ""))) errors.push("media_verified_on_invalid");
  const pages = evidence.discovery?.official_pages_checked;
  if (!Array.isArray(pages) || pages.length < 1 || pages.some((url) => !isHttpUrl(url))) {
    errors.push("official_pages_checked_missing");
  }
  const items = Array.isArray(evidence.items) ? evidence.items : [];
  if (evidence.mode === "sourced") {
    if (evidence.discovery?.official_media_found !== true) errors.push("sourced_requires_official_media_found");
    if (items.length < 1 || items.length > 4) errors.push("sourced_media_count_must_be_1_to_4");
    for (const item of items) {
      if (!isHttpUrl(item.url)) errors.push("sourced_media_url_must_be_remote");
      if (!isHttpUrl(item.source_page_url)) errors.push("sourced_media_source_page_missing");
      if (item.official !== true) errors.push("sourced_media_must_be_official");
      if (item.capture_method) errors.push("sourced_media_cannot_be_self_captured");
    }
  } else if (evidence.mode === "fallback_screenshot") {
    if (evidence.discovery?.official_media_found !== false) errors.push("fallback_requires_no_official_media");
    if (items.length !== 1) errors.push("fallback_requires_exactly_one_screenshot");
    const item = items[0];
    if (item) {
      if (item.kind !== "screenshot") errors.push("fallback_item_must_be_screenshot");
      if (item.capture_method !== "browser_screenshot") errors.push("fallback_capture_method_invalid");
      if (!isHttpUrl(item.source_page_url)) errors.push("fallback_source_page_missing");
      if (item.official === true) errors.push("fallback_screenshot_is_not_official_media");
      if (!String(item.url || "").startsWith("/")) errors.push("fallback_screenshot_must_be_local_asset");
    }
  } else {
    errors.push("media_mode_invalid");
  }
  return [...new Set(errors)];
}

function riskTier(score) {
  if (score >= 180) return "critical";
  if (score >= 120) return "high";
  if (score >= 70) return "medium";
  return "low";
}

function readJson(file, fallback = null) {
  if (!existsSync(file)) return fallback;
  return JSON.parse(readFileSync(file, "utf8"));
}

function catalogueFingerprint(tool) {
  return sha(tool);
}

function fileFingerprint(file) {
  return existsSync(file)
    ? `sha256:${createHash("sha256").update(readFileSync(file)).digest("hex")}`
    : null;
}

function assignBatches(entries, size) {
  const groups = new Map();
  for (const entry of entries) {
    if (entry.assigned_batch && entry.batch_position) continue;
    const key = `${entry.category}:${entry.risk_tier}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }
  for (const [key, group] of groups) {
    group.sort((a, b) => b.priority_score - a.priority_score || a.slug.localeCompare(b.slug));
    const prefix = `review-${key.replace(":", "-")}-`;
    const occupied = new Set(
      entries
        .filter((entry) => entry.assigned_batch?.startsWith(prefix) && entry.batch_position)
        .map((entry) => `${entry.assigned_batch}:${entry.batch_position}`),
    );
    for (const entry of group) {
      let waveNumber = 1;
      let position = 1;
      while (occupied.has(`${prefix}${String(waveNumber).padStart(3, "0")}:${position}`)) {
        position += 1;
        if (position > size) {
          waveNumber += 1;
          position = 1;
        }
      }
      entry.assigned_batch = `${prefix}${String(waveNumber).padStart(3, "0")}`;
      entry.batch_position = position;
      occupied.add(`${entry.assigned_batch}:${position}`);
    }
  }
}

export function buildLedger({ tools, previous = null, today, batchSize = 10, bundleDir = BUNDLE_DIR, mediaEvidenceDir = MEDIA_EVIDENCE_DIR }) {
  if (!Array.isArray(tools)) throw new Error("Le catalogue doit être un tableau JSON.");
  const previousBySlug = new Map((previous?.entries || []).map((entry) => [entry.slug, entry]));
  const seen = new Set();
  const duplicates = [];
  const entries = [];

  for (const tool of tools) {
    const slug = String(tool.slug || "").trim();
    if (!slug) throw new Error(`Outil sans slug: ${tool.id || tool.name || "inconnu"}`);
    if (seen.has(slug)) duplicates.push(slug);
    seen.add(slug);

    const catalogHash = catalogueFingerprint(tool);
    const old = previousBySlug.get(slug);
    const bundleFile = path.join(bundleDir, `${slug}.json`);
    const bundleExists = existsSync(bundleFile);
    const bundleHash = fileFingerprint(bundleFile);
    const mediaEvidenceFile = path.join(mediaEvidenceDir, `${slug}.json`);
    const mediaEvidence = readJson(mediaEvidenceFile, null);
    const mediaErrors = validateMediaEvidence(mediaEvidence, slug);
    const mediaEvidenceHash = fileFingerprint(mediaEvidenceFile);
    const mediaEvidenceStatus = mediaEvidence == null ? "MISSING" : mediaErrors.length ? "INVALID" : "VALID";
    const qualityVersion = old?.quality_version || "catalog-review-v1";
    const reviewFingerprint = sha({
      catalog_hash: catalogHash,
      fact_bundle_hash: bundleHash,
      media_evidence_hash: mediaEvidenceHash,
      quality_version: qualityVersion,
    });
    const priority = priorityFor(tool, { bundleExists, mediaEvidenceStatus, today });
    let status = old?.status || "QUEUED";
    let invalidatedFrom = old?.invalidated_from || null;
    if (old && old.review_fingerprint !== reviewFingerprint && FINGERPRINT_LOCKED_STATES.has(old.status)) {
      invalidatedFrom = old.status;
      status = "STALE";
    }

    entries.push({
      slug,
      name: tool.name || slug,
      category: normalizedCategory(tool),
      status,
      catalog_hash: catalogHash,
      fact_bundle_hash: bundleHash,
      media_evidence: mediaEvidenceStatus,
      media_evidence_hash: mediaEvidenceHash,
      media_errors: mediaErrors,
      review_fingerprint: reviewFingerprint,
      reviewed_hash: old?.reviewed_hash || null,
      reviewed_at: old?.reviewed_at || null,
      reviewer: old?.reviewer || null,
      rendered_at: old?.rendered_at || null,
      published_at: old?.published_at || null,
      source_url: sourceUrl(tool),
      source_verified_on: verifiedOn(tool),
      fact_bundle: bundleExists ? "AVAILABLE" : "MISSING",
      priority_score: priority.score,
      priority_reasons: priority.reasons,
      risk_tier: riskTier(priority.score),
      blockers: old?.blockers || [],
      invalidated_from: invalidatedFrom,
      next_review_at: old?.next_review_at || null,
      quality_version: qualityVersion,
      assigned_batch: old?.assigned_batch || null,
      batch_position: old?.batch_position || null,
    });
  }

  if (duplicates.length) throw new Error(`Slugs dupliqués dans le catalogue: ${[...new Set(duplicates)].join(", ")}`);
  assignBatches(entries, batchSize);
  entries.sort((a, b) => b.priority_score - a.priority_score || a.slug.localeCompare(b.slug));

  return {
    schema_version: 1,
    generated_on: today,
    catalogue_path: "src/data/tools_v4.json",
    catalogue_count: entries.length,
    batch_size: batchSize,
    entries,
  };
}

export function validateLedger(ledger, tools) {
  const errors = [];
  const slugs = tools.map((tool) => tool.slug);
  const catalogue = new Set(slugs);
  const ledgerSlugs = ledger.entries.map((entry) => entry.slug);
  const ledgerSet = new Set(ledgerSlugs);
  const duplicateLedger = ledgerSlugs.filter((slug, index) => ledgerSlugs.indexOf(slug) !== index);
  if (ledger.entries.length !== tools.length) errors.push(`coverage_count:${ledger.entries.length}/${tools.length}`);
  for (const slug of slugs) if (!ledgerSet.has(slug)) errors.push(`missing:${slug}`);
  for (const slug of ledgerSlugs) if (!catalogue.has(slug)) errors.push(`orphan:${slug}`);
  for (const slug of new Set(duplicateLedger)) errors.push(`duplicate:${slug}`);
  for (const entry of ledger.entries) {
    if (!REVIEW_STATES.includes(entry.status)) errors.push(`invalid_status:${entry.slug}:${entry.status}`);
    if (!entry.assigned_batch) errors.push(`unassigned:${entry.slug}`);
    if (["MEDIA_READY", "VALIDATED", "RENDER_VERIFIED", "PUBLISHED"].includes(entry.status) && entry.media_evidence !== "VALID") {
      errors.push(`media_evidence_not_valid:${entry.slug}`);
    }
    if (TERMINAL_REVIEW_STATES.has(entry.status) && entry.reviewed_hash !== entry.review_fingerprint) {
      errors.push(`review_hash_mismatch:${entry.slug}`);
    }
  }
  return errors;
}

export function ledgerReport(ledger) {
  const byStatus = {};
  const byRisk = {};
  const batches = new Set();
  for (const entry of ledger.entries) {
    byStatus[entry.status] = (byStatus[entry.status] || 0) + 1;
    byRisk[entry.risk_tier] = (byRisk[entry.risk_tier] || 0) + 1;
    batches.add(entry.assigned_batch);
  }
  return {
    catalogue: ledger.catalogue_count,
    assigned_once: ledger.entries.length,
    batches: batches.size,
    by_status: byStatus,
    by_risk: byRisk,
    next: ledger.entries
      .filter((entry) => !["PUBLISHED", "DISCONTINUED", "DUPLICATE"].includes(entry.status))
      .slice(0, 10)
      .map(({ slug, name, priority_score, priority_reasons, assigned_batch }) => ({
        slug, name, priority_score, priority_reasons, assigned_batch,
      })),
  };
}

function compactTool(tool) {
  return {
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
    category: tool.category,
    host_app: tool.host_app || null,
    website_url: tool.websiteUrl || null,
    affiliate_url: tool.affiliateLink || null,
    source_url: sourceUrl(tool),
    source_verified_on: verifiedOn(tool),
    pricing: tool.pricing || null,
    pricing_en: tool.pricingEn || null,
    pricing_v5: tool.pricing_v5 || null,
    short_description: tool.shortDescription || null,
    short_description_en: tool.shortDescriptionEn || null,
    long_description: tool.longDescription || tool.description || null,
    long_description_en: tool.longDescriptionEn || null,
    verdict: tool.verdict || null,
    verdict_en: tool.verdictEn || null,
    pros: tool.pros || [],
    pros_en: tool.prosEn || [],
    cons: tool.cons || [],
    cons_en: tool.consEn || [],
    use_cases: tool.useCases || [],
    use_cases_en: tool.useCasesEn || [],
    alternatives: tool.alternatives || [],
    media: {
      og_image_url: tool.ogImageUrl || null,
      gallery_images: tool.galleryImages || [],
    },
  };
}

export function buildReviewWorkOrder({ ledger, tools, batchId, bundleDir = BUNDLE_DIR, mediaEvidenceDir = MEDIA_EVIDENCE_DIR }) {
  const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));
  const entries = ledger.entries.filter((entry) => entry.assigned_batch === batchId);
  if (!entries.length) throw new Error(`Lot absent du registre: ${batchId}`);
  return {
    schema_version: 1,
    batch: batchId,
    quality_version: "catalog-review-v1",
    rules: {
      primary_sources_only: true,
      facts_separate_from_editorial: true,
      uncertain_identity_or_price: "BLOCKED",
      required_locales: ["fr", "en"],
      require_render_verification: true,
    },
    tools: entries.map((entry) => {
      const tool = bySlug.get(entry.slug);
      const bundleFile = path.join(bundleDir, `${entry.slug}.json`);
      const mediaEvidenceFile = path.join(mediaEvidenceDir, `${entry.slug}.json`);
      return {
        tracking: entry,
        current: compactTool(tool),
        fact_bundle: readJson(bundleFile, null),
        media_evidence: readJson(mediaEvidenceFile, null),
        required_action: entry.status === "DUPLICATE"
          ? "resolve_duplicate_without_research"
          : entry.fact_bundle === "MISSING"
            ? "research_primary_sources_then_write_fact_bundle"
            : "verify_bundle_freshness_then_review_editorial",
      };
    }),
  };
}

export function markEntry(ledger, { slug, status, reviewer, reason, at }) {
  if (!REVIEW_STATES.includes(status)) throw new Error(`Statut inconnu: ${status}`);
  const entry = ledger.entries.find((candidate) => candidate.slug === slug);
  if (!entry) throw new Error(`Slug absent du registre: ${slug}`);
  if (entry.status === status) return entry;
  if (!ALLOWED_TRANSITIONS[entry.status]?.has(status)) {
    throw new Error(`Transition interdite pour ${slug}: ${entry.status} -> ${status}`);
  }
  if (["RESEARCHED", "EDITORIAL_READY"].includes(status) && entry.fact_bundle !== "AVAILABLE") {
    throw new Error(`${slug}: aucun dossier factuel disponible`);
  }
  if (status === "MEDIA_READY" && entry.media_evidence !== "VALID") {
    throw new Error(`${slug}: preuve média valide requise avant MEDIA_READY`);
  }
  if (["VALIDATED", "RENDER_VERIFIED", "PUBLISHED"].includes(status) && !reviewer) {
    throw new Error(`${slug}: reviewer requis pour ${status}`);
  }
  if (["BLOCKED", "REVIEW_REQUIRED", "DISCONTINUED", "DUPLICATE"].includes(status) && !reason) {
    throw new Error(`${slug}: raison requise pour ${status}`);
  }
  if (status === "BLOCKED" || status === "REVIEW_REQUIRED") entry.blockers = [reason];
  else if (!["DISCONTINUED", "DUPLICATE"].includes(status)) entry.blockers = [];
  if (status === "VALIDATED") {
    entry.reviewed_hash = entry.review_fingerprint;
    entry.reviewed_at = at;
    entry.reviewer = reviewer;
    entry.invalidated_from = null;
  }
  if (status === "RENDER_VERIFIED") entry.rendered_at = at;
  if (status === "PUBLISHED") entry.published_at = at;
  if (["DISCONTINUED", "DUPLICATE"].includes(status)) entry.blockers = [reason];
  entry.status = status;
  return entry;
}

function main() {
  const command = process.argv[2] || "report";
  const catalogFile = path.resolve(argValue("catalog", DEFAULT_CATALOG));
  const ledgerFile = path.resolve(argValue("ledger", DEFAULT_LEDGER));
  const today = argValue("date", new Date().toISOString().slice(0, 10));
  const batchSize = Number(argValue("batch-size", "10"));
  const tools = readJson(catalogFile);

  if (command === "sync") {
    const previous = readJson(ledgerFile, null);
    const ledger = buildLedger({ tools, previous, today, batchSize });
    const errors = validateLedger(ledger, tools);
    if (errors.length) throw new Error(`Registre invalide:\n${errors.join("\n")}`);
    writeFileSync(ledgerFile, stableStringify(ledger));
    console.log(stableStringify(ledgerReport(ledger)).trim());
    return;
  }

  const ledger = readJson(ledgerFile);
  if (!ledger) throw new Error(`Registre absent: ${ledgerFile}. Lancez d'abord la commande sync.`);
  if (command === "mark") {
    const slug = argValue("slug");
    const status = String(argValue("status", "")).toUpperCase();
    const reviewer = argValue("reviewer");
    const reason = argValue("reason");
    if (!slug || !status) throw new Error("mark exige --slug=<slug> et --status=<statut>");
    const entry = markEntry(ledger, { slug, status, reviewer, reason, at: today });
    const errors = validateLedger(ledger, tools);
    if (errors.length) throw new Error(`Registre invalide après transition:\n${errors.join("\n")}`);
    writeFileSync(ledgerFile, stableStringify(ledger));
    console.log(stableStringify(entry).trim());
    return;
  }
  if (command === "work-order") {
    const batchId = argValue("batch");
    if (!batchId) throw new Error("work-order exige --batch=<id>");
    const workOrder = buildReviewWorkOrder({ ledger, tools, batchId });
    const outputDir = path.join(REVIEW_WORK_ORDER_DIR, batchId);
    mkdirSync(outputDir, { recursive: true });
    const expectedFiles = new Set(workOrder.tools.map((item) => `${item.current.slug}.json`));
    for (const file of readdirSync(outputDir)) {
      if (file.endsWith(".json") && file !== "manifest.json" && !expectedFiles.has(file)) {
        unlinkSync(path.join(outputDir, file));
      }
    }
    const manifest = {
      schema_version: workOrder.schema_version,
      batch: workOrder.batch,
      quality_version: workOrder.quality_version,
      rules: workOrder.rules,
      tools: workOrder.tools.map((item) => ({
        slug: item.current.slug,
        status: item.tracking.status,
        required_action: item.required_action,
        file: `${item.current.slug}.json`,
      })),
    };
    for (const item of workOrder.tools) {
      const output = path.join(outputDir, `${item.current.slug}.json`);
      writeFileSync(output, stableStringify({
        schema_version: workOrder.schema_version,
        batch: workOrder.batch,
        quality_version: workOrder.quality_version,
        rules: workOrder.rules,
        ...item,
      }));
    }
    writeFileSync(path.join(outputDir, "manifest.json"), stableStringify(manifest));
    console.log(`${path.relative(ROOT, outputDir)}/ (${workOrder.tools.length} dossiers unitaires)`);
    return;
  }
  if (command === "check") {
    const errors = validateLedger(ledger, tools);
    if (errors.length) throw new Error(errors.join("\n"));
    console.log(`Catalogue review ledger: PASS (${ledger.entries.length} outils, couverture exhaustive)`);
    return;
  }
  if (command === "report") {
    console.log(stableStringify(ledgerReport(ledger)).trim());
    return;
  }
  throw new Error(`Commande inconnue: ${command}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
