// Audit SEO en direct — crawl stratifié du sitemap public de production.
//
// Mesure ce qui est réellement servi à un robot : statut, redirections, TTFB,
// poids HTML, cache edge, title/description, canonical, hreflang, H1/H2,
// JSON-LD, densité de texte, alt et liens internes.
//
// Usage :
//   node scripts/audit-seo-live.mjs [tailleEchantillon]
//   SITEMAP_FILE=/tmp/sitemap.xml node scripts/audit-seo-live.mjs 60
//
// Sortie : résumé console + output/seo-audit-live/report.json (détail par URL).
// Ne remplace pas les gates de build (validate:seo-generated) : celles-ci
// contrôlent l'artefact, celui-ci contrôle le déploiement.
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.AUDIT_BASE || "https://tooltrim.com";
const SAMPLE = Number(process.argv[2] || 90);
const CONCURRENCY = 8;
const TIMEOUT_MS = 20000;
const OUT_DIR = path.resolve("output/seo-audit-live");

async function readSitemap() {
  const file = process.env.SITEMAP_FILE;
  if (file) return fs.readFileSync(file, "utf8");
  const res = await fetch(`${BASE}/sitemap.xml`, {
    headers: { "user-agent": "ToolTrimSEOAudit/1.0 (+audit interne)" },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`sitemap.xml -> HTTP ${res.status}`);
  return res.text();
}

const xml = await readSitemap();
const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!locs.length) throw new Error("Sitemap sans <loc> : rien à auditer.");

function familyOf(url) {
  const p = new URL(url).pathname.split("/").filter(Boolean);
  if (p[1] === "tool") return p.length === 3 ? "tool" : `tool/${p[3]}`;
  if (p[1] === "stacks") return p.length === 2 ? "stacks-index" : "stacks";
  return p[1] || "home";
}

// Échantillonnage stratifié : un pas régulier par famille, pour ne pas
// n'auditer que les mêmes 90 premières fiches du catalogue.
const byFamily = new Map();
for (const loc of locs) {
  const family = familyOf(loc);
  if (!byFamily.has(family)) byFamily.set(family, []);
  byFamily.get(family).push(loc);
}
const perFamily = Math.max(1, Math.floor(SAMPLE / byFamily.size));
const targets = [];
for (const [, list] of byFamily) {
  const step = Math.max(1, Math.floor(list.length / perFamily));
  for (let i = 0; i < list.length; i += step) {
    if (list[i]) targets.push(list[i]);
    if (perFamily <= 1) break;
  }
}

