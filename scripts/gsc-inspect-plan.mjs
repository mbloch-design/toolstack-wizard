// Sondage par InspectUrl — retrouver les pages non indexées sans export GSC.
//
// Pourquoi ce script : le rapport « Indexation des pages » n'a pas d'équivalent
// dans l'API Search Console. Le seul moyen programmatique d'obtenir un état
// d'indexation est `InspectionTools.InspectUrlIndex`, une URL à la fois, avec
// un quota d'environ 2 000 inspections par jour. On ne peut donc pas lister les
// 1 689 pages « explorée, non indexée » : on les retrouve par sondage.
//
// Deux modes :
//
//   1. Génération de la liste de sondage (par défaut)
//      node scripts/gsc-inspect-plan.mjs --sample 300
//      → output/gsc-inspect/worklist.json + plan.md
//      Tirage stratifié déterministe sur le sitemap : le même sitemap et la
//      même graine donnent exactement la même liste, donc un résultat citable.
//      Le plan indique les lots de 8 appels et le rendement attendu.
//
//   2. Conversion des réponses d'inspection en export exploitable
//      node scripts/gsc-inspect-plan.mjs --classify resultats.json
//      → output/gsc-inspect/export-synthetique.csv
//        (colonnes URL / Last crawled / Status / Reason, format GSC)
//      → le CSV se donne ensuite à `audit-seo-coverage.mjs --all --live`, qui
//        fait l'enrichissement (mots, canonical, doublons) et le classement.
//      `resultats.json` accepte un tableau de réponses brutes InspectUrl ou un
//      objet { results: [...] }, chaque entrée portant `inspectionResult`
//      (forme API) ou directement `indexStatusResult`.
//
// Aucune dépendance, aucun appel d'API : le script ne fait que préparer et
// convertir. Les appels InspectUrl restent faits par l'agent connecté.
import fs from "node:fs";
import path from "node:path";

const UA = "ToolTrimGSCProbe/1.0 (+audit interne)";
const OUT_DIR = path.resolve("output/gsc-inspect");
// Base de calcul : 1 689 « explorée, non indexée » sur 10 726 URLs au 15/10/2026
// (étude SEO, relevé Search Console). Sert uniquement à estimer le rendement.
const DEFAULT_BASE_RATE = 1689 / 10726;

function printUsage() {
  console.log(`Sondage InspectUrl.

  node scripts/gsc-inspect-plan.mjs [options]
  node scripts/gsc-inspect-plan.mjs --classify resultats.json

Options
  --sample N          taille de la liste de sondage (défaut 300)
  --batch N           taille des lots d'appels InspectUrl (défaut 8)
  --base <url>        site de référence (défaut AUDIT_BASE ou https://tooltrim.com)
  --sitemap <fichier> sitemap local au lieu du live
  --seed <valeur>     graine du tirage (défaut 2026-11-11)
  --base-rate <0..1>  taux attendu de non-indexées (défaut ${DEFAULT_BASE_RATE.toFixed(4)})
  --out <dir>         dossier de sortie (défaut output/gsc-inspect)
  --classify <file>   convertir des réponses InspectUrl en CSV exploitable`);
}

function parseArgs(argv) {
  const args = {
    sample: 300, batch: 8, base: process.env.AUDIT_BASE || "https://tooltrim.com",
    sitemap: "", seed: "2026-11-11", baseRate: DEFAULT_BASE_RATE, out: "", classify: "",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = () => argv[(i += 1)];
    if (token === "--sample") args.sample = Number(next());
    else if (token === "--batch") args.batch = Number(next());
    else if (token === "--base") args.base = String(next());
    else if (token === "--sitemap") args.sitemap = String(next());
    else if (token === "--seed") args.seed = String(next());
    else if (token === "--base-rate") args.baseRate = Number(next());
    else if (token === "--out") args.out = String(next());
    else if (token === "--classify") args.classify = String(next());
    else if (token === "--help" || token === "-h") { printUsage(); process.exit(0); }
    else { console.error(`Option inconnue : ${token}`); printUsage(); process.exit(2); }
  }
  args.base = args.base.replace(/\/+$/, "");
  return args;
}

