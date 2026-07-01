/** add-ai-angle-batch-19.mjs — aiAngle pour Eventbrite, Slido, Google
 * Search Console, Algolia, Clerk, BrowserStack, Infomaniak, Expo. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  eventbrite: {
    stance: "augmente",
    augmentFr: "Eventbrite a ajouté des suggestions IA pour rédiger des descriptions d'événement, mais reste l'infrastructure de billetterie et de gestion d'événements (paiement, inscriptions, check-in) qui fait fonctionner l'événement.",
    augmentEn: "Eventbrite added AI suggestions to write event descriptions, but remains the ticketing and event management infrastructure (payment, registrations, check-in) that runs the event.",
    replaceFr: "Remplacer Eventbrite par une IA ? Non : vendre des billets, gérer les inscriptions et le check-in à l'entrée reste un besoin d'infrastructure opérationnelle. L'IA aide à rédiger la description de l'événement, elle ne remplace pas la billetterie. Verdict : l'IA augmente la rédaction, l'infrastructure de billetterie reste le produit.",
    replaceEn: "Replace Eventbrite with an AI? No: selling tickets, managing registrations, and check-in at the door remains an operational infrastructure need. AI helps write the event description, it doesn't replace ticketing. Verdict: AI augments writing, ticketing infrastructure remains the product.",
    aiTools: [],
  },
  slido: {
    stance: "augmente",
    augmentFr: "Slido a ajouté un résumé IA des questions et sondages en direct, mais reste l'outil d'interaction en temps réel (Q&A, sondages) pendant un événement ou une réunion.",
    augmentEn: "Slido added an AI summary of live questions and polls, but remains the real-time interaction tool (Q&A, polls) during an event or meeting.",
    replaceFr: "Remplacer Slido par une IA ? Non : recueillir des questions du public en temps réel pendant un événement reste un besoin d'interaction live que l'IA assiste sans remplacer. Verdict : l'IA augmente la synthèse des retours, l'interaction en direct reste le produit.",
    replaceEn: "Replace Slido with an AI? No: collecting live audience questions during an event remains a live interaction need AI assists without replacing. Verdict: AI augments feedback synthesis, live interaction remains the product.",
    aiTools: [],
  },
  "google-search-console": {
    stance: "augmente",
    augmentFr: "Google a intégré des résumés IA dans certains rapports Search Console, mais l'outil reste la seule source de données réelles de Google sur l'indexation et les requêtes de recherche — une infrastructure de données, pas de génération.",
    augmentEn: "Google integrated AI summaries into some Search Console reports, but the tool remains Google's only real data source on indexing and search queries — data infrastructure, not generation.",
    replaceFr: "Remplacer Search Console par une IA ? Non : les vraies données de recherche Google (requêtes, indexation, erreurs) ne peuvent venir que de Google lui-même, pas d'une IA générative. Verdict : l'IA aide à interpréter les données, elle ne peut pas les inventer.",
    replaceEn: "Replace Search Console with an AI? No: real Google search data (queries, indexing, errors) can only come from Google itself, not a generative AI. Verdict: AI helps interpret the data, it can't invent it.",
    aiTools: [],
  },
  algolia: {
    stance: "augmente",
    augmentFr: "Algolia a ajouté la recherche vectorielle et sémantique alimentée par l'IA (NeuralSearch) en plus de sa recherche par mots-clés classique, mais reste une infrastructure de recherche pour sites et apps, pas un générateur de contenu.",
    augmentEn: "Algolia added AI-powered vector and semantic search (NeuralSearch) alongside its classic keyword search, but remains search infrastructure for sites and apps, not a content generator.",
    replaceFr: "Remplacer Algolia par une IA ? Non : indexer et servir des résultats de recherche pertinents à très faible latence sur un site ou une app reste un besoin d'infrastructure technique. L'IA améliore la pertinence sémantique, elle ne remplace pas l'infrastructure de recherche. Verdict : l'IA augmente la pertinence, l'infrastructure reste le produit.",
    replaceEn: "Replace Algolia with an AI? No: indexing and serving relevant search results at very low latency on a site or app remains a technical infrastructure need. AI improves semantic relevance, it doesn't replace search infrastructure. Verdict: AI augments relevance, infrastructure remains the product.",
    aiTools: [],
  },
  clerk: {
    stance: "augmente",
    augmentFr: "Clerk reste un service d'authentification et de gestion d'utilisateurs (login, MFA, gestion de session) pour développeurs — un besoin de sécurité et d'infrastructure que l'IA n'adresse pas directement.",
    augmentEn: "Clerk remains an authentication and user management service (login, MFA, session management) for developers — a security and infrastructure need AI doesn't directly address.",
    replaceFr: "Remplacer Clerk par une IA ? Non : gérer l'authentification sécurisée des utilisateurs d'une app reste un besoin technique précis, pas un problème de génération de contenu. Verdict : l'IA n'a pas de rôle direct ici, l'authentification reste une infrastructure stable.",
    replaceEn: "Replace Clerk with an AI? No: managing secure user authentication for an app remains a precise technical need, not a content-generation problem. Verdict: AI doesn't have a direct role here, authentication remains stable infrastructure.",
    aiTools: [],
  },
  browserstack: {
    stance: "augmente",
    augmentFr: "BrowserStack a ajouté des assistants IA pour générer des scénarios de tests, mais reste l'infrastructure de tests cross-navigateurs et cross-appareils sur de vrais devices réels en cloud.",
    augmentEn: "BrowserStack added AI assistants to generate test scenarios, but remains the cross-browser and cross-device testing infrastructure on real cloud devices.",
    replaceFr: "Remplacer BrowserStack par une IA ? Non : tester un site sur de vrais navigateurs et appareils réels reste un besoin d'infrastructure technique que l'IA n'a pas vocation à remplacer. Elle aide à générer des scénarios de test plus vite. Verdict : l'IA augmente la création de tests, l'infrastructure de test reste le produit.",
    replaceEn: "Replace BrowserStack with an AI? No: testing a site on real browsers and devices remains a technical infrastructure need AI isn't meant to replace. It helps generate test scenarios faster. Verdict: AI augments test creation, test infrastructure remains the product.",
    aiTools: [],
  },
  infomaniak: {
    stance: "augmente",
    augmentFr: "Infomaniak a ajouté des outils IA respectueux de la confidentialité (hébergés en Suisse) à son offre, mais reste avant tout un hébergeur web et cloud suisse misant sur la souveraineté des données — une infrastructure, pas un générateur.",
    augmentEn: "Infomaniak added privacy-respecting AI tools (Swiss-hosted) to its offering, but remains primarily a Swiss web and cloud host focused on data sovereignty — infrastructure, not a generator.",
    replaceFr: "Remplacer Infomaniak par une IA ? Non : héberger un site, des emails ou des fichiers avec une garantie de souveraineté des données suisse reste un besoin d'infrastructure réglementé. Verdict : l'IA s'ajoute en service complémentaire, l'hébergement souverain reste le produit principal.",
    replaceEn: "Replace Infomaniak with an AI? No: hosting a site, emails, or files with a Swiss data sovereignty guarantee remains a regulated infrastructure need. Verdict: AI is added as a complementary service, sovereign hosting remains the main product.",
    aiTools: [],
  },
  expo: {
    stance: "augmente",
    augmentFr: "Expo a intégré des outils IA tiers pour générer du code React Native, mais reste l'infrastructure de référence pour développer et déployer des apps mobiles cross-platform sans configuration native complexe.",
    augmentEn: "Expo integrated third-party AI tools to generate React Native code, but remains the reference infrastructure to develop and deploy cross-platform mobile apps with no complex native configuration.",
    replaceFr: "Remplacer Expo par une IA ? Non : compiler et déployer une app mobile sur iOS et Android reste un besoin d'infrastructure technique. Des générateurs d'apps IA peuvent produire du code qui finit par tourner sur Expo, mais l'infrastructure de build et déploiement reste indispensable. Verdict : l'IA change comment le code est écrit, pas le besoin de l'infrastructure mobile.",
    replaceEn: "Replace Expo with an AI? No: compiling and deploying a mobile app on iOS and Android remains a technical infrastructure need. AI app generators can produce code that ends up running on Expo, but build and deployment infrastructure remains essential. Verdict: AI changes how the code is written, not the need for mobile infrastructure.",
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
