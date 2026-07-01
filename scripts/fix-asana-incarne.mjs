/** fix-asana-incarne.mjs
 * Editorial deepening of the Asana fiche per user feedback (2026-06-24):
 * - pricing_v5 was sourced from a forum thread (forum.asana.com) and disagreed
 *   with pricing.paid and defaultMonthlyPrice (9.52€ vs 10.99$ vs 9.63€). Now
 *   sourced from the official asana.com/pricing page, verified via WebSearch
 *   today — Starter $10.99/mo annual, Advanced $24.99/mo annual, unchanged
 *   since the last verification in this session.
 * - soloRelevance was "high", driving "Idéal pour freelances et indépendants"
 *   on a tool whose real fit is small project teams/agencies/studios, not
 *   solo freelancers (a solo user is well served by Trello/Notion/Todoist).
 *   Downgraded to "medium" and idealForFr/idealForEn set explicitly.
 * - betterAlternative pointed to Linear (a dev/product-team tool) while the
 *   comparison table (alternatives[]) listed ClickUp/Monday/Trello — Linear
 *   appeared as THE top pick in the sidebar then vanished from the table.
 *   Replaced with ClickUp, which is consistent with the table and a more
 *   defensible "better for most visitors" pick (same breadth, ClickUp
 *   Business $12/user/mo vs Asana Advanced $24.99/user/mo, verified via
 *   WebSearch). Linear's dev/product fit is now called out explicitly in
 *   useCases/description instead of being the single top recommendation.
 * - verdict.keepIf/avoidIf rewritten to be decision-grade rather than
 *   generic, with the "rentable si" thresholds folded into the long
 *   description since adding a dedicated UI section is out of scope here.
 * - aiAngle.augmentFr/En given a concrete usage threshold instead of staying
 *   abstract.
 */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const tool = tools.find((x) => (x.slug || x.id) === "asana");
if (!tool) throw new Error("asana not found");

tool.soloRelevance = "medium";
tool.teamRelevance = "high";

tool.idealForFr = "Idéal pour les petites équipes projet, agences et studios qui gèrent plusieurs projets clients en parallèle. Surdimensionné pour un freelance solo qui gère surtout ses propres tâches — Trello, Notion ou Todoist suffisent dans ce cas.";
tool.idealForEn = "Ideal for small project teams, agencies and studios running several client projects in parallel. Overkill for a solo freelancer managing mostly their own tasks — Trello, Notion or Todoist cover that case.";

tool.description = "Asana propose plusieurs vues de travail (listes, tableaux Kanban, timeline, calendrier) que chaque équipe peut adapter à son processus, avec Asana Intelligence qui résume les tâches et suggère des actions directement dans le flux de travail existant.\n\nSon vrai terrain, ce n'est pas le freelance solo qui gère sa propre to-do list — pour ça, Trello ou Notion suffisent largement et coûtent moins cher. Asana devient rentable à partir du moment où plusieurs personnes dépendent les unes des autres sur plusieurs projets actifs en même temps : une agence avec 5+ comptes clients, une équipe produit qui a besoin de dépendances entre tâches, ou une PME qui veut un reporting consolidé sans réunion de statut hebdomadaire.\n\nLe vrai point de friction, c'est le saut de prix entre Starter (10,99$/mois/utilisateur) et Advanced (24,99$/mois/utilisateur, 2,3x plus cher) — et c'est justement dans Advanced que se trouvent les dépendances, les règles d'automatisation, les formulaires et le reporting portfolio dont la plupart des équipes de plus de 10 personnes ont besoin. Pour 50 personnes, ça représente environ 15 000$/an. Si tu restes en Starter avec une équipe qui grandit, tu butes vite sur les limites sans réaliser que le vrai produit est dans le palier supérieur.";
tool.longDescription = tool.description;
tool.descriptionEn = "Asana offers several work views (lists, Kanban boards, timeline, calendar) that each team can adapt to its process, with Asana Intelligence summarizing tasks and suggesting actions directly within the existing workflow.\n\nIts real territory isn't the solo freelancer managing their own to-do list — Trello or Notion cover that just fine for less money. Asana earns its price once several people depend on each other across several active projects at once: an agency running 5+ client accounts, a product team that needs task dependencies, or an SMB that wants consolidated reporting without a weekly status meeting.\n\nThe real friction point is the price jump from Starter ($10.99/user/month) to Advanced ($24.99/user/month, 2.3x more) — and Advanced is exactly where dependencies, automation rules, forms and portfolio reporting live, the features most teams above 10 people actually need. For 50 people, that's roughly $15,000/year. Stay on Starter while the team grows and you hit its limits without realizing the real product is one tier up.";
tool.longDescriptionEn = tool.descriptionEn;

