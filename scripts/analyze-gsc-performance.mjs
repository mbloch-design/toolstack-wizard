// Priorisation des réécritures à partir des exports Performances de Search Console.
//
// Usage :
//   node scripts/analyze-gsc-performance.mjs --pages gsc-pages.csv --queries gsc-queries.csv
//   node scripts/analyze-gsc-performance.mjs --pages p.csv --queries q.csv --profile awr2026
//   node scripts/analyze-gsc-performance.mjs --pages p.csv --queries q.csv --query-pages qp.csv
//
// Principe : une page à la position 12 avec beaucoup d'impressions et un CTR
// très bas ne rapporte pas ce qu'une page à cette position devrait rapporter.
// On chiffre ce manque à gagner : impressions × (CTR attendu à la position −
// CTR réel), jamais négatif — le surplus est reporté à part, il protège une
// page qui fait mieux que la courbe.
//
// La courbe de CTR par position est le seul paramètre « subjectif » du calcul.
// Les études publiées divergent largement (position 1 : 7,1 % à 39,8 % selon
// méthode, appareil et présence d'AI Overviews), donc :
//   - `composite` (défaut) : moyenne des principales études 2026, position 1 à
//     ~27,6 %, position 10 à ~2,4 %, puis décroissance de page 2 (~0,6 %) ;
//   - `awr2026` : Advanced Web Ranking, desktop US juillet 2026, nettement plus
//     bas (position 1 à 14,6 %) parce que les AI Overviews captent le clic ;
//   - `prudent` : hypothèse volontairement pessimiste, pour ne surestimer
//     aucune opportunité.
// Aucune de ces courbes n'est « vraie » : le script imprime celle qui a servi,
// et `--curve-file` permet d'injecter la vôtre.
//
// Entrées attendues : les exports CSV de l'onglet Performances (bouton
// Exporter), « Pages » et « Requêtes ». Les en-têtes FR et EN sont acceptés,
// ainsi que le séparateur `;`, le BOM, les milliers séparés par une espace et
// les décimales à virgule. `--query-pages` accepte un export couplant requête
// et page (API Search Analytics) : sans lui, la cannibalisation n'est pas
// mesurable et le script le dit au lieu d'inventer.
//
// Sorties : output/gsc-performance/opportunities.json + opportunities.md
import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve("output/gsc-performance");

const CURVES = {
  composite: {
    label: "Composite 2026 (moyenne des principales études, Caftari/navboost)",
    points: { 1: 0.276, 2: 0.158, 3: 0.11, 4: 0.08, 5: 0.061, 6: 0.044, 7: 0.035, 8: 0.031, 9: 0.026, 10: 0.024, 11: 0.006, 15: 0.004, 20: 0.0025, 30: 0.0011, 50: 0.0005, 100: 0.0002 },
  },
  awr2026: {
    label: "Advanced Web Ranking, desktop US, juillet 2026 (AI Overviews incluses)",
    points: { 1: 0.1461, 2: 0.0924, 3: 0.0366, 4: 0.0151, 5: 0.0117, 6: 0.009, 7: 0.0072, 8: 0.0062, 9: 0.0057, 10: 0.0053, 11: 0.003, 15: 0.002, 20: 0.0012, 30: 0.0006, 50: 0.0003, 100: 0.0001 },
  },
  prudent: {
    label: "Hypothèse pessimiste (aucune opportunité surestimée)",
    points: { 1: 0.12, 2: 0.07, 3: 0.045, 4: 0.03, 5: 0.02, 6: 0.014, 7: 0.011, 8: 0.009, 9: 0.008, 10: 0.007, 11: 0.003, 15: 0.002, 20: 0.0012, 30: 0.0006, 50: 0.0003, 100: 0.0001 },
  },
};

function printUsage() {
  console.log(`Priorisation des réécritures à partir des exports Performances.

  node scripts/analyze-gsc-performance.mjs --pages <csv> [--queries <csv>] [options]

Entrées
  --pages <fichier>        export CSV de l'onglet Pages (obligatoire)
  --queries <fichier>      export CSV de l'onglet Requêtes
  --query-pages <fichier>  export couplant requête et page (détecte la cannibalisation)

Options
  --profile <nom>          composite (défaut) | awr2026 | prudent
  --curve-file <fichier>   JSON {"1":0.27,"2":0.15,...} pour imposer sa courbe
  --min-impressions N      seuil d'impressions pour arbitrer (défaut 100)
  --ctr-threshold <0..1>   CTR sous lequel la réécriture est prioritaire (défaut 0.01)
  --position-max N         au-delà, la page est à approfondir (défaut 20)
  --top N                  lignes affichées (défaut 20)
  --out <dir>              dossier de sortie (défaut output/gsc-performance)
  --help`);
}

