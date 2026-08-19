#!/usr/bin/env node
/**
 * research-collector — collecteur ToolTrim, mode STRICT `RESEARCH_ONLY`. v0.3.3.1
 *
 * Contrat : docs/tool-catalog-migration/08-cahier-scraper-research-only.md
 *  - SINK LOCAL UNIQUEMENT, SANS DB. Aucune écriture Supabase / src/data.
 *  - Liste blanche (assertWritable) : research/tool-pages/ · research/runs/ ·
 *    research/cohorts/ · .cache/tooltrim/research/
 *  - URL : lues du registre `research/sources-registry.json`. AUCUNE URL devinée.
 *  - Slug : validé contre docs/tool-catalog-migration/contract-v3/manifest-1126.json.
 *  - robots.txt respecté ; aucun contournement (captcha/login/paywall/anti-bot).
 *  - 1 requête/domaine, délai >= --delay, Retry-After + backoff, 3 tentatives max.
 *  - Réponse non-OK => contrôle + erreur, JAMAIS de capture.
 *  - TTL => contrôle réseau ; seul un content_hash différent crée une VERSION.
 *  - N'écrit JAMAIS `approved`. Toute donnée ambiguë reste weak_claim/unknown.
 *  - v0.3 : contexte marché = PROUVÉ | DÉCLARÉ au registre | CANDIDAT soumis à revue.
 *    `reference_fr` n'est JAMAIS déduit d'un texte français seul.
 *  - v0.3 : adaptateurs dédiés (table ADAPTERS) quand le moteur générique ne suffit pas.
 *
 * Usage :
 *   node scripts/research-collector.mjs --slugs=carrd,wix --market=FR --locale=fr-FR \
 *        --renderer=auto --concurrency=1 --delay=2000 [--force-recheck]
 */

import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { extractWix } from "./research-adapters/wix.mjs";
import { extractWebflow } from "./research-adapters/webflow.mjs";
import { extractFramer } from "./research-adapters/framer.mjs";
import { extractSquarespace } from "./research-adapters/squarespace.mjs";
import { extractN8n } from "./research-adapters/n8n.mjs";
import { extractContra } from "./research-adapters/contra.mjs";
import { extractCalendly } from "./research-adapters/calendly.mjs";
import { extractLinear } from "./research-adapters/linear.mjs";
import { extractNotion } from "./research-adapters/notion.mjs";
import { extractLoom } from "./research-adapters/loom.mjs";
import { extractGoogleWorkspace } from "./research-adapters/google-workspace.mjs";
import { extractGeneric } from "./research-adapters/generic.mjs";
import { extractAudionotes, extractVisualcv, extractJenni } from "./research-adapters/recent-tools-pilot.mjs";
import {
  sourceIdOf, captureIdOf, observedPlanKey, canonicalPlanKey, businessKeyOf,
  valueFingerprintOf, observationIdOf, upsertSource, appendCapture, findCapture,
  appendClaim, applyObservation, migrateLegacyObservation,
  resolveEffectiveMarketContext, approvedPreEligibility, attestationReadiness,
  contextPolicySatisfied, isMetadataEnrichment,
} from "./research-model.mjs";

/** Table d'adaptateurs dédiés (hors moteur générique). Import statique : pas d'import()
 *  dynamique à template littéral (illisible pour l'analyse statique des bundlers). */
const ADAPTERS = {
  audionotes: extractAudionotes,
  visualcv: extractVisualcv,
  jenni: extractJenni,
  wix: extractWix,
  webflow: extractWebflow,
  framer: extractFramer,
  squarespace: extractSquarespace,
  n8n: extractN8n,
  contra: extractContra,
  calendly: extractCalendly,
  linear: extractLinear,
  notion: extractNotion,
  loom: extractLoom,
  "google-workspace": extractGoogleWorkspace,
  generic: extractGeneric,
};

export { resolveEffectiveMarketContext, approvedPreEligibility, attestationReadiness,
         canonicalPlanKey, observedPlanKey, captureIdOf as captureRefOf, observedPlanKey as planKeyOf };

export const COLLECTOR_VERSION = "0.4.0";
const ROOT = process.cwd();
const UA = "ToolTrimResearchBot/0.3 (+https://tooltrim.com; research; contact: bloch.mic@gmail.com)";
const REGISTRY_PATH = path.join(ROOT, "research", "sources-registry.json");
const MANIFEST_PATH = path.join(ROOT, "docs", "tool-catalog-migration", "contract-v3", "manifest-1126.json");

/* ───────────────────────── liste blanche d'écriture ───────────────────────── */
const WRITE_WHITELIST = [
  path.join(ROOT, "research", "tool-pages"),
  path.join(ROOT, "research", "runs"),
  // v0.3.3.1 — sortie locale de GOUVERNANCE RESEARCH_ONLY : cohortes de tri
  // (ex. free_tier_shape_anomaly, décision D13). Jamais chargée par le bundle.
  path.join(ROOT, "research", "cohorts"),
  path.join(ROOT, ".cache", "tooltrim", "research"),
];
export function assertWritable(p, root = ROOT) {
  const abs = path.resolve(p);
  const wl = root === ROOT ? WRITE_WHITELIST : [
    path.join(root, "research", "tool-pages"), path.join(root, "research", "runs"),
    path.join(root, "research", "cohorts"),
    path.join(root, ".cache", "tooltrim", "research"),
  ];
  if (!wl.some((w) => abs === w || abs.startsWith(w + path.sep))) {
    throw new Error(`WRITE DENIED (hors liste blanche RESEARCH_ONLY): ${abs}`);
  }
  return abs;
}
async function safeWrite(p, content) {
  const abs = assertWritable(p);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, content);
  return abs;
}

/* ───────────────────────────── utilitaires purs ───────────────────────────── */
export const nowIso = () => new Date().toISOString();
const sha1 = (s) => createHash("sha1").update(s).digest("hex");
export const sha256hex = (s) => createHash("sha256").update(s).digest("hex");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const sortKeys = (v) =>
  Array.isArray(v) ? v.map(sortKeys)
  : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]))
  : v;

/** Texte normalisé : scripts/styles/commentaires retirés, balises supprimées, espaces normalisés. */
export function normalizedText(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&euro;/gi, "€")
    .replace(/\s+/g, " ")
    .trim();
}
export const contentHash = (text) => "sha256:" + sha256hex(text);

/** Une nouvelle VERSION n'existe que si le hash diffère de la dernière capture. */
export function decideVersion(lastCapture, newHash) {
  if (!newHash) return { addVersion: false, reason: "no_capture" };
  if (!lastCapture) return { addVersion: true, reason: "first_capture" };
  return lastCapture.content_hash === newHash
    ? { addVersion: false, reason: "hash_unchanged" }
    : { addVersion: true, reason: "hash_changed" };
}

