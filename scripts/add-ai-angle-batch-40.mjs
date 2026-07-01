/** add-ai-angle-batch-40.mjs — aiAngle pour FreshBooks, Wave,
 * Rewardful, Stan Store, Patreon, Meta Ads, TikTok Ads, TubeBuddy —
 * tous déjà enrichis en contenu complet lors de batches précédents
 * mais sans aiAngle. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  freshbooks: {
    stance: "augmente",
    augmentFr: "FreshBooks a ajouté l'IA pour catégoriser automatiquement les dépenses et générer des rapports, mais reste un logiciel de comptabilité réglementé pensé pour les freelances et petites entreprises.",
    augmentEn: "FreshBooks added AI to automatically categorize expenses and generate reports, but remains regulated accounting software designed for freelancers and small businesses.",
    replaceFr: "Remplacer FreshBooks par une IA ? Non : facturer des clients et tenir une comptabilité conforme reste un besoin réglementé. L'IA accélère la catégorisation, elle ne remplace pas le système comptable. Verdict : l'IA augmente la productivité comptable, la conformité reste le vrai produit.",
    replaceEn: "Replace FreshBooks with an AI? No: invoicing clients and keeping compliant books remains a regulated need. AI speeds up categorization, it doesn't replace the accounting system. Verdict: AI augments accounting productivity, compliance remains the real product.",
    aiTools: [],
  },
  wave: {
    stance: "augmente",
    augmentFr: "Wave a ajouté l'IA pour catégoriser automatiquement les transactions, mais reste un logiciel de comptabilité gratuit réglementé pour freelances et très petites entreprises.",
    augmentEn: "Wave added AI to automatically categorize transactions, but remains free regulated accounting software for freelancers and very small businesses.",
    replaceFr: "Remplacer Wave par une IA ? Non : tenir une comptabilité de base conforme reste un besoin réglementé. L'IA accélère la catégorisation des dépenses, elle ne remplace pas le logiciel comptable. Verdict : l'IA augmente la saisie, la comptabilité de base reste le vrai produit.",
    replaceEn: "Replace Wave with an AI? No: keeping basic compliant books remains a regulated need. AI speeds up expense categorization, it doesn't replace the accounting software. Verdict: AI augments entry, basic accounting remains the real product.",
    aiTools: [],
  },
  rewardful: {
    stance: "augmente",
    augmentFr: "Rewardful reste un outil de suivi de commissions d'affiliation intégré à Stripe, sans IA générative native — un besoin de suivi technique réel des paiements, pas de génération de contenu.",
    augmentEn: "Rewardful remains an affiliate commission tracking tool integrated with Stripe, with no native generative AI — a real technical payment-tracking need, not content generation.",
    replaceFr: "Remplacer Rewardful par une IA ? Non : suivre fiablement des commissions sur des paiements Stripe réels reste un besoin d'infrastructure technique. Verdict : l'IA n'a pas de rôle direct ici, le suivi de paiement reste le produit.",
    replaceEn: "Replace Rewardful with an AI? No: reliably tracking commissions on real Stripe payments remains a technical infrastructure need. Verdict: AI has no direct role here, payment tracking remains the product.",
    aiTools: [],
  },
  "stan-store": {
    stance: "augmente",
    augmentFr: "Stan Store combine link in bio et vente de produits digitaux pour créateurs, sans IA générative poussée — sa valeur est la simplicité de monétisation depuis les réseaux sociaux, pas la génération.",
    augmentEn: "Stan Store combines link-in-bio and digital product sales for creators, with no deep generative AI — its value is monetization simplicity from social media, not generation.",
    replaceFr: "Remplacer Stan Store par une IA ? Non : centraliser la vente de produits digitaux et la réservation de coaching depuis les réseaux sociaux reste un besoin de plateforme structurée. Verdict : l'IA n'a pas de rôle central ici, la simplicité de monétisation reste le produit.",
    replaceEn: "Replace Stan Store with an AI? No: centralizing digital product sales and coaching booking from social media remains a structured platform need. Verdict: AI has no central role here, monetization simplicity remains the product.",
    aiTools: [],
  },
  patreon: {
    stance: "augmente",
    augmentFr: "Patreon reste une plateforme d'abonnement pour créateurs, sans IA générative poussée — sa valeur est l'infrastructure de paiement récurrent et la marque reconnue, pas la génération de contenu.",
    augmentEn: "Patreon remains a creator subscription platform, with no deep generative AI — its value is recurring payment infrastructure and a recognized brand, not content generation.",
    replaceFr: "Remplacer Patreon par une IA ? Non : monétiser une audience fidèle via un abonnement récurrent reconnu reste un besoin de plateforme et de confiance construite. Verdict : l'IA n'a pas de rôle central ici, la marque et l'infrastructure de paiement restent le produit.",
    replaceEn: "Replace Patreon with an AI? No: monetizing a loyal audience via a recognized recurring subscription remains a platform and built-trust need. Verdict: AI has no central role here, the brand and payment infrastructure remain the product.",
    aiTools: [],
  },
  "meta-ads": {
    stance: "augmente",
    augmentFr: "Meta Ads a ajouté l'IA pour générer des variantes créatives et optimiser automatiquement le ciblage (Advantage+), mais reste l'infrastructure publicitaire et de ciblage de Facebook et Instagram.",
    augmentEn: "Meta Ads added AI to generate creative variants and automatically optimize targeting (Advantage+), but remains the advertising and targeting infrastructure for Facebook and Instagram.",
    replaceFr: "Remplacer Meta Ads par une IA ? Non : diffuser des publicités sur Facebook et Instagram avec un ciblage précis reste un besoin de plateforme publicitaire propriétaire. L'IA optimise automatiquement le ciblage et les créatifs, elle ne remplace pas la plateforme. Verdict : l'IA augmente l'optimisation publicitaire, la plateforme reste indispensable.",
    replaceEn: "Replace Meta Ads with an AI? No: running ads on Facebook and Instagram with precise targeting remains a proprietary ad platform need. AI automatically optimizes targeting and creatives, it doesn't replace the platform. Verdict: AI augments ad optimization, the platform remains essential.",
    aiTools: [],
  },
  "tiktok-ads": {
    stance: "augmente",
    augmentFr: "TikTok Ads a ajouté l'IA pour générer des variantes créatives et optimiser automatiquement les campagnes (Smart+), mais reste l'infrastructure publicitaire propriétaire de la plateforme.",
    augmentEn: "TikTok Ads added AI to generate creative variants and automatically optimize campaigns (Smart+), but remains the platform's proprietary advertising infrastructure.",
    replaceFr: "Remplacer TikTok Ads par une IA ? Non : diffuser des publicités natives sur TikTok avec un ciblage précis reste un besoin de plateforme propriétaire. L'IA optimise automatiquement les campagnes, elle ne remplace pas la plateforme publicitaire. Verdict : l'IA augmente l'optimisation, la plateforme reste indispensable.",
    replaceEn: "Replace TikTok Ads with an AI? No: running native ads on TikTok with precise targeting remains a proprietary platform need. AI automatically optimizes campaigns, it doesn't replace the ad platform. Verdict: AI augments optimization, the platform remains essential.",
    aiTools: [],
  },
  tubebuddy: {
    stance: "augmente",
    augmentFr: "TubeBuddy a ajouté l'IA pour suggérer des titres et mots-clés YouTube, mais reste une extension d'optimisation SEO basée sur des données réelles de recherche et de concurrence YouTube.",
    augmentEn: "TubeBuddy added AI to suggest YouTube titles and keywords, but remains an SEO optimization extension based on real YouTube search and competition data.",
    replaceFr: "Remplacer TubeBuddy par une IA ? Non : connaître le volume de recherche réel d'un mot-clé YouTube nécessite des données réelles de la plateforme, pas seulement de la génération. L'IA aide à rédiger des titres, elle ne remplace pas l'analyse de données. Verdict : l'IA augmente la rédaction, les données réelles restent l'infrastructure clé.",
    replaceEn: "Replace TubeBuddy with an AI? No: knowing a YouTube keyword's real search volume requires real platform data, not just generation. AI helps write titles, it doesn't replace data analysis. Verdict: AI augments writing, real data remains the key infrastructure.",
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
