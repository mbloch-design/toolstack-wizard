#!/usr/bin/env node
// Insère une fiche soumise dans le catalogue JSON, après contrôles. Aucun modèle requis.
//
//   node scripts/catalog/add-submitted-tool.mjs --slug=exemple [--dofollow] [--replace] [--check]
//
// Lit research/submissions/<slug>/entry.json (gabarit : research/submissions/_gabarit.json),
// contrôle la fiche, l'ajoute (ou la remplace avec --replace) dans src/data/tools_v4.json,
// régénère src/data/tools_index.json et, avec --dofollow, ajoute le domaine à la liste
// blanche de src/lib/externalLink.ts et son test. --check contrôle sans rien écrire.
// Après insertion, supprime research/submissions/<slug>/intake.json.
// Sort en code 1 avec la liste des défauts si un contrôle échoue.

import { readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, ...v] = a.replace(/^--/, "").split("=");
  return [k, v.join("=") || true];
}));
if (!args.slug) {
  console.error("Usage : --slug=exemple [--dofollow] [--replace] [--check]");
  process.exit(2);
}

const V4 = "src/data/tools_v4.json";
const LINKS = "src/lib/externalLink.ts";
const LINKS_TEST = "src/lib/externalLink.test.ts";
const entry = JSON.parse(await readFile(`research/submissions/${args.slug}/entry.json`, "utf8"));
const tools = JSON.parse(await readFile(V4, "utf8"));
const known = new Set(tools.map((t) => t.slug));
const errors = [];
const fail = (msg) => errors.push(msg);

// Structure.
const REQUIRED = ["id", "slug", "name", "category", "shortDescription", "shortDescriptionEn", "description",
  "longDescription", "longDescriptionEn", "pricing", "pricingEn", "pricing_v5", "pricing_v5En", "websiteUrl",
  "pros", "prosEn", "cons", "consEn", "useCases", "useCasesEn", "relevantFor", "relevantForEn", "verdict",
  "verdictEn", "alternatives", "substitution_cluster_v2", "toolTrimRating", "tagline", "seo", "lifecycle"];
