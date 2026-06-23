/** add-content-batch-15.mjs — contenu complet pour OpusClip, Descript,
 * Noun Project, Planoly, Headliner, GemPages, Judge.me, Loox. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));

const ANGLES = {
  opusclip: {
    stance: "augmente",
    augmentFr: "OpusClip est une IA dont le métier est précisément de découper une longue vidéo en clips courts viraux — l'IA n'est pas une fonctionnalité ajoutée, c'est la raison d'être du produit.",
    augmentEn: "OpusClip is an AI whose entire job is precisely to cut a long video into viral short clips — AI isn't an added feature, it's the product's reason to exist.",
    replaceFr: "Remplacer OpusClip par une autre IA ? La question ne se pose pas vraiment : OpusClip EST déjà une IA spécialisée dans le repurposing vidéo. Verdict : OpusClip est né IA-natif plutôt que d'être challengé par l'IA.",
    replaceEn: "Replace OpusClip with another AI? The question barely applies: OpusClip already IS an AI specialized in video repurposing. Verdict: OpusClip was born AI-native rather than being challenged by AI.",
    aiTools: [],
  },
  "descript-ai": {
    stance: "augmente",
    augmentFr: "Descript a construit tout son montage vidéo et audio autour de l'édition par texte (transcription puis montage en supprimant des mots), avec en plus du clonage de voix IA — c'est l'un des outils de montage les plus IA-natifs du marché.",
    augmentEn: "Descript built its entire video and audio editing around text-based editing (transcribe, then edit by deleting words), plus AI voice cloning — it's one of the most AI-native editing tools on the market.",
    replaceFr: "Remplacer Descript par une autre IA ? Descript EST déjà construit comme une IA de montage : transcription automatique, montage par suppression de texte, clonage vocal pour corriger une erreur sans réenregistrer. Verdict : Descript a absorbé l'IA dans son fonctionnement même plutôt que d'être challengé par elle.",
    replaceEn: "Replace Descript with another AI? Descript IS already built as an editing AI: automatic transcription, edit-by-deleting-text, voice cloning to fix a mistake without re-recording. Verdict: Descript absorbed AI into its core workflow rather than being challenged by it.",
    aiTools: [],
  },
};

const CONTENT = {
  opusclip: {
    shortDescription: "Transforme automatiquement une longue vidéo en plusieurs clips courts viraux pour TikTok, Reels et Shorts.",
    shortDescriptionEn: "Automatically turns a long video into several viral short clips for TikTok, Reels, and Shorts.",
    longDescription: "OpusClip analyse une vidéo longue (podcast, webinaire, stream) et identifie automatiquement les moments les plus susceptibles de devenir des clips viraux, avec un score de potentiel viral, des sous-titres et un recadrage automatique en format vertical.\n\nPour un créateur qui produit du contenu long format (podcast, interview) et veut le redistribuer en clips courts sur les réseaux sociaux, c'est un gain de temps considérable comparé à un montage manuel clip par clip.",
    longDescriptionEn: "OpusClip analyzes a long video (podcast, webinar, stream) and automatically identifies the moments most likely to become viral clips, with a viral potential score, captions, and automatic vertical reframing.\n\nFor a creator producing long-format content (podcast, interview) who wants to repurpose it into short social clips, it's a considerable time saver compared to manual clip-by-clip editing.",
    pricing: "Plan gratuit limité ; plans payants à partir de ~15$/mois selon le volume de minutes traitées.",
    pricingEn: "Limited free plan; paid plans from ~$15/month depending on processed minutes volume.",
    pros: ["Identifie automatiquement les meilleurs moments d'une longue vidéo", "Score de potentiel viral qui aide à prioriser quels clips publier", "Recadrage automatique en format vertical avec sous-titres inclus"],
    prosEn: ["Automatically identifies the best moments of a long video", "Viral potential score that helps prioritize which clips to publish", "Automatic vertical reframing with captions included"],
    cons: ["Le score de potentiel viral reste une estimation, pas une garantie de performance", "Coût qui monte avec le volume de vidéo traité chaque mois", "Une relecture humaine reste nécessaire pour valider la pertinence des clips choisis"],
    consEn: ["The viral potential score remains an estimate, not a performance guarantee", "Cost rises with the volume of video processed each month", "Human review remains necessary to validate the relevance of chosen clips"],
    useCases: ["Transformer un podcast ou une interview longue en plusieurs clips courts pour les réseaux sociaux", "Identifier rapidement les meilleurs moments d'un contenu long sans visionner tout en entier", "Redistribuer un webinaire enregistré en contenu social après coup"],
    useCasesEn: ["Turn a long podcast or interview into several short clips for social media", "Quickly identify the best moments of long content without watching it all", "Repurpose a recorded webinar into social content afterward"],
    verdict: {
      keepIf: ["Tu produis du contenu long format (podcast, interview, webinaire) régulièrement", "Tu veux redistribuer ce contenu en clips courts sans tout monter à la main"],
      avoidIf: ["Tu produis déjà directement du contenu court — l'outil n'a rien à repurposer", "Ton volume de vidéo est trop faible pour justifier l'abonnement"],
      threshold: "Pertinent dès que tu produis du contenu long à redistribuer régulièrement en format court.",
    },
    verdictEn: {
      keepIf: ["You produce long-format content (podcast, interview, webinar) regularly", "You want to repurpose it into short clips without manually editing everything"],
      avoidIf: ["You already produce short content directly — there's nothing to repurpose", "Your video volume is too low to justify the subscription"],
      threshold: "Worth it once you regularly produce long content to repurpose into short format.",
    },
  },
  "descript-ai": {
    shortDescriptionEn: "Edit audio and video by editing text, with AI voice cloning and automatic transcription.",
    shortDescription: "Monte de l'audio et de la vidéo en éditant du texte, avec clonage vocal IA et transcription automatique.",
    longDescription: "Descript transforme le montage audio et vidéo en édition de texte : la vidéo est transcrite automatiquement, et supprimer un mot dans le texte supprime le passage correspondant dans la vidéo. Sa fonctionnalité de clonage vocal (Overdub) permet même de corriger une phrase mal prononcée en la \"retapant\" avec une voix synthétique fidèle à l'originale.\n\nPour un créateur de podcast ou de vidéo qui n'est pas monteur de formation, c'est l'un des outils qui rend le montage le plus accessible, au prix d'un abonnement nécessaire pour les fonctionnalités avancées.",
    longDescriptionEn: "Descript turns audio and video editing into text editing: the video is automatically transcribed, and deleting a word in the text deletes the corresponding moment in the video. Its voice cloning feature (Overdub) even lets you fix a mispronounced sentence by \"retyping\" it with a synthetic voice faithful to the original.\n\nFor a podcast or video creator with no formal editing training, it's one of the tools that makes editing most accessible, at the cost of a subscription for advanced features.",
    pricing: "Plan gratuit limité ; plans payants à partir de ~15$/mois pour le clonage vocal et plus de fonctionnalités.",
    pricingEn: "Limited free plan; paid plans from ~$15/month for voice cloning and more features.",
    pros: ["Monter en éditant du texte, beaucoup plus accessible qu'une timeline classique", "Clonage vocal pour corriger une erreur sans réenregistrer", "Transcription automatique de bonne qualité, utile aussi pour le sous-titrage"],
    prosEn: ["Editing by editing text, much more accessible than a classic timeline", "Voice cloning to fix a mistake without re-recording", "Good-quality automatic transcription, also useful for captioning"],
    cons: ["Moins de contrôle créatif fin qu'un logiciel de montage traditionnel", "Fonctionnalités avancées (clonage vocal) réservées aux plans payants", "Peut sembler limité pour un montage vidéo très visuel et complexe"],
    consEn: ["Less fine-grained creative control than traditional editing software", "Advanced features (voice cloning) reserved for paid plans", "Can feel limited for very visual and complex video editing"],
    useCases: ["Monter un podcast ou une vidéo en éditant simplement la transcription", "Corriger une erreur de prononciation sans réenregistrer toute la prise", "Sous-titrer automatiquement une vidéo grâce à la transcription intégrée"],
    useCasesEn: ["Edit a podcast or video by simply editing the transcript", "Fix a pronunciation mistake without re-recording the whole take", "Automatically caption a video thanks to built-in transcription"],
    verdict: {
      keepIf: ["Tu fais du podcast ou de la vidéo sans formation de monteur", "Tu veux corriger des erreurs de prise sans tout réenregistrer"],
      avoidIf: ["Tu as besoin d'un contrôle créatif très fin sur le montage visuel", "Ton budget ne permet pas l'abonnement pour les fonctionnalités avancées"],
      threshold: "Excellent point d'entrée pour qui débute le montage sans formation technique.",
    },
    verdictEn: {
      keepIf: ["You make podcasts or videos with no formal editing training", "You want to fix take mistakes without re-recording everything"],
      avoidIf: ["You need very fine-grained creative control over visual editing", "Your budget doesn't allow for the subscription needed for advanced features"],
      threshold: "Excellent entry point for those starting editing with no technical training.",
    },
  },
  "noun-project": {
    shortDescription: "Bibliothèque de plus de 5 millions d'icônes vectorielles, en abonnement ou à l'unité.",
    shortDescriptionEn: "Library of over 5 million vector icons, by subscription or individually.",
    longDescription: "Noun Project est la référence historique des bibliothèques d'icônes vectorielles, avec un catalogue immense (plus de 5 millions d'icônes) couvrant quasiment tous les concepts imaginables, dans des styles cohérents et bien catégorisés.\n\nPour un designer ou freelance qui a besoin d'une icône précise rapidement, c'est souvent plus fiable qu'un générateur IA pour trouver exactement le bon symbole reconnaissable, plutôt qu'une interprétation visuelle approximative.",
    longDescriptionEn: "Noun Project is the historical reference for vector icon libraries, with a massive catalog (over 5 million icons) covering nearly every imaginable concept, in consistent, well-categorized styles.\n\nFor a designer or freelancer who needs a precise icon quickly, it's often more reliable than an AI generator to find exactly the right recognizable symbol, rather than an approximate visual interpretation.",
    pricing: "Gratuit avec attribution ; Pro à partir de ~40$/an pour un usage sans attribution.",
    pricingEn: "Free with attribution; Pro from ~$40/year for attribution-free use.",
    pros: ["Catalogue immense et précisément catégorisé, référence historique de la catégorie", "Icônes vectorielles de qualité constante, faciles à personnaliser (couleur, taille)", "Version gratuite utilisable avec attribution pour tester"],
    prosEn: ["Massive, precisely categorized catalog, the category's historical reference", "Consistent-quality vector icons, easy to customize (color, size)", "Free version usable with attribution to test"],
    cons: ["Attribution obligatoire en version gratuite, gênante pour un usage commercial", "Styles parfois hétérogènes entre différents contributeurs", "Pas d'outils IA intégrés contrairement à des concurrents comme Icons8"],
    consEn: ["Mandatory attribution on the free version, awkward for commercial use", "Sometimes inconsistent styles between different contributors", "No built-in AI tools unlike competitors like Icons8"],
    useCases: ["Trouver une icône précise et reconnaissable pour une interface ou présentation", "Personnaliser la couleur et le style d'icônes pour les adapter à une charte graphique", "Accéder à un catalogue d'icônes vectorielles modifiables sans les dessiner soi-même"],
    useCasesEn: ["Find a precise, recognizable icon for an interface or presentation", "Customize icon color and style to match a brand guideline", "Access a catalog of editable vector icons with no drawing needed"],
    verdict: {
      keepIf: ["Tu as besoin d'une icône précise et reconnaissable rapidement", "Tu préfères chercher une icône existante plutôt que d'en générer une approximative par IA"],
      avoidIf: ["L'attribution obligatoire en gratuit pose problème pour ton usage commercial", "Tu veux des outils de retouche IA intégrés en plus des icônes (Icons8 convient mieux)"],
      threshold: "Référence fiable pour trouver une icône précise ; passe au Pro dès que l'attribution devient gênante.",
    },
    verdictEn: {
      keepIf: ["You need a precise, recognizable icon quickly", "You prefer searching for an existing icon rather than generating an approximate one via AI"],
      avoidIf: ["Mandatory free-tier attribution is a problem for your commercial use", "You want built-in AI editing tools alongside icons (Icons8 fits better)"],
      threshold: "Reliable reference to find a precise icon; upgrade to Pro once attribution becomes a problem.",
    },
  },
  planoly: {
    shortDescription: "Planification et programmation de publications Instagram et autres réseaux sociaux.",
    shortDescriptionEn: "Planning and scheduling for Instagram and other social media posts.",
    longDescription: "Planoly permet de planifier visuellement son feed Instagram à l'avance (grille de prévisualisation), programmer la publication de posts, stories et reels, et analyser les performances, en plus du support d'autres plateformes (TikTok, Pinterest, Facebook).\n\nPour un créateur ou une petite marque qui veut maintenir une cohérence visuelle sur Instagram, la prévisualisation en grille avant publication est la fonctionnalité différenciante par rapport à des outils de programmation plus génériques.",
    longDescriptionEn: "Planoly lets you visually plan your Instagram feed in advance (preview grid), schedule posts, stories, and reels, and analyze performance, alongside support for other platforms (TikTok, Pinterest, Facebook).\n\nFor a creator or small brand wanting to maintain visual consistency on Instagram, the grid preview before publishing is the differentiating feature compared to more generic scheduling tools.",
    pricing: "Plan gratuit limité ; plans payants à partir de ~13$/mois.",
    pricingEn: "Limited free plan; paid plans from ~$13/month.",
    pros: ["Prévisualisation en grille pour planifier la cohérence visuelle du feed Instagram", "Programmation automatique de posts, stories et reels", "Support multi-plateformes (Instagram, TikTok, Pinterest, Facebook)"],
    prosEn: ["Grid preview to plan Instagram feed visual consistency", "Automatic scheduling of posts, stories, and reels", "Multi-platform support (Instagram, TikTok, Pinterest, Facebook)"],
    cons: ["Fonctionnalités avancées (analytics poussés) réservées aux plans payants", "Moins riche en automatisations que des outils plus complets comme Buffer ou Hootsuite", "Plan gratuit limité en nombre de posts programmables"],
    consEn: ["Advanced features (deep analytics) reserved for paid plans", "Less rich in automations than more complete tools like Buffer or Hootsuite", "Free plan limited in number of schedulable posts"],
    useCases: ["Planifier visuellement la cohérence d'un feed Instagram avant publication", "Programmer des posts en avance pour gagner du temps sur la gestion quotidienne", "Gérer la publication sur plusieurs réseaux sociaux depuis un seul outil"],
    useCasesEn: ["Visually plan an Instagram feed's consistency before publishing", "Schedule posts in advance to save time on daily management", "Manage publishing across multiple social networks from one tool"],
    verdict: {
      keepIf: ["La cohérence visuelle de ton feed Instagram est importante pour ta marque", "Tu veux planifier et programmer du contenu en avance pour gagner du temps"],
      avoidIf: ["Tu gères beaucoup de réseaux avec des besoins d'automatisation poussés — Buffer ou Hootsuite sont plus complets", "Tu publies très occasionnellement sans besoin de planification visuelle"],
      threshold: "Pertinent dès que la cohérence visuelle Instagram compte pour ta marque ou ton activité.",
    },
    verdictEn: {
      keepIf: ["Your Instagram feed's visual consistency matters for your brand", "You want to plan and schedule content in advance to save time"],
      avoidIf: ["You manage many networks with deep automation needs — Buffer or Hootsuite are more complete", "You post very occasionally with no need for visual planning"],
      threshold: "Worth it once Instagram visual consistency matters for your brand or business.",
    },
  },
  headliner: {
    shortDescription: "Transforme un fichier audio (podcast) en vidéo avec sous-titres pour les réseaux sociaux.",
    shortDescriptionEn: "Turns an audio file (podcast) into a video with captions for social media.",
    longDescription: "Headliner résout un problème spécifique aux podcasteurs : transformer un épisode audio en vidéo partageable sur les réseaux sociaux, avec une forme d'onde animée, des sous-titres automatiques et un visuel de fond personnalisable.\n\nPour un podcasteur qui veut promouvoir ses épisodes sur Instagram ou TikTok sans tourner de vidéo séparée, c'est un moyen rapide de créer un format visuel à partir d'un contenu purement audio.",
    longDescriptionEn: "Headliner solves a problem specific to podcasters: turning an audio episode into a shareable social media video, with an animated waveform, automatic captions, and a customizable background visual.\n\nFor a podcaster who wants to promote episodes on Instagram or TikTok without shooting a separate video, it's a fast way to create a visual format from purely audio content.",
    pricing: "Plan gratuit limité ; plans payants à partir de ~8$/mois.",
    pricingEn: "Limited free plan; paid plans from ~$8/month.",
    defaultMonthlyPrice: 0,
    pros: ["Transforme un podcast audio en clip vidéo partageable en quelques minutes", "Sous-titres automatiques pour améliorer la rétention sur les réseaux sociaux", "Pensé spécifiquement pour les besoins de promotion des podcasteurs"],
    prosEn: ["Turns an audio podcast into a shareable video clip in minutes", "Automatic captions to improve social media retention", "Specifically designed for podcasters' promotion needs"],
    cons: ["Reste un format simple (forme d'onde + sous-titres), pas un vrai montage vidéo", "Moins polyvalent qu'un éditeur vidéo complet pour d'autres usages", "Fonctionnalités avancées réservées aux plans payants"],
    consEn: ["Remains a simple format (waveform + captions), not real video editing", "Less versatile than a full video editor for other uses", "Advanced features reserved for paid plans"],
    useCases: ["Promouvoir un épisode de podcast sur Instagram ou TikTok sans tourner de vidéo", "Créer rapidement un clip avec sous-titres à partir d'un fichier audio existant", "Améliorer la visibilité d'un podcast sur des plateformes principalement visuelles"],
    useCasesEn: ["Promote a podcast episode on Instagram or TikTok with no video shoot", "Quickly create a clip with captions from an existing audio file", "Improve a podcast's visibility on primarily visual platforms"],
    verdict: {
      keepIf: ["Tu produis un podcast et veux le promouvoir sur des plateformes vidéo sans tourner de vidéo", "Tu veux un outil simple et rapide plutôt qu'un vrai logiciel de montage"],
      avoidIf: ["Tu as déjà une vidéo source — un éditeur classique ou CapCut suffit", "Tu veux un montage vidéo plus créatif et personnalisé"],
      threshold: "Pertinent spécifiquement pour transformer de l'audio pur en contenu vidéo partageable.",
    },
    verdictEn: {
      keepIf: ["You produce a podcast and want to promote it on video platforms with no video shoot", "You want a simple, fast tool rather than real editing software"],
      avoidIf: ["You already have source video — a classic editor or CapCut is enough", "You want more creative, customized video editing"],
      threshold: "Specifically worth it to turn pure audio into shareable video content.",
    },
  },
  gempages: {
    shortDescription: "Constructeur de pages drag-and-drop pour Shopify, pensé pour la conversion.",
    shortDescriptionEn: "Drag-and-drop page builder for Shopify, designed for conversion.",
    longDescription: "GemPages est un constructeur de pages visuel pour Shopify qui permet de créer des pages produit, landing pages et pages d'accueil personnalisées sans coder, avec des éléments orientés conversion (témoignages, comparateurs, countdown).\n\nL'éditeur Shopify natif étant limité en personnalisation, GemPages est souvent utilisé par les marques e-commerce qui veulent une page produit ou une landing page plus convaincante qu'un thème standard, sans embaucher de développeur.",
    longDescriptionEn: "GemPages is a visual page builder for Shopify that lets you create custom product pages, landing pages, and homepages with no coding, with conversion-oriented elements (testimonials, comparison tables, countdowns).\n\nSince Shopify's native editor is limited in customization, GemPages is often used by e-commerce brands wanting a more compelling product or landing page than a standard theme, without hiring a developer.",
    pricing: "Plan gratuit limité ; plans payants à partir de ~29$/mois.",
    pricingEn: "Limited free plan; paid plans from ~$29/month.",
    pros: ["Personnalisation poussée de pages Shopify sans coder", "Éléments orientés conversion prêts à l'emploi (témoignages, countdown)", "Évite d'embaucher un développeur pour des pages produit ou landing pages personnalisées"],
    prosEn: ["Deep customization of Shopify pages with no coding", "Ready-made conversion-oriented elements (testimonials, countdown)", "Avoids hiring a developer for custom product or landing pages"],
    cons: ["Coût supplémentaire au-dessus de l'abonnement Shopify de base", "Peut ralentir légèrement le temps de chargement si mal optimisé", "Courbe d'apprentissage pour exploiter pleinement l'éditeur"],
    consEn: ["Additional cost on top of the base Shopify subscription", "Can slightly slow load time if poorly optimized", "Learning curve to fully leverage the editor"],
    useCases: ["Créer une page produit plus convaincante qu'un thème Shopify standard", "Construire une landing page dédiée à une campagne marketing sans développeur", "Tester différentes mises en page pour améliorer le taux de conversion"],
    useCasesEn: ["Create a more compelling product page than a standard Shopify theme", "Build a dedicated landing page for a marketing campaign with no developer", "Test different layouts to improve conversion rate"],
    verdict: {
      keepIf: ["Tu veux personnaliser des pages Shopify sans embaucher de développeur", "Le taux de conversion de tes pages produit justifie l'investissement"],
      avoidIf: ["Le thème Shopify standard suffit déjà à tes besoins", "Ton budget ne permet pas un coût supplémentaire au-dessus de l'abonnement Shopify"],
      threshold: "Rentable si l'amélioration de conversion dépasse le coût mensuel de l'outil.",
    },
    verdictEn: {
      keepIf: ["You want to customize Shopify pages without hiring a developer", "Your product pages' conversion rate justifies the investment"],
      avoidIf: ["The standard Shopify theme already meets your needs", "Your budget doesn't allow for an additional cost on top of the Shopify subscription"],
      threshold: "Worth it if the conversion improvement exceeds the tool's monthly cost.",
    },
  },
  "judge-me": {
    shortDescription: "Application d'avis clients pour Shopify, alternative économique aux solutions premium.",
    shortDescriptionEn: "Customer review app for Shopify, an affordable alternative to premium solutions.",
    longDescription: "Judge.me collecte et affiche des avis clients sur une boutique Shopify (texte, photo, vidéo), avec des emails de relance automatiques après achat pour maximiser le taux de collecte, à un prix nettement inférieur à des concurrents comme Yotpo ou Okendo.\n\nLes avis clients étant un facteur de conversion important en e-commerce, c'est un outil souvent installé dès le lancement d'une boutique pour construire la preuve sociale sans budget important.",
    longDescriptionEn: "Judge.me collects and displays customer reviews on a Shopify store (text, photo, video), with automatic follow-up emails after purchase to maximize collection rate, at a notably lower price than competitors like Yotpo or Okendo.\n\nSince customer reviews are an important e-commerce conversion factor, it's an often-installed tool from store launch to build social proof without a significant budget.",
    pricing: "Plan gratuit disponible (limité) ; Pro à partir de ~15$/mois.",
    pricingEn: "Free plan available (limited); Pro from ~$15/month.",
    pros: ["Prix nettement inférieur aux leaders du marché (Yotpo, Okendo)", "Emails de relance automatiques qui augmentent le taux de collecte d'avis", "Plan gratuit fonctionnel pour démarrer sans budget"],
    prosEn: ["Notably lower price than market leaders (Yotpo, Okendo)", "Automatic follow-up emails that increase review collection rate", "Functional free plan to start with no budget"],
    cons: ["Interface moins polie que les solutions premium plus chères", "Fonctionnalités avancées de marketing (UGC, syndication) plus limitées", "Support client moins réactif que les leaders établis"],
    consEn: ["Less polished interface than more expensive premium solutions", "Advanced marketing features (UGC, syndication) more limited", "Less responsive customer support than established leaders"],
    useCases: ["Collecter des avis clients avec photos pour construire la preuve sociale", "Afficher des avis directement sur les pages produit pour améliorer la conversion", "Démarrer la collecte d'avis dès le lancement d'une boutique avec un budget limité"],
    useCasesEn: ["Collect customer reviews with photos to build social proof", "Display reviews directly on product pages to improve conversion", "Start collecting reviews from store launch with a limited budget"],
    verdict: {
      keepIf: ["Tu lances une boutique et as besoin de preuve sociale sans gros budget", "Tu veux un outil d'avis fonctionnel sans payer le prix des leaders premium"],
      avoidIf: ["Tu as besoin de fonctionnalités marketing avancées (syndication UGC poussée)", "Le budget n'est pas une contrainte et tu veux l'interface la plus polie du marché"],
      threshold: "Excellent choix par défaut pour démarrer la collecte d'avis à moindre coût.",
    },
    verdictEn: {
      keepIf: ["You're launching a store and need social proof with no big budget", "You want a functional review tool without paying premium leader prices"],
      avoidIf: ["You need advanced marketing features (deep UGC syndication)", "Budget isn't a constraint and you want the most polished interface on the market"],
      threshold: "Excellent default choice to start collecting reviews at lower cost.",
    },
  },
  loox: {
    shortDescription: "Application d'avis clients avec photos, spécialisée pour les boutiques Shopify visuelles.",
    shortDescriptionEn: "Photo-based customer review app, specialized for visual Shopify stores.",
    longDescription: "Loox se concentre sur les avis clients avec photos, considérés comme plus convaincants pour la conversion que des avis texte seuls, avec une interface visuelle pensée pour les boutiques de produits visuels (mode, beauté, déco).\n\nC'est un concurrent direct de Judge.me, positionné légèrement plus premium avec un focus marketing plus fort sur l'utilisation des avis visuels en publicité (Facebook Ads, Instagram).",
    longDescriptionEn: "Loox focuses on customer reviews with photos, considered more convincing for conversion than text-only reviews, with a visual interface designed for visual product stores (fashion, beauty, decor).\n\nIt's a direct competitor to Judge.me, positioned slightly more premium with a stronger marketing focus on using visual reviews in advertising (Facebook Ads, Instagram).",
    pricing: "À partir de ~9,99$/mois selon le volume de commandes.",
    pricingEn: "From ~$9.99/month depending on order volume.",
    pros: ["Avis avec photos qui convertissent généralement mieux que le texte seul", "Interface visuelle bien adaptée aux boutiques mode, beauté et déco", "Intégration facile avec les publicités Facebook et Instagram"],
    prosEn: ["Photo reviews generally convert better than text alone", "Visual interface well suited to fashion, beauty, and decor stores", "Easy integration with Facebook and Instagram ads"],
    cons: ["Plus cher que Judge.me pour des fonctionnalités globalement similaires", "Moins pertinent pour des produits où la photo client n'apporte pas de valeur", "Tarification qui monte avec le volume de commandes mensuelles"],
    consEn: ["More expensive than Judge.me for largely similar features", "Less relevant for products where customer photos add no value", "Pricing rises with monthly order volume"],
    useCases: ["Collecter des avis avec photos pour des produits visuels (mode, beauté)", "Réutiliser les avis photo dans des publicités Facebook ou Instagram", "Construire une preuve sociale visuelle forte sur les pages produit"],
    useCasesEn: ["Collect photo reviews for visual products (fashion, beauty)", "Reuse photo reviews in Facebook or Instagram ads", "Build strong visual social proof on product pages"],
    verdict: {
      keepIf: ["Tu vends des produits visuels où la photo client ajoute une vraie valeur de conversion", "Tu veux réutiliser les avis photo dans tes publicités"],
      avoidIf: ["Tes produits ne se prêtent pas à des avis photo (services, logiciels)", "Le budget compte plus que les fonctionnalités marketing avancées — Judge.me est plus économique"],
      threshold: "Pertinent pour les boutiques de produits visuels qui veulent exploiter les avis en publicité.",
    },
    verdictEn: {
      keepIf: ["You sell visual products where customer photos add real conversion value", "You want to reuse photo reviews in your ads"],
      avoidIf: ["Your products don't lend themselves to photo reviews (services, software)", "Budget matters more than advanced marketing features — Judge.me is cheaper"],
      threshold: "Worth it for visual product stores wanting to leverage reviews in advertising.",
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