/* ─────────────────────────────── robots.txt ──────────────────────────────── */
export function parseRobots(txt) {
  const groups = []; let current = null;
  for (const raw of String(txt).split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim(); if (!line) continue;
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/); if (!m) continue;
    const field = m[1].toLowerCase(), value = m[2].trim();
    if (field === "user-agent") {
      if (!current || current.rules.length) { current = { agents: [], rules: [] }; groups.push(current); }
      current.agents.push(value.toLowerCase());
    } else if (current && (field === "disallow" || field === "allow")) current.rules.push({ type: field, path: value });
  }
  return { groups };
}
export function matchRobots(groups, pathname, uaToken = "tooltrimresearchbot") {
  const pick = groups.find((g) => g.agents.includes(uaToken)) || groups.find((g) => g.agents.includes("*"));
  if (!pick) return { allowed: true, rule: null };
  let best = null;
  for (const r of pick.rules) {
    if (r.path === "") continue;
    let hit = false;
    try { hit = new RegExp("^" + r.path.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")).test(pathname); }
    catch { hit = pathname.startsWith(r.path); }
    if (hit && (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.type === "allow"))) best = r;
  }
  return best ? { allowed: best.type === "allow", rule: `${best.type}: ${best.path}` } : { allowed: true, rule: null };
}

/* ──────────── v0.3 : contexte marché — preuve, candidat, ou déclaré ───────── */
/**
 * Marqueurs de contenu FR (€ + vocabulaire tarifaire français). NE PROUVENT RIEN :
 * ils ne servent qu'à proposer un `market_context_candidate` soumis à revue.
 */
export function frenchContentMarkers(text) {
  const t = String(text);
  const markers = [];
  if (/\bTVA\b/i.test(t)) markers.push("TVA");
  if (/\/\s*mois\b/i.test(t)) markers.push("/mois");
  if (/abonnements?\s+annuels?/i.test(t)) markers.push("abonnement annuel");
  if (/€/.test(t)) markers.push("€");
  if (/forfaits?\b/i.test(t)) markers.push("forfait");
  return markers;
}
/**
 * Décide le contexte marché d'une capture. Trois voies, jamais mélangées :
 *  1. PROUVÉ    : signal déclaré (Content-Language / <html lang> / hôte localisé)
 *                 => market_context = reference_fr | market_localized
 *  2. DÉCLARÉ   : `market_context_declared: 'global_usd_fallback'` + justification
 *                 dans le registre humain => market/locale nuls ASSUMÉS
 *  3. CANDIDAT  : texte français seul => market_context RESTE null, on émet
 *                 `market_context_candidate='reference_fr'` soumis à revue.
 */
export function decideMarketContext({ proof, registryEntry, text, market, locale, currency = null, egressCountry = null }) {
  if (proof.proven) {
    return { market_context: proof.market_context, market_context_candidate: null,
             observed_market: proof.observed_market, observed_locale: proof.observed_locale,
             market_context_source: "proven", market_evidence: proof.evidence };
  }
  const declared = registryEntry?.market_context_declared ?? null;
  if (declared === "global_usd_fallback") {
    return { market_context: "global_usd_fallback", market_context_candidate: null,
             observed_market: null, observed_locale: null,
             market_context_source: "declared_in_registry",
             market_evidence: { ...proof.evidence, registry_justification: registryEntry.market_context_justification ?? null } };
  }
  const markers = frenchContentMarkers(text);
  const evidence = { ...proof.evidence, french_content_markers: markers };
  let candidate = market === "FR" && locale === "fr-FR" && markers.length >= 3 ? "reference_fr" : null;
  let source = candidate ? "content_markers_candidate_review_required" : "unproven";
  // Faisceau DEVISE+EGRESS : une grille rendue en EUR, servie depuis un egress FR, avec
  // locale fr-FR demandée, constitue un CANDIDAT reference_fr soumis à revue humaine —
  // jamais prouvé, jamais auto-approuvé. Cas d'une page EN dont le prix EUR est géo-résolu
  // (p.ex. n8n : texte anglais, grille EUR par egress FR). Ne modifie AUCUN modèle de données.
  if (!candidate && market === "FR" && locale === "fr-FR" && currency === "EUR" && egressCountry === "FR") {
    candidate = "reference_fr";
    source = "currency_egress_candidate_review_required";
    evidence.grid_currency = currency;
    evidence.egress_country = egressCountry;
  }
  return { market_context: null, market_context_candidate: candidate,
           observed_market: null, observed_locale: null,
           market_context_source: source, market_evidence: evidence };
}

/* ──────────────────── preuve marché/locale (jamais déduite) ───────────────── */
export function proveLocale({ headers = {}, html = "", url = "", market, locale }) {
  const evidence = {};
  const cl = headers["content-language"] || headers["Content-Language"] || null;
  if (cl) evidence.content_language_header = cl;
  const lang = String(html).match(/<html[^>]*\slang=["']([^"']+)["']/i)?.[1] || null;
  if (lang) evidence.html_lang_attr = lang;
  let host = null; try { host = new URL(url).host; } catch {}
  if (host && (/^fr\./i.test(host) || /\.fr$/i.test(host))) evidence.host_is_fr = host;
  const wantLang = locale ? locale.split("-")[0].toLowerCase() : null;
  const proven = Boolean(wantLang) && (
    new RegExp("^" + wantLang, "i").test(cl || "") ||
    new RegExp("^" + wantLang, "i").test(lang || "") ||
    (wantLang === "fr" && Boolean(evidence.host_is_fr))
  );
  return {
    proven,
    evidence,
    observed_market: proven ? market ?? null : null,
    observed_locale: proven ? locale ?? null : null,
    market_context: proven && market === "FR" && locale === "fr-FR" ? "reference_fr"
                  : proven ? "market_localized" : null,
  };
}

/* ───────────────────────── extraction structurée ─────────────────────────── */
const CUR = { "€": "EUR", "$": "USD", "£": "GBP", "EUR": "EUR", "USD": "USD", "GBP": "GBP" };

export function pageSignals(text) {
  const t = String(text);
  // v0.3.1 — PREUVE FORTE d'un prépaiement annuel : le paiement intégral à l'achat.
  //   « réglés en totalité », « payé en totalité », « paid in full » => annual_prepaid
  const annual_prepaid_proof = /r[ée]gl[ée]s?\s+en\s+totalit[ée]|pay[ée]s?\s+en\s+totalit[ée]|paid\s+in\s+full|pr[ée]pay[ée]/i.test(t);
  // Signal FAIBLE : « facturé annuellement » / « billed annually » SEUL n'établit PAS
  // le prépaiement (peut être une mensualisation sur engagement annuel) => AMBIGU.
  const annual_billed_weak = /factur[ée]s?\s+annuellement|billed\s+(annually|yearly)|abonnements?\s+annuels?|paiement\s+annuel|\/\s*yr\b/i.test(t);
  const monthly = /factur[ée]s?\s+mensuellement|billed\s+monthly|paiement\s+mensuel|monthly\s+subscription/i.test(t);
  const billing_commitment =
      annual_prepaid_proof && !monthly ? "annual_prepaid"
    : monthly && !annual_prepaid_proof && !annual_billed_weak ? "monthly"
    : null;                                   // ambigu ou faible => null (needs_review)
  const commitment_ambiguous = (annual_billed_weak && !annual_prepaid_proof) || (annual_prepaid_proof && monthly);
  const annual = annual_prepaid_proof;
  const tax_inclusion = /TVA\s+incluse|prix\s+comprend\s+la\s+TVA|VAT\s+included|\bTTC\b/i.test(t) ? "ttc"
                      : /hors\s+taxes?|excl\.?\s*VAT|plus\s+VAT|\bHT\b/i.test(t) ? "ht" : "unknown";
  const pricing_unit = /\bpar\s+site\b|\bper\s+site\b|\/\s*site\b/i.test(t) ? "site"
                     : /\bpar\s+si[èe]ge\b|\bper\s+seat\b|\bper\s+user\b|\bpar\s+utilisateur\b|\/\s*(seat|user)\b/i.test(t) ? "seat"
                     : /\bper\s+workspace\b|\bpar\s+workspace\b/i.test(t) ? "workspace" : null;
  const seat_type = /\bfull\s+seat\b/i.test(t) ? "full" : null;
  return { billing_commitment, commitment_ambiguous, tax_inclusion, pricing_unit, seat_type,
           signals_found: { annual_prepaid_proof, annual_billed_weak, monthly } };
}

/** Découpe le HTML en blocs délimités par les titres (le titre = nom de plan candidat). */
export function splitByHeadings(html) {
  const re = /<(h1|h2|h3|h4)[^>]*>([\s\S]*?)<\/\1>/gi;
  const marks = []; let m;
  while ((m = re.exec(html))) {
    const name = normalizedText(m[2]);
    if (name && name.length <= 60) marks.push({ index: m.index, name });
  }
  if (!marks.length) return [{ heading: null, html }];
  const blocks = [];
  for (let i = 0; i < marks.length; i++) {
    blocks.push({ heading: marks[i].name, html: html.slice(marks[i].index, i + 1 < marks.length ? marks[i + 1].index : html.length) });
  }
  return blocks;
}

/** Montants : gère « €16,80 », « € 178 80 /mois » (décimale scindée), « $16/mo », « 14 USD ». */
export function findAmounts(text) {
  const out = [];
  const push = (amount, currency, period, idx, raw) => {
    if (!Number.isFinite(amount) || amount < 0 || amount > 100000) return;
    out.push({ native_amount: amount, native_currency: currency, billing_period: period, index: idx,
               evidence_excerpt: text.slice(Math.max(0, idx - 90), idx + 110).trim(), raw });
  };
  const periodOf = (p) => !p ? null : /^(mois|month|mo)$/i.test(p) ? "monthly" : /^(an|year|yr)$/i.test(p) ? "annual" : null;

  // symbole d'abord : € 178 80 /mois | €16,80/mois | $16/mo
  const re1 = /(€|\$|£)\s*(\d{1,5})(?:[.,](\d{2})|\s+(\d{2})(?=\s*\/))?\s*(?:\/\s*(mois|month|mo|an|year|yr))?/gi;
  let m;
  while ((m = re1.exec(text))) {
    const dec = m[3] ?? m[4] ?? null;
    push(Number(m[2] + (dec ? "." + dec : "")), CUR[m[1]], periodOf(m[5]), m.index, m[0]);
  }
  // montant d'abord, SYMBOLE : « 16,80 € /mois ».
  // NB : pas de \b après un symbole — « € » suivi d'une espace n'a pas de frontière
  // de mot, le \b faisait échouer « 12 € /mois » (bug trouvé par les fixtures).
  const re2a = /(\d{1,5})(?:[.,](\d{2}))?\s*(€|£)\s*(?:\/\s*(mois|month|mo|an|year|yr))?/gi;
  while ((m = re2a.exec(text))) {
    push(Number(m[1] + (m[2] ? "." + m[2] : "")), CUR[m[3]], periodOf(m[4]), m.index, m[0]);
  }
  // montant d'abord, CODE ISO : « 14 USD » (ici \b est légitime)
  const re2b = /(\d{1,5})(?:[.,](\d{2}))?\s*(EUR|USD|GBP)\b\s*(?:\/\s*(mois|month|mo|an|year|yr))?/gi;
  while ((m = re2b.exec(text))) {
    push(Number(m[1] + (m[2] ? "." + m[2] : "")), CUR[m[3].toUpperCase()], periodOf(m[4]), m.index, m[0]);
  }
  // devise ISO préfixe : USD 14/month
  const re3 = /\b(EUR|USD|GBP)\s*(\d{1,5})(?:[.,](\d{2}))?\s*(?:\/\s*(mois|month|mo))?/gi;
  while ((m = re3.exec(text))) {
    push(Number(m[2] + (m[3] ? "." + m[3] : "")), m[1], periodOf(m[4]), m.index, m[0]);
  }
  return out;
}

/**
 * Extraction : ne promeut en `observation` (statut `observed`) QUE si plan, montant,
 * devise, période, engagement, unité ET marché/locale prouvés sont tous résolus.
 * Sinon => weak_claim (confiance basse) ou unknown. Jamais `approved`.
 */
/**
 * v0.3 — extraction via ADAPTATEUR dédié (hors moteur générique).
 * Le contexte marché suit decideMarketContext (prouvé | déclaré | candidat).
 */
export function extractWithAdapter({ adapter, html, url, headers = {}, market, locale, registryEntry, egressCountry = null }) {
  const fn = ADAPTERS[adapter];
  if (!fn) throw new Error(`adaptateur inconnu: ${adapter}`);
  const text = normalizedText(html);
  const proof = proveLocale({ headers, html, url, market, locale });
  const r = fn({ html, url });
  // Devise dominante UNIQUE de la grille (sinon null) — sert au faisceau devise+egress.
  const currencies = [...new Set((r.plans ?? []).map((p) => p.native_currency).filter(Boolean))];
  const currency = currencies.length === 1 ? currencies[0] : null;
  const mc = decideMarketContext({ proof, registryEntry, text, market, locale, currency, egressCountry });

  const withCtx = (o, status) => ({
    ...o, observed_market: mc.observed_market, observed_locale: mc.observed_locale,
    market_context: mc.market_context, market_context_candidate: mc.market_context_candidate,
    market_context_source: mc.market_context_source, market_evidence: mc.market_evidence,
    status, confidence: status === "observed" ? "medium" : "low",
  });
  const unknowns = new Set(r.unknowns ?? []);
  if (mc.market_context_candidate) unknowns.add(`market_context_candidate='${mc.market_context_candidate}' (${mc.market_context_source}) — NON prouvé, soumis à revue humaine`);
  else if (!mc.market_context) unknowns.add(`marché/locale non prouvés (demandé ${market}/${locale}) et aucun fallback déclaré au registre`);

  // Le hash de version d'un adaptateur porte sur les faits tarifaires extraits,
  // pas sur le chrome dynamique de la page (bannières, tests A/B, ordre de scripts).
  // Une variation de prix/plan/feature change le hash ; un bruit hors grille non.
  const semanticBasis = {
    adapter: r.adapter, adapter_version: r.adapter_version,
    plans: r.plans.map((p) => ({
      plan_name: p.plan_name, native_amount: p.native_amount, native_currency: p.native_currency,
      billing_period: p.billing_period, billing_commitment: p.billing_commitment,
      pricing_unit: p.pricing_unit, tax_inclusion: p.tax_inclusion,
      plan_summary: p.plan_summary ?? null, feature_highlights: p.feature_highlights ?? [],
    })),
    ambiguities: (r.ambiguities ?? []).map((p) => ({ plan_name: p.plan_name, reason: p.reason ?? null, missing: p.missing ?? [] })),
    page_proof: r.page_proof ?? null,
  };
  return {
    adapter: r.adapter, adapter_version: r.adapter_version,
    observations: r.plans.map((p) => withCtx(p, "observed")),
    weak_claims: (r.ambiguities ?? []).map((p) => withCtx(p, "weak_claim")),
    page_signals: { ...pageSignals(text), adapter_page_proof: r.page_proof },
    locale_proof: proof, market_context_decision: mc,
    unknowns: [...unknowns], text_len: text.length,
    content_hash: contentHash(JSON.stringify(sortKeys(semanticBasis))),
    content_hash_scope: "adapter_semantic_facts",
  };
}

export function extractOffers({ html, url, headers = {}, market, locale }) {
  const text = normalizedText(html);
  const sig = pageSignals(text);
  const loc = proveLocale({ headers, html, url, market, locale });
  const blocks = splitByHeadings(html);

  const observations = [], weak_claims = [], unknowns = new Set();
  if (sig.commitment_ambiguous) unknowns.add("billing_commitment ambigu (mentions mensuelle ET annuelle : toggle non résolu)");
  if (!sig.pricing_unit) unknowns.add("pricing_unit non exprimée explicitement sur la page");
  if (!loc.proven) unknowns.add(`marché/locale non prouvés (demandé ${market}/${locale}) : aucun montant retenu`);

  for (const b of blocks) {
    const btext = normalizedText(b.html);
    const bsig = pageSignals(btext);
    for (const a of findAmounts(btext)) {
      const commitment = bsig.commitment_ambiguous ? null : (bsig.billing_commitment ?? (sig.commitment_ambiguous ? null : sig.billing_commitment));
      const unit = bsig.pricing_unit ?? sig.pricing_unit;
      const cand = {
        plan_name: b.heading ?? null,
        seat_type: bsig.seat_type ?? null,
        native_amount: a.native_amount,
        native_currency: a.native_currency ?? null,
        billing_period: a.billing_period ?? null,
        billing_commitment: commitment,
        pricing_unit: unit,
        tax_inclusion: bsig.tax_inclusion !== "unknown" ? bsig.tax_inclusion : sig.tax_inclusion,
        observed_market: loc.observed_market, observed_locale: loc.observed_locale,
        market_context: loc.market_context, market_evidence: loc.evidence,
        evidence_excerpt: a.evidence_excerpt, evidence_selector: b.heading ? `heading:"${b.heading}"` : null,
        status: "observed",
      };
      const missing = [];
      if (!cand.plan_name) missing.push("plan_name");
      if (!cand.native_currency) missing.push("native_currency");
      if (!cand.billing_period) missing.push("billing_period");
      if (cand.native_amount > 0 && !cand.billing_commitment) missing.push("billing_commitment");
      if (!cand.pricing_unit) missing.push("pricing_unit");
      if (!loc.proven) missing.push("observed_market/observed_locale (non prouvés)");

      if (missing.length === 0) {
        observations.push({ ...cand, confidence: "medium", unknowns: [] });
      } else {
        // Règle 10 : ambigu => jamais une observation tarifaire.
        weak_claims.push({ ...cand, status: "weak_claim", confidence: "low", missing,
                           reason: `non promu en observation : ${missing.join(", ")}` });
        missing.forEach((x) => unknowns.add(x));
      }
    }
  }
  return { page_signals: sig, locale_proof: loc, observations, weak_claims,
           unknowns: [...unknowns], text_len: text.length, content_hash: contentHash(text) };
}

/** Le rendu statique est-il suffisant ? (sinon bascule navigateur en mode `auto`) */
export function looksJsGated(html) {
  const text = normalizedText(html);
  return findAmounts(text).length === 0;
}

/* ───────────── v0.3.1 : attestation de contexte immuable par contrôle ────────── */
/**
 * Une attestation est produite à CHAQUE contrôle réseau — y compris quand le
 * content_hash est inchangé (aucune nouvelle version de contenu n'est alors créée).
 * Elle est content-addressed (`attestation_id` = sha256 du contenu canonique) donc
 * immuable : toute modification produirait un autre id. Append-only.
 */
export function buildContextAttestation({ slug, source_url, content_hash, run_id, accessed_at, final_url, browser_context, rendered_by, http_status }) {
  const body = {
    schema: "context_attestation/1",
    slug, source_url, content_hash, run_id, accessed_at,
    final_url: final_url ?? null, rendered_by: rendered_by ?? null, http_status: http_status ?? null,
    egress_country: browser_context?.egress_country ?? null,
    egress_source: browser_context?.egress_source ?? null,
    egress_measured_from: browser_context?.egress_measured_from ?? null,
    locale_requested: browser_context?.locale_requested ?? null,
    navigator_language: browser_context?.navigator_language ?? null,
    resolved_locale: browser_context?.resolved_locale ?? null,
    timezone: browser_context?.timezone ?? null,
    visible_markers: browser_context?.visible_markers ?? [],
    currency_symbols_seen: browser_context?.currency_symbols_seen ?? [],
    html_lang: browser_context?.html_lang_attr ?? null,
    content_language: browser_context?.content_language_header ?? null,
  };
  return { attestation_id: "sha256:" + sha256hex(JSON.stringify(sortKeys(body))), ...body };
}

/* ─────────────────────────── réseau (transport) ──────────────────────────── */
const lastHitByDomain = new Map();
async function politeWait(host, delayMs) {
  const last = lastHitByDomain.get(host) || 0;
  const wait = Math.max(0, delayMs - (Date.now() - last));
  if (wait) await sleep(wait);
  lastHitByDomain.set(host, Date.now());
}
export function retryDelayMs(attempt, retryAfterHeader) {
  if (retryAfterHeader) {
    const s = Number(retryAfterHeader);
    if (Number.isFinite(s)) return Math.min(s * 1000, 60000);
    const d = Date.parse(retryAfterHeader);
    if (!Number.isNaN(d)) return Math.min(Math.max(0, d - Date.now()), 60000);
  }
  return Math.min(2000 * 2 ** (attempt - 1), 16000);            // 2s → 4s → 8s
}
async function fetchWithRetry(urlStr, { delayMs, locale, run, slug }) {
  const host = new URL(urlStr).host;
  const headers = { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" };
  if (locale) headers["Accept-Language"] = `${locale},${locale.split("-")[0]};q=0.9`;
  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt++) {                // 3 tentatives max
    await politeWait(host, delayMs);
    try {
      const res = await fetch(urlStr, { headers, redirect: "follow" });
      if ((res.status === 429 || res.status >= 500) && attempt < 3) {
        const wait = retryDelayMs(attempt, res.headers.get("retry-after"));
        run?.checks.push({ slug, url: urlStr, mode: "retry", attempt, http_status: res.status, wait_ms: wait });
        await sleep(wait); continue;
      }
      return { res, html: await res.text(), attempts: attempt };
    } catch (e) {
      lastErr = e;
      if (attempt < 3) { await sleep(retryDelayMs(attempt, null)); continue; }
    }
  }
  throw lastErr ?? new Error("fetch failed after 3 attempts");
}

/* ──────────────────────────── rendus (renderer) ──────────────────────────── */
async function renderStatic(urlStr, ctx) {
  const { res, html, attempts } = await fetchWithRetry(urlStr, ctx);
  const headers = Object.fromEntries(res.headers.entries());
  return { ok: res.ok, status: res.status, html, headers, rendered_by: "static", attempts };
}
/**
 * v0.3.1 — pays de sortie réseau mesuré DEPUIS LE MÊME CONTEXTE PLAYWRIGHT que la page.
 * Un fetch Node indépendant ne prouverait rien sur la sortie réelle du navigateur
 * (proxy/contexte potentiellement différents) : on interroge donc la trace via
 * `context.request`, qui partage la pile réseau du contexte.
 */
const EGRESS_TRACE_URL = "https://www.cloudflare.com/cdn-cgi/trace";
async function egressFromContext(context) {
  try {
    const r = await context.request.get(EGRESS_TRACE_URL, { headers: { "User-Agent": UA } });
    if (!r.ok()) return { country: null, source: EGRESS_TRACE_URL, measured_from: "playwright_context", error: `HTTP ${r.status()}` };
    const body = await r.text();
    return { country: body.match(/^loc=(\w+)$/m)?.[1] ?? null, ip_seen: body.match(/^ip=(\S+)$/m)?.[1] ? "redacted" : null,
             source: EGRESS_TRACE_URL, measured_from: "playwright_context" };
  } catch (e) { return { country: null, source: EGRESS_TRACE_URL, measured_from: "playwright_context", error: String(e?.message || e) }; }
}

async function renderBrowser(urlStr, ctx) {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent: UA, locale: ctx.locale || undefined,
      extraHTTPHeaders: ctx.locale ? { "Accept-Language": `${ctx.locale},${ctx.locale.split("-")[0]};q=0.9` } : {},
    });
    const page = await context.newPage();
    await politeWait(new URL(urlStr).host, ctx.delayMs);
    // Certaines pages tarifaires (Squarespace notamment) conservent des requêtes
    // analytics ouvertes : `networkidle` n'arrive alors jamais, même si la grille
    // est déjà rendue. Le document chargé est le seuil bloquant ; networkidle reste
    // une amélioration best-effort, jamais une condition de collecte.
    const resp = await page.goto(urlStr, { waitUntil: "domcontentloaded", timeout: 45000 });
    try { await page.waitForLoadState("networkidle", { timeout: 15000 }); } catch { /* page dynamique stable sans idle */ }
    await page.waitForTimeout(3000);
    const html = await page.content();
    const headers = resp ? await resp.allHeaders() : {};

    // v0.3 — preuves de contexte du navigateur, journalisées avec la capture
    const nav = await page.evaluate(() => ({
      navigator_language: navigator.language ?? null,
      navigator_languages: Array.from(navigator.languages || []),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
      resolved_locale: Intl.DateTimeFormat().resolvedOptions().locale ?? null,
      currency_symbols_seen: [...new Set((document.body.innerText.match(/[€$£]/g) || []))],
      html_lang_attr: document.documentElement.getAttribute("lang"),
    }));
    const egress = await egressFromContext(context);   // même contexte que la page
    const browser_context = {
      locale_requested: ctx.locale ?? null,
      final_url: page.url(),                       // après redirections
      redirected: page.url() !== urlStr,
      navigator_language: nav.navigator_language, navigator_languages: nav.navigator_languages,
      timezone: nav.timezone, resolved_locale: nav.resolved_locale,
      egress_country: egress.country, egress_source: egress.source,
      egress_measured_from: egress.measured_from, egress_error: egress.error ?? null,
      html_lang_attr: nav.html_lang_attr,
      content_language_header: headers["content-language"] ?? null,
      currency_symbols_seen: nav.currency_symbols_seen,
      visible_markers: frenchContentMarkers(normalizedText(html)),
    };
    return { ok: resp ? resp.ok() : false, status: resp?.status() ?? 0, html, headers,
             rendered_by: "browser", attempts: 1, browser_context };
  } finally { await browser.close(); }
}
async function render(urlStr, ctx, mode) {
  if (mode === "browser") return renderBrowser(urlStr, ctx);
  const s = await renderStatic(urlStr, ctx);
  if (mode === "static") return s;
  if (!s.ok) return s;                                            // auto : pas de fallback sur non-OK
  if (!looksJsGated(s.html)) return s;                            // statique suffisant
  ctx.run?.checks.push({ slug: ctx.slug, url: urlStr, mode: "auto_fallback_browser", reason: "aucun montant en statique" });
  return renderBrowser(urlStr, ctx);                              // fallback UNIQUEMENT si nécessaire
}

