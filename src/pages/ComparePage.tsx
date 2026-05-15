import { useParams, Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools } from "@/hooks/useSupabaseData";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";
import type { Tool } from "@/data/types";
import { FEATURED_COMPARISONS as COMPARISONS } from "@/data/comparisons";

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function findTool(tools: Tool[], idOrSlug: string): Tool | undefined {
  return tools.find((t) => t.id === idOrSlug || t.slug === idOrSlug);
}
function getPrice(tool: Tool): string {
  const v5 = tool.pricing_v5?.compare_price_monthly_eur;
  if (v5 != null && v5 > 0) return `${v5}€/mois`;
  if (tool.defaultMonthlyPrice > 0) return `${tool.defaultMonthlyPrice}€/mois`;
  return "Gratuit";
}
function getPriceNum(tool: Tool): number {
  return tool.pricing_v5?.compare_price_monthly_eur || tool.defaultMonthlyPrice || 0;
}

/* ─── Editorial content types ────────────────────────────────────────────── */
interface CompareTableRow {
  criterion: string; criterionEn: string;
  toolA: string; toolAEn: string;
  toolB: string; toolBEn: string;
  winner: "A" | "B" | "tie"; verdictLabel: string; verdictLabelEn: string;
}
interface CompareProfile {
  persona: string; personaEn: string;
  choice: string; reason: string; reasonEn: string;
  limit: string; limitEn: string;
}
interface CompareFaqItem { q: string; qEn: string; a: string; aEn: string; }
interface CompareAlt { slug: string; name: string; reason: string; reasonEn: string; price?: string; }
interface CompareDecisionRow {
  context: string; contextEn: string;
  choice: string; choiceEn: string;
}

interface CompareEditorialContent {
  /* ── Hero framing ── */
  framing: string; framingEn: string;
  verdictShort: string; verdictShortEn: string;
  /* ── Quick verdict (VS module + verdict section) ── */
  quickVerdictA: string; quickVerdictAEn: string;
  quickVerdictB: string; quickVerdictBEn: string;
  quickVerdictAvoid: string; quickVerdictAvoidEn: string;
  /* ── Tool overview (new) ── */
  toolADesc: string; toolADescEn: string;
  toolAUseCases: string[]; toolAUseCasesEn: string[];
  toolBDesc: string; toolBDescEn: string;
  toolBUseCases: string[]; toolBUseCasesEn: string[];
  /* ── Comparison table ── */
  tableRows: CompareTableRow[];
  /* ── Pros + cons ── */
  prosA: string[]; prosAEn: string[];
  limitsA: string[]; limitsAEn: string[];
  prosB: string[]; prosBEn: string[];
  limitsB: string[]; limitsBEn: string[];
  /* ── Decision rows (new) ── */
  decisionRows: CompareDecisionRow[];
  /* ── Profiles ── */
  profiles: CompareProfile[];
  /* ── Pricing ── */
  pricingFraming: string; pricingFramingEn: string;
  pricingToolANotes: string; pricingToolANotesEn: string;
  pricingToolBNotes: string; pricingToolBNotesEn: string;
  pricingReco: string; pricingRecoEn: string;
  /* ── Alternatives + FAQ ── */
  alternatives: CompareAlt[];
  faq: CompareFaqItem[];
}

