/** add-content-batch-14.mjs — contenu complet pour TubeBuddy,
 * MailerLite, Stan Store, Taplio, Acast, Storyblocks, Envato Elements,
 * Captions. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));

const ANGLES = {
  captions: {
    stance: "augmente",
    augmentFr: "Captions est une app de montage vidéo entièrement construite autour de l'IA : sous-titres automatiques, doublage IA, suppression de regard caméra raté, génération de B-roll — l'IA n'est pas un ajout, c'est le produit lui-même.",
    augmentEn: "Captions is a video editing app built entirely around AI: automatic captions, AI dubbing, fixing missed eye contact, B-roll generation — AI isn't an add-on, it's the product itself.",
    replaceFr: "Remplacer Captions par une autre IA ? La question est déjà résolue : Captions EST une IA de montage vidéo, pas un éditeur classique avec des fonctions IA ajoutées. Verdict : Captions a été conçu IA-natif dès le départ plutôt que d'être challengé par l'IA.",
    replaceEn: "Replace Captions with another AI? The question is already settled: Captions IS a video-editing AI, not a classic editor with AI features bolted on. Verdict: Captions was built AI-native from the start rather than being challenged by AI.",
    aiTools: [],
  },
};

const CONTENT = {
  tubebuddy: {
    shortDescription: "Extension d'optimisation SEO pour YouTube : mots-clés, vignettes, A/B testing.",
    shortDescriptionEn: "YouTube SEO optimization extension: keywords, thumbnails, A/B testing.",
    longDescription: "TubeBuddy est une extension de navigateur qui s'intègre directement dans le studio YouTube pour optimiser le référencement des vidéos : recherche de mots-clés avec volume de recherche estimé, A/B testing de vignettes, analyse de la concurrence sur un mot-clé, et automatisation de tâches répétitives (ajout de cartes, fins d'écran).\n\nPour un créateur YouTube qui veut croître plus méthodiquement, c'est un moyen de prendre des décisions basées sur des données plutôt que sur l'intuition pour les titres, vignettes et mots-clés.",
    longDescriptionEn: "TubeBuddy is a browser extension that integrates directly into YouTube Studio to optimize video SEO: keyword research with estimated search volume, thumbnail A/B testing, competitor analysis on a keyword, and automation of repetitive tasks (adding cards, end screens).\n\nFor a YouTube creator who wants to grow more methodically, it's a way to make data-driven decisions rather than intuition-based ones for titles, thumbnails, and keywords.",
    pricing: "Plan gratuit limité ; plans payants à partir de ~4,5$/mois.",
    pricingEn: "Limited free plan; paid plans from ~$4.5/month.",
    pros: ["Intégration directe dans YouTube Studio, pas d'outil externe à jongler", "A/B testing de vignettes pour des décisions basées sur des données réelles", "Recherche de mots-clés avec estimation de la concurrence sur YouTube spécifiquement"],
    prosEn: ["Direct integration into YouTube Studio, no external tool to juggle", "Thumbnail A/B testing for data-driven decisions", "Keyword research with YouTube-specific competition estimates"],
    cons: ["Fonctionnalités avancées réservées aux plans payants", "Estimations de volume de recherche moins précises que des outils SEO dédiés", "Utile surtout à partir d'un volume de publication régulier"],
    consEn: ["Advanced features reserved for paid plans", "Search volume estimates less precise than dedicated SEO tools", "Mainly useful once you publish regularly"],
    useCases: ["Trouver des mots-clés pertinents pour le titre et la description d'une vidéo", "Tester plusieurs vignettes pour identifier celle qui génère le plus de clics", "Automatiser des tâches répétitives sur plusieurs vidéos (tags, cartes)"],
    useCasesEn: ["Find relevant keywords for a video's title and description", "Test multiple thumbnails to find the one generating the most clicks", "Automate repetitive tasks across multiple videos (tags, cards)"],
    verdict: {
      keepIf: ["Tu publies régulièrement sur YouTube et veux optimiser ta découvrabilité", "Tu veux tester tes vignettes plutôt que deviner ce qui fonctionne"],
      avoidIf: ["Tu publies très occasionnellement — l'outil n'aura pas assez de données à analyser", "Ton contenu dépend peu de la recherche YouTube (contenu viral spontané)"],
      threshold: "Pertinent dès que tu publies assez régulièrement pour avoir des données à optimiser.",
    },
    verdictEn: {
      keepIf: ["You publish regularly on YouTube and want to optimize discoverability", "You want to test your thumbnails rather than guess what works"],
      avoidIf: ["You publish very occasionally — the tool won't have enough data to analyze", "Your content relies little on YouTube search (spontaneous viral content)"],
      threshold: "Worth it once you publish regularly enough to have data to optimize.",
    },
  },
  mailerlite: {
    shortDescription: "Email marketing simple et abordable, avec un plan gratuit généreux pour démarrer.",
    shortDescriptionEn: "Simple, affordable email marketing, with a generous free plan to start.",
    longDescription: "MailerLite est un outil d'email marketing positionné comme alternative plus simple et moins chère à Mailchimp ou ActiveCampaign : éditeur de newsletter par glisser-déposer, automatisations de base, pages de destination, le tout avec un plan gratuit qui couvre déjà jusqu'à 1000 contacts.\n\nPour un créateur ou une petite entreprise qui démarre sa liste email, c'est souvent le meilleur rapport fonctionnalités/prix pour les automatisations simples (séquence de bienvenue, relance panier abandonné).",
    longDescriptionEn: "MailerLite is an email marketing tool positioned as a simpler, cheaper alternative to Mailchimp or ActiveCampaign: drag-and-drop newsletter editor, basic automations, landing pages, all with a free plan already covering up to 1,000 contacts.\n\nFor a creator or small business starting an email list, it's often the best features-to-price ratio for simple automations (welcome sequence, abandoned cart follow-up).",
    pricing: "Gratuit jusqu'à 1000 contacts ; plans payants à partir de ~10€/mois au-delà.",
    pricingEn: "Free up to 1,000 contacts; paid plans from ~$10/month beyond that.",
    defaultMonthlyPrice: 0,
    pros: ["Plan gratuit généreux (1000 contacts) comparé à la plupart des concurrents", "Interface simple, prise en main rapide sans formation", "Bon rapport prix/fonctionnalités pour des automatisations de base"],
    prosEn: ["Generous free plan (1,000 contacts) compared to most competitors", "Simple interface, quick to learn with no training needed", "Good price-to-features ratio for basic automations"],
    cons: ["Automatisations moins poussées que ActiveCampaign ou Klaviyo pour du e-commerce avancé", "Écosystème d'intégrations plus restreint que Mailchimp", "Templates de design moins nombreux que des leaders établis"],
    consEn: ["Automations less advanced than ActiveCampaign or Klaviyo for advanced e-commerce", "Smaller integration ecosystem than Mailchimp", "Fewer design templates than established leaders"],
    useCases: ["Démarrer une liste email gratuitement jusqu'à 1000 contacts", "Envoyer une newsletter régulière à une audience de créateur ou petite entreprise", "Mettre en place des automatisations simples (bienvenue, relance)"],
    useCasesEn: ["Start an email list for free up to 1,000 contacts", "Send a regular newsletter to a creator or small business audience", "Set up simple automations (welcome, follow-up)"],
    verdict: {
      keepIf: ["Tu démarres une liste email avec un budget limité", "Tes besoins d'automatisation restent simples (bienvenue, séquences basiques)"],
      avoidIf: ["Tu as besoin d'automatisations e-commerce avancées — Klaviyo est plus adapté", "Tu gères déjà une grosse liste avec des besoins complexes de segmentation"],
      threshold: "Excellent choix pour démarrer ; migre vers un outil plus avancé si les besoins se complexifient.",
    },
    verdictEn: {
      keepIf: ["You're starting an email list with a limited budget", "Your automation needs stay simple (welcome, basic sequences)"],
      avoidIf: ["You need advanced e-commerce automations — Klaviyo fits better", "You already manage a large list with complex segmentation needs"],
      threshold: "Excellent choice to start; migrate to a more advanced tool as needs grow complex.",
    },
  },
  "stan-store": {
    shortDescription: "Boutique \"link in bio\" pour vendre des produits digitaux, coaching ou formations directement depuis les réseaux sociaux.",
    shortDescriptionEn: "\"Link in bio\" store to sell digital products, coaching, or courses directly from social media.",
    longDescription: "Stan Store combine la fonction \"link in bio\" de Linktree avec une vraie boutique intégrée : vente de produits digitaux, réservation de coaching, accès à une formation, tout depuis une seule page accessible en un clic depuis Instagram ou TikTok.\n\nC'est devenu populaire chez les créateurs qui monétisent directement leur audience sociale sans passer par un site web complet — l'alternative à combiner Linktree + Gumroad + Calendly en un seul outil plus simple.",
    longDescriptionEn: "Stan Store combines Linktree's \"link in bio\" function with a real built-in store: selling digital products, booking coaching, accessing a course, all from a single page accessible in one click from Instagram or TikTok.\n\nIt has become popular with creators who monetize their social audience directly without going through a full website — an alternative to combining Linktree + Gumroad + Calendly into one simpler tool.",
    pricing: "À partir de ~29$/mois (pas de plan gratuit permanent, essai disponible).",
    pricingEn: "From ~$29/month (no permanent free plan, trial available).",
    pros: ["Combine link in bio, vente de produits et réservation en un seul outil", "Pensé spécifiquement pour la monétisation depuis les réseaux sociaux", "Configuration rapide sans compétence technique"],
    prosEn: ["Combines link in bio, product sales, and booking in one tool", "Specifically designed for social media monetization", "Quick setup with no technical skills needed"],
    cons: ["Pas de plan gratuit permanent, contrairement à Linktree", "Moins flexible qu'une combinaison d'outils spécialisés pour des besoins avancés", "Coût mensuel à justifier par un volume de ventes suffisant"],
    consEn: ["No permanent free plan, unlike Linktree", "Less flexible than a combination of specialized tools for advanced needs", "Monthly cost needs to be justified by sufficient sales volume"],
    useCases: ["Vendre un produit digital ou une formation directement depuis Instagram ou TikTok", "Proposer la réservation de coaching sans outil de calendrier séparé", "Centraliser link in bio et vente en un seul outil simple"],
    useCasesEn: ["Sell a digital product or course directly from Instagram or TikTok", "Offer coaching booking with no separate calendar tool", "Centralize link in bio and sales in one simple tool"],
    verdict: {
      keepIf: ["Tu monétises directement ton audience sociale (produits, coaching, formations)", "Tu veux éviter de combiner plusieurs outils séparés (Linktree + Gumroad + Calendly)"],
      avoidIf: ["Ton volume de ventes ne justifie pas encore un abonnement mensuel de 29$", "Tu as déjà un site web complet qui couvre ces besoins"],
      threshold: "Rentable dès que la monétisation sociale directe génère plus que le coût de l'abonnement.",
    },
    verdictEn: {
      keepIf: ["You monetize your social audience directly (products, coaching, courses)", "You want to avoid combining several separate tools (Linktree + Gumroad + Calendly)"],
      avoidIf: ["Your sales volume doesn't yet justify a $29/month subscription", "You already have a full website covering these needs"],
      threshold: "Pays off once direct social monetization generates more than the subscription cost.",
    },
  },
  taplio: {
    shortDescription: "Outil IA pour créer du contenu LinkedIn et faire grandir sa présence professionnelle.",
    shortDescriptionEn: "AI tool to create LinkedIn content and grow your professional presence.",
    longDescription: "Taplio aide à produire du contenu LinkedIn régulièrement grâce à des suggestions de posts générés par IA, un calendrier de publication, et des analytics pour comprendre ce qui performe. C'est devenu un outil populaire chez les consultants, coachs et freelances B2B qui veulent construire leur autorité sur LinkedIn sans y passer des heures chaque jour.\n\nL'IA aide à dépasser le syndrome de la page blanche, mais la pertinence du contenu et la régularité de publication restent déterminantes pour la croissance réelle de l'audience.",
    longDescriptionEn: "Taplio helps produce LinkedIn content regularly through AI-generated post suggestions, a publishing calendar, and analytics to understand what performs. It has become a popular tool among consultants, coaches, and B2B freelancers who want to build authority on LinkedIn without spending hours on it every day.\n\nAI helps overcome writer's block, but content relevance and publishing consistency remain decisive for real audience growth.",
    pricing: "À partir de ~39$/mois selon les fonctionnalités.",
    pricingEn: "From ~$39/month depending on features.",
    pros: ["Suggestions de posts IA qui aident à dépasser le syndrome de la page blanche", "Calendrier de publication intégré pour rester régulier", "Analytics pour comprendre quels formats de post performent le mieux"],
    prosEn: ["AI post suggestions that help overcome writer's block", "Built-in publishing calendar to stay consistent", "Analytics to understand which post formats perform best"],
    cons: ["Coût mensuel significatif pour un outil de génération de contenu social", "Le contenu généré par IA demande toujours une relecture et personnalisation", "Pertinence dépend fortement de l'expertise réelle que tu as à partager"],
    consEn: ["Significant monthly cost for a social content generation tool", "AI-generated content still needs review and personalization", "Relevance heavily depends on the real expertise you have to share"],
    useCases: ["Maintenir une présence LinkedIn régulière sans y passer des heures chaque jour", "Construire son autorité professionnelle en B2B via du contenu de qualité", "Identifier les formats de post qui génèrent le plus d'engagement"],
    useCasesEn: ["Maintain a regular LinkedIn presence without spending hours on it daily", "Build professional B2B authority through quality content", "Identify which post formats generate the most engagement"],
    verdict: {
      keepIf: ["Tu es consultant, coach ou freelance B2B et veux construire ton autorité sur LinkedIn", "Tu manques de temps ou d'inspiration pour publier régulièrement"],
      avoidIf: ["Tu peux déjà publier régulièrement sans aide — l'outil n'apporte pas de valeur supplémentaire", "Ton activité ne bénéficie pas d'une présence LinkedIn (B2C grand public)"],
      threshold: "Pertinent si LinkedIn est un canal stratégique pour ton activité B2B et que la régularité te manque.",
    },
    verdictEn: {
      keepIf: ["You're a consultant, coach, or B2B freelancer wanting to build LinkedIn authority", "You lack time or inspiration to publish regularly"],
      avoidIf: ["You can already publish regularly with no help — the tool adds no extra value", "Your business doesn't benefit from a LinkedIn presence (mainstream B2C)"],
      threshold: "Worth it if LinkedIn is a strategic channel for your B2B business and consistency is your weak point.",
    },
  },
  acast: {
    shortDescription: "Plateforme d'hébergement et de monétisation de podcasts.",
    shortDescriptionEn: "Podcast hosting and monetization platform.",
    longDescription: "Acast héberge des podcasts et propose un réseau publicitaire intégré pour monétiser l'audience via des publicités dynamiques (insérées automatiquement selon l'audience et la région), en plus des fonctions classiques d'hébergement et de distribution vers les plateformes d'écoute.\n\nPour un podcasteur qui a déjà construit une audience, c'est un moyen de monétiser sans démarcher soi-même des annonceurs ; pour qui démarre, des outils plus simples (Spotify for Podcasters, Buzzsprout) suffisent souvent.",
    longDescriptionEn: "Acast hosts podcasts and offers a built-in ad network to monetize the audience via dynamic ads (automatically inserted based on audience and region), alongside classic hosting and distribution to listening platforms.\n\nFor a podcaster who has already built an audience, it's a way to monetize without prospecting advertisers yourself; for those starting out, simpler tools (Spotify for Podcasters, Buzzsprout) are often enough.",
    pricing: "Hébergement gratuit possible ; monétisation via le réseau publicitaire intégré selon l'audience.",
    pricingEn: "Free hosting possible; monetization via the built-in ad network depending on audience.",
    defaultMonthlyPrice: 0,
    pros: ["Réseau publicitaire intégré pour monétiser sans démarcher soi-même", "Publicités dynamiques insérées automatiquement selon la région", "Distribution automatique vers toutes les plateformes d'écoute majeures"],
    prosEn: ["Built-in ad network to monetize with no need to prospect advertisers", "Dynamic ads automatically inserted based on region", "Automatic distribution to all major listening platforms"],
    cons: ["Monétisation publicitaire pertinente seulement à partir d'une audience suffisante", "Moins simple que des outils d'hébergement basiques pour qui débute", "Revenus publicitaires variables et dépendants du marché"],
    consEn: ["Ad monetization only relevant once audience is large enough", "Less simple than basic hosting tools for beginners", "Variable ad revenue dependent on the market"],
    useCases: ["Monétiser un podcast déjà établi via la publicité dynamique", "Distribuer un podcast automatiquement sur toutes les plateformes d'écoute", "Accéder à un réseau publicitaire sans démarcher d'annonceurs soi-même"],
    useCasesEn: ["Monetize an already established podcast via dynamic ads", "Automatically distribute a podcast to all listening platforms", "Access an ad network with no need to prospect advertisers yourself"],
    verdict: {
      keepIf: ["Ton podcast a déjà une audience suffisante pour intéresser des annonceurs", "Tu veux monétiser sans démarcher toi-même des partenaires publicitaires"],
      avoidIf: ["Tu démarres un podcast sans audience encore établie", "Tu préfères un hébergement simple sans la complexité de la monétisation publicitaire"],
      threshold: "Pertinent une fois une audience établie qui justifie la monétisation publicitaire.",
    },
    verdictEn: {
      keepIf: ["Your podcast already has enough audience to interest advertisers", "You want to monetize without prospecting advertising partners yourself"],
      avoidIf: ["You're starting a podcast with no established audience yet", "You prefer simple hosting without the complexity of ad monetization"],
      threshold: "Worth it once an established audience justifies ad monetization.",
    },
  },
  storyblocks: {
    shortDescription: "Vidéos, musiques et images stock en abonnement illimité pour la production de contenu.",
    shortDescriptionEn: "Unlimited subscription stock video, music, and images for content production.",
    longDescription: "Storyblocks propose un catalogue de vidéos stock, musiques libres de droits et images, accessible en téléchargement illimité via un abonnement plutôt qu'à l'unité comme Shutterstock. Pour un créateur qui produit du contenu vidéo régulièrement, c'est souvent plus économique qu'acheter des clips individuels.\n\nLa qualité du catalogue est solide sans être au niveau des banques premium les plus chères (Getty), ce qui en fait un bon compromis pour la production de contenu régulière à budget maîtrisé.",
    longDescriptionEn: "Storyblocks offers a catalog of stock video, royalty-free music, and images, accessible via unlimited downloads through a subscription rather than per-item like Shutterstock. For a creator regularly producing video content, it's often more economical than buying individual clips.\n\nCatalog quality is solid without reaching the level of the most expensive premium banks (Getty), making it a good compromise for regular content production on a controlled budget.",
    pricing: "À partir de ~15€/mois en abonnement annuel pour un accès illimité.",
    pricingEn: "From ~$15/month on an annual subscription for unlimited access.",
    pros: ["Téléchargement illimité par abonnement, plus économique qu'à l'unité pour un usage régulier", "Catalogue large couvrant vidéo, musique et images en un seul abonnement", "Licence commerciale claire incluse pour tous les usages"],
    prosEn: ["Unlimited subscription downloads, more economical than per-item for regular use", "Large catalog covering video, music, and images in one subscription", "Clear commercial license included for all uses"],
    cons: ["Qualité de catalogue en dessous des banques premium les plus chères (Getty, Adobe Stock)", "Moins pertinent pour un usage très occasionnel — l'achat à l'unité serait plus économique", "Certains contenus très demandés se retrouvent dans plusieurs vidéos concurrentes"],
    consEn: ["Catalog quality below the most expensive premium banks (Getty, Adobe Stock)", "Less relevant for very occasional use — buying individually would be cheaper", "Some highly demanded content ends up in multiple competing videos"],
    useCases: ["Produire du contenu vidéo régulier avec des stock footage variés", "Trouver de la musique libre de droits pour habiller des vidéos", "Réduire les coûts de production comparé à l'achat de clips à l'unité"],
    useCasesEn: ["Produce regular video content with varied stock footage", "Find royalty-free music to score videos", "Reduce production costs compared to buying clips individually"],
    verdict: {
      keepIf: ["Tu produis du contenu vidéo régulièrement et as besoin de stock footage souvent", "Le budget illimité par abonnement est plus rentable que l'achat à l'unité"],
      avoidIf: ["Ton usage est très occasionnel — l'achat ponctuel ailleurs sera plus économique", "Tu as besoin d'une qualité premium très spécifique (Getty Images)"],
      threshold: "Rentable dès que tu télécharges plusieurs contenus stock par mois.",
    },
    verdictEn: {
      keepIf: ["You produce video content regularly and frequently need stock footage", "Unlimited subscription budget is more cost-effective than per-item purchase"],
      avoidIf: ["Your use is very occasional — buying one-off elsewhere will be cheaper", "You need very specific premium quality (Getty Images)"],
      threshold: "Worth it once you download several stock items a month.",
    },
  },
  "envato-elements": {
    shortDescription: "Abonnement illimité aux templates, graphismes, musiques et vidéos d'Envato.",
    shortDescriptionEn: "Unlimited subscription to Envato's templates, graphics, music, and video.",
    longDescription: "Envato Elements est la version abonnement illimité du catalogue Envato (templates WordPress, présentations, graphismes, musiques, vidéos stock), à la différence de ThemeForest qui vend ses produits à l'unité.\n\nPour qui télécharge plusieurs ressources créatives par mois, l'abonnement devient rapidement plus économique que l'achat individuel — un seul téléchargement suffit souvent à rentabiliser le mois.",
    longDescriptionEn: "Envato Elements is the unlimited subscription version of the Envato catalog (WordPress templates, presentations, graphics, music, stock video), unlike ThemeForest which sells products individually.\n\nFor anyone downloading several creative resources a month, the subscription quickly becomes more economical than buying individually — often just one download is enough to break even for the month.",
    pricing: "À partir de ~17€/mois pour un accès illimité à tout le catalogue.",
    pricingEn: "From ~$17/month for unlimited access to the entire catalog.",
    pros: ["Rentabilisé dès quelques téléchargements par mois face à l'achat à l'unité", "Catalogue large : templates, graphismes, musiques et vidéos en un seul abonnement", "Licence commerciale incluse, utilisable pour des projets clients"],
    prosEn: ["Pays for itself after just a few downloads a month vs. buying individually", "Large catalog: templates, graphics, music, and video in one subscription", "Commercial license included, usable for client projects"],
    cons: ["Moins rentable qu'un achat ponctuel si l'usage est très occasionnel", "Qualité variable selon les auteurs, demande un tri", "Abonnement récurrent à surveiller si l'usage diminue"],
    consEn: ["Less cost-effective than a one-off purchase if use is very occasional", "Variable quality depending on the author, requires sorting", "Recurring subscription to monitor if usage decreases"],
    useCases: ["Télécharger régulièrement des templates ou graphismes pour des projets clients", "Accéder à de la musique libre de droits pour des vidéos sans payer à l'unité", "Démarrer un projet créatif avec une base professionnelle réutilisable"],
    useCasesEn: ["Regularly download templates or graphics for client projects", "Access royalty-free music for videos without paying per item", "Start a creative project with a reusable professional base"],
    verdict: {
      keepIf: ["Tu télécharges plusieurs ressources créatives par mois", "Tu veux un catalogue varié (templates, musiques, vidéos) en un seul abonnement"],
      avoidIf: ["Ton besoin est ponctuel — l'achat à l'unité sur ThemeForest sera plus économique", "Tu n'utilises qu'un seul type de ressource rarement"],
      threshold: "Rentable dès 1-2 téléchargements par mois ; sinon, achète à l'unité.",
    },
    verdictEn: {
      keepIf: ["You download several creative resources a month", "You want a varied catalog (templates, music, video) in one subscription"],
      avoidIf: ["Your need is occasional — buying individually on ThemeForest will be cheaper", "You only use one type of resource rarely"],
      threshold: "Worth it from 1-2 downloads a month; otherwise, buy individually.",
    },
  },
  captions: {
    shortDescription: "App de montage vidéo IA-native : sous-titres, doublage et correction de regard automatiques.",
    shortDescriptionEn: "AI-native video editing app: automatic captions, dubbing, and eye-contact correction.",
    longDescription: "Captions est une application de montage vidéo conçue dès le départ autour de l'IA, plutôt qu'un éditeur classique avec des fonctions IA ajoutées après coup : sous-titres automatiques stylés, doublage dans une autre langue avec la voix originale conservée, correction automatique du regard qui ne fixe pas la caméra.\n\nPour un créateur qui produit du contenu vidéo seul, sans équipe de montage, c'est un moyen d'obtenir un rendu professionnel sans compétences techniques de montage poussées.",
    longDescriptionEn: "Captions is a video editing app designed from the ground up around AI, rather than a classic editor with AI features bolted on afterward: stylish automatic captions, dubbing into another language with the original voice preserved, automatic correction of eye contact that misses the camera.\n\nFor a creator producing video content solo, with no editing team, it's a way to get a professional result without deep technical editing skills.",
    pricing: "Plan gratuit limité ; Pro à partir de ~10$/mois.",
    pricingEn: "Limited free plan; Pro from ~$10/month.",
    pros: ["Fonctionnalités IA avancées (doublage, correction de regard) rares chez les concurrents", "Permet un rendu professionnel sans compétences de montage poussées", "Sous-titres automatiques de bonne qualité avec styles personnalisables"],
    prosEn: ["Advanced AI features (dubbing, eye-contact correction) rare among competitors", "Enables a professional result with no deep editing skills needed", "Good-quality automatic captions with customizable styles"],
    cons: ["Moins de contrôle créatif fin qu'un éditeur classique comme CapCut ou Premiere", "Fonctionnalités avancées réservées au plan payant", "Dépendance à la qualité de l'IA pour certains rendus (doublage notamment)"],
    consEn: ["Less fine-grained creative control than a classic editor like CapCut or Premiere", "Advanced features reserved for the paid plan", "Dependent on AI quality for certain results (especially dubbing)"],
    useCases: ["Produire du contenu vidéo solo avec un rendu professionnel sans équipe de montage", "Doubler une vidéo dans une autre langue en conservant le ton de la voix originale", "Corriger automatiquement un regard qui ne fixe pas bien la caméra"],
    useCasesEn: ["Produce solo video content with a professional result and no editing team", "Dub a video into another language while preserving the original voice's tone", "Automatically correct eye contact that doesn't quite hit the camera"],
    verdict: {
      keepIf: ["Tu produis du contenu vidéo seul sans équipe de montage", "Tu veux des fonctionnalités IA avancées (doublage, correction de regard)"],
      avoidIf: ["Tu as besoin d'un contrôle créatif fin — un éditeur classique convient mieux", "Tes besoins se limitent aux sous-titres simples — CapCut le fait déjà gratuitement"],
      threshold: "Pertinent pour un créateur solo qui veut un rendu pro sans compétences de montage poussées.",
    },
    verdictEn: {
      keepIf: ["You produce video content solo with no editing team", "You want advanced AI features (dubbing, eye-contact correction)"],
      avoidIf: ["You need fine-grained creative control — a classic editor fits better", "Your needs are limited to simple captions — CapCut already does that for free"],
      threshold: "Worth it for a solo creator who wants a pro result without deep editing skills.",
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
