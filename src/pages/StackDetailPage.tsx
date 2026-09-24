import { useEffect, useMemo, useState } from "react";
import { fitBrandedTitle } from "@/lib/seoTitle";
import { Link, Navigate, useParams } from "react-router-dom";
import { AlertTriangle, ChevronDown, ChevronRight, CircleAlert, Target } from "@/lib/icons";
import { hasGenuineFreeTier } from "@/lib/pricing";
import ToolLogo from "@/components/ToolLogo";
import Breadcrumb from "@/components/Breadcrumb";
import { useLang } from "@/hooks/useLang";
import { usdFromEur } from "@/lib/currencyRates";
import { useToolSummaries, type ToolSummary } from "@/hooks/useSupabaseData";
import { useStackBySlug } from "@/hooks/useStackDetailData";
import stackCatalog from "@/data/stacks-catalog-index.json";
import { cleanupSeo, SEO_BASE, setHreflang, setJsonLd, setSeoTags } from "@/lib/seo";
import {
  STACK_PERSONAS,
  STACK_SUB_PROFILES,
  STACK_STAGES,
  type StackGuide,
  type StackInsight,
  type StackPersona,
  type StackStage,
  type StackToolSlot,
} from "@/data/stacks";

/* ─── Safety helpers ─────────────────────────────────────────────────────── */
// Stack records are partially editorial; optional arrays must be normalized before rendering.
const asArray = <T,>(value: T[] | undefined | null): T[] =>
  Array.isArray(value) ? value : [];

/* ─── Stack layer grouping ───────────────────────────────────────────────── */
const STACK_LAYERS = [
  {
    id: "sell",
    titleFr: "Acquisition & vente",
    titleEn: "Acquisition & sales",
    match: ["pipeline", "rendez-vous", "qualification", "formulaire", "email", "social", "vente", "crm", "seo", "prospection"],
  },
  {
    id: "create",
    titleFr: "Production & livraison",
    titleEn: "Production & delivery",
    match: ["création", "design", "contenu", "base de travail", "fichiers", "déploiement", "repo", "produit", "asset", "prototype", "handoff", "feedback", "plugin", "modélisation", "plans", "rendu", "image", "moodboard"],
  },
  {
    id: "ops",
    titleFr: "Ops & automatisation",
    titleEn: "Ops & automation",
    match: ["pilotage", "automatisation", "base", "documentation", "workspace", "operations", "stockage", "projet", "coordination", "planning", "sourcing", "fichiers", "rendez-vous", "ia", "assistant"],
  },
  {
    id: "money",
    titleFr: "Finance & admin",
    titleEn: "Finance & admin",
    match: ["paiement", "facturation", "billing", "payment", "compte pro", "signature", "compta"],
  },
  {
    id: "measure",
    titleFr: "Mesure & support",
    titleEn: "Measurement & support",
    match: ["analytics", "mesure", "support", "ux", "reporting", "tracking", "recherche"],
  },
];

/* Per-persona layer overrides */
const PERSONA_LAYERS: Partial<Record<StackPersona, typeof STACK_LAYERS>> = {
  dev: [
    { id: "code", titleFr: "Coder", titleEn: "Code", match: ["code", "repo", "github", "débug", "debug"] },
    { id: "preview", titleFr: "Preview client", titleEn: "Client preview", match: ["déploiement", "deployment", "preview", "vercel"] },
    { id: "docs", titleFr: "Documenter", titleEn: "Document", match: ["base", "workspace", "documentation", "specs", "brief", "décisions", "decisions"] },
    { id: "payment", titleFr: "Encaisser", titleEn: "Get paid", match: ["paiement", "payment", "facture", "invoice", "stripe"] },
    { id: "tasks", titleFr: "Suivre les tâches", titleEn: "Track tasks", match: ["projet", "project", "tâches", "tasks", "roadmap", "suivi"] },
    { id: "ai", titleFr: "IA / assistance", titleEn: "AI / assistance", match: ["ia", "ai", "assistant", "copilote", "chatgpt"] },
    { id: "automation", titleFr: "Automation", titleEn: "Automation", match: ["automatisation", "automation", "zap", "make"] },
  ],
  content: [
    { id: "ai",      titleFr: "Copilote éditorial IA",     titleEn: "AI editorial copilot",       match: ["rédaction", "idées", "writing", "ideas", "ia"] },
    { id: "ideas",   titleFr: "Idées & organisation",       titleEn: "Ideas & organisation",        match: ["organisation", "formulaire", "stockage"] },
    { id: "visual",  titleFr: "Création visuelle",          titleEn: "Visual creation",             match: ["visuels", "design", "visuals", "visuel"] },
    { id: "video",   titleFr: "Vidéo & audio",              titleEn: "Video & audio",               match: ["montage", "vidéo", "audio", "parlé"] },
    { id: "publish", titleFr: "Publication & planification", titleEn: "Publishing & scheduling",   match: ["newsletter", "publication", "social", "scheduling"] },
    { id: "storage", titleFr: "Stockage & assets",          titleEn: "Storage & assets",            match: ["stockage", "storage", "assets", "fichiers"] },
  ],
};

/* ─── Editorial content types ────────────────────────────────────────────── */
interface StackBudgetRow {
  tier: string; tierEn: string;
  amount: string;
  desc: string; descEn: string;
}
interface StackRiskEnhanced {
  problem: string; problemEn: string;
  consequence: string; consequenceEn: string;
  reco: string; recoEn: string;
}
interface StackAltVariant {
  label: string; labelEn: string;
  title: string; titleEn: string;
  budget: string;
  toolsDesc: string; toolsDescEn: string;
  compromise: string; compromiseEn: string;
}
interface StackFaqItem {
  q: string; qEn: string;
  a: string; aEn: string;
}
interface StackPriority {
  essential: string[]; essentialEn: string[];
  optional: string[]; optionalEn: string[];
  challenge: string[]; challengeEn: string[];
}
interface StackEditorialContent {
  verdictShort: string; verdictShortEn: string;
  overviewIntro: string; overviewIntroEn: string;
  overviewServesLabel: string; overviewServesLabelEn: string;
  overviewServes: string; overviewServesEn: string;
  overviewAvoidsLabel: string; overviewAvoidsLabelEn: string;
  overviewAvoids: string; overviewAvoidsEn: string;
  overviewNotForLabel: string; overviewNotForLabelEn: string;
  overviewNotFor: string; overviewNotForEn: string;
  priority: StackPriority;
  budgetTitle: string; budgetTitleEn: string;
  budgetRows: StackBudgetRow[];
  risksTitle: string; risksTitleEn: string;
  risks: StackRiskEnhanced[];
  altsTitle: string; altsTitleEn: string;
  altVariants: StackAltVariant[];
  ctaTitle: string; ctaTitleEn: string;
  ctaDesc: string; ctaDescEn: string;
  faq: StackFaqItem[];
}

/* ─── Editorial content — Créateur de contenu ───────────────────────────── */
const CREATEUR_CONTENU: StackEditorialContent = {
  verdictShort:    "Une stack pensée pour produire régulièrement sans multiplier les outils d'IA, de design et de publication.",
  verdictShortEn:  "A stack designed for regular publishing without stacking AI, design, and scheduling tools.",

  overviewIntro:   "Cette stack vise les créateurs de contenu qui doivent capter des idées, produire des formats réguliers, recycler leurs contenus et garder une cohérence éditoriale sans empiler trop d'abonnements.",
  overviewIntroEn: "This stack is for content creators who need to capture ideas, produce regular formats, repurpose content, and maintain editorial consistency without stacking too many subscriptions.",

  overviewServesLabel:    "Elle sert à",
  overviewServesLabelEn:  "It's for",
  overviewServes:    "Organiser les idées, produire plus vite et recycler les contenus existants.",
  overviewServesEn:  "Organizing ideas, producing faster, and repurposing existing content.",

  overviewAvoidsLabel:    "Elle évite",
  overviewAvoidsLabelEn:  "It avoids",
  overviewAvoids:    "La dispersion entre trop d'outils d'IA, de design, de notes et de publication.",
  overviewAvoidsEn:  "Scattering across too many AI, design, notes, and publishing tools.",

  overviewNotForLabel:    "Elle n'est pas faite pour",
  overviewNotForLabelEn:  "It's not for",
  overviewNotFor:    "Une équipe média complexe, une production vidéo lourde ou un workflow social media très avancé.",
  overviewNotForEn:  "A complex media team, heavy video production, or a very advanced social media workflow.",

  priority: {
    essential:   ["Base d'organisation centrale", "Copilote IA principal configuré", "Outil de création visuelle"],
    essentialEn: ["Central organization base",    "Configured main AI copilot",      "Visual creation tool"],
    optional:    ["Outil de programmation sociale", "Outil vidéo avancé", "Outil analytics dédié"],
    optionalEn:  ["Social scheduling tool",         "Advanced video tool",  "Dedicated analytics tool"],
    challenge:    ["Plusieurs IA généralistes en parallèle", "Plusieurs outils de design", "Outil de publication payant trop tôt"],
    challengeEn:  ["Multiple generalist AIs in parallel",    "Multiple design tools",       "Paid publishing tool too early"],
  },

  budgetTitle:   "Budget cible : 48€/mois.",
  budgetTitleEn: "Target budget: €48/month.",
  budgetRows: [
    {
      tier: "Budget minimal", tierEn: "Minimal budget", amount: "0–15€/mois",
      desc:   "Pour tester la stack avec les plans gratuits et un seul outil payant central.",
      descEn: "To test the stack with free plans and a single paid core tool.",
    },
    {
      tier: "Budget recommandé", tierEn: "Recommended budget", amount: "≈ 48€/mois",
      desc:   "Autour de 48€/mois si les outils principaux sont réellement utilisés chaque semaine.",
      descEn: "Around €48/month when the main tools are genuinely used every week.",
    },
    {
      tier: "Budget à surveiller", tierEn: "Budget to watch", amount: "> 80–100€/mois",
      desc:   "Au-delà de 80–100€/mois, vérifier les doublons IA, design, vidéo ou publication.",
      descEn: "Above €80–100/month, check for AI, design, video, or publishing duplicates.",
    },
  ],

  risksTitle:   "Les doublons à éviter.",
  risksTitleEn: "Duplicates to avoid.",
  risks: [
    {
      problem: "Deux copilotes IA généralistes", problemEn: "Two generalist AI copilots",
      consequence:   "Tu paies deux abonnements pour produire les mêmes briefs, posts ou scripts.",
      consequenceEn: "You pay for two subscriptions to produce the same briefs, posts, or scripts.",
      reco:   "Garde un seul copilote principal, puis complète avec des outils spécialisés uniquement si le besoin est réel.",
      recoEn: "Keep one main copilot, then add specialized tools only when the need is real.",
    },
    {
      problem: "Deux outils de design ou templates", problemEn: "Two design or template tools",
      consequence:   "Canva et Adobe Express font souvent exactement le même travail.",
      consequenceEn: "Canva and Adobe Express often do exactly the same job.",
      reco:   "Choisis l'un ou l'autre selon ton usage dominant. Pas les deux.",
      recoEn: "Choose one based on your main use case. Not both.",
    },
    {
      problem: "Trop d'outils de programmation sociale", problemEn: "Too many social scheduling tools",
      consequence:   "Buffer, Metricool, Later — un seul suffit si tu publies sur 2–3 canaux.",
      consequenceEn: "Buffer, Metricool, Later — one is enough if you publish on 2–3 channels.",
      reco:   "Ne prends un outil payant de scheduling qu'à partir de 3 canaux réguliers.",
      recoEn: "Only pay for a scheduling tool when you have 3 or more regular channels.",
    },
    {
      problem: "Outils vidéo payants sous-utilisés", problemEn: "Underused paid video tools",
      consequence:   "Descript ou CapCut Pro coûtent cher si la vidéo n'est pas un canal prioritaire.",
      consequenceEn: "Descript or CapCut Pro are expensive if video isn't a priority channel.",
      reco:   "Active un outil vidéo payant seulement si tu publies au moins 4 vidéos par mois.",
      recoEn: "Activate a paid video tool only if you publish at least 4 videos per month.",
    },
    {
      problem: "Analytics payé trop tôt", problemEn: "Analytics paid too early",
      consequence:   "Metricool Pro, Shield ou Iconosquare se justifient avec un volume de publication régulier.",
      consequenceEn: "Metricool Pro, Shield, or Iconosquare are only justified with consistent publishing volume.",
      reco:   "Commence avec les analytics natifs des plateformes. Upgrade quand tu publies plus de 12 posts/mois.",
      recoEn: "Start with native platform analytics. Upgrade when publishing more than 12 posts/month.",
    },
  ],

  altsTitle:   "Si tu veux une stack plus légère.",
  altsTitleEn: "If you want a lighter stack.",
  altVariants: [
    {
      label: "Version minimale", labelEn: "Minimal version",
      title: "Tester la routine", titleEn: "Testing the routine",
      budget: "0–15€/mois",
      toolsDesc:   "Notion gratuit + ChatGPT gratuit + Canva gratuit. Zéro abonnement.",
      toolsDescEn: "Free Notion + free ChatGPT + free Canva. Zero subscription.",
      compromise:   "Moins de flexibilité sur les formats, pas de scheduling multi-canal.",
      compromiseEn: "Less format flexibility, no multi-channel scheduling.",
    },
    {
      label: "Version recommandée", labelEn: "Recommended version",
      title: "Publier régulièrement", titleEn: "Publishing regularly",
      budget: "≈ 48€/mois",
      toolsDesc:   "Notion + ChatGPT (ou Claude) + Canva Pro + Buffer + Beehiiv.",
      toolsDescEn: "Notion + ChatGPT (or Claude) + Canva Pro + Buffer + Beehiiv.",
      compromise:   "Bon équilibre coût / efficacité pour 3 canaux et une newsletter.",
      compromiseEn: "Good cost/efficiency balance for 3 channels and a newsletter.",
    },
    {
      label: "Version intensive", labelEn: "Intensive version",
      title: "Production multi-format", titleEn: "Multi-format production",
      budget: "80–120€/mois",
      toolsDesc:   "Stack recommandée + Descript + outil analytics dédié (Metricool, Shield).",
      toolsDescEn: "Recommended stack + Descript + dedicated analytics tool (Metricool, Shield).",
      compromise:   "À justifier uniquement si la vidéo, le podcast ou l'audio sont des canaux mesurables et prioritaires.",
      compromiseEn: "Justified only if video, podcast, or audio are measurable, priority channels.",
    },
  ],

  ctaTitle:   "Cette stack ressemble à la tienne ?",
  ctaTitleEn: "Does this stack look like yours?",
  ctaDesc:   "Analyse tes outils actuels et repère ceux qui méritent vraiment leur place, ceux qui se doublonnent et ceux que tu peux challenger.",
  ctaDescEn: "Analyze your current tools and identify which ones earn their place, which ones overlap, and which ones you can challenge.",

  faq: [
    {
      q:  "Cette stack est-elle adaptée à un créateur débutant ?",
      qEn: "Is this stack right for a beginner creator?",
      a:   "Oui, à condition de commencer par Notion + un seul outil IA. Inutile de prendre Beehiiv avant d'avoir 200 abonnés actifs, ni Buffer avant de publier sur 3 canaux simultanément. La stack se construit par étapes.",
      aEn: "Yes, provided you start with Notion + one AI tool. No need for Beehiiv before 200 active subscribers, or Buffer before publishing on 3 channels simultaneously. The stack builds in steps.",
    },
    {
      q:  "Peut-on réduire le budget sous 48€/mois ?",
      qEn: "Can you bring the budget under €48/month?",
      a:   "Oui. Notion gratuit + ChatGPT gratuit + Canva gratuit couvre les bases sans abonnement. Le budget monte quand Canva Pro, un outil IA payant et Buffer s'ajoutent. Commence gratuit, upgrade à l'usage.",
      aEn: "Yes. Free Notion + free ChatGPT + free Canva covers the basics without subscriptions. Budget increases when Canva Pro, a paid AI tool, and Buffer are added. Start free, upgrade as usage grows.",
    },
    {
      q:  "Faut-il vraiment plusieurs outils IA ?",
      qEn: "Do you really need multiple AI tools?",
      a:   "Non. Un seul copilote IA bien configuré — ton ton éditorial, ta cible, 3 exemples de tes meilleurs textes — produit mieux que 3 IA non configurées. Commence par un seul, configure-le, ensuite seulement ajoute un outil spécialisé si tu as un besoin précis.",
      aEn: "No. One well-configured AI copilot — your editorial tone, audience, 3 examples of your best writing — produces better than 3 unconfigured AIs. Start with one, configure it, then add a specialized tool only for a specific need.",
    },
    {
      q:  "Quel outil doit servir de base centrale ?",
      qEn: "Which tool should be the central base?",
      a:   "Notion. C'est là que vont le backlog d'idées, le calendrier éditorial, les briefs, les brouillons non publiés et les templates de recyclage. L'IA transforme, Notion stocke et structure.",
      aEn: "Notion. That's where the idea backlog, editorial calendar, briefs, unpublished drafts, and repurposing templates live. AI transforms content; Notion stores and structures it.",
    },
    {
      q:  "Quand ajouter un outil de publication sociale ?",
      qEn: "When should you add a social publishing tool?",
      a:   "Dès que tu publies sur plus de 2 canaux simultanément ou que tu veux préparer une semaine de contenu en une seule session. Buffer en plan gratuit (3 canaux, 10 posts en attente) couvre la plupart des créateurs au démarrage.",
      aEn: "When you publish on more than 2 channels simultaneously, or want to prepare a week of content in one session. Buffer's free plan (3 channels, 10 posts queued) covers most creators starting out.",
    },
  ],
};