/* ─── Notion vs Airtable editorial content ───────────────────────────────── */
const NOTION_VS_AIRTABLE: CompareEditorialContent = {
  framing:
    "Deux outils puissants, deux logiques très différentes : Notion organise l'information, Airtable structure les données.",
  framingEn:
    "Two powerful tools, two very different logics: Notion organizes information, Airtable structures data.",

  verdictShort:
    "Choisis Notion si tu veux centraliser notes, docs, projets et contenus. Choisis Airtable si tu dois gérer des bases de données, des vues, des statuts ou des workflows plus structurés.",
  verdictShortEn:
    "Choose Notion if you want to centralize notes, docs, projects and content. Choose Airtable if you need to manage databases, views, statuses or more structured workflows.",

  quickVerdictA:
    "Tu veux un espace flexible pour écrire, organiser, documenter et gérer des projets légers.",
  quickVerdictAEn:
    "You want a flexible space to write, organize, document and manage lightweight projects.",
  quickVerdictB:
    "Tu veux structurer des données, créer des vues, filtrer, automatiser et piloter des workflows.",
  quickVerdictBEn:
    "You want to structure data, create views, filter, automate and drive workflows.",
  quickVerdictAvoid:
    "Tu cherches un outil simple pour une seule tâche : les deux peuvent devenir trop lourds si le besoin est mal cadré.",
  quickVerdictAvoidEn:
    "You are looking for a simple single-task tool: both can become too heavy if the need is poorly scoped.",

  /* ── Tool overview ── */
  toolADesc:
    "Notion sert à organiser l'information : notes, documents, projets, contenus et bases simples. C'est un espace flexible qui centralise tout ce qu'une équipe ou un individu a besoin de savoir.",
  toolADescEn:
    "Notion is for organizing information: notes, documents, projects, content and simple databases. It's a flexible space that centralizes everything a team or individual needs to know.",
  toolAUseCases: [
    "Documentation et wiki interne",
    "Notes et organisation personnelle",
    "Gestion de projets légère",
    "Calendrier éditorial et contenus",
    "Briefs et livrables clients",
  ],
  toolAUseCasesEn: [
    "Documentation and internal wiki",
    "Notes and personal organization",
    "Lightweight project management",
    "Editorial calendar and content",
    "Client briefs and deliverables",
  ],
  toolBDesc:
    "Airtable sert à structurer des données : bases, vues filtrées, statuts, automatisations et workflows opérationnels. C'est un outil plus puissant que Notion pour gérer des volumes de données ou des process complexes.",
  toolBDescEn:
    "Airtable is for structuring data: databases, filtered views, statuses, automations and operational workflows. It's more powerful than Notion for managing data volumes or complex processes.",
  toolBUseCases: [
    "Bases de données structurées",
    "Vues filtrées et kanban",
    "Suivi opérationnel et statuts",
    "Automatisations de process",
    "Reporting et pipelines",
  ],
  toolBUseCasesEn: [
    "Structured databases",
    "Filtered views and kanban",
    "Operational tracking and statuses",
    "Process automations",
    "Reporting and pipelines",
  ],

  tableRows: [
    { criterion: "Organisation personnelle", criterionEn: "Personal organization",
      toolA: "Excellent", toolAEn: "Excellent",
      toolB: "Possible, mais limité", toolBEn: "Possible, but limited",
      winner: "A", verdictLabel: "Notion", verdictLabelEn: "Notion" },
    { criterion: "Documentation", criterionEn: "Documentation",
      toolA: "Très fort", toolAEn: "Very strong",
      toolB: "Possible, moins naturel", toolBEn: "Possible, less natural",
      winner: "A", verdictLabel: "Notion", verdictLabelEn: "Notion" },
    { criterion: "Gestion de projet légère", criterionEn: "Lightweight project mgmt",
      toolA: "Très bon", toolAEn: "Very good",
      toolB: "Bon", toolBEn: "Good",
      winner: "A", verdictLabel: "Notion", verdictLabelEn: "Notion" },
    { criterion: "Base de données structurée", criterionEn: "Structured database",
      toolA: "Moyen", toolAEn: "Average",
      toolB: "Excellent", toolBEn: "Excellent",
      winner: "B", verdictLabel: "Airtable", verdictLabelEn: "Airtable" },
    { criterion: "Automatisations", criterionEn: "Automations",
      toolA: "Limitées", toolAEn: "Limited",
      toolB: "Puissantes", toolBEn: "Powerful",
      winner: "B", verdictLabel: "Airtable", verdictLabelEn: "Airtable" },
    { criterion: "Collaboration équipe", criterionEn: "Team collaboration",
      toolA: "Bon", toolAEn: "Good",
      toolB: "Très bon", toolBEn: "Very good",
      winner: "B", verdictLabel: "Airtable", verdictLabelEn: "Airtable" },
    { criterion: "Templates disponibles", criterionEn: "Templates",
      toolA: "Très riche", toolAEn: "Very rich",
      toolB: "Bon", toolBEn: "Good",
      winner: "A", verdictLabel: "Notion", verdictLabelEn: "Notion" },
    { criterion: "Prise en main", criterionEn: "Learning curve",
      toolA: "Modérée", toolAEn: "Moderate",
      toolB: "Complexe", toolBEn: "Complex",
      winner: "A", verdictLabel: "Notion", verdictLabelEn: "Notion" },
    { criterion: "Scalabilité des données", criterionEn: "Data scalability",
      toolA: "Limitée", toolAEn: "Limited",
      toolB: "Bonne", toolBEn: "Good",
      winner: "B", verdictLabel: "Airtable", verdictLabelEn: "Airtable" },
    { criterion: "Budget solo / gratuit", criterionEn: "Solo / free budget",
      toolA: "Plan gratuit généreux", toolAEn: "Generous free plan",
      toolB: "Limites rapides", toolBEn: "Quick limitations",
      winner: "A", verdictLabel: "Notion", verdictLabelEn: "Notion" },
  ],

  /* ── Pros ── */
  prosA: [
    "Flexible et adaptable à presque tous les usages",
    "Excellent pour écrire, documenter et organiser des contenus",
    "Prise en main accessible avec de nombreux templates",
    "Plan gratuit généreux pour un usage solo ou une petite équipe",
  ],
  prosAEn: [
    "Flexible and adaptable to almost any use case",
    "Excellent for writing, documenting and organizing content",
    "Accessible onboarding with many templates",
    "Generous free plan for solo or small team use",
  ],
  prosB: [
    "Structure de données robuste avec liens entre tables",
    "Vues multiples puissantes : kanban, grille, galerie, formulaire",
    "Automatisations natives efficaces sur les plans payants",
    "Meilleur pour des workflows opérationnels à plusieurs",
  ],
  prosBEn: [
    "Robust data structure with table links",
    "Powerful multiple views: kanban, grid, gallery, form",
    "Effective native automations on paid plans",
    "Better for multi-person operational workflows",
  ],

  /* ── Limits ── */
  limitsA: [
    "Peut devenir un fourre-tout sans structure éditoriale claire",
    "Bases de données moins puissantes qu'un vrai outil de données",
    "Automatisations limitées selon le plan",
    "Risque de sur-documenter et de perdre du temps à organiser",
  ],
  limitsAEn: [
    "Can become a catch-all without clear editorial structure",
    "Databases less powerful than a dedicated data tool",
    "Automations limited depending on the plan",
    "Risk of over-documenting and spending time organizing",
  ],
  limitsB: [
    "Peut être trop structuré pour un usage simple",
    "Courbe d'apprentissage plus élevée que Notion",
    "Coût qui grimpe vite avec les workflows avancés",
    "Moins naturel pour écrire, documenter ou naviguer dans du texte",
  ],
  limitsBEn: [
    "Can be overly structured for simple use cases",
    "Steeper learning curve than Notion",
    "Costs escalate quickly with advanced workflows",
    "Less natural for writing, documenting or navigating text",
  ],

  /* ── Decision rows ── */
  decisionRows: [
    {
      context: "Ton besoin principal est d'écrire, documenter ou organiser de l'information",
      contextEn: "Your primary need is to write, document or organize information",
      choice: "Notion", choiceEn: "Notion",
    },
    {
      context: "Tu dois suivre des données, des statuts, des opérations ou des pipelines",
      contextEn: "You need to track data, statuses, operations or pipelines",
      choice: "Airtable", choiceEn: "Airtable",
    },
    {
      context: "Ton équipe a besoin de vues filtrées, formulaires et automatisations",
      contextEn: "Your team needs filtered views, forms and automations",
      choice: "Airtable", choiceEn: "Airtable",
    },
    {
      context: "Tu veux centraliser notes, idées, projets et contenus en un seul espace",
      contextEn: "You want to centralize notes, ideas, projects and content in one space",
      choice: "Notion", choiceEn: "Notion",
    },
    {
      context: "Tu cherches un outil simple pour une seule tâche ponctuelle",
      contextEn: "You need a simple tool for a single specific task",
      choice: "Aucun des deux — cherche une alternative plus légère",
      choiceEn: "Neither — look for a lighter alternative",
    },
  ],

  profiles: [
    { persona: "Freelance créatif", personaEn: "Creative freelancer",
      choice: "Notion",
      reason: "Plus simple pour organiser contenus, notes, briefs, projets et livrables sans créer une architecture trop lourde.",
      reasonEn: "Simpler for organizing content, notes, briefs, projects and deliverables without creating overly heavy architecture.",
      limit: "Les bases de données Notion suffisent pour des listes simples, mais pas pour des workflows complexes.",
      limitEn: "Notion databases are fine for simple lists, but not for complex workflows." },
    { persona: "Consultant", personaEn: "Consultant",
      choice: "Notion",
      reason: "Gestion de mission, notes, docs et suivi client sans complexité excessive.",
      reasonEn: "Engagement management, notes, docs and client tracking without excessive complexity.",
      limit: "Dès que le nombre de clients et missions augmente, Airtable devient plus adapté pour le suivi structuré.",
      limitEn: "As clients and engagements grow, Airtable becomes more suitable for structured tracking." },
    { persona: "Ops / COO", personaEn: "Ops / COO",
      choice: "Airtable",
      reason: "Plus solide pour suivre des données, construire des vues, gérer des statuts et structurer des process.",
      reasonEn: "More robust for tracking data, building views, managing statuses and structuring processes.",
      limit: "Airtable monte vite en coût dès qu'on ajoute des collaborateurs ou des automatisations avancées.",
      limitEn: "Airtable costs escalate quickly when adding collaborators or advanced automations." },
    { persona: "Équipe produit", personaEn: "Product team",
      choice: "Airtable",
      reason: "Roadmap, tickets, vues kanban et données structurées pour piloter un produit en équipe.",
      reasonEn: "Roadmap, tickets, kanban views and structured data to manage a product as a team.",
      limit: "Pour la documentation technique et les specs, Notion reste plus adapté en parallèle.",
      limitEn: "For technical documentation and specs, Notion remains more suitable in parallel." },
    { persona: "Créateur de contenu", personaEn: "Content creator",
      choice: "Notion",
      reason: "Backlog éditorial, calendrier, recyclage et base de contenus centralisée.",
      reasonEn: "Editorial backlog, calendar, repurposing and centralized content base.",
      limit: "Pour gérer des commandes, des livrables multiples ou un suivi client structuré, Airtable prend le relais.",
      limitEn: "For managing orders, multiple deliverables or structured client tracking, Airtable takes over." },
    { persona: "Petite agence", personaEn: "Small agency",
      choice: "Airtable",
      reason: "Suivi clients, projets, statuts et reporting pour plusieurs personnes simultanément.",
      reasonEn: "Client tracking, projects, statuses and reporting for multiple people simultaneously.",
      limit: "Le coût par siège peut devenir élevé rapidement — vérifier le plan Team avant de s'engager.",
      limitEn: "Per-seat cost can rise quickly — check the Team plan before committing." },
  ],

  pricingFraming:
    "Notion peut être plus accessible si tu restes sur un usage personnel ou une petite équipe. Airtable peut devenir plus cher dès que les besoins de collaboration, d'automatisation ou de volume augmentent.",
  pricingFramingEn:
    "Notion can be more accessible if you stay on personal or small team use. Airtable can get expensive once collaboration, automation or volume needs grow.",

  pricingToolANotes:
    "Plan gratuit généreux pour usage personnel. Plan Plus à **12€/mois/membre**, Business à **18€/mois/membre**. Automatisations limitées sur le plan gratuit.",
  pricingToolANotesEn:
    "Generous free plan for personal use. Plus plan at **€12/month/member**, Business at **€18/month/member**. Automations limited on free plan.",

  pricingToolBNotes:
    "Plan gratuit limité rapidement (5 éditeurs, 1 000 enregistrements). Team à **20€/mois/siège**, Business à **45€/mois/siège**. Automatisations et vues avancées sur plans payants.",
  pricingToolBNotesEn:
    "Free plan hits limits quickly (5 editors, 1,000 records). Team at **€20/month/seat**, Business at **€45/month/seat**. Advanced automations and views on paid plans.",

  pricingReco:
    "Pour un solo ou une petite équipe ≤ 3 personnes : Notion est moins cher. Au-delà, comparer selon les usages réels.",
  pricingRecoEn:
    "For solo or small team ≤ 3 people: Notion is cheaper. Beyond that, compare based on actual use.",

  alternatives: [
    { slug: "coda", name: "Coda", reason: "Entre document et base de données, souvent bon compromis entre les deux.", reasonEn: "Between document and database, often a good compromise between the two." },
    { slug: "clickup", name: "ClickUp", reason: "Plus orienté gestion de projet, avec vue tâches, sprints et reporting.", reasonEn: "More project-management oriented, with task view, sprints and reporting.", price: "Gratuit / 7€+/mois" },
    { slug: "google-sheets", name: "Google Sheets", reason: "Plus simple et gratuit pour des bases de données légères sans apprentissage.", reasonEn: "Simpler and free for lightweight databases without a learning curve.", price: "Gratuit" },
    { slug: "baserow", name: "Baserow", reason: "Alternative open-source orientée base de données, sans les coûts d'Airtable.", reasonEn: "Open-source database-focused alternative without Airtable's costs.", price: "Gratuit / 5€+/mois" },
    { slug: "trello", name: "Trello", reason: "Si le besoin est uniquement visuel et simple, Trello est plus léger.", reasonEn: "If the need is purely visual and simple, Trello is lighter.", price: "Gratuit / 5€+/mois" },
  ],

  faq: [
    { q: "Notion peut-il remplacer Airtable ?",
      qEn: "Can Notion replace Airtable?",
      a: "Oui, pour des besoins légers. Non, si tu dois gérer des données complexes, plusieurs vues filtrées et des automatisations avancées. Les bases de données Notion sont moins puissantes qu'Airtable dès que le volume ou la complexité augmente.",
      aEn: "Yes, for lightweight needs. No, if you need to manage complex data, multiple filtered views and advanced automations. Notion databases are less powerful than Airtable as volume or complexity grows." },
    { q: "Airtable est-il trop complexe pour un freelance ?",
      qEn: "Is Airtable too complex for a freelancer?",
      a: "Pour un freelance avec des besoins simples, oui. Airtable est mieux adapté dès que tu gères des données structurées, des statuts ou plusieurs projets en parallèle. Pour un usage solo simple, Notion ou même Google Sheets suffisent.",
      aEn: "For a freelancer with simple needs, yes. Airtable is better suited when you manage structured data, statuses or multiple parallel projects. For simple solo use, Notion or even Google Sheets are enough." },
    { q: "Lequel choisir pour une base client ?",
      qEn: "Which to choose for a client database?",
      a: "Airtable. Ses vues, filtres et liens entre tables le rendent bien plus adapté pour gérer des contacts, statuts, historiques et pipelines commerciaux.",
      aEn: "Airtable. Its views, filters and table links make it much more suited for managing contacts, statuses, histories and sales pipelines." },
    { q: "Lequel choisir pour écrire et documenter ?",
      qEn: "Which to choose for writing and documentation?",
      a: "Notion. L'éditeur est plus naturel, les docs plus lisibles, et la navigation dans l'information plus fluide. Airtable n'est pas conçu pour la documentation texte.",
      aEn: "Notion. The editor is more natural, documents are more readable, and navigating information is smoother. Airtable is not designed for text documentation." },
    { q: "Lequel est le plus économique ?",
      qEn: "Which is more economical?",
      a: "Notion sur le plan gratuit ou solo. Airtable devient plus cher rapidement dès que tu ajoutes des membres ou des automatisations. Pour une équipe de plus de 3 personnes, comparer les plans payants selon les usages réels.",
      aEn: "Notion on the free or solo plan. Airtable gets more expensive quickly once you add members or automations. For teams over 3 people, compare paid plans based on actual usage." },
  ],
};

