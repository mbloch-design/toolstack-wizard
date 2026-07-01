/** add-content-batch-4.mjs — aiAngle pour 8 fiches à forte notoriété
 * (Shopify, Dropbox, Adobe Illustrator, Instagram, Discord, Jira,
 * Confluence, Wix) + remplissage complet pour celles encore avec du
 * contenu placeholder (Shopify, Wix, Jira, Confluence). */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  shopify: {
    stance: "augmente",
    augmentFr: "Shopify a intégré Shopify Magic (descriptions produits, emails marketing, réponses au support générées par IA) directement dans son back-office, mais la plateforme reste l'infrastructure e-commerce (paiement, stock, expédition) qui fait tourner la boutique.",
    augmentEn: "Shopify integrated Shopify Magic (AI-generated product descriptions, marketing emails, support replies) directly into its back office, but the platform remains the e-commerce infrastructure (payments, inventory, shipping) that runs the store.",
    replaceFr: "Remplacer Shopify par une IA ? Non : une boutique en ligne a besoin d'un système de paiement sécurisé, de gestion de stock et de logistique — des problèmes réglementés et opérationnels, pas des tâches de génération de texte. L'IA accélère la rédaction des fiches produit, elle ne remplace pas la plateforme. Verdict : l'IA augmente la productivité marchande, l'infrastructure reste le produit.",
    replaceEn: "Replace Shopify with an AI? No: an online store needs secure payments, inventory management, and logistics — regulated, operational problems, not text-generation tasks. AI speeds up writing product listings, it doesn't replace the platform. Verdict: AI augments merchant productivity, the infrastructure remains the product.",
    aiTools: [],
  },
  dropbox: {
    stance: "augmente",
    augmentFr: "Dropbox a ajouté Dropbox AI pour résumer des documents et répondre à des questions sur le contenu de tes fichiers directement depuis l'app, sans changer sa fonction première : synchroniser et stocker des fichiers en sécurité.",
    augmentEn: "Dropbox added Dropbox AI to summarize documents and answer questions about your file content directly from the app, without changing its primary function: syncing and storing files securely.",
    replaceFr: "Remplacer Dropbox par une IA ? Non : le stockage cloud fiable et la synchronisation multi-appareils restent un besoin d'infrastructure, pas un problème que l'IA résout. Elle aide à retrouver de l'information dans tes fichiers plus vite, elle ne remplace pas le stockage. Verdict : l'IA augmente la recherche dans tes fichiers, le stockage reste indispensable.",
    replaceEn: "Replace Dropbox with an AI? No: reliable cloud storage and multi-device sync remain an infrastructure need, not something AI solves. It helps you find information in your files faster, it doesn't replace storage. Verdict: AI augments search within your files, storage remains essential.",
    aiTools: [],
  },
  "adobe-illustrator": {
    stance: "challenge",
    augmentFr: "Illustrator a ajouté la génération de motifs et de palettes via Adobe Firefly, mais reste l'outil de précision pour le vectoriel professionnel (logos, identité visuelle) là où les générateurs IA produisent des images, pas des fichiers vectoriels exploitables.",
    augmentEn: "Illustrator added pattern and palette generation via Adobe Firefly, but remains the precision tool for professional vector work (logos, brand identity) where AI generators produce images, not usable vector files.",
    replaceFr: "Remplacer Illustrator par une IA ? Pour un premier jet d'idée visuelle, un générateur IA va plus vite. Mais un logo client doit être un vrai fichier vectoriel modifiable, redimensionnable à l'infini, accepté par un imprimeur — ce que Midjourney ou DALL-E ne produisent pas. Verdict : challengé sur l'idéation rapide, irremplaçable sur la livraison finale professionnelle.",
    replaceEn: "Replace Illustrator with an AI? For a first visual idea, an AI generator moves faster. But a client logo needs to be a real, infinitely scalable vector file accepted by printers — something Midjourney or DALL-E don't produce. Verdict: challenged on fast ideation, irreplaceable for professional final delivery.",
    aiTools: ["midjourney"],
  },
  instagram: {
    stance: "augmente",
    augmentFr: "Instagram a intégré des outils de retouche et de génération IA (fonds, effets, sous-titres automatiques sur Reels), mais la plateforme reste le réseau de distribution et l'audience, pas un outil de création de contenu en lui-même.",
    augmentEn: "Instagram integrated AI editing and generation tools (backgrounds, effects, automatic Reels captions), but the platform remains the distribution network and audience, not a content-creation tool in itself.",
    replaceFr: "Remplacer Instagram par une IA ? Non : la portée organique, l'algorithme et l'audience déjà construite restent sur la plateforme. L'IA aide à produire des visuels et légendes plus vite (Canva, ChatGPT), elle ne remplace pas la distribution. Verdict : l'IA augmente la production de contenu, Instagram reste le canal de diffusion.",
    replaceEn: "Replace Instagram with an AI? No: organic reach, the algorithm, and the audience already built remain on the platform. AI helps produce visuals and captions faster (Canva, ChatGPT), it doesn't replace distribution. Verdict: AI augments content production, Instagram remains the distribution channel.",
    aiTools: ["canva", "chatgpt"],
  },
  discord: {
    stance: "augmente",
    augmentFr: "Discord a ajouté des fonctions IA (résumé de fils de discussion non lus, modération automatique) côté plateforme, mais l'essentiel de l'IA dans une communauté Discord vient des bots tiers (Midjourney, ChatGPT) déjà intégrés depuis longtemps.",
    augmentEn: "Discord added AI features (unread thread summaries, automatic moderation) on the platform side, but most of the AI experience in a Discord community comes from third-party bots (Midjourney, ChatGPT) already integrated for years.",
    replaceFr: "Remplacer Discord par une IA ? Non : la messagerie vocale en temps réel et la structure communautaire par salons restent un besoin social que l'IA n'adresse pas. Elle augmente ce qui se passe dans les salons (modération, génération via bots), elle ne remplace pas l'espace de communauté. Verdict : l'IA augmente la communauté, elle ne la remplace pas.",
    replaceEn: "Replace Discord with an AI? No: real-time voice messaging and channel-based community structure remain a social need AI doesn't address. It augments what happens in the channels (moderation, generation via bots), it doesn't replace the community space. Verdict: AI augments the community, it doesn't replace it.",
    aiTools: ["midjourney", "chatgpt"],
  },
  jira: {
    stance: "augmente",
    augmentFr: "Jira a ajouté Atlassian Intelligence pour résumer des tickets, suggérer des découpages de tâches et générer des rapports de sprint, mais le suivi structuré des tickets et des workflows Agile reste le cœur du produit.",
    augmentEn: "Jira added Atlassian Intelligence to summarize tickets, suggest task breakdowns, and generate sprint reports, but structured ticket tracking and Agile workflows remain the product's core.",
    replaceFr: "Remplacer Jira par une IA ? Non : une équipe tech a besoin d'un système structuré pour suivre qui fait quoi, où en est chaque ticket et comment les sprints s'enchaînent — un problème de coordination d'équipe, pas de génération de contenu. L'IA aide à rédiger et résumer plus vite. Verdict : l'IA augmente la rédaction des tickets, le suivi de projet reste la fonction première.",
    replaceEn: "Replace Jira with an AI? No: a tech team needs a structured system to track who's doing what, where each ticket stands, and how sprints flow — a team-coordination problem, not a content-generation one. AI helps write and summarize faster. Verdict: AI augments ticket writing, project tracking remains the core function.",
    aiTools: [],
  },
  confluence: {
    stance: "challenge",
    augmentFr: "Confluence a son assistant IA pour résumer des pages et générer un premier brouillon de documentation, mais des outils IA-natifs comme Notion AI ou Mintlify proposent désormais une expérience de wiki/doc plus fluide, construite autour de l'IA dès le départ.",
    augmentEn: "Confluence has its AI assistant to summarize pages and draft documentation, but AI-native tools like Notion AI or Mintlify now offer a smoother wiki/docs experience built around AI from the ground up.",
    replaceFr: "Remplacer Confluence par une IA ? Pas entièrement : pour une grande organisation déjà sur l'écosystème Atlassian (Jira, Bitbucket), l'intégration native pèse plus que l'expérience IA. Mais pour une équipe qui démarre une base de connaissances de zéro, Notion AI ou des alternatives plus légères prennent l'avantage. Verdict : challengé hors de l'écosystème Atlassian, solide à l'intérieur.",
    replaceEn: "Replace Confluence with an AI? Not entirely: for a large organization already on the Atlassian ecosystem (Jira, Bitbucket), native integration matters more than the AI experience. But for a team starting a knowledge base from scratch, Notion AI or lighter alternatives take the lead. Verdict: challenged outside the Atlassian ecosystem, solid within it.",
    aiTools: ["notion-ai"],
  },
  wix: {
    stance: "challenge",
    augmentFr: "Wix a son propre générateur de site par IA (Wix ADI / Wix Studio AI) qui crée une maquette complète à partir d'une description, mais affronte désormais des concurrents IA-first comme Framer AI ou Lovable qui génèrent un site ou une app encore plus rapidement.",
    augmentEn: "Wix has its own AI site generator (Wix ADI / Wix Studio AI) that creates a full mockup from a description, but now faces AI-first competitors like Framer AI or Lovable that generate a site or app even faster.",
    replaceFr: "Remplacer Wix par une IA ? Wix a déjà intégré l'IA dans son propre générateur, donc la question est plutôt : un autre générateur IA fait-il mieux ? Pour un site vitrine simple, les nouveaux outils IA-first sont souvent plus rapides et plus modernes visuellement. Wix garde l'avantage sur l'écosystème complet (hébergement, e-commerce, support) une fois le site en place. Verdict : challengé sur la génération initiale, solide sur la gestion long terme.",
    replaceEn: "Replace Wix with an AI? Wix already built AI into its own generator, so the real question is whether another AI generator does better. For a simple showcase site, newer AI-first tools are often faster and visually more modern. Wix keeps the edge on the full ecosystem (hosting, e-commerce, support) once the site is live. Verdict: challenged on initial generation, solid on long-term management.",
    aiTools: ["framer", "lovable"],
  },
};

