import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Lightbulb, X } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, type ToolSummary } from "@/hooks/useSupabaseData";
import { cleanupSeo, SEO_BASE, setHreflang, setJsonLd, setSeoTags } from "@/lib/seo";
import {
  STACK_PERSONAS,
  STACK_SUB_PROFILES,
  STACK_STAGES,
  STACKS,
  getStackDerivedFields,
  type StackGuide,
  type StackInsight,
  type StackPersona,
  type StackStage,
  type StackToolSlot,
} from "@/data/stacks";

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
  verdictShort:    "Pour livrer vite sans payer une stack de startup.",
  verdictShortEn:  "To ship fast without paying for a startup stack.",

  overviewIntro:   "Cette stack est pensée pour un développeur freelance qui doit coder, montrer une preview, garder une trace des décisions et encaisser proprement. Elle reste volontairement légère : chaque outil a un rôle distinct.",
  overviewIntroEn: "This stack is designed for a freelance developer who needs to code, show a preview, keep decision history, and get paid cleanly. It stays deliberately light: every tool has a distinct role.",

  overviewServesLabel:    "Elle sert à",
  overviewServesLabelEn:  "It's for",
  overviewServes:    "Coder, présenter une preview client, documenter les décisions et facturer sans stack d'équipe produit.",
  overviewServesEn:  "Coding, sharing client previews, documenting decisions, and invoicing without a product-team stack.",

  overviewAvoidsLabel:    "Elle évite",
  overviewAvoidsLabelEn:  "It avoids",
  overviewAvoids:    "Jira, CRM lourd, suite produit complète et automatisations payées avant d'être répétées.",
  overviewAvoidsEn:  "Jira, heavy CRM, full product suites, and automations paid before they repeat.",

  overviewNotForLabel:    "À éviter si",
  overviewNotForLabelEn:  "Avoid if",
  overviewNotFor:    "Tu travailles déjà avec une équipe produit structurée, beaucoup de QA ou plusieurs environnements complexes.",
  overviewNotForEn:  "You already work with a structured product team, heavy QA, or several complex environments.",

  priority: {
    essential:   ["GitHub pour versionner", "Vercel pour partager une preview", "Stripe pour encaisser"],
    essentialEn: ["GitHub for versioning", "Vercel for previews", "Stripe for payment"],
    optional:    ["Notion si le client a besoin de contexte", "ChatGPT si tu codes ou debugges chaque semaine"],
    optionalEn:  ["Notion when the client needs context", "ChatGPT if you code or debug weekly"],
    challenge:    ["Copilote IA secondaire", "Outil de gestion projet en double", "Automation trop tôt"],
    challengeEn:  ["Secondary AI copilot", "Duplicate project management tool", "Automation too early"],
  },

  budgetTitle:   "Budget cible : 32€/mois.",
  budgetTitleEn: "Target budget: €32/month.",
  budgetRows: [
    {
      tier: "Inclus / souvent gratuit", tierEn: "Included / often free", amount: "0€",
      desc:   "GitHub, Vercel et Notion couvrent souvent les bases avec leurs plans gratuits selon le volume.",
      descEn: "GitHub, Vercel, and Notion often cover the basics on free plans depending on volume.",
    },
    {
      tier: "Budget cible", tierEn: "Target budget", amount: "≈ 32€/mois",
      desc:   "La cible inclut surtout les outils réellement utilisés chaque semaine pour produire, montrer et encaisser.",
      descEn: "The target mostly includes tools genuinely used every week to produce, preview, and get paid.",
    },
    {
      tier: "À ne pas payer trop tôt", tierEn: "Do not pay too early", amount: "Jira / CRM / IA x2",
      desc:   "Attends un vrai volume avant d'ajouter outil projet lourd, CRM complet ou plusieurs copilotes IA.",
      descEn: "Wait for real volume before adding heavy PM tooling, a full CRM, or multiple AI copilots.",
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
  ctaDesc:   "Audite tes outils actuels pour voir quoi garder, quoi challenger et quoi repousser.",
  ctaDescEn: "Audit your current tools to see what to keep, challenge, and postpone.",

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
  const coreTools  = stack.tools.filter((t) => !t.decision || t.decision === "core");
  const condTools  = stack.tools.filter((t) => t.decision === "conditional");
  const chalTools  = stack.tools.filter((t) => t.decision === "challenge");
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
    { title: "Le petit plus", titleEn: "Small edge", detail: "Crée un template Notion par mission avec brief, décisions, changelog et lien preview Vercel. Le client suit sans te relancer.", detailEn: "Create one Notion template per project with brief, decisions, changelog, and Vercel preview link. The client tracks progress without chasing you." },
    { title: "Plugin / réglage", titleEn: "Plugin / setting", detail: "Ajoute un fichier de règles projet pour Cursor ou ton IA : stack technique, conventions, composants à réutiliser, choses à ne pas modifier.", detailEn: "Add project rules for Cursor or your AI: tech stack, conventions, reusable components, and things not to touch." },
  ],
  "designer-freelance-solo": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Figma reste le centre. Plugins minimum : Tokens Studio si système maintenu, Iconify pour les icônes, Stark pour accessibilité. Canva sert aux déclinaisons, pas à la source design.", detailEn: "Figma stays central. Minimum plugins: Tokens Studio for maintained systems, Iconify for icons, Stark for accessibility. Canva handles variations, not the design source." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Prépare une page client Notion avec brief, moodboard, validations et liens Figma. Tu transformes ton process en livrable visible.", detailEn: "Prepare a client Notion page with brief, moodboard, approvals, and Figma links. Your process becomes visible deliverable value." },
    { title: "À challenger", titleEn: "Challenge", detail: "Adobe complet ne doit rester actif que si tu ouvres vraiment Photoshop, Illustrator ou Lightroom chaque mois. Sinon plan photo ou alternative dédiée.", detailEn: "Full Adobe should stay active only if you actually open Photoshop, Illustrator, or Lightroom monthly. Otherwise use the photo plan or a focused alternative." },
  ],
  "architecte-interieur": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "SketchUp Pro + LayOut + AutoCAD LT + D5 Render + Programa + Notion + Indy/Qonto/Yousign. C'est complet sans basculer trop tôt dans une stack BIM lourde.", detailEn: "SketchUp Pro + LayOut + AutoCAD LT + D5 Render + Programa + Notion + Indy/Qonto/Yousign. It is complete without moving too early into a heavy BIM stack." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Crée un modèle de dossier projet : 01_ADMIN, 02_BRIEF, 03_REFERENCES, 04_PLANS, 05_3D, 06_RENDUS, 07_SOURCING, 08_BUDGET, 09_CHANTIER, 10_LIVRAISON.", detailEn: "Create a project folder template: 01_ADMIN, 02_BRIEF, 03_REFERENCES, 04_PLANS, 05_3D, 06_RENDUS, 07_SOURCING, 08_BUDGET, 09_CHANTIER, 10_LIVRAISON." },
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