const DEV_FREELANCE_SHIPPER: StackEditorialContent = {
  verdictShort:    "",
  verdictShortEn:  "",

  overviewIntro:   "Coder proprement. Montrer vite. Garder une trace. Encaisser sans empiler les abonnements.",
  overviewIntroEn: "Code cleanly. Show progress fast. Keep a trace. Get paid without stacking subscriptions.",

  overviewServesLabel:    "Pour qui",
  overviewServesLabelEn:  "Who it's for",
  overviewServes:    "Développeurs freelances qui livrent des sites, apps, MVP ou missions client sans équipe produit complète.",
  overviewServesEn:  "Freelance developers shipping websites, apps, MVPs, or client projects without a full product team.",

  overviewAvoidsLabel:    "Ce que ça évite",
  overviewAvoidsLabelEn:  "What it avoids",
  overviewAvoids:    "Payer trop tôt des outils d'équipe, un workflow projet trop lourd ou plusieurs copilotes IA qui font doublon.",
  overviewAvoidsEn:  "Paying too early for team tools, an overweight project workflow, or several overlapping AI copilots.",

  overviewNotForLabel:    "Quand passer plus lourd",
  overviewNotForLabelEn:  "When to go heavier",
  overviewNotFor:    "Si tu travailles avec QA, staging avancé, monitoring complexe ou plusieurs environnements critiques.",
  overviewNotForEn:  "If you work with QA, advanced staging, complex monitoring, or several critical environments.",

  priority: {
    essential:   ["GitHub pour versionner", "Vercel pour partager une preview", "Stripe pour encaisser"],
    essentialEn: ["GitHub for versioning", "Vercel for previews", "Stripe for payment"],
    optional:    ["Notion si le client a besoin de contexte", "ChatGPT si tu codes ou debugges chaque semaine"],
    optionalEn:  ["Notion when the client needs context", "ChatGPT if you code or debug weekly"],
    challenge:    ["Copilote IA secondaire", "Outil de gestion projet en double", "Automation trop tôt"],
    challengeEn:  ["Secondary AI copilot", "Duplicate project management tool", "Automation too early"],
  },

  budgetTitle:   "32€/mois, tant que la stack reste légère.",
  budgetTitleEn: "€32/month, while the stack stays light.",
  budgetRows: [
    {
      tier: "Inclus / souvent gratuit", tierEn: "Included / often free", amount: "0€",
      desc:   "GitHub, Vercel et Notion peuvent souvent couvrir versioning, preview et contexte client avec leurs plans gratuits selon le volume.",
      descEn: "GitHub, Vercel, and Notion can often cover versioning, preview, and client context on free plans depending on volume.",
    },
    {
      tier: "Budget cible", tierEn: "Target budget", amount: "≈ 32€/mois",
      desc:   "La cible tient quand le socle reste simple : hébergement, preview, documentation et paiement.",
      descEn: "The target holds when the base stays simple: hosting, preview, documentation, and payment.",
    },
    {
      tier: "À ne pas payer trop tôt", tierEn: "Do not pay too early", amount: "Jira / CRM / IA x2",
      desc:   "Attends un vrai volume répétitif avant d'ajouter outil projet lourd, CRM complet, plusieurs copilotes IA ou automatisations payantes.",
      descEn: "Wait for real repeated volume before adding heavy PM tooling, a full CRM, multiple AI copilots, or paid automations.",
    },
  ],

  risksTitle:   "Ce que cette stack évite.",
  risksTitleEn: "What this stack avoids.",
  risks: [
    {
      problem: "Stack produit trop lourde", problemEn: "Overweight product stack",
      consequence: "Jira, Linear ou un CRM complet ajoutent du rituel si tu livres seul.",
      consequenceEn: "Jira, Linear, or a full CRM add ritual if you ship alone.",
      reco: "Garde un système léger tant que la mission tient dans code, preview, décisions et paiement.",
      recoEn: "Keep a light system while the project fits code, preview, decisions, and payment.",
    },
    {
      problem: "Outil projet pour deux clients", problemEn: "Project tool for two clients",
      consequence: "Un outil d'équipe devient vite une couche de suivi de plus.",
      consequenceEn: "A team tool quickly becomes one more tracking layer.",
      reco: "Utilise Notion pour le contexte client avant d'ajouter une vraie couche PM.",
      recoEn: "Use Notion for client context before adding a full PM layer.",
    },
    {
      problem: "CRM avant flux commercial", problemEn: "CRM before sales flow",
      consequence: "Un pipeline complet ne sert pas si les opportunités sont encore rares.",
      consequenceEn: "A full pipeline is not useful if opportunities are still rare.",
      reco: "Repousse le CRM tant que le suivi commercial tient dans une page ou un tableur.",
      recoEn: "Delay CRM while sales follow-up fits in a page or spreadsheet.",
    },
    {
      problem: "Plusieurs copilotes IA", problemEn: "Several AI copilots",
      consequence: "ChatGPT, Claude, Copilot et Cursor peuvent couvrir le même besoin.",
      consequenceEn: "ChatGPT, Claude, Copilot, and Cursor can cover the same need.",
      reco: "Garde un copilote principal, ajoute un IDE IA seulement si le code est hebdomadaire.",
      recoEn: "Keep one main copilot, add an AI IDE only if code work is weekly.",
    },
    {
      problem: "Automations trop tôt", problemEn: "Automations too early",
      consequence: "Automatiser un geste qui n'est pas encore répété crée plus de maintenance que de gain.",
      consequenceEn: "Automating a task that is not repeated yet creates more maintenance than gain.",
      reco: "Paie l'automation quand le flux est stable et fréquent.",
      recoEn: "Pay for automation when the flow is stable and frequent.",
    },
  ],

  altsTitle:   "Décisions liées.",
  altsTitleEn: "Related decisions.",
  altVariants: [],

  ctaTitle:   "Ta stack dev est déjà plus lourde que ça ?",
  ctaTitleEn: "Is your dev stack already heavier than this?",
  ctaDesc:   "3 minutes pour savoir ce qui sert vraiment et ce qui te coûte sans raison.",
  ctaDescEn: "3 minutes to know what is genuinely useful and what costs you for no good reason.",

  faq: [
    {
      q: "Cette stack suffit-elle pour livrer un site client ?",
      qEn: "Is this stack enough to ship a client website?",
      a: "Oui, si le besoin principal est de coder, partager une preview, documenter les décisions et encaisser. Elle devient trop légère si tu dois gérer QA avancée, staging complexe ou plusieurs développeurs.",
      aEn: "Yes, if the core need is coding, sharing a preview, documenting decisions, and getting paid. It becomes too light when you need advanced QA, complex staging, or several developers.",
    },
    {
      q: "Faut-il ajouter Linear ou Jira ?",
      qEn: "Should you add Linear or Jira?",
      a: "Pas par défaut. En solo, Notion suffit souvent pour le contexte, les décisions et le suivi client. Linear ou Jira deviennent utiles quand plusieurs personnes priorisent et livrent en même temps.",
      aEn: "Not by default. Solo, Notion is often enough for context, decisions, and client tracking. Linear or Jira become useful when several people prioritize and ship at the same time.",
    },
    {
      q: "Quand payer un outil IA de code ?",
      qEn: "When should you pay for an AI coding tool?",
      a: "Quand tu livres du code chaque semaine et que l'outil réduit vraiment le temps de debug, refactor ou génération. Sinon, un copilote généraliste bien configuré suffit.",
      aEn: "When you ship code weekly and the tool truly reduces debugging, refactoring, or generation time. Otherwise, a well-configured general copilot is enough.",
    },
  ],
};

/* ─── Editorial content registry ────────────────────────────────────────── */
const EDITORIAL_REGISTRY: Record<string, StackEditorialContent> = {
  "developpeur-freelance-shipper": DEV_FREELANCE_SHIPPER,
  "createur-contenu-operateur": CREATEUR_CONTENU,
};

function buildFallbackEditorial(stack: StackGuide): StackEditorialContent {
  const tools      = asArray(stack.tools);
  const coreTools  = tools.filter((t) => !t.decision || t.decision === "core");
  const condTools  = tools.filter((t) => t.decision === "conditional");
  const chalTools  = tools.filter((t) => t.decision === "challenge");
  return {
    verdictShort:    stack.bestFor,
    verdictShortEn:  stack.bestForEn,
    overviewIntro:   stack.editorial,
    overviewIntroEn: stack.editorialEn,
    overviewServesLabel:    "Elle sert à",    overviewServesLabelEn:  "It's for",
    overviewServes:    stack.bestFor,         overviewServesEn:  stack.bestForEn,
    overviewAvoidsLabel:    "Elle évite",     overviewAvoidsLabelEn:  "It avoids",
    overviewAvoids:    stack.risk,            overviewAvoidsEn:  stack.riskEn,
    overviewNotForLabel:    "Elle n'est pas faite pour", overviewNotForLabelEn:  "It's not for",
    overviewNotFor:    stack.avoidIf,         overviewNotForEn:  stack.avoidIfEn,
    priority: {
      essential:   coreTools.slice(0, 3).map((t) => t.role),
      essentialEn: coreTools.slice(0, 3).map((t) => t.roleEn),
      optional:    condTools.map((t) => t.role),
      optionalEn:  condTools.map((t) => t.roleEn),
      challenge:    chalTools.map((t) => t.role),
      challengeEn:  chalTools.map((t) => t.roleEn),
    },
    budgetTitle:   `Budget cible : ${stack.monthlyBudget}€/mois.`,
    budgetTitleEn: `Target budget: €${stack.monthlyBudget}/month.`,
    budgetRows: [
      { tier: "Budget minimal",   tierEn: "Minimal budget",      amount: "Gratuit",
        desc: "Plans gratuits des outils inclus dans la stack.", descEn: "Free plans of tools in the stack." },
      { tier: "Budget recommandé", tierEn: "Recommended budget", amount: `≈ ${stack.monthlyBudget}€/mois`,
        desc: "Quand les outils principaux sont utilisés régulièrement.", descEn: "When main tools are used regularly." },
      { tier: "Budget à surveiller", tierEn: "Budget to watch",  amount: `> ${Math.round(stack.monthlyBudget * 1.8)}€/mois`,
        desc: "Vérifier les doublons et les outils sous-utilisés.", descEn: "Check for duplicates and underused tools." },
    ],
    risksTitle:   "Les pièges à éviter.",
    risksTitleEn: "Traps to avoid.",
    risks: (stack.traps ?? []).map((trap) => ({
      problem: trap.title, problemEn: trap.titleEn,
      consequence: trap.detail, consequenceEn: trap.detailEn,
      reco: "Réévaluer l'usage de cet outil chaque mois.", recoEn: "Reassess this tool's usage each month.",
    })),
    altsTitle:   "Stacks proches.",
    altsTitleEn: "Related stacks.",
    altVariants: [],
    ctaTitle:   "Cette stack ressemble à la tienne ?",
    ctaTitleEn: "Does this stack look like yours?",
    ctaDesc:   "Analyse tes outils actuels et repère ceux qui méritent vraiment leur place.",
    ctaDescEn: "Analyze your current tools and identify which ones earn their place.",
    faq: (stack.checkpoints ?? []).map((cp) => ({
      q: cp.q, qEn: cp.qEn, a: cp.hint, aEn: cp.hintEn,
    })),
  };
}