/* ─── Editorial content registry ─────────────────────────────────────────── */
const EDITORIAL_CONTENT: Record<string, CompareEditorialContent> = {
  "notion-vs-airtable": NOTION_VS_AIRTABLE,
};

/* ─── Auto-generate fallback content from tool data ─────────────────────── */
function buildFallbackContent(toolA: Tool, toolB: Tool, lang: "fr" | "en"): CompareEditorialContent {
  const priceA = getPriceNum(toolA);
  const priceB = getPriceNum(toolB);
  const aFerme = toolA.prescription_quality === "ferme";
  const bFerme = toolB.prescription_quality === "ferme";

  const keepsA = toolA.verdict?.keepIf || [];
  const keepsB = toolB.verdict?.keepIf || [];

  return {
    framing: `${toolA.name} et ${toolB.name} : deux approches différentes pour des besoins proches.`,
    framingEn: `${toolA.name} and ${toolB.name}: two different approaches for similar needs.`,
    verdictShort: keepsA[0] && keepsB[0]
      ? `Choisis ${toolA.name} si ${keepsA[0].toLowerCase()}. Choisis ${toolB.name} si ${keepsB[0].toLowerCase()}.`
      : `Le choix dépend de ton usage principal.`,
    verdictShortEn: keepsA[0] && keepsB[0]
      ? `Choose ${toolA.name} if ${keepsA[0].toLowerCase()}. Choose ${toolB.name} if ${keepsB[0].toLowerCase()}.`
      : `The choice depends on your primary use case.`,
    quickVerdictA: keepsA.slice(0, 2).join(". ") || `Tu veux utiliser ${toolA.name} comme outil principal.`,
    quickVerdictAEn: (toolA.verdictEn?.keepIf || keepsA).slice(0, 2).join(". ") || `You want to use ${toolA.name} as your main tool.`,
    quickVerdictB: keepsB.slice(0, 2).join(". ") || `Tu veux utiliser ${toolB.name} comme outil principal.`,
    quickVerdictBEn: (toolB.verdictEn?.keepIf || keepsB).slice(0, 2).join(". ") || `You want to use ${toolB.name} as your main tool.`,
    quickVerdictAvoid: `Les deux outils ont des limites — choisis selon ton usage, pas selon les features.`,
    quickVerdictAvoidEn: `Both tools have limitations — choose based on your use case, not feature lists.`,

    toolADesc: toolA.shortDescription || `${toolA.name} est un outil conçu pour ${(toolA.verdict?.keepIf?.[0] || "optimiser votre productivité").toLowerCase()}.`,
    toolADescEn: toolA.shortDescriptionEn || `${toolA.name} is a tool designed for ${(toolA.verdictEn?.keepIf?.[0] || "boosting your productivity").toLowerCase()}.`,
    toolAUseCases: (toolA.useCases || toolA.covers || []).slice(0, 5).map(String),
    toolAUseCasesEn: (toolA.useCases || toolA.covers || []).slice(0, 5).map(String),
    toolBDesc: toolB.shortDescription || `${toolB.name} est un outil conçu pour ${(toolB.verdict?.keepIf?.[0] || "optimiser votre productivité").toLowerCase()}.`,
    toolBDescEn: toolB.shortDescriptionEn || `${toolB.name} is a tool designed for ${(toolB.verdictEn?.keepIf?.[0] || "boosting your productivity").toLowerCase()}.`,
    toolBUseCases: (toolB.useCases || toolB.covers || []).slice(0, 5).map(String),
    toolBUseCasesEn: (toolB.useCases || toolB.covers || []).slice(0, 5).map(String),

    tableRows: [
      { criterion: "Prise en main", criterionEn: "Ease of use",
        toolA: aFerme ? "Bonne" : "Correcte", toolAEn: aFerme ? "Good" : "Fair",
        toolB: bFerme ? "Bonne" : "Correcte", toolBEn: bFerme ? "Good" : "Fair",
        winner: aFerme && !bFerme ? "A" : bFerme && !aFerme ? "B" : "tie",
        verdictLabel: aFerme && !bFerme ? toolA.name : bFerme && !aFerme ? toolB.name : "Égalité",
        verdictLabelEn: aFerme && !bFerme ? toolA.name : bFerme && !aFerme ? toolB.name : "Tie" },
      { criterion: "Prix de départ", criterionEn: "Starting price",
        toolA: priceA === 0 ? "Gratuit" : `${priceA}€/mois`,
        toolAEn: priceA === 0 ? "Free" : `€${priceA}/mo`,
        toolB: priceB === 0 ? "Gratuit" : `${priceB}€/mois`,
        toolBEn: priceB === 0 ? "Free" : `€${priceB}/mo`,
        winner: priceA <= priceB ? "A" : "B",
        verdictLabel: priceA <= priceB ? toolA.name : toolB.name,
        verdictLabelEn: priceA <= priceB ? toolA.name : toolB.name },
    ],

    prosA: (toolA.pros || []).slice(0, 4).map(String),
    prosAEn: (toolA.pros || []).slice(0, 4).map(String),
    limitsA: (toolA.cons || []).slice(0, 4).map(String),
    limitsAEn: (toolA.cons || []).slice(0, 4).map(String),
    prosB: (toolB.pros || []).slice(0, 4).map(String),
    prosBEn: (toolB.pros || []).slice(0, 4).map(String),
    limitsB: (toolB.cons || []).slice(0, 4).map(String),
    limitsBEn: (toolB.cons || []).slice(0, 4).map(String),

    decisionRows: [
      {
        context: `Tu veux utiliser ${toolA.name} comme outil principal`,
        contextEn: `You want to use ${toolA.name} as your main tool`,
        choice: toolA.name, choiceEn: toolA.name,
      },
      {
        context: `Tu veux utiliser ${toolB.name} comme outil principal`,
        contextEn: `You want to use ${toolB.name} as your main tool`,
        choice: toolB.name, choiceEn: toolB.name,
      },
      {
        context: `Ton budget est limité`,
        contextEn: `Your budget is limited`,
        choice: priceA <= priceB ? toolA.name : toolB.name,
        choiceEn: priceA <= priceB ? toolA.name : toolB.name,
      },
    ],

    profiles: [
      { persona: "Solo / Freelance", personaEn: "Solo / Freelancer",
        choice: aFerme ? toolA.name : toolB.name,
        reason: keepsA[0] || `${toolA.name} convient mieux pour un usage solo.`,
        reasonEn: (toolA.verdictEn?.keepIf?.[0]) || `${toolA.name} suits solo use better.`,
        limit: (toolA.verdict?.avoidIf?.[0]) || "À vérifier selon ton usage exact.",
        limitEn: (toolA.verdictEn?.avoidIf?.[0]) || "Check based on your exact use case." },
    ],

    pricingFraming: `${toolA.name} et ${toolB.name} ont des modèles de prix différents. Vérifiez les plans officiels avant de décider.`,
    pricingFramingEn: `${toolA.name} and ${toolB.name} have different pricing models. Check official plans before deciding.`,
    pricingToolANotes: priceA === 0 ? "Plan gratuit disponible." : `À partir de **${priceA}€/mois**.`,
    pricingToolANotesEn: priceA === 0 ? "Free plan available." : `From **€${priceA}/month**.`,
    pricingToolBNotes: priceB === 0 ? "Plan gratuit disponible." : `À partir de **${priceB}€/mois**.`,
    pricingToolBNotesEn: priceB === 0 ? "Free plan available." : `From **€${priceB}/month**.`,
    pricingReco: `Comparer les plans payants selon vos besoins réels.`,
    pricingRecoEn: `Compare paid plans based on your actual needs.`,
    alternatives: [],
    faq: [
      { q: `${toolA.name} ou ${toolB.name} — lequel est moins cher ?`,
        qEn: `${toolA.name} or ${toolB.name} — which is cheaper?`,
        a: `${toolA.name} coûte ${getPrice(toolA)} et ${toolB.name} coûte ${getPrice(toolB)}.`,
        aEn: `${toolA.name} costs ${getPrice(toolA)} and ${toolB.name} costs ${getPrice(toolB)}.` },
      { q: `${toolA.name} vs ${toolB.name} — lequel choisir ?`,
        qEn: `${toolA.name} vs ${toolB.name} — which to choose?`,
        a: `${keepsA[0] ? `Prends ${toolA.name} si ${keepsA[0].toLowerCase()}. ` : ""}${keepsB[0] ? `Prends ${toolB.name} si ${keepsB[0].toLowerCase()}.` : ""}`,
        aEn: `${keepsA[0] ? `Choose ${toolA.name} if ${keepsA[0].toLowerCase()}. ` : ""}${keepsB[0] ? `Choose ${toolB.name} if ${keepsB[0].toLowerCase()}.` : ""}` },
    ],
  };
}

