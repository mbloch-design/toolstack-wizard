/** add-content-batch-30.mjs — contenu complet pour Product Hunt,
 * Patreon, Otter, Wistia, Clay, Zotero, Rev, Tenor. Corrige aussi la
 * catégorie mal assignée ("creation") pour ces outils non-créatifs. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));

const ANGLES = {
  otter: {
    stance: "augmente",
    augmentFr: "Otter a construit toute sa proposition de valeur autour de l'IA dès le départ : transcription en temps réel et résumé de réunion automatique, l'un des pionniers du marché des assistants de réunion IA.",
    augmentEn: "Otter built its entire value proposition around AI from the start: real-time transcription and automatic meeting summaries, one of the pioneers in the AI meeting assistant market.",
    replaceFr: "Remplacer Otter par une autre IA ? La question s'inverse plutôt : Otter EST déjà une IA de transcription et de résumé. Sa concurrence vient désormais de fonctionnalités similaires intégrées nativement dans Zoom ou Teams. Verdict : Otter a été conçu autour de l'IA dès le départ, le challenge vient de l'intégration native des plateformes concurrentes.",
    replaceEn: "Replace Otter with another AI? The question rather flips: Otter already IS a transcription and summary AI. Its competition now comes from similar features natively built into Zoom or Teams. Verdict: Otter was built around AI from the start, the challenge comes from native integration in competing platforms.",
    aiTools: [],
  },
  clay: {
    stance: "augmente",
    augmentFr: "Clay combine enrichissement de données et IA générative pour personnaliser des messages de prospection à grande échelle, en s'appuyant sur des dizaines de sources de données réelles plutôt que de la pure génération.",
    augmentEn: "Clay combines data enrichment with generative AI to personalize prospecting messages at scale, relying on dozens of real data sources rather than pure generation.",
    replaceFr: "Remplacer Clay par une IA générative seule ? Non : sa valeur vient de l'agrégation de données réelles de prospects depuis des dizaines de sources, pas seulement de la génération de texte. L'IA personnalise les messages à partir de ces données. Verdict : l'IA augmente la personnalisation, l'enrichissement de données reste l'infrastructure clé.",
    replaceEn: "Replace Clay with a generative AI alone? No: its value comes from aggregating real prospect data from dozens of sources, not just text generation. AI personalizes messages from this data. Verdict: AI augments personalization, data enrichment remains the key infrastructure.",
    aiTools: [],
  },
};

const CONTENT = {
  "product-hunt": {
    category: "communication",
    shortDescription: "Plateforme communautaire de découverte de nouveaux produits tech, lancée chaque jour.",
    shortDescriptionEn: "Community platform for discovering new tech products, launched daily.",
    longDescription: "Product Hunt est la plateforme de référence où les créateurs de produits tech (apps, SaaS, outils IA) présentent leur lancement à une communauté d'early adopters, de investisseurs et de journalistes tech. Un bon classement dans le top du jour peut générer un pic de trafic et de visibilité significatif.\n\nPour un développeur indépendant ou une petite startup, lancer sur Product Hunt reste l'un des moyens les moins chers d'obtenir une visibilité initiale auprès d'une audience tech qualifiée, à condition de préparer le lancement (visuels, message, mobilisation de sa communauté).",
    longDescriptionEn: "Product Hunt is the reference platform where tech product creators (apps, SaaS, AI tools) present their launch to a community of early adopters, investors, and tech journalists. A good ranking in the daily top can generate a significant spike in traffic and visibility.\n\nFor an independent developer or small startup, launching on Product Hunt remains one of the cheapest ways to get initial visibility with a qualified tech audience, provided the launch is well prepared (visuals, messaging, community mobilization).",
    pricing: "Gratuit pour lancer un produit ; options de promotion payante disponibles.",
    pricingEn: "Free to launch a product; paid promotion options available.",
    defaultMonthlyPrice: 0,
    pros: ["Visibilité gratuite auprès d'une audience tech qualifiée et d'investisseurs", "Pic de trafic possible le jour du lancement si bien classé", "Backlink et crédibilité utiles pour le référencement et la notoriété"],
    prosEn: ["Free visibility with a qualified tech audience and investors", "Possible traffic spike on launch day if well-ranked", "Useful backlink and credibility for SEO and reputation"],
    cons: ["Effet généralement ponctuel, le trafic retombe rapidement après le lancement", "Demande une préparation sérieuse (visuels, communauté) pour bien performer", "Audience très tech, peu représentative d'un marché grand public"],
    consEn: ["Generally a one-off effect, traffic drops quickly after launch", "Requires serious preparation (visuals, community) to perform well", "Very tech-savvy audience, not representative of a mainstream market"],
    useCases: ["Lancer un nouveau produit tech avec un pic de visibilité initial", "Obtenir un retour rapide de la communauté tech sur un produit", "Construire une crédibilité initiale auprès d'investisseurs ou journalistes tech"],
    useCasesEn: ["Launch a new tech product with an initial visibility spike", "Get quick feedback from the tech community on a product", "Build initial credibility with investors or tech journalists"],
    verdict: {
      keepIf: ["Tu lances un produit tech et veux une visibilité initiale gratuite", "Tu as une communauté à mobiliser le jour du lancement"],
      avoidIf: ["Ton produit ne s'adresse pas à une audience tech (B2C grand public)", "Tu n'as pas le temps de préparer un lancement soigné"],
      threshold: "Pertinent pour un lancement de produit tech bien préparé avec une communauté à mobiliser.",
    },
    verdictEn: {
      keepIf: ["You're launching a tech product and want free initial visibility", "You have a community to mobilize on launch day"],
      avoidIf: ["Your product doesn't target a tech audience (mainstream B2C)", "You don't have time to prepare a polished launch"],
      threshold: "Worth it for a well-prepared tech product launch with a community to mobilize.",
    },
  },
  patreon: {
    category: "finance",
    shortDescription: "Plateforme d'abonnement pour créateurs, qui finance directement leur travail via une audience fidèle.",
    shortDescriptionEn: "Subscription platform for creators, directly funding their work via a loyal audience.",
    longDescription: "Patreon permet à un créateur (podcast, vidéo, écriture, art) de proposer un abonnement mensuel à son audience en échange de contenu exclusif ou d'avantages, créant un revenu récurrent prévisible plutôt que dépendant uniquement de la publicité ou de sponsors ponctuels.\n\nC'est l'une des plateformes les plus établies pour la monétisation directe par abonnement, avec une marque reconnue par les audiences habituées à soutenir des créateurs.",
    longDescriptionEn: "Patreon lets a creator (podcast, video, writing, art) offer a monthly subscription to their audience in exchange for exclusive content or perks, creating predictable recurring revenue rather than depending solely on advertising or one-off sponsors.\n\nIt's one of the most established platforms for direct subscription monetization, with a brand recognized by audiences used to supporting creators.",
    pricing: "Gratuit pour démarrer ; commission de 8 à 12% sur les revenus selon le plan.",
    pricingEn: "Free to start; 8 to 12% commission on revenue depending on the plan.",
    defaultMonthlyPrice: 0,
    pros: ["Revenu récurrent prévisible plutôt que dépendant de la pub ou de sponsors", "Marque reconnue, l'audience est déjà habituée à payer via Patreon", "Outils de gestion d'abonnés et de niveaux d'avantages intégrés"],
    prosEn: ["Predictable recurring revenue rather than dependent on ads or sponsors", "Recognized brand, the audience is already used to paying via Patreon", "Built-in subscriber and benefit-tier management tools"],
    cons: ["Commission de 8 à 12% plus la commission de traitement des paiements", "Nécessite une audience déjà engagée pour générer des revenus significatifs", "Dépendance à la plateforme pour la relation avec ses abonnés payants"],
    consEn: ["8 to 12% commission plus payment processing fees", "Requires an already engaged audience to generate significant revenue", "Dependency on the platform for the relationship with paying subscribers"],
    useCases: ["Monétiser une audience fidèle de podcast, vidéo ou contenu créatif par abonnement", "Créer un revenu récurrent prévisible en complément d'autres sources", "Offrir du contenu exclusif ou des avantages à ses abonnés les plus engagés"],
    useCasesEn: ["Monetize a loyal podcast, video, or creative content audience via subscription", "Create predictable recurring revenue alongside other sources", "Offer exclusive content or perks to your most engaged subscribers"],
    verdict: {
      keepIf: ["Tu as une audience fidèle prête à payer pour du contenu exclusif", "Tu veux un revenu récurrent prévisible plutôt que dépendant de la pub"],
      avoidIf: ["Ton audience est encore trop petite ou peu engagée pour générer des abonnements significatifs", "Tu préfères vendre un produit ponctuel plutôt qu'un abonnement récurrent"],
      threshold: "Pertinent une fois une audience fidèle construite, prête à soutenir financièrement ton travail.",
    },
    verdictEn: {
      keepIf: ["You have a loyal audience ready to pay for exclusive content", "You want predictable recurring revenue rather than ad-dependent income"],
      avoidIf: ["Your audience is still too small or unengaged to generate significant subscriptions", "You prefer selling a one-off product rather than a recurring subscription"],
      threshold: "Worth it once you've built a loyal audience ready to financially support your work.",
    },
  },
  otter: {
    category: "ai-general",
    shortDescription: "Transcription et résumé de réunion en temps réel par IA, l'un des pionniers du marché.",
    shortDescriptionEn: "Real-time AI meeting transcription and summary, one of the market's pioneers.",
    longDescription: "Otter transcrit les réunions en temps réel et génère automatiquement un résumé avec les points clés et actions à suivre, un des premiers outils à populariser ce type d'assistant de réunion IA avant que la fonctionnalité ne devienne standard chez Zoom, Teams et Google Meet.\n\nSa différenciation aujourd'hui vient de fonctionnalités plus poussées (recherche dans l'historique des transcriptions, intégrations CRM) plutôt que de la transcription de base, désormais disponible nativement ailleurs.",
    longDescriptionEn: "Otter transcribes meetings in real time and automatically generates a summary with key points and action items, one of the first tools to popularize this type of AI meeting assistant before the feature became standard in Zoom, Teams, and Google Meet.\n\nIts differentiation today comes from more advanced features (searching transcript history, CRM integrations) rather than basic transcription, now available natively elsewhere.",
    pricing: "Plan gratuit limité (minutes/mois) ; plans payants à partir de ~10$/mois.",
    pricingEn: "Limited free plan (minutes/month); paid plans from ~$10/month.",
    pros: ["Transcription en temps réel précise, pionnier reconnu du marché", "Recherche dans l'historique de toutes les transcriptions passées", "Intégrations avec des outils CRM et de productivité"],
    prosEn: ["Accurate real-time transcription, a recognized market pioneer", "Search across all past transcript history", "Integrations with CRM and productivity tools"],
    cons: ["Fonctionnalité de base désormais native sur Zoom, Teams et Google Meet", "Plan gratuit limité en minutes, vite dépassé avec un usage régulier", "Différenciation moins claire qu'à l'époque où il était pionnier"],
    consEn: ["Basic feature now native on Zoom, Teams, and Google Meet", "Free plan limited in minutes, quickly exceeded with regular use", "Less clear differentiation than when it was the pioneer"],
    useCases: ["Transcrire et résumer des réunions automatiquement sans prendre de notes", "Rechercher dans l'historique de toutes les réunions passées transcrites", "Intégrer les comptes-rendus de réunion directement dans un CRM"],
    useCasesEn: ["Automatically transcribe and summarize meetings with no note-taking", "Search across the history of all past transcribed meetings", "Integrate meeting recaps directly into a CRM"],
    verdict: {
      keepIf: ["Tu as besoin de rechercher dans l'historique de transcriptions passées", "Tu veux des intégrations CRM spécifiques que les plateformes natives n'offrent pas"],
      avoidIf: ["Ta plateforme de visio (Zoom, Teams, Meet) propose déjà la transcription nativement", "Tu n'as pas besoin de fonctionnalités au-delà de la transcription de base"],
      threshold: "Pertinent pour des fonctionnalités avancées spécifiques ; sinon, la transcription native de ta plateforme de visio suffit souvent.",
    },
    verdictEn: {
      keepIf: ["You need to search across past transcript history", "You want specific CRM integrations native platforms don't offer"],
      avoidIf: ["Your video platform (Zoom, Teams, Meet) already offers native transcription", "You don't need features beyond basic transcription"],
      threshold: "Worth it for specific advanced features; otherwise your video platform's native transcription is often enough.",
    },
  },
  wistia: {
    category: "creation",
    shortDescription: "Hébergement vidéo professionnel pour le marketing B2B, avec analytics d'engagement détaillés.",
    shortDescriptionEn: "Professional video hosting for B2B marketing, with detailed engagement analytics.",
    longDescription: "Wistia héberge des vidéos marketing avec des analytics d'engagement détaillés (qui regarde quoi, jusqu'où) et des fonctionnalités de capture de leads directement intégrées dans le lecteur vidéo — pensé spécifiquement pour le marketing B2B plutôt que pour le grand public comme YouTube.\n\nPour une entreprise qui utilise la vidéo comme outil de génération de leads (démos produit, webinaires), c'est un investissement justifié par les données d'engagement qu'un hébergeur grand public ne fournit pas.",
    longDescriptionEn: "Wistia hosts marketing videos with detailed engagement analytics (who watches what, how far) and lead capture features built directly into the video player — designed specifically for B2B marketing rather than the general public like YouTube.\n\nFor a company using video as a lead generation tool (product demos, webinars), it's an investment justified by engagement data a mainstream host doesn't provide.",
    pricing: "Plan gratuit limité ; plans payants à partir de ~19€/mois selon le nombre de vidéos.",
    pricingEn: "Limited free plan; paid plans from ~$19/month depending on number of videos.",
    pros: ["Analytics d'engagement détaillés (qui regarde quoi, jusqu'où) pour le marketing B2B", "Capture de leads directement intégrée dans le lecteur vidéo", "Hébergement professionnel sans publicité ni vidéos suggérées concurrentes"],
    prosEn: ["Detailed engagement analytics (who watches what, how far) for B2B marketing", "Lead capture built directly into the video player", "Professional hosting with no ads or competing suggested videos"],
    cons: ["Plus cher qu'un hébergement vidéo généraliste comme Vimeo pour un usage simple", "Surdimensionné si tu n'as pas de stratégie de génération de leads vidéo", "Moins pertinent pour du contenu grand public que YouTube"],
    consEn: ["More expensive than a general-purpose video host like Vimeo for simple use", "Overkill if you have no video lead-generation strategy", "Less relevant for mainstream content than YouTube"],
    useCases: ["Héberger des vidéos de démo produit ou webinaires avec capture de leads", "Suivre précisément l'engagement vidéo pour optimiser une stratégie marketing B2B", "Intégrer la vidéo dans un tunnel de conversion avec des CTA mesurables"],
    useCasesEn: ["Host product demo or webinar videos with lead capture", "Precisely track video engagement to optimize a B2B marketing strategy", "Integrate video into a conversion funnel with measurable CTAs"],
    verdict: {
      keepIf: ["Tu utilises la vidéo comme outil de génération de leads B2B", "Les analytics d'engagement détaillés justifient le coût pour ta stratégie"],
      avoidIf: ["Tu héberges juste des vidéos sans stratégie de génération de leads — Vimeo suffit", "Ton contenu vise le grand public — YouTube est plus adapté"],
      threshold: "Pertinent pour une stratégie marketing B2B où la vidéo génère des leads mesurables.",
    },
    verdictEn: {
      keepIf: ["You use video as a B2B lead-generation tool", "Detailed engagement analytics justify the cost for your strategy"],
      avoidIf: ["You just host videos with no lead-generation strategy — Vimeo is enough", "Your content targets the general public — YouTube fits better"],
      threshold: "Worth it for a B2B marketing strategy where video generates measurable leads.",
    },
  },
  clay: {
    category: "email-productivity",
    shortDescription: "Plateforme d'enrichissement de données et de prospection IA, agrège des dizaines de sources.",
    shortDescriptionEn: "Data enrichment and AI prospecting platform, aggregating dozens of sources.",
    longDescription: "Clay agrège des données de prospects depuis des dizaines de sources (LinkedIn, sites web, bases de données B2B) et utilise l'IA pour personnaliser des messages de prospection à grande échelle en fonction de ces données réelles, plutôt que des templates génériques.\n\nPour une équipe sales ou growth qui veut industrialiser une prospection personnalisée, c'est un outil plus puissant mais aussi plus complexe que des outils de prospection classiques comme Lemlist ou Apollo.io seuls.",
    longDescriptionEn: "Clay aggregates prospect data from dozens of sources (LinkedIn, websites, B2B databases) and uses AI to personalize prospecting messages at scale based on this real data, rather than generic templates.\n\nFor a sales or growth team wanting to industrialize personalized prospecting, it's a more powerful but also more complex tool than classic prospecting tools like Lemlist or Apollo.io alone.",
    pricing: "À partir de ~149$/mois selon le volume de crédits d'enrichissement.",
    pricingEn: "From ~$149/month depending on enrichment credit volume.",
    pros: ["Agrège des dizaines de sources de données pour une personnalisation réelle", "Permet d'industrialiser une prospection personnalisée à grande échelle", "Flexibilité poussée pour construire des workflows de prospection sur mesure"],
    prosEn: ["Aggregates dozens of data sources for real personalization", "Lets you industrialize personalized prospecting at scale", "Deep flexibility to build custom prospecting workflows"],
    cons: ["Coût élevé et complexité de configuration importante", "Courbe d'apprentissage significative pour exploiter pleinement l'outil", "Surdimensionné pour une petite équipe avec un volume de prospection limité"],
    consEn: ["High cost and significant setup complexity", "Significant learning curve to fully leverage the tool", "Overkill for a small team with limited prospecting volume"],
    useCases: ["Industrialiser une prospection personnalisée à grande échelle pour une équipe sales", "Enrichir des listes de prospects avec des données de dizaines de sources", "Construire des workflows de prospection sur mesure combinant plusieurs outils"],
    useCasesEn: ["Industrialize personalized prospecting at scale for a sales team", "Enrich prospect lists with data from dozens of sources", "Build custom prospecting workflows combining several tools"],
    verdict: {
      keepIf: ["Tu as une équipe sales ou growth avec un volume de prospection important", "Tu veux personnaliser la prospection à partir de données réelles agrégées"],
      avoidIf: ["Tu es freelance ou petite équipe avec un volume de prospection limité — Lemlist ou Apollo.io suffisent", "Le budget et la complexité de configuration ne sont pas justifiés par ton volume"],
      threshold: "Pertinent pour une équipe sales avec un volume de prospection suffisant pour justifier la complexité.",
    },
    verdictEn: {
      keepIf: ["You have a sales or growth team with significant prospecting volume", "You want to personalize prospecting from aggregated real data"],
      avoidIf: ["You're a freelancer or small team with limited prospecting volume — Lemlist or Apollo.io are enough", "Budget and setup complexity aren't justified by your volume"],
      threshold: "Worth it for a sales team with prospecting volume sufficient to justify the complexity.",
    },
  },
  zotero: {
    category: "organization",
    shortDescription: "Gestionnaire de références bibliographiques gratuit et open source pour la recherche académique.",
    shortDescriptionEn: "Free, open-source bibliographic reference manager for academic research.",
    longDescription: "Zotero collecte, organise et formate automatiquement des références bibliographiques (articles, livres, sites web) pour la recherche académique, avec une extension de navigateur qui capture les métadonnées d'une source en un clic.\n\nPour un chercheur, doctorant ou rédacteur académique, c'est l'alternative gratuite et open source la plus établie face à des outils payants comme EndNote, avec une intégration directe dans Word ou Google Docs pour insérer des citations formatées automatiquement.",
    longDescriptionEn: "Zotero collects, organizes, and automatically formats bibliographic references (articles, books, websites) for academic research, with a browser extension that captures a source's metadata in one click.\n\nFor a researcher, PhD student, or academic writer, it's the most established free and open-source alternative to paid tools like EndNote, with direct integration into Word or Google Docs to insert automatically formatted citations.",
    pricing: "Gratuit, stockage cloud limité gratuit puis payant au-delà.",
    pricingEn: "Free, limited free cloud storage then paid beyond that.",
    defaultMonthlyPrice: 0,
    pros: ["Gratuit et open source, alternative crédible à EndNote payant", "Capture de métadonnées en un clic depuis le navigateur", "Intégration directe dans Word et Google Docs pour les citations"],
    prosEn: ["Free and open source, a credible alternative to paid EndNote", "One-click metadata capture from the browser", "Direct integration into Word and Google Docs for citations"],
    cons: ["Stockage cloud gratuit limité, payant au-delà d'un certain volume", "Interface moins moderne que des outils plus récents", "Demande une certaine rigueur d'organisation pour rester efficace sur le long terme"],
    consEn: ["Limited free cloud storage, paid beyond a certain volume", "Less modern interface than newer tools", "Requires some organizational discipline to stay efficient long-term"],
    useCases: ["Gérer des centaines de références bibliographiques pour une thèse ou un mémoire", "Insérer des citations formatées automatiquement dans Word ou Google Docs", "Collaborer avec d'autres chercheurs sur une bibliothèque de références partagée"],
    useCasesEn: ["Manage hundreds of bibliographic references for a thesis or dissertation", "Insert automatically formatted citations into Word or Google Docs", "Collaborate with other researchers on a shared reference library"],
    verdict: {
      keepIf: ["Tu fais de la recherche académique avec beaucoup de références à gérer", "Tu veux un outil gratuit plutôt que payer pour EndNote"],
      avoidIf: ["Tu n'as que quelques références ponctuelles à gérer — un outil plus simple suffit", "Tu as besoin de plus de 300 Mo de stockage cloud gratuit"],
      threshold: "Indispensable pour tout travail académique avec une bibliographie conséquente.",
    },
    verdictEn: {
      keepIf: ["You do academic research with many references to manage", "You want a free tool rather than paying for EndNote"],
      avoidIf: ["You only have a few occasional references to manage — a simpler tool is enough", "You need more than 300MB of free cloud storage"],
      threshold: "Essential for any academic work with a substantial bibliography.",
    },
  },
  rev: {
    category: "creation",
    shortDescription: "Transcription et sous-titrage par IA et par humains professionnels, au choix.",
    shortDescriptionEn: "AI and professional human transcription and captioning, your choice.",
    longDescription: "Rev propose à la fois une transcription automatique par IA rapide et bon marché, et une transcription par des transcripteurs humains professionnels pour une précision quasi parfaite — un choix selon le niveau de précision requis et le budget disponible.\n\nPour qui a besoin d'une transcription juridique, médicale ou très technique où chaque mot compte, l'option humaine reste préférable à l'IA seule malgré son coût plus élevé.",
    longDescriptionEn: "Rev offers both fast, affordable automatic AI transcription and professional human transcription for near-perfect accuracy — a choice depending on the required precision level and available budget.\n\nFor anyone needing legal, medical, or highly technical transcription where every word matters, the human option remains preferable to AI alone despite its higher cost.",
    pricing: "IA à partir de ~0,25$/minute ; transcription humaine à partir de ~1,50$/minute.",
    pricingEn: "AI from ~$0.25/minute; human transcription from ~$1.50/minute.",
    pros: ["Choix entre IA rapide/économique et précision humaine selon le besoin", "Transcription humaine quasi parfaite pour des contenus sensibles ou techniques", "Sous-titrage et traduction également disponibles"],
    prosEn: ["Choice between fast/affordable AI and human precision depending on need", "Near-perfect human transcription for sensitive or technical content", "Captioning and translation also available"],
    cons: ["Transcription humaine nettement plus chère et plus lente que l'IA seule", "Coût qui s'accumule vite sur de longs contenus en option humaine", "L'option IA seule a une précision inférieure sur l'audio de mauvaise qualité"],
    consEn: ["Human transcription notably more expensive and slower than AI alone", "Cost adds up quickly on long content with the human option", "AI-only option has lower accuracy on poor-quality audio"],
    useCases: ["Transcrire du contenu juridique ou médical nécessitant une précision parfaite", "Sous-titrer rapidement et à moindre coût avec l'option IA pour du contenu courant", "Traduire des sous-titres dans plusieurs langues pour une audience internationale"],
    useCasesEn: ["Transcribe legal or medical content requiring perfect accuracy", "Quickly and cheaply caption everyday content with the AI option", "Translate captions into several languages for an international audience"],
    verdict: {
      keepIf: ["Tu as besoin de précision quasi parfaite pour du contenu sensible (juridique, médical)", "Tu veux le choix entre IA économique et humain précis selon le contenu"],
      avoidIf: ["Tu as juste besoin de sous-titres basiques — des outils IA seuls moins chers suffisent (CapCut, Descript)", "Le budget ne permet pas l'option de transcription humaine"],
      threshold: "Pertinent pour du contenu où la précision compte vraiment ; sinon une IA seule moins chère suffit.",
    },
    verdictEn: {
      keepIf: ["You need near-perfect accuracy for sensitive content (legal, medical)", "You want the choice between affordable AI and precise human depending on content"],
      avoidIf: ["You just need basic captions — cheaper AI-only tools are enough (CapCut, Descript)", "Budget doesn't allow for the human transcription option"],
      threshold: "Worth it for content where accuracy really matters; otherwise a cheaper AI-only tool is enough.",
    },
  },
  tenor: {
    category: "creation",
    shortDescription: "Bibliothèque de GIFs gratuite, intégrée nativement dans de nombreuses apps de messagerie.",
    shortDescriptionEn: "Free GIF library, natively integrated into many messaging apps.",
    longDescription: "Tenor (propriété de Google) est une bibliothèque de GIFs concurrente directe de Giphy, intégrée nativement dans le clavier Google et de nombreuses apps de messagerie (WhatsApp, Discord), ce qui en fait l'option de recherche de GIF la plus utilisée sans même y penser.\n\nPour un créateur de contenu qui veut illustrer un post avec une référence culturelle reconnaissable, Tenor et Giphy couvrent un besoin similaire — le choix entre les deux dépend surtout de l'intégration déjà présente dans l'outil utilisé.",
    longDescriptionEn: "Tenor (owned by Google) is a GIF library directly competing with Giphy, natively integrated into the Google keyboard and many messaging apps (WhatsApp, Discord), making it the most-used GIF search option without users even thinking about it.\n\nFor a content creator wanting to illustrate a post with a recognizable cultural reference, Tenor and Giphy cover a similar need — the choice between the two mostly depends on which is already integrated into the tool being used.",
    pricing: "Gratuit, aucun coût.",
    pricingEn: "Free, no cost.",
    defaultMonthlyPrice: 0,
    pros: ["Gratuit et intégré nativement dans de nombreuses apps déjà utilisées", "Catalogue de GIFs large et bien indexé par recherche de mots-clés", "Propriété Google, infrastructure fiable et rapide"],
    prosEn: ["Free and natively integrated into many already-used apps", "Large, well-indexed GIF catalog by keyword search", "Google-owned, reliable and fast infrastructure"],
    cons: ["Catalogue très similaire à Giphy, peu de différenciation réelle", "Pas d'outils de création de GIF originaux, uniquement une bibliothèque existante", "Dépend de Google pour la pérennité du service"],
    consEn: ["Catalog very similar to Giphy, little real differentiation", "No original GIF creation tools, just an existing library", "Depends on Google for the service's longevity"],
    useCases: ["Illustrer un message ou post avec une réaction GIF reconnaissable", "Utiliser le GIF déjà intégré dans une app de messagerie sans changer d'outil", "Rechercher rapidement un GIF par mot-clé pour du contenu social"],
    useCasesEn: ["Illustrate a message or post with a recognizable reaction GIF", "Use the GIF already integrated into a messaging app with no tool switching", "Quickly search for a GIF by keyword for social content"],
    verdict: {
      keepIf: ["L'app que tu utilises a déjà Tenor intégré nativement (WhatsApp, Discord)", "Tu veux un GIF de réaction reconnaissable rapidement"],
      avoidIf: ["Tu cherches un visuel original sur-mesure — un générateur IA est plus adapté", "Aucune raison d'éviter Tenor pour un usage GIF basique, c'est gratuit et sans risque"],
      threshold: "Solide par défaut pour des GIFs de réaction reconnaissables, équivalent à Giphy.",
    },
    verdictEn: {
      keepIf: ["The app you use already has Tenor natively integrated (WhatsApp, Discord)", "You want a recognizable reaction GIF quickly"],
      avoidIf: ["You're looking for an original custom visual — an AI generator fits better", "No real reason to avoid Tenor for basic GIF use, it's free and risk-free"],
      threshold: "Solid default for recognizable reaction GIFs, equivalent to Giphy.",
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
