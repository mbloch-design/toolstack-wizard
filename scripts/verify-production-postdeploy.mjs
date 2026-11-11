// Vérification post-déploiement de la production ToolTrim.
//
// Usage :
//   node scripts/verify-production-postdeploy.mjs
//   AUDIT_BASE=https://preprod.tooltrim.com node scripts/verify-production-postdeploy.mjs
//   node scripts/verify-production-postdeploy.mjs --expect-sitemap-urls 10726 --report output/postdeploy.json
//
// Le script ne vérifie que des invariants structurels : statuts, redirection
// racine, canonical autoréférente, hreflang réciproque, og:image absolu,
// métadonnées de fraîcheur cohérentes, `lastmod` réellement varié, catégories
// noindex, 404 réels. Aucun chiffre du catalogue n'est codé en dur : les
// valeurs exactes (nombre d'URLs au sitemap) restent optionnelles, pour
// épingler une release précise.
//
// Code de sortie : 0 si tous les contrôles passent, 1 si au moins un échoue
// (SKIP ne fait pas échouer), 2 en cas d'erreur d'usage.
//
// Les contrôles lourds (crawl complet, rejeu des 283 redirections) restent dans
// scripts/audit-seo-live.mjs et scripts/audit-seo-redirects.mjs : ce script est
// la porte rapide à passer juste après un déploiement.
import fs from "node:fs";
import path from "node:path";

const UA = "ToolTrimPostDeploy/1.0 (+verification interne)";
const TIMEOUT_MS = 20000;
const DEFAULT_PAGES = [
  "/en",
  "/fr",
  "/fr/tools",
  "/fr/guides",
  "/fr/comparatifs",
  "/fr/stacks",
  "/fr/tool/notion",
  "/fr/tool/notion/prix",
  "/fr/tool/notion/alternatives",
  "/fr/tool/notion/avis",
];

function printUsage() {
  console.log(`Vérification post-déploiement.

  node scripts/verify-production-postdeploy.mjs [options]

Options
  --base <url>                 base à vérifier (défaut AUDIT_BASE ou https://tooltrim.com)
  --root-target </en>          cible attendue de la redirection racine
  --guide <path>               guide dont on contrôle l'og:image
  --category <path>            catégorie censée rester noindex
  --pages a,b,c                pages HTML à contrôler (200, canonical, hreflang)
  --allow-indexed-categories   ne pas exiger le noindex des catégories (refonte des hubs)
  --max-age-days N             âge maximal accepté pour data-verified-date (défaut 180)
  --min-lastmod-values N       nombre minimal de lastmod distincts (défaut 5)
  --expect-sitemap-urls N      épingle le nombre d'URLs du sitemap (release)
  --report <path>              rapport JSON (défaut output/seo-postdeploy/report.json)
  --help                       cette aide`);
}

function parseArgs(argv) {
  const args = {
    base: process.env.AUDIT_BASE || "https://tooltrim.com",
    rootTarget: "/en",
    guide: "/fr/guide/mesurer-visibilite-ia-geo-2026",
    category: "/fr/category/creation-design",
    pages: DEFAULT_PAGES,
    allowIndexedCategories: false,
    maxAgeDays: 180,
    minLastmodValues: 5,
    expectSitemapUrls: 0,
    report: "",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = () => argv[(i += 1)];
    if (token === "--base") args.base = String(next());
    else if (token === "--root-target") args.rootTarget = String(next());
    else if (token === "--guide") args.guide = String(next());
    else if (token === "--category") args.category = String(next());
    else if (token === "--pages") args.pages = String(next()).split(",").map((value) => value.trim()).filter(Boolean);
    else if (token === "--allow-indexed-categories") args.allowIndexedCategories = true;
    else if (token === "--max-age-days") args.maxAgeDays = Number(next());
    else if (token === "--min-lastmod-values") args.minLastmodValues = Number(next());
    else if (token === "--expect-sitemap-urls") args.expectSitemapUrls = Number(next());
    else if (token === "--report") args.report = String(next());
    else if (token === "--help" || token === "-h") { printUsage(); process.exit(0); }
    else { console.error(`Option inconnue : ${token}`); printUsage(); process.exit(2); }
  }
  args.base = args.base.replace(/\/+$/, "");
  return args;
}

