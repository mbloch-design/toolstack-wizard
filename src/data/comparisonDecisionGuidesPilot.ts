import type { ComparisonDecisionGuide } from './comparisonDecisionGuides';

/**
 * Comparatifs pilotes de l'action 9 (enrichissement à 1 200+ mots).
 *
 * Ces guides suivent le contrat de `ComparisonDecisionGuide` : ils remplacent
 * le contenu générique de `buildFallbackContent` sans toucher au balisage ni
 * aux composants. Les prix sont des relevés datés du catalogue ToolTrim
 * (25/09/2026), pas des valeurs inventées ; chaque affirmation de coût renvoie
 * à une page officielle listée dans `sources`.
 */

const deepseekChatgptSources = [
  { label: 'DeepSeek — tarifs de l’API', url: 'https://api-docs.deepseek.com/quick_start/pricing' },
  { label: 'DeepSeek — plateforme développeur', url: 'https://platform.deepseek.com/' },
  { label: 'ChatGPT — plans et fonctions', url: 'https://openai.com/chatgpt/pricing/' },
  { label: 'OpenAI — tarifs de l’API', url: 'https://platform.openai.com/docs/pricing' },
];

export const deepseekChatgptGuides: Record<'fr' | 'en', ComparisonDecisionGuide> = {
  fr: {
    checkedAt: '2026-11-12',
    scope: 'API et assistants IA · indépendants, développeurs et petites équipes · tarifs US observés le 25 septembre 2026',
    intro:
      'DeepSeek et ChatGPT ne se comparent pas seulement sur la qualité des réponses : l’un se juge au coût au million de tokens, l’autre à l’abonnement et à l’application qu’il remplace. Le bon choix dépend de qui écrit les prompts et de qui paie la facture.',
    scenarios: [
      {
        situation: 'Vous intégrez l’IA dans un produit ou un script',
        choice: 'DeepSeek, pour l’API',
        reason:
          'Une API REST standard, facturée au token, avec 5 millions de tokens offerts à l’inscription sans carte bancaire. C’est le moyen le moins coûteux de prototyper un flux RAG ou un test A/B.',
        limit:
          'Vous portez l’intégration, la gestion des erreurs, les quotas et la facturation. Le support est communautaire, pas un contrat professionnel.',
      },
      {
        situation: 'Vous voulez un assistant prêt à l’emploi',
        choice: 'ChatGPT, pour l’application',
        reason:
          'Applications web, mobile et desktop, projets, GPT personnalisés et recherche approfondie : le travail commence dans l’interface, sans écrire une ligne de code.',
        limit:
          'Les modèles phares et les quotas confortables sont réservés aux offres payantes ; le plan gratuit reste un modèle de base à usage limité.',
      },
      {
        situation: 'Vous traitez de gros volumes de texte',
        choice: 'DeepSeek, si le corpus s’y prête',
        reason:
          'Le tarif hors heures pleines et la mise en cache des prompts font baisser fortement le coût d’un pipeline répétitif : résumés, extraction, classification.',
        limit:
          'Le prix ne dit rien de la qualité sur votre corpus. Mesurez les erreurs et les reprises avant de généraliser, et vérifiez les tarifs peak.',
      },
      {
        situation: 'Vos données sont sensibles ou réglementées',
        choice: 'ChatGPT, ou un fournisseur validé par votre organisation',
        reason:
          'Les conditions, la région de traitement et les engagements de confidentialité de chaque fournisseur doivent être vérifiés avant tout envoi de données client.',
        limit:
          'DeepSeek est un fournisseur chinois : pour des données personnelles, médicales ou contractuelles, l’arbitrage doit passer par votre juriste, pas par cette page.',
      },
      {
        situation: 'Vous testez avant d’engager un budget',
        choice: 'Les deux offres gratuites, sur la même tâche',
        reason:
          '5 millions de tokens chez DeepSeek et un modèle de base chez ChatGPT permettent de comparer sur un vrai livrable, sans abonnement.',
        limit:
          'Un test gratuit ne prouve ni le coût de production ni la qualité à volume. Notez les reprises nécessaires, pas seulement la première réponse.',
      },
    ],
    criteria: [
      {
        title: 'Modèle économique',
        a: 'Facturation à l’usage, au million de tokens en entrée et en sortie.',
        b: 'Abonnement mensuel par compte, avec une API facturée séparément au token.',
        takeaway:
          'Si vous ne pouvez pas prédire le volume, l’abonnement plafonne la dépense ; si le volume est régulier et maîtrisé, l’API le fait baisser.',
        source: 1,
      },
      {
        title: 'Coût d’entrée',
        a: '5 M tokens offerts à l’inscription, sans carte bancaire.',
        b: 'Plan gratuit avec un modèle de base et un usage limité.',
        takeaway:
          'Les deux permettent de commencer à zéro. Le crédit DeepSeek se consume ; le plan gratuit ChatGPT reste disponible tant que les quotas tiennent.',
        source: 3,
      },
      {
        title: 'Coût à l’usage',
        a: 'V4 Flash hors heures pleines : 0,14 $/M en entrée, 0,28 $/M en sortie. V4 Pro : 0,435 $ et 0,87 $. Cache-hit Flash : 0,003 $/M.',
        b: 'Go à 8 $/mois, Plus à 20 $/mois, Pro à 200 $/mois. L’API est facturée à part, au token.',
        takeaway:
          'Comparez le coût d’un mois réel : un abonnement Plus à 20 $ équivaut à environ 70 millions de tokens d’entrée Flash hors heures pleines, hors cache.',
        source: 1,
      },
      {
        title: 'Application et interface',
        a: 'API d’abord ; l’interface de chat n’est pas le cœur du produit.',
        b: 'Web, mobile et desktop, avec projets, GPT personnalisés et recherche approfondie.',
        takeaway:
          'Pour une personne qui travaille dans une interface, ChatGPT rend le service ; pour un service qui appelle un modèle, l’interface ne compte pas.',
        source: 3,
      },
      {
        title: 'Écosystème',
        a: 'API REST standard, peu d’intégrations propriétaires.',
        b: 'Connecteurs, GPT personnalisés, projets, génération d’images et outils d’analyse.',
        takeaway:
          'Un écosystème large réduit le temps d’intégration, mais ajoute des dépendances et des coûts d’offre à vérifier.',
        source: 3,
      },
      {
        title: 'Données et conformité',
        a: 'Fournisseur chinois ; conditions de traitement et de conservation à examiner.',
        b: 'Fournisseur américain ; conditions, région et options d’entreprise à examiner.',
        takeaway:
          'Aucun des deux ne dispense d’une revue : la question n’est pas « qui est le plus sûr », mais « quel accord couvre mes données ».',
        source: 2,
      },
      {
        title: 'Qualité sur votre usage',
        a: 'Performances annoncées par l’éditeur, à confirmer sur votre corpus.',
        b: 'Qualité variable selon le modèle et le plan ; à confirmer sur votre corpus.',
        takeaway:
          'Aucun benchmark ToolTrim n’est présenté ici. Un jeu de 20 prompts représentatifs vaut mieux qu’un classement général.',
        source: 4,
      },
      {
        title: 'Volume et latence',
        a: 'Tarifs peak et off-peak distincts ; le cache réduit le coût des prompts stables.',
        b: 'Quotas par fenêtre de temps sur l’application ; l’API a ses propres limites de débit.',
        takeaway:
          'Un pipeline qui tourne la nuit ne se compare pas à un assistant utilisé dans la journée : la période de facturation change le résultat.',
        source: 1,
      },
      {
        title: 'Support et documentation',
        a: 'Documentation technique et support communautaire, sans contrat de support éditeur.',
        b: 'Documentation, centre d’aide et support selon l’offre ; les plans d’équipe ajoutent des options.',
        takeaway:
          'Pour une intégration en production, le temps de réponse en cas de panne compte autant que le prix du token. Vérifiez le canal de support avant de dépendre du service.',
        source: 2,
      },
      {
        title: 'Portabilité',
        a: 'Prompts et réponses réutilisables, mais l’intégration est à réécrire si vous changez d’API.',
        b: 'Export des conversations et des projets, avec des limites selon l’offre et le format.',
        takeaway:
          'Un fournisseur d’API ne se remplace pas comme une application : prévoyez une couche d’abstraction si le modèle doit changer.',
        source: 4,
      },
      {
        title: 'Engagement et facturation',
        a: 'Pas d’abonnement : vous payez ce que vous consommez, avec un crédit de départ.',
        b: 'Abonnement mensuel ou annuel, avec des quotas et des conditions de résiliation à vérifier.',
        takeaway:
          'Un crédit offert peut masquer le coût réel : simulez une facture mensuelle avant de choisir, et vérifiez ce qui se passe en cas de dépassement.',
        source: 3,
      },
    ],
    prices: [
      {
        label: 'Prototyper sans engagement',
        a: '5 M tokens offerts, sans carte bancaire.',
        b: 'Plan gratuit : modèle de base, usage limité.',
        note: 'Commencez par le même cas d’usage des deux côtés. Un crédit offert ne se renouvelle pas.',
      },
      {
        label: 'Usage individuel régulier',
        a: 'API à l’usage : 0,14 à 0,87 $/M selon le modèle et la période.',
        b: 'Go 8 $/mois, Plus 20 $/mois, Pro 200 $/mois.',
        note: 'Le montant DeepSeek dépend entièrement de votre volume ; l’abonnement ChatGPT est fixe, mais les quotas restent plafonnés.',
      },
      {
        label: 'Équipe ou produit',
        a: 'Aucun siège à payer : la facture suit les tokens consommés.',
        b: 'Offres d’équipe par siège, ou API facturée séparément.',
        note: 'Pour une équipe, comparez le coût par personne et le coût par usage : les deux modèles ne se recouvrent pas.',
      },
    ],
    priceNote:
      'Tarifs relevés le 25 septembre 2026 dans le catalogue ToolTrim, à partir des pages officielles [1–4]. DeepSeek distingue heures pleines et heures creuses et applique une réduction de 95 % sur les tokens lus dans le cache pour Flash. Les prix ChatGPT sont en dollars américains, hors taxes ; l’API est facturée séparément. Vérifiez les conditions en vigueur avant de souscrire.',
    switching: [
      {
        title: 'Garder',
        text: 'Votre assistant ou votre intégration tient la charge et le coût reste sous contrôle ? Ne changez rien : un changement de fournisseur se paie en reprises et en tests.',
      },
      {
        title: 'Remplacer',
        text: 'Un blocage récurrent — quota, coût, fonction manquante — justifie un test comparatif sur vos propres prompts. Mesurez les erreurs, la latence et le temps de correction avant de basculer.',
      },
      {
        title: 'Compléter',
        text: 'Un abonnement pour le travail quotidien et une API pour les traitements de masse peuvent cohabiter. Gardez les deux seulement si les usages sont réellement distincts.',
      },
    ],
    trial: [
      'Choisissez dix prompts représentatifs de votre travail : un résumé, une extraction, une reformulation, un cas difficile.',
      'Exécutez-les sur DeepSeek et sur ChatGPT, avec les mêmes consignes et les mêmes fichiers. Notez le modèle et l’offre utilisés.',
      'Comptez les erreurs factuelles, les reprises nécessaires et le temps de correction, pas seulement la fluidité de la première réponse.',
      'Calculez le coût du mois à votre volume réel : tokens consommés d’un côté, abonnement et dépassements de l’autre.',
    ],
    faq: [
      {
        question: 'DeepSeek est-il vraiment gratuit ?',
        answer:
          'L’inscription donne 5 millions de tokens sans carte bancaire, valables sur les modèles. Au-delà, l’API est facturée au token. Ce n’est donc pas un gratuit permanent comme le plan gratuit de ChatGPT : c’est un crédit de démarrage.',
      },
      {
        question: 'DeepSeek peut-il remplacer ChatGPT au quotidien ?',
        answer:
          'Pas pour le même travail. ChatGPT fournit l’application, les projets et les outils intégrés ; DeepSeek fournit une API et un modèle. Si vous travaillez dans une interface, le remplacement n’est pas direct.',
      },
      {
        question: 'Faut-il savoir coder pour utiliser DeepSeek ?',
        answer:
          'Pour l’API, oui : il faut gérer les requêtes, les clés, les erreurs et la facturation. Si vous cherchez un assistant sans intégration, ChatGPT ou Gemini sont plus adaptés.',
      },
      {
        question: 'Lequel coûte le moins cher ?',
        answer:
          'Cela dépend du volume et de la période. À faible volume, le plan gratuit de ChatGPT peut suffire. À volume régulier et automatisé, le tarif au token de DeepSeek, surtout avec cache et heures creuses, peut être nettement inférieur. Faites le calcul avec vos tokens réels.',
      },
      {
        question: 'Mes données sont-elles protégées ?',
        answer:
          'Cette page ne peut pas y répondre à votre place. DeepSeek est un fournisseur chinois et OpenAI un fournisseur américain ; les deux ont des conditions de traitement et de conservation à vérifier. Pour des données sensibles, faites valider le fournisseur et le contrat par votre organisation.',
      },
      {
        question: 'Que se passe-t-il quand les 5 millions de tokens sont épuisés ?',
        answer:
          'Le crédit de bienvenue ne se renouvelle pas. Il faut ajouter un moyen de paiement pour continuer à appeler l’API, et la facture suit alors la consommation réelle. Surveillez le solde avant de lancer un traitement de masse.',
      },
      {
        question: 'DeepSeek est-il adapté à la production ?',
        answer:
          'L’API peut servir en production, mais elle exige une gestion des erreurs, des limites de débit et des coûts, ainsi qu’un plan de repli si le service est indisponible. Pour un usage critique, comparez le support et les garanties avec ceux d’un fournisseur sous contrat.',
      },
    ],
    alternatives: [
      { slug: 'claude', name: 'Claude', reason: 'Pour un travail centré sur les documents longs et l’analyse de fichiers.' },
      { slug: 'gemini', name: 'Gemini', reason: 'Pour rester dans l’environnement Google et ses quotas d’équipe.' },
      { slug: 'perplexity', name: 'Perplexity', reason: 'Pour chercher et vérifier des sources plutôt que produire un livrable.' },
    ],
    sources: deepseekChatgptSources,
  },
  en: {
    checkedAt: '2026-11-12',
    scope: 'AI APIs and assistants · freelancers, developers and small teams · US prices observed on 25 September 2026',
    intro:
      'DeepSeek and ChatGPT are not only competing on answer quality: one is judged on cost per million tokens, the other on the subscription and the app it replaces. The right choice depends on who writes the prompts and who pays the bill.',
    scenarios: [
      {
        situation: 'You are embedding AI in a product or a script',
        choice: 'DeepSeek, for the API',
        reason:
          'A standard REST API billed per token, with 5 million free tokens at signup and no credit card. It is the cheapest way to prototype a RAG flow or an A/B test.',
        limit:
          'You own the integration, error handling, rate limits and billing. Support is community-based rather than a professional contract.',
      },
      {
        situation: 'You want a ready-to-use assistant',
        choice: 'ChatGPT, for the app',
        reason:
          'Web, mobile and desktop apps, projects, custom GPTs and deep research: work starts in the interface without writing a line of code.',
        limit:
          'Flagship models and comfortable quotas are reserved for paid plans; the free plan remains a base model with limited usage.',
      },
      {
        situation: 'You process large volumes of text',
        choice: 'DeepSeek, if your corpus fits',
        reason:
          'Off-peak pricing and prompt caching sharply reduce the cost of a repetitive pipeline: summaries, extraction, classification.',
        limit:
          'Price says nothing about quality on your corpus. Measure errors and rework before scaling, and check peak rates.',
      },
      {
        situation: 'Your data is sensitive or regulated',
        choice: 'ChatGPT, or a provider approved by your organisation',
        reason:
          'Each vendor’s terms, processing region and confidentiality commitments must be checked before sending any customer data.',
        limit:
          'DeepSeek is a Chinese provider: for personal, medical or contractual data, the decision belongs with your legal team, not this page.',
      },
      {
        situation: 'You want to test before committing a budget',
        choice: 'Both free offers, on the same task',
        reason:
          'Five million tokens at DeepSeek and a base model at ChatGPT let you compare on a real deliverable without a subscription.',
        limit:
          'A free test proves neither production cost nor quality at volume. Record the rework needed, not just the first answer.',
      },
    ],
    criteria: [
      {
        title: 'Pricing model',
        a: 'Usage-based billing per million input and output tokens.',
        b: 'Monthly subscription per account, with API billed separately per token.',
        takeaway:
          'If volume is hard to predict, a subscription caps spending; if volume is steady and controlled, the API brings it down.',
        source: 1,
      },
      {
        title: 'Entry cost',
        a: '5M free tokens at signup, no credit card required.',
        b: 'Free plan with a base model and limited usage.',
        takeaway:
          'Both let you start at zero. DeepSeek’s credit is consumed; ChatGPT’s free plan remains available while quotas last.',
        source: 3,
      },
      {
        title: 'Cost in use',
        a: 'V4 Flash off-peak: $0.14/M input, $0.28/M output. V4 Pro: $0.435 and $0.87. Flash cache hit: $0.003/M.',
        b: 'Go $8/month, Plus $20/month, Pro $200/month. API billed separately per token.',
        takeaway:
          'Compare a real month: a $20 Plus plan is roughly 70 million Flash input tokens off-peak, before caching.',
        source: 1,
      },
      {
        title: 'App and interface',
        a: 'API first; the chat interface is not the core product.',
        b: 'Web, mobile and desktop, with projects, custom GPTs and deep research.',
        takeaway:
          'For a person working in an interface, ChatGPT delivers the service; for a service calling a model, the interface does not matter.',
        source: 3,
      },
      {
        title: 'Ecosystem',
        a: 'Standard REST API with few proprietary integrations.',
        b: 'Connectors, custom GPTs, projects, image generation and analysis tools.',
        takeaway:
          'A broad ecosystem cuts integration time, but adds dependencies and plan costs to check.',
        source: 3,
      },
      {
        title: 'Data and compliance',
        a: 'Chinese provider; processing and retention terms need review.',
        b: 'US provider; terms, region and enterprise options need review.',
        takeaway:
          'Neither removes the need for a review: the question is not “who is safer”, but “which agreement covers my data”.',
        source: 2,
      },
      {
        title: 'Quality on your workload',
        a: 'Vendor-published performance, to be confirmed on your corpus.',
        b: 'Quality varies by model and plan; to be confirmed on your corpus.',
        takeaway:
          'No ToolTrim benchmark is presented here. Twenty representative prompts beat a general leaderboard.',
        source: 4,
      },
      {
        title: 'Volume and latency',
        a: 'Distinct peak and off-peak rates; caching lowers the cost of stable prompts.',
        b: 'Time-window quotas in the app; the API has its own rate limits.',
        takeaway:
          'A pipeline running overnight is not comparable to an assistant used during the day: the billing period changes the result.',
        source: 1,
      },
      {
        title: 'Support and documentation',
        a: 'Technical docs and community support, with no vendor support contract.',
        b: 'Docs, help centre and support depending on the plan; team plans add options.',
        takeaway:
          'For a production integration, response time during an outage matters as much as token price. Check the support channel before depending on the service.',
        source: 2,
      },
      {
        title: 'Portability',
        a: 'Prompts and answers are reusable, but the integration must be rewritten if you change API.',
        b: 'Conversation and project export, with limits depending on the plan and format.',
        takeaway:
          'An API vendor cannot be swapped like an app: keep an abstraction layer if the model may change.',
        source: 4,
      },
      {
        title: 'Commitment and billing',
        a: 'No subscription: you pay for what you consume, with a starting credit.',
        b: 'Monthly or annual subscription, with quotas and cancellation terms to check.',
        takeaway:
          'A free credit can hide the real cost: model a monthly invoice before choosing, and check what happens when you exceed the quota.',
        source: 3,
      },
    ],
    prices: [
      {
        label: 'Prototype without commitment',
        a: '5M free tokens, no credit card.',
        b: 'Free plan: base model, limited usage.',
        note: 'Start with the same use case on both sides. A free credit does not renew.',
      },
      {
        label: 'Regular individual use',
        a: 'Usage-based API: $0.14 to $0.87/M depending on model and period.',
        b: 'Go $8/month, Plus $20/month, Pro $200/month.',
        note: 'DeepSeek’s amount depends entirely on volume; ChatGPT’s subscription is fixed, but quotas remain capped.',
      },
      {
        label: 'Team or product',
        a: 'No seats: the bill follows token consumption.',
        b: 'Per-seat team plans, or API billed separately.',
        note: 'For a team, compare cost per person and cost per use: the two models do not overlap.',
      },
    ],
    priceNote:
      'Prices checked on 25 September 2026 in the ToolTrim catalogue, from official pages [1–4]. DeepSeek separates peak and off-peak rates and applies a 95% discount on cached input tokens for Flash. ChatGPT prices are in US dollars, before tax; API usage is billed separately. Confirm current terms before subscribing.',
    switching: [
      {
        title: 'Keep',
        text: 'Your assistant or integration handles the load and cost stays under control? Change nothing: switching providers costs rework and testing.',
      },
      {
        title: 'Replace',
        text: 'A recurring blocker — quota, cost, missing feature — justifies a comparative test on your own prompts. Measure errors, latency and correction time before moving.',
      },
      {
        title: 'Complement',
        text: 'A subscription for daily work and an API for batch processing can coexist. Keep both only if the uses are genuinely distinct.',
      },
    ],
    trial: [
      'Pick ten prompts that represent your work: a summary, an extraction, a rewrite, a hard case.',
      'Run them on DeepSeek and ChatGPT with the same instructions and files. Record the model and plan used.',
      'Count factual errors, required edits and correction time, not just how smooth the first answer felt.',
      'Cost the month at your real volume: tokens consumed on one side, subscription and overages on the other.',
    ],
    faq: [
      {
        question: 'Is DeepSeek really free?',
        answer:
          'Signup includes 5 million tokens without a credit card, valid across models. Beyond that, the API is billed per token. It is a starter credit, not a permanent free plan like ChatGPT’s.',
      },
      {
        question: 'Can DeepSeek replace ChatGPT day to day?',
        answer:
          'Not for the same job. ChatGPT provides the app, projects and built-in tools; DeepSeek provides an API and a model. If you work in an interface, the replacement is not direct.',
      },
      {
        question: 'Do you need to code to use DeepSeek?',
        answer:
          'For the API, yes: you handle requests, keys, errors and billing. If you want an assistant without integration, ChatGPT or Gemini are a better fit.',
      },
      {
        question: 'Which one is cheaper?',
        answer:
          'It depends on volume and period. At low volume, ChatGPT’s free plan may be enough. At steady, automated volume, DeepSeek’s per-token price, especially with caching and off-peak rates, can be much lower. Run the numbers on your actual tokens.',
      },
      {
        question: 'Is my data protected?',
        answer:
          'This page cannot answer that for you. DeepSeek is a Chinese provider and OpenAI a US provider; both have processing and retention terms to review. For sensitive data, have your organisation approve the vendor and the contract.',
      },
      {
        question: 'What happens when the 5 million tokens run out?',
        answer:
          'The welcome credit does not renew. You must add a payment method to keep calling the API, and the bill then follows actual consumption. Watch the balance before starting a large batch.',
      },
      {
        question: 'Is DeepSeek suitable for production?',
        answer:
          'The API can run in production, but it requires error handling, rate-limit and cost management, plus a fallback plan if the service is unavailable. For critical use, compare support and guarantees with a vendor under contract.',
      },
    ],
    alternatives: [
      { slug: 'claude', name: 'Claude', reason: 'For work centred on long documents and file analysis.' },
      { slug: 'gemini', name: 'Gemini', reason: 'To stay within Google’s environment and team quotas.' },
      { slug: 'perplexity', name: 'Perplexity', reason: 'To find and verify sources rather than produce a deliverable.' },
    ],
    sources: deepseekChatgptSources,
  },
};