const args = parseArgs(process.argv.slice(2));
const outDir = args.out ? path.resolve(args.out) : OUT_DIR;

// ── Mode 2 : conversion des réponses InspectUrl ────────────────────────────
const NON_INDEXED = /(crawled[^a-z]{0,3}currently not indexed|explor[ée]e?[^a-z]{0,6}(actuellement\s+)?non index[ée]e)/i;

function normalizeInspection(entry) {
  const result = entry.inspectionResult || entry;
  const index = result.indexStatusResult || result;
  const url = entry.url || result.inspectionResultLink || index.inspectionResultLink || "";
  return {
    url,
    coverageState: index.coverageState || "",
    verdict: index.verdict || "",
    robotsTxtState: index.robotsTxtState || "",
    indexingState: index.indexingState || "",
    pageFetchState: index.pageFetchState || "",
    lastCrawlTime: index.lastCrawlTime || "",
    googleCanonical: index.googleCanonical || "",
    userCanonical: index.userCanonical || "",
    crawledAs: index.crawledAs || "",
  };
}

function classifyInspection(row) {
  const state = row.coverageState;
  if (!state) return { label: "sans état", reason: "coverageState absent (URL inconnue ou réponse partielle)" };
  if (NON_INDEXED.test(state)) return { label: "non indexée — explorée", reason: state };
  if (/unknown to google|inconnue/i.test(state)) return { label: "inconnue de Google", reason: state };
  if (/redirect|redirection/i.test(state)) return { label: "redirigée", reason: state };
  if (/noindex|balise noindex/i.test(state)) return { label: "noindex", reason: state };
  if (/duplicate|canonical|doublon/i.test(state)) return { label: "doublon / canonical", reason: state };
  if (row.robotsTxtState === "DISALLOWED") return { label: "bloquée robots.txt", reason: `robots ${row.robotsTxtState}` };
  if (row.pageFetchState && row.pageFetchState !== "SUCCESSFUL") return { label: "erreur de récupération", reason: row.pageFetchState };
  if (row.verdict === "PASS" || /submitted and indexed|index[ée]e/i.test(state)) return { label: "indexée", reason: state };
  return { label: "autre", reason: state };
}

const csvCell = (value) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

