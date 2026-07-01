/** add-content-batch-6.mjs — aiAngle + contenu complet pour 8 fiches à
 * forte notoriété : X, Webflow, Airtable, Bubble, Gumroad, Substack,
 * Final Cut Pro, DaVinci Resolve. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  x: {
    stance: "augmente",
    augmentFr: "X a intégré Grok directement dans la timeline (résumés, réponses, recherche), mais la plateforme reste avant tout un réseau de distribution en temps réel — l'IA y ajoute une couche d'assistance, pas une refonte du produit.",
    augmentEn: "X integrated Grok directly into the timeline (summaries, replies, search), but the platform remains primarily a real-time distribution network — AI adds an assistance layer there, not a product overhaul.",
    replaceFr: "Remplacer X par une IA ? Non : la conversation publique en temps réel et l'audience déjà construite restent sur la plateforme, pas reproductibles par un chatbot. L'IA aide à rédiger ou résumer des fils, elle ne remplace pas la distribution. Verdict : l'IA augmente la production de contenu, X reste le canal de diffusion en temps réel.",
    replaceEn: "Replace X with an AI? No: real-time public conversation and the audience already built stay on the platform, not reproducible by a chatbot. AI helps write or summarize threads, it doesn't replace distribution. Verdict: AI augments content production, X remains the real-time distribution channel.",
    aiTools: [],
  },
  webflow: {
    stance: "challenge",
    augmentFr: "Webflow a son générateur IA (Webflow AI) pour proposer une première version de site, mais affronte désormais des outils IA-first comme Framer AI ou Lovable qui génèrent un résultat visuel comparable, voire supérieur, en partant d'un simple prompt.",
    augmentEn: "Webflow has its own AI generator (Webflow AI) to propose a first site version, but now faces AI-first tools like Framer AI or Lovable that generate a comparable, if not better, visual result from a simple prompt.",
    replaceFr: "Remplacer Webflow par une IA ? Pour un premier jet, les nouveaux générateurs IA-first vont souvent plus vite avec un résultat plus moderne. Webflow garde l'avantage sur le contrôle fin du design (CSS visuel) et les workflows CMS pour des sites complexes. Verdict : challengé sur la génération rapide, solide sur la précision et la complexité.",
    replaceEn: "Replace Webflow with an AI? For a first draft, newer AI-first generators often move faster with a more modern result. Webflow keeps the edge on fine-grained design control (visual CSS) and CMS workflows for complex sites. Verdict: challenged on fast generation, solid on precision and complexity.",
    aiTools: ["framer", "lovable"],
  },
  airtable: {
    stance: "augmente",
    augmentFr: "Airtable a son assistant IA (Airtable AI) pour résumer, catégoriser ou générer du contenu directement dans les enregistrements, mais sa vraie valeur reste la structure de base de données flexible qui remplace plusieurs outils.",
    augmentEn: "Airtable has its AI assistant (Airtable AI) to summarize, categorize, or generate content directly in records, but its real value remains the flexible database structure that replaces several tools.",
    replaceFr: "Remplacer Airtable par une IA ? Non : structurer des données partagées en équipe (CRM, suivi de contenu, gestion de projet) reste un besoin de base de données relationnelle, pas une tâche de génération. L'IA aide à remplir et catégoriser plus vite, elle ne remplace pas la structure. Verdict : l'IA augmente la saisie et le tri, la base de données reste le produit.",
    replaceEn: "Replace Airtable with an AI? No: structuring shared team data (CRM, content tracking, project management) remains a relational-database need, not a generation task. AI helps fill in and categorize faster, it doesn't replace the structure. Verdict: AI augments entry and sorting, the database remains the product.",
    aiTools: [],
  },
  bubble: {
    stance: "challenge",
    augmentFr: "Bubble reste un outil no-code visuel pour construire des apps web complexes avec une vraie logique métier, alors que des générateurs IA comme Lovable ou Bolt.new permettent désormais de créer une app fonctionnelle depuis un simple prompt, sans apprendre l'éditeur visuel.",
    augmentEn: "Bubble remains a visual no-code tool for building complex web apps with real business logic, while AI generators like Lovable or Bolt.new now let you create a working app from a simple prompt, without learning the visual editor.",
    replaceFr: "Remplacer Bubble par une IA ? Pour un MVP simple, les générateurs IA vont plus vite et ne demandent pas d'apprendre l'éditeur Bubble. Pour une app avec une logique métier complexe et beaucoup de cas particuliers, le contrôle visuel fin de Bubble reste précieux. Verdict : challengé sur les MVP simples, encore pertinent pour les apps complexes.",
    replaceEn: "Replace Bubble with an AI? For a simple MVP, AI generators move faster and don't require learning the Bubble editor. For an app with complex business logic and many edge cases, Bubble's fine-grained visual control remains valuable. Verdict: challenged on simple MVPs, still relevant for complex apps.",
    aiTools: ["lovable", "bolt-new"],
  },
  gumroad: {
    stance: "augmente",
    augmentFr: "Gumroad reste la plateforme la plus simple pour vendre un produit numérique (ebook, template, formation) en quelques minutes ; l'IA intervient surtout en amont, pour créer le produit lui-même (ChatGPT, Canva), pas dans la vente.",
    augmentEn: "Gumroad remains the simplest platform to sell a digital product (ebook, template, course) in minutes; AI mainly comes in upstream, to create the product itself (ChatGPT, Canva), not in the selling.",
    replaceFr: "Remplacer Gumroad par une IA ? Non : encaisser un paiement, gérer la livraison du fichier et la fiscalité associée restent des problèmes d'infrastructure de paiement, pas de génération de contenu. L'IA aide à créer le produit vendu, elle ne remplace pas la plateforme de vente. Verdict : l'IA augmente la création du produit, Gumroad reste l'infrastructure de vente.",
    replaceEn: "Replace Gumroad with an AI? No: collecting payment, handling file delivery, and associated taxes remain payment-infrastructure problems, not content-generation ones. AI helps create the product sold, it doesn't replace the sales platform. Verdict: AI augments product creation, Gumroad remains the sales infrastructure.",
    aiTools: ["chatgpt", "canva"],
  },
  substack: {
    stance: "augmente",
    augmentFr: "Substack a ajouté des outils d'aide à la rédaction, mais sa valeur reste la combinaison newsletter + monétisation par abonnement + audience portable — un modèle d'affaires, pas un problème que l'IA résout en générant du texte.",
    augmentEn: "Substack added writing-assistance tools, but its value remains the combination of newsletter + subscription monetization + portable audience — a business model, not a problem AI solves by generating text.",
    replaceFr: "Remplacer Substack par une IA ? Non : la monétisation par abonnement et la propriété de sa liste d'emails restent un modèle économique que la plateforme rend possible, pas une tâche de génération. L'IA aide à écrire plus vite, mais l'audience et les abonnements payants restent sur Substack. Verdict : l'IA augmente la rédaction, le modèle d'abonnement reste le produit.",
    replaceEn: "Replace Substack with an AI? No: subscription monetization and owning your email list remain a business model the platform enables, not a generation task. AI helps write faster, but the audience and paid subscriptions stay on Substack. Verdict: AI augments writing, the subscription model remains the product.",
    aiTools: ["chatgpt"],
  },
  "final-cut-pro": {
    stance: "augmente",
    augmentFr: "Final Cut Pro a ajouté des fonctions IA (suivi d'objet, suppression de bruit de fond, transcription automatique), mais reste un éditeur de montage professionnel précis — l'IA accélère certaines tâches répétitives, elle ne remplace pas le montage créatif.",
    augmentEn: "Final Cut Pro added AI features (object tracking, background noise removal, automatic transcription), but remains a precise professional editing tool — AI speeds up some repetitive tasks, it doesn't replace creative editing.",
    replaceFr: "Remplacer Final Cut Pro par une IA ? Non : monter une vidéo avec une narration et un rythme précis reste un travail créatif que l'IA ne fait pas seule. Elle automatise des tâches techniques (sous-titres, nettoyage audio), pas les choix de montage. Verdict : l'IA augmente la productivité technique, le montage créatif reste un savoir-faire humain.",
    replaceEn: "Replace Final Cut Pro with an AI? No: editing a video with precise narrative and pacing remains creative work AI doesn't do alone. It automates technical tasks (captions, audio cleanup), not editing choices. Verdict: AI augments technical productivity, creative editing remains a human skill.",
    aiTools: [],
  },
  "davinci-resolve": {
    stance: "augmente",
    augmentFr: "DaVinci Resolve a ajouté des outils IA (Magic Mask pour détourer un sujet, suppression de bruit vocal) sans changer ce qu'est l'outil : une suite de montage et d'étalonnage couleur professionnel, gratuite dans sa version de base.",
    augmentEn: "DaVinci Resolve added AI tools (Magic Mask for object masking, voice noise removal) without changing what the tool is: a professional editing and color-grading suite, free in its base version.",
    replaceFr: "Remplacer DaVinci Resolve par une IA ? Non : l'étalonnage couleur précis et le montage narratif restent un travail technique et créatif que l'IA assiste mais ne remplace pas. Le Magic Mask accélère le détourage, il ne fait pas les choix artistiques. Verdict : l'IA augmente certaines tâches techniques, le montage et l'étalonnage restent un savoir-faire.",
    replaceEn: "Replace DaVinci Resolve with an AI? No: precise color grading and narrative editing remain technical and creative work that AI assists but doesn't replace. Magic Mask speeds up masking, it doesn't make the artistic choices. Verdict: AI augments certain technical tasks, editing and grading remain a craft.",
    aiTools: [],
  },
};

const CONTENT = {
  x: {
    shortDescription: "Réseau social de conversation publique en temps réel, gratuit, avec abonnement Premium optionnel.",
    shortDescriptionEn: "Real-time public conversation social network, free, with an optional Premium subscription.",
    longDescription: "X (anciennement Twitter) reste la référence pour la conversation publique en temps réel : actualité, débats, veille sectorielle et visibilité instantanée pour qui sait y être pertinent. L'algorithme favorise l'engagement et la viralité, ce qui en fait un canal puissant pour construire une audience ou une réputation d'expert sur un sujet précis.\n\nPour un indépendant ou un créateur, c'est surtout un outil de visibilité et de réseau professionnel — moins adapté à la vente directe qu'à la construction d'autorité et au développement de relations B2B.",
    longDescriptionEn: "X (formerly Twitter) remains the reference for real-time public conversation: news, debates, industry monitoring, and instant visibility for anyone who knows how to stay relevant. The algorithm favors engagement and virality, making it a powerful channel to build an audience or expert reputation on a specific topic.\n\nFor a freelancer or creator, it's mainly a visibility and professional networking tool — less suited to direct selling than to building authority and B2B relationships.",
    pricing: "Gratuit ; Premium à partir de ~8$/mois (badge, fonctionnalités, monétisation possible).",
    pricingEn: "Free; Premium from ~$8/month (badge, features, possible monetization).",
    defaultMonthlyPrice: 0,
    pros: ["Visibilité instantanée possible même sans audience préexistante", "Référence pour la veille sectorielle et l'actualité en temps réel", "Excellent pour construire une réputation d'expert sur un sujet de niche"],
    prosEn: ["Instant visibility possible even without a pre-existing audience", "Reference for industry monitoring and real-time news", "Excellent for building an expert reputation in a niche topic"],
    cons: ["Algorithme très changeant, la portée organique varie fortement", "Conversation parfois toxique, demande une gestion active de la modération", "Moins adapté à la vente directe qu'à la construction de notoriété"],
    consEn: ["Very volatile algorithm, organic reach varies widely", "Conversation sometimes toxic, requires active moderation management", "Less suited to direct selling than to building reputation"],
    useCases: ["Construire une réputation d'expert dans une niche professionnelle", "Faire de la veille en temps réel sur son secteur d'activité", "Réseauter avec d'autres professionnels et trouver des opportunités"],
    useCasesEn: ["Build an expert reputation in a professional niche", "Monitor your industry in real time", "Network with other professionals and find opportunities"],
    verdict: {
      keepIf: ["Ton métier bénéficie d'une présence publique et d'un réseau professionnel actif", "Tu veux faire de la veille sectorielle en temps réel"],
      avoidIf: ["Tu cherches un canal de vente directe — d'autres plateformes convertissent mieux", "Tu n'as pas le temps de gérer une présence active et la modération"],
      threshold: "Pertinent pour la notoriété et le réseau professionnel ; moins efficace comme canal de vente direct.",
    },
    verdictEn: {
      keepIf: ["Your work benefits from public presence and an active professional network", "You want to monitor your industry in real time"],
      avoidIf: ["You're looking for a direct sales channel — other platforms convert better", "You don't have time to manage an active presence and moderation"],
      threshold: "Worth it for visibility and professional networking; less effective as a direct sales channel.",
    },
  },
  webflow: {
    pros: ["Contrôle visuel du CSS sans écrire de code, très précis", "CMS intégré pour gérer du contenu dynamique (blog, portfolio)", "Sites rapides et bien structurés en SEO par défaut"],
    prosEn: ["Visual CSS control without writing code, very precise", "Built-in CMS to manage dynamic content (blog, portfolio)", "Fast, well SEO-structured sites by default"],
    cons: ["Courbe d'apprentissage plus élevée qu'un constructeur classique (Wix, Squarespace)", "Tarification qui grimpe vite avec plusieurs sites ou besoins e-commerce", "Moins adapté à un débutant total qui veut juste un site rapide"],
    consEn: ["Steeper learning curve than a basic builder (Wix, Squarespace)", "Pricing rises quickly with multiple sites or e-commerce needs", "Less suited to a total beginner who just wants a quick site"],
    useCases: ["Créer un site avec un design sur-mesure sans coder", "Gérer un blog ou portfolio avec un CMS structuré pour le SEO", "Livrer des sites clients en tant que freelance designer ou agence"],
    useCasesEn: ["Build a site with custom design without coding", "Manage a blog or portfolio with an SEO-structured CMS", "Deliver client sites as a freelance designer or agency"],
    verdict: {
      keepIf: ["Tu veux un contrôle de design précis sans coder", "Tu es designer ou freelance et livres des sites à des clients"],
      avoidIf: ["Tu veux juste un site rapide sans apprendre un nouvel outil — Squarespace ou Wix suffisent", "Ton budget est très serré et tu gères plusieurs sites"],
      threshold: "Idéal pour un designer qui veut du contrôle ; pour un site simple et rapide, des outils plus accessibles suffisent.",
    },
    verdictEn: {
      keepIf: ["You want precise design control without coding", "You're a designer or freelancer delivering sites to clients"],
      avoidIf: ["You just want a quick site without learning a new tool — Squarespace or Wix are enough", "Your budget is very tight and you manage multiple sites"],
      threshold: "Great for a designer who wants control; for a simple, fast site, more accessible tools are enough.",
    },
  },
  airtable: {
    pros: ["Flexibilité extrême : remplace un CRM, un suivi de projet, une base de contenus", "Vues multiples (grille, kanban, calendrier, galerie) sur les mêmes données", "Automatisations et intégrations puissantes pour un usage no-code"],
    prosEn: ["Extreme flexibility: replaces a CRM, project tracker, content database", "Multiple views (grid, kanban, calendar, gallery) on the same data", "Powerful automations and integrations for no-code use"],
    cons: ["Demande un vrai temps de setup pour bien structurer sa base", "Les plans avec gros volumes de lignes/automatisations montent vite en prix", "Moins intuitif qu'un tableur classique pour un usage très simple"],
    consEn: ["Requires real setup time to structure the base properly", "Plans with high row/automation volumes get expensive quickly", "Less intuitive than a classic spreadsheet for very simple use"],
    useCases: ["Centraliser un CRM simple sans payer pour un Salesforce ou HubSpot complet", "Suivre un calendrier éditorial avec plusieurs statuts et vues", "Construire une base de données de projets avec automatisations (rappels, notifications)"],
    useCasesEn: ["Centralize a simple CRM without paying for a full Salesforce or HubSpot", "Track an editorial calendar with multiple statuses and views", "Build a project database with automations (reminders, notifications)"],
    verdict: {
      keepIf: ["Tu veux remplacer plusieurs outils (CRM léger, suivi projet, planning) par un seul", "Tu es à l'aise pour structurer toi-même ta base de données"],
      avoidIf: ["Tu veux juste un tableur simple — Google Sheets suffit largement", "Ton équipe a besoin d'un vrai CRM avec pipeline de vente avancé"],
      threshold: "Pertinent dès que tu veux structurer des données au-delà d'un simple tableur.",
    },
    verdictEn: {
      keepIf: ["You want to replace several tools (light CRM, project tracking, planning) with one", "You're comfortable structuring your own database"],
      avoidIf: ["You just want a simple spreadsheet — Google Sheets is plenty", "Your team needs a real CRM with an advanced sales pipeline"],
      threshold: "Worth it once you need to structure data beyond a simple spreadsheet.",
    },
  },
  bubble: {
    shortDescription: "Outil no-code pour construire une vraie application web avec base de données et logique métier.",
    shortDescriptionEn: "No-code tool to build a real web application with database and business logic.",
    longDescription: "Bubble permet de construire une application web complète — interface, base de données, logique conditionnelle, workflows — sans écrire de code traditionnel, via un éditeur visuel. C'est l'un des outils no-code les plus puissants pour des apps avec une vraie logique métier (marketplace, SaaS, outil interne complexe), au prix d'une courbe d'apprentissage réelle.\n\nPour un porteur de projet non-développeur, Bubble permet de lancer un MVP fonctionnel sans embaucher un développeur ; pour un projet plus simple, les générateurs d'apps par IA (Lovable, Bolt.new) sont aujourd'hui plus rapides à démarrer.",
    longDescriptionEn: "Bubble lets you build a complete web application — interface, database, conditional logic, workflows — without writing traditional code, via a visual editor. It's one of the most powerful no-code tools for apps with real business logic (marketplace, SaaS, complex internal tool), at the cost of a real learning curve.\n\nFor a non-developer founder, Bubble lets you launch a working MVP without hiring a developer; for a simpler project, AI app generators (Lovable, Bolt.new) are faster to start with today.",
    pricing: "Gratuit pour tester ; plans payants à partir de ~32$/mois pour un projet en production.",
    pricingEn: "Free to test; paid plans from ~$32/month for a production project.",
    pros: ["Permet de construire une vraie app avec logique métier complexe sans coder", "Communauté et plugins actifs pour étendre les fonctionnalités", "Contrôle visuel fin sur le comportement de l'app"],
    prosEn: ["Lets you build a real app with complex business logic without coding", "Active community and plugins to extend functionality", "Fine-grained visual control over app behavior"],
    cons: ["Courbe d'apprentissage significative, pas un outil de weekend", "Performance qui peut se dégrader sur des apps très complexes", "Migration hors de Bubble difficile, fort lock-in"],
    consEn: ["Significant learning curve, not a weekend tool", "Performance can degrade on very complex apps", "Migration away from Bubble is difficult, strong lock-in"],
    useCases: ["Lancer un MVP de SaaS ou marketplace sans embaucher de développeur", "Construire un outil interne sur mesure pour une équipe", "Valider une idée d'app avec une vraie logique métier avant d'investir dans du code custom"],
    useCasesEn: ["Launch a SaaS or marketplace MVP without hiring a developer", "Build a custom internal tool for a team", "Validate an app idea with real business logic before investing in custom code"],
    verdict: {
      keepIf: ["Ton app a une logique métier complexe (marketplace, SaaS multi-rôles)", "Tu es prêt à investir du temps pour apprendre l'outil"],
      avoidIf: ["Ton besoin est un MVP simple — un générateur IA comme Lovable ira plus vite", "Tu veux éviter le lock-in et garder un code portable"],
      threshold: "Justifié pour une app complexe sans développeur ; pour un MVP simple, un générateur IA est plus rapide aujourd'hui.",
    },
    verdictEn: {
      keepIf: ["Your app has complex business logic (marketplace, multi-role SaaS)", "You're willing to invest time learning the tool"],
      avoidIf: ["You need a simple MVP — an AI generator like Lovable will be faster", "You want to avoid lock-in and keep portable code"],
      threshold: "Worth it for a complex app with no developer; for a simple MVP, an AI generator is faster today.",
    },
  },
  gumroad: {
    longDescription: "Gumroad est la plateforme la plus simple pour vendre un produit numérique (ebook, template, formation, musique) directement à son audience, sans configurer de boutique complète. Tu crées une page de vente en quelques minutes et encaisses le paiement immédiatement.\n\nPour un créateur indépendant qui vend un ou quelques produits digitaux, c'est souvent plus rapide et moins cher qu'une boutique Shopify complète — le compromis étant moins de personnalisation et des frais par transaction plus visibles.",
    longDescriptionEn: "Gumroad is the simplest platform to sell a digital product (ebook, template, course, music) directly to your audience, without setting up a full store. You create a sales page in minutes and collect payment immediately.\n\nFor an independent creator selling one or a few digital products, it's often faster and cheaper than a full Shopify store — the trade-off being less customization and more visible per-transaction fees.",
    pricing: "Gratuit à l'inscription ; commission de 10% par vente (dégressive avec le volume).",
    pricingEn: "Free to sign up; 10% commission per sale (decreasing with volume).",
    pros: ["Page de vente en ligne en quelques minutes, zéro configuration technique", "Gestion automatique de la TVA et de la fiscalité internationale", "Idéal pour tester rapidement une idée de produit digital"],
    prosEn: ["Sales page live in minutes, zero technical setup", "Automatic VAT and international tax handling", "Ideal for quickly testing a digital product idea"],
    cons: ["Commission de 10% plus élevée qu'un Stripe ou une boutique Shopify dédiée", "Personnalisation de la page de vente limitée comparée à un vrai site", "Moins adapté dès que le volume de ventes justifie une boutique complète"],
    consEn: ["10% commission higher than Stripe or a dedicated Shopify store", "Sales page customization limited compared to a real site", "Less suited once sales volume justifies a full store"],
    useCases: ["Vendre un ebook, template ou formation directement à son audience", "Tester une idée de produit digital avant d'investir dans une boutique complète", "Encaisser des paiements internationaux sans gérer la fiscalité soi-même"],
    useCasesEn: ["Sell an ebook, template, or course directly to your audience", "Test a digital product idea before investing in a full store", "Collect international payments without handling tax yourself"],
    verdict: {
      keepIf: ["Tu vends un nombre limité de produits digitaux et veux démarrer vite", "Tu préfères ne pas gérer la fiscalité internationale toi-même"],
      avoidIf: ["Ton volume de ventes est élevé — la commission de 10% devient coûteuse", "Tu veux une boutique entièrement personnalisée à ta marque"],
      threshold: "Parfait pour démarrer vite ; au-delà d'un certain volume, compare le coût avec Shopify + Stripe.",
    },
    verdictEn: {
      keepIf: ["You sell a limited number of digital products and want to start fast", "You'd rather not handle international tax yourself"],
      avoidIf: ["Your sales volume is high — the 10% commission becomes costly", "You want a fully branded, customized store"],
      threshold: "Great to start fast; beyond a certain volume, compare the cost with Shopify + Stripe.",
    },
  },
  substack: {
    pros: ["Monétisation par abonnement intégrée dès le départ, sans configuration", "Tu possèdes ta liste d'emails, portable si tu migres un jour", "Découverte intégrée (recommandations) qui peut apporter des abonnés gratuits"],
    prosEn: ["Subscription monetization built in from day one, no setup needed", "You own your email list, portable if you ever migrate", "Built-in discovery (recommendations) that can bring free subscribers"],
    cons: ["Commission de 10% sur les revenus d'abonnement payant", "Personnalisation du design très limitée comparée à un blog dédié", "Dépendance à l'algorithme de découverte Substack pour la croissance organique"],
    consEn: ["10% commission on paid subscription revenue", "Very limited design customization compared to a dedicated blog", "Dependent on Substack's discovery algorithm for organic growth"],
    useCases: ["Lancer une newsletter payante sans configurer de système de paiement", "Construire une audience fidèle autour d'une expertise ou d'un angle éditorial", "Tester un modèle d'abonnement avant d'investir dans une plateforme propre"],
    useCasesEn: ["Launch a paid newsletter without setting up a payment system", "Build a loyal audience around an expertise or editorial angle", "Test a subscription model before investing in your own platform"],
    verdict: {
      keepIf: ["Tu veux monétiser une newsletter sans complexité technique", "Le système de découverte Substack peut t'apporter des lecteurs organiques"],
      avoidIf: ["Tu veux un contrôle total du design ou éviter la commission de 10%", "Tu as déjà un site et un système de paiement en place"],
      threshold: "Idéal pour démarrer une newsletter monétisée rapidement ; au-delà d'un certain volume, évalue le coût de la commission.",
    },
    verdictEn: {
      keepIf: ["You want to monetize a newsletter with no technical complexity", "Substack's discovery system can bring you organic readers"],
      avoidIf: ["You want full design control or to avoid the 10% commission", "You already have a site and payment system in place"],
      threshold: "Great to start a monetized newsletter fast; beyond a certain volume, weigh the cost of the commission.",
    },
  },
  "final-cut-pro": {
    longDescription: "Final Cut Pro est le logiciel de montage vidéo professionnel d'Apple, vendu en achat unique (pas d'abonnement) et optimisé pour tirer parti du matériel Mac (puces Apple Silicon). Il est très utilisé par les monteurs indépendants et YouTubeurs pour sa rapidité et son interface basée sur la timeline magnétique, différente de la timeline classique d'Adobe Premiere.\n\nLe compromis principal : Mac uniquement, ce qui en exclut l'usage pour qui travaille sur PC ou collabore avec une équipe mixte.",
    longDescriptionEn: "Final Cut Pro is Apple's professional video editing software, sold as a one-time purchase (no subscription) and optimized to leverage Mac hardware (Apple Silicon chips). It's widely used by independent editors and YouTubers for its speed and magnetic timeline interface, different from Adobe Premiere's classic timeline.\n\nThe main trade-off: Mac only, which rules it out for anyone working on PC or collaborating with a mixed team.",
    pricing: "Achat unique de ~300€, pas d'abonnement mensuel.",
    pricingEn: "One-time purchase of ~$300, no monthly subscription.",
    pros: ["Achat unique, pas d'abonnement mensuel contrairement à Premiere Pro", "Performances très rapides sur Mac grâce à l'optimisation Apple Silicon", "Timeline magnétique qui accélère le montage une fois maîtrisée"],
    prosEn: ["One-time purchase, no monthly subscription unlike Premiere Pro", "Very fast performance on Mac thanks to Apple Silicon optimization", "Magnetic timeline that speeds up editing once mastered"],
    cons: ["Mac uniquement, aucune version Windows", "Écosystème de plugins et de formations plus restreint que Premiere Pro", "Collaboration en équipe mixte (Mac/PC) plus compliquée"],
    consEn: ["Mac only, no Windows version", "Smaller plugin and training ecosystem than Premiere Pro", "Collaboration with mixed (Mac/PC) teams more complicated"],
    useCases: ["Monter des vidéos YouTube ou réseaux sociaux rapidement sur Mac", "Éviter l'abonnement mensuel d'Adobe Premiere Pro sur le long terme", "Profiter de performances optimales sur un Mac récent (Apple Silicon)"],
    useCasesEn: ["Edit YouTube or social media videos quickly on Mac", "Avoid Adobe Premiere Pro's long-term monthly subscription", "Get optimal performance on a recent Mac (Apple Silicon)"],
    verdict: {
      keepIf: ["Tu montes exclusivement sur Mac et veux éviter un abonnement mensuel", "Tu veux des performances de montage rapides sur un Mac récent"],
      avoidIf: ["Tu collabores avec une équipe sur PC ou changes souvent d'OS", "Tu as besoin de l'écosystème de plugins et formations le plus large (Premiere Pro)"],
      threshold: "Excellent choix sur Mac pour qui veut éviter l'abonnement ; à éviter si la compatibilité PC compte.",
    },
    verdictEn: {
      keepIf: ["You edit exclusively on Mac and want to avoid a monthly subscription", "You want fast editing performance on a recent Mac"],
      avoidIf: ["You collaborate with a PC team or switch OS often", "You need the widest plugin and training ecosystem (Premiere Pro)"],
      threshold: "Excellent choice on Mac to avoid a subscription; avoid it if PC compatibility matters.",
    },
  },
  "davinci-resolve": {
    longDescription: "DaVinci Resolve combine montage, étalonnage couleur professionnel, effets visuels (Fusion) et post-production audio (Fairlight) dans un seul logiciel, avec une version gratuite extrêmement complète — la référence en étalonnage couleur dans l'industrie du cinéma.\n\nPour un monteur indépendant, c'est souvent le meilleur rapport fonctionnalités/prix du marché : la version gratuite couvre déjà la majorité des besoins, la version Studio payante (achat unique) n'étant nécessaire que pour des fonctions avancées (résolutions très élevées, certains effets IA).",
    longDescriptionEn: "DaVinci Resolve combines editing, professional color grading, visual effects (Fusion), and audio post-production (Fairlight) in one piece of software, with an extremely complete free version — the industry reference for color grading in film.\n\nFor an independent editor, it's often the best features-to-price ratio on the market: the free version already covers most needs, with the paid Studio version (one-time purchase) only needed for advanced features (very high resolutions, certain AI effects).",
    pricing: "Gratuit (version très complète) ; Studio en achat unique à ~295€ pour les fonctions avancées.",
    pricingEn: "Free (very complete version); Studio one-time purchase at ~$295 for advanced features.",
    pros: ["Version gratuite extrêmement complète, rare sur ce niveau de logiciel pro", "Étalonnage couleur de référence dans l'industrie du cinéma", "Tout-en-un : montage, couleur, effets visuels et audio dans un seul logiciel"],
    prosEn: ["Extremely complete free version, rare at this level of pro software", "Industry-reference color grading for film", "All-in-one: editing, color, visual effects, and audio in one piece of software"],
    cons: ["Interface dense, courbe d'apprentissage plus raide que des outils plus simples", "Demande une machine assez puissante pour rester fluide", "Moins répandu que Premiere Pro dans certains environnements professionnels établis"],
    consEn: ["Dense interface, steeper learning curve than simpler tools", "Requires a fairly powerful machine to stay smooth", "Less common than Premiere Pro in some established professional environments"],
    useCases: ["Monter et étalonner une vidéo professionnelle sans payer de licence", "Apprendre l'étalonnage couleur avec l'outil de référence de l'industrie", "Combiner montage, effets visuels et audio sans jongler entre plusieurs logiciels"],
    useCasesEn: ["Edit and color-grade a professional video without paying for a license", "Learn color grading with the industry's reference tool", "Combine editing, visual effects, and audio without juggling multiple software"],
    verdict: {
      keepIf: ["Tu veux un logiciel de montage et d'étalonnage pro sans payer (version gratuite)", "Tu veux apprendre l'étalonnage couleur avec l'outil de référence du cinéma"],
      avoidIf: ["Tu préfères une interface plus simple et un montage rapide social media (CapCut)", "Ta machine n'est pas assez puissante pour faire tourner le logiciel correctement"],
      threshold: "Excellent rapport qualité/prix dès le niveau gratuit ; demande un minimum de puissance machine et d'apprentissage.",
    },
    verdictEn: {
      keepIf: ["You want pro editing and grading software for free (free version)", "You want to learn color grading with film's reference tool"],
      avoidIf: ["You prefer a simpler interface and fast social media editing (CapCut)", "Your machine isn't powerful enough to run the software smoothly"],
      threshold: "Excellent value even at the free tier; requires some machine power and a learning investment.",
    },
  },
};

let updated = 0;
for (const [slug, angle] of Object.entries(ANGLES)) {
  if (!present.has(slug)) { console.warn(`⚠️  ${slug} not found, skipping`); continue; }
  const tool = tools.find((x) => (x.slug || x.id) === slug);
  tool.seo = Object.assign({}, tool.seo, { aiAngle: angle });
  if (CONTENT[slug]) {
    for (const [key, value] of Object.entries(CONTENT[slug])) tool[key] = value;
    if (CONTENT[slug].longDescription) tool.description = CONTENT[slug].longDescription;
  }
  updated++;
  console.log(`✓ ${tool.name} (${slug}): ${angle.stance}${CONTENT[slug] ? " + contenu complet" : ""}`);
}
writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log(`\n${updated}/${Object.keys(ANGLES).length} fiches mises à jour.`);
