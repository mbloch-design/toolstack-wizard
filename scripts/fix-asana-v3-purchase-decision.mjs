/** fix-asana-v3-purchase-decision.mjs
 * Third pass on Asana per user brief (2026-06-24): exact verdict copy,
 * "rentable si / trop cher si" cards, real cost table by team size, a
 * profile-recommendation table, and SEO title/description tuned for
 * purchase-decision intent. New structured content is nested inside
 * fields that already sync to Supabase as whole JSONB blobs (verdict,
 * pricing_v5, seo) — confirmed via sync-json-to-supabase.mjs FIELD_MAP —
 * so it survives the round-trip without needing new DB columns.
 * Pricing source: official asana.com/pricing (Starter $10.99/user/mo
 * annual, min 2 users; Advanced $24.99/user/mo annual), same figures
 * verified via WebSearch earlier this session, reused here.
 */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const tool = tools.find((x) => (x.slug || x.id) === "asana");
if (!tool) throw new Error("asana not found");

// 1) Verdict — exact requested phrasing.
tool.verdict.threshold = "Asana est un bon choix pour une équipe qui gère plusieurs projets clients avec deadlines, responsabilités et reporting. Pour un freelance solo ou une simple to-do list, c'est souvent trop structuré : Trello, Notion ou ClickUp peuvent suffire.";
tool.verdictEn.threshold = "Asana is a good fit for a team running several client projects with deadlines, ownership and reporting. For a solo freelancer or a simple to-do list, it's often overengineered: Trello, Notion or ClickUp can be enough.";

// keepIf/avoidIf stay as the short "Décision rapide" 3-block summary —
// kept distinct from the new profitableIf/tooExpensiveIf lists below so
// the same reasoning isn't repeated twice on the page (point 7 of the brief).
tool.verdict.keepIf = [
  "Ton équipe coordonne plusieurs projets clients avec deadlines et responsables clairs",
  "Tu utilises (ou as besoin) de la timeline, des dépendances ou des formulaires de demande",
];
tool.verdict.avoidIf = [
  "Tu es solo sans sous-traitants ni clients multiples — Trello ou Notion suffisent",
  "Tu n'utilises jamais les vues avancées, seulement une liste de tâches",
];
tool.verdictEn.keepIf = [
  "Your team coordinates several client projects with deadlines and clear ownership",
  "You use (or need) timeline, dependencies or request forms",
];
tool.verdictEn.avoidIf = [
  "You're solo with no subcontractors or multiple clients — Trello or Notion are enough",
  "You never use the advanced views, just a task list",
];

// 2) Profitable-if / too-expensive-if — new section, distinct content from
// keepIf/avoidIf above (concrete usage thresholds, not the same reasoning).
tool.verdict.profitableIf = [
  "Tu as au moins 3 projets actifs en parallèle",
  "Tu travailles avec au moins 3 personnes",
  "Tu utilises vraiment timeline, dépendances, formulaires, règles ou reporting",
  "Tu perds du temps chaque semaine à relancer, coordonner ou retrouver les infos projet",
  "Tu as besoin de statuts clairs pour des clients ou du management",
];
tool.verdict.tooExpensiveIf = [
  "Tu l'utilises comme simple liste de tâches",
  "Tu es solo sans sous-traitants",
  "Tu as déjà Notion ou ClickUp bien configuré",
  "Tu n'utilises jamais les vues avancées",
  "Tu dois ajouter Slack + Notion + Docs à côté pour que l'équipe fonctionne",
];
tool.verdictEn.profitableIf = [
  "You have at least 3 active projects in parallel",
  "You work with at least 3 people",
  "You actually use timeline, dependencies, forms, rules or reporting",
  "You lose time every week chasing updates, coordinating or hunting for project info",
  "You need clear status reports for clients or management",
];
tool.verdictEn.tooExpensiveIf = [
  "You use it as a simple task list",
  "You're solo with no subcontractors",
  "You already have Notion or ClickUp well configured",
  "You never use the advanced views",
  "You have to bolt on Slack + Notion + Docs for the team to actually work",
];

// 5) Profile recommendation table.
tool.verdict.profileTable = [
  { profile: "Freelance solo", recommendation: "Gratuit, Trello ou Notion suffisent souvent" },
  { profile: "Studio créatif 2-5 personnes", recommendation: "Asana peut valoir le coup si plusieurs projets clients" },
  { profile: "Équipe produit/dev", recommendation: "Linear ou ClickUp peuvent être plus adaptés" },
  { profile: "PME avec reporting", recommendation: "Asana Advanced peut se justifier" },
  { profile: "Budget serré", recommendation: "Challenger avec ClickUp, Trello ou Notion" },
];
tool.verdictEn.profileTable = [
  { profile: "Solo freelancer", recommendation: "Free, Trello or Notion are often enough" },
  { profile: "2-5 person creative studio", recommendation: "Asana can be worth it with several client projects" },
  { profile: "Product/dev team", recommendation: "Linear or ClickUp may fit better" },
  { profile: "SMB with reporting needs", recommendation: "Asana Advanced can be justified" },
  { profile: "Tight budget", recommendation: "Challenge it with ClickUp, Trello or Notion" },
];

// 4) Real cost table by team size — official asana.com/pricing figures.
tool.pricing_v5.costTable = [
  { team: "Solo", plan: "Gratuit / Starter", monthlyUsd: "0-11 $", annualUsd: "0-132 $", verdictFr: "OK si usage réel", verdictEn: "OK if actually used" },
  { team: "3 personnes", plan: "Starter", monthlyUsd: "~33 $", annualUsd: "~396 $", verdictFr: "Raisonnable", verdictEn: "Reasonable" },
  { team: "10 personnes", plan: "Starter", monthlyUsd: "~110 $", annualUsd: "~1 320 $", verdictFr: "À challenger", verdictEn: "Worth challenging" },
  { team: "10 personnes", plan: "Advanced", monthlyUsd: "~250 $", annualUsd: "~3 000 $", verdictFr: "Justifié seulement si reporting/automatisations", verdictEn: "Justified only with reporting/automation" },
  { team: "50 personnes", plan: "Advanced", monthlyUsd: "~1 250 $", annualUsd: "~15 000 $", verdictFr: "Décision budget sérieuse", verdictEn: "Serious budget decision" },
];
tool.pricing_v5.costTableNoteFr = "Prix indicatifs, à vérifier sur la page officielle Asana selon devise, facturation mensuelle/annuelle et promotions éventuelles. Source : asana.com/pricing.";
tool.pricing_v5.costTableNoteEn = "Indicative prices — check the official Asana page for your currency, monthly/annual billing and any current promotions. Source: asana.com/pricing.";

// 9) SEO — title override (existing mechanism) + shortDescription tuned so
// buildToolMetaDesc() (vite.config.ts) produces a decision-oriented snippet
// without adding a new override field outside the existing system.
tool.seo.presentationTitleFr = "Asana : avis, prix et alternatives — faut-il vraiment le payer ?";
tool.seo.presentationTitleEn = "Asana: reviews, pricing and alternatives — is it worth paying for?";
tool.shortDescription = "Gestion de projet pour équipes avec plusieurs projets clients, deadlines et reporting — souvent trop structuré pour un freelance solo.";
tool.shortDescriptionEn = "Project management for teams running several client projects, deadlines and reporting — often overkill for a solo freelancer.";

writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log("Asana v3 (page de décision d'achat) mise à jour.");
