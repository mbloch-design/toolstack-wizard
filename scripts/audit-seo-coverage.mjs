// Échantillonnage du rapport Couverture / Indexation des pages de Search Console.
//
// Usage :
//   node scripts/audit-seo-coverage.mjs chemin/vers/export.csv
//   GSC_CSV=export.csv node scripts/audit-seo-coverage.mjs --live
//   node scripts/audit-seo-coverage.mjs export.csv --sample 50 --live --markdown output/seo/echantillon.md
//
// Le script ne devine pas les données : il lit l'export GSC fourni, puis
// 1. détecte le format (séparateur, BOM, colonnes) — les exports FR et EN
//    n'ont pas les mêmes en-têtes, et Excel produit du `;` ;
// 2. filtre le motif visé (par défaut « Explorée, actuellement non indexée ») ;
// 3. tire un échantillon stratifié déterministe par famille d'URL : le même
//    CSV et la même graine donnent le même tirage, donc un résultat citable ;
// 4. enrichit chaque URL échantillonnée en direct (statut, canonical, robots,
//    title, mots, JSON-LD) quand `--live` est passé ;
// 5. classe en doublon / thin / hors intention / à qualifier, en écrivant la
//    preuve qui justifie chaque verdict.
//
// Ce que le script ne peut pas faire : décider de l'intention. « Hors
// intention » n'est mesurable sans données de requête ; la catégorie est donc
// une suspicion argumentée (URL non déclarée au sitemap, famille hors index,
// redirection, paramètres de requête), à confirmer à la main.
//
// Limite de mesure : les doublons sont détectés *dans l'échantillon*. Sur 50
// URLs, c'est un plancher, pas un comptage du corpus.
//
// Sorties : output/seo-coverage-audit/report.json et report.md
// (surchargeables par --report et --markdown).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const BASE = process.env.AUDIT_BASE || "https://tooltrim.com";
const UA = "ToolTrimSEOAudit/1.0 (+audit interne)";
const TIMEOUT_MS = 20000;
const OUT_DIR = path.resolve("output/seo-coverage-audit");

// Motif « Explorée, actuellement non indexée » dans les deux langues d'export.
const DEFAULT_REASON = /(crawled[^a-z]{0,3}currently not indexed|explor[ée]e?[^a-z]{0,6}(actuellement\s+)?non index[ée]e)/i;

const ALIASES = {
  url: ["url", "page", "adresse", "pages", "page url", "url de la page", "url de page"],
  reason: [
    "reason", "coverage", "coverage issue", "issue", "motif", "cause", "raison",
    "validity", "validite", "erreur de couverture", "type d'erreur", "explication", "details",
  ],
  status: ["status", "statut", "type", "indexation", "indexed"],
  lastCrawled: ["last crawled", "derniere exploration", "dernier crawl", "last crawl", "last crawl time"],
  source: ["source", "sitemap", "decouvert via", "discovered via"],
  referringPage: ["referring page", "page de reference", "referrer"],
};

function printUsage() {
  console.log(`Échantillonnage du rapport Couverture de Search Console.

  node scripts/audit-seo-coverage.mjs <export.csv> [options]

Options
  --sample N        taille de l'échantillon (défaut 50)
  --reason <regex>  motif à filtrer (défaut : « explorée, non indexée »)
  --all             ne pas filtrer, échantillonner tout l'export
  --live            enrichir chaque URL en direct (statut, canonical, mots…)
  --concurrency N   requêtes parallèles en mode --live (défaut 4)
  --thin N          seuil de mots sous lequel une page est « thin » (défaut 600)
  --seed <valeur>   graine du tirage déterministe (défaut 2026-11-11)
  --col-url <nom>   forcer la colonne URL
  --col-reason <nom> forcer la colonne motif
  --report <path>   chemin du JSON (défaut output/seo-coverage-audit/report.json)
  --markdown <path> chemin du Markdown (défaut output/seo-coverage-audit/report.md)

  GSC_CSV=<export.csv> fonctionne aussi sans argument positionnel.
  Un export ZIP doit d'abord être décompressé.`);
}

