export interface FeaturedComparison {
  slugPair: string;
  toolA: string;
  toolB: string;
  summary: string;
  summaryEn: string;
}

export const FEATURED_COMPARISONS: FeaturedComparison[] = [
  { slugPair: "activecampaign-vs-klaviyo", toolA: "activecampaign", toolB: "klaviyo", summary: "Automatisation marketing ou CRM B2C : comparez les usages, les coûts et les limites avant de choisir.", summaryEn: "Marketing automation or B2C CRM: compare workflows, costs and limits before choosing." },
  // AI / Writing
  { slugPair: "chatgpt-vs-claude", summary: "Un assistant pour des tâches variées ou un travail centré sur les documents longs ? Choisissez selon vos livrables.", summaryEn: "An assistant for varied tasks or work centred on long documents? Choose around your deliverables.", toolA: "chatgpt", toolB: "claude" },
  { slugPair: "chatgpt-vs-gemini", summary: "Votre assistant doit-il suivre vos outils ou vivre dans Google Workspace ? C’est le premier arbitrage.", summaryEn: "Should your assistant follow your tools or live in Google Workspace? Start with that decision.", toolA: "chatgpt", toolB: "gemini" },
  { slugPair: "chatgpt-vs-perplexity", summary: "Produire un livrable ou trouver et vérifier des sources : quel rôle attendez-vous de votre IA ?", summaryEn: "Producing a deliverable or finding and checking sources: what job should your AI do?", toolA: "chatgpt", toolB: "perplexity" },
  { slugPair: "claude-vs-gemini", summary: "Analyse de documents ou travail dans l’environnement Google : partez des fichiers que vous utilisez chaque jour.", summaryEn: "Document analysis or work within Google: start with the files you use every day.", toolA: "claude", toolB: "gemini" },
  { slugPair: "deepseek-vs-chatgpt", summary: "Comparez vos tâches de raisonnement et de code, puis les outils et contraintes de données nécessaires au quotidien.", summaryEn: "Compare your reasoning and coding tasks, then the tools and data requirements of daily work.", toolA: "deepseek", toolB: "chatgpt" },
  { slugPair: "grammarly-vs-claude", summary: "Corriger pendant que vous écrivez ou retravailler un texte avec un assistant : deux besoins à distinguer.", summaryEn: "Correcting as you write or revising text with an assistant: two different needs.", toolA: "grammarly", toolB: "claude" },
  { slugPair: "grammarly-vs-prowritingaid", summary: "Corrections quotidiennes ou révision approfondie d’un manuscrit : choisissez selon la longueur de vos textes.", summaryEn: "Everyday corrections or detailed manuscript revision: choose around the length of your writing.", toolA: "grammarly", toolB: "prowritingaid" },
  { slugPair: "midjourney-vs-firefly", summary: "Comparez la direction artistique recherchée, les retouches et la place des images dans votre production.", summaryEn: "Compare your intended art direction, editing needs and the role of images in your production workflow.", toolA: "midjourney", toolB: "firefly" },
  { slugPair: "github-copilot-vs-cursor", summary: "Garder votre éditeur ou changer d’environnement pour coder avec l’IA : évaluez le gain sur votre dépôt.", summaryEn: "Keep your editor or change environments to code with AI: assess the benefit on your repository.", toolA: "github-copilot", toolB: "cursor" },

  // Productivity / Project Management
  { slugPair: "notion-vs-obsidian", summary: "Espace partagé ou notes personnelles durables : la collaboration et la maîtrise de vos fichiers font la différence.", summaryEn: "A shared workspace or lasting personal notes: collaboration and control over files shape the choice.", toolA: "notion", toolB: "obsidian" },
  { slugPair: "notion-vs-airtable", summary: "Organiser le savoir ou structurer les données : repérez quand vos tableaux deviennent un vrai workflow métier.", summaryEn: "Organise knowledge or structure data: recognise when your tables become a business workflow.", toolA: "notion", toolB: "airtable" },
  { slugPair: "notion-vs-trello", summary: "Documenter le projet ou faire avancer les cartes : choisissez la structure dont votre équipe a réellement besoin.", summaryEn: "Document the project or move cards forward: choose the structure your team actually needs.", toolA: "notion", toolB: "trello" },
  { slugPair: "notion-vs-clickup", summary: "Centraliser les documents ou piloter l’exécution : comparez la coordination nécessaire et le temps de configuration.", summaryEn: "Centralise documents or manage execution: compare coordination needs and setup time.", toolA: "notion", toolB: "clickup" },
  { slugPair: "notion-vs-coda", summary: "Votre document doit-il expliquer le travail ou le faire fonctionner ? Comparez tables, logique et collaboration.", summaryEn: "Should your document explain the work or run it? Compare tables, logic and collaboration.", toolA: "notion", toolB: "coda" },
  { slugPair: "asana-vs-trello", summary: "Un tableau suffit-il, ou faut-il coordonner plusieurs projets ? Partez des dépendances et du suivi attendu.", summaryEn: "Is one board enough, or do you need to coordinate projects? Start with dependencies and tracking needs.", toolA: "asana", toolB: "trello" },
  { slugPair: "asana-vs-clickup", summary: "Aligner vite l’équipe ou configurer un espace plus complet : arbitrez entre adoption et personnalisation.", summaryEn: "Align the team quickly or configure a broader workspace: weigh adoption against customisation.", toolA: "asana", toolB: "clickup" },
  { slugPair: "clickup-vs-asana", summary: "Personnalisation ou coordination immédiate : mesurez ce que votre équipe utilisera vraiment.", summaryEn: "Customisation or immediate coordination: assess what your team will actually use.", toolA: "clickup", toolB: "asana" },
  { slugPair: "clickup-vs-trello", summary: "Votre Kanban suffit-il encore ? Comparez le besoin de reporting et d’organisation au coût de la complexité.", summaryEn: "Is your Kanban board still enough? Weigh reporting and organisation needs against added complexity.", toolA: "clickup", toolB: "trello" },
  {
    slugPair: "trello-vs-linear", summary: "Campagnes en Kanban ou cycles de développement : choisissez selon le travail que votre équipe livre.", summaryEn: "Kanban campaigns or development cycles: choose around the work your team ships.",
    toolA: "trello",
    toolB: "linear",
  },
  { slugPair: "wrike-vs-asana", summary: "Comparez le pilotage de plusieurs projets, la répartition du travail et l’effort demandé à l’équipe.", summaryEn: "Compare cross-project oversight, workload allocation and the effort required from your team.", toolA: "wrike", toolB: "asana" },
  { slugPair: "basecamp-vs-asana", summary: "Regrouper les échanges ou structurer le suivi des tâches : partez des frictions de coordination.", summaryEn: "Bring conversations together or structure task tracking: start with your coordination problems.", toolA: "basecamp", toolB: "asana" },
  { slugPair: "hive-vs-asana", summary: "Comment suivre projets et charge de travail sans multiplier les vues que personne ne maintient ?", summaryEn: "How can you track projects and workload without adding views nobody maintains?", toolA: "hive", toolB: "asana" },
  { slugPair: "todoist-vs-trello", summary: "Liste personnelle ou tableau partagé : choisissez selon la façon dont vos tâches passent à l’action.", summaryEn: "A personal list or a shared board: choose around how your tasks turn into action.", toolA: "todoist", toolB: "trello" },
  { slugPair: "smartsuite-vs-notion", summary: "Base opérationnelle ou espace documentaire : distinguez les données à piloter du contexte à partager.", summaryEn: "An operational database or a documentation space: separate the data you manage from the context you share.", toolA: "smartsuite", toolB: "notion" },
  { slugPair: "linear-vs-jira", summary: "Fluidité de livraison ou processus détaillés : comparez les exigences réelles de votre équipe produit.", summaryEn: "Delivery flow or detailed processes: compare your product team's actual requirements.", toolA: "linear", toolB: "jira" },

  // Automation
  { slugPair: "zapier-vs-make", summary: "Connecter vite quelques apps ou modéliser plusieurs branches : comptez aussi la maintenance des automatisations.", summaryEn: "Connect a few apps quickly or model multiple branches: include automation maintenance in the decision.", toolA: "zapier", toolB: "make" },
  { slugPair: "make-vs-zapier", summary: "Scénarios complexes ou connexions rapides : comparez logique, volume et temps de maintenance.", summaryEn: "Complex scenarios or quick connections: compare logic, volume and maintenance time.", toolA: "make", toolB: "zapier" },
  { slugPair: "zapier-vs-albato", summary: "Vos applications et vos volumes départagent-ils ces outils ? Vérifiez le scénario complet avant le prix affiché.", summaryEn: "Do your apps and volumes decide the choice? Check the complete workflow before the advertised price.", toolA: "zapier", toolB: "albato" },

  // Design
  { slugPair: "figma-vs-canva", summary: "Interface à construire ou contenu à publier : le livrable détermine l’outil, pas sa popularité.", summaryEn: "An interface to build or content to publish: the deliverable determines the tool, not its popularity.", toolA: "figma", toolB: "canva" },
  { slugPair: "visme-vs-canva", summary: "Présentation, infographie ou formats sociaux : choisissez selon les supports que vous produisez régulièrement.", summaryEn: "Presentations, infographics or social formats: choose around the materials you produce regularly.", toolA: "visme", toolB: "canva" },
  { slugPair: "prezi-vs-pitch", summary: "Récit visuel ou présentation d’équipe : comparez le parcours de lecture et la façon de collaborer.", summaryEn: "A visual narrative or a team presentation: compare the viewing experience and how you collaborate.", toolA: "prezi", toolB: "pitch" },

  // Storage / File Sharing
  { slugPair: "dropbox-vs-google-drive", summary: "Synchroniser et livrer des fichiers ou collaborer sur des documents : partez de vos échanges clients.", summaryEn: "Sync and deliver files or collaborate on documents: start with how you work with clients.", toolA: "dropbox", toolB: "google-drive" },
  { slugPair: "box-vs-dropbox", summary: "Partage client et contrôle des accès : quel niveau de gouvernance faut-il à vos fichiers ?", summaryEn: "Client sharing and access control: how much governance do your files need?", toolA: "box", toolB: "dropbox" },
  { slugPair: "box-vs-google-drive", summary: "Documents collaboratifs ou gestion encadrée des fichiers : comparez les accès internes et externes.", summaryEn: "Collaborative documents or governed file management: compare internal and external access needs.", toolA: "box", toolB: "google-drive" },

  // Email Marketing
  { slugPair: "mailchimp-vs-brevo", summary: "Comparez votre volume d’envoi et la taille de votre base avant de choisir votre outil email.", summaryEn: "Compare sending volume and audience size before choosing your email platform.", toolA: "mailchimp", toolB: "brevo" },
  { slugPair: "mailchimp-vs-getresponse", summary: "Newsletter seule ou parcours d’acquisition : identifiez les étapes que votre outil email doit couvrir.", summaryEn: "A newsletter alone or an acquisition journey: identify the steps your email platform must cover.", toolA: "mailchimp", toolB: "getresponse" },
  { slugPair: "mailchimp-vs-convertkit", summary: "Newsletter de créateur ou marketing d’entreprise : partez de la relation que vous construisez avec vos abonnés.", summaryEn: "A creator newsletter or business marketing: start with the relationship you build with subscribers.", toolA: "mailchimp", toolB: "kit" },
  { slugPair: "convertkit-vs-getresponse", summary: "Développer une audience ou orchestrer un parcours de conversion : comparez vos besoins au-delà de l’envoi.", summaryEn: "Grow an audience or coordinate a conversion journey: compare your needs beyond sending emails.", toolA: "kit", toolB: "getresponse" },
  { slugPair: "moosend-vs-mailchimp", summary: "Quels segments et automatisations utilisez-vous vraiment ? Comparez le coût sur votre base réelle.", summaryEn: "Which segments and automations do you actually use? Compare costs against your real audience.", toolA: "moosend", toolB: "mailchimp" },

  // CRM / Sales
  { slugPair: "hubspot-vs-pipedrive", summary: "Faire avancer les ventes ou relier marketing et CRM : choisissez selon le périmètre de votre équipe.", summaryEn: "Move sales forward or connect marketing and CRM: choose around your team's remit.", toolA: "hubspot", toolB: "pipedrive" },
  { slugPair: "pipedrive-vs-salesforce", summary: "Pipeline commercial ou organisation CRM complexe : mesurez le besoin de personnalisation et d’administration.", summaryEn: "A sales pipeline or a complex CRM organisation: assess customisation and administration needs.", toolA: "pipedrive", toolB: "salesforce" },
  { slugPair: "pipedrive-vs-zoho", summary: "Suivi des opportunités ou CRM connecté au reste de l’activité : comparez le périmètre avant les fonctions.", summaryEn: "Opportunity tracking or a CRM connected to the wider business: compare scope before features.", toolA: "pipedrive", toolB: "zoho" },
  { slugPair: "salesforce-vs-zoho", summary: "Comparez la complexité de vos processus CRM, les intégrations et les ressources disponibles pour les maintenir.", summaryEn: "Compare CRM process complexity, integrations and the resources available to maintain them.", toolA: "salesforce", toolB: "zoho" },
  { slugPair: "close-vs-pipedrive", summary: "Prospection quotidienne ou suivi du pipeline : partez des actions répétées par vos commerciaux.", summaryEn: "Daily prospecting or pipeline tracking: start with the actions your salespeople repeat.", toolA: "close", toolB: "pipedrive" },
  { slugPair: "capsule-vs-pipedrive", summary: "Gérer la relation client ou piloter les opportunités : quel suivi manque réellement à votre petite équipe ?", summaryEn: "Manage client relationships or track opportunities: what is your small team actually missing?", toolA: "capsule", toolB: "pipedrive" },

  // Website Builders / CMS
  { slugPair: "webflow-vs-squarespace", summary: "Contrôle du site ou simplicité de maintenance : choisissez selon qui construira et fera vivre les pages.", summaryEn: "Site control or simple maintenance: choose around who will build and maintain the pages.", toolA: "webflow", toolB: "squarespace" },
  { slugPair: "webflow-vs-framer", summary: "Lancer vite ou structurer un site durable : le CMS, le contenu et la maintenance font basculer le choix.", summaryEn: "Launch quickly or structure a lasting site: CMS needs, content and maintenance drive the decision.", toolA: "webflow", toolB: "framer" },
  { slugPair: "webflow-vs-wix", summary: "Jusqu’où personnaliser votre site ? Comparez les contraintes de réalisation et l’autonomie après livraison.", summaryEn: "How much customisation does your site need? Compare build constraints and independence after handover.", toolA: "webflow", toolB: "wix" },
  { slugPair: "wix-vs-squarespace", summary: "Comparez votre contenu, votre activité et le temps que vous souhaitez consacrer à la gestion du site.", summaryEn: "Compare your content, business needs and the time you want to spend managing the site.", toolA: "wix", toolB: "squarespace" },
  { slugPair: "wordpress-com-vs-wix", summary: "Publication régulière ou construction visuelle : choisissez selon la façon dont votre site va évoluer.", summaryEn: "Regular publishing or visual site building: choose around how your site will evolve.", toolA: "wordpress-com", toolB: "wix" },
  { slugPair: "shopify-vs-wix", summary: "Boutique au cœur de l’activité ou vente ajoutée à un site : partez de votre fonctionnement commercial.", summaryEn: "A store at the heart of the business or sales added to a website: start with how your business operates.", toolA: "shopify", toolB: "wix" },
  { slugPair: "vercel-vs-replit", summary: "Déployer une application ou la développer dans un même environnement : situez le besoin dans votre chaîne de travail.", summaryEn: "Deploy an application or develop it in one environment: locate the need within your workflow.", toolA: "vercel", toolB: "replit" },

  // E-commerce
  { slugPair: "shopify-vs-woocommerce", summary: "Commerce hébergé ou boutique sous WordPress : comptez la maintenance autant que les ventes.", summaryEn: "Hosted commerce or a WordPress store: account for maintenance as well as sales.", toolA: "shopify", toolB: "woocommerce" },

  // Social Media Management
  { slugPair: "hootsuite-vs-later", summary: "Pilotage multi-réseaux ou calendrier de contenus : comparez la coordination, la validation et le reporting attendus.", summaryEn: "Multi-network oversight or a content calendar: compare coordination, approval and reporting needs.", toolA: "hootsuite", toolB: "later" },
  { slugPair: "hootsuite-vs-socialbee", summary: "Gestion d’équipe ou programmation récurrente : partez du rythme réel de vos publications.", summaryEn: "Team management or recurring scheduling: start with your actual publishing rhythm.", toolA: "hootsuite", toolB: "socialbee" },
  { slugPair: "later-vs-socialbee", summary: "Calendrier visuel ou réutilisation des contenus : comment préparez-vous vos prochaines semaines de publication ?", summaryEn: "A visual calendar or content reuse: how do you prepare your next weeks of publishing?", toolA: "later", toolB: "socialbee" },
  { slugPair: "sendible-vs-hootsuite", summary: "Comptes clients, validations et reporting : comparez le travail d’agence derrière la programmation des posts.", summaryEn: "Client accounts, approvals and reporting: compare the agency work behind post scheduling.", toolA: "sendible", toolB: "hootsuite" },

  // Time Tracking
  { slugPair: "toggl-vs-clockify", summary: "Suivre ses heures ou organiser le temps d’une équipe : comparez la saisie et les rapports réellement utilisés.", summaryEn: "Track your hours or organise team time: compare time entry and the reports you actually use.", toolA: "toggl", toolB: "clockify" },
  { slugPair: "toggl-vs-timecamp", summary: "Saisie du temps et suivi des projets : quel niveau de détail vous aide vraiment à mieux facturer ?", summaryEn: "Time entry and project tracking: what level of detail actually helps you bill better?", toolA: "toggl", toolB: "timecamp" },
  { slugPair: "clockify-vs-timecamp", summary: "Comparez le suivi des heures, les rapports et l’effort de saisie sur une semaine de travail réelle.", summaryEn: "Compare time tracking, reports and entry effort over a real working week.", toolA: "clockify", toolB: "timecamp" },
  { slugPair: "time-doctor-vs-clockify", summary: "Mesurer le temps ou encadrer l’activité : clarifiez le niveau de suivi acceptable pour votre équipe.", summaryEn: "Measure time or oversee activity: clarify the level of monitoring your team can accept.", toolA: "time-doctor", toolB: "clockify" },

  // Landing Pages
  { slugPair: "unbounce-vs-instapage", summary: "Pages de campagne, variantes et conversions : choisissez selon votre méthode d’expérimentation.", summaryEn: "Campaign pages, variants and conversions: choose around your experimentation process.", toolA: "unbounce", toolB: "instapage" },
  { slugPair: "unbounce-vs-leadpages", summary: "Tester plusieurs campagnes ou publier une page de collecte : comparez votre besoin d’optimisation.", summaryEn: "Test multiple campaigns or publish a lead capture page: compare your optimisation needs.", toolA: "unbounce", toolB: "leadpages" },
  { slugPair: "instapage-vs-leadpages", summary: "Production de landing pages ou optimisation de campagnes : quel processus doit accompagner vos pages ?", summaryEn: "Landing page production or campaign optimisation: what process needs to support your pages?", toolA: "instapage", toolB: "leadpages" },

  // Payments / Finance
  { slugPair: "stripe-vs-paypal", summary: "Infrastructure de paiement ou option attendue par vos clients : distinguez l’outil principal du complément.", summaryEn: "Payment infrastructure or an option customers expect: distinguish the main tool from a complement.", toolA: "stripe", toolB: "paypal" },
  { slugPair: "stripe-vs-razorpay", summary: "Pays, moyens de paiement et intégration : commencez par les marchés que votre activité doit servir.", summaryEn: "Countries, payment methods and integration: start with the markets your business must serve.", toolA: "stripe", toolB: "razorpay" },
  { slugPair: "quickbooks-vs-freshbooks", summary: "Comptabilité de l’activité ou facturation des prestations : cadrez le besoin avec vos obligations locales.", summaryEn: "Business accounting or service invoicing: define the need around your local requirements.", toolA: "quickbooks", toolB: "freshbooks" },

  // Forms / Surveys
  { slugPair: "typeform-vs-tally", summary: "Expérience du répondant ou simplicité de production : comparez vos formulaires et leur usage réel.", summaryEn: "Respondent experience or simple production: compare your forms and how they are actually used.", toolA: "typeform", toolB: "tally" },
  { slugPair: "typeform-vs-surveysparrow", summary: "Collecter une réponse ou suivre une relation dans le temps : partez de votre programme d’enquête.", summaryEn: "Collect a response or track a relationship over time: start with your survey programme.", toolA: "typeform", toolB: "surveysparrow" },

  // Communication / Support
  { slugPair: "slack-vs-microsoft-teams", summary: "Messagerie choisie pour l’équipe ou environnement Microsoft déjà en place : comptez aussi le coût du doublon.", summaryEn: "Messaging chosen for the team or an existing Microsoft environment: include the cost of overlap.", toolA: "slack", toolB: "microsoft-teams" },
  { slugPair: "slack-vs-front", summary: "Conversations internes ou messages clients à traiter : ces outils ne remplacent pas le même travail.", summaryEn: "Internal conversations or customer messages to handle: these tools address different work.", toolA: "slack", toolB: "front" },
  { slugPair: "tidio-vs-zendesk", summary: "Répondre aux visiteurs ou organiser un support structuré : choisissez selon le volume et le suivi nécessaires.", summaryEn: "Respond to visitors or organise structured support: choose around volume and follow-up needs.", toolA: "tidio", toolB: "zendesk" },

  // Video
  { slugPair: "loom-vs-vimeo", summary: "Expliquer un travail en vidéo ou diffuser des contenus : partez de la destination de vos enregistrements.", summaryEn: "Explain work through video or distribute content: start with the destination of your recordings.", toolA: "loom", toolB: "vimeo" },

  // Client Management
  { slugPair: "dubsado-vs-honeybook", summary: "Du premier contact au paiement : comparez votre parcours client et les étapes à automatiser.", summaryEn: "From first contact to payment: compare your client journey and the steps to automate.", toolA: "dubsado", toolB: "honeybook" },

  // SEO / Analytics
  { slugPair: "semrush-vs-similarweb", summary: "Optimiser votre acquisition ou comprendre un marché : choisissez selon les décisions que les données doivent éclairer.", summaryEn: "Optimise acquisition or understand a market: choose around the decisions the data must inform.", toolA: "semrush", toolB: "similarweb" },
];
