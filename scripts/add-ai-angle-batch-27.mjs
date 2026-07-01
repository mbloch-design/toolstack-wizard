/** add-ai-angle-batch-27.mjs — aiAngle pour Wordfence, YouTube Studio,
 * Sprout Social, Murf, Seamless.AI, Metabase, Luminar Neo, Topaz
 * Gigapixel AI. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  wordfence: {
    stance: "augmente",
    augmentFr: "Wordfence a ajouté la détection IA de comportements malveillants, mais reste un plugin de sécurité WordPress (pare-feu, scan de malware, blocage d'IP) — un besoin de protection technique réelle, pas de génération.",
    augmentEn: "Wordfence added AI-based malicious behavior detection, but remains a WordPress security plugin (firewall, malware scanning, IP blocking) — a real technical protection need, not generation.",
    replaceFr: "Remplacer Wordfence par une IA ? Non : bloquer des attaques réelles sur un site WordPress (firewall, scan de fichiers infectés) reste un besoin de sécurité technique. L'IA améliore la détection de comportements suspects, elle ne remplace pas la protection active. Verdict : l'IA augmente la détection, la protection technique reste indispensable.",
    replaceEn: "Replace Wordfence with an AI? No: blocking real attacks on a WordPress site (firewall, infected file scanning) remains a technical security need. AI improves suspicious behavior detection, it doesn't replace active protection. Verdict: AI augments detection, technical protection remains essential.",
    aiTools: [],
  },
  "youtube-studio": {
    stance: "augmente",
    augmentFr: "YouTube Studio a intégré des outils IA (génération de miniatures, suggestions de titre, doublage automatique multilingue) directement dans le tableau de bord créateur, sans changer son rôle de gestion de chaîne.",
    augmentEn: "YouTube Studio integrated AI tools (thumbnail generation, title suggestions, automatic multilingual dubbing) directly into the creator dashboard, without changing its role of channel management.",
    replaceFr: "Remplacer YouTube Studio par une IA ? Non : gérer une chaîne YouTube (analytics, monétisation, publication) reste un besoin de plateforme propriétaire que l'IA enrichit sans remplacer. Verdict : l'IA augmente la production de contenu et le doublage, la gestion de chaîne reste le produit.",
    replaceEn: "Replace YouTube Studio with an AI? No: managing a YouTube channel (analytics, monetization, publishing) remains a proprietary platform need AI enriches without replacing. Verdict: AI augments content production and dubbing, channel management remains the product.",
    aiTools: [],
  },
  "sprout-social": {
    stance: "augmente",
    augmentFr: "Sprout Social a ajouté l'IA pour suggérer des réponses et analyser le sentiment des mentions de marque, mais reste une plateforme de gestion de réseaux sociaux d'entreprise avec planification et reporting multi-comptes.",
    augmentEn: "Sprout Social added AI to suggest replies and analyze brand mention sentiment, but remains an enterprise social media management platform with multi-account scheduling and reporting.",
    replaceFr: "Remplacer Sprout Social par une IA ? Non : gérer plusieurs comptes sociaux d'entreprise avec planification, reporting et veille de mentions reste un besoin de plateforme structurée. L'IA aide à rédiger des réponses, elle ne remplace pas la gestion multi-comptes. Verdict : l'IA augmente la rédaction et l'analyse, la plateforme reste le produit.",
    replaceEn: "Replace Sprout Social with an AI? No: managing several enterprise social accounts with scheduling, reporting, and mention monitoring remains a structured platform need. AI helps draft replies, it doesn't replace multi-account management. Verdict: AI augments writing and analysis, the platform remains the product.",
    aiTools: [],
  },
  murf: {
    stance: "challenge",
    augmentFr: "Murf génère des voix off synthétiques de qualité professionnelle à partir de texte, challengeant directement les budgets de voix off humaine pour du contenu de volume (formations, vidéos explicatives).",
    augmentEn: "Murf generates professional-quality synthetic voice-overs from text, directly challenging human voice-over budgets for volume content (training videos, explainer videos).",
    replaceFr: "Murf remplace-t-il les voix off humaines ? Pour du contenu de volume avec un budget serré (formations e-learning, vidéos explicatives), oui largement. Pour une publicité premium ou un personnage avec une voix distinctive, une voix humaine reste préférée. Verdict : challenge fortement la voix off de volume, moins la performance artistique haut de gamme.",
    replaceEn: "Does Murf replace human voice-overs? For volume content with a tight budget (e-learning, explainer videos), largely yes. For premium advertising or a character with a distinctive voice, a human voice remains preferred. Verdict: strongly challenges volume voice-over, less so high-end artistic performance.",
    aiTools: [],
  },
  "seamless-ai": {
    stance: "augmente",
    augmentFr: "Seamless.AI combine une base de données de contacts B2B avec des fonctionnalités IA de prospection (vérification d'emails en temps réel, scoring), mais sa valeur fondamentale reste sa base de données de contacts à jour.",
    augmentEn: "Seamless.AI combines a B2B contact database with AI prospecting features (real-time email verification, scoring), but its core value remains its up-to-date contact database.",
    replaceFr: "Remplacer Seamless.AI par une IA générative ? Non : disposer de contacts B2B vérifiés en temps réel nécessite une collecte et vérification de données réelles, pas seulement de la génération. L'IA aide à prioriser les prospects, elle ne remplace pas la base de données. Verdict : l'IA augmente la prospection, la donnée vérifiée reste l'infrastructure clé.",
    replaceEn: "Replace Seamless.AI with a generative AI? No: having real-time verified B2B contacts requires real data collection and verification, not just generation. AI helps prioritize prospects, it doesn't replace the database. Verdict: AI augments prospecting, verified data remains the key infrastructure.",
    aiTools: [],
  },
  metabase: {
    stance: "augmente",
    augmentFr: "Metabase a ajouté un assistant IA pour générer des requêtes SQL à partir de questions en langage naturel, mais reste un outil de BI open source connecté à des données réelles d'entreprise.",
    augmentEn: "Metabase added an AI assistant to generate SQL queries from natural-language questions, but remains an open-source BI tool connected to real company data.",
    replaceFr: "Remplacer Metabase par une IA ? Non : visualiser et interroger des données réelles d'entreprise connectées à plusieurs sources reste un besoin d'infrastructure de reporting. L'IA aide à écrire la requête, elle ne remplace pas la connexion aux données. Verdict : l'IA augmente l'accès aux données, le reporting connecté reste le produit.",
    replaceEn: "Replace Metabase with an AI? No: visualizing and querying real company data connected to multiple sources remains a reporting infrastructure need. AI helps write the query, it doesn't replace the data connection. Verdict: AI augments data access, connected reporting remains the product.",
    aiTools: [],
  },
  "luminar-neo": {
    stance: "augmente",
    augmentFr: "Luminar Neo construit toute sa proposition de valeur autour de l'IA (remplacement de ciel, suppression d'objet, amélioration de portrait), se différenciant de Lightroom par une retouche automatisée plutôt que manuelle.",
    augmentEn: "Luminar Neo builds its entire value proposition around AI (sky replacement, object removal, portrait enhancement), differentiating itself from Lightroom through automated rather than manual editing.",
    replaceFr: "Remplacer Lightroom par Luminar Neo ? Pour des retouches rapides et automatiques, Luminar va plus vite. Pour un contrôle colorimétrique précis et un catalogue de gestion photo complet, Lightroom reste la référence pro. Verdict : Luminar challenge la retouche rapide, Lightroom reste préféré pour le contrôle professionnel fin.",
    replaceEn: "Replace Lightroom with Luminar Neo? For quick, automatic edits, Luminar is faster. For precise color control and a complete photo management catalog, Lightroom remains the pro reference. Verdict: Luminar challenges quick editing, Lightroom remains preferred for fine professional control.",
    aiTools: [],
  },
  "topaz-gigapixel": {
    stance: "augmente",
    augmentFr: "Topaz Gigapixel AI est lui-même un outil IA dont la seule fonction est d'agrandir une image en reconstruisant les détails manquants par apprentissage profond — l'IA n'est pas une fonctionnalité ajoutée, c'est tout le produit.",
    augmentEn: "Topaz Gigapixel AI is itself an AI tool whose sole function is to upscale an image by reconstructing missing detail through deep learning — AI isn't an added feature, it's the entire product.",
    replaceFr: "Remplacer Topaz Gigapixel par une autre IA ? La question ne se pose pas vraiment : c'est déjà un outil IA-natif spécialisé dans l'agrandissement d'image. Verdict : Topaz Gigapixel a été conçu autour de l'IA dès le départ plutôt que d'être challengé par elle.",
    replaceEn: "Replace Topaz Gigapixel with another AI? The question barely applies: it's already an AI-native tool specialized in image upscaling. Verdict: Topaz Gigapixel was built around AI from the start rather than being challenged by it.",
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