const notionTrelloSources = [
  { label: 'Notion — plans et tarifs', url: 'https://www.notion.com/pricing' },
  { label: 'Notion — centre d’aide', url: 'https://www.notion.com/help' },
  { label: 'Trello — plans et tarifs', url: 'https://trello.com/pricing' },
  { label: 'Trello — support Atlassian', url: 'https://support.atlassian.com/trello/' },
];

export const notionTrelloGuides: Record<'fr' | 'en', ComparisonDecisionGuide> = {
  fr: {
    checkedAt: '2026-11-12',
    scope: 'Organisation et suivi de projet · indépendants et petites équipes · tarifs relevés le 25 septembre 2026',
    intro:
      'Notion et Trello partagent des cases à cocher et des cartes, mais ne rangent pas la même chose : Notion documente et structure l’information, Trello fait avancer des tâches visibles. La question n’est pas lequel est le plus complet, mais ce que votre équipe doit retrouver dans six mois.',
    scenarios: [
      {
        situation: 'Vous documentez des processus et des décisions',
        choice: 'Notion',
        reason:
          'Les pages imbriquées, les bases de données et les vues transforment une procédure en espace consultable : brief, compte rendu, wiki, checklist au même endroit.',
        limit:
          'La liberté de structure se paie en temps de mise en place. Sans convention d’équipe, l’espace devient un fouillis de pages dupliquées.',
      },
      {
        situation: 'Vous suivez une production visuelle',
        choice: 'Trello',
        reason:
          'Un tableau Kanban se comprend en trente secondes : une carte par livrable, des colonnes qui disent où en est le travail, des glisser-déposer sans formation.',
        limit:
          'Trello reste un modèle de cartes et de listes. Dès qu’il faut des dépendances, des sous-projets ou des rapports, il faut ajouter des Power-Ups ou changer d’outil.',
      },
      {
        situation: 'Vous travaillez seul',
        choice: 'Notion, sur le plan gratuit',
        reason:
          'Le plan gratuit autorise des pages et des blocs illimités pour un usage individuel : notes, projets et base de connaissances tiennent dans un seul espace.',
        limit:
          'Les limites de pages s’appliquent dès que l’espace compte plus d’un membre, et l’historique des pages reste limité à sept jours.',
      },
      {
        situation: 'Vous animez une petite équipe',
        choice: 'Comparez le coût par personne',
        reason:
          'Trello inclut jusqu’à dix collaborateurs sur son plan gratuit ; Notion limite son plan gratuit à partir de deux membres et facture ensuite par siège.',
        limit:
          'Le nombre de collaborateurs ne dit rien de la structure dont vous avez besoin. Une équipe qui documente beaucoup paiera Notion ; une équipe qui livre surtout des tâches restera sur Trello.',
      },
      {
        situation: 'Vos tâches deviennent des données',
        choice: 'Notion',
        reason:
          'Une base de données avec des propriétés, des filtres, des tris et des relations permet de suivre des clients, des contenus ou des candidatures sans tableur séparé.',
        limit:
          'Notion n’est pas un outil de gestion de projet spécialisé : les dépendances, la charge et le reporting restent plus légers que dans un outil dédié.',
      },
    ],
    criteria: [
      {
        title: 'Structure',
        a: 'Pages, blocs et bases de données reliées ; la structure se construit librement.',
        b: 'Tableaux, listes et cartes ; la structure est imposée par le Kanban.',
        takeaway:
          'Notion s’adapte à un processus existant ; Trello impose un processus simple et lisible. Choisissez celui que l’équipe suivra vraiment.',
        source: 1,
      },
      {
        title: 'Documentation',
        a: 'Point fort : wiki, comptes rendus, procédures et contexte au même endroit.',
        b: 'Limitée : les descriptions vivent dans les cartes, sans vraie base documentaire.',
        takeaway:
          'Si le travail doit être expliqué et transmis, Notion évite un outil séparé ; si tout est déjà dans les cartes, Trello suffit.',
        source: 2,
      },
      {
        title: 'Suivi visuel',
        a: 'Possible avec les vues tableau et Kanban, mais moins immédiat.',
        b: 'Point fort : le tableau est le produit, pas une vue parmi d’autres.',
        takeaway:
          'Pour une réunion de suivi ou un flux de production, Trello se met en place plus vite et se lit sans explication.',
        source: 3,
      },
      {
        title: 'Collaboration',
        a: 'Commentaires, mentions et permissions par page ; les invités sont limités sur le gratuit.',
        b: 'Membres par tableau, cartes assignées, commentaires et activité.',
        takeaway:
          'Les deux couvrent le travail à plusieurs. Vérifiez surtout les droits des invités et la façon dont vous partagez des documents sensibles.',
        source: 1,
      },
      {
        title: 'Automatisations',
        a: 'Formules, boutons et automatisations selon le plan ; les agents IA sont facturés en crédits.',
        b: 'Butler intégré : 250 exécutions par mois sur le gratuit, 1 000 sur Standard.',
        takeaway:
          'Pour des règles simples, Butler évite un outil supplémentaire. Pour des enchaînements complexes, le coût et les limites de chaque plan décident.',
        source: 3,
      },
      {
        title: 'Offre gratuite',
        a: 'Pages illimitées pour un individu, fichiers de 5 Mo, historique de 7 jours, 10 invités.',
        b: '10 tableaux, 10 collaborateurs, cartes illimitées, 250 exécutions Butler, 10 Mo par fichier.',
        takeaway:
          'Le gratuit de Trello est plus généreux pour une petite équipe ; celui de Notion est plus complet pour une personne seule.',
        source: 1,
      },
      {
        title: 'Prix payant',
        a: 'Plus à 9,50 €/mois par utilisateur en facturation annuelle (11,50 € sans engagement).',
        b: 'Standard à 5 $/mois par utilisateur en annuel (6 $ sans engagement) ; Premium à 12,50 $/mois.',
        takeaway:
          'À cinq personnes, l’écart de prix devient significatif. Comparez le total annuel, pas le prix d’appel affiché.',
        source: 3,
      },
      {
        title: 'Sortie et dépendance',
        a: 'Export HTML, Markdown et CSV disponible sur tous les plans.',
        b: 'Export JSON et CSV ; les automatisations et Power-Ups restent liés à l’écosystème Atlassian.',
        takeaway:
          'Un export lisible ne garantit pas une migration sans perte : testez les relations, les pièces jointes et l’historique avant de vous engager.',
        source: 2,
      },
      {
        title: 'Recherche',
        a: 'Recherche globale dans les pages et les bases ; les résultats dépendent de la qualité des titres et des propriétés.',
        b: 'Recherche par carte et filtres par tableau ; la recherche transverse reste limitée.',
        takeaway:
          'Une documentation utile est une documentation qu’on retrouve. Nommez les pages et les cartes de façon stable, sinon la recherche ne compensera pas le désordre.',
        source: 2,
      },
      {
        title: 'Reporting',
        a: 'Vues filtrées, regroupements et formules pour compter ou suivre des statuts.',
        b: 'Vues de tableau et Power-Ups ; les rapports avancés demandent souvent une extension.',
        takeaway:
          'Si vous devez produire un point hebdomadaire, testez la vue avant de choisir : un rapport difficile à maintenir finit par ne plus être mis à jour.',
        source: 3,
      },
      {
        title: 'Passage à l’échelle',
        a: 'Les performances se dégradent avec les bases très volumineuses et les permissions complexes.',
        b: 'Le nombre de tableaux et de cartes reste gérable, mais la lecture d’un grand espace devient difficile.',
        takeaway:
          'Pensez à dans six mois : une structure qui tient pour trois projets peut devenir un labyrinthe pour trente. Archivez et nommez dès le départ.',
        source: 1,
      },
    ],
    prices: [
      {
        label: 'Gratuit',
        a: 'Pages et blocs illimités pour un individu ; 10 invités ; fichiers de 5 Mo ; historique de 7 jours.',
        b: '10 tableaux et 10 collaborateurs ; cartes illimitées ; 250 exécutions Butler ; 10 Mo par fichier.',
        note: 'Pour une personne seule, Notion va plus loin. Pour une équipe de moins de dix personnes, Trello reste gratuit plus longtemps.',
      },
      {
        label: 'Individuel payant',
        a: 'Plus : 9,50 €/mois par utilisateur en annuel, 11,50 € sans engagement.',
        b: 'Standard : 5 $/mois par utilisateur en annuel, 6 $ sans engagement.',
        note: 'Les devises et les taxes diffèrent : convertissez au même moment et ajoutez les frais applicables.',
      },
      {
        label: 'Équipe',
        a: 'Plus facturé par siège ; les agents IA et fonctions avancées peuvent ajouter des coûts.',
        b: 'Standard à 5 $/siège, Premium à 12,50 $/siège pour les vues avancées et l’automatisation étendue.',
        note: 'Un tableau partagé avec des invités ne coûte pas un siège ; vérifiez la règle exacte de facturation de chaque outil.',
      },
    ],
    priceNote:
      'Tarifs relevés le 25 septembre 2026 dans le catalogue ToolTrim, à partir des pages officielles [1–4]. Notion affiche ses prix en euros avec un tarif annuel et un tarif sans engagement ; Trello affiche ses prix en dollars américains. Les deux grilles changent selon le nombre de sièges et les options ; vérifiez le total au paiement, taxes comprises.',
    switching: [
      {
        title: 'Garder',
        text: 'Votre équipe retrouve ses documents et fait avancer ses tâches sans friction ? Gardez l’outil. Une migration coûte plus cher que quelques fonctions manquantes.',
      },
      {
        title: 'Remplacer',
        text: 'Si le travail est surtout documentaire et que Trello déborde de cartes, ou si Notion sert de tableau Kanban coûteux, testez l’autre sur un projet réel avant de basculer.',
      },
      {
        title: 'Compléter',
        text: 'Notion pour la mémoire du projet et Trello pour la production peuvent cohabiter, à condition d’une règle claire sur ce qui vit où. Sans cette règle, vous aurez deux sources de vérité.',
      },
    ],
    trial: [
      'Prenez un projet terminé et reconstruisez-le dans les deux outils : une page de contexte, cinq tâches, deux responsables.',
      'Demandez à une personne qui ne connaît pas l’outil de retrouver une décision et l’état d’une tâche. Chronométrez.',
      'Comptez le temps de mise en place, le nombre de clics pour mettre à jour une carte et les fonctions qu’il a fallu ajouter.',
      'Projetez le coût annuel à votre nombre réel de sièges, options et invités compris.',
    ],
    faq: [
      {
        question: 'Notion peut-il remplacer Trello ?',
        answer:
          'Oui pour un suivi simple, avec une base de données en vue Kanban. Non si votre équipe a besoin d’un tableau immédiat, de règles Butler ou d’une lecture sans formation : Notion demande une structure et une discipline que Trello n’exige pas.',
      },
      {
        question: 'Trello peut-il remplacer Notion ?',
        answer:
          'Pour des tâches et des checklists, oui. Pour un wiki, des procédures, des comptes rendus et des bases reliées, non : les descriptions de cartes ne remplacent pas une documentation structurée.',
      },
      {
        question: 'Lequel est le moins cher ?',
        answer:
          'Trello est moins cher par siège en paid, et son plan gratuit couvre jusqu’à dix collaborateurs. Notion devient plus intéressant si vous remplacez plusieurs outils par un seul espace. Comparez le total, pas l’abonnement isolé.',
      },
      {
        question: 'Faut-il payer pour travailler à deux ?',
        answer:
          'Chez Notion, les limites de pages du plan gratuit s’appliquent dès deux membres : le plan Plus devient vite nécessaire. Chez Trello, deux personnes restent dans le gratuit. C’est souvent ce seul point qui décide pour un duo.',
      },
      {
        question: 'Peut-on migrer sans perdre ses données ?',
        answer:
          'Les deux outils exportent, mais aucun export ne restitue automatiquement les relations, les automatisations et l’historique. Testez la migration sur un projet, pas sur l’espace entier, et gardez une copie avant de supprimer quoi que ce soit.',
      },
      {
        question: 'Peut-on gérer des projets clients dans Notion ou Trello ?',
        answer:
          'Oui pour un suivi simple : une page ou un tableau par client, des statuts et des documents. Pour des dizaines de clients avec des droits différents, un outil spécialisé ou une base correctement filtrée devient nécessaire. Vérifiez surtout qui peut voir quoi.',
      },
      {
        question: 'Que se passe-t-il si l’équipe grandit ?',
        answer:
          'Les coûts par siège augmentent et les conventions de nommage deviennent critiques. Notion absorbe mieux la croissance documentaire, Trello reste plus simple pour une équipe qui exécute. Dans les deux cas, prévoyez une personne responsable de la structure.',
      },
    ],
    alternatives: [
      { slug: 'obsidian', name: 'Obsidian', reason: 'Pour des notes personnelles en fichiers locaux, sans dépendance à un service.' },
      { slug: 'asana', name: 'Asana', reason: 'Pour des projets avec dépendances, responsables et reporting plus structuré.' },
      { slug: 'clickup', name: 'ClickUp', reason: 'Pour réunir docs, tâches et vues dans un outil unique, au prix d’une configuration plus lourde.' },
    ],
    sources: notionTrelloSources,
  },
  en: {
    checkedAt: '2026-11-12',
    scope: 'Organisation and project tracking · freelancers and small teams · prices checked on 25 September 2026',
    intro:
      'Notion and Trello share checkboxes and cards, but they store different things: Notion documents and structures information, Trello moves visible tasks forward. The question is not which is more complete, but what your team must still find in six months.',
    scenarios: [
      {
        situation: 'You document processes and decisions',
        choice: 'Notion',
        reason:
          'Nested pages, databases and views turn a procedure into a searchable space: brief, minutes, wiki and checklist in one place.',
        limit:
          'Freedom of structure costs setup time. Without team conventions, the workspace becomes a mess of duplicated pages.',
      },
      {
        situation: 'You track visual production',
        choice: 'Trello',
        reason:
          'A Kanban board is understood in thirty seconds: one card per deliverable, columns that show where work stands, drag and drop with no training.',
        limit:
          'Trello remains a card-and-list model. As soon as you need dependencies, sub-projects or reports, you add Power-Ups or change tools.',
      },
      {
        situation: 'You work alone',
        choice: 'Notion, on the free plan',
        reason:
          'The free plan allows unlimited pages and blocks for individual use: notes, projects and a knowledge base fit in one workspace.',
        limit:
          'Page limits apply as soon as the workspace has more than one member, and page history stays limited to seven days.',
      },
      {
        situation: 'You run a small team',
        choice: 'Compare the cost per person',
        reason:
          'Trello includes up to ten collaborators on its free plan; Notion limits its free plan from two members and then charges per seat.',
        limit:
          'Headcount says nothing about the structure you need. A documentation-heavy team will pay for Notion; a task-driven team can stay on Trello.',
      },
      {
        situation: 'Your tasks become data',
        choice: 'Notion',
        reason:
          'A database with properties, filters, sorts and relations tracks clients, content or applications without a separate spreadsheet.',
        limit:
          'Notion is not a dedicated project management tool: dependencies, workload and reporting stay lighter than in a specialised product.',
      },
    ],
    criteria: [
      {
        title: 'Structure',
        a: 'Pages, blocks and linked databases; structure is built freely.',
        b: 'Boards, lists and cards; the Kanban model imposes the structure.',
        takeaway:
          'Notion adapts to an existing process; Trello imposes a simple, legible one. Choose the one the team will actually follow.',
        source: 1,
      },
      {
        title: 'Documentation',
        a: 'Strength: wiki, minutes, procedures and context in one place.',
        b: 'Limited: descriptions live in cards, with no real document base.',
        takeaway:
          'If work must be explained and handed over, Notion avoids a separate tool; if everything is already in cards, Trello is enough.',
        source: 2,
      },
      {
        title: 'Visual tracking',
        a: 'Possible with table and Kanban views, but less immediate.',
        b: 'Strength: the board is the product, not one view among many.',
        takeaway:
          'For a stand-up or a production flow, Trello is faster to set up and readable without explanation.',
        source: 3,
      },
      {
        title: 'Collaboration',
        a: 'Comments, mentions and page permissions; guests are limited on the free plan.',
        b: 'Board members, assigned cards, comments and activity.',
        takeaway:
          'Both cover teamwork. Check guest rights and how you share sensitive documents above all.',
        source: 1,
      },
      {
        title: 'Automation',
        a: 'Formulas, buttons and automations depending on the plan; AI agents are billed in credits.',
        b: 'Built-in Butler: 250 runs per month free, 1,000 on Standard.',
        takeaway:
          'For simple rules, Butler avoids another tool. For complex chains, each plan’s cost and limits decide.',
        source: 3,
      },
      {
        title: 'Free plan',
        a: 'Unlimited pages for one person, 5 MB files, 7-day history, 10 guests.',
        b: '10 boards, 10 collaborators, unlimited cards, 250 Butler runs, 10 MB per file.',
        takeaway:
          'Trello’s free plan is more generous for a small team; Notion’s is more complete for a solo worker.',
        source: 1,
      },
      {
        title: 'Paid pricing',
        a: 'Plus at €9.50/user/month billed yearly (€11.50 flexible).',
        b: 'Standard at $5/user/month yearly ($6 flexible); Premium at $12.50/month.',
        takeaway:
          'At five people, the gap becomes significant. Compare the annual total, not the advertised entry price.',
        source: 3,
      },
      {
        title: 'Exit and lock-in',
        a: 'HTML, Markdown and CSV export available on every plan.',
        b: 'JSON and CSV export; automations and Power-Ups remain tied to Atlassian’s ecosystem.',
        takeaway:
          'A readable export does not guarantee a lossless migration: test relations, attachments and history before committing.',
        source: 2,
      },
      {
        title: 'Search',
        a: 'Global search across pages and databases; results depend on how well titles and properties are maintained.',
        b: 'Card search and board filters; cross-board search remains limited.',
        takeaway:
          'Useful documentation is documentation you can find. Name pages and cards consistently, or search will not make up for the mess.',
        source: 2,
      },
      {
        title: 'Reporting',
        a: 'Filtered views, groupings and formulas to count or track statuses.',
        b: 'Table views and Power-Ups; advanced reports often need an extension.',
        takeaway:
          'If you need a weekly update, test the view before choosing: a report that is hard to maintain stops being updated.',
        source: 3,
      },
      {
        title: 'Scaling',
        a: 'Performance degrades with very large databases and complex permissions.',
        b: 'Board and card counts stay manageable, but reading a large workspace becomes difficult.',
        takeaway:
          'Think six months ahead: a structure that works for three projects can become a maze for thirty. Archive and name from day one.',
        source: 1,
      },
    ],
    prices: [
      {
        label: 'Free',
        a: 'Unlimited pages and blocks for one person; 10 guests; 5 MB files; 7-day history.',
        b: '10 boards and 10 collaborators; unlimited cards; 250 Butler runs; 10 MB per file.',
        note: 'For one person, Notion goes further. For a team under ten, Trello stays free longer.',
      },
      {
        label: 'Paid individual',
        a: 'Plus: €9.50/user/month yearly, €11.50 flexible.',
        b: 'Standard: $5/user/month yearly, $6 flexible.',
        note: 'Currencies and taxes differ: convert at the same date and add applicable fees.',
      },
      {
        label: 'Team',
        a: 'Plus billed per seat; AI agents and advanced features can add cost.',
        b: 'Standard at $5/seat, Premium at $12.50/seat for advanced views and extended automation.',
        note: 'A board shared with guests does not cost a seat; check each tool’s exact billing rule.',
      },
    ],
    priceNote:
      'Prices checked on 25 September 2026 in the ToolTrim catalogue, from official pages [1–4]. Notion lists prices in euros with annual and flexible billing; Trello lists prices in US dollars. Both grids change with seats and options; confirm the total at checkout, taxes included.',
    switching: [
      {
        title: 'Keep',
        text: 'Does your team find its documents and move tasks without friction? Keep the tool. A migration costs more than a few missing features.',
      },
      {
        title: 'Replace',
        text: 'If the work is mostly documentation and Trello is overflowing with cards, or if Notion is being used as an expensive Kanban board, test the other on a real project before switching.',
      },
      {
        title: 'Complement',
        text: 'Notion for project memory and Trello for production can coexist, provided there is a clear rule about what lives where. Without it, you get two sources of truth.',
      },
    ],
    trial: [
      'Take a finished project and rebuild it in both tools: one context page, five tasks, two owners.',
      'Ask someone unfamiliar with the tool to find a decision and the status of a task. Time them.',
      'Count setup time, clicks needed to update a card, and features you had to add.',
      'Project the annual cost at your real seat count, options and guests included.',
    ],
    faq: [
      {
        question: 'Can Notion replace Trello?',
        answer:
          'Yes for simple tracking, using a database in Kanban view. No if your team needs an immediate board, Butler rules or a no-training read: Notion requires structure and discipline that Trello does not.',
      },
      {
        question: 'Can Trello replace Notion?',
        answer:
          'For tasks and checklists, yes. For a wiki, procedures, minutes and linked databases, no: card descriptions do not replace structured documentation.',
      },
      {
        question: 'Which one is cheaper?',
        answer:
          'Trello is cheaper per paid seat, and its free plan covers up to ten collaborators. Notion becomes more attractive if you replace several tools with one workspace. Compare the total, not the subscription alone.',
      },
      {
        question: 'Do you have to pay to work as a pair?',
        answer:
          'In Notion, free-plan page limits apply from two members, so Plus quickly becomes necessary. In Trello, two people stay free. That single point often decides for a duo.',
      },
      {
        question: 'Can you migrate without losing data?',
        answer:
          'Both tools export, but no export automatically restores relations, automations and history. Test the migration on one project, not the whole workspace, and keep a copy before deleting anything.',
      },
      {
        question: 'Can you manage client projects in Notion or Trello?',
        answer:
          'Yes for simple tracking: one page or board per client, statuses and documents. For dozens of clients with different access rights, a specialised tool or a properly filtered database becomes necessary. Check who can see what above all.',
      },
      {
        question: 'What happens as the team grows?',
        answer:
          'Per-seat costs rise and naming conventions become critical. Notion absorbs documentation growth better, while Trello stays simpler for a team that executes. In both cases, appoint one person responsible for structure.',
      },
      {
        question: 'Which one works better for a client portal?',
        answer:
          'Notion can publish a page or share a workspace with guests, which suits a small client area with documents and status updates. Trello can invite a client to a board, but the card view gives less context. In both cases, check what guests can see, edit and export before opening access.',
      },
    ],
    alternatives: [
      { slug: 'obsidian', name: 'Obsidian', reason: 'For personal notes in local files, without dependence on a service.' },
      { slug: 'asana', name: 'Asana', reason: 'For projects with dependencies, owners and more structured reporting.' },
      { slug: 'clickup', name: 'ClickUp', reason: 'To combine docs, tasks and views in one tool, at the cost of heavier setup.' },
    ],
    sources: notionTrelloSources,
  },
};

