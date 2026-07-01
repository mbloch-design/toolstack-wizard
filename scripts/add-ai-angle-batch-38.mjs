/** add-ai-angle-batch-38.mjs — aiAngle pour Arc Browser, Microsoft 365,
 * PhantomBuster, Warp, Reclaim AI, Scribe, Superwhisper, Waalaxy. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  "arc-browser": {
    stance: "augmente",
    augmentFr: "Arc Browser a intégré des fonctionnalités IA (résumé de page, recherche en langage naturel) directement dans le navigateur, en plus de son interface réinventée par espaces et onglets verticaux.",
    augmentEn: "Arc Browser integrated AI features (page summaries, natural-language search) directly into the browser, alongside its reinvented interface with spaces and vertical tabs.",
    replaceFr: "Remplacer Arc Browser par une IA ? Non : naviguer sur le web reste un besoin d'infrastructure logicielle de base. L'IA aide à résumer des pages ou organiser sa navigation, elle ne remplace pas le navigateur lui-même. Verdict : l'IA augmente l'expérience de navigation, le navigateur reste indispensable.",
    replaceEn: "Replace Arc Browser with an AI? No: browsing the web remains a basic software infrastructure need. AI helps summarize pages or organize browsing, it doesn't replace the browser itself. Verdict: AI augments the browsing experience, the browser remains essential.",
    aiTools: [],
  },
  "microsoft-365": {
    stance: "augmente",
    augmentFr: "Microsoft 365 a intégré Copilot directement dans Word, Excel, Outlook et Teams, mais reste la suite bureautique elle-même — l'IA s'ajoute en couche d'assistance plutôt que de remplacer les outils.",
    augmentEn: "Microsoft 365 integrated Copilot directly into Word, Excel, Outlook, and Teams, but remains the office suite itself — AI is added as an assistance layer rather than replacing the tools.",
    replaceFr: "Remplacer Microsoft 365 par une IA ? Non : la collaboration documentaire et la messagerie d'entreprise restent un besoin d'infrastructure que l'IA assiste sans remplacer. Verdict : l'IA augmente la productivité dans chaque outil, la suite bureautique reste le produit.",
    replaceEn: "Replace Microsoft 365 with an AI? No: document collaboration and enterprise messaging remain an infrastructure need AI assists without replacing. Verdict: AI augments productivity within each tool, the office suite remains the product.",
    aiTools: ["microsoft-365-copilot"],
  },
  phantombuster: {
    stance: "augmente",
    augmentFr: "PhantomBuster automatise l'extraction de données depuis LinkedIn, Twitter et d'autres plateformes (scraping), avec des fonctionnalités IA pour traiter ces données, mais reste un outil d'automatisation technique.",
    augmentEn: "PhantomBuster automates data extraction from LinkedIn, Twitter, and other platforms (scraping), with AI features to process this data, but remains a technical automation tool.",
    replaceFr: "Remplacer PhantomBuster par une IA ? Non : extraire réellement des données depuis des plateformes tierces nécessite des automatisations techniques précises (scraping), pas seulement de la génération. L'IA aide à traiter les données extraites. Verdict : l'IA augmente le traitement des données, l'extraction technique reste l'infrastructure clé.",
    replaceEn: "Replace PhantomBuster with an AI? No: actually extracting data from third-party platforms requires precise technical automations (scraping), not just generation. AI helps process the extracted data. Verdict: AI augments data processing, technical extraction remains the key infrastructure.",
    aiTools: [],
  },
  warp: {
    stance: "augmente",
    augmentFr: "Warp est un terminal construit autour de l'IA dès le départ : génération de commandes en langage naturel, explication d'erreurs, blocs de commande réutilisables — l'un des terminaux les plus IA-natifs du marché.",
    augmentEn: "Warp is a terminal built around AI from the start: natural-language command generation, error explanation, reusable command blocks — one of the most AI-native terminals on the market.",
    replaceFr: "Remplacer Warp par une autre IA ? La question s'inverse : Warp EST déjà une IA de terminal, pas un terminal classique avec de l'IA ajoutée. Verdict : Warp a été conçu autour de l'IA dès le départ plutôt que d'être challengé par elle.",
    replaceEn: "Replace Warp with another AI? The question flips: Warp already IS an AI terminal, not a classic terminal with AI bolted on. Verdict: Warp was built around AI from the start rather than being challenged by it.",
    aiTools: [],
  },
  "reclaim-ai": {
    stance: "augmente",
    augmentFr: "Reclaim AI réorganise automatiquement le calendrier selon les priorités, habitudes et réunions déjà fixées — un algorithme de planification qui délègue l'organisation du temps plutôt qu'une simple synchronisation de calendrier.",
    augmentEn: "Reclaim AI automatically reorganizes the calendar based on priorities, habits, and already-set meetings — a scheduling algorithm that delegates time organization rather than simple calendar syncing.",
    replaceFr: "Remplacer Reclaim AI par une IA générative ? La question s'inverse plutôt : Reclaim EST déjà une IA de planification de calendrier. Sa concurrence vient d'outils similaires comme Motion plutôt que d'IA généralistes. Verdict : l'IA est le produit lui-même, le choix se fait entre outils de planification IA concurrents.",
    replaceEn: "Replace Reclaim AI with a generative AI? The question rather flips: Reclaim already IS a calendar-planning AI. Its competition comes from similar tools like Motion rather than generalist AIs. Verdict: AI is the product itself, the choice is between competing AI planning tools.",
    aiTools: [],
  },
  scribe: {
    stance: "augmente",
    augmentFr: "Scribe enregistre automatiquement les actions effectuées sur un écran et génère un guide pas-à-pas avec captures et descriptions, automatisant une tâche de documentation autrefois entièrement manuelle.",
    augmentEn: "Scribe automatically records actions performed on a screen and generates a step-by-step guide with screenshots and descriptions, automating a documentation task that used to be entirely manual.",
    replaceFr: "Scribe remplace-t-il la rédaction de documentation manuelle ? Largement oui pour des guides de procédure répétitifs (onboarding, processus internes). Pour une documentation technique plus complexe nécessitant du contexte métier, une rédaction humaine reste utile. Verdict : l'IA augmente fortement la création de guides simples, la documentation complexe reste un travail de rédaction humaine.",
    replaceEn: "Does Scribe replace manual documentation writing? Largely yes for repetitive procedure guides (onboarding, internal processes). For more complex technical documentation requiring business context, human writing remains useful. Verdict: AI strongly augments simple guide creation, complex documentation remains human writing work.",
    aiTools: [],
  },
  superwhisper: {
    stance: "augmente",
    augmentFr: "Superwhisper transcrit la voix en texte en temps réel sur Mac avec une précision élevée, permettant de dicter du texte n'importe où plutôt que de taper — un cas d'usage IA ciblé sur la productivité personnelle.",
    augmentEn: "Superwhisper transcribes voice to text in real time on Mac with high accuracy, letting you dictate text anywhere instead of typing — a targeted AI use case for personal productivity.",
    replaceFr: "Superwhisper remplace-t-il la saisie au clavier ? Pour qui pense plus vite qu'il ne tape, oui largement pour de la rédaction rapide. Pour de l'édition fine et de la mise en forme, le clavier reste nécessaire. Verdict : l'IA augmente fortement la vitesse de rédaction pour qui adopte la dictée, le clavier reste utile pour l'édition.",
    replaceEn: "Does Superwhisper replace keyboard typing? For those who think faster than they type, largely yes for quick writing. For fine editing and formatting, the keyboard remains necessary. Verdict: AI strongly augments writing speed for those who adopt dictation, the keyboard remains useful for editing.",
    aiTools: [],
  },
  waalaxy: {
    stance: "augmente",
    augmentFr: "Waalaxy automatise la prospection LinkedIn (invitations, messages de séquence) avec des suggestions IA pour personnaliser les messages, mais reste un outil d'automatisation de la prospection, pas un générateur de leads en soi.",
    augmentEn: "Waalaxy automates LinkedIn prospecting (invitations, sequence messages) with AI suggestions to personalize messages, but remains a prospecting automation tool, not a lead generator in itself.",
    replaceFr: "Remplacer Waalaxy par une IA ? Non : envoyer des invitations et messages automatisés sur LinkedIn à grande échelle reste un besoin d'automatisation technique. L'IA aide à personnaliser les messages, elle ne remplace pas l'infrastructure d'envoi. Verdict : l'IA augmente la personnalisation, l'automatisation d'envoi reste le produit.",
    replaceEn: "Replace Waalaxy with an AI? No: sending automated invitations and messages on LinkedIn at scale remains a technical automation need. AI helps personalize messages, it doesn't replace the sending infrastructure. Verdict: AI augments personalization, sending automation remains the product.",
    aiTools: [],
  },
};

let updated = 0;
for (const [slug, angle] of Object.entries(ANGLES)) {
  if (!present.has(slug)) { console.warn(`⚠️  ${slug} not found, skipping`); continue; }
  const tool = tools.find((x) => (x.slug || x.id) === slug);
  tool.seo = Object.assign({}, tool.seo, { aiAngle: angle });
  updated++;
  console.log(`✓ ${tool.name} (${slug}): aiAngle ${angle.stance}`);
}
writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log(`\n${updated} fiches mises à jour.`);
