/** Pair-specific editorial advice. Prices are dated observations, not catalogue overrides. */
export interface ComparisonDecisionGuide {
  checkedAt: string;
  scope: string;
  intro: string;
  scenarios: Array<{ situation: string; choice: string; reason: string; limit: string }>;
  criteria: Array<{ title: string; a: string; b: string; takeaway: string; source?: number }>;
  prices: Array<{ label: string; a: string; b: string; note: string; audience?: 'solo' | 'team'; featured?: boolean; monthlyAmount?: number; planA?: string; planB?: string }>;
  priceNote: string;
  switching: Array<{ title: string; text: string }>;
  trial: string[];
  faq: Array<{ question: string; answer: string }>;
  alternatives: Array<{ slug: string; name: string; reason: string }>;
  sources: Array<{ label: string; url: string }>;
}
const sources = [
  { label: 'ChatGPT — plans & features', url: 'https://chatgpt.com/pricing/' },
  { label: 'Claude — plans & features', url: 'https://claude.com/pricing' },
  { label: 'ChatGPT Plus', url: 'https://help.openai.com/en/articles/6950777' },
  { label: 'ChatGPT Business', url: 'https://help.openai.com/en/articles/8542115' },
];
export const chatgptClaudeGuides: Record<'fr' | 'en', ComparisonDecisionGuide> = {
  fr: {
    checkedAt: '2026-09-20',
    scope: 'Applications ChatGPT et Claude · indépendants et petites équipes · offres web en USD',
    intro: 'Lequel mérite une place dans votre travail ? Comparez les usages, le budget et ce qui justifie vraiment de changer.',
    scenarios: [
      { situation: 'Je cherche mon premier assistant', choice: 'Des textes. Des fichiers. Des images.', reason: 'À essayer si vous voulez aussi générer des visuels dans le même assistant.', limit: 'Pour le texte et les documents seuls, comparez aussi Claude sur un même livrable avant de payer.' },
      { situation: 'Je produis surtout des documents', choice: 'Du dossier au document final.', reason: 'À essayer si vous travaillez surtout sur des briefs, des documents et des présentations.', limit: 'Cela ne prouve pas une meilleure qualité rédactionnelle : comparez les erreurs, le respect du brief et les retouches.' },
      { situation: 'J’utilise déjà l’un des deux', choice: 'Gardez-le s’il fait le travail', reason: 'Vos habitudes, instructions et projets ont de la valeur. Un changement doit résoudre un problème récurrent.', limit: 'Essayez l’autre sur la tâche qui vous bloque, avant de transférer vos projets ou de résilier.' },
      { situation: 'Nous choisissons pour une équipe', choice: 'Comparez les offres d’équipe', reason: 'Le nombre de sièges, l’administration et les conditions de données comptent autant que les réponses.', limit: 'Un abonnement individuel ne répond pas à lui seul aux besoins de gestion d’une équipe.' },
    ],
    criteria: [
      { title: 'Créer des visuels', a: 'La génération d’images est intégrée, avec des limites selon l’offre.', b: 'Documents, présentations et Artifacts. Vérifiez le format de sortie voulu.', takeaway: 'Si vous devez générer des images, testez ce flux précis dans ChatGPT avant d’ajouter un outil.', source: 1 },
      { title: 'Produire des documents', a: 'Fichiers, analyse de données et projets ; l’accès et les limites dépendent de l’offre.', b: 'Pro inclut les projets et les outils Docs et Slides.', takeaway: 'Comparez un document final : informations conservées, erreurs et temps de correction. Pas seulement la première réponse.', source: 2 },
      { title: 'Faire des recherches', a: 'Recherche web et accès à deep research selon le plan.', b: 'Recherche web annoncée dès l’offre gratuite.', takeaway: 'La recherche existe des deux côtés. Vérifiez les sources citées sur votre sujet avant de départager les outils.', source: 2 },
      { title: 'Travailler au quotidien', a: 'Les quotas et accès varient selon le modèle et le plan.', b: 'Pro augmente l’usage ; Max vise un volume supérieur, avec des limites.', takeaway: 'Payez davantage uniquement si une limite interrompt régulièrement un travail utile.', source: 2 },
      { title: 'Travailler à plusieurs', a: 'Business propose un espace de travail et une facturation d’équipe.', b: 'Team distingue des sièges Standard et Premium.', takeaway: 'Comptez les personnes à équiper et vérifiez les règles de données et d’accès avant de choisir.', source: 4 },
    ],
    prices: [
      { label: 'Essayer sans abonnement', a: 'Free · 0 $', b: 'Free · 0 $', note: 'Commencez ici pour un besoin occasionnel. Les limites ne sont pas équivalentes.' },
      { audience: 'solo', featured: true, monthlyAmount: 20, planA: 'Plus', planB: 'Pro', label: 'Repère individuel · paiement mensuel', a: 'Plus · 20 $ / mois', b: 'Pro · 20 $ / mois', note: 'Deux offres de référence pour un usage régulier. Les fonctions et les limites diffèrent.' },
      { audience: 'solo', label: 'Engagement annuel individuel', a: 'Plus · facturation mensuelle', b: 'Pro · 200 $ payés par an', note: 'Claude Pro revient à environ 16,67 $ / mois avec paiement annuel. Le montant est engagé à l’avance.' },
      { audience: 'team', featured: true, monthlyAmount: 25, planA: 'Business · Standard', planB: 'Team · Standard', label: 'Équipe · siège Standard', a: 'Business · 25 $ / siège / mois', b: 'Team · 25 $ / siège / mois', note: 'En paiement mensuel. Minimum de 2 sièges : 50 $ / mois pour deux personnes.' },
      { audience: 'team', label: 'Équipe · engagement annuel', a: '20 $ / siège / mois · facturé annuellement', b: '20 $ / siège / mois · facturé annuellement', note: 'Pour deux sièges Standard : 480 $ / an. Les usages supplémentaires ou sièges supérieurs sont à vérifier.' },
    ],
    priceNote: 'Repères en dollars américains, vérifiés le 20 septembre 2026 sur les pages officielles [1–4]. Taxes et prix locaux à vérifier au paiement. L’API est facturée séparément. Plus + Pro en paiement mensuel représentent 40 $ / mois, soit 480 $ sur douze mois hors taxes applicables.',
    switching: [
      { title: 'Garder', text: 'Vos résultats sont fiables et les limites acceptables ? Gardez vos habitudes. Aucun changement n’est nécessaire.' },
      { title: 'Remplacer', text: 'L’autre résout un blocage récurrent ? Testez-le, puis comptez les projets, instructions et intégrations à recréer.' },
      { title: 'Compléter', text: 'Une tâche régulière et distincte pour chacun ? Les deux peuvent se justifier. Sinon, gardez le second en version gratuite.' },
    ],
    trial: ['Un brief ou une synthèse, avec des fichiers que vous pouvez partager.', 'Même brief, mêmes fichiers. Notez le plan et le modèle.', 'Vérifiez les faits, puis comptez les corrections et les blocages.'],
    faq: [
      { question: 'Faut-il payer ChatGPT et Claude ?', answer: 'Seulement si chacun remplit une tâche récurrente distincte. Deux abonnements individuels mensuels Plus et Pro coûtent ensemble 40 $ par mois avant taxes applicables. Un second avis occasionnel peut se tester avec les offres gratuites.' },
      { question: 'Claude écrit-il toujours mieux ?', answer: 'Aucun vainqueur universel n’est établi ici. Le résultat dépend du brief, du modèle, des documents et du niveau de retouche attendu. Cette page propose un protocole d’essai ; elle ne présente pas de benchmark comparatif réalisé par ToolTrim.' },
      { question: 'Ce comparatif départage-t-il aussi Codex et Claude Code ?', answer: 'Non. Le périmètre principal est celui des applications d’assistance au travail. Un choix pour le développement exige un essai sur votre dépôt, vos tests et votre environnement. Les accès inclus et les limites doivent être examinés séparément.' },
    ],
    alternatives: [
      { slug: 'gemini', name: 'Gemini', reason: 'Pour travailler dans l’environnement Google.' },
      { slug: 'perplexity', name: 'Perplexity', reason: 'Pour chercher et consulter des sources.' },
    ], sources,
  },
  en: {
    checkedAt: '2026-09-20',
    scope: 'ChatGPT and Claude apps · freelancers and small teams · web plans in USD',
    intro: 'Which one earns a place in your work? Compare the tasks, the cost and the reasons to switch.',
    scenarios: [
      { situation: 'I need my first assistant', choice: 'Writing. Files. Images.', reason: 'Worth trying when you also need to generate visuals in the same assistant.', limit: 'For text and documents alone, compare Claude on the same deliverable before paying.' },
      { situation: 'Most of my work is documents', choice: 'From source files to finished work.', reason: 'Worth trying when your work revolves around briefs, documents and presentations.', limit: 'This does not establish better writing quality: compare errors, brief adherence and editing time.' },
      { situation: 'I already use one of them', choice: 'Keep it if it does the job', reason: 'Your habits, instructions and projects have value. Switching should solve a recurring problem.', limit: 'Try the other on the task that blocks you before moving projects or cancelling.' },
      { situation: 'We are choosing for a team', choice: 'Compare the team plans', reason: 'Seats, administration and data terms matter as much as answer quality.', limit: 'An individual subscription alone does not address team management needs.' },
    ],
    criteria: [
      { title: 'Create visuals', a: 'Built-in image generation, with limits that depend on the plan.', b: 'Documents, slides and Artifacts. Check the output format you need.', takeaway: 'If generating images is essential, test that workflow in ChatGPT before adding another tool.', source: 1 },
      { title: 'Produce documents', a: 'Files, data analysis and projects; access and limits depend on the plan.', b: 'Pro includes projects and Docs and Slides tools.', takeaway: 'Compare a finished document: retained information, errors and correction time, not just the first answer.', source: 2 },
      { title: 'Research a topic', a: 'Web search and access to deep research depending on the plan.', b: 'Web search is listed on the free plan.', takeaway: 'Both offer search. Check their cited sources on your topic before choosing.', source: 2 },
      { title: 'Work every day', a: 'Usage allowances and access vary by model and plan.', b: 'Pro adds usage; Max targets higher volume, with limits.', takeaway: 'Pay more only when a limit repeatedly interrupts useful work.', source: 2 },
      { title: 'Work as a team', a: 'Business provides a workspace and team billing.', b: 'Team offers Standard and Premium seats.', takeaway: 'Count the people who need access and review data and access terms before choosing.', source: 4 },
    ],
    prices: [
      { label: 'Try without a subscription', a: 'Free · $0', b: 'Free · $0', note: 'Start here for occasional work. The usage limits are not equivalent.' },
      { audience: 'solo', featured: true, monthlyAmount: 20, planA: 'Plus', planB: 'Pro', label: 'Individual reference · monthly billing', a: 'Plus · $20 / month', b: 'Pro · $20 / month', note: 'Two reference plans for regular work. Features and usage limits differ.' },
      { audience: 'solo', label: 'Individual annual commitment', a: 'Plus · billed monthly', b: 'Pro · $200 paid yearly', note: 'Claude Pro works out to about $16.67 / month with annual billing. Payment is committed up front.' },
      { audience: 'team', featured: true, monthlyAmount: 25, planA: 'Business · Standard', planB: 'Team · Standard', label: 'Team · Standard seat', a: 'Business · $25 / seat / month', b: 'Team · $25 / seat / month', note: 'With monthly billing. Minimum 2 seats: $50 / month for two people.' },
      { audience: 'team', label: 'Team · annual commitment', a: '$20 / seat / month · billed yearly', b: '$20 / seat / month · billed yearly', note: 'Two Standard seats cost $480 / year. Check extra usage and higher seat tiers separately.' },
    ],
    priceNote: 'US dollar reference prices checked on 20 September 2026 against official pages [1–4]. Check local prices and taxes at checkout. API usage is billed separately. Monthly Plus + Pro total $40 / month, or $480 over twelve months before applicable taxes.',
    switching: [
      { title: 'Keep', text: 'Reliable results and acceptable limits? Keep your habits. You do not need to switch.' },
      { title: 'Replace', text: 'Does the other solve a recurring problem? Test it, then account for rebuilding projects, instructions and integrations.' },
      { title: 'Complement', text: 'A distinct, recurring job for each? Both may make sense. Otherwise, keep the second on its free plan.' },
    ],
    trial: ['A brief or a summary, using files you can share.', 'Same brief, same files. Record the plan and model.', 'Check the facts, then count corrections and interruptions.'],
    faq: [
      { question: 'Should I pay for both ChatGPT and Claude?', answer: 'Only if each handles a distinct recurring task. Monthly Plus and Pro subscriptions total $40 per month before applicable taxes. You can try an occasional second opinion on the free plans.' },
      { question: 'Is Claude always better at writing?', answer: 'No universal winner is established here. Results depend on the brief, model, source files and editing standard. This page offers a trial method; it does not report a hands-on comparative benchmark by ToolTrim.' },
      { question: 'Does this comparison also rank Codex and Claude Code?', answer: 'No. The main scope is the work assistant apps. A development choice needs a trial with your repository, tests and environment. Included access and limits should be assessed separately.' },
    ],
    alternatives: [
      { slug: 'gemini', name: 'Gemini', reason: 'For work within Google’s ecosystem.' },
      { slug: 'perplexity', name: 'Perplexity', reason: 'For finding and reviewing sources.' },
    ], sources,
  },
};