/* ─────────────────── cache (HTML/texte rendu, git-ignored) ───────────────── */
const cachePathFor = (urlStr) => {
  const u = new URL(urlStr);
  return path.join(ROOT, ".cache", "tooltrim", "research", u.host, sha1(urlStr) + ".json");
};
export const CACHE_SCHEMA = 2;   // v2 : conserve `html` + `text` rendus (l'extracteur en dépend)
/**
 * Un cache d'un schéma antérieur (v0.1 : métadonnées seules, sans html/text) est
 * traité comme PÉRIMÉ : sinon un `cache_hit` silencieux priverait l'extracteur de
 * son entrée. Bug constaté au canari 2.
 */
async function readCache(urlStr, ttlS) {
  const p = cachePathFor(urlStr);
  if (!existsSync(p)) return null;
  try {
    const st = await stat(p);
    const ageS = (Date.now() - st.mtimeMs) / 1000;
    const data = JSON.parse(await readFile(p, "utf8"));
    const schemaOk = data.cache_schema === CACHE_SCHEMA && typeof data.html === "string" && typeof data.text === "string";
    return { ...data, ageS, schemaOk, fresh: schemaOk && ageS < ttlS };
  } catch { return null; }
}

/* ───────────────────── registre + manifeste (lecture seule) ──────────────── */
async function loadRegistry() { return JSON.parse(await readFile(REGISTRY_PATH, "utf8")); }
async function loadManifestSlugs() {
  const m = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  return { set: new Set(m.slugs), commit: m.gitCommit, sha: m.slugListSha256 };
}

