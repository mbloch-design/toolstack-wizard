/** fix-asana-v2-decision.mjs
 * Second pass on Asana per user feedback (2026-06-24, round 2): push from
 * "tool fiche" to "purchase decision page" — numeric thresholds, explicit
 * rentable-si/trop-cher-si lists, profile-based recommendations, real cost
 * breakdown by team size, and an early-CTA test flag (auditCtaEarly).
 * All figures below from the official asana.com/pricing page (Starter
 * $10.99/user/mo annual, min 2 users; Advanced $24.99/user/mo annual),
 * verified via WebSearch in this session (2026-06-24) — same source as the
 * first pass, no new pricing claim introduced here.
 */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const tool = tools.find((x) => (x.slug || x.id) === "asana");
if (!tool) throw new Error("asana not found");

tool.auditCtaEarly = true;

tool.verdict.keepIf = [
  "Tu gères au moins 3 projets actifs en parallèle avec une équipe de 4 personnes ou plus",
  "Tu utilises (ou as besoin) de la timeline, des dépendances entre tâches, des règles d'automatisation ou des formulaires de demande",
  "Tu fais du reporting client ou interne chaque semaine et veux éviter une réunion de statut",
];
tool.verdict.avoidIf = [
  "Tu l'utilises seul comme simple liste de tâches — Trello ou Todoist font le même travail pour moins cher",
  "Tu as déjà Notion ou ClickUp bien configuré et n'as pas de raison structurelle de changer",
  "Tu n'utilises jamais les vues timeline ou les rapports de portfolio, seulement les listes de base",
];
tool.verdict.threshold = "Asana vaut le coût pour une équipe de 4+ personnes qui gère plusieurs projets clients avec deadlines, responsables et dépendances. Si tu es solo ou que tu l'utilises comme simple to-do list, reste en gratuit ou passe sur Trello/Notion.";

tool.verdictEn.keepIf = [
  "You run at least 3 active projects in parallel with a team of 4 or more",
  "You use (or need) timeline, task dependencies, automation rules or request forms",
  "You do client or internal reporting every week and want to skip a status meeting",
];
tool.verdictEn.avoidIf = [
  "You use it solo as a simple to-do list — Trello or Todoist do the same job for less",
  "You already have Notion or ClickUp well configured with no structural reason to switch",
  "You never use the timeline views or portfolio reports, only the basic lists",
];
tool.verdictEn.threshold = "Asana is worth it for a 4+ person team running several client projects with deadlines, owners and dependencies. If you're solo or use it as a simple to-do list, stay free or move to Trello/Notion.";

const costNote = "Coût réel (Starter, annuel, 10,99$/utilisateur/mois, min. 2 utilisateurs) : 3 personnes ≈ 396$/an, 5 personnes ≈ 659$/an, 10 personnes ≈ 1 319$/an. En Advanced (24,99$/utilisateur/mois) : 5 personnes ≈ 1 499$/an, 10 personnes ≈ 2 999$/an, 50 personnes ≈ 14 994$/an.";
const costNoteEn = "Real cost (Starter, annual, $10.99/user/month, min. 2 users): 3 people ≈ $396/year, 5 people ≈ $659/year, 10 people ≈ $1,319/year. On Advanced ($24.99/user/month): 5 people ≈ $1,499/year, 10 people ≈ $2,999/year, 50 people ≈ $14,994/year.";

tool.description = tool.description + "\n\n" + costNote;
tool.longDescription = tool.description;
tool.descriptionEn = tool.descriptionEn + "\n\n" + costNoteEn;
tool.longDescriptionEn = tool.descriptionEn;

tool.useCases = [
  "Gérer des projets avec plusieurs vues (liste, Kanban, timeline) selon les préférences de l'équipe",
  "Centraliser les statuts et fichiers de projet pour réduire les échanges Slack",
  "Automatiser des workflows répétitifs sans coder (règles, formulaires)",
  "Profil freelance solo : reste sur le plan gratuit, ou Trello/Notion suffisent — Asana est surdimensionné",
  "Profil studio créatif 2-5 personnes : Asana peut valoir le coup si tu gères plusieurs projets clients en parallèle",
  "Profil équipe produit/dev : Linear ou ClickUp sont souvent plus adaptés (cycles, suivi technique plus rapide)",
  "Profil PME avec reporting régulier : Asana Advanced (dépendances, portfolio) peut se justifier",
  "Profil budget serré : challenge avec ClickUp, Trello ou Notion avant de payer Advanced",
];
tool.useCasesEn = [
  "Manage projects with multiple views (list, Kanban, timeline) based on team preference",
  "Centralize project statuses and files to reduce Slack back-and-forth",
  "Automate repetitive workflows with no coding (rules, forms)",
  "Solo freelancer profile: stay on the free plan, or Trello/Notion are enough — Asana is overkill",
  "2-5 person creative studio profile: Asana can be worth it if you run several client projects in parallel",
  "Product/dev team profile: Linear or ClickUp are often a better fit (cycles, faster technical tracking)",
  "SMB with regular reporting profile: Asana Advanced (dependencies, portfolio) can be justified",
  "Tight budget profile: challenge it with ClickUp, Trello or Notion before paying for Advanced",
];

writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log("Asana v2 (page de décision) mise à jour.");