/* ─── Main component ─────────────────────────────────────────────────────── */
const StackDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang, prefix } = useLang();
  const { tools } = useToolSummaries();
  const stack = STACKS.find((item) => item.slug === slug);
  const toolBySlug = useMemo(() => new Map(tools.map((tool) => [tool.slug || tool.id, tool])), [tools]);

  // Must be before conditional return (hooks rules)
  const relatedStacks = useMemo(() => {
    if (!stack) return [];
    const samePersona = STACKS.filter((s) => s.slug !== stack.slug && s.persona === stack.persona);
    if (samePersona.length >= 3) return samePersona.slice(0, 3);
    const fill = STACKS.filter((s) => s.slug !== stack.slug && s.persona !== stack.persona);
    return [...samePersona, ...fill].slice(0, 3);
  }, [stack]);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!stack) return;
    const title = lang === "fr"
      ? `${stack.title} : outils, usages et budget | ToolTrim`
      : `${stack.titleEn}: tools, use cases and budget | ToolTrim`;
    const description = lang === "fr"
      ? `${stack.subtitle} Budget cible : ${stack.monthlyBudget}€/mois.`
      : `${stack.subtitleEn} Target budget: €${stack.monthlyBudget}/month.`;
    setSeoTags({ title, description, url: `${SEO_BASE}/${lang}/stacks/${stack.slug}`, locale: lang === "fr" ? "fr_FR" : "en_US" });
    setHreflang(`/${lang}/stacks/${stack.slug}`);
    setJsonLd("stack-detail-jsonld", {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description,
      url: `${SEO_BASE}/${lang}/stacks/${stack.slug}`,
      about: stack.tools.map((slot) => toolBySlug.get(slot.slug)?.name || slot.slug),
    });
    return () => cleanupSeo(["stack-detail-jsonld"]);
  }, [lang, stack, toolBySlug]);

  if (!stack) return <Navigate to={`${prefix}/stacks`} replace />;

  /* ── Derived data ───────────────────────────────────────────────────────── */
  const editorial = EDITORIAL_REGISTRY[stack.slug] ?? buildFallbackEditorial(stack);
  const detailTitle = stack.slug === "developpeur-freelance-shipper"
    ? t("Développeur freelance shipper", "Freelance developer shipper")
    : t(stack.title, stack.titleEn);
  const derived = getStackDerivedFields(stack);
  const expertTips = getExpertTips(stack);
  const personaText = t(personaLabel(stack.persona, "fr"), personaLabel(stack.persona, "en"));
  const primarySubProfile = stack.subProfiles[0];
  const subProfileText = primarySubProfile ? t(subProfileLabel(primarySubProfile, "fr"), subProfileLabel(primarySubProfile, "en")) : personaText;
  const levelText = t(stack.stage === "starter" ? "débutant" : stack.stage === "scale" ? "avancé" : "installé", stack.stage === "starter" ? "beginner" : stack.stage === "scale" ? "advanced" : "established");
  const complexityText = t(
    derived.complexity === "minimal" ? "minimale" : derived.complexity === "premium" ? "premium" : "équilibrée",
    derived.complexity === "minimal" ? "minimal" : derived.complexity === "premium" ? "premium" : "balanced",
  );
  const budgetDisplay = stack.monthlyBudget > 0 ? `${stack.monthlyBudget}€/mois` : t("Gratuit", "Free");

  const stackTools = stack.tools.map((slot) => ({ slot, tool: toolBySlug.get(slot.slug) })).filter((item) => item.tool);
  const coreTools = stackTools.filter(({ slot }) => getToolDecisionStatus(slot).key === "core");
  const optionalTools = stackTools.filter(({ slot }) => getToolDecisionStatus(slot).key === "conditional");
  const challengeTools = stackTools.filter(({ slot }) => getToolDecisionStatus(slot).key === "challenge");
  const priorityEssential = lang === "fr" ? editorial.priority.essential : editorial.priority.essentialEn;
  const priorityOptional = lang === "fr" ? editorial.priority.optional : editorial.priority.optionalEn;
  const priorityChallenge = lang === "fr" ? editorial.priority.challenge : editorial.priority.challengeEn;
  const decisionKeep = coreTools.slice(0, 4).map(({ tool }) => tool!.name);
  const decisionChallenge = challengeTools.length > 0
    ? challengeTools.slice(0, 4).map(({ tool }) => tool!.name)
    : priorityChallenge.slice(0, 3);
  const decisionOptional = optionalTools.length > 0
    ? optionalTools.slice(0, 4).map(({ tool }) => tool!.name)
    : priorityOptional.slice(0, 3);
  const tooLightRows = lang === "fr"
    ? ["Tu gères plusieurs projets clients en parallèle.", "Tu as besoin de QA, staging ou monitoring avancé.", "Tu travailles avec plusieurs devs.", "Tu dois suivre des specs produit lourdes."]
    : ["You manage several client projects in parallel.", "You need advanced QA, staging, or monitoring.", "You work with several developers.", "You need to track heavy product specs."];
  const tooHeavyRows = lang === "fr"
    ? ["Tu livres surtout des landing pages simples.", "Tu n'as pas encore de flux client régulier.", "Tu paies plusieurs outils pour la même étape.", "Tu utilises moins de la moitié des fonctions."]
    : ["You mostly ship simple landing pages.", "You do not have a steady client flow yet.", "You pay several tools for the same step.", "You use less than half of the features."];

  // Persona-specific or default layers
  const activeLayers = PERSONA_LAYERS[stack.persona] ?? STACK_LAYERS;
  const stackLayersBase = activeLayers.map((layer) => ({
    ...layer,
    tools: stackTools.filter(({ slot }) => {
      const role = `${slot.role} ${slot.roleEn}`.toLowerCase();
      return layer.match.some((kw) => role.includes(kw));
    }),
  })).filter((layer) => layer.tools.length > 0);

  const assignedSlugs = new Set(stackLayersBase.flatMap((l) => l.tools.map(({ slot }) => slot.slug)));
  const unassignedTools = stackTools.filter(({ slot }) => !assignedSlugs.has(slot.slug));
  const stackLayers = unassignedTools.length > 0
    ? [...stackLayersBase, { id: "other", titleFr: "Autres outils utiles", titleEn: "Other useful tools", match: [], tools: unassignedTools }]
    : stackLayersBase;

  // Logo pills (max 5) from tools that have a toolBySlug entry
  const logoPills = stackTools.slice(0, 5);
  const logoOverflow = stackTools.length > 5 ? stackTools.length - 5 : 0;

  const hasRisks = editorial.risks.length > 0;
  const hasAltVariants = editorial.altVariants.length > 0;

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background">

      {/* ════════════════════════════════════════════════════════════════════
          HERO — 2 colonnes : texte gauche + snapshot droite
      ════════════════════════════════════════════════════════════════════ */}
      <section className="sd-hero-section">
        <div className="sd-hero-grid">

          {/* ── Left: éditorial ── */}
          <div>
            {/* Breadcrumb */}
            <nav className="sd-hero-breadcrumb" aria-label="breadcrumb">
              <Link to={`${prefix}/stacks`}>{t("Stacks", "Stacks")}</Link>
              <span style={{ color: "#DADAD4" }}>/</span>
              <span style={{ color: "#222222" }}>{detailTitle}</span>
            </nav>

            {/* Eyebrow */}
            <span className="sd-hero-eyebrow">{t(`STACK ${personaText}`.toUpperCase(), `STACK ${personaText}`.toUpperCase())}</span>

            {/* H1 */}
            <h1 className="sd-hero-h1">
              {detailTitle}.
            </h1>

            {/* Description */}
            <p className="sd-hero-desc">
              {t(stack.subtitle, stack.subtitleEn)}
            </p>

            {/* Verdict court */}
            <p className="sd-hero-verdict">
              {t(editorial.verdictShort, editorial.verdictShortEn)}
            </p>

            <div className="sd-hero-decision-grid" aria-label={t("Résumé de décision", "Decision summary") as string}>
              <div>
                <span>{t("Idéal si", "Best for")}</span>
                <p>{t(stack.bestFor, stack.bestForEn)}</p>
              </div>
              <div>
                <span>{t("À éviter si", "Avoid if")}</span>
                <p>{t(stack.avoidIf, stack.avoidIfEn)}</p>
              </div>
            </div>

            {/* CTA */}
            <Link
              to={`${prefix}/selector`}
              style={{
                display: "inline-flex", alignItems: "center",
                height: 48, padding: "0 22px",
                background: "#222222", color: "#FFFFFF",
                borderRadius: 8, fontFamily: "var(--font-ui)",
                fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em",
                textDecoration: "none", transition: "background 160ms ease-out",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#000000"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#222222"; }}
            >
              {t("Analyser ma stack", "Analyze my stack")}
            </Link>
          </div>

          {/* ── Right: snapshot module ── */}
          <div className="sd-snapshot">
            <span className="sd-snapshot-title">{t("EN UN COUP D'ŒIL", "AT A GLANCE")}</span>

            <div className="sd-snapshot-item">
              <span className="sd-snapshot-label">{t("Budget cible", "Target budget")}</span>
              <span className="sd-snapshot-value">{budgetDisplay}</span>
            </div>
            <div className="sd-snapshot-item">
              <span className="sd-snapshot-label">{t("Profil", "Profile")}</span>
              <span className="sd-snapshot-value">{personaText} · {subProfileText}</span>
            </div>
            <div className="sd-snapshot-item">
              <span className="sd-snapshot-label">{t("Outils", "Tools")}</span>
              <span className="sd-snapshot-value">{stack.tools.length}</span>
            </div>
            <div className="sd-snapshot-item">
              <span className="sd-snapshot-label">{t("Niveau", "Level")}</span>
              <span className="sd-snapshot-value">{levelText}</span>
            </div>
            <div className="sd-snapshot-item">
              <span className="sd-snapshot-label">{t("Complexité", "Complexity")}</span>
              <span className="sd-snapshot-value">{complexityText}</span>
            </div>
            <div className="sd-snapshot-item" style={{ alignItems: "flex-start" }}>
              <span className="sd-snapshot-label" style={{ marginTop: 2 }}>{t("Risque", "Risk")}</span>
              <span className="sd-snapshot-value" style={{ fontSize: 13, maxWidth: 190, lineHeight: 1.35 }}>
                {t(stack.riskSnippet ?? stack.risk, stack.riskSnippetEn ?? stack.riskEn)}
              </span>
            </div>

            {/* Logo pills */}
            {logoPills.length > 0 && (
              <>
                <hr className="sd-snapshot-divider" />
                <p style={{ fontFamily: "var(--font-ui)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9A9A92", marginBottom: 10 }}>
                  {t("OUTILS CLÉS", "KEY TOOLS")}
                </p>
                <div className="sd-logo-stack">
                  {logoPills.map(({ tool }) => (
                    <div key={tool!.slug} className="sd-logo-pill">
                      <ToolLogo tool={tool!} size={18} />
                    </div>
                  ))}
                  {logoOverflow > 0 && (
                    <div className="sd-logo-pill sd-logo-more">+{logoOverflow}</div>
                  )}
                </div>
              </>
            )}
          </div>

        </div>
      </section>

      <section className="sd-decision-summary-section" aria-labelledby="stack-decision-summary">
        <div className="sd-container sd-decision-summary-inner">
          <div>
            <span className="sd-section-eyebrow">{t("DÉCISION TOOLTRIM", "TOOLTRIM DECISION")}</span>
            <h2 id="stack-decision-summary" className="sd-decision-summary-title">{t("La stack à garder simple.", "The stack to keep simple.")}</h2>
          </div>
          <div className="sd-decision-summary-grid">
            <div className="sd-decision-summary-card">
              <span className="sd-decision-summary-label">{t("À garder", "Keep")}</span>
              <p>{decisionKeep.length > 0 ? decisionKeep.join(" / ") : priorityEssential.join(" / ")}</p>
            </div>
            <div className="sd-decision-summary-card">
              <span className="sd-decision-summary-label">{t("Optionnel", "Optional")}</span>
              <p>{decisionOptional.join(" / ")}</p>
            </div>
            <div className="sd-decision-summary-card">
              <span className="sd-decision-summary-label">{t("À challenger", "Challenge")}</span>
              <p>{decisionChallenge.join(" / ")}</p>
            </div>
            <div className="sd-decision-summary-card">
              <span className="sd-decision-summary-label">{t("À éviter", "Avoid")}</span>
              <p>{t("Jira, CRM lourd, suite produit complète si tu travailles seul.", "Jira, heavy CRM, full product suite if you work alone.")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          SUBNAV
      ════════════════════════════════════════════════════════════════════ */}
      <nav className="sd-nav" aria-label="Navigation de section">
        <div className="sd-nav-inner">
          <a className="sd-nav-link" href="#apercu">{t("Vue d'ensemble", "Overview")}</a>
          <a className="sd-nav-link" href="#outils">{t("Outils", "Tools")}</a>
          <a className="sd-nav-link" href="#budget">{t("Budget", "Budget")}</a>
          {hasRisks && <a className="sd-nav-link" href="#risques">{t("Risques", "Risks")}</a>}
          <a className="sd-nav-link" href="#calibrage">{t("Calibrage", "Calibration")}</a>
          {hasAltVariants && <a className="sd-nav-link" href="#alternatives">{t("Alternatives", "Alternatives")}</a>}
          <a className="sd-nav-link" href="#faq">FAQ</a>
        </div>
      </nav>

      {/* ════════════════════════════════════════════════════════════════════
          VUE D'ENSEMBLE
      ════════════════════════════════════════════════════════════════════ */}
      <section id="apercu" className="sd-section scroll-mt-20">
        <div className="sd-container">
          <span className="sd-section-eyebrow">{t("VUE D'ENSEMBLE", "OVERVIEW")}</span>
          <p className="sd-section-title" style={{ marginBottom: 0 }}>
            {lang === "fr" ? getOverviewTitle(stack) : getOverviewTitleEn(stack)}
          </p>

          <p className="sd-overview-intro">
            {t(editorial.overviewIntro, editorial.overviewIntroEn)}
          </p>

          {/* 3-col: sert à / évite / pas faite pour */}
          <div className="sd-overview-grid">
            <div className="sd-overview-col">
              <span className="sd-overview-label">{t(editorial.overviewServesLabel, editorial.overviewServesLabelEn)}</span>
              <p className="sd-overview-text">{t(editorial.overviewServes, editorial.overviewServesEn)}</p>
            </div>
            <div className="sd-overview-col">
              <span className="sd-overview-label">{t(editorial.overviewAvoidsLabel, editorial.overviewAvoidsLabelEn)}</span>
              <p className="sd-overview-text">{t(editorial.overviewAvoids, editorial.overviewAvoidsEn)}</p>
            </div>
            <div className="sd-overview-col">
              <span className="sd-overview-label">{t(editorial.overviewNotForLabel, editorial.overviewNotForLabelEn)}</span>
              <p className="sd-overview-text">{t(editorial.overviewNotFor, editorial.overviewNotForEn)}</p>
            </div>
          </div>

          {/* Expert note */}
          {expertTips.length > 0 && (
            <div className="sd-expert-note">
              <span className="sd-expert-note-label">{t("Note ToolTrim", "ToolTrim note")}</span>
              <p className="sd-expert-note-text">{t(expertTips[0].detail, expertTips[0].detailEn)}</p>
              {expertTips.slice(1).map((tip) => (
                <div key={tip.title} className="sd-expert-note-tip">
                  <span className="sd-expert-note-tip-label">{t(tip.title, tip.titleEn)} — </span>
                  {t(tip.detail, tip.detailEn)}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          OUTILS — par groupe d'usage
      ════════════════════════════════════════════════════════════════════ */}
      <section id="outils" className="sd-section scroll-mt-20">
        <div className="sd-container">
          <span className="sd-section-eyebrow">{t("OUTILS RECOMMANDÉS", "RECOMMENDED TOOLS")}</span>
          <p className="sd-section-title" style={{ marginBottom: 24 }}>
            {t("Les outils, par usage.", "The tools, by use case.")}
          </p>

          {/* Legend */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: "8px 20px",
            marginBottom: 24, padding: "12px 0", borderBottom: "1px solid #DADAD4",
          }}>
            {[
              { key: "core",        label: t("Socle — indispensable",          "Core — essential"),    color: "#2E7D32" },
              { key: "conditional", label: t("Conditionnel — selon usage",      "Conditional"),         color: "#6F6F68" },
              { key: "challenge",   label: t("À challenger — justifier l'abonnement", "Challenge"),     color: "#C62828" },
            ].map((item) => (
              <span key={item.key} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-ui)", fontSize: 12, color: "#6F6F68" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                {item.label}
              </span>
            ))}
          </div>

          {/* Layers */}
          {stackLayers.map((layer) => (
            <div key={layer.id} style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                <p style={{ fontFamily: "var(--font-ui)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#222222", whiteSpace: "nowrap" }}>
                  {t(layer.titleFr, layer.titleEn)}
                </p>
                <div style={{ flex: 1, height: 1, background: "#DADAD4" }} />
                <span style={{ fontFamily: "var(--font-ui)", fontSize: 11, color: "#9A9A92" }}>{layer.tools.length}</span>
              </div>

              <div>
                {layer.tools.map(({ slot, tool }) => {
                  const status = getToolDecisionStatus(slot);
                  const globalIndex = stackTools.findIndex((st) => st.slot.slug === slot.slug);
                  return (
                    <div key={slot.slug} className="sd-tool-row">
                      <button type="button" onClick={() => setSelectedIndex(globalIndex)} className="sd-tool-row-open">
                        <div className="sd-tool-logo-box">
                          <ToolLogo tool={tool!} size={28} />
                        </div>
                        <div className="sd-tool-main-copy">
                          <p className="sd-tool-name">{tool!.name}</p>
                          <p className="sd-tool-role"><span>{t("Rôle", "Role")} :</span> {t(slot.role, slot.roleEn)}</p>
                        </div>
                        <p className="sd-tool-reason"><span>{t("Pourquoi", "Why")} :</span> {t(slot.reason, slot.reasonEn)}</p>
                        <span className="sd-tool-price">{formatToolPrice(tool, lang)}</span>
                        <span className={`sd-tool-status sd-tool-status--${status.key}`}>
                          {t(status.labelFr, status.labelEn)}
                        </span>
                      </button>
                      <Link to={`${prefix}/tool/${tool!.slug || tool!.id}`} className="sd-tool-detail-link">
                        {t("Fiche", "Details")} <span aria-hidden>→</span>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          ESSENTIEL / OPTIONNEL / À CHALLENGER
      ════════════════════════════════════════════════════════════════════ */}
      <section className="sd-section scroll-mt-20">
        <div className="sd-container">
          <span className="sd-section-eyebrow">{t("DÉCISION", "DECISION")}</span>
          <p className="sd-section-title" style={{ marginBottom: 0 }}>
            {t("Ce qui mérite vraiment sa place.", "What actually earns its place.")}
          </p>
          <div className="sd-priority-grid">
            {/* Essentiel */}
            <div className="sd-priority-col sd-priority-col--essential">
              <span className="sd-priority-label">{t("Essentiel", "Essential")}</span>
              {priorityEssential.map((item: string, i: number) => (
                <div key={i} className="sd-priority-item">{item}</div>
              ))}
            </div>
            {/* Optionnel */}
            <div className="sd-priority-col sd-priority-col--optional">
              <span className="sd-priority-label">{t("Optionnel", "Optional")}</span>
              {priorityOptional.map((item: string, i: number) => (
                <div key={i} className="sd-priority-item">{item}</div>
              ))}
            </div>
            {/* À challenger */}
            <div className="sd-priority-col sd-priority-col--challenge">
              <span className="sd-priority-label">{t("À challenger", "Challenge")}</span>
              {priorityChallenge.map((item: string, i: number) => (
                <div key={i} className="sd-priority-item">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          BUDGET
      ════════════════════════════════════════════════════════════════════ */}
      <section id="budget" className="sd-section scroll-mt-20">
        <div className="sd-container">
          <span className="sd-section-eyebrow">{t("BUDGET", "BUDGET")}</span>
          <p className="sd-section-title" style={{ marginBottom: 8 }}>
            {t(editorial.budgetTitle, editorial.budgetTitleEn)}
          </p>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: 15, lineHeight: 1.5, color: "#6F6F68", marginBottom: 0, maxWidth: 620 }}>
            {t(
              "Ce budget inclut les outils qui portent le code, la preview, le contexte client et le paiement. Il laisse volontairement de côté les couches équipe, CRM complet, QA avancée et automations trop tôt.",
              "This budget includes the tools that carry code, preview, client context, and payment. It deliberately leaves out team layers, full CRM, advanced QA, and too-early automations.",
            )}
          </p>
          <div className="sd-budget-list">
            {editorial.budgetRows.map((row, i) => (
              <div key={i} className="sd-budget-row">
                <span className="sd-budget-tier">{t(row.tier, row.tierEn)}</span>
                <span className="sd-budget-amount">{row.amount}</span>
                <span className="sd-budget-desc">{t(row.desc, row.descEn)}</span>
              </div>
            ))}
          </div>
          <p className="sd-budget-note">
            {t("Ce budget est une cible de calibration, pas une promesse exacte.", "This budget is a calibration target, not an exact promise.")}
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          RISQUES — doublons à éviter
      ════════════════════════════════════════════════════════════════════ */}
      {hasRisks && (
        <section id="risques" className="sd-section scroll-mt-20">
          <div className="sd-container">
            <span className="sd-section-eyebrow">{t("RISQUES", "RISKS")}</span>
            <p className="sd-section-title" style={{ marginBottom: 0 }}>
              {t(editorial.risksTitle, editorial.risksTitleEn)}
            </p>
            <div style={{ marginTop: 8 }}>
              {editorial.risks.map((risk, i) => (
                <div key={i} className="sd-risk-enhanced-row">
                  <div className="sd-risk-enhanced-col">
                    <span className="sd-risk-col-label">{t("Problème", "Problem")}</span>
                    <p className="sd-risk-problem-text">{t(risk.problem, risk.problemEn)}</p>
                  </div>
                  <div className="sd-risk-enhanced-col">
                    <span className="sd-risk-col-label">{t("Conséquence", "Consequence")}</span>
                    <p className="sd-risk-consequence-text">{t(risk.consequence, risk.consequenceEn)}</p>
                  </div>
                  <div className="sd-risk-enhanced-col">
                    <span className="sd-risk-col-label">{t("Recommandation ToolTrim", "ToolTrim recommendation")}</span>
                    <p className="sd-risk-reco-text">{t(risk.reco, risk.recoEn)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="calibrage" className="sd-section scroll-mt-20">
        <div className="sd-container">
          <span className="sd-section-eyebrow">{t("CALIBRAGE", "CALIBRATION")}</span>
          <p className="sd-section-title" style={{ marginBottom: 0 }}>
            {t("Quand cette stack devient mal calibrée.", "When this stack becomes miscalibrated.")}
          </p>
          <div className="sd-calibration-grid">
            <div className="sd-calibration-card">
              <span className="sd-calibration-label">{t("Trop légère si", "Too light if")}</span>
              <ul>
                {tooLightRows.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div className="sd-calibration-card">
              <span className="sd-calibration-label">{t("Trop lourde si", "Too heavy if")}</span>
              <ul>
                {tooHeavyRows.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          ALTERNATIVES — 3 variantes de stack
      ════════════════════════════════════════════════════════════════════ */}
      {hasAltVariants && (
        <section id="alternatives" className="sd-section scroll-mt-20">
          <div className="sd-container">
            <span className="sd-section-eyebrow">{t("ALTERNATIVES", "ALTERNATIVES")}</span>
            <p className="sd-section-title" style={{ marginBottom: 8 }}>
              {t(editorial.altsTitle, editorial.altsTitleEn)}
            </p>
            <div className="sd-alt-grid">
              {editorial.altVariants.map((variant, i) => (
                <div key={i} className="sd-alt-card">
                  <span className="sd-alt-label">{t(variant.label, variant.labelEn)}</span>
                  <p className="sd-alt-title">{t(variant.title, variant.titleEn)}</p>
                  <p className="sd-alt-budget">{variant.budget}</p>
                  <p className="sd-alt-tools">{t(variant.toolsDesc, variant.toolsDescEn)}</p>
                  <p className="sd-alt-compromise">{t(variant.compromise, variant.compromiseEn)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          CTA BAND
      ════════════════════════════════════════════════════════════════════ */}
      <div className="sd-cta-band">
        <div className="sd-cta-inner">
          <span style={{ fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6F6F68", display: "block", marginBottom: 12 }}>
            {t("Diagnostic", "Diagnostic")}
          </span>
          <p style={{ fontFamily: "var(--font-brand)", fontSize: "clamp(1.75rem, 4vw, 3.25rem)", fontWeight: 600, letterSpacing: "-0.055em", lineHeight: 0.98, color: "#222222", maxWidth: 680, marginBottom: 16 }}>
            {t(editorial.ctaTitle, editorial.ctaTitleEn)}
          </p>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: 17, lineHeight: 1.5, color: "#6F6F68", maxWidth: 540, marginBottom: 32, letterSpacing: "-0.015em" }}>
            {t(editorial.ctaDesc, editorial.ctaDescEn)}
          </p>
          <Link
            to={`${prefix}/selector`}
            style={{ display: "inline-flex", alignItems: "center", height: 48, padding: "0 22px", background: "#222222", color: "#FFFFFF", borderRadius: 8, fontFamily: "var(--font-ui)", fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", textDecoration: "none", transition: "background 160ms ease-out" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#000000"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#222222"; }}
          >
            {t("Analyser ma stack", "Analyze my stack")}
          </Link>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          FAQ
      ════════════════════════════════════════════════════════════════════ */}
      {editorial.faq.length > 0 && (
        <section id="faq" className="sd-section scroll-mt-20">
          <div className="sd-container">
            <span className="sd-section-eyebrow">FAQ</span>
            <p className="sd-section-title" style={{ marginBottom: 0 }}>
              {t("Questions fréquentes.", "Frequently asked questions.")}
            </p>
            <div className="sd-faq-list">
              {editorial.faq.map((item, i) => (
                <details
                  key={i}
                  className="sd-faq-item"
                  open={openFaqIndex === i}
                  onToggle={(e) => {
                    if ((e.currentTarget as HTMLDetailsElement).open) setOpenFaqIndex(i);
                    else if (openFaqIndex === i) setOpenFaqIndex(null);
                  }}
                >
                  <summary className="sd-faq-summary">
                    {t(item.q, item.qEn)}
                    <ChevronDown size={16} className="sd-faq-icon" />
                  </summary>
                  <p className="sd-faq-answer">{t(item.a, item.aEn)}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          STACKS PROCHES
      ════════════════════════════════════════════════════════════════════ */}
      {relatedStacks.length > 0 && (
        <section className="sd-section scroll-mt-20" style={{ borderBottom: "none" }}>
          <div className="sd-container">
            <span className="sd-section-eyebrow">{t("STACKS PROCHES", "RELATED STACKS")}</span>
            <p className="sd-section-title" style={{ marginBottom: 24 }}>
              {t("Tu pourrais aussi regarder.", "You might also like.")}
            </p>
            <div className="sd-related-grid">
              {relatedStacks.map((related) => (
                <Link key={related.slug} to={`${prefix}/stacks/${related.slug}`} className="sd-related-card">
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    <span style={{ fontFamily: "var(--font-ui)", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9A9A92", padding: "2px 6px", border: "1px solid #DADAD4", borderRadius: 3 }}>
                      {t(personaLabel(related.persona, "fr"), personaLabel(related.persona, "en"))}
                    </span>
                  </div>
                  <p className="sd-related-name">{t(related.title, related.titleEn)}</p>
                  <p className="sd-related-sub">{t(related.subtitle, related.subtitleEn)}</p>
                  <div className="sd-related-footer">
                    <span className="sd-related-budget">≈ {related.monthlyBudget}€/mois</span>
                    <span className="sd-related-cta">{t("Voir", "See")} →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TOOL QUICK PANEL (Sheet — inchangé)
      ════════════════════════════════════════════════════════════════════ */}
      <Sheet open={selectedIndex !== null} onOpenChange={(open) => { if (!open) setSelectedIndex(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-[420px] p-0 flex flex-col gap-0 overflow-hidden">
          {selectedIndex !== null && (
            <ToolPanel
              stackTools={stackTools}
              selectedIndex={selectedIndex}
              onNavigate={setSelectedIndex}
              prefix={prefix}
              t={t}
            />
          )}
        </SheetContent>
      </Sheet>

    </div>
  );
};

/* ─── Tool Panel (unchanged) ─────────────────────────────────────────────── */
interface ToolPanelProps {
  stackTools: Array<{ slot: StackToolSlot; tool: ToolSummary | undefined }>;
  selectedIndex: number;
  onNavigate: (index: number) => void;
  prefix: string;
  t: (fr: string, en: string) => string;
}

function ToolPanel({ stackTools, selectedIndex, onNavigate, prefix, t }: ToolPanelProps) {
  const { slot, tool } = stackTools[selectedIndex];
  const status = getToolDecisionStatus(slot);
  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex < stackTools.length - 1;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft"  && hasPrev) onNavigate(selectedIndex - 1);
      if (e.key === "ArrowRight" && hasNext) onNavigate(selectedIndex + 1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedIndex, hasPrev, hasNext, onNavigate]);

  const callout = {
    core: {
      fr: "Outil central de cette stack. Inutile de chercher une alternative — c'est lui qui tient tout.",
      en: "Core tool in this stack. No need to look for an alternative — it holds everything together.",
      textClass: "text-keep", borderClass: "border-keep/25 bg-keep/[0.05]", dotClass: "bg-keep",
    },
    conditional: {
      fr: "Utile selon les contextes. Vérifie que tu l'utilises vraiment chaque mois avant de renouveler.",
      en: "Useful in some contexts. Check you actually use it every month before renewing.",
      textClass: "text-primary", borderClass: "border-primary/25 bg-primary/[0.04]", dotClass: "bg-primary",
    },
    challenge: {
      fr: "Candidat au downgrade. Cet outil doit prouver sa valeur par un résultat concret et mesurable.",
      en: "Downgrade candidate. This tool needs to prove its value through concrete, measurable results.",
      textClass: "text-destructive", borderClass: "border-destructive/25 bg-destructive/[0.04]", dotClass: "bg-destructive",
    },
  }[status.key];

  const headerTint = {
    core: "from-keep/[0.06]",
    conditional: "from-primary/[0.06]",
    challenge: "from-destructive/[0.06]",
  }[status.key];

  return (
    <>
      <div className={`relative border-b border-border px-6 pb-5 pt-5 bg-gradient-to-b ${headerTint} to-transparent`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <ToolLogo tool={tool!} size={64} className="rounded-2xl shrink-0 shadow-sm ring-1 ring-border" />
            <div className="min-w-0">
              <p className="text-base font-bold text-foreground leading-tight truncate">{tool!.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground truncate">{t(slot.role, slot.roleEn ?? slot.role)}</p>
              <span className={`mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${status.className}`}>
                {t(status.labelFr, status.labelEn)}
              </span>
            </div>
          </div>
          <SheetClose className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors mt-0.5">
            <X className="h-4 w-4" />
          </SheetClose>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        <div className={`flex items-start gap-3 rounded-xl border p-4 ${callout.borderClass}`}>
          <div className={`mt-[5px] shrink-0 h-2 w-2 rounded-full ${callout.dotClass}`} />
          <p className={`text-sm font-medium leading-6 ${callout.textClass}`}>
            {t(callout.fr, callout.en)}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {t("Dans cette stack", "In this stack")}
          </p>
          <p className="text-sm leading-6 text-foreground/80">{t(slot.reason, slot.reasonEn ?? slot.reason)}</p>
          {slot.tip && (
            <div className="flex items-start gap-2.5 pt-3 border-t border-border/60">
              <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
              <p className="text-xs font-medium text-primary leading-5">
                {t(slot.tip, slot.tipEn ?? slot.tip)}
              </p>
            </div>
          )}
        </div>

        {(tool?.shortDescription || tool?.shortDescriptionEn) && (
          <div className="px-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              {t("En résumé", "About")}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              {t(tool.shortDescription ?? "", tool.shortDescriptionEn ?? "")}
            </p>
          </div>
        )}

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">
            {t("Tarifs", "Pricing")}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {tool?.pricing?.free ? (
              <div className="rounded-xl border border-keep/25 bg-keep/[0.05] p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-keep mb-2">{t("Gratuit", "Free")}</p>
                <p className="text-xs leading-5 text-muted-foreground">{tool.pricing.free}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-secondary/30 p-3.5 flex items-center justify-center">
                <p className="text-xs text-muted-foreground/50 text-center">{t("Pas de plan gratuit", "No free plan")}</p>
              </div>
            )}
            <div className="rounded-xl border border-border bg-secondary/30 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">{t("Payant", "Paid")}</p>
              {tool?.pricing?.paid ? (
                <p className="text-xs leading-5 text-muted-foreground">{tool.pricing.paid}</p>
              ) : (
                <p className="text-sm font-bold text-foreground">
                  {(tool?.defaultMonthlyPrice ?? 0) === 0
                    ? t("Gratuit", "Free")
                    : `${tool?.defaultMonthlyPrice}€/${t("mois", "mo")}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {tool?.websiteUrl && (
          <a
            href={tool.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition-all hover:border-primary/40 hover:bg-primary/[0.02] group"
          >
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate pr-3">
              {tool.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
          </a>
        )}
      </div>

      <div className="border-t border-border px-5 py-4 flex items-center justify-between gap-3 bg-background/50">
        <div className="flex items-center gap-1.5">
          <button type="button" disabled={!hasPrev} onClick={() => onNavigate(selectedIndex - 1)}
            title={t("Outil précédent (←)", "Previous tool (←)")}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[3.25rem] text-center text-xs tabular-nums text-muted-foreground">
            {selectedIndex + 1} / {stackTools.length}
          </span>
          <button type="button" disabled={!hasNext} onClick={() => onNavigate(selectedIndex + 1)}
            title={t("Outil suivant (→)", "Next tool (→)")}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <Link
          to={`${prefix}/tool/${tool!.slug}`}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 32, padding: "0 14px", background: "#222222", color: "#FFFFFF", borderRadius: 6, fontFamily: "var(--font-ui)", fontSize: 12, fontWeight: 500, letterSpacing: "-0.01em", textDecoration: "none" }}
        >
          {t("Fiche complète", "Full details")}
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </>
  );
}

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
function formatToolPrice(tool: ToolSummary | undefined, locale: "fr" | "en") {
  if (!tool) return locale === "fr" ? "Prix à vérifier" : "Check price";
  if (!tool.defaultMonthlyPrice || tool.defaultMonthlyPrice <= 0) return locale === "fr" ? "Plan gratuit possible" : "Free plan possible";
  const price = `${Math.round(tool.defaultMonthlyPrice * 100) / 100}€/${locale === "fr" ? "mois" : "mo"}`;
  return locale === "fr" ? `Dès ${price}` : `From ${price}`;
}
function getExpertTips(stack: StackGuide): StackInsight[] {
  return EXPERT_TIPS_BY_STACK[stack.slug] || EXPERT_TIPS_BY_PERSONA[stack.persona] || [];
}
function getOverviewTitle(stack: StackGuide): string {
  return `Une stack pour ${stack.bestFor.split(".")[0].toLowerCase()}.`;
}
function getOverviewTitleEn(stack: StackGuide): string {
  return `A stack to ${stack.bestForEn.split(".")[0].toLowerCase()}.`;
}
function getToolDecisionStatus(slot: { role: string; decision?: "core" | "conditional" | "challenge" }) {
  if (slot.decision === "challenge")   return { key: "challenge"   as const, labelFr: "À challenger", labelEn: "Challenge",   className: "border-destructive/25 bg-destructive/8 text-destructive" };
  if (slot.decision === "conditional") return { key: "conditional" as const, labelFr: "Optionnel",    labelEn: "Optional",    className: "border-primary/25 bg-primary/8 text-primary" };
  if (slot.decision === "core")        return { key: "core"        as const, labelFr: "Essentiel",    labelEn: "Essential",   className: "border-keep/25 bg-keep/10 text-keep" };
  const norm = slot.role.toLowerCase();
  const challengeKw = ["avancé", "advanced", "suite", "backlinks", "connecteurs", "connectors", "handoff", "vectoriel", "photo", "crm agence"];
  const optionalKw  = ["plugin", "feedback", "prospection", "social", "seo", "ux", "workshop", "atelier", "prototype", "ia"];
  if (challengeKw.some((kw) => norm.includes(kw))) return { key: "challenge"   as const, labelFr: "À challenger", labelEn: "Challenge", className: "border-destructive/25 bg-destructive/8 text-destructive" };
  if (optionalKw.some((kw)  => norm.includes(kw))) return { key: "conditional" as const, labelFr: "Optionnel", labelEn: "Optional", className: "border-primary/25 bg-primary/8 text-primary" };
  return { key: "core" as const, labelFr: "Essentiel", labelEn: "Essential", className: "border-keep/25 bg-keep/10 text-keep" };
}

export default StackDetailPage;