/* ─── Expert tips ────────────────────────────────────────────────────────── */
const EXPERT_TIPS_BY_STACK: Record<string, StackInsight[]> = {
  "developpeur-freelance-shipper": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "GitHub + Vercel + Notion + Stripe. Ajoute Cursor seulement si tu livres du code chaque semaine, sinon ChatGPT suffit pour cadrer et débugger.", detailEn: "GitHub + Vercel + Notion + Stripe. Add Cursor only if you ship code weekly; otherwise ChatGPT is enough for scoping and debugging." },
    { title: "Astuce", titleEn: "Tip", detail: "Crée un template Notion par mission avec brief, décisions, changelog et lien preview Vercel. Le client suit sans te relancer.", detailEn: "Create one Notion template per project with brief, decisions, changelog, and Vercel preview link. The client tracks progress without chasing you." },
    { title: "Réglage utile", titleEn: "Useful setting", detail: "Ajoute un fichier de règles projet pour Cursor ou ton IA. Stack technique, conventions, composants à réutiliser, choses à ne pas modifier.", detailEn: "Add project rules for Cursor or your AI. Tech stack, conventions, reusable components, and things not to touch." },
  ],
  "designer-freelance-solo": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Figma reste le centre. Plugins minimum : Tokens Studio si système maintenu, Iconify pour les icônes, Stark pour accessibilité. Canva sert aux déclinaisons, pas à la source design.", detailEn: "Figma stays central. Minimum plugins: Tokens Studio for maintained systems, Iconify for icons, Stark for accessibility. Canva handles variations, not the design source." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Prépare une page client Notion avec brief, moodboard, validations et liens Figma. Tu transformes ton process en livrable visible.", detailEn: "Prepare a client Notion page with brief, moodboard, approvals, and Figma links. Your process becomes visible deliverable value." },
    { title: "À challenger", titleEn: "Challenge", detail: "Adobe complet ne doit rester actif que si tu ouvres vraiment Photoshop, Illustrator ou Lightroom chaque mois. Sinon plan photo ou alternative dédiée.", detailEn: "Full Adobe should stay active only if you actually open Photoshop, Illustrator, or Lightroom monthly. Otherwise use the photo plan or a focused alternative." },
  ],
  "architecte-interieur": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "SketchUp Pro, LayOut, D5 Render, Programa et Notion couvrent déjà l'essentiel : modèle, rendu, sourcing, validation et suivi client.", detailEn: "SketchUp Pro, LayOut, D5 Render, Programa, and Notion already cover the essentials: model, rendering, sourcing, approval, and client follow-up." },
    { title: "Astuce", titleEn: "Tip", detail: "Crée un modèle de dossier projet : 01_ADMIN, 02_BRIEF, 03_RÉFÉRENCES, 04_PLANS, 05_3D, 06_RENDUS, 07_SOURCING, 08_BUDGET, 09_CHANTIER, 10_LIVRAISON.", detailEn: "Create a project folder template: 01_ADMIN, 02_BRIEF, 03_REFERENCES, 04_PLANS, 05_3D, 06_RENDUS, 07_SOURCING, 08_BUDGET, 09_CHANTIER, 10_LIVRAISON." },
    { title: "À challenger", titleEn: "Challenge", detail: "V-Ray, Revit, Archicad, Rhino et Twinmotion doivent répondre à un livrable précis. Sinon, garde-les en outil projet, pas en abonnement permanent.", detailEn: "V-Ray, Revit, Archicad, Rhino, and Twinmotion must answer a precise deliverable. Otherwise keep them as project tools, not permanent subscriptions." },
  ],
  "scenographe-evenementiel": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "SketchUp ou Vectorworks pour le volume, D5 pour valider vite, InDesign pour le dossier, Notion pour les décisions et fournisseurs.", detailEn: "SketchUp ou Vectorworks pour le volume, D5 pour valider vite, InDesign pour le dossier, Notion pour les décisions et fournisseurs." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "OpenCutList, Transmutr et CleanUp évitent que la 3D devienne impossible à fabriquer ou trop lourde.", detailEn: "OpenCutList, Transmutr et CleanUp évitent que la 3D devienne impossible à fabriquer ou trop lourde." },
    { title: "À challenger", titleEn: "Challenge", detail: "Twinmotion et Skatter se justifient quand l'expérience ou l'ambiance vend vraiment le projet.", detailEn: "Twinmotion et Skatter se justifient quand l'expérience ou l'ambiance vend vraiment le projet." },
  ],
  "designer-stand-retail-popup": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "SketchUp + Illustrator + InDesign + Notion couvre déjà concept, signalétique, dossier et production.", detailEn: "SketchUp + Illustrator + InDesign + Notion couvre déjà concept, signalétique, dossier et production." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Airtable devient utile quand tu gères beaucoup de références, prix, prestataires et statuts.", detailEn: "Airtable devient utile quand tu gères beaucoup de références, prix, prestataires et statuts." },
    { title: "À challenger", titleEn: "Challenge", detail: "V-Ray doit rester lié à une image premium vendue, pas à chaque proposition.", detailEn: "V-Ray doit rester lié à une image premium vendue, pas à chaque proposition." },
  ],
  "designer-graphique-pro": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Illustrator, Photoshop et InDesign restent le noyau si tu livres print, identité et fichiers sources.", detailEn: "Illustrator, Photoshop et InDesign restent le noyau si tu livres print, identité et fichiers sources." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Eagle + FontBase font gagner du temps sur les assets et typographies, souvent plus que de nouveaux outils créatifs.", detailEn: "Eagle + FontBase font gagner du temps sur les assets et typographies, souvent plus que de nouveaux outils créatifs." },
    { title: "À challenger", titleEn: "Challenge", detail: "Canva et Adobe Express servent aux déclinaisons rapides, pas à la source de vérité.", detailEn: "Canva et Adobe Express servent aux déclinaisons rapides, pas à la source de vérité." },
  ],
  "brand-designer-systeme": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Figma ou Illustrator crée le système, Brandpad ou Notion le rend utilisable par le client.", detailEn: "Figma ou Illustrator crée le système, Brandpad ou Notion le rend utilisable par le client." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Ajoute Specify ou Tokens Studio seulement si la marque va vers un vrai système digital.", detailEn: "Ajoute Specify ou Tokens Studio seulement si la marque va vers un vrai système digital." },
    { title: "À challenger", titleEn: "Challenge", detail: "L'IA aide à explorer des territoires, mais la stratégie doit rester décidée et argumentée.", detailEn: "L'IA aide à explorer des territoires, mais la stratégie doit rester décidée et argumentée." },
  ],
  "directeur-artistique": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Are.na, ShotDeck, Eagle et Milanote doivent nourrir une décision, pas devenir une collection infinie.", detailEn: "Are.na, ShotDeck, Eagle et Milanote doivent nourrir une décision, pas devenir une collection infinie." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Frame.io est très utile dès que les retours portent sur vidéo, photo ou séquences.", detailEn: "Frame.io est très utile dès que les retours portent sur vidéo, photo ou séquences." },
    { title: "À challenger", titleEn: "Challenge", detail: "Runway, Krea ou Midjourney doivent servir une intention déjà formulée.", detailEn: "Runway, Krea ou Midjourney doivent servir une intention déjà formulée." },
  ],
  "developpeur-webflow-nocode-creatif": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Relume + Figma avant Webflow évitent beaucoup de pages mal cadrées.", detailEn: "Relume + Figma avant Webflow évitent beaucoup de pages mal cadrées." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Chaque script, app Webflow ou automation doit avoir une note de rôle et de maintenance.", detailEn: "Chaque script, app Webflow ou automation doit avoir une note de rôle et de maintenance." },
    { title: "À challenger", titleEn: "Challenge", detail: "Plausible et Search Console suffisent souvent avant d'ajouter une couche analytics lourde.", detailEn: "Plausible et Search Console suffisent souvent avant d'ajouter une couche analytics lourde." },
  ],
  "monteur-video": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Choisis un outil principal : DaVinci pour le tout-en-un, Premiere si le client vit dans Adobe.", detailEn: "Choisis un outil principal : DaVinci pour le tout-en-un, Premiere si le client vit dans Adobe." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Frame.io transforme les retours flous en actions timecodées.", detailEn: "Frame.io transforme les retours flous en actions timecodées." },
    { title: "À challenger", titleEn: "Challenge", detail: "Topaz Video et Runway restent des outils de finition ou de sauvetage, pas le cœur du montage.", detailEn: "Topaz Video et Runway restent des outils de finition ou de sauvetage, pas le cœur du montage." },
  ],
  "realisateur-videaste": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "La valeur est autant en préproduction qu'en montage : brief, moodboard, shotlist et planning doivent être visibles.", detailEn: "La valeur est autant en préproduction qu'en montage : brief, moodboard, shotlist et planning doivent être visibles." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "ShotDeck et Milanote aident à vendre une direction image avant le tournage.", detailEn: "ShotDeck et Milanote aident à vendre une direction image avant le tournage." },
    { title: "À challenger", titleEn: "Challenge", detail: "Yousign, Indy et Drive ferment la boucle : accord, acompte, livraison, archive.", detailEn: "Yousign, Indy et Drive ferment la boucle : accord, acompte, livraison, archive." },
  ],
  "consultant-b2b-propre": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Pipedrive si tu as un vrai pipeline, Notion si tu as surtout des missions. Calendly seulement si les rendez-vous sont fréquents.", detailEn: "Pipedrive if you have a real pipeline, Notion if you mostly manage projects. Calendly only if meetings are frequent." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Ajoute trois champs non négociables dans le CRM : montant, prochaine action, date de relance. Sans ça, l'outil ne sert qu'à se rassurer.", detailEn: "Add three non-negotiable CRM fields: amount, next action, follow-up date. Without them, the tool only provides reassurance." },
    { title: "Fiche à ajouter si besoin", titleEn: "Tool page to add if needed", detail: "Si ton conseil devient très réseau/intros, Folk mérite une vraie fiche produit et peut remplacer un CRM trop commercial.", detailEn: "If your consulting depends on network and intros, Folk deserves a full product page and can replace an overly sales-oriented CRM." },
  ],
  "createur-contenu-operateur": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Notion pour backlog, ChatGPT ou Claude pour transformer, Canva pour formats rapides, Buffer seulement si tu publies vraiment sur plusieurs canaux.", detailEn: "Notion for backlog, ChatGPT or Claude for transformation, Canva for fast formats, Buffer only if you truly publish on several channels." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Crée un template de recyclage : idée longue, post LinkedIn, newsletter, carrousel, script court. Un contenu doit générer plusieurs sorties.", detailEn: "Create a repurposing template: long idea, LinkedIn post, newsletter, carousel, short script. One content piece should create several outputs." },
    { title: "Réglage IA", titleEn: "AI setting", detail: "Configure un prompt permanent avec ton audience, ton niveau de langage, tes interdits éditoriaux et trois exemples de bons textes.", detailEn: "Configure persistent instructions with your audience, language level, editorial no-goes, and three examples of strong writing." },
  ],
  "ops-manager-fractional-coo": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "ClickUp ou Notion pour piloter, Make pour automatiser, Airtable seulement quand les données deviennent trop structurées pour Notion.", detailEn: "ClickUp or Notion for operating, Make for automation, Airtable only when data becomes too structured for Notion." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Vends ton kit de mission : kick-off, cadence hebdo, plan 30 jours, SOP, closing. Ce n'est pas l'outil qui fait l'expertise, c'est le système réutilisable.", detailEn: "Sell your engagement kit: kickoff, weekly cadence, 30-day plan, SOP, closing. Expertise is not the tool; it is the reusable system." },
    { title: "Automatisation utile", titleEn: "Useful automation", detail: "Dans Make, chaque scénario doit avoir un nom métier et une note d'intention. Sinon personne ne saura le maintenir dans trois mois.", detailEn: "In Make, every scenario needs a business name and intent note. Otherwise nobody will maintain it three months later." },
  ],
  "freelance-solo-zero-bloat": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Notion + Drive + Tally + Stripe. Ajoute Indy si l'administratif français devient le vrai irritant.", detailEn: "Notion + Drive + Tally + Stripe. Add Indy if French admin becomes the real pain point." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Un formulaire Tally bien écrit vaut mieux qu'un appel découverte flou. Demande contexte, budget, urgence, livrable attendu et décideur.", detailEn: "A well-written Tally form beats a vague discovery call. Ask context, budget, urgency, expected deliverable, and decision-maker." },
    { title: "À éviter", titleEn: "Avoid", detail: "Ne prends pas CRM, outil projet complet et newsletter avant d'avoir un canal d'acquisition stable.", detailEn: "Do not take CRM, full project management, and newsletter tools before you have a stable acquisition channel." },
  ],
  "ecommerce-retention-support": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Shopify, GA4, Klaviyo, Gorgias et Hotjar sur pages à friction.", detailEn: "Shopify, GA4, Klaviyo, Gorgias, and Hotjar on friction pages." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Commence par trois flows Klaviyo : abandon panier, post-achat, winback.", detailEn: "Start with three Klaviyo flows: cart abandonment, post-purchase, winback." },
    { title: "À challenger", titleEn: "Challenge", detail: "Les apps Shopify ralentissent la boutique. Coupe toute app sans métrique de marge associée.", detailEn: "Shopify apps slow the store. Cut any app without an attached margin metric." },
  ],
  "designer-ui-ux-systeme-produit": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Figma, Tokens Studio, Iconify, Stark. Ajoute Content Reel seulement si tu dois remplir beaucoup d'écrans réalistes.", detailEn: "Figma, Tokens Studio, Iconify, Stark. Add Content Reel only if you need to populate many realistic screens." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Avant le handoff, vérifie tokens, contrastes, états vides, erreurs, loading et responsive.", detailEn: "Before handoff, check tokens, contrast, empty states, errors, loading, and responsive." },
    { title: "Plugin / réglage", titleEn: "Plugin / setting", detail: "Tokens Studio devient utile quand les tokens sortent de Figma vers GitHub ou plusieurs thèmes.", detailEn: "Tokens Studio becomes useful when tokens leave Figma for GitHub or multiple themes." },
  ],
  "motion-video-studio-solo": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Screen Studio pour les démos produit, CapCut pour les formats sociaux, DaVinci Resolve pour le montage propre.", detailEn: "Screen Studio for product demos, CapCut for social formats, DaVinci Resolve for clean editing." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Décide le format de sortie avant l'outil : vidéo sociale, démo produit, Lottie web ou animation interactive.", detailEn: "Choose the output format before the tool: social video, product demo, web Lottie, or interactive animation." },
    { title: "Plugins / crédits", titleEn: "Plugins / credits", detail: "Bodymovin est utile si After Effects exporte vers le web. Rive est meilleur pour les animations avec états.", detailEn: "Bodymovin is useful when After Effects exports to web. Rive is better for state-based animations." },
  ],
  "consultant-revops-pipeline": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Pipedrive pour le pipe, Folk pour le réseau, Calendly pour la prise de rendez-vous, Notion pour la livraison.", detailEn: "Pipedrive for pipeline, Folk for network, Calendly for scheduling, Notion for delivery." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Sépare opportunité et mission. Le CRM s'arrête à la signature ; la mission commence dans Notion.", detailEn: "Separate opportunity and engagement. CRM stops at signature; delivery starts in Notion." },
    { title: "À challenger", titleEn: "Challenge", detail: "Aircall et DocuSign sont des outils de volume ou de preuve. S'ils ne changent pas le taux de closing, ils attendent.", detailEn: "Aircall and DocuSign are volume or proof tools. If they do not change close rate, they can wait." },
  ],
};