const CONTENT = {
  shopify: {
    shortDescription: "Plateforme e-commerce tout-en-un pour vendre en ligne, en boutique et sur les marketplaces.",
    shortDescriptionEn: "All-in-one e-commerce platform to sell online, in-store, and on marketplaces.",
    longDescription: "Shopify est la plateforme e-commerce la plus utilisée pour lancer et faire grandir une boutique en ligne : paiement intégré, gestion de stock, expédition, thèmes personnalisables et un écosystème d'applications immense pour tout ce qui manque nativement.\n\nPour un créateur indépendant ou une petite marque, Shopify permet de vendre dès le premier jour sans gérer l'infrastructure technique d'un site marchand — le compromis étant des frais de transaction et un abonnement mensuel qui montent vite si on multiplie les apps payantes de l'écosystème.",
    longDescriptionEn: "Shopify is the most widely used e-commerce platform to launch and grow an online store: integrated payments, inventory management, shipping, customizable themes, and a huge app ecosystem for anything missing natively.\n\nFor an independent creator or small brand, Shopify lets you sell from day one without managing a store's technical infrastructure — the trade-off being transaction fees and a monthly subscription that add up quickly once you stack paid apps from the ecosystem.",
    pricing: "À partir de 25€/mois (plan Basic), plus frais de transaction (~2% en plus si tu n'utilises pas Shopify Payments).",
    pricingEn: "From $25/month (Basic plan), plus transaction fees (~2% extra if you don't use Shopify Payments).",
    pros: ["Lancement de boutique rapide sans connaissances techniques", "Écosystème d'apps immense pour combler tout besoin spécifique", "Paiement, expédition et stock gérés nativement"],
    prosEn: ["Fast store launch with no technical knowledge needed", "Huge app ecosystem to fill any specific need", "Payments, shipping, and inventory handled natively"],
    cons: ["Coûts qui grimpent vite avec les apps payantes additionnelles", "Frais de transaction si tu n'utilises pas Shopify Payments", "Personnalisation avancée du thème demande des compétences en Liquid"],
    consEn: ["Costs rise quickly with additional paid apps", "Transaction fees if you don't use Shopify Payments", "Advanced theme customization requires Liquid coding skills"],
    useCases: ["Lancer une boutique en ligne de produits physiques ou digitaux", "Vendre sur plusieurs canaux (site, Instagram, marketplaces) depuis un seul back-office", "Migrer d'une marketplace (Etsy, Amazon) vers une boutique propre"],
    useCasesEn: ["Launch an online store for physical or digital products", "Sell across multiple channels (site, Instagram, marketplaces) from one back office", "Migrate from a marketplace (Etsy, Amazon) to your own store"],
    verdict: {
      keepIf: ["Tu veux vendre en ligne rapidement sans gérer l'infrastructure technique", "Tu as besoin d'un écosystème d'apps pour des besoins spécifiques (abonnements, dropshipping)"],
      avoidIf: ["Tu vends très peu de produits — une page de vente simple (Gumroad, Stripe) suffit", "Le budget app + abonnement dépasse ce que justifie ton volume de ventes"],
      threshold: "Pertinent dès que tu veux une vraie boutique évolutive ; pour un seul produit digital, des outils plus légers suffisent.",
    },
    verdictEn: {
      keepIf: ["You want to sell online quickly without managing technical infrastructure", "You need an app ecosystem for specific needs (subscriptions, dropshipping)"],
      avoidIf: ["You sell very few products — a simple sales page (Gumroad, Stripe) is enough", "App + subscription budget exceeds what your sales volume justifies"],
      threshold: "Worth it once you want a real, scalable store; for a single digital product, lighter tools are enough.",
    },
  },
  wix: {
    shortDescription: "Constructeur de site web par glisser-déposer, avec un générateur IA pour démarrer en quelques minutes.",
    shortDescriptionEn: "Drag-and-drop website builder, with an AI generator to get started in minutes.",
    longDescription: "Wix est un constructeur de site web visuel destiné aux indépendants et petites entreprises qui veulent un site professionnel sans toucher au code : éditeur glisser-déposer, templates par secteur, et un générateur IA (Wix ADI) qui propose une première version du site à partir de quelques questions.\n\nLe compromis classique d'un constructeur tout-en-un : très rapide à démarrer, mais migrer le site vers une autre plateforme plus tard est compliqué, et certaines pages générées par défaut ont besoin d'un vrai travail de personnalisation pour ne pas se ressembler.",
    longDescriptionEn: "Wix is a visual website builder for freelancers and small businesses who want a professional site without touching code: drag-and-drop editor, industry templates, and an AI generator (Wix ADI) that produces a first version of the site from a few questions.\n\nThe classic trade-off of an all-in-one builder: very fast to start, but migrating the site to another platform later is complicated, and some default-generated pages need real customization work to avoid looking generic.",
    pricing: "À partir de 20€/mois (plan Premium avec domaine personnalisé), gratuit avec sous-domaine Wix pour tester.",
    pricingEn: "From $20/month (Premium plan with custom domain), free with a Wix subdomain to test.",
    pros: ["Démarrage très rapide, y compris via le générateur IA", "Centaines de templates par secteur d'activité", "Hébergement, sécurité et support inclus sans configuration"],
    prosEn: ["Very fast to start, including via the AI generator", "Hundreds of templates by industry", "Hosting, security, and support included with no setup"],
    cons: ["Migration vers une autre plateforme quasiment impossible une fois le site construit", "Personnalisation poussée plus limitée qu'avec un CMS comme WordPress", "Performance parfois en retrait sur des sites très chargés en éléments visuels"],
    consEn: ["Migrating to another platform is nearly impossible once the site is built", "Deep customization more limited than with a CMS like WordPress", "Performance sometimes lags on sites heavy with visual elements"],
    useCases: ["Créer un site vitrine professionnel sans compétences techniques", "Lancer rapidement une page pour un événement ou un lancement de produit", "Tester une idée d'activité avant d'investir dans un site plus complexe"],
    useCasesEn: ["Create a professional showcase site with no technical skills", "Quickly launch a page for an event or product launch", "Test a business idea before investing in a more complex site"],
    verdict: {
      keepIf: ["Tu veux un site pro en ligne rapidement sans apprendre à coder", "Tu n'envisages pas de migrer vers une autre plateforme à moyen terme"],
      avoidIf: ["Tu veux un contrôle total sur le code ou prévois de migrer un jour", "Ton activité nécessite des fonctionnalités e-commerce avancées (Shopify est plus adapté)"],
      threshold: "Idéal pour un site vitrine simple et rapide ; pour du e-commerce sérieux, préfère un outil dédié.",
    },
    verdictEn: {
      keepIf: ["You want a professional site online quickly without learning to code", "You don't plan to migrate to another platform mid-term"],
      avoidIf: ["You want full control over the code or plan to migrate someday", "Your business needs advanced e-commerce features (Shopify fits better)"],
      threshold: "Great for a simple, fast showcase site; for serious e-commerce, prefer a dedicated tool.",
    },
  },
  jira: {
    pros: ["Référence absolue pour le suivi Agile en équipe tech (Scrum, Kanban)", "Personnalisation poussée des workflows et des champs", "Intégration native avec tout l'écosystème Atlassian (Confluence, Bitbucket)"],
    prosEn: ["The absolute reference for Agile team tracking (Scrum, Kanban)", "Deep customization of workflows and fields", "Native integration with the whole Atlassian ecosystem (Confluence, Bitbucket)"],
    cons: ["Courbe d'apprentissage réelle, configuration parfois complexe pour une petite équipe", "Interface perçue comme lourde comparée à des outils plus modernes (Linear, ClickUp)", "Peut devenir cher à mesure que l'équipe et les besoins en apps grandissent"],
    consEn: ["Real learning curve, setup can be complex for a small team", "Interface seen as heavy compared to more modern tools (Linear, ClickUp)", "Can get expensive as the team and app needs grow"],
    useCases: ["Suivre des sprints Agile avec une équipe de développement", "Centraliser bugs, tickets support et demandes de fonctionnalités", "Générer des rapports de vélocité et de burndown pour le management"],
    useCasesEn: ["Track Agile sprints with a development team", "Centralize bugs, support tickets, and feature requests", "Generate velocity and burndown reports for management"],
  },
  confluence: {
    pros: ["Intégration native parfaite avec Jira pour lier doc et tickets", "Structuration en espaces et pages adaptée à une grande organisation", "Modèles de page prêts à l'emploi (specs produit, comptes-rendus, retours d'expérience)"],
    prosEn: ["Perfect native integration with Jira to link docs and tickets", "Space-and-page structure suited to a large organization", "Ready-made page templates (product specs, meeting notes, retrospectives)"],
    cons: ["Expérience d'édition moins fluide que des outils plus modernes comme Notion", "Recherche interne parfois peu pertinente sur de grosses bases de docs", "Surtout justifié si tu es déjà dans l'écosystème Atlassian"],
    consEn: ["Editing experience less smooth than more modern tools like Notion", "Internal search sometimes weak on large doc bases", "Mainly justified if you're already in the Atlassian ecosystem"],
    useCases: ["Documenter les specs produit liées aux tickets Jira", "Centraliser la knowledge base technique d'une équipe", "Rédiger des comptes-rendus de réunion partagés avec versioning"],
    useCasesEn: ["Document product specs linked to Jira tickets", "Centralize a team's technical knowledge base", "Write shared meeting notes with versioning"],
    verdict: {
      keepIf: ["Ton équipe est déjà sur Jira et veut une doc liée nativement", "Tu as besoin d'une structure de documentation à l'échelle d'une grande organisation"],
      avoidIf: ["Tu démarres une base de connaissances de zéro sans utiliser Jira — Notion est plus simple", "Tu cherches une expérience d'écriture plus moderne et fluide"],
      threshold: "Pertinent surtout dans l'écosystème Atlassian ; hors de ce contexte, d'autres outils sont plus agréables à utiliser.",
    },
    verdictEn: {
      keepIf: ["Your team is already on Jira and wants docs natively linked", "You need a documentation structure at large-organization scale"],
      avoidIf: ["You're starting a knowledge base from scratch without using Jira — Notion is simpler", "You want a more modern, smoother writing experience"],
      threshold: "Mainly relevant within the Atlassian ecosystem; outside it, other tools are more pleasant to use.",
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