function parseArgs(argv) {
  const args = {
    csv: "", sample: 50, thin: 600, concurrency: 4, seed: "2026-11-11",
    live: false, all: false, reason: "", report: "", markdown: "", colUrl: "", colReason: "",
  };
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = () => argv[(i += 1)];
    if (token === "--live") args.live = true;
    else if (token === "--all") args.all = true;
    else if (token === "--sample") args.sample = Number(next());
    else if (token === "--thin") args.thin = Number(next());
    else if (token === "--concurrency") args.concurrency = Number(next());
    else if (token === "--seed") args.seed = String(next());
    else if (token === "--reason") args.reason = String(next());
    else if (token === "--report") args.report = String(next());
    else if (token === "--markdown") args.markdown = String(next());
    else if (token === "--col-url") args.colUrl = String(next());
    else if (token === "--col-reason") args.colReason = String(next());
    else if (token === "--help" || token === "-h") { printUsage(); process.exit(0); }
    else if (!token.startsWith("--")) positional.push(token);
  }
  args.csv = process.env.GSC_CSV || positional[0] || "";
  return args;
}

// ── Lecture du CSV ─────────────────────────────────────────────────────────
function sniffDelimiter(headerLine) {
  const counts = { ",": 0, ";": 0, "\t": 0 };
  let quoted = false;
  for (const char of headerLine) {
    if (char === '"') quoted = !quoted;
    else if (!quoted && char in counts) counts[char] += 1;
  }
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return ranked[0][1] > 0 ? ranked[0][0] : ",";
}

/** Parseur CSV minimal : guillemets, guillemets échappés, retours ligne cités. */
function parseCsv(text, delimiter) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; }
        else quoted = false;
      } else field += char;
      continue;
    }
    if (char === '"') { quoted = true; continue; }
    if (char === delimiter) { row.push(field); field = ""; continue; }
    if (char === "\r") continue;
    if (char === "\n") { row.push(field); rows.push(row); row = []; field = ""; continue; }
    field += char;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