function parseArgs(argv) {
  const args = {
    pages: "", queries: "", queryPages: "", profile: "composite", curveFile: "",
    minImpressions: 100, ctrThreshold: 0.01, positionMax: 20,
    top: 20, out: "",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = () => argv[(i += 1)];
    if (token === "--pages") args.pages = String(next());
    else if (token === "--queries") args.queries = String(next());
    else if (token === "--query-pages") args.queryPages = String(next());
    else if (token === "--profile") args.profile = String(next());
    else if (token === "--curve-file") args.curveFile = String(next());
    else if (token === "--min-impressions") args.minImpressions = Number(next());
    else if (token === "--ctr-threshold") args.ctrThreshold = Number(next());
    else if (token === "--position-max") args.positionMax = Number(next());
    else if (token === "--top") args.top = Number(next());
    else if (token === "--out") args.out = String(next());
    else if (token === "--help" || token === "-h") { printUsage(); process.exit(0); }
    else { console.error(`Option inconnue : ${token}`); printUsage(); process.exit(2); }
  }
  if (!args.pages) { console.error("--pages est obligatoire."); printUsage(); process.exit(2); }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const outDir = args.out ? path.resolve(args.out) : OUT_DIR;

// ── Lecture CSV tolérante ──────────────────────────────────────────────────
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

const normalizeHeader = (value) => value
  .replace(/^\uFEFF/, "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/["']/g, "")
  .replace(/\s+/g, " ")
  .trim();

const ALIASES = {
  page: ["top pages", "pages les plus frequentes", "page", "url", "pages", "adresse"],
  query: ["top queries", "requetes les plus frequentes", "query", "requete", "requetes", "mot cle", "keyword"],
  clicks: ["clicks", "clics", "clic"],
  impressions: ["impressions", "affichages"],
  ctr: ["ctr", "tcg", "taux de clics", "click through rate"],
  position: ["position", "position moyenne", "average position"],
};

function resolveColumns(header, keys) {
  const normalized = header.map(normalizeHeader);
  const out = {};
  for (const key of keys) {
    out[key] = -1;
    for (const alias of ALIASES[key]) {
      const index = normalized.indexOf(alias);
      if (index >= 0) { out[key] = index; break; }
    }
  }
  return out;
}

/** « 1 234 », « 1,234 », « 12,3 », « 0,8 % », « 31.1 » → nombre. */
function parseNumber(raw) {
  const source = String(raw ?? "").replace(/[\s\u00a0\u202f]/g, "");
  // Le signe « % » doit être retenu : « 1,0 % » vaut 0,01, pas 1,0.
  const isPercent = /%$/.test(source);
  let text = source.replace(/%$/, "");
  if (!text) return NaN;
  if (text.includes(",") && text.includes(".")) text = text.replace(/,/g, "");
  else if (text.includes(",")) {
    const parts = text.split(",");
    text = parts.length === 2 && parts[1].length <= 2 ? `${parts[0]}.${parts[1]}` : parts.join("");
  }
  const value = Number(text);
  if (!Number.isFinite(value)) return NaN;
  return isPercent ? value / 100 : value;
}

function readTable(file, keyAlias) {
  const raw = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const firstLine = raw.slice(0, raw.indexOf("\n") >= 0 ? raw.indexOf("\n") : raw.length);
  const delimiter = sniffDelimiter(firstLine);
  const table = parseCsv(raw, delimiter);
  if (table.length < 2) throw new Error(`${file} : CSV vide ou sans ligne de données.`);
  const header = table[0];
  const columns = resolveColumns(header, [keyAlias, "clicks", "impressions", "ctr", "position"]);
  if (columns[keyAlias] < 0) {
    throw new Error(`${file} : colonne « ${keyAlias} » introuvable. En-têtes lus : ${header.join(" | ")}`);
  }
  const rows = [];
  for (const cells of table.slice(1)) {
    const key = (cells[columns[keyAlias]] || "").trim();
    if (!key) continue;
    const impressions = parseNumber(cells[columns.impressions]);
    const clicks = parseNumber(cells[columns.clicks]);
    const position = parseNumber(cells[columns.position]);
    let ctr = parseNumber(cells[columns.ctr]);
    // Certains exports donnent un ratio, d'autres un pourcentage sans signe.
    if (Number.isFinite(ctr) && ctr > 1) ctr /= 100;
    rows.push({
      key,
      clicks: Number.isFinite(clicks) ? clicks : 0,
      impressions: Number.isFinite(impressions) ? impressions : 0,
      position: Number.isFinite(position) ? position : NaN,
      ctr: Number.isFinite(ctr) ? ctr : (impressions > 0 ? clicks / impressions : NaN),
    });
  }
  return { rows, delimiter, header, columns, file };
}

// ── Courbe de CTR ──────────────────────────────────────────────────────────
function loadCurve() {
  if (args.curveFile) {
    const points = JSON.parse(fs.readFileSync(args.curveFile, "utf8"));
    return { label: `courbe fournie (${args.curveFile})`, points };
  }
  const profile = CURVES[args.profile];
  if (!profile) {
    console.error(`Profil inconnu : ${args.profile}. Disponibles : ${Object.keys(CURVES).join(", ")}`);
    process.exit(2);
  }
  return profile;
}

const curve = loadCurve();
const curvePositions = Object.keys(curve.points).map(Number).sort((a, b) => a - b);

/** Interpolation linéaire entre les points connus, plateau au-delà du dernier. */
function expectedCtr(position) {
  if (!Number.isFinite(position) || position <= 0) return NaN;
  if (position <= curvePositions[0]) return curve.points[curvePositions[0]];
  const last = curvePositions[curvePositions.length - 1];
  if (position >= last) return curve.points[last];
  for (let i = 0; i < curvePositions.length - 1; i += 1) {
    const low = curvePositions[i];
    const high = curvePositions[i + 1];
    if (position >= low && position <= high) {
      const ratio = (position - low) / (high - low);
      return curve.points[low] + ratio * (curve.points[high] - curve.points[low]);
    }
  }
  return curve.points[last];
}

function familyOf(url) {
  let pathname = "/";
  try { pathname = new URL(url).pathname; } catch { pathname = url; }
  const parts = pathname.split("/").filter(Boolean);
  const section = parts[1] || "";
  if (section === "tool") return parts.length <= 3 ? "tool/fiche" : `tool/${parts[3]}`;
  if (section === "stacks") return parts.length <= 2 ? "stacks/index" : "stacks";
  if (section === "comparatif") return parts.length <= 2 ? "comparatifs/index" : "comparatif";
  if (section === "guide") return parts.length <= 2 ? "guides/index" : "guide";
  if (section === "category") return "category";
  return section || "home";
}

function assess(row) {
  const expected = expectedCtr(row.position);
  const expectedClicks = Number.isFinite(expected) ? row.impressions * expected : 0;
  const opportunity = Math.max(0, Math.round(expectedClicks - row.clicks));
  const surplus = Math.max(0, Math.round(row.clicks - expectedClicks));
  const ctr = Number.isFinite(row.ctr) ? row.ctr : (row.impressions > 0 ? row.clicks / row.impressions : 0);

  // Pas de zone morte : toute page sous la courbe reçoit une action, et le CRT
  // ne sert qu'à distinguer une priorité haute d'une priorité normale.
  let action = "rien";
  if (row.impressions < args.minImpressions) action = "sous le seuil d'impressions";
  else if (opportunity === 0) action = surplus > 0 ? "protéger (au-dessus de la courbe)" : "rien";
  else if (row.position > args.positionMax) action = "approfondir";
  else action = ctr < args.ctrThreshold ? "réécrire (prioritaire)" : "réécrire";

  return {
    ...row,
    ctr,
    expectedCtr: expected,
    expectedClicks: Math.round(expectedClicks),
    opportunity,
    surplus,
    action,
  };
}

function readOrExit(file, keyAlias) {
  try {
    return readTable(file, keyAlias);
  } catch (error) {
    console.error(String(error?.message || error));
    process.exit(1);
  }
}

// ── Analyse ────────────────────────────────────────────────────────────────
const pagesTable = readOrExit(args.pages, "page");
const pages = pagesTable.rows.map((row) => ({ ...assess(row), family: familyOf(row.key) }));

let queries = [];
let queriesTable = null;
if (args.queries) {
  queriesTable = readOrExit(args.queries, "query");
  queries = queriesTable.rows.map((row) => assess(row));
}

const sum = (rows, field) => rows.reduce((acc, row) => acc + (row[field] || 0), 0);
const weightedPosition = (rows) => {
  const impressions = sum(rows, "impressions");
  if (!impressions) return NaN;
  return rows.reduce((acc, row) => acc + (Number.isFinite(row.position) ? row.position * row.impressions : 0), 0) / impressions;
};

const totals = {
  pages: pages.length,
  clicks: sum(pages, "clicks"),
  impressions: sum(pages, "impressions"),
  ctr: sum(pages, "impressions") ? sum(pages, "clicks") / sum(pages, "impressions") : 0,
  weightedPosition: weightedPosition(pages),
  opportunity: sum(pages, "opportunity"),
  surplus: sum(pages, "surplus"),
};

const byAction = {};
for (const row of pages) byAction[row.action] = (byAction[row.action] || 0) + 1;

const sortByOpportunity = (rows) => [...rows].sort((a, b) => b.opportunity - a.opportunity || b.impressions - a.impressions);
const rewrite = sortByOpportunity(pages.filter((row) => row.action.startsWith("réécrire")));
const deepen = sortByOpportunity(pages.filter((row) => row.action === "approfondir"));
const protect = [...pages].filter((row) => row.action.startsWith("protéger")).sort((a, b) => b.surplus - a.surplus);
const queryOpportunities = sortByOpportunity(queries.filter((row) => row.opportunity > 0));

// Cannibalisation : seulement si un export requête × page est fourni.
let cannibalization = null;
if (args.queryPages) {
  const raw = fs.readFileSync(args.queryPages, "utf8").replace(/^\uFEFF/, "");
  const firstLine = raw.slice(0, raw.indexOf("\n") >= 0 ? raw.indexOf("\n") : raw.length);
  const table = parseCsv(raw, sniffDelimiter(firstLine));
  const header = table[0];
  const columns = resolveColumns(header, ["query", "page", "clicks", "impressions"]);
  if (columns.query < 0 || columns.page < 0) {
    console.error(`${args.queryPages} : colonnes requête et page requises. En-têtes lus : ${header.join(" | ")}`);
    process.exit(1);
  }
  const groups = new Map();
  for (const cells of table.slice(1)) {
    const query = (cells[columns.query] || "").trim();
    const page = (cells[columns.page] || "").trim();
    if (!query || !page) continue;
    if (!groups.has(query)) groups.set(query, []);
    groups.get(query).push({
      page,
      clicks: parseNumber(cells[columns.clicks]) || 0,
      impressions: parseNumber(cells[columns.impressions]) || 0,
    });
  }
  cannibalization = [...groups.entries()]
    .filter(([, pagesForQuery]) => pagesForQuery.length > 1)
    .map(([query, pagesForQuery]) => {
      const ranked = [...pagesForQuery].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
      return {
        query,
        pages: ranked.length,
        clicks: ranked.reduce((acc, row) => acc + row.clicks, 0),
        impressions: ranked.reduce((acc, row) => acc + row.impressions, 0),
        winner: ranked[0].page,
        others: ranked.slice(1).map((row) => row.page),
      };
    })
    .sort((a, b) => b.impressions - a.impressions);
}

// ── Rapport ────────────────────────────────────────────────────────────────
const pct = (value) => `${(value * 100).toFixed(2)} %`;
const line = (row) => ({
  url: row.key,
  family: row.family || familyOf(row.key),
  clicks: Math.round(row.clicks),
  expectedClicks: row.expectedClicks,
  opportunity: row.opportunity,
  surplus: row.surplus,
  impressions: Math.round(row.impressions),
  position: Number.isFinite(row.position) ? Number(row.position.toFixed(1)) : null,
  ctr: Number(row.ctr.toFixed(4)),
  expectedCtr: Number((row.expectedCtr || 0).toFixed(4)),
  action: row.action,
});

const report = {
  generatedAt: new Date().toISOString(),
  inputs: { pages: args.pages, queries: args.queries || null, queryPages: args.queryPages || null },
  settings: {
    profile: args.curveFile ? "custom" : args.profile,
    curveLabel: curve.label,
    minImpressions: args.minImpressions,
    ctrThreshold: args.ctrThreshold,
    rewriteUpTo: args.positionMax,
  },
  totals,
  byAction,
  topRewrite: rewrite.slice(0, args.top).map(line),
  topDeepen: deepen.slice(0, args.top).map(line),
  protect: protect.slice(0, args.top).map(line),
  queryOpportunities: queryOpportunities.slice(0, args.top).map(line),
  cannibalization: cannibalization ? cannibalization.slice(0, args.top) : null,
  allPages: pages.map(line).sort((a, b) => b.opportunity - a.opportunity),
};

fs.mkdirSync(outDir, { recursive: true });
const reportPath = path.join(outDir, "opportunities.json");
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

const md = [];
md.push("# Priorisation des réécritures — Search Console", "");
md.push(`- Export Pages : \`${path.basename(args.pages)}\` — ${pages.length} lignes${queries.length ? ` · Requêtes : ${queries.length} lignes` : ""}.`);
md.push(`- Période et propriété : celles de l'export fourni.`);
md.push(`- Courbe de CTR : **${curve.label}**.`);
md.push(`- Seuils : ≥ ${args.minImpressions} impressions, réécriture jusqu'à la position ${args.positionMax}, priorité haute sous ${pct(args.ctrThreshold)} de CTR.`, "");
md.push("## Totaux", "");
md.push("| Indicateur | Valeur |", "|---|---:|");
md.push(`| Pages avec impressions | ${totals.pages} |`);
md.push(`| Clics | ${Math.round(totals.clicks)} |`);
md.push(`| Impressions | ${Math.round(totals.impressions)} |`);
md.push(`| CTR global | ${pct(totals.ctr)} |`);
md.push(`| Position moyenne pondérée | ${Number.isFinite(totals.weightedPosition) ? totals.weightedPosition.toFixed(1) : "—"} |`);
md.push(`| Manque à gagner cumulé | ${Math.round(totals.opportunity)} clics |`);
md.push(`| Surplus (pages au-dessus de la courbe) | ${Math.round(totals.surplus)} clics |`, "");
md.push("## Répartition des actions", "");
md.push("| Action | Pages |", "|---|---:|");
for (const [action, count] of Object.entries(byAction).sort((a, b) => b[1] - a[1])) md.push(`| ${action} | ${count} |`);

const table = (title, rows, columns) => {
  md.push("", `## ${title}`, "");
  if (!rows.length) { md.push("_Aucune page dans cette catégorie avec les seuils actuels._"); return; }
  md.push(`| ${columns.map((c) => c.label).join(" | ")} |`, `|${columns.map((c) => (c.align === "right" ? "---:" : "---")).join("|")}|`);
  for (const row of rows) md.push(`| ${columns.map((c) => c.value(row)).join(" | ")} |`);
};

table(`Réécrire le title/description (${rewrite.length})`, rewrite.slice(0, args.top), [
  { label: "#", value: (row, index) => index + 1 },
  { label: "URL", value: (row) => row.key },
  { label: "Priorité", value: (row) => (row.action.includes("prioritaire") ? "haute" : "normale") },
  { label: "Pos.", value: (row) => row.position.toFixed(1), align: "right" },
  { label: "Impressions", value: (row) => Math.round(row.impressions), align: "right" },
  { label: "CTR", value: (row) => pct(row.ctr), align: "right" },
  { label: "Attendu", value: (row) => pct(row.expectedCtr), align: "right" },
  { label: "Manque à gagner", value: (row) => `${row.opportunity} clics`, align: "right" },
]);

table(`Approfondir (${deepen.length})`, deepen.slice(0, args.top), [
  { label: "#", value: (row, index) => index + 1 },
  { label: "URL", value: (row) => row.key },
  { label: "Pos.", value: (row) => row.position.toFixed(1), align: "right" },
  { label: "Impressions", value: (row) => Math.round(row.impressions), align: "right" },
  { label: "Clics", value: (row) => Math.round(row.clicks), align: "right" },
  { label: "Manque à gagner", value: (row) => `${row.opportunity} clics`, align: "right" },
]);

table(`Protéger (${protect.length})`, protect.slice(0, args.top), [
  { label: "URL", value: (row) => row.key },
  { label: "Pos.", value: (row) => row.position.toFixed(1), align: "right" },
  { label: "CTR", value: (row) => pct(row.ctr), align: "right" },
  { label: "Attendu", value: (row) => pct(row.expectedCtr), align: "right" },
  { label: "Surplus", value: (row) => `${row.surplus} clics`, align: "right" },
]);

if (queries.length) {
  table(`Requêtes à manque à gagner (${queryOpportunities.length})`, queryOpportunities.slice(0, args.top), [
    { label: "Requête", value: (row) => row.key.replace(/\|/g, "\\|") },
    { label: "Pos.", value: (row) => row.position.toFixed(1), align: "right" },
    { label: "Impressions", value: (row) => Math.round(row.impressions), align: "right" },
    { label: "Clics", value: (row) => Math.round(row.clicks), align: "right" },
    { label: "Manque à gagner", value: (row) => `${row.opportunity} clics`, align: "right" },
  ]);
}

if (cannibalization) {
  md.push("", `## Cannibalisation (${cannibalization.length})`, "");
  if (!cannibalization.length) md.push("_Aucune requête servie par plusieurs pages._");
  else {
    md.push("| Requête | Pages | Impressions | Clics | Page gagnante |", "|---|---:|---:|---:|---|");
    for (const row of cannibalization.slice(0, args.top)) {
      md.push(`| ${row.query.replace(/\|/g, "\\|")} | ${row.pages} | ${Math.round(row.impressions)} | ${Math.round(row.clicks)} | ${row.winner} |`);
    }
  }
} else {
  md.push("", "## Cannibalisation", "", "_Non mesurée : aucun export requête × page fourni. Les exports « Requêtes » et « Pages » ne permettent pas d'attribuer une requête à une URL._");
}

md.push("", "## Limites", "");
md.push("- Le manque à gagner est une **estimation** : il dépend entièrement de la courbe de CTR choisie, et les études publiées divergent (position 1 de 7,1 % à 39,8 %). Il sert à ordonner les pages entre elles, pas à promettre des clics.");
md.push("- Une page non indexée n'apparaît pas dans ces exports : l'absence d'une URL ici ne prouve pas son absence de l'index.");
md.push("- Les exports ne contiennent que les pages et requêtes ayant des impressions, avec 2 à 3 jours de latence.");
md.push("- Le CTR attendu est une moyenne toutes intentions confondues : une requête de marque sur-performe toujours la courbe, une requête informationnelle la sous-performe.");

const markdownPath = path.join(outDir, "opportunities.md");
fs.writeFileSync(markdownPath, `${md.join("\n")}\n`, "utf8");

console.log(JSON.stringify({
  pages: pages.length,
  queries: queries.length,
  totals: {
    clicks: Math.round(totals.clicks),
    impressions: Math.round(totals.impressions),
    ctr: Number(totals.ctr.toFixed(4)),
    weightedPosition: Number.isFinite(totals.weightedPosition) ? Number(totals.weightedPosition.toFixed(1)) : null,
    opportunity: Math.round(totals.opportunity),
  },
  byAction,
  curve: curve.label,
}, null, 2));

const preview = (rows, limit = 8) => rows.slice(0, limit)
  .map((row) => `  ${String(row.opportunity).padStart(5)} clics · pos ${row.position.toFixed(1)} · ${Math.round(row.impressions)} impr. · ${row.key}`)
  .join("\n");

if (rewrite.length) console.log(`\nÀ réécrire (${rewrite.length}) :\n${preview(rewrite)}`);
if (deepen.length) console.log(`\nÀ approfondir (${deepen.length}) :\n${preview(deepen)}`);
if (queries.length && queryOpportunities.length) {
  console.log(`\nRequêtes prioritaires (${queryOpportunities.length}) :\n${queryOpportunities.slice(0, 8).map((row) => `  ${String(row.opportunity).padStart(5)} clics · ${row.key}`).join("\n")}`);
}
if (cannibalization) console.log(`\nCannibalisation : ${cannibalization.length} requête(s) servie(s) par plusieurs pages.`);
console.log(`\nRapport : ${path.relative(process.cwd(), reportPath)}`);
console.log(`Markdown : ${path.relative(process.cwd(), markdownPath)}`);
