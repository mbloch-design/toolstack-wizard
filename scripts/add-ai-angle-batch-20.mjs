/** add-ai-angle-batch-20.mjs — aiAngle pour Microsoft Azure, ManageWP,
 * PageSpeed Insights, Screaming Frog, Snyk, ShipStation, RevenueCat,
 * VS Code. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  azure: {
    stance: "augmente",
    augmentFr: "Microsoft Azure héberge directement les modèles OpenAI (via Azure OpenAI Service) en plus de son offre cloud classique, mais reste une infrastructure de calcul, stockage et réseau — un besoin technique, pas un générateur en soi.",
    augmentEn: "Microsoft Azure directly hosts OpenAI models (via Azure OpenAI Service) alongside its classic cloud offering, but remains compute, storage, and network infrastructure — a technical need, not a generator itself.",
    replaceFr: "Remplacer Azure par une IA ? Non : héberger des applications et données d'entreprise reste un besoin d'infrastructure réglementée. Azure héberge même les modèles IA d'autres entreprises plutôt que d'être remplacé par eux. Verdict : l'IA s'ajoute en service complémentaire, l'infrastructure reste le produit.",
    replaceEn: "Replace Azure with an AI? No: hosting enterprise applications and data remains a regulated infrastructure need. Azure even hosts other companies' AI models rather than being replaced by them. Verdict: AI is added as a complementary service, infrastructure remains the product.",
    aiTools: [],
  },
  managewp: {
    stance: "augmente",
    augmentFr: "ManageWP centralise la gestion de plusieurs sites WordPress (mises à jour, sauvegardes, sécurité) depuis un seul tableau de bord — un besoin opérationnel pour les agences et freelances qui gèrent plusieurs sites clients.",
    augmentEn: "ManageWP centralizes management of multiple WordPress sites (updates, backups, security) from a single dashboard — an operational need for agencies and freelancers managing several client sites.",
    replaceFr: "Remplacer ManageWP par une IA ? Non : appliquer des mises à jour, surveiller la sécurité et sauvegarder plusieurs sites WordPress reste un besoin opérationnel d'infrastructure. Verdict : l'IA n'a pas de rôle direct ici, la gestion multi-sites reste le produit.",
    replaceEn: "Replace ManageWP with an AI? No: applying updates, monitoring security, and backing up multiple WordPress sites remains an operational infrastructure need. Verdict: AI has no direct role here, multi-site management remains the product.",
    aiTools: [],
  },
  "pagespeed-insights": {
    stance: "augmente",
    augmentFr: "PageSpeed Insights utilise déjà des modèles de Google (Lighthouse) pour analyser et scorer la performance d'une page, mais reste un outil de mesure technique objective, pas un générateur de contenu.",
    augmentEn: "PageSpeed Insights already uses Google models (Lighthouse) to analyze and score a page's performance, but remains an objective technical measurement tool, not a content generator.",
    replaceFr: "Remplacer PageSpeed Insights par une IA ? Non : mesurer objectivement le temps de chargement réel d'une page nécessite des données de performance réelles, pas de la génération. Verdict : l'IA aide à interpréter le rapport, elle ne peut pas inventer la mesure elle-même.",
    replaceEn: "Replace PageSpeed Insights with an AI? No: objectively measuring a page's real load time requires real performance data, not generation. Verdict: AI helps interpret the report, it can't invent the measurement itself.",
    aiTools: [],
  },
  "screaming-frog": {
    stance: "augmente",
    augmentFr: "Screaming Frog reste un crawler SEO technique qui explore un site comme le fait Google pour détecter des erreurs (liens cassés, balises manquantes) — un besoin de données réelles, pas de génération.",
    augmentEn: "Screaming Frog remains a technical SEO crawler that explores a site like Google does to detect errors (broken links, missing tags) — a real-data need, not generation.",
    replaceFr: "Remplacer Screaming Frog par une IA ? Non : détecter les erreurs techniques réelles d'un site (404, redirections, balises manquantes) nécessite de crawler le site réellement, pas de générer une réponse. Verdict : l'IA aide à analyser les résultats, elle ne remplace pas le crawl.",
    replaceEn: "Replace Screaming Frog with an AI? No: detecting a site's real technical errors (404s, redirects, missing tags) requires actually crawling the site, not generating a response. Verdict: AI helps analyze results, it doesn't replace the crawl.",
    aiTools: [],
  },
  snyk: {
    stance: "augmente",
    augmentFr: "Snyk a ajouté l'IA (DeepCode AI) pour générer des correctifs de sécurité automatiques, mais reste l'infrastructure de scan de vulnérabilités dans le code et les dépendances open source.",
    augmentEn: "Snyk added AI (DeepCode AI) to generate automatic security fixes, but remains the infrastructure for scanning vulnerabilities in code and open-source dependencies.",
    replaceFr: "Remplacer Snyk par une IA ? Non : détecter des vulnérabilités réelles dans des dépendances open source nécessite une base de données de vulnérabilités connues à jour, pas seulement de la génération. L'IA aide à corriger plus vite, elle ne remplace pas la détection. Verdict : l'IA augmente la correction, la détection reste l'infrastructure clé.",
    replaceEn: "Replace Snyk with an AI? No: detecting real vulnerabilities in open-source dependencies requires an up-to-date known-vulnerability database, not just generation. AI helps fix faster, it doesn't replace detection. Verdict: AI augments fixing, detection remains the key infrastructure.",
    aiTools: [],
  },
  shipstation: {
    stance: "augmente",
    augmentFr: "ShipStation a ajouté des suggestions IA pour optimiser le choix de transporteur, mais reste l'infrastructure d'expédition (étiquettes, tarifs négociés, suivi) pour les boutiques en ligne.",
    augmentEn: "ShipStation added AI suggestions to optimize carrier choice, but remains the shipping infrastructure (labels, negotiated rates, tracking) for online stores.",
    replaceFr: "Remplacer ShipStation par une IA ? Non : générer des étiquettes d'expédition avec des tarifs négociés et suivre les colis reste un besoin d'infrastructure logistique réelle. L'IA aide à choisir le meilleur transporteur, elle ne remplace pas l'expédition elle-même. Verdict : l'IA augmente l'optimisation logistique, l'infrastructure d'expédition reste le produit.",
    replaceEn: "Replace ShipStation with an AI? No: generating shipping labels with negotiated rates and tracking packages remains a real logistics infrastructure need. AI helps choose the best carrier, it doesn't replace shipping itself. Verdict: AI augments logistics optimization, shipping infrastructure remains the product.",
    aiTools: [],
  },
  revenuecat: {
    stance: "augmente",
    augmentFr: "RevenueCat a ajouté des analyses IA pour prédire le churn et optimiser les prix, mais reste l'infrastructure de gestion des abonnements in-app (iOS, Android) pour les développeurs mobiles.",
    augmentEn: "RevenueCat added AI analytics to predict churn and optimize pricing, but remains the in-app subscription management infrastructure (iOS, Android) for mobile developers.",
    replaceFr: "Remplacer RevenueCat par une IA ? Non : gérer les abonnements in-app sur iOS et Android, avec leurs règles spécifiques à chaque store, reste un besoin d'infrastructure technique réglementée. L'IA aide à analyser le comportement des abonnés, elle ne remplace pas la gestion des abonnements. Verdict : l'IA augmente l'analyse, l'infrastructure reste indispensable.",
    replaceEn: "Replace RevenueCat with an AI? No: managing in-app subscriptions on iOS and Android, each with their store-specific rules, remains a regulated technical infrastructure need. AI helps analyze subscriber behavior, it doesn't replace subscription management. Verdict: AI augments analysis, infrastructure remains essential.",
    aiTools: [],
  },
  "vs-code": {
    stance: "augmente",
    augmentFr: "VS Code a intégré GitHub Copilot directement dans l'éditeur pour la complétion de code par IA, devenant l'un des éditeurs les plus IA-natifs du marché, sans changer son rôle fondamental d'éditeur de code.",
    augmentEn: "VS Code integrated GitHub Copilot directly into the editor for AI code completion, becoming one of the most AI-native editors on the market, without changing its fundamental role as a code editor.",
    replaceFr: "Remplacer VS Code par une IA ? Non, la question s'inverse : VS Code est devenu l'interface principale pour utiliser l'IA de codage (Copilot) au quotidien. Verdict : VS Code a absorbé l'IA comme fonctionnalité centrale plutôt que d'être challengé par elle.",
    replaceEn: "Replace VS Code with an AI? No, the question flips: VS Code has become the main interface for using coding AI (Copilot) daily. Verdict: VS Code absorbed AI as a central feature rather than being challenged by it.",
    aiTools: ["github-copilot"],
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