for (const k of REQUIRED) {
  const v = entry[k];
  if (v == null || v === "" || (Array.isArray(v) && !v.length)) fail(`champ vide : ${k}`);
}
if (entry.slug !== args.slug || entry.id !== args.slug) fail("id et slug doivent valoir --slug");
if (known.has(args.slug) && !args.replace) fail(`slug déjà au catalogue (ajouter --replace pour remplacer)`);
if (!/^https:\/\//.test(entry.websiteUrl || "")) fail("websiteUrl doit être en https");
for (const k of ["pros", "prosEn", "cons", "consEn", "useCases", "useCasesEn"]) {
  if ((entry[k] || []).length < 3) fail(`${k} : au moins 3 éléments`);
}
for (const v of ["verdict", "verdictEn"]) {
  const d = entry[v] || {};
  if (!d.keepIf?.length || !d.avoidIf?.length || !d.threshold) fail(`${v} : keepIf, avoidIf et threshold requis`);
}
for (const a of entry.alternatives || []) if (!known.has(a)) fail(`alternative inconnue du catalogue : ${a}`);
const plans = entry.pricing_v5?.plans || [];
if (!plans.length) fail("pricing_v5.plans vide");
if (plans.filter((p) => p.isComparePlan).length !== 1) fail("pricing_v5 : exactement un plan isComparePlan");
if (!entry.pricing_v5?.verified_on || !entry.pricing_v5?.official_source_url) fail("pricing_v5 : verified_on et official_source_url requis");
// Un outil gratuit n'a pas de prix à afficher : {price} n'est exigé que s'il existe un prix payant.
if (entry.pricing_v5?.compare_price_monthly_eur > 0) {
  for (const k of ["prixTitleFr", "prixTitleEn"]) if (!entry.seo?.[k]?.includes("{price}")) fail(`seo.${k} doit contenir {price}`);
}
for (const k of ["avisMetaDescriptionFr", "avisMetaDescriptionEn"]) if (!entry.seo?.[k]?.includes("{rating}")) fail(`seo.${k} doit contenir {rating}`);

// Règles éditoriales : aucun montant dans le texte, tutoiement, mots interdits.
const prose = (lang) => {
  const en = lang === "en";
  const v = entry[en ? "verdictEn" : "verdict"] || {};
  return [entry[en ? "shortDescriptionEn" : "shortDescription"], en ? "" : entry.description,
    entry[en ? "longDescriptionEn" : "longDescription"], ...(entry[en ? "prosEn" : "pros"] || []),
    ...(entry[en ? "consEn" : "cons"] || []), ...(entry[en ? "useCasesEn" : "useCases"] || []),
    ...(v.keepIf || []), ...(v.avoidIf || []), v.threshold].filter(Boolean).join("\n");
};
const AMOUNT = /(\d[\d  ,.]*\s?(€|\$|£|EUR|USD|%))|([€$£]\s?\d)/;
for (const lang of ["fr", "en"]) {
  const m = prose(lang).match(AMOUNT);
  if (m) fail(`montant dans le texte ${lang.toUpperCase()} : « ${m[0].trim()} » (les prix vont dans pricing et pricing_v5)`);
}
const fr = prose("fr");
// « rendez-vous » n'est pas du vouvoiement.
const vous = fr.match(/(?<![-\p{L}])(vous|votre|vos)(?![-\p{L}])/iu);
if (vous) fail(`vouvoiement dans le texte FR : « ${vous[0]} » (on tutoie)`);
const BANNED = /\b(solution|robuste|flexible|puissante?s?|intuiti(f|ve)s?|révolutionnaire|game-changer|best-in-class|cliquez ici|en savoir plus)\b/i;
const banned = fr.match(BANNED);
if (banned) fail(`mot interdit dans le texte FR : « ${banned[0]} »`);

if (errors.length) {
  console.error(`${args.slug} : ${errors.length} défaut(s)\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
if (args.check) {
  console.log(`${args.slug} : contrôles OK (--check, rien d'écrit)`);
  process.exit(0);
}

// Écriture.
const next = known.has(args.slug) ? tools.map((t) => (t.slug === args.slug ? entry : t)) : [...tools, entry];
await writeFile(V4, `${JSON.stringify(next, null, 2)}\n`);
execFileSync("node", ["scripts/gen-tools-index.mjs"], { stdio: "inherit" });

if (args.dofollow) {
  const host = new URL(entry.websiteUrl).hostname.replace(/^www\./, "");
  let src = await readFile(LINKS, "utf8");
  if (!src.includes(`"${host}",`)) {
    const marker = src.indexOf("]);", src.indexOf("DOMAINES_EDITORIAUX_DOFOLLOW"));
    src = `${src.slice(0, marker)}  "${host}",\n  "www.${host}",\n${src.slice(marker)}`;
    await writeFile(LINKS, src);
    let test = await readFile(LINKS_TEST, "utf8");
    const anchor = 'describe("relPourLienOutil", () => {\n';
    test = test.replace(anchor, `${anchor}  it.each(["https://${host}/", "https://www.${host}/"])("keeps ${entry.name}'s official link dofollow: %s", (url) => {\n    expect(relPourLienOutil(url, "", url)).toBe("noopener noreferrer");\n  });\n`);
    await writeFile(LINKS_TEST, test);
  }
  console.log(`Lien officiel en dofollow : ${host}`);
} else {
  console.log("Lien officiel en nofollow (règle par défaut).");
}
console.log(`${args.slug} : fiche ${known.has(args.slug) ? "remplacée" : "ajoutée"} (${next.length} outils).`);

// La collecte brute copie le texte du site : elle ne sert qu'à rédiger et ne doit pas rester.
await rm(`research/submissions/${args.slug}/intake.json`, { force: true });
console.log("intake.json supprimé (copie brute du site).");
