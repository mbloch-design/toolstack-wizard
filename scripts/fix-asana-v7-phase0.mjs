/** fix-asana-v7-phase0.mjs — Phase 0 of the roadmap: safe, Asana-scoped fixes
 * from the multi-expert audit.
 * 0a. Cost table converted from USD to EUR (0.876 rate, same one used all
 *     session) - the rest of the page (hero, sidebar, alternatives table)
 *     is in EUR; the cost table being the only USD block was a real
 *     inconsistency (ClickUp shown at "6€" in one block, "$12" in another).
 * 0b. migrationGuide rewritten for ClickUp instead of Linear - it still
 *     described migrating to Linear after betterAlternative was changed
 *     to ClickUp in an earlier pass.
 * 0d. profitableIf/tooExpensiveIf trimmed from 5 to 4 bullets each, with
 *     varied sentence openers instead of the uniform "Tu as.../Tu
 *     travailles.../Tu utilises..." pattern.
 */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const tool = tools.find((x) => (x.slug || x.id) === "asana");
if (!tool) throw new Error("asana not found");

// 0a. Cost table in EUR.
tool.pricing_v5.costTable = [
  { team: "Solo", plan: "Gratuit / Starter", monthlyUsd: "0-9,6 €", annualUsd: "0-116 €", verdictFr: "OK si usage réel", verdictEn: "OK if actually used" },
  { team: "3 personnes", plan: "Starter", monthlyUsd: "~29 €", annualUsd: "~347 €", verdictFr: "Raisonnable", verdictEn: "Reasonable" },
  { team: "10 personnes", plan: "Starter", monthlyUsd: "~96 €", annualUsd: "~1 156 €", verdictFr: "À challenger", verdictEn: "Worth challenging" },
  { team: "10 personnes", plan: "Advanced", monthlyUsd: "~219 €", annualUsd: "~2 627 €", verdictFr: "Justifié seulement si reporting/automatisations", verdictEn: "Justified only with reporting/automation" },
  { team: "50 personnes", plan: "Advanced", monthlyUsd: "~1 095 €", annualUsd: "~13 134 €", verdictFr: "Décision budget sérieuse", verdictEn: "Serious budget decision" },
];
tool.pricing_v5.costTableNoteFr = "Prix convertis en euros (taux indicatif, ~0,876$ pour 1€) à partir des tarifs officiels en dollars. Engagement annuel : la facturation mensuelle coûte environ 20% plus cher. Source : asana.com/pricing.";
tool.pricing_v5.costTableNoteEn = "Prices converted to euros (indicative rate, ~$0.876 per €1) from the official dollar pricing. Annual commitment: monthly billing costs roughly 20% more. Source: asana.com/pricing.";

// 0b. migrationGuide now matches betterAlternative (ClickUp, not Linear).
tool.migrationGuide = {
  steps: [
    "Exporte tes projets Asana en CSV",
    "Crée tes espaces et listes dans ClickUp",
    "Importe les tâches via l'outil d'import natif ClickUp (compatible Asana)",
    "Recrée les automatisations et champs personnalisés",
  ],
  dataLoss: "Dépendances entre tâches à revérifier après import",
  timeEstimate: "2-4h",
};

// 0d. Trim to 4 bullets, vary openers.
tool.verdict.profitableIf = [
  "Au moins 3 projets actifs en parallèle, avec au moins 3 personnes dessus",
  "Les vues timeline, dépendances ou formulaires servent vraiment, pas juste à cocher des cases",
  "Chaque semaine, tu perds du temps à relancer ou à retrouver une info de projet",
  "Des clients ou ton management attendent un statut clair et régulier",
];
tool.verdict.tooExpensiveIf = [
  "Une simple liste de tâches suffirait",
  "Tu es solo, sans sous-traitant à coordonner",
  "Notion ou ClickUp sont déjà bien configurés chez toi",
  "Slack, Notion et Docs tournent déjà à côté pour que l'équipe fonctionne",
];
tool.verdictEn.profitableIf = [
  "At least 3 active projects in parallel, with at least 3 people on them",
  "Timeline, dependency or form views are actually used, not just there to check a box",
  "Every week, you lose time chasing updates or hunting for project info",
  "Clients or management expect a clear, regular status",
];
tool.verdictEn.tooExpensiveIf = [
  "A simple task list would do",
  "You're solo, with no subcontractor to coordinate",
  "Notion or ClickUp are already well configured for you",
  "Slack, Notion and Docs already run alongside it for the team to work",
];

writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log("Asana v7 (Phase 0 roadmap) mise à jour.");