tool.verdict = {
  keepIf: [
    "Ton équipe travaille déjà dans Asana et utilise (ou a besoin) de la timeline, des dépendances entre tâches, des règles d'automatisation ou des formulaires de demande",
    "Tu gères plusieurs projets clients ou produits en parallèle et as besoin d'un reporting consolidé sans réunion de statut",
  ],
  avoidIf: [
    "Tu t'en sers comme simple liste de tâches en solo — Trello ou Todoist font le même travail pour moins cher",
    "Ton budget ne supporte pas le saut vers Advanced une fois les limites de Starter atteintes (2,3x le prix, ~15 000$/an pour 50 personnes)",
  ],
  threshold: "Garde Asana si ton équipe l'utilise déjà en profondeur (timeline, dépendances, reporting portfolio) ou si tu gères plusieurs projets clients en parallèle. Challenge-le si tu t'en sers comme simple to-do list solo : Trello, Notion ou Todoist couvrent le même besoin pour moins cher.",
};
tool.verdictEn = {
  keepIf: [
    "Your team already works in Asana and uses (or needs) timeline, task dependencies, automation rules or request forms",
    "You manage several client or product projects in parallel and need consolidated reporting without a status meeting",
  ],
  avoidIf: [
    "You use it as a solo to-do list — Trello or Todoist do the same job for less",
    "Your budget can't absorb the jump to Advanced once Starter's limits are hit (2.3x the price, ~$15,000/year for 50 people)",
  ],
  threshold: "Keep Asana if your team already uses it in depth (timeline, dependencies, portfolio reporting) or you run several client projects in parallel. Challenge it if you use it as a solo to-do list: Trello, Notion or Todoist cover the same need for less.",
};

tool.alternatives = ["clickup", "monday", "trello", "notion"];

tool.betterAlternative = {
  tool: "clickup",
  reason: "ClickUp regroupe tâches, docs, chat et automatisations dans un seul outil. Pour une couverture fonctionnelle comparable, ClickUp Business (12$/mois/utilisateur, annuel) coûte environ moitié moins qu'Asana Advanced (24,99$/mois/utilisateur).",
  saving: 13,
  performanceGain: "ClickUp Business (12$/mois/utilisateur) couvre l'essentiel d'Asana Advanced (24,99$/mois/utilisateur) pour environ moitié moins cher, avec docs et chat en plus.",
};

tool.useCases = [
  "Gérer des projets avec plusieurs vues (liste, Kanban, timeline) selon les préférences de l'équipe",
  "Centraliser les statuts et fichiers de projet pour réduire les échanges Slack",
  "Automatiser des workflows répétitifs sans coder (règles, formulaires)",
  "Pour une équipe produit/dev qui veut aussi des cycles (sprints) et un suivi technique plus rapide, Linear est l'alternative pertinente — pas Asana ni ClickUp",
];
tool.useCasesEn = [
  "Manage projects with multiple views (list, Kanban, timeline) based on team preference",
  "Centralize project statuses and files to reduce Slack back-and-forth",
  "Automate repetitive workflows with no coding (rules, forms)",
  "For a product/dev team that also wants cycles (sprints) and faster technical tracking, Linear is the relevant alternative — not Asana or ClickUp",
];

tool.pricing_v5 = {
  cautions: ["confirm_if_paid_plan_is_really_used"],
  verified_on: "2026-06-24",
  source_domain: "asana.com",
  usage_sensitive: false,
  compare_plan_kind: "seat",
  compare_plan_name: "Starter",
  price_reliability: "high",
  location_sensitive: false,
  official_source_url: "https://asana.com/pricing",
  verification_status: "official_explicit",
  compare_price_monthly_eur: 9.63,
};

tool.seo = Object.assign({}, tool.seo, {
  aiAngle: {
    stance: "augmente",
    augmentFr: "Asana a ajouté un assistant IA pour résumer des projets, rédiger des statuts et suggérer des sous-tâches à partir d'un objectif. Concrètement : si tu gères 10+ projets clients actifs, ça peut faire gagner plusieurs heures par semaine sur la rédaction de statuts hebdo. Si tu es solo avec une vingtaine de tâches, ce gain ne justifie pas de payer Advanced pour y accéder.",
    augmentEn: "Asana added an AI assistant to summarize projects, draft status updates and suggest subtasks from a goal. Concretely: if you're running 10+ active client projects, this can save several hours a week on weekly status writing. If you're solo with about twenty tasks, that gain doesn't justify paying for Advanced to access it.",
    replaceFr: "Remplacer Asana par une IA ? Non : la coordination d'équipe sur des projets avec dépendances, échéances et charge de travail reste un besoin structurel. Verdict : l'IA documente et résume, elle ne remplace pas la gestion de projet.",
    replaceEn: "Replace Asana with an AI? No: team coordination on projects with dependencies, deadlines and workload remains a structural need. Verdict: AI documents and summarizes, it doesn't replace project management.",
    aiTools: ["chatgpt"],
  },
});

writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log("Asana fiche mise à jour.");
