/** add-content-batch-7.mjs — aiAngle pour InDesign + contenu complet
 * pour Envato, WooCommerce, FreshBooks, Wave, Lemon Squeezy, CapCut,
 * Submagic. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  indesign: {
    stance: "augmente",
    augmentFr: "InDesign a ajouté la génération de mise en page assistée via Adobe Firefly, mais reste l'outil de référence pour la PAO professionnelle (magazines, livres, brochures) acceptée par les imprimeurs — un standard de fichier, pas seulement un visuel.",
    augmentEn: "InDesign added AI-assisted layout generation via Adobe Firefly, but remains the reference tool for professional desktop publishing (magazines, books, brochures) accepted by printers — a file standard, not just a visual.",
    replaceFr: "Remplacer InDesign par une IA ? Non : un document destiné à l'impression doit respecter des contraintes précises (résolution, fonds perdus, polices intégrées) qu'un générateur d'images ne produit pas. L'IA aide à esquisser une mise en page, elle ne livre pas un fichier prêt pour l'imprimeur. Verdict : l'IA augmente l'idéation, InDesign reste l'outil de livraison professionnelle.",
    replaceEn: "Replace InDesign with an AI? No: a print-ready document must meet precise constraints (resolution, bleed, embedded fonts) that an image generator doesn't produce. AI helps sketch a layout, it doesn't deliver a print-ready file. Verdict: AI augments ideation, InDesign remains the professional delivery tool.",
    aiTools: [],
  },
  capcut: {
    stance: "augmente",
    augmentFr: "CapCut a intégré des fonctionnalités IA poussées (sous-titres automatiques, suppression de bruit, génération de B-roll) directement dans son éditeur mobile et desktop, ce qui en fait l'un des outils de montage les plus IA-natifs du marché grand public.",
    augmentEn: "CapCut integrated extensive AI features (automatic captions, noise removal, B-roll generation) directly into its mobile and desktop editor, making it one of the most AI-native editing tools for the consumer market.",
    replaceFr: "Remplacer CapCut par une IA conversationnelle ? Non, mais la question ne se pose presque plus : CapCut EST déjà largement une IA de montage, pas juste un éditeur classique. Le sous-titrage, le cadrage automatique et le nettoyage audio sont gérés par l'IA intégrée. Verdict : CapCut a absorbé l'IA plutôt que d'être challengé par elle.",
    replaceEn: "Replace CapCut with a conversational AI? No, but the question barely applies anymore: CapCut already IS largely an AI editing tool, not just a classic editor. Captioning, automatic framing, and audio cleanup are handled by built-in AI. Verdict: CapCut absorbed AI rather than being challenged by it.",
    aiTools: [],
  },
};

const CONTENT = {
  envato: {
    shortDescription: "Marketplace de templates, thèmes, graphismes et assets créatifs prêts à l'emploi.",
    shortDescriptionEn: "Marketplace for ready-to-use templates, themes, graphics, and creative assets.",
    longDescription: "Envato (via Envato Elements et ThemeForest) est la plus grande marketplace de ressources créatives prêtes à l'emploi : thèmes WordPress, templates de présentation, graphismes, musiques libres de droits, vidéos stock et plugins. Pour un freelance ou une petite agence, c'est souvent le moyen le plus rapide de partir d'une base professionnelle plutôt que de tout créer de zéro.\n\nEnvato Elements fonctionne par abonnement illimité (accès à tout le catalogue), tandis que ThemeForest vend des licences à l'unité — le choix dépend du volume de ressources dont tu as besoin sur l'année.",
    longDescriptionEn: "Envato (via Envato Elements and ThemeForest) is the largest marketplace for ready-to-use creative resources: WordPress themes, presentation templates, graphics, royalty-free music, stock video, and plugins. For a freelancer or small agency, it's often the fastest way to start from a professional base rather than building everything from scratch.\n\nEnvato Elements works on an unlimited subscription (access to the whole catalog), while ThemeForest sells licenses individually — the choice depends on how much you need over the year.",
    pricing: "Envato Elements à partir de ~17€/mois (accès illimité) ; ThemeForest à l'unité, de quelques euros à plusieurs centaines selon le produit.",
    pricingEn: "Envato Elements from ~$17/month (unlimited access); ThemeForest item-by-item, from a few dollars to several hundred depending on the product.",
    pros: ["Catalogue immense couvrant quasiment tous les besoins créatifs", "Envato Elements rentabilisé dès quelques téléchargements par mois", "Licence commerciale claire incluse, utilisable pour des projets clients"],
    prosEn: ["Huge catalog covering almost every creative need", "Envato Elements pays for itself after just a few downloads a month", "Clear commercial license included, usable for client projects"],
    cons: ["Qualité variable selon les auteurs, demande un tri pour trouver les meilleurs assets", "Thèmes WordPress parfois lourds en code si mal optimisés", "Abonnement Elements qui peut sembler cher si l'usage est ponctuel"],
    consEn: ["Variable quality depending on the author, requires sorting to find the best assets", "WordPress themes sometimes code-heavy if poorly optimized", "Elements subscription can feel expensive for occasional use"],
    useCases: ["Trouver un thème WordPress professionnel sans repartir de zéro", "Accéder à des templates de présentation, musiques ou vidéos stock pour des projets clients", "Démarrer un projet créatif avec une base professionnelle à personnaliser"],
    useCasesEn: ["Find a professional WordPress theme without starting from scratch", "Access presentation templates, music, or stock video for client projects", "Start a creative project with a professional base to customize"],
    verdict: {
      keepIf: ["Tu as un usage régulier de templates, graphismes ou musiques pour tes projets", "Tu veux gagner du temps en partant d'une base professionnelle"],
      avoidIf: ["Ton besoin est ponctuel — l'achat à l'unité sur ThemeForest sera plus rentable", "Tu préfères une production 100% originale sans templates"],
      threshold: "Rentable dès que tu télécharges plusieurs ressources par mois ; sinon, achète à l'unité.",
    },
    verdictEn: {
      keepIf: ["You regularly use templates, graphics, or music for your projects", "You want to save time by starting from a professional base"],
      avoidIf: ["Your need is occasional — buying individually on ThemeForest will be more cost-effective", "You prefer 100% original production without templates"],
      threshold: "Worth it once you download several resources a month; otherwise, buy individually.",
    },
  },
  woocommerce: {
    shortDescription: "Plugin e-commerce gratuit qui transforme un site WordPress en boutique en ligne.",
    shortDescriptionEn: "Free e-commerce plugin that turns a WordPress site into an online store.",
    longDescription: "WooCommerce est le plugin qui transforme un site WordPress existant en boutique en ligne complète : catalogue produits, panier, paiement, gestion de stock. Le plugin de base est gratuit, mais le coût réel vient de l'hébergement, du thème et des extensions payantes (paiement, expédition avancée) nécessaires pour une boutique sérieuse.\n\nPour qui a déjà un site WordPress ou veut un contrôle total sur le code, WooCommerce évite l'abonnement mensuel d'un Shopify — au prix d'une gestion technique plus lourde (mises à jour, sécurité, hébergement à gérer soi-même).",
    longDescriptionEn: "WooCommerce is the plugin that turns an existing WordPress site into a complete online store: product catalog, cart, payment, inventory management. The base plugin is free, but the real cost comes from hosting, the theme, and paid extensions (payment, advanced shipping) needed for a serious store.\n\nFor anyone who already has a WordPress site or wants full code control, WooCommerce avoids Shopify's monthly subscription — at the cost of heavier technical management (updates, security, self-managed hosting).",
    pricing: "Plugin gratuit ; coûts réels en hébergement (~10-30€/mois) et extensions payantes selon les besoins.",
    pricingEn: "Free plugin; real costs in hosting (~$10-30/month) and paid extensions depending on needs.",
    pros: ["Gratuit à la base, pas d'abonnement mensuel obligatoire comme Shopify", "Contrôle total du code et de l'hébergement", "Écosystème WordPress immense (thèmes, plugins) à réutiliser"],
    prosEn: ["Free at the base, no mandatory monthly subscription like Shopify", "Full control over code and hosting", "Huge WordPress ecosystem (themes, plugins) to reuse"],
    cons: ["Maintenance technique à ta charge (mises à jour, sécurité, sauvegardes)", "Coûts cachés en hébergement et extensions qui s'accumulent vite", "Plus complexe à configurer qu'une solution tout-en-un comme Shopify"],
    consEn: ["Technical maintenance is on you (updates, security, backups)", "Hidden hosting and extension costs add up quickly", "More complex to set up than an all-in-one solution like Shopify"],
    useCases: ["Ajouter une boutique à un site WordPress déjà existant", "Garder un contrôle total sur le code et les données de la boutique", "Éviter l'abonnement mensuel d'une plateforme e-commerce tout-en-un"],
    useCasesEn: ["Add a store to an already existing WordPress site", "Keep full control over the store's code and data", "Avoid the monthly subscription of an all-in-one e-commerce platform"],
    verdict: {
      keepIf: ["Tu as déjà un site WordPress et veux y ajouter une boutique", "Tu es à l'aise techniquement ou as accès à un développeur"],
      avoidIf: ["Tu veux une solution clé en main sans gestion technique — Shopify est plus simple", "Tu n'as pas le temps de gérer la maintenance et la sécurité toi-même"],
      threshold: "Pertinent si tu es déjà sur WordPress et à l'aise techniquement ; sinon Shopify simplifie tout.",
    },
    verdictEn: {
      keepIf: ["You already have a WordPress site and want to add a store", "You're technically comfortable or have access to a developer"],
      avoidIf: ["You want a turnkey solution with no technical management — Shopify is simpler", "You don't have time to handle maintenance and security yourself"],
      threshold: "Worth it if you're already on WordPress and technically comfortable; otherwise Shopify simplifies everything.",
    },
  },
  freshbooks: {
    shortDescription: "Logiciel de comptabilité et facturation pensé pour les freelances et petites entreprises.",
    shortDescriptionEn: "Accounting and invoicing software designed for freelancers and small businesses.",
    longDescription: "FreshBooks est un logiciel de comptabilité centré sur la facturation et le suivi du temps, pensé spécifiquement pour les freelances et petites entreprises de service plutôt que pour la comptabilité complexe d'une grande structure.\n\nSon interface est plus simple et orientée \"facturer un client\" que des outils comptables plus complets comme Xero ou Sage, ce qui en fait un bon choix pour qui veut juste facturer et suivre ses dépenses sans la complexité d'un vrai logiciel comptable.",
    longDescriptionEn: "FreshBooks is an accounting software focused on invoicing and time tracking, specifically designed for freelancers and small service businesses rather than the complex accounting of a large organization.\n\nIts interface is simpler and more \"bill a client\"-oriented than more complete accounting tools like Xero or Sage, making it a good choice for anyone who just wants to invoice and track expenses without the complexity of full accounting software.",
    pricing: "À partir de 15€/mois selon le nombre de clients facturables.",
    pricingEn: "From $15/month depending on the number of billable clients.",
    pros: ["Interface simple, pensée pour facturer rapidement un client", "Suivi du temps intégré, pratique pour facturer à l'heure", "Bon support client, souvent cité comme un point fort"],
    prosEn: ["Simple interface, built to quickly invoice a client", "Built-in time tracking, handy for hourly billing", "Good customer support, often cited as a strength"],
    cons: ["Tarification par nombre de clients qui peut limiter à mesure que l'activité grandit", "Moins complet qu'Xero ou QuickBooks pour une comptabilité avancée", "Moins répandu en France, support en français limité"],
    consEn: ["Pricing by number of clients can become limiting as the business grows", "Less complete than Xero or QuickBooks for advanced accounting", "Less common in France, limited French-language support"],
    useCases: ["Facturer des clients et suivre les paiements en tant que freelance", "Suivre le temps passé par projet pour facturer à l'heure", "Gérer ses dépenses professionnelles simplement sans comptable dédié"],
    useCasesEn: ["Invoice clients and track payments as a freelancer", "Track time spent per project to bill hourly", "Manage business expenses simply without a dedicated accountant"],
    verdict: {
      keepIf: ["Tu es freelance ou petite entreprise de service axée sur la facturation", "Tu factures au temps passé et veux un suivi intégré"],
      avoidIf: ["Tu as beaucoup de clients — la tarification par client devient coûteuse", "Tu es en France et veux un outil avec un vrai support local"],
      threshold: "Bon choix pour facturer simplement ; au-delà d'un certain nombre de clients, compare le coût avec Xero.",
    },
    verdictEn: {
      keepIf: ["You're a freelancer or small service business focused on invoicing", "You bill by time spent and want built-in tracking"],
      avoidIf: ["You have many clients — per-client pricing becomes costly", "You're in France and want a tool with real local support"],
      threshold: "Good choice to invoice simply; beyond a certain number of clients, compare the cost with Xero.",
    },
  },
  wave: {
    shortDescription: "Comptabilité et facturation gratuites pour freelances et très petites entreprises.",
    shortDescriptionEn: "Free accounting and invoicing for freelancers and very small businesses.",
    longDescription: "Wave propose la facturation et la comptabilité de base gratuitement, sans limite de clients ni de factures — un cas rare dans la catégorie. Le modèle économique repose sur des services payants optionnels (paiement par carte, paie) plutôt que sur l'accès au logiciel lui-même.\n\nPour un freelance qui démarre avec un budget serré, c'est l'option la moins chère pour sortir des tableurs et avoir une vraie facturation professionnelle — au prix de fonctionnalités plus limitées que des outils payants comme Xero ou FreshBooks à mesure que l'activité grandit.",
    longDescriptionEn: "Wave offers basic invoicing and accounting for free, with no limit on clients or invoices — a rare case in the category. The business model relies on optional paid services (card payments, payroll) rather than access to the software itself.\n\nFor a freelancer starting out on a tight budget, it's the cheapest way to move beyond spreadsheets and have real professional invoicing — at the cost of more limited features than paid tools like Xero or FreshBooks as the business grows.",
    pricing: "Gratuit pour la facturation et la comptabilité de base ; frais sur les paiements par carte encaissés (~2,9% + 0,30$).",
    pricingEn: "Free for basic invoicing and accounting; fees on card payments collected (~2.9% + $0.30).",
    defaultMonthlyPrice: 0,
    pros: ["Gratuit sans limite de clients ou de factures, rare dans la catégorie", "Suffisant pour la comptabilité de base d'un freelance ou très petite entreprise", "Pas d'engagement, facile à essayer sans risque"],
    prosEn: ["Free with no limit on clients or invoices, rare in the category", "Sufficient for a freelancer or very small business's basic accounting", "No commitment, easy to try with no risk"],
    cons: ["Fonctionnalités plus limitées que des outils payants à mesure que l'activité grandit", "Support client moins réactif que sur des plans payants", "Moins d'intégrations avec d'autres outils business"],
    consEn: ["More limited features than paid tools as the business grows", "Less responsive customer support than on paid plans", "Fewer integrations with other business tools"],
    useCases: ["Démarrer une activité freelance sans budget pour un logiciel de compta payant", "Facturer des clients et suivre ses dépenses simplement", "Tester la gestion comptable avant d'investir dans un outil plus complet"],
    useCasesEn: ["Start a freelance business with no budget for paid accounting software", "Invoice clients and track expenses simply", "Test bookkeeping before investing in a more complete tool"],
    verdict: {
      keepIf: ["Tu démarres une activité freelance avec un budget serré", "Tes besoins comptables restent simples (facturation, dépenses de base)"],
      avoidIf: ["Ton activité grandit et demande des fonctionnalités comptables avancées", "Tu as besoin d'un support client réactif et rapide"],
      threshold: "Parfait pour démarrer gratuitement ; migre vers un outil payant si tes besoins se complexifient.",
    },
    verdictEn: {
      keepIf: ["You're starting a freelance business with a tight budget", "Your accounting needs stay simple (invoicing, basic expenses)"],
      avoidIf: ["Your business is growing and needs advanced accounting features", "You need responsive, fast customer support"],
      threshold: "Perfect to start for free; migrate to a paid tool if your needs become more complex.",
    },
  },
  lemonsqueezy: {
    shortDescription: "Plateforme de paiement \"Merchant of Record\" pour vendre un SaaS ou un produit digital sans gérer la fiscalité.",
    shortDescriptionEn: "\"Merchant of Record\" payment platform to sell a SaaS or digital product without handling tax yourself.",
    longDescription: "Lemon Squeezy est une plateforme de paiement qui agit comme \"Merchant of Record\" : elle encaisse les paiements à ta place et gère elle-même la TVA et les taxes de vente dans chaque pays, ce qui évite à un développeur solo de devoir comprendre la fiscalité internationale pour vendre un SaaS ou un produit digital.\n\nC'est une alternative plus simple que d'intégrer Stripe directement (qui te laisse gérer la fiscalité toi-même), au prix d'une commission par transaction plus élevée.",
    longDescriptionEn: "Lemon Squeezy is a payment platform that acts as \"Merchant of Record\": it collects payments on your behalf and handles VAT and sales tax in each country itself, sparing a solo developer from having to understand international tax law to sell a SaaS or digital product.\n\nIt's a simpler alternative to integrating Stripe directly (which leaves you to handle tax yourself), at the cost of a higher per-transaction commission.",
    pricing: "Gratuit à l'inscription ; commission de 5% + 0,50$ par transaction.",
    pricingEn: "Free to sign up; 5% + $0.50 commission per transaction.",
    defaultMonthlyPrice: 0,
    pros: ["Gère la TVA et les taxes internationales à ta place (Merchant of Record)", "Mise en place rapide pour vendre un SaaS ou un produit digital", "Pensé spécifiquement pour les développeurs indépendants et petits SaaS"],
    prosEn: ["Handles VAT and international taxes on your behalf (Merchant of Record)", "Quick setup to sell a SaaS or digital product", "Specifically designed for independent developers and small SaaS"],
    cons: ["Commission par transaction plus élevée qu'une intégration Stripe directe", "Moins de contrôle sur l'expérience de paiement que Stripe", "Surtout pertinent pour du digital pur, pas pour du e-commerce physique"],
    consEn: ["Higher per-transaction commission than a direct Stripe integration", "Less control over the payment experience than Stripe", "Mainly relevant for pure digital products, not physical e-commerce"],
    useCases: ["Vendre un SaaS sans gérer la fiscalité internationale soi-même", "Lancer un produit digital (template, plugin, ebook technique) rapidement", "Éviter la complexité réglementaire d'une intégration Stripe directe pour un solo dev"],
    useCasesEn: ["Sell a SaaS without handling international tax yourself", "Quickly launch a digital product (template, plugin, technical ebook)", "Avoid the regulatory complexity of a direct Stripe integration as a solo dev"],
    verdict: {
      keepIf: ["Tu es développeur solo et veux éviter la complexité fiscale internationale", "Tu vends un SaaS ou produit digital à une audience mondiale"],
      avoidIf: ["Tu as déjà l'expertise ou les ressources pour gérer la fiscalité via Stripe directement", "Le volume de ventes justifie d'optimiser la commission de transaction"],
      threshold: "Idéal pour démarrer un SaaS solo sans expertise fiscale ; au-delà d'un certain volume, compare avec Stripe + Paddle.",
    },
    verdictEn: {
      keepIf: ["You're a solo developer wanting to avoid international tax complexity", "You sell a SaaS or digital product to a global audience"],
      avoidIf: ["You already have the expertise or resources to handle tax via Stripe directly", "Sales volume justifies optimizing the transaction commission"],
      threshold: "Ideal to start a solo SaaS with no tax expertise; beyond a certain volume, compare with Stripe + Paddle.",
    },
  },
  capcut: {
    longDescription: "CapCut est l'éditeur vidéo le plus utilisé pour les formats courts (TikTok, Reels, Shorts), avec une version mobile et desktop gratuites et un jeu de fonctionnalités IA parmi les plus complets du marché grand public : sous-titres automatiques, suppression de bruit, cadrage intelligent, génération de B-roll.\n\nPour un créateur de contenu, c'est souvent le premier outil utilisé avant de passer à des logiciels plus poussés (Premiere Pro, Final Cut) une fois les besoins de montage plus complexes.",
    longDescriptionEn: "CapCut is the most widely used editor for short formats (TikTok, Reels, Shorts), with free mobile and desktop versions and one of the most complete AI feature sets in the consumer market: automatic captions, noise removal, smart framing, B-roll generation.\n\nFor a content creator, it's often the first tool used before moving to more advanced software (Premiere Pro, Final Cut) once editing needs become more complex.",
    pricing: "Gratuit avec la plupart des fonctionnalités ; Pro à partir de ~8€/mois pour des effets et exports avancés.",
    pricingEn: "Free with most features; Pro from ~$8/month for advanced effects and exports.",
    pros: ["Gratuit avec des fonctionnalités IA déjà très complètes (sous-titres, nettoyage audio)", "Optimisé pour les formats verticaux courts (TikTok, Reels, Shorts)", "Accessible sur mobile et desktop, courbe d'apprentissage très faible"],
    prosEn: ["Free with already very complete AI features (captions, audio cleanup)", "Optimized for short vertical formats (TikTok, Reels, Shorts)", "Accessible on mobile and desktop, very low learning curve"],
    cons: ["Moins adapté au montage long format ou très technique", "Watermark ou limitations sur certains exports en version gratuite", "Appartient à ByteDance, ce qui soulève des questions de confidentialité pour certains usages pro"],
    consEn: ["Less suited to long-format or highly technical editing", "Watermark or export limitations on the free version", "Owned by ByteDance, which raises privacy questions for some professional uses"],
    useCases: ["Monter rapidement des vidéos courtes pour TikTok, Reels ou Shorts", "Ajouter des sous-titres automatiques sans logiciel de montage complexe", "Apprendre le montage vidéo avant de passer à un outil plus avancé"],
    useCasesEn: ["Quickly edit short videos for TikTok, Reels, or Shorts", "Add automatic captions without complex editing software", "Learn video editing before moving to a more advanced tool"],
    verdict: {
      keepIf: ["Tu produis principalement du contenu court pour les réseaux sociaux", "Tu veux des fonctionnalités IA (sous-titres, nettoyage) sans payer"],
      avoidIf: ["Tu fais du montage long format ou très technique — Premiere ou DaVinci sont plus adaptés", "La confidentialité des données est une préoccupation majeure pour ton usage"],
      threshold: "Parfait pour le contenu court et social ; pour du montage pro long format, regarde Premiere ou DaVinci Resolve.",
    },
    verdictEn: {
      keepIf: ["You mainly produce short content for social media", "You want AI features (captions, cleanup) for free"],
      avoidIf: ["You do long-format or highly technical editing — Premiere or DaVinci fit better", "Data privacy is a major concern for your use case"],
      threshold: "Perfect for short, social content; for long-format pro editing, look at Premiere or DaVinci Resolve.",
    },
  },
  submagic: {
    shortDescription: "Génère automatiquement des sous-titres animés et stylés pour vidéos courtes.",
    shortDescriptionEn: "Automatically generates animated, styled captions for short videos.",
    longDescription: "Submagic est un outil IA spécialisé dans la génération de sous-titres animés pour vidéos courtes (TikTok, Reels, Shorts) : transcription automatique, styles visuels prêts à l'emploi, emojis et effets de mise en avant des mots-clés, le tout en quelques minutes au lieu de sous-titrer manuellement.\n\nPour un créateur de contenu qui publie régulièrement, c'est un gain de temps significatif par rapport au sous-titrage manuel dans CapCut ou Premiere, au prix d'un outil de plus à ajouter à sa stack.",
    longDescriptionEn: "Submagic is an AI tool specialized in generating animated captions for short videos (TikTok, Reels, Shorts): automatic transcription, ready-made visual styles, emojis, and keyword highlight effects, all in minutes instead of manual captioning.\n\nFor a content creator who publishes regularly, it's a significant time saver compared to manual captioning in CapCut or Premiere, at the cost of one more tool to add to the stack.",
    pricing: "À partir de ~18€/mois selon le volume de minutes traitées.",
    pricingEn: "From ~$18/month depending on the volume of minutes processed.",
    defaultMonthlyPrice: 18,
    pros: ["Sous-titres animés générés en quelques minutes, qualité visuelle élevée", "Styles prêts à l'emploi qui imitent les tendances des créateurs populaires", "Gain de temps réel comparé au sous-titrage manuel"],
    prosEn: ["Animated captions generated in minutes, high visual quality", "Ready-made styles that mimic popular creator trends", "Real time savings compared to manual captioning"],
    cons: ["Un outil de plus à payer en complément d'un logiciel de montage", "Fonctionnalité que CapCut propose déjà gratuitement, même si moins poussée", "Pertinence qui dépend du volume de vidéos publiées régulièrement"],
    consEn: ["One more tool to pay for alongside an editing program", "A feature CapCut already offers for free, even if less advanced", "Relevance depends on the volume of videos published regularly"],
    useCases: ["Sous-titrer rapidement des vidéos courtes avec un style visuel soigné", "Gagner du temps sur la post-production quand on publie plusieurs vidéos par semaine", "Améliorer la rétention des vidéos courtes grâce à des sous-titres qui captent l'attention"],
    useCasesEn: ["Quickly caption short videos with a polished visual style", "Save post-production time when publishing several videos a week", "Improve short-video retention with attention-grabbing captions"],
    verdict: {
      keepIf: ["Tu publies du contenu court régulièrement et veux un style de sous-titres soigné", "Le temps gagné justifie le coût de l'abonnement"],
      avoidIf: ["Tu publies peu souvent — les sous-titres gratuits de CapCut suffisent", "Ton budget outils est déjà serré"],
      threshold: "Pertinent dès que tu publies plusieurs vidéos par semaine et veux un rendu plus soigné que les sous-titres gratuits.",
    },
    verdictEn: {
      keepIf: ["You publish short content regularly and want a polished caption style", "The time saved justifies the subscription cost"],
      avoidIf: ["You publish infrequently — CapCut's free captions are enough", "Your tools budget is already tight"],
      threshold: "Worth it once you publish several videos a week and want a more polished look than free captions.",
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
for (const [slug, angle] of Object.entries(ANGLES)) {
  if (CONTENT[slug]) continue;
  if (!present.has(slug)) { console.warn(`⚠️  ${slug} not found, skipping`); continue; }
  const tool = tools.find((x) => (x.slug || x.id) === slug);
  tool.seo = Object.assign({}, tool.seo, { aiAngle: angle });
  updated++;
  console.log(`✓ ${tool.name} (${slug}): aiAngle ${angle.stance}`);
}
writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log(`\n${updated} fiches mises à jour.`);
