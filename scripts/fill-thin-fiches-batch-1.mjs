/** fill-thin-fiches-batch-1.mjs — remplace le contenu placeholder auto-généré
 * (prix "Sur devis", pros/cons vides, catégorie parfois fausse) par du vrai
 * contenu pour les 8 fiches déjà dotées d'un angle IA : Gmail, Google Docs,
 * Google Sheets, Google Meet, Fiverr, Giphy, NetSuite, Okta.
 * Préserve seo.aiAngle déjà écrit. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));

const UPDATES = {
  gmail: {
    category: "communication",
    shortDescription: "La messagerie de Google : gratuite en perso, intégrée à Workspace pour les pros.",
    shortDescriptionEn: "Google's email service: free for personal use, integrated into Workspace for business.",
    longDescription: "Gmail est la messagerie la plus utilisée au monde, gratuite en version personnelle (15 Go de stockage partagé avec Drive et Photos) et intégrée à Google Workspace pour un usage professionnel (adresse @tondomaine.com, stockage étendu, outils collaboratifs).\n\nPour un freelance ou une petite structure, le vrai choix n'est pas Gmail vs autre chose — c'est gratuit/perso vs Workspace payant. Workspace ajoute surtout la crédibilité d'une adresse pro et plus de stockage ; les fonctionnalités de tri, recherche et filtres sont identiques aux deux niveaux.",
    longDescriptionEn: "Gmail is the world's most-used email service, free in its personal version (15GB shared with Drive and Photos) and integrated into Google Workspace for professional use (an @yourdomain.com address, extended storage, collaboration tools).\n\nFor a freelancer or small business, the real choice isn't Gmail vs. something else — it's free/personal vs. paid Workspace. Workspace mainly adds the credibility of a professional address and more storage; sorting, search, and filter features are identical at both levels.",
    pricing: { free: "Gratuit avec une adresse @gmail.com, 15 Go partagés avec Drive et Photos.", paid: "Via Google Workspace : Business Starter à partir de 6,90€/mois/utilisateur pour une adresse pro et 30 Go." },
    pricingEn: { free: "Free with a @gmail.com address, 15GB shared with Drive and Photos.", paid: "Via Google Workspace: Business Starter from $7/month/user for a professional address and 30GB." },
    defaultMonthlyPrice: 6.9,
    pros: ["Gratuit et déjà connu de tous tes contacts/clients", "Recherche et filtres très efficaces sur de gros volumes", "Intégration native avec tout l'écosystème Google (Calendar, Meet, Drive)"],
    prosEn: ["Free and already familiar to all your contacts/clients", "Very effective search and filters even on large volumes", "Native integration with the whole Google ecosystem (Calendar, Meet, Drive)"],
    cons: ["Une adresse @gmail.com manque de crédibilité pour une activité pro établie", "Le stockage gratuit (15 Go) se remplit vite avec Drive et Photos partagés", "Peu de fonctionnalités de gestion d'équipe sans passer à Workspace"],
    consEn: ["A @gmail.com address lacks credibility for an established business", "The free 15GB storage fills up fast when shared with Drive and Photos", "Few team management features without upgrading to Workspace"],
    useCases: ["Boîte mail personnelle ou de lancement d'activité sans frais", "Adresse professionnelle @tondomaine.com via Workspace", "Centraliser mail, agenda et stockage dans un seul écosystème"],
    useCasesEn: ["Personal or early-stage business inbox at no cost", "Professional @yourdomain.com address via Workspace", "Centralize email, calendar, and storage in one ecosystem"],
    verdict: {
      keepIf: ["Tu démarres et n'as pas encore besoin d'une adresse pro dédiée", "Tu utilises déjà l'écosystème Google (Calendar, Drive, Meet)"],
      avoidIf: ["Tu as besoin d'une vraie adresse professionnelle crédible (passe à Workspace)", "Tu gères une équipe et as besoin d'administration centralisée"],
      threshold: "Suffit pour démarrer ; passe à Workspace dès que l'image professionnelle ou le travail d'équipe compte.",
    },
    verdictEn: {
      keepIf: ["You're starting out and don't yet need a dedicated professional address", "You already use the Google ecosystem (Calendar, Drive, Meet)"],
      avoidIf: ["You need a credible, professional address (upgrade to Workspace)", "You manage a team and need centralized administration"],
      threshold: "Good enough to start; upgrade to Workspace once professional image or teamwork matters.",
    },
  },
  "google-docs": {
    category: "organization",
    shortDescription: "Le traitement de texte collaboratif de Google, gratuit et en temps réel.",
    shortDescriptionEn: "Google's collaborative word processor, free and real-time.",
    longDescription: "Google Docs est un traitement de texte en ligne, gratuit avec un compte Google, conçu autour de la collaboration en temps réel : plusieurs personnes peuvent éditer le même document simultanément, commenter et voir l'historique complet des versions.\n\nPour un freelance, c'est l'outil par défaut pour rédiger des propositions, des comptes-rendus ou des documents partagés avec des clients sans installer de logiciel. Il manque en revanche certaines fonctionnalités avancées de mise en page qu'on trouve dans Microsoft Word, et dépend d'une connexion internet pour la version complète.",
    longDescriptionEn: "Google Docs is an online word processor, free with a Google account, built around real-time collaboration: multiple people can edit the same document simultaneously, comment, and see the full version history.\n\nFor a freelancer, it's the default tool for writing proposals, meeting notes, or documents shared with clients without installing software. It lacks some of the advanced layout features found in Microsoft Word, and relies on an internet connection for the full experience.",
    pricing: { free: "Gratuit avec un compte Google, stockage partagé avec Drive (15 Go).", paid: "Via Google Workspace : à partir de 6,90€/mois/utilisateur pour plus de stockage et des fonctionnalités d'administration." },
    pricingEn: { free: "Free with a Google account, storage shared with Drive (15GB).", paid: "Via Google Workspace: from $7/month/user for more storage and admin features." },
    defaultMonthlyPrice: 0,
    pros: ["Collaboration en temps réel fluide, sans conflit de versions", "Gratuit et accessible depuis n'importe quel navigateur", "Historique complet des modifications, facile de revenir en arrière"],
    prosEn: ["Smooth real-time collaboration, no version conflicts", "Free and accessible from any browser", "Full edit history, easy to roll back changes"],
    cons: ["Mise en page moins poussée que Microsoft Word pour des documents complexes", "Fonctionne mieux en ligne ; le mode hors-ligne est limité", "Pas idéal pour des documents très longs ou très formatés (rapports, livres)"],
    consEn: ["Less advanced layout than Microsoft Word for complex documents", "Works best online; offline mode is limited", "Not ideal for very long or heavily formatted documents (reports, books)"],
    useCases: ["Rédiger des propositions ou devis partagés avec un client", "Prendre des notes de réunion collaboratives en direct", "Co-écrire un document avec plusieurs intervenants sans version multiples"],
    useCasesEn: ["Write proposals or quotes shared with a client", "Take collaborative meeting notes live", "Co-write a document with several contributors without multiple versions"],
    verdict: {
      keepIf: ["Tu collabores régulièrement avec des clients ou des partenaires sur des documents", "Le gratuit et l'accessibilité comptent plus que la mise en page avancée"],
      avoidIf: ["Tu as besoin de mise en page poussée (livre, rapport long, publication)", "Tu travailles surtout hors-ligne sans connexion fiable"],
      threshold: "Le bon choix par défaut pour la rédaction collaborative ; bascule vers Word si la mise en page devient critique.",
    },
    verdictEn: {
      keepIf: ["You regularly collaborate with clients or partners on documents", "Free and accessibility matter more than advanced layout"],
      avoidIf: ["You need advanced layout (book, long report, publication)", "You mostly work offline without reliable connectivity"],
      threshold: "The right default for collaborative writing; switch to Word if layout becomes critical.",
    },
  },
  "google-sheets": {
    shortDescription: "Le tableur collaboratif de Google, gratuit et accessible partout.",
    shortDescriptionEn: "Google's collaborative spreadsheet, free and accessible anywhere.",
    longDescription: "Google Sheets est un tableur en ligne gratuit, équivalent collaboratif d'Excel : formules, graphiques, tableaux croisés dynamiques, avec édition simultanée par plusieurs personnes et synchronisation automatique dans le cloud.\n\nPour un freelance ou une petite équipe, c'est souvent l'outil par défaut pour le suivi de budget, de facturation ou de planning partagé — sans avoir besoin d'un outil de gestion de projet dédié. Sa limite apparaît sur de très gros volumes de données ou des calculs complexes, où Excel reste plus performant.",
    longDescriptionEn: "Google Sheets is a free online spreadsheet, the collaborative equivalent of Excel: formulas, charts, pivot tables, with simultaneous multi-user editing and automatic cloud sync.\n\nFor a freelancer or small team, it's often the default tool for tracking budgets, invoicing, or shared planning — without needing a dedicated project management tool. Its limits show up on very large datasets or complex calculations, where Excel remains more capable.",
    pricing: { free: "Gratuit avec un compte Google, stockage partagé avec Drive (15 Go).", paid: "Via Google Workspace : à partir de 6,90€/mois/utilisateur." },
    pricingEn: { free: "Free with a Google account, storage shared with Drive (15GB).", paid: "Via Google Workspace: from $7/month/user." },
    defaultMonthlyPrice: 0,
    pros: ["Collaboration en temps réel, plusieurs personnes sur le même fichier", "Gratuit, accessible depuis n'importe quel navigateur ou mobile", "Large bibliothèque de modèles (budget, facturation, planning)"],
    prosEn: ["Real-time collaboration, multiple people on the same file", "Free, accessible from any browser or mobile device", "Large template library (budget, invoicing, planning)"],
    cons: ["Moins performant qu'Excel sur de très gros volumes de données", "Certaines fonctions avancées d'Excel n'ont pas d'équivalent exact", "Dépend d'une connexion internet pour l'édition fluide"],
    consEn: ["Less performant than Excel on very large datasets", "Some advanced Excel functions have no exact equivalent", "Relies on internet connectivity for smooth editing"],
    useCases: ["Suivre un budget ou une facturation freelance partagée avec un comptable", "Construire un planning d'équipe visible par tous en temps réel", "Analyser des données avec formules et tableaux croisés dynamiques"],
    useCasesEn: ["Track a budget or freelance invoicing shared with an accountant", "Build a team schedule visible to everyone in real time", "Analyze data with formulas and pivot tables"],
    verdict: {
      keepIf: ["Tu partages des fichiers de suivi avec des clients, un comptable ou une équipe", "Tes volumes de données restent raisonnables (pas des millions de lignes)"],
      avoidIf: ["Tu manipules des données très volumineuses ou des modèles financiers complexes", "Tu as besoin de macros VBA avancées propres à Excel"],
      threshold: "Solide par défaut pour le suivi partagé ; bascule vers Excel si le volume ou la complexité des calculs explose.",
    },
    verdictEn: {
      keepIf: ["You share tracking files with clients, an accountant, or a team", "Your data volumes stay reasonable (not millions of rows)"],
      avoidIf: ["You handle very large datasets or complex financial models", "You need Excel-specific advanced VBA macros"],
      threshold: "Solid default for shared tracking; switch to Excel if data volume or calculation complexity explodes.",
    },
  },
  "google-meet": {
    category: "communication",
    shortDescription: "La visioconférence de Google, intégrée à Calendar et Gmail.",
    shortDescriptionEn: "Google's video conferencing, integrated with Calendar and Gmail.",
    longDescription: "Google Meet est l'outil de visioconférence de Google, gratuit jusqu'à 60 minutes par appel en version personnelle, et intégré nativement à Google Calendar (lien de réunion généré automatiquement) et Gmail.\n\nPour un freelance qui utilise déjà l'écosystème Google, c'est le choix le plus simple : pas de compte tiers à créer pour les clients, juste un lien à cliquer. Zoom reste néanmoins la référence pour des fonctionnalités avancées (salles de sous-groupes, webinaires à grande échelle).",
    longDescriptionEn: "Google Meet is Google's video conferencing tool, free up to 60 minutes per call in the personal version, and natively integrated with Google Calendar (meeting link generated automatically) and Gmail.\n\nFor a freelancer already using the Google ecosystem, it's the simplest choice: no third-party account for clients to create, just a link to click. Zoom remains the reference for advanced features (breakout rooms, large-scale webinars).",
    pricing: { free: "Gratuit, réunions jusqu'à 60 min et 100 participants.", paid: "Via Google Workspace : à partir de 6,90€/mois/utilisateur pour des réunions plus longues et l'enregistrement." },
    pricingEn: { free: "Free, meetings up to 60 minutes and 100 participants.", paid: "Via Google Workspace: from $7/month/user for longer meetings and recording." },
    defaultMonthlyPrice: 6.9,
    pros: ["Lien de réunion généré automatiquement depuis Calendar, rien à installer", "Aucun compte requis côté client pour rejoindre un appel", "Intégration native avec tout l'écosystème Google"],
    prosEn: ["Meeting link generated automatically from Calendar, nothing to install", "No account required on the client side to join a call", "Native integration with the whole Google ecosystem"],
    cons: ["Version gratuite limitée à 60 minutes par appel", "Moins de fonctionnalités avancées que Zoom (sous-groupes, webinaires)", "Qualité vidéo qui peut se dégrader sur connexion instable"],
    consEn: ["Free version limited to 60 minutes per call", "Fewer advanced features than Zoom (breakout rooms, webinars)", "Video quality can degrade on an unstable connection"],
    useCases: ["Appels clients rapides directement depuis un événement Calendar", "Visioconférences d'équipe sans outil tiers à faire installer", "Entretiens ou points de suivi ponctuels avec des prospects"],
    useCasesEn: ["Quick client calls directly from a Calendar event", "Team video calls without a third-party tool to install", "Interviews or one-off check-ins with prospects"],
    verdict: {
      keepIf: ["Tu utilises déjà Calendar/Gmail et veux limiter les outils tiers", "Tes appels durent rarement plus de 60 minutes"],
      avoidIf: ["Tu organises des webinaires ou ateliers avec sous-groupes", "Tu as besoin d'enregistrement et de transcription avancée en gratuit"],
      threshold: "Suffit largement pour des appels clients ponctuels ; passe à Zoom ou Workspace pour des besoins plus poussés.",
    },
    verdictEn: {
      keepIf: ["You already use Calendar/Gmail and want to limit third-party tools", "Your calls rarely run longer than 60 minutes"],
      avoidIf: ["You run webinars or workshops with breakout groups", "You need advanced recording and transcription for free"],
      threshold: "More than enough for occasional client calls; switch to Zoom or Workspace for heavier needs.",
    },
  },
  fiverr: {
    shortDescription: "La marketplace freelance au format \"gigs\" : commande un service à prix fixe.",
    shortDescriptionEn: "The freelance marketplace built around fixed-price \"gigs\".",
    longDescription: "Fiverr est une marketplace où des freelances ('sellers') proposent des services à prix fixe ('gigs') — logo, montage vidéo, voix off, développement — plutôt qu'un devis sur mesure. L'acheteur compare directement les offres et les avis avant de commander.\n\nC'est l'inverse d'Upwork (facturation au temps/projet avec proposition personnalisée) : plus rapide pour une tâche bien définie, moins adapté pour une collaboration longue ou un besoin flou. Fiverr prélève 20% de commission sur chaque transaction côté vendeur.",
    longDescriptionEn: "Fiverr is a marketplace where freelancers ('sellers') offer fixed-price services ('gigs') — logo design, video editing, voiceover, development — rather than a custom quote. Buyers directly compare offers and reviews before ordering.\n\nIt's the opposite of Upwork (time/project billing with a custom proposal): faster for a well-defined task, less suited for a long collaboration or a vague need. Fiverr takes a 20% commission on every transaction on the seller side.",
    pricing: { free: "Gratuit pour parcourir et commander, le prix dépend du gig choisi (à partir de 5$).", paid: "Commission de 20% prélevée sur chaque vente côté freelance ; Fiverr Pro pour des prestataires vérifiés à tarifs plus élevés." },
    pricingEn: { free: "Free to browse and order, price depends on the chosen gig (from $5).", paid: "20% commission taken on every sale on the freelancer side; Fiverr Pro for vetted providers at higher rates." },
    defaultMonthlyPrice: 0,
    pros: ["Prix fixe et clair avant de commander, pas de devis à négocier", "Catalogue immense, presque tous les services créatifs ou techniques", "Avis et notes publics pour comparer rapidement les prestataires"],
    prosEn: ["Fixed, clear price before ordering, no quote to negotiate", "Huge catalog, almost every creative or technical service", "Public reviews and ratings to compare providers quickly"],
    cons: ["Commission de 20% qui pèse lourd pour les freelances vendeurs", "Qualité très variable, le tri prend du temps", "Moins adapté pour une collaboration longue ou un besoin évolutif"],
    consEn: ["20% commission that weighs heavily on freelance sellers", "Highly variable quality, sorting takes time", "Less suited for long collaborations or evolving needs"],
    useCases: ["Commander un logo ou une identité visuelle rapide à prix fixe", "Sous-traiter une tâche ponctuelle (montage, voix off, traduction)", "Vendre ses propres services en gigs à prix fixe en complément d'autres clients"],
    useCasesEn: ["Order a logo or quick visual identity at a fixed price", "Outsource a one-off task (editing, voiceover, translation)", "Sell your own services as fixed-price gigs alongside other clients"],
    verdict: {
      keepIf: ["Tu as une tâche bien définie et ponctuelle à sous-traiter", "Tu veux comparer des prix fixes plutôt que négocier un devis"],
      avoidIf: ["Tu cherches une collaboration longue avec un seul prestataire de confiance (Upwork ou réseau direct)", "Ton besoin est flou ou évolutif au fil du projet"],
      threshold: "Pertinent pour des tâches ponctuelles bien cadrées ; pour du long terme, un freelance direct ou Upwork sera souvent plus adapté.",
    },
    verdictEn: {
      keepIf: ["You have a well-defined, one-off task to outsource", "You want to compare fixed prices rather than negotiate a quote"],
      avoidIf: ["You're looking for a long-term collaboration with one trusted provider (Upwork or direct network)", "Your need is vague or evolves over the course of the project"],
      threshold: "Relevant for well-scoped one-off tasks; for the long term, a direct freelancer or Upwork will often be a better fit.",
    },
  },
  giphy: {
    shortDescription: "La bibliothèque de référence pour chercher et partager des GIFs.",
    shortDescriptionEn: "The reference library for finding and sharing GIFs.",
    longDescription: "Giphy (propriété de Meta) est le moteur de recherche de GIFs le plus utilisé, intégré directement dans la plupart des apps de messagerie (WhatsApp, Slack, iMessage, Twitter/X) et gratuit pour un usage de recherche et partage standard.\n\nPour un créateur de contenu, Giphy sert surtout à enrichir des posts ou réponses avec une référence culturelle reconnaissable. Pour créer un GIF ou sticker de marque original (et le faire apparaître dans les résultats de recherche d'autres utilisateurs), Giphy propose un outil de création et un programme de marque, gratuit mais avec validation éditoriale.",
    longDescriptionEn: "Giphy (owned by Meta) is the most-used GIF search engine, integrated directly into most messaging apps (WhatsApp, Slack, iMessage, Twitter/X) and free for standard search-and-share use.\n\nFor a content creator, Giphy is mainly useful for enriching posts or replies with a recognizable cultural reference. To create an original branded GIF or sticker (and have it appear in other users' search results), Giphy offers a creation tool and a brand program, free but with editorial review.",
    pricing: { free: "Gratuit pour rechercher, partager et uploader des GIFs.", paid: "Aucun plan payant grand public ; programme partenaire/marque sur demande pour les entreprises." },
    pricingEn: { free: "Free to search, share, and upload GIFs.", paid: "No public paid plan; partner/brand program available on request for businesses." },
    defaultMonthlyPrice: 0,
    pros: ["Entièrement gratuit pour la recherche et le partage", "Intégré nativement dans la plupart des apps de messagerie", "Bibliothèque énorme couvrant à peu près toutes les références culturelles"],
    prosEn: ["Completely free for search and sharing", "Natively integrated into most messaging apps", "Huge library covering nearly every cultural reference"],
    cons: ["Pas d'outil de création avancée — juste de la recherche et de l'upload simple", "Validation éditoriale requise pour qu'un GIF de marque apparaisse en recherche", "Aucune option pour un contenu vraiment original sans passer par un autre outil de création"],
    consEn: ["No advanced creation tool — just search and simple upload", "Editorial review required for a branded GIF to appear in search", "No option for truly original content without using another creation tool"],
    useCases: ["Ajouter une réaction ou référence culturelle à un post ou message", "Uploader et partager un extrait vidéo converti en GIF", "Soumettre un sticker ou GIF de marque au programme partenaire Giphy"],
    useCasesEn: ["Add a reaction or cultural reference to a post or message", "Upload and share a video clip converted to GIF", "Submit a branded sticker or GIF to Giphy's partner program"],
    verdict: {
      keepIf: ["Tu veux ajouter rapidement une réaction ou référence reconnue à du contenu", "Le gratuit et l'intégration dans tes apps de messagerie te suffisent"],
      avoidIf: ["Tu as besoin d'un visuel de marque 100% original et sur-mesure (préfère Midjourney ou un outil de création)"],
      threshold: "Parfait pour piocher une référence existante ; pour du contenu original, passe par un générateur IA.",
    },
    verdictEn: {
      keepIf: ["You want to quickly add a recognized reaction or reference to content", "Free and integration with your messaging apps is enough"],
      avoidIf: ["You need a fully original, custom branded visual (prefer Midjourney or a creation tool)"],
      threshold: "Great for picking an existing reference; for original content, use an AI generator instead.",
    },
  },
  netsuite: {
    shortDescription: "L'ERP cloud d'Oracle pour centraliser finance, stocks et opérations à l'échelle.",
    shortDescriptionEn: "Oracle's cloud ERP to centralize finance, inventory, and operations at scale.",
    longDescription: "NetSuite (racheté par Oracle en 2016) est un ERP cloud qui centralise comptabilité, gestion des stocks, achats et CRM dans un seul système — pensé pour des entreprises en croissance qui dépassent la capacité d'outils comptables simples (QuickBooks, Pennylane).\n\nLe prix n'est jamais public : il dépend du nombre de modules activés, d'utilisateurs et du volume de transactions, avec un coût de mise en place initial souvent conséquent. Ce n'est pas un outil pour un freelance ou une petite structure — la complexité de déploiement ne se justifie qu'à partir d'une organisation multi-équipes avec de vrais besoins de synchronisation finance/opérations.",
    longDescriptionEn: "NetSuite (acquired by Oracle in 2016) is a cloud ERP that centralizes accounting, inventory management, procurement, and CRM in a single system — built for growing companies that outgrow simple accounting tools (QuickBooks, Pennylane).\n\nPricing is never public: it depends on the number of modules enabled, users, and transaction volume, with a often-significant initial implementation cost. This isn't a tool for a freelancer or small business — the deployment complexity only pays off from a multi-team organization with real finance/operations sync needs.",
    pricing: { free: "Aucun plan gratuit, pas d'essai en libre accès.", paid: "Prix sur devis uniquement, fonction des modules, utilisateurs et volume — généralement plusieurs milliers d'euros/mois pour une PME." },
    pricingEn: { free: "No free plan, no self-serve trial.", paid: "Quote-only pricing, based on modules, users, and volume — typically several thousand euros/month for an SMB." },
    defaultMonthlyPrice: 0,
    pros: ["Centralise vraiment toute la donnée finance/opérations dans un seul système", "Scalable pour des organisations multi-entités ou multi-pays", "Écosystème de modules et d'intégrations très large"],
    prosEn: ["Genuinely centralizes all finance/operations data in one system", "Scales for multi-entity or multi-country organizations", "Very large ecosystem of modules and integrations"],
    cons: ["Prix totalement opaque, à négocier au cas par cas", "Mise en place longue et coûteuse, nécessite souvent un intégrateur", "Largement surdimensionné pour une activité freelance ou une petite équipe"],
    consEn: ["Completely opaque pricing, negotiated case by case", "Long and costly implementation, often requires an integrator", "Heavily overkill for freelance work or a small team"],
    useCases: ["Centraliser comptabilité, stocks et achats pour une entreprise multi-entités", "Remplacer plusieurs outils financiers disjoints par un système unique", "Gérer la conformité financière à l'échelle d'un groupe"],
    useCasesEn: ["Centralize accounting, inventory, and procurement for a multi-entity company", "Replace several disconnected financial tools with one system", "Manage financial compliance at group scale"],
    verdict: {
      keepIf: ["Tu gères déjà plusieurs entités ou filiales avec des besoins de consolidation", "Le coût du désalignement entre tes outils actuels dépasse largement le prix d'un ERP"],
      avoidIf: ["Tu es freelance, indépendant ou une petite équipe — c'est largement surdimensionné", "Tu n'as pas de budget ni d'équipe pour porter un projet de déploiement ERP"],
      threshold: "À envisager seulement à partir d'une PME structurée avec plusieurs équipes finance/ops à synchroniser.",
    },
    verdictEn: {
      keepIf: ["You already manage several entities or subsidiaries needing consolidation", "The cost of misalignment between your current tools far exceeds an ERP's price"],
      avoidIf: ["You're a freelancer, solo, or a small team — this is heavily overkill", "You don't have the budget or team to run an ERP deployment project"],
      threshold: "Worth considering only from a structured SMB with several finance/ops teams to sync.",
    },
  },
  okta: {
    shortDescription: "La référence en gestion d'identité et SSO pour entreprises.",
    shortDescriptionEn: "The reference identity and SSO management tool for businesses.",
    longDescription: "Okta est une plateforme de gestion d'identité (IAM) qui centralise l'authentification unique (SSO) et la sécurité des accès à tous les outils d'une entreprise — un employé se connecte une fois à Okta, puis accède à Slack, Salesforce, Google Workspace, etc. sans ressaisir de mot de passe.\n\nC'est un outil de sécurité et de conformité pensé pour des organisations avec plusieurs employés et un vrai risque lié à la gestion des accès (onboarding/offboarding, audits SOC2/ISO). Un freelance ou une équipe de 2-3 personnes n'en a généralement pas besoin — la complexité et le coût ne se justifient qu'à partir d'une dizaine d'employés ou d'exigences de conformité spécifiques.",
    longDescriptionEn: "Okta is an identity and access management (IAM) platform that centralizes single sign-on (SSO) and access security across all of a company's tools — an employee logs into Okta once, then accesses Slack, Salesforce, Google Workspace, etc. without re-entering a password.\n\nIt's a security and compliance tool built for organizations with multiple employees and a real access-management risk (onboarding/offboarding, SOC2/ISO audits). A freelancer or a 2-3 person team generally doesn't need it — the complexity and cost only pay off from around ten employees or specific compliance requirements.",
    pricing: { free: "Aucun plan gratuit.", paid: "Workforce Identity à partir d'environ 2$/utilisateur/mois (SSO basique), 6-15$/utilisateur/mois pour les plans avec authentification multi-facteur avancée et gestion du cycle de vie." },
    pricingEn: { free: "No free plan.", paid: "Workforce Identity from around $2/user/month (basic SSO), $6-15/user/month for plans with advanced MFA and lifecycle management." },
    defaultMonthlyPrice: 2,
    pros: ["SSO fiable sur un très large catalogue d'applications préintégrées", "Standard reconnu pour les audits de sécurité (SOC2, ISO 27001)", "Réduit fortement le risque lié aux mots de passe partagés ou oubliés"],
    prosEn: ["Reliable SSO across a very large catalog of pre-integrated apps", "Recognized standard for security audits (SOC2, ISO 27001)", "Significantly reduces risk from shared or forgotten passwords"],
    cons: ["Coût qui monte vite avec le nombre d'utilisateurs et de modules", "Paramétrage initial qui demande des compétences IT", "Largement disproportionné pour une équipe de moins de 10 personnes"],
    consEn: ["Cost rises quickly with the number of users and modules", "Initial setup requires IT skills", "Heavily disproportionate for a team of fewer than 10 people"],
    useCases: ["Centraliser l'authentification à tous les outils internes d'une entreprise", "Automatiser l'onboarding et l'offboarding des accès employés", "Répondre aux exigences d'un audit de sécurité (SOC2, ISO 27001)"],
    useCasesEn: ["Centralize authentication across all of a company's internal tools", "Automate employee access onboarding and offboarding", "Meet the requirements of a security audit (SOC2, ISO 27001)"],
    verdict: {
      keepIf: ["Ton équipe dépasse une dizaine de personnes avec des accès à gérer", "Tu dois passer un audit de sécurité qui exige une gestion d'identité centralisée"],
      avoidIf: ["Tu es freelance ou une très petite équipe sans exigence de conformité", "Tes outils actuels ont déjà chacun une authentification suffisante pour ton usage"],
      threshold: "Pertinent dès que la gestion manuelle des accès devient un vrai risque ou un vrai audit à passer.",
    },
    verdictEn: {
      keepIf: ["Your team exceeds about ten people with access to manage", "You need to pass a security audit that requires centralized identity management"],
      avoidIf: ["You're a freelancer or a very small team with no compliance requirement", "Your current tools already each have sufficient authentication for your usage"],
      threshold: "Worth it once manual access management becomes a real risk or a real audit to pass.",
    },
  },
};

let updated = 0;
for (const [slug, fields] of Object.entries(UPDATES)) {
  const tool = tools.find((x) => (x.slug || x.id) === slug);
  if (!tool) { console.warn(`⚠️  ${slug} not found`); continue; }
  for (const [key, value] of Object.entries(fields)) {
    if (key === "pricing_v5" || key === "verdict" || key === "verdictEn") {
      tool[key] = value;
    } else {
      tool[key] = value;
    }
  }
  // description (legacy field, mirrors longDescription) stays in sync
  if (fields.longDescription) tool.description = fields.longDescription;
  updated++;
  console.log(`✓ ${tool.name} (${slug}) filled`);
}
writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log(`\n${updated}/${Object.keys(UPDATES).length} fiches filled.`);
