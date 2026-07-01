/** add-content-batch-29.mjs — contenu complet pour TikTok Studio,
 * Motion Array, Unfold, Billo, Insense, AuthoredUp, Link Whisper,
 * TablePress. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));

const ANGLES = {
  "tiktok-studio": {
    stance: "augmente",
    augmentFr: "TikTok Studio intègre des suggestions IA pour les titres et l'analyse de performance, en plus de son rôle de tableau de bord créateur classique pour gérer sa chaîne et sa monétisation.",
    augmentEn: "TikTok Studio integrates AI suggestions for titles and performance analysis, alongside its classic creator dashboard role for managing your channel and monetization.",
    replaceFr: "Remplacer TikTok Studio par une IA ? Non : gérer ses analytics, sa monétisation et son contenu publié reste un besoin de plateforme propriétaire. L'IA aide à optimiser les titres et comprendre les performances, elle ne remplace pas le tableau de bord. Verdict : l'IA augmente l'analyse de performance, le tableau de bord reste le produit.",
    replaceEn: "Replace TikTok Studio with an AI? No: managing analytics, monetization, and published content remains a proprietary platform need. AI helps optimize titles and understand performance, it doesn't replace the dashboard. Verdict: AI augments performance analysis, the dashboard remains the product.",
    aiTools: [],
  },
};

const CONTENT = {
  "tiktok-studio": {
    shortDescription: "Application desktop de TikTok pour gérer sa chaîne, ses analytics et publier du contenu.",
    shortDescriptionEn: "TikTok's desktop app to manage your channel, analytics, and publish content.",
    longDescription: "TikTok Studio est l'application desktop officielle de TikTok qui permet de gérer sa chaîne, consulter des analytics détaillés, programmer des publications et répondre aux commentaires sans passer par l'app mobile.\n\nPour un créateur qui produit du contenu sur ordinateur (montage, exports), c'est plus pratique que de devoir transférer les fichiers vers un téléphone pour publier et gérer sa chaîne.",
    longDescriptionEn: "TikTok Studio is TikTok's official desktop app that lets you manage your channel, view detailed analytics, schedule posts, and reply to comments without going through the mobile app.\n\nFor a creator producing content on a computer (editing, exports), it's more convenient than having to transfer files to a phone to publish and manage the channel.",
    pricing: "Gratuit, fourni par TikTok.",
    pricingEn: "Free, provided by TikTok.",
    defaultMonthlyPrice: 0,
    pros: ["Gestion de chaîne complète depuis l'ordinateur, sans transférer vers mobile", "Analytics détaillés sur une interface desktop plus lisible que mobile", "Programmation de publications directement depuis l'app officielle"],
    prosEn: ["Full channel management from the computer, no need to transfer to mobile", "Detailed analytics on a more readable desktop interface than mobile", "Post scheduling directly from the official app"],
    cons: ["Certaines fonctionnalités créatives restent mobile-only (effets, filtres en direct)", "Outil propriétaire, dépendant entièrement de TikTok", "Moins de fonctionnalités tierces que des outils de gestion multi-plateformes"],
    consEn: ["Some creative features remain mobile-only (effects, live filters)", "Proprietary tool, fully dependent on TikTok", "Fewer third-party features than multi-platform management tools"],
    useCases: ["Publier et gérer une chaîne TikTok directement depuis un ordinateur", "Consulter des analytics détaillés sans changer d'appareil", "Programmer des publications en avance pour rester régulier"],
    useCasesEn: ["Publish and manage a TikTok channel directly from a computer", "View detailed analytics with no device switching", "Schedule posts in advance to stay consistent"],
    verdict: {
      keepIf: ["Tu produis du contenu sur ordinateur et veux gérer ta chaîne sans changer d'appareil", "Tu veux des analytics plus lisibles que sur mobile"],
      avoidIf: ["Tu gères plusieurs plateformes sociales — un outil multi-plateforme est plus efficace", "Tu publies exclusivement depuis ton téléphone sans besoin de desktop"],
      threshold: "Pratique dès que tu produis du contenu sur ordinateur plutôt que sur mobile.",
    },
    verdictEn: {
      keepIf: ["You produce content on a computer and want to manage your channel without switching devices", "You want more readable analytics than on mobile"],
      avoidIf: ["You manage several social platforms — a multi-platform tool is more efficient", "You publish exclusively from your phone with no desktop need"],
      threshold: "Handy once you produce content on a computer rather than mobile.",
    },
  },
  "motion-array": {
    shortDescription: "Marketplace de templates vidéo, musiques et stock footage en abonnement illimité.",
    shortDescriptionEn: "Video templates, music, and stock footage marketplace with unlimited subscription.",
    longDescription: "Motion Array propose un catalogue de templates After Effects/Premiere, musiques libres de droits et vidéos stock, accessible en téléchargement illimité via abonnement — un concurrent direct de Storyblocks et Envato Elements.\n\nSa spécificité est un catalogue particulièrement riche en templates de motion design prêts à l'emploi pour After Effects, utile pour qui veut un résultat professionnel sans tout animer de zéro.",
    longDescriptionEn: "Motion Array offers a catalog of After Effects/Premiere templates, royalty-free music, and stock video, accessible via unlimited subscription download — a direct competitor to Storyblocks and Envato Elements.\n\nIts specificity is a particularly rich catalog of ready-to-use motion design templates for After Effects, useful for anyone wanting a professional result without animating everything from scratch.",
    pricing: "À partir de ~30€/mois pour un accès illimité.",
    pricingEn: "From ~$30/month for unlimited access.",
    pros: ["Catalogue riche en templates After Effects/Premiere prêts à l'emploi", "Téléchargement illimité, rentable dès quelques téléchargements par mois", "Licence commerciale claire incluse"],
    prosEn: ["Rich catalog of ready-to-use After Effects/Premiere templates", "Unlimited downloads, pays off after just a few downloads a month", "Clear commercial license included"],
    cons: ["Plus cher que des concurrents comme Envato Elements", "Qualité variable selon les auteurs des templates", "Redondant avec Envato Elements ou Storyblocks si tu en as déjà un"],
    consEn: ["More expensive than competitors like Envato Elements", "Variable quality depending on template authors", "Redundant with Envato Elements or Storyblocks if you already have one"],
    useCases: ["Trouver des templates After Effects prêts à l'emploi pour des animations rapides", "Accéder à de la musique libre de droits et du stock footage en un abonnement", "Produire des vidéos motion design sans tout créer de zéro"],
    useCasesEn: ["Find ready-to-use After Effects templates for quick animations", "Access royalty-free music and stock footage in one subscription", "Produce motion design videos without creating everything from scratch"],
    verdict: {
      keepIf: ["Tu utilises After Effects régulièrement et veux des templates prêts à l'emploi", "Tu télécharges plusieurs ressources créatives par mois"],
      avoidIf: ["Tu as déjà un abonnement Envato Elements ou Storyblocks qui couvre ce besoin", "Ton usage est trop occasionnel pour justifier l'abonnement"],
      threshold: "Pertinent si tu es spécifiquement orienté motion design After Effects ; sinon, compare avec Envato Elements.",
    },
    verdictEn: {
      keepIf: ["You use After Effects regularly and want ready-to-use templates", "You download several creative resources a month"],
      avoidIf: ["You already have an Envato Elements or Storyblocks subscription covering this need", "Your use is too occasional to justify the subscription"],
      threshold: "Worth it if you're specifically motion-design/After-Effects-oriented; otherwise compare with Envato Elements.",
    },
  },
  unfold: {
    shortDescription: "App de templates de stories Instagram au design minimaliste pour créateurs et marques.",
    shortDescriptionEn: "Minimalist-design Instagram story template app for creators and brands.",
    longDescription: "Unfold propose des templates de stories Instagram au design épuré et minimaliste, devenus très reconnaissables sur la plateforme — un style qui contraste avec des templates plus chargés visuellement.\n\nPour une marque ou un créateur qui veut une esthétique de stories cohérente et soignée sans designer dédié, c'est un moyen rapide d'obtenir un rendu professionnel et identifiable.",
    longDescriptionEn: "Unfold offers Instagram story templates with a clean, minimalist design, which have become very recognizable on the platform — a style that contrasts with more visually busy templates.\n\nFor a brand or creator wanting a coherent, polished story aesthetic with no dedicated designer, it's a fast way to get a professional, identifiable result.",
    pricing: "Gratuit avec templates de base ; Pro à partir de ~3€/mois pour le catalogue complet.",
    pricingEn: "Free with basic templates; Pro from ~$3/month for the full catalog.",
    defaultMonthlyPrice: 0,
    pros: ["Style minimaliste reconnaissable, devenu une référence esthétique sur Instagram", "Application mobile simple, pensée pour un usage rapide", "Prix d'entrée très accessible pour le catalogue complet"],
    prosEn: ["Recognizable minimalist style, become an aesthetic reference on Instagram", "Simple mobile app, designed for quick use", "Very accessible entry price for the full catalog"],
    cons: ["Style minimaliste qui ne convient pas à toutes les identités de marque", "Moins de personnalisation poussée qu'un outil de design complet comme Canva", "Usage limité aux stories, pas un outil de design généraliste"],
    consEn: ["Minimalist style that doesn't suit every brand identity", "Less deep customization than a full design tool like Canva", "Limited to stories, not a general-purpose design tool"],
    useCases: ["Créer des stories Instagram avec un style minimaliste cohérent", "Donner une identité visuelle reconnaissable à son contenu social sans designer", "Produire rapidement des stories soignées sur mobile"],
    useCasesEn: ["Create Instagram stories with a coherent minimalist style", "Give recognizable visual identity to social content with no designer", "Quickly produce polished stories on mobile"],
    verdict: {
      keepIf: ["Tu veux un style de stories minimaliste et cohérent sans designer", "Ton identité de marque s'accorde avec une esthétique épurée"],
      avoidIf: ["Ton identité de marque est plus colorée ou chargée visuellement", "Tu as besoin d'un outil de design plus généraliste — Canva couvre plus de besoins"],
      threshold: "Pertinent si l'esthétique minimaliste correspond à ta marque ; sinon Canva est plus polyvalent.",
    },
    verdictEn: {
      keepIf: ["You want a minimalist, coherent story style with no designer", "Your brand identity fits a clean aesthetic"],
      avoidIf: ["Your brand identity is more colorful or visually busy", "You need a more general-purpose design tool — Canva covers more needs"],
      threshold: "Worth it if the minimalist aesthetic fits your brand; otherwise Canva is more versatile.",
    },
  },
  billo: {
    shortDescription: "Marketplace de créateurs UGC pour produire des vidéos publicitaires authentiques à la demande.",
    shortDescriptionEn: "UGC creator marketplace to produce authentic ad videos on demand.",
    longDescription: "Billo met en relation des marques avec des créateurs de contenu généré par les utilisateurs (UGC) pour produire des vidéos publicitaires au style authentique et non scripté, plus performantes en publicité que des spots produits de façon trop léchée.\n\nPour une marque e-commerce qui fait de la publicité sur Meta ou TikTok, c'est un moyen d'obtenir rapidement des créatifs UGC variés sans gérer soi-même le recrutement et la production avec des créateurs.",
    longDescriptionEn: "Billo connects brands with user-generated content (UGC) creators to produce ad videos with an authentic, unscripted style, which perform better in advertising than overly polished produced spots.\n\nFor an e-commerce brand advertising on Meta or TikTok, it's a way to quickly get varied UGC creatives without managing creator recruitment and production yourself.",
    pricing: "À partir de ~99$ par vidéo selon le type de créateur et le format.",
    pricingEn: "From ~$99 per video depending on creator type and format.",
    pros: ["Accès rapide à des créateurs UGC sans recrutement ni négociation individuelle", "Contenu authentique qui performe souvent mieux que la publicité traditionnelle", "Production rapide, idéale pour tester plusieurs angles publicitaires"],
    prosEn: ["Fast access to UGC creators with no recruitment or individual negotiation", "Authentic content that often performs better than traditional advertising", "Fast production, ideal for testing several ad angles"],
    cons: ["Coût par vidéo qui s'accumule vite si tu testes beaucoup de variantes", "Qualité variable selon le créateur assigné", "Moins de contrôle créatif que de travailler directement avec un créateur choisi"],
    consEn: ["Per-video cost adds up quickly if you test many variants", "Variable quality depending on the assigned creator", "Less creative control than working directly with a hand-picked creator"],
    useCases: ["Produire des créatifs publicitaires UGC pour tester sur Meta Ads ou TikTok Ads", "Obtenir du contenu authentique sans gérer le recrutement de créateurs soi-même", "Tester rapidement plusieurs angles publicitaires avec des créateurs variés"],
    useCasesEn: ["Produce UGC ad creatives to test on Meta Ads or TikTok Ads", "Get authentic content with no creator recruitment management yourself", "Quickly test several ad angles with varied creators"],
    verdict: {
      keepIf: ["Tu fais de la publicité e-commerce et veux des créatifs UGC variés rapidement", "Tu testes plusieurs angles publicitaires et as besoin de volume créatif"],
      avoidIf: ["Tu as déjà des créateurs UGC de confiance avec qui travailler directement", "Ton budget pub ne justifie pas un coût par vidéo récurrent"],
      threshold: "Pertinent dès que tu testes des créatifs publicitaires UGC régulièrement sur Meta ou TikTok.",
    },
    verdictEn: {
      keepIf: ["You do e-commerce advertising and want varied UGC creatives quickly", "You test several ad angles and need creative volume"],
      avoidIf: ["You already have trusted UGC creators to work with directly", "Your ad budget doesn't justify a recurring per-video cost"],
      threshold: "Worth it once you test UGC ad creatives regularly on Meta or TikTok.",
    },
  },
  insense: {
    shortDescription: "Plateforme de marketing d'influence pour collaborer avec des créateurs et gérer des campagnes UGC.",
    shortDescriptionEn: "Influencer marketing platform to collaborate with creators and manage UGC campaigns.",
    longDescription: "Insense combine recrutement de créateurs UGC et d'influenceurs avec gestion de campagne complète (briefs, contrats, paiements, droits d'usage publicitaire), plus structuré que Billo pour des collaborations récurrentes avec plusieurs créateurs.\n\nPour une marque qui veut construire une stratégie d'influence et de contenu UGC durable plutôt que des achats ponctuels, c'est un outil de gestion de programme plus complet.",
    longDescriptionEn: "Insense combines UGC creator and influencer recruitment with full campaign management (briefs, contracts, payments, ad usage rights), more structured than Billo for recurring collaborations with several creators.\n\nFor a brand wanting to build a sustainable influence and UGC content strategy rather than one-off purchases, it's a more complete program management tool.",
    pricing: "Tarification sur devis selon le volume de campagnes et de créateurs.",
    pricingEn: "Custom pricing depending on campaign and creator volume.",
    pros: ["Gestion complète de campagne d'influence (briefs, contrats, paiements)", "Droits d'usage publicitaire gérés directement dans la plateforme", "Plus structuré que des marketplaces UGC ponctuelles pour des collaborations récurrentes"],
    prosEn: ["Complete influencer campaign management (briefs, contracts, payments)", "Ad usage rights managed directly within the platform", "More structured than one-off UGC marketplaces for recurring collaborations"],
    cons: ["Tarification sur devis, moins transparente que des plateformes à l'unité", "Plus complexe que nécessaire pour un besoin ponctuel de créatif unique", "Demande un volume de campagnes pour justifier l'investissement"],
    consEn: ["Custom pricing, less transparent than per-item platforms", "More complex than necessary for a one-off single creative need", "Requires campaign volume to justify the investment"],
    useCases: ["Gérer une stratégie d'influence récurrente avec plusieurs créateurs", "Sécuriser les droits d'usage publicitaire du contenu créateur produit", "Structurer briefs, contrats et paiements pour des campagnes d'influence répétées"],
    useCasesEn: ["Manage a recurring influencer strategy with several creators", "Secure ad usage rights for creator-produced content", "Structure briefs, contracts, and payments for repeated influencer campaigns"],
    verdict: {
      keepIf: ["Tu construis une stratégie d'influence et de contenu UGC récurrente", "Tu as besoin de gérer les droits d'usage publicitaire de façon structurée"],
      avoidIf: ["Tu as un besoin ponctuel de quelques vidéos UGC — Billo est plus simple et direct", "Le volume de campagnes ne justifie pas une plateforme de gestion complète"],
      threshold: "Pertinent pour une stratégie d'influence durable avec plusieurs créateurs récurrents.",
    },
    verdictEn: {
      keepIf: ["You're building a recurring influence and UGC content strategy", "You need to manage ad usage rights in a structured way"],
      avoidIf: ["You have a one-off need for a few UGC videos — Billo is simpler and more direct", "Campaign volume doesn't justify a full management platform"],
      threshold: "Worth it for a sustainable influence strategy with several recurring creators.",
    },
  },
  authoredup: {
    shortDescription: "Outil de rédaction et de planification de posts LinkedIn avec aperçu de mise en forme.",
    shortDescriptionEn: "LinkedIn post writing and scheduling tool with formatting preview.",
    longDescription: "AuthoredUp aide à rédiger des posts LinkedIn avec un aperçu fidèle du rendu final (mise en forme, retours à la ligne), une planification de publication et des analytics — une alternative plus légère et spécialisée que Taplio.\n\nPour qui publie régulièrement sur LinkedIn sans avoir besoin de génération IA poussée, c'est un outil centré sur l'écriture et la mise en forme plutôt que sur l'assistance IA.",
    longDescriptionEn: "AuthoredUp helps write LinkedIn posts with an accurate preview of the final formatting (line breaks, layout), post scheduling, and analytics — a lighter, more specialized alternative to Taplio.\n\nFor anyone publishing regularly on LinkedIn with no need for deep AI generation, it's a tool focused on writing and formatting rather than AI assistance.",
    pricing: "Plan gratuit limité ; Pro à partir de ~9€/mois.",
    pricingEn: "Limited free plan; Pro from ~$9/month.",
    pros: ["Aperçu fidèle de la mise en forme avant publication, évite les surprises", "Moins cher que des outils plus complets comme Taplio", "Interface centrée sur l'écriture, sans complexité superflue"],
    prosEn: ["Accurate formatting preview before publishing, avoids surprises", "Cheaper than more complete tools like Taplio", "Writing-focused interface, no unnecessary complexity"],
    cons: ["Moins de fonctionnalités IA génératives que Taplio", "Analytics moins poussés que des outils plus complets", "Spécifique à LinkedIn uniquement"],
    consEn: ["Fewer generative AI features than Taplio", "Less advanced analytics than more complete tools", "LinkedIn-specific only"],
    useCases: ["Rédiger des posts LinkedIn avec un aperçu fidèle de la mise en forme", "Planifier des publications LinkedIn en avance pour rester régulier", "Garder un format de post optimisé sans payer pour des fonctionnalités IA inutilisées"],
    useCasesEn: ["Write LinkedIn posts with an accurate formatting preview", "Schedule LinkedIn posts in advance to stay consistent", "Keep an optimized post format without paying for unused AI features"],
    verdict: {
      keepIf: ["Tu veux écrire et planifier des posts LinkedIn sans payer pour de l'IA générative", "L'aperçu fidèle de mise en forme est important pour toi"],
      avoidIf: ["Tu veux des suggestions de contenu IA poussées — Taplio est plus complet", "Tu as besoin d'analytics avancés sur tes performances LinkedIn"],
      threshold: "Bon choix économique pour la planification LinkedIn sans besoin d'IA générative poussée.",
    },
    verdictEn: {
      keepIf: ["You want to write and schedule LinkedIn posts without paying for generative AI", "Accurate formatting preview matters to you"],
      avoidIf: ["You want deep AI content suggestions — Taplio is more complete", "You need advanced analytics on your LinkedIn performance"],
      threshold: "Good economical choice for LinkedIn scheduling with no need for deep generative AI.",
    },
  },
  "link-whisper": {
    shortDescription: "Plugin WordPress qui suggère des liens internes pertinents pendant la rédaction.",
    shortDescriptionEn: "WordPress plugin that suggests relevant internal links while writing.",
    longDescription: "Link Whisper analyse le contenu existant d'un site WordPress et suggère automatiquement des liens internes pertinents pendant la rédaction d'un article, un facteur SEO souvent négligé manuellement faute de temps.\n\nPour un site avec des dizaines ou centaines d'articles, retrouver manuellement quels contenus lier entre eux devient impossible — l'outil automatise cette tâche qui a un impact réel sur le SEO et la navigation utilisateur.",
    longDescriptionEn: "Link Whisper analyzes a WordPress site's existing content and automatically suggests relevant internal links while writing an article, an SEO factor often manually neglected for lack of time.\n\nFor a site with dozens or hundreds of articles, manually figuring out which content to link together becomes impossible — the tool automates this task, which has a real impact on SEO and user navigation.",
    pricing: "À partir de ~77$/an pour un site unique.",
    pricingEn: "From ~$77/year for a single site.",
    pros: ["Automatise une tâche SEO importante mais chronophage manuellement", "Suggestions basées sur le contenu réel du site, pas génériques", "Rapport de liens internes pour identifier les pages orphelines"],
    prosEn: ["Automates an important but manually time-consuming SEO task", "Suggestions based on the site's real content, not generic", "Internal link report to identify orphan pages"],
    cons: ["Spécifique à WordPress, inutile sur une autre plateforme", "Suggestions à valider manuellement, pas une automatisation totale", "Coût annuel récurrent pour une fonctionnalité ciblée"],
    consEn: ["WordPress-specific, useless on another platform", "Suggestions need manual validation, not full automation", "Recurring annual cost for a targeted feature"],
    useCases: ["Identifier des opportunités de liens internes pertinents en rédigeant un article", "Détecter les pages orphelines (sans lien interne) qui nuisent au SEO", "Améliorer le maillage interne d'un site avec beaucoup de contenu existant"],
    useCasesEn: ["Identify relevant internal linking opportunities while writing an article", "Detect orphan pages (with no internal link) that hurt SEO", "Improve internal linking on a site with lots of existing content"],
    verdict: {
      keepIf: ["Ton site WordPress a beaucoup d'articles et le maillage interne est difficile à gérer manuellement", "Tu veux améliorer ton SEO sans audit manuel chronophage"],
      avoidIf: ["Ton site a peu d'articles, le maillage manuel reste gérable", "Tu n'es pas sur WordPress"],
      threshold: "Pertinent dès que le site dépasse quelques dizaines d'articles et le maillage devient difficile à suivre.",
    },
    verdictEn: {
      keepIf: ["Your WordPress site has many articles and internal linking is hard to manage manually", "You want to improve SEO with no time-consuming manual audit"],
      avoidIf: ["Your site has few articles, manual linking remains manageable", "You're not on WordPress"],
      threshold: "Worth it once the site exceeds a few dozen articles and linking becomes hard to track.",
    },
  },
  tablepress: {
    shortDescription: "Plugin WordPress gratuit pour créer et gérer des tableaux de données sur un site.",
    shortDescriptionEn: "Free WordPress plugin to create and manage data tables on a site.",
    longDescription: "TablePress permet de créer des tableaux de données (comparatifs, prix, spécifications) directement dans WordPress, sans coder en HTML, avec import/export depuis Excel ou CSV — l'un des plugins de tableaux les plus utilisés sur WordPress.\n\nPour un blog comparatif ou un site qui présente des données structurées (comme un tableau de comparaison produits), c'est un moyen simple et gratuit d'éviter de coder des tableaux HTML manuellement.",
    longDescriptionEn: "TablePress lets you create data tables (comparisons, prices, specifications) directly in WordPress, with no HTML coding, with import/export from Excel or CSV — one of the most widely used table plugins on WordPress.\n\nFor a comparison blog or a site presenting structured data (like a product comparison table), it's a simple, free way to avoid manually coding HTML tables.",
    pricing: "Gratuit, fonctionnalités premium optionnelles disponibles.",
    pricingEn: "Free, optional premium features available.",
    defaultMonthlyPrice: 0,
    pros: ["Gratuit et largement utilisé, plugin stable et bien maintenu", "Import/export depuis Excel ou CSV, pas de ressaisie manuelle", "Pas de compétence en code HTML nécessaire pour créer des tableaux"],
    prosEn: ["Free and widely used, a stable and well-maintained plugin", "Import/export from Excel or CSV, no manual re-entry", "No HTML coding skill needed to create tables"],
    cons: ["Personnalisation visuelle limitée sans CSS personnalisé", "Spécifique à WordPress, inutile sur une autre plateforme", "Fonctionnalités avancées (tri interactif poussé) réservées au premium"],
    consEn: ["Limited visual customization without custom CSS", "WordPress-specific, useless on another platform", "Advanced features (deep interactive sorting) reserved for premium"],
    useCases: ["Créer un tableau comparatif de produits ou services sur un blog", "Présenter des données structurées (prix, spécifications) sans coder", "Importer des données existantes depuis Excel directement dans un article WordPress"],
    useCasesEn: ["Create a product or service comparison table on a blog", "Present structured data (prices, specifications) with no coding", "Import existing Excel data directly into a WordPress article"],
    verdict: {
      keepIf: ["Tu publies des tableaux comparatifs ou de données régulièrement sur WordPress", "Tu veux une solution gratuite sans coder de HTML"],
      avoidIf: ["Tu n'es pas sur WordPress", "Tu as besoin d'une personnalisation visuelle très poussée des tableaux"],
      threshold: "Excellent choix gratuit par défaut pour tout tableau de données sur WordPress.",
    },
    verdictEn: {
      keepIf: ["You publish comparison or data tables regularly on WordPress", "You want a free solution with no HTML coding"],
      avoidIf: ["You're not on WordPress", "You need very deep visual table customization"],
      threshold: "Excellent default free choice for any data table on WordPress.",
    },
  },
};

let updated = 0;
for (const [slug, fields] of Object.entries(CONTENT)) {
  const tool = tools.find((x) => (x.slug || x.id) === slug);
  if (!tool) { console.warn(`⚠️  ${slug} not found`); continue; }
  for (const [key, value] of Object.entries(fields)) tool[key] = value;
  if (fields.longDescription) tool.description = fields.longDescription;
  if (ANGLES[slug]) tool.seo = Object.assign({}, tool.seo, { aiAngle: ANGLES[slug] });
  updated++;
  console.log(`✓ ${tool.name} (${slug}) contenu complet${ANGLES[slug] ? " + aiAngle" : ""}`);
}
writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log(`\n${updated} fiches mises à jour.`);
