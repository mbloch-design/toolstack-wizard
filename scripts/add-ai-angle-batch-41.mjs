/** add-ai-angle-batch-41.mjs — aiAngle pour Submagic, Storyblocks,
 * Taplio, Systeme.io, ThriveCart, RankMath, Yoast, Wistia — déjà
 * enrichis en contenu mais sans aiAngle. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  submagic: {
    stance: "augmente",
    augmentFr: "Submagic est lui-même un outil IA spécialisé dans la génération de sous-titres animés stylés — l'IA n'est pas une fonctionnalité ajoutée, c'est tout le produit, dans un marché désormais concurrencé par les fonctions natives de CapCut.",
    augmentEn: "Submagic is itself an AI tool specialized in generating stylish animated captions — AI isn't an added feature, it's the entire product, in a market now contested by CapCut's native features.",
    replaceFr: "Remplacer Submagic par CapCut gratuit ? Pour des sous-titres de base, CapCut suffit désormais gratuitement. Submagic garde l'avantage de styles plus poussés et de tendances visuelles spécifiques. Verdict : challengé par les fonctions gratuites natives, différencié par la qualité visuelle avancée.",
    replaceEn: "Replace Submagic with free CapCut? For basic captions, CapCut is now enough for free. Submagic keeps the edge of more advanced styles and specific visual trends. Verdict: challenged by free native features, differentiated by advanced visual quality.",
    aiTools: [],
  },
  storyblocks: {
    stance: "augmente",
    augmentFr: "Storyblocks reste une bibliothèque de stock footage et musique existants, sans génération IA native — une approche désormais complétée par des générateurs vidéo IA pour du contenu original sur-mesure.",
    augmentEn: "Storyblocks remains a library of existing stock footage and music, with no native AI generation — an approach now complemented by AI video generators for original custom content.",
    replaceFr: "Remplacer Storyblocks par une IA générative ? Pour un visuel générique, le stock reste plus rapide et économique. Pour un visuel très spécifique non couvert par le catalogue, un générateur IA (Runway, Pika) peut combler le vide. Verdict : complémentaire plutôt que remplacé, le stock reste plus économique pour l'usage générique.",
    replaceEn: "Replace Storyblocks with generative AI? For a generic visual, stock remains faster and cheaper. For a very specific visual not covered by the catalog, an AI generator (Runway, Pika) can fill the gap. Verdict: complementary rather than replaced, stock remains cheaper for generic use.",
    aiTools: ["runway"],
  },
  taplio: {
    stance: "augmente",
    augmentFr: "Taplio génère des suggestions de posts LinkedIn par IA, mais l'audience finale juge la pertinence et l'expertise réelle exprimée — l'IA aide à dépasser le syndrome de la page blanche, pas à inventer une expertise.",
    augmentEn: "Taplio generates LinkedIn post suggestions via AI, but the final audience judges relevance and real expertise expressed — AI helps overcome writer's block, not invent expertise.",
    replaceFr: "Taplio remplace-t-il un community manager LinkedIn ? Pour la régularité de publication, oui en grande partie. Pour une vraie stratégie de positionnement et de réseau, l'expertise humaine reste centrale. Verdict : l'IA augmente la régularité de publication, l'expertise et le réseau restent un travail humain.",
    replaceEn: "Does Taplio replace a LinkedIn community manager? For publishing consistency, largely yes. For real positioning and networking strategy, human expertise remains central. Verdict: AI augments publishing consistency, expertise and networking remain human work.",
    aiTools: [],
  },
  "systeme-io": {
    stance: "augmente",
    augmentFr: "Systeme.io a ajouté l'IA pour générer du contenu de pages de vente et d'emails, mais reste l'infrastructure tout-en-un (tunnels, email, hébergement de cours) pour les créateurs francophones d'infoproduits.",
    augmentEn: "Systeme.io added AI to generate sales page and email content, but remains the all-in-one infrastructure (funnels, email, course hosting) for French-speaking info-product creators.",
    replaceFr: "Remplacer Systeme.io par une IA ? Non : héberger un tunnel de vente, des emails automatisés et des cours en ligne reste un besoin d'infrastructure. L'IA aide à rédiger le contenu, elle ne remplace pas la plateforme. Verdict : l'IA augmente la rédaction, l'infrastructure tout-en-un reste le produit.",
    replaceEn: "Replace Systeme.io with an AI? No: hosting a sales funnel, automated emails, and online courses remains an infrastructure need. AI helps write content, it doesn't replace the platform. Verdict: AI augments writing, the all-in-one infrastructure remains the product.",
    aiTools: [],
  },
  thrivecart: {
    stance: "augmente",
    augmentFr: "ThriveCart reste une page de paiement optimisée pour la conversion (upsells, bump offers), sans IA générative native — un besoin d'infrastructure de paiement, pas de génération de contenu.",
    augmentEn: "ThriveCart remains a conversion-optimized checkout page (upsells, bump offers), with no native generative AI — a payment infrastructure need, not content generation.",
    replaceFr: "Remplacer ThriveCart par une IA ? Non : encaisser un paiement de façon sécurisée avec des mécaniques de conversion avancées reste un besoin d'infrastructure financière. Verdict : l'IA n'a pas de rôle central ici, l'infrastructure de paiement reste le produit.",
    replaceEn: "Replace ThriveCart with an AI? No: securely collecting payment with advanced conversion mechanics remains a financial infrastructure need. Verdict: AI has no central role here, payment infrastructure remains the product.",
    aiTools: [],
  },
  rankmath: {
    stance: "augmente",
    augmentFr: "RankMath a ajouté l'IA pour suggérer des optimisations de contenu SEO, mais reste un plugin WordPress qui implémente les bonnes pratiques techniques (balises, sitemap) — un besoin technique, pas de génération.",
    augmentEn: "RankMath added AI to suggest SEO content optimizations, but remains a WordPress plugin implementing technical best practices (tags, sitemap) — a technical need, not generation.",
    replaceFr: "Remplacer RankMath par une IA ? Non : générer des balises techniques correctes et un sitemap XML valide reste un besoin technique précis. L'IA suggère des améliorations de contenu, elle ne remplace pas l'implémentation technique. Verdict : l'IA augmente les suggestions, l'implémentation technique reste le produit.",
    replaceEn: "Replace RankMath with an AI? No: generating correct technical tags and a valid XML sitemap remains a precise technical need. AI suggests content improvements, it doesn't replace technical implementation. Verdict: AI augments suggestions, technical implementation remains the product.",
    aiTools: [],
  },
  yoast: {
    stance: "augmente",
    augmentFr: "Yoast a ajouté l'IA pour générer des métadonnées et améliorer la lisibilité, mais reste le plugin WordPress de référence pour implémenter les bonnes pratiques SEO techniques de base.",
    augmentEn: "Yoast added AI to generate metadata and improve readability, but remains the reference WordPress plugin to implement basic technical SEO best practices.",
    replaceFr: "Remplacer Yoast par une IA ? Non : générer des balises techniques correctes et un sitemap XML valide reste un besoin technique précis intégré à WordPress. L'IA aide à rédiger des métadonnées, elle ne remplace pas l'implémentation. Verdict : l'IA augmente la rédaction, l'implémentation technique reste le produit.",
    replaceEn: "Replace Yoast with an AI? No: generating correct technical tags and a valid XML sitemap remains a precise technical need built into WordPress. AI helps write metadata, it doesn't replace implementation. Verdict: AI augments writing, technical implementation remains the product.",
    aiTools: [],
  },
  wistia: {
    stance: "augmente",
    augmentFr: "Wistia a ajouté l'IA pour transcrire et résumer le contenu vidéo, mais reste l'infrastructure d'hébergement vidéo B2B avec analytics d'engagement et capture de leads intégrée.",
    augmentEn: "Wistia added AI to transcribe and summarize video content, but remains B2B video hosting infrastructure with engagement analytics and built-in lead capture.",
    replaceFr: "Remplacer Wistia par une IA ? Non : héberger une vidéo marketing avec des analytics d'engagement détaillés et de la capture de leads reste un besoin d'infrastructure. L'IA aide à transcrire le contenu, elle ne remplace pas l'hébergement. Verdict : l'IA augmente l'accessibilité du contenu, l'infrastructure reste le produit.",
    replaceEn: "Replace Wistia with an AI? No: hosting a marketing video with detailed engagement analytics and lead capture remains an infrastructure need. AI helps transcribe content, it doesn't replace hosting. Verdict: AI augments content accessibility, infrastructure remains the product.",
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