const EXPERT_TIPS_BY_PERSONA: Record<StackPersona, StackInsight[]> = {
  dev:       EXPERT_TIPS_BY_STACK["developpeur-freelance-shipper"],
  designer:  EXPERT_TIPS_BY_STACK["designer-freelance-solo"],
  consultant:EXPERT_TIPS_BY_STACK["consultant-b2b-propre"],
  content:   EXPERT_TIPS_BY_STACK["createur-contenu-operateur"],
  ops:       EXPERT_TIPS_BY_STACK["ops-manager-fractional-coo"],
  solo:      EXPERT_TIPS_BY_STACK["freelance-solo-zero-bloat"],
};

/* ─── Budget value/unit split helper ────────────────────────────────────── */
function splitBudget(s: string): { main: string; unit: string } | null {
  // "118€/mois" → { main: "118€", unit: "/mois" }
  // "420€/mois" → { main: "420€", unit: "/mois" }
  const m = s.match(/^(.+?)(\/\S+)$/);
  return m ? { main: m[1], unit: m[2] } : null;
}

/* ─── Hero cluster layout ───────────────────────────────────────────────── */
// Hand-placed on a 440×380 canvas (centre points, icon size, tilt) so the
// cluster never overlaps and reads the same for every stack.
const HERO_CLUSTER_SLOTS = [
  { x: 220, y: 190, s: 124, r: -6 },
  { x: 92, y: 92, s: 84, r: 8 },
  { x: 350, y: 84, s: 88, r: -9 },
  { x: 72, y: 272, s: 76, r: -7 },
  { x: 368, y: 290, s: 84, r: 6 },
  { x: 226, y: 42, s: 62, r: 5 },
  { x: 222, y: 338, s: 66, r: -4 },
  { x: 398, y: 186, s: 58, r: 10 },
  { x: 44, y: 180, s: 54, r: -10 },
  { x: 136, y: 344, s: 50, r: 7 },
  { x: 306, y: 350, s: 50, r: -8 },
];