const normalizeHeader = (value) =>
  value
    .replace(/^\uFEFF/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/["']/g, "")
    .replace(/\s+/g, " ")
    .trim();

function resolveColumns(header, args) {
  const normalized = header.map(normalizeHeader);
  const find = (aliases, forced) => {
    if (forced) {
      const index = normalized.indexOf(normalizeHeader(forced));
      if (index >= 0) return index;
    }
    for (const alias of aliases) {
      const index = normalized.indexOf(alias);
      if (index >= 0) return index;
    }
    return -1;
  };
  return {
    url: find(ALIASES.url, args.colUrl),
    reason: find(ALIASES.reason, args.colReason),
    status: find(ALIASES.status),
    lastCrawled: find(ALIASES.lastCrawled),
    source: find(ALIASES.source),
    referringPage: find(ALIASES.referringPage),
  };
}

// ── Familles, tirage, mesures ──────────────────────────────────────────────
function familyOf(url) {
  let pathname = "/";
  try { pathname = new URL(url).pathname; } catch { pathname = url; }
  const parts = pathname.split("/").filter(Boolean);
  const section = parts[1] || "";
  if (section === "tool") {
    if (parts.length <= 3) return "tool/fiche";
    return `tool/${parts[3]}`;
  }
  if (section === "stacks") return parts.length <= 2 ? "stacks/index" : "stacks";
  if (section === "comparatif") return parts.length <= 2 ? "comparatifs/index" : "comparatif";
  if (section === "guide") return parts.length <= 2 ? "guides/index" : "guide";
  if (section === "category") return "category";
  if (section === "explorer") return "explorer";
  return section || "home";
}

/** FNV-1a : tri stable et reproductible, sans dépendance. */
function hashKey(seed, value) {
  let hash = 0x811c9dc5;
  const input = `${seed}:${value}`;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/** Répartition proportionnelle par famille, reste à la plus forte décimale. */
function allocate(sizes, total) {
  const sum = [...sizes.values()].reduce((acc, value) => acc + value, 0);
  const quotas = [...sizes.entries()]
    .map(([family, size]) => {
      const exact = (size / sum) * total;
      return { family, size, floor: Math.floor(exact), fraction: exact - Math.floor(exact) };
    })
    .sort((a, b) => b.size - a.size || a.family.localeCompare(b.family));
  let remaining = total - quotas.reduce((acc, quota) => acc + quota.floor, 0);
  const byFraction = [...quotas].sort((a, b) => b.fraction - a.fraction || b.size - a.size);
  for (const quota of byFraction) {
    if (remaining <= 0) break;
    // Une famille ne peut pas fournir plus que son effectif.
    if (quota.floor < quota.size) { quota.floor += 1; remaining -= 1; }
  }
  return new Map(quotas.map((quota) => [quota.family, quota.floor]));
}

function stratifiedSample(rows, sampleSize, seed) {
  const groups = new Map();
  for (const row of rows) {
    if (!groups.has(row.family)) groups.set(row.family, []);
    groups.get(row.family).push(row);
  }
  const sizes = new Map([...groups].map(([family, list]) => [family, list.length]));
  const quotas = allocate(sizes, Math.min(sampleSize, rows.length));
  const picked = [];
  for (const [family, list] of groups) {
    const quota = quotas.get(family) || 0;
    const ordered = [...list].sort((a, b) => hashKey(seed, a.url).localeCompare(hashKey(seed, b.url)));
    picked.push(...ordered.slice(0, quota));
  }
  return picked.sort((a, b) => a.family.localeCompare(b.family) || a.url.localeCompare(b.url));
}

const stripTags = (html) => html
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&[a-z#0-9]+;/gi, " ")
  .replace(/\s+/g, " ")
  .trim();

const wordCount = (text) => text.split(" ").filter((word) => word.length > 1).length;

const normalizeText = (value) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

function headFacts(html, finalUrl) {
  const headEnd = html.indexOf("</head>");
  const head = headEnd > 0 ? html.slice(0, headEnd + 7) : html.slice(0, 20000);
  const body = html.slice(html.indexOf("<body"));
  const title = (head.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "";
  const description = (head.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || [])[1] || "";
  const canonical = (head.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) || [])[1]
    || (head.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i) || [])[1]
    || "";
  const robots = (head.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i) || [])[1] || "";
  const hreflang = [...head.matchAll(/<link[^>]+rel=["']alternate["'][^>]+hreflang=["']([^"']+)["']/gi)].length;
  const ldTypes = [...head.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap((match) => {
      try {
        const parsed = JSON.parse(match[1]);
        const collect = (node) => {
          if (!node || typeof node !== "object") return [];
          if (Array.isArray(node)) return node.flatMap(collect);
          return [node["@type"]].flat().concat((node["@graph"] || []).flatMap(collect));
        };
        return collect(parsed).filter(Boolean);
      } catch { return ["PARSE_ERROR"]; }
    });
  const text = stripTags(body);
  const words = wordCount(text);
  return {
    finalUrl,
    title: title.trim(),
    description: description.trim(),
    canonical,
    canonicalSelf: canonical ? canonical.replace(/\/+$/, "") === finalUrl.replace(/\/+$/, "") : false,
    noindex: /noindex/i.test(robots),
    robots: robots.trim(),
    hreflang,
    h1s: [...body.matchAll(/<h1[\s>]/gi)].length,
    words,
    ldTypes: [...new Set(ldTypes)],
    bodyHash: crypto.createHash("sha256").update(normalizeText(text)).digest("hex").slice(0, 16),
    bodyHeadHash: crypto.createHash("sha256").update(normalizeText(text).split(" ").slice(0, 60).join(" ")).digest("hex").slice(0, 16),
  };
}

async function pool(items, worker, size) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.max(1, Math.min(size, items.length)) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]);
    }
  }));
  return results;
}