function runClassify(file) {
  if (!fs.existsSync(file)) {
    console.error(`Fichier introuvable : ${file}`);
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const entries = Array.isArray(raw) ? raw : Array.isArray(raw.results) ? raw.results : [];
  if (!entries.length) {
    console.error("Aucune réponse d'inspection dans le fichier (tableau ou { results: [...] } attendu).");
    process.exit(1);
  }
  const rows = entries.map(normalizeInspection).filter((row) => row.url).map((row) => {
    const verdict = classifyInspection(row);
    return { ...row, classification: verdict.label, detail: verdict.reason };
  });

  fs.mkdirSync(outDir, { recursive: true });
  const csvPath = path.join(outDir, "export-synthetique.csv");
  const header = "URL,Last crawled,Status,Reason";
  const lines = rows.map((row) => [
    csvCell(row.url),
    csvCell(row.lastCrawlTime),
    csvCell(row.classification === "indexée" ? "Indexed" : "Not indexed"),
    csvCell(row.coverageState || row.detail),
  ].join(","));
  fs.writeFileSync(csvPath, `${header}\n${lines.join("\n")}\n`, "utf8");

  const tally = rows.reduce((acc, row) => {
    acc[row.classification] = (acc[row.classification] || 0) + 1;
    return acc;
  }, {});
  const nonIndexed = rows.filter((row) => row.classification === "non indexée — explorée");
  const canonicalMismatch = rows.filter((row) => row.googleCanonical && row.userCanonical && row.googleCanonical !== row.userCanonical);

  const report = {
    generatedAt: new Date().toISOString(),
    source: file,
    inspected: rows.length,
    tally,
    nonIndexedExplored: nonIndexed.length,
    canonicalMismatch: canonicalMismatch.length,
    rows,
  };
  fs.writeFileSync(path.join(outDir, "inspection-report.json"), JSON.stringify(report, null, 2), "utf8");

  console.log(JSON.stringify({ inspected: rows.length, tally, nonIndexedExplored: nonIndexed.length, canonicalMismatch: canonicalMismatch.length }, null, 2));
  if (canonicalMismatch.length) {
    console.log("\nCanonical Google ≠ canonical déclarée :");
    for (const row of canonicalMismatch.slice(0, 10)) console.log(`  ${row.url}\n    google: ${row.googleCanonical}\n    déclarée: ${row.userCanonical}`);
  }
  console.log(`\nCSV exploitable : ${path.relative(process.cwd(), csvPath)}`);
  console.log("Étape suivante : node scripts/audit-seo-coverage.mjs " + path.relative(process.cwd(), csvPath) + " --all --live");
}

if (args.classify) {
  runClassify(args.classify);
  process.exit(0);
}

// ── Mode 1 : liste de sondage stratifiée ───────────────────────────────────
function familyOf(url) {
  let pathname = "/";
  try { pathname = new URL(url).pathname; } catch { pathname = url; }
  const parts = pathname.split("/").filter(Boolean);
  const section = parts[1] || "";
  // Les sous-pages d'outil sont regroupées par sous-page (/prix, /avis…) : le
  // sondage doit dire si le problème est concentré sur l'une d'elles.
  if (section === "tool") return parts.length <= 3 ? "tool/fiche" : `tool/${parts[3]}`;
  if (section === "stacks") return parts.length <= 2 ? "stacks/index" : "stacks";
  if (section === "comparatif") return parts.length <= 2 ? "comparatifs/index" : "comparatif";
  if (section === "guide") return parts.length <= 2 ? "guides/index" : "guide";
  if (section === "category") return "category";
  if (section === "explorer") return "explorer";
  return section || "home";
}

function hashKey(seed, value) {
  let hash = 0x811c9dc5;
  const input = `${seed}:${value}`;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function allocate(sizes, total) {
  const sum = [...sizes.values()].reduce((acc, value) => acc + value, 0);
  const quotas = [...sizes.entries()]
    .map(([family, size]) => {
      const exact = (size / sum) * total;
      return { family, size, floor: Math.floor(exact), fraction: exact - Math.floor(exact) };
    })
    .sort((a, b) => b.size - a.size || a.family.localeCompare(b.family));
  let remaining = total - quotas.reduce((acc, quota) => acc + quota.floor, 0);
  for (const quota of [...quotas].sort((a, b) => b.fraction - a.fraction || b.size - a.size)) {
    if (remaining <= 0) break;
    if (quota.floor < quota.size) { quota.floor += 1; remaining -= 1; }
  }
  return new Map(quotas.map((quota) => [quota.family, quota.floor]));
}

async function readSitemap() {
  if (args.sitemap) return fs.readFileSync(args.sitemap, "utf8");
  const response = await fetch(`${args.base}/sitemap.xml`, {
    headers: { "user-agent": UA },
    signal: AbortSignal.timeout(40000),
  });
  if (!response.ok) throw new Error(`sitemap.xml -> HTTP ${response.status}`);
  return response.text();
}

const xml = await readSitemap();
const blocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => match[1]);
const entries = blocks.map((block) => ({
  url: (block.match(/<loc>([^<]+)<\/loc>/) || [])[1]?.trim() || "",
  lastmod: (block.match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1]?.trim() || "",
})).filter((entry) => entry.url);
if (!entries.length) throw new Error("Sitemap sans <loc> : rien à échantillonner.");

const byFamily = new Map();
for (const entry of entries) {
  const family = familyOf(entry.url);
  entry.family = family;
  if (!byFamily.has(family)) byFamily.set(family, []);
  byFamily.get(family).push(entry);
}

const sizes = new Map([...byFamily].map(([family, list]) => [family, list.length]));
const target = Math.min(args.sample, entries.length);
const quotas = allocate(sizes, target);
const selected = [];
for (const [family, list] of byFamily) {
  const quota = quotas.get(family) || 0;
  const ordered = [...list].sort((a, b) => hashKey(args.seed, a.url).localeCompare(hashKey(args.seed, b.url)));
  selected.push(...ordered.slice(0, quota));
}
selected.sort((a, b) => a.family.localeCompare(b.family) || a.url.localeCompare(b.url));

const batchCount = Math.ceil(selected.length / args.batch);
const expectedHits = Math.round(selected.length * args.baseRate);
const items = selected.map((entry, index) => ({
  rank: index + 1,
  batch: Math.floor(index / args.batch) + 1,
  url: entry.url,
  family: entry.family,
  lastmod: entry.lastmod,
}));

fs.mkdirSync(outDir, { recursive: true });
const worklistPath = path.join(outDir, "worklist.json");
fs.writeFileSync(worklistPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  base: args.base,
  seed: args.seed,
  sitemapUrls: entries.length,
  sampleSize: items.length,
  batchSize: args.batch,
  batches: batchCount,
  baseRate: args.baseRate,
  expectedNonIndexedHits: expectedHits,
  strata: Object.fromEntries([...sizes].sort((a, b) => b[1] - a[1])),
  items,
}, null, 2), "utf8");