/* ─── Main component ─────────────────────────────────────────────────────── */
const StackDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang, prefix } = useLang();
  const { tools } = useToolSummaries();
  const resolvedSlug =
    slug === "sites-ia-automation" ? "createur-sites-ia-automation" :
    slug === "consultant-b2b" ? "consultant-b2b-propre" :
    slug;
  const { stack, loading } = useStackBySlug(resolvedSlug);
  // Budget card: which chart is shown, and which tool is highlighted across
  // chart and legend.
  const [budgetView, setBudgetView] = useState<"share" | "target">("share");
  const [budgetFocus, setBudgetFocus] = useState<string | null>(null);
  const toolBySlug = useMemo(() => new Map(tools.map((tool) => [tool.slug || tool.id, tool])), [tools]);

  // Must be before conditional return (hooks rules)
  const relatedStacks = useMemo(() => {
    if (!stack) return [];
    const summaries = stackCatalog.stacks;
    const samePersona = summaries.filter((s) => s.slug !== stack.slug && s.persona === stack.persona);
    if (samePersona.length >= 3) return samePersona.slice(0, 3);
    const fill = summaries.filter((s) => s.slug !== stack.slug && s.persona !== stack.persona);
    return [...samePersona, ...fill].slice(0, 3);
  }, [stack]);

  useEffect(() => {
    if (!stack) return;
    const title = lang === "fr"
      ? fitBrandedTitle(stack.seoTitle || `${stack.title} : outils, usages et budget`)
      : fitBrandedTitle(stack.seoTitleEn || `${stack.titleEn}: tools, use cases and budget`);
    const description = getStackMetaDescription(stack, lang);
    setSeoTags({ title, description, url: `${SEO_BASE}/${lang}/stacks/${stack.slug}`, locale: lang === "fr" ? "fr_FR" : "en_US" });
    setHreflang(`/${lang}/stacks/${stack.slug}`);
    setJsonLd("stack-detail-jsonld", {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description,
      url: `${SEO_BASE}/${lang}/stacks/${stack.slug}`,
      about: asArray(stack.tools).map((slot) => toolBySlug.get(slot.slug)?.name || slot.slug),
    });
    // Structured data must match the visible editorial FAQ, including overrides.
    const faqEntries = (EDITORIAL_REGISTRY[stack.slug] ?? buildFallbackEditorial(stack)).faq.map((cp) => ({
      q: lang === "fr" ? cp.q : cp.qEn,
      a: lang === "fr" ? cp.a : cp.aEn,
    }));
    if (faqEntries.length > 0) {
      setJsonLd("stack-detail-faq-jsonld", {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqEntries.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      });
    }
    return () => cleanupSeo(["stack-detail-jsonld", "stack-detail-faq-jsonld"]);
  }, [lang, stack, toolBySlug]);

  if (loading) {
    return <main className="min-h-screen bg-background" aria-busy="true" />;
  }
  if (!stack) return <Navigate to={`${prefix}/stacks`} replace />;

  /* ── Derived data ───────────────────────────────────────────────────────── */
  const editorial = EDITORIAL_REGISTRY[stack.slug] ?? buildFallbackEditorial(stack);
  const heroDecision = getHeroDecisionMap(stack, editorial, lang);
  const detailTitle = heroDecision.title.split("\n")[0].replace(/\.$/, "");
  const heroSubtitle = heroDecision.promise;
  const personaText = t(personaLabel(stack.persona, "fr"), personaLabel(stack.persona, "en"));

  const stackTools = asArray(stack.tools).map((slot) => ({ slot, tool: toolBySlug.get(slot.slug) })).filter((item) => item.tool);

  // Budget breakdown from the catalogue: each non-conditional tool at its
  // first paid plan. A 0 on a "Prix non public" tool means unknown, never
  // free, so those are listed but not summed.
  const fmtMoney = (eur: number) => lang === "fr" ? `${Math.round(eur)} €` : usdFromEur(eur);
  const budgetLines = asArray(stack.tools).map((slot) => {
    const tool = toolBySlug.get(slot.slug) as (ToolSummary & { priceUndisclosed?: boolean }) | undefined;
    const price = Number(tool?.compareMonthlyPrice) || 0;
    const pricing = tool?.pricing as { free?: string } | string | undefined;
    const pricingText = typeof pricing === "string" ? pricing : [pricing?.free, (pricing as { paid?: string } | undefined)?.paid].filter(Boolean).join(" ");
    // Stripe-like tools: no subscription, a cut of each transaction. Not free.
    const usageBased = /%|commission|par transaction|per transaction|à l'usage|pay[- ]as[- ]you[- ]go/i.test(pricingText);
    const free = !price && !tool?.priceUndisclosed && !usageBased && typeof pricing === "object" && hasGenuineFreeTier(pricing?.free);
    const kind = price > 0 ? "paid" : tool?.priceUndisclosed ? "undisclosed" : usageBased ? "usage" : free ? "free" : "variable";
    return { slot, tool, price, kind, optional: slot.decision === "conditional" };
  }).filter((line) => line.tool);
  const coreLines = budgetLines.filter((line) => !line.optional).sort((a, b) => b.price - a.price);
  const optionalLines = budgetLines.filter((line) => line.optional);
  const catalogueTotal = coreLines.reduce((sum, line) => sum + line.price, 0);
  const pricedLines = coreLines.filter((line) => line.price > 0);
  const barScale = Math.max(catalogueTotal, stack.monthlyBudget, 1);
  // One continuous ramp, priciest tool darkest, so the legend reads in order.
  const shadeFor = (i: number) => pricedLines.length > 1 ? 1 - (i / (pricedLines.length - 1)) * 0.72 : 1;
  const unpricedCount = coreLines.filter((line) => line.kind === "undisclosed" || line.kind === "variable" || line.kind === "usage").length;
  const priceLabel = (line: (typeof budgetLines)[number]) =>
    line.kind === "paid" ? fmtMoney(line.price)
      : line.kind === "free" ? t("Gratuit", "Free")
      : line.kind === "undisclosed" ? t("Non communiqué", "Not public")
      : line.kind === "usage" ? t("À l'usage", "Usage-based")
      : t("Variable", "Varies");
  // Up to 11 apps in the cluster; beyond that the last slot becomes "+N".
  const clusterApps = stackTools.length > HERO_CLUSTER_SLOTS.length ? stackTools.slice(0, HERO_CLUSTER_SLOTS.length - 1) : stackTools;
  const clusterOverflow = stackTools.length - clusterApps.length;

  const hasRisks = editorial.risks.length > 0;
  const hasAltVariants = editorial.altVariants.length > 0;


  return (
    <article className="sg-page">
      <Breadcrumb items={[{ label: "Stacks", href: `${prefix}/stacks` }, { label: detailTitle }]} />
      <header className="sg-hero sg-hero--cluster">
        <div className="sg-hero-copy">
          <span className="sg-hero-pill">{personaText}</span>
          <h1>{detailTitle}</h1>
          <p className="sg-lead">{heroSubtitle}</p>
          {/* App Store info strip: label, value, caption, hairline dividers. */}
          <dl className="sg-stats">
            <div><dt>{t("Sélection", "Selection")}</dt><dd>{stack.tools.length}</dd><span>{optionalLines.length > 0 ? t(`dont ${optionalLines.length} en option`, `${optionalLines.length} optional`) : t("outils", "tools")}</span></div>
            <div><dt>{t("Budget cible", "Target budget")}</dt><dd>{stack.monthlyBudget > 0 ? fmtMoney(stack.monthlyBudget) : t("Gratuit", "Free")}</dd><span>{stack.monthlyBudget > 0 ? t("par mois", "per month") : t("plans gratuits", "free plans")}</span></div>
            <div><dt>{t("Profil", "Profile")}</dt><dd className="sg-stats-word">{t(stageLabel(stack.stage, "fr"), stageLabel(stack.stage, "en"))}</dd><span>{t("stade d'activité", "business stage")}</span></div>
          </dl>
        </div>
        {/* Signature visual: each app of the stack once, as a composed cluster
            (App Store bundle artwork). The lead tool sits at the centre; the
            others orbit at varied sizes and angles. Each is a jump link. */}
        <div className="sg-cluster" aria-label={t("Outils de cette stack", "Tools in this stack")}>
          {clusterApps.map(({ slot, tool }, i) => {
            const pos = HERO_CLUSTER_SLOTS[i];
            return <a key={slot.slug} href={`#outil-${slot.slug}`} className="sg-cluster-app" title={tool!.name}
              style={{ left: `${(pos.x / 440) * 100}%`, top: `${(pos.y / 380) * 100}%`, width: `${(pos.s / 440) * 100}%`, aspectRatio: "1", ["--r" as string]: `${pos.r}deg`, animationDelay: `${-i * 0.7}s` }}>
              <ToolLogo tool={tool!} size={pos.s} className="sg-cluster-icon" /><span className="sr-only">{tool!.name}</span>
            </a>;
          })}
          {clusterOverflow > 0 && <a href="#outils" className="sg-cluster-more" style={{ left: `${(HERO_CLUSTER_SLOTS[clusterApps.length].x / 440) * 100}%`, top: `${(HERO_CLUSTER_SLOTS[clusterApps.length].y / 380) * 100}%` }}>+{clusterOverflow}</a>}
        </div>
      </header>

      <section id="outils" className="sg-section">
        <div className="sg-section-heading"><span className="sg-eyebrow">01 / {t("La sélection", "The selection")}</span><h2>{t("Quel outil pour quoi ?", "Which tool does what?")}</h2></div>
        {/* App Store list: one link per row (the whole row), icon, role as
            eyebrow, name, reason. The name link + arrow link pair it
            replaces sent two links to the same fiche from every row. */}
        <ul className="sg-apps">
          {asArray(stack.tools).map((slot) => {
            const tool = toolBySlug.get(slot.slug);
            const status = slot.decision === "core" ? t("Socle", "Core") : slot.decision === "conditional" ? t("Selon vos besoins", "If needed") : slot.decision === "challenge" ? t("À réévaluer", "Reassess") : null;
            const body = <>
              <ToolLogo tool={tool ?? { name: slot.slug, slug: slot.slug }} size={56} className="sg-app-icon" />
              <span className="sg-app-body">
                <span className="sg-app-role">{t(slot.role, slot.roleEn)}{status && <span className="sg-app-status">{status}</span>}</span>
                <h3 className="sg-app-name">{tool?.name ?? slot.slug}</h3>
                <span className="sg-app-reason">{t(slot.reason, slot.reasonEn)}</span>
                {slot.tip && <span className="sg-app-tip">{t(slot.tip, slot.tipEn || slot.tip)}</span>}
              </span>
              {tool && <ChevronRight size={18} className="sg-app-chevron" aria-hidden />}
            </>;
            return <li key={slot.slug} id={`outil-${slot.slug}`} className="sg-apps-item">
              {tool
                ? <Link className="sg-app" to={`${prefix}/tool/${tool.slug || tool.id}`}>{body}</Link>
                : <div className="sg-app">{body}</div>}
            </li>;
          })}
        </ul>
      </section>

      <section id="avis" className="sg-section">
        <div className="sg-section-heading"><span className="sg-eyebrow">02 / {t("Le choix ToolTrim", "ToolTrim's take")}</span><h2>{t("Pourquoi cette combinaison ?", "Why these tools together?")}</h2></div>
        <div className="sg-editorial"><p>{t(editorial.overviewIntro, editorial.overviewIntroEn)}</p></div>
        <div className="sg-fit-grid">
          <div><h3>{t("Adaptée si…", "A good fit if…")}</h3><p>{t(editorial.overviewServes, editorial.overviewServesEn)}</p></div>
          <div><h3>{t("À éviter si…", "Look elsewhere if…")}</h3><p>{t(editorial.overviewNotFor, editorial.overviewNotForEn)}</p></div>
        </div>
        {asArray(stack.needs).length > 0 && <div className="sg-insights">{asArray(stack.needs).map((need, i) => <div key={i}><h3>{t(need.title, need.titleEn)}</h3><p>{t(need.detail, need.detailEn)}</p></div>)}</div>}
      </section>

      <section id="budget" className="sg-section sg-budget">
        <div className="sg-section-heading"><span className="sg-eyebrow">03 / Budget</span><h2>{t("Combien prévoir ?", "What should you budget?")}</h2></div>
        <div className="sg-budget-card">
          <div className="sg-budget-figures">
            <div className="sg-budget-figure sg-budget-figure--target">
              <span>{t("Budget cible", "Target budget")}</span>
              <strong>{stack.monthlyBudget > 0 ? fmtMoney(stack.monthlyBudget) : t("Gratuit", "Free")}</strong>
              <small>{t("par mois, pour démarrer", "per month, to get started")}</small>
            </div>
            {catalogueTotal > 0 && <div className="sg-budget-figure">
              <span>{t("Socle au prix catalogue", "Core at list price")}</span>
              <strong>{fmtMoney(catalogueTotal)}</strong>
              <small>{t(`par mois, ${coreLines.length} outils au premier plan payant`, `per month, ${coreLines.length} tools on their first paid plan`)}</small>
            </div>}
          </div>
          {catalogueTotal > 0 && pricedLines.length > 1 && (
            <div className="sg-budget-switch" role="tablist" aria-label={t("Visualisation du budget", "Budget chart")}>
              {([["share", t("Répartition", "Breakdown")], ["target", t("Écart à la cible", "Gap to target")]] as const).map(([key, label]) => (
                <button key={key} type="button" role="tab" aria-selected={budgetView === key} className="sg-budget-switch-tab" onClick={() => setBudgetView(key)}>{label}</button>
              ))}
            </div>
          )}
          <div className={`sg-budget-viz sg-budget-viz--${catalogueTotal > 0 && pricedLines.length > 1 ? budgetView : "target"}`} onMouseLeave={() => setBudgetFocus(null)}>
            {/* Breakdown: a ring, one arc per priced core tool, total inside. */}
            {catalogueTotal > 0 && pricedLines.length > 1 && budgetView === "share" && (() => {
              const r = 76, c = 2 * Math.PI * r, gap = 3;
              let offset = 0;
              return <svg className="sg-donut" viewBox="0 0 200 200" role="img" aria-label={t(`Répartition du socle : ${fmtMoney(catalogueTotal)} par mois`, `Core breakdown: ${fmtMoney(catalogueTotal)} per month`)}>
                <g transform="rotate(-90 100 100)">
                  {pricedLines.map((line, i) => {
                    const len = (line.price / catalogueTotal) * c;
                    const seg = <circle key={line.slot.slug} cx="100" cy="100" r={r} fill="none" strokeWidth="26"
                      className={`sg-donut-seg${budgetFocus && budgetFocus !== line.slot.slug ? " is-dim" : ""}${budgetFocus === line.slot.slug ? " is-focus" : ""}`}
                      style={{ opacity: shadeFor(i) }} strokeDasharray={`${Math.max(0.5, len - gap)} ${c}`} strokeDashoffset={-offset}
                      onMouseEnter={() => setBudgetFocus(line.slot.slug)}><title>{`${line.tool!.name} · ${fmtMoney(line.price)} (${Math.round((line.price / catalogueTotal) * 100)} %)`}</title></circle>;
                    offset += len;
                    return seg;
                  })}
                </g>
                {(() => {
                  const focus = pricedLines.find((line) => line.slot.slug === budgetFocus);
                  return <>
                    <text x="100" y="96" textAnchor="middle" className="sg-donut-value">{fmtMoney(focus ? focus.price : catalogueTotal)}</text>
                    <text x="100" y="118" textAnchor="middle" className="sg-donut-label">{focus ? `${focus.tool!.name} · ${Math.round((focus.price / catalogueTotal) * 100)} %` : t("par mois", "per month")}</text>
                  </>;
                })()}
              </svg>;
            })()}
            {/* Gap to target: iPhone Storage bar with a marker at the target. */}
            {catalogueTotal > 0 && (budgetView === "target" || pricedLines.length <= 1) && <div className="sg-storage">
              <div className="sg-storage-bar" role="img" aria-label={t(`Socle au prix catalogue : ${fmtMoney(catalogueTotal)} par mois, budget cible : ${fmtMoney(stack.monthlyBudget)}`, `Core at list price: ${fmtMoney(catalogueTotal)} per month, target budget: ${fmtMoney(stack.monthlyBudget)}`)}>
                {pricedLines.map((line, i) => (
                  <span key={line.slot.slug} className={`sg-storage-seg${budgetFocus && budgetFocus !== line.slot.slug ? " is-dim" : ""}`} style={{ width: `${(line.price / barScale) * 100}%`, opacity: shadeFor(i) }} title={`${line.tool!.name} · ${fmtMoney(line.price)}`} onMouseEnter={() => setBudgetFocus(line.slot.slug)} />
                ))}
                {stack.monthlyBudget > 0 && <span className="sg-storage-target" style={{ left: `${Math.min(100, (stack.monthlyBudget / barScale) * 100)}%` }}><span>{t("Cible", "Target")} {fmtMoney(stack.monthlyBudget)}</span></span>}
              </div>
              <div className="sg-storage-scale" aria-hidden><span>0</span><span>{fmtMoney(barScale)}</span></div>
            </div>}
            <ul className="sg-storage-legend">
              {[...coreLines, ...optionalLines].map((line) => {
                const shade = pricedLines.findIndex((p) => p.slot.slug === line.slot.slug);
                const cls = [line.optional || shade < 0 ? "is-muted" : "", budgetFocus === line.slot.slug ? "is-focus" : "", budgetFocus && budgetFocus !== line.slot.slug ? "is-dim" : ""].filter(Boolean).join(" ");
                return <li key={line.slot.slug} className={cls || undefined} onMouseEnter={() => shade >= 0 && setBudgetFocus(line.slot.slug)}>
                  <span className={`sg-storage-dot${shade < 0 ? " sg-storage-dot--empty" : ""}`} style={shade >= 0 ? { opacity: shadeFor(shade) } : undefined} aria-hidden />
                  <ToolLogo tool={line.tool!} size={24} className="sg-budget-logo" />
                  <span className="sg-budget-name">{line.tool!.name}{line.optional && <em>{t("en option", "optional")}</em>}</span>
                  <span className="sg-budget-value">{priceLabel(line)}</span>
                </li>;
              })}
            </ul>
          </div>
          <p className="sg-budget-note">
            {t(
              `Le budget cible est l'enveloppe recommandée pour démarrer. Le prix catalogue additionne le premier plan payant de chaque outil du socle${unpricedCount > 0 ? `, hors ${unpricedCount} outil${unpricedCount > 1 ? "s" : ""} sans prix fixe` : ""}. Les outils en option n'y sont pas comptés.`,
              `The target budget is the recommended starting envelope. The list price adds up each core tool's first paid plan${unpricedCount > 0 ? `, excluding ${unpricedCount} tool${unpricedCount > 1 ? "s" : ""} without a fixed price` : ""}. Optional tools are not included.`,
            )}
          </p>
        </div>
        {EDITORIAL_REGISTRY[stack.slug] && <div className="sg-insights">{editorial.budgetRows.map((row, i) => <div key={i}><h3>{t(row.tier, row.tierEn)}</h3><strong>{lang === "fr" ? row.amount : row.amount.replace("/mois", "/month").replace("IA", "AI")}</strong><p>{t(row.desc, row.descEn)}</p></div>)}</div>}
      </section>

      {(hasRisks || stack.risk || asArray(stack.maturitySignals).length > 0) && <section id="limites" className="sg-section">
        <div className="sg-section-heading"><span className="sg-eyebrow">04 / {t("Les arbitrages", "Trade-offs")}</span><h2>{t("Ce qui mérite votre attention", "What to watch out for")}</h2></div>
        {stack.risk && <div className="sg-risk-card">
          <AlertTriangle size={22} aria-hidden />
          <span className="sg-risk-label">{t("Le piège de cette stack", "The trap in this stack")}</span>
          <p>{t(stack.risk, stack.riskEn)}</p>
        </div>}
        {(editorial.risks.length > 0 || asArray(stack.maturitySignals).length > 0) && <ul className="sg-watch">
          {editorial.risks.map((risk, i) => <li key={i}><CircleAlert size={18} aria-hidden /><div><h3>{t(risk.problem, risk.problemEn)}</h3><p>{t(risk.consequence, risk.consequenceEn)}</p>{EDITORIAL_REGISTRY[stack.slug] && <p className="sg-watch-reco">{t(risk.reco, risk.recoEn)}</p>}</div></li>)}
          {asArray(stack.maturitySignals).map((signal, i) => <li key={`signal-${i}`}><Target size={18} aria-hidden /><div><h3>{t(signal.title, signal.titleEn)}</h3><p>{t(signal.detail, signal.detailEn)}</p></div></li>)}
        </ul>}
      </section>}

      {hasAltVariants && <section id="alternatives" className="sg-section"><div className="sg-section-heading"><h2>{t(editorial.altsTitle, editorial.altsTitleEn)}</h2></div><div className="sg-insights">{editorial.altVariants.map((variant, i) => <div key={i}><span className="sg-eyebrow">{t(variant.label, variant.labelEn)}</span><h3>{t(variant.title, variant.titleEn)}</h3><strong>{lang === "fr" ? variant.budget : variant.budget.replace("/mois", "/month").replace("Gratuit", "Free")}</strong><p>{t(variant.toolsDesc, variant.toolsDescEn)}</p><p>{t(variant.compromise, variant.compromiseEn)}</p></div>)}</div></section>}

      {editorial.faq.length > 0 && (EDITORIAL_REGISTRY[stack.slug]
        ? <section id="faq" className="sg-section"><div className="sg-section-heading"><h2>{t("Questions fréquentes", "Frequently asked questions")}</h2></div><div className="sd-faq-list">{editorial.faq.map((item, i) => <details key={`${stack.slug}-${i}`} className="sd-faq-item"><summary className="sd-faq-summary">{t(item.q, item.qEn)}<ChevronDown size={16} className="sd-faq-icon" /></summary><p className="sd-faq-answer">{t(item.a, item.aEn)}</p></details>)}</div></section>
        /* Without a dedicated editorial, the "FAQ" is the stack's self-check
           questions ("Do you know your pipeline value?" → "No: …"). Hidden in
           accordions they read as odd FAQs; shown open they are the most
           practical part of the page. */
        : <section id="faq" className="sg-section"><div className="sg-section-heading"><span className="sg-eyebrow">{t("Autodiagnostic", "Self-check")}</span><h2>{t("Les questions à te poser", "Questions to ask yourself")}</h2></div><ol className="sg-checks">{editorial.faq.map((item, i) => <li key={`${stack.slug}-${i}`} className="sg-check"><span className="sg-check-index" aria-hidden>{i + 1}</span><div><h3>{t(item.q, item.qEn)}</h3><p>{t(item.a, item.aEn)}</p></div></li>)}</ol></section>)}

      {relatedStacks.length > 0 && <section className="sg-section"><div className="sg-section-heading"><h2>{t("D’autres stacks à explorer", "More stacks to explore")}</h2></div>
        <ul className="sg-related">
          {relatedStacks.map((related) => <li key={related.slug}>
            <Link to={`${prefix}/stacks/${related.slug}`} className="sg-related-card">
              {/* Same iOS-folder cluster as the homepage stacks. */}
              <span className="sgs-folder" aria-hidden>
                {asArray(related.tools).slice(0, 4).map((slot) => { const tool = toolBySlug.get(slot.slug); return tool ? <span key={slot.slug} className="sgs-folder-app"><ToolLogo tool={tool} size={32} className="sgs-folder-logo" /></span> : null; })}
              </span>
              <span className="sg-related-copy">
                <span className="sg-related-name">{t(related.title, related.titleEn)}</span>
                <span className="sg-related-sub">{t(related.subtitle, related.subtitleEn)}</span>
              </span>
            </Link>
          </li>)}
        </ul>
      </section>}

    </article>
  );
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function personaLabel(persona: StackPersona, locale: "fr" | "en") {
  const item = STACK_PERSONAS.find((option) => option.value === persona);
  return locale === "fr" ? item?.label || persona : item?.labelEn || persona;
}
function subProfileLabel(subProfile: string, locale: "fr" | "en") {
  const item = STACK_SUB_PROFILES.find((option) => option.value === subProfile);
  return locale === "fr" ? item?.label || subProfile : item?.labelEn || subProfile;
}
function stageLabel(stage: StackStage, locale: "fr" | "en") {
  const item = STACK_STAGES.find((option) => option.value === stage);
  return locale === "fr" ? item?.label || stage : item?.labelEn || stage;
}
function getDecisionOrder(slot: StackToolSlot): number {
  const key = getToolDecisionStatus(slot).key;
  if (key === "core") return 0;
  if (key === "conditional") return 1;
  return 2;
}
function sortToolsByDecision<T extends { slot: StackToolSlot }>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => getDecisionOrder(a.item.slot) - getDecisionOrder(b.item.slot) || a.index - b.index)
    .map(({ item }) => item);
}
function getLayerDecisionSummary(items: { slot: StackToolSlot }[]) {
  return items.reduce((acc, item) => {
    const key = getToolDecisionStatus(item.slot).key;
    acc[key] += 1;
    return acc;
  }, { core: 0, conditional: 0, challenge: 0 });
}
function shouldShowWorkflowWatch(summary: { core: number; conditional: number; challenge: number }, total: number): boolean {
  if (total === 0) return false;
  return summary.conditional + summary.challenge >= summary.core || total > 5;
}
function getLayerPurpose(layerId: string, locale: "fr" | "en"): string {
  const purposes: Record<string, { fr: string; en: string }> = {
    sell: { fr: "Capturer les demandes, organiser les rendez-vous et qualifier les missions.", en: "Capture requests, organize calls, and qualify projects." },
    create: { fr: "Produire, présenter et livrer les éléments qui font avancer le projet.", en: "Produce, present, and deliver the assets that move the project forward." },
    money: { fr: "Facturer, encaisser et garder les documents au propre.", en: "Invoice, collect payments, and keep documents clean." },
    ops: { fr: "Réduire les tâches répétitives sans automatiser trop tôt.", en: "Reduce repetitive tasks without automating too early." },
    measure: { fr: "Mesurer, suivre et comprendre ce qui fonctionne vraiment.", en: "Measure, track, and understand what actually works." },
    code: { fr: "Coder, versionner et garder une base livrable.", en: "Code, version, and keep a shippable base." },
    preview: { fr: "Montrer rapidement une version claire au client.", en: "Show a clear version to the client quickly." },
    docs: { fr: "Centraliser le brief, les décisions et les traces projet.", en: "Centralize the brief, decisions, and project trail." },
    payment: { fr: "Encaisser sans installer une couche finance trop lourde.", en: "Get paid without installing a heavy finance layer." },
    tasks: { fr: "Suivre les tâches sans transformer la mission en usine produit.", en: "Track tasks without turning the project into a product factory." },
    ai: { fr: "Accélérer le travail sans multiplier les copilotes redondants.", en: "Speed up work without multiplying redundant copilots." },
    automation: { fr: "Automatiser seulement les gestes déjà répétés.", en: "Automate only steps that are already repeated." },
    other: { fr: "Regrouper les outils qui servent cette étape du workflow.", en: "Group the tools that support this workflow step." },
  };
  const purpose = purposes[layerId] ?? purposes.other;
  return locale === "fr" ? purpose.fr : purpose.en;
}
interface WorkflowStepDefinition {
  id: string;
  titleFr: string;
  titleEn: string;
  purposeFr: string;
  purposeEn: string;
  match: string[];
  slugs?: string[];
}