/* ─── Simple prose renderer (bold via **text**) ──────────────────────────── */
function PricingNote({ text }: { text: string }) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <span>
      {parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i} style={{ color: "#222222", fontWeight: 600 }}>{part}</strong> : part
      )}
    </span>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
const ComparePage = () => {
  const { slugPair } = useParams<{ slugPair: string }>();
  const { lang, t, prefix } = useLang();
  const { tools, loading } = useTools();

  const parsedPair = useMemo(() => {
    if (!slugPair) return null;
    const featured = COMPARISONS.find((c) => c.slugPair === slugPair);
    if (featured) return { idA: featured.toolA, idB: featured.toolB };
    const parts = slugPair.split("-vs-");
    if (parts.length === 2) return { idA: parts[0], idB: parts[1] };
    return null;
  }, [slugPair]);

  const toolA = useMemo(() => parsedPair ? findTool(tools, parsedPair.idA) : undefined, [tools, parsedPair]);
  const toolB = useMemo(() => parsedPair ? findTool(tools, parsedPair.idB) : undefined, [tools, parsedPair]);

  useEffect(() => {
    if (!toolA || !toolB) return;
    const year = new Date().getFullYear();
    const title = lang === "fr"
      ? `${toolA.name} vs ${toolB.name} ${year} — comparatif, prix et verdict | ToolTrim`
      : `${toolA.name} vs ${toolB.name} ${year} — comparison, pricing & verdict | ToolTrim`;
    const desc = lang === "fr"
      ? `${toolA.name} ou ${toolB.name} ? Comparatif complet : logiques différentes, profils adaptés, prix réels et verdict ToolTrim. Décide en 5 minutes.`
      : `${toolA.name} or ${toolB.name}? Full comparison: different logics, profiles, real pricing and ToolTrim verdict. Decide in 5 minutes.`;
    const url = `${SEO_BASE}/${lang}/comparatif/${slugPair}`;
    setSeoTags({ title, description: desc, url, locale: lang === "fr" ? "fr_FR" : "en_US" });
    setHreflang(`/${lang}/comparatif/${slugPair}`);
    setJsonLd("compare-jsonld", {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description: desc,
      url,
      author: { "@type": "Organization", name: "ToolTrim", url: SEO_BASE },
      publisher: { "@type": "Organization", name: "ToolTrim", url: SEO_BASE },
      datePublished: "2026-03-13",
      inLanguage: lang,
    });
    return () => cleanupSeo(["compare-jsonld"]);
  }, [toolA, toolB, lang, slugPair]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #DADAD4", borderTopColor: "#222222", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!parsedPair || !toolA || !toolB) {
    return (
      <div style={{ maxWidth: 600, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-ui)", fontSize: 15, color: "#6F6F68", marginBottom: 16 }}>
          {t("Comparatif non trouvé.", "Comparison not found.")}
        </p>
        <Link to={`${prefix}/comparatifs`} style={{ fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 600, color: "#222222", textDecoration: "underline" }}>
          {t("Voir tous les comparatifs", "See all comparisons")}
        </Link>
      </div>
    );
  }

  const content = EDITORIAL_CONTENT[slugPair ?? ""] ?? buildFallbackContent(toolA, toolB, lang);

  const framing = lang === "fr" ? content.framing : content.framingEn;
  const verdictShort = lang === "fr" ? content.verdictShort : content.verdictShortEn;

  // Find alternative tools from the loaded tools list
  const altTools = content.alternatives.map((alt) => ({
    ...alt,
    tool: tools.find((t) => t.slug === alt.slug || t.id === alt.slug),
  }));

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="cp-hero">
        <div className="cp-hero-inner">

          {/* Left col */}
          <div>
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, fontFamily: "var(--font-ui)", fontSize: 13, color: "#6F6F68" }}>
              <Link to={`${prefix}/comparatifs`} style={{ color: "#9A9A92", textDecoration: "none", transition: "color 140ms" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#222222"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#9A9A92"; }}>
                {t("Comparatifs", "Comparisons")}
              </Link>
              <span style={{ color: "#DADAD4" }}>/</span>
              <span style={{ color: "#222222" }}>{toolA.name} vs {toolB.name}</span>
            </nav>

            {/* Eyebrow */}
            <span className="cp-eyebrow">Comparatif</span>

            {/* H1 */}
            <h1 style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(4rem, 7vw, 7rem)",
              fontWeight: 600, letterSpacing: "-0.06em",
              lineHeight: 0.94, color: "#222222",
              margin: "0 0 24px",
            }}>
              {toolA.name}<br />vs {toolB.name}.
            </h1>

            {/* Framing */}
            <p style={{
              fontFamily: "var(--font-ui)", fontSize: 21,
              lineHeight: 1.42, color: "#6F6F68",
              maxWidth: 820, margin: "0 0 20px",
              letterSpacing: "-0.02em",
            }}>
              {framing}
            </p>

            {/* Verdict short */}
            <p style={{
              fontFamily: "var(--font-ui)", fontSize: 18,
              lineHeight: 1.5, color: "#222222",
              maxWidth: 860, letterSpacing: "-0.015em",
            }}>
              {verdictShort}
            </p>
          </div>

          {/* Right col — VS module */}
          <div className="cp-vs-module">
            <div className="cp-vs-row">
              <div className="cp-vs-logo"><ToolLogo tool={toolA} size={24} /></div>
              <span className="cp-vs-name">{toolA.name}</span>
              <span style={{ marginLeft: "auto", fontFamily: "var(--font-ui)", fontSize: 12, color: "#6F6F68" }}>
                {getPrice(toolA)}
              </span>
            </div>
            <div className="cp-vs-sep">vs</div>
            <div className="cp-vs-row">
              <div className="cp-vs-logo"><ToolLogo tool={toolB} size={24} /></div>
              <span className="cp-vs-name">{toolB.name}</span>
              <span style={{ marginLeft: "auto", fontFamily: "var(--font-ui)", fontSize: 12, color: "#6F6F68" }}>
                {getPrice(toolB)}
              </span>
            </div>

            {/* Quick verdict items */}
            <div className="cp-vs-verdict-block">
              <div className="cp-vs-verdict-item">
                <p className="cp-vs-verdict-label">{toolA.name} {t("si", "if")}</p>
                <p className="cp-vs-verdict-text">
                  {lang === "fr" ? content.quickVerdictA : content.quickVerdictAEn}
                </p>
              </div>
              <div className="cp-vs-verdict-item">
                <p className="cp-vs-verdict-label">{toolB.name} {t("si", "if")}</p>
                <p className="cp-vs-verdict-text">
                  {lang === "fr" ? content.quickVerdictB : content.quickVerdictBEn}
                </p>
              </div>
            </div>

            {/* Links to tool pages */}
            <div style={{ display: "flex", gap: 8, marginTop: 16, paddingTop: 16, borderTop: "1px solid #E7E7E0" }}>
              {[toolA, toolB].map((tool) => (
                <Link key={tool.id} to={`${prefix}/tool/${tool.slug}`} style={{
                  flex: 1, display: "flex", justifyContent: "center", alignItems: "center",
                  height: 34, border: "1px solid #DADAD4", borderRadius: 6,
                  fontFamily: "var(--font-ui)", fontSize: 12, fontWeight: 500,
                  color: "#6F6F68", textDecoration: "none", transition: "border-color 140ms, color 140ms",
                }}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#222222"; el.style.color = "#222222"; }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#DADAD4"; el.style.color = "#6F6F68"; }}
                >
                  {t("Fiche", "Review")} {tool.name}
                </Link>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── Subnav ─────────────────────────────────────────────────────────── */}
      <nav className="cp-subnav" aria-label={t("Sections", "Sections")}>
        <div className="cp-subnav-inner">
          {[
            { href: "#verdict",      label: t("Verdict", "Verdict") },
            { href: "#outils",       label: t("Ce que font les outils", "What they do") },
            { href: "#comparaison",  label: t("Comparaison", "Comparison") },
            { href: "#avantages",    label: t("Avantages", "Pros & cons") },
            { href: "#profils",      label: t("Profils", "Profiles") },
            { href: "#prix",         label: t("Prix", "Pricing") },
            { href: "#faq",          label: "FAQ" },
          ].map((item) => (
            <a key={item.href} href={item.href} className="cp-subnav-link">{item.label}</a>
          ))}
        </div>
      </nav>

      {/* ── Verdict rapide ─────────────────────────────────────────────────── */}
      <section id="verdict" className="cp-section scroll-mt-20">
        <div className="cp-container">
          <span className="cp-eyebrow">{t("Verdict ToolTrim", "ToolTrim verdict")}</span>
          <p className="cp-title">{t("Le choix rapide.", "The quick choice.")}</p>
          <div className="cp-verdict-grid">
            <div className="cp-verdict-col">
              <p className="cp-verdict-label">{t("Prends", "Take")} {toolA.name} {t("si…", "if…")}</p>
              <p className="cp-verdict-text">
                {lang === "fr" ? content.quickVerdictA : content.quickVerdictAEn}
              </p>
            </div>
            <div className="cp-verdict-col">
              <p className="cp-verdict-label">{t("Prends", "Take")} {toolB.name} {t("si…", "if…")}</p>
              <p className="cp-verdict-text">
                {lang === "fr" ? content.quickVerdictB : content.quickVerdictBEn}
              </p>
            </div>
            <div className="cp-verdict-col">
              <p className="cp-verdict-label">{t("Évite les deux si…", "Avoid both if…")}</p>
              <p className="cp-verdict-text">
                {lang === "fr" ? content.quickVerdictAvoid : content.quickVerdictAvoidEn}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ce que fait chaque outil ────────────────────────────────────────── */}
      <section id="outils" className="cp-section scroll-mt-20">
        <div className="cp-container">
          <span className="cp-eyebrow">{t("Rôles distincts", "Distinct roles")}</span>
          <p className="cp-title">{t("Ce que fait chaque outil.", "What each tool does.")}</p>
          <div className="cp-overview-grid">

            {/* Tool A card */}
            <div className="cp-overview-card">
              <div className="cp-overview-logo-row">
                <div className="cp-overview-logo"><ToolLogo tool={toolA} size={28} /></div>
                <span className="cp-overview-tool-name">{toolA.name}</span>
              </div>
              <p className="cp-overview-desc">
                {lang === "fr" ? content.toolADesc : content.toolADescEn}
              </p>
              <ul className="cp-overview-list">
                {(lang === "fr" ? content.toolAUseCases : content.toolAUseCasesEn).map((item, i) => (
                  <li key={i} className="cp-overview-item">{item}</li>
                ))}
              </ul>
            </div>

            {/* Tool B card */}
            <div className="cp-overview-card">
              <div className="cp-overview-logo-row">
                <div className="cp-overview-logo"><ToolLogo tool={toolB} size={28} /></div>
                <span className="cp-overview-tool-name">{toolB.name}</span>
              </div>
              <p className="cp-overview-desc">
                {lang === "fr" ? content.toolBDesc : content.toolBDescEn}
              </p>
              <ul className="cp-overview-list">
                {(lang === "fr" ? content.toolBUseCases : content.toolBUseCasesEn).map((item, i) => (
                  <li key={i} className="cp-overview-item">{item}</li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ── Tableau comparatif ─────────────────────────────────────────────── */}
      <section id="comparaison" className="cp-section scroll-mt-20">
        <div className="cp-container">
          <span className="cp-eyebrow">{t("Tableau comparatif", "Comparison table")}</span>
          <p className="cp-title">{t("Comparer selon le vrai usage.", "Compare based on real use.")}</p>
          <div className="cp-table">
            <div className="cp-table-head">
              <span className="cp-table-head-cell">{t("Critère", "Criterion")}</span>
              <span className="cp-table-head-cell">{toolA.name}</span>
              <span className="cp-table-head-cell">{toolB.name}</span>
              <span className="cp-table-head-cell">{t("Verdict", "Verdict")}</span>
            </div>
            {content.tableRows.map((row) => (
              <div key={row.criterion} className="cp-table-row">
                <span className="cp-table-cell" data-label="">
                  {lang === "fr" ? row.criterion : row.criterionEn}
                </span>
                <span className={`cp-table-cell${row.winner === "A" ? " cp-table-cell--win" : ""}`} data-label={toolA.name}>
                  {lang === "fr" ? row.toolA : row.toolAEn}
                </span>
                <span className={`cp-table-cell${row.winner === "B" ? " cp-table-cell--win" : ""}`} data-label={toolB.name}>
                  {lang === "fr" ? row.toolB : row.toolBEn}
                </span>
                <span className="cp-table-cell cp-table-verdict" data-label={t("Verdict", "Verdict")}>
                  {lang === "fr" ? row.verdictLabel : row.verdictLabelEn}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Avantages et limites ───────────────────────────────────────────── */}
      <section id="avantages" className="cp-section scroll-mt-20">
        <div className="cp-container">
          <span className="cp-eyebrow">{t("Pour et contre", "Pros and cons")}</span>
          <p className="cp-title">{t("Avantages et limites.", "Pros and cons.")}</p>
          <div className="cp-pros-cons-grid">

            {/* Tool A pros + cons */}
            <div className="cp-pros-cons-col">
              <div className="cp-pros-cons-head">
                <ToolLogo tool={toolA} size={20} />
                <span className="cp-pros-cons-tool-name">{toolA.name}</span>
              </div>
              <p className="cp-pros-cons-sublabel cp-pros-cons-sublabel--pros">
                {t("Avantages", "Advantages")}
              </p>
              <ul className="cp-pros-cons-list">
                {(lang === "fr" ? content.prosA : content.prosAEn).map((item, i) => (
                  <li key={i} className="cp-pros-cons-item cp-pros-cons-item--pro">{item}</li>
                ))}
              </ul>
              <p className="cp-pros-cons-sublabel cp-pros-cons-sublabel--cons" style={{ marginTop: 20 }}>
                {t("Limites", "Limitations")}
              </p>
              <ul className="cp-pros-cons-list">
                {(lang === "fr" ? content.limitsA : content.limitsAEn).length > 0
                  ? (lang === "fr" ? content.limitsA : content.limitsAEn).map((item, i) => (
                      <li key={i} className="cp-pros-cons-item cp-pros-cons-item--con">{item}</li>
                    ))
                  : <li className="cp-pros-cons-item" style={{ color: "#9A9A92" }}>{t("Données non disponibles.", "Data not available.")}</li>
                }
              </ul>
            </div>

            {/* Tool B pros + cons */}
            <div className="cp-pros-cons-col">
              <div className="cp-pros-cons-head">
                <ToolLogo tool={toolB} size={20} />
                <span className="cp-pros-cons-tool-name">{toolB.name}</span>
              </div>
              <p className="cp-pros-cons-sublabel cp-pros-cons-sublabel--pros">
                {t("Avantages", "Advantages")}
              </p>
              <ul className="cp-pros-cons-list">
                {(lang === "fr" ? content.prosB : content.prosBEn).map((item, i) => (
                  <li key={i} className="cp-pros-cons-item cp-pros-cons-item--pro">{item}</li>
                ))}
              </ul>
              <p className="cp-pros-cons-sublabel cp-pros-cons-sublabel--cons" style={{ marginTop: 20 }}>
                {t("Limites", "Limitations")}
              </p>
              <ul className="cp-pros-cons-list">
                {(lang === "fr" ? content.limitsB : content.limitsBEn).length > 0
                  ? (lang === "fr" ? content.limitsB : content.limitsBEn).map((item, i) => (
                      <li key={i} className="cp-pros-cons-item cp-pros-cons-item--con">{item}</li>
                    ))
                  : <li className="cp-pros-cons-item" style={{ color: "#9A9A92" }}>{t("Données non disponibles.", "Data not available.")}</li>
                }
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ── Ce qui doit te faire choisir ───────────────────────────────────── */}
      {content.decisionRows.length > 0 && (
        <section className="cp-section scroll-mt-20">
          <div className="cp-container">
            <span className="cp-eyebrow">{t("Critères de décision", "Decision criteria")}</span>
            <p className="cp-title">{t("Ce qui doit te faire choisir.", "What should make you decide.")}</p>
            <ul className="cp-decision-list">
              {content.decisionRows.map((row, i) => (
                <li key={i} className="cp-decision-row">
                  <span className="cp-decision-context">
                    {lang === "fr" ? row.context : row.contextEn}
                  </span>
                  <span className="cp-decision-arrow">→</span>
                  <span className="cp-decision-choice">
                    {lang === "fr" ? row.choice : row.choiceEn}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Profils ────────────────────────────────────────────────────────── */}
      {content.profiles.length > 0 && (
        <section id="profils" className="cp-section scroll-mt-20">
          <div className="cp-container">
            <span className="cp-eyebrow">{t("Pour quel profil ?", "Which profile?")}</span>
            <p className="cp-title">{t("Le bon choix selon ton profil.", "The right choice for your profile.")}</p>
            <div className="cp-profile-grid">
              {content.profiles.map((profile) => (
                <div key={profile.persona} className="cp-profile-card">
                  <p className="cp-profile-persona">
                    {lang === "fr" ? profile.persona : profile.personaEn}
                  </p>
                  <p className="cp-profile-choice">{profile.choice}.</p>
                  <p className="cp-profile-reason">
                    {lang === "fr" ? profile.reason : profile.reasonEn}
                  </p>
                  <p className="cp-profile-limit">
                    {t("Limite :", "Limit:")} {lang === "fr" ? profile.limit : profile.limitEn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Prix ───────────────────────────────────────────────────────────── */}
      <section id="prix" className="cp-section scroll-mt-20">
        <div className="cp-container">
          <span className="cp-eyebrow">{t("Prix", "Pricing")}</span>
          <p className="cp-title">
            {t("Lequel coûte vraiment le moins cher ?", "Which actually costs less?")}
          </p>
          <p style={{
            fontFamily: "var(--font-ui)", fontSize: 17, lineHeight: 1.55,
            color: "#6F6F68", maxWidth: 760, marginBottom: 28,
            letterSpacing: "-0.015em",
          }}>
            {lang === "fr" ? content.pricingFraming : content.pricingFramingEn}
          </p>

          {/* Pricing rows */}
          <div className="cp-price-row">
            <div className="cp-price-tool">
              <ToolLogo tool={toolA} size={20} />
              {toolA.name}
            </div>
            <p className="cp-price-plans">
              <PricingNote text={lang === "fr" ? content.pricingToolANotes : content.pricingToolANotesEn} />
            </p>
          </div>
          <div className="cp-price-row">
            <div className="cp-price-tool">
              <ToolLogo tool={toolB} size={20} />
              {toolB.name}
            </div>
            <p className="cp-price-plans">
              <PricingNote text={lang === "fr" ? content.pricingToolBNotes : content.pricingToolBNotesEn} />
            </p>
          </div>

          {/* Recommendation */}
          <div style={{
            marginTop: 24, padding: "16px 20px",
            background: "#F8F8F4", border: "1px solid #DADAD4",
            borderRadius: 8,
          }}>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6F6F68", marginBottom: 6 }}>
              {t("Recommandation ToolTrim", "ToolTrim recommendation")}
            </p>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: 14, lineHeight: 1.55, color: "#222222" }}>
              {lang === "fr" ? content.pricingReco : content.pricingRecoEn}
            </p>
          </div>
        </div>
      </section>

      {/* ── Alternatives ───────────────────────────────────────────────────── */}
      {altTools.length > 0 && (
        <section id="alternatives" className="cp-section scroll-mt-20">
          <div className="cp-container">
            <span className="cp-eyebrow">{t("Alternatives", "Alternatives")}</span>
            <p className="cp-title">
              {t("À regarder avant de choisir.", "Worth checking before you decide.")}
            </p>
            <div>
              {altTools.map((alt) => (
                alt.tool ? (
                  <Link key={alt.slug} to={`${prefix}/tool/${alt.tool.slug}`} className="cp-alt-row">
                    <div className="cp-alt-logo"><ToolLogo tool={alt.tool} size={24} /></div>
                    <div className="cp-alt-content">
                      <p className="cp-alt-name">{alt.tool.name}</p>
                      <p className="cp-alt-reason">{lang === "fr" ? alt.reason : alt.reasonEn}</p>
                    </div>
                    <div className="cp-alt-right">
                      {alt.price && <span className="cp-alt-price">{alt.price}</span>}
                      <span className="cp-alt-cta">{t("Voir la fiche", "See review")} →</span>
                    </div>
                  </Link>
                ) : (
                  <div key={alt.slug} className="cp-alt-row" style={{ cursor: "default" }}>
                    <div className="cp-alt-logo" style={{ background: "#F8F8F4" }}>
                      <span style={{ fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 700, color: "#9A9A92" }}>
                        {alt.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="cp-alt-content">
                      <p className="cp-alt-name">{alt.name}</p>
                      <p className="cp-alt-reason">{lang === "fr" ? alt.reason : alt.reasonEn}</p>
                    </div>
                    {alt.price && <div className="cp-alt-right"><span className="cp-alt-price">{alt.price}</span></div>}
                  </div>
                )
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA band ───────────────────────────────────────────────────────── */}
      <div className="cp-cta-band">
        <div className="cp-container">
          <span className="cp-eyebrow">{t("Diagnostic", "Diagnostic")}</span>
          <p style={{
            fontFamily: "var(--font-brand)",
            fontSize: "clamp(1.75rem, 4vw, 3.5rem)",
            fontWeight: 600, letterSpacing: "-0.055em",
            lineHeight: 0.98, color: "#222222",
            maxWidth: 720, marginBottom: 16,
          }}>
            {t(
              `${toolA.name} ou ${toolB.name} sont déjà dans ta stack ?`,
              `${toolA.name} or ${toolB.name} already in your stack?`,
            )}
          </p>
          <p style={{
            fontFamily: "var(--font-ui)", fontSize: 17, lineHeight: 1.5,
            color: "#6F6F68", maxWidth: 540, marginBottom: 32,
            letterSpacing: "-0.015em",
          }}>
            {t(
              "Analyse tes outils actuels et vérifie si tu n'as pas déjà plusieurs outils qui font le même travail.",
              "Audit your current tools and check if you already have overlapping subscriptions.",
            )}
          </p>
          <Link
            to={`${prefix}/selector?from=${slugPair}`}
            style={{
              display: "inline-flex", alignItems: "center",
              height: 48, padding: "0 22px",
              background: "#222222", color: "#FFFFFF",
              borderRadius: 8, fontFamily: "var(--font-ui)",
              fontSize: 15, fontWeight: 500,
              letterSpacing: "-0.01em", textDecoration: "none",
              transition: "background 160ms ease-out",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#000000"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#222222"; }}
          >
            {t("Analyser ma stack →", "Analyze my stack →")}
          </Link>
        </div>
      </div>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section id="faq" className="cp-section cp-section--last scroll-mt-20">
        <div className="cp-container">
          <span className="cp-eyebrow">FAQ</span>
          <p className="cp-title">
            {t("Questions fréquentes.", "Frequently asked questions.")}
          </p>
          <div>
            {content.faq.map((item, i) => (
              <FaqItem
                key={i}
                question={lang === "fr" ? item.q : item.qEn}
                answer={lang === "fr" ? item.a : item.aEn}
                defaultOpen={i === 0}
              />
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

/* ─── FAQ Item ───────────────────────────────────────────────────────────── */
function FaqItem({ question, answer, defaultOpen = false }: { question: string; answer: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details className="cp-faq-item" open={defaultOpen} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary className="cp-faq-summary">
        <span>{question}</span>
        <ChevronDown
          size={16}
          style={{
            flexShrink: 0, color: "#9A9A92",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 160ms",
          }}
        />
      </summary>
      <p className="cp-faq-answer">{answer}</p>
    </details>
  );
}

export default ComparePage;