const activeCampaignKlaviyoSources = [
  { label: 'ActiveCampaign · Pricing & features', url: 'https://www.activecampaign.com/pricing' },
  { label: 'ActiveCampaign · Trial, contact limits and billing', url: 'https://www.activecampaign.com/about/faq' },
  { label: 'Klaviyo · Pricing and free plan', url: 'https://www.klaviyo.com/pricing/' },
  { label: 'Klaviyo · B2C CRM platform', url: 'https://www.klaviyo.com/platform' },
  { label: 'Klaviyo · Getting started with flows', url: 'https://help.klaviyo.com/hc/en-us/articles/115002774932' },
  { label: 'Klaviyo · Landing pages', url: 'https://help.klaviyo.com/hc/en-us/articles/45373923808155' },
];

export const activeCampaignKlaviyoGuides: Record<'fr' | 'en', ComparisonDecisionGuide> = {
  fr: {
    checkedAt: '2026-09-26',
    scope: 'Plateformes email et automatisation marketing · indépendants, petites équipes et e-commerce · tarifs US observés sur les pages officielles',
    intro: 'ActiveCampaign et Klaviyo ne répondent pas tout à fait au même besoin : comparez la place de l’e-commerce, des parcours clients et du CRM dans votre activité.',
    scenarios: [
      { situation: 'Votre activité est une marque e-commerce B2C', choice: 'Regardez d’abord Klaviyo', reason: 'Ses profils, événements et intégrations commerce alimentent segmentation, campagnes et flows du cycle client.', limit: 'Vérifiez les intégrations dont dépend votre boutique, les canaux activés et le coût selon profils et messages.' },
      { situation: 'Vous gérez aussi des ventes ou des clients hors e-commerce', choice: 'Comparez ActiveCampaign', reason: 'La plateforme vise plusieurs secteurs et combine email, automatisations marketing et options CRM/sales.', limit: 'Le CRM avancé peut nécessiter des options. Starter limite la segmentation et les actions par automatisation.' },
      { situation: 'Vous démarrez avec une petite liste', choice: 'Le gratuit Klaviyo permet de tester', reason: 'Le forfait gratuit inclut jusqu’à 250 profils actifs, 500 emails par mois et un petit budget de messages mobiles.', limit: 'ActiveCampaign propose un essai de 14 jours, mais limité à 100 contacts et 100 emails envoyés.' },
      { situation: 'Vous cherchez surtout des pages d’atterrissage', choice: 'Vérifiez les offres actuelles des deux', reason: 'L’aide officielle de Klaviyo documente les landing pages pour les comptes payants.', limit: 'Pour ActiveCampaign, les landing pages figurent dans Plus et les forfaits supérieurs. Comparez les fonctions de publication requises.' },
    ],
    criteria: [
      { title: 'Positionnement', a: 'Automatisation marketing pour plusieurs secteurs, avec email et fonctions CRM/sales selon l’offre.', b: 'CRM B2C centré sur les profils, données d’achat, marketing, analytics et service.', takeaway: 'Choisissez selon votre modèle client : vente B2C/e-commerce ou marketing et processus plus transversaux.', source: 4 },
      { title: 'Données e-commerce', a: 'Automatisations et intégrations e-commerce disponibles ; vérifiez la profondeur du connecteur utilisé.', b: 'Les événements et données de boutique alimentent profils, segments et flows de cycle de vie.', takeaway: 'Testez une vraie commande, un panier et une donnée de catalogue, pas seulement la connexion initiale.', source: 5 },
      { title: 'Automatisations', a: 'Parcours marketing multi-étapes ; Starter est limité à cinq actions par automatisation.', b: 'Flows déclenchés par listes, segments, événements, dates ou prix, avec filtres et embranchements.', takeaway: 'Comparez vos trois scénarios récurrents avec le plan et les données réellement disponibles.', source: 1 },
      { title: 'CRM commercial', a: 'CRM et ventes présents dans l’écosystème ; les options avancées dépendent du plan ou d’add-ons.', b: 'Klaviyo se présente comme un CRM B2C, construit autour des profils clients et de l’engagement, pas comme un pipeline de vente B2B traditionnel.', takeaway: 'Si vous gérez des opportunités, étapes de vente et tâches commerciales, testez précisément ces objets et leur coût.', source: 4 },
      { title: 'Pages d’atterrissage', a: 'Landing pages disponibles à partir de Plus selon la grille actuelle.', b: 'L’aide Klaviyo documente la création de landing pages pour les comptes payants.', takeaway: 'Vérifiez l’offre active et les fonctions de publication dont vous avez besoin.', source: 6 },
      { title: 'Canaux', a: 'Email au cœur du produit ; SMS et WhatsApp passent par des options et disponibilités qui varient selon le pays.', b: 'Email, mobile messaging et autres canaux selon activation, consentement et tarification régionale.', takeaway: 'Faites le calcul avec vos volumes par canal et les règles de consentement applicables.', source: 3 },
      { title: 'IA et reporting', a: 'Fonctions Active Intelligence et reporting varient selon l’offre.', b: 'Klaviyo ajoute des fonctions d’IA à ses workflows marketing et à son CRM B2C.', takeaway: 'Une liste de fonctions ne prouve ni une supériorité IA ni un meilleur résultat. Testez une campagne et vérifiez chaque chiffre dans le plan retenu.' },
    ],
    prices: [
      { audience: 'solo', label: 'Repères tarifaires · usage individuel', a: 'ActiveCampaign Starter : à partir de 15 $US/mois pour 1 000 contacts, avec facturation annuelle affichée. Le tarif varie avec le volume et le marché.', b: 'Klaviyo : forfait gratuit jusqu’à 250 profils actifs et 500 emails/mois. Le tarif payant se calcule selon profils actifs, envois et canaux.', note: 'Les bases de calcul diffèrent. Utilisez le calculateur officiel Klaviyo avec votre volume de profils et vos canaux avant de comparer les montants.' },
      { audience: 'team', label: 'Repères tarifaires · équipe', a: 'ActiveCampaign : le nombre d’utilisateurs inclus varie selon le forfait ; vérifiez les sièges et options nécessaires.', b: 'Klaviyo : comparez le coût à votre volume de profils, d’emails et de messages mobiles ; vérifiez aussi les conditions de support.', note: 'Ne comparez pas seulement le prix d’entrée : ajoutez sièges, profils actifs, messages, options et engagement de facturation.' },
    ],
    priceNote: 'Tarifs consultés le 26 septembre 2026. ActiveCampaign publie un prix d’entrée en USD pour un volume de référence et un sélecteur dont l’affichage par défaut est annuel. Klaviyo ajuste le prix selon le profil et les canaux; son calculateur officiel est dynamique. Taxes, pays et options peuvent modifier le montant. Confirmez le prix et les limites de votre offre dans le calculateur avant de souscrire.',
    switching: [
      { title: 'Garder', text: 'Vos campagnes et flows fonctionnent, les données sont fiables et le coût reste justifié ? Gardez l’outil en place.' },
      { title: 'Remplacer', text: 'Testez d’abord une migration partielle : profils, consentements, événements, modèles et deux flows représentatifs. Mesurez les écarts avant de basculer.' },
      { title: 'Compléter', text: 'Gardez les deux seulement si l’un couvre un besoin CRM/sales ou multicanal distinct et que les données ne sont pas dupliquées inutilement.' },
    ],
    trial: ['Choisissez trois parcours réels : inscription, panier abandonné et post-achat. Utilisez les mêmes événements, segments et messages.', 'Vérifiez les détails du connecteur e-commerce, les embranchements, les données de consentement, les rapports et les options incluses dans chaque plan.', 'Calculez le coût sur votre nombre réel de profils, d’emails, de SMS et de sièges. Comparez le résultat livré et le travail de migration avant de changer.'],
    faq: [
      { question: 'Klaviyo n’a-t-il pas de CRM ?', answer: 'Klaviyo se présente désormais comme un CRM B2C, réunissant données clients, marketing, analytics et service. Pour un pipeline commercial B2B classique, vérifiez toutefois les objets et fonctions disponibles.' },
      { question: 'Klaviyo ne propose-t-il pas de landing pages ?', answer: 'L’aide actuelle de Klaviyo explique la création de landing pages pour les comptes payants. Les fonctions et l’éligibilité sont à vérifier dans l’offre active.' },
      { question: 'Quel outil est le moins cher ?', answer: 'Impossible de répondre sans volume et canaux. ActiveCampaign affiche un tarif d’entrée par nombre de contacts, tandis que Klaviyo calcule l’offre selon les profils actifs et les usages. Comparez le total au même volume et avec la même facturation.' },
      { question: 'La délivrabilité permet-elle de départager les outils ?', answer: 'Pas sans un test récent et comparable : vérifiez sa date, son protocole et les conditions d’envoi. Aucun benchmark de délivrabilité réalisé par ToolTrim n’est présenté ici.' },
    ],
    alternatives: [
      { slug: 'brevo', name: 'Brevo', reason: 'À comparer si le budget et les canaux de communication priment sur la profondeur des données e-commerce.' },
      { slug: 'mailchimp', name: 'Mailchimp', reason: 'À regarder pour des campagnes email plus simples et une prise en main différente.' },
      { slug: 'hubspot', name: 'HubSpot', reason: 'À comparer si le CRM commercial, les pipelines et l’alignement ventes/marketing sont centraux.' },
    ],
    sources: activeCampaignKlaviyoSources,
  },
  en: {
    checkedAt: '2026-09-26',
    scope: 'Email and marketing automation platforms · freelancers, small teams and ecommerce · US prices checked on official pages',
    intro: 'ActiveCampaign and Klaviyo do not solve exactly the same problem. Compare the role of ecommerce, customer journeys and CRM in your business.',
    scenarios: [
      { situation: 'You run a B2C ecommerce brand', choice: 'Start by evaluating Klaviyo', reason: 'Its profiles, events and commerce integrations feed segmentation, campaigns and customer lifecycle flows.', limit: 'Check the integrations your store depends on, enabled channels and cost by profiles and messages.' },
      { situation: 'You also manage non-ecommerce sales or clients', choice: 'Compare ActiveCampaign', reason: 'It serves multiple industries and combines email, marketing automation and CRM/sales options.', limit: 'Advanced CRM may require add-ons. Starter limits segmentation and automation actions.' },
      { situation: 'You are starting with a small list', choice: 'Klaviyo has a free plan to test', reason: 'The free plan includes up to 250 active profiles, 500 emails per month and a small mobile messaging allowance.', limit: 'ActiveCampaign offers a 14-day trial, capped at 100 contacts and 100 emails sent.' },
      { situation: 'You mainly need landing pages', choice: 'Check both current plan details', reason: 'Klaviyo’s current help documentation covers landing pages for paid accounts.', limit: 'ActiveCampaign lists landing pages on Plus and higher plans. Compare the publishing features you need.' },
    ],
    criteria: [
      { title: 'Positioning', a: 'Marketing automation for multiple industries, with email and CRM/sales features depending on the offer.', b: 'A B2C CRM focused on profiles, purchase data, marketing, analytics and service.', takeaway: 'Choose based on your customer model: B2C ecommerce or broader marketing and sales workflows.', source: 4 },
      { title: 'Ecommerce data', a: 'Ecommerce automations and integrations are available; verify the depth of your specific connector.', b: 'Store events and customer data feed profiles, segments and lifecycle flows.', takeaway: 'Test a real order, cart and catalog event, not just the initial connection.', source: 5 },
      { title: 'Automations', a: 'Multi-step marketing journeys; Starter is limited to five actions per automation.', b: 'Flows can be triggered by lists, segments, events, dates or price changes, with filters and branching.', takeaway: 'Compare your three recurring scenarios using the plan and data you would actually have.', source: 1 },
      { title: 'Sales CRM', a: 'CRM and sales capabilities are part of the ecosystem; advanced features depend on the plan or add-ons.', b: 'Klaviyo positions itself as a B2C CRM built around customer profiles and engagement, not a traditional B2B sales pipeline.', takeaway: 'If you manage opportunities, sales stages and tasks, test those exact objects and their cost.', source: 4 },
      { title: 'Landing pages', a: 'Landing pages are listed from Plus upward on the current plan grid.', b: 'Klaviyo help documents landing pages for paid accounts.', takeaway: 'Check the active offer and publishing features you need.', source: 6 },
      { title: 'Channels', a: 'Email is core; SMS and WhatsApp depend on add-ons and availability that vary by country.', b: 'Email, mobile messaging and other channels depend on activation, consent and regional pricing.', takeaway: 'Model costs using your volumes by channel and applicable consent rules.', source: 3 },
      { title: 'AI and reporting', a: 'Active Intelligence and reporting features vary by plan.', b: 'Klaviyo adds AI features to marketing workflows and its B2C CRM.', takeaway: 'A feature list does not prove AI superiority or better outcomes. Test a campaign and confirm what is included in your chosen plan.' },
    ],
    prices: [
      { audience: 'solo', label: 'Pricing reference · individual use', a: 'ActiveCampaign Starter: from $15/month for 1,000 contacts, with annual billing displayed. Pricing varies by volume and market.', b: 'Klaviyo: free plan up to 250 active profiles and 500 emails/month. Paid pricing is calculated by active profiles, sends and channels.', note: 'These are different pricing bases. Use the official Klaviyo calculator with your profile volume and channels before comparing totals.' },
      { audience: 'team', label: 'Pricing reference · team', a: 'ActiveCampaign: included users vary by plan; check the seats and add-ons you need.', b: 'Klaviyo: compare cost by profile volume, email and mobile message usage; also check support terms.', note: 'Do not compare entry prices alone. Include seats, active profiles, messages, add-ons and billing commitment.' },
    ],
    priceNote: 'Pricing checked on September 26, 2026. ActiveCampaign publishes an entry rate by contact count and its selector defaults to annual billing. Klaviyo adjusts pricing by profile and channel; its official calculator is dynamic. Taxes, country and add-ons can change the amount. Confirm your price and usage limits in the calculator before subscribing.',
    switching: [
      { title: 'Keep', text: 'Are campaigns and flows working, data reliable and cost justified? Keep the current tool.' },
      { title: 'Replace', text: 'Test a partial migration first: profiles, consent, events, templates and two representative flows. Measure differences before switching.' },
      { title: 'Complement', text: 'Keep both only when one covers a distinct CRM/sales or multichannel need and data is not being duplicated unnecessarily.' },
    ],
    trial: ['Choose three real journeys: signup, abandoned cart and post-purchase. Use the same events, segments and messages.', 'Check ecommerce connector details, branching, consent data, reporting and which features are included in each plan.', 'Model cost using your actual profile, email, SMS and seat counts. Compare usable output and migration work before switching.'],
    faq: [
      { question: 'Does Klaviyo lack a CRM?', answer: 'Klaviyo now positions itself as a B2C CRM combining customer data, marketing, analytics and service. For a traditional B2B sales pipeline, still verify the available objects and features.' },
      { question: 'Does Klaviyo lack landing pages?', answer: 'Current Klaviyo help explains how to create landing pages on paid accounts. Check features and eligibility on the active offer.' },
      { question: 'Which tool is cheaper?', answer: 'It depends on volume and channels. ActiveCampaign lists an entry price by contact count, while Klaviyo calculates based on active profiles and usage. Compare the total at the same volume and billing term.' },
      { question: 'Can deliverability decide the comparison?', answer: 'Not without a recent, comparable test: check its date, methodology and sending conditions. No hands-on deliverability benchmark by ToolTrim is presented here.' },
    ],
    alternatives: [
      { slug: 'brevo', name: 'Brevo', reason: 'Compare it when budget and communication channels matter more than ecommerce data depth.' },
      { slug: 'mailchimp', name: 'Mailchimp', reason: 'Consider it for simpler email campaigns and a different onboarding experience.' },
      { slug: 'hubspot', name: 'HubSpot', reason: 'Compare it when sales CRM, pipelines and sales/marketing alignment are central.' },
    ],
    sources: activeCampaignKlaviyoSources,
  },
};