type WorkflowStep = WorkflowStepDefinition & {
  tools: Array<{ slot: StackToolSlot; tool: ToolSummary | undefined }>;
};

interface StackMapFamilyDefinition {
  id: string;
  titleFr: string;
  titleEn: string;
  purposeFr: string;
  purposeEn: string;
  stepIds: string[];
}

type StackMapFamily = StackMapFamilyDefinition & {
  tools: Array<{ slot: StackToolSlot; tool: ToolSummary | undefined }>;
};

const STACK_MAP_FAMILIES_BY_STACK: Record<string, StackMapFamilyDefinition[]> = {
  "developpeur-freelance-shipper": [
    { id: "code-version", titleFr: "Coder & versionner", titleEn: "Code & version", purposeFr: "Produire le projet et garder un historique propre.", purposeEn: "Produce the project and keep a clean history.", stepIds: ["coder", "versionner"] },
    { id: "client-preview", titleFr: "Montrer au client", titleEn: "Show the client", purposeFr: "Partager une version accessible sans mettre en place une usine produit.", purposeEn: "Share an accessible version without building a product factory.", stepIds: ["preview"] },
    { id: "documentation", titleFr: "Documenter", titleEn: "Document", purposeFr: "Centraliser specs, décisions et suivi de mission.", purposeEn: "Centralize specs, decisions, and project follow-up.", stepIds: ["documenter"] },
    { id: "payment", titleFr: "Encaisser", titleEn: "Get paid", purposeFr: "Facturer et recevoir les paiements simplement.", purposeEn: "Invoice and receive payments simply.", stepIds: ["encaisser"] },
    { id: "light-tracking", titleFr: "Suivre sans s'alourdir", titleEn: "Track without bloat", purposeFr: "Organiser les tâches sans recréer une équipe produit.", purposeEn: "Organize tasks without recreating a product team.", stepIds: ["suivre"] },
    { id: "ai-automation", titleFr: "IA & automatisation", titleEn: "AI & automation", purposeFr: "Accélérer sans multiplier les copilotes ni automatiser trop tôt.", purposeEn: "Speed up without multiplying copilots or automating too early.", stepIds: ["ia", "automatiser"] },
  ],
  "architecte-interieur": [
    { id: "brief", titleFr: "Brief & cadrage", titleEn: "Brief & framing", purposeFr: "Cadrer la mission, les échanges et les décisions de départ.", purposeEn: "Frame the mission, exchanges, and initial decisions.", stepIds: ["brief"] },
    { id: "moodboard", titleFr: "Moodboard & références", titleEn: "Moodboard & references", purposeFr: "Aligner l'intention visuelle, les matières et les références.", purposeEn: "Align visual intent, materials, and references.", stepIds: ["moodboard"] },
    { id: "plans-3d", titleFr: "Plans & 3D", titleEn: "Plans & 3D", purposeFr: "Produire les documents techniques et construire le volume.", purposeEn: "Produce technical documents and build the volume.", stepIds: ["plans", "3d"] },
    { id: "render", titleFr: "Rendu & présentation", titleEn: "Render & presentation", purposeFr: "Présenter clairement les choix pour accélérer la validation.", purposeEn: "Present decisions clearly to speed up approval.", stepIds: ["rendu"] },
    { id: "sourcing-budget", titleFr: "Sourcing & budget", titleEn: "Sourcing & budget", purposeFr: "Organiser mobilier, matières, fournisseurs et coûts.", purposeEn: "Organize furniture, materials, suppliers, and costs.", stepIds: ["sourcing", "budget"] },
    { id: "approval-invoice", titleFr: "Validation & facturation", titleEn: "Approval & invoicing", purposeFr: "Sécuriser les décisions client et encaisser proprement.", purposeEn: "Secure client decisions and get paid cleanly.", stepIds: ["validation", "facturation"] },
  ],
  "designer-freelance-solo": [
    { id: "create", titleFr: "Créer", titleEn: "Create", purposeFr: "Produire les visuels, maquettes et sources de travail.", purposeEn: "Produce visuals, mockups, and source files.", stepIds: ["creer"] },
    { id: "present", titleFr: "Présenter", titleEn: "Present", purposeFr: "Montrer les pistes et rendre le feedback actionnable.", purposeEn: "Show directions and make feedback actionable.", stepIds: ["presenter"] },
    { id: "adapt", titleFr: "Décliner", titleEn: "Adapt", purposeFr: "Préparer les formats sans créer un second système créatif.", purposeEn: "Prepare formats without creating a second creative system.", stepIds: ["decliner"] },
    { id: "deliver", titleFr: "Livrer", titleEn: "Deliver", purposeFr: "Transmettre proprement les fichiers, exports et décisions.", purposeEn: "Hand off files, exports, and decisions cleanly.", stepIds: ["livrer"] },
    { id: "organize", titleFr: "Organiser", titleEn: "Organize", purposeFr: "Ranger fichiers, briefs et décisions au même endroit.", purposeEn: "Keep files, briefs, and decisions in one place.", stepIds: ["organiser"] },
    { id: "invoice-prospect", titleFr: "Facturer & prospecter", titleEn: "Invoice & prospect", purposeFr: "Encaisser et suivre les opportunités sans CRM lourd.", purposeEn: "Get paid and track opportunities without a heavy CRM.", stepIds: ["facturer", "prospecter"] },
    { id: "ai-automation", titleFr: "IA & automatisation", titleEn: "AI & automation", purposeFr: "Réduire les tâches répétitives sans multiplier les abonnements.", purposeEn: "Reduce repetitive tasks without multiplying subscriptions.", stepIds: ["automatiser"] },
  ],
};