async function readSitemap() {
  try {
    const response = await fetch(`${BASE}/sitemap.xml`, {
      headers: { "user-agent": UA },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) return null;
    const xml = await response.text();
    return new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim()));
  } catch { return null; }
}

// ── Programme ──────────────────────────────────────────────────────────────
const args = parseArgs(process.argv.slice(2));
if (!args.csv) {
  console.error("Aucun export fourni. Passe le chemin du CSV GSC en argument, ou GSC_CSV=…");
  printUsage();
  process.exit(2);
}
if (!fs.existsSync(args.csv)) {
  console.error(`Fichier introuvable : ${args.csv}`);
  process.exit(2);
}

const raw = fs.readFileSync(args.csv, "utf8").replace(/^\uFEFF/, "");
const firstLine = raw.slice(0, raw.indexOf("\n") >= 0 ? raw.indexOf("\n") : raw.length);
const delimiter = sniffDelimiter(firstLine);
const table = parseCsv(raw, delimiter);
if (table.length < 2) {
  console.error("CSV vide ou sans ligne de données.");
  process.exit(1);
}

const header = table[0];
const columns = resolveColumns(header, args);
if (columns.url < 0) {
  console.error("Colonne URL introuvable. En-têtes lus :");
  header.forEach((name, index) => console.error(`  [${index}] ${name}`));
  console.error("Force-la avec --col-url <nom exact de l'en-tête>.");
  process.exit(1);
}

const rows = [];
for (const cells of table.slice(1)) {
  const url = (cells[columns.url] || "").trim();
  if (!url) continue;
  const reasonText = [
    columns.reason >= 0 ? cells[columns.reason] : "",
    columns.status >= 0 ? cells[columns.status] : "",
  ].filter(Boolean).join(" · ").trim();
  rows.push({
    url,
    reason: reasonText,
    lastCrawled: columns.lastCrawled >= 0 ? (cells[columns.lastCrawled] || "").trim() : "",
    source: columns.source >= 0 ? (cells[columns.source] || "").trim() : "",
    referringPage: columns.referringPage >= 0 ? (cells[columns.referringPage] || "").trim() : "",
    family: familyOf(url),
  });
}

const targetReason = args.reason ? new RegExp(args.reason, "i") : DEFAULT_REASON;
const matched = args.all ? rows : rows.filter((row) => targetReason.test(row.reason));

console.log(JSON.stringify({
  csv: args.csv,
  delimiter: delimiter === "\t" ? "tab" : delimiter,
  rows: rows.length,
  columns: Object.fromEntries(Object.entries(columns).map(([key, index]) => [key, index >= 0 ? header[index] : null])),
  matched: matched.length,
  mode: args.all ? "all" : "reason",
}, null, 2));

if (!matched.length) {
  const counts = new Map();
  for (const row of rows) if (row.reason) counts.set(row.reason, (counts.get(row.reason) || 0) + 1);
  console.error("\nAucune ligne ne correspond au motif. Motifs présents dans l'export :");
  for (const [reason, count] of [...counts].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
    console.error(`  ${String(count).padStart(5)}  ${reason}`);
  }
  console.error("\nRelance avec --reason \"<motif>\" ou --all.");
  process.exit(1);
}

const sample = stratifiedSample(matched, args.sample, args.seed);

// ── Enrichissement en direct ───────────────────────────────────────────────
let sitemap = null;
if (args.live) {
  sitemap = await readSitemap();
  if (!sitemap) console.warn("Sitemap illisible : le critère « déclarée au sitemap » sera ignoré.");
}

