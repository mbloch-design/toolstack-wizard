/** fix-gsc-priority-batch.mjs — corrige les 4 opportunités GSC restantes (après Remix) :
 * - dart : titre /alternatives désambiguïsé (le langage Google/Flutter vs l'outil PM "Dart")
 * - itsdart : NOUVELLE fiche (l'outil PM réel que cherchent la plupart des "alternatives to dart")
 * - zoom-pro : titre presentation plus concret (ce que le forfait inclut vraiment)
 * - cargo-site : titre presentation plus concret (créateurs/portfolio, pas juste prix)
 * - linear : titre /prix FR, le site officiel linear.app n'a pas de version FR — vrai angle */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";

const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

// --- 1. Dart (langage) : désambiguïser le titre /alternatives ---
const dart = tools.find((x) => (x.slug || x.id) === "dart");
if (dart) {
  dart.seo = Object.assign({}, dart.seo, {
    altTitleFr: "Alternatives à Dart : le langage Flutter ou l'outil de gestion de projet ? | ToolTrim",
    altTitleEn: "Dart Alternatives: The Flutter Language or the PM Tool? | ToolTrim",
    altMetaDescriptionFr: "Tu cherches une alternative au langage Dart de Google (Flutter) ou à Dart, l'outil de gestion de projet IA ? ToolTrim couvre les deux cas avec les bonnes options.",
    altMetaDescriptionEn: "Looking for an alternative to Google's Dart language (Flutter) or to Dart, the AI project management tool? ToolTrim covers both cases with the right options.",
  });
  console.log("dart: titre /alternatives désambiguïsé");
}

// --- 2. Nouvelle fiche : itsdart (l'outil PM, pas le langage) ---
if (!present.has("itsdart")) {
  tools.push({
    id: "itsdart",
    slug: "itsdart",
    name: "Dart (PM)",
    category: "project-management",
    shortDescription: "Outil de gestion de projet propulsé par l'IA : tâches, docs et roadmap en un seul endroit.",
    shortDescriptionEn: "AI-powered project management tool: tasks, docs and roadmap in one place.",
    pricing: {
      free: "Plan Personal gratuit, jusqu'à 4 utilisateurs, tâches illimitées et exécution de tâches par IA.",
      paid: "Premium à 8$/mois/utilisateur (annuel) ; Business à 12$/mois/utilisateur (annuel) avec SSO et analytics avancées.",
    },
    pricingEn: {
      free: "Free Personal plan, up to 4 users, unlimited tasks and AI task execution.",
      paid: "Premium at $8/user/month (annual); Business at $12/user/month (annual) with SSO and advanced analytics.",
    },
    defaultMonthlyPrice: 8,
    affiliateLink: "https://www.itsdart.com/",
    websiteUrl: "https://www.itsdart.com/",
    logo: "",
    longDescription: "Dart (à ne pas confondre avec le langage de programmation Dart de Google) est un outil de gestion de projet construit autour de l'IA dès le départ : il peut planifier une roadmap, rédiger des tâches depuis une discussion, et même exécuter certaines tâches automatiquement via son intégration ChatGPT native. C'est un concurrent direct de Linear, ClickUp ou Asana, avec un positionnement plus IA-natif que la plupart d'entre eux.\n\nLe plan gratuit (Personal) couvre jusqu'à 4 utilisateurs avec des tâches illimitées, ce qui en fait une option crédible pour une petite équipe ou un freelance qui collabore ponctuellement. Pour une équipe plus large, Premium (8$/mois/utilisateur en annuel) ajoute la planification de roadmap par IA et les intégrations ; Business (12$/mois/utilisateur) ajoute le SSO et des analytics avancées, pour des besoins de sécurité d'entreprise.",
    longDescriptionEn: "Dart (not to be confused with Google's Dart programming language) is a project management tool built around AI from the ground up: it can plan a roadmap, draft tasks from a discussion, and even execute certain tasks automatically via its native ChatGPT integration. It's a direct competitor to Linear, ClickUp or Asana, with a more AI-native positioning than most of them.\n\nThe free (Personal) plan covers up to 4 users with unlimited tasks, making it a credible option for a small team or a freelancer who collaborates occasionally. For a larger team, Premium ($8/user/month annual) adds AI roadmap planning and integrations; Business ($12/user/month) adds SSO and advanced analytics for enterprise security needs.",
    verdict: {
      keepIf: [
        "Tu veux un outil de gestion de projet où l'IA planifie et exécute, pas juste assiste",
        "Ton équipe fait moins de 4 personnes : le plan gratuit couvre déjà beaucoup",
      ],
      avoidIf: [
        "Ton équipe utilise déjà Linear, ClickUp ou Asana et n'a pas de raison concrète de migrer",
        "Tu as besoin d'un écosystème d'intégrations très large et mature : les plus gros outils ont plus de connecteurs",
      ],
      threshold: "Pertinent pour une petite équipe qui veut une IA vraiment intégrée à la gestion de tâches, pas juste un chatbot à côté. Pour une migration depuis un outil déjà en place, pèse le coût de transition.",
    },
    verdictEn: {
      keepIf: [
        "You want a project management tool where AI plans and executes, not just assists",
        "Your team is under 4 people: the free plan already covers a lot",
      ],
      avoidIf: [
        "Your team already uses Linear, ClickUp or Asana with no concrete reason to migrate",
        "You need a very large, mature integration ecosystem: bigger tools have more connectors",
      ],
      threshold: "Worth it for a small team that wants AI genuinely built into task management, not just a chatbot bolted on. For a migration from an existing tool, weigh the switching cost.",
    },
    pros: [
      "IA native : planification de roadmap et exécution de tâches, pas juste un assistant",
      "Plan gratuit généreux jusqu'à 4 utilisateurs",
      "Intégration ChatGPT directe",
      "Interface rapide, pensée pour les équipes tech",
    ],
    prosEn: [
      "AI-native: roadmap planning and task execution, not just an assistant",
      "Generous free plan up to 4 users",
      "Direct ChatGPT integration",
      "Fast interface, built for tech teams",
    ],
    cons: [
      "Écosystème d'intégrations plus jeune que Linear ou Asana",
      "Moins connu, donc moins de ressources/tutoriels communautaires",
      "Le SSO et les analytics avancées nécessitent le plan Business (12$/mois)",
    ],
    consEn: [
      "Younger integration ecosystem than Linear or Asana",
      "Less known, so fewer community resources/tutorials",
      "SSO and advanced analytics require the Business plan ($12/month)",
    ],
    useCases: [
      "Planifier une roadmap produit assistée par IA",
      "Générer des tâches automatiquement depuis une discussion ou un brief",
      "Gérer des projets d'équipe avec un plan gratuit jusqu'à 4 personnes",
      "Remplacer un assistant IA externe par une gestion de tâches qui exécute directement",
    ],
    useCasesEn: [
      "Plan an AI-assisted product roadmap",
      "Automatically generate tasks from a discussion or brief",
      "Manage team projects with a free plan up to 4 people",
      "Replace an external AI assistant with task management that executes directly",
    ],
    covers: ["project-management", "operations-workflow"],
    relevantFor: ["freelance", "createur-contenu"],
    personas: ["freelance"],
    soloRelevance: "high",
    teamRelevance: "high",
    seo: {
      metaDescription: "Dart (itsdart.com) en 2026 : l'outil de gestion de projet propulsé par l'IA. Prix réel (gratuit jusqu'à 4 users, 8$/mois ensuite) et alternatives. Le verdict ToolTrim.",
    },
    alternatives: ["linear", "clickup", "asana"],
    articles: [],
    freeAlternative: null,
    tool_type: "metier",
    substitutable: true,
    host_app: null,
    bundle_parent: null,
    verticals: [],
    functional_needs: ["project-management"],
    ia_use_case: "gestion-projet",
    betterAlternative: null,
    migrationGuide: null,
    downgradePlan: null,
    prescription_quality: "question",
    prescription_output: null,
    prescription_block_reasons: [],
    prescription_context_questions: [],
    pricing_v5: {
      cautions: [],
      verified_on: "2026-06-20",
      source_domain: "itsdart.com",
      usage_sensitive: false,
      compare_plan_kind: "subscription",
      compare_plan_name: "Premium (annuel)",
      price_reliability: "high",
      location_sensitive: false,
      official_source_url: "https://www.itsdart.com/pricing",
      verification_status: "third_party_observed",
      compare_price_monthly_eur: 8,
    },
    substitution_cluster_v2: "project-management",
  });
  console.log("itsdart: nouvelle fiche créée");
}