const rows = [];
let cursor = 0;
async function worker() {
  while (cursor < targets.length) {
    const url = targets[cursor++];
    const started = Date.now();
    try {
      const res = await fetch(url, {
        redirect: "manual",
        headers: { "user-agent": "ToolTrimSEOAudit/1.0 (+audit interne)" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const ttfb = Date.now() - started;
      const html = await res.text();
      const head = html.slice(0, html.indexOf("</head>") + 7);
      const body = html.slice(html.indexOf("<body"));
      const text = body
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&[a-z#0-9]+;/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
      const title = (head.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "";
      const desc = (head.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i) || [])[1] || "";
      const canonical = (head.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i) || [])[1] || "";
      const hreflangs = [...head.matchAll(/<link[^>]+rel="alternate"[^>]+hreflang="([^"]+)"[^>]+href="([^"]+)"/gi)];
      const robots = (head.match(/<meta[^>]+name="robots"[^>]+content="([^"]*)"/i) || [])[1] || "";
      const ldTypes = [...head.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].flatMap((m) => {
        try {
          const parsed = JSON.parse(m[1]);
          const collect = (node) => {
            if (!node || typeof node !== "object") return [];
            if (Array.isArray(node)) return node.flatMap(collect);
            return [node["@type"]].flat().concat((node["@graph"] || []).flatMap(collect));
          };
          return collect(parsed).filter(Boolean);
        } catch {
          return ["PARSE_ERROR"];
        }
      });
      const imgs = [...body.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
      rows.push({
        url,
        family: familyOf(url),
        status: res.status,
        location: res.headers.get("location") || "",
        bytes: html.length,
        ttfb,
        cache: res.headers.get("x-vercel-cache") || "",
        title,
        titleLen: title.length,
        desc,
        descLen: desc.length,
        canonical,
        canonicalOk: canonical === url,
        hreflang: hreflangs.length,
        robots,
        noindex: /noindex/i.test(robots),
        h1s: [...body.matchAll(/<h1[\s>]/gi)].length,
        h2s: [...body.matchAll(/<h2[\s>]/gi)].length,
        ldTypes: [...new Set(ldTypes)],
        words: text.split(" ").filter((w) => w.length > 1).length,
        imgs: imgs.length,
        imgsNoAlt: imgs.filter((i) => !/alt=/.test(i)).length,
        internalLinks: [...body.matchAll(/<a\b[^>]*href="(\/[^"]*)"/gi)].length,
        langAttr: (html.match(/<html[^>]+lang="([^"]*)"/i) || [])[1] || "",
      });
    } catch (err) {
      rows.push({ url, family: familyOf(url), status: "ERR", error: String(err).slice(0, 160) });
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const ok = rows.filter((r) => typeof r.status === "number");
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
};
const p90 = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length * 0.9)] : 0;
};

const summary = {
  generatedAt: new Date().toISOString(),
  base: BASE,
  sitemapUrls: locs.length,
  crawled: rows.length,
  statuses: rows.reduce((acc, r) => ((acc[String(r.status)] = (acc[String(r.status)] || 0) + 1), acc), {}),
  errors: rows.filter((r) => r.status === "ERR").slice(0, 10),
  unexpectedRedirects: ok.filter((r) => r.status >= 300 && r.status < 400).map((r) => `${r.url} -> ${r.status} ${r.location}`),
  ttfbMedianMs: median(ok.map((r) => r.ttfb)),
  ttfbP90Ms: p90(ok.map((r) => r.ttfb)),
  htmlMedianBytes: median(ok.map((r) => r.bytes)),
  htmlP90Bytes: p90(ok.map((r) => r.bytes)),
  edgeCache: ok.reduce((acc, r) => ((acc[r.cache || "none"] = (acc[r.cache || "none"] || 0) + 1), acc), {}),
  titleMissing: ok.filter((r) => !r.title).length,
  titleOver60: ok.filter((r) => r.titleLen > 60).length,
  titleUnder20: ok.filter((r) => r.titleLen < 20).length,
  descMissing: ok.filter((r) => !r.desc).length,
  descOutsideRange: ok.filter((r) => r.desc && (r.descLen < 70 || r.descLen > 165)).length,
  canonicalMissing: ok.filter((r) => !r.canonical).length,
  canonicalMismatch: ok.filter((r) => r.canonical && !r.canonicalOk).map((r) => `${r.url} -> ${r.canonical}`),
  hreflangMissing: ok.filter((r) => r.hreflang === 0).map((r) => r.url),
  h1NotOne: ok.filter((r) => r.h1s !== 1).map((r) => ({ url: r.url, h1: r.h1s })),
  noindexInSitemap: ok.filter((r) => r.noindex).map((r) => r.url),
  jsonLdMissing: ok.filter((r) => r.ldTypes.length === 0).map((r) => r.url),
  jsonLdParseErrors: ok.filter((r) => r.ldTypes.includes("PARSE_ERROR")).map((r) => r.url),
  thinPages: ok.filter((r) => r.words < 300).map((r) => ({ url: r.url, words: r.words })),
  wordsMedian: median(ok.map((r) => r.words)),
  imagesWithoutAlt: ok.reduce((acc, r) => acc + r.imgsNoAlt, 0),
  internalLinksMedian: median(ok.map((r) => r.internalLinks)),
  langMismatch: ok
    .filter((r) => {
      const p = new URL(r.url).pathname;
      return (p.startsWith("/fr") && r.langAttr !== "fr") || (p.startsWith("/en") && r.langAttr !== "en");
    })
    .map((r) => `${r.url} (lang=${r.langAttr})`),
  slowest: [...ok].sort((a, b) => b.ttfb - a.ttfb).slice(0, 8).map((r) => ({ url: r.url, ttfb: r.ttfb, cache: r.cache })),
  heaviest: [...ok].sort((a, b) => b.bytes - a.bytes).slice(0, 8).map((r) => ({ url: r.url, kb: Math.round(r.bytes / 1024) })),
  byFamily: {},
};
for (const family of byFamily.keys()) {
  const familyRows = ok.filter((r) => r.family === family);
  if (!familyRows.length) continue;
  summary.byFamily[family] = {
    n: familyRows.length,
    wordsMedian: median(familyRows.map((r) => r.words)),
    titleMedianLen: median(familyRows.map((r) => r.titleLen)),
    descMedianLen: median(familyRows.map((r) => r.descLen)),
    internalLinksMedian: median(familyRows.map((r) => r.internalLinks)),
    jsonLd: [...new Set(familyRows.flatMap((r) => r.ldTypes))].slice(0, 8),
  };
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, "report.json"), JSON.stringify({ summary, rows }, null, 1));
console.log(JSON.stringify(summary, null, 2));
console.log(`\nDétail par URL : ${path.relative(process.cwd(), path.join(OUT_DIR, "report.json"))}`);

const blocking = summary.unexpectedRedirects.length + summary.canonicalMismatch.length + summary.h1NotOne.length + summary.jsonLdParseErrors.length + summary.noindexInSitemap.length;
if (blocking > 0) {
  console.error(`\n${blocking} anomalie(s) bloquante(s) détectée(s).`);
  process.exitCode = 1;
}