const args = parseArgs(process.argv.slice(2));

const results = [];
const record = (id, label, status, detail, expected = "") => {
  results.push({ id, label, status, detail, expected });
};

async function get(url, init = {}) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: { "user-agent": UA },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    ...init,
  });
  const text = await response.text();
  return { status: response.status, headers: response.headers, text, finalUrl: response.url };
}

const headOf = (html) => {
  const end = html.indexOf("</head>");
  return end > 0 ? html.slice(0, end + 7) : html.slice(0, 20000);
};

const metaContent = (head, name) => {
  const pattern = new RegExp(`<meta[^>]+name=["']${name}["'][^>]*content=["']([^"']*)["']`, "i");
  return (head.match(pattern) || [])[1] || "";
};

const normalizePath = (value) => {
  const parsed = new URL(value, args.base);
  return (parsed.pathname.replace(/\/+$/, "") || "/") + parsed.search;
};

const today = new Date().toISOString().slice(0, 10);

// ── Contrôles ──────────────────────────────────────────────────────────────
async function checkRootRedirect() {
  const response = await fetch(`${args.base}/`, {
    redirect: "manual",
    headers: { "user-agent": UA },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const location = response.headers.get("location") || "";
  const redirectStatus = [301, 302, 307, 308].includes(response.status);
  if (!redirectStatus) {
    return record("root-redirect", "redirection racine", "FAIL", `HTTP ${response.status} au lieu d'une redirection`, `3xx -> ${args.rootTarget}`);
  }
  const target = location ? normalizePath(location) : "";
  if (target !== args.rootTarget) {
    return record("root-redirect", "redirection racine", "FAIL", `${response.status} -> ${location || "(sans location)"}`, args.rootTarget);
  }
  record("root-redirect", "redirection racine", "PASS", `${response.status} -> ${location}`);
}

async function checkPages() {
  for (const page of args.pages) {
    const url = `${args.base}${page}`;
    try {
      const { status, text, finalUrl } = await get(url);
      if (status !== 200) {
        record(`page:${page}`, `page ${page}`, "FAIL", `HTTP ${status}`, "200");
        continue;
      }
      const head = headOf(text);
      const canonical = (head.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) || [])[1] || "";
      const hreflangs = [...head.matchAll(/<link[^>]+rel=["']alternate["'][^>]+hreflang=["']([^"']+)["']/gi)].map((m) => m[1]);
      const problems = [];
      if (!canonical) problems.push("canonical absente");
      else if (normalizePath(canonical) !== normalizePath(finalUrl)) problems.push(`canonical ${canonical} ≠ URL`);
      for (const lang of ["fr", "en", "x-default"]) {
        if (!hreflangs.includes(lang)) problems.push(`hreflang ${lang} manquant`);
      }
      if (text.includes("%CATALOG_")) problems.push("jeton %CATALOG_ non remplacé");
      if (problems.length) record(`page:${page}`, `page ${page}`, "FAIL", problems.join(" ; "), "200, canonical auto, hreflang fr/en/x-default");
      else record(`page:${page}`, `page ${page}`, "PASS", `200, canonical auto, ${hreflangs.length} hreflang`);
    } catch (error) {
      record(`page:${page}`, `page ${page}`, "FAIL", `requête impossible : ${error?.message || error}`, "200");
    }
  }
}

async function checkGuideOgImage() {
  const { status, text } = await get(`${args.base}${args.guide}`);
  if (status !== 200) return record("guide-og", "og:image du guide", "FAIL", `HTTP ${status}`, "200");
  const head = headOf(text);
  const og = (head.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i) || [])[1] || "";
  if (!og) return record("guide-og", "og:image du guide", "FAIL", "balise og:image absente", "URL absolue");
  if (!/^https?:\/\//i.test(og)) return record("guide-og", "og:image du guide", "FAIL", `relative : ${og}`, "URL absolue");
  // Le défaut d'origine : une URL déjà absolue préfixée par la base du site.
  if (/https?:\/\//i.test(og.slice(8))) {
    return record("guide-og", "og:image du guide", "FAIL", `origine concaténée : ${og.slice(0, 120)}`, "une seule origine");
  }
  record("guide-og", "og:image du guide", "PASS", og.slice(0, 100));
}

async function checkFreshness() {
  const { status, text } = await get(`${args.base}/en`);
  if (status !== 200) return record("freshness", "fraîcheur des métadonnées", "FAIL", `HTTP ${status}`, "200");
  const head = headOf(text);
  const verified = metaContent(head, "data-verified-date");
  const freshness = metaContent(head, "data-freshness");
  const summary = metaContent(head, "ai-summary");
  const problems = [];

  for (const [name, value] of [["data-verified-date", verified], ["data-freshness", freshness]]) {
    if (!value) problems.push(`${name} absente`);
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) problems.push(`${name} non ISO : ${value}`);
  }
  if (verified && freshness && verified !== freshness) problems.push(`dates divergentes (${verified} ≠ ${freshness})`);
  if (verified && /^\d{4}-\d{2}-\d{2}$/.test(verified)) {
    if (verified > today) problems.push(`date dans le futur : ${verified}`);
    const ageDays = Math.round((Date.parse(today) - Date.parse(verified)) / 86400000);
    if (ageDays > args.maxAgeDays) problems.push(`date vieille de ${ageDays} j > ${args.maxAgeDays} j`);
  }
  const count = Number((summary.replace(/[\u00a0\u202f]/g, "").match(/(\d[\d,.]*)\s*tools?/i) || [])[1]?.replace(/[^\d]/g, ""));
  if (!summary) problems.push("ai-summary absente");
  if (problems.length) {
    return record("freshness", "fraîcheur des métadonnées", "FAIL", problems.join(" ; "), `dates ISO ≤ ${args.maxAgeDays} j, compteur présent`);
  }
  record("freshness", "fraîcheur des métadonnées", "PASS", `${verified} · ${Number.isFinite(count) ? `${count} tools` : "compteur non chiffré"}`);
  return count;
}

async function checkSitemap(toolCountFromSummary) {
  const response = await fetch(`${args.base}/sitemap.xml`, {
    headers: { "user-agent": UA },
    signal: AbortSignal.timeout(40000),
  });
  if (!response.ok) return record("sitemap", "sitemap", "FAIL", `HTTP ${response.status}`, "200");
  const xml = await response.text();
  const blocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  const lastmods = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1].trim());
  const distinct = new Set(lastmods);
  const future = lastmods.filter((value) => value.slice(0, 10) > today);
  const missing = blocks.filter((block) => !/<lastmod>/.test(block)).length;
  const fichesFr = locs.filter((loc) => /\/fr\/tool\/[^/]+$/.test(new URL(loc).pathname)).length;

  const problems = [];
  if (!locs.length) problems.push("aucune <loc>");
  if (distinct.size < args.minLastmodValues) problems.push(`${distinct.size} lastmod distinct(s) < ${args.minLastmodValues}`);
  if (future.length) problems.push(`${future.length} lastmod dans le futur`);
  if (args.expectSitemapUrls && locs.length !== args.expectSitemapUrls) problems.push(`${locs.length} URLs ≠ ${args.expectSitemapUrls} attendues`);
  if (Number.isFinite(toolCountFromSummary) && toolCountFromSummary > 0 && toolCountFromSummary < fichesFr) {
    problems.push(`compteur annoncé (${toolCountFromSummary}) < fiches publiées (${fichesFr})`);
  }

  if (problems.length) {
    return record("sitemap", "sitemap", "FAIL", problems.join(" ; "), `${args.minLastmodValues}+ lastmod distincts, aucun futur`);
  }
  record(
    "sitemap",
    "sitemap",
    "PASS",
    `${locs.length} URLs · ${blocks.length - missing} datées / ${missing} sans lastmod · ${distinct.size} valeurs distinctes`,
    `fiches FR : ${fichesFr}`,
  );
}

async function checkCategoryNoindex() {
  const { status, text } = await get(`${args.base}${args.category}`);
  if (status !== 200) return record("category-noindex", "catégorie noindex", "FAIL", `HTTP ${status}`, "200 + noindex, follow");
  const robots = metaContent(headOf(text), "robots");
  if (args.allowIndexedCategories) {
    return record("category-noindex", "catégorie noindex", "SKIP", `indexation autorisée par option (robots: ${robots || "absente"})`);
  }
  if (!/noindex/i.test(robots)) {
    return record("category-noindex", "catégorie noindex", "FAIL", `robots: ${robots || "absente"}`, "noindex, follow");
  }
  record("category-noindex", "catégorie noindex", "PASS", robots);
}

async function checkNotFound() {
  const targets = ["/fr/r11-route-inexistante", "/selector?from=notion"];
  for (const target of targets) {
    try {
      const { status } = await get(`${args.base}${target}`);
      if (status !== 404) record(`404:${target}`, `404 ${target}`, "FAIL", `HTTP ${status}`, "404");
      else record(`404:${target}`, `404 ${target}`, "PASS", "404");
    } catch (error) {
      record(`404:${target}`, `404 ${target}`, "FAIL", `requête impossible : ${error?.message || error}`, "404");
    }
  }
}

async function checkLlmsFiles() {
  for (const file of ["/llms.txt", "/llms-full.txt"]) {
    try {
      let response = await fetch(`${args.base}${file}`, {
        method: "HEAD",
        headers: { "user-agent": UA },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (response.status === 405 || response.status === 501) {
        response = await fetch(`${args.base}${file}`, {
          headers: { "user-agent": UA },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
      }
      if (response.status !== 200) {
        record(`llms:${file}`, `fichier ${file}`, "FAIL", `HTTP ${response.status}`, "200");
        continue;
      }
      let size = Number(response.headers.get("content-length") || 0);
      // Vercel n'annonce pas toujours content-length sur HEAD : on mesure par un GET.
      if (!size) {
        const body = await fetch(`${args.base}${file}`, {
          headers: { "user-agent": UA },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        size = (await body.text()).length;
      }
      if (!size) record(`llms:${file}`, `fichier ${file}`, "FAIL", "contenu vide", "> 0 octet");
      else record(`llms:${file}`, `fichier ${file}`, "PASS", `200 · ${(size / 1024 / 1024).toFixed(2)} Mo`);
    } catch (error) {
      record(`llms:${file}`, `fichier ${file}`, "FAIL", `requête impossible : ${error?.message || error}`, "200");
    }
  }
}

// ── Exécution ──────────────────────────────────────────────────────────────
const steps = [
  ["redirection racine", checkRootRedirect],
  ["pages clés", checkPages],
  ["og:image", checkGuideOgImage],
  ["métadonnées de fraîcheur", checkFreshness],
  ["sitemap", null],
  ["catégories", checkCategoryNoindex],
  ["404", checkNotFound],
  ["fichiers LLM", checkLlmsFiles],
];

let toolCount = NaN;
for (const [label, step] of steps) {
  try {
    if (step === null) {
      await checkSitemap(toolCount);
    } else if (label === "métadonnées de fraîcheur") {
      toolCount = await step();
    } else {
      await step();
    }
  } catch (error) {
    record(label, label, "FAIL", `contrôle interrompu : ${error?.message || error}`);
  }
}

const tally = { PASS: 0, FAIL: 0, SKIP: 0 };
for (const result of results) tally[result.status] += 1;

const width = Math.max(...results.map((result) => result.label.length));
for (const result of results) {
  const detail = result.detail ? ` — ${result.detail}` : "";
  console.log(`${result.status.padEnd(4)}  ${result.label.padEnd(width)}${detail}`);
}

console.log("");
console.log(`${tally.PASS} PASS · ${tally.FAIL} FAIL · ${tally.SKIP} SKIP — base ${args.base}`);
if (tally.FAIL > 0) {
  console.error("\nContrôles en échec :");
  for (const result of results.filter((entry) => entry.status === "FAIL")) {
    console.error(`  - ${result.label}${result.expected ? ` (attendu : ${result.expected})` : ""} → ${result.detail}`);
  }
}

const reportPath = path.resolve(args.report || "output/seo-postdeploy/report.json");
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  base: args.base,
  today,
  summary: tally,
  results,
}, null, 2));
console.log(`\nRapport : ${path.relative(process.cwd(), reportPath)}`);

process.exitCode = tally.FAIL > 0 ? 1 : 0;