const shopifyWooSources = [
  { label: 'Shopify — plans et tarifs', url: 'https://www.shopify.com/pricing' },
  { label: 'Shopify — centre d’aide', url: 'https://help.shopify.com/en/manual' },
  { label: 'WooCommerce — fonctions', url: 'https://woocommerce.com/features/' },
  { label: 'WooCommerce — documentation', url: 'https://woocommerce.com/documentation/' },
];

export const shopifyWooGuides: Record<'fr' | 'en', ComparisonDecisionGuide> = {
  fr: {
    checkedAt: '2026-11-12',
    scope: 'Plateformes e-commerce · créateurs, indépendants et petites marques · tarifs US observés le 25 septembre 2026',
    intro:
      'Shopify vend un produit fini ; WooCommerce vend un plugin gratuit qui vous laisse la charge du reste. La comparaison ne porte donc pas sur le prix affiché, mais sur le coût complet et sur la personne qui maintiendra la boutique.',
    scenarios: [
      {
        situation: 'Vous voulez vendre vite, sans technique',
        choice: 'Shopify',
        reason:
          'Hébergement, paiement, thème, gestion des commandes et support sont fournis. Une boutique peut être en ligne sans installer ni maintenir d’infrastructure.',
        limit:
          'Vous payez un abonnement et, selon la passerelle, des frais de transaction. La personnalisation profonde reste limitée sans développement.',
      },
      {
        situation: 'Vous avez déjà un site WordPress',
        choice: 'WooCommerce',
        reason:
          'Le plugin s’installe sur un site existant et transforme le catalogue en boutique, sans reconstruire votre présence en ligne ni perdre votre contenu.',
        limit:
          'Le plugin est gratuit, mais l’hébergement, le thème, les extensions de paiement et de livraison, puis leur maintenance, restent à votre charge.',
      },
      {
        situation: 'Vous vendez aussi en boutique physique',
        choice: 'Shopify',
        reason:
          'Le point de vente et la vente omnicanale font partie de la plateforme : stock, commandes et clients se suivent entre le web et le comptoir.',
        limit:
          'Chaque canal et chaque application ajoutent des coûts. Vérifiez le matériel, les commissions et les fonctions incluses dans votre offre.',
      },
      {
        situation: 'Vous avez besoin d’un contrôle total du code',
        choice: 'WooCommerce',
        reason:
          'Le code est ouvert et le site vous appartient : thème, fonctions, extensions et hébergement se choisissent sans passer par une place de marché.',
        limit:
          'Ce contrôle suppose une personne capable de mettre à jour, sécuriser et sauvegarder le site. Sans elle, le coût caché devient un risque.',
      },
      {
        situation: 'Vous refusez les commissions de plateforme',
        choice: 'WooCommerce, avec un calcul complet',
        reason:
          'WooCommerce ne prélève pas de commission sur le chiffre d’affaires : vous payez l’hébergement et les extensions, pas un pourcentage des ventes.',
        limit:
          'Les frais de transaction de la passerelle de paiement restent dus. Comparez le coût fixe de Woo au coût variable de Shopify sur votre volume réel.',
      },
    ],
    criteria: [
      {
        title: 'Modèle',
        a: 'Plateforme hébergée, tout-en-un, facturée par abonnement.',
        b: 'Plugin open source sur un site WordPress que vous hébergez.',
        takeaway:
          'Shopify loue un service complet ; WooCommerce fournit une brique et vous laisse assembler le reste. Le choix est d’abord un choix de responsabilité.',
        source: 1,
      },
      {
        title: 'Coût d’entrée',
        a: 'Basic à 39 $/mois, avec un essai gratuit selon l’offre en cours.',
        b: 'Plugin de base gratuit ; l’hébergement et le domaine restent à payer.',
        takeaway:
          'Le prix affiché de Woo est trompeur : le vrai point de comparaison est le budget mensuel complet, hébergement et extensions compris.',
        source: 3,
      },
      {
        title: 'Coût complet',
        a: 'Abonnement + applications + frais de transaction selon la passerelle.',
        b: 'Hébergement + thème + extensions + maintenance + passerelle de paiement.',
        takeaway:
          'À faible volume, Shopify est prévisible. À volume élevé, Woo peut devenir moins cher, mais seulement si quelqu’un absorbe la maintenance.',
        source: 1,
      },
      {
        title: 'Personnalisation',
        a: 'Thèmes et applications ; le code profond reste encadré.',
        b: 'Contrôle complet du thème, des fonctions et de la base de données.',
        takeaway:
          'Une personnalisation forte n’a de valeur que si elle sert le parcours d’achat. Sinon, elle ajoute de la dette technique.',
        source: 4,
      },
      {
        title: 'Paiement',
        a: 'Shop Pay et Shopify Payments intégrés ; des frais s’appliquent hors passerelle Shopify.',
        b: 'Plus de 140 passerelles régionales, dont Stripe et PayPal, à configurer.',
        takeaway:
          'Vérifiez les moyens de paiement attendus par vos clients et le coût de chaque passerelle avant de comparer les abonnements.',
        source: 3,
      },
      {
        title: 'Applications et extensions',
        a: 'Plus de 21 000 applications, avec un coût récurrent à additionner.',
        b: 'Un catalogue d’extensions payantes pour les fonctions absentes du plugin de base.',
        takeaway:
          'Dans les deux cas, les applications sont le poste caché. Listez les cinq fonctions indispensables et chiffrez-les avant de choisir.',
        source: 1,
      },
      {
        title: 'Maintenance et support',
        a: 'Mises à jour, sécurité et support inclus dans l’abonnement.',
        b: 'Mises à jour, sécurité, sauvegardes et support assurés par vous ou votre prestataire.',
        takeaway:
          'Si personne ne peut intervenir en cas de panne, le « gratuit » de Woo devient le choix le plus risqué.',
        source: 2,
      },
      {
        title: 'International et fiscalité',
        a: 'Devises, taxes et marchés configurables depuis l’administration.',
        b: 'Taxes et devises via des extensions et la configuration WordPress.',
        takeaway:
          'Pour vendre dans plusieurs pays, comptez le temps de configuration et le coût des extensions fiscales, pas seulement la devise affichée.',
        source: 4,
      },
      {
        title: 'Design et thèmes',
        a: 'Thèmes payants ou gratuits, personnalisation encadrée ; le rendu reste cohérent sans développement.',
        b: 'Thèmes WordPress nombreux, mais la qualité et la compatibilité avec Woo varient fortement.',
        takeaway:
          'Un beau thème ne suffit pas : vérifiez le parcours de commande sur mobile et le temps de chargement avant de le retenir.',
        source: 1,
      },
      {
        title: 'Sécurité et sauvegardes',
        a: 'Infrastructure, correctifs et sauvegardes gérés par la plateforme.',
        b: 'Correctifs WordPress, extensions, sauvegardes et restauration à organiser soi-même.',
        takeaway:
          'Une boutique sans sauvegarde testée n’a pas de sauvegarde. Si personne ne peut restaurer un site, ce risque doit entrer dans le calcul.',
        source: 2,
      },
      {
        title: 'Évolution du catalogue',
        a: 'Import et export de produits, variantes et collections depuis l’administration.',
        b: 'Import CSV et extensions pour les catalogues volumineux ou les fonctions avancées.',
        takeaway:
          'Testez un import de cinquante produits avec variantes et images : c’est souvent là que le temps de mise en place se révèle.',
        source: 4,
      },
    ],
    prices: [
      {
        label: 'Démarrage',
        a: 'Basic : 39 $/mois. Essai gratuit selon l’offre en cours.',
        b: 'Plugin gratuit, mais hébergement WordPress et domaine à prévoir.',
        note: 'Le prix de Woo affiché à 0 $ ne correspond pas au budget de lancement : ajoutez l’hébergement, un thème et les extensions indispensables.',
      },
      {
        label: 'Coût récurrent réel',
        a: 'Abonnement + applications + frais de transaction de la passerelle.',
        b: 'Hébergement + extensions + maintenance + frais de la passerelle.',
        note: 'Faites le calcul sur douze mois avec votre volume de commandes et vos cinq applications principales.',
      },
      {
        label: 'Équipe et charge',
        a: 'Support et infrastructure inclus ; le temps interne sert au commerce.',
        b: 'Un prestataire ou du temps interne pour les mises à jour, la sécurité et les sauvegardes.',
        note: 'Si vous devez payer un développeur pour maintenir Woo, ajoutez ce coût au budget avant de conclure que Woo est moins cher.',
      },
    ],
    priceNote:
      'Tarifs relevés le 25 septembre 2026 dans le catalogue ToolTrim, à partir des pages officielles [1–4]. Shopify Basic est affiché à 39 $/mois ; les frais de transaction dépendent de la passerelle et du pays. WooCommerce ne publie pas de prix unique : le coût dépend de l’hébergement, du thème, des extensions et de la maintenance. Vérifiez les conditions et les taxes au paiement.',
    switching: [
      {
        title: 'Garder',
        text: 'Votre boutique vend, les coûts restent lisibles et personne ne passe ses week-ends sur les mises à jour ? Gardez la plateforme en place.',
      },
      {
        title: 'Remplacer',
        text: 'Une migration change les URLs, les redirections, les données clients et les intégrations de paiement. Testez-la sur une copie, avec un plan de redirection, avant de basculer.',
      },
      {
        title: 'Compléter',
        text: 'Garder Shopify pour le web et Woo pour un catalogue existant crée deux sources de stock et de commandes. Ne le faites que si les activités sont réellement séparées.',
      },
    ],
    trial: [
      'Listez les cinq fonctions sans lesquelles vous ne pouvez pas vendre : paiement, livraison, TVA, stock, e-mails.',
      'Chiffrez-les dans les deux scénarios : applications Shopify d’un côté, extensions et hébergement Woo de l’autre, sur douze mois.',
      'Passez une commande de test complète, remboursement compris, et vérifiez les e-mails, la facture et la synchronisation du stock.',
      'Estimez le temps mensuel de maintenance et le coût d’un prestataire si vous ne pouvez pas l’assurer vous-même.',
    ],
    faq: [
      {
        question: 'WooCommerce est-il vraiment gratuit ?',
        answer:
          'Le plugin de base est gratuit, mais une boutique en production a besoin d’un hébergement, d’un nom de domaine, d’un thème et souvent d’extensions payantes. Le coût réel est celui de cet ensemble, plus la maintenance.',
      },
      {
        question: 'Shopify est-il trop cher pour une petite boutique ?',
        answer:
          'Cela dépend de votre volume et du temps que vous pouvez consacrer à la technique. À faible volume, l’abonnement peut sembler élevé ; à volume plus fort, les frais de transaction et les commissions deviennent le point à surveiller.',
      },
      {
        question: 'Peut-on migrer de WooCommerce vers Shopify ?',
        answer:
          'Oui, avec un import du catalogue et des clients, mais les URLs, les redirections, les abonnements et les intégrations doivent être refaits. Prévoyez une période de recouvrement et testez les paiements avant la bascule.',
      },
      {
        question: 'Lequel est meilleur pour le SEO ?',
        answer:
          'WooCommerce s’appuie sur WordPress et ses extensions SEO ; Shopify fournit des bases solides mais impose sa structure d’URL. Dans les deux cas, le contenu produit, la vitesse et les redirections comptent plus que la plateforme.',
      },
      {
        question: 'Faut-il un développeur pour WooCommerce ?',
        answer:
          'Pas pour installer le plugin, mais oui pour les mises à jour, la sécurité, les sauvegardes et les personnalisations. Si personne ne peut assumer ce rôle, Shopify réduit le risque opérationnel.',
      },
      {
        question: 'Combien coûte réellement la première année ?',
        answer:
          'Additionnez l’abonnement ou l’hébergement, le thème, les extensions ou applications, la passerelle de paiement et le temps de mise en place. Les deux plateformes ont un coût caché ; seule une liste de cinq fonctions indispensables permet de comparer des totaux comparables.',
      },
      {
        question: 'Peut-on vendre des abonnements ou des services ?',
        answer:
          'Les deux écosystèmes proposent des extensions ou applications pour les abonnements, les réservations et les services. Vérifiez la disponibilité dans votre pays, le coût récurrent et la compatibilité avec votre moyen de paiement avant de promettre une offre à vos clients.',
      },
    ],
    alternatives: [
      { slug: 'wix', name: 'Wix', reason: 'Pour un site vitrine avec une boutique simple, sans gérer d’hébergement.' },
      { slug: 'squarespace', name: 'Squarespace', reason: 'Pour une marque visuelle qui veut un site et une boutique très intégrés.' },
      { slug: 'woocommerce', name: 'WooCommerce', reason: 'À reconsidérer si vous avez déjà un site WordPress et une personne pour le maintenir.' },
    ],
    sources: shopifyWooSources,
  },
  en: {
    checkedAt: '2026-11-12',
    scope: 'E-commerce platforms · creators, freelancers and small brands · US prices observed on 25 September 2026',
    intro:
      'Shopify sells a finished product; WooCommerce sells a free plugin and leaves you the rest. The comparison is therefore not about the advertised price, but about total cost and who will maintain the store.',
    scenarios: [
      {
        situation: 'You want to sell fast, without technical work',
        choice: 'Shopify',
        reason:
          'Hosting, payments, themes, order management and support are included. A store can go live without installing or maintaining infrastructure.',
        limit:
          'You pay a subscription and, depending on the gateway, transaction fees. Deep customisation stays limited without development.',
      },
      {
        situation: 'You already have a WordPress site',
        choice: 'WooCommerce',
        reason:
          'The plugin installs on an existing site and turns the catalogue into a store without rebuilding your online presence or losing content.',
        limit:
          'The plugin is free, but hosting, theme, payment and shipping extensions, then their maintenance, remain your responsibility.',
      },
      {
        situation: 'You also sell in a physical shop',
        choice: 'Shopify',
        reason:
          'Point of sale and omnichannel selling are part of the platform: stock, orders and customers follow each other between web and counter.',
        limit:
          'Each channel and app adds cost. Check hardware, fees and the features included in your plan.',
      },
      {
        situation: 'You need full control of the code',
        choice: 'WooCommerce',
        reason:
          'The code is open and the site is yours: theme, features, extensions and hosting are chosen without a marketplace.',
        limit:
          'That control requires someone able to update, secure and back up the site. Without them, the hidden cost becomes a risk.',
      },
      {
        situation: 'You refuse platform commissions',
        choice: 'WooCommerce, with a full calculation',
        reason:
          'WooCommerce takes no commission on revenue: you pay for hosting and extensions, not a percentage of sales.',
        limit:
          'Payment gateway fees still apply. Compare Woo’s fixed cost with Shopify’s variable cost at your actual volume.',
      },
    ],
    criteria: [
      {
        title: 'Model',
        a: 'Hosted, all-in-one platform billed by subscription.',
        b: 'Open-source plugin on a WordPress site you host.',
        takeaway:
          'Shopify rents a complete service; WooCommerce provides a building block and lets you assemble the rest. The choice is first a choice of responsibility.',
        source: 1,
      },
      {
        title: 'Entry cost',
        a: 'Basic at $39/month, with a free trial depending on the current offer.',
        b: 'Free core plugin; hosting and domain still cost money.',
        takeaway:
          'Woo’s advertised price is misleading: the real comparison is the full monthly budget, hosting and extensions included.',
        source: 3,
      },
      {
        title: 'Total cost',
        a: 'Subscription + apps + transaction fees depending on the gateway.',
        b: 'Hosting + theme + extensions + maintenance + payment gateway.',
        takeaway:
          'At low volume, Shopify is predictable. At high volume, Woo can cost less, but only if someone absorbs the maintenance.',
        source: 1,
      },
      {
        title: 'Customisation',
        a: 'Themes and apps; deep code changes remain constrained.',
        b: 'Full control of theme, features and database.',
        takeaway:
          'Heavy customisation only pays if it improves the purchase path. Otherwise it adds technical debt.',
        source: 4,
      },
      {
        title: 'Payments',
        a: 'Shop Pay and Shopify Payments built in; fees apply outside Shopify’s gateway.',
        b: '140+ regional gateways, including Stripe and PayPal, to configure.',
        takeaway:
          'Check the payment methods your customers expect and the cost of each gateway before comparing subscriptions.',
        source: 3,
      },
      {
        title: 'Apps and extensions',
        a: '21,000+ apps, with recurring costs to add up.',
        b: 'A catalogue of paid extensions for features missing from the core plugin.',
        takeaway:
          'In both cases, apps are the hidden line item. List the five essential features and price them before choosing.',
        source: 1,
      },
      {
        title: 'Maintenance and support',
        a: 'Updates, security and support included in the subscription.',
        b: 'Updates, security, backups and support handled by you or your contractor.',
        takeaway:
          'If nobody can step in when the site breaks, Woo’s “free” becomes the riskiest choice.',
        source: 2,
      },
      {
        title: 'International and tax',
        a: 'Currencies, taxes and markets configurable from the admin.',
        b: 'Taxes and currencies through extensions and WordPress configuration.',
        takeaway:
          'To sell in several countries, count setup time and tax extension costs, not just the displayed currency.',
        source: 4,
      },
      {
        title: 'Design and themes',
        a: 'Free or paid themes with constrained customisation; rendering stays consistent without development.',
        b: 'Many WordPress themes, but quality and WooCommerce compatibility vary widely.',
        takeaway:
          'A good-looking theme is not enough: check the mobile checkout flow and load time before choosing it.',
        source: 1,
      },
      {
        title: 'Security and backups',
        a: 'Infrastructure, patches and backups managed by the platform.',
        b: 'WordPress and extension patches, backups and restoration are yours to organise.',
        takeaway:
          'A store without a tested backup has no backup. If nobody can restore a site, that risk belongs in the calculation.',
        source: 2,
      },
      {
        title: 'Catalogue growth',
        a: 'Product, variant and collection import and export from the admin.',
        b: 'CSV import and extensions for large catalogues or advanced features.',
        takeaway:
          'Test an import of fifty products with variants and images: that is often where setup time reveals itself.',
        source: 4,
      },
    ],
    prices: [
      {
        label: 'Starting out',
        a: 'Basic: $39/month. Free trial depending on the current offer.',
        b: 'Free plugin, but WordPress hosting and a domain are required.',
        note: 'Woo’s $0 headline is not the launch budget: add hosting, a theme and essential extensions.',
      },
      {
        label: 'Real recurring cost',
        a: 'Subscription + apps + gateway transaction fees.',
        b: 'Hosting + extensions + maintenance + gateway fees.',
        note: 'Run the twelve-month calculation with your order volume and your five main apps.',
      },
      {
        label: 'Team and workload',
        a: 'Support and infrastructure included; internal time goes to commerce.',
        b: 'A contractor or internal time for updates, security and backups.',
        note: 'If you must pay a developer to maintain Woo, add that cost before concluding that Woo is cheaper.',
      },
    ],
    priceNote:
      'Prices checked on 25 September 2026 in the ToolTrim catalogue, from official pages [1–4]. Shopify Basic is listed at $39/month; transaction fees depend on gateway and country. WooCommerce publishes no single price: cost depends on hosting, theme, extensions and maintenance. Confirm terms and taxes at checkout.',
    switching: [
      {
        title: 'Keep',
        text: 'Your store sells, costs stay legible and nobody spends weekends on updates? Keep the platform in place.',
      },
      {
        title: 'Replace',
        text: 'A migration changes URLs, redirects, customer data and payment integrations. Test it on a copy, with a redirect plan, before switching.',
      },
      {
        title: 'Complement',
        text: 'Keeping Shopify for the web and Woo for an existing catalogue creates two sources of stock and orders. Do it only if the businesses are genuinely separate.',
      },
    ],
    trial: [
      'List the five features without which you cannot sell: payment, shipping, tax, stock, emails.',
      'Price them in both scenarios: Shopify apps on one side, Woo extensions and hosting on the other, over twelve months.',
      'Place a complete test order, refund included, and check emails, invoice and stock sync.',
      'Estimate monthly maintenance time and the cost of a contractor if you cannot handle it yourself.',
    ],
    faq: [
      {
        question: 'Is WooCommerce really free?',
        answer:
          'The core plugin is free, but a production store needs hosting, a domain, a theme and often paid extensions. The real cost is that bundle, plus maintenance.',
      },
      {
        question: 'Is Shopify too expensive for a small store?',
        answer:
          'It depends on volume and on how much time you can give to technical work. At low volume the subscription may feel high; at higher volume, transaction fees and commissions become the line to watch.',
      },
      {
        question: 'Can you migrate from WooCommerce to Shopify?',
        answer:
          'Yes, with a catalogue and customer import, but URLs, redirects, subscriptions and integrations must be rebuilt. Plan an overlap period and test payments before switching.',
      },
      {
        question: 'Which is better for SEO?',
        answer:
          'WooCommerce relies on WordPress and its SEO extensions; Shopify provides solid foundations but imposes its URL structure. In both cases, product content, speed and redirects matter more than the platform.',
      },
      {
        question: 'Do you need a developer for WooCommerce?',
        answer:
          'Not to install the plugin, but yes for updates, security, backups and customisations. If nobody can take that role, Shopify reduces operational risk.',
      },
      {
        question: 'Do apps and extensions change the total cost?',
        answer:
          'Yes, and they are the most underestimated line in both scenarios. Shopify apps usually bill monthly per store, while Woo extensions can be annual licences with renewal fees. List the five features your store cannot run without, price them for twelve months, then compare the two totals rather than the platform subscription alone.',
      },
      {
        question: 'What does the first year really cost?',
        answer:
          'Add the subscription or hosting, theme, extensions or apps, payment gateway and setup time. Both platforms have a hidden cost; only a list of five essential features lets you compare like for like.',
      },
      {
        question: 'Can you sell subscriptions or services?',
        answer:
          'Both ecosystems offer extensions or apps for subscriptions, bookings and services. Check availability in your country, recurring cost and compatibility with your payment method before promising an offer to customers.',
      },
      {
        question: 'Which platform is easier to hand over to a client?',
        answer:
          'Shopify hands over an account with support and a predictable admin. WooCommerce hands over a WordPress site that the client must host, update and secure, or pay someone to do so. If the client has no technical contact, Shopify lowers the handover risk.',
      },
    ],
    alternatives: [
      { slug: 'wix', name: 'Wix', reason: 'For a brochure site with a simple store, without managing hosting.' },
      { slug: 'squarespace', name: 'Squarespace', reason: 'For a visual brand that wants a tightly integrated site and store.' },
      { slug: 'woocommerce', name: 'WooCommerce', reason: 'Worth reconsidering if you already run WordPress and have someone to maintain it.' },
    ],
    sources: shopifyWooSources,
  },
};

export const pilotComparisonGuides: Record<string, Record<'fr' | 'en', ComparisonDecisionGuide>> = {
  'deepseek-vs-chatgpt': deepseekChatgptGuides,
  'notion-vs-trello': notionTrelloGuides,
  'shopify-vs-woocommerce': shopifyWooGuides,
};