const planLines = [
  "# Plan de sondage InspectUrl",
  "",
  `- Sitemap : ${entries.length} URLs · échantillon : ${items.length} URLs (graine \`${args.seed}\`).`,
  `- Lots de ${args.batch} appels : ${batchCount} lots.`,
  `- Taux attendu de « explorée, non indexée » : ${(args.baseRate * 100).toFixed(1)} % → environ ${expectedHits} URLs trouvées sur ${items.length} inspections.`,
  `- Quota Search Console : ~2 000 inspections par jour. Ce sondage consomme ${((items.length / 2000) * 100).toFixed(0)} % du quota journalier.`,
  "",
  "## Répartition par famille",
  "",
  "| Famille | URLs au sitemap | Sondées |",
  "|---|---:|---:|",
];
for (const [family, size] of [...sizes].sort((a, b) => b[1] - a[1])) {
  planLines.push(`| ${family} | ${size} | ${quotas.get(family) || 0} |`);
}
planLines.push("", "## Ce que chaque inspection renvoie", "");
planLines.push("- `coverageState` : le motif exact (« Crawled - currently not indexed », « Duplicate, Google chose different canonical… », etc.).");
planLines.push("- `verdict` : PASS / PARTIAL / FAIL / NEUTRAL.");
planLines.push("- `googleCanonical` vs `userCanonical` : divergence de consolidation.");
planLines.push("- `robotsTxtState`, `indexingState`, `pageFetchState`, `lastCrawlTime`.");
planLines.push("", "## Enchaînement", "");
planLines.push("1. Inspecter les URLs du `worklist.json`, par lots de 8 (l'outil d'intégration accepte jusqu'à 8 appels par requête).");
planLines.push("2. Écrire les réponses dans un JSON, puis : `node scripts/gsc-inspect-plan.mjs --classify reponses.json`.");
planLines.push("3. Enchaîner sur le classifieur d'échantillon : `node scripts/audit-seo-coverage.mjs output/gsc-inspect/export-synthetique.csv --all --live`.");
planLines.push("", "## Limites", "");
planLines.push("- C'est un **sondage**, pas un recensement : il estime une part et fournit un échantillon classable, il ne prétend pas lister les 1 689 URLs.");
planLines.push("- `InspectUrl` renvoie un état mis en cache par Google, qui peut avoir plusieurs jours de retard.");
planLines.push("- Une URL absente du sitemap n'a aucune chance d'être tirée : les anciennes URLs redirigées ou paramétrées restent hors de portée de cette méthode.");
const planPath = path.join(outDir, "plan.md");
fs.writeFileSync(planPath, `${planLines.join("\n")}\n`, "utf8");

console.log(JSON.stringify({
  sitemapUrls: entries.length,
  sampleSize: items.length,
  batches: batchCount,
  batchSize: args.batch,
  expectedNonIndexedHits: expectedHits,
  families: byFamily.size,
}, null, 2));
console.log(`\nListe de sondage : ${path.relative(process.cwd(), worklistPath)}`);
console.log(`Plan : ${path.relative(process.cwd(), planPath)}`);
