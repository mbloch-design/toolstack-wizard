/** add-content-batch-13.mjs — contenu complet pour 8 fiches à forte
 * notoriété encore en stub générique : Linktree, Systeme.io, ThriveCart,
 * Google Maps, TradingView, OBS Studio, Motion, Icons8. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));

const ANGLES = {
  "google-maps": {
    stance: "augmente",
    augmentFr: "Google Maps a intégré des résumés IA d'avis et de lieux, mais reste l'infrastructure de cartographie et de géolocalisation de référence — un besoin de données géographiques réelles, pas de génération.",
    augmentEn: "Google Maps integrated AI summaries of reviews and places, but remains the reference mapping and geolocation infrastructure — a real geographic data need, not generation.",
    replaceFr: "Remplacer Google Maps par une IA ? Non : la cartographie précise, le trafic en temps réel et les itinéraires reposent sur des données réelles collectées en continu, pas sur de la génération. Verdict : l'IA augmente la recherche de lieux, la cartographie reste une infrastructure de données réelles.",
    replaceEn: "Replace Google Maps with an AI? No: precise mapping, real-time traffic, and routing rely on continuously collected real data, not generation. Verdict: AI augments place search, mapping remains real-data infrastructure.",
    aiTools: [],
  },
  tradingview: {
    stance: "augmente",
    augmentFr: "TradingView a ajouté des résumés IA d'analyse technique et des assistants de script (Pine Script), mais reste la plateforme de données de marché et de graphiques en temps réel de référence pour les traders.",
    augmentEn: "TradingView added AI summaries of technical analysis and scripting assistants (Pine Script), but remains the reference real-time market data and charting platform for traders.",
    replaceFr: "Remplacer TradingView par une IA ? Non : analyser des marchés financiers nécessite des données de prix en temps réel fiables, pas seulement une génération de texte. L'IA aide à écrire des indicateurs personnalisés (Pine Script) ou résumer une tendance. Verdict : l'IA augmente l'analyse, les données de marché restent l'infrastructure clé.",
    replaceEn: "Replace TradingView with an AI? No: analyzing financial markets requires reliable real-time price data, not just text generation. AI helps write custom indicators (Pine Script) or summarize a trend. Verdict: AI augments analysis, market data remains the key infrastructure.",
    aiTools: [],
  },
  obs: {
    stance: "augmente",
    augmentFr: "OBS Studio reste un logiciel open source de capture et diffusion vidéo en direct, sans IA native — l'écosystème de plugins tiers ajoute progressivement des fonctionnalités IA (suppression de fond, sous-titres) autour du logiciel.",
    augmentEn: "OBS Studio remains an open-source live video capture and broadcasting software, with no native AI — the third-party plugin ecosystem is gradually adding AI features (background removal, captions) around the software.",
    replaceFr: "Remplacer OBS par une IA ? Non : capturer et diffuser un flux vidéo en direct vers plusieurs plateformes reste un besoin technique d'infrastructure. Les plugins IA ajoutent des fonctionnalités (fond virtuel, sous-titres), ils ne remplacent pas le logiciel de capture. Verdict : l'IA augmente via des plugins, OBS reste l'infrastructure de diffusion.",
    replaceEn: "Replace OBS with an AI? No: capturing and broadcasting a live video stream to multiple platforms remains a technical infrastructure need. AI plugins add features (virtual background, captions), they don't replace the capture software. Verdict: AI augments via plugins, OBS remains the broadcasting infrastructure.",
    aiTools: [],
  },
};

const CONTENT = {
  linktree: {
    shortDescription: "Page \"link in bio\" pour centraliser tous ses liens importants en un seul endroit.",
    shortDescriptionEn: "\"Link in bio\" page to centralize all your important links in one place.",
    longDescription: "Linktree résout un problème simple : les réseaux sociaux n'autorisent qu'un seul lien dans la bio, alors qu'un créateur ou une marque veut souvent en partager plusieurs (site, boutique, newsletter, réseaux). Linktree crée une mini-page qui centralise tous ces liens en un clic.\n\nC'est devenu le standard de facto sur Instagram, TikTok et YouTube, au point que beaucoup utilisent gratuitement le service ; les fonctionnalités payantes (analytics avancés, personnalisation poussée, intégration boutique) ne sont nécessaires qu'à partir d'un usage plus stratégique.",
    longDescriptionEn: "Linktree solves a simple problem: social networks only allow one link in the bio, while a creator or brand often wants to share several (site, store, newsletter, socials). Linktree creates a mini-page that centralizes all these links in one click.\n\nIt has become the de facto standard on Instagram, TikTok, and YouTube, to the point that many use the free service; paid features (advanced analytics, deep customization, store integration) are only needed for more strategic use.",
    pricing: "Gratuit pour l'essentiel ; Pro à partir de ~5$/mois pour l'analytics avancé et la personnalisation.",
    pricingEn: "Free for the essentials; Pro from ~$5/month for advanced analytics and customization.",
    pros: ["Gratuit et suffisant pour l'usage de base, configuration en quelques minutes", "Standard reconnu par l'audience sur Instagram, TikTok et YouTube", "Analytics de clics pour savoir quels liens performent le mieux"],
    prosEn: ["Free and sufficient for basic use, set up in minutes", "Recognized standard with audiences on Instagram, TikTok, and YouTube", "Click analytics to know which links perform best"],
    cons: ["Personnalisation visuelle limitée en version gratuite", "Ajoute une étape de clic supplémentaire avant d'arriver sur le vrai lien", "Concurrence d'alternatives parfois plus personnalisables (Beacons, Stan Store)"],
    consEn: ["Limited visual customization on the free version", "Adds an extra click step before reaching the real link", "Competition from sometimes more customizable alternatives (Beacons, Stan Store)"],
    useCases: ["Centraliser tous ses liens importants dans la bio Instagram ou TikTok", "Suivre quels liens génèrent le plus de clics depuis les réseaux sociaux", "Rediriger une audience sociale vers plusieurs destinations (boutique, newsletter, site)"],
    useCasesEn: ["Centralize all important links in an Instagram or TikTok bio", "Track which links get the most clicks from social media", "Redirect a social audience to multiple destinations (store, newsletter, site)"],
    verdict: {
      keepIf: ["Tu as plusieurs liens à partager depuis un profil social limité à un seul lien", "Tu veux un outil gratuit et reconnu sans complexité"],
      avoidIf: ["Tu veux une page entièrement personnalisée à ta marque — un site simple peut suffire", "Tu cherches des fonctionnalités de vente intégrées poussées (Stan Store convient mieux)"],
      threshold: "Pertinent dès que tu as plus d'un lien à partager sur les réseaux sociaux.",
    },
    verdictEn: {
      keepIf: ["You have multiple links to share from a social profile limited to one link", "You want a free, recognized tool with no complexity"],
      avoidIf: ["You want a page fully customized to your brand — a simple site may be enough", "You're looking for deep built-in selling features (Stan Store fits better)"],
      threshold: "Worth it as soon as you have more than one link to share on social media.",
    },
  },
  "systeme-io": {
    shortDescription: "Plateforme tout-en-un pour vendre en ligne : tunnels de vente, email marketing et formations.",
    shortDescriptionEn: "All-in-one platform to sell online: sales funnels, email marketing, and courses.",
    longDescription: "Systeme.io est une plateforme française tout-en-un qui combine tunnels de vente, email marketing, page de vente, et hébergement de formations en ligne dans un seul outil, à un prix nettement inférieur aux équivalents anglo-saxons (ClickFunnels, Kajabi).\n\nPour un créateur indépendant francophone qui vend une formation, un coaching ou un produit digital, c'est souvent le moyen le moins cher de remplacer 4-5 outils séparés (tunnel, email, page de vente, hébergement de cours) par un seul abonnement.",
    longDescriptionEn: "Systeme.io is an all-in-one French platform that combines sales funnels, email marketing, sales pages, and online course hosting in a single tool, at a notably lower price than English-speaking equivalents (ClickFunnels, Kajabi).\n\nFor a French-speaking independent creator selling a course, coaching, or digital product, it's often the cheapest way to replace 4-5 separate tools (funnel, email, sales page, course hosting) with a single subscription.",
    pricing: "Plan gratuit disponible (limité) ; plans payants à partir de ~27€/mois.",
    pricingEn: "Free plan available (limited); paid plans from ~€27/month.",
    pros: ["Remplace plusieurs outils (tunnel, email, page de vente, cours) à prix réduit", "Plan gratuit fonctionnel pour tester avant de payer", "Interface plus simple que ClickFunnels pour les non-techniques"],
    prosEn: ["Replaces several tools (funnel, email, sales page, courses) at a reduced price", "Functional free plan to test before paying", "Simpler interface than ClickFunnels for non-technical users"],
    cons: ["Moins de templates et de sophistication design que des outils spécialisés", "Écosystème d'intégrations plus restreint que des leaders comme HubSpot", "Principalement orienté marché francophone, moins connu à l'international"],
    consEn: ["Fewer templates and design sophistication than specialized tools", "Smaller integration ecosystem than leaders like HubSpot", "Mainly focused on the French-speaking market, less known internationally"],
    useCases: ["Vendre une formation en ligne avec tunnel de vente et email marketing intégrés", "Remplacer plusieurs outils payants séparés par un seul abonnement", "Démarrer une activité de coaching ou infoproduit avec un budget limité"],
    useCasesEn: ["Sell an online course with integrated sales funnel and email marketing", "Replace several separate paid tools with a single subscription", "Start a coaching or info-product business on a limited budget"],
    verdict: {
      keepIf: ["Tu vends un produit digital, une formation ou du coaching et veux un outil tout-en-un économique", "Tu es francophone et veux un support en français"],
      avoidIf: ["Tu as besoin de templates très sophistiqués ou d'intégrations avancées", "Tu vises principalement un marché anglophone avec des standards différents"],
      threshold: "Excellent rapport qualité/prix pour démarrer une activité d'infoproduit en français.",
    },
    verdictEn: {
      keepIf: ["You sell a digital product, course, or coaching and want an affordable all-in-one tool", "You're French-speaking and want support in French"],
      avoidIf: ["You need very sophisticated templates or advanced integrations", "You're mainly targeting an English-speaking market with different standards"],
      threshold: "Excellent value to start a French-language info-product business.",
    },
  },
  thrivecart: {
    shortDescription: "Page de paiement et de vente optimisée pour maximiser la conversion et le panier moyen.",
    shortDescriptionEn: "Optimized checkout and sales page to maximize conversion and average order value.",
    longDescription: "ThriveCart est spécialisé dans la page de paiement (checkout) optimisée pour la conversion : upsells en un clic, bump offers, tests A/B intégrés, et gestion d'affiliation native. C'est un outil plus pointu qu'un simple module de paiement Stripe.\n\nParticularité notable : ThriveCart se vend en licence à vie (paiement unique) plutôt qu'en abonnement mensuel, ce qui en fait un investissement plus rentable sur le long terme pour qui vend régulièrement des produits digitaux ou formations.",
    longDescriptionEn: "ThriveCart specializes in checkout pages optimized for conversion: one-click upsells, bump offers, built-in A/B testing, and native affiliate management. It's a more advanced tool than a simple Stripe payment module.\n\nNotable feature: ThriveCart sells as a lifetime license (one-time payment) rather than a monthly subscription, making it a more cost-effective long-term investment for anyone regularly selling digital products or courses.",
    pricing: "Licence à vie à partir de ~495$ (paiement unique, pas d'abonnement mensuel).",
    pricingEn: "Lifetime license from ~$495 (one-time payment, no monthly subscription).",
    pros: ["Paiement unique (licence à vie) plutôt qu'un abonnement mensuel récurrent", "Fonctionnalités de conversion avancées (upsells, bump offers, tests A/B)", "Gestion d'affiliation native intégrée, utile pour les infoproduits"],
    prosEn: ["One-time payment (lifetime license) rather than a recurring monthly subscription", "Advanced conversion features (upsells, bump offers, A/B testing)", "Native affiliate management built in, useful for info products"],
    cons: ["Coût d'entrée élevé (~495$) comparé à un abonnement mensuel classique", "Surtout pertinent pour qui vend des infoproduits ou formations en volume", "Moins adapté à un e-commerce classique de produits physiques"],
    consEn: ["High entry cost (~$495) compared to a classic monthly subscription", "Mainly relevant for those selling info products or courses in volume", "Less suited to classic physical product e-commerce"],
    useCases: ["Vendre une formation en ligne avec upsells et bump offers pour augmenter le panier moyen", "Gérer un programme d'affiliation pour ses produits digitaux", "Éviter un abonnement mensuel récurrent pour une page de paiement"],
    useCasesEn: ["Sell an online course with upsells and bump offers to increase average order value", "Manage an affiliate program for digital products", "Avoid a recurring monthly subscription for a checkout page"],
    verdict: {
      keepIf: ["Tu vends des infoproduits ou formations en volume suffisant pour amortir le coût", "Tu veux éviter un abonnement mensuel récurrent sur le long terme"],
      avoidIf: ["Tu démarres et le coût d'entrée de ~495$ est trop élevé pour ton budget", "Tu vends des produits physiques — un module Shopify/Stripe classique suffit"],
      threshold: "Rentable dès que le volume de ventes justifie l'investissement initial sur le long terme.",
    },
    verdictEn: {
      keepIf: ["You sell info products or courses at a volume sufficient to amortize the cost", "You want to avoid a recurring monthly subscription long-term"],
      avoidIf: ["You're starting out and the ~$495 entry cost is too high for your budget", "You sell physical products — a classic Shopify/Stripe module is enough"],
      threshold: "Pays off once sales volume justifies the upfront investment long-term.",
    },
  },
  "google-maps": {
    shortDescription: "Cartographie, navigation et recherche de lieux, gratuit avec une API payante pour les développeurs.",
    shortDescriptionEn: "Mapping, navigation, and place search, free with a paid API for developers.",
    longDescription: "Google Maps est le service de cartographie le plus utilisé au monde, gratuit pour l'usage grand public (navigation, recherche de lieux, avis). Pour un développeur ou une entreprise qui intègre des cartes ou de la géolocalisation dans une app, l'API Google Maps Platform est payante à l'usage au-delà d'un crédit gratuit mensuel.\n\nPour une petite entreprise locale, c'est aussi l'outil de référencement local le plus important via Google Business Profile, qui apparaît directement dans les résultats de recherche et sur la carte.",
    longDescriptionEn: "Google Maps is the most widely used mapping service in the world, free for general public use (navigation, place search, reviews). For a developer or business integrating maps or geolocation into an app, the Google Maps Platform API is usage-billed beyond a monthly free credit.\n\nFor a small local business, it's also the most important local SEO tool via Google Business Profile, which appears directly in search results and on the map.",
    pricing: "Gratuit pour l'usage grand public ; API développeur avec crédit gratuit mensuel puis facturation à l'usage.",
    pricingEn: "Free for general public use; developer API with monthly free credit then usage-based billing.",
    pros: ["Données cartographiques et trafic en temps réel les plus complètes du marché", "Gratuit pour l'usage grand public et la fiche Google Business Profile", "Standard que les utilisateurs connaissent déjà, aucune friction d'adoption"],
    prosEn: ["Most complete real-time mapping and traffic data on the market", "Free for general public use and the Google Business Profile listing", "Standard users already know, no adoption friction"],
    cons: ["API développeur qui peut devenir coûteuse à fort volume d'appels", "Dépendance à Google pour la visibilité locale d'une entreprise", "Alternatives open source (OpenStreetMap) existent pour qui veut éviter le lock-in"],
    consEn: ["Developer API that can become costly at high call volume", "Dependency on Google for a business's local visibility", "Open-source alternatives (OpenStreetMap) exist for those wanting to avoid lock-in"],
    useCases: ["Apparaître dans les recherches locales via Google Business Profile", "Intégrer une carte ou un calcul d'itinéraire dans une application", "Permettre aux clients de localiser facilement un commerce physique"],
    useCasesEn: ["Appear in local searches via Google Business Profile", "Integrate a map or route calculation into an application", "Let customers easily find a physical business location"],
    verdict: {
      keepIf: ["Tu as un commerce local et veux apparaître sur la carte Google", "Tu développes une app nécessitant de la géolocalisation fiable"],
      avoidIf: ["Tu développes à très fort volume et veux éviter les coûts d'API — OpenStreetMap est une alternative", "Tu n'as pas de présence physique nécessitant une localisation"],
      threshold: "Indispensable pour toute entreprise avec une présence locale physique.",
    },
    verdictEn: {
      keepIf: ["You have a local business and want to appear on the Google map", "You're developing an app requiring reliable geolocation"],
      avoidIf: ["You're developing at very high volume and want to avoid API costs — OpenStreetMap is an alternative", "You have no physical presence requiring location"],
      threshold: "Essential for any business with a physical local presence.",
    },
  },
  tradingview: {
    shortDescription: "Plateforme de graphiques boursiers et d'analyse technique en temps réel, avec une communauté de traders.",
    shortDescriptionEn: "Real-time stock charting and technical analysis platform, with a trading community.",
    longDescription: "TradingView est la référence pour suivre les marchés financiers en temps réel : actions, crypto, forex, matières premières, avec des outils d'analyse technique avancés et un langage de script propriétaire (Pine Script) pour créer ses propres indicateurs.\n\nPour un trader indépendant ou un investisseur particulier, la version gratuite couvre déjà beaucoup de besoins ; les plans payants débloquent plus d'indicateurs simultanés, d'alertes et de données en temps réel sans délai.",
    longDescriptionEn: "TradingView is the reference for tracking financial markets in real time: stocks, crypto, forex, commodities, with advanced technical analysis tools and a proprietary scripting language (Pine Script) to build custom indicators.\n\nFor an independent trader or individual investor, the free version already covers a lot of needs; paid plans unlock more simultaneous indicators, alerts, and real-time data with no delay.",
    pricing: "Version gratuite disponible ; plans payants à partir de ~13€/mois pour plus d'indicateurs et d'alertes.",
    pricingEn: "Free version available; paid plans from ~$13/month for more indicators and alerts.",
    pros: ["Données de marché en temps réel sur la quasi-totalité des actifs financiers", "Pine Script permet de créer des indicateurs et stratégies personnalisés", "Communauté active qui partage des analyses et scripts gratuitement"],
    prosEn: ["Real-time market data on nearly all financial assets", "Pine Script lets you build custom indicators and strategies", "Active community sharing analyses and scripts for free"],
    cons: ["Données temps réel sans délai réservées aux plans payants sur certains marchés", "Courbe d'apprentissage pour qui découvre l'analyse technique", "Pine Script demande un apprentissage spécifique pour créer ses propres outils"],
    consEn: ["No-delay real-time data reserved for paid plans on some markets", "Learning curve for those new to technical analysis", "Pine Script requires specific learning to build your own tools"],
    useCases: ["Suivre des actions, crypto ou devises en temps réel avec analyse technique", "Créer des indicateurs personnalisés avec Pine Script", "Configurer des alertes de prix pour ne pas surveiller les marchés en continu"],
    useCasesEn: ["Track stocks, crypto, or currencies in real time with technical analysis", "Build custom indicators with Pine Script", "Set up price alerts to avoid constantly watching markets"],
    verdict: {
      keepIf: ["Tu trades ou investis activement et veux des données de marché fiables", "Tu veux créer des indicateurs personnalisés avec Pine Script"],
      avoidIf: ["Tu investis passivement sans besoin d'analyse technique poussée", "Le délai sur les données gratuites pose problème pour ton usage (day trading)"],
      threshold: "Indispensable pour le trading actif ; la version gratuite suffit pour un usage occasionnel.",
    },
    verdictEn: {
      keepIf: ["You trade or invest actively and want reliable market data", "You want to build custom indicators with Pine Script"],
      avoidIf: ["You invest passively with no need for deep technical analysis", "The delay on free data is a problem for your use case (day trading)"],
      threshold: "Essential for active trading; the free version is enough for occasional use.",
    },
  },
  obs: {
    shortDescription: "Logiciel open source gratuit de capture et diffusion vidéo en direct, la référence pour le streaming.",
    shortDescriptionEn: "Free open-source live video capture and broadcasting software, the streaming reference.",
    longDescription: "OBS Studio (Open Broadcaster Software) est le logiciel open source de référence pour capturer son écran, sa webcam et diffuser en direct vers Twitch, YouTube ou tout autre service, ou enregistrer en local. Gratuit et sans watermark, c'est le choix par défaut de la majorité des streamers et créateurs de tutoriels vidéo.\n\nSa courbe d'apprentissage est plus élevée que des outils commerciaux simplifiés (Streamlabs), mais sa flexibilité (scènes, sources, plugins) en fait l'outil de référence dès que les besoins de production deviennent un peu plus sophistiqués.",
    longDescriptionEn: "OBS Studio (Open Broadcaster Software) is the reference open-source software to capture your screen, webcam, and broadcast live to Twitch, YouTube, or any other service, or record locally. Free and watermark-free, it's the default choice for most streamers and tutorial video creators.\n\nIts learning curve is steeper than simplified commercial tools (Streamlabs), but its flexibility (scenes, sources, plugins) makes it the reference tool once production needs become a bit more sophisticated.",
    pricing: "Gratuit, open source, aucun coût.",
    pricingEn: "Free, open source, no cost.",
    defaultMonthlyPrice: 0,
    pros: ["Totalement gratuit, open source, sans watermark ni limitation", "Flexibilité totale via scènes, sources et plugins tiers", "Standard de l'industrie, énormément de tutoriels et de ressources disponibles"],
    prosEn: ["Completely free, open source, no watermark or limitation", "Total flexibility via scenes, sources, and third-party plugins", "Industry standard, huge amount of tutorials and resources available"],
    cons: ["Courbe d'apprentissage plus élevée que des outils commerciaux simplifiés", "Configuration manuelle nécessaire pour des effets avancés (alertes, overlays)", "Pas de fonctionnalités IA natives, tout passe par des plugins tiers"],
    consEn: ["Steeper learning curve than simplified commercial tools", "Manual configuration needed for advanced effects (alerts, overlays)", "No native AI features, everything goes through third-party plugins"],
    useCases: ["Streamer en direct sur Twitch ou YouTube gratuitement et sans watermark", "Enregistrer des tutoriels ou démonstrations d'écran en local", "Construire une configuration de production vidéo flexible avec plusieurs sources"],
    useCasesEn: ["Stream live on Twitch or YouTube for free with no watermark", "Record screen tutorials or demos locally", "Build a flexible video production setup with multiple sources"],
    verdict: {
      keepIf: ["Tu veux streamer ou enregistrer gratuitement sans watermark", "Tu es prêt à investir un peu de temps pour apprendre la configuration"],
      avoidIf: ["Tu veux une solution clé en main avec alertes et overlays préconfigurés — Streamlabs est plus simple", "Tu n'as pas le temps d'apprendre une configuration plus technique"],
      threshold: "Indispensable dès que tu veux du contrôle total gratuitement ; Streamlabs reste plus simple pour débuter.",
    },
    verdictEn: {
      keepIf: ["You want to stream or record for free with no watermark", "You're willing to invest some time learning the setup"],
      avoidIf: ["You want a turnkey solution with preconfigured alerts and overlays — Streamlabs is simpler", "You don't have time to learn a more technical setup"],
      threshold: "Essential once you want full control for free; Streamlabs remains simpler for beginners.",
    },
  },
  motion: {
    shortDescription: "Planificateur de tâches assisté par IA qui organise automatiquement ton calendrier selon les priorités.",
    shortDescriptionEn: "AI-assisted task planner that automatically organizes your calendar based on priorities.",
    longDescription: "Motion combine gestion de tâches et calendrier avec un algorithme qui replanifie automatiquement ta journée selon les priorités, deadlines et réunions déjà fixées — l'idée étant de ne plus avoir à organiser soi-même son emploi du temps tâche par tâche.\n\nPour un freelance ou un solopreneur qui jongle entre plusieurs projets et deadlines, c'est un pari sur la délégation de la planification à un algorithme plutôt qu'à une simple liste de tâches statique comme Todoist.",
    longDescriptionEn: "Motion combines task management and calendar with an algorithm that automatically replans your day based on priorities, deadlines, and already-set meetings — the idea being to stop manually organizing your schedule task by task.\n\nFor a freelancer or solopreneur juggling multiple projects and deadlines, it's a bet on delegating planning to an algorithm rather than a simple static task list like Todoist.",
    pricing: "À partir de ~19€/mois (individuel), avec une réduction si engagement annuel.",
    pricingEn: "From ~$19/month (individual), with a discount for annual commitment.",
    pros: ["Replanification automatique de la journée selon les priorités réelles", "Combine tâches et calendrier dans un seul outil, évite le double tracking", "Utile pour qui a du mal à prioriser soi-même entre plusieurs projets"],
    prosEn: ["Automatic day replanning based on real priorities", "Combines tasks and calendar in one tool, avoids double tracking", "Useful for those who struggle to prioritize between several projects"],
    cons: ["Prix plus élevé qu'un simple gestionnaire de tâches comme Todoist", "Dépendre d'un algorithme pour planifier peut frustrer qui préfère garder le contrôle", "Courbe d'adaptation pour faire confiance à la replanification automatique"],
    consEn: ["Higher price than a simple task manager like Todoist", "Relying on an algorithm to plan can frustrate those who prefer to stay in control", "Adjustment curve to trust automatic replanning"],
    useCases: ["Organiser son emploi du temps entre plusieurs projets clients sans planification manuelle", "Éviter de re-prioriser ses tâches chaque jour soi-même", "Combiner tâches et réunions dans un seul calendrier intelligent"],
    useCasesEn: ["Organize your schedule across several client projects with no manual planning", "Avoid re-prioritizing tasks yourself every day", "Combine tasks and meetings in one smart calendar"],
    verdict: {
      keepIf: ["Tu jongles entre plusieurs projets et deadlines et veux déléguer la planification", "Le prix premium est justifié par le temps gagné sur la replanification"],
      avoidIf: ["Tu préfères garder un contrôle manuel total sur ton emploi du temps", "Un simple gestionnaire de tâches comme Todoist suffit à ton organisation"],
      threshold: "Pertinent dès que la replanification manuelle quotidienne devient une vraie charge mentale.",
    },
    verdictEn: {
      keepIf: ["You juggle multiple projects and deadlines and want to delegate planning", "The premium price is justified by time saved on replanning"],
      avoidIf: ["You prefer to keep full manual control over your schedule", "A simple task manager like Todoist is enough for your organization"],
      threshold: "Worth it once daily manual replanning becomes a real mental load.",
    },
  },
  icons8: {
    shortDescription: "Bibliothèque d'icônes, illustrations et photos avec des outils IA de retouche intégrés.",
    shortDescriptionEn: "Library of icons, illustrations, and photos with built-in AI editing tools.",
    longDescription: "Icons8 propose une large bibliothèque d'icônes, illustrations et photos dans des styles cohérents, avec en plus des outils IA intégrés (suppression d'arrière-plan, amélioration de photo, génération d'avatar) qui en font plus qu'une simple banque d'assets statique.\n\nPour un designer ou un freelance qui a besoin d'icônes cohérentes rapidement sans repartir de zéro, c'est une alternative à Noun Project avec un catalogue plus large et des outils de retouche en plus.",
    longDescriptionEn: "Icons8 offers a large library of icons, illustrations, and photos in consistent styles, plus built-in AI tools (background removal, photo enhancement, avatar generation) that make it more than a simple static asset bank.\n\nFor a designer or freelancer who needs consistent icons quickly without starting from scratch, it's an alternative to Noun Project with a broader catalog and added editing tools.",
    pricing: "Gratuit avec attribution ; Premium à partir de ~9€/mois pour un usage sans attribution.",
    pricingEn: "Free with attribution; Premium from ~$9/month for attribution-free use.",
    pros: ["Catalogue large et cohérent d'icônes dans plusieurs styles visuels", "Outils IA intégrés (suppression de fond, amélioration photo) en plus des assets", "Version gratuite utilisable avec attribution, pratique pour tester"],
    prosEn: ["Large, consistent icon catalog in several visual styles", "Built-in AI tools (background removal, photo enhancement) alongside assets", "Free version usable with attribution, handy to test"],
    cons: ["Attribution obligatoire en version gratuite, gênante pour un usage commercial", "Moins spécialisé que Noun Project pour des icônes très techniques ou de niche", "Qualité variable selon les packs d'icônes"],
    consEn: ["Mandatory attribution on the free version, awkward for commercial use", "Less specialized than Noun Project for very technical or niche icons", "Variable quality depending on icon packs"],
    useCases: ["Trouver rapidement des icônes cohérentes pour une interface ou un site", "Supprimer le fond d'une photo sans logiciel de retouche complexe", "Générer un avatar ou une illustration stylisée rapidement"],
    useCasesEn: ["Quickly find consistent icons for an interface or site", "Remove a photo's background without complex editing software", "Quickly generate a stylized avatar or illustration"],
    verdict: {
      keepIf: ["Tu as besoin d'icônes cohérentes rapidement sans les dessiner toi-même", "Les outils IA intégrés (fond, retouche) te font gagner du temps"],
      avoidIf: ["Tu as besoin d'icônes très spécifiques ou techniques — Noun Project est plus complet sur ce point", "L'attribution obligatoire en gratuit pose problème pour ton usage"],
      threshold: "Pratique pour un usage rapide ; passe au Premium dès que l'attribution gratuite devient gênante.",
    },
    verdictEn: {
      keepIf: ["You need consistent icons quickly without drawing them yourself", "The built-in AI tools (background, editing) save you time"],
      avoidIf: ["You need very specific or technical icons — Noun Project is more complete here", "Mandatory free-tier attribution is a problem for your use case"],
      threshold: "Handy for quick use; upgrade to Premium once free attribution becomes a problem.",
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
