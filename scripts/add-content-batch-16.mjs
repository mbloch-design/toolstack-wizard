/** add-content-batch-16.mjs — contenu complet pour SparkLoop, Rewardful,
 * PartnerStack, Impact, PageFly, AdCreative.ai, MagicBrief,
 * ThirstyAffiliates. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));

const ANGLES = {
  "adcreative-ai": {
    stance: "augmente",
    augmentFr: "AdCreative.ai est une IA dont le métier est précisément de générer des visuels publicitaires et de prédire leur taux de conversion probable — l'IA n'est pas une fonctionnalité ajoutée, c'est le produit lui-même.",
    augmentEn: "AdCreative.ai is an AI whose entire job is precisely to generate ad creatives and predict their likely conversion rate — AI isn't an added feature, it's the product itself.",
    replaceFr: "Remplacer AdCreative.ai par une autre IA ? La question ne se pose pas vraiment, il s'agit déjà d'un outil IA-natif de génération publicitaire. Verdict : AdCreative.ai a été conçu autour de l'IA dès le départ plutôt que d'être challengé par elle.",
    replaceEn: "Replace AdCreative.ai with another AI? The question barely applies, since it's already an AI-native ad generation tool. Verdict: AdCreative.ai was built around AI from the start rather than being challenged by it.",
    aiTools: [],
  },
};

const CONTENT = {
  sparkloop: {
    shortDescription: "Programme de recommandation entre newsletters pour faire grandir sa liste d'abonnés.",
    shortDescriptionEn: "Newsletter cross-recommendation program to grow your subscriber list.",
    longDescription: "SparkLoop connecte des créateurs de newsletter entre eux pour qu'ils se recommandent mutuellement à leurs lecteurs après inscription (\"tu as aimé cette newsletter, tu aimeras peut-être celles-ci\"), un peu comme un système d'affiliation entre publications plutôt qu'avec des annonceurs classiques.\n\nPour un créateur de newsletter qui veut faire grandir sa liste sans dépendre uniquement de la publicité payante, c'est devenu un canal de croissance organique significatif dans l'écosystème newsletter.",
    longDescriptionEn: "SparkLoop connects newsletter creators to mutually recommend each other to readers after signup (\"you liked this newsletter, you might like these too\"), similar to an affiliate system between publications rather than with classic advertisers.\n\nFor a newsletter creator wanting to grow their list without relying solely on paid advertising, it has become a significant organic growth channel in the newsletter ecosystem.",
    pricing: "Gratuit pour les recommandations de base ; commission ou abonnement pour les fonctionnalités avancées de monétisation.",
    pricingEn: "Free for basic recommendations; commission or subscription for advanced monetization features.",
    defaultMonthlyPrice: 0,
    pros: ["Canal de croissance organique sans dépendre de la publicité payante", "Connecte directement à un réseau de newsletters dans des thématiques proches", "Peut aussi devenir une source de revenus en recommandant d'autres newsletters"],
    prosEn: ["Organic growth channel with no reliance on paid advertising", "Directly connects to a network of newsletters in related topics", "Can also become a revenue source by recommending other newsletters"],
    cons: ["Efficacité dépend de la pertinence du réseau de newsletters partenaires disponibles", "Moins puissant si ta newsletter est dans une niche très spécifique sans pairs", "Demande une liste déjà existante pour commencer à en tirer profit"],
    consEn: ["Effectiveness depends on the relevance of available partner newsletters", "Less powerful if your newsletter is in a very specific niche with no peers", "Requires an existing list to start benefiting from it"],
    useCases: ["Faire grandir sa liste de newsletter via des recommandations croisées", "Monétiser sa newsletter en recommandant d'autres publications pertinentes", "Diversifier ses canaux d'acquisition au-delà de la publicité payante"],
    useCasesEn: ["Grow your newsletter list via cross-recommendations", "Monetize your newsletter by recommending other relevant publications", "Diversify acquisition channels beyond paid advertising"],
    verdict: {
      keepIf: ["Tu as une newsletter active et veux la faire grandir sans budget pub", "Ta thématique a d'autres newsletters actives avec qui te recommander"],
      avoidIf: ["Tu n'as pas encore de newsletter active établie", "Ta niche est trop spécifique pour trouver des partenaires de recommandation pertinents"],
      threshold: "Pertinent dès que tu as une newsletter active dans une thématique avec des pairs.",
    },
    verdictEn: {
      keepIf: ["You have an active newsletter and want to grow it with no ad budget", "Your topic has other active newsletters to recommend each other with"],
      avoidIf: ["You don't yet have an established active newsletter", "Your niche is too specific to find relevant recommendation partners"],
      threshold: "Worth it once you have an active newsletter in a topic with peers.",
    },
  },
  rewardful: {
    shortDescription: "Logiciel de gestion d'affiliation pour SaaS, intégré à Stripe.",
    shortDescriptionEn: "Affiliate management software for SaaS, integrated with Stripe.",
    longDescription: "Rewardful permet de mettre en place un programme d'affiliation pour un SaaS ou produit digital, en s'intégrant directement à Stripe pour suivre automatiquement les commissions sur les paiements réels plutôt que de gérer ça manuellement.\n\nPour un développeur indépendant qui lance un SaaS, c'est un moyen simple d'activer un canal de croissance par affiliation sans construire un système de tracking de commissions maison.",
    longDescriptionEn: "Rewardful lets you set up an affiliate program for a SaaS or digital product, integrating directly with Stripe to automatically track commissions on real payments rather than managing it manually.\n\nFor an independent developer launching a SaaS, it's a simple way to activate an affiliate growth channel without building an in-house commission tracking system.",
    pricing: "À partir de ~49$/mois selon le volume de revenus suivis.",
    pricingEn: "From ~$49/month depending on tracked revenue volume.",
    pros: ["Intégration native avec Stripe pour un suivi automatique des commissions", "Mise en place plus rapide qu'un système d'affiliation construit soi-même", "Pensé spécifiquement pour les SaaS, pas pour de l'e-commerce générique"],
    prosEn: ["Native Stripe integration for automatic commission tracking", "Faster setup than building an affiliate system yourself", "Specifically designed for SaaS, not generic e-commerce"],
    cons: ["Coût mensuel significatif pour un SaaS qui démarre", "Limité aux paiements via Stripe, moins flexible pour d'autres processeurs", "Pertinent seulement une fois qu'un programme d'affiliation a du sens pour ton produit"],
    consEn: ["Significant monthly cost for a SaaS just starting out", "Limited to Stripe payments, less flexible for other processors", "Only relevant once an affiliate program makes sense for your product"],
    useCases: ["Lancer un programme d'affiliation pour un SaaS sans développement custom", "Suivre automatiquement les commissions sur les paiements Stripe réels", "Recruter des affiliés pour générer un canal de croissance complémentaire"],
    useCasesEn: ["Launch an affiliate program for a SaaS with no custom development", "Automatically track commissions on real Stripe payments", "Recruit affiliates to generate a complementary growth channel"],
    verdict: {
      keepIf: ["Tu as un SaaS sur Stripe et veux activer un canal d'affiliation", "Tu préfères un suivi automatique plutôt qu'une gestion manuelle des commissions"],
      avoidIf: ["Ton SaaS est encore trop jeune pour justifier un programme d'affiliation", "Tu n'utilises pas Stripe comme processeur de paiement principal"],
      threshold: "Pertinent une fois que ton SaaS a une base de clients suffisante pour recruter des affiliés efficaces.",
    },
    verdictEn: {
      keepIf: ["You have a SaaS on Stripe and want to activate an affiliate channel", "You prefer automatic tracking over manual commission management"],
      avoidIf: ["Your SaaS is still too young to justify an affiliate program", "You don't use Stripe as your main payment processor"],
      threshold: "Worth it once your SaaS has enough of a customer base to recruit effective affiliates.",
    },
  },
  partnerstack: {
    shortDescription: "Plateforme de gestion de partenariats et d'affiliation pour SaaS B2B, plus complète que Rewardful.",
    shortDescriptionEn: "Partnership and affiliate management platform for B2B SaaS, more complete than Rewardful.",
    longDescription: "PartnerStack gère des programmes de partenariat plus larges qu'un simple affiliation : revendeurs, intégrateurs et affiliés classiques, avec des outils de recrutement de partenaires et de gestion de commissions plus poussés que des outils plus simples comme Rewardful.\n\nC'est plutôt positionné pour des SaaS B2B en croissance qui veulent structurer un véritable programme de partenariat à plusieurs niveaux, pas seulement un programme d'affiliation basique.",
    longDescriptionEn: "PartnerStack manages broader partnership programs than simple affiliation: resellers, integrators, and classic affiliates, with more advanced partner recruitment and commission management tools than simpler tools like Rewardful.\n\nIt's positioned for growing B2B SaaS companies wanting to structure a real multi-tier partnership program, not just a basic affiliate program.",
    pricing: "Tarification sur devis, généralement plusieurs centaines de dollars par mois.",
    pricingEn: "Custom pricing, typically several hundred dollars per month.",
    pros: ["Gère plusieurs types de partenariats (revendeurs, intégrateurs, affiliés)", "Outils de recrutement de partenaires plus avancés que des outils d'affiliation basiques", "Pensé pour des programmes structurés à l'échelle d'un SaaS B2B en croissance"],
    prosEn: ["Manages several partnership types (resellers, integrators, affiliates)", "More advanced partner recruitment tools than basic affiliate tools", "Designed for structured programs at the scale of a growing B2B SaaS"],
    cons: ["Coût élevé, pas adapté à un SaaS qui démarre avec un petit budget", "Complexité qui dépasse les besoins d'un simple programme d'affiliation basique", "Tarification sur devis, moins transparente que des outils plus simples"],
    consEn: ["High cost, not suited to a starting SaaS with a small budget", "Complexity that exceeds the needs of a simple basic affiliate program", "Custom pricing, less transparent than simpler tools"],
    useCases: ["Structurer un programme de partenariat multi-niveaux pour un SaaS B2B établi", "Gérer des revendeurs et intégrateurs en plus des affiliés classiques", "Recruter activement des partenaires plutôt que d'attendre des inscriptions passives"],
    useCasesEn: ["Structure a multi-tier partnership program for an established B2B SaaS", "Manage resellers and integrators alongside classic affiliates", "Actively recruit partners rather than waiting for passive signups"],
    verdict: {
      keepIf: ["Tu as un SaaS B2B établi et veux structurer un vrai programme de partenariat", "Le budget pour un outil premium est justifié par la taille de ton programme"],
      avoidIf: ["Tu démarres et un simple programme d'affiliation basique (Rewardful) suffit", "Ton budget ne permet pas un outil à plusieurs centaines de dollars par mois"],
      threshold: "Pertinent à partir d'un SaaS B2B établi avec un vrai besoin de partenariats structurés.",
    },
    verdictEn: {
      keepIf: ["You have an established B2B SaaS and want to structure a real partnership program", "The budget for a premium tool is justified by your program's size"],
      avoidIf: ["You're starting out and a simple basic affiliate program (Rewardful) is enough", "Your budget doesn't allow for a tool costing several hundred dollars a month"],
      threshold: "Worth it once you're an established B2B SaaS with a real need for structured partnerships.",
    },
  },
  impact: {
    shortDescription: "Réseau d'affiliation et de partenariat à l'échelle des grandes marques, alternative premium à Rewardful.",
    shortDescriptionEn: "Affiliate and partnership network at the scale of major brands, a premium alternative to Rewardful.",
    longDescription: "Impact (impact.com) est un réseau de partenariat à grande échelle utilisé par de grandes marques pour gérer affiliés, influenceurs et partenaires technologiques, avec des outils de fraude detection et d'attribution multi-touch plus sophistiqués que des outils destinés aux petites structures.\n\nC'est nettement au-dessus du besoin d'un freelance ou d'une petite entreprise — pertinent surtout pour des marques établies avec des programmes d'affiliation à fort volume.",
    longDescriptionEn: "Impact (impact.com) is a large-scale partnership network used by major brands to manage affiliates, influencers, and technology partners, with fraud detection and multi-touch attribution tools more sophisticated than tools meant for small businesses.\n\nIt's well above the needs of a freelancer or small business — mainly relevant for established brands with high-volume affiliate programs.",
    pricing: "Tarification sur devis, généralement réservée aux moyennes et grandes entreprises.",
    pricingEn: "Custom pricing, generally reserved for mid-size and large companies.",
    pros: ["Outils d'attribution multi-touch et de détection de fraude sophistiqués", "Réseau de partenaires et influenceurs à grande échelle", "Utilisé par de grandes marques établies, gage de fiabilité"],
    prosEn: ["Sophisticated multi-touch attribution and fraud detection tools", "Large-scale partner and influencer network", "Used by established major brands, a sign of reliability"],
    cons: ["Largement surdimensionné pour un freelance ou une petite entreprise", "Coût élevé réservé aux moyennes et grandes structures", "Complexité qui demande une équipe dédiée pour en tirer parti"],
    consEn: ["Largely overkill for a freelancer or small business", "High cost reserved for mid-size and large organizations", "Complexity that requires a dedicated team to leverage"],
    useCases: ["Gérer un programme d'affiliation et d'influence à grande échelle pour une marque établie", "Détecter la fraude sur un programme de partenariat à fort volume", "Suivre l'attribution multi-touch sur des parcours d'achat complexes"],
    useCasesEn: ["Manage a large-scale affiliate and influencer program for an established brand", "Detect fraud on a high-volume partnership program", "Track multi-touch attribution on complex purchase journeys"],
    verdict: {
      keepIf: ["Tu es une marque établie avec un programme d'affiliation à fort volume", "Tu as une équipe dédiée pour gérer la complexité de l'outil"],
      avoidIf: ["Tu es freelance ou petite entreprise — Rewardful ou PartnerStack suffisent largement", "Ton volume d'affiliation ne justifie pas un outil de ce niveau"],
      threshold: "Pertinent uniquement pour des marques établies avec un volume d'affiliation conséquent.",
    },
    verdictEn: {
      keepIf: ["You're an established brand with a high-volume affiliate program", "You have a dedicated team to manage the tool's complexity"],
      avoidIf: ["You're a freelancer or small business — Rewardful or PartnerStack are plenty", "Your affiliate volume doesn't justify a tool of this level"],
      threshold: "Only relevant for established brands with substantial affiliate volume.",
    },
  },
  pagefly: {
    shortDescription: "Constructeur de pages drag-and-drop pour Shopify, alternative à GemPages avec un plan gratuit.",
    shortDescriptionEn: "Drag-and-drop page builder for Shopify, an alternative to GemPages with a free plan.",
    longDescription: "PageFly est un concurrent direct de GemPages sur Shopify : constructeur de pages visuel pour créer des pages produit, landing pages et pages d'accueil personnalisées sans coder. Sa différence principale est un plan gratuit plus généreux qui permet de tester l'outil avant de payer.\n\nLe choix entre PageFly et GemPages dépend surtout de préférences d'interface et du budget — les deux couvrent un besoin similaire de personnalisation Shopify avancée.",
    longDescriptionEn: "PageFly is a direct competitor to GemPages on Shopify: a visual page builder to create custom product pages, landing pages, and homepages with no coding. Its main difference is a more generous free plan that lets you test the tool before paying.\n\nThe choice between PageFly and GemPages mostly comes down to interface preferences and budget — both cover a similar need for advanced Shopify customization.",
    pricing: "Plan gratuit disponible ; plans payants à partir de ~24$/mois.",
    pricingEn: "Free plan available; paid plans from ~$24/month.",
    defaultMonthlyPrice: 0,
    pros: ["Plan gratuit plus généreux que GemPages pour tester avant de payer", "Personnalisation poussée de pages Shopify sans coder", "Bibliothèque de templates orientés conversion"],
    prosEn: ["More generous free plan than GemPages to test before paying", "Deep customization of Shopify pages with no coding", "Conversion-oriented template library"],
    cons: ["Coût supplémentaire au-dessus de l'abonnement Shopify de base au-delà du gratuit", "Peut ralentir légèrement le chargement si mal optimisé", "Fonctionnalités très proches de GemPages, le choix dépend surtout de préférence"],
    consEn: ["Additional cost on top of the base Shopify subscription beyond free tier", "Can slightly slow loading if poorly optimized", "Features very close to GemPages, choice mostly comes down to preference"],
    useCases: ["Tester un constructeur de pages Shopify gratuitement avant de s'engager", "Créer une page produit ou landing page personnalisée sans développeur", "Améliorer le taux de conversion avec des templates orientés vente"],
    useCasesEn: ["Test a Shopify page builder for free before committing", "Create a custom product page or landing page with no developer", "Improve conversion rate with sales-oriented templates"],
    verdict: {
      keepIf: ["Tu veux tester un constructeur de pages Shopify avant de payer", "Tu veux personnaliser des pages sans embaucher de développeur"],
      avoidIf: ["Le thème Shopify standard suffit déjà à tes besoins", "Tu préfères l'interface ou l'écosystème de GemPages"],
      threshold: "Bon point d'entrée gratuit pour tester la personnalisation de pages Shopify.",
    },
    verdictEn: {
      keepIf: ["You want to test a Shopify page builder before paying", "You want to customize pages without hiring a developer"],
      avoidIf: ["The standard Shopify theme already meets your needs", "You prefer GemPages's interface or ecosystem"],
      threshold: "Good free entry point to test Shopify page customization.",
    },
  },
  "adcreative-ai": {
    shortDescription: "Génère automatiquement des visuels publicitaires optimisés pour la conversion, avec score de performance prédictif.",
    shortDescriptionEn: "Automatically generates conversion-optimized ad creatives, with a predictive performance score.",
    longDescription: "AdCreative.ai génère des visuels publicitaires (bannières, posts) à partir des éléments de marque (logo, couleurs, produits), avec un score IA qui prédit la probabilité de performance de chaque création avant même de la publier — pensé pour accélérer la production de variantes publicitaires à tester.\n\nPour qui gère des campagnes publicitaires (Meta Ads, Google Ads) et doit produire de nombreuses variantes créatives à tester, c'est un gain de temps significatif comparé à un designer qui produirait chaque variante à la main.",
    longDescriptionEn: "AdCreative.ai generates ad creatives (banners, posts) from brand elements (logo, colors, products), with an AI score predicting each creative's likely performance before it's even published — designed to speed up producing ad variants to test.\n\nFor anyone managing ad campaigns (Meta Ads, Google Ads) who needs to produce many creative variants to test, it's a significant time saver compared to a designer manually producing each variant.",
    pricing: "À partir de ~21$/mois selon le volume de créations générées.",
    pricingEn: "From ~$21/month depending on the volume of creatives generated.",
    pros: ["Génère rapidement de nombreuses variantes publicitaires à tester", "Score prédictif de performance qui aide à prioriser quelles créations publier", "Gain de temps significatif comparé à la production manuelle par un designer"],
    prosEn: ["Quickly generates many ad variants to test", "Predictive performance score that helps prioritize which creatives to publish", "Significant time savings compared to manual production by a designer"],
    cons: ["Le score prédictif reste une estimation, pas une garantie de performance réelle", "Qualité visuelle parfois moins soignée qu'un designer professionnel", "Pertinent surtout à partir d'un volume de tests publicitaires significatif"],
    consEn: ["The predictive score remains an estimate, not a guarantee of real performance", "Visual quality sometimes less polished than a professional designer", "Mainly relevant once ad testing volume is significant"],
    useCases: ["Produire rapidement de nombreuses variantes créatives à tester en publicité", "Prioriser quelles créations publier grâce au score de performance prédictif", "Réduire la dépendance à un designer pour des tests publicitaires fréquents"],
    useCasesEn: ["Quickly produce many creative variants to test in advertising", "Prioritize which creatives to publish thanks to the predictive performance score", "Reduce dependency on a designer for frequent ad testing"],
    verdict: {
      keepIf: ["Tu gères des campagnes publicitaires et dois tester de nombreuses variantes créatives", "Tu veux accélérer la production sans embaucher un designer à temps plein"],
      avoidIf: ["Tu fais peu de publicité ou n'as pas besoin de tester beaucoup de variantes", "La qualité visuelle premium est non-négociable pour ta marque"],
      threshold: "Pertinent dès que le volume de tests publicitaires justifie d'automatiser la production créative.",
    },
    verdictEn: {
      keepIf: ["You manage ad campaigns and need to test many creative variants", "You want to speed up production without hiring a full-time designer"],
      avoidIf: ["You do little advertising or don't need to test many variants", "Premium visual quality is non-negotiable for your brand"],
      threshold: "Worth it once ad testing volume justifies automating creative production.",
    },
  },
  magicbrief: {
    shortDescription: "Bibliothèque de publicités performantes et outil d'inspiration créative pour les marketeurs.",
    shortDescriptionEn: "Library of high-performing ads and creative inspiration tool for marketers.",
    longDescription: "MagicBrief collecte et organise des publicités performantes repérées sur Meta, TikTok et d'autres plateformes, permettant aux marketeurs de s'inspirer de ce qui fonctionne réellement plutôt que de partir de zéro pour chaque nouvelle campagne.\n\nPour qui gère des publicités régulièrement, c'est un outil de veille créative qui accélère la phase d'idéation avant de produire ses propres créations, plutôt qu'un outil de production.",
    longDescriptionEn: "MagicBrief collects and organizes high-performing ads spotted on Meta, TikTok, and other platforms, letting marketers draw inspiration from what actually works rather than starting from scratch for each new campaign.\n\nFor anyone running ads regularly, it's a creative monitoring tool that speeds up the ideation phase before producing your own creatives, rather than a production tool.",
    pricing: "À partir de ~49$/mois selon les fonctionnalités d'équipe.",
    pricingEn: "From ~$49/month depending on team features.",
    pros: ["Bibliothèque organisée de publicités réellement performantes à étudier", "Accélère la phase d'idéation créative avant de produire ses propres pubs", "Veille concurrentielle utile pour comprendre les tendances publicitaires"],
    prosEn: ["Organized library of genuinely high-performing ads to study", "Speeds up the creative ideation phase before producing your own ads", "Competitive monitoring useful to understand ad trends"],
    cons: ["N'aide pas à produire la création finale, juste à s'inspirer", "Coût mensuel à justifier par un volume de publicité suffisant", "S'inspirer de ce qui fonctionne ailleurs ne garantit pas la performance pour sa propre marque"],
    consEn: ["Doesn't help produce the final creative, just inspiration", "Monthly cost needs to be justified by sufficient ad volume", "Drawing inspiration from what works elsewhere doesn't guarantee performance for your own brand"],
    useCases: ["S'inspirer de publicités performantes avant de créer ses propres campagnes", "Suivre les tendances créatives publicitaires d'une niche ou d'un secteur", "Constituer une bibliothèque de référence pour briefer une équipe créative"],
    useCasesEn: ["Draw inspiration from high-performing ads before creating your own campaigns", "Track ad creative trends in a niche or sector", "Build a reference library to brief a creative team"],
    verdict: {
      keepIf: ["Tu gères des publicités régulièrement et veux t'inspirer de ce qui fonctionne", "Tu briefes une équipe créative et veux une référence concrète plutôt qu'abstraite"],
      avoidIf: ["Tu fais très peu de publicité — l'investissement n'est pas justifié", "Tu cherches un outil de production, pas d'inspiration"],
      threshold: "Pertinent en complément d'un outil de production, pour qui gère des pubs régulièrement.",
    },
    verdictEn: {
      keepIf: ["You run ads regularly and want inspiration from what works", "You're briefing a creative team and want a concrete rather than abstract reference"],
      avoidIf: ["You do very little advertising — the investment isn't justified", "You're looking for a production tool, not inspiration"],
      threshold: "Worth it alongside a production tool, for anyone running ads regularly.",
    },
  },
  thirstyaffiliates: {
    shortDescription: "Plugin WordPress pour gérer et masquer des liens d'affiliation, avec suivi des clics.",
    shortDescriptionEn: "WordPress plugin to manage and cloak affiliate links, with click tracking.",
    longDescription: "ThirstyAffiliates est un plugin WordPress qui centralise la gestion des liens d'affiliation : raccourcissement, masquage (cloaking) pour des URLs plus propres, redirection automatique si un lien change, et suivi des clics par lien.\n\nPour un blogueur ou créateur de contenu qui monétise via de l'affiliation, c'est un moyen d'éviter de devoir mettre à jour manuellement chaque lien dans chaque article quand un programme d'affiliation change ses URLs.",
    longDescriptionEn: "ThirstyAffiliates is a WordPress plugin that centralizes affiliate link management: shortening, cloaking for cleaner URLs, automatic redirection if a link changes, and per-link click tracking.\n\nFor a blogger or content creator monetizing via affiliation, it's a way to avoid manually updating every link in every article when an affiliate program changes its URLs.",
    pricing: "Version gratuite disponible ; Pro à partir de ~49$/an pour le suivi avancé.",
    pricingEn: "Free version available; Pro from ~$49/year for advanced tracking.",
    pros: ["Centralise tous les liens d'affiliation, mise à jour en un seul endroit si une URL change", "Masquage des liens pour des URLs plus propres et professionnelles", "Suivi des clics par lien pour identifier les contenus les plus rentables"],
    prosEn: ["Centralizes all affiliate links, update in one place if a URL changes", "Link cloaking for cleaner, more professional URLs", "Per-link click tracking to identify the most profitable content"],
    cons: ["Spécifique à WordPress, inutile sur une autre plateforme", "Fonctionnalités avancées de reporting réservées à la version Pro", "Demande une discipline pour bien organiser ses liens dès le départ"],
    consEn: ["WordPress-specific, useless on another platform", "Advanced reporting features reserved for the Pro version", "Requires discipline to properly organize links from the start"],
    useCases: ["Centraliser et mettre à jour facilement des liens d'affiliation sur un blog WordPress", "Masquer des URLs d'affiliation pour un rendu plus propre et professionnel", "Identifier quels articles génèrent le plus de clics d'affiliation"],
    useCasesEn: ["Centralize and easily update affiliate links on a WordPress blog", "Cloak affiliate URLs for a cleaner, more professional look", "Identify which articles generate the most affiliate clicks"],
    verdict: {
      keepIf: ["Tu monétises un blog WordPress via des liens d'affiliation", "Tu veux éviter de mettre à jour manuellement chaque lien dans chaque article"],
      avoidIf: ["Tu n'es pas sur WordPress — le plugin ne fonctionne pas ailleurs", "Tu as très peu de liens d'affiliation à gérer"],
      threshold: "Pertinent dès que tu as plusieurs liens d'affiliation répartis sur plusieurs articles WordPress.",
    },
    verdictEn: {
      keepIf: ["You monetize a WordPress blog via affiliate links", "You want to avoid manually updating every link in every article"],
      avoidIf: ["You're not on WordPress — the plugin doesn't work elsewhere", "You have very few affiliate links to manage"],
      threshold: "Worth it once you have several affiliate links spread across several WordPress articles.",
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
