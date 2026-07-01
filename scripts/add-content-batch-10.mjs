/** add-content-batch-10.mjs — aiAngle pour Todoist, Obsidian, Raycast,
 * Superhuman + contenu complet pour Bitwarden, LastPass, Meta Ads,
 * Harvest. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  todoist: {
    stance: "augmente",
    augmentFr: "Todoist a ajouté la saisie en langage naturel assistée par IA pour créer des tâches plus vite, mais reste fondamentalement un gestionnaire de tâches structuré — l'IA accélère la saisie, pas la priorisation ou l'exécution.",
    augmentEn: "Todoist added AI-assisted natural language input to create tasks faster, but remains fundamentally a structured task manager — AI speeds up entry, not prioritization or execution.",
    replaceFr: "Remplacer Todoist par une IA ? Non : organiser ses tâches avec des dates, projets et priorités reste un besoin structurel que l'IA assiste sans remplacer. Elle aide à saisir une tâche par description naturelle, elle ne fait pas le travail à ta place. Verdict : l'IA augmente la saisie, la structure des tâches reste le produit.",
    replaceEn: "Replace Todoist with an AI? No: organizing tasks with dates, projects, and priorities remains a structural need AI assists without replacing. It helps enter a task via natural description, it doesn't do the work for you. Verdict: AI augments entry, task structure remains the product.",
    aiTools: [],
  },
  obsidian: {
    stance: "augmente",
    augmentFr: "Obsidian profite de plugins IA tiers (résumé, génération de liens entre notes) construits par sa communauté, mais reste fondamentalement un système de notes liées en local — l'IA ajoute des capacités, elle ne change pas la philosophie de l'outil.",
    augmentEn: "Obsidian benefits from third-party AI plugins (summarization, note-linking generation) built by its community, but remains fundamentally a local linked-notes system — AI adds capabilities, it doesn't change the tool's philosophy.",
    replaceFr: "Remplacer Obsidian par une IA ? Non : la valeur d'Obsidian est de garder ses notes en local, sous son contrôle, avec des liens bidirectionnels construits au fil du temps — un système de pensée personnel que l'IA ne remplace pas. Elle peut aider à résumer ou relier des notes. Verdict : l'IA augmente l'exploitation des notes, le système de pensée reste personnel.",
    replaceEn: "Replace Obsidian with an AI? No: Obsidian's value is keeping notes local, under your control, with bidirectional links built over time — a personal thinking system AI doesn't replace. It can help summarize or link notes. Verdict: AI augments note usage, the thinking system remains personal.",
    aiTools: [],
  },
  raycast: {
    stance: "augmente",
    augmentFr: "Raycast a intégré un accès direct à plusieurs modèles IA (GPT, Claude) directement dans son lanceur d'applications Mac, ce qui en fait l'un des launchers les plus IA-natifs du marché — sans changer sa fonction première de lancement rapide d'actions.",
    augmentEn: "Raycast integrated direct access to several AI models (GPT, Claude) right into its Mac app launcher, making it one of the most AI-native launchers on the market — without changing its core function of fast action launching.",
    replaceFr: "Remplacer Raycast par une IA ? Non, la question s'inverse plutôt : Raycast est devenu une des meilleures façons d'accéder à l'IA au quotidien sur Mac, en plus de ses fonctions de lancement classiques. Verdict : Raycast a absorbé l'IA comme fonctionnalité plutôt que d'être challengé par elle.",
    replaceEn: "Replace Raycast with an AI? No, the question flips: Raycast has become one of the best ways to access AI daily on Mac, alongside its classic launching functions. Verdict: Raycast absorbed AI as a feature rather than being challenged by it.",
    aiTools: ["chatgpt", "claude"],
  },
  superhuman: {
    stance: "augmente",
    augmentFr: "Superhuman a construit sa proposition de valeur récente autour de l'IA (rédaction de réponses, tri automatique, résumé de fils) en plus de sa rapidité historique — l'IA est devenue un argument central de vente, pas juste un ajout.",
    augmentEn: "Superhuman built its recent value proposition around AI (drafting replies, automatic triage, thread summaries) on top of its historical speed — AI has become a central selling point, not just an add-on.",
    replaceFr: "Remplacer Superhuman par une IA ? La question est presque inversée : Superhuman EST en grande partie une expérience email construite autour de l'IA. Sans son moteur IA, il reste un client mail rapide ; avec, c'est ce qui justifie son prix premium face à Gmail gratuit. Verdict : l'IA est devenue le produit principal, pas un simple ajout.",
    replaceEn: "Replace Superhuman with an AI? The question is almost inverted: Superhuman IS largely an email experience built around AI. Without its AI engine, it remains a fast mail client; with it, that's what justifies its premium price against free Gmail. Verdict: AI has become the main product, not just an add-on.",
    aiTools: ["chatgpt"],
  },
};

const CONTENT = {
  bitwarden: {
    shortDescription: "Gestionnaire de mots de passe open source, gratuit et multiplateforme.",
    shortDescriptionEn: "Open-source, free, cross-platform password manager.",
    longDescription: "Bitwarden est le gestionnaire de mots de passe open source de référence : code source vérifiable, chiffrement de bout en bout, et une version gratuite déjà très complète (mots de passe illimités, synchronisation sur tous les appareils). C'est l'alternative la plus citée à 1Password pour qui veut une sécurité équivalente sans payer.\n\nPour un freelance ou une petite équipe, le plan gratuit couvre largement les besoins de base ; le partage d'équipe avancé et certains rapports de sécurité nécessitent le plan payant, qui reste nettement moins cher que la concurrence.",
    longDescriptionEn: "Bitwarden is the reference open-source password manager: verifiable source code, end-to-end encryption, and an already very complete free version (unlimited passwords, sync across all devices). It's the most-cited alternative to 1Password for anyone who wants equivalent security without paying.\n\nFor a freelancer or small team, the free plan largely covers basic needs; advanced team sharing and certain security reports require the paid plan, which remains notably cheaper than the competition.",
    pricing: "Gratuit (mots de passe illimités) ; Premium à ~10$/an, Famille à ~40$/an.",
    pricingEn: "Free (unlimited passwords); Premium at ~$10/year, Family at ~$40/year.",
    pros: ["Open source et auditable, transparence rare dans la catégorie", "Version gratuite déjà très complète, sans limite de mots de passe", "Prix Premium très inférieur à 1Password ou LastPass pour des fonctionnalités proches"],
    prosEn: ["Open source and auditable, rare transparency in the category", "Already very complete free version, no password limit", "Premium price much lower than 1Password or LastPass for similar features"],
    cons: ["Interface moins polie que 1Password, surtout sur certaines apps mobiles", "Communauté de support moins large que les leaders payants", "Fonctionnalités d'équipe avancées moins riches que 1Password Business"],
    consEn: ["Less polished interface than 1Password, especially on some mobile apps", "Smaller support community than paid leaders", "Advanced team features less rich than 1Password Business"],
    useCases: ["Centraliser ses mots de passe gratuitement sans limite de nombre", "Profiter d'un gestionnaire de mots de passe open source et auditable", "Migrer depuis un autre gestionnaire payant pour réduire les coûts"],
    useCasesEn: ["Centralize passwords for free with no limit on quantity", "Use an open-source, auditable password manager", "Migrate from another paid manager to cut costs"],
    verdict: {
      keepIf: ["Tu veux un gestionnaire de mots de passe sérieux sans payer", "La transparence open source compte pour toi"],
      avoidIf: ["Tu veux l'interface la plus polie du marché, peu importe le prix", "Tu as besoin de fonctionnalités d'équipe très avancées (1Password Business)"],
      threshold: "Excellent choix par défaut, surtout en version gratuite ; 1Password reste plus poli si le budget n'est pas un souci.",
    },
    verdictEn: {
      keepIf: ["You want a serious password manager without paying", "Open-source transparency matters to you"],
      avoidIf: ["You want the most polished interface on the market regardless of price", "You need very advanced team features (1Password Business)"],
      threshold: "Excellent default choice, especially the free version; 1Password remains more polished if budget isn't a concern.",
    },
  },
  lastpass: {
    shortDescription: "Gestionnaire de mots de passe grand public, avec une version gratuite limitée.",
    shortDescriptionEn: "Mainstream password manager, with a limited free version.",
    longDescription: "LastPass est l'un des gestionnaires de mots de passe les plus connus du grand public, mais a subi plusieurs incidents de sécurité majeurs (fuite de données en 2022) qui ont entaché sa réputation et poussé une partie de ses utilisateurs vers Bitwarden ou 1Password.\n\nLa version gratuite est désormais limitée à un seul type d'appareil (mobile OU ordinateur, plus les deux comme avant), ce qui réduit fortement son intérêt face à des concurrents plus généreux.",
    longDescriptionEn: "LastPass is one of the most well-known mainstream password managers, but suffered several major security incidents (a 2022 data breach) that tarnished its reputation and pushed many users toward Bitwarden or 1Password.\n\nThe free version is now limited to one device type (mobile OR computer, no longer both), significantly reducing its appeal against more generous competitors.",
    pricing: "Gratuit (limité à un type d'appareil) ; Premium à partir de ~3$/mois.",
    pricingEn: "Free (limited to one device type); Premium from ~$3/month.",
    pros: ["Marque connue et largement utilisée depuis longtemps", "Interface simple et accessible pour les débutants", "Fonctionnalités de partage familial disponibles"],
    prosEn: ["Well-known brand, widely used for a long time", "Simple, accessible interface for beginners", "Family sharing features available"],
    cons: ["Antécédents de fuites de sécurité majeures, dont une en 2022", "Version gratuite désormais limitée à un seul type d'appareil", "Bitwarden offre une alternative gratuite plus complète et open source"],
    consEn: ["History of major security breaches, including one in 2022", "Free version now limited to one device type", "Bitwarden offers a more complete, open-source free alternative"],
    useCases: ["Centraliser ses mots de passe sur un seul type d'appareil gratuitement", "Partager des accès en famille via le plan Premium", "Migrer progressivement vers un gestionnaire de mots de passe pour la première fois"],
    useCasesEn: ["Centralize passwords on one device type for free", "Share access with family via the Premium plan", "Gradually migrate to a password manager for the first time"],
    verdict: {
      keepIf: ["Tu utilises déjà LastPass depuis longtemps sans problème", "Tu veux une marque connue et une interface simple"],
      avoidIf: ["Les antécédents de sécurité de l'entreprise t'inquiètent", "Tu veux une alternative gratuite plus complète — Bitwarden est objectivement meilleur sur ce point"],
      threshold: "Bitwarden ou 1Password sont aujourd'hui des choix plus solides pour un nouveau départ.",
    },
    verdictEn: {
      keepIf: ["You've already used LastPass for a long time with no issues", "You want a well-known brand and a simple interface"],
      avoidIf: ["The company's security history concerns you", "You want a more complete free alternative — Bitwarden is objectively better here"],
      threshold: "Bitwarden or 1Password are today more solid choices for a fresh start.",
    },
  },
  "meta-ads": {
    shortDescription: "Plateforme publicitaire de Facebook et Instagram pour cibler une audience par centres d'intérêt et comportements.",
    shortDescriptionEn: "Facebook and Instagram's advertising platform to target audiences by interests and behaviors.",
    longDescription: "Meta Ads (anciennement Facebook Ads) permet de diffuser des publicités sur Facebook, Instagram, Messenger et Audience Network, avec un ciblage précis par centres d'intérêt, comportements, audiences similaires (lookalike) et retargeting des visiteurs d'un site.\n\nC'est historiquement la plateforme publicitaire la plus mature pour le ciblage comportemental, bien que l'iOS 14 d'Apple (limitation du tracking) ait réduit la précision du ciblage et du suivi de conversion depuis 2021.",
    longDescriptionEn: "Meta Ads (formerly Facebook Ads) lets you run ads on Facebook, Instagram, Messenger, and Audience Network, with precise targeting by interests, behaviors, lookalike audiences, and retargeting of site visitors.\n\nIt's historically the most mature ad platform for behavioral targeting, although Apple's iOS 14 (tracking limitation) has reduced targeting and conversion-tracking accuracy since 2021.",
    pricing: "Budget de campagne libre, dès quelques euros par jour ; coût par clic variable selon la niche et la concurrence.",
    pricingEn: "Free campaign budget, from a few dollars a day; cost per click varies by niche and competition.",
    defaultMonthlyPrice: 0,
    pros: ["Ciblage par centres d'intérêt et comportements parmi les plus fins du marché", "Couvre Facebook et Instagram en une seule plateforme publicitaire", "Outils de retargeting puissants pour reconvertir les visiteurs d'un site"],
    prosEn: ["Interest and behavior targeting among the finest on the market", "Covers Facebook and Instagram in a single ad platform", "Powerful retargeting tools to reconvert site visitors"],
    cons: ["Précision de ciblage réduite depuis les restrictions de tracking d'Apple (iOS 14)", "Courbe d'apprentissage réelle pour optimiser les campagnes efficacement", "Coûts publicitaires qui ont augmenté avec la concurrence croissante sur la plateforme"],
    consEn: ["Targeting precision reduced since Apple's tracking restrictions (iOS 14)", "Real learning curve to optimize campaigns effectively", "Ad costs that have risen with growing competition on the platform"],
    useCases: ["Acquérir des clients via du retargeting sur les visiteurs d'un site", "Tester rapidement un produit ou une offre auprès d'une audience ciblée", "Construire une audience similaire (lookalike) à partir de clients existants"],
    useCasesEn: ["Acquire customers via retargeting on site visitors", "Quickly test a product or offer with a targeted audience", "Build a lookalike audience based on existing customers"],
    verdict: {
      keepIf: ["Ton audience cible est active sur Facebook ou Instagram", "Tu as un site avec assez de trafic pour faire du retargeting efficace"],
      avoidIf: ["Ton audience est purement B2B technique — LinkedIn Ads cible mieux ce profil", "Tu n'as pas le budget ou le temps pour tester et optimiser sur la durée"],
      threshold: "Pertinent dès que tu as un minimum de budget test et un site avec du trafic à retargeter.",
    },
    verdictEn: {
      keepIf: ["Your target audience is active on Facebook or Instagram", "You have a site with enough traffic for effective retargeting"],
      avoidIf: ["Your audience is purely technical B2B — LinkedIn Ads targets that profile better", "You don't have the budget or time to test and optimize over time"],
      threshold: "Worth it once you have a minimum test budget and a site with traffic to retarget.",
    },
  },
  harvest: {
    pros: ["Suivi du temps couplé directement à la facturation et aux budgets projet", "Rapports de rentabilité par projet ou par client clairs et lisibles", "Intégrations natives avec des outils de gestion de projet (Asana, Trello)"],
    prosEn: ["Time tracking directly linked to invoicing and project budgets", "Clear, readable profitability reports by project or client", "Native integrations with project management tools (Asana, Trello)"],
    cons: ["Moins riche en fonctionnalités pures de suivi que Toggl pour un usage simple", "Tarification par utilisateur qui monte avec la taille de l'équipe", "Interface un peu datée comparée à des outils plus récents"],
    consEn: ["Less feature-rich for pure time tracking than Toggl for simple use", "Per-user pricing that rises with team size", "Interface a bit dated compared to newer tools"],
    useCases: ["Suivre le temps et la rentabilité de plusieurs projets clients simultanément", "Facturer directement à partir du temps suivi sans ressaisie", "Donner de la visibilité sur les budgets projet dépassés ou respectés"],
    useCasesEn: ["Track time and profitability across several client projects simultaneously", "Invoice directly from tracked time with no re-entry", "Give visibility on whether project budgets are exceeded or respected"],
    verdict: {
      keepIf: ["Tu gères plusieurs projets clients et veux suivre leur rentabilité réelle", "Tu veux facturer directement depuis le suivi du temps sans outil séparé"],
      avoidIf: ["Tu veux juste un chrono simple sans facturation — Toggl est plus léger", "Ton équipe est nombreuse et le coût par utilisateur devient élevé"],
      threshold: "Pertinent pour qui facture au temps passé sur plusieurs projets et veut suivre la rentabilité.",
    },
    verdictEn: {
      keepIf: ["You manage several client projects and want to track real profitability", "You want to invoice directly from time tracking without a separate tool"],
      avoidIf: ["You just want a simple timer with no invoicing — Toggl is lighter", "Your team is large and the per-user cost becomes high"],
      threshold: "Worth it for anyone billing by time across multiple projects who wants to track profitability.",
    },
  },
};

let updated = 0;
for (const [slug, fields] of Object.entries(CONTENT)) {
  const tool = tools.find((x) => (x.slug || x.id) === slug);
  if (!tool) { console.warn(`⚠️  ${slug} not found`); continue; }
  for (const [key, value] of Object.entries(fields)) tool[key] = value;
  if (fields.longDescription) tool.description = fields.longDescription;
  updated++;
  console.log(`✓ ${tool.name} (${slug}) contenu complet`);
}
for (const [slug, angle] of Object.entries(ANGLES)) {
  if (!present.has(slug)) { console.warn(`⚠️  ${slug} not found, skipping`); continue; }
  const tool = tools.find((x) => (x.slug || x.id) === slug);
  tool.seo = Object.assign({}, tool.seo, { aiAngle: angle });
  updated++;
  console.log(`✓ ${tool.name} (${slug}): aiAngle ${angle.stance}`);
}
writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log(`\n${updated} fiches mises à jour.`);