const WORKFLOW_STEPS_BY_STACK: Record<string, WorkflowStepDefinition[]> = {
  "architecte-interieur": [
    { id: "brief", titleFr: "Brief", titleEn: "Brief", purposeFr: "Cadrer la mission.", purposeEn: "Frame the mission.", match: ["brief", "ia structure", "projet / décisions", "fichiers / emails", "rendez-vous"], slugs: ["notion", "google-workspace", "chatgpt", "calendly"] },
    { id: "moodboard", titleFr: "Moodboard", titleEn: "Moodboard", purposeFr: "Aligner l'intention visuelle.", purposeEn: "Align the visual intent.", match: ["moodboard", "recherche visuelle", "bibliothèque images", "exploration visuelle", "ia ambiance", "retouche image"], slugs: ["milanote", "pinterest", "eagle", "krea-ai", "midjourney", "adobe-photoshop", "indesign"] },
    { id: "plans", titleFr: "Plans", titleEn: "Plans", purposeFr: "Produire les documents techniques.", purposeEn: "Produce technical documents.", match: ["plans", "2d", "dwg", "layout"], slugs: ["layout-sketchup", "autocad-lt"] },
    { id: "3d", titleFr: "3D", titleEn: "3D", purposeFr: "Construire le volume.", purposeEn: "Build the volume.", match: ["3d", "modélisation", "plugin", "hygiène", "géométrie", "formes complexes", "bim", "imports"], slugs: ["sketchup-pro", "fredo6-bundle", "profile-builder-3", "transmutr", "skatter", "cleanup3", "solid-inspector2", "rhino", "revit", "archicad", "blender"] },
    { id: "rendu", titleFr: "Rendu", titleEn: "Render", purposeFr: "Présenter clairement.", purposeEn: "Present clearly.", match: ["rendu", "image premium", "vidéo / ambiance", "upscale"], slugs: ["d5-render", "enscape", "v-ray", "twinmotion", "magnific-ai", "firefly"] },
    { id: "sourcing", titleFr: "Sourcing", titleEn: "Sourcing", purposeFr: "Organiser matières et mobilier.", purposeEn: "Organize materials and furniture.", match: ["sourcing", "ff&e"], slugs: ["programa"] },
    { id: "budget", titleFr: "Budget", titleEn: "Budget", purposeFr: "Suivre les coûts.", purposeEn: "Track costs.", match: ["budget", "projet / décisions"], slugs: ["notion", "programa"] },
    { id: "validation", titleFr: "Validation", titleEn: "Approval", purposeFr: "Sécuriser les décisions client.", purposeEn: "Secure client decisions.", match: ["validation", "explication client", "signature"], slugs: ["loom", "yousign", "notion"] },
    { id: "facturation", titleFr: "Facturation", titleEn: "Invoicing", purposeFr: "Encaisser proprement.", purposeEn: "Get paid cleanly.", match: ["facturation", "compte pro", "compta"], slugs: ["indy", "qonto", "shine", "pennylane"] },
  ],
  "developpeur-freelance-shipper": [
    { id: "coder", titleFr: "Coder", titleEn: "Code", purposeFr: "Produire le projet.", purposeEn: "Produce the project.", match: ["code"], slugs: ["chatgpt"] },
    { id: "versionner", titleFr: "Versionner", titleEn: "Version", purposeFr: "Garder un historique propre.", purposeEn: "Keep a clean history.", match: ["repo", "github"], slugs: ["github"] },
    { id: "preview", titleFr: "Preview client", titleEn: "Client preview", purposeFr: "Montrer une version accessible.", purposeEn: "Show an accessible version.", match: ["preview", "déploiement", "deployment"], slugs: ["vercel"] },
    { id: "documenter", titleFr: "Documenter", titleEn: "Document", purposeFr: "Centraliser specs et décisions.", purposeEn: "Centralize specs and decisions.", match: ["base", "workspace", "documentation"], slugs: ["notion"] },
    { id: "encaisser", titleFr: "Encaisser", titleEn: "Get paid", purposeFr: "Facturer et recevoir les paiements.", purposeEn: "Invoice and receive payments.", match: ["paiement", "payment"], slugs: ["stripe"] },
    { id: "suivre", titleFr: "Suivre", titleEn: "Track", purposeFr: "Organiser les tâches.", purposeEn: "Organize tasks.", match: ["projet", "tasks", "tâches"], slugs: [] },
    { id: "ia", titleFr: "IA", titleEn: "AI", purposeFr: "Accélérer sans multiplier les copilotes.", purposeEn: "Speed up without multiplying copilots.", match: ["ia", "ai", "assistant"], slugs: ["chatgpt"] },
    { id: "automatiser", titleFr: "Automatiser", titleEn: "Automate", purposeFr: "Éviter les répétitions utiles.", purposeEn: "Avoid useful repetitions.", match: ["automatisation", "automation"], slugs: [] },
  ],
  "designer-freelance-solo": [
    { id: "creer", titleFr: "Créer", titleEn: "Create", purposeFr: "Produire les visuels.", purposeEn: "Produce visuals.", match: ["design", "visuels", "créative", "vectoriel", "photo", "ia rédaction"], slugs: ["figma", "figma-tokens", "figma-iconify", "figma-stark", "canva", "adobe-photoshop", "adobe-illustrator", "adobe-lightroom", "chatgpt"] },
    { id: "presenter", titleFr: "Présenter", titleEn: "Present", purposeFr: "Montrer les pistes.", purposeEn: "Show directions.", match: ["atelier", "prototype", "feedback"], slugs: ["miro", "framer", "loom"] },
    { id: "decliner", titleFr: "Décliner", titleEn: "Adapt", purposeFr: "Préparer les formats.", purposeEn: "Prepare formats.", match: ["visuels rapides", "plugin"], slugs: ["canva", "figma-iconify", "figma-tokens"] },
    { id: "livrer", titleFr: "Livrer", titleEn: "Deliver", purposeFr: "Transmettre proprement.", purposeEn: "Hand off cleanly.", match: ["stockage", "handoff", "documentation"], slugs: ["google-drive", "zeplin", "notion"] },
    { id: "facturer", titleFr: "Facturer", titleEn: "Invoice", purposeFr: "Encaisser.", purposeEn: "Get paid.", match: ["facturation", "paiement"], slugs: [] },
    { id: "organiser", titleFr: "Organiser", titleEn: "Organize", purposeFr: "Ranger fichiers et décisions.", purposeEn: "Organize files and decisions.", match: ["documentation", "stockage"], slugs: ["notion", "google-drive"] },
    { id: "prospecter", titleFr: "Prospecter", titleEn: "Prospect", purposeFr: "Suivre les opportunités.", purposeEn: "Track opportunities.", match: ["prospection", "crm"], slugs: [] },
    { id: "automatiser", titleFr: "Automatiser", titleEn: "Automate", purposeFr: "Réduire les tâches répétitives.", purposeEn: "Reduce repetitive tasks.", match: ["automatisation"], slugs: [] },
  ],
};

function buildWorkflowSteps(
  stack: StackGuide,
  stackTools: Array<{ slot: StackToolSlot; tool: ToolSummary | undefined }>,
  locale: "fr" | "en",
): WorkflowStep[] {
  const definitions = WORKFLOW_STEPS_BY_STACK[stack.slug];
  if (!definitions) return [];
  const assigned = new Set<string>();
  const steps = definitions.map((definition) => {
    const tools = stackTools.filter(({ slot }) => {
      if (assigned.has(slot.slug)) return false;
      const haystack = `${slot.slug} ${slot.role} ${slot.roleEn}`.toLowerCase();
      const bySlug = definition.slugs?.includes(slot.slug) ?? false;
      const byText = definition.match.some((keyword) => haystack.includes(keyword.toLowerCase()));
      return bySlug || byText;
    });
    tools.forEach(({ slot }) => assigned.add(slot.slug));
    return { ...definition, tools: sortToolsByDecision(tools) };
  });
  const unassigned = stackTools.filter(({ slot }) => !assigned.has(slot.slug));
  const usefulSteps = steps.filter((step) => step.tools.length > 0 || shouldKeepEmptyWorkflowStep(stack.slug, step.id));
  if (unassigned.length > 0) {
    usefulSteps.push({
      id: "complement",
      titleFr: "Complément",
      titleEn: "Complement",
      purposeFr: locale === "fr" ? "Outils utiles qui ne portent pas une étape principale." : "Useful tools outside the main chain.",
      purposeEn: "Useful tools outside the main chain.",
      match: [],
      tools: sortToolsByDecision(unassigned),
    });
  }
  return usefulSteps;
}

function buildFallbackWorkflowSteps(
  stack: StackGuide,
  stackTools: Array<{ slot: StackToolSlot; tool: ToolSummary | undefined }>,
  locale: "fr" | "en",
): WorkflowStep[] {
  const activeLayers = PERSONA_LAYERS[stack.persona] ?? STACK_LAYERS;
  const layersBase = activeLayers.map((layer) => ({
    ...layer,
    purposeFr: getLayerPurpose(layer.id, "fr"),
    purposeEn: getLayerPurpose(layer.id, "en"),
    tools: stackTools.filter(({ slot }) => {
      const role = `${slot.role} ${slot.roleEn}`.toLowerCase();
      return layer.match.some((keyword) => role.includes(keyword));
    }),
  })).filter((layer) => layer.tools.length > 0);
  const assignedSlugs = new Set(layersBase.flatMap((layer) => layer.tools.map(({ slot }) => slot.slug)));
  const unassignedTools = stackTools.filter(({ slot }) => !assignedSlugs.has(slot.slug));
  const fallback = layersBase.map((layer) => ({ ...layer, tools: sortToolsByDecision(layer.tools) }));
  if (unassignedTools.length > 0) {
    fallback.push({
      id: "other",
      titleFr: "Autres étapes",
      titleEn: "Other steps",
      purposeFr: locale === "fr" ? "Outils utiles qui complètent le workflow." : "Useful tools that complete the workflow.",
      purposeEn: "Useful tools that complete the workflow.",
      match: [],
      tools: sortToolsByDecision(unassignedTools),
    });
  }
  return fallback;
}

function buildStackMapFamilies(stack: StackGuide, workflowSteps: WorkflowStep[]): StackMapFamily[] {
  const definitions = STACK_MAP_FAMILIES_BY_STACK[stack.slug];
  if (!definitions) {
    return workflowSteps.map((step) => ({
      id: step.id,
      titleFr: step.titleFr,
      titleEn: step.titleEn,
      purposeFr: step.purposeFr,
      purposeEn: step.purposeEn,
      stepIds: [step.id],
      tools: step.tools,
    }));
  }

  const stepById = new Map(workflowSteps.map((step) => [step.id, step]));
  const mappedFamilies = definitions.map((definition) => {
    const tools = definition.stepIds.flatMap((stepId) => stepById.get(stepId)?.tools ?? []);
    return { ...definition, tools: sortToolsByDecision(tools) };
  });
  const assignedStepIds = new Set(definitions.flatMap((definition) => definition.stepIds));
  const remainingTools = workflowSteps
    .filter((step) => !assignedStepIds.has(step.id))
    .flatMap((step) => step.tools);

  if (remainingTools.length > 0) {
    mappedFamilies.push({
      id: "complement",
      titleFr: "Complément",
      titleEn: "Complement",
      purposeFr: "Outils utiles qui complètent la carte sans porter un bloc principal.",
      purposeEn: "Useful tools that complete the map without carrying a main block.",
      stepIds: ["complement"],
      tools: sortToolsByDecision(remainingTools),
    });
  }

  return mappedFamilies.filter((family) => family.tools.length > 0 || shouldKeepEmptyStackMapFamily(stack.slug, family.id));
}

function shouldKeepEmptyStackMapFamily(slug: string, familyId: string): boolean {
  if (slug === "developpeur-freelance-shipper") return ["light-tracking", "ai-automation"].includes(familyId);
  if (slug === "designer-freelance-solo") return ["invoice-prospect", "ai-automation"].includes(familyId);
  return false;
}

function shouldKeepEmptyWorkflowStep(slug: string, stepId: string): boolean {
  if (slug === "designer-freelance-solo") return ["facturer", "prospecter", "automatiser"].includes(stepId);
  if (slug === "developpeur-freelance-shipper") return ["suivre", "automatiser"].includes(stepId);
  return false;
}

function getDefaultWorkflowStepId(slug: string, steps: WorkflowStep[]): string {
  if (slug === "architecte-interieur") return "3d";
  if (slug === "developpeur-freelance-shipper") return "coder";
  if (slug === "designer-freelance-solo") return "creer";
  const ranked = steps
    .map((step, index) => ({
      id: step.id,
      index,
      coreCount: step.tools.filter(({ slot }) => getToolDecisionStatus(slot).key === "core").length,
    }))
    .sort((a, b) => b.coreCount - a.coreCount || a.index - b.index);
  return ranked[0]?.id ?? steps[0]?.id ?? "";
}

function getWorkflowPreviewTools<T extends { slot: StackToolSlot }>(items: T[]): T[] {
  const sorted = sortToolsByDecision(items);
  const preferred = sorted.filter((item) => getToolDecisionStatus(item.slot).key !== "challenge");
  const pool = preferred.length > 0 ? preferred : sorted;
  return pool.slice(0, 3);
}

function getWorkflowStatusGroups<T extends { slot: StackToolSlot }>(items: T[]) {
  const sorted = sortToolsByDecision(items);
  const groupDefs: Array<{ key: "core" | "conditional" | "challenge"; tools: T[] }> = [
    { key: "core", tools: [] },
    { key: "conditional", tools: [] },
    { key: "challenge", tools: [] },
  ];
  sorted.forEach((item) => {
    const key = getToolDecisionStatus(item.slot).key;
    groupDefs.find((group) => group.key === key)?.tools.push(item);
  });
  return groupDefs.filter((group) => group.tools.length > 0);
}

/* ─── Grouped recommendation helpers (2026-05-18) ───────────────────────── */
type ToolGroupKey = 'core' | 'secondary' | 'extension';

function getToolGroup(slot: StackToolSlot): ToolGroupKey {
  const d = (slot.decision ?? '').toLowerCase();
  const r = `${slot.role ?? ''} ${slot.roleEn ?? ''}`.toLowerCase();
  if (['core', 'socle', 'essential', 'keep'].includes(d)) return 'core';
  if (['challenge', 'challenger', 'avoid', 'extension'].includes(d)) return 'extension';
  if (['conditional', 'conditionnel', 'optional'].includes(d)) return 'secondary';
  // Fallback from role keywords
  const extKw = ['avancé', 'advanced', 'suite', 'backlinks', 'vectoriel', 'photo', 'crm agence'];
  if (extKw.some((k) => r.includes(k))) return 'extension';
  // Fallback from decision status key
  const key = getToolDecisionStatus(slot).key;
  if (key === 'core') return 'core';
  if (key === 'challenge') return 'extension';
  return 'secondary';
}

function groupToolsByRecommendation<T extends { slot: StackToolSlot }>(tools: T[]): { core: T[]; secondary: T[]; extension: T[] } {
  return {
    core:      tools.filter((t) => getToolGroup(t.slot) === 'core'),
    secondary: tools.filter((t) => getToolGroup(t.slot) === 'secondary'),
    extension: tools.filter((t) => getToolGroup(t.slot) === 'extension'),
  };
}

function getWorkflowDecisionCopy(
  groups: { core: Array<{ tool: ToolSummary | undefined; slot: StackToolSlot }>; secondary: Array<{ tool: ToolSummary | undefined; slot: StackToolSlot }>; extension: Array<{ tool: ToolSummary | undefined; slot: StackToolSlot }> },
  lang: string,
): string {
  const { core, secondary, extension } = groups;
  const coreNames = core.slice(0, 2).map((t) => t.tool?.name ?? t.slot.slug);
  if (lang === 'en') {
    if (core.length > 0 && (secondary.length > 0 || extension.length > 0))
      return `Core: ${coreNames.join(' + ')}. Add-ons only when the deliverable requires it.`;
    if (core.length > 0)
      return `Core: ${coreNames.join(' + ')}. Add-ons based on your actual use.`;
    if (secondary.length > 0 && core.length === 0)
      return `No mandatory core here. These become useful based on your workflow.`;
    return `Choose based on your deliverables.`;
  }
  // French
  if (core.length > 0 && (secondary.length > 0 || extension.length > 0))
    return `Socle : ${coreNames.join(' + ')}. Compléments seulement si le livrable l'exige.`;
  if (core.length > 0)
    return `Socle : ${coreNames.join(' + ')}. Compléments selon ton usage réel.`;
  if (secondary.length > 0 && core.length === 0)
    return `Aucun socle obligatoire. Ces outils deviennent utiles selon ton mode de travail.`;
  return `Choisis selon tes livrables.`;
}