const measured = args.live
  ? await pool(sample, async (row) => {
    try {
      const response = await fetch(row.url, {
        redirect: "follow",
        headers: { "user-agent": UA },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const html = await response.text();
      return {
        ...row,
        status: response.status,
        redirected: response.redirected,
        finalUrl: response.url,
        ...headFacts(html, response.url),
        error: "",
      };
    } catch (error) {
      return { ...row, status: "ERR", error: String(error?.message || error) };
    }
  }, args.concurrency)
  : sample.map((row) => ({ ...row, status: "not-measured", error: "" }));

// ── Classement ─────────────────────────────────────────────────────────────
function classify(row) {
  if (row.error) return { label: "non mesuré", evidence: [`requête échouée : ${row.error}`] };

  const evidence = [];
  let duplicate = false;

  if (row.measured && row.canonical && !row.canonicalSelf) {
    duplicate = true;
    evidence.push(`canonical pointe ailleurs : ${row.canonical}`);
  }
  if (row.dupTitleOf?.length) {
    duplicate = true;
    evidence.push(`title identique à ${row.dupTitleOf.length} URL(s) de l'échantillon`);
  }
  if (row.dupBodyOf?.length) {
    duplicate = true;
    evidence.push(`corps identique à ${row.dupBodyOf.length} URL(s) de l'échantillon`);
  }
  if (duplicate) return { label: "doublon", evidence };

  if (row.measured && typeof row.words === "number" && row.words < args.thin) {
    return { label: "thin", evidence: [`${row.words} mots < seuil ${args.thin}`] };
  }

  const suspicion = [];
  if (row.family === "category") suspicion.push("famille catégorie : hubs en noindex depuis le 19/10");
  if (row.family === "explorer") suspicion.push("famille explorer : hors index depuis le 19/10");
  if (row.url.includes("?")) suspicion.push("URL à paramètres de requête");
  if (row.measured && row.redirected) suspicion.push(`redirigée vers ${row.finalUrl}`);
  if (sitemap && !sitemap.has(row.url)) suspicion.push("absente du sitemap");
  if (suspicion.length) return { label: "hors intention (à confirmer)", evidence: suspicion };

  return {
    label: "à qualifier",
    evidence: [
      row.measured
        ? `${row.words} mots, canonical autoréférente, ${row.ldTypes.length} type(s) JSON-LD`
        : "pas d'enrichissement : relancer avec --live pour trancher",
    ],
  };
}

// Doublons intra-échantillon : titres et empreintes de corps.
const byTitle = new Map();
const byBody = new Map();
for (const row of measured) {
  if (!row.measured || !row.title) continue;
  const key = normalizeText(row.title);
  if (!byTitle.has(key)) byTitle.set(key, []);
  byTitle.get(key).push(row.url);
  const bodyKey = row.bodyHash;
  if (!byBody.has(bodyKey)) byBody.set(bodyKey, []);
  byBody.get(bodyKey).push(row.url);
}
for (const row of measured) {
  if (!row.measured || !row.title) continue;
  row.dupTitleOf = byTitle.get(normalizeText(row.title)).filter((url) => url !== row.url);
  row.dupBodyOf = byBody.get(row.bodyHash).filter((url) => url !== row.url);
}

for (const row of measured) {
  row.measured = args.live && row.status !== "ERR" && row.status !== "not-measured";
  row.sitemapListed = sitemap ? sitemap.has(row.url) : null;
  const verdict = classify(row);
  row.classification = verdict.label;
  row.evidence = verdict.evidence;
}

// ── Rapport ────────────────────────────────────────────────────────────────
const tally = (labels) => measured.reduce((acc, row) => {
  if (labels.includes(row.classification)) acc[row.classification] = (acc[row.classification] || 0) + 1;
  return acc;
}, {});

const byFamily = {};
for (const row of measured) {
  if (!byFamily[row.family]) byFamily[row.family] = { n: 0, doublon: 0, thin: 0, "hors intention (à confirmer)": 0, "à qualifier": 0, "non mesuré": 0 };
  byFamily[row.family].n += 1;
  byFamily[row.family][row.classification] = (byFamily[row.family][row.classification] || 0) + 1;
}

const summary = {
  generatedAt: new Date().toISOString(),
  source: args.csv,
  base: BASE,
  seed: args.seed,
  reasonFilter: args.all ? null : targetReason.source,
  exportRows: rows.length,
  matchedRows: matched.length,
  sampleSize: measured.length,
  live: args.live,
  thinThreshold: args.thin,
  sitemapUrls: sitemap ? sitemap.size : null,
  classification: tally(["doublon", "thin", "hors intention (à confirmer)", "à qualifier", "non mesuré"]),
  families: byFamily,
  // Les doublons sont mesurés dans l'échantillon : plancher, pas recensement.
  duplicateMeasurement: args.live ? "intra-échantillon" : "non mesuré (mode sans --live)",
};

const reportPath = path.resolve(args.report || path.join(OUT_DIR, "report.json"));
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify({ summary, rows: measured }, null, 2));

const pct = (value, total) => `${value}/${total} (${total ? Math.round((value / total) * 100) : 0} %)`;
const lines = [];
lines.push("# Échantillon GSC — page explorée, actuellement non indexée", "");
lines.push(`- Export source : \`${path.basename(args.csv)}\` — ${rows.length} lignes, motif retenu sur ${matched.length}.`);
lines.push(`- Échantillon : ${measured.length} URLs, tirage stratifié déterministe (graine \`${args.seed}\`).`);
lines.push(`- Enrichissement en direct : ${args.live ? `oui (${BASE})` : "non — relancer avec `--live`"}.`);
lines.push(`- Seuil thin : ${args.thin} mots.`, "");
lines.push("## Répartition", "");
lines.push("| Classement | URLs |", "|---|---:|");
for (const [label, count] of Object.entries(summary.classification)) {
  lines.push(`| ${label} | ${pct(count, measured.length)} |`);
}
lines.push("", "## Par famille", "");
lines.push("| Famille | Échantillon | Doublon | Thin | Hors intention | À qualifier | Non mesuré |", "|---|---:|---:|---:|---:|---:|---:|");
for (const [family, counts] of Object.entries(byFamily).sort((a, b) => b[1].n - a[1].n)) {
  lines.push(`| ${family} | ${counts.n} | ${counts.doublon || 0} | ${counts.thin || 0} | ${counts["hors intention (à confirmer)"] || 0} | ${counts["à qualifier"] || 0} | ${counts["non mesuré"] || 0} |`);
}
lines.push("", "## Détail", "");
lines.push("| # | URL | Famille | Statut | Mots | Canonical | Classement | Preuve |", "|---:|---|---|---:|---:|---|---|---|");
measured.forEach((row, index) => {
  const canonical = row.measured ? (row.canonicalSelf ? "auto" : row.canonical || "absente") : "—";
  lines.push(`| ${index + 1} | ${row.url} | ${row.family} | ${row.status} | ${row.measured ? row.words : "—"} | ${canonical} | ${row.classification} | ${row.evidence.join(" ; ").replace(/\|/g, "\\|")} |`);
});
lines.push("", "## Limites", "");
lines.push("- Les doublons sont détectés **dans l'échantillon** par canonical divergente, title identique ou empreinte de corps identique : c'est un plancher, pas un recensement du corpus.");
lines.push("- « Hors intention » n'est pas mesurable sans données de requête : la catégorie signale une suspicion argumentée, à confirmer manuellement.");
lines.push("- Le tirage est déterministe : le même export et la même graine reproduisent exactement cet échantillon.");

const markdownPath = path.resolve(args.markdown || path.join(OUT_DIR, "report.md"));
fs.mkdirSync(path.dirname(markdownPath), { recursive: true });
fs.writeFileSync(markdownPath, `${lines.join("\n")}\n`);

console.log(JSON.stringify(summary, null, 2));
if (!args.live) {
  console.log("\nMode sans --live : aucun mot, aucune canonical, aucun statut mesuré.");
  console.log("Le classement se limite aux suspicions d'intention ; relancer avec --live pour trancher.");
}
console.log(`\nRapport JSON : ${path.relative(process.cwd(), reportPath)}`);
console.log(`Rapport Markdown : ${path.relative(process.cwd(), markdownPath)}`);
