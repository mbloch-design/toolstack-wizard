/** fill-stub-batch-1.mjs — P3, batch 1 of the 32-tool stub-description
 * cleanup (lucidchart, smartsheet, mixpanel, are-na, meltwater, cision,
 * prowly, linkedin-recruiter). Each entry sourced from a real WebSearch
 * this session, not training-data recall. EUR figures computed from a
 * verified USD price at the established 0.876 USD->EUR rate. Enterprise/
 * custom-quote tools (meltwater, cision) get a "starting from" estimate
 * built from the lowest reported real contract figure, flagged as an
 * estimate rather than an official list price.
 */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const R = 0.876;
const eur = (usd) => Math.round(usd * R * 100) / 100;

const CONTENT = {
  lucidchart: {
    shortDescription: "Diagrammes en ligne (organigrammes, wireframes, UML) avec génération IA depuis du texte.",
    shortDescriptionEn: "Online diagramming (flowcharts, wireframes, UML) with AI generation from text.",
    description: "Lucidchart couvre les diagrammes de flux, organigrammes, wireframes, schémas réseau et UML, avec génération par IA à partir d'une description texte et collaboration en temps réel. Plus de 50 intégrations couvrent Jira, Confluence, Google Drive et Microsoft Teams.\n\nLa version gratuite limite à 3 documents éditables et un nombre réduit de formes, ce qui suffit pour un usage très occasionnel mais devient vite contraignant pour un usage régulier. Le plan Team impose un minimum de 3 utilisateurs, donc un freelance solo paie le tarif Individual ou reste sur le gratuit.",
    longDescription: "Lucidchart couvre les diagrammes de flux, organigrammes, wireframes, schémas réseau et UML, avec génération par IA à partir d'une description texte et collaboration en temps réel. Plus de 50 intégrations couvrent Jira, Confluence, Google Drive et Microsoft Teams.\n\nLa version gratuite limite à 3 documents éditables et un nombre réduit de formes, ce qui suffit pour un usage très occasionnel mais devient vite contraignant pour un usage régulier. Le plan Team impose un minimum de 3 utilisateurs, donc un freelance solo paie le tarif Individual ou reste sur le gratuit.",
    descriptionEn: "Lucidchart covers flowcharts, org charts, wireframes, network diagrams and UML, with AI generation from a text description and real-time collaboration. 50+ integrations cover Jira, Confluence, Google Drive and Microsoft Teams.\n\nThe free plan caps you at 3 editable documents and a reduced shape set, fine for very occasional use but quickly limiting for regular use. The Team plan requires a 3-user minimum, so a solo freelancer pays the Individual tier or stays free.",
    longDescriptionEn: "Lucidchart covers flowcharts, org charts, wireframes, network diagrams and UML, with AI generation from a text description and real-time collaboration. 50+ integrations cover Jira, Confluence, Google Drive and Microsoft Teams.\n\nThe free plan caps you at 3 editable documents and a reduced shape set, fine for very occasional use but quickly limiting for regular use. The Team plan requires a 3-user minimum, so a solo freelancer pays the Individual tier or stays free.",
    pricing: { free: "3 documents éditables, formes limitées", paid: `Individual ${eur(9)}€/mois ; Team ${eur(10)}€/mois/utilisateur (min. 3) ; Enterprise dès ${eur(199/12)}€/mois/utilisateur (annuel)` },
    pricingEn: { free: "3 editable documents, limited shapes", paid: `Individual €${eur(9)}/mo; Team €${eur(10)}/mo/user (3 min); Enterprise from €${eur(199/12)}/mo/user (annual)` },
    defaultMonthlyPrice: eur(9),
    pros: ["Génération de diagrammes par IA depuis une simple description texte", "Plus de 50 intégrations (Jira, Confluence, Google Drive, Teams)", "Collaboration en temps réel avec commentaires"],
    prosEn: ["AI diagram generation from a simple text description", "50+ integrations (Jira, Confluence, Google Drive, Teams)", "Real-time collaboration with comments"],
    cons: ["Version gratuite limitée à 3 documents éditables", "Plan Team impose un minimum de 3 utilisateurs", "Enterprise nécessaire pour SSO/SCIM, donc cher pour une petite structure qui a besoin de sécurité avancée"],
    consEn: ["Free plan capped at 3 editable documents", "Team plan requires a 3-user minimum", "Enterprise needed for SSO/SCIM, expensive for a small team that needs advanced security"],
    useCases: ["Schématiser un process ou un organigramme à partir d'une description texte", "Documenter une architecture technique avec des diagrammes UML ou réseau", "Collaborer en temps réel sur un wireframe avant de passer en design"],
    useCasesEn: ["Diagram a process or org chart from a text description", "Document a technical architecture with UML or network diagrams", "Collaborate in real time on a wireframe before moving to design"],
    verdict: {
      keepIf: ["Tu fais des diagrammes assez souvent pour dépasser les 3 documents gratuits", "Tu as besoin de la génération IA ou des intégrations Jira/Confluence"],
      avoidIf: ["Tu fais un diagramme ponctuel : la version gratuite ou un outil comme Excalidraw suffit", "Tu es seul et n'as pas besoin du plan Team (minimum 3 utilisateurs)"],
      threshold: "Lucidchart vaut le coût si tu dépasses régulièrement les 3 documents gratuits ou si tu as besoin des intégrations Jira/Confluence. Pour un usage ponctuel, la version gratuite suffit.",
    },
    verdictEn: {
      keepIf: ["You diagram often enough to outgrow the 3 free documents", "You need AI generation or Jira/Confluence integrations"],
      avoidIf: ["You diagram occasionally: the free plan or a tool like Excalidraw is enough", "You're solo and don't need the Team plan (3-user minimum)"],
      threshold: "Lucidchart is worth it if you regularly outgrow the 3 free documents or need Jira/Confluence integrations. For occasional use, the free plan is enough.",
    },
    pricing_v5: {
      cautions: [], verified_on: "2026-06-25", source_domain: "lucidchart.com",
      usage_sensitive: false, compare_plan_kind: "seat", compare_plan_name: "Individual",
      price_reliability: "high", location_sensitive: false,
      official_source_url: "https://www.lucidchart.com/pages/pricing",
      verification_status: "official_explicit", compare_price_monthly_eur: eur(9),
    },
  },

  smartsheet: {
    shortDescription: "Tableur collaboratif orienté gestion de projet, avec automatisations et vues Gantt/Kanban.",
    shortDescriptionEn: "Collaborative spreadsheet built for project management, with automation and Gantt/Kanban views.",
    description: "Smartsheet ressemble à un tableur mais fonctionne comme un outil de gestion de projet : vues Gantt, calendrier, Kanban, formulaires et 250 automatisations mensuelles dès le plan Pro. Le plan Business retire la limite d'utilisateurs et ajoute le stockage illimité et les portails no-code (WorkApps).\n\nLe vrai saut de prix se situe entre Pro et Business : Business coûte plus de 3,5 fois le prix de Pro. Pour une petite équipe qui n'a pas besoin de portails clients ni d'import de données externes automatisé, Pro suffit largement.",
    longDescription: "Smartsheet ressemble à un tableur mais fonctionne comme un outil de gestion de projet : vues Gantt, calendrier, Kanban, formulaires et 250 automatisations mensuelles dès le plan Pro. Le plan Business retire la limite d'utilisateurs et ajoute le stockage illimité et les portails no-code (WorkApps).\n\nLe vrai saut de prix se situe entre Pro et Business : Business coûte plus de 3,5 fois le prix de Pro. Pour une petite équipe qui n'a pas besoin de portails clients ni d'import de données externes automatisé, Pro suffit largement.",
    descriptionEn: "Smartsheet looks like a spreadsheet but works like a project management tool: Gantt, calendar and Kanban views, forms, and 250 monthly automations from the Pro plan up. Business removes the user cap and adds unlimited storage and no-code portals (WorkApps).\n\nThe real price jump sits between Pro and Business: Business costs over 3.5x Pro. For a small team that doesn't need client portals or automated external data import, Pro is plenty.",
    longDescriptionEn: "Smartsheet looks like a spreadsheet but works like a project management tool: Gantt, calendar and Kanban views, forms, and 250 monthly automations from the Pro plan up. Business removes the user cap and adds unlimited storage and no-code portals (WorkApps).\n\nThe real price jump sits between Pro and Business: Business costs over 3.5x Pro. For a small team that doesn't need client portals or automated external data import, Pro is plenty.",
    pricing: { free: "1 utilisateur, 2 feuilles, fonctions de base", paid: `Pro ${eur(9)}€/mois/utilisateur ; Business ${eur(32)}€/mois/utilisateur` },
    pricingEn: { free: "1 user, 2 sheets, basic features", paid: `Pro €${eur(9)}/mo/user; Business €${eur(32)}/mo/user` },
    defaultMonthlyPrice: eur(9),
    pros: ["250 automatisations mensuelles incluses dès le plan Pro", "Vues multiples (Gantt, Kanban, calendrier) sur les mêmes données", "Formulaires et rapports inclus sans module payant séparé"],
    prosEn: ["250 monthly automations included from the Pro plan", "Multiple views (Gantt, Kanban, calendar) on the same data", "Forms and reports included, no separate paid module"],
    cons: ["Plan gratuit très limité (1 utilisateur, 2 feuilles)", "Saut de prix de plus de 3,5x entre Pro et Business", "Interface tableur peut sembler datée comparée à des outils plus visuels"],
    consEn: ["Free plan very limited (1 user, 2 sheets)", "Price jump of over 3.5x between Pro and Business", "Spreadsheet UI can feel dated next to more visual tools"],
    useCases: ["Centraliser le suivi de plusieurs projets avec vues Gantt et calendrier", "Automatiser des rappels et des changements de statut sans coder", "Construire des formulaires de demande reliés directement au plan de projet"],
    useCasesEn: ["Centralize tracking of several projects with Gantt and calendar views", "Automate reminders and status changes with no coding", "Build request forms wired directly to the project plan"],
    verdict: {
      keepIf: ["Tu es à l'aise avec une logique de tableur plutôt qu'un outil visuel type Kanban", "Tu as besoin de vues Gantt et d'automatisations sans payer un module séparé"],
      avoidIf: ["Tu préfères une interface visuelle (cartes, board) à un tableur", "Tu n'as besoin ni de portails clients ni d'import de données externes (Business serait du gaspillage)"],
      threshold: "Smartsheet Pro vaut le coût si tu es à l'aise avec une logique de tableur et as besoin de vues Gantt avec automatisations. Passe à Business seulement si tu as vraiment besoin de portails clients ou d'import de données externes.",
    },
    verdictEn: {
      keepIf: ["You're comfortable with spreadsheet logic rather than a visual Kanban tool", "You need Gantt views and automation without paying for a separate module"],
      avoidIf: ["You prefer a visual interface (cards, board) over a spreadsheet", "You don't need client portals or external data import (Business would be overkill)"],
      threshold: "Smartsheet Pro is worth it if you're comfortable with spreadsheet logic and need Gantt views with automation. Only move to Business if you genuinely need client portals or external data import.",
    },
    pricing_v5: {
      cautions: [], verified_on: "2026-06-25", source_domain: "smartsheet.com",
      usage_sensitive: false, compare_plan_kind: "seat", compare_plan_name: "Pro",
      price_reliability: "high", location_sensitive: false,
      official_source_url: "https://www.smartsheet.com/pricing",
      verification_status: "official_explicit", compare_price_monthly_eur: eur(9),
    },
  },

  mixpanel: {
    shortDescription: "Analytics produit basé sur les utilisateurs trackés par mois (MTU), avec funnels et rétention.",
    shortDescriptionEn: "Product analytics priced by monthly tracked users (MTU), with funnels and retention.",
    description: "Mixpanel facture selon le nombre d'utilisateurs trackés par mois (MTU), pas par siège. Le plan gratuit couvre jusqu'à 50 000 MTU avec funnels, segmentation et 3 projets, largement suffisant pour un produit en phase de lancement.\n\nLe plan Growth démarre à 20$/mois pour 10 000 MTU et le prix grimpe avec le volume (50$ pour 50k, 150$ pour 250k). Pour un produit B2B, l'analyse au niveau compte (Group Analytics) est un module payant séparé à ne pas oublier dans le calcul.",
    longDescription: "Mixpanel facture selon le nombre d'utilisateurs trackés par mois (MTU), pas par siège. Le plan gratuit couvre jusqu'à 50 000 MTU avec funnels, segmentation et 3 projets, largement suffisant pour un produit en phase de lancement.\n\nLe plan Growth démarre à 20$/mois pour 10 000 MTU et le prix grimpe avec le volume (50$ pour 50k, 150$ pour 250k). Pour un produit B2B, l'analyse au niveau compte (Group Analytics) est un module payant séparé à ne pas oublier dans le calcul.",
    descriptionEn: "Mixpanel bills by monthly tracked users (MTU), not by seat. The free plan covers up to 50,000 MTU with funnels, segmentation and 3 projects — plenty for an early-stage product.\n\nThe Growth plan starts at $20/month for 10,000 MTU and scales with volume ($50 for 50k, $150 for 250k). For a B2B product, account-level analysis (Group Analytics) is a separate paid add-on, easy to forget when budgeting.",
    longDescriptionEn: "Mixpanel bills by monthly tracked users (MTU), not by seat. The free plan covers up to 50,000 MTU with funnels, segmentation and 3 projects — plenty for an early-stage product.\n\nThe Growth plan starts at $20/month for 10,000 MTU and scales with volume ($50 for 50k, $150 for 250k). For a B2B product, account-level analysis (Group Analytics) is a separate paid add-on, easy to forget when budgeting.",
    pricing: { free: "Jusqu'à 50 000 MTU, funnels et segmentation, 3 projets", paid: `Growth dès ${eur(20)}€/mois (10 000 MTU), évolutif selon le volume` },
    pricingEn: { free: "Up to 50,000 MTU, funnels and segmentation, 3 projects", paid: `Growth from €${eur(20)}/mo (10,000 MTU), scales with volume` },
    defaultMonthlyPrice: eur(20),
    pros: ["Plan gratuit généreux (50 000 MTU) pour un produit en lancement", "Funnels, rétention et segmentation inclus sans module séparé", "Outils IA (Spark, résumés sur replays) ajoutés en 2025-2026"],
    prosEn: ["Generous free plan (50,000 MTU) for an early-stage product", "Funnels, retention and segmentation included, no separate module", "AI tools (Spark, replay summaries) added in 2025-2026"],
    cons: ["Le prix grimpe vite avec le volume d'utilisateurs trackés", "Group Analytics (analyse par compte B2B) est un module payant séparé", "Plan Enterprise nécessaire pour SSO/SAML, à partir de 25 000$/an"],
    consEn: ["Price climbs quickly with tracked-user volume", "Group Analytics (B2B account-level analysis) is a separate paid add-on", "Enterprise plan needed for SSO/SAML, starting around $25,000/year"],
    useCases: ["Suivre les funnels de conversion et la rétention d'un produit SaaS", "Identifier les comportements qui prédisent la rétention long terme", "Construire un dashboard d'analyse produit sans écrire de SQL"],
    useCasesEn: ["Track conversion funnels and retention for a SaaS product", "Identify behaviors that predict long-term retention", "Build a product analytics dashboard without writing SQL"],
    verdict: {
      keepIf: ["Ton produit a moins de 50 000 utilisateurs actifs par mois (le plan gratuit suffit)", "Tu as besoin de funnels et de rétention précis sans étiqueter manuellement des événements dans un tableur"],
      avoidIf: ["Tu fais du B2B et as besoin de Group Analytics : prévois le coût du module en plus", "Ton volume d'utilisateurs dépasse largement 250k MTU : compare avec un outil facturé à l'événement plutôt qu'au MTU"],
      threshold: "Mixpanel vaut le coût pour la plupart des produits sous 250k MTU. Au-delà, ou pour du B2B avec Group Analytics, fais le calcul précis avant de t'engager : le prix scale vite.",
    },
    verdictEn: {
      keepIf: ["Your product has under 50,000 monthly active users (free plan covers it)", "You need precise funnels and retention without manually tagging events in a spreadsheet"],
      avoidIf: ["You're B2B and need Group Analytics: budget for the add-on separately", "Your user volume is well above 250k MTU: compare against an event-based pricing tool instead"],
      threshold: "Mixpanel is worth it for most products under 250k MTU. Beyond that, or for B2B with Group Analytics, run the real numbers before committing — pricing scales fast.",
    },
    pricing_v5: {
      cautions: ["usage_sensitive"], verified_on: "2026-06-25", source_domain: "mixpanel.com",
      usage_sensitive: true, compare_plan_kind: "usage", compare_plan_name: "Growth",
      price_reliability: "high", location_sensitive: false,
      official_source_url: "https://mixpanel.com/pricing/",
      verification_status: "official_explicit", compare_price_monthly_eur: eur(20),
    },
  },

  "are-na": {
    shortDescription: "Plateforme de curation visuelle pour designers et chercheurs, plus éditoriale que Pinterest.",
    shortDescriptionEn: "Visual curation platform for designers and researchers, more editorial than Pinterest.",
    description: "Are.na organise des références visuelles et textuelles en \"blocks\" rassemblés dans des \"channels\" connectables entre eux, sans algorithme de recommandation ni publicité. C'est l'outil de prédilection des designers, architectes et chercheurs pour construire une bibliothèque de références personnelle plutôt qu'un fil social.\n\nAre.na ne publie pas sa grille tarifaire complète en ligne (seule l'existence d'une réduction étudiante de 50% sur 2 ans est documentée) : vérifie le prix exact du plan Premium sur are.na/about avant de t'engager.",
    longDescription: "Are.na organise des références visuelles et textuelles en \"blocks\" rassemblés dans des \"channels\" connectables entre eux, sans algorithme de recommandation ni publicité. C'est l'outil de prédilection des designers, architectes et chercheurs pour construire une bibliothèque de références personnelle plutôt qu'un fil social.\n\nAre.na ne publie pas sa grille tarifaire complète en ligne (seule l'existence d'une réduction étudiante de 50% sur 2 ans est documentée) : vérifie le prix exact du plan Premium sur are.na/about avant de t'engager.",
    descriptionEn: "Are.na organizes visual and text references into \"blocks\" gathered in connectable \"channels\", with no recommendation algorithm and no ads. It's the go-to tool for designers, architects and researchers building a personal reference library rather than a social feed.\n\nAre.na doesn't publish its full pricing grid online (only a 50%-off-for-2-years student discount is documented) — check the exact Premium price on are.na/about before committing.",
    longDescriptionEn: "Are.na organizes visual and text references into \"blocks\" gathered in connectable \"channels\", with no recommendation algorithm and no ads. It's the go-to tool for designers, architects and researchers building a personal reference library rather than a social feed.\n\nAre.na doesn't publish its full pricing grid online (only a 50%-off-for-2-years student discount is documented) — check the exact Premium price on are.na/about before committing.",
    pricing: { free: "Channels et blocks illimités avec fonctionnalités de base", paid: "Premium (prix non communiqué publiquement, -50% pour les étudiants pendant 2 ans)" },
    pricingEn: { free: "Unlimited channels and blocks with core features", paid: "Premium (price not publicly listed, 50% off for students for 2 years)" },
    defaultMonthlyPrice: 0,
    pros: ["Pas d'algorithme de recommandation ni de publicité", "Connexions entre channels qui font émerger des liens inattendus entre références", "Communauté design/architecture/recherche de qualité"],
    prosEn: ["No recommendation algorithm and no ads", "Connections between channels surface unexpected links between references", "Strong design/architecture/research community"],
    cons: ["Grille tarifaire complète non publiée en ligne", "Moins adapté à un usage professionnel de gestion de projet (ce n'est pas son rôle)", "Courbe d'apprentissage pour la logique blocks/channels si tu viens de Pinterest"],
    consEn: ["Full pricing grid not published online", "Less suited to professional project management use (that's not its job)", "Learning curve for the blocks/channels logic if you're coming from Pinterest"],
    useCases: ["Construire une bibliothèque de références visuelles pour un projet créatif", "Organiser une veille de recherche avec des connexions entre sujets", "Partager un moodboard collaboratif sans algorithme qui pousse du contenu non pertinent"],
    useCasesEn: ["Build a visual reference library for a creative project", "Organize research with connections between topics", "Share a collaborative moodboard with no algorithm pushing irrelevant content"],
    verdict: {
      keepIf: ["Tu veux une bibliothèque de références sans algorithme ni publicité", "Tu travailles en design, architecture ou recherche et as besoin de connecter des références entre elles"],
      avoidIf: ["Tu cherches un outil de gestion de projet : Are.na n'en est pas un", "Le prix Premium n'est pas confirmé publiquement : vérifie avant de t'engager si le budget est serré"],
      threshold: "Are.na vaut le coup si tu veux une bibliothèque de références créative sans bruit algorithmique. Vérifie le prix Premium exact sur le site officiel avant de payer, il n'est pas affiché publiquement.",
    },
    verdictEn: {
      keepIf: ["You want a reference library with no algorithm and no ads", "You work in design, architecture or research and need to connect references to each other"],
      avoidIf: ["You're looking for a project management tool: Are.na isn't one", "The Premium price isn't publicly confirmed: check before committing if budget is tight"],
      threshold: "Are.na is worth it if you want a creative reference library with no algorithmic noise. Check the exact Premium price on the official site before paying, it isn't listed publicly.",
    },
    pricing_v5: {
      cautions: ["price_not_publicly_listed"], verified_on: "2026-06-25", source_domain: "are.na",
      usage_sensitive: false, compare_plan_kind: "flat", compare_plan_name: "Premium",
      price_reliability: "low", location_sensitive: false,
      official_source_url: "https://www.are.na/about",
      verification_status: "unverified", compare_price_monthly_eur: 0,
    },
  },

  meltwater: {
    shortDescription: "Veille média et social listening à l'échelle entreprise, prix entièrement sur devis.",
    shortDescriptionEn: "Enterprise-scale media monitoring and social listening, fully custom-quoted pricing.",
    description: "Meltwater surveille plus de 6 millions de sources médias avec alertes en temps réel, identification de journalistes et analyse prédictive des mentions. Aucun prix n'est publié : chaque devis dépend des modules choisis (veille média, social listening, influenceurs), du nombre d'utilisateurs et de la couverture géographique.\n\nLes montants réellement payés vont de 6 000$/an pour une formule Starter à plus de 150 000$/an en Enterprise, avec une médiane autour de 25 000$/an selon les données d'acheteurs B2B. C'est un outil dimensionné pour une entreprise avec un budget communication structuré, pas pour un freelance ou une petite équipe.",
    longDescription: "Meltwater surveille plus de 6 millions de sources médias avec alertes en temps réel, identification de journalistes et analyse prédictive des mentions. Aucun prix n'est publié : chaque devis dépend des modules choisis (veille média, social listening, influenceurs), du nombre d'utilisateurs et de la couverture géographique.\n\nLes montants réellement payés vont de 6 000$/an pour une formule Starter à plus de 150 000$/an en Enterprise, avec une médiane autour de 25 000$/an selon les données d'acheteurs B2B. C'est un outil dimensionné pour une entreprise avec un budget communication structuré, pas pour un freelance ou une petite équipe.",
    descriptionEn: "Meltwater monitors over 6 million media sources with real-time alerts, journalist identification and predictive mention analysis. No price is published: every quote depends on the chosen modules (media monitoring, social listening, influencers), user count and geographic coverage.\n\nReal amounts paid range from $6,000/year for a Starter tier to over $150,000/year at Enterprise, with a median around $25,000/year per B2B buyer data. This is sized for a company with a structured comms budget, not a freelancer or small team.",
    longDescriptionEn: "Meltwater monitors over 6 million media sources with real-time alerts, journalist identification and predictive mention analysis. No price is published: every quote depends on the chosen modules (media monitoring, social listening, influencers), user count and geographic coverage.\n\nReal amounts paid range from $6,000/year for a Starter tier to over $150,000/year at Enterprise, with a median around $25,000/year per B2B buyer data. This is sized for a company with a structured comms budget, not a freelancer or small team.",
    pricing: { free: "Aucun plan gratuit", paid: `Sur devis, à partir d'environ ${eur(6000/12)}€/mois (Starter) jusqu'à ${eur(150000/12)}€+/mois (Enterprise)` },
    pricingEn: { free: "No free plan", paid: `Custom quote, from roughly €${eur(6000/12)}/mo (Starter) up to €${eur(150000/12)}+/mo (Enterprise)` },
    defaultMonthlyPrice: eur(6000/12),
    pros: ["Couverture de plus de 6 millions de sources médias en temps réel", "Identification de journalistes et benchmarking concurrentiel intégrés", "Modules combinables (média, social, influenceurs) selon le besoin réel"],
    prosEn: ["Coverage of 6M+ media sources in real time", "Built-in journalist identification and competitive benchmarking", "Combinable modules (media, social, influencers) based on actual need"],
    cons: ["Aucun prix public, contrat annuel obligatoire avec processus commercial long", "Dimensionné pour une entreprise, largement hors budget d'un freelance ou TPE", "Coût final très variable selon les modules choisis, difficile à anticiper sans devis"],
    consEn: ["No public pricing, mandatory annual contract with a long sales process", "Sized for a company, well outside a freelancer or small business budget", "Final cost highly variable by module, hard to anticipate without a quote"],
    useCases: ["Surveiller la couverture médiatique d'une marque ou d'une entreprise à l'échelle internationale", "Mesurer l'impact d'une campagne de relations presse avec des données quantifiées", "Identifier des journalistes pertinents par sujet et par zone géographique"],
    useCasesEn: ["Monitor brand or company media coverage at international scale", "Measure PR campaign impact with quantified data", "Identify relevant journalists by topic and geography"],
    verdict: {
      keepIf: ["Tu gères la communication d'une entreprise avec un budget annuel dédié de plusieurs milliers d'euros", "Tu as besoin de couvrir des médias dans plusieurs pays avec alertes en temps réel"],
      avoidIf: ["Tu es freelance ou TPE : le budget minimum (~6 000$/an) est disproportionné", "Un outil avec prix public comme Mention ou Brand24 couvre déjà l'essentiel pour une veille plus légère"],
      threshold: "Meltwater n'a de sens que pour une entreprise avec un budget communication structuré (minimum quelques milliers de dollars par an). Pour un freelance ou une petite structure, des alternatives à prix public suffisent largement.",
    },
    verdictEn: {
      keepIf: ["You run comms for a company with a dedicated annual budget in the thousands", "You need to cover media across multiple countries with real-time alerts"],
      avoidIf: ["You're a freelancer or small business: the minimum budget (~$6,000/year) is disproportionate", "A tool with public pricing like Mention or Brand24 already covers lighter monitoring needs"],
      threshold: "Meltwater only makes sense for a company with a structured comms budget (a few thousand dollars a year minimum). For a freelancer or small outfit, publicly-priced alternatives cover the need just fine.",
    },
    pricing_v5: {
      cautions: ["estimated_from_third_party_reports", "confirm_if_paid_plan_is_really_used"], verified_on: "2026-06-25", source_domain: "vendr.com",
      usage_sensitive: true, compare_plan_kind: "custom", compare_plan_name: "Starter",
      price_reliability: "low", location_sensitive: true,
      official_source_url: "https://www.meltwater.com/en/pricing",
      verification_status: "official_contextual", compare_price_monthly_eur: eur(6000/12),
    },
  },

  cision: {
    shortDescription: "Base de données journalistes et veille média entreprise, prix sur devis annuel uniquement.",
    shortDescriptionEn: "Enterprise journalist database and media monitoring, annual custom-quote pricing only.",
    description: "Cision donne accès à une base de 1,4 million de journalistes et influenceurs, à la diffusion de communiqués via PR Newswire et au suivi de couverture média en temps réel avec analyse de sentiment. Comme Meltwater, aucun prix n'est public et tout passe par un processus commercial avec devis personnalisé.\n\nLes contrats réels vont de 7 200$/an pour un accès basique à plus de 150 000$/an pour une suite complète avec diffusion PR Newswire incluse. L'accès seul à la base de données de contacts coûte environ 5 700-6 000$/an.",
    longDescription: "Cision donne accès à une base de 1,4 million de journalistes et influenceurs, à la diffusion de communiqués via PR Newswire et au suivi de couverture média en temps réel avec analyse de sentiment. Comme Meltwater, aucun prix n'est public et tout passe par un processus commercial avec devis personnalisé.\n\nLes contrats réels vont de 7 200$/an pour un accès basique à plus de 150 000$/an pour une suite complète avec diffusion PR Newswire incluse. L'accès seul à la base de données de contacts coûte environ 5 700-6 000$/an.",
    descriptionEn: "Cision gives access to a database of 1.4M journalists and influencers, press release distribution via PR Newswire, and real-time media coverage tracking with sentiment analysis. Like Meltwater, no price is public and everything goes through a custom sales quote.\n\nReal contracts range from $7,200/year for basic access to over $150,000/year for a full suite including PR Newswire distribution. Database-only access costs roughly $5,700-6,000/year.",
    longDescriptionEn: "Cision gives access to a database of 1.4M journalists and influencers, press release distribution via PR Newswire, and real-time media coverage tracking with sentiment analysis. Like Meltwater, no price is public and everything goes through a custom sales quote.\n\nReal contracts range from $7,200/year for basic access to over $150,000/year for a full suite including PR Newswire distribution. Database-only access costs roughly $5,700-6,000/year.",
    pricing: { free: "Aucun plan gratuit", paid: `Sur devis annuel, à partir d'environ ${eur(7200/12)}€/mois` },
    pricingEn: { free: "No free plan", paid: `Custom annual quote, from roughly €${eur(7200/12)}/mo` },
    defaultMonthlyPrice: eur(7200/12),
    pros: ["Base de 1,4 million de journalistes, la plus large du marché commercial", "Diffusion de communiqués intégrée via PR Newswire", "Suivi de couverture média multi-canal avec analyse de sentiment"],
    prosEn: ["1.4M journalist database, the largest commercially available", "Built-in press release distribution via PR Newswire", "Multi-channel media coverage tracking with sentiment analysis"],
    cons: ["Aucun prix public, contrats annuels uniquement", "Budget minimum d'environ 7 200$/an, hors de portée d'un freelance", "Processus d'achat long (démo puis devis personnalisé)"],
    consEn: ["No public pricing, annual contracts only", "Minimum budget around $7,200/year, out of reach for a freelancer", "Long buying process (demo then custom quote)"],
    useCases: ["Identifier et contacter des journalistes pertinents par secteur", "Diffuser un communiqué de presse à grande échelle via PR Newswire", "Suivre la couverture médiatique d'une marque avec analyse de sentiment"],
    useCasesEn: ["Identify and contact relevant journalists by sector", "Distribute a press release at scale via PR Newswire", "Track brand media coverage with sentiment analysis"],
    verdict: {
      keepIf: ["Tu as un budget RP annuel d'au moins 7 000$ et besoin de la plus grande base de contacts du marché", "Tu diffuses des communiqués régulièrement via un réseau de distribution établi"],
      avoidIf: ["Tu es freelance ou petite structure : Prowly ou Prezly coûtent une fraction du prix pour l'essentiel des fonctions", "Tu n'as pas besoin de PR Newswire : la base de contacts seule a un coût plus raisonnable (~6 000$/an) mais reste élevée"],
      threshold: "Cision se justifie pour une entreprise avec un budget RP structuré qui a besoin de la plus grande base de contacts du marché. Pour un usage plus léger, Prowly ou Prezly coûtent une fraction du prix.",
    },
    verdictEn: {
      keepIf: ["You have an annual PR budget of at least $7,000 and need the largest contact database on the market", "You distribute press releases regularly through an established distribution network"],
      avoidIf: ["You're a freelancer or small outfit: Prowly or Prezly cost a fraction of the price for most of the same functions", "You don't need PR Newswire: database-only access is more reasonable (~$6,000/year) but still steep"],
      threshold: "Cision is justified for a company with a structured PR budget that needs the largest contact database on the market. For lighter use, Prowly or Prezly cost a fraction of the price.",
    },
    pricing_v5: {
      cautions: ["estimated_from_third_party_reports", "confirm_if_paid_plan_is_really_used"], verified_on: "2026-06-25", source_domain: "vendr.com",
      usage_sensitive: false, compare_plan_kind: "custom", compare_plan_name: "Entry",
      price_reliability: "low", location_sensitive: true,
      official_source_url: "https://www.cision.com/",
      verification_status: "official_contextual", compare_price_monthly_eur: eur(7200/12),
    },
  },

  prowly: {
    shortDescription: "Logiciel RP (communiqués, base journalistes, monitoring) — en cours d'absorption par Semrush.",
    shortDescriptionEn: "PR software (press releases, journalist database, monitoring) — being absorbed into Semrush.",
    description: "Prowly donne accès à plus d'1 million de contacts journalistes, un créateur de newsroom de marque et un suivi des retombées presse jusqu'à 80 000 mentions. Le plan Basic démarre à 369$/mois mais n'inclut ni les relances automatiques ni les rapports détaillés, réservés au plan Pro.\n\nPoint important à connaître avant de t'engager : Semrush, propriétaire de Prowly, a commencé à retirer progressivement le produit fin 2025 pour le fusionner dans le Semrush AI PR Toolkit. Vérifie la feuille de route actuelle avant de signer un contrat long.",
    longDescription: "Prowly donne accès à plus d'1 million de contacts journalistes, un créateur de newsroom de marque et un suivi des retombées presse jusqu'à 80 000 mentions. Le plan Basic démarre à 369$/mois mais n'inclut ni les relances automatiques ni les rapports détaillés, réservés au plan Pro.\n\nPoint important à connaître avant de t'engager : Semrush, propriétaire de Prowly, a commencé à retirer progressivement le produit fin 2025 pour le fusionner dans le Semrush AI PR Toolkit. Vérifie la feuille de route actuelle avant de signer un contrat long.",
    descriptionEn: "Prowly gives access to 1M+ journalist contacts, a branded newsroom builder, and press coverage tracking up to 80,000 mentions. The Basic plan starts at $369/month but doesn't include automated follow-ups or detailed reporting, reserved for the Pro plan.\n\nImportant to know before committing: Semrush, Prowly's owner, started phasing the product out in late 2025 to merge it into the Semrush AI PR Toolkit. Check the current roadmap before signing a long contract.",
    longDescriptionEn: "Prowly gives access to 1M+ journalist contacts, a branded newsroom builder, and press coverage tracking up to 80,000 mentions. The Basic plan starts at $369/month but doesn't include automated follow-ups or detailed reporting, reserved for the Pro plan.\n\nImportant to know before committing: Semrush, Prowly's owner, started phasing the product out in late 2025 to merge it into the Semrush AI PR Toolkit. Check the current roadmap before signing a long contract.",
    pricing: { free: "Essai gratuit de 7 jours avec accès complet", paid: `Basic dès ${eur(369)}€/mois (sans relances auto ni rapports détaillés)` },
    pricingEn: { free: "7-day free trial with full access", paid: `Basic from €${eur(369)}/mo (no auto follow-ups or detailed reports)` },
    defaultMonthlyPrice: eur(369),
    pros: ["Base de plus d'1 million de contacts journalistes", "Newsroom de marque incluse pour centraliser communiqués et ressources presse", "Suivi de retombées presse et sociales jusqu'à 80 000 mentions"],
    prosEn: ["Database of 1M+ journalist contacts", "Branded newsroom included to centralize press releases and resources", "Press and social coverage tracking up to 80,000 mentions"],
    cons: ["Produit en cours d'absorption dans le Semrush AI PR Toolkit depuis fin 2025", "Plan Basic exclut les relances automatiques et les rapports détaillés", "Prix de départ élevé (369$/mois) pour une petite structure"],
    consEn: ["Product being absorbed into the Semrush AI PR Toolkit since late 2025", "Basic plan excludes automated follow-ups and detailed reports", "High starting price ($369/mo) for a small outfit"],
    useCases: ["Construire et maintenir une newsroom de marque centralisée", "Identifier et contacter des journalistes par secteur et zone géographique", "Suivre les retombées presse d'une campagne de communication"],
    useCasesEn: ["Build and maintain a centralized branded newsroom", "Identify and contact journalists by sector and region", "Track press coverage of a communications campaign"],
    verdict: {
      keepIf: ["Tu as déjà un usage actif et acceptes la transition vers le Semrush AI PR Toolkit", "Tu as besoin d'une newsroom de marque et d'une large base de contacts journalistes"],
      avoidIf: ["Tu démarres un nouveau contrat long terme : la feuille de route du produit est incertaine après son absorption par Semrush", "369$/mois est disproportionné pour ton volume de RP : regarde Prezly ou des outils à prix plus accessible"],
      threshold: "Prowly est en transition vers le Semrush AI PR Toolkit depuis fin 2025 : vérifie la feuille de route actuelle avant de t'engager sur un contrat long. Pour un usage ponctuel, le prix de départ (369$/mois) reste élevé face à des alternatives comme Prezly.",
    },
    verdictEn: {
      keepIf: ["You already have active usage and accept the transition to the Semrush AI PR Toolkit", "You need a branded newsroom and a large journalist contact database"],
      avoidIf: ["You're starting a new long-term contract: the product roadmap is uncertain after Semrush's absorption", "$369/mo is disproportionate for your PR volume: look at Prezly or more affordable tools"],
      threshold: "Prowly has been transitioning into the Semrush AI PR Toolkit since late 2025 — check the current roadmap before committing long-term. For occasional use, the starting price ($369/mo) is still steep next to alternatives like Prezly.",
    },
    pricing_v5: {
      cautions: ["product_being_discontinued_or_merged"], verified_on: "2026-06-25", source_domain: "prowly.com",
      usage_sensitive: false, compare_plan_kind: "flat", compare_plan_name: "Basic",
      price_reliability: "medium", location_sensitive: false,
      official_source_url: "https://prowly.com/",
      verification_status: "official_explicit", compare_price_monthly_eur: eur(369),
    },
  },

  "linkedin-recruiter": {
    shortDescription: "Recherche et sourcing de candidats sur LinkedIn, de Lite (170$/mois) à Corporate (~1000$/mois/poste).",
    shortDescriptionEn: "LinkedIn candidate search and sourcing, from Lite ($170/mo) to Corporate (~$1,000/mo/seat).",
    description: "LinkedIn Recruiter Lite coûte environ 170$/mois avec 30 InMails mensuels et un accès limité au 3e degré du réseau. Le palier Corporate, facturé 10 800 à 12 960$/an par poste, donne accès à l'intégralité des plus de 930 millions de profils, au sourcing par IA et aux intégrations ATS.\n\nLe coût réel dépasse souvent l'abonnement affiché de 20 à 40% : chaque InMail au-delà du quota coûte environ 10$, et les recruteurs actifs dépassent fréquemment leur limite mensuelle.",
    longDescription: "LinkedIn Recruiter Lite coûte environ 170$/mois avec 30 InMails mensuels et un accès limité au 3e degré du réseau. Le palier Corporate, facturé 10 800 à 12 960$/an par poste, donne accès à l'intégralité des plus de 930 millions de profils, au sourcing par IA et aux intégrations ATS.\n\nLe coût réel dépasse souvent l'abonnement affiché de 20 à 40% : chaque InMail au-delà du quota coûte environ 10$, et les recruteurs actifs dépassent fréquemment leur limite mensuelle.",
    descriptionEn: "LinkedIn Recruiter Lite costs about $170/month with 30 monthly InMails and access limited to 3rd-degree network connections. The Corporate tier, billed $10,800-$12,960/year per seat, unlocks the full 930M+ profile network, AI sourcing, and ATS integrations.\n\nReal cost often runs 20-40% above the listed subscription: each InMail beyond your quota costs about $10, and active recruiters frequently exceed their monthly limit.",
    longDescriptionEn: "LinkedIn Recruiter Lite costs about $170/month with 30 monthly InMails and access limited to 3rd-degree network connections. The Corporate tier, billed $10,800-$12,960/year per seat, unlocks the full 930M+ profile network, AI sourcing, and ATS integrations.\n\nReal cost often runs 20-40% above the listed subscription: each InMail beyond your quota costs about $10, and active recruiters frequently exceed their monthly limit.",
    pricing: { free: "Aucun plan gratuit (compte LinkedIn de base limité)", paid: `Lite ~${eur(170)}€/mois ; Corporate ~${eur(10800/12)}-${eur(12960/12)}€/mois/poste (annuel)` },
    pricingEn: { free: "No free plan (basic LinkedIn account is limited)", paid: `Lite ~€${eur(170)}/mo; Corporate ~€${eur(10800/12)}-${eur(12960/12)}/mo/seat (annual)` },
    defaultMonthlyPrice: eur(170),
    pros: ["Accès direct au plus grand réseau professionnel mondial (930M+ profils en Corporate)", "Sourcing par IA et intégrations ATS sur le palier Corporate", "30+ filtres de recherche avancée pour cibler précisément les profils"],
    prosEn: ["Direct access to the world's largest professional network (930M+ profiles on Corporate)", "AI sourcing and ATS integrations on the Corporate tier", "30+ advanced search filters to precisely target profiles"],
    cons: ["Coût réel 20-40% au-dessus de l'abonnement affiché avec les InMails en dépassement", "Lite limite l'accès au 3e degré du réseau seulement", "Corporate coûte environ 5x plus cher que Lite (par poste et par an)"],
    consEn: ["Real cost runs 20-40% above the listed subscription once InMail overages hit", "Lite limits access to 3rd-degree network connections only", "Corporate costs roughly 5x more than Lite (per seat, per year)"],
    useCases: ["Sourcer activement des candidats passifs hors plateformes d'offres d'emploi classiques", "Envoyer des InMails ciblés à des profils précis avec des filtres avancés", "Intégrer le sourcing LinkedIn directement dans un pipeline ATS existant (palier Corporate)"],
    useCasesEn: ["Actively source passive candidates beyond traditional job board platforms", "Send targeted InMails to specific profiles with advanced filters", "Integrate LinkedIn sourcing directly into an existing ATS pipeline (Corporate tier)"],
    verdict: {
      keepIf: ["Tu recrutes assez régulièrement pour justifier 170$/mois minimum", "Tu as besoin du réseau LinkedIn complet, pas seulement des candidats déjà identifiés"],
      avoidIf: ["Tu recrutes occasionnellement : un ATS avec sourcing inclus (Workable, Breezy HR) coûte moins cher", "Tu dépasses systématiquement ton quota d'InMails : recalcule le coût réel avec les dépassements avant de comparer"],
      threshold: "LinkedIn Recruiter vaut le coût si tu recrutes régulièrement et as besoin du réseau complet. Pour un recrutement occasionnel, un ATS avec sourcing basique intégré coûte nettement moins cher.",
    },
    verdictEn: {
      keepIf: ["You recruit regularly enough to justify $170/month minimum", "You need the full LinkedIn network, not just already-identified candidates"],
      avoidIf: ["You recruit occasionally: an ATS with built-in sourcing (Workable, Breezy HR) costs less", "You consistently exceed your InMail quota: recalculate real cost with overages before comparing"],
      threshold: "LinkedIn Recruiter is worth it if you recruit regularly and need the full network. For occasional hiring, an ATS with basic built-in sourcing costs significantly less.",
    },
    pricing_v5: {
      cautions: ["usage_sensitive"], verified_on: "2026-06-25", source_domain: "linkedin.com",
      usage_sensitive: true, compare_plan_kind: "seat", compare_plan_name: "Recruiter Lite",
      price_reliability: "medium", location_sensitive: false,
      official_source_url: "https://business.linkedin.com/talent-solutions/recruiter",
      verification_status: "official_contextual", compare_price_monthly_eur: eur(170),
    },
  },
};

let updated = 0;
for (const [slug, fields] of Object.entries(CONTENT)) {
  const tool = tools.find((x) => (x.slug || x.id) === slug);
  if (!tool) { console.warn(`⚠️  ${slug} not found`); continue; }
  for (const [key, value] of Object.entries(fields)) tool[key] = value;
  updated++;
  console.log(`✓ ${tool.name} (${slug}) contenu réel ajouté`);
}
writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log(`\n${updated} fiches mises à jour.`);