/* ───────── v0.3.1 : sources additionnelles (capture distincte + claim) ───────── */
/**
 * Une `additional_source` du registre établit UN fait précis (`purpose`), via son
 * `proof_pattern` déclaré. Elle donne lieu à sa PROPRE source + sa PROPRE capture,
 * reliées au claim. Si le motif ne matche pas : le fait n'est PAS établi, on
 * n'infère rien (claim absent, `unknown` conservé).
 */
async function collectAdditionalSource({ slug, src, run, cfg }) {
  const checkedAt = nowIso();
  let r;
  try {
    r = await render(src.url, { delayMs: cfg.delayMs, locale: cfg.locale, run, slug }, src.renderer_hint || "static");
  }
  catch (e) {
    run.errors.push({ slug, url: src.url, code: "network_or_tool_limit", detail: String(e?.message || e), purpose: src.purpose });
    return { url: src.url, purpose: src.purpose, established: false, error: String(e?.message || e), last_checked_at: checkedAt, capture: null };
  }
  if (!r.ok) {
    run.errors.push({ slug, url: src.url, code: "http_error", detail: `HTTP ${r.status}`, purpose: src.purpose });
    run.checks.push({ slug, url: src.url, mode: "network", http_status: r.status, content_hash: null, purpose: src.purpose });
    return { url: src.url, purpose: src.purpose, established: false, last_checked_at: checkedAt, capture: null };
  }
  const text = normalizedText(r.html);
  const hash = contentHash(text);
  await safeWrite(cachePathFor(src.url), JSON.stringify({
    cache_schema: CACHE_SCHEMA, url: src.url, fetched_at: checkedAt, http_status: r.status,
    rendered_by: r.rendered_by, content_hash: hash, text_len: text.length, text, html: r.html,
  }, null, 2) + "\n");
  run.checks.push({ slug, url: src.url, mode: "network", http_status: r.status, rendered_by: r.rendered_by,
                    content_hash: hash, purpose: src.purpose });

  const re = new RegExp(src.proof_pattern, "i");
  const m = re.exec(text);
  const established = Boolean(m);
  const idx = m ? m.index : -1;
  return {
    url: src.url, purpose: src.purpose, established,
    source_meta: { source_type: src.source_type, source_tier: src.source_tier, is_official: src.is_official },
    last_checked_at: checkedAt,
    capture: { accessed_at: checkedAt, http_status: r.status, content_hash: hash, rendered_by: r.rendered_by,
               text_len: text.length, is_accessible: true },
    claim: established ? {
      key: src.establishes.claim_key, value_native: src.establishes.value, status: "observed",
      sourceUrl: src.url, sourceTier: src.source_tier, accessedOn: checkedAt.slice(0, 10),
      content_hash: hash, proof_pattern: src.proof_pattern,
      evidence: text.slice(Math.max(0, idx - 60), idx + 160).trim(),
      confidence: "high", volatility: "low",
      note: "Fait établi par une source officielle DISTINCTE de la page tarifaire ; rien n'est inféré.",
    } : null,
  };
}

