/** fix-asana-v4-polish.mjs
 * Editorial polish pass on Asana per user feedback (2026-06-24, round 4):
 * - Remove every em dash (—) from Asana's content, replaced with the
 *   grammatically appropriate comma/colon/period instead.
 * - Differentiate keepIf/avoidIf ("Décision rapide", structural fit:
 *   team vs solo) from profitableIf/tooExpensiveIf ("rentable si / trop
 *   cher si", usage-pattern signals) — they overlapped near-verbatim
 *   before this pass.
 * - useCases was mixing genuine use cases with the profile-based
 *   recommendations I'd added earlier, which are now redundant with the
 *   dedicated ToolProfileRecommendationTable. Strip them back to real,
 *   concise use cases only.
 */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const tool = tools.find((x) => (x.slug || x.id) === "asana");
if (!tool) throw new Error("asana not found");

// --- Em dash removal ---
tool.shortDescription = "Gestion de projet pour équipes avec plusieurs projets clients, deadlines et reporting. Souvent trop structuré pour un freelance solo.";
tool.shortDescriptionEn = "Project management for teams running several client projects, deadlines and reporting. Often overkill for a solo freelancer.";

const descFr = "Asana propose plusieurs vues de travail (listes, tableaux Kanban, timeline, calendrier) que chaque équipe peut adapter à son processus, avec Asana Intelligence qui résume les tâches et suggère des actions directement dans le flux de travail existant.\n\nSon vrai terrain, ce n'est pas le freelance solo qui gère sa propre to-do list : Trello ou Notion suffisent largement et coûtent moins cher. Asana devient rentable à partir du moment où plusieurs personnes dépendent les unes des autres sur plusieurs projets actifs en même temps : une agence avec 5+ comptes clients, une équipe produit qui a besoin de dépendances entre tâches, ou une PME qui veut un reporting consolidé sans réunion de statut hebdomadaire.\n\nLe vrai point de friction, c'est le saut de prix entre Starter (10,99$/mois/utilisateur) et Advanced (24,99$/mois/utilisateur, 2,3x plus cher), et c'est justement dans Advanced que se trouvent les dépendances, les règles d'automatisation, les formulaires et le reporting portfolio dont la plupart des équipes de plus de 10 personnes ont besoin. Pour 50 personnes, ça représente environ 15 000$/an. Si tu restes en Starter avec une équipe qui grandit, tu butes vite sur les limites sans réaliser que le vrai produit est dans le palier supérieur.\n\nCoût réel (Starter, annuel, 10,99$/utilisateur/mois, min. 2 utilisateurs) : 3 personnes ≈ 396$/an, 5 personnes ≈ 659$/an, 10 personnes ≈ 1 319$/an. En Advanced (24,99$/utilisateur/mois) : 5 personnes ≈ 1 499$/an, 10 personnes ≈ 2 999$/an, 50 personnes ≈ 14 994$/an.";
tool.description = descFr;
tool.longDescription = descFr;

const descEn = "Asana offers several work views (lists, Kanban boards, timeline, calendar) that each team can adapt to its process, with Asana Intelligence summarizing tasks and suggesting actions directly within the existing workflow.\n\nIts real territory isn't the solo freelancer managing their own to-do list: Trello or Notion cover that just fine for less money. Asana earns its price once several people depend on each other across several active projects at once: an agency running 5+ client accounts, a product team that needs task dependencies, or an SMB that wants consolidated reporting without a weekly status meeting.\n\nThe real friction point is the price jump from Starter ($10.99/user/month) to Advanced ($24.99/user/month, 2.3x more), and Advanced is exactly where dependencies, automation rules, forms and portfolio reporting live, the features most teams above 10 people actually need. For 50 people, that's roughly $15,000/year. Stay on Starter while the team grows and you hit its limits without realizing the real product is one tier up.\n\nReal cost (Starter, annual, $10.99/user/month, min. 2 users): 3 people ≈ $396/year, 5 people ≈ $659/year, 10 people ≈ $1,319/year. On Advanced ($24.99/user/month): 5 people ≈ $1,499/year, 10 people ≈ $2,999/year, 50 people ≈ $14,994/year.";
tool.descriptionEn = descEn;
tool.longDescriptionEn = descEn;

tool.cons[2] = "Pas de chat ou de docs intégrés : tu auras toujours besoin de Slack et Notion/Google Docs en complément";
tool.consEn[2] = "No built-in chat or docs: you'll still need Slack and Notion/Google Docs alongside it";

tool.seo.idealForFr = "Idéal pour les petites équipes projet, agences et studios qui gèrent plusieurs projets clients en parallèle. Surdimensionné pour un freelance solo qui gère surtout ses propres tâches : Trello, Notion ou Todoist suffisent dans ce cas.";
tool.seo.idealForEn = "Ideal for small project teams, agencies and studios running several client projects in parallel. Overkill for a solo freelancer managing mostly their own tasks: Trello, Notion or Todoist cover that case.";
tool.seo.presentationTitleFr = "Asana : avis, prix et alternatives. Faut-il vraiment le payer ?";
tool.seo.presentationTitleEn = "Asana: reviews, pricing and alternatives. Is it worth paying for?";

tool.pricing_v5.costTableNoteEn = "Indicative prices. Check the official Asana page for your currency, monthly/annual billing and any current promotions. Source: asana.com/pricing.";

// --- Décision rapide (keepIf/avoidIf) vs rentable-si/trop-cher-si:
// keepIf/avoidIf now stays purely structural (team vs solo fit), so it
// stops repeating the usage-pattern signals already covered by
// profitableIf/tooExpensiveIf below it on the page. ---
tool.verdict.keepIf = [
  "Plusieurs personnes travaillent ensemble sur les mêmes projets",
  "Tu as des deadlines, des responsables et des livrables à suivre",
];
tool.verdict.avoidIf = [
  "Tu travailles seul, sans client ni sous-traitant à coordonner",
  "Une simple liste de tâches te suffit déjà",
];
tool.verdictEn.keepIf = [
  "Several people work together on the same projects",
  "You have deadlines, owners and deliverables to track",
];
tool.verdictEn.avoidIf = [
  "You work alone, with no client or subcontractor to coordinate",
  "A simple task list is already enough for you",
];

// --- useCases: drop the profile-based lines (now covered by
// ToolProfileRecommendationTable), keep only genuine, concise use cases. ---
tool.useCases = [
  "Gérer des projets avec plusieurs vues (liste, Kanban, timeline) selon les préférences de l'équipe",
  "Centraliser les statuts et fichiers de projet pour réduire les échanges Slack",
  "Automatiser des workflows répétitifs sans coder (règles, formulaires)",
];
tool.useCasesEn = [
  "Manage projects with multiple views (list, Kanban, timeline) based on team preference",
  "Centralize project statuses and files to reduce Slack back-and-forth",
  "Automate repetitive workflows with no coding (rules, forms)",
];

writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log("Asana v4 (polish) mise à jour.");