// --- 3. Zoom Pro : titre presentation plus concret (ce que le forfait inclut) ---
const zoomPro = tools.find((x) => (x.slug || x.id) === "zoom-pro");
if (zoomPro) {
  zoomPro.seo = Object.assign({}, zoomPro.seo, {
    presentationTitleFr: "Zoom Pro : Réunions 30h, 100 Participants — Prix 2026 | ToolTrim",
    presentationTitleEn: "Zoom Pro: 30-Hour Meetings, 100 Participants — Price 2026 | ToolTrim",
  });
  console.log("zoom-pro: titre presentation précisé");
}

// --- 4. Cargo Site : titre presentation plus concret ---
const cargoSite = tools.find((x) => (x.slug || x.id) === "cargo-site");
if (cargoSite) {
  cargoSite.seo = Object.assign({}, cargoSite.seo, {
    presentationTitleFr: "Cargo Site : Portfolios Créatifs pour Designers — Prix 2026 | ToolTrim",
    presentationTitleEn: "Cargo Site: Creative Portfolios for Designers — Price 2026 | ToolTrim",
  });
  console.log("cargo-site: titre presentation précisé");
}

// --- 5. Linear (FR) : linear.app n'a pas de version française, vrai angle ---
const linear = tools.find((x) => (x.slug || x.id) === "linear");
if (linear) {
  linear.seo = Object.assign({}, linear.seo, {
    prixTitleFr: "Linear Prix 2026 : 9€/mois — Tarifs en Français | ToolTrim",
  });
  console.log("linear: titre /prix FR précisé");
}

const out = JSON.stringify(tools, null, 2) + "\n";
JSON.parse(out);
writeFileSync(PATH, out);
console.log("OK — JSON valide");