/* ──────────────────────────────── pipeline ───────────────────────────────── */
async function processSlug(slug, run, cfg) {
  // 4. validation du slug contre le manifeste
  if (!cfg.manifest.set.has(slug)) {
    run.errors.push({ slug, code: "slug_not_in_manifest", detail: `absent de manifest-1126 (${cfg.manifest.commit.slice(0, 10)})` });
    return { slug, skipped: true, reason: "slug_not_in_manifest" };
  }
  // 5. URL depuis le registre — aucune URL devinée
  const entry = cfg.registry.sources[slug];
  if (!entry?.pricing_url) {
    run.errors.push({ slug, code: "no_official_url_in_registry", detail: "ajouter l'URL vérifiée au registre avant collecte" });
    return { slug, skipped: true, reason: "no_official_url_in_registry" };
  }
  const url = entry.pricing_url;
  const mode = cfg.renderer === "auto" ? (entry.renderer_hint || "auto") : cfg.renderer;
  const checkedAt = nowIso();

  // robots.txt
  const u = new URL(url);
  if (!cfg.robots.has(u.origin)) {
    let parsed = { groups: [], fetched: false };
    try {
      await politeWait(u.host, cfg.delayMs);
      const r = await fetch(`${u.origin}/robots.txt`, { headers: { "User-Agent": UA } });
      if (r.ok) parsed = { ...parseRobots(await r.text()), fetched: true, status: r.status };
      else parsed.status = r.status;
    } catch (e) { parsed.error = String(e?.message || e); }
    cfg.robots.set(u.origin, parsed);
  }
  const rb = cfg.robots.get(u.origin);
  const decision = rb.fetched ? matchRobots(rb.groups, u.pathname + u.search) : { allowed: true, rule: "robots.txt illisible — aucune interdiction explicite" };
  if (!decision.allowed) {
    run.errors.push({ slug, url, code: "robots_disallow", detail: decision.rule });
    return await mergeDossier(slug, { url, entry, robots: { allowed: false, reason: decision.rule, checked_at: checkedAt },
      is_accessible: false, last_checked_at: checkedAt, capture: null, networkChecked: false }, run, cfg);
  }

  // cache : TTL frais => contrôle sans réseau
  const cached = await readCache(url, cfg.cacheTtlS);
  if (cached?.fresh && !cfg.forceRecheck) {
    run.checks.push({ slug, url, mode: "cache_hit", ttl_remaining_s: Math.round(cfg.cacheTtlS - cached.ageS), content_hash: cached.content_hash });
    return await mergeDossier(slug, { url, entry, robots: { allowed: true, reason: decision.rule, checked_at: checkedAt },
      is_accessible: true, last_checked_at: checkedAt, capture: null, networkChecked: false, observed_hash: cached.content_hash }, run, cfg);
  }

  // rendu
  let r;
  try { r = await render(url, { delayMs: cfg.delayMs, locale: cfg.locale, run, slug }, mode); }
  catch (e) {
    run.errors.push({ slug, url, code: "network_or_tool_limit", detail: String(e?.message || e) });
    return await mergeDossier(slug, { url, entry, robots: { allowed: true, reason: decision.rule, checked_at: checkedAt },
      is_accessible: false, last_checked_at: checkedAt, capture: null, networkChecked: true, error: String(e?.message || e) }, run, cfg);
  }
  if (r.status === 401 || r.status === 403) {
    run.errors.push({ slug, url, code: "protected", detail: `HTTP ${r.status} — arrêt, aucun contournement` });
    return await mergeDossier(slug, { url, entry, robots: { allowed: true, reason: decision.rule, checked_at: checkedAt },
      is_accessible: false, last_checked_at: checkedAt, capture: null, networkChecked: true, http_status: r.status }, run, cfg);
  }
  // 3. réponse non-OK => contrôle + erreur, JAMAIS de capture
  if (!r.ok) {
    run.errors.push({ slug, url, code: "http_error", detail: `HTTP ${r.status}` });
    run.checks.push({ slug, url, mode: "network", http_status: r.status, content_hash: null });
    return await mergeDossier(slug, { url, entry, robots: { allowed: true, reason: decision.rule, checked_at: checkedAt },
      is_accessible: false, last_checked_at: checkedAt, capture: null, networkChecked: true, http_status: r.status }, run, cfg);
  }

  // v0.3 — adaptateur dédié si déclaré au registre, sinon moteur générique
  const ex = entry.adapter
    ? extractWithAdapter({ adapter: entry.adapter, html: r.html, url, headers: r.headers,
                           market: cfg.market, locale: cfg.locale, registryEntry: entry,
                           egressCountry: r.browser_context?.egress_country ?? null })
    : extractOffers({ html: r.html, url, headers: r.headers, market: cfg.market, locale: cfg.locale });
  // 8. HTML/texte rendu conservé UNIQUEMENT dans le cache git-ignored
  await safeWrite(cachePathFor(url), JSON.stringify({
    cache_schema: CACHE_SCHEMA,
    url, fetched_at: checkedAt, http_status: r.status, rendered_by: r.rendered_by,
    content_hash: ex.content_hash, text_len: ex.text_len,
    text: normalizedText(r.html), html: r.html,
  }, null, 2) + "\n");
  run.checks.push({ slug, url, mode: cfg.forceRecheck ? "network_forced" : "network_ttl",
                    http_status: r.status, rendered_by: r.rendered_by, attempts: r.attempts, content_hash: ex.content_hash,
                    // v0.3 : preuves de contexte journalisées à CHAQUE contrôle,
                    // indépendamment de la création d'une version.
                    browser_context: r.browser_context ?? null,
                    market_context: ex.market_context_decision?.market_context ?? null,
                    market_context_candidate: ex.market_context_decision?.market_context_candidate ?? null,
                    market_context_source: ex.market_context_decision?.market_context_source ?? null,
                    adapter: ex.adapter ?? null, adapter_version: ex.adapter_version ?? null });
  run.claims_created += ex.observations.length + ex.weak_claims.length;

  // v0.3.1 — attestation de contexte IMMUABLE, à chaque contrôle réseau
  const attestation = buildContextAttestation({
    slug, source_url: url, content_hash: ex.content_hash, run_id: run.run_id, accessed_at: checkedAt,
    final_url: r.browser_context?.final_url ?? url, browser_context: r.browser_context,
    rendered_by: r.rendered_by, http_status: r.status,
  });
  run.attestations.push(attestation);

  // v0.3.1 — sources additionnelles : capture distincte + claim relié
  const additional = [];
  for (const src of entry.additional_sources ?? []) {
    additional.push(await collectAdditionalSource({ slug, src, run, cfg }));
  }
  // pricing_unit : UNIQUEMENT si une source officielle distincte l'établit
  const unitFact = additional.find((a) => a.purpose === "pricing_unit" && a.established);
  if (unitFact) {
    const stamp = { pricing_unit: unitFact.claim.value_native,
                    pricing_unit_evidence: {
                      // capture_id : le gate exige que la preuve d'unité RÉSOLVE une capture réelle
                      capture_id: captureIdOf(unitFact.url, unitFact.capture.content_hash),
                      source_url: unitFact.url, content_hash: unitFact.capture.content_hash,
                      claim_key: unitFact.claim.key, excerpt: unitFact.claim.evidence } };
    ex.observations = ex.observations.map((o) => ({ ...o, ...stamp }));
    ex.unknowns = ex.unknowns.filter((u) => !/pricing_unit/i.test(u));
  }
  // billing_commitment : comme l'unité, il peut être établi par une documentation
  // officielle distincte. On ne l'applique qu'aux observations payantes ; un plan
  // gratuit n'a pas d'engagement de facturation.
  const commitmentFact = additional.find((a) => a.purpose === "billing_commitment" && a.established);
  if (commitmentFact) {
    const stamp = {
      billing_commitment: commitmentFact.claim.value_native,
      billing_commitment_evidence: {
        capture_id: captureIdOf(commitmentFact.url, commitmentFact.capture.content_hash),
        source_url: commitmentFact.url,
        content_hash: commitmentFact.capture.content_hash,
        claim_key: commitmentFact.claim.key,
        excerpt: commitmentFact.claim.evidence,
      },
    };
    ex.observations = ex.observations.map((o) => o.native_amount > 0 ? ({ ...o, ...stamp }) : o);
    ex.unknowns = ex.unknowns.filter((u) => !/billing_commitment/i.test(u));
  }
  // v0.3.3 — les candidats sont estampillés ; l'application au dossier (append-only,
  // conflits, métriques) est faite par le modèle dans mergeDossier.
  ex.observations = ex.observations.map((o) => ({
    ...o, plan_name_localized: o.plan_name ?? null, source_url: url, content_hash: ex.content_hash,
  }));
  ex.weak_claims = ex.weak_claims.map((o) => ({
    ...o, plan_name_localized: o.plan_name ?? null, source_url: url, content_hash: ex.content_hash,
  }));

  return await mergeDossier(slug, {
    url, entry, robots: { allowed: true, reason: decision.rule, checked_at: checkedAt },
    is_accessible: true, last_checked_at: checkedAt, networkChecked: true, observed_hash: ex.content_hash,
    extraction: ex, browser_context: r.browser_context ?? null, attestation, additional,
    capture: {
      accessed_at: checkedAt, http_status: r.status, content_hash: ex.content_hash, rendered_by: r.rendered_by,
      text_len: ex.text_len,
      observed_market: ex.market_context_decision ? ex.market_context_decision.observed_market : ex.locale_proof.observed_market,
      observed_locale: ex.market_context_decision ? ex.market_context_decision.observed_locale : ex.locale_proof.observed_locale,
      market_context: ex.market_context_decision ? ex.market_context_decision.market_context : ex.locale_proof.market_context,
      market_context_candidate: ex.market_context_decision ? ex.market_context_decision.market_context_candidate : null,
      market_context_source: ex.market_context_decision ? ex.market_context_decision.market_context_source : null,
      locale_proven: ex.locale_proof.proven,
      locale_evidence: ex.locale_proof.evidence,
      browser_context: r.browser_context ?? null,
      adapter: ex.adapter ?? null, adapter_version: ex.adapter_version ?? null,
      content_hash_scope: ex.content_hash_scope ?? "normalized_text",
      is_accessible: true,
    },
  }, run, cfg);
}

