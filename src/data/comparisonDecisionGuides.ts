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
