/** add-ai-angle-batch-26.mjs — aiAngle pour BigQuery, Snowflake, GitHub
 * Actions, Resend, SamCart, Lighthouse, Spline, Brandmark. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  bigquery: {
    stance: "augmente",
    augmentFr: "BigQuery a ajouté BigQuery ML et l'intégration avec Gemini pour analyser des données par requête en langage naturel, mais reste un entrepôt de données massif — une infrastructure de stockage et calcul, pas un générateur.",
    augmentEn: "BigQuery added BigQuery ML and Gemini integration to analyze data via natural-language queries, but remains a massive data warehouse — storage and compute infrastructure, not a generator.",
    replaceFr: "Remplacer BigQuery par une IA ? Non : stocker et requêter des téraoctets de données réelles à grande échelle reste un besoin d'infrastructure technique. L'IA aide à interroger les données en langage naturel, elle ne remplace pas l'entrepôt de données. Verdict : l'IA augmente l'accès aux données, l'infrastructure reste le produit.",
    replaceEn: "Replace BigQuery with an AI? No: storing and querying terabytes of real data at scale remains a technical infrastructure need. AI helps query data in natural language, it doesn't replace the data warehouse. Verdict: AI augments data access, infrastructure remains the product.",
    aiTools: [],
  },
  snowflake: {
    stance: "augmente",
    augmentFr: "Snowflake a intégré Cortex AI pour analyser des données par requête en langage naturel, mais reste un entrepôt de données cloud pour entreprises — une infrastructure de stockage massif, pas un générateur de contenu.",
    augmentEn: "Snowflake integrated Cortex AI to analyze data via natural-language queries, but remains a cloud data warehouse for enterprises — massive storage infrastructure, not a content generator.",
    replaceFr: "Remplacer Snowflake par une IA ? Non : centraliser et requêter les données d'une entreprise à grande échelle reste un besoin d'infrastructure technique réel. L'IA facilite l'accès aux données, elle ne remplace pas l'entrepôt. Verdict : l'IA augmente l'analyse de données, l'infrastructure reste le produit.",
    replaceEn: "Replace Snowflake with an AI? No: centralizing and querying a company's data at scale remains a real technical infrastructure need. AI eases data access, it doesn't replace the warehouse. Verdict: AI augments data analysis, infrastructure remains the product.",
    aiTools: [],
  },
  "github-actions": {
    stance: "augmente",
    augmentFr: "GitHub Actions a ajouté des suggestions IA (Copilot) pour générer des workflows CI/CD, mais reste l'infrastructure d'automatisation qui exécute réellement les tests et déploiements à chaque commit.",
    augmentEn: "GitHub Actions added AI suggestions (Copilot) to generate CI/CD workflows, but remains the automation infrastructure that actually runs tests and deployments on every commit.",
    replaceFr: "Remplacer GitHub Actions par une IA ? Non : exécuter réellement des tests et déploiements automatisés à chaque modification de code reste un besoin d'infrastructure technique. L'IA aide à écrire le workflow, elle ne remplace pas l'exécution. Verdict : l'IA augmente la configuration, l'infrastructure d'exécution reste le produit.",
    replaceEn: "Replace GitHub Actions with an AI? No: actually running automated tests and deployments on every code change remains a technical infrastructure need. AI helps write the workflow, it doesn't replace execution. Verdict: AI augments configuration, execution infrastructure remains the product.",
    aiTools: [],
  },
  resend: {
    stance: "augmente",
    augmentFr: "Resend est une API d'envoi d'emails transactionnels pensée pour les développeurs, sans IA native — sa valeur est la simplicité d'intégration et la délivrabilité, pas la génération de contenu.",
    augmentEn: "Resend is a transactional email API built for developers, with no native AI — its value is integration simplicity and deliverability, not content generation.",
    replaceFr: "Remplacer Resend par une IA ? Non : envoyer des emails transactionnels (confirmation, reset de mot de passe) de façon fiable et délivrable reste un besoin d'infrastructure technique. Verdict : l'IA n'a pas de rôle direct ici, l'infrastructure d'envoi reste le produit.",
    replaceEn: "Replace Resend with an AI? No: reliably and deliverably sending transactional emails (confirmation, password reset) remains a technical infrastructure need. Verdict: AI has no direct role here, sending infrastructure remains the product.",
    aiTools: [],
  },
  samcart: {
    stance: "augmente",
    augmentFr: "SamCart a ajouté des suggestions IA pour optimiser les pages de paiement, mais reste une plateforme de checkout spécialisée pour vendre des formations, coaching et produits digitaux en ligne.",
    augmentEn: "SamCart added AI suggestions to optimize checkout pages, but remains a specialized checkout platform for selling courses, coaching, and digital products online.",
    replaceFr: "Remplacer SamCart par une IA ? Non : encaisser un paiement de façon sécurisée avec upsells et bump offers reste un besoin d'infrastructure de paiement. L'IA aide à optimiser la page, elle ne remplace pas le système de checkout. Verdict : l'IA augmente l'optimisation de conversion, l'infrastructure de paiement reste le produit.",
    replaceEn: "Replace SamCart with an AI? No: securely collecting payment with upsells and bump offers remains a payment infrastructure need. AI helps optimize the page, it doesn't replace the checkout system. Verdict: AI augments conversion optimization, payment infrastructure remains the product.",
    aiTools: [],
  },
  lighthouse: {
    stance: "augmente",
    augmentFr: "Lighthouse (Google) utilise déjà des modèles pour scorer la performance, l'accessibilité et le SEO d'une page, mais reste un outil de mesure technique objective basé sur des données réelles de chargement.",
    augmentEn: "Lighthouse (Google) already uses models to score a page's performance, accessibility, and SEO, but remains an objective technical measurement tool based on real loading data.",
    replaceFr: "Remplacer Lighthouse par une IA ? Non : mesurer objectivement le temps de chargement et l'accessibilité réels d'une page nécessite des données de performance réelles, pas de la génération. Verdict : l'IA aide à interpréter le rapport, elle ne peut pas inventer la mesure elle-même.",
    replaceEn: "Replace Lighthouse with an AI? No: objectively measuring a page's real load time and accessibility requires real performance data, not generation. Verdict: AI helps interpret the report, it can't invent the measurement itself.",
    aiTools: [],
  },
  spline: {
    stance: "augmente",
    augmentFr: "Spline a ajouté un générateur de texture et de matériaux par IA, mais reste un outil de design 3D collaboratif dans le navigateur — la modélisation et l'animation 3D restent un travail créatif manuel assisté.",
    augmentEn: "Spline added an AI texture and material generator, but remains a collaborative in-browser 3D design tool — 3D modeling and animation remain assisted manual creative work.",
    replaceFr: "Remplacer Spline par une IA ? Non : modéliser et animer une scène 3D interactive avec une intention de design précise reste un travail créatif que l'IA assiste (textures générées) sans remplacer. Verdict : l'IA augmente la création de matériaux, la modélisation 3D reste un savoir-faire humain.",
    replaceEn: "Replace Spline with an AI? No: modeling and animating an interactive 3D scene with precise design intent remains creative work AI assists (generated textures) without replacing. Verdict: AI augments material creation, 3D modeling remains a human skill.",
    aiTools: [],
  },
  brandmark: {
    stance: "challenge",
    augmentFr: "Brandmark génère des logos et identités de marque par algorithme depuis longtemps, une approche désormais challengée par des générateurs IA plus récents (Looka, Midjourney) offrant plus de variété créative.",
    augmentEn: "Brandmark has long generated logos and brand identities algorithmically, an approach now challenged by newer AI generators (Looka, Midjourney) offering more creative variety.",
    replaceFr: "Remplacer Brandmark par une IA plus récente ? Pour la variété créative et la qualité visuelle, les générateurs IA récents prennent souvent l'avantage. Brandmark garde l'intérêt de fichiers vectoriels directement exploitables. Verdict : challengé sur la créativité par des outils IA plus récents, solide sur la livraison de fichiers utilisables.",
    replaceEn: "Replace Brandmark with a newer AI? For creative variety and visual quality, newer AI generators often take the lead. Brandmark retains the appeal of directly usable vector files. Verdict: challenged on creativity by newer AI tools, solid on delivering usable files.",
    aiTools: ["midjourney"],
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