async function mergeDossier(slug, r, run, cfg) {
  const p = path.join(ROOT, "research", "tool-pages", `${slug}.json`);
  const created = !existsSync(p);
  const doc = created ? {
    schemaVersion: 1, slug, researchedOn: nowIso().slice(0, 10), researcher: "research-collector",
    status: "needs_review", mode: "RESEARCH_ONLY",
    identity: { officialName: slug, pricingUrl: r.url, sourceTier: r.entry?.source_tier ?? 1 },
    claims: [], unknowns: [], conflicts_summary: [],
  } : JSON.parse(await readFile(p, "utf8"));

  const c = (doc.collector ??= { mode: "RESEARCH_ONLY", version: COLLECTOR_VERSION });
  c.mode = "RESEARCH_ONLY"; c.version = COLLECTOR_VERSION;
  c.last_checked_at = r.last_checked_at; c.market_requested = cfg.market; c.locale_requested = cfg.locale;
  c.observations ??= []; c.claims ??= []; c.conflicts ??= []; c.context_attestations ??= [];
  // stockages parallèles v0.3.1/0.3.2 supprimés : tout vit dans sources[] / claims[]
  delete c.additional_sources; delete c.unit_claims; delete c.weak_claims_legacy;
  // Re-collecte propre (`--reset-observations`) : on vide les FAITS volatils du collecteur pour ne
  // pas empiler des observations périmées d'un contexte antérieur (ex. changement de marché/devise).
  // doc.editorial_drafts (éditorial humain) et doc.identity NE sont PAS touchés → aucun backup/restore.
  if (cfg.resetObservations && !created) {
    c.observations = []; c.sources = []; c.context_attestations = []; c.conflicts = []; c.claims = [];
  }

  const mapping = r.entry?.plan_key_mapping ?? null;
  // `claims_*` = FAITS TARIFAIRES (observations plan/prix). Les claims documentaires
  // (unité, plan gratuit) ont leurs propres compteurs : ils ne gonflent jamais les
  // compteurs de prix.
  const metrics = { claims_extracted: 0, claims_created: 0, claims_unchanged: 0, claims_confirmed: 0,
                    conflicts_opened: 0, versions_created: 0, attestations_created: 0,
                    doc_claims_extracted: 0, doc_claims_created: 0, doc_claims_unchanged: 0, doc_claims_confirmed: 0 };

  // migration non destructive des observations antérieures (recalcul des ids depuis les faits)
  c.observations = c.observations.map((o) => migrateLegacyObservation(o, { mapping, tool: slug }));

  // ── source pricing (unifiée)
  const src = upsertSource(doc, { url: r.url, domain: new URL(r.url).host,
    source_type: r.entry?.source_type ?? "pricing", source_tier: r.entry?.source_tier ?? 1,
    is_official: r.entry?.is_official ?? true, purpose: "pricing",
    robots: r.robots, is_accessible: r.is_accessible, last_checked_at: r.last_checked_at });
  let pricingCaptureId = null;
  if (r.capture) {
    const res = appendCapture(src, r.capture);
    pricingCaptureId = res.capture_id;
    if (res.added) metrics.versions_created++;
  } else if (r.observed_hash) pricingCaptureId = captureIdOf(r.url, r.observed_hash);

  // ── sources documentaires (unifiées, captures propres, claims reliés)
  for (const a of r.additional ?? []) {
    const asrc = upsertSource(doc, { url: a.url, domain: new URL(a.url).host,
      source_type: a.source_meta?.source_type ?? "docs", source_tier: a.source_meta?.source_tier ?? 1,
      is_official: a.source_meta?.is_official ?? true, purpose: a.purpose,
      is_accessible: Boolean(a.capture), last_checked_at: a.last_checked_at });
    if (a.capture) { if (appendCapture(asrc, a.capture).added) metrics.versions_created++; }
    if (a.claim) {
      const cid = captureIdOf(a.url, a.capture.content_hash);
      const out = appendClaim(doc, { key: a.claim.key, value_native: a.claim.value_native,
        source_id: asrc.source_id, capture_id: cid, source_url: a.url, sourceTier: a.claim.sourceTier,
        evidence: a.claim.evidence, proof_pattern: a.claim.proof_pattern,
        confidence: a.claim.confidence, volatility: a.claim.volatility,
        observed_on: a.claim.accessedOn, note: a.claim.note });
      if (out.outcome === "created") metrics.doc_claims_created++;
      else if (out.outcome === "unchanged") metrics.doc_claims_unchanged++;
      else if (out.outcome === "confirmed") metrics.doc_claims_confirmed++;
      else if (out.outcome === "conflicted") { metrics.doc_claims_created++; metrics.conflicts_opened++; }
      metrics.doc_claims_extracted++;
    }
  }

  // ── observations (append-only)
  for (const cand of r.extraction?.observations ?? []) {
    metrics.claims_extracted++;
    const out = applyObservation(doc, cand, { capture_id: pricingCaptureId, run_id: run.run_id,
                                              now: r.last_checked_at, mapping, tool: slug });
    if (out.outcome === "created") metrics.claims_created++;
    else if (out.outcome === "unchanged") metrics.claims_unchanged++;
    else if (out.outcome === "confirmed") metrics.claims_confirmed++;
    else if (out.outcome === "conflicted") { metrics.claims_created++; metrics.conflicts_opened++; }
  }

  // Réconciliation des dossiers produits par une version antérieure : null ->
  // métadonnée sourcée (ex. unité `site`) est un enrichissement, pas un conflit
  // tarifaire. Les deux observations restent historisées.
  for (const conflict of c.conflicts.filter((x) => x.status === "open")) {
    const rows = conflict.observation_ids.map((id) => c.observations.find((o) => o.observation_id === id)).filter(Boolean);
    const current = rows.find((o) => o.status === "observed");
    const previous = rows.filter((o) => o !== current);
    if (current && previous.length && previous.every((o) => isMetadataEnrichment(o, current))) {
      conflict.kind = "metadata_enrichment";
      conflict.status = "resolved";
      conflict.resolved_at = r.last_checked_at;
      conflict.resolution = "observation complétée par une preuve documentaire ; faits économiques inchangés";
    }
  }

  // ── complétion de métadonnée de preuve (le FAIT n'est pas modifié) :
  // les observations append-only antérieures peuvent porter un pricing_unit_evidence
  // sans capture_id. On le dérive du claim canonique `pricing.unit` — c'est une
  // projection depuis les sources/claims, jamais un stockage parallèle.
  const unitClaim = c.claims.find((x) => x.key === "pricing.unit" && x.status === "observed");
  if (unitClaim) {
    for (const o of c.observations) {
      if (o.pricing_unit && (!o.pricing_unit_evidence || !o.pricing_unit_evidence.capture_id)) {
        o.pricing_unit_evidence = { ...(o.pricing_unit_evidence ?? {}), capture_id: unitClaim.capture_id,
                                    source_url: unitClaim.source_url, claim_id: unitClaim.claim_id,
                                    claim_key: unitClaim.key, excerpt: unitClaim.evidence };
      }
    }
  }

  // ── attestation de contexte (append-only, une par contrôle réseau)
  if (r.attestation) { c.context_attestations.push(r.attestation); metrics.attestations_created++; }

  // ── gate complet (reçoit le DOSSIER) + readiness
  c.pre_eligibility = c.observations.filter((o) => o.status === "observed").map((o) => ({
    plan_key: o.plan_key, plan_name_localized: o.plan_name_localized,
    ...approvedPreEligibility(o, doc, { mapping, now: r.last_checked_at }),
  }));
  c.attestation_readiness = c.observations.filter((o) => o.status === "observed")
    .map((o) => ({ plan_key: o.plan_key, ...attestationReadiness(o) }));
  c.extraction_unknowns = r.extraction?.unknowns ?? (c.extraction_unknowns ?? []);
  c.page_signals = r.extraction?.page_signals ?? (c.page_signals ?? null);
  c.last_context_evidence = r.extraction ? {
    at: r.last_checked_at, run_id: run.run_id, rendered_by: r.capture?.rendered_by ?? null,
    adapter: r.extraction.adapter ?? null, adapter_version: r.extraction.adapter_version ?? null,
    browser_context: r.browser_context ?? null,
    market_context: r.extraction.market_context_decision?.market_context ?? null,
    market_context_candidate: r.extraction.market_context_decision?.market_context_candidate ?? null,
    market_context_source: r.extraction.market_context_decision?.market_context_source ?? null,
  } : (c.last_context_evidence ?? null);
  c.runs = [...(c.runs ?? []), { run_id: run.run_id, at: r.last_checked_at, network_checked: r.networkChecked,
                                 metrics }].slice(-20);
  c.review_status = "needs_review";
  c.notes = ["Collecteur RESEARCH_ONLY v" + COLLECTOR_VERSION + " : aucune valeur `approved` ne peut être produite ici.",
             "Sources unifiées (pricing + documentaires) dans collector.sources[] ; captures append-only.",
             "Observations append-only : aucun écrasement ; valeur différente => conflit + superseded_candidate.",
             "Le HTML/texte rendu vit uniquement dans .cache/tooltrim/research/ (git-ignored)."];
  doc.status = "needs_review";

  await safeWrite(p, JSON.stringify(sortKeys(doc), null, 2) + "\n");
  run.metrics = metrics;
  return { slug, created, versionsCreated: metrics.versions_created, networkChecked: r.networkChecked,
           accessible: r.is_accessible, url: r.url, hash: r.observed_hash ?? null, metrics,
           observations: c.observations.filter((o) => o.status === "observed").length,
           conflicts_open: c.conflicts.filter((x) => x.status === "open").length };
}

