// Audit des redirections — chaînes, cibles mortes, non canoniques ou noindex.
//
// Usage :
//   node scripts/audit-seo-redirects.mjs [limiteLive]
//   AUDIT_BASE=https://tooltrim.com AUDIT_REPORT=/tmp/report.json node scripts/audit-seo-redirects.mjs
//
// Le script lit vercel.json et vérifie :
//   1. statiquement — doublons de source, chaînes (une destination qui est
//      elle-même une source), destinations absentes de l'artefact de build,
//      destinations dont la canonical ne pointe pas sur elles-mêmes, ou qui
//      sont noindex ;
//   2. en direct — rejoue chaque source avec redirect:"manual" pour compter les
//      sauts réels, le statut final et l'URL finale.
//
// Les sources à motif sont instanciées avec de vrais slugs tirés de dist/ (et
// des posts pour /story/:slug) : un paramètre inventé produisait des 404 qui
// n'existent pas en production.
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.AUDIT_BASE || "https://tooltrim.com";
const CONCURRENCY = 6;
const TIMEOUT_MS = 15000;
const UA = "ToolTrimSEOAudit/1.0 (+audit interne)";
const REPORT_PATH = process.env.AUDIT_REPORT || "";
const DIST = path.resolve("dist");

const rules = (JSON.parse(fs.readFileSync(path.resolve("vercel.json"), "utf8")).redirects || [])
  .filter((rule) => rule.source && rule.destination);

const isPattern = (value) => /[:*]/.test(value);
const hasHostCondition = (rule) => (rule.has || []).some((entry) => entry.type === "host");

/** Traduit une source Vercel (path-to-regexp simplifié) en expression ancrée. */
function sourceToRegex(source) {
  let out = "";
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    if (char !== ":") {
      out += char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      index += 1;
      continue;
    }
    const match = /^:([A-Za-z_]+)(?:\(([^)]*)\))?(\*|\+)?/.exec(source.slice(index));
    if (!match) {
      out += ":";
      index += 1;
      continue;
    }
    const [, name, group, modifier] = match;
    if (group) out += `(?:${group})${modifier === "*" ? "*" : modifier === "+" ? "+" : ""}`;
    else if (name === "path") out += modifier === "*" ? ".*" : modifier === "+" ? ".+" : "[^/]+";
    else out += "[^/]+";
    index += match[0].length;
  }
  return new RegExp(`^${out}/?$`);
}

// ── Slugs réels pour instancier les motifs ─────────────────────────────────
function distSlugs(family) {
  const dir = path.join(DIST, "fr", family);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => fs.existsSync(path.join(dir, name, "index.html")));
}

const posts = ["fr", "en"].flatMap((lang) => {
  const file = path.resolve(`src/data/posts-${lang}.json`);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8")).map((post) => ({ ...post, lang }));
});
const storySlugs = posts.filter((post) => /^stories$/i.test(post.category || "")).map((post) => post.slug);

const pick = (list, seed = 0) => list[seed % Math.max(list.length, 1)];
// `suffix` instancie les `:path*` : ce sont des suffixes réels de sous-page,
// pas des slugs de fiche (sinon on fabrique des 404 qui n'existent pas).
const seeds = {
  tool: { lang: "fr", slug: pick(distSlugs("tool")), suffix: "prix" },
  guide: { lang: "fr", slug: pick(distSlugs("guide")), suffix: "" },
  story: { lang: "fr", slug: pick(storySlugs), suffix: "" },
  stacks: { lang: "fr", slug: pick(distSlugs("stacks")), suffix: "" },
  category: { lang: "fr", slug: pick(distSlugs("category")), suffix: "" },
  comparatif: { lang: "fr", slug: pick(distSlugs("comparatif")), suffix: "" },
};

function seedFor(pattern) {
  const lang = /^\/en\//.test(pattern) ? "en" : "fr";
  // Le suffixe de sous-page dépend de la langue : /pricing en anglais, /prix en
  // français. Un suffixe français sur une URL anglaise fabriquait une chaîne.
  const suffix = lang === "en" ? "pricing" : "prix";
  const base = pattern.includes("/story/") ? seeds.story
    : pattern.includes("/tool/") ? seeds.tool
      : pattern.includes("/guide/") ? seeds.guide
        : pattern.includes("/stacks/") ? seeds.stacks
          : pattern.includes("/category/") ? seeds.category
            : pattern.includes("/comparatif/") ? seeds.comparatif
              : null;
  return { ...(base || { slug: undefined }), lang, suffix };
}