function normalizeDecisionName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}
function getInitials(label: string): string {
  const words = label.replace(/\//g, " ").split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]).join("");
  return initials.toUpperCase() || "?";
}
interface HeroRepere {
  label: string;
  value: string;
}

interface HeroDecisionMap {
  title: string;
  promise: string;
  workflowSummary: string;
  watchout: string;
  reperes: HeroRepere[];
  /** Socle tool slugs for the right panel (max 4). Falls back to dynamic if empty. */
  socleSlugs: string[];
}

function getHeroDecisionMap(stack: StackGuide, editorial: StackEditorialContent, locale: "fr" | "en"): HeroDecisionMap {
  const tools = Array.isArray(stack.tools) ? stack.tools : [];
  const toolCount = tools.length;
  const stageKey = stack.stage === "starter" ? (locale === "fr" ? "débutant" : "beginner") : stack.stage === "scale" ? (locale === "fr" ? "avancé" : "advanced") : (locale === "fr" ? "installé" : "established");
  const budgetStr = stack.monthlyBudget > 0
    ? (locale === "fr" ? `${stack.monthlyBudget}€/mois` : `${usdFromEur(stack.monthlyBudget)}/mo`)
    : (locale === "fr" ? "Gratuit" : "Free");
  const watchoutFallback = locale === "fr" ? (stack.riskSnippet ?? stack.risk) : (stack.riskSnippetEn ?? stack.riskEn);
  const watchoutShort = (str: string) => String(str).split(".")[0] + (String(str).includes(".") ? "." : "");
  // Truncate dynamic values to ~40 chars — table cells must contain facts, not sentences
  const truncate = (s: string, max = 40) => s.length > max ? s.slice(0, max).trimEnd() + "…" : s;

  const fallback: HeroDecisionMap = {
    title: locale === "fr" ? stack.title : stack.titleEn,
    promise: locale === "fr" ? stack.subtitle : stack.subtitleEn,
    workflowSummary: "",
    watchout: watchoutFallback,
    reperes: locale === "fr"
      ? [
          { label: "PROFIL",            value: truncate(editorial.overviewServes) },
          { label: "BUDGET",            value: budgetStr },
          { label: "OUTILS",            value: String(toolCount) },
          { label: "NIVEAU",            value: stageKey },
          { label: "WORKFLOW",          value: truncate(locale === "fr" ? stack.subtitle : stack.subtitleEn) },
          { label: "POINT D'ATTENTION", value: truncate(watchoutShort(watchoutFallback)) },
        ]
      : [
          { label: "PROFILE",   value: truncate(editorial.overviewServesEn) },
          { label: "BUDGET",    value: budgetStr },
          { label: "TOOLS",     value: String(toolCount) },
          { label: "LEVEL",     value: stageKey },
          { label: "WORKFLOW",  value: truncate(stack.subtitleEn) },
          { label: "KEY RISK",  value: truncate(watchoutShort(watchoutFallback)) },
        ],
    socleSlugs: [],
  };

  if (stack.slug === "developpeur-freelance-shipper") {
    return locale === "fr"
      ? {
          title: "Dev freelance.",
          promise: "Coder, montrer, encaisser sans stack produit.",
          workflowSummary: "Coder → preview → documenter → encaisser",
          watchout: "Outils d’équipe trop tôt",
          reperes: [
            { label: "PROFIL",            value: "Dev freelance solo" },
            { label: "BUDGET",            value: `${stack.monthlyBudget}€/mois` },
            { label: "OUTILS",            value: String(toolCount) },
            { label: "NIVEAU",            value: stageKey },
            { label: "WORKFLOW",          value: "Coder → preview → encaisser" },
            { label: "POINT D’ATTENTION", value: "Outils d’équipe trop tôt" },
          ],
          socleSlugs: ["github", "vercel", "notion", "stripe"],
        }
      : {
          title: "Freelance dev.",
          promise: "Code, show, get paid without a product stack.",
          workflowSummary: "Code → preview → get paid",
          watchout: "Team tools too early",
          reperes: [
            { label: "PROFILE",   value: "Solo freelance dev" },
            { label: "BUDGET",    value: `${usdFromEur(stack.monthlyBudget)}/mo` },
            { label: "TOOLS",     value: String(toolCount) },
            { label: "LEVEL",     value: stageKey },
            { label: "WORKFLOW",  value: "Code → preview → get paid" },
            { label: "KEY RISK",  value: "Team tools too early" },
          ],
          socleSlugs: ["github", "vercel", "notion", "stripe"],
        };
  }

  if (stack.slug === "createur-sites-ia-automation") {
    return locale === "fr"
      ? {
          title: "Sites IA & automation.",
          promise: "Lancer sans empiler les outils IA.",
          workflowSummary: "Page → automation → paiement → mesure",
          watchout: "Empilement IA",
          reperes: [
            { label: "PROFIL",            value: "Solo no-code / IA" },
            { label: "BUDGET",            value: `96€/mois` },
            { label: "OUTILS",            value: "18" },
            { label: "NIVEAU",            value: "Avancé" },
            { label: "WORKFLOW",          value: "Page → automation → mesure" },
            { label: "POINT D'ATTENTION", value: "Empilement IA" },
          ],
          socleSlugs: [],
        }
      : {
          title: "AI sites & automation.",
          promise: "Launch without stacking AI tools.",
          workflowSummary: "Page → automation → measure",
          watchout: "AI tool stacking",
          reperes: [
            { label: "PROFILE",   value: "Solo no-code / AI" },
            { label: "BUDGET",    value: `${usdFromEur(96)}/month` },
            { label: "TOOLS",     value: "18" },
            { label: "LEVEL",     value: "Advanced" },
            { label: "WORKFLOW",  value: "Page → automation → measure" },
            { label: "KEY RISK",  value: "AI tool stacking" },
          ],
          socleSlugs: [],
        };
  }

  if (stack.slug === "designer-freelance-solo") {
    return locale === "fr"
      ? {
          title: "Designer freelance.",
          promise: "Créer, présenter, livrer sans usine à fichiers.",
          workflowSummary: "Créer → présenter → décliner → livrer",
          watchout: "Doublons créa / IA / stockage",
          reperes: [
            { label: "PROFIL",            value: "Designer UI/UX freelance" },
            { label: "BUDGET",            value: `118€/mois` },
            { label: "OUTILS",            value: "15" },
            { label: "NIVEAU",            value: "Installé" },
            { label: "WORKFLOW",          value: "Créer → présenter → livrer" },
            { label: "POINT D'ATTENTION", value: "Doublons créa / IA / stockage" },
          ],
          socleSlugs: ["figma", "canva", "notion", "miro"],
        }
      : {
          title: "Freelance designer.",
          promise: "Create, present, deliver without a file factory.",
          workflowSummary: "Create → present → deliver",
          watchout: "Creative / AI / storage overlaps",
          reperes: [
            { label: "PROFILE",   value: "Freelance UI/UX designer" },
            { label: "BUDGET",    value: `${usdFromEur(118)}/month` },
            { label: "TOOLS",     value: "15" },
            { label: "LEVEL",     value: "Established" },
            { label: "WORKFLOW",  value: "Create → present → deliver" },
            { label: "KEY RISK",  value: "Creative / AI / storage overlaps" },
          ],
          socleSlugs: ["figma", "canva", "notion", "miro"],
        };
  }

  if (stack.slug === "architecte-interieur") {
    return locale === "fr"
      ? {
          title: "Architecte d’intérieur.",
          promise: "Du brief au chantier sans stack BIM trop tôt.",
          workflowSummary: "Brief → plans → rendu → chantier",
          watchout: "Stack BIM trop tôt",
          reperes: [
            { label: "PROFIL",            value: "Architecte intérieur indépendant" },
            { label: "BUDGET",            value: `148€/mois` },
            { label: "OUTILS",            value: "37" },
            { label: "NIVEAU",            value: "Avancé" },
            { label: "WORKFLOW",          value: "Brief → plans → chantier" },
            { label: "POINT D'ATTENTION", value: "Stack BIM trop tôt" },
          ],
          socleSlugs: [],
        }
      : {
          title: "Interior architect.",
          promise: "From brief to site without early BIM stack.",
          workflowSummary: "Brief → plans → site",
          watchout: "BIM stack too early",
          reperes: [
            { label: "PROFILE",   value: "Independent interior architect" },
            { label: "BUDGET",    value: `${usdFromEur(148)}/month` },
            { label: "TOOLS",     value: "37" },
            { label: "LEVEL",     value: "Advanced" },
            { label: "WORKFLOW",  value: "Brief → plans → site" },
            { label: "KEY RISK",  value: "BIM stack too early" },
          ],
          socleSlugs: [],
        };
  }

  if (stack.slug === "consultant-b2b-propre") {
    return locale === "fr"
      ? {
          title: "Stack consultant B2B.",
          promise: "Suivre, vendre, livrer sans usine CRM.",
          workflowSummary: "Opportunité → appel → proposition → livraison",
          watchout: "CRM plus lourd que la mission",
          reperes: [
            { label: "PROFIL",            value: "Consultant solo / B2B" },
            { label: "BUDGET",            value: "37€/mois" },
            { label: "OUTILS",            value: "10" },
            { label: "NIVEAU",            value: "Débutant" },
            { label: "WORKFLOW",          value: "Opportunité → appel → proposition" },
            { label: "POINT D'ATTENTION", value: "CRM plus lourd que la mission" },
          ],
          socleSlugs: [],
        }
      : {
          title: "B2B consultant stack.",
          promise: "Track, sell, deliver without a CRM factory.",
          workflowSummary: "Opportunity → call → proposal",
          watchout: "CRM heavier than the project",
          reperes: [
            { label: "PROFILE",   value: "Solo B2B consultant" },
            { label: "BUDGET",    value: `${usdFromEur(37)}/month` },
            { label: "TOOLS",     value: "10" },
            { label: "LEVEL",     value: "Beginner" },
            { label: "WORKFLOW",  value: "Opportunity → call → proposal" },
            { label: "KEY RISK",  value: "CRM heavier than the project" },
          ],
          socleSlugs: [],
        };
  }

  if (stack.slug === "agence-marketing") {
    return locale === "fr"
      ? {
          title: "Agence marketing.",
          promise: "Contenus, campagnes, reporting sans un outil par client.",
          workflowSummary: "Contenus → campagnes → reporting",
          watchout: "Un outil par client ou canal",
          reperes: [
            { label: "PROFIL",            value: "Agence marketing / studio growth" },
            { label: "BUDGET",            value: "420€/mois" },
            { label: "OUTILS",            value: "25" },
            { label: "NIVEAU",            value: "Avancé" },
            { label: "WORKFLOW",          value: "Contenus → campagnes → reporting" },
            { label: "POINT D'ATTENTION", value: "Un outil par client ou canal" },
          ],
          socleSlugs: [],
        }
      : {
          title: "Marketing agency.",
          promise: "Content, campaigns, reporting without a tool per client.",
          workflowSummary: "Content → campaigns → reporting",
          watchout: "One tool per client or channel",
          reperes: [
            { label: "PROFILE",   value: "Marketing agency / growth studio" },
            { label: "BUDGET",    value: `${usdFromEur(420)}/month` },
            { label: "TOOLS",     value: "25" },
            { label: "LEVEL",     value: "Advanced" },
            { label: "WORKFLOW",  value: "Content → campaigns → reporting" },
            { label: "KEY RISK",  value: "One tool per client or channel" },
          ],
          socleSlugs: [],
        };
  }

  return fallback;
}

function getStackMetaDescription(stack: StackGuide, locale: "fr" | "en"): string {
  if (stack.slug === "developpeur-freelance-shipper") {
    return locale === "fr"
      ? `Stack dev freelance pour coder, partager une preview client, documenter et encaisser sans payer une stack produit trop lourde. Budget cible : ${stack.monthlyBudget}€/mois.`
      : `Freelance dev stack to code, share a client preview, document, and get paid without paying for an overweight product stack. Target budget: ${usdFromEur(stack.monthlyBudget)}/month.`;
  }
  if (stack.slug === "createur-sites-ia-automation") {
    return locale === "fr"
      ? `Stack sites IA & automation pour lancer une page, un prototype ou un workflow automatisé sans empiler les outils IA. Budget cible : ${stack.monthlyBudget}€/mois.`
      : `AI sites and automation stack to launch a page, prototype, or automated workflow without stacking AI tools. Target budget: ${usdFromEur(stack.monthlyBudget)}/month.`;
  }
  return locale === "fr"
    ? `${stack.subtitle} Budget cible : ${stack.monthlyBudget}€/mois.`
    : `${stack.subtitleEn} Target budget: ${usdFromEur(stack.monthlyBudget)}/month.`;
}

function getToolDecisionStatus(slot: { role: string; decision?: "core" | "conditional" | "challenge" }) {
  if (slot.decision === "challenge")   return { key: "challenge"   as const, labelFr: "À challenger", labelEn: "Challenge",   className: "border-destructive/25 bg-destructive/8 text-destructive" };
  if (slot.decision === "conditional") return { key: "conditional" as const, labelFr: "Conditionnel", labelEn: "Conditional", className: "border-primary/25 bg-primary/8 text-primary" };
  if (slot.decision === "core")        return { key: "core"        as const, labelFr: "Socle",         labelEn: "Core",        className: "border-keep/25 bg-keep/10 text-keep" };
  const norm = slot.role.toLowerCase();
  const challengeKw = ["avancé", "advanced", "suite", "backlinks", "connecteurs", "connectors", "handoff", "vectoriel", "photo", "crm agence"];
  const optionalKw  = ["plugin", "feedback", "prospection", "social", "seo", "ux", "workshop", "atelier", "prototype", "ia"];
  if (challengeKw.some((kw) => norm.includes(kw))) return { key: "challenge"   as const, labelFr: "À challenger", labelEn: "Challenge",   className: "border-destructive/25 bg-destructive/8 text-destructive" };
  if (optionalKw.some((kw)  => norm.includes(kw))) return { key: "conditional" as const, labelFr: "Conditionnel", labelEn: "Conditional", className: "border-primary/25 bg-primary/8 text-primary" };
  return { key: "core" as const, labelFr: "Socle", labelEn: "Core", className: "border-keep/25 bg-keep/10 text-keep" };
}

export default StackDetailPage;