/* ─────────────────────────────────── CLI ─────────────────────────────────── */
async function main() {
  const args = Object.fromEntries(process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("="); return [k, v === undefined ? true : v];
  }));
  const slugs = String(args.slugs || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!slugs.length) { console.error("--slugs=<a,b> requis"); process.exit(1); }
  const cfg = {
    market: args.market ? String(args.market) : null,
    locale: args.locale ? String(args.locale) : null,
    delayMs: Number(args.delay ?? 2000),
    cacheTtlS: Number(args["cache-ttl"] ?? 86400),
    forceRecheck: Boolean(args["force-recheck"]),
    // Re-collecte propre : repart des faits vierges (observations/captures/attestations) sans
    // accumuler ceux d'un contexte marché antérieur. L'ÉDITORIAL humain reste préservé.
    resetObservations: Boolean(args["reset-observations"]),
    renderer: String(args.renderer ?? "auto"),
    robots: new Map(),
  };
  if (cfg.delayMs < 2000) { console.error("--delay doit être >= 2000 ms (politesse)"); process.exit(1); }
  if (!["static", "browser", "auto"].includes(cfg.renderer)) { console.error("--renderer=static|browser|auto"); process.exit(1); }
  cfg.registry = await loadRegistry();
  cfg.manifest = await loadManifestSlugs();

  const run = {
    run_id: randomUUID(), agent: "research-collector", mode: "RESEARCH_ONLY", valid: true,
    collector_version: COLLECTOR_VERSION, started_at: nowIso(), finished_at: null,
    params: { slugs, market: cfg.market, locale: cfg.locale, renderer: cfg.renderer, delay_ms: cfg.delayMs,
              concurrency_per_domain: 1, cache_ttl_s: cfg.cacheTtlS, force_recheck: cfg.forceRecheck },
    manifest: { commit: cfg.manifest.commit, slug_set_sha256: cfg.manifest.sha },
    checks: [], errors: [], conflicts: [], attestations: [], results: [], claims_created: 0, review_status: "open",
  };
  for (const slug of slugs) run.results.push(await processSlug(slug, run, cfg));  // 1 domaine à la fois
  run.finished_at = nowIso();
  const m = run.metrics ?? {};
  run.diff_summary = `claims_extracted=${m.claims_extracted ?? 0} claims_created=${m.claims_created ?? 0} `
    + `claims_unchanged=${m.claims_unchanged ?? 0} claims_confirmed=${m.claims_confirmed ?? 0} `
    + `conflicts_opened=${m.conflicts_opened ?? 0} versions_created=${m.versions_created ?? 0} `
    + `attestations_created=${m.attestations_created ?? 0} approved=0`
    + ` | doc_claims: extracted=${m.doc_claims_extracted ?? 0} created=${m.doc_claims_created ?? 0} unchanged=${m.doc_claims_unchanged ?? 0}`;
  await safeWrite(path.join(ROOT, "research", "runs", `${run.run_id}.json`), JSON.stringify(sortKeys(run), null, 2) + "\n");
  console.log(JSON.stringify({ run_id: run.run_id, results: run.results, checks: run.checks, errors: run.errors, diff_summary: run.diff_summary }, null, 2));
}

// NB : comparaison via pathToFileURL — une concaténation `file://${argv[1]}`
// casse dès que le chemin contient une espace (« New project » => New%20project).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