/**
 * Remplace les paramètres d'un motif par des valeurs réelles.
 * Renvoie null quand un paramètre ne peut pas être résolu de façon crédible.
 */
function fill(pattern, seed) {
  if (!seed) return null;
  let resolved = true;
  const out = pattern.replace(/:([A-Za-z_]+)(?:\(([^)]*)\))?(\*|\+)?/g, (_match, name, group) => {
    if (group) return group.split("|")[0];
    if (name === "lang") return seed?.lang || "fr";
    if (name === "path") return seed?.suffix ?? "prix";
    if (!seed?.slug) {
      resolved = false;
      return "";
    }
    return seed.slug;
  });
  return resolved ? out : null;
}

function destinationPath(destination) {
  if (!destination || /^https?:/i.test(destination)) return null;
  return new URL(destination, "https://placeholder.invalid").pathname;
}

/** Chemin du fichier prérendu qui sert cette URL, ou null. */
function resolveFile(pathname) {
  if (pathname === null) return null;
  if (!fs.existsSync(DIST)) return null;
  const clean = pathname.replace(/\/+$/, "");
  const candidates = [
    path.join(DIST, clean, "index.html"),
    path.join(DIST, `${clean}.html`),
    path.join(DIST, clean === "" ? "index.html" : `${clean}/index.html`),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function headFacts(file) {
  const html = fs.readFileSync(file, "utf8");
  const canonical = /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i.exec(html)?.[1]
    || /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i.exec(html)?.[1]
    || null;
  const robots = /<meta[^>]+name=["']robots["'][^>]*content=["']([^"']*)["']/i.exec(html)?.[1] || "";
  return { canonical, noindex: /noindex/i.test(robots) };
}

const pathMatchers = rules
  .filter((rule) => !hasHostCondition(rule))
  .map((rule) => ({ rule, regex: sourceToRegex(rule.source) }));

// ── 1. Statique ────────────────────────────────────────────────────────────
const bySource = new Map();
for (const rule of rules) bySource.set(rule.source, (bySource.get(rule.source) || 0) + 1);
const duplicateSources = [...bySource].filter(([, count]) => count > 1).map(([source, count]) => ({ source, count }));

const chains = [];
const deadTargets = [];
const nonCanonical = [];
const noindexTargets = [];
const checkedTargets = new Map();

for (const rule of rules) {
  if (hasHostCondition(rule)) continue;
  const seed = seedFor(rule.destination);
  const concreteDestination = isPattern(rule.destination) ? fill(rule.destination, seed) : rule.destination;
  if (!concreteDestination) continue;
  const pathname = destinationPath(concreteDestination);
  if (pathname === null) continue;

  const hit = pathMatchers.find(({ regex }) => regex.test(pathname));
  if (hit && hit.rule.source !== rule.source) {
    chains.push({
      source: rule.source,
      destination: rule.destination,
      then: { source: hit.rule.source, destination: hit.rule.destination },
    });
  }

  const file = resolveFile(pathname);
  if (!file) {
    deadTargets.push({ source: rule.source, destination: rule.destination });
    continue;
  }
  if (!checkedTargets.has(pathname)) {
    const facts = headFacts(file);
    checkedTargets.set(pathname, facts);
    const canonicalPath = facts.canonical ? destinationPath(facts.canonical) : null;
    if (canonicalPath && canonicalPath.replace(/\/+$/, "") !== pathname.replace(/\/+$/, "")) {
      nonCanonical.push({ source: rule.source, destination: rule.destination, canonical: facts.canonical });
    }
    if (facts.noindex) {
      noindexTargets.push({ source: rule.source, destination: rule.destination });
    }
  }
}

const exactRules = rules.filter((rule) => !isPattern(rule.source));
const patternRules = rules.filter((rule) => isPattern(rule.source));

// ── 2. Direct ──────────────────────────────────────────────────────────────
function hostFor(rule) {
  const hostCondition = (rule.has || []).find((entry) => entry.type === "host");
  return hostCondition ? `https://${hostCondition.value}` : BASE;
}

const liveTargets = [];
for (const rule of exactRules) {
  liveTargets.push({ label: rule.source, url: `${hostFor(rule)}${rule.source}`, expected: rule.destination });
}
const sampledPatterns = new Set();
for (const rule of patternRules) {
  const seed = seedFor(rule.source);
  // La règle www porte sur `/:path*` : on l'instancie avec une URL qui existe
  // vraiment, sinon on fabrique un 404 (/prix) au lieu de mesurer la règle.
  const isRootWildcard = rule.source === "/:path*";
  const concrete = isRootWildcard ? `/fr/tool/${seeds.tool.slug}` : fill(rule.source, seed);
  if (!concrete || sampledPatterns.has(concrete)) continue;
  sampledPatterns.add(concrete);
  const expected = isRootWildcard
    ? `https://tooltrim.com${concrete}`
    : isPattern(rule.destination) ? fill(rule.destination, seed) : rule.destination;
  liveTargets.push({ label: `${rule.source} → ${concrete}`, url: `${hostFor(rule)}${concrete}`, expected });
}

const limit = Number(process.argv[2] || 0);
const selected = limit > 0 ? liveTargets.slice(0, limit) : liveTargets;

const normalize = (url) => {
  const parsed = new URL(url, BASE);
  const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
  return `${parsed.origin}${pathname}${parsed.search}`;
};

async function trace(startUrl) {
  const hops = [];
  let current = startUrl;
  for (let depth = 0; depth < 5; depth += 1) {
    const response = await fetch(current, {
      redirect: "manual",
      headers: { "user-agent": UA },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const location = response.headers.get("location");
    hops.push({ url: current, status: response.status, location });
    if (response.status >= 300 && response.status < 400 && location) {
      current = new URL(location, current).href;
      continue;
    }
    break;
  }
  return { hops, finalUrl: current, finalStatus: hops[hops.length - 1].status };
}

async function pool(items, worker, size) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }));
  return results;
}

const liveResults = await pool(selected, async (target) => {
  try {
    const result = await trace(target.url);
    const origin = new URL(target.url).origin;
    const expected = target.expected ? normalize(new URL(target.expected, origin).href) : null;
    return { ...target, ...result, expected, final: normalize(result.finalUrl) };
  } catch (error) {
    return { ...target, error: String(error?.message || error) };
  }
}, CONCURRENCY);

const multiHop = liveResults.filter((row) => !row.error && row.hops.length > 2);
const notTwoHundred = liveResults.filter((row) => !row.error && row.finalStatus !== 200);
const wrongTarget = liveResults.filter((row) => !row.error && row.expected && row.final !== row.expected);
const errors = liveResults.filter((row) => row.error);

// ── 3. Rapport ─────────────────────────────────────────────────────────────
const summary = {
  rules: rules.length,
  exact: exactRules.length,
  patterns: patternRules.length,
  duplicateSources: duplicateSources.length,
  chains: chains.length,
  deadTargets: deadTargets.length,
  nonCanonical: nonCanonical.length,
  noindexTargets: noindexTargets.length,
  live: {
    checked: liveResults.length,
    singleHop: liveResults.filter((row) => !row.error && row.hops.length === 2).length,
    multipleHops: multiHop.length,
    not200: notTwoHundred.length,
    wrongTarget: wrongTarget.length,
    errors: errors.length,
  },
};

console.log(JSON.stringify(summary, null, 2));
const show = (title, rows, map = (row) => row) => {
  if (!rows.length) return;
  console.log(`\n${title} (${rows.length})`);
  for (const row of rows.slice(0, 12)) console.log("  ", JSON.stringify(map(row)));
};
show("doublons de source", duplicateSources);
show("chaînes statiques", chains);
show("destinations absentes du build", deadTargets);
show("cibles non canoniques", nonCanonical);
show("cibles noindex", noindexTargets);
show("chaînes réelles (> 1 saut)", multiHop, (row) => ({
  from: row.url,
  hops: row.hops.map((hop) => `${hop.status} ${hop.url}`),
}));
show("statut final ≠ 200", notTwoHundred, (row) => ({ from: row.url, status: row.finalStatus, final: row.final }));
show("destination finale inattendue", wrongTarget, (row) => ({ from: row.url, expected: row.expected, got: row.final }));
show("erreurs réseau", errors, (row) => ({ from: row.url, error: row.error }));

if (REPORT_PATH) {
  fs.writeFileSync(REPORT_PATH, JSON.stringify({ summary, chains, deadTargets, nonCanonical, noindexTargets, duplicateSources, liveResults }, null, 2));
  console.log(`\nRapport écrit : ${REPORT_PATH}`);
}
