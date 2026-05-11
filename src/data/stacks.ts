export const STACKS_VERSION = "2026-05-10";
export type StackPersona = "dev" | "designer" | "consultant" | "content" | "ops" | "solo";
export type StackStage = "starter" | "lean" | "scale";
export type StackBudget = "free" | "under50" | "under150";
export type StackToolDecision = "core" | "conditional" | "challenge";
export type StackSubProfile =
  | "ui-ux"
  | "brand"
  | "photo"
  | "video"
  | "motion"
  | "interior-design"
  | "illustration"
  | "art-direction"
  | "web"
  | "copywriting"
  | "newsletter"
  | "podcast"
  | "social-content"
  | "seo"
  | "crm-sales"
  | "client-delivery"
  | "training"
  | "research"
  | "automation"
  | "operations"
  | "ecommerce"
  | "product"
  | "analytics"
  | "ai-coding"
  | "no-code"
  | "admin"
  | "agency";

export interface StackToolSlot {
  role: string;
  roleEn: string;
  slug: string;
  decision?: StackToolDecision;
  tip?: string;
  tipEn?: string;
  reason: string;
  reasonEn: string;
}

export interface StackCheckpoint {
  q: string;
  qEn: string;
  hint: string;
  hintEn: string;
}

export interface StackInsight {
  title: string;
  titleEn: string;
  detail: string;
  detailEn: string;
}

export interface StackGuide {
  id: string;
  slug: string;
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  persona: StackPersona;
  subProfiles: StackSubProfile[];
  stage: StackStage;
  budget: StackBudget;
  monthlyBudget: number;
  savings: number;
  risk: string;
  riskEn: string;
  bestFor: string;
  bestForEn: string;
  avoidIf: string;
  avoidIfEn: string;
  editorial: string;
  editorialEn: string;
  needs?: StackInsight[];
  maturitySignals?: StackInsight[];
  traps?: StackInsight[];
  checkpoints: StackCheckpoint[];
  tools: StackToolSlot[];
}

export interface StackUseCase {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  toolSlugs: string[];
  workflow: string[];
  workflowEn: string[];
}

export const STACK_PERSONAS: { value: StackPersona | "all"; label: string; labelEn: string }[] = [
  { value: "all", label: "Tous", labelEn: "All" },
  { value: "dev", label: "Dev freelance", labelEn: "Freelance dev" },
  { value: "designer", label: "Designer", labelEn: "Designer" },
  { value: "consultant", label: "Consultant", labelEn: "Consultant" },
  { value: "content", label: "Créateur contenu", labelEn: "Content creator" },
  { value: "ops", label: "Ops / COO", labelEn: "Ops / COO" },
  { value: "solo", label: "Solo généraliste", labelEn: "Solo operator" },
];

export const STACK_STAGES: { value: StackStage | "all"; label: string; labelEn: string }[] = [
  { value: "all", label: "Tous niveaux", labelEn: "All stages" },
  { value: "starter", label: "Démarrage", labelEn: "Starter" },
  { value: "lean", label: "Optimisation", labelEn: "Optimization" },
  { value: "scale", label: "Structuration", labelEn: "Structuring" },
];

export const STACK_SUB_PROFILES: { value: StackSubProfile | "all"; label: string; labelEn: string; personas?: StackPersona[] }[] = [
  { value: "all", label: "Toutes spécialités", labelEn: "All specialties" },
  { value: "ui-ux", label: "UI/UX", labelEn: "UI/UX", personas: ["designer"] },
  { value: "brand", label: "Brand", labelEn: "Brand", personas: ["designer"] },
  { value: "photo", label: "Photo", labelEn: "Photo", personas: ["designer"] },
  { value: "video", label: "Vidéo", labelEn: "Video", personas: ["designer", "content"] },
  { value: "motion", label: "Motion", labelEn: "Motion", personas: ["designer"] },
  { value: "interior-design", label: "Architecture intérieure", labelEn: "Interior design", personas: ["designer"] },
  { value: "illustration", label: "Illustration", labelEn: "Illustration", personas: ["designer"] },
  { value: "art-direction", label: "Direction artistique", labelEn: "Art direction", personas: ["designer"] },
  { value: "web", label: "Web", labelEn: "Web", personas: ["designer", "dev"] },
  { value: "copywriting", label: "Rédaction", labelEn: "Writing", personas: ["content", "solo"] },
  { value: "newsletter", label: "Newsletter", labelEn: "Newsletter", personas: ["content"] },
  { value: "podcast", label: "Podcast", labelEn: "Podcast", personas: ["content"] },
  { value: "social-content", label: "Social content", labelEn: "Social content", personas: ["content", "ops"] },
  { value: "seo", label: "SEO", labelEn: "SEO", personas: ["consultant", "ops"] },
  { value: "crm-sales", label: "CRM / vente", labelEn: "CRM / sales", personas: ["consultant", "solo", "ops", "dev"] },
  { value: "client-delivery", label: "Mission client", labelEn: "Client delivery", personas: ["consultant", "solo", "dev", "ops"] },
  { value: "training", label: "Formation", labelEn: "Training", personas: ["consultant", "content"] },
  { value: "research", label: "Recherche / veille", labelEn: "Research", personas: ["consultant", "content"] },
  { value: "automation", label: "Automatisation", labelEn: "Automation", personas: ["ops", "solo", "dev"] },
  { value: "operations", label: "Ops", labelEn: "Ops", personas: ["ops", "consultant"] },
  { value: "ecommerce", label: "E-commerce", labelEn: "E-commerce", personas: ["ops"] },
  { value: "product", label: "Produit", labelEn: "Product", personas: ["dev", "ops"] },
  { value: "analytics", label: "Analytics", labelEn: "Analytics", personas: ["ops", "dev"] },
  { value: "ai-coding", label: "IA code", labelEn: "AI coding", personas: ["dev"] },
  { value: "no-code", label: "No-code", labelEn: "No-code", personas: ["solo", "dev"] },
  { value: "admin", label: "Admin / finance", labelEn: "Admin / finance", personas: ["solo", "consultant"] },
  { value: "agency", label: "Agence", labelEn: "Agency", personas: ["ops"] },
];

export const STACKS: StackGuide[] = [
  {
    id: "dev-shipper",
    slug: "developpeur-freelance-shipper",
    title: "Stack dev freelance",
    titleEn: "Freelance dev stack",
    subtitle: "La base recommandée pour coder, montrer une preview, documenter les décisions et encaisser sans adopter les outils d'une équipe produit.",
    subtitleEn: "For freelance devs who need to code, show previews, document, and get paid without paying for team tooling.",
    persona: "dev",
    subProfiles: ["web", "product", "client-delivery"],
    stage: "lean",
    budget: "under50",
    monthlyBudget: 32,
    savings: 58,
    risk: "Payer des outils conçus pour des équipes alors que tu travailles seul sur des missions ponctuelles.",
    riskEn: "Overpaying for AI and hosting before there is real client volume.",
    bestFor: "Sites clients, MVP, applications internes et maintenance freelance.",
    bestForEn: "Client websites, MVPs, internal apps, and freelance maintenance.",
    avoidIf: "Tu gères déjà une équipe produit avec une roadmap, du support et des astreintes.",
    avoidIfEn: "You already run a product team with roadmap, support, and on-call work.",
    editorial: "Linear et Jira sont conçus pour des équipes avec des sprints planifiés sur des mois. Pour un dev solo sur des projets clients de 4 à 12 semaines, un board Notion avec trois colonnes fait exactement le même travail — et le client peut y accéder sans créer de compte. La vraie règle : avant d'adopter un outil, nomme le problème précis qu'il résout. 'Rester organisé' n'est pas un problème, c'est une anxiété.",
    editorialEn: "Linear and Jira are designed for teams with sprints planned over months. For a solo dev on 4-to-12-week client projects, a Notion board with three columns does exactly the same work — and the client can access it without creating an account. The real rule: before adopting a tool, name the precise problem it solves. 'Staying organized' is not a problem, it is an anxiety.",
    needs: [
      { title: "Montrer le travail en cours", titleEn: "Show work in progress", detail: "Le client doit voir une vraie preview, pas une capture d'écran ni un zip. C'est le rôle de Vercel.", detailEn: "The client needs to see a real preview, not a screenshot or zip. That is Vercel's role." },
      { title: "Garder la trace des décisions", titleEn: "Keep decision history", detail: "Le risque d'une mission dev n'est pas l'absence d'outil projet, c'est le contexte perdu entre emails, calls et tickets.", detailEn: "The risk in dev projects is not missing PM software, it is losing context across emails, calls, and tickets." },
      { title: "Séparer code, specs et paiement", titleEn: "Separate code, specs, and payment", detail: "GitHub porte le code, Notion porte le contexte, Stripe porte l'encaissement. Mélanger les rôles rend la mission confuse.", detailEn: "GitHub holds code, Notion holds context, Stripe handles payment. Mixing roles makes the project messy." },
    ],
    maturitySignals: [
      { title: "Tu as plusieurs missions en parallèle", titleEn: "You run several projects in parallel", detail: "C'est le moment d'ajouter des statuts et des vues dans Notion, pas forcément Linear.", detailEn: "This is when you add statuses and views in Notion, not necessarily Linear." },
      { title: "Le client demande un suivi hebdo", titleEn: "The client asks for weekly tracking", detail: "Une page de statut partagée suffit tant que personne ne travaille à plein temps côté client.", detailEn: "A shared status page is enough while no one works full-time on the client side." },
    ],
    traps: [
      { title: "Jira / Linear trop tôt", titleEn: "Jira / Linear too early", detail: "Ces outils sont utiles quand il y a une équipe produit. En solo, ils ajoutent souvent plus de rituel que de clarté.", detailEn: "These tools help product teams. Solo, they often add more ritual than clarity." },
      { title: "Deux abonnements IA", titleEn: "Two AI subscriptions", detail: "ChatGPT plus un IDE IA peut se justifier. ChatGPT, Claude, Copilot et Cursor en même temps demandent un vrai usage mesuré.", detailEn: "ChatGPT plus an AI IDE can make sense. ChatGPT, Claude, Copilot, and Cursor together need measured usage." },
    ],
    checkpoints: [
      { q: "Tu envoies encore des captures d'écran par email pour montrer l'avancement ?", qEn: "Do you still send screenshots by email to show progress?", hint: "Oui → une preview Vercel partagée en lien direct remplace ça et garde l'historique des déploiements. Ton client voit la vraie chose, pas une photo.", hintEn: "Yes → a shared Vercel preview link replaces this and keeps deployment history. Your client sees the real thing, not a photo." },
      { q: "Tu as configuré un fichier .cursorrules dans tes projets IA ?", qEn: "Have you configured a .cursorrules file in your AI-assisted projects?", hint: "Non → tu réexpliques tes conventions et ton stack à Cursor ou ChatGPT à chaque session. 30 minutes de configuration = contexte automatique, qualité de réponse immédiatement meilleure.", hintEn: "No → you re-explain your conventions and tech stack to Cursor or ChatGPT every session. 30 minutes of setup = automatic context, immediately better response quality." },
      { q: "Ton client sait exactement où en est le projet sans te demander ?", qEn: "Does your client know exactly where the project stands without asking you?", hint: "Non → une page Notion partagée avec un statut mis à jour = 5 réunions de point évitées par projet. C'est aussi ce qui te protège contre le 'j'avais compris autre chose'.", hintEn: "No → a shared Notion page with an updated status = 5 check-in meetings avoided per project. It also protects you against 'I understood something different'." },
    ],
    tools: [
      { role: "Code et repo", roleEn: "Code and repo", slug: "github", reason: "Gratuit, standard client, suffisant pour versionner et livrer.", reasonEn: "Free, client-friendly, enough to version and ship." },
      { role: "Déploiement", roleEn: "Deployment", slug: "vercel", reason: "Le meilleur ratio vitesse/complexité pour front et petites apps.", reasonEn: "The best speed-to-complexity ratio for frontends and small apps." },
      { role: "Base de travail", roleEn: "Workspace", slug: "notion", reason: "Cahier des charges, specs et suivi sans outil PM lourd.", reasonEn: "Scope, specs, and tracking without a heavy PM tool." },
      { role: "IA", roleEn: "AI", slug: "chatgpt", reason: "Un seul abonnement IA généraliste suffit dans 80% des cas.", reasonEn: "One general AI subscription is enough in most cases." },
      { role: "Paiement", roleEn: "Payment", slug: "stripe", reason: "Simple pour factures et paiements internationaux.", reasonEn: "Simple for invoices and international payments." },
    ],
  },
  {
    id: "designer-solo",
    slug: "designer-freelance-solo",
    title: "Stack designer freelance",
    titleEn: "Freelance designer stack",
    subtitle: "La base recommandée pour maquettes, branding léger, feedback client, plugins Figma utiles et déclinaisons rapides sans suite créative dormante.",
    subtitleEn: "For solo designers who mostly deliver framing, mockups, feedback, and simple assets without paying for a full creative factory.",
    persona: "designer",
    subProfiles: ["ui-ux", "brand", "web"],
    stage: "lean",
    budget: "under50",
    monthlyBudget: 118,
    savings: 180,
    risk: "Payer la suite Adobe complète parce que tu as peur d'en avoir besoin un jour, alors que tu n'as pas ouvert Illustrator depuis trois semaines.",
    riskEn: "Paying for a full creative suite when the real flow is framing, design, feedback.",
    bestFor: "Branding, UX/UI, landing pages et audits design.",
    bestForEn: "Light branding, UX/UI, landing pages, and design audits.",
    avoidIf: "Tu fais de la vidéo, de la 3D ou de la production print lourde chaque semaine.",
    avoidIfEn: "You do video, 3D, or heavy print production every week.",
    editorial: "Figma a un plan gratuit qui couvre jusqu'à 3 projets actifs — beaucoup de solos paient le plan Pro (15€/mois) sans jamais utiliser le branching ni le dev mode. Le seul cas où Adobe reste difficile à contourner : Lightroom, si tu gères des milliers de photos avec des catalogues et des collections. Pour tout le reste, le plan Adobe Photography à 12€/mois (Photoshop + Lightroom seul) est souvent la seule chose à garder.",
    editorialEn: "Figma has a free plan that covers up to 3 active projects — many solos pay the Pro plan (€15/month) without ever using branching or dev mode. The only case where Adobe is hard to replace: Lightroom, if you manage thousands of photos with catalogs and collections. For everything else, the Adobe Photography plan at €12/month (Photoshop + Lightroom only) is often the only thing worth keeping.",
    needs: [
      { title: "Créer la source de vérité", titleEn: "Create the source of truth", detail: "Figma doit porter les maquettes, composants, commentaires et versions validées. Notion garde le brief et les décisions.", detailEn: "Figma should hold mockups, components, comments, and approved versions. Notion keeps the brief and decisions." },
      { title: "Produire vite sans casser la DA", titleEn: "Produce fast without breaking art direction", detail: "Canva est utile pour décliner. Il ne doit pas devenir un deuxième système créatif concurrent de Figma.", detailEn: "Canva helps with variations. It should not become a second creative system competing with Figma." },
      { title: "Rendre le feedback actionnable", titleEn: "Make feedback actionable", detail: "Le feedback doit être ancré dans l'écran, le moodboard ou la décision. Sinon l'outil ajoute du bruit.", detailEn: "Feedback must be anchored to the screen, moodboard, or decision. Otherwise the tool adds noise." },
    ],
    maturitySignals: [
      { title: "Plus de 3 projets actifs", titleEn: "More than 3 active projects", detail: "Le plan Figma payant devient logique si tu dépasses vraiment la limite gratuite ou si le dev mode sert chaque semaine.", detailEn: "Paid Figma makes sense if you truly exceed the free limit or use dev mode weekly." },
      { title: "Livrables multi-formats récurrents", titleEn: "Recurring multi-format deliverables", detail: "C'est le moment de garder Canva Pro. Avant ça, le gratuit suffit souvent.", detailEn: "That is when Canva Pro earns its place. Before that, free often works." },
    ],
    traps: [
      { title: "Adobe complet par sécurité", titleEn: "Full Adobe for reassurance", detail: "Garde Adobe seulement pour les fichiers, photos ou exports que tu traites vraiment chaque mois.", detailEn: "Keep Adobe only for files, photos, or exports you truly handle every month." },
      { title: "Loom payé sans usage client", titleEn: "Paid Loom without client use", detail: "Si le client ne regarde pas les vidéos ou si tu n'enregistres pas chaque semaine, le gratuit suffit.", detailEn: "If clients do not watch videos or you do not record weekly, free is enough." },
    ],
    checkpoints: [
      { q: "Tu es sur Figma Pro ou sur le plan gratuit ?", qEn: "Are you on Figma Pro or the free plan?", hint: "Pro → vérifie si tu utilises vraiment le branching et le dev mode. Le plan gratuit couvre 3 projets actifs, suffisant pour la plupart des solos. C'est 15€/mois économisés sans perte fonctionnelle réelle.", hintEn: "Pro → check if you actually use branching and dev mode. The free plan covers 3 active projects, enough for most solos. That is €15/month saved with no real functional loss." },
      { q: "Tu utilises Lightroom pour cataloguer tes photos ou juste pour les éditer ?", qEn: "Do you use Lightroom to catalog your photos or just to edit them?", hint: "Juste éditer → Luminar Neo en achat unique (~90€) ou Lightroom Mobile gratuit suffisent. La gestion de catalogue est la seule fonctionnalité sans vrai équivalent simple.", hintEn: "Just edit → Luminar Neo as a one-time purchase (~€90) or free Lightroom Mobile is enough. Catalog management is the only feature without a simple equivalent." },
      { q: "Tes clients commentent dans Figma ou dans des fils d'emails ?", qEn: "Do your clients comment in Figma or in email threads?", hint: "Email → les commentaires Figma ancrent le retour sur la zone exacte concernée. Un client formé en 10 minutes évite 2 allers-retours flous par semaine.", hintEn: "Email → Figma comments anchor feedback to the exact area being discussed. A client trained in 10 minutes avoids 2 vague back-and-forths per week." },
    ],
    tools: [
      { role: "Design source", roleEn: "Design source", slug: "figma", reason: "Maquettes, composants, prototypes, commentaires et handoff client.", reasonEn: "Mockups, components, prototypes, comments, and client handoff." },
      { role: "Plugin design system", roleEn: "Design system plugin", slug: "figma-tokens", reason: "Utile dès qu'un projet a des tokens, thèmes ou variables à maintenir.", reasonEn: "Useful once a project has tokens, themes, or variables to maintain." },
      { role: "Plugin icônes", roleEn: "Icon plugin", slug: "figma-iconify", reason: "Accélère la recherche d'icônes sans importer dix bibliothèques.", reasonEn: "Speeds icon search without importing ten libraries." },
      { role: "Plugin accessibilité", roleEn: "Accessibility plugin", slug: "figma-stark", reason: "Contrastes, daltonisme et lisibilité avant livraison client.", reasonEn: "Contrast, color blindness, and readability before client delivery." },
      { role: "Atelier / workshop", roleEn: "Workshop", slug: "miro", reason: "Cadrage, parcours, audit UX et ateliers avec clients.", reasonEn: "Scoping, journeys, UX audits, and client workshops." },
      { role: "Visuels rapides", roleEn: "Fast visuals", slug: "canva", reason: "Déclinaisons sociales, présentations et supports simples.", reasonEn: "Social variations, decks, and simple collateral." },
      { role: "Suite créative ciblée", roleEn: "Focused creative suite", slug: "adobe-photoshop", reason: "À garder si retouche photo ou exports PSD restent réels.", reasonEn: "Keep if photo retouching or PSD exports remain real." },
      { role: "Vectoriel ponctuel", roleEn: "Occasional vector work", slug: "adobe-illustrator", reason: "À garder seulement si fichiers AI client ou logo complexe reviennent souvent.", reasonEn: "Keep only if client AI files or complex logo work come up often." },
      { role: "Photo / catalogue", roleEn: "Photo / catalog", slug: "adobe-lightroom", reason: "Justifié si tu gères de vrais volumes photo, pas quelques retouches isolées.", reasonEn: "Justified if you manage real photo volume, not a few isolated edits." },
      { role: "Documentation", roleEn: "Documentation", slug: "notion", reason: "Briefs, moodboards, décisions, assets et comptes rendus.", reasonEn: "Briefs, moodboards, decisions, assets, and recaps." },
      { role: "Stockage client", roleEn: "Client storage", slug: "google-drive", reason: "Livrables finaux, exports lourds et dossiers partagés.", reasonEn: "Final deliverables, heavy exports, and shared folders." },
      { role: "Prototype web", roleEn: "Web prototype", slug: "framer", reason: "Pour tester une landing ou une interaction sans lancer un vrai build.", reasonEn: "To test a landing page or interaction without a full build." },
      { role: "Handoff avancé", roleEn: "Advanced handoff", slug: "zeplin", reason: "Optionnel si les devs ne travaillent pas directement dans Figma.", reasonEn: "Optional if developers do not work directly in Figma." },
      { role: "Feedback vidéo", roleEn: "Video feedback", slug: "loom", reason: "À garder si le feedback asynchrone évite vraiment des réunions.", reasonEn: "Keep if async feedback truly removes meetings." },
      { role: "IA rédaction / UX", roleEn: "Writing / UX AI", slug: "chatgpt", reason: "Aide sur microcopy, variantes d'angles, audits et synthèses.", reasonEn: "Helps with microcopy, angles, audits, and summaries." },
    ],
  },
  {
    id: "architecte-interieur-studio",
    slug: "architecte-interieur",
    title: "Stack architecte d'intérieur",
    titleEn: "Interior designer stack",
    subtitle: "La chaîne recommandée pour passer du brief au chantier : moodboard, plans 2D, 3D, rendus, sourcing, budget, validations et facturation.",
    subtitleEn: "The recommended chain from brief to site follow-up: moodboards, 2D plans, 3D, renders, sourcing, budget, approvals, and invoicing.",
    persona: "designer",
    subProfiles: ["interior-design", "art-direction", "client-delivery", "admin"],
    stage: "scale",
    budget: "under150",
    monthlyBudget: 148,
    savings: 260,
    risk: "Payer trop vite une stack BIM, plusieurs moteurs de rendu et des plugins jamais maîtrisés, alors que le vrai gain vient d'une chaîne claire entre modèle, rendu, sourcing et validation client.",
    riskEn: "Paying too early for BIM, several render engines, and unmanaged plugins when the real gain comes from a clear chain between model, render, sourcing, and client approval.",
    bestFor: "Architectes d'intérieur indépendants, décorateurs, studios résidentiels, retail léger et projets avec sourcing mobilier ou matières.",
    bestForEn: "Independent interior designers, decorators, residential studios, light retail projects, and jobs with furniture or material sourcing.",
    avoidIf: "Tes projets sont déjà en BIM lourd avec bureaux d'études, marchés publics et coordination technique avancée.",
    avoidIfEn: "Your projects already run on heavy BIM with engineering offices, public tenders, and advanced technical coordination.",
    editorial: "La bonne stack n'est pas celle qui produit la plus belle image isolée. C'est celle qui relie le brief, le modèle 3D, les plans, les validations, le sourcing, les achats et la facture. SketchUp reste le centre pour aller vite. LayOut transforme ce modèle en documents lisibles. D5 Render couvre le rendu quotidien. Programa ou Notion évitent que mobilier, matières, prix et décisions se dispersent dans Pinterest, mails et PDF.",
    editorialEn: "The right stack is not the one that produces the prettiest isolated image. It connects the brief, 3D model, plans, approvals, sourcing, purchases, and invoice. SketchUp remains the speed center. LayOut turns that model into readable documents. D5 Render covers daily rendering. Programa or Notion keeps furniture, materials, pricing, and decisions from spreading across Pinterest, emails, and PDFs.",
    needs: [
      { title: "Concevoir vite", titleEn: "Design fast", detail: "SketchUp Pro porte les volumes, les variantes et les scènes client. AutoCAD LT reste utile pour les plans 2D propres et les échanges DWG.", detailEn: "SketchUp Pro carries volumes, options, and client scenes. AutoCAD LT remains useful for clean 2D plans and DWG exchanges." },
      { title: "Présenter avec impact", titleEn: "Present with impact", detail: "D5 Render ou Enscape doivent transformer une intention en validation client rapide. V-Ray attend les images premium vendues comme livrable.", detailEn: "D5 Render or Enscape should turn intent into quick client approval. V-Ray waits for premium images sold as deliverables." },
      { title: "Piloter sourcing et budget", titleEn: "Run sourcing and budget", detail: "Programa, Notion ou un tableau structuré doivent suivre mobilier, luminaires, matières, prix, fournisseurs, statuts et arbitrages.", detailEn: "Programa, Notion, or a structured sheet must track furniture, lighting, materials, prices, suppliers, statuses, and trade-offs." },
    ],
    maturitySignals: [
      { title: "Plusieurs chantiers en parallèle", titleEn: "Several projects at once", detail: "Passe de Notion seul à Programa ou ClickUp si les validations, commandes et artisans deviennent difficiles à suivre.", detailEn: "Move from Notion alone to Programa or ClickUp when approvals, orders, and contractors become hard to follow." },
      { title: "Coordination technique régulière", titleEn: "Recurring technical coordination", detail: "Revit ou Archicad deviennent pertinents quand le projet impose BIM, bureaux d'études ou dossiers techniques lourds.", detailEn: "Revit or Archicad become relevant when projects require BIM, engineering offices, or heavier technical files." },
      { title: "Image comme valeur commerciale", titleEn: "Imagery as commercial value", detail: "V-Ray, Magnific ou Topaz se justifient si la qualité d'image aide vraiment à vendre le projet ou une prestation premium.", detailEn: "V-Ray, Magnific, or Topaz make sense if image quality truly helps sell the project or a premium service." },
    ],
    traps: [
      { title: "Plusieurs moteurs de rendu actifs", titleEn: "Several render engines active", detail: "D5, Enscape, Twinmotion et V-Ray en même temps coûtent vite cher. Choisis selon le livrable dominant : vitesse, visite, vidéo ou image premium.", detailEn: "D5, Enscape, Twinmotion, and V-Ray together get expensive fast. Choose by main deliverable: speed, walkthrough, video, or premium image." },
      { title: "BIM trop tôt", titleEn: "BIM too early", detail: "Revit ou Archicad sont puissants, mais lourds si tes projets restent résidentiels, rapides et peu coordonnés.", detailEn: "Revit or Archicad are powerful but heavy if your projects remain residential, fast, and lightly coordinated." },
      { title: "Sourcing non traçable", titleEn: "Untraceable sourcing", detail: "Pinterest inspire, mais ne valide rien. Chaque référence importante doit finir dans une fiche avec prix, fournisseur, statut et décision.", detailEn: "Pinterest inspires but approves nothing. Each important reference needs a record with price, supplier, status, and decision." },
    ],
    checkpoints: [
      { q: "Tes plans client et tes plans techniques repartent-ils du même modèle ?", qEn: "Do your client plans and technical plans come from the same model?", hint: "Non → SketchUp + LayOut évitent de refaire les vues à la main à chaque changement. Tu gagnes surtout sur les modifications tardives.", hintEn: "No → SketchUp + LayOut avoid redrawing views manually after each change. The gain is strongest on late revisions." },
      { q: "Tu sais où en est chaque meuble, matière et luminaire ?", qEn: "Do you know the status of every furniture piece, material, and light?", hint: "Non → Programa ou une base Notion dédiée doit suivre fournisseur, prix, statut client, commande et alternative.", hintEn: "No → Programa or a dedicated Notion database should track supplier, price, client status, order, and alternative." },
      { q: "Tu paies un outil parce qu'il est beau ou parce qu'il enlève une friction métier ?", qEn: "Do you pay for a tool because it looks good or because it removes a business friction?", hint: "Si la réponse est floue, garde l'outil en test projet par projet. Le rendu, le BIM et l'IA doivent répondre à un livrable précis.", hintEn: "If the answer is vague, keep the tool on a project-by-project test. Rendering, BIM, and AI must serve a precise deliverable." },
    ],
    tools: [
      { role: "Design / modélisation 3D", roleEn: "Design / 3D modeling", slug: "sketchup-pro", reason: "Le centre du workflow : volumes, variantes, scènes, mobilier et présentations rapides.", reasonEn: "The workflow center: volumes, options, scenes, furniture, and fast presentations." },
      { role: "Plans / dossiers 2D", roleEn: "Plans / 2D dossiers", slug: "layout-sketchup", reason: "Transforme le modèle SketchUp en plans, coupes, annotations et dossiers liés au projet.", reasonEn: "Turns the SketchUp model into plans, sections, annotations, and linked project documents." },
      { role: "Plans 2D / DWG", roleEn: "2D plans / DWG", slug: "autocad-lt", reason: "À garder pour les plans précis, échanges artisans, bureaux d'études et fichiers DWG.", reasonEn: "Keep for precise plans, contractor exchanges, engineering offices, and DWG files." },
      { role: "Rendu quotidien", roleEn: "Daily rendering", slug: "d5-render", reason: "Rapide, visuel, connecté aux outils 3D majeurs et très adapté aux validations client.", reasonEn: "Fast, visual, connected to major 3D tools, and well suited to client approvals." },
      { role: "Rendu rapide", roleEn: "Fast rendering", slug: "enscape", decision: "conditional", reason: "Très bon si la priorité est la visite en temps réel et la présentation immédiate.", reasonEn: "Great when the priority is real-time walkthroughs and immediate presentation." },
      { role: "Image premium", roleEn: "Premium imagery", slug: "v-ray", decision: "conditional", reason: "À activer si le photoréalisme devient une prestation vendue ou un vrai avantage commercial.", reasonEn: "Use when photorealism becomes a sold deliverable or a real commercial edge." },
      { role: "Vidéo / ambiance", roleEn: "Video / atmosphere", slug: "twinmotion", decision: "conditional", reason: "Utile pour parcours, vidéos et mise en scène immersive sans pipeline trop lourd.", reasonEn: "Useful for walkthroughs, videos, and immersive staging without a heavy pipeline." },
      { role: "Plugin SketchUp", roleEn: "SketchUp plugin", slug: "fredo6-bundle", reason: "Base très utile pour travailler plus vite : formes, arrondis, détails et corrections.", reasonEn: "A very useful base to work faster on forms, roundovers, details, and fixes." },
      { role: "Plugin profils", roleEn: "Profile plugin", slug: "profile-builder-3", reason: "Excellent pour plinthes, corniches, tasseaux, rails, cadres et éléments répétitifs.", reasonEn: "Excellent for skirting, cornices, battens, rails, frames, and repeated elements." },
      { role: "Plugin imports 3D", roleEn: "3D import plugin", slug: "transmutr", reason: "Optimise les modèles téléchargés pour éviter les fichiers SketchUp trop lourds.", reasonEn: "Optimizes downloaded models to avoid overly heavy SketchUp files." },
      { role: "Plugin scène", roleEn: "Scene plugin", slug: "skatter", decision: "conditional", reason: "Ajoute végétation, livres, objets répétés et ambiance sans tout poser à la main.", reasonEn: "Adds vegetation, books, repeated objects, and atmosphere without placing everything manually." },
      { role: "Hygiène modèle", roleEn: "Model hygiene", slug: "cleanup3", reason: "Nettoie les fichiers et évite les modèles qui ralentissent toute la production.", reasonEn: "Cleans files and prevents models from slowing the whole production chain." },
      { role: "Contrôle géométrie", roleEn: "Geometry control", slug: "solid-inspector2", reason: "Repère les problèmes de volumes avant export, rendu ou fabrication.", reasonEn: "Finds solid issues before export, rendering, or fabrication." },
      { role: "Formes complexes", roleEn: "Complex forms", slug: "rhino", decision: "conditional", reason: "À ajouter pour mobilier sur-mesure, courbes, escaliers, banques d'accueil ou pièces sculpturales.", reasonEn: "Add for custom furniture, curves, staircases, reception desks, or sculptural pieces." },
      { role: "Image / assets", roleEn: "Image / assets", slug: "blender", decision: "conditional", reason: "Puissant pour l'image, l'animation et les assets, mais pas forcément le coeur métier.", reasonEn: "Powerful for imagery, animation, and assets, but not necessarily the business core." },
      { role: "BIM technique", roleEn: "Technical BIM", slug: "revit", decision: "conditional", reason: "Pertinent pour coordination, bureaux d'études, gros dossiers et logique BIM.", reasonEn: "Relevant for coordination, engineering offices, larger files, and BIM logic." },
      { role: "BIM architecture", roleEn: "Architecture BIM", slug: "archicad", decision: "conditional", reason: "Alternative BIM solide quand les projets dépassent le simple aménagement intérieur.", reasonEn: "A strong BIM alternative when projects go beyond simple interior fit-out." },
      { role: "Retouche image", roleEn: "Image retouching", slug: "adobe-photoshop", reason: "Nettoyage, prolongement, corrections de rendu, moodboards et présentations.", reasonEn: "Cleanup, extension, render fixes, moodboards, and presentations." },
      { role: "Retouche IA", roleEn: "AI retouching", slug: "firefly", reason: "Pratique dans le flux Adobe pour nettoyer, compléter ou varier des visuels.", reasonEn: "Useful inside Adobe flows to clean, extend, or vary visuals." },
      { role: "Dossier client", roleEn: "Client dossier", slug: "indesign", reason: "Pour dossiers concept, planches, avant-projets et documents plus éditoriaux.", reasonEn: "For concept books, boards, early design packages, and more editorial documents." },
      { role: "IA structure", roleEn: "Structure AI", slug: "chatgpt", reason: "Brief, comptes rendus, planning, livrables, mails client et clarification des arbitrages.", reasonEn: "Briefs, recaps, planning, deliverables, client emails, and trade-off clarification." },
      { role: "IA ambiance", roleEn: "Mood AI", slug: "krea-ai", reason: "Explore vite des matières, lumières, styles et variantes d'intérieur à partir d'images.", reasonEn: "Quickly explores materials, lighting, styles, and interior variations from images." },
      { role: "Exploration visuelle", roleEn: "Visual exploration", slug: "midjourney", decision: "conditional", reason: "Utile pour directions visuelles et moodboards conceptuels, pas pour valider un plan technique.", reasonEn: "Useful for visual directions and concept moodboards, not for validating a technical plan." },
      { role: "Upscale rendu", roleEn: "Render upscale", slug: "magnific-ai", decision: "conditional", reason: "À réserver aux visuels finaux qui doivent vraiment gagner en impact.", reasonEn: "Reserve for final visuals that truly need extra impact." },
      { role: "Moodboard", roleEn: "Moodboard", slug: "milanote", reason: "Simple pour rassembler références, ambiance, premières intentions et retours client.", reasonEn: "Simple for gathering references, mood, early intent, and client feedback." },
      { role: "Recherche visuelle", roleEn: "Visual research", slug: "pinterest", reason: "Indispensable pour inspiration, matières, détails et discussion client en amont.", reasonEn: "Essential for inspiration, materials, details, and early client discussion." },
      { role: "Bibliothèque images", roleEn: "Image library", slug: "eagle", reason: "Classe références, textures, détails, plans et images sans dépendre d'un board social.", reasonEn: "Organizes references, textures, details, plans, and images without depending on a social board." },
      { role: "Sourcing FF&E", roleEn: "FF&E sourcing", slug: "programa", reason: "Pensé pour mobilier, matières, fournisseurs, fiches produits, validations et commandes.", reasonEn: "Built for furniture, materials, suppliers, product sheets, approvals, and orders." },
      { role: "Projet / décisions", roleEn: "Project / decisions", slug: "notion", reason: "Cockpit des briefs, tâches, comptes rendus, budgets, artisans et validations.", reasonEn: "Cockpit for briefs, tasks, recaps, budgets, contractors, and approvals." },
      { role: "Fichiers / emails", roleEn: "Files / email", slug: "google-workspace", reason: "Drive, Gmail, Calendar, Docs et Sheets restent la base d'échange la plus simple.", reasonEn: "Drive, Gmail, Calendar, Docs, and Sheets remain the simplest exchange base." },
      { role: "Explication client", roleEn: "Client explanation", slug: "loom", reason: "Pour commenter un plan, un rendu ou une décision sans ajouter une réunion.", reasonEn: "To comment on a plan, render, or decision without adding a meeting." },
      { role: "Rendez-vous", roleEn: "Scheduling", slug: "calendly", decision: "conditional", reason: "Utile si les prises de rendez-vous créent trop d'allers-retours.", reasonEn: "Useful when scheduling creates too much back-and-forth." },
      { role: "Facturation", roleEn: "Billing", slug: "indy", reason: "Très adapté aux indépendants pour devis, factures, suivi et déclarations.", reasonEn: "Well suited to independents for quotes, invoices, tracking, and declarations." },
      { role: "Compte pro", roleEn: "Business account", slug: "qonto", reason: "Compte pro, justificatifs, cartes, virements et suivi des flux.", reasonEn: "Business account, receipts, cards, transfers, and cash-flow tracking." },
      { role: "Signature", roleEn: "Signature", slug: "yousign", reason: "Devis, contrats, lettres de mission et validations client signés proprement.", reasonEn: "Quotes, contracts, engagement letters, and client approvals signed cleanly." },
      { role: "Compta société", roleEn: "Company accounting", slug: "pennylane", decision: "conditional", reason: "À envisager quand la structure grossit ou travaille avec un expert-comptable.", reasonEn: "Consider when the structure grows or works with an accountant." },
    ],
  },
  {
      "id": "scenographe-evenementiel",
      "slug": "scenographe-evenementiel",
      "title": "Stack scénographe",
      "titleEn": "Scenographer stack",
      "subtitle": "La chaîne pour passer d’un concept narratif à un espace produit : moodboard, plans, 3D, rendu, budget, fournisseurs et dossier client.",
      "subtitleEn": "A chain from narrative concept to produced space: moodboard, plans, 3D, render, budget, suppliers, and client deck.",
      "persona": "designer",
      "subProfiles": [
          "interior-design",
          "art-direction",
          "client-delivery"
      ],
      "stage": "scale",
      "budget": "under150",
      "monthlyBudget": 142,
      "savings": 230,
      "risk": "Multiplier rendu, 3D, présentation et gestion projet sans garder une source claire pour les décisions de production.",
      "riskEn": "Multiplying render, 3D, presentation, and project management tools without one clear source for production decisions.",
      "bestFor": "Scénographies d’événement, salons, expositions, conférences, festivals et activations de marque.",
      "bestForEn": "Event scenography, trade shows, exhibitions, conferences, festivals, and brand activations.",
      "avoidIf": "Tu fais seulement des moodboards conceptuels sans plans, production ni coordination fournisseur.",
      "avoidIfEn": "You only create concept moodboards without plans, production, or supplier coordination.",
      "editorial": "Le bon stack de scénographe doit relier intention, espace et production. SketchUp ou Vectorworks portent le volume, D5 ou Twinmotion rendent l’intention lisible, InDesign ou Figma structure le dossier client, Notion garde décisions, budget et fournisseurs. Le piège : produire de belles images qui ne disent pas comment fabriquer.",
      "editorialEn": "A scenographer stack must connect intent, space, and production. SketchUp or Vectorworks carries volume, D5 or Twinmotion makes intent readable, InDesign or Figma structures the client deck, and Notion keeps decisions, budget, and suppliers. The trap: beautiful images that do not explain how to build.",
      "needs": [
          {
              "title": "Concept spatial",
              "titleEn": "Concept spatial",
              "detail": "Moodboards, références, narration, volumes et premières pistes doivent converger vite.",
              "detailEn": "Moodboards, références, narration, volumes et premières pistes doivent converger vite."
          },
          {
              "title": "Production lisible",
              "titleEn": "Production lisible",
              "detail": "Plans, matériaux, fournisseurs, budget et contraintes doivent rester traçables.",
              "detailEn": "Plans, matériaux, fournisseurs, budget et contraintes doivent rester traçables."
          },
          {
              "title": "Validation client",
              "titleEn": "Validation client",
              "detail": "Le client doit valider une intention et comprendre les arbitrages de fabrication.",
              "detailEn": "Le client doit valider une intention et comprendre les arbitrages de fabrication."
          }
      ],
      "maturitySignals": [
          {
              "title": "Volume récurrent",
              "titleEn": "Volume récurrent",
              "detail": "La stack devient rentable quand le profil livre plusieurs projets ou variantes par mois.",
              "detailEn": "La stack devient rentable quand le profil livre plusieurs projets ou variantes par mois."
          },
          {
              "title": "Client plus exigeant",
              "titleEn": "Client plus exigeant",
              "detail": "Plus le client valide de livrables, plus les outils de feedback et documentation comptent.",
              "detailEn": "Plus le client valide de livrables, plus les outils de feedback et documentation comptent."
          }
      ],
      "traps": [
          {
              "title": "Rendu sans production",
              "titleEn": "Rendu sans production",
              "detail": "Une image séduisante ne suffit pas si elle ne peut pas devenir un plan ou un budget.",
              "detailEn": "Une image séduisante ne suffit pas si elle ne peut pas devenir un plan ou un budget."
          },
          {
              "title": "Fichiers lourds",
              "titleEn": "Fichiers lourds",
              "detail": "Les assets importés peuvent tuer SketchUp si Transmutr et CleanUp ne sont pas utilisés.",
              "detailEn": "Les assets importés peuvent tuer SketchUp si Transmutr et CleanUp ne sont pas utilisés."
          },
          {
              "title": "Budget séparé",
              "titleEn": "Budget séparé",
              "detail": "Un tableau budget isolé se déconnecte vite des choix créatifs.",
              "detailEn": "Un tableau budget isolé se déconnecte vite des choix créatifs."
          }
      ],
      "checkpoints": [
          {
              "q": "Le client peut-il comprendre le projet sans réunion supplémentaire ?",
              "qEn": "Le client peut-il comprendre le projet sans réunion supplémentaire ?",
              "hint": "Si non, la présentation ou le feedback ne sont pas assez structurés.",
              "hintEn": "Si non, la présentation ou le feedback ne sont pas assez structurés."
          },
          {
              "q": "Les fichiers sources, exports et décisions sont-ils au même endroit ?",
              "qEn": "Les fichiers sources, exports et décisions sont-ils au même endroit ?",
              "hint": "Si non, Notion, Drive ou Eagle doivent reprendre leur rôle de source de vérité.",
              "hintEn": "Si non, Notion, Drive ou Eagle doivent reprendre leur rôle de source de vérité."
          },
          {
              "q": "Chaque abonnement correspond-il à un livrable facturé ?",
              "qEn": "Chaque abonnement correspond-il à un livrable facturé ?",
              "hint": "Si non, l’outil doit passer en test ponctuel ou être coupé.",
              "hintEn": "Si non, l’outil doit passer en test ponctuel ou être coupé."
          }
      ],
      "tools": [
          {
              "role": "Concept / 3D",
              "roleEn": "Concept / 3D",
              "slug": "sketchup-pro",
              "reason": "Rapide pour volumes, scènes et variantes client.",
              "reasonEn": "Rapide pour volumes, scènes et variantes client."
          },
          {
              "role": "CAO événementielle",
              "roleEn": "CAO événementielle",
              "slug": "vectorworks",
              "reason": "Solide pour plans, événements et implantation plus technique.",
              "reasonEn": "Solide pour plans, événements et implantation plus technique.",
              "decision": "conditional"
          },
          {
              "role": "Plans 2D",
              "roleEn": "Plans 2D",
              "slug": "autocad",
              "reason": "Standard pour échanges techniques et prestataires.",
              "reasonEn": "Standard pour échanges techniques et prestataires.",
              "decision": "conditional"
          },
          {
              "role": "Rendu rapide",
              "roleEn": "Rendu rapide",
              "slug": "d5-render",
              "reason": "Bon ratio vitesse / impact visuel pour validation.",
              "reasonEn": "Bon ratio vitesse / impact visuel pour validation."
          },
          {
              "role": "Vidéo immersive",
              "roleEn": "Vidéo immersive",
              "slug": "twinmotion",
              "reason": "Utile pour parcours et ambiance événementielle.",
              "reasonEn": "Utile pour parcours et ambiance événementielle.",
              "decision": "conditional"
          },
          {
              "role": "Présentation",
              "roleEn": "Présentation",
              "slug": "indesign",
              "reason": "Dossiers client, planches et rendus structurés.",
              "reasonEn": "Dossiers client, planches et rendus structurés."
          },
          {
              "role": "Vectoriel / signalétique",
              "roleEn": "Vectoriel / signalétique",
              "slug": "adobe-illustrator",
              "reason": "Plans graphiques, pictos, signalétique et éléments de marque.",
              "reasonEn": "Plans graphiques, pictos, signalétique et éléments de marque."
          },
          {
              "role": "Retouche",
              "roleEn": "Retouche",
              "slug": "adobe-photoshop",
              "reason": "Nettoyage de rendus, photomontages et moodboards.",
              "reasonEn": "Nettoyage de rendus, photomontages et moodboards."
          },
          {
              "role": "Moodboard",
              "roleEn": "Moodboard",
              "slug": "milanote",
              "reason": "Références et narration visuelle.",
              "reasonEn": "Références et narration visuelle."
          },
          {
              "role": "Atelier client",
              "roleEn": "Atelier client",
              "slug": "miro",
              "reason": "Cadrage, parcours et workshop.",
              "reasonEn": "Cadrage, parcours et workshop.",
              "decision": "conditional"
          },
          {
              "role": "Pilotage",
              "roleEn": "Pilotage",
              "slug": "notion",
              "reason": "Décisions, budget, fournisseurs et compte rendu.",
              "reasonEn": "Décisions, budget, fournisseurs et compte rendu."
          },
          {
              "role": "Planning équipe",
              "roleEn": "Planning équipe",
              "slug": "monday",
              "reason": "Utile si plusieurs prestataires avancent en parallèle.",
              "reasonEn": "Utile si plusieurs prestataires avancent en parallèle.",
              "decision": "conditional"
          },
          {
              "role": "Plugin profils",
              "roleEn": "Plugin profils",
              "slug": "profile-builder-3",
              "reason": "Structure répétitive, rails, cadres et éléments modulaires.",
              "reasonEn": "Structure répétitive, rails, cadres et éléments modulaires."
          },
          {
              "role": "Imports 3D",
              "roleEn": "Imports 3D",
              "slug": "transmutr",
              "reason": "Optimise les modèles téléchargés.",
              "reasonEn": "Optimise les modèles téléchargés."
          },
          {
              "role": "Décor répété",
              "roleEn": "Décor répété",
              "slug": "skatter",
              "reason": "Décors, végétation, public et objets répétés.",
              "reasonEn": "Décors, végétation, public et objets répétés.",
              "decision": "conditional"
          },
          {
              "role": "Liste de coupe",
              "roleEn": "Liste de coupe",
              "slug": "open-cut-list",
              "reason": "Préparation fabrication et débits.",
              "reasonEn": "Préparation fabrication et débits.",
              "decision": "conditional"
          },
          {
              "role": "IA concept",
              "roleEn": "IA concept",
              "slug": "chatgpt",
              "reason": "Structure brief, narration, livrables et comptes rendus.",
              "reasonEn": "Structure brief, narration, livrables et comptes rendus."
          },
          {
              "role": "IA ambiance",
              "roleEn": "IA ambiance",
              "slug": "midjourney",
              "reason": "Explore directions visuelles et atmosphères.",
              "reasonEn": "Explore directions visuelles et atmosphères.",
              "decision": "conditional"
          },
          {
              "role": "Retouche IA",
              "roleEn": "Retouche IA",
              "slug": "firefly",
              "reason": "Variations et nettoyage visuel.",
              "reasonEn": "Variations et nettoyage visuel.",
              "decision": "conditional"
          }
      ]
  },
  {
      "id": "designer-stand-retail-popup",
      "slug": "designer-stand-retail-popup",
      "title": "Stack stand & retail",
      "titleEn": "Stand and retail stack",
      "subtitle": "Pour concevoir stands, corners, pop-ups et vitrines avec une chaîne claire entre concept, 3D, signalétique, fabrication et budget.",
      "subtitleEn": "For stands, corners, pop-ups, and windows with a clear chain from concept to 3D, signage, fabrication, and budget.",
      "persona": "designer",
      "subProfiles": [
          "interior-design",
          "brand",
          "client-delivery"
      ],
      "stage": "scale",
      "budget": "under150",
      "monthlyBudget": 136,
      "savings": 210,
      "risk": "Confondre image de concept et dossier de fabrication : le retail demande une stack qui tient le budget, les matériaux, les délais et les prestataires.",
      "riskEn": "Confusing concept image and fabrication file: retail needs a stack that holds budget, materials, timelines, and suppliers.",
      "bestFor": "Stands, pop-ups, corners, vitrines, activations retail et expériences de marque temporaires.",
      "bestForEn": "Stands, pop-ups, corners, windows, retail activations, and temporary brand experiences.",
      "avoidIf": "Tu travailles uniquement sur des visuels marketing sans plan, volume ou fabrication.",
      "avoidIfEn": "You only work on marketing visuals without plans, volume, or fabrication.",
      "editorial": "Cette stack doit servir la faisabilité. SketchUp et Rhino accélèrent les formes, AutoCAD ou Vectorworks sécurisent les plans, D5 ou V-Ray vendent l’intention, Illustrator et InDesign portent signalétique et dossier. Airtable ou Notion doivent suivre fournisseurs, coûts et statuts.",
      "editorialEn": "This stack serves feasibility. SketchUp and Rhino speed up forms, AutoCAD or Vectorworks secure plans, D5 or V-Ray sell the intent, Illustrator and InDesign carry signage and deck. Airtable or Notion tracks suppliers, costs, and statuses.",
      "needs": [
          {
              "title": "Concept vendable",
              "titleEn": "Concept vendable",
              "detail": "Le client doit comprendre l’expérience et la présence de marque.",
              "detailEn": "Le client doit comprendre l’expérience et la présence de marque."
          },
          {
              "title": "Fabrication maîtrisée",
              "titleEn": "Fabrication maîtrisée",
              "detail": "Plans, mobilier, matériaux et prestataires doivent être alignés.",
              "detailEn": "Plans, mobilier, matériaux et prestataires doivent être alignés."
          },
          {
              "title": "Budget vivant",
              "titleEn": "Budget vivant",
              "detail": "Chaque choix créatif doit avoir un impact prix visible.",
              "detailEn": "Chaque choix créatif doit avoir un impact prix visible."
          }
      ],
      "maturitySignals": [
          {
              "title": "Volume récurrent",
              "titleEn": "Volume récurrent",
              "detail": "La stack devient rentable quand le profil livre plusieurs projets ou variantes par mois.",
              "detailEn": "La stack devient rentable quand le profil livre plusieurs projets ou variantes par mois."
          },
          {
              "title": "Client plus exigeant",
              "titleEn": "Client plus exigeant",
              "detail": "Plus le client valide de livrables, plus les outils de feedback et documentation comptent.",
              "detailEn": "Plus le client valide de livrables, plus les outils de feedback et documentation comptent."
          }
      ],
      "traps": [
          {
              "title": "Trop de 3D premium",
              "titleEn": "Trop de 3D premium",
              "detail": "V-Ray n’est utile que si l’image premium change la vente.",
              "detailEn": "V-Ray n’est utile que si l’image premium change la vente."
          },
          {
              "title": "Signalétique hors flux",
              "titleEn": "Signalétique hors flux",
              "detail": "Illustrator doit rester connecté au plan et aux contraintes de pose.",
              "detailEn": "Illustrator doit rester connecté au plan et aux contraintes de pose."
          },
          {
              "title": "Suivi fournisseur flou",
              "titleEn": "Suivi fournisseur flou",
              "detail": "Sans statuts et alternatives, le sourcing bloque la production.",
              "detailEn": "Sans statuts et alternatives, le sourcing bloque la production."
          }
      ],
      "checkpoints": [
          {
              "q": "Le client peut-il comprendre le projet sans réunion supplémentaire ?",
              "qEn": "Le client peut-il comprendre le projet sans réunion supplémentaire ?",
              "hint": "Si non, la présentation ou le feedback ne sont pas assez structurés.",
              "hintEn": "Si non, la présentation ou le feedback ne sont pas assez structurés."
          },
          {
              "q": "Les fichiers sources, exports et décisions sont-ils au même endroit ?",
              "qEn": "Les fichiers sources, exports et décisions sont-ils au même endroit ?",
              "hint": "Si non, Notion, Drive ou Eagle doivent reprendre leur rôle de source de vérité.",
              "hintEn": "Si non, Notion, Drive ou Eagle doivent reprendre leur rôle de source de vérité."
          },
          {
              "q": "Chaque abonnement correspond-il à un livrable facturé ?",
              "qEn": "Chaque abonnement correspond-il à un livrable facturé ?",
              "hint": "Si non, l’outil doit passer en test ponctuel ou être coupé.",
              "hintEn": "Si non, l’outil doit passer en test ponctuel ou être coupé."
          }
      ],
      "tools": [
          {
              "role": "Volume rapide",
              "roleEn": "Volume rapide",
              "slug": "sketchup-pro",
              "reason": "Base efficace pour tester implantation, mobilier et circulation.",
              "reasonEn": "Base efficace pour tester implantation, mobilier et circulation."
          },
          {
              "role": "Formes complexes",
              "roleEn": "Formes complexes",
              "slug": "rhino",
              "reason": "Utile pour mobilier sur-mesure et formes sculpturales.",
              "reasonEn": "Utile pour mobilier sur-mesure et formes sculpturales.",
              "decision": "conditional"
          },
          {
              "role": "Plans techniques",
              "roleEn": "Plans techniques",
              "slug": "autocad",
              "reason": "Échanges avec fabricants et prestataires.",
              "reasonEn": "Échanges avec fabricants et prestataires."
          },
          {
              "role": "CAO retail",
              "roleEn": "CAO retail",
              "slug": "vectorworks",
              "reason": "Option solide pour implantation et dossiers techniques.",
              "reasonEn": "Option solide pour implantation et dossiers techniques.",
              "decision": "conditional"
          },
          {
              "role": "Rendu quotidien",
              "roleEn": "Rendu quotidien",
              "slug": "d5-render",
              "reason": "Images rapides pour validation client.",
              "reasonEn": "Images rapides pour validation client."
          },
          {
              "role": "Image premium",
              "roleEn": "Image premium",
              "slug": "v-ray",
              "reason": "À garder pour les rendus haut de gamme vendus.",
              "reasonEn": "À garder pour les rendus haut de gamme vendus.",
              "decision": "conditional"
          },
          {
              "role": "Signalétique",
              "roleEn": "Signalétique",
              "slug": "adobe-illustrator",
              "reason": "Pictos, habillages, adhésifs, panneaux et formats print.",
              "reasonEn": "Pictos, habillages, adhésifs, panneaux et formats print."
          },
          {
              "role": "Dossier client",
              "roleEn": "Dossier client",
              "slug": "indesign",
              "reason": "Présentation propre des intentions, plans et options.",
              "reasonEn": "Présentation propre des intentions, plans et options."
          },
          {
              "role": "Retouche",
              "roleEn": "Retouche",
              "slug": "adobe-photoshop",
              "reason": "Photomontages et corrections de rendu.",
              "reasonEn": "Photomontages et corrections de rendu."
          },
          {
              "role": "Pilotage",
              "roleEn": "Pilotage",
              "slug": "notion",
              "reason": "Décisions, coûts, prestataires et livrables.",
              "reasonEn": "Décisions, coûts, prestataires et livrables."
          },
          {
              "role": "Base production",
              "roleEn": "Base production",
              "slug": "airtable",
              "reason": "Utile si beaucoup d’items, fournisseurs et statuts.",
              "reasonEn": "Utile si beaucoup d’items, fournisseurs et statuts.",
              "decision": "conditional"
          },
          {
              "role": "Budget",
              "roleEn": "Budget",
              "slug": "google-sheets",
              "reason": "Chiffrage simple et partagé.",
              "reasonEn": "Chiffrage simple et partagé."
          },
          {
              "role": "Planning",
              "roleEn": "Planning",
              "slug": "monday",
              "reason": "Coordination multi-prestataires.",
              "reasonEn": "Coordination multi-prestataires.",
              "decision": "conditional"
          },
          {
              "role": "Plugin profils",
              "roleEn": "Plugin profils",
              "slug": "profile-builder-3",
              "reason": "Structures répétitives, rails, cadres et modules.",
              "reasonEn": "Structures répétitives, rails, cadres et modules."
          },
          {
              "role": "Imports 3D",
              "roleEn": "Imports 3D",
              "slug": "transmutr",
              "reason": "Nettoie les assets importés.",
              "reasonEn": "Nettoie les assets importés."
          },
          {
              "role": "Débits",
              "roleEn": "Débits",
              "slug": "open-cut-list",
              "reason": "Prépare panneaux et fabrication.",
              "reasonEn": "Prépare panneaux et fabrication.",
              "decision": "conditional"
          },
          {
              "role": "IA brief",
              "roleEn": "IA brief",
              "slug": "chatgpt",
              "reason": "Clarifie contraintes, planning, livrables et emails client.",
              "reasonEn": "Clarifie contraintes, planning, livrables et emails client."
          },
          {
              "role": "IA ambiance",
              "roleEn": "IA ambiance",
              "slug": "krea-ai",
              "reason": "Variations visuelles rapides sur matières et lumières.",
              "reasonEn": "Variations visuelles rapides sur matières et lumières.",
              "decision": "conditional"
          },
          {
              "role": "Upscale",
              "roleEn": "Upscale",
              "slug": "magnific-ai",
              "reason": "À réserver aux rendus finaux.",
              "reasonEn": "À réserver aux rendus finaux.",
              "decision": "conditional"
          }
      ]
  },
  {
      "id": "designer-graphique-pro",
      "slug": "designer-graphique-pro",
      "title": "Stack designer graphique",
      "titleEn": "Graphic designer stack",
      "subtitle": "Le socle pour identité, print, digital, mockups, typographie, fichiers clients, validation et facturation.",
      "subtitleEn": "The base for identity, print, digital, mockups, typography, client files, approval, and invoicing.",
      "persona": "designer",
      "subProfiles": [
          "brand",
          "illustration",
          "admin"
      ],
      "stage": "lean",
      "budget": "under150",
      "monthlyBudget": 96,
      "savings": 170,
      "risk": "Payer une suite complète et des banques d’assets sans distinguer ce qui produit vraiment les livrables clients.",
      "riskEn": "Paying for a full suite and asset libraries without separating what truly produces client deliverables.",
      "bestFor": "Design print et digital, identité visuelle, campagnes, affiches, supports réseaux sociaux et dossiers client.",
      "bestForEn": "Print and digital design, visual identity, campaigns, posters, social assets, and client decks.",
      "avoidIf": "Tu fais surtout de l’UX produit ou du motion, où Figma ou After Effects deviennent plus centraux.",
      "avoidIfEn": "You mainly do product UX or motion, where Figma or After Effects are more central.",
      "editorial": "Illustrator, Photoshop et InDesign restent le noyau si le métier touche au print, au vectoriel et aux dossiers propres. Figma est utile pour les systèmes et le digital. Eagle et FontBase évitent la dérive des assets. Canva ne doit servir qu’aux déclinaisons rapides, pas à la source de vérité.",
      "editorialEn": "Illustrator, Photoshop, and InDesign remain the core when the work touches print, vector, and polished dossiers. Figma helps with systems and digital. Eagle and FontBase prevent asset drift. Canva should handle quick variations, not the source of truth.",
      "needs": [
          {
              "title": "Production fiable",
              "titleEn": "Production fiable",
              "detail": "Vectoriel, image, mise en page et PDF doivent sortir proprement.",
              "detailEn": "Vectoriel, image, mise en page et PDF doivent sortir proprement."
          },
          {
              "title": "Assets rangés",
              "titleEn": "Assets rangés",
              "detail": "Polices, mockups, visuels et références doivent être retrouvables.",
              "detailEn": "Polices, mockups, visuels et références doivent être retrouvables."
          },
          {
              "title": "Livraison claire",
              "titleEn": "Livraison claire",
              "detail": "Le client doit recevoir les bons formats et la bonne version.",
              "detailEn": "Le client doit recevoir les bons formats et la bonne version."
          }
      ],
      "maturitySignals": [
          {
              "title": "Volume récurrent",
              "titleEn": "Volume récurrent",
              "detail": "La stack devient rentable quand le profil livre plusieurs projets ou variantes par mois.",
              "detailEn": "La stack devient rentable quand le profil livre plusieurs projets ou variantes par mois."
          },
          {
              "title": "Client plus exigeant",
              "titleEn": "Client plus exigeant",
              "detail": "Plus le client valide de livrables, plus les outils de feedback et documentation comptent.",
              "detailEn": "Plus le client valide de livrables, plus les outils de feedback et documentation comptent."
          }
      ],
      "traps": [
          {
              "title": "Canva comme source",
              "titleEn": "Canva comme source",
              "detail": "Canva est utile pour décliner, pas pour porter une identité complète.",
              "detailEn": "Canva est utile pour décliner, pas pour porter une identité complète."
          },
          {
              "title": "Fonts dispersées",
              "titleEn": "Fonts dispersées",
              "detail": "Sans gestionnaire, les polices deviennent vite ingérables.",
              "detailEn": "Sans gestionnaire, les polices deviennent vite ingérables."
          },
          {
              "title": "PDF non contrôlés",
              "titleEn": "PDF non contrôlés",
              "detail": "Acrobat reste utile dès que le print compte vraiment.",
              "detailEn": "Acrobat reste utile dès que le print compte vraiment."
          }
      ],
      "checkpoints": [
          {
              "q": "Le client peut-il comprendre le projet sans réunion supplémentaire ?",
              "qEn": "Le client peut-il comprendre le projet sans réunion supplémentaire ?",
              "hint": "Si non, la présentation ou le feedback ne sont pas assez structurés.",
              "hintEn": "Si non, la présentation ou le feedback ne sont pas assez structurés."
          },
          {
              "q": "Les fichiers sources, exports et décisions sont-ils au même endroit ?",
              "qEn": "Les fichiers sources, exports et décisions sont-ils au même endroit ?",
              "hint": "Si non, Notion, Drive ou Eagle doivent reprendre leur rôle de source de vérité.",
              "hintEn": "Si non, Notion, Drive ou Eagle doivent reprendre leur rôle de source de vérité."
          },
          {
              "q": "Chaque abonnement correspond-il à un livrable facturé ?",
              "qEn": "Chaque abonnement correspond-il à un livrable facturé ?",
              "hint": "Si non, l’outil doit passer en test ponctuel ou être coupé.",
              "hintEn": "Si non, l’outil doit passer en test ponctuel ou être coupé."
          }
      ],
      "tools": [
          {
              "role": "Vectoriel",
              "roleEn": "Vectoriel",
              "slug": "adobe-illustrator",
              "reason": "Logo, pictos, formes, print et fichiers sources.",
              "reasonEn": "Logo, pictos, formes, print et fichiers sources."
          },
          {
              "role": "Retouche",
              "roleEn": "Retouche",
              "slug": "adobe-photoshop",
              "reason": "Images, mockups, détourages et photomontages.",
              "reasonEn": "Images, mockups, détourages et photomontages."
          },
          {
              "role": "Mise en page",
              "roleEn": "Mise en page",
              "slug": "indesign",
              "reason": "Brochures, dossiers, catalogues et exports print.",
              "reasonEn": "Brochures, dossiers, catalogues et exports print."
          },
          {
              "role": "Système digital",
              "roleEn": "Système digital",
              "slug": "figma",
              "reason": "Templates digitaux, composants et validations rapides.",
              "reasonEn": "Templates digitaux, composants et validations rapides.",
              "decision": "conditional"
          },
          {
              "role": "Déclinaisons",
              "roleEn": "Déclinaisons",
              "slug": "canva",
              "reason": "Formats sociaux et supports simples.",
              "reasonEn": "Formats sociaux et supports simples.",
              "decision": "conditional"
          },
          {
              "role": "Visuels rapides",
              "roleEn": "Visuels rapides",
              "slug": "adobe-express",
              "reason": "Déclinaisons Adobe sans ouvrir toute la chaîne.",
              "reasonEn": "Déclinaisons Adobe sans ouvrir toute la chaîne.",
              "decision": "conditional"
          },
          {
              "role": "Gestion fontes",
              "roleEn": "Gestion fontes",
              "slug": "fontbase",
              "reason": "Organisation et activation des typographies.",
              "reasonEn": "Organisation et activation des typographies."
          },
          {
              "role": "Bibliothèque visuelle",
              "roleEn": "Bibliothèque visuelle",
              "slug": "eagle",
              "reason": "Références, mockups, images et textures.",
              "reasonEn": "Références, mockups, images et textures."
          },
          {
              "role": "Contrôle PDF",
              "roleEn": "Contrôle PDF",
              "slug": "adobe-acrobat",
              "reason": "Annotations, prépresse et PDF final.",
              "reasonEn": "Annotations, prépresse et PDF final."
          },
          {
              "role": "Projet",
              "roleEn": "Projet",
              "slug": "notion",
              "reason": "Brief, décisions, retours et suivi client.",
              "reasonEn": "Brief, décisions, retours et suivi client."
          },
          {
              "role": "Fichiers",
              "roleEn": "Fichiers",
              "slug": "google-drive",
              "reason": "Livrables, sources et archives partagées.",
              "reasonEn": "Livrables, sources et archives partagées."
          },
          {
              "role": "Facturation",
              "roleEn": "Facturation",
              "slug": "indy",
              "reason": "Devis, factures et suivi.",
              "reasonEn": "Devis, factures et suivi."
          },
          {
              "role": "Plugin Illustrator",
              "roleEn": "Plugin Illustrator",
              "slug": "astute-graphics",
              "reason": "Accélère vectoriel avancé et nettoyage.",
              "reasonEn": "Accélère vectoriel avancé et nettoyage.",
              "decision": "conditional"
          },
          {
              "role": "IA structure",
              "roleEn": "IA structure",
              "slug": "chatgpt",
              "reason": "Angles, textes, présentations et mails.",
              "reasonEn": "Angles, textes, présentations et mails."
          },
          {
              "role": "IA image",
              "roleEn": "IA image",
              "slug": "firefly",
              "reason": "Retouche générative dans le flux Adobe.",
              "reasonEn": "Retouche générative dans le flux Adobe.",
              "decision": "conditional"
          },
          {
              "role": "IA exploration",
              "roleEn": "IA exploration",
              "slug": "midjourney",
              "reason": "Univers visuels et moodboards.",
              "reasonEn": "Univers visuels et moodboards.",
              "decision": "conditional"
          },
          {
              "role": "Upscale",
              "roleEn": "Upscale",
              "slug": "topaz-gigapixel",
              "reason": "Qualité image ponctuelle.",
              "reasonEn": "Qualité image ponctuelle.",
              "decision": "conditional"
          }
      ]
  },
  {
      "id": "brand-designer-systeme",
      "slug": "brand-designer-systeme",
      "title": "Stack brand designer",
      "titleEn": "Brand designer stack",
      "subtitle": "Pour stratégie visuelle, moodboards, logo, guidelines, templates, assets et livraison de marque maintenable.",
      "subtitleEn": "For visual strategy, moodboards, logo, guidelines, templates, assets, and maintainable brand delivery.",
      "persona": "designer",
      "subProfiles": [
          "brand",
          "art-direction",
          "client-delivery"
      ],
      "stage": "scale",
      "budget": "under150",
      "monthlyBudget": 118,
      "savings": 190,
      "risk": "Livrer une belle identité sans système exploitable : guidelines floues, assets dispersés, templates absents et validations perdues.",
      "riskEn": "Delivering a beautiful identity without an usable system: vague guidelines, scattered assets, missing templates, and lost approvals.",
      "bestFor": "Identités de marque, plateformes visuelles, chartes, templates, refontes et systèmes graphiques.",
      "bestForEn": "Brand identities, visual platforms, guidelines, templates, rebrands, and graphic systems.",
      "avoidIf": "Tu fais seulement des logos ponctuels sans guidelines ni déclinaisons.",
      "avoidIfEn": "You only do occasional logos without guidelines or variations.",
      "editorial": "Le brand designer doit sortir plus qu’un logo. Figma ou Illustrator créent le système, InDesign ou Pitch racontent la marque, Brandpad ou Notion livrent les règles, Eagle garde les assets. L’IA sert à explorer des directions, pas à décider la stratégie à la place du designer.",
      "editorialEn": "A brand designer must deliver more than a logo. Figma or Illustrator creates the system, InDesign or Pitch tells the brand, Brandpad or Notion delivers rules, Eagle keeps assets. AI explores directions, it does not decide strategy for the designer.",
      "needs": [
          {
              "title": "Stratégie claire",
              "titleEn": "Stratégie claire",
              "detail": "Positionnement, références et territoire visuel doivent être lisibles.",
              "detailEn": "Positionnement, références et territoire visuel doivent être lisibles."
          },
          {
              "title": "Système exploitable",
              "titleEn": "Système exploitable",
              "detail": "Guidelines, couleurs, typos, composants et templates doivent tenir ensemble.",
              "detailEn": "Guidelines, couleurs, typos, composants et templates doivent tenir ensemble."
          },
          {
              "title": "Livraison durable",
              "titleEn": "Livraison durable",
              "detail": "Le client doit pouvoir réutiliser la marque sans la dégrader.",
              "detailEn": "Le client doit pouvoir réutiliser la marque sans la dégrader."
          }
      ],
      "maturitySignals": [
          {
              "title": "Volume récurrent",
              "titleEn": "Volume récurrent",
              "detail": "La stack devient rentable quand le profil livre plusieurs projets ou variantes par mois.",
              "detailEn": "La stack devient rentable quand le profil livre plusieurs projets ou variantes par mois."
          },
          {
              "title": "Client plus exigeant",
              "titleEn": "Client plus exigeant",
              "detail": "Plus le client valide de livrables, plus les outils de feedback et documentation comptent.",
              "detailEn": "Plus le client valide de livrables, plus les outils de feedback et documentation comptent."
          }
      ],
      "traps": [
          {
              "title": "Guidelines en PDF mort",
              "titleEn": "Guidelines en PDF mort",
              "detail": "Un PDF seul devient vite obsolète si la marque évolue.",
              "detailEn": "Un PDF seul devient vite obsolète si la marque évolue."
          },
          {
              "title": "Trop d’assets IA",
              "titleEn": "Trop d’assets IA",
              "detail": "L’exploration IA ne remplace pas une direction de marque.",
              "detailEn": "L’exploration IA ne remplace pas une direction de marque."
          },
          {
              "title": "Tokens inutiles",
              "titleEn": "Tokens inutiles",
              "detail": "Specify ou Tokens Studio ne servent que si le système va vers le digital ou le code.",
              "detailEn": "Specify ou Tokens Studio ne servent que si le système va vers le digital ou le code."
          }
      ],
      "checkpoints": [
          {
              "q": "Le client peut-il comprendre le projet sans réunion supplémentaire ?",
              "qEn": "Le client peut-il comprendre le projet sans réunion supplémentaire ?",
              "hint": "Si non, la présentation ou le feedback ne sont pas assez structurés.",
              "hintEn": "Si non, la présentation ou le feedback ne sont pas assez structurés."
          },
          {
              "q": "Les fichiers sources, exports et décisions sont-ils au même endroit ?",
              "qEn": "Les fichiers sources, exports et décisions sont-ils au même endroit ?",
              "hint": "Si non, Notion, Drive ou Eagle doivent reprendre leur rôle de source de vérité.",
              "hintEn": "Si non, Notion, Drive ou Eagle doivent reprendre leur rôle de source de vérité."
          },
          {
              "q": "Chaque abonnement correspond-il à un livrable facturé ?",
              "qEn": "Chaque abonnement correspond-il à un livrable facturé ?",
              "hint": "Si non, l’outil doit passer en test ponctuel ou être coupé.",
              "hintEn": "Si non, l’outil doit passer en test ponctuel ou être coupé."
          }
      ],
      "tools": [
          {
              "role": "Design system",
              "roleEn": "Design system",
              "slug": "figma",
              "reason": "Système visuel, templates, composants et livrables digitaux.",
              "reasonEn": "Système visuel, templates, composants et livrables digitaux."
          },
          {
              "role": "Vectoriel",
              "roleEn": "Vectoriel",
              "slug": "adobe-illustrator",
              "reason": "Logo, pictos et éléments de marque.",
              "reasonEn": "Logo, pictos et éléments de marque."
          },
          {
              "role": "Retouche",
              "roleEn": "Retouche",
              "slug": "adobe-photoshop",
              "reason": "Images de marque et mockups.",
              "reasonEn": "Images de marque et mockups."
          },
          {
              "role": "Guidelines print",
              "roleEn": "Guidelines print",
              "slug": "indesign",
              "reason": "Brand book, règles et dossiers premium.",
              "reasonEn": "Brand book, règles et dossiers premium."
          },
          {
              "role": "Présentation",
              "roleEn": "Présentation",
              "slug": "pitch",
              "reason": "Decks de marque et propositions.",
              "reasonEn": "Decks de marque et propositions."
          },
          {
              "role": "Présentation Apple",
              "roleEn": "Présentation Apple",
              "slug": "keynote",
              "reason": "Alternative fluide pour pitch visuel.",
              "reasonEn": "Alternative fluide pour pitch visuel.",
              "decision": "conditional"
          },
          {
              "role": "Workshop",
              "roleEn": "Workshop",
              "slug": "miro",
              "reason": "Positionnement, mapping et ateliers.",
              "reasonEn": "Positionnement, mapping et ateliers."
          },
          {
              "role": "Base projet",
              "roleEn": "Base projet",
              "slug": "notion",
              "reason": "Brief, décisions, livrables et liens.",
              "reasonEn": "Brief, décisions, livrables et liens."
          },
          {
              "role": "Assets",
              "roleEn": "Assets",
              "slug": "eagle",
              "reason": "Références, logos, visuels, textures et exports.",
              "reasonEn": "Références, logos, visuels, textures et exports."
          },
          {
              "role": "Veille",
              "roleEn": "Veille",
              "slug": "arena",
              "reason": "Références plus éditoriales et moins standardisées.",
              "reasonEn": "Références plus éditoriales et moins standardisées.",
              "decision": "conditional"
          },
          {
              "role": "Recherche visuelle",
              "roleEn": "Recherche visuelle",
              "slug": "pinterest",
              "reason": "Inspiration client et moodboards rapides.",
              "reasonEn": "Inspiration client et moodboards rapides."
          },
          {
              "role": "Livraison guidelines",
              "roleEn": "Livraison guidelines",
              "slug": "brandpad",
              "reason": "Guidelines en ligne et assets maintenables.",
              "reasonEn": "Guidelines en ligne et assets maintenables.",
              "decision": "conditional"
          },
          {
              "role": "Design tokens",
              "roleEn": "Design tokens",
              "slug": "specify",
              "reason": "Utile quand la marque devient système digital.",
              "reasonEn": "Utile quand la marque devient système digital.",
              "decision": "conditional"
          },
          {
              "role": "Plugin tokens",
              "roleEn": "Plugin tokens",
              "slug": "figma-tokens",
              "reason": "Variables et tokens Figma.",
              "reasonEn": "Variables et tokens Figma.",
              "decision": "conditional"
          },
          {
              "role": "Plugin icônes",
              "roleEn": "Plugin icônes",
              "slug": "figma-iconify",
              "reason": "Accès rapide aux familles d’icônes.",
              "reasonEn": "Accès rapide aux familles d’icônes."
          },
          {
              "role": "IA stratégie",
              "roleEn": "IA stratégie",
              "slug": "chatgpt",
              "reason": "Structure plateforme, naming, textes et rationale.",
              "reasonEn": "Structure plateforme, naming, textes et rationale."
          },
          {
              "role": "IA mood",
              "roleEn": "IA mood",
              "slug": "midjourney",
              "reason": "Exploration de territoires visuels.",
              "reasonEn": "Exploration de territoires visuels.",
              "decision": "conditional"
          },
          {
              "role": "Retouche IA",
              "roleEn": "Retouche IA",
              "slug": "firefly",
              "reason": "Nettoyage et variations Adobe.",
              "reasonEn": "Nettoyage et variations Adobe.",
              "decision": "conditional"
          }
      ]
  },
  {
      "id": "directeur-artistique-creative-lead",
      "slug": "directeur-artistique",
      "title": "Stack directeur artistique",
      "titleEn": "Art director stack",
      "subtitle": "La stack pour piloter une vision : veille, moodboards, concepts, direction image, feedback, assets, présentation et validation client.",
      "subtitleEn": "The stack to lead a vision: research, moodboards, concepts, image direction, feedback, assets, presentation, and client approval.",
      "persona": "designer",
      "subProfiles": [
          "art-direction",
          "brand",
          "client-delivery"
      ],
      "stage": "scale",
      "budget": "under150",
      "monthlyBudget": 128,
      "savings": 220,
      "risk": "Avoir des références, IA, decks et retours dispersés : la DA perd de la force quand la décision créative n’est pas traçable.",
      "riskEn": "Having references, AI, decks, and feedback scattered: art direction loses strength when creative decisions are not traceable.",
      "bestFor": "Direction image, campagnes, shootings, identité, vidéo, événement, contenu de marque et supervision créative.",
      "bestForEn": "Image direction, campaigns, shoots, identity, video, events, branded content, and creative supervision.",
      "avoidIf": "Tu produis uniquement des fichiers d’exécution sans piloter de vision ou d’arbitrages.",
      "avoidIfEn": "You only produce execution files without leading vision or trade-offs.",
      "editorial": "Le directeur artistique a besoin d’une stack de décision, pas seulement de production. Are.na, ShotDeck, Pinterest et Eagle nourrissent la veille. Figma, Keynote ou Pitch formalisent la vision. Frame.io et Loom clarifient les retours. Notion garde le pourquoi derrière chaque choix.",
      "editorialEn": "An art director needs a decision stack, not only production tools. Are.na, ShotDeck, Pinterest, and Eagle feed research. Figma, Keynote, or Pitch formalize the vision. Frame.io and Loom clarify feedback. Notion keeps the why behind each choice.",
      "needs": [
          {
              "title": "Veille solide",
              "titleEn": "Veille solide",
              "detail": "Références image, culture, style et benchmarks doivent être organisés.",
              "detailEn": "Références image, culture, style et benchmarks doivent être organisés."
          },
          {
              "title": "Vision partageable",
              "titleEn": "Vision partageable",
              "detail": "Le concept doit être présenté de façon courte, claire et vendable.",
              "detailEn": "Le concept doit être présenté de façon courte, claire et vendable."
          },
          {
              "title": "Feedback précis",
              "titleEn": "Feedback précis",
              "detail": "Les retours doivent pointer une image, une scène ou une décision.",
              "detailEn": "Les retours doivent pointer une image, une scène ou une décision."
          }
      ],
      "maturitySignals": [
          {
              "title": "Volume récurrent",
              "titleEn": "Volume récurrent",
              "detail": "La stack devient rentable quand le profil livre plusieurs projets ou variantes par mois.",
              "detailEn": "La stack devient rentable quand le profil livre plusieurs projets ou variantes par mois."
          },
          {
              "title": "Client plus exigeant",
              "titleEn": "Client plus exigeant",
              "detail": "Plus le client valide de livrables, plus les outils de feedback et documentation comptent.",
              "detailEn": "Plus le client valide de livrables, plus les outils de feedback et documentation comptent."
          }
      ],
      "traps": [
          {
              "title": "Moodboard infini",
              "titleEn": "Moodboard infini",
              "detail": "Chercher plus de références peut masquer une décision non prise.",
              "detailEn": "Chercher plus de références peut masquer une décision non prise."
          },
          {
              "title": "IA sans direction",
              "titleEn": "IA sans direction",
              "detail": "Midjourney ou Krea amplifient une intention, ils ne la remplacent pas.",
              "detailEn": "Midjourney ou Krea amplifient une intention, ils ne la remplacent pas."
          },
          {
              "title": "Feedback oral perdu",
              "titleEn": "Feedback oral perdu",
              "detail": "Sans trace, la décision créative revient en arrière.",
              "detailEn": "Sans trace, la décision créative revient en arrière."
          }
      ],
      "checkpoints": [
          {
              "q": "Le client peut-il comprendre le projet sans réunion supplémentaire ?",
              "qEn": "Le client peut-il comprendre le projet sans réunion supplémentaire ?",
              "hint": "Si non, la présentation ou le feedback ne sont pas assez structurés.",
              "hintEn": "Si non, la présentation ou le feedback ne sont pas assez structurés."
          },
          {
              "q": "Les fichiers sources, exports et décisions sont-ils au même endroit ?",
              "qEn": "Les fichiers sources, exports et décisions sont-ils au même endroit ?",
              "hint": "Si non, Notion, Drive ou Eagle doivent reprendre leur rôle de source de vérité.",
              "hintEn": "Si non, Notion, Drive ou Eagle doivent reprendre leur rôle de source de vérité."
          },
          {
              "q": "Chaque abonnement correspond-il à un livrable facturé ?",
              "qEn": "Chaque abonnement correspond-il à un livrable facturé ?",
              "hint": "Si non, l’outil doit passer en test ponctuel ou être coupé.",
              "hintEn": "Si non, l’outil doit passer en test ponctuel ou être coupé."
          }
      ],
      "tools": [
          {
              "role": "Design / deck",
              "roleEn": "Design / deck",
              "slug": "figma",
              "reason": "Boards, systèmes, présentations et annotations.",
              "reasonEn": "Boards, systèmes, présentations et annotations."
          },
          {
              "role": "Présentation",
              "roleEn": "Présentation",
              "slug": "keynote",
              "reason": "Decks visuels rapides et très maîtrisables.",
              "reasonEn": "Decks visuels rapides et très maîtrisables."
          },
          {
              "role": "Présentation collaborative",
              "roleEn": "Présentation collaborative",
              "slug": "pitch",
              "reason": "Decks partagés et commentaires.",
              "reasonEn": "Decks partagés et commentaires.",
              "decision": "conditional"
          },
          {
              "role": "Moodboard",
              "roleEn": "Moodboard",
              "slug": "milanote",
              "reason": "Références, narration et planches.",
              "reasonEn": "Références, narration et planches."
          },
          {
              "role": "Veille",
              "roleEn": "Veille",
              "slug": "arena",
              "reason": "Collecte éditoriale et références pointues.",
              "reasonEn": "Collecte éditoriale et références pointues."
          },
          {
              "role": "Bibliothèque",
              "roleEn": "Bibliothèque",
              "slug": "eagle",
              "reason": "Images, textures, assets et archives.",
              "reasonEn": "Images, textures, assets et archives."
          },
          {
              "role": "Recherche visuelle",
              "roleEn": "Recherche visuelle",
              "slug": "pinterest",
              "reason": "Références rapides et partage client.",
              "reasonEn": "Références rapides et partage client."
          },
          {
              "role": "Références cinéma",
              "roleEn": "Références cinéma",
              "slug": "shotdeck",
              "reason": "Cadrage, lumière, couleur et direction image.",
              "reasonEn": "Cadrage, lumière, couleur et direction image.",
              "decision": "conditional"
          },
          {
              "role": "Feedback vidéo",
              "roleEn": "Feedback vidéo",
              "slug": "frame-io",
              "reason": "Commentaires précis sur vidéos et visuels.",
              "reasonEn": "Commentaires précis sur vidéos et visuels.",
              "decision": "conditional"
          },
          {
              "role": "Pilotage",
              "roleEn": "Pilotage",
              "slug": "notion",
              "reason": "Rationale, décisions, statut et livrables.",
              "reasonEn": "Rationale, décisions, statut et livrables."
          },
          {
              "role": "Workshop",
              "roleEn": "Workshop",
              "slug": "miro",
              "reason": "Cadrage et co-création client.",
              "reasonEn": "Cadrage et co-création client.",
              "decision": "conditional"
          },
          {
              "role": "Fichiers",
              "roleEn": "Fichiers",
              "slug": "google-drive",
              "reason": "Livraison et partage de sources.",
              "reasonEn": "Livraison et partage de sources."
          },
          {
              "role": "IA concept",
              "roleEn": "IA concept",
              "slug": "chatgpt",
              "reason": "Rationale, structure de deck et notes de direction.",
              "reasonEn": "Rationale, structure de deck et notes de direction."
          },
          {
              "role": "IA image",
              "roleEn": "IA image",
              "slug": "midjourney",
              "reason": "Exploration visuelle rapide.",
              "reasonEn": "Exploration visuelle rapide.",
              "decision": "conditional"
          },
          {
              "role": "Retouche IA",
              "roleEn": "Retouche IA",
              "slug": "firefly",
              "reason": "Nettoyage et variations image.",
              "reasonEn": "Nettoyage et variations image.",
              "decision": "conditional"
          },
          {
              "role": "IA vidéo",
              "roleEn": "IA vidéo",
              "slug": "runway",
              "reason": "Tests vidéo et animatiques.",
              "reasonEn": "Tests vidéo et animatiques.",
              "decision": "conditional"
          },
          {
              "role": "Upscale",
              "roleEn": "Upscale",
              "slug": "magnific-ai",
              "reason": "Visuels finaux et détails.",
              "reasonEn": "Visuels finaux et détails.",
              "decision": "conditional"
          }
      ]
  },
  {
      "id": "webflow-nocode-creatif",
      "slug": "developpeur-webflow-nocode-creatif",
      "title": "Stack Webflow créatif",
      "titleEn": "Creative Webflow stack",
      "subtitle": "Pour construire des sites Webflow propres : cadrage, design, CMS, SEO, formulaires, automatisation, membership, paiement et analytics.",
      "subtitleEn": "For clean Webflow builds: framing, design, CMS, SEO, forms, automation, membership, payment, and analytics.",
      "persona": "dev",
      "subProfiles": [
          "web",
          "no-code",
          "automation"
      ],
      "stage": "scale",
      "budget": "under150",
      "monthlyBudget": 124,
      "savings": 210,
      "risk": "Empiler apps Webflow, scripts et automatisations sans gouvernance : le site devient fragile, lent et difficile à maintenir.",
      "riskEn": "Stacking Webflow apps, scripts, and automations without governance: the site becomes fragile, slow, and hard to maintain.",
      "bestFor": "Sites Webflow, landing pages, CMS éditorial, expériences no-code, formulaires et automatisations légères.",
      "bestForEn": "Webflow sites, landing pages, editorial CMS, no-code experiences, forms, and light automations.",
      "avoidIf": "Tu développes une vraie application métier avec logique backend lourde.",
      "avoidIfEn": "You build a real business app with heavy backend logic.",
      "editorial": "Le bon stack Webflow commence avant Webflow. Relume aide à cadrer sitemap et wireframes, Figma garde la DA, Webflow porte le build, Finsweet/Client-First structurent le code, Make ou Zapier relient les formulaires, Plausible ou Search Console mesurent. Chaque script doit avoir une raison.",
      "editorialEn": "A good Webflow stack starts before Webflow. Relume frames sitemap and wireframes, Figma keeps art direction, Webflow carries the build, Finsweet/Client-First structure code, Make or Zapier connects forms, Plausible or Search Console measures. Every script needs a reason.",
      "needs": [
          {
              "title": "Cadrer vite",
              "titleEn": "Cadrer vite",
              "detail": "Sitemap, wireframes et composants doivent sortir avant le build.",
              "detailEn": "Sitemap, wireframes et composants doivent sortir avant le build."
          },
          {
              "title": "Build maintenable",
              "titleEn": "Build maintenable",
              "detail": "Classes, CMS, interactions et scripts doivent rester lisibles.",
              "detailEn": "Classes, CMS, interactions et scripts doivent rester lisibles."
          },
          {
              "title": "Mesurer utile",
              "titleEn": "Mesurer utile",
              "detail": "SEO, conversion et performance doivent être suivis sans usine analytics.",
              "detailEn": "SEO, conversion et performance doivent être suivis sans usine analytics."
          }
      ],
      "maturitySignals": [
          {
              "title": "Volume récurrent",
              "titleEn": "Volume récurrent",
              "detail": "La stack devient rentable quand le profil livre plusieurs projets ou variantes par mois.",
              "detailEn": "La stack devient rentable quand le profil livre plusieurs projets ou variantes par mois."
          },
          {
              "title": "Client plus exigeant",
              "titleEn": "Client plus exigeant",
              "detail": "Plus le client valide de livrables, plus les outils de feedback et documentation comptent.",
              "detailEn": "Plus le client valide de livrables, plus les outils de feedback et documentation comptent."
          }
      ],
      "traps": [
          {
              "title": "Scripts invisibles",
              "titleEn": "Scripts invisibles",
              "detail": "Un custom code non documenté casse la maintenance.",
              "detailEn": "Un custom code non documenté casse la maintenance."
          },
          {
              "title": "Apps trop nombreuses",
              "titleEn": "Apps trop nombreuses",
              "detail": "Chaque app ralentit ou complexifie le site.",
              "detailEn": "Chaque app ralentit ou complexifie le site."
          },
          {
              "title": "CMS mal pensé",
              "titleEn": "CMS mal pensé",
              "detail": "Un CMS confus coûte cher au client après livraison.",
              "detailEn": "Un CMS confus coûte cher au client après livraison."
          }
      ],
      "checkpoints": [
          {
              "q": "Le client peut-il comprendre le projet sans réunion supplémentaire ?",
              "qEn": "Le client peut-il comprendre le projet sans réunion supplémentaire ?",
              "hint": "Si non, la présentation ou le feedback ne sont pas assez structurés.",
              "hintEn": "Si non, la présentation ou le feedback ne sont pas assez structurés."
          },
          {
              "q": "Les fichiers sources, exports et décisions sont-ils au même endroit ?",
              "qEn": "Les fichiers sources, exports et décisions sont-ils au même endroit ?",
              "hint": "Si non, Notion, Drive ou Eagle doivent reprendre leur rôle de source de vérité.",
              "hintEn": "Si non, Notion, Drive ou Eagle doivent reprendre leur rôle de source de vérité."
          },
          {
              "q": "Chaque abonnement correspond-il à un livrable facturé ?",
              "qEn": "Chaque abonnement correspond-il à un livrable facturé ?",
              "hint": "Si non, l’outil doit passer en test ponctuel ou être coupé.",
              "hintEn": "Si non, l’outil doit passer en test ponctuel ou être coupé."
          }
      ],
      "tools": [
          {
              "role": "Build",
              "roleEn": "Build",
              "slug": "webflow",
              "reason": "CMS, pages, interactions et publication.",
              "reasonEn": "CMS, pages, interactions et publication."
          },
          {
              "role": "Cadrage",
              "roleEn": "Cadrage",
              "slug": "relume",
              "reason": "Sitemap, wireframes et sections prêtes à adapter.",
              "reasonEn": "Sitemap, wireframes et sections prêtes à adapter."
          },
          {
              "role": "Design",
              "roleEn": "Design",
              "slug": "figma",
              "reason": "DA, composants et validation client.",
              "reasonEn": "DA, composants et validation client."
          },
          {
              "role": "Prototype rapide",
              "roleEn": "Prototype rapide",
              "slug": "framer",
              "reason": "Option si le projet est plus landing que CMS.",
              "reasonEn": "Option si le projet est plus landing que CMS.",
              "decision": "conditional"
          },
          {
              "role": "Automation",
              "roleEn": "Automation",
              "slug": "make",
              "reason": "Connecte formulaires, CRM, emails et bases.",
              "reasonEn": "Connecte formulaires, CRM, emails et bases."
          },
          {
              "role": "Automation simple",
              "roleEn": "Automation simple",
              "slug": "zapier",
              "reason": "Alternative plus simple pour intégrations rapides.",
              "reasonEn": "Alternative plus simple pour intégrations rapides.",
              "decision": "conditional"
          },
          {
              "role": "Base de données",
              "roleEn": "Base de données",
              "slug": "airtable",
              "reason": "Back-office léger ou contenu structuré.",
              "reasonEn": "Back-office léger ou contenu structuré.",
              "decision": "conditional"
          },
          {
              "role": "Membership",
              "roleEn": "Membership",
              "slug": "memberstack",
              "reason": "Comptes membres et accès privés Webflow.",
              "reasonEn": "Comptes membres et accès privés Webflow.",
              "decision": "conditional"
          },
          {
              "role": "App no-code",
              "roleEn": "App no-code",
              "slug": "wized",
              "reason": "Logique app et front dynamique au-dessus de Webflow.",
              "reasonEn": "Logique app et front dynamique au-dessus de Webflow.",
              "decision": "conditional"
          },
          {
              "role": "Synchronisation",
              "roleEn": "Synchronisation",
              "slug": "whalesync",
              "reason": "Sync Webflow avec Airtable ou Notion.",
              "reasonEn": "Sync Webflow avec Airtable ou Notion.",
              "decision": "conditional"
          },
          {
              "role": "Formulaire",
              "roleEn": "Formulaire",
              "slug": "tally",
              "reason": "Qualification et formulaires légers.",
              "reasonEn": "Qualification et formulaires légers."
          },
          {
              "role": "Formulaire avancé",
              "roleEn": "Formulaire avancé",
              "slug": "typeform",
              "reason": "À garder si l’expérience formulaire justifie le coût.",
              "reasonEn": "À garder si l’expérience formulaire justifie le coût.",
              "decision": "conditional"
          },
          {
              "role": "Paiement",
              "roleEn": "Paiement",
              "slug": "stripe",
              "reason": "Paiements, acomptes ou offres packagées.",
              "reasonEn": "Paiements, acomptes ou offres packagées.",
              "decision": "conditional"
          },
          {
              "role": "Analytics",
              "roleEn": "Analytics",
              "slug": "plausible",
              "reason": "Mesure simple et lisible.",
              "reasonEn": "Mesure simple et lisible."
          },
          {
              "role": "SEO",
              "roleEn": "SEO",
              "slug": "google-search-console",
              "reason": "Indexation, requêtes et erreurs SEO.",
              "reasonEn": "Indexation, requêtes et erreurs SEO."
          },
          {
              "role": "IA structure",
              "roleEn": "IA structure",
              "slug": "chatgpt",
              "reason": "Plans de pages, specs, scripts et debug.",
              "reasonEn": "Plans de pages, specs, scripts et debug."
          },
          {
              "role": "IA recherche",
              "roleEn": "IA recherche",
              "slug": "perplexity",
              "reason": "Benchmarks et vérifications rapides.",
              "reasonEn": "Benchmarks et vérifications rapides.",
              "decision": "conditional"
          }
      ]
  },
  {
      "id": "monteur-video-pro",
      "slug": "monteur-video",
      "title": "Stack monteur vidéo",
      "titleEn": "Video editor stack",
      "subtitle": "La chaîne pour dérusher, monter, sous-titrer, étalonner, nettoyer le son, faire valider et livrer sans friction.",
      "subtitleEn": "The chain to ingest, edit, subtitle, grade, clean audio, approve, and deliver smoothly.",
      "persona": "designer",
      "subProfiles": [
          "video",
          "client-delivery"
      ],
      "stage": "lean",
      "budget": "under150",
      "monthlyBudget": 118,
      "savings": 190,
      "risk": "Payer plusieurs logiciels de montage, banques audio et outils IA alors qu’un seul workflow stable suffit souvent.",
      "riskEn": "Paying for several editors, audio libraries, and AI tools when one stable workflow often does the job.",
      "bestFor": "Interviews, contenus social media, corporate, publicité, formats courts ou longs.",
      "bestForEn": "Interviews, social content, corporate, ads, short or long formats.",
      "avoidIf": "Tu fais surtout du motion design avancé ou de la captation sans postproduction.",
      "avoidIfEn": "You mostly do advanced motion design or capture without post-production.",
      "editorial": "DaVinci Resolve peut suffire pour beaucoup de monteurs : montage, étalonnage et audio dans un seul outil. Premiere reste logique si le client ou l’équipe vit dans Adobe. Frame.io structure les retours. Descript et CapCut sont utiles sur formats courts. Topaz Video doit rester réservé aux plans qui le méritent.",
      "editorialEn": "DaVinci Resolve can be enough for many editors: editing, grading, and audio in one tool. Premiere makes sense when the client or team lives in Adobe. Frame.io structures feedback. Descript and CapCut help short formats. Topaz Video should stay reserved for shots that deserve it.",
      "needs": [
          {
              "title": "Montage stable",
              "titleEn": "Montage stable",
              "detail": "Un outil principal doit porter 80% du workflow.",
              "detailEn": "Un outil principal doit porter 80% du workflow."
          },
          {
              "title": "Validation claire",
              "titleEn": "Validation claire",
              "detail": "Les retours doivent être timecodés et actionnables.",
              "detailEn": "Les retours doivent être timecodés et actionnables."
          },
          {
              "title": "Livraison propre",
              "titleEn": "Livraison propre",
              "detail": "Sous-titres, exports, son et formats doivent être maîtrisés.",
              "detailEn": "Sous-titres, exports, son et formats doivent être maîtrisés."
          }
      ],
      "maturitySignals": [
          {
              "title": "Volume récurrent",
              "titleEn": "Volume récurrent",
              "detail": "La stack devient rentable quand le profil livre plusieurs projets ou variantes par mois.",
              "detailEn": "La stack devient rentable quand le profil livre plusieurs projets ou variantes par mois."
          },
          {
              "title": "Client plus exigeant",
              "titleEn": "Client plus exigeant",
              "detail": "Plus le client valide de livrables, plus les outils de feedback et documentation comptent.",
              "detailEn": "Plus le client valide de livrables, plus les outils de feedback et documentation comptent."
          }
      ],
      "traps": [
          {
              "title": "Deux NLE payés",
              "titleEn": "Deux NLE payés",
              "detail": "Premiere et DaVinci en parallèle doivent avoir des rôles distincts.",
              "detailEn": "Premiere et DaVinci en parallèle doivent avoir des rôles distincts."
          },
          {
              "title": "IA partout",
              "titleEn": "IA partout",
              "detail": "L’IA doit accélérer sous-titres, nettoyage ou upscale, pas remplacer le montage.",
              "detailEn": "L’IA doit accélérer sous-titres, nettoyage ou upscale, pas remplacer le montage."
          },
          {
              "title": "Audio négligé",
              "titleEn": "Audio négligé",
              "detail": "Un bon montage avec un son faible reste perçu comme amateur.",
              "detailEn": "Un bon montage avec un son faible reste perçu comme amateur."
          }
      ],
      "checkpoints": [
          {
              "q": "Le client peut-il comprendre le projet sans réunion supplémentaire ?",
              "qEn": "Le client peut-il comprendre le projet sans réunion supplémentaire ?",
              "hint": "Si non, la présentation ou le feedback ne sont pas assez structurés.",
              "hintEn": "Si non, la présentation ou le feedback ne sont pas assez structurés."
          },
          {
              "q": "Les fichiers sources, exports et décisions sont-ils au même endroit ?",
              "qEn": "Les fichiers sources, exports et décisions sont-ils au même endroit ?",
              "hint": "Si non, Notion, Drive ou Eagle doivent reprendre leur rôle de source de vérité.",
              "hintEn": "Si non, Notion, Drive ou Eagle doivent reprendre leur rôle de source de vérité."
          },
          {
              "q": "Chaque abonnement correspond-il à un livrable facturé ?",
              "qEn": "Chaque abonnement correspond-il à un livrable facturé ?",
              "hint": "Si non, l’outil doit passer en test ponctuel ou être coupé.",
              "hintEn": "Si non, l’outil doit passer en test ponctuel ou être coupé."
          }
      ],
      "tools": [
          {
              "role": "Montage principal",
              "roleEn": "Montage principal",
              "slug": "davinci-resolve",
              "reason": "Montage, étalonnage, audio et exports dans une suite solide.",
              "reasonEn": "Montage, étalonnage, audio et exports dans une suite solide."
          },
          {
              "role": "Montage Adobe",
              "roleEn": "Montage Adobe",
              "slug": "adobe-premiere-pro",
              "reason": "À garder si clients, templates ou équipe sont Adobe.",
              "reasonEn": "À garder si clients, templates ou équipe sont Adobe.",
              "decision": "conditional"
          },
          {
              "role": "Montage Mac",
              "roleEn": "Montage Mac",
              "slug": "final-cut-pro",
              "reason": "Rapide et efficace si ton workflow est 100% Apple.",
              "reasonEn": "Rapide et efficace si ton workflow est 100% Apple.",
              "decision": "conditional"
          },
          {
              "role": "Validation",
              "roleEn": "Validation",
              "slug": "frame-io",
              "reason": "Commentaires timecodés et validation client.",
              "reasonEn": "Commentaires timecodés et validation client."
          },
          {
              "role": "Sous-titres / dérush",
              "roleEn": "Sous-titres / dérush",
              "slug": "descript",
              "reason": "Transcription, montage texte et formats courts.",
              "reasonEn": "Transcription, montage texte et formats courts.",
              "decision": "conditional"
          },
          {
              "role": "Social court",
              "roleEn": "Social court",
              "slug": "capcut",
              "reason": "Formats rapides et réseaux sociaux.",
              "reasonEn": "Formats rapides et réseaux sociaux.",
              "decision": "conditional"
          },
          {
              "role": "Post-audio",
              "roleEn": "Post-audio",
              "slug": "adobe-audition",
              "reason": "Nettoyage voix, mixage et correction audio.",
              "reasonEn": "Nettoyage voix, mixage et correction audio.",
              "decision": "conditional"
          },
          {
              "role": "Musique",
              "roleEn": "Musique",
              "slug": "artlist",
              "reason": "Musique et assets sous licence.",
              "reasonEn": "Musique et assets sous licence."
          },
          {
              "role": "SFX / musique",
              "roleEn": "SFX / musique",
              "slug": "epidemic-sound",
              "reason": "Alternative solide pour contenus récurrents.",
              "reasonEn": "Alternative solide pour contenus récurrents.",
              "decision": "conditional"
          },
          {
              "role": "Stockage",
              "roleEn": "Stockage",
              "slug": "dropbox",
              "reason": "Partage de fichiers lourds et versions.",
              "reasonEn": "Partage de fichiers lourds et versions.",
              "decision": "conditional"
          },
          {
              "role": "Drive client",
              "roleEn": "Drive client",
              "slug": "google-drive",
              "reason": "Livraison simple et accessible.",
              "reasonEn": "Livraison simple et accessible."
          },
          {
              "role": "IA vidéo",
              "roleEn": "IA vidéo",
              "slug": "runway",
              "reason": "Tests, plans générés ou retouches vidéo.",
              "reasonEn": "Tests, plans générés ou retouches vidéo.",
              "decision": "conditional"
          },
          {
              "role": "Upscale vidéo",
              "roleEn": "Upscale vidéo",
              "slug": "topaz-video",
              "reason": "À réserver aux plans à sauver ou livrables premium.",
              "reasonEn": "À réserver aux plans à sauver ou livrables premium.",
              "decision": "conditional"
          },
          {
              "role": "Voix IA",
              "roleEn": "Voix IA",
              "slug": "elevenlabs",
              "reason": "Voix off, scratch voice ou variations.",
              "reasonEn": "Voix off, scratch voice ou variations.",
              "decision": "conditional"
          },
          {
              "role": "IA structure",
              "roleEn": "IA structure",
              "slug": "chatgpt",
              "reason": "Scripts, plan de montage, résumés et emails client.",
              "reasonEn": "Scripts, plan de montage, résumés et emails client."
          }
      ]
  },
  {
      "id": "realisateur-videaste-marque",
      "slug": "realisateur-videaste",
      "title": "Stack vidéaste",
      "titleEn": "Videographer stack",
      "subtitle": "Pour préparer, tourner, monter, faire valider et facturer des films de marque, interviews, événements ou capsules social media.",
      "subtitleEn": "To prepare, shoot, edit, approve, and invoice brand films, interviews, events, or social clips.",
      "persona": "designer",
      "subProfiles": [
          "video",
          "art-direction",
          "client-delivery"
      ],
      "stage": "scale",
      "budget": "under150",
      "monthlyBudget": 132,
      "savings": 210,
      "risk": "Séparer préproduction, tournage, montage, validation et facturation dans trop d’outils : les décisions de réalisation se perdent.",
      "riskEn": "Splitting pre-production, shooting, editing, approval, and billing across too many tools: directing decisions get lost.",
      "bestFor": "Films de marque, interviews, vidéos événementielles, contenus corporate et capsules social media.",
      "bestForEn": "Brand films, interviews, event videos, corporate content, and social clips.",
      "avoidIf": "Tu ne fais que du montage à partir de rushs déjà cadrés par une autre équipe.",
      "avoidIfEn": "You only edit footage already framed by another team.",
      "editorial": "Le vidéaste a besoin d’une stack avant et après le tournage. Milanote ou Notion cadrent brief, moodboard, shotlist et planning. ShotDeck nourrit la direction image. DaVinci ou Premiere portent la postproduction. Frame.io centralise les retours. Indy, Qonto et Yousign ferment la boucle business.",
      "editorialEn": "A videographer needs a stack before and after the shoot. Milanote or Notion frames brief, moodboard, shot list, and planning. ShotDeck feeds image direction. DaVinci or Premiere carries post-production. Frame.io centralizes feedback. Indy, Qonto, and Yousign close the business loop.",
      "needs": [
          {
              "title": "Préproduction claire",
              "titleEn": "Préproduction claire",
              "detail": "Brief, moodboard, shotlist, planning et autorisations doivent être prêts avant tournage.",
              "detailEn": "Brief, moodboard, shotlist, planning et autorisations doivent être prêts avant tournage."
          },
          {
              "title": "Postproduction maîtrisée",
              "titleEn": "Postproduction maîtrisée",
              "detail": "Montage, étalonnage, son et exports doivent être cohérents.",
              "detailEn": "Montage, étalonnage, son et exports doivent être cohérents."
          },
          {
              "title": "Business fluide",
              "titleEn": "Business fluide",
              "detail": "Devis, validation, acompte et livraison ne doivent pas ralentir le projet.",
              "detailEn": "Devis, validation, acompte et livraison ne doivent pas ralentir le projet."
          }
      ],
      "maturitySignals": [
          {
              "title": "Volume récurrent",
              "titleEn": "Volume récurrent",
              "detail": "La stack devient rentable quand le profil livre plusieurs projets ou variantes par mois.",
              "detailEn": "La stack devient rentable quand le profil livre plusieurs projets ou variantes par mois."
          },
          {
              "title": "Client plus exigeant",
              "titleEn": "Client plus exigeant",
              "detail": "Plus le client valide de livrables, plus les outils de feedback et documentation comptent.",
              "detailEn": "Plus le client valide de livrables, plus les outils de feedback et documentation comptent."
          }
      ],
      "traps": [
          {
              "title": "Shotlist absente",
              "titleEn": "Shotlist absente",
              "detail": "Le tournage coûte trop cher pour improviser les décisions de base.",
              "detailEn": "Le tournage coûte trop cher pour improviser les décisions de base."
          },
          {
              "title": "Retour client flou",
              "titleEn": "Retour client flou",
              "detail": "Un commentaire non timecodé coûte des heures.",
              "detailEn": "Un commentaire non timecodé coûte des heures."
          },
          {
              "title": "Musique sans licence",
              "titleEn": "Musique sans licence",
              "detail": "La librairie audio doit sécuriser l’usage client.",
              "detailEn": "La librairie audio doit sécuriser l’usage client."
          }
      ],
      "checkpoints": [
          {
              "q": "Le client peut-il comprendre le projet sans réunion supplémentaire ?",
              "qEn": "Le client peut-il comprendre le projet sans réunion supplémentaire ?",
              "hint": "Si non, la présentation ou le feedback ne sont pas assez structurés.",
              "hintEn": "Si non, la présentation ou le feedback ne sont pas assez structurés."
          },
          {
              "q": "Les fichiers sources, exports et décisions sont-ils au même endroit ?",
              "qEn": "Les fichiers sources, exports et décisions sont-ils au même endroit ?",
              "hint": "Si non, Notion, Drive ou Eagle doivent reprendre leur rôle de source de vérité.",
              "hintEn": "Si non, Notion, Drive ou Eagle doivent reprendre leur rôle de source de vérité."
          },
          {
              "q": "Chaque abonnement correspond-il à un livrable facturé ?",
              "qEn": "Chaque abonnement correspond-il à un livrable facturé ?",
              "hint": "Si non, l’outil doit passer en test ponctuel ou être coupé.",
              "hintEn": "Si non, l’outil doit passer en test ponctuel ou être coupé."
          }
      ],
      "tools": [
          {
              "role": "Préproduction",
              "roleEn": "Préproduction",
              "slug": "milanote",
              "reason": "Moodboard, références, séquences et intentions.",
              "reasonEn": "Moodboard, références, séquences et intentions."
          },
          {
              "role": "Pilotage",
              "roleEn": "Pilotage",
              "slug": "notion",
              "reason": "Brief, planning, shotlist, décisions et livrables.",
              "reasonEn": "Brief, planning, shotlist, décisions et livrables."
          },
          {
              "role": "Références image",
              "roleEn": "Références image",
              "slug": "shotdeck",
              "reason": "Cadrage, lumière et couleur.",
              "reasonEn": "Cadrage, lumière et couleur.",
              "decision": "conditional"
          },
          {
              "role": "Validation",
              "roleEn": "Validation",
              "slug": "frame-io",
              "reason": "Commentaires timecodés et versions.",
              "reasonEn": "Commentaires timecodés et versions."
          },
          {
              "role": "Montage",
              "roleEn": "Montage",
              "slug": "davinci-resolve",
              "reason": "Montage, couleur, audio et livraison.",
              "reasonEn": "Montage, couleur, audio et livraison."
          },
          {
              "role": "Montage Adobe",
              "roleEn": "Montage Adobe",
              "slug": "adobe-premiere-pro",
              "reason": "À garder si le workflow client est Adobe.",
              "reasonEn": "À garder si le workflow client est Adobe.",
              "decision": "conditional"
          },
          {
              "role": "Montage Mac",
              "roleEn": "Montage Mac",
              "slug": "final-cut-pro",
              "reason": "Option rapide sur workflow Apple.",
              "reasonEn": "Option rapide sur workflow Apple.",
              "decision": "conditional"
          },
          {
              "role": "Musique",
              "roleEn": "Musique",
              "slug": "artlist",
              "reason": "Musique et SFX sous licence.",
              "reasonEn": "Musique et SFX sous licence."
          },
          {
              "role": "Musique alternative",
              "roleEn": "Musique alternative",
              "slug": "epidemic-sound",
              "reason": "Bibliothèque audio récurrente.",
              "reasonEn": "Bibliothèque audio récurrente.",
              "decision": "conditional"
          },
          {
              "role": "Captation distante",
              "roleEn": "Captation distante",
              "slug": "riverside",
              "reason": "Interviews à distance propres.",
              "reasonEn": "Interviews à distance propres.",
              "decision": "conditional"
          },
          {
              "role": "Fichiers",
              "roleEn": "Fichiers",
              "slug": "google-drive",
              "reason": "Partage client et livraison.",
              "reasonEn": "Partage client et livraison."
          },
          {
              "role": "Facturation",
              "roleEn": "Facturation",
              "slug": "indy",
              "reason": "Devis, factures et suivi.",
              "reasonEn": "Devis, factures et suivi."
          },
          {
              "role": "Signature",
              "roleEn": "Signature",
              "slug": "yousign",
              "reason": "Contrats, devis et autorisations signés.",
              "reasonEn": "Contrats, devis et autorisations signés."
          },
          {
              "role": "IA structure",
              "roleEn": "IA structure",
              "slug": "chatgpt",
              "reason": "Questions d’interview, scripts, planning et comptes rendus.",
              "reasonEn": "Questions d’interview, scripts, planning et comptes rendus."
          },
          {
              "role": "IA vidéo",
              "roleEn": "IA vidéo",
              "slug": "runway",
              "reason": "Tests, transitions et plans ponctuels.",
              "reasonEn": "Tests, transitions et plans ponctuels.",
              "decision": "conditional"
          },
          {
              "role": "IA vidéo générative",
              "roleEn": "IA vidéo générative",
              "slug": "kling-ai",
              "reason": "À tester projet par projet.",
              "reasonEn": "À tester projet par projet.",
              "decision": "conditional"
          },
          {
              "role": "Transcription",
              "roleEn": "Transcription",
              "slug": "descript",
              "reason": "Sous-titres, dérush et formats courts.",
              "reasonEn": "Sous-titres, dérush et formats courts.",
              "decision": "conditional"
          },
          {
              "role": "Voix",
              "roleEn": "Voix",
              "slug": "elevenlabs",
              "reason": "Voix off temporaire ou version alternative.",
              "reasonEn": "Voix off temporaire ou version alternative.",
              "decision": "conditional"
          }
      ]
  },
  {
    id: "consultant-b2b",
    slug: "consultant-b2b-propre",
    title: "Stack consultant B2B",
    titleEn: "B2B consultant stack",
    subtitle: "La base recommandée pour suivre les opportunités, préparer les appels, formaliser les propositions et livrer proprement.",
    subtitleEn: "For B2B consultants who need to track opportunities, book calls, and deliver cleanly without rebuilding a sales team.",
    persona: "consultant",
    subProfiles: ["crm-sales", "client-delivery", "admin"],
    stage: "starter",
    budget: "under50",
    monthlyBudget: 37,
    savings: 65,
    risk: "Passer plus de temps à mettre à jour ton CRM qu'à parler à tes clients — et multiplier les outils qui capturent tous les mêmes informations.",
    riskEn: "Multiplying CRM, scheduling, and notes tools that capture the same information.",
    bestFor: "Conseil, coaching, accompagnement dirigeants et offres packagées.",
    bestForEn: "Consulting, B2B coaching, executive advisory, packaged offers.",
    avoidIf: "Tu gères une équipe commerciale avec du scoring, des séquences et du reporting multi-personnes.",
    avoidIfEn: "You have a sales team with scoring, sequences, and multi-rep reporting.",
    editorial: "La vraie différence entre Pipedrive et un Notion bien fait n'est pas fonctionnelle — elle est comportementale. Pipedrive force à attribuer une valeur et une probabilité à chaque deal, ce qui change la façon de penser son CA prévisionnel. Si tu fais ça naturellement, Notion suffit. Si tu as tendance à oublier de chiffrer tes opportunités, les 15€/mois de Pipedrive paient leur place. Pour la facturation, Indy (ou Pennylane) gère mieux la TVA et les déclarations URSSAF que Stripe pour un solo en France.",
    editorialEn: "The real difference between Pipedrive and a well-built Notion is not functional — it is behavioral. Pipedrive forces you to assign a value and probability to each deal, which changes how you think about projected revenue. If you do this naturally, Notion is enough. If you tend to skip quantifying your opportunities, Pipedrive's €15/month earns its place.",
    checkpoints: [
      { q: "Tu sais combien pèse ton pipeline commercial en euros aujourd'hui, sans chercher ?", qEn: "Do you know exactly how much your sales pipeline is worth in euros right now, without looking?", hint: "Non → c'est le signe que ton suivi commercial manque de structure. Pipedrive ou une base Notion avec valeur + étape + date de relance = visibilité immédiate sur ton CA prévisionnel.", hintEn: "No → that is a sign your sales tracking lacks structure. Pipedrive or a Notion database with value + stage + follow-up date = immediate visibility on projected revenue." },
      { q: "Tu utilises un outil de signature électronique séparé ?", qEn: "Are you using a separate e-signature tool?", hint: "Oui → pour un solo FR, Yousign (gratuit jusqu'à 10 signatures/mois) ou un 'bon pour accord' par email a une valeur légale équivalente pour la plupart des missions. DocuSign à 40€/mois est du sur-équipement.", hintEn: "Yes → for a solo, Yousign (free up to 10 signatures/month) or a written 'agreement confirmed' by email has equivalent legal value for most missions. DocuSign at €40/month is overkill." },
      { q: "Ton proposal arrive par email en PDF ou par un lien ?", qEn: "Does your proposal arrive by email as a PDF or as a link?", hint: "PDF → un lien Notion en mode public ou une présentation Canva partagée est perçu comme plus pro et évite les 'tu as la dernière version ?' en fin de négociation.", hintEn: "PDF → a public Notion link or a shared Canva presentation reads as more professional and eliminates 'do you have the latest version?' at the end of negotiation." },
    ],
    tools: [
      { role: "Pipeline", roleEn: "Pipeline", slug: "pipedrive", reason: "Plus clair qu'un CRM complet pour un solo orienté vente.", reasonEn: "Clearer than a full CRM for a sales-oriented solo." },
      { role: "Rendez-vous", roleEn: "Scheduling", slug: "calendly", reason: "Rentable si tu bookes plus de 6 appels qualifiés par mois.", reasonEn: "Worth it if you book more than 6 qualified calls per month." },
      { role: "Base client", roleEn: "Client base", slug: "notion", reason: "Notes de mission, livrables et suivi post-call.", reasonEn: "Mission notes, deliverables, and post-call tracking." },
      { role: "Paiement", roleEn: "Payment", slug: "stripe", reason: "Factures simples, cartes, liens de paiement.", reasonEn: "Simple invoices, cards, payment links." },
      { role: "Réseau", roleEn: "Relationship network", slug: "folk", reason: "Utile si tes opportunités viennent d'intros, partenaires et anciens clients.", reasonEn: "Useful if opportunities come from intros, partners, and past clients." },
      { role: "Proposition", roleEn: "Proposal", slug: "canva", reason: "Présentations propres sans outil de deck lourd.", reasonEn: "Clean proposals without a heavy deck tool." },
      { role: "Signature", roleEn: "Signature", slug: "docusign", reason: "À réserver aux contrats où la preuve formelle compte vraiment.", reasonEn: "Reserve for contracts where formal proof really matters." },
      { role: "Recherche", roleEn: "Research", slug: "perplexity", reason: "Préparer appels, benchmarks et notes avec sources vérifiables.", reasonEn: "Prepare calls, benchmarks, and notes with verifiable sources." },
      { role: "Facturation FR", roleEn: "French billing", slug: "indy", reason: "TVA, déclarations et administratif si ton activité est française.", reasonEn: "VAT, declarations, and admin if your activity is French." },
    ],
  },
  {
    id: "content-operator",
    slug: "createur-contenu-operateur",
    title: "Stack créateur contenu",
    titleEn: "Content creator stack",
    subtitle: "La base recommandée pour organiser les idées, produire des formats récurrents, recycler les contenus et garder un seul copilote éditorial principal.",
    subtitleEn: "For freelance creators or writers who want to publish, repurpose, and capture requests without paying for three copilots doing the same thing.",
    persona: "content",
    subProfiles: ["copywriting", "newsletter", "social-content"],
    stage: "lean",
    budget: "under50",
    monthlyBudget: 48,
    savings: 72,
    risk: "Empiler IA, programmation sociale, newsletter et design avant même d'avoir un rythme de publication stable — et payer des abonnements actifs pour des outils qu'on ouvre une fois par mois.",
    riskEn: "Stacking AI, social scheduler, newsletter, and design before having a stable weekly workflow.",
    bestFor: "LinkedIn, newsletter, articles clients et contenus de formation.",
    bestForEn: "LinkedIn, newsletter, client articles, educational content.",
    avoidIf: "Ton activité principale est la production vidéo longue ou le média à forte audience.",
    avoidIfEn: "Your core business is long-form video or a high-audience media brand.",
    editorial: "L'ordre compte. La newsletter se justifie quand tu dépasses 200 abonnés actifs — Beehiiv gratuit tient jusqu'à 2500. Le scheduling social se justifie quand tu publies sur plus de 2 canaux simultanément. L'IA de rédaction se justifie dès le premier article, mais seulement si tu la configures : un system prompt avec ton ton éditorial, ta cible et 3 exemples de tes meilleurs textes change la qualité de chaque sortie. La plupart des créateurs paient 3 IA sans en avoir configuré aucune.",
    editorialEn: "Order matters. A newsletter tool is justified when you pass 200 active subscribers — Beehiiv free handles up to 2500. Social scheduling is justified when you publish across more than 2 channels simultaneously. An AI writing tool is justified from the first article, but only if you configure it: a system prompt with your editorial tone, your audience, and 3 examples of your best texts changes the quality of every output. Most creators pay for 3 AIs without having configured any of them.",
    checkpoints: [
      { q: "Tes brouillons IA restent dans la fenêtre de chat ou tu les copies dans Notion ?", qEn: "Do your AI drafts stay in the chat window or do you copy them into Notion?", hint: "Dans le chat → tu perds tout à la fermeture de session. Backlog Notion + IA pour transformer (pas stocker) = tu construis quelque chose de réutilisable.", hintEn: "In the chat → you lose everything when the session closes. Notion backlog + AI to transform (not store) = you build something reusable." },
      { q: "Tu réutilises un article entre LinkedIn, newsletter et blog ou tu réécris à chaque canal ?", qEn: "Do you repurpose an article across LinkedIn, newsletter, and blog, or do you rewrite for each channel?", hint: "Réécriture → tu travailles 3× pour le même contenu. Un article structuré → section clé en post LinkedIn → intro reformatée en newsletter = 1h au lieu de 3.", hintEn: "Rewriting → you work 3× for the same content. A structured article → key section as a LinkedIn post → reformatted intro as a newsletter = 1 hour instead of 3." },
      { q: "Tu as configuré un system prompt ou des instructions persistantes dans ton IA principale ?", qEn: "Have you configured a system prompt or persistent instructions in your main AI tool?", hint: "Non → tu réexpliques ton ton éditorial et ta cible à chaque session. 20 minutes de configuration = qualité immédiatement meilleure sur chaque usage.", hintEn: "No → you re-explain your editorial tone and audience every session. 20 minutes of setup = immediately better quality on every use." },
    ],
    tools: [
      { role: "Idées et rédaction", roleEn: "Ideas and writing", slug: "chatgpt", reason: "Un copilote éditorial suffit avant d'ajouter des IA spécialisées.", reasonEn: "One editorial copilot is enough before adding specialized AI." },
      { role: "Organisation", roleEn: "Organization", slug: "notion", reason: "Calendrier éditorial, backlog, briefs et recyclage.", reasonEn: "Editorial calendar, backlog, briefs, and repurposing." },
      { role: "Visuels", roleEn: "Visuals", slug: "canva", reason: "Rapide pour carrousels, miniatures et assets simples.", reasonEn: "Fast for carousels, thumbnails, and simple assets." },
      { role: "Formulaires", roleEn: "Forms", slug: "tally", reason: "Capture de demandes sans payer Typeform trop tôt.", reasonEn: "Capture requests without paying for Typeform too early." },
      { role: "Newsletter", roleEn: "Newsletter", slug: "beehiiv", reason: "À activer quand l'email devient un canal régulier, pas une idée vague.", reasonEn: "Activate when email becomes a regular channel, not a vague idea." },
      { role: "Publication sociale", roleEn: "Social scheduling", slug: "buffer", reason: "Suffisant pour planifier plusieurs canaux sans suite social media lourde.", reasonEn: "Enough to schedule several channels without a heavy social suite." },
      { role: "Montage parlé", roleEn: "Spoken editing", slug: "descript", reason: "Utile si tu transformes interviews, vidéos ou podcasts en textes et clips.", reasonEn: "Useful if you turn interviews, videos, or podcasts into text and clips." },
      { role: "Stockage assets", roleEn: "Asset storage", slug: "google-drive", reason: "Garder scripts, exports, visuels et briefs clients au même endroit.", reasonEn: "Keep scripts, exports, visuals, and client briefs in one place." },
    ],
  },
  {
    id: "ops-fractional",
    slug: "ops-manager-fractional-coo",
    title: "Stack Ops / COO",
    titleEn: "Ops / COO stack",
    subtitle: "La base recommandée pour cadrer une mission ops, documenter les process, automatiser ce qui est stable et garder des templates transférables.",
    subtitleEn: "For ops managers or fractional COOs who need transferable processes without juggling Asana, ClickUp, Monday, and Notion.",
    persona: "ops",
    subProfiles: ["operations", "automation", "client-delivery"],
    stage: "scale",
    budget: "under150",
    monthlyBudget: 84,
    savings: 110,
    risk: "Avoir quatre outils de gestion actifs en parallèle selon les clients, et perdre du contexte à chaque changement de mission.",
    riskEn: "Running Asana, ClickUp, Monday, and Notion in parallel across clients.",
    bestFor: "Missions ops fractionnaires, structuration de PME, back-office et pilotage opérationnel.",
    bestForEn: "Ops missions, SMB structuring, process, back office, and operating cadence.",
    avoidIf: "Tu ne pilotes que ton activité en solo, sans clients qui ont leurs propres outils.",
    avoidIfEn: "You only run your solo business without multi-process clients.",
    editorial: "Un COO fractionnaire, sa vraie valeur ce ne sont pas ses outils — c'est ses templates. Un kit de démarrage de mission réutilisable (kick-off, cadence hebdo, plan de charge sur 4 semaines, retrospective) se transfère d'un client à l'autre en 2 heures. Sans ça, chaque démarrage coûte 10 à 15 heures non facturables à reconfigurer de zéro. Make a un avantage souvent ignoré sur Zapier : son canvas visuel permet de documenter le workflow pour le client — c'est à la fois un outil d'automatisation et une livraison de process.",
    editorialEn: "A fractional COO's real value is not their tools — it is their templates. A reusable mission-start kit (kick-off, weekly cadence, 4-week load plan, retrospective) transfers from one client to the next in 2 hours. Without it, every engagement costs 10 to 15 unbillable hours to set up from scratch. Make has an often-overlooked advantage over Zapier: its visual canvas documents the workflow for the client — making it both an automation tool and a process deliverable.",
    checkpoints: [
      { q: "Tu as une procédure de démarrage et de clôture de mission standardisée ?", qEn: "Do you have a standardized mission start and close procedure?", hint: "Non → tu perds environ 15 heures non facturables par nouveau client. Un template Notion de kick-off + un template de closing = récupérés en 2 missions.", hintEn: "No → you lose roughly 15 unbillable hours per new client. A Notion kick-off template + a closing template = recovered in 2 missions." },
      { q: "Tes SOP clients sont dans l'outil du client ou dans le tien ?", qEn: "Are your client SOPs in the client's tool or in yours?", hint: "Dans le leur → quand la mission se termine, tu repars les mains vides. Notion personnel avec une structure transférable = tu construis un actif réutilisable à chaque mission.", hintEn: "In theirs → when the mission ends, you leave empty-handed. Personal Notion with a transferable structure = you build a reusable asset with every mission." },
      { q: "Tu utilises Make ou Zapier pour automatiser ?", qEn: "Are you using Make or Zapier for automation?", hint: "Zapier → Make est moins cher (9€/mois pour 10 000 opérations vs 20€ chez Zapier) et son canvas visuel documente le workflow pour le client. Pour un ops, c'est double valeur.", hintEn: "Zapier → Make is cheaper (€9/month for 10,000 operations vs €20 at Zapier) and its visual canvas documents the workflow for the client. For an ops professional, that is double value." },
    ],
    tools: [
      { role: "Pilotage", roleEn: "Operations", slug: "clickup", reason: "Bon compromis vues, tâches, docs et automatisations simples.", reasonEn: "Good balance of views, tasks, docs, and simple automations." },
      { role: "Base de connaissance", roleEn: "Knowledge base", slug: "notion", reason: "Parfait pour SOP, modèles et docs transférables.", reasonEn: "Great for SOPs, templates, and transferable docs." },
      { role: "Automatisation", roleEn: "Automation", slug: "make", reason: "Moins cher que Zapier si tu sais cartographier les scénarios.", reasonEn: "Cheaper than Zapier if you can map scenarios." },
      { role: "Facturation", roleEn: "Billing", slug: "indy", reason: "Suffisant pour activité française solo et suivi simple.", reasonEn: "Enough for solo French activity and simple tracking." },
      { role: "Base opérationnelle", roleEn: "Operational base", slug: "airtable", reason: "Meilleur que Notion quand les données structurées deviennent critiques.", reasonEn: "Better than Notion when structured data becomes critical." },
      { role: "Communication client", roleEn: "Client communication", slug: "slack", reason: "À garder seulement si le canal remplace vraiment l'email.", reasonEn: "Keep only if the channel truly replaces email." },
      { role: "Asynchrone", roleEn: "Async", slug: "loom", reason: "Documenter process, feedback et passations sans réunion.", reasonEn: "Document process, feedback, and handover without meetings." },
      { role: "Fichiers", roleEn: "Files", slug: "google-drive", reason: "Contrats, exports, SOP et livrables transférables.", reasonEn: "Contracts, exports, SOPs, and transferable deliverables." },
    ],
  },
  {
    id: "solo-zero-bloat",
    slug: "freelance-solo-zero-bloat",
    title: "Stack solo léger",
    titleEn: "Light solo stack",
    subtitle: "La base recommandée pour clarifier une offre, qualifier les demandes, stocker les livrables, encaisser et rester léger au démarrage.",
    subtitleEn: "For early freelancers: sell, qualify, deliver, and get paid with the viable minimum before adding subscriptions.",
    persona: "solo",
    subProfiles: ["admin", "crm-sales", "client-delivery"],
    stage: "starter",
    budget: "free",
    monthlyBudget: 12,
    savings: 85,
    risk: "Dépenser 150 à 200€/mois en outils la première année et ne pas savoir si c'est le manque de clients ou les abonnements qui pèsent sur la trésorerie.",
    riskEn: "Buying team tools before you have a stable flow.",
    bestFor: "Freelance en lancement, activité de service simple, side business.",
    bestForEn: "Early freelance, side business, simple service business.",
    avoidIf: "Tu travailles déjà avec une équipe ou tu as besoin d'un vrai CRM commercial.",
    avoidIfEn: "You already produce with a team or need a full sales CRM.",
    editorial: "La première erreur du freelance qui démarre : confondre 'être organisé' et 'être équipé'. Notion gratuit + Google Drive + Stripe (ou Indy pour la facturation FR conforme URSSAF) — c'est tout ce dont tu as besoin pour facturer tes 5 premiers clients. Chaque abonnement ajouté avant d'avoir la charge de travail qui le justifie est une pression sur une trésorerie déjà fragile.",
    editorialEn: "The first mistake of a freelancer starting out: confusing 'being organized' with 'being equipped'. Free Notion + Google Drive + Stripe — that is all you need to invoice your first 5 clients. Every subscription added before you have the workload to justify it is pressure on an already fragile cash flow.",
    checkpoints: [
      { q: "Tu as déjà refusé un projet parce que ton process de brief n'était pas clair ?", qEn: "Have you ever lost a project because your briefing process was unclear?", hint: "Oui → un formulaire Tally gratuit avec 5 questions qualifie mieux qu'un appel d'une heure mal structuré. C'est le premier outil qui mérite d'être configuré.", hintEn: "Yes → a free Tally form with 5 questions qualifies better than an hour-long unstructured call. It is the first tool worth setting up." },
      { q: "Tu utilises un outil de facturation séparé de Stripe ?", qEn: "Are you using a separate invoicing tool from Stripe?", hint: "Oui → Stripe génère des factures PDF conformes automatiquement. Pour un solo en France, Indy (~9€/mois) ajoute la gestion TVA et les déclarations URSSAF si tu en as besoin.", hintEn: "Yes → Stripe generates compliant PDF invoices automatically. For a solo in France, Indy (~€9/month) adds VAT management and URSSAF declarations if you need them." },
      { q: "Tes livrables clients sont dans un espace partagé dès le début de la mission ?", qEn: "Are your client deliverables in a shared space from the start of the mission?", hint: "Non → un dossier Google Drive par client, partagé au kick-off, évite les WeTransfer qui expirent, les 'tu as le dernier fichier ?' et les v3-finale-finale.", hintEn: "No → one Google Drive folder per client, shared at kick-off, eliminates expiring WeTransfer links, 'do you have the latest file?' messages, and v3-final-final naming." },
    ],
    tools: [
      { role: "Organisation", roleEn: "Organization", slug: "notion", reason: "Un espace unique pour offres, clients, tâches et livrables.", reasonEn: "One place for offers, clients, tasks, and deliverables." },
      { role: "Stockage", roleEn: "Storage", slug: "google-drive", reason: "Peu cher, compris par tous les clients.", reasonEn: "Cheap and understood by every client." },
      { role: "Paiement", roleEn: "Payment", slug: "stripe", reason: "Démarre gratuitement, paiement à l'usage.", reasonEn: "Starts free, pay as you go." },
      { role: "Formulaire", roleEn: "Form", slug: "tally", reason: "Brief client et qualification sans coût fixe.", reasonEn: "Client brief and qualification without fixed cost." },
      { role: "Facturation FR", roleEn: "French billing", slug: "indy", reason: "À ajouter si TVA, URSSAF ou déclarations deviennent pénibles.", reasonEn: "Add if VAT, URSSAF, or declarations become painful." },
      { role: "Rendez-vous", roleEn: "Scheduling", slug: "calendly", reason: "Utile quand les prises de rendez-vous deviennent répétitives.", reasonEn: "Useful when scheduling becomes repetitive." },
      { role: "Visuels simples", roleEn: "Simple visuals", slug: "canva", reason: "Offres, posts, PDF et supports sans designer dédié.", reasonEn: "Offers, posts, PDFs, and assets without a dedicated designer." },
      { role: "IA généraliste", roleEn: "General AI", slug: "chatgpt", reason: "Clarifier offre, scripts, emails et livrables sans multiplier les IA.", reasonEn: "Clarify offers, scripts, emails, and deliverables without multiplying AIs." },
    ],
  },
  {
    id: "automation-light",
    slug: "automatisation-legere-freelance",
    title: "Automatisation freelance",
    titleEn: "Freelance automation",
    subtitle: "Tu as quelques tâches qui se répètent — un formulaire à traiter, une notification à envoyer, une ligne à créer quelque part. Ce n'est pas assez pour justifier Zapier. Mais ce serait dommage de le faire à la main.",
    subtitleEn: "For freelancers starting to have recurring tasks but not enough volume to pay for complex architecture.",
    persona: "ops",
    subProfiles: ["automation", "operations", "no-code"],
    stage: "lean",
    budget: "under50",
    monthlyBudget: 28,
    savings: 74,
    risk: "Payer Zapier parce que c'est le premier outil qu'on trouve sur Google, alors que deux scénarios Make en version gratuite feraient exactement la même chose.",
    riskEn: "Paying for Zapier when two Make scenarios or a checklist would be enough.",
    bestFor: "Traitement de formulaires, notifications, synchronisation légère et rapports mensuels.",
    bestForEn: "Lead capture, notifications, light CRM sync, monthly reporting.",
    avoidIf: "Tes automatisations sont critiques, à fort volume ou partagées entre plusieurs personnes.",
    avoidIfEn: "Your automations are critical, high-volume, or multi-team.",
    editorial: "Make (ex-Integromat) a un avantage concret sur Zapier pour quelqu'un qui travaille seul : son interface en canvas visuel permet de montrer le scénario à un client ou de l'expliquer à un collaborateur sans documentation supplémentaire. Le scénario est sa propre documentation. Zapier est plus rapide à démarrer mais coûte 2× plus cher pour le même volume d'opérations — et l'interface est moins lisible sur des scénarios ramifiés.",
    editorialEn: "Make (formerly Integromat) has a concrete advantage over Zapier for solo operators: its visual canvas lets you show a scenario to a client or explain it to a collaborator without additional documentation. The scenario is its own documentation. Zapier is faster to start with but costs 2× more for the same operation volume — and the interface is less readable on branching scenarios.",
    checkpoints: [
      { q: "Tu as listé les tâches manuelles qui se répètent exactement de la même façon chaque semaine ?", qEn: "Have you listed the manual tasks that repeat in exactly the same way every week?", hint: "Non → 2 semaines de relevé avant d'automatiser. Une tâche irrégulière coûte plus à maintenir qu'elle n'économise — et tu ne le sauras qu'après avoir passé 3h à configurer le scénario.", hintEn: "No → 2 weeks of logging before automating. An irregular task costs more to maintain than it saves — and you will only know that after spending 3 hours configuring the scenario." },
      { q: "Tes scénarios Make ont un nom explicite et une note d'intention ?", qEn: "Do your Make scenarios have a clear name and a note explaining their purpose?", hint: "Non → dans 3 mois tu ne sauras plus pourquoi ce scénario existe ni ce qu'il fait. Une ligne de contexte par scénario = pas de bug mystérieux à 22h avant une livraison.", hintEn: "No → in 3 months you will not remember why this scenario exists or what it does. One line of context per scenario = no mysterious bug at 10pm before a delivery." },
      { q: "Tu paies Zapier avec moins de 5 automatisations actives ?", qEn: "Are you paying for Zapier with fewer than 5 active automations?", hint: "Oui → Make en version gratuite (1000 opérations/mois) couvre exactement ça. La migration d'un Zap simple vers Make prend 15 minutes.", hintEn: "Yes → Make on the free tier (1,000 operations/month) covers exactly that. Migrating a simple Zap to Make takes 15 minutes." },
    ],
    tools: [
      { role: "Scénarios", roleEn: "Scenarios", slug: "make", reason: "Bon rapport puissance/prix pour workflows visuels.", reasonEn: "Good power-to-price ratio for visual workflows." },
      { role: "Capture", roleEn: "Capture", slug: "tally", reason: "Point d'entrée propre pour brief, lead ou demande support.", reasonEn: "Clean entry point for briefs, leads, or support requests." },
      { role: "Base", roleEn: "Base", slug: "airtable", reason: "Utile si Notion devient trop flou pour tes données.", reasonEn: "Useful when Notion becomes too fuzzy for data." },
      { role: "Documentation", roleEn: "Documentation", slug: "notion", reason: "Chaque automatisation doit avoir son mode d'emploi.", reasonEn: "Every automation needs its operating note." },
    ],
  },
  {
    id: "ai-writing-niche",
    slug: "ia-generative-pour-rediger",
    title: "IA rédaction",
    titleEn: "Writing AI",
    subtitle: "ChatGPT pour les brouillons, Claude pour les nuances, Perplexity pour les sources — chacune a ses forces, mais pas besoin de toutes payer chaque mois pour rédiger correctement.",
    subtitleEn: "For people who want to write better and faster without stacking 4 overlapping AI subscriptions.",
    persona: "content",
    subProfiles: ["copywriting", "newsletter", "research"],
    stage: "lean",
    budget: "under50",
    monthlyBudget: 22,
    savings: 40,
    risk: "Payer trois IA de rédaction en parallèle parce qu'on n'a jamais vraiment testé laquelle couvre 90% de ses besoins — et changer d'outil selon l'humeur du jour.",
    riskEn: "Paying for ChatGPT + Claude + Gemini + Perplexity when a single pair covers 90% of writing use cases.",
    bestFor: "Articles, newsletters, emails de vente, posts LinkedIn, réécritures et synthèses de documents longs.",
    bestForEn: "Articles, newsletters, sales emails, LinkedIn posts, rewriting, long-doc summaries.",
    avoidIf: "Tu fais surtout du code, du visuel ou de la voix — d'autres stacks correspondent mieux.",
    avoidIfEn: "You mostly do code, visuals, or voice — see the other niche AI stacks.",
    editorial: "Pour du texte long avec des contraintes de ton précises, Claude est meilleur. Pour des brouillons rapides, des plans et des reformulations courtes, ChatGPT avec un Custom GPT configuré sur ton style est plus efficace. Perplexity se justifie uniquement si tu écris du contenu qui cite des sources — il est le seul à ancrer ses réponses dans des URL cliquables vérifiables. Payer les trois sans en avoir configuré aucun ne donne pas de meilleurs textes, juste plus de friction pour choisir lequel ouvrir.",
    editorialEn: "For long-form text with precise tone constraints, Claude is better. For fast drafts, outlines, and short rewrites, ChatGPT with a Custom GPT configured for your style is more efficient. Perplexity is only justified if you write content that cites sources — it is the only one that anchors responses in verifiable clickable URLs. Paying for all three without configuring any of them does not produce better writing, just more friction about which tab to open.",
    checkpoints: [
      { q: "Tu as configuré un system prompt ou un Custom GPT avec ton ton éditorial ?", qEn: "Have you configured a system prompt or Custom GPT with your editorial style?", hint: "Non → tu réexpliques ton contexte à chaque session et tu perds une bonne partie de la qualité possible. C'est la première action à faire avant d'envisager un deuxième abonnement.", hintEn: "No → you re-explain your context every session and lose much of the achievable quality. This is the first action to take before considering a second subscription." },
      { q: "Tu utilises Claude Projects ou ChatGPT Projects pour tes sujets récurrents ?", qEn: "Do you use Claude Projects or ChatGPT Projects for your recurring topics?", hint: "Non → tu recommences chaque conversation de zéro. Les Projects maintiennent documents et contexte entre toutes les sessions d'un projet — différence structurelle pour tout contenu récurrent.", hintEn: "No → you restart every conversation from scratch. Projects maintain documents and context across all sessions of a project — a structural difference for any recurring content." },
      { q: "Tes meilleurs prompts sont sauvegardés quelque part ?", qEn: "Are your best prompts saved somewhere?", hint: "Non → tu recrées les mêmes prompts depuis zéro à chaque fois. Une bibliothèque de 10 prompts dans Notion = 30 minutes d'investissement, dividendes quotidiens.", hintEn: "No → you recreate the same prompts from scratch every time. A library of 10 prompts in Notion = 30 minutes of investment, daily dividends." },
    ],
    tools: [
      { role: "Rédaction longue", roleEn: "Long-form writing", slug: "claude", reason: "Meilleur sur le ton, la nuance et les textes longs sans hallucination grossière.", reasonEn: "Best at tone, nuance, and long texts without obvious hallucinations." },
      { role: "Polyvalent quotidien", roleEn: "Daily generalist", slug: "chatgpt", reason: "Le couteau suisse pour brouillons, plans, reformulations rapides.", reasonEn: "The Swiss army knife for drafts, outlines, quick rewrites." },
      { role: "Recherche sourcée", roleEn: "Sourced research", slug: "perplexity", reason: "À garder seulement si tu écris souvent du contenu factuel ou veille.", reasonEn: "Keep only if you often write factual content or do research." },
    ],
  },
  {
    id: "ai-image-niche",
    slug: "ia-generative-pour-images",
    title: "IA image",
    titleEn: "Image AI",
    subtitle: "Midjourney pour le style, Firefly pour les droits Adobe, Ideogram pour le texte lisible, Leonardo pour les détails — et une facture qui grimpe, sans que le flux soit vraiment clarifié.",
    subtitleEn: "For designers, creators, or marketers who want usable AI visuals without paying for Midjourney + Firefly + Leonardo + Ideogram at once.",
    persona: "designer",
    subProfiles: ["art-direction", "illustration", "brand"],
    stage: "lean",
    budget: "under50",
    monthlyBudget: 30,
    savings: 55,
    risk: "Payer trois générateurs d'images parce que chacun est un peu meilleur sur un cas particulier — alors qu'une ou deux plateformes couvrent 80% des projets courants.",
    riskEn: "Stacking 3 image generators because each does 10% better on one detail.",
    bestFor: "Visuels éditoriaux, moodboards, illustrations marketing, miniatures et concepts.",
    bestForEn: "Editorial visuals, moodboards, marketing illustrations, thumbnails, concepts.",
    avoidIf: "Tu produis des visuels pour impression professionnelle ou tu as des contraintes strictes sur les droits commerciaux.",
    avoidIfEn: "You produce pro print assets or need strict enterprise commercial rights.",
    editorial: "DALL-E 3 est inclus dans ChatGPT Plus. Si tu paies déjà ChatGPT, tu as un générateur d'images fonctionnel sans abonnement supplémentaire — et beaucoup de gens s'abonnent à Midjourney en parallèle sans le réaliser. Midjourney se justifie quand ton travail nécessite un rendu photo-réaliste ou artistique précis que DALL-E n'atteint pas. Ideogram V2 se justifie uniquement quand tu dois intégrer du texte lisible dans un visuel — c'est le seul qui le gère vraiment bien, et c'est sa seule vraie raison d'exister à côté de Midjourney.",
    editorialEn: "DALL-E 3 is included in ChatGPT Plus. If you already pay for ChatGPT, you have a working image generator at no extra cost — and many people subscribe to Midjourney on top without realizing it. Midjourney is justified when your work requires precise photorealistic or artistic output that DALL-E does not reach. Ideogram V2 is justified only when you need to embed readable text inside a visual — it is the only one that handles it reliably, and that is its only real reason to exist alongside Midjourney.",
    checkpoints: [
      { q: "Tu as testé DALL-E 3 (inclus dans ChatGPT Plus) sur tes derniers projets ?", qEn: "Have you tested DALL-E 3 (included in ChatGPT Plus) on your recent projects?", hint: "Non → avant de payer Midjourney en plus, teste DALL-E 3 sur ton prochain brief. La qualité couvre la plupart des usages éditoriaux et marketing sans abonnement supplémentaire.", hintEn: "No → before paying for Midjourney on top, test DALL-E 3 on your next brief. The quality covers most editorial and marketing uses without an extra subscription." },
      { q: "Tu génères plus de 50 images par mois ?", qEn: "Do you generate more than 50 images per month?", hint: "Non → le plan Basic Midjourney (10$/mois, 200 générations rapides) ou des crédits ponctuels suffisent. Le Standard à 30$/mois ne se justifie qu'à partir d'un usage quotidien intensif.", hintEn: "No → Midjourney's Basic plan ($10/month, 200 fast generations) or one-off credits are enough. The $30/month Standard plan is only justified with intense daily use." },
      { q: "Tes visuels sont destinés à de l'impression professionnelle ou du print ?", qEn: "Are your visuals intended for professional printing or print production?", hint: "Oui → vérifie les droits commerciaux de chaque outil. Midjourney Pro et Adobe Firefly sont les seuls avec des garanties commerciales claires pour le print professionnel.", hintEn: "Yes → check each tool's commercial rights. Midjourney Pro and Adobe Firefly are the only ones with clear commercial guarantees for professional print." },
    ],
    tools: [
      { role: "Image artistique", roleEn: "Artistic image", slug: "midjourney", reason: "Le meilleur rendu esthétique par défaut, références photo et style.", reasonEn: "Best aesthetic output by default, photo and style references." },
      { role: "Image avec texte", roleEn: "Image with text", slug: "ideogram", reason: "Le seul vraiment fiable pour intégrer du texte lisible dans une image.", reasonEn: "The only one truly reliable for embedding readable text in an image." },
      { role: "Intégration suite Adobe", roleEn: "Adobe suite integration", slug: "firefly", reason: "À garder uniquement si tu vis dans Photoshop / Illustrator au quotidien.", reasonEn: "Keep only if you live in Photoshop / Illustrator daily." },
    ],
  },
  {
    id: "ai-code-niche",
    slug: "ia-generative-pour-coder",
    title: "IA code",
    titleEn: "Coding AI",
    subtitle: "Copilot dans l'éditeur, Cursor pour les refactors, ChatGPT pour débugger, Claude pour l'architecture — à un moment, tu paies plus que tu ne codes, et les assistants se marchent dessus.",
    subtitleEn: "For freelance devs or indie makers who want to ship faster without paying for Cursor + Copilot + ChatGPT Plus + Claude all at once.",
    persona: "dev",
    subProfiles: ["ai-coding", "web", "product"],
    stage: "lean",
    budget: "under50",
    monthlyBudget: 40,
    savings: 50,
    risk: "Payer trois outils d'autocomplétion qui tournent tous sur le même dépôt — sans vraiment savoir lequel t'aide le plus.",
    riskEn: "Paying for 3 AI copilots that all do autocompletion on the same repo.",
    bestFor: "Sites clients, MVP, scripts, refactors, débogage et génération de tests.",
    bestForEn: "Client sites, MVPs, scripts, refactors, debugging, test generation.",
    avoidIf: "Tu travailles dans une grande base de code d'équipe avec des contraintes de sécurité strictes.",
    avoidIfEn: "You work in a large team codebase with strict security constraints.",
    editorial: "Cursor a deux modes que la plupart des utilisateurs n'exploitent qu'en partie : l'autocomplétion (qui remplace Copilot) et le mode Agent (qui modifie plusieurs fichiers en séquence sur une instruction complexe). C'est le mode Agent qui change vraiment le workflow, pas l'autocomplétion. Configurer un fichier .cursorrules dans chaque repo avec les conventions de code, le stack tech et les patterns préférés évite de réexpliquer le contexte à chaque session — et améliore immédiatement la qualité des suggestions.",
    editorialEn: "Cursor has two modes that most users only partly exploit: autocompletion (which replaces Copilot) and Agent mode (which edits multiple files in sequence on a complex instruction). Agent mode is what genuinely changes the workflow, not autocompletion. Configuring a .cursorrules file in each repo with your code conventions, tech stack, and preferred patterns eliminates re-explaining context every session — and immediately improves suggestion quality.",
    checkpoints: [
      { q: "Tu as configuré un fichier .cursorrules dans tes projets actifs ?", qEn: "Have you configured a .cursorrules file in your active projects?", hint: "Non → tu réexpliques tes conventions et ton stack à chaque session. 30 minutes de configuration = contexte automatique sur tous tes projets, qualité de réponse immédiatement meilleure.", hintEn: "No → you re-explain your conventions and stack every session. 30 minutes of setup = automatic context across all your projects, immediately better suggestion quality." },
      { q: "Tu utilises Cursor en mode Agent ou seulement pour l'autocomplétion ?", qEn: "Do you use Cursor in Agent mode or only for autocompletion?", hint: "Seulement autocomplétion → tu utilises 30% de l'outil pour 100% du prix. Le mode Agent sur une tâche multi-fichiers change la nature du travail, pas seulement la vitesse.", hintEn: "Only autocompletion → you use 30% of the tool for 100% of the price. Agent mode on a multi-file task changes the nature of the work, not just the speed." },
      { q: "Tu as GitHub Copilot actif dans le même éditeur que Cursor ?", qEn: "Do you have GitHub Copilot active in the same editor as Cursor?", hint: "Oui → deux assistants dans le même éditeur qui ne partagent pas le même contexte projet. Cursor inclut déjà l'autocomplétion. Annule Copilot.", hintEn: "Yes → two assistants in the same editor that do not share project context. Cursor already includes autocompletion. Cancel Copilot." },
    ],
    tools: [
      { role: "Éditeur IA principal", roleEn: "Main AI editor", slug: "cursor", reason: "Bien meilleur que Copilot pour les éditions multi-fichiers et le contexte projet.", reasonEn: "Much better than Copilot for multi-file edits and project context." },
      { role: "Raisonnement et debug", roleEn: "Reasoning and debug", slug: "claude", reason: "Excellent pour expliquer un bug, proposer une architecture, lire du code legacy.", reasonEn: "Excellent at explaining bugs, proposing architecture, reading legacy code." },
      { role: "Alternative low-cost", roleEn: "Low-cost alternative", slug: "deepseek", reason: "Si le budget est serré, qualité de code proche pour une fraction du prix.", reasonEn: "If budget is tight, near-equivalent code quality at a fraction of the price." },
    ],
  },
  {
    id: "ai-voice-video-niche",
    slug: "ia-generative-pour-voix-video",
    title: "IA voix & vidéo",
    titleEn: "Voice & video AI",
    subtitle: "Tu fais des vidéos de formation, du doublage ou des voix off. Mais ElevenLabs + HeyGen + Descript + Runway, c'est 200€/mois pour un format que tu publies peut-être deux fois par semaine.",
    subtitleEn: "For creators, trainers, or agencies producing voice-over, dubbing, avatars, or short videos without reinventing everything.",
    persona: "content",
    subProfiles: ["video", "podcast", "training"],
    stage: "scale",
    budget: "under150",
    monthlyBudget: 75,
    savings: 90,
    risk: "S'abonner à quatre outils voix-vidéo alors qu'un ou deux suffisent si on sait quel format on produit vraiment — et si on se l'avoue honnêtement.",
    riskEn: "Buying HeyGen + ElevenLabs + Descript + Runway when only one format really dominates your output.",
    bestFor: "Voix off, podcasts, doublage multilingue, avatars de formation et vidéos courtes.",
    bestForEn: "Voice-over, podcasts, multilingual dubbing, training avatars, short marketing videos.",
    avoidIf: "Tu publies une vidéo IA par mois — un forfait gratuit ou un crédit ponctuel suffit largement.",
    avoidIfEn: "You publish one AI video per month — a free tier or one-off credit is enough.",
    editorial: "ElevenLabs facture au caractère, pas à la minute. Un script de 30 minutes de voix off représente environ 40 000 à 50 000 caractères selon le débit de lecture. Le plan Starter à 5$/mois inclut 30 000 caractères — insuffisant pour une vidéo de formation mensuelle. Calculer son usage en caractères avant de choisir le plan évite de bloquer en pleine production. Pour les avatars HeyGen, l'Instant Avatar (créé depuis 2 minutes de vidéo de toi) est souvent suffisant pour des formations et des pitches sans gros plan serré — le Studio Avatar coûte plusieurs centaines d'euros et ne se justifie qu'en usage intensif.",
    editorialEn: "ElevenLabs charges by character, not by minute. A 30-minute voice-over script is roughly 40,000 to 50,000 characters depending on reading pace. The Starter plan at $5/month includes 30,000 characters — not enough for a monthly training video. Calculating your usage in characters before choosing a plan prevents getting blocked mid-production. For HeyGen avatars, the Instant Avatar (created from 2 minutes of video of yourself) is often sufficient for training and pitch content without tight close-ups — Studio Avatar costs several hundred euros and only justifies itself under heavy use.",
    checkpoints: [
      { q: "Tu as calculé combien de caractères tu consommes par mois sur ElevenLabs ?", qEn: "Have you calculated how many characters you consume per month on ElevenLabs?", hint: "Non → colle un script type dans un compteur de caractères : 1000 mots ≈ 6000-7000 caractères ≈ 4-5 minutes d'audio. C'est la seule façon de choisir le bon plan.", hintEn: "No → paste a typical script into a character counter: 1,000 words ≈ 6,000-7,000 characters ≈ 4-5 minutes of audio. That is the only way to choose the right plan." },
      { q: "Ton avatar HeyGen est de type Instant ou Studio ?", qEn: "Is your HeyGen avatar an Instant or Studio type?", hint: "Studio → vérifie si l'Instant Avatar (créé depuis 2 minutes de vidéo) suffit pour tes cas d'usage. La qualité est proche pour du format formation ou pitch sans gros plan visage.", hintEn: "Studio → check if an Instant Avatar (created from 2 minutes of video) is enough for your use cases. Quality is comparable for training or pitch formats without tight face close-ups." },
      { q: "Tu montes tes vidéos de formation par coupes manuelles ou par édition de transcription ?", qEn: "Do you edit your training videos with manual cuts or by editing the transcript?", hint: "Coupes manuelles → Descript ou CapCut avec édition par texte économise 50-60% du temps de montage sur des vidéos parlées. C'est la seule vraie raison de payer l'un des deux.", hintEn: "Manual cuts → Descript or CapCut with text-based editing saves 50-60% of editing time on talking-head videos. That is the only real reason to pay for either." },
    ],
    tools: [
      { role: "Voix synthétique", roleEn: "Synthetic voice", slug: "elevenlabs", reason: "Référence absolue sur le rendu naturel et le clonage de voix.", reasonEn: "Absolute reference for natural voice rendering and voice cloning." },
      { role: "Avatar vidéo", roleEn: "Video avatar", slug: "heygen", reason: "Le plus crédible pour avatars formation, pitch et localisation.", reasonEn: "Most credible for training avatars, pitches, and localization." },
      { role: "Édition podcast/vidéo", roleEn: "Podcast/video editing", slug: "descript", reason: "Édition par texte, à garder si tu produis régulièrement audio ou vidéo parlée.", reasonEn: "Edit-by-text — keep if you regularly produce audio or talking video." },
      { role: "Vidéo générative", roleEn: "Generative video", slug: "runway", reason: "Pour plans courts génératifs, B-roll IA, effets — pas pour la vidéo longue.", reasonEn: "For short generative shots, AI B-roll, effects — not long-form video." },
    ],
  },
  {
    id: "ai-research-niche",
    slug: "ia-generative-pour-recherche-veille",
    title: "Veille & recherche IA",
    titleEn: "AI research stack",
    subtitle: "Tu utilises une IA pour synthétiser de l'information. Le problème, c'est que ChatGPT fabrique des sources convaincantes, Perplexity les cite vraiment — et la différence n'est pas toujours visible au premier regard.",
    subtitleEn: "For consultants, analysts, or journalists who need sourced summaries without confusing generative AI with a search engine.",
    persona: "consultant",
    subProfiles: ["research", "copywriting", "client-delivery"],
    stage: "lean",
    budget: "under50",
    monthlyBudget: 25,
    savings: 35,
    risk: "Citer une IA comme source dans une note de synthèse cliente parce que le résultat semblait crédible — et découvrir trop tard que la source n'existe pas.",
    riskEn: "Citing ChatGPT as a reliable source instead of using a tool built for sourcing.",
    bestFor: "Veille concurrentielle, notes de synthèse, benchmarks et due diligence légère.",
    bestForEn: "Competitive intelligence, synthesis notes, benchmarks, light due diligence.",
    avoidIf: "Tu as besoin de bases de données spécialisées (juridique, scientifique, financier).",
    avoidIfEn: "You need specialized paid databases (legal, scientific, financial).",
    editorial: "Perplexity a une fonctionnalité appelée 'Focus' (Web, Academic, YouTube, Reddit) que la majorité des utilisateurs n'active jamais. Le Focus Academic interroge Semantic Scholar et PubMed en parallèle — pour de la synthèse sectorielle ou des notes clients qui citent des études, la qualité est fondamentalement différente. Claude Projects maintient le contexte de tous les documents et échanges d'un projet entre les sessions : pour analyser des rapports trimestriels récurrents ou des études de marché, c'est la fonctionnalité qui change la structure du travail.",
    editorialEn: "Perplexity has a feature called 'Focus' (Web, Academic, YouTube, Reddit) that the majority of users never activate. Academic Focus queries Semantic Scholar and PubMed simultaneously — for sector synthesis or client notes citing studies, the quality is fundamentally different. Claude Projects maintains context from all documents and conversations within a project across sessions: for analyzing recurring quarterly reports or market studies, this is the feature that changes the structure of the work.",
    checkpoints: [
      { q: "Tu utilises le Focus ou les Spaces de Perplexity pour filtrer tes sources ?", qEn: "Do you use Perplexity's Focus or Spaces to filter your sources?", hint: "Non → tu obtiens des résultats Web génériques quand tu pourrais avoir des sources académiques ou sectorielles ciblées. Le Focus Academic seul justifie l'abonnement pour quiconque rédige des notes de synthèse clients.", hintEn: "No → you get generic Web results when you could have targeted academic or sector-specific sources. Academic Focus alone justifies the subscription for anyone writing client synthesis notes." },
      { q: "Tu analyses des documents récurrents (rapports trimestriels, études sectorielles) pour des clients ?", qEn: "Do you analyze recurring documents (quarterly reports, sector studies) for clients?", hint: "Oui → Claude Projects maintient le document dans le contexte de tous les échanges du projet, pas seulement de la session en cours. Pour des rapports récurrents, la différence est structurelle.", hintEn: "Yes → Claude Projects keeps the document in the context of all project exchanges, not just the current session. For recurring reports, the difference is structural." },
      { q: "Tu recoupes tes synthèses IA avec des sources primaires avant de les livrer ?", qEn: "Do you cross-check your AI summaries with primary sources before delivering?", hint: "Non → une hallucination convaincante dans une note client coûte plus en crédibilité que tu n'économises en temps. Perplexity + vérification des citations = protection minimale non négociable.", hintEn: "No → one convincing hallucination in a client note costs more in credibility than you save in time. Perplexity + citation verification = non-negotiable minimum protection." },
    ],
    tools: [
      { role: "Recherche sourcée", roleEn: "Sourced research", slug: "perplexity", reason: "Réponses avec citations cliquables, le bon réflexe avant de copier-coller.", reasonEn: "Answers with clickable citations — the right reflex before copy-pasting." },
      { role: "Analyse de documents longs", roleEn: "Long document analysis", slug: "claude", reason: "Imbattable pour digérer un PDF de 100 pages et en sortir une synthèse propre.", reasonEn: "Unbeatable at digesting a 100-page PDF and producing a clean synthesis." },
      { role: "Vérification croisée", roleEn: "Cross-check", slug: "gemini", reason: "Utile pour recouper une info quand l'enjeu de fiabilité est élevé.", reasonEn: "Useful to cross-check info when reliability matters." },
    ],
  },
  {
    id: "client-delivery",
    slug: "livraison-client-asynchrone",
    title: "Mission remote",
    titleEn: "Remote delivery stack",
    subtitle: "Tu as Slack pour les urgences, Teams parce que le client l'impose, Loom pour les retours et Calendly pour les appels. À un moment, gérer la communication prend plus de temps que faire le travail.",
    subtitleEn: "For client missions where you need fewer meetings, structured feedback, and a clean decision trail.",
    persona: "consultant",
    subProfiles: ["client-delivery", "training", "operations"],
    stage: "lean",
    budget: "under50",
    monthlyBudget: 34,
    savings: 52,
    risk: "Confondre collaboration et multiplication de canaux — et passer plus de temps à gérer la communication qu'à avancer sur la mission.",
    riskEn: "Confusing client collaboration with multiplying channels.",
    bestFor: "Missions récurrentes, revues de conception, conseil, formation et accompagnement à distance.",
    bestForEn: "Recurring missions, design review, consulting, training, remote delivery.",
    avoidIf: "Tes clients imposent déjà leur propre environnement — Teams, Jira ou autre.",
    avoidIfEn: "Your clients already impose Teams, Jira, or their own environment.",
    editorial: "Un 'journal de décisions' dans Notion mis à jour après chaque point client (date, décision, qui a validé) est la protection la plus efficace contre le scope creep et les 'j'avais compris autre chose' en fin de projet. Loom a une limite de 5 minutes sur le plan gratuit — suffisante pour la plupart des retours ponctuels. La vraie valeur du plan payant : les analytics (savoir si le client a regardé la vidéo) et l'absence de watermark. Si tu n'as pas besoin de ces deux fonctionnalités, le gratuit suffit.",
    editorialEn: "A 'decision log' in Notion updated after each client check-in (date, decision, who approved it) is the most effective protection against scope creep and 'I understood something different' at the end of a project. Loom has a 5-minute limit on the free plan — sufficient for most one-off feedback. The real value of the paid plan: analytics (knowing whether the client watched the video) and no watermark. If you do not need both of those features, the free tier is enough.",
    checkpoints: [
      { q: "Tu as un 'journal de décisions' partagé avec chaque client actif ?", qEn: "Do you have a shared 'decision log' with each active client?", hint: "Non → une section Notion par client avec date, décision et validateur = protection contre le scope creep et les malentendus en fin de mission. C'est aussi ta couverture si un désaccord survient.", hintEn: "No → a Notion section per client with date, decision, and approver = protection against scope creep and end-of-project misunderstandings. It is also your coverage if a dispute arises." },
      { q: "Tes clients te contactent encore par WhatsApp ou SMS pour des questions de mission ?", qEn: "Do your clients still reach you via WhatsApp or SMS for mission questions?", hint: "Oui → ce n'est pas un problème d'outil, c'est un problème de cadrage. Reformuler au kick-off : 'toutes les demandes dans Notion, les vraies urgences par téléphone'. Sans cadre explicite, le canal le plus court gagne toujours.", hintEn: "Yes → that is not a tooling problem, it is a framing problem. Set it up at kick-off: 'all requests in Notion, real emergencies by phone'. Without an explicit framework, the shortest channel always wins." },
      { q: "Loom a remplacé de vraies réunions dans les 30 derniers jours ?", qEn: "Has Loom actually replaced real meetings in the last 30 days?", hint: "Non → Loom ne se justifie que si tu remplaces des appels, pas si tu les ajoutes en parallèle. La bonne question avant de planifier une réunion : est-ce qu'un Loom de 5 minutes règlerait ça ?", hintEn: "No → Loom is only justified if it replaces calls, not if you add it alongside them. The right question before scheduling a meeting: would a 5-minute Loom resolve this?" },
    ],
    tools: [
      { role: "Base projet", roleEn: "Project base", slug: "notion", reason: "Une page client claire vaut souvent mieux qu'un espace complet.", reasonEn: "A clear client page often beats a full workspace." },
      { role: "Vidéo courte", roleEn: "Short video", slug: "loom", reason: "Rentable si elle remplace vraiment des réunions.", reasonEn: "Worth it only when it truly replaces meetings." },
      { role: "Planification", roleEn: "Scheduling", slug: "calendly", reason: "À garder si le volume d'appels justifie l'abonnement.", reasonEn: "Keep if meeting volume justifies the subscription." },
      { role: "Documents", roleEn: "Documents", slug: "google-drive", reason: "Contrats, livrables et exports accessibles.", reasonEn: "Contracts, deliverables, and exports stay accessible." },
    ],
  },
  {
    id: "ai-visual-aggregator",
    slug: "ia-visuelle-tout-en-un",
    title: "IA visuelle tout-en-un",
    titleEn: "All-in-one visual AI",
    subtitle: "Tu génères des images, tu améliores la résolution, tu fais quelques plans vidéo. Chaque besoin a son outil, chaque outil a son abonnement — alors qu'il existe des plateformes qui font tout ça ensemble.",
    subtitleEn: "For designers, ADs, or creatives stacking Midjourney + Runway + Magnific + an upscaler — when one aggregator covers 80% of the need.",
    persona: "designer",
    subProfiles: ["art-direction", "illustration", "motion", "video"],
    stage: "lean",
    budget: "under50",
    monthlyBudget: 35,
    savings: 70,
    risk: "Payer quatre plateformes IA visuelles qui se recoupent à 70%, parce qu'on a ajouté chaque outil au moment où on en avait besoin, sans jamais reconsidérer l'ensemble.",
    riskEn: "Paying for 4 separate visual AI platforms that overlap 70% on image, video, and upscale.",
    bestFor: "Moodboards, illustrations marketing, concept art, miniatures et courtes séquences vidéo.",
    bestForEn: "Moodboards, marketing illustrations, concept art, thumbnails, short AI videos.",
    avoidIf: "Tu produis pour l'impression professionnelle avec des contraintes strictes sur les droits commerciaux.",
    avoidIfEn: "You produce pro print with strict enterprise commercial-rights constraints.",
    editorial: "Krea AI a une fonctionnalité appelée Realtime Canvas — tu peins ou colles une référence et l'image se génère en temps réel pendant que tu modifies. Pour le moodboarding et la direction artistique rapide, c'est qualitativement différent de tous les autres outils. Le Style Training (entraîner un modèle sur tes propres images) est l'autre fonctionnalité rare : pour un DA ou un studio avec une signature visuelle, c'est l'outil qui rend le style reproduisible à volonté. Magnific AI est souvent acheté pour de l'upscale digital — sa vraie puissance est dans l'upscale avec 'hallucination contrôlée' qui invente des détails plausibles à haute résolution, ce qui est parfait pour le print mais à éviter sur des photos de produit.",
    editorialEn: "Krea AI has a feature called Realtime Canvas — you paint or paste a reference and the image generates in real time as you modify. For moodboarding and fast art direction, this is qualitatively different from any other tool. Style Training (training a model on your own images) is the other rare capability: for an AD or studio with a visual signature, it makes that style reproducible on demand. Magnific AI is often bought for digital upscaling — its real power is in upscale with 'controlled hallucination' that invents plausible high-resolution details, which is ideal for print but should be avoided on product photography.",
    checkpoints: [
      { q: "Tu utilises Krea pour son Realtime Canvas ou seulement pour la génération standard ?", qEn: "Do you use Krea for its Realtime Canvas or only for standard generation?", hint: "Seulement génération → tu rates la fonctionnalité qui le différencie réellement. 30 minutes en mode Realtime Canvas sur un brief client = plus de direction artistique validée qu'une heure de brief textuel.", hintEn: "Only generation → you are missing the feature that genuinely sets it apart. 30 minutes in Realtime Canvas on a client brief = more validated art direction than an hour of text briefing." },
      { q: "Tu gardes un abonnement Runway pour moins de 10 plans génératifs par mois ?", qEn: "Do you keep a Runway subscription for fewer than 10 generative shots per month?", hint: "Oui → les crédits à l'achat (10$/100 crédits) sont plus économiques que le Standard (12$/mois) en dessous de ce volume. L'abonnement Runway ne se justifie qu'à partir d'un usage vidéo régulier.", hintEn: "Yes → credits purchased outright ($10/100 credits) are more economical than Standard ($12/month) below that volume. A Runway subscription is only justified with regular video production." },
      { q: "Tu paies Magnific pour de l'upscale sur du contenu web ou social ?", qEn: "Are you paying for Magnific to upscale web or social content?", hint: "Oui → Magnific est conçu pour du print haute résolution. Pour du contenu digital, l'upscale natif de Krea ou Upscayl (gratuit, open-source) suffisent largement.", hintEn: "Yes → Magnific is designed for high-resolution print. For digital content, Krea's native upscale or Upscayl (free, open-source) are more than enough." },
    ],
    tools: [
      { role: "Plateforme principale", roleEn: "Main platform", slug: "krea-ai", reason: "Real-time generation, enhance, vidéo et training de styles dans un seul abonnement.", reasonEn: "Real-time generation, enhance, video, and style training in a single subscription." },
      { role: "Upscale haut de gamme", roleEn: "Premium upscale", slug: "magnific-ai", reason: "À garder seulement si tu livres des visuels print ou très grand format.", reasonEn: "Keep only if you deliver print or very large-format visuals." },
      { role: "Image stylisée", roleEn: "Stylized image", slug: "midjourney", reason: "Garder si le rendu Midjourney reste signature de ta direction artistique.", reasonEn: "Keep if Midjourney's look is still part of your artistic signature." },
    ],
  },
  {
    id: "nocode-app-builder",
    slug: "constructeur-app-nocode-ia",
    title: "MVP no-code IA",
    titleEn: "AI no-code MVP",
    subtitle: "Tu veux lancer quelque chose : un outil client, un prototype, un micro-produit. Tu as regardé Bubble pour la logique, Webflow pour le front, Zapier pour les automatisations — et la facture grimpe avant d'avoir un seul utilisateur.",
    subtitleEn: "For solos, indie hackers, or consultants shipping an MVP, site, and business logic without stacking 4 no-code tools.",
    persona: "dev",
    subProfiles: ["no-code", "product", "web", "automation"],
    stage: "starter",
    budget: "under50",
    monthlyBudget: 25,
    savings: 80,
    risk: "Payer Bubble + Webflow + Zapier + Airtable alors qu'un seul outil IA moderne génère le front, le back et le déploiement à partir d'un simple descriptif.",
    riskEn: "Paying for Bubble + Webflow + Zapier + Airtable when one AI builder covers frontend, backend, and deployment.",
    bestFor: "MVP, sites clients, prototypes interactifs, tableaux de bord internes et micro-SaaS.",
    bestForEn: "MVPs, client sites, interactive prototypes, internal dashboards, micro-SaaS.",
    avoidIf: "Tu construis un produit avec des contraintes sérieuses de montée en charge, de sécurité ou de conformité.",
    avoidIfEn: "You build a product with advanced scalability, security, or compliance needs.",
    editorial: "Lovable génère du code React avec Tailwind et shadcn — lisible, structuré, et éjectable vers un vrai repo Git quand tu veux reprendre la main. Si tu envisages de passer en code propre après validation, Lovable est le bon choix. Bolt génère plus vite mais produit souvent du code plus verbeux et moins maintenable. La règle d'or pour les deux : décrire en termes fonctionnels ('quand l'utilisateur clique X, ça fait Y') plutôt que visuels réduit de moitié le nombre d'itérations. Lovable + Supabase (free tier généreux) + Stripe couvre auth, base de données et paiement sans une ligne de code backend.",
    editorialEn: "Lovable generates React code with Tailwind and shadcn — readable, structured, and ejectable to a real Git repo when you want to take over. If you plan to move to clean code after validation, Lovable is the right choice. Bolt generates faster but often produces more verbose and harder-to-maintain code. The golden rule for both: describing in functional terms ('when the user clicks X, it does Y') rather than visual terms cuts the number of iterations in half. Lovable + Supabase (generous free tier) + Stripe covers auth, database, and payments without a single line of backend code.",
    checkpoints: [
      { q: "Tu as une maquette (même papier) avant de commencer à prompter dans le builder ?", qEn: "Do you have a mockup (even on paper) before starting to prompt in the builder?", hint: "Non → tu vas passer 40% du temps à corriger des décisions d'UI que tu aurais pu fixer en 20 minutes de wireframe. Figma + quelques frames = prompt 10× plus précis.", hintEn: "No → you will spend 40% of the time fixing UI decisions you could have locked down in 20 minutes of wireframing. Figma + a few frames = 10× more precise prompt." },
      { q: "Ton MVP a besoin d'auth, de paiement et de base de données dès le départ ?", qEn: "Does your MVP need authentication, payment, and database from day one?", hint: "Oui → Lovable + Supabase + Stripe couvre ça sans code backend. Non → commence par une landing + Tally. Valide l'intérêt avant de construire la logique.", hintEn: "Yes → Lovable + Supabase + Stripe covers this without backend code. No → start with a landing page + Tally form. Validate interest before building logic." },
      { q: "Tu envisages de reprendre le code généré pour le maintenir toi-même ?", qEn: "Do you plan to take over the generated code and maintain it yourself?", hint: "Oui → Lovable génère du React/Tailwind/shadcn structuré. Bolt génère souvent du code plus difficile à maintenir. Choisis en fonction de ce que tu comptes faire après le MVP.", hintEn: "Yes → Lovable generates structured React/Tailwind/shadcn. Bolt often generates harder-to-maintain code. Choose based on what you plan to do after the MVP." },
    ],
    tools: [
      { role: "Builder IA principal", roleEn: "Main AI builder", slug: "lovable", reason: "Génère front + back + déploiement à partir de prompts, le plus complet pour un solo.", reasonEn: "Generates front + back + deployment from prompts — the most complete option for a solo." },
      { role: "Alternative rapide", roleEn: "Fast alternative", slug: "bolt-new", reason: "Bon pour prototypes ultra-rapides, à choisir si tu veux itérer en quelques minutes.", reasonEn: "Good for ultra-fast prototypes — pick if you want to iterate in minutes." },
      { role: "Hébergement edge", roleEn: "Edge hosting", slug: "vercel", reason: "Déploiement standard si tu sors du builder pour passer en code.", reasonEn: "Standard deployment if you eject the builder to write code." },
    ],
  },
  {
    id: "ai-personal-productivity",
    slug: "productivite-ia-personnelle",
    title: "Notes & réflexion IA",
    titleEn: "AI notes stack",
    subtitle: "Notion AI pour résumer, ChatGPT pour explorer, Otter pour transcrire, Mem pour retrouver. C'est la même ambition fragmentée en quatre abonnements — sans vraiment savoir lequel tu utilises au quotidien.",
    subtitleEn: "For consultants, creators, or knowledge workers wanting an augmented brain without stacking ChatGPT + Notion AI + Otter + Mem + Raycast Pro in parallel.",
    persona: "consultant",
    subProfiles: ["research", "client-delivery", "operations"],
    stage: "lean",
    budget: "under50",
    monthlyBudget: 30,
    savings: 50,
    risk: "Payer quatre IA personnelles qui font toutes du résumé, de la recherche et du chat dans tes notes — et n'en utiliser vraiment aucune en profondeur.",
    riskEn: "Paying for 4 personal AIs that all do summarization, chat, and search in your notes.",
    bestFor: "Comptes rendus de réunions, base de connaissance personnelle, recherche dans tes docs et rédaction quotidienne.",
    bestForEn: "Meeting notes, second brain, searching your docs, daily writing.",
    avoidIf: "Tu es à l'aise avec un seul outil et ton organisation tient déjà dans Notion ou Obsidian.",
    avoidIfEn: "You are fine with a single tool and your workflow already fits in Notion or Obsidian.",
    editorial: "ChatGPT Projects et Claude Projects maintiennent un contexte persistant entre toutes les sessions d'un projet — documents uploadés, instructions, historique. La plupart des gens recommencent chaque conversation de zéro et réexpliquent le même contexte indéfiniment. Configurer un Project par client récurrent ou par projet long change structurellement la qualité des échanges — et c'est inclus dans l'abonnement de base. Notion AI n'a de valeur réelle que si tu crées activement des notes dans Notion : en dessous de 30 pages actives consultées régulièrement, le ROI de l'add-on à 10$/mois n'est pas là.",
    editorialEn: "ChatGPT Projects and Claude Projects maintain persistent context across all sessions within a project — uploaded documents, instructions, history. Most people restart every conversation from scratch and re-explain the same context indefinitely. Configuring a Project per recurring client or long project structurally changes the quality of exchanges — and it is included in the base subscription. Notion AI only has real value if you actively create notes in Notion: below 30 pages regularly consulted, the ROI of the €10/month add-on is not there.",
    checkpoints: [
      { q: "Tu utilises les Projects de ChatGPT ou Claude pour tes sujets récurrents ?", qEn: "Do you use ChatGPT Projects or Claude Projects for your recurring topics?", hint: "Non → tu réexpliques le même contexte à chaque session. 20 minutes à configurer un Project par client ou sujet = contexte que tu construis sur des semaines, pas des sessions isolées.", hintEn: "No → you re-explain the same context every session. 20 minutes to set up a Project per client or topic = context you build over weeks, not isolated sessions." },
      { q: "Tu as Notion AI actif mais tu n'utilises pas Notion comme outil principal de notes ?", qEn: "Do you have Notion AI active but not use Notion as your main note-taking tool?", hint: "Oui → ne paie pas un add-on pour un outil que tu n'ouvres pas. Notion AI n'a de valeur que sur les notes que tu y crées vraiment.", hintEn: "Yes → do not pay for an add-on to a tool you rarely open. Notion AI only has value on the notes you actually create there." },
      { q: "Tes transcriptions Otter sont-elles reliées à tes notes Notion de la même réunion ?", qEn: "Are your Otter transcripts linked to your Notion notes from the same meeting?", hint: "Non → un scénario Make simple (Otter → Notion) importe automatiquement le résumé et les action items dans la page correspondante. 10 minutes de configuration pour un gain quotidien.", hintEn: "No → a simple Make scenario (Otter → Notion) automatically imports the summary and action items into the corresponding page. 10 minutes of setup for a daily gain." },
    ],
    tools: [
      { role: "IA dans tes notes", roleEn: "AI in your notes", slug: "notion-ai", reason: "Si tu vis déjà dans Notion, c'est l'ajout IA le plus rentable, sinon ne paie pas.", reasonEn: "If you already live in Notion, this is the highest-ROI AI add-on; otherwise skip." },
      { role: "Chat polyvalent", roleEn: "General chat", slug: "chatgpt", reason: "Un seul chat IA suffit pour brouillons, plans et reformulations.", reasonEn: "One AI chat is enough for drafts, outlines, and rewrites." },
      { role: "Transcription réunions", roleEn: "Meeting transcription", slug: "otter-ai", reason: "À garder si tu as plus de 4 réunions à transcrire par semaine.", reasonEn: "Keep only if you transcribe more than 4 meetings per week." },
    ],
  },
  {
    id: "product-analytics-aggregator",
    slug: "analytics-produit-tout-en-un",
    title: "Analytics produit",
    titleEn: "Product analytics stack",
    subtitle: "Tu veux comprendre ce que font tes utilisateurs. GA pour le trafic, Mixpanel pour les événements, Hotjar pour les sessions, LogRocket pour les erreurs. 300€/mois pour un produit qui n'a peut-être pas encore cent utilisateurs actifs.",
    subtitleEn: "For PMs, founders, or growth folks stacking 3 analytics tools when one platform covers events, sessions, and funnels.",
    persona: "ops",
    subProfiles: ["analytics", "product", "web"],
    stage: "scale",
    budget: "under150",
    monthlyBudget: 0,
    savings: 95,
    risk: "Payer quatre outils d'analyse alors qu'une seule plateforme open-source couvre événements, sessions et entonnoirs — souvent gratuitement.",
    riskEn: "Paying for Mixpanel + Hotjar + LogRocket + GA Premium when one open-source platform covers 90% of the need.",
    bestFor: "SaaS en phase de lancement, suivi de croissance, tests A/B légers, replay de sessions et entonnoirs.",
    bestForEn: "Early-stage SaaS, growth tracking, light A/B testing, session replay, funnels.",
    avoidIf: "Tu as une équipe data dédiée et des contraintes RGPD strictes gérées par un DPO.",
    avoidIfEn: "You have a dedicated data team and strict GDPR constraints on the DPO side.",
    editorial: "PostHog a une limite de 1 million d'events par mois sur le free tier — ce qui semble confortable jusqu'au moment où on réalise que page views + clics + custom events s'accumulent vite. Un produit avec 300 MAU actifs peut atteindre 500 000 events/mois si tout est tracké sans discrimination. Configurer le sampling sur les events non-critiques dès le départ (ou activer le recording uniquement sur les flows critiques : onboarding, upgrade, churn) évite de découvrir le dépassement au mauvais moment. La règle : 3 events max au lancement — activation (premier moment de valeur), rétention J7, et l'event qui précède le churn.",
    editorialEn: "PostHog has a 1 million events per month limit on the free tier — which seems comfortable until you realize that page views + clicks + custom events add up quickly. A product with 300 active MAU can hit 500,000 events/month if everything is tracked without discrimination. Configuring sampling on non-critical events from the start (or enabling recording only on critical flows: onboarding, upgrade, churn) prevents discovering the overage at the wrong moment. The rule: 3 events max at launch — activation (first moment of value), D7 retention, and the event that precedes churn.",
    checkpoints: [
      { q: "Tu as défini tes 3 à 5 events critiques avant d'instrumenter ?", qEn: "Did you define your 3 to 5 critical events before instrumenting?", hint: "Non → tu vas te retrouver avec 50 custom events dont 45 que tu ne regardes jamais. Les seuls events qui comptent à l'early-stage : activation, rétention J7, event précédant le churn. Commence uniquement par là.", hintEn: "No → you will end up with 50 custom events of which 45 you never look at. The only events that matter at early-stage: activation, D7 retention, the event before churn. Start only with those." },
      { q: "Tu regardes tes analytics plus d'une fois par semaine ?", qEn: "Do you look at your analytics more than once a week?", hint: "Non → tu paies pour de la réassurance, pas pour de l'action. Configure 3 métriques max en dashboard + une alerte sur les anomalies (drop >20%). Plus fréquent = bruit, pas signal.", hintEn: "No → you are paying for reassurance, not for action. Set up 3 metrics max on a dashboard + one alert on anomalies (drop >20%). More frequent = noise, not signal." },
      { q: "Tu as une base SQL et tu veux créer des analyses personnalisées ?", qEn: "Do you have a SQL database and want custom analyses?", hint: "Oui → Metabase open-source déployé sur un VPS (10-15€/mois) est structurellement supérieur à n'importe quel SaaS analytics pour des requêtes SQL custom. PostHog SQL Insights couvre les cas intermédiaires.", hintEn: "Yes → open-source Metabase deployed on a VPS (€10-15/month) is structurally superior to any analytics SaaS for custom SQL queries. PostHog SQL Insights covers intermediate cases." },
    ],
    tools: [
      { role: "Plateforme tout-en-un", roleEn: "All-in-one platform", slug: "posthog", reason: "Free tier généreux, events + session replay + feature flags + A/B au même endroit.", reasonEn: "Generous free tier, events + session replay + feature flags + A/B in one place." },
      { role: "Analytics web simple", roleEn: "Simple web analytics", slug: "plausible", reason: "À ajouter seulement si tu veux un dashboard public léger pour ton site marketing.", reasonEn: "Add only if you want a lightweight public dashboard for your marketing site." },
      { role: "Dashboard décisionnel", roleEn: "Business dashboard", slug: "metabase", reason: "Si tu as une vraie base SQL, beaucoup mieux que d'empiler des SaaS analytics.", reasonEn: "If you have a real SQL database, much better than stacking analytics SaaS." },
    ],
  },
  {
    id: "creative-suite-alternative",
    slug: "alternative-suite-adobe",
    title: "Alternative Adobe",
    titleEn: "Adobe alternative stack",
    subtitle: "Tu paies 60€/mois à Adobe depuis des années. Tu utilises vraiment Photoshop pour la retouche, peut-être Illustrator pour quelques exports — et c'est à peu près tout. Figma a remplacé XD. Canva a remplacé InDesign pour les supports rapides.",
    subtitleEn: "For designers, illustrators, or photographers paying €60/month for Adobe CC but only really using 2 or 3 apps.",
    persona: "designer",
    subProfiles: ["ui-ux", "brand", "photo", "illustration", "video"],
    stage: "lean",
    budget: "under50",
    monthlyBudget: 28,
    savings: 35,
    risk: "Payer la suite Adobe complète par habitude et par peur de manquer quelque chose le jour où on en aurait besoin — alors que 90% du travail tient dans Figma, Canva et un éditeur photo.",
    riskEn: "Paying for full Adobe suite when 90% of work fits in Figma + Canva + a photo editor.",
    bestFor: "Branding, UX/UI, réseaux sociaux, retouche photo courante, supports marketing et illustration.",
    bestForEn: "Branding, UX/UI, social, light photo retouching, marketing assets, vector illustration.",
    avoidIf: "Tu fais de la postproduction vidéo professionnelle, de l'impression complexe ou du motion design avancé.",
    avoidIfEn: "You do broadcast video post-production, complex pro print, or heavy motion design.",
    editorial: "Affinity Suite V2 (Photo + Designer + Publisher) coûte 170€ à l'achat avec une licence universelle Mac + PC + iPad — soit 2,8 mois d'Adobe CC. Le seul vrai bloquant pour migrer : les fichiers .AI (Illustrator). Affinity ouvre les .PSD avec une excellente fidélité. Les .AI sont plus aléatoires — le format est propriétaire et fermé par Adobe. Si tes clients t'envoient des .AI régulièrement, garder uniquement le plan Adobe Single App Illustrator (24€/mois) est plus intelligent que la suite complète. Autre piège souvent oublié : les polices Adobe Fonts disparaissent si tu annules l'abonnement — identifier lesquelles tu utilises dans des livrables clients avant d'annuler est une étape non négociable.",
    editorialEn: "Affinity Suite V2 (Photo + Designer + Publisher) costs €170 as a one-time purchase with a universal Mac + PC + iPad license — that is 2.8 months of Adobe CC. The only real blocker for migrating: .AI files (Illustrator). Affinity opens .PSD files with excellent fidelity. .AI files are more hit-or-miss — the format is proprietary and closed by Adobe. If your clients regularly send .AI files, keeping only the Adobe Single App Illustrator plan (€24/month) is smarter than the full suite. Another often-forgotten trap: Adobe Fonts disappear if you cancel the subscription — identifying which ones you use in client deliverables before canceling is a non-negotiable step.",
    checkpoints: [
      { q: "Tes clients t'envoient régulièrement des fichiers source .AI ou .INDD ?", qEn: "Do your clients regularly send you .AI or .INDD source files?", hint: "Oui → migrer complètement d'Adobe est risqué. Le plan Single App Illustrator à 24€/mois est plus intelligent que la suite complète à 60€. Non → Affinity Suite à l'achat unique est le chemin.", hintEn: "Yes → migrating completely from Adobe is risky. The Single App Illustrator plan at €24/month is smarter than the full €60 suite. No → Affinity Suite as a one-time purchase is the path." },
      { q: "Tu utilises des polices Adobe Fonts dans des livrables clients actuels ?", qEn: "Are you using Adobe Fonts in current client deliverables?", hint: "Oui → elles disparaissent si tu annules l'abonnement. Identifie lesquelles avant d'annuler et trouve les équivalents sur Google Fonts ou Fontshare (gratuits, libre de droits). C'est l'étape que tout le monde oublie.", hintEn: "Yes → they disappear if you cancel the subscription. Identify which ones before canceling and find equivalents on Google Fonts or Fontshare (free, license-clear). This is the step everyone forgets." },
      { q: "Tu fais du montage vidéo avec Premiere Pro pour des projets non-broadcast ?", qEn: "Do you edit video with Premiere Pro for non-broadcast projects?", hint: "Oui → DaVinci Resolve Free est une alternative professionnelle complète, utilisée en post-production cinéma. Il n'y a aucune raison fonctionnelle de payer Premiere Pro pour du montage solo non-broadcast.", hintEn: "Yes → DaVinci Resolve Free is a complete professional alternative used in cinema post-production. There is no functional reason to pay for Premiere Pro for solo non-broadcast editing." },
    ],
    tools: [
      { role: "Design produit / UI", roleEn: "Product / UI design", slug: "figma", reason: "Référence absolue, gratuit pour solo, remplace XD + une partie d'Illustrator.", reasonEn: "Absolute reference, free for solo, replaces XD and part of Illustrator." },
      { role: "Visuels marketing", roleEn: "Marketing visuals", slug: "canva", reason: "Remplace InDesign et Illustrator pour 80% des supports marketing courants.", reasonEn: "Replaces InDesign and Illustrator for 80% of common marketing assets." },
      { role: "Retouche photo", roleEn: "Photo retouching", slug: "luminar-neo", reason: "Achat unique, suffisant pour la majorité des retouches courantes hors print pro.", reasonEn: "One-time purchase, enough for most everyday retouching outside of pro print." },
      { role: "Vidéo / cut rapide", roleEn: "Video / fast cut", slug: "capcut", reason: "Gratuit, remplace Premiere Pro pour les formats sociaux et le montage rapide.", reasonEn: "Free, replaces Premiere Pro for social formats and fast editing." },
    ],
  },
  {
    id: "ux-product-designer-system",
    slug: "designer-ui-ux-systeme-produit",
    title: "Stack UI/UX",
    titleEn: "UI/UX stack",
    subtitle: "Tu conçois des interfaces, des landing pages ou des dashboards. La valeur n'est pas d'avoir 25 plugins : c'est d'avoir un système, des composants fiables et un handoff qui évite les allers-retours.",
    subtitleEn: "For product designers who need systems, components, handoff, and accessibility without bloating Figma.",
    persona: "designer",
    subProfiles: ["ui-ux", "web", "brand"],
    stage: "scale",
    budget: "under50",
    monthlyBudget: 42,
    savings: 85,
    risk: "Multiplier plugins, librairies et outils de handoff alors que le vrai problème est souvent l'absence de conventions partagées.",
    riskEn: "Multiplying plugins, libraries, and handoff tools while the real issue is missing shared conventions.",
    bestFor: "UI/UX freelance, product designer solo, refonte SaaS, design system léger et landing pages.",
    bestForEn: "Freelance UI/UX, solo product designers, SaaS redesigns, light design systems, and landing pages.",
    avoidIf: "Tu livres surtout du print, de la photo ou des identités sans interfaces.",
    avoidIfEn: "You mostly deliver print, photo, or identity work without interfaces.",
    editorial: "Le bon setup UI/UX commence par trois couches : Figma comme source de vérité, Tokens Studio uniquement si les styles doivent vivre au-delà d'une maquette, Stark avant livraison pour éviter les problèmes de contraste. Iconify est utile parce qu'il évite de disperser les icônes dans dix fichiers. Zeplin ne se justifie que si l'équipe dev ne travaille pas dans Figma. Sinon, c'est un deuxième handoff qui ajoute du bruit.",
    editorialEn: "A strong UI/UX setup starts with three layers: Figma as the source of truth, Tokens Studio only if styles need to live beyond mockups, and Stark before delivery to catch contrast issues. Iconify helps because it avoids scattering icons across ten files. Zeplin only makes sense if the dev team does not work in Figma. Otherwise it is a second handoff layer that adds noise.",
    needs: [
      { title: "Une source de vérité design", titleEn: "One design source of truth", detail: "Figma porte les composants, les états, les commentaires et les écrans validés.", detailEn: "Figma holds components, states, comments, and approved screens." },
      { title: "Des tokens seulement si utiles", titleEn: "Tokens only when useful", detail: "Tokens Studio devient rentable quand couleurs, typo et espacements doivent être maintenus dans plusieurs thèmes ou produits.", detailEn: "Tokens Studio pays off when colors, typography, and spacing must be maintained across several themes or products." },
      { title: "Un contrôle qualité avant dev", titleEn: "Quality control before dev", detail: "Stark et un check composants évitent de transmettre des erreurs qui coûtent plus cher en développement.", detailEn: "Stark and component checks avoid handing off errors that cost more in development." },
    ],
    maturitySignals: [
      { title: "Plus de 40 composants", titleEn: "More than 40 components", detail: "C'est le moment de formaliser variants, naming, tokens et états.", detailEn: "That is when variants, naming, tokens, and states need structure." },
      { title: "Handoff récurrent aux devs", titleEn: "Recurring dev handoff", detail: "Si les mêmes questions reviennent, ce n'est pas un problème de plugin : c'est un problème de conventions.", detailEn: "If the same questions return, it is not a plugin problem: it is a conventions problem." },
    ],
    traps: [
      { title: "Plugin magique", titleEn: "Magic plugin", detail: "Un plugin ne remplace pas une nomenclature claire ni une bibliothèque propre.", detailEn: "A plugin does not replace clear naming or a clean library." },
      { title: "Zeplin par habitude", titleEn: "Zeplin by habit", detail: "Garde Zeplin seulement si le client l'impose ou si Figma Dev Mode n'est pas adopté.", detailEn: "Keep Zeplin only if the client requires it or if Figma Dev Mode is not adopted." },
    ],
    checkpoints: [
      { q: "Tes composants ont-ils des variants et des états nommés clairement ?", qEn: "Do your components have clearly named variants and states?", hint: "Non → commence par ça avant d'ajouter un outil de handoff. Les devs ont besoin de règles, pas de décor.", hintEn: "No → start there before adding a handoff tool. Developers need rules, not decoration." },
      { q: "Tu utilises Tokens Studio pour un vrai système ou seulement pour ranger des couleurs ?", qEn: "Do you use Tokens Studio for a real system or just to store colors?", hint: "Seulement couleurs → les styles natifs Figma suffisent. Tokens Studio prend sa place quand les tokens doivent être exportés ou synchronisés.", hintEn: "Only colors → native Figma styles are enough. Tokens Studio earns its place when tokens must be exported or synced." },
      { q: "L'accessibilité est-elle vérifiée avant la revue client ?", qEn: "Is accessibility checked before client review?", hint: "Non → Stark doit passer avant livraison, sinon les corrections arrivent trop tard et coûtent plus cher.", hintEn: "No → Stark should run before delivery, otherwise fixes arrive too late and cost more." },
    ],
    tools: [
      { role: "Design source", roleEn: "Design source", slug: "figma", reason: "Composants, prototypes, commentaires et handoff au même endroit.", reasonEn: "Components, prototypes, comments, and handoff in one place." },
      { role: "Tokens", roleEn: "Tokens", slug: "figma-tokens", reason: "À utiliser si les variables doivent vivre dans le design et le code.", reasonEn: "Use when variables need to live in design and code." },
      { role: "Icônes", roleEn: "Icons", slug: "figma-iconify", reason: "Recherche multi-librairies sans importer des packs incohérents.", reasonEn: "Multi-library icon search without importing inconsistent packs." },
      { role: "Accessibilité", roleEn: "Accessibility", slug: "figma-stark", reason: "Contraste et lisibilité avant livraison.", reasonEn: "Contrast and readability before delivery." },
      { role: "Atelier", roleEn: "Workshop", slug: "miro", reason: "Parcours, audits, ateliers client et alignement amont.", reasonEn: "Journeys, audits, client workshops, and upstream alignment." },
      { role: "Prototype web", roleEn: "Web prototype", slug: "framer", reason: "Tester une landing ou une interaction sans lancer un build.", reasonEn: "Test a landing or interaction without starting a build." },
      { role: "Handoff optionnel", roleEn: "Optional handoff", slug: "zeplin", reason: "À garder si l'équipe dev ne travaille pas dans Figma.", reasonEn: "Keep if the dev team does not work in Figma." },
    ],
  },
  {
    id: "motion-video-creator",
    slug: "motion-video-studio-solo",
    title: "Stack motion & vidéo",
    titleEn: "Motion & video stack",
    subtitle: "Tu fais des teasers, démos produit, contenus sociaux ou micro-animations. La stack doit séparer montage, motion, export web et génération IA, sinon tu paies trois outils pour un seul format.",
    subtitleEn: "For motion and video creatives producing teasers, product demos, social clips, or micro-interactions.",
    persona: "designer",
    subProfiles: ["motion", "video", "art-direction"],
    stage: "scale",
    budget: "under150",
    monthlyBudget: 86,
    savings: 140,
    risk: "Garder Premiere, After Effects, Runway, CapCut et Screen Studio actifs sans savoir quel outil porte quel livrable.",
    riskEn: "Keeping Premiere, After Effects, Runway, CapCut, and Screen Studio active without knowing which deliverable each owns.",
    bestFor: "Démos SaaS, vidéos courtes, motion UI, animations Lottie, contenus LinkedIn/TikTok et formation courte.",
    bestForEn: "SaaS demos, short videos, UI motion, Lottie animations, LinkedIn/TikTok content, and short training.",
    avoidIf: "Tu fais de la postproduction broadcast avec étalonnage, son, VFX et pipeline équipe.",
    avoidIfEn: "You do broadcast post-production with grading, sound, VFX, and team pipelines.",
    editorial: "DaVinci Resolve Free suffit pour beaucoup de montage pro. After Effects garde sa place si tu livres du motion complexe ou des animations Lottie via Bodymovin. Rive est plus pertinent qu'After Effects quand l'animation doit devenir interactive dans une app. Screen Studio est très rentable pour les démos produit : il remplace souvent une demi-journée de montage de captures écran.",
    editorialEn: "DaVinci Resolve Free is enough for a lot of professional editing. After Effects earns its place for complex motion or Lottie animations through Bodymovin. Rive is more relevant than After Effects when the animation must become interactive in an app. Screen Studio is very profitable for product demos: it often replaces half a day of screen-recording editing.",
    needs: [
      { title: "Séparer montage et motion", titleEn: "Separate editing and motion", detail: "DaVinci ou CapCut montent. After Effects ou Rive animent. Mélanger les deux ralentit tout.", detailEn: "DaVinci or CapCut edit. After Effects or Rive animate. Mixing both slows everything down." },
      { title: "Choisir le format de sortie", titleEn: "Choose the output format", detail: "MP4 social, Lottie web, interaction app ou démo produit : chaque format appelle un outil différent.", detailEn: "Social MP4, web Lottie, app interaction, or product demo: each format calls for a different tool." },
      { title: "Garder l'IA en appoint", titleEn: "Keep AI as support", detail: "Runway sert aux plans courts et B-roll, pas à remplacer toute la production vidéo.", detailEn: "Runway helps with short shots and B-roll, not replacing the whole video workflow." },
    ],
    maturitySignals: [
      { title: "Livraison Lottie récurrente", titleEn: "Recurring Lottie delivery", detail: "After Effects + Bodymovin devient rationnel si le web animé est un livrable fréquent.", detailEn: "After Effects + Bodymovin becomes rational when animated web delivery is frequent." },
      { title: "Démos produit hebdo", titleEn: "Weekly product demos", detail: "Screen Studio se rentabilise vite dès que les captures écran deviennent un format récurrent.", detailEn: "Screen Studio pays off quickly once screen recordings become recurring." },
    ],
    traps: [
      { title: "Premiere par réflexe", titleEn: "Premiere by reflex", detail: "Pour du solo non-broadcast, DaVinci Resolve Free ou CapCut couvrent souvent le besoin.", detailEn: "For solo non-broadcast work, DaVinci Resolve Free or CapCut often cover the need." },
      { title: "Runway permanent", titleEn: "Permanent Runway", detail: "Si tu génères quelques plans par mois, crédits ponctuels ou plan léger suffisent.", detailEn: "If you generate a few shots per month, credits or a light plan are enough." },
    ],
    checkpoints: [
      { q: "Ton motion finit-il en vidéo ou dans une interface ?", qEn: "Does your motion end as video or inside an interface?", hint: "Interface → regarde Rive ou Lottie. Vidéo → reste sur DaVinci/After Effects. Le mauvais format de sortie coûte cher.", hintEn: "Interface → look at Rive or Lottie. Video → stay with DaVinci/After Effects. The wrong output format gets expensive." },
      { q: "Tu paies Premiere alors que tes formats sont sociaux ou démos produit ?", qEn: "Do you pay for Premiere while your formats are social clips or product demos?", hint: "Oui → teste DaVinci Resolve Free + Screen Studio avant de garder Adobe actif.", hintEn: "Yes → test DaVinci Resolve Free + Screen Studio before keeping Adobe active." },
      { q: "Tes animations web sont-elles exportées proprement en Lottie ?", qEn: "Are your web animations cleanly exported as Lottie?", hint: "Non → Bodymovin doit être dans la stack si After Effects reste ton outil motion web.", hintEn: "No → Bodymovin belongs in the stack if After Effects remains your web motion tool." },
    ],
    tools: [
      { role: "Démos produit", roleEn: "Product demos", slug: "screen-studio", decision: "core", tip: "Prépare 3 presets : démo SaaS 16:9, extrait LinkedIn 4:5, vertical court 9:16.", tipEn: "Prepare 3 presets: SaaS demo 16:9, LinkedIn clip 4:5, short vertical 9:16.", reason: "Le meilleur socle pour enregistrer des démos propres : auto-zoom, curseur, ratio et export sans montage lourd.", reasonEn: "The best foundation for polished product demos: auto-zoom, cursor, ratio, and export without heavy editing." },
      { role: "Formats sociaux", roleEn: "Social formats", slug: "capcut", decision: "core", tip: "Garde-le pour sous-titres, cuts courts et déclinaisons verticales. Pas pour les animations produit complexes.", tipEn: "Keep it for captions, short cuts, and vertical variations. Not for complex product animation.", reason: "Rapide pour monter, sous-titrer et décliner des contenus sociaux sans sortir une suite Adobe.", reasonEn: "Fast for editing, captioning, and adapting social content without opening an Adobe suite." },
      { role: "Montage pro", roleEn: "Pro editing", slug: "davinci-resolve", decision: "core", tip: "DaVinci Free suffit tant que tu n'as pas besoin de collaboration studio, plugins avancés ou workflow broadcast.", tipEn: "DaVinci Free is enough until you need studio collaboration, advanced plugins, or broadcast workflow.", reason: "Montage, colorimétrie et audio solide sans abonnement pour beaucoup de cas solo.", reasonEn: "Solid editing, grading, and audio without subscription for many solo cases." },
      { role: "Motion avancé", roleEn: "Advanced motion", slug: "adobe-after-effects", decision: "conditional", tip: "À garder si tu livres vraiment du motion complexe ou du Lottie. Sinon il devient vite l'abonnement dormant.", tipEn: "Keep if you truly deliver complex motion or Lottie. Otherwise it quickly becomes the dormant subscription.", reason: "Utile pour compositions, titrages complexes, micro-animations et exports Lottie via plugin.", reasonEn: "Useful for compositions, complex titles, micro-animations, and Lottie exports via plugin." },
      { role: "Plugin Lottie", roleEn: "Lottie plugin", slug: "ae-bodymovin", decision: "conditional", tip: "Indispensable seulement si l'animation doit être intégrée sur un site ou dans une app.", tipEn: "Essential only if the animation must be embedded in a website or app.", reason: "Le plugin clé pour exporter des animations web légères depuis After Effects.", reasonEn: "The key plugin for exporting lightweight web animations from After Effects." },
      { role: "Animation interactive", roleEn: "Interactive animation", slug: "rive", decision: "conditional", tip: "Choisis Rive si l'animation réagit à l'utilisateur. Choisis Lottie si elle reste linéaire.", tipEn: "Choose Rive if animation reacts to the user. Choose Lottie if it remains linear.", reason: "Plus pertinent qu'After Effects quand l'animation vit dans une interface et doit avoir des états.", reasonEn: "More relevant than After Effects when animation lives in an interface and needs states." },
      { role: "B-roll IA", roleEn: "AI B-roll", slug: "runway", decision: "challenge", tip: "Prends des crédits ou un mois ponctuel si tu génères moins de 10 plans par mois.", tipEn: "Use credits or one-off months if you generate fewer than 10 shots per month.", reason: "À garder seulement si les plans génératifs servent vraiment ton format récurrent.", reasonEn: "Keep only if generative shots truly serve your recurring format." },
    ],
  },
  {
    id: "photo-studio-solo",
    slug: "photographe-retouche-client",
    title: "Stack photo",
    titleEn: "Photo stack",
    subtitle: "Tu fais shooting, sélection, retouche et livraison. Le risque n'est pas de manquer d'outils, c'est d'avoir une chaîne floue entre capture, tri, retouche, validation et envoi final.",
    subtitleEn: "For photographers who need capture, selection, retouching, approval, and delivery without a studio-grade stack.",
    persona: "designer",
    subProfiles: ["photo", "brand", "client-delivery"],
    stage: "lean",
    budget: "under50",
    monthlyBudget: 38,
    savings: 70,
    risk: "Payer Adobe complet, stockage premium et galerie client alors que la majorité du flux tient dans Lightroom, Photoshop et Drive.",
    riskEn: "Paying full Adobe, premium storage, and client gallery tooling while most of the workflow fits in Lightroom, Photoshop, and Drive.",
    bestFor: "Photographe solo, shooting marque personnelle, contenus social media, packshots simples et retouche courante.",
    bestForEn: "Solo photographers, personal branding shoots, social content, simple packshots, and everyday retouching.",
    avoidIf: "Tu gères un studio avec assistants, DAM, validation multi-client et volumes très élevés.",
    avoidIfEn: "You run a studio with assistants, DAM, multi-client approvals, and very high volume.",
    editorial: "Lightroom reste difficile à remplacer quand le vrai besoin est le catalogue : tri, collections, métadonnées, presets et export par lot. Photoshop est utile pour la retouche lourde, mais ne doit pas justifier Creative Cloud complet si Illustrator, InDesign et Premiere ne servent pas. La livraison client peut rester simple : Drive par dossier client, nommage propre, Tally pour brief, Stripe ou Indy pour paiement/facturation.",
    editorialEn: "Lightroom remains hard to replace when the real need is catalog management: selection, collections, metadata, presets, and batch export. Photoshop helps with heavy retouching, but should not justify full Creative Cloud if Illustrator, InDesign, and Premiere are unused. Client delivery can stay simple: Drive per client folder, clean naming, Tally for briefs, Stripe or Indy for payment/billing.",
    needs: [
      { title: "Trier vite", titleEn: "Select fast", detail: "Le temps gagné se joue souvent sur import, sélection, presets et exports, pas sur la retouche elle-même.", detailEn: "Time is often saved on import, selection, presets, and exports, not retouching itself." },
      { title: "Éviter les versions perdues", titleEn: "Avoid lost versions", detail: "Un dossier Drive par mission avec exports datés suffit tant que le volume reste solo.", detailEn: "One Drive folder per mission with dated exports is enough while volume stays solo." },
      { title: "Clarifier le brief avant shooting", titleEn: "Clarify the brief before shooting", detail: "Tally évite les allers-retours sur formats, usages, nombre de visuels et délais.", detailEn: "Tally avoids back-and-forth on formats, usage, number of visuals, and deadlines." },
    ],
    maturitySignals: [
      { title: "Plus de 5 shootings par mois", titleEn: "More than 5 shoots per month", detail: "Standardise presets, nommage, livraison et facturation.", detailEn: "Standardize presets, naming, delivery, and billing." },
      { title: "Retouche lourde récurrente", titleEn: "Recurring heavy retouching", detail: "Photoshop prend sa place si détourage, compositing ou retouche peau sont fréquents.", detailEn: "Photoshop earns its place if masking, compositing, or skin retouching are frequent." },
    ],
    traps: [
      { title: "Creative Cloud complet", titleEn: "Full Creative Cloud", detail: "Le plan photo suffit souvent. Le reste doit prouver son usage mensuel.", detailEn: "The photography plan often suffices. Everything else must prove monthly use." },
      { title: "Galerie premium trop tôt", titleEn: "Premium gallery too early", detail: "Avant un volume stable, Drive + conventions claires couvrent déjà beaucoup.", detailEn: "Before stable volume, Drive + clear conventions already cover a lot." },
    ],
    checkpoints: [
      { q: "Ton besoin Lightroom est-il catalogue ou simple retouche ?", qEn: "Is your Lightroom need cataloging or simple editing?", hint: "Simple retouche → Luminar Neo ou Photoshop ponctuel peuvent suffire. Catalogue → Lightroom garde sa place.", hintEn: "Simple editing → Luminar Neo or occasional Photoshop may be enough. Cataloging → Lightroom earns its place." },
      { q: "Tes clients savent-ils où valider les photos finales ?", qEn: "Do clients know where to approve final photos?", hint: "Non → un dossier Drive structuré avec exports 'selection', 'retouche', 'final' retire beaucoup de friction.", hintEn: "No → a structured Drive folder with 'selection', 'retouch', 'final' exports removes a lot of friction." },
      { q: "Tu briefes les formats avant le shooting ?", qEn: "Do you brief formats before the shoot?", hint: "Non → Tally doit capturer formats, canaux, délais, nombre de visuels et contraintes d'usage.", hintEn: "No → Tally should capture formats, channels, deadlines, number of visuals, and usage constraints." },
    ],
    tools: [
      { role: "Catalogue photo", roleEn: "Photo catalog", slug: "adobe-lightroom", reason: "Tri, presets, collections et exports par lot.", reasonEn: "Selection, presets, collections, and batch exports." },
      { role: "Retouche lourde", roleEn: "Heavy retouching", slug: "adobe-photoshop", reason: "À garder pour détourage, compositing et retouche avancée.", reasonEn: "Keep for masking, compositing, and advanced retouching." },
      { role: "Alternative retouche", roleEn: "Editing alternative", slug: "luminar-neo", reason: "Option achat unique si le catalogue Lightroom n'est pas central.", reasonEn: "One-time option if Lightroom cataloging is not central." },
      { role: "Livraison", roleEn: "Delivery", slug: "google-drive", reason: "Dossiers clients, exports finaux et partage universel.", reasonEn: "Client folders, final exports, and universal sharing." },
      { role: "Brief", roleEn: "Brief", slug: "tally", reason: "Capturer usages, formats et contraintes avant shooting.", reasonEn: "Capture usage, formats, and constraints before shooting." },
      { role: "Paiement", roleEn: "Payment", slug: "stripe", reason: "Acompte, solde et paiement rapide.", reasonEn: "Deposit, balance, and fast payment." },
    ],
  },
  {
    id: "podcast-newsletter-operator",
    slug: "podcast-newsletter-createur",
    title: "Podcast & newsletter",
    titleEn: "Podcast & newsletter stack",
    subtitle: "Tu enregistres, transcris, découpes, publies, puis transformes l'épisode en newsletter ou posts. La stack doit organiser un flux de recyclage, pas empiler des outils de publication.",
    subtitleEn: "For creators who record, transcribe, publish, and repurpose episodes into newsletters or posts.",
    persona: "content",
    subProfiles: ["podcast", "newsletter", "social-content", "copywriting"],
    stage: "scale",
    budget: "under50",
    monthlyBudget: 46,
    savings: 80,
    risk: "Payer un outil d'enregistrement, un outil de montage, un outil newsletter, un outil social et une IA sans vrai workflow de recyclage.",
    riskEn: "Paying for recording, editing, newsletter, social scheduling, and AI without a real repurposing workflow.",
    bestFor: "Podcast solo, interview B2B, newsletter experte, contenus LinkedIn et clips courts.",
    bestForEn: "Solo podcast, B2B interviews, expert newsletter, LinkedIn content, and short clips.",
    avoidIf: "Tu produis un média quotidien avec équipe éditoriale, régie, ads et distribution multi-plateforme avancée.",
    avoidIfEn: "You produce a daily media brand with editorial team, production desk, ads, and advanced distribution.",
    editorial: "Riverside se justifie si la qualité d'enregistrement à distance compte. Descript prend sa valeur quand tu montes par transcription et réutilises les passages en clips. Beehiiv est pertinent si la newsletter devient un actif de croissance ; Substack est plus simple si la relation auteur-lecteur prime. Le meilleur système : un épisode devient une note Notion, trois angles LinkedIn, une newsletter courte et deux clips.",
    editorialEn: "Riverside makes sense if remote recording quality matters. Descript earns its place when you edit by transcript and reuse passages as clips. Beehiiv is relevant if the newsletter becomes a growth asset; Substack is simpler if the author-reader relationship matters. The best system: one episode becomes a Notion note, three LinkedIn angles, a short newsletter, and two clips.",
    needs: [
      { title: "Enregistrer proprement", titleEn: "Record cleanly", detail: "La qualité source conditionne tout le reste : montage, clips, transcription et réutilisation.", detailEn: "Source quality shapes everything else: editing, clips, transcription, and reuse." },
      { title: "Transformer, pas seulement publier", titleEn: "Transform, not just publish", detail: "Chaque épisode doit alimenter newsletter, posts et base d'idées.", detailEn: "Each episode should feed newsletter, posts, and idea backlog." },
      { title: "Garder un calendrier éditorial", titleEn: "Keep an editorial calendar", detail: "Notion évite que les épisodes, clips et newsletters vivent dans trois endroits sans lien.", detailEn: "Notion prevents episodes, clips, and newsletters from living in three disconnected places." },
    ],
    maturitySignals: [
      { title: "Une publication hebdo stable", titleEn: "Stable weekly publishing", detail: "Les outils payants se justifient quand le rythme existe déjà.", detailEn: "Paid tools make sense once the rhythm already exists." },
      { title: "Une audience newsletter active", titleEn: "Active newsletter audience", detail: "Beehiiv ou Substack prennent leur place quand l'email devient un canal de relation, pas un dépôt.", detailEn: "Beehiiv or Substack earn their place when email becomes a relationship channel, not a dump." },
    ],
    traps: [
      { title: "Newsletter trop tôt", titleEn: "Newsletter too early", detail: "Sans angle récurrent, l'outil ne crée pas la régularité.", detailEn: "Without a recurring angle, the tool does not create consistency." },
      { title: "Clips sans distribution", titleEn: "Clips without distribution", detail: "Créer 10 clips ne sert à rien si aucun canal ne les reçoit régulièrement.", detailEn: "Creating 10 clips is useless if no channel receives them regularly." },
    ],
    checkpoints: [
      { q: "Chaque épisode produit-il au moins trois contenus dérivés ?", qEn: "Does each episode produce at least three derivative pieces?", hint: "Non → ton workflow publie mais ne capitalise pas. Note, newsletter, post et clip doivent être prévus dès l'enregistrement.", hintEn: "No → your workflow publishes but does not compound. Note, newsletter, post, and clip should be planned from recording." },
      { q: "Tu montes encore les interviews sans transcription éditable ?", qEn: "Do you still edit interviews without editable transcript?", hint: "Oui → Descript peut diviser le temps de montage sur les contenus parlés.", hintEn: "Yes → Descript can cut editing time on spoken content." },
      { q: "Ta newsletter a-t-elle un rôle précis ?", qEn: "Does your newsletter have a precise role?", hint: "Non → choisis : relation, acquisition, vente, curation ou journal de bord. L'outil vient après.", hintEn: "No → choose: relationship, acquisition, sales, curation, or build log. The tool comes after." },
    ],
    tools: [
      { role: "Enregistrement", roleEn: "Recording", slug: "riverside", reason: "Audio/vidéo local propre pour interviews à distance.", reasonEn: "Clean local audio/video for remote interviews." },
      { role: "Montage par texte", roleEn: "Text-based editing", slug: "descript", reason: "Montage, transcription et clips à partir de contenus parlés.", reasonEn: "Editing, transcription, and clips from spoken content." },
      { role: "Hébergement podcast", roleEn: "Podcast hosting", slug: "anchor-spotify", reason: "Solution simple pour démarrer sans coût fixe lourd.", reasonEn: "Simple way to start without heavy fixed cost." },
      { role: "Newsletter croissance", roleEn: "Growth newsletter", slug: "beehiiv", reason: "Utile si l'email devient un actif d'audience.", reasonEn: "Useful if email becomes an audience asset." },
      { role: "Newsletter simple", roleEn: "Simple newsletter", slug: "substack", reason: "Plus naturel si la relation auteur-lecteur prime.", reasonEn: "More natural if author-reader relationship matters most." },
      { role: "Calendrier", roleEn: "Calendar", slug: "notion", reason: "Pipeline épisode, idées, extraits et publications.", reasonEn: "Episode pipeline, ideas, extracts, and publishing." },
      { role: "Recyclage IA", roleEn: "AI repurposing", slug: "chatgpt", reason: "Transformer transcript en angles, posts et newsletter.", reasonEn: "Turn transcripts into angles, posts, and newsletter." },
    ],
  },
  {
    id: "seo-consultant-editorial",
    slug: "consultant-seo-editorial",
    title: "Stack SEO",
    titleEn: "SEO stack",
    subtitle: "Tu dois auditer, prioriser, produire et suivre. SEMrush, Ahrefs, Search Console, GA, IA et reporting peuvent vite se recouvrir. Le bon stack sépare diagnostic, production et mesure.",
    subtitleEn: "For SEO consultants who need audits, prioritization, production, and tracking without overlapping enterprise tooling.",
    persona: "consultant",
    subProfiles: ["seo", "research", "copywriting", "analytics"],
    stage: "scale",
    budget: "under150",
    monthlyBudget: 128,
    savings: 210,
    risk: "Payer SEMrush et Ahrefs en continu alors que l'un sert l'audit ponctuel, l'autre la profondeur backlink, et que le suivi quotidien reste ailleurs.",
    riskEn: "Paying SEMrush and Ahrefs continuously while one serves periodic audits, the other backlink depth, and daily tracking lives elsewhere.",
    bestFor: "Consultant SEO, contenu B2B, refonte éditoriale, audit acquisition et stratégie mots-clés.",
    bestForEn: "SEO consultants, B2B content, editorial redesigns, acquisition audits, and keyword strategy.",
    avoidIf: "Tu fais du SEO enterprise avec équipe data, logs serveur, international complexe et gouvernance avancée.",
    avoidIfEn: "You do enterprise SEO with data teams, server logs, complex international, and advanced governance.",
    editorial: "SEMrush est excellent comme cockpit généraliste : positions, concurrents, audit technique, idées de contenus. Ahrefs est plus fort pour comprendre backlinks et concurrence organique. Les deux en même temps n'ont de sens que sur des missions à forte valeur. Pour un solo, alterner par mois ou par mission est souvent plus rationnel. Perplexity et Claude servent la recherche et la synthèse, mais les décisions doivent rester vérifiées dans les sources primaires.",
    editorialEn: "SEMrush is excellent as a general cockpit: positions, competitors, technical audit, content ideas. Ahrefs is stronger for backlinks and organic competition. Both together only make sense on high-value engagements. For a solo, alternating by month or by engagement is often more rational. Perplexity and Claude support research and synthesis, but decisions must remain checked against primary sources.",
    needs: [
      { title: "Diagnostiquer", titleEn: "Diagnose", detail: "Un audit doit sortir une priorisation, pas seulement une liste d'erreurs.", detailEn: "An audit should produce prioritization, not just a list of errors." },
      { title: "Produire mieux", titleEn: "Produce better", detail: "L'IA aide à structurer et comparer, mais ne remplace pas l'expertise ni la source.", detailEn: "AI helps structure and compare, but does not replace expertise or sources." },
      { title: "Mesurer peu mais bien", titleEn: "Measure little but well", detail: "GA et Search Console suffisent souvent pour suivre les vrais mouvements.", detailEn: "GA and Search Console are often enough to follow real movements." },
    ],
    maturitySignals: [
      { title: "Plusieurs clients SEO actifs", titleEn: "Several active SEO clients", detail: "Un outil complet devient rentable quand les audits et suivis sont récurrents.", detailEn: "A complete tool pays off when audits and tracking are recurring." },
      { title: "Backlinks au coeur de la mission", titleEn: "Backlinks at the heart of the mission", detail: "Ahrefs prend sa place quand la concurrence et les liens structurent la stratégie.", detailEn: "Ahrefs earns its place when competition and links shape the strategy." },
    ],
    traps: [
      { title: "Deux suites SEO en continu", titleEn: "Two SEO suites continuously", detail: "Garde les deux seulement si la marge de mission le justifie.", detailEn: "Keep both only if engagement margin justifies it." },
      { title: "Rapport sans décision", titleEn: "Report without decision", detail: "Un client ne paie pas pour un PDF de métriques : il paie pour savoir quoi faire.", detailEn: "A client does not pay for a metrics PDF: they pay to know what to do." },
    ],
    checkpoints: [
      { q: "Ton rapport SEO contient-il les 5 actions à faire maintenant ?", qEn: "Does your SEO report contain the 5 actions to do now?", hint: "Non → tu livres de l'information, pas une décision. Réduis le reporting et augmente la priorisation.", hintEn: "No → you deliver information, not a decision. Reduce reporting and increase prioritization." },
      { q: "Tu as besoin d'Ahrefs chaque mois ou seulement en audit ?", qEn: "Do you need Ahrefs every month or only during audits?", hint: "Audit → prends-le par période. Le garder en continu doit être relié à un revenu récurrent.", hintEn: "Audit → use it by period. Keeping it continuously must map to recurring revenue." },
      { q: "Tes contenus IA sont-ils vérifiés par sources primaires ?", qEn: "Are your AI-assisted contents checked against primary sources?", hint: "Non → Perplexity aide à sourcer, Claude aide à synthétiser, mais la validation reste humaine.", hintEn: "No → Perplexity helps source, Claude helps synthesize, but validation remains human." },
    ],
    tools: [
      { role: "Suite SEO", roleEn: "SEO suite", slug: "semrush", reason: "Audit, positions, concurrents et idées éditoriales dans un seul cockpit.", reasonEn: "Audit, rankings, competitors, and editorial ideas in one cockpit." },
      { role: "Backlinks / concurrence", roleEn: "Backlinks / competition", slug: "ahrefs", reason: "À activer quand les liens et la concurrence organique sont centraux.", reasonEn: "Activate when links and organic competition are central." },
      { role: "Analytics", roleEn: "Analytics", slug: "google-analytics", reason: "Base commune pour trafic, conversions et canaux.", reasonEn: "Common baseline for traffic, conversions, and channels." },
      { role: "Recherche sourcée", roleEn: "Sourced research", slug: "perplexity", reason: "Explorer des sources avant de rédiger ou recommander.", reasonEn: "Explore sources before writing or recommending." },
      { role: "Synthèse longue", roleEn: "Long synthesis", slug: "claude", reason: "Comparer documents, briefs, SERP et corpus éditorial.", reasonEn: "Compare documents, briefs, SERPs, and editorial corpora." },
      { role: "Base client", roleEn: "Client base", slug: "notion", reason: "Roadmap SEO, décisions, livrables et comptes rendus.", reasonEn: "SEO roadmap, decisions, deliverables, and recaps." },
    ],
  },
  {
    id: "revops-consultant",
    slug: "consultant-revops-pipeline",
    title: "Stack RevOps consultant",
    titleEn: "Consultant RevOps stack",
    subtitle: "Tu aides à vendre mieux, relancer, qualifier, suivre le pipe et documenter les comptes. La stack doit rendre le revenu visible sans transformer chaque contact en usine CRM.",
    subtitleEn: "For consultants structuring sales, follow-up, qualification, pipeline, and account notes without enterprise CRM bloat.",
    persona: "consultant",
    subProfiles: ["crm-sales", "operations", "client-delivery", "admin"],
    stage: "scale",
    budget: "under150",
    monthlyBudget: 92,
    savings: 180,
    risk: "Installer HubSpot, Aircall, séquences et reporting avant d'avoir clarifié étapes, probabilité, prochaine action et responsabilité.",
    riskEn: "Installing HubSpot, Aircall, sequences, and reporting before clarifying stages, probability, next action, and ownership.",
    bestFor: "Consultant RevOps, accompagnement commercial B2B, dirigeant solo avec pipeline actif, petite équipe sales.",
    bestForEn: "RevOps consultants, B2B sales advisory, solo leaders with active pipeline, small sales teams.",
    avoidIf: "Tu as déjà sales ops, marketing ops, SDR, AE et reporting multi-pays.",
    avoidIfEn: "You already have sales ops, marketing ops, SDRs, AEs, and multi-country reporting.",
    editorial: "Pipedrive force la bonne discipline : valeur, étape, prochaine action. HubSpot devient pertinent si marketing, formulaires, CRM et nurture doivent vraiment vivre ensemble. Folk est une excellente couche relationnelle pour un consultant qui travaille par réseau. Aircall n'a de sens que si les appels sortants sont un vrai canal. La signature électronique reste à doser : DocuSign est rarement le premier abonnement à prendre.",
    editorialEn: "Pipedrive enforces the right discipline: value, stage, next action. HubSpot becomes relevant if marketing, forms, CRM, and nurture must truly live together. Folk is an excellent relationship layer for consultants working through network. Aircall only makes sense if outbound calls are a real channel. E-signature should be measured: DocuSign is rarely the first subscription to take.",
    needs: [
      { title: "Voir le revenu probable", titleEn: "See probable revenue", detail: "Chaque deal doit avoir montant, étape, probabilité et prochaine action.", detailEn: "Each deal needs amount, stage, probability, and next action." },
      { title: "Garder la mémoire relationnelle", titleEn: "Keep relationship memory", detail: "Folk ou Notion portent mieux les relations faibles qu'un CRM trop rigide.", detailEn: "Folk or Notion handle weak ties better than an overly rigid CRM." },
      { title: "Séparer vente et livraison", titleEn: "Separate sales and delivery", detail: "Le CRM suit l'opportunité. Notion ou Drive suivent la mission après signature.", detailEn: "CRM tracks the opportunity. Notion or Drive track the mission after signature." },
    ],
    maturitySignals: [
      { title: "Plus de 20 opportunités actives", titleEn: "More than 20 active opportunities", detail: "Le CRM devient utile quand le cerveau ne suffit plus.", detailEn: "CRM becomes useful when memory no longer suffices." },
      { title: "Formulaires et nurture marketing", titleEn: "Forms and marketing nurture", detail: "HubSpot prend sa place quand acquisition, CRM et emails doivent être reliés.", detailEn: "HubSpot earns its place when acquisition, CRM, and emails must be connected." },
    ],
    traps: [
      { title: "CRM sans discipline", titleEn: "CRM without discipline", detail: "Un CRM vide ou mal rempli est plus dangereux qu'un tableur propre.", detailEn: "An empty or poorly maintained CRM is more dangerous than a clean spreadsheet." },
      { title: "Téléphonie trop tôt", titleEn: "Calling tool too early", detail: "Aircall se justifie par volume sortant, pas par envie de faire pro.", detailEn: "Aircall is justified by outbound volume, not by wanting to look professional." },
    ],
    checkpoints: [
      { q: "Chaque opportunité a-t-elle une prochaine action datée ?", qEn: "Does every opportunity have a dated next action?", hint: "Non → aucun outil ne compensera ce manque. C'est le champ le plus important de la stack commerciale.", hintEn: "No → no tool will compensate. This is the most important field in the sales stack." },
      { q: "HubSpot sert-il vraiment marketing + CRM + email ?", qEn: "Does HubSpot really serve marketing + CRM + email?", hint: "Non → Pipedrive ou Folk seront souvent plus simples et moins lourds.", hintEn: "No → Pipedrive or Folk will often be simpler and lighter." },
      { q: "Tu signes assez de documents pour payer DocuSign ?", qEn: "Do you sign enough documents to pay for DocuSign?", hint: "Non → garde une option plus simple ou la validation email selon le niveau de risque.", hintEn: "No → keep a simpler option or email approval depending on risk level." },
    ],
    tools: [
      { role: "Pipeline", roleEn: "Pipeline", slug: "pipedrive", reason: "Le meilleur ratio discipline commerciale / complexité pour petite équipe.", reasonEn: "Best sales discipline / complexity ratio for small teams." },
      { role: "CRM tout-en-un", roleEn: "All-in-one CRM", slug: "hubspot", reason: "À choisir si marketing, formulaires, CRM et emails doivent être connectés.", reasonEn: "Choose if marketing, forms, CRM, and emails must connect." },
      { role: "Réseau relationnel", roleEn: "Relationship network", slug: "folk", reason: "Très bon pour consultants qui vendent par réseau et introductions.", reasonEn: "Great for consultants selling through network and introductions." },
      { role: "Appels", roleEn: "Calls", slug: "aircall", reason: "À garder si appels sortants et suivi téléphonique sont un vrai canal.", reasonEn: "Keep if outbound calls and call tracking are a real channel." },
      { role: "Rendez-vous", roleEn: "Scheduling", slug: "calendly", reason: "Réduit la friction quand les calls qualifiés deviennent réguliers.", reasonEn: "Reduces friction when qualified calls become regular." },
      { role: "Signature", roleEn: "Signature", slug: "docusign", reason: "À réserver aux contrats où la preuve formelle a une vraie valeur.", reasonEn: "Reserve for contracts where formal proof has real value." },
      { role: "Livraison", roleEn: "Delivery", slug: "notion", reason: "Passer de l'opportunité signée au contexte de mission.", reasonEn: "Move from signed opportunity to mission context." },
    ],
  },
  {
    id: "ecommerce-retention",
    slug: "ecommerce-retention-support",
    title: "Stack e-commerce avancée",
    titleEn: "Advanced e-commerce stack",
    subtitle: "Tu veux améliorer conversion, avis, email, support et réachat. Chaque app promet quelques points de mieux. La vraie question : quel levier protège vraiment la marge maintenant ?",
    subtitleEn: "For e-commerce operators improving conversion, reviews, email, support, and repeat purchase while protecting margin.",
    persona: "ops",
    subProfiles: ["ecommerce", "analytics", "crm-sales", "automation"],
    stage: "scale",
    budget: "under150",
    monthlyBudget: 148,
    savings: 260,
    risk: "Ajouter avis, popup, SMS, upsell, support et heatmaps sans mesurer l'impact net sur marge.",
    riskEn: "Adding reviews, popups, SMS, upsells, support, and heatmaps without measuring net margin impact.",
    bestFor: "Boutique Shopify DTC, petit catalogue, marque créateur, e-commerce en croissance.",
    bestForEn: "DTC Shopify store, small catalog, creator brand, growing e-commerce.",
    avoidIf: "Tu as ERP, logistique multi-pays, marketplace complexe et équipe data dédiée.",
    avoidIfEn: "You have ERP, multi-country logistics, complex marketplace setup, and a data team.",
    editorial: "Les données récentes du marché e-commerce montrent un socle très stable : Shopify, Google Analytics, pixels ads, Klaviyo, avis et support. Mais ToolTrim doit aller plus loin : chaque app doit être reliée à une métrique de marge. Klaviyo se justifie quand email/SMS produit du revenu mesurable. Gorgias se justifie quand le support récupère des ventes ou réduit le temps humain. Hotjar se justifie seulement sur les pages où une décision sera prise.",
    editorialEn: "Recent e-commerce stack data shows a stable foundation: Shopify, Google Analytics, ad pixels, Klaviyo, reviews, and support. But ToolTrim should go further: every app must map to a margin metric. Klaviyo is justified when email/SMS produces measurable revenue. Gorgias is justified when support recovers sales or reduces human time. Hotjar is justified only on pages where a decision will be made.",
    needs: [
      { title: "Protéger la marge", titleEn: "Protect margin", detail: "Chaque app doit prouver conversion, panier moyen, réachat ou temps support gagné.", detailEn: "Each app must prove conversion, AOV, repeat purchase, or support time saved." },
      { title: "Relancer intelligemment", titleEn: "Follow up intelligently", detail: "Klaviyo doit d'abord couvrir abandon panier, post-achat et winback avant les scénarios avancés.", detailEn: "Klaviyo should first cover cart abandonment, post-purchase, and winback before advanced flows." },
      { title: "Lire les frictions", titleEn: "Read friction", detail: "Hotjar doit répondre à une question précise : où les clients hésitent-ils ?", detailEn: "Hotjar should answer a precise question: where do customers hesitate?" },
    ],
    maturitySignals: [
      { title: "Plus de 100 commandes par mois", titleEn: "More than 100 orders per month", detail: "Le support dédié et les flows email commencent à devenir vraiment rentables.", detailEn: "Dedicated support and email flows start becoming truly profitable." },
      { title: "CAC en hausse", titleEn: "Rising CAC", detail: "C'est le moment de regarder réachat, email, avis et panier moyen avant d'acheter plus de trafic.", detailEn: "That is when you look at repeat purchase, email, reviews, and AOV before buying more traffic." },
    ],
    traps: [
      { title: "App d'upsell magique", titleEn: "Magic upsell app", detail: "Si l'offre ou la livraison bloque, l'upsell ne sauvera pas la marge.", detailEn: "If offer or delivery blocks, upsell will not save margin." },
      { title: "Heatmaps non regardées", titleEn: "Unread heatmaps", detail: "Hotjar ne sert à rien si personne ne regarde les sessions et ne décide ensuite.", detailEn: "Hotjar is useless if nobody watches sessions and decides afterward." },
    ],
    checkpoints: [
      { q: "Chaque app Shopify a-t-elle une métrique de marge associée ?", qEn: "Does every Shopify app have a margin metric attached?", hint: "Non → coupe ou teste. 'Ça peut aider' n'est pas une métrique.", hintEn: "No → cut or test. 'It might help' is not a metric." },
      { q: "Tes flows Klaviyo couvrent-ils déjà abandon panier, post-achat et winback ?", qEn: "Do your Klaviyo flows already cover cart abandonment, post-purchase, and winback?", hint: "Non → commence là avant d'ajouter segmentation avancée ou SMS.", hintEn: "No → start there before advanced segmentation or SMS." },
      { q: "Le support récupère-t-il des ventes ou seulement des questions ?", qEn: "Does support recover sales or only answer questions?", hint: "Seulement questions → Gorgias doit être relié à FAQ, macros et réduction du temps support.", hintEn: "Only questions → Gorgias must connect to FAQ, macros, and reduced support time." },
    ],
    tools: [
      { role: "Boutique", roleEn: "Store", slug: "shopify", reason: "Socle catalogue, paiement, commandes et écosystème app.", reasonEn: "Catalog, payment, orders, and app ecosystem foundation." },
      { role: "Email / rétention", roleEn: "Email / retention", slug: "klaviyo", reason: "Flows e-commerce, segmentation et revenu email mesurable.", reasonEn: "E-commerce flows, segmentation, and measurable email revenue." },
      { role: "Support e-commerce", roleEn: "E-commerce support", slug: "gorgias", reason: "Macros, commandes et support orienté conversion.", reasonEn: "Macros, orders, and conversion-oriented support." },
      { role: "Analytics", roleEn: "Analytics", slug: "google-analytics", reason: "Acquisition, conversion et revenus en socle commun.", reasonEn: "Acquisition, conversion, and revenue baseline." },
      { role: "Friction UX", roleEn: "UX friction", slug: "hotjar", reason: "À utiliser sur panier, checkout, fiche produit et pages à friction.", reasonEn: "Use on cart, checkout, product pages, and friction pages." },
      { role: "Automatisation", roleEn: "Automation", slug: "make", reason: "Connecter commandes, CRM, alertes et reporting sans app Shopify de plus.", reasonEn: "Connect orders, CRM, alerts, and reporting without one more Shopify app." },
    ],
  },
  {
    id: "dev-saas-production",
    slug: "developpeur-saas-production-legere",
    title: "Stack startup légère",
    titleEn: "Light startup stack",
    subtitle: "Tu as un produit qui tourne. Il faut maintenant auth, base, paiement, erreurs, analytics et déploiement propre. Pas Datadog, Segment, HubSpot et quatre dashboards dès le premier mois.",
    subtitleEn: "For developers moving from MVP to production with auth, database, payment, errors, analytics, and clean deployment.",
    persona: "dev",
    subProfiles: ["ai-coding", "product", "web", "analytics"],
    stage: "scale",
    budget: "under150",
    monthlyBudget: 96,
    savings: 240,
    risk: "Construire une stack observabilité/data/sales trop tôt alors que le vrai besoin est de fiabiliser les flux critiques.",
    riskEn: "Building observability/data/sales stack too early while the real need is reliable critical flows.",
    bestFor: "SaaS early-stage, micro-produit payant, outil interne client, MVP avec premiers utilisateurs.",
    bestForEn: "Early-stage SaaS, paid micro-product, client internal tool, MVP with first users.",
    avoidIf: "Tu as déjà trafic élevé, SLA, équipe infra, data warehouse et support 24/7.",
    avoidIfEn: "You already have high traffic, SLA, infra team, data warehouse, and 24/7 support.",
    editorial: "La stack production légère doit couvrir cinq questions : est-ce que ça déploie, est-ce que ça stocke, est-ce que ça encaisse, est-ce que ça casse, est-ce que les utilisateurs activent la valeur ? Vercel, Supabase, Stripe, Sentry et PostHog couvrent ça sans organisation lourde. Cursor accélère le code, mais ne remplace pas la discipline : conventions, tests, monitoring minimal et events critiques.",
    editorialEn: "A light production stack must answer five questions: does it deploy, does it store, does it get paid, does it break, do users activate value? Vercel, Supabase, Stripe, Sentry, and PostHog cover this without heavy organization. Cursor accelerates coding, but does not replace discipline: conventions, tests, minimal monitoring, and critical events.",
    needs: [
      { title: "Fiabiliser le chemin critique", titleEn: "Reliabilize the critical path", detail: "Signup, paiement, activation et support doivent être observables avant toute optimisation.", detailEn: "Signup, payment, activation, and support must be observable before optimization." },
      { title: "Garder une infra lisible", titleEn: "Keep infrastructure readable", detail: "Supabase ou Neon suffisent avant de complexifier backend et data.", detailEn: "Supabase or Neon are enough before complexifying backend and data." },
      { title: "Coder plus vite sans perdre le contrôle", titleEn: "Code faster without losing control", detail: "Cursor doit suivre les conventions du repo, pas improviser une architecture à chaque session.", detailEn: "Cursor should follow repo conventions, not improvise architecture every session." },
    ],
    maturitySignals: [
      { title: "Premiers paiements", titleEn: "First payments", detail: "Stripe et monitoring d'erreurs deviennent non négociables.", detailEn: "Stripe and error monitoring become non-negotiable." },
      { title: "Activation floue", titleEn: "Unclear activation", detail: "PostHog doit suivre 3 événements critiques avant d'ajouter des dashboards.", detailEn: "PostHog should track 3 critical events before adding dashboards." },
    ],
    traps: [
      { title: "Observabilité enterprise", titleEn: "Enterprise observability", detail: "Datadog est excellent, mais trop tôt si Sentry couvre déjà les erreurs utiles.", detailEn: "Datadog is excellent, but too early if Sentry already covers useful errors." },
      { title: "Trop d'IA code", titleEn: "Too many coding AIs", detail: "Cursor + un assistant raisonnement suffit. Copilot en doublon doit prouver sa valeur.", detailEn: "Cursor + one reasoning assistant is enough. Duplicate Copilot must prove value." },
    ],
    checkpoints: [
      { q: "Tu sais quand un paiement échoue ou quand l'onboarding casse ?", qEn: "Do you know when payment fails or onboarding breaks?", hint: "Non → Sentry et logs applicatifs minimalistes passent avant toute feature secondaire.", hintEn: "No → Sentry and minimal app logs come before any secondary feature." },
      { q: "Tu as défini l'event d'activation produit ?", qEn: "Have you defined the product activation event?", hint: "Non → PostHog doit mesurer ça en premier, pas une collection de clics.", hintEn: "No → PostHog should measure that first, not a collection of clicks." },
      { q: "Cursor connaît-il les conventions du repo ?", qEn: "Does Cursor know the repo conventions?", hint: "Non → ajoute règles projet, architecture, patterns et limites. C'est ce qui transforme l'IA en vrai levier.", hintEn: "No → add project rules, architecture, patterns, and limits. That is what turns AI into leverage." },
    ],
    tools: [
      { role: "Repo", roleEn: "Repo", slug: "github", reason: "Versioning, PR, issues techniques et base de collaboration.", reasonEn: "Versioning, PRs, technical issues, and collaboration base." },
      { role: "Déploiement", roleEn: "Deployment", slug: "vercel", reason: "Preview, prod et rollback avec très peu de friction.", reasonEn: "Preview, production, and rollback with very little friction." },
      { role: "Base / auth", roleEn: "Database / auth", slug: "supabase", reason: "Base, auth, storage et API pour éviter de construire trop tôt.", reasonEn: "Database, auth, storage, and API to avoid building too early." },
      { role: "Paiement", roleEn: "Payment", slug: "stripe", reason: "Abonnements, checkout, facturation et webhooks.", reasonEn: "Subscriptions, checkout, billing, and webhooks." },
      { role: "Erreurs", roleEn: "Errors", slug: "sentry", reason: "Savoir ce qui casse avant que les clients ne le signalent.", reasonEn: "Know what breaks before customers report it." },
      { role: "Analytics produit", roleEn: "Product analytics", slug: "posthog", reason: "Activation, funnels, replay et feature flags dans une seule couche.", reasonEn: "Activation, funnels, replay, and feature flags in one layer." },
      { role: "IDE IA", roleEn: "AI IDE", slug: "cursor", reason: "Accélère les changements multi-fichiers si le repo est bien cadré.", reasonEn: "Speeds multi-file changes if the repo is well framed." },
      { role: "Base SQL dédiée", roleEn: "Dedicated SQL database", slug: "neon", reason: "Alternative Postgres si tu veux séparer base produit et backend.", reasonEn: "Postgres alternative if you want to separate product database and backend." },
    ],
  },
  {
    id: "freelance-reference",
    slug: "freelance",
    title: "Stack freelance",
    titleEn: "Freelance stack",
    subtitle: "Une stack de référence pour freelance qui doit gérer prospects, projets, fichiers, livrables et paiement sans acheter les outils d'une équipe.",
    subtitleEn: "A reference stack for freelancers who need to manage prospects, projects, files, deliverables, and payment without buying team tools.",
    persona: "solo",
    subProfiles: ["client-delivery", "crm-sales", "admin"],
    stage: "lean",
    budget: "under50",
    monthlyBudget: 39,
    savings: 96,
    risk: "Accumuler CRM, outil projet, stockage, signature, facturation et IA avant d'avoir assez de volume pour les rentabiliser.",
    riskEn: "Accumulating CRM, project management, storage, signature, billing, and AI tools before having enough volume to justify them.",
    bestFor: "Freelances de service, consultants solo, créatifs, développeurs et profils hybrides.",
    bestForEn: "Service freelancers, solo consultants, creatives, developers, and hybrid operators.",
    avoidIf: "Tu as déjà une équipe, un cycle de vente complexe ou plusieurs personnes qui travaillent sur les mêmes comptes.",
    avoidIfEn: "You already have a team, a complex sales cycle, or several people working on the same accounts.",
    editorial: "La stack freelance doit rester courte. Un espace pour organiser, un endroit pour stocker, un moyen de qualifier les demandes, un moyen d'encaisser, et une IA généraliste si elle sert vraiment. Le reste vient après un symptôme clair : opportunités perdues, livrables introuvables, relances oubliées ou temps administratif trop lourd.",
    editorialEn: "A freelance stack should stay short. One place to organize, one place to store files, one way to qualify requests, one way to get paid, and one general AI if it truly helps. Everything else comes after a clear symptom: lost opportunities, missing deliverables, forgotten follow-ups, or too much admin time.",
    needs: [
      { title: "Qualifier avant de vendre", titleEn: "Qualify before selling", detail: "Un freelance n'a pas besoin d'un CRM si les demandes ne sont pas encore qualifiées. Tally pose les bonnes questions, Notion garde la trace.", detailEn: "A freelancer does not need a CRM if requests are not qualified yet. Tally asks the right questions, Notion keeps the record." },
      { title: "Livrer avec une trace claire", titleEn: "Deliver with a clear trail", detail: "Le client doit retrouver brief, versions, fichiers finaux et décisions sans te redemander le lien.", detailEn: "The client should find brief, versions, final files, and decisions without asking you for the link again." },
      { title: "Encaisser sans friction", titleEn: "Collect payment without friction", detail: "Stripe suffit tant que la facturation reste simple. Indy devient utile si la conformité française devient le sujet.", detailEn: "Stripe is enough while billing stays simple. Indy helps when French compliance becomes the topic." },
    ],
    maturitySignals: [
      { title: "10 prospects actifs", titleEn: "10 active prospects", detail: "Au-dessus de ce seuil, tu peux passer d'une base Notion à Pipedrive. Avant, c'est souvent du confort.", detailEn: "Above this threshold, moving from Notion to Pipedrive can make sense. Before that, it is often comfort." },
      { title: "3 clients récurrents", titleEn: "3 recurring clients", detail: "C'est le moment de standardiser tes dossiers, tes relances et tes pages mission.", detailEn: "That is when you standardize folders, follow-ups, and project pages." },
      { title: "Plus de 5 heures d'admin par semaine", titleEn: "More than 5 admin hours per week", detail: "Là, l'automatisation devient rentable. Pas avant d'avoir identifié les tâches répétées.", detailEn: "Then automation becomes profitable. Not before identifying repeated tasks." },
    ],
    traps: [
      { title: "HubSpot trop tôt", titleEn: "HubSpot too early", detail: "Puissant, mais surdimensionné si tu vends seul et que tes deals tiennent dans une vue hebdo.", detailEn: "Powerful, but oversized if you sell alone and your deals fit in a weekly view." },
      { title: "DocuSign par réflexe", titleEn: "DocuSign by reflex", detail: "Pour beaucoup de missions, un accord écrit clair ou une solution plus légère suffit.", detailEn: "For many projects, a clear written agreement or lighter tool is enough." },
      { title: "Suite projet complète", titleEn: "Full project suite", detail: "ClickUp, Asana ou Monday n'ont de sens que si plusieurs personnes exécutent en parallèle.", detailEn: "ClickUp, Asana, or Monday make sense only when several people execute in parallel." },
    ],
    checkpoints: [
      { q: "Tu sais où retrouver un brief client en moins d'une minute ?", qEn: "Can you find a client brief in under a minute?", hint: "Non → Notion doit devenir ton espace de contexte. Drive garde les fichiers, Notion garde les décisions.", hintEn: "No → Notion should become your context space. Drive keeps files, Notion keeps decisions." },
      { q: "Tu as plus de 10 prospects actifs en même temps ?", qEn: "Do you have more than 10 active prospects at once?", hint: "Non → un CRM complet est probablement trop tôt. Une base Notion avec prochaine action suffit.", hintEn: "No → a full CRM is probably too early. A Notion database with next action is enough." },
      { q: "Tu utilises plusieurs outils IA payants ?", qEn: "Do you use several paid AI tools?", hint: "Oui → garde un seul outil généraliste tant que les usages ne sont pas clairement séparés.", hintEn: "Yes → keep one generalist tool until the use cases are clearly separated." },
    ],
    tools: [
      { role: "Base de travail", roleEn: "Workspace", slug: "notion", reason: "Clients, offres, tâches et décisions dans un seul endroit.", reasonEn: "Clients, offers, tasks, and decisions in one place." },
      { role: "Fichiers", roleEn: "Files", slug: "google-drive", reason: "Compris par les clients, suffisant pour livrables et contrats.", reasonEn: "Client-friendly, enough for deliverables and contracts." },
      { role: "Qualification", roleEn: "Qualification", slug: "tally", reason: "Un formulaire propre évite les appels mal cadrés.", reasonEn: "A clean form avoids poorly scoped calls." },
      { role: "Paiement", roleEn: "Payment", slug: "stripe", reason: "Liens de paiement et factures simples sans coût fixe.", reasonEn: "Payment links and simple invoices without fixed cost." },
      { role: "IA", roleEn: "AI", slug: "chatgpt", reason: "Un copilote généraliste suffit pour cadrer, rédiger et clarifier.", reasonEn: "One general copilot is enough to scope, write, and clarify." },
    ],
  },
  {
    id: "marketing-agency-reference",
    slug: "agence-marketing",
    title: "Stack agence marketing",
    titleEn: "Marketing agency stack",
    subtitle: "Une stack type pour agence qui doit gérer contenus, campagnes, clients, reporting et automatisations sans multiplier les espaces de travail.",
    subtitleEn: "A stack template for agencies managing content, campaigns, clients, reporting, and automation without multiplying workspaces.",
    persona: "ops",
    subProfiles: ["agency", "social-content", "seo", "analytics", "automation"],
    stage: "scale",
    budget: "under150",
    monthlyBudget: 420,
    savings: 620,
    risk: "Avoir un outil différent par client ou par canal, puis perdre du temps à consolider l'information au lieu de produire.",
    riskEn: "Having a different tool per client or channel, then spending time consolidating information instead of producing.",
    bestFor: "Petites agences marketing, studios growth, collectifs social media et équipes acquisition.",
    bestForEn: "Small marketing agencies, growth studios, social media collectives, and acquisition teams.",
    avoidIf: "Tu gères déjà un pôle marketing de grande entreprise avec data warehouse, BI et gouvernance multi-équipe.",
    avoidIfEn: "You already manage an enterprise marketing department with a data warehouse, BI, and multi-team governance.",
    editorial: "Une agence gagne rarement à empiler les outils de campagne. Elle gagne à rendre le travail visible : brief, production, validation, publication, reporting. La bonne stack doit séparer création, pilotage et mesure, sans créer trois sources de vérité pour le même client.",
    editorialEn: "An agency rarely wins by stacking campaign tools. It wins by making work visible: brief, production, approval, publishing, reporting. The right stack separates creation, management, and measurement without creating three sources of truth for the same client.",
    needs: [
      { title: "Un flux client standard", titleEn: "A standard client flow", detail: "Chaque client doit passer par le même squelette : brief, backlog, production, validation, publication, reporting.", detailEn: "Every client should follow the same skeleton: brief, backlog, production, approval, publishing, reporting." },
      { title: "Une couche production séparée", titleEn: "A separate production layer", detail: "Canva/Figma servent à produire. Buffer/Brevo servent à diffuser. Les confondre crée des contenus introuvables.", detailEn: "Canva/Figma produce. Buffer/Brevo distribute. Confusing them makes content hard to find." },
      { title: "Un reporting orienté décision", titleEn: "Decision-oriented reporting", detail: "Le reporting doit dire quoi changer le mois prochain, pas afficher toutes les métriques disponibles.", detailEn: "Reporting should say what to change next month, not display every available metric." },
    ],
    maturitySignals: [
      { title: "3 clients actifs ou plus", titleEn: "3 or more active clients", detail: "ClickUp prend sa place quand tu dois comparer les charges et deadlines entre comptes.", detailEn: "ClickUp earns its place when you compare workload and deadlines across accounts." },
      { title: "Deux canaux de diffusion réguliers", titleEn: "Two regular distribution channels", detail: "Buffer ou Brevo se justifient quand la publication devient récurrente et mesurable.", detailEn: "Buffer or Brevo make sense when publishing becomes recurring and measurable." },
      { title: "Un rendez-vous reporting mensuel", titleEn: "A monthly reporting meeting", detail: "À ce stade, le reporting doit devenir un livrable, pas une capture de dashboard.", detailEn: "At this stage, reporting becomes a deliverable, not a dashboard screenshot." },
    ],
    traps: [
      { title: "Un outil par client", titleEn: "One tool per client", detail: "C'est le piège classique : tu finis à travailler dans cinq espaces dont aucun n'est vraiment maîtrisé.", detailEn: "Classic trap: you end up working in five spaces, none truly mastered." },
      { title: "Suite social media trop chère", titleEn: "Oversized social suite", detail: "Hootsuite-like trop tôt : utile pour grands volumes, rarement pour une petite agence en structuration.", detailEn: "Hootsuite-like too early: useful at high volume, rarely for a small agency structuring itself." },
      { title: "Automatisations non maintenues", titleEn: "Unmaintained automations", detail: "Make doit documenter un process stable. Si le process change toutes les semaines, reste manuel.", detailEn: "Make should document a stable process. If the process changes weekly, stay manual." },
    ],
    checkpoints: [
      { q: "Chaque client a-t-il le même format de suivi ?", qEn: "Does every client use the same tracking format?", hint: "Non → tu perds du temps à traduire le travail. Standardise brief, backlog, validation et reporting.", hintEn: "No → you lose time translating work. Standardize brief, backlog, approval, and reporting." },
      { q: "Tu produis tes contenus dans l'outil de publication ?", qEn: "Do you produce content inside the publishing tool?", hint: "Oui → sépare production et diffusion. Canva/Figma pour créer, Buffer ou Brevo pour diffuser.", hintEn: "Yes → separate production and distribution. Canva/Figma to create, Buffer or Brevo to distribute." },
      { q: "Ton reporting mélange trafic, leads et tâches internes ?", qEn: "Does your reporting mix traffic, leads, and internal tasks?", hint: "Oui → garde un reporting client lisible : acquisition, conversion, actions du mois.", hintEn: "Yes → keep client reporting readable: acquisition, conversion, monthly actions." },
    ],
    tools: [
      { role: "Pilotage projet", roleEn: "Project operations", slug: "clickup", reason: "Backlog, charge, statuts, calendrier éditorial et suivi multi-clients.", reasonEn: "Backlog, workload, statuses, editorial calendar, and multi-client tracking." },
      { role: "Base client / knowledge", roleEn: "Client knowledge base", slug: "notion", reason: "Briefs, comptes rendus, décisions, liens, process et playbooks réutilisables.", reasonEn: "Briefs, recaps, decisions, links, processes, and reusable playbooks." },
      { role: "CRM agence", roleEn: "Agency CRM", slug: "hubspot", reason: "À garder si l'agence gère inbound, pipeline, formulaires et relances commerciales.", reasonEn: "Keep if the agency manages inbound, pipeline, forms, and sales follow-ups." },
      { role: "CRM léger", roleEn: "Light CRM", slug: "pipedrive", reason: "Alternative plus simple si les ventes restent founder-led ou direction-led.", reasonEn: "Simpler alternative if sales remain founder-led or leadership-led." },
      { role: "Prospection", roleEn: "Prospecting", slug: "lemlist", reason: "Utile si l'agence fait de l'outbound mesuré, pas juste des campagnes ponctuelles.", reasonEn: "Useful if the agency runs measured outbound, not occasional campaigns." },
      { role: "Formulaires brief", roleEn: "Brief forms", slug: "typeform", reason: "Briefs clients, demandes entrantes, questionnaires avant audit.", reasonEn: "Client briefs, inbound requests, pre-audit questionnaires." },
      { role: "Création social / ads", roleEn: "Social / ads creation", slug: "canva", reason: "Templates social, ads, carrousels, présentations client et formats récurrents.", reasonEn: "Social templates, ads, carousels, client decks, and recurring formats." },
      { role: "Design avancé", roleEn: "Advanced design", slug: "figma", reason: "Landing pages, systèmes de composants, assets clients et prototypes.", reasonEn: "Landing pages, component systems, client assets, and prototypes." },
      { role: "Production vidéo courte", roleEn: "Short video production", slug: "capcut", reason: "Formats courts, ads, reels et déclinaisons vidéo sans suite lourde.", reasonEn: "Short formats, ads, reels, and video variations without a heavy suite." },
      { role: "Publication social", roleEn: "Social publishing", slug: "buffer", reason: "Planification sobre si l'agence gère quelques comptes et canaux.", reasonEn: "Lean scheduling if the agency manages a few accounts and channels." },
      { role: "Suite social avancée", roleEn: "Advanced social suite", slug: "hootsuite", reason: "À ne garder que si validation, volume et multi-comptes justifient le coût.", reasonEn: "Keep only if approval, volume, and multi-account needs justify the cost." },
      { role: "Emailing / automation", roleEn: "Emailing / automation", slug: "brevo", reason: "Newsletters, séquences simples, transactional léger et segmentation de base.", reasonEn: "Newsletters, simple sequences, light transactional, and basic segmentation." },
      { role: "Email marketing avancé", roleEn: "Advanced email marketing", slug: "mailchimp", reason: "À envisager si templates, audience et reporting sont déjà matures.", reasonEn: "Consider if templates, audience, and reporting are already mature." },
      { role: "SEO / audit", roleEn: "SEO / audit", slug: "semrush", reason: "Recherche mots-clés, audits techniques, concurrence et reporting SEO.", reasonEn: "Keyword research, technical audits, competitors, and SEO reporting." },
      { role: "SEO / backlinks", roleEn: "SEO / backlinks", slug: "ahrefs", reason: "Plus pertinent si l'agence vend vraiment SEO, contenus et netlinking.", reasonEn: "More relevant if the agency truly sells SEO, content, and link building." },
      { role: "Analytics web", roleEn: "Web analytics", slug: "google-analytics", reason: "Socle commun pour acquisition, conversions et attribution simple.", reasonEn: "Common baseline for acquisition, conversions, and simple attribution." },
      { role: "UX tracking", roleEn: "UX tracking", slug: "hotjar", reason: "À activer sur les pages à friction pour comprendre les comportements.", reasonEn: "Activate on friction pages to understand behavior." },
      { role: "Reporting / base data", roleEn: "Reporting / data base", slug: "airtable", reason: "Centralise calendriers, campagnes, budgets, assets et statuts si Notion devient trop souple.", reasonEn: "Centralizes calendars, campaigns, budgets, assets, and statuses if Notion gets too fuzzy." },
      { role: "Automatisation", roleEn: "Automation", slug: "make", reason: "Connecte formulaires, CRM, briefing, reporting et notifications client.", reasonEn: "Connects forms, CRM, briefing, reporting, and client notifications." },
      { role: "Connecteurs rapides", roleEn: "Fast connectors", slug: "zapier", reason: "Utile pour quelques intégrations simples si l'équipe le maîtrise déjà.", reasonEn: "Useful for a few simple integrations if the team already knows it." },
      { role: "Stockage assets", roleEn: "Asset storage", slug: "google-drive", reason: "Dossiers client, exports, assets sources et livrables finaux.", reasonEn: "Client folders, exports, source assets, and final deliverables." },
      { role: "Communication client", roleEn: "Client communication", slug: "slack", reason: "À réserver aux clients récurrents ou comptes à cadence rapide.", reasonEn: "Reserve for recurring clients or fast-moving accounts." },
      { role: "Feedback vidéo", roleEn: "Video feedback", slug: "loom", reason: "Explique audits, retours créa et recommandations sans multiplier les calls.", reasonEn: "Explains audits, creative feedback, and recommendations without multiplying calls." },
      { role: "Finance agence", roleEn: "Agency finance", slug: "pennylane", reason: "Suivi facturation, compta et trésorerie si l'agence dépasse le solo.", reasonEn: "Billing, accounting, and cash tracking once the agency grows beyond solo." },
      { role: "Paiement", roleEn: "Payment", slug: "stripe", reason: "Liens de paiement, acomptes, offres packagées et paiements internationaux.", reasonEn: "Payment links, deposits, packaged offers, and international payments." },
    ],
  },
  {
    id: "solopreneur-reference",
    slug: "solopreneur",
    title: "Stack solopreneur",
    titleEn: "Solopreneur stack",
    subtitle: "Une stack pour lancer une offre, capter des demandes, créer du contenu et encaisser avec le moins d'abonnements possible.",
    subtitleEn: "A stack to launch an offer, capture demand, create content, and get paid with as few subscriptions as possible.",
    persona: "solo",
    subProfiles: ["no-code", "copywriting", "crm-sales", "admin"],
    stage: "starter",
    budget: "under50",
    monthlyBudget: 34,
    savings: 145,
    risk: "Acheter les outils d'une future entreprise au lieu de servir l'activité actuelle : une offre, des contenus, des demandes, des paiements.",
    riskEn: "Buying tools for a future company instead of serving today's business: one offer, content, requests, and payments.",
    bestFor: "Créateurs, indépendants, coachs, formateurs et petites offres digitales.",
    bestForEn: "Creators, independents, coaches, trainers, and small digital offers.",
    avoidIf: "Tu as déjà une équipe, un support client structuré ou plusieurs produits actifs.",
    avoidIfEn: "You already have a team, structured support, or several active products.",
    editorial: "Le solopreneur n'a pas besoin d'une stack complète. Il a besoin d'une boucle courte : attirer, expliquer, qualifier, vendre, livrer. Tant que cette boucle n'est pas stable, chaque outil ajouté risque de masquer le vrai sujet : l'offre n'est pas encore assez claire ou le canal n'est pas encore fiable.",
    editorialEn: "A solopreneur does not need a complete stack. They need a short loop: attract, explain, qualify, sell, deliver. Until that loop is stable, every added tool risks hiding the real issue: the offer is not clear enough or the channel is not reliable yet.",
    needs: [
      { title: "Une offre compréhensible", titleEn: "A clear offer", detail: "La page d'offre est le premier outil. Si elle ne convertit pas, aucun CRM ne corrigera le problème.", detailEn: "The offer page is the first tool. If it does not convert, no CRM will fix the problem." },
      { title: "Une capture de demande simple", titleEn: "Simple request capture", detail: "Tally qualifie les demandes avant de prendre du temps en call.", detailEn: "Tally qualifies requests before spending time on calls." },
      { title: "Une boucle contenu légère", titleEn: "A light content loop", detail: "Notion garde les idées, ChatGPT aide à clarifier, Canva sert aux formats récurrents.", detailEn: "Notion keeps ideas, ChatGPT clarifies, Canva handles recurring formats." },
    ],
    maturitySignals: [
      { title: "Des demandes entrantes chaque semaine", titleEn: "Weekly inbound requests", detail: "Calendly devient utile quand les échanges de planning deviennent un vrai coût.", detailEn: "Calendly helps when scheduling becomes a real cost." },
      { title: "Une offre vendue plusieurs fois", titleEn: "An offer sold several times", detail: "C'est seulement là que tu dois automatiser onboarding, paiement et livraison.", detailEn: "Only then should you automate onboarding, payment, and delivery." },
      { title: "Un canal stable", titleEn: "One stable channel", detail: "Avant d'ajouter newsletter, communauté ou CRM, valide un canal qui apporte des demandes.", detailEn: "Before adding newsletter, community, or CRM, validate one channel that brings requests." },
    ],
    traps: [
      { title: "Construire trop grand", titleEn: "Building too big", detail: "Site complet, newsletter, tunnel, CRM et automation avant les premières ventes : c'est souvent de l'évitement.", detailEn: "Full site, newsletter, funnel, CRM, and automation before first sales is often avoidance." },
      { title: "Outils de créateur en doublon", titleEn: "Duplicate creator tools", detail: "Canva, Figma, CapCut, Notion, plusieurs IA : garde seulement ce qui sert au canal actif.", detailEn: "Canva, Figma, CapCut, Notion, several AIs: keep only what serves the active channel." },
      { title: "Paiement trop complexe", titleEn: "Overcomplicated payment", detail: "Stripe suffit souvent. Une plateforme de cours ou membership se justifie quand l'offre se répète.", detailEn: "Stripe often is enough. Course or membership platforms make sense when the offer repeats." },
    ],
    checkpoints: [
      { q: "Ton offre tient-elle sur une page claire ?", qEn: "Does your offer fit on one clear page?", hint: "Non → ne commence pas par un CRM. Commence par clarifier l'offre sur Webflow, Framer ou une page simple.", hintEn: "No → do not start with a CRM. Start by clarifying the offer on Webflow, Framer, or a simple page." },
      { q: "Tu captures les demandes avant de booker un appel ?", qEn: "Do you capture requests before booking a call?", hint: "Non → Tally filtre les mauvais échanges et te donne le contexte avant l'appel.", hintEn: "No → Tally filters weak conversations and gives you context before the call." },
      { q: "Tu paies déjà une suite newsletter, CRM et automation ?", qEn: "Are you already paying for newsletter, CRM, and automation tools?", hint: "Oui → garde une seule chaîne simple tant que tu n'as pas un volume régulier.", hintEn: "Yes → keep one simple chain until you have regular volume." },
    ],
    tools: [
      { role: "Page d'offre", roleEn: "Offer page", slug: "framer", reason: "Rapide pour publier une page propre sans chantier technique.", reasonEn: "Fast for publishing a clean page without a technical project." },
      { role: "Base de travail", roleEn: "Workspace", slug: "notion", reason: "Offres, contenus, prospects et livrables au même endroit.", reasonEn: "Offers, content, prospects, and deliverables in one place." },
      { role: "Formulaire", roleEn: "Form", slug: "tally", reason: "Qualification simple avant appel ou achat.", reasonEn: "Simple qualification before a call or purchase." },
      { role: "Rendez-vous", roleEn: "Scheduling", slug: "calendly", reason: "Utile si les appels de vente deviennent réguliers.", reasonEn: "Useful when sales calls become regular." },
      { role: "Paiement", roleEn: "Payment", slug: "stripe", reason: "Encaisser vite sans abonnement supplémentaire.", reasonEn: "Collect payment quickly without another subscription." },
      { role: "Contenu", roleEn: "Content", slug: "chatgpt", reason: "Aide à clarifier offres, scripts, posts et emails.", reasonEn: "Helps clarify offers, scripts, posts, and emails." },
    ],
  },
  {
    id: "ecommerce-reference",
    slug: "ecommerce",
    title: "Stack e-commerce",
    titleEn: "E-commerce stack",
    subtitle: "Une stack type pour boutique qui doit vendre, mesurer, gérer le support et relancer les clients sans transformer Shopify en mille-feuille d'apps.",
    subtitleEn: "A stack template for stores that need to sell, measure, support, and retain customers without turning Shopify into an app stack.",
    persona: "ops",
    subProfiles: ["ecommerce", "analytics", "crm-sales", "automation"],
    stage: "scale",
    budget: "under150",
    monthlyBudget: 142,
    savings: 260,
    risk: "Ajouter une app pour chaque problème e-commerce : pop-up, avis, upsell, email, support, analytics, puis perdre la marge dans les abonnements.",
    riskEn: "Adding one app per e-commerce problem: pop-up, reviews, upsell, email, support, analytics, then losing margin to subscriptions.",
    bestFor: "Boutiques Shopify ou WooCommerce early-stage, marques DTC et petits catalogues.",
    bestForEn: "Early-stage Shopify or WooCommerce stores, DTC brands, and small catalogs.",
    avoidIf: "Tu as déjà un catalogue complexe, plusieurs pays, ERP, logistique avancée et équipe support dédiée.",
    avoidIfEn: "You already have a complex catalog, multiple countries, ERP, advanced logistics, and a dedicated support team.",
    editorial: "En e-commerce, la stack doit protéger la marge. Shopify couvre déjà beaucoup de besoins. Les apps se justifient seulement si elles améliorent conversion, panier moyen, réachat ou support. Tout le reste doit être testé sur un temps court, puis coupé si l'impact n'est pas visible.",
    editorialEn: "In e-commerce, the stack must protect margin. Shopify already covers many needs. Apps are justified only if they improve conversion, average order value, repeat purchase, or support. Everything else should be tested briefly, then cut if impact is not visible.",
    needs: [
      { title: "Vendre sans fragiliser la marge", titleEn: "Sell without hurting margin", detail: "Chaque app doit être reliée à un levier : conversion, panier moyen, réachat ou support.", detailEn: "Each app must map to a lever: conversion, average order value, repeat purchase, or support." },
      { title: "Mesurer le parcours d'achat", titleEn: "Measure the buying journey", detail: "GA donne le socle acquisition/conversion. Hotjar ne vaut le coup que sur les pages à friction.", detailEn: "GA gives the acquisition/conversion baseline. Hotjar is worth it only on friction pages." },
      { title: "Fidéliser sans usine marketing", titleEn: "Retain without a marketing factory", detail: "Brevo suffit pour relance, post-achat et campagnes simples tant que la segmentation reste légère.", detailEn: "Brevo is enough for follow-up, post-purchase, and simple campaigns while segmentation stays light." },
    ],
    maturitySignals: [
      { title: "Plus de 100 commandes par mois", titleEn: "More than 100 orders per month", detail: "Le support e-commerce dédié devient rentable quand les questions récurrentes coûtent du temps ou des ventes.", detailEn: "Dedicated e-commerce support pays off when recurring questions cost time or sales." },
      { title: "Abandon panier élevé", titleEn: "High cart abandonment", detail: "Avant d'ajouter une app d'upsell, regarde les frictions checkout et livraison.", detailEn: "Before adding an upsell app, inspect checkout and delivery friction." },
      { title: "Réachat mesurable", titleEn: "Measurable repeat purchase", detail: "Quand le réachat existe, l'email devient un actif. Avant, il peut rester simple.", detailEn: "When repeat purchase exists, email becomes an asset. Before that, keep it simple." },
    ],
    traps: [
      { title: "Apps Shopify empilées", titleEn: "Stacked Shopify apps", detail: "Pop-up, avis, upsell, bundle, quiz, fidélité : chacune doit prouver son impact net.", detailEn: "Pop-up, reviews, upsell, bundle, quiz, loyalty: each must prove net impact." },
      { title: "Analytics en double", titleEn: "Duplicate analytics", detail: "GA, Hotjar, PostHog, pixels ads : garde une lecture claire, sinon personne ne décide.", detailEn: "GA, Hotjar, PostHog, ad pixels: keep a clear read, otherwise nobody decides." },
      { title: "Support trop tôt", titleEn: "Support too early", detail: "Gorgias est excellent quand le volume est réel. Avant, une boîte mail structurée peut suffire.", detailEn: "Gorgias is excellent at real volume. Before that, a structured inbox can be enough." },
    ],
    checkpoints: [
      { q: "Tu connais le coût mensuel total de tes apps Shopify ?", qEn: "Do you know the total monthly cost of your Shopify apps?", hint: "Non → commence par lister les apps et leur impact réel : conversion, panier, réachat ou support.", hintEn: "No → start by listing apps and their real impact: conversion, basket, repeat purchase, or support." },
      { q: "Ton email marketing génère-t-il assez de revenu pour payer l'outil ?", qEn: "Does email marketing generate enough revenue to pay for the tool?", hint: "Non → Brevo suffit souvent avant une plateforme plus chère.", hintEn: "No → Brevo is often enough before a more expensive platform." },
      { q: "Tu as plusieurs outils d'analytics actifs ?", qEn: "Do you have several analytics tools active?", hint: "Oui → garde un socle simple : GA pour acquisition, Hotjar si tu regardes vraiment les sessions.", hintEn: "Yes → keep a simple baseline: GA for acquisition, Hotjar only if you actually watch sessions." },
    ],
    tools: [
      { role: "Boutique", roleEn: "Storefront", slug: "shopify", reason: "Socle robuste pour catalogue, paiement, commandes et apps.", reasonEn: "Robust base for catalog, payment, orders, and apps." },
      { role: "Paiement", roleEn: "Payment", slug: "stripe", reason: "Paiements et facturation clairs si tu sors du strict Shopify.", reasonEn: "Clear payments and billing when you step outside pure Shopify." },
      { role: "Email", roleEn: "Email", slug: "brevo", reason: "Campagnes et automatisations simples à coût contenu.", reasonEn: "Simple campaigns and automations at a controlled cost." },
      { role: "Support", roleEn: "Support", slug: "gorgias", reason: "À garder si le volume support justifie une boîte dédiée e-commerce.", reasonEn: "Keep if support volume justifies an e-commerce-focused helpdesk." },
      { role: "Analytics", roleEn: "Analytics", slug: "google-analytics", reason: "Base commune pour acquisition, conversion et revenus.", reasonEn: "Common baseline for acquisition, conversion, and revenue." },
      { role: "UX", roleEn: "UX", slug: "hotjar", reason: "À activer sur les pages qui posent vraiment problème.", reasonEn: "Activate on pages that truly need diagnosis." },
    ],
  },
  {
    id: "startup-saas-reference",
    slug: "startup-saas",
    title: "Stack startup SaaS",
    titleEn: "Startup SaaS stack",
    subtitle: "Une stack de référence pour SaaS early-stage : produit, code, tracking, support, vente et coordination avec des outils qui restent lisibles.",
    subtitleEn: "A reference stack for early-stage SaaS: product, code, tracking, support, sales, and coordination with tools that stay readable.",
    persona: "dev",
    subProfiles: ["product", "web", "analytics", "crm-sales"],
    stage: "scale",
    budget: "under150",
    monthlyBudget: 148,
    savings: 320,
    risk: "Acheter trop tôt la stack d'une scale-up : CRM complet, analytics multiples, support lourd, PM tool avancé et plusieurs IA payantes.",
    riskEn: "Buying a scale-up stack too early: full CRM, multiple analytics tools, heavy support, advanced PM tooling, and several paid AIs.",
    bestFor: "SaaS early-stage, MVP commercialisé, petite équipe produit ou fondateur technique.",
    bestForEn: "Early-stage SaaS, commercial MVP, small product team, or technical founder.",
    avoidIf: "Tu es déjà en scale avec équipe data, support multi-niveau, sales ops et contraintes sécurité avancées.",
    avoidIfEn: "You are already scaling with a data team, multi-level support, sales ops, and advanced security constraints.",
    editorial: "La stack SaaS early-stage doit rendre l'apprentissage rapide. Le but n'est pas d'avoir le meilleur outil de chaque catégorie, mais une chaîne cohérente : construire, déployer, mesurer l'activation, parler aux utilisateurs, vendre et décider quoi faire ensuite.",
    editorialEn: "An early-stage SaaS stack should make learning fast. The goal is not to have the best tool in each category, but a coherent chain: build, deploy, measure activation, talk to users, sell, and decide what to do next.",
    needs: [
      { title: "Boucler produit et feedback", titleEn: "Close product and feedback loop", detail: "GitHub/Vercel livrent vite, Linear organise les décisions, Intercom remonte la voix client.", detailEn: "GitHub/Vercel ship fast, Linear organizes decisions, Intercom brings customer voice back." },
      { title: "Mesurer l'activation", titleEn: "Measure activation", detail: "PostHog doit suivre quelques événements critiques, pas devenir un grenier à données.", detailEn: "PostHog should track a few critical events, not become a data attic." },
      { title: "Vendre sans CRM d'entreprise", titleEn: "Sell without enterprise CRM", detail: "Pipedrive suffit tant que le cycle est founder-led et que les deals se comptent en dizaines.", detailEn: "Pipedrive is enough while sales is founder-led and deals are counted in dozens." },
    ],
    maturitySignals: [
      { title: "Activation stable", titleEn: "Stable activation", detail: "Quand l'activation est comprise, tu peux investir dans onboarding, lifecycle email et expérimentation.", detailEn: "When activation is understood, invest in onboarding, lifecycle email, and experimentation." },
      { title: "Support récurrent", titleEn: "Recurring support", detail: "Intercom devient central quand les conversations nourrissent vraiment produit, churn et upsell.", detailEn: "Intercom becomes central when conversations feed product, churn, and upsell." },
      { title: "Pipeline fondateur saturé", titleEn: "Founder pipeline saturated", detail: "C'est le signal pour structurer sales ops. Avant, évite HubSpot complet.", detailEn: "That is the signal to structure sales ops. Before that, avoid full HubSpot." },
    ],
    traps: [
      { title: "Stack scale-up copiée", titleEn: "Copied scale-up stack", detail: "Datadog, HubSpot, Segment, Mixpanel et support lourd trop tôt peuvent coûter plus que ce qu'ils apprennent.", detailEn: "Datadog, HubSpot, Segment, Mixpanel, and heavy support too early can cost more than they teach." },
      { title: "Trop d'events", titleEn: "Too many events", detail: "Si personne ne regarde l'event, ne le tracke pas. Trois métriques utiles battent cinquante métriques mortes.", detailEn: "If nobody reads the event, do not track it. Three useful metrics beat fifty dead ones." },
      { title: "Roadmap décorative", titleEn: "Decorative roadmap", detail: "Linear ne doit pas devenir une vitrine. Il doit contenir les décisions produit qui changent vraiment la semaine.", detailEn: "Linear should not become a showcase. It should hold product decisions that truly change the week." },
    ],
    checkpoints: [
      { q: "Tu suis l'activation produit avant les vanity metrics ?", qEn: "Do you track product activation before vanity metrics?", hint: "Non → PostHog doit d'abord suivre le premier moment de valeur, pas 40 événements.", hintEn: "No → PostHog should first track the first value moment, not 40 events." },
      { q: "Ton CRM est-il plus avancé que ton volume commercial ?", qEn: "Is your CRM more advanced than your sales volume?", hint: "Oui → Pipedrive suffit souvent tant que les deals restent gérés par fondateurs.", hintEn: "Yes → Pipedrive is often enough while founders still manage deals." },
      { q: "Tu as séparé support, feedback et roadmap ?", qEn: "Have you separated support, feedback, and roadmap?", hint: "Non → commence simple : support dans Intercom, décisions produit dans Linear ou Notion.", hintEn: "No → start simple: support in Intercom, product decisions in Linear or Notion." },
    ],
    tools: [
      { role: "Repo", roleEn: "Repo", slug: "github", reason: "Standard pour code, issues techniques et collaboration dev.", reasonEn: "Standard for code, technical issues, and dev collaboration." },
      { role: "Déploiement", roleEn: "Deployment", slug: "vercel", reason: "Preview rapide, déploiements propres, faible friction.", reasonEn: "Fast previews, clean deployments, low friction." },
      { role: "Produit", roleEn: "Product", slug: "linear", reason: "Roadmap courte, bugs et cycles produit sans lourdeur.", reasonEn: "Short roadmap, bugs, and product cycles without bloat." },
      { role: "Analytics produit", roleEn: "Product analytics", slug: "posthog", reason: "Events, funnels, replay et feature flags au même endroit.", reasonEn: "Events, funnels, replay, and feature flags in one place." },
      { role: "Support", roleEn: "Support", slug: "intercom", reason: "À garder si les conversations client nourrissent vraiment le produit.", reasonEn: "Keep if customer conversations truly feed the product." },
      { role: "Vente", roleEn: "Sales", slug: "pipedrive", reason: "Suffisant pour pipeline fondateur avant une suite CRM complète.", reasonEn: "Enough for founder-led sales before a full CRM suite." },
      { role: "Paiement", roleEn: "Payment", slug: "stripe", reason: "Abonnements, paiement et facturation SaaS.", reasonEn: "Subscriptions, payments, and SaaS billing." },
    ],
  },
];

export const STACK_USES: Record<string, StackUseCase[]> = {
  "freelance-reference": [
    {
      title: "Gérer une mission client",
      titleEn: "Manage a client project",
      description: "La stack freelance doit éviter les pertes de contexte : brief, décisions, fichiers et paiement doivent rester faciles à retrouver.",
      descriptionEn: "A freelance stack should avoid lost context: brief, decisions, files, and payment must stay easy to find.",
      toolSlugs: ["notion", "google-drive", "stripe"],
      workflow: ["Je crée une page client dans Notion avec contexte, périmètre et décisions.", "Je garde les fichiers dans Drive avec un dossier par client.", "Je partage les livrables depuis Drive et les décisions depuis Notion.", "J'encaisse avec Stripe quand le jalon est validé."],
      workflowEn: ["I create a client page in Notion with context, scope, and decisions.", "I keep files in Drive with one folder per client.", "I share deliverables from Drive and decisions from Notion.", "I collect payment with Stripe when the milestone is approved."],
    },
    {
      title: "Qualifier les demandes entrantes",
      titleEn: "Qualify inbound requests",
      description: "Un formulaire simple filtre mieux qu'un appel mal préparé. L'objectif est d'arriver au premier échange avec le contexte utile.",
      descriptionEn: "A simple form filters better than a poorly prepared call. The goal is to reach the first conversation with useful context.",
      toolSlugs: ["tally", "notion", "calendly"],
      workflow: ["Je pose les questions qui changent vraiment ma réponse.", "Je stocke la demande dans Notion.", "Je propose Calendly seulement si le projet mérite un échange.", "Je garde une prochaine action claire pour chaque prospect."],
      workflowEn: ["I ask questions that truly change my answer.", "I store the request in Notion.", "I share Calendly only if the project deserves a call.", "I keep a clear next action for every prospect."],
    },
  ],
  "marketing-agency-reference": [
    {
      title: "Produire une campagne client",
      titleEn: "Produce a client campaign",
      description: "Une agence a besoin d'un flux lisible entre brief, production, validation et publication. Sinon chaque campagne devient un assemblage fragile.",
      descriptionEn: "An agency needs a readable flow between brief, production, approval, and publishing. Otherwise every campaign becomes fragile.",
      toolSlugs: ["clickup", "canva", "buffer"],
      workflow: ["Je cadre la campagne et les dates dans ClickUp.", "Je produis les formats dans Canva avec des templates validés.", "Je fais valider avant planification.", "Je publie via Buffer quand les contenus sont prêts."],
      workflowEn: ["I frame the campaign and dates in ClickUp.", "I produce formats in Canva with approved templates.", "I get approval before scheduling.", "I publish through Buffer when content is ready."],
    },
    {
      title: "Reporter sans tableur interminable",
      titleEn: "Report without endless spreadsheets",
      description: "Le reporting doit montrer ce qui change la décision du client, pas recopier toutes les métriques disponibles.",
      descriptionEn: "Reporting should show what changes the client's decision, not copy every available metric.",
      toolSlugs: ["google-analytics", "brevo", "notion"],
      workflow: ["Je récupère trafic, conversion et campagnes.", "Je résume les enseignements dans Notion.", "Je liste les actions du mois suivant.", "Je garde les chiffres secondaires en annexe."],
      workflowEn: ["I collect traffic, conversion, and campaign data.", "I summarize learnings in Notion.", "I list next month's actions.", "I keep secondary metrics in an appendix."],
    },
  ],
  "solopreneur-reference": [
    {
      title: "Lancer une offre simple",
      titleEn: "Launch a simple offer",
      description: "Le solopreneur doit rendre son offre compréhensible avant d'automatiser quoi que ce soit.",
      descriptionEn: "A solopreneur should make the offer understandable before automating anything.",
      toolSlugs: ["framer", "tally", "stripe"],
      workflow: ["Je publie une page d'offre courte.", "Je capture les demandes avec Tally.", "Je réponds aux bons prospects avec un lien de paiement.", "Je mesure les objections avant d'ajouter des outils."],
      workflowEn: ["I publish a short offer page.", "I capture requests with Tally.", "I answer qualified prospects with a payment link.", "I track objections before adding tools."],
    },
    {
      title: "Produire du contenu sans système lourd",
      titleEn: "Produce content without a heavy system",
      description: "Le bon système éditorial tient dans peu d'outils : idées, brouillon, publication, retour.",
      descriptionEn: "A good editorial system fits in a few tools: ideas, draft, publish, feedback.",
      toolSlugs: ["notion", "chatgpt", "canva"],
      workflow: ["Je stocke les idées dans Notion.", "Je demande à ChatGPT des angles, pas des textes finaux.", "Je crée les visuels récurrents dans Canva.", "Je garde ce qui marche pour améliorer l'offre."],
      workflowEn: ["I store ideas in Notion.", "I ask ChatGPT for angles, not final copy.", "I create recurring visuals in Canva.", "I keep what works to improve the offer."],
    },
  ],
  "ecommerce-reference": [
    {
      title: "Vendre sans multiplier les apps",
      titleEn: "Sell without multiplying apps",
      description: "Chaque app e-commerce doit défendre sa place par un impact clair sur conversion, panier, réachat ou support.",
      descriptionEn: "Every e-commerce app should defend its place through a clear impact on conversion, basket, repeat purchase, or support.",
      toolSlugs: ["shopify", "stripe", "brevo"],
      workflow: ["Je garde Shopify comme socle principal.", "Je limite les apps aux problèmes mesurés.", "Je relance les clients avec Brevo.", "Je coupe les apps sans impact après test."],
      workflowEn: ["I keep Shopify as the main base.", "I limit apps to measured problems.", "I re-engage customers with Brevo.", "I cut apps with no impact after testing."],
    },
    {
      title: "Comprendre les abandons",
      titleEn: "Understand drop-offs",
      description: "L'analytics e-commerce doit expliquer où la marge se perd : acquisition, fiche produit, panier ou support.",
      descriptionEn: "E-commerce analytics should explain where margin gets lost: acquisition, product page, cart, or support.",
      toolSlugs: ["google-analytics", "hotjar", "gorgias"],
      workflow: ["Je regarde les pages à fort trafic dans GA.", "J'active Hotjar seulement sur les pages qui posent problème.", "Je relie les questions support aux blocages d'achat.", "Je corrige avant d'acheter une nouvelle app."],
      workflowEn: ["I review high-traffic pages in GA.", "I activate Hotjar only on problematic pages.", "I connect support questions to buying blockers.", "I fix before buying a new app."],
    },
  ],
  "startup-saas-reference": [
    {
      title: "Construire et livrer vite",
      titleEn: "Build and ship fast",
      description: "Une stack SaaS early-stage doit raccourcir la distance entre idée, mise en prod et retour utilisateur.",
      descriptionEn: "An early-stage SaaS stack should shorten the distance between idea, production, and user feedback.",
      toolSlugs: ["github", "vercel", "linear"],
      workflow: ["Je garde le code dans GitHub.", "Je déploie des previews Vercel pour tester vite.", "Je priorise les sujets produit dans Linear.", "Je ferme les décisions avant d'ouvrir de nouveaux chantiers."],
      workflowEn: ["I keep code in GitHub.", "I deploy Vercel previews to test quickly.", "I prioritize product topics in Linear.", "I close decisions before opening new work."],
    },
    {
      title: "Mesurer et vendre",
      titleEn: "Measure and sell",
      description: "Le SaaS early-stage doit relier usage produit et pipeline commercial sans se noyer dans la data.",
      descriptionEn: "Early-stage SaaS must connect product usage and sales pipeline without drowning in data.",
      toolSlugs: ["posthog", "pipedrive", "stripe", "intercom"],
      workflow: ["Je suis l'activation dans PostHog.", "Je garde les deals fondateurs dans Pipedrive.", "Je facture avec Stripe.", "Je transforme les conversations Intercom en décisions produit."],
      workflowEn: ["I track activation in PostHog.", "I keep founder-led deals in Pipedrive.", "I bill with Stripe.", "I turn Intercom conversations into product decisions."],
    },
  ],
  "dev-shipper": [
    {
      title: "Livrer un site client",
      titleEn: "Ship a client website",
      description: "C'est le cas le plus courant : un client veut voir quelque chose vite, comprendre où tu en es, puis payer sans friction. Ici, la stack sert surtout à éviter les allers-retours flous.",
      descriptionEn: "This is the most common case: a client wants to see progress quickly, understand where things stand, and pay without friction. Here, the stack mostly avoids blurry back-and-forth.",
      toolSlugs: ["notion", "github", "vercel", "stripe"],
      workflow: ["Je pose le périmètre et les décisions dans Notion, pour ne pas dépendre d'un fil Slack ou d'un email perdu.", "Je garde le code dans GitHub, même sur un petit projet, parce que c'est mon filet de sécurité.", "Je partage une preview Vercel au lieu d'envoyer des captures.", "Je facture ou j'encaisse avec Stripe quand le jalon est validé."],
      workflowEn: ["I put scope and decisions in Notion so I do not depend on a lost Slack thread or email.", "I keep code in GitHub, even for a small project, because it is my safety net.", "I share a Vercel preview instead of sending screenshots.", "I bill or collect payment with Stripe once the milestone is approved."],
    },
    {
      title: "Débloquer plus vite avec l'IA",
      titleEn: "Unblock faster with AI",
      description: "L'IA est utile quand elle enlève une friction précise. Elle devient chère quand elle remplace ta méthode de travail ou quand tu paies trois assistants pour le même usage.",
      descriptionEn: "AI is useful when it removes a precise friction. It becomes expensive when it replaces your work method or when you pay three assistants for the same use.",
      toolSlugs: ["chatgpt", "github"],
      workflow: ["Je donne à ChatGPT une erreur, un bout de contexte ou une contrainte, pas tout le projet.", "Je lui demande une hypothèse courte plutôt qu'une refonte complète.", "Je n'applique que ce que je comprends.", "Si ça change l'architecture, je laisse une trace dans le repo."],
      workflowEn: ["I give ChatGPT an error, a bit of context, or a constraint, not the whole project.", "I ask for a short hypothesis rather than a full rewrite.", "I apply only what I understand.", "If it changes architecture, I leave a note in the repo."],
    },
    {
      title: "Maintenir sans outil projet lourd",
      titleEn: "Maintain without heavy PM tooling",
      description: "Pour un freelance, la maintenance se complique rarement à cause du manque d'outil. Elle se complique parce que les demandes, les priorités et les décisions sont dispersées.",
      descriptionEn: "For a freelancer, maintenance rarely gets messy because of missing tooling. It gets messy because requests, priorities, and decisions are scattered.",
      toolSlugs: ["notion", "github"],
      workflow: ["Je garde les demandes brutes dans Notion, avec le contexte client.", "Je transforme seulement les sujets mûrs en issues GitHub.", "Je livre par petits lots pour éviter la grande release anxiogène.", "Je note les décisions importantes là où le client peut les relire."],
      workflowEn: ["I keep raw requests in Notion with client context.", "I turn only mature topics into GitHub issues.", "I ship in small batches to avoid the stressful big release.", "I record important decisions where the client can reread them."],
    },
  ],
  "designer-solo": [
    {
      title: "Cadrage et maquette",
      titleEn: "Framing and mockup",
      description: "Quand tu vends du design en solo, le risque n'est pas de manquer d'outils. Le risque, c'est d'avoir trop d'endroits où le brief, les retours et la dernière version peuvent se perdre.",
      descriptionEn: "When you sell design solo, the risk is not lacking tools. The risk is having too many places where the brief, feedback, and latest version can get lost.",
      toolSlugs: ["figma", "notion"],
      workflow: ["Je garde le brief et les décisions dans Notion, pas dans dix messages éparpillés.", "Je fais vivre les maquettes dans Figma, avec un seul lien client.", "Je sépare les idées exploratoires des écrans validés.", "Je documente les arbitrages quand le client tranche."],
      workflowEn: ["I keep the brief and decisions in Notion, not in ten scattered messages.", "I keep mockups alive in Figma with one client link.", "I separate exploratory ideas from approved screens.", "I document trade-offs when the client decides."],
    },
    {
      title: "Production rapide de contenus",
      titleEn: "Fast content production",
      description: "Canva a du sens quand il sert à décliner vite, pas quand il devient un deuxième atelier créatif parallèle à Figma.",
      descriptionEn: "Canva makes sense when it helps you repurpose quickly, not when it becomes a second creative workshop next to Figma.",
      toolSlugs: ["canva", "figma"],
      workflow: ["Je crée le système visuel dans Figma, là où la qualité se décide.", "Je garde seulement quelques templates Canva vraiment utilisés.", "Je décline les formats sociaux sans réinventer la direction artistique.", "Je supprime les templates qui dorment au lieu de les collectionner."],
      workflowEn: ["I create the visual system in Figma, where quality is decided.", "I keep only a few Canva templates that are truly used.", "I repurpose social formats without reinventing the art direction.", "I delete dormant templates instead of collecting them."],
    },
    {
      title: "Feedback asynchrone",
      titleEn: "Async feedback",
      description: "Une vidéo de feedback est précieuse si elle évite un rendez-vous et clarifie une décision. Sinon, c'est juste un outil de plus dans la chaîne.",
      descriptionEn: "A feedback video is valuable if it avoids a meeting and clarifies a decision. Otherwise, it is just another tool in the chain.",
      toolSlugs: ["loom", "figma"],
      workflow: ["Je prépare les points à commenter avant d'enregistrer.", "Je montre les zones Figma concernées au lieu de parler dans le vide.", "Je termine par une question de décision, pas par un vague “dis-moi ce que tu en penses”.", "Je colle la vidéo dans la page projet pour garder la trace."],
      workflowEn: ["I prepare the points before recording.", "I show the relevant Figma areas instead of speaking into the void.", "I end with a decision question, not a vague “tell me what you think”.", "I paste the video into the project page to keep the trace."],
    },
  ],
  "architecte-interieur-studio": [
    {
      title: "Brief, concept et moodboard",
      titleEn: "Brief, concept, and moodboard",
      description: "Le début du projet doit transformer un besoin flou en direction lisible : contraintes, style, usage, budget, références et premières options.",
      descriptionEn: "The beginning of the project turns a vague need into a readable direction: constraints, style, use, budget, references, and early options.",
      toolSlugs: ["notion", "chatgpt", "pinterest", "milanote", "krea-ai"],
      workflow: ["Je synthétise le brief dans Notion avec objectifs, contraintes, budget et décisions ouvertes.", "J'utilise ChatGPT pour structurer les questions, le compte rendu et la liste de livrables.", "Je cherche l'ambiance dans Pinterest, puis je classe les références utiles dans Milanote ou Eagle.", "Je teste quelques variantes visuelles avec Krea quand le client a besoin de se projeter vite."],
      workflowEn: ["I summarize the brief in Notion with goals, constraints, budget, and open decisions.", "I use ChatGPT to structure questions, recap, and deliverables.", "I research mood on Pinterest, then organize useful references in Milanote or Eagle.", "I test a few visual variations with Krea when the client needs to project quickly."],
    },
    {
      title: "Plans, 3D et rendu client",
      titleEn: "Plans, 3D, and client rendering",
      description: "Le coeur de la stack doit rester court : plan propre, modèle 3D vivant, rendu convaincant et dossier de validation sans refaire le travail à chaque changement.",
      descriptionEn: "The stack core should stay short: clean plan, living 3D model, convincing render, and approval dossier without redoing work after every change.",
      toolSlugs: ["autocad-lt", "sketchup-pro", "layout-sketchup", "d5-render", "adobe-photoshop"],
      workflow: ["Je prépare ou nettoie les plans 2D dans AutoCAD LT quand le DWG est nécessaire.", "Je construis les volumes, variantes et scènes dans SketchUp Pro.", "Je génère les documents lisibles dans LayOut pour garder le lien avec le modèle.", "Je produis les vues de validation dans D5 Render, puis je retouche seulement ce qui aide la décision."],
      workflowEn: ["I prepare or clean 2D plans in AutoCAD LT when DWG is needed.", "I build volumes, options, and scenes in SketchUp Pro.", "I generate readable documents in LayOut to keep the link with the model.", "I produce approval views in D5 Render, then retouch only what helps the decision."],
    },
    {
      title: "Sourcing, budget et validations",
      titleEn: "Sourcing, budget, and approvals",
      description: "C'est souvent là que la rentabilité se joue : mobilier, luminaires, matières, alternatives, prix, délais et validations doivent être traçables.",
      descriptionEn: "This is often where profitability is won: furniture, lighting, materials, alternatives, prices, lead times, and approvals must be traceable.",
      toolSlugs: ["programa", "notion", "google-workspace", "yousign"],
      workflow: ["Je passe les références importantes en fiches avec prix, fournisseur, statut et alternative.", "Je garde les arbitrages dans Notion ou Programa, pas dans un fil de messages.", "Je partage les documents lourds dans Drive avec une structure de dossiers stable.", "Je fais signer devis, lettres de mission ou validations clés avec Yousign."],
      workflowEn: ["I turn important references into records with price, supplier, status, and alternative.", "I keep trade-offs in Notion or Programa, not in a message thread.", "I share heavy documents in Drive with a stable folder structure.", "I sign quotes, engagement letters, or key approvals with Yousign."],
    },
    {
      title: "Chantier et facturation",
      titleEn: "Site follow-up and invoicing",
      description: "Le suivi doit garder la trace des décisions, photos, réserves, artisans, paiements et documents finaux sans créer une couche administrative lourde.",
      descriptionEn: "Follow-up should keep track of decisions, photos, snagging, contractors, payments, and final documents without creating heavy admin.",
      toolSlugs: ["notion", "loom", "indy", "qonto"],
      workflow: ["Je note décisions, photos, réserves et prochaines actions dans la page projet.", "J'utilise Loom pour expliquer une correction de plan ou une option quand une réunion n'apporte rien.", "Je facture les jalons dans Indy et je suis les paiements.", "Je garde le compte pro et les justificatifs dans Qonto pour ne pas reconstruire la compta en fin de mois."],
      workflowEn: ["I record decisions, photos, snagging, and next actions in the project page.", "I use Loom to explain a plan correction or option when a meeting adds nothing.", "I invoice milestones in Indy and track payments.", "I keep the business account and receipts in Qonto so accounting is not rebuilt at month-end."],
    },
  ],
  "scenographe-evenementiel":   [
      {
          "title": "Concept et intention",
          "titleEn": "Concept et intention",
          "description": "Structurer narration, moodboard et premières vues avant de passer en production.",
          "descriptionEn": "Structurer narration, moodboard et premières vues avant de passer en production.",
          "toolSlugs": [
              "notion",
              "milanote",
              "shotdeck",
              "chatgpt"
          ],
          "workflow": [
              "Je clarifie le livrable attendu et la décision à obtenir.",
              "Je garde les sources et validations dans un seul endroit.",
              "Je livre une version exploitable, pas seulement une belle intention."
          ],
          "workflowEn": [
              "I clarify the expected deliverable and the decision needed.",
              "I keep sources and approvals in one place.",
              "I deliver something usable, not only a nice intention."
          ]
      },
      {
          "title": "3D et validation",
          "titleEn": "3D et validation",
          "description": "Construire le volume, rendre l’intention et faire valider les arbitrages.",
          "descriptionEn": "Construire le volume, rendre l’intention et faire valider les arbitrages.",
          "toolSlugs": [
              "sketchup-pro",
              "d5-render",
              "twinmotion",
              "adobe-photoshop"
          ],
          "workflow": [
              "Je clarifie le livrable attendu et la décision à obtenir.",
              "Je garde les sources et validations dans un seul endroit.",
              "Je livre une version exploitable, pas seulement une belle intention."
          ],
          "workflowEn": [
              "I clarify the expected deliverable and the decision needed.",
              "I keep sources and approvals in one place.",
              "I deliver something usable, not only a nice intention."
          ]
      },
      {
          "title": "Production",
          "titleEn": "Production",
          "description": "Suivre plans, fournisseurs, budget et fabrication.",
          "descriptionEn": "Suivre plans, fournisseurs, budget et fabrication.",
          "toolSlugs": [
              "vectorworks",
              "indesign",
              "monday",
              "open-cut-list"
          ],
          "workflow": [
              "Je clarifie le livrable attendu et la décision à obtenir.",
              "Je garde les sources et validations dans un seul endroit.",
              "Je livre une version exploitable, pas seulement une belle intention."
          ],
          "workflowEn": [
              "I clarify the expected deliverable and the decision needed.",
              "I keep sources and approvals in one place.",
              "I deliver something usable, not only a nice intention."
          ]
      }
  ],
  "designer-stand-retail-popup":   [
      {
          "title": "Concept retail",
          "titleEn": "Concept retail",
          "description": "Aligner marque, circulation, mobilier et expérience.",
          "descriptionEn": "Aligner marque, circulation, mobilier et expérience.",
          "toolSlugs": [
              "figma",
              "adobe-illustrator",
              "sketchup-pro",
              "krea-ai"
          ],
          "workflow": [
              "Je clarifie le livrable attendu et la décision à obtenir.",
              "Je garde les sources et validations dans un seul endroit.",
              "Je livre une version exploitable, pas seulement une belle intention."
          ],
          "workflowEn": [
              "I clarify the expected deliverable and the decision needed.",
              "I keep sources and approvals in one place.",
              "I deliver something usable, not only a nice intention."
          ]
      },
      {
          "title": "Dossier fabrication",
          "titleEn": "Dossier fabrication",
          "description": "Transformer le concept en plans, matériaux et éléments produits.",
          "descriptionEn": "Transformer le concept en plans, matériaux et éléments produits.",
          "toolSlugs": [
              "autocad",
              "indesign",
              "profile-builder-3",
              "google-sheets"
          ],
          "workflow": [
              "Je clarifie le livrable attendu et la décision à obtenir.",
              "Je garde les sources et validations dans un seul endroit.",
              "Je livre une version exploitable, pas seulement une belle intention."
          ],
          "workflowEn": [
              "I clarify the expected deliverable and the decision needed.",
              "I keep sources and approvals in one place.",
              "I deliver something usable, not only a nice intention."
          ]
      },
      {
          "title": "Suivi production",
          "titleEn": "Suivi production",
          "description": "Piloter prestataires, coûts et alternatives.",
          "descriptionEn": "Piloter prestataires, coûts et alternatives.",
          "toolSlugs": [
              "notion",
              "airtable",
              "monday",
              "google-drive"
          ],
          "workflow": [
              "Je clarifie le livrable attendu et la décision à obtenir.",
              "Je garde les sources et validations dans un seul endroit.",
              "Je livre une version exploitable, pas seulement une belle intention."
          ],
          "workflowEn": [
              "I clarify the expected deliverable and the decision needed.",
              "I keep sources and approvals in one place.",
              "I deliver something usable, not only a nice intention."
          ]
      }
  ],
  "designer-graphique-pro":   [
      {
          "title": "Identité et supports",
          "titleEn": "Identité et supports",
          "description": "Créer les sources visuelles, déclinaisons et fichiers propres.",
          "descriptionEn": "Créer les sources visuelles, déclinaisons et fichiers propres.",
          "toolSlugs": [
              "adobe-illustrator",
              "adobe-photoshop",
              "indesign",
              "figma"
          ],
          "workflow": [
              "Je clarifie le livrable attendu et la décision à obtenir.",
              "Je garde les sources et validations dans un seul endroit.",
              "Je livre une version exploitable, pas seulement une belle intention."
          ],
          "workflowEn": [
              "I clarify the expected deliverable and the decision needed.",
              "I keep sources and approvals in one place.",
              "I deliver something usable, not only a nice intention."
          ]
      },
      {
          "title": "Assets et typos",
          "titleEn": "Assets et typos",
          "description": "Ranger références, polices, mockups et exports.",
          "descriptionEn": "Ranger références, polices, mockups et exports.",
          "toolSlugs": [
              "eagle",
              "fontbase",
              "adobe-acrobat",
              "google-drive"
          ],
          "workflow": [
              "Je clarifie le livrable attendu et la décision à obtenir.",
              "Je garde les sources et validations dans un seul endroit.",
              "Je livre une version exploitable, pas seulement une belle intention."
          ],
          "workflowEn": [
              "I clarify the expected deliverable and the decision needed.",
              "I keep sources and approvals in one place.",
              "I deliver something usable, not only a nice intention."
          ]
      },
      {
          "title": "Livraison client",
          "titleEn": "Livraison client",
          "description": "Suivre brief, retours, facturation et versions.",
          "descriptionEn": "Suivre brief, retours, facturation et versions.",
          "toolSlugs": [
              "notion",
              "indy",
              "canva",
              "chatgpt"
          ],
          "workflow": [
              "Je clarifie le livrable attendu et la décision à obtenir.",
              "Je garde les sources et validations dans un seul endroit.",
              "Je livre une version exploitable, pas seulement une belle intention."
          ],
          "workflowEn": [
              "I clarify the expected deliverable and the decision needed.",
              "I keep sources and approvals in one place.",
              "I deliver something usable, not only a nice intention."
          ]
      }
  ],
  "brand-designer-systeme":   [
      {
          "title": "Plateforme de marque",
          "titleEn": "Plateforme de marque",
          "description": "Structurer stratégie, moodboard et territoire visuel.",
          "descriptionEn": "Structurer stratégie, moodboard et territoire visuel.",
          "toolSlugs": [
              "notion",
              "miro",
              "arena",
              "chatgpt"
          ],
          "workflow": [
              "Je clarifie le livrable attendu et la décision à obtenir.",
              "Je garde les sources et validations dans un seul endroit.",
              "Je livre une version exploitable, pas seulement une belle intention."
          ],
          "workflowEn": [
              "I clarify the expected deliverable and the decision needed.",
              "I keep sources and approvals in one place.",
              "I deliver something usable, not only a nice intention."
          ]
      },
      {
          "title": "Système visuel",
          "titleEn": "Système visuel",
          "description": "Créer identité, guidelines et templates maintenables.",
          "descriptionEn": "Créer identité, guidelines et templates maintenables.",
          "toolSlugs": [
              "figma",
              "adobe-illustrator",
              "indesign",
              "brandpad"
          ],
          "workflow": [
              "Je clarifie le livrable attendu et la décision à obtenir.",
              "Je garde les sources et validations dans un seul endroit.",
              "Je livre une version exploitable, pas seulement une belle intention."
          ],
          "workflowEn": [
              "I clarify the expected deliverable and the decision needed.",
              "I keep sources and approvals in one place.",
              "I deliver something usable, not only a nice intention."
          ]
      },
      {
          "title": "Livraison",
          "titleEn": "Livraison",
          "description": "Organiser assets, variantes et règles d’usage.",
          "descriptionEn": "Organiser assets, variantes et règles d’usage.",
          "toolSlugs": [
              "eagle",
              "google-drive",
              "specify",
              "pitch"
          ],
          "workflow": [
              "Je clarifie le livrable attendu et la décision à obtenir.",
              "Je garde les sources et validations dans un seul endroit.",
              "Je livre une version exploitable, pas seulement une belle intention."
          ],
          "workflowEn": [
              "I clarify the expected deliverable and the decision needed.",
              "I keep sources and approvals in one place.",
              "I deliver something usable, not only a nice intention."
          ]
      }
  ],
  "directeur-artistique-creative-lead":   [
      {
          "title": "Veille et direction",
          "titleEn": "Veille et direction",
          "description": "Construire une vision avec références et narration.",
          "descriptionEn": "Construire une vision avec références et narration.",
          "toolSlugs": [
              "arena",
              "shotdeck",
              "milanote",
              "midjourney"
          ],
          "workflow": [
              "Je clarifie le livrable attendu et la décision à obtenir.",
              "Je garde les sources et validations dans un seul endroit.",
              "Je livre une version exploitable, pas seulement une belle intention."
          ],
          "workflowEn": [
              "I clarify the expected deliverable and the decision needed.",
              "I keep sources and approvals in one place.",
              "I deliver something usable, not only a nice intention."
          ]
      },
      {
          "title": "Présentation client",
          "titleEn": "Présentation client",
          "description": "Vendre l’intention et documenter les choix.",
          "descriptionEn": "Vendre l’intention et documenter les choix.",
          "toolSlugs": [
              "figma",
              "keynote",
              "pitch",
              "notion"
          ],
          "workflow": [
              "Je clarifie le livrable attendu et la décision à obtenir.",
              "Je garde les sources et validations dans un seul endroit.",
              "Je livre une version exploitable, pas seulement une belle intention."
          ],
          "workflowEn": [
              "I clarify the expected deliverable and the decision needed.",
              "I keep sources and approvals in one place.",
              "I deliver something usable, not only a nice intention."
          ]
      },
      {
          "title": "Feedback et production",
          "titleEn": "Feedback et production",
          "description": "Centraliser retours, assets et versions.",
          "descriptionEn": "Centraliser retours, assets et versions.",
          "toolSlugs": [
              "frame-io",
              "eagle",
              "google-drive",
              "runway"
          ],
          "workflow": [
              "Je clarifie le livrable attendu et la décision à obtenir.",
              "Je garde les sources et validations dans un seul endroit.",
              "Je livre une version exploitable, pas seulement une belle intention."
          ],
          "workflowEn": [
              "I clarify the expected deliverable and the decision needed.",
              "I keep sources and approvals in one place.",
              "I deliver something usable, not only a nice intention."
          ]
      }
  ],
  "webflow-nocode-creatif":   [
      {
          "title": "Cadrage site",
          "titleEn": "Cadrage site",
          "description": "Poser sitemap, wireframes et DA avant build.",
          "descriptionEn": "Poser sitemap, wireframes et DA avant build.",
          "toolSlugs": [
              "relume",
              "figma",
              "notion",
              "chatgpt"
          ],
          "workflow": [
              "Je clarifie le livrable attendu et la décision à obtenir.",
              "Je garde les sources et validations dans un seul endroit.",
              "Je livre une version exploitable, pas seulement une belle intention."
          ],
          "workflowEn": [
              "I clarify the expected deliverable and the decision needed.",
              "I keep sources and approvals in one place.",
              "I deliver something usable, not only a nice intention."
          ]
      },
      {
          "title": "Build Webflow",
          "titleEn": "Build Webflow",
          "description": "Construire CMS, pages, interactions et formulaires.",
          "descriptionEn": "Construire CMS, pages, interactions et formulaires.",
          "toolSlugs": [
              "webflow",
              "wized",
              "memberstack",
              "tally"
          ],
          "workflow": [
              "Je clarifie le livrable attendu et la décision à obtenir.",
              "Je garde les sources et validations dans un seul endroit.",
              "Je livre une version exploitable, pas seulement une belle intention."
          ],
          "workflowEn": [
              "I clarify the expected deliverable and the decision needed.",
              "I keep sources and approvals in one place.",
              "I deliver something usable, not only a nice intention."
          ]
      },
      {
          "title": "Mesure et automation",
          "titleEn": "Mesure et automation",
          "description": "Connecter paiements, bases, formulaires et analytics.",
          "descriptionEn": "Connecter paiements, bases, formulaires et analytics.",
          "toolSlugs": [
              "make",
              "stripe",
              "plausible",
              "google-search-console"
          ],
          "workflow": [
              "Je clarifie le livrable attendu et la décision à obtenir.",
              "Je garde les sources et validations dans un seul endroit.",
              "Je livre une version exploitable, pas seulement une belle intention."
          ],
          "workflowEn": [
              "I clarify the expected deliverable and the decision needed.",
              "I keep sources and approvals in one place.",
              "I deliver something usable, not only a nice intention."
          ]
      }
  ],
  "monteur-video-pro":   [
      {
          "title": "Montage et dérush",
          "titleEn": "Montage et dérush",
          "description": "Structurer rushs, montage et premières versions.",
          "descriptionEn": "Structurer rushs, montage et premières versions.",
          "toolSlugs": [
              "davinci-resolve",
              "adobe-premiere-pro",
              "descript",
              "capcut"
          ],
          "workflow": [
              "Je clarifie le livrable attendu et la décision à obtenir.",
              "Je garde les sources et validations dans un seul endroit.",
              "Je livre une version exploitable, pas seulement une belle intention."
          ],
          "workflowEn": [
              "I clarify the expected deliverable and the decision needed.",
              "I keep sources and approvals in one place.",
              "I deliver something usable, not only a nice intention."
          ]
      },
      {
          "title": "Validation",
          "titleEn": "Validation",
          "description": "Faire commenter au bon endroit et livrer les bons exports.",
          "descriptionEn": "Faire commenter au bon endroit et livrer les bons exports.",
          "toolSlugs": [
              "frame-io",
              "google-drive",
              "dropbox",
              "chatgpt"
          ],
          "workflow": [
              "Je clarifie le livrable attendu et la décision à obtenir.",
              "Je garde les sources et validations dans un seul endroit.",
              "Je livre une version exploitable, pas seulement une belle intention."
          ],
          "workflowEn": [
              "I clarify the expected deliverable and the decision needed.",
              "I keep sources and approvals in one place.",
              "I deliver something usable, not only a nice intention."
          ]
      },
      {
          "title": "Finition",
          "titleEn": "Finition",
          "description": "Améliorer son, sous-titres, couleur et plans faibles.",
          "descriptionEn": "Améliorer son, sous-titres, couleur et plans faibles.",
          "toolSlugs": [
              "adobe-audition",
              "topaz-video",
              "artlist",
              "epidemic-sound"
          ],
          "workflow": [
              "Je clarifie le livrable attendu et la décision à obtenir.",
              "Je garde les sources et validations dans un seul endroit.",
              "Je livre une version exploitable, pas seulement une belle intention."
          ],
          "workflowEn": [
              "I clarify the expected deliverable and the decision needed.",
              "I keep sources and approvals in one place.",
              "I deliver something usable, not only a nice intention."
          ]
      }
  ],
  "realisateur-videaste-marque":   [
      {
          "title": "Préproduction",
          "titleEn": "Préproduction",
          "description": "Préparer brief, moodboard, shotlist et planning.",
          "descriptionEn": "Préparer brief, moodboard, shotlist et planning.",
          "toolSlugs": [
              "notion",
              "milanote",
              "shotdeck",
              "chatgpt"
          ],
          "workflow": [
              "Je clarifie le livrable attendu et la décision à obtenir.",
              "Je garde les sources et validations dans un seul endroit.",
              "Je livre une version exploitable, pas seulement une belle intention."
          ],
          "workflowEn": [
              "I clarify the expected deliverable and the decision needed.",
              "I keep sources and approvals in one place.",
              "I deliver something usable, not only a nice intention."
          ]
      },
      {
          "title": "Postproduction",
          "titleEn": "Postproduction",
          "description": "Monter, étalonner, nettoyer et faire valider.",
          "descriptionEn": "Monter, étalonner, nettoyer et faire valider.",
          "toolSlugs": [
              "davinci-resolve",
              "frame-io",
              "descript",
              "runway"
          ],
          "workflow": [
              "Je clarifie le livrable attendu et la décision à obtenir.",
              "Je garde les sources et validations dans un seul endroit.",
              "Je livre une version exploitable, pas seulement une belle intention."
          ],
          "workflowEn": [
              "I clarify the expected deliverable and the decision needed.",
              "I keep sources and approvals in one place.",
              "I deliver something usable, not only a nice intention."
          ]
      },
      {
          "title": "Business",
          "titleEn": "Business",
          "description": "Signer, facturer, livrer et archiver.",
          "descriptionEn": "Signer, facturer, livrer et archiver.",
          "toolSlugs": [
              "yousign",
              "indy",
              "google-drive",
              "riverside"
          ],
          "workflow": [
              "Je clarifie le livrable attendu et la décision à obtenir.",
              "Je garde les sources et validations dans un seul endroit.",
              "Je livre une version exploitable, pas seulement une belle intention."
          ],
          "workflowEn": [
              "I clarify the expected deliverable and the decision needed.",
              "I keep sources and approvals in one place.",
              "I deliver something usable, not only a nice intention."
          ]
      }
  ],
  "consultant-b2b": [
    {
      title: "Acquisition et pipeline",
      titleEn: "Acquisition and pipeline",
      description: "Pour un consultant solo, le CRM sert surtout à ne pas oublier qui relancer et pourquoi. Si tu passes plus de temps à configurer le CRM qu'à parler aux prospects, il est trop gros.",
      descriptionEn: "For a solo consultant, CRM mostly helps you remember who to follow up with and why. If you spend more time configuring the CRM than talking to prospects, it is too big.",
      toolSlugs: ["pipedrive", "calendly"],
      workflow: ["Je note seulement les prospects avec une vraie prochaine action.", "Je garde les étapes simples : contacté, échange prévu, proposition, gagné ou perdu.", "J'utilise Calendly quand il évite des allers-retours réels.", "Je planifie la relance dès la fin de l'échange."],
      workflowEn: ["I only record prospects with a real next action.", "I keep stages simple: contacted, call booked, proposal, won or lost.", "I use Calendly when it avoids real back-and-forth.", "I schedule the follow-up right after the conversation."],
    },
    {
      title: "Delivery de mission",
      titleEn: "Mission delivery",
      description: "Le delivery d'un consultant tient souvent à une chose : le client doit retrouver le raisonnement, pas seulement le livrable final.",
      descriptionEn: "Consulting delivery often comes down to one thing: the client must find the reasoning, not only the final deliverable.",
      toolSlugs: ["notion", "google-drive"],
      workflow: ["Je crée une page mission avec objectif, contexte et livrables attendus.", "Je note les décisions importantes après chaque call.", "Je garde les fichiers lourds dans Drive, mais je les contextualise dans Notion.", "Je termine avec une synthèse que le client peut relire trois mois plus tard."],
      workflowEn: ["I create a mission page with goal, context, and expected deliverables.", "I record important decisions after each call.", "I keep heavy files in Drive, but contextualize them in Notion.", "I end with a summary the client can reread three months later."],
    },
    {
      title: "Facturation et encaissement",
      titleEn: "Billing and payment",
      description: "La facturation doit être plus simple que la vente. Si encaisser devient un sujet, ton stack crée de la friction au pire moment.",
      descriptionEn: "Billing should be simpler than selling. If getting paid becomes a topic, your stack creates friction at the worst moment.",
      toolSlugs: ["stripe", "pipedrive"],
      workflow: ["Je marque l'affaire comme gagnée quand le client dit oui, pas quand j'ai envie d'y croire.", "Je crée un lien ou une facture claire.", "Je rattache le paiement au deal pour ne pas perdre le fil.", "Je relance calmement depuis le pipeline si ça traîne."],
      workflowEn: ["I mark the deal won when the client says yes, not when I hope it will happen.", "I create a clear link or invoice.", "I attach payment to the deal so I do not lose track.", "I follow up calmly from the pipeline if it drags."],
    },
  ],
  "content-operator": [
    {
      title: "Production éditoriale",
      titleEn: "Editorial production",
      description: "La production de contenu devient vite chère quand chaque étape a son outil. Ici, l'objectif est de garder une chaîne courte : idée, angle, brouillon, publication.",
      descriptionEn: "Content production quickly gets expensive when every step has its own tool. Here, the goal is to keep a short chain: idea, angle, draft, publish.",
      toolSlugs: ["notion", "chatgpt"],
      workflow: ["Je garde les idées dans Notion avec la promesse, pas juste un titre vague.", "Je demande à ChatGPT un angle ou un plan, pas un texte final à publier tel quel.", "Je rédige ou réécris avec ma voix.", "Je note ce qui performe pour nourrir les prochains sujets."],
      workflowEn: ["I keep ideas in Notion with the promise, not just a vague title.", "I ask ChatGPT for an angle or outline, not a final publish-ready text.", "I write or rewrite in my own voice.", "I note what performs to feed the next topics."],
    },
    {
      title: "Création de visuels",
      titleEn: "Visual creation",
      description: "Canva est très rentable quand il sert à répéter un bon système. Il devient un piège quand tu passes ton temps à chercher le template parfait.",
      descriptionEn: "Canva is very profitable when it repeats a good system. It becomes a trap when you spend time hunting for the perfect template.",
      toolSlugs: ["canva", "notion"],
      workflow: ["Je choisis trois formats récurrents maximum.", "Je prépare le texte avant d'ouvrir Canva.", "Je décline le contenu sans changer la direction à chaque fois.", "Je range les assets pour pouvoir les réutiliser."],
      workflowEn: ["I choose three recurring formats max.", "I prepare copy before opening Canva.", "I repurpose content without changing direction every time.", "I store assets so I can reuse them."],
    },
    {
      title: "Capture de demandes",
      titleEn: "Request capture",
      description: "Un formulaire simple peut remplacer beaucoup de conversations mal cadrées. L'intérêt n'est pas le formulaire : c'est la qualité des réponses qu'il force.",
      descriptionEn: "A simple form can replace many poorly framed conversations. The value is not the form: it is the quality of answers it forces.",
      toolSlugs: ["tally", "notion"],
      workflow: ["Je pose seulement les questions qui changent ma réponse commerciale.", "Je relie les demandes à Notion pour garder le contexte.", "Je trie vite : à traiter, à refuser, à clarifier.", "Je réponds avec un message adapté, pas avec une usine automatisée."],
      workflowEn: ["I ask only questions that change my commercial answer.", "I connect requests to Notion to keep context.", "I sort quickly: handle, decline, clarify.", "I answer with a tailored message, not a heavy automation machine."],
    },
  ],
  "ops-fractional": [
    {
      title: "Pilotage opérationnel",
      titleEn: "Operating cadence",
      description: "Un outil ops devient utile quand il clarifie qui fait quoi, pas quand il ajoute une couche de management à un problème flou.",
      descriptionEn: "An ops tool becomes useful when it clarifies who does what, not when it adds a management layer to a vague problem.",
      toolSlugs: ["clickup", "notion"],
      workflow: ["Je liste les chantiers qui ont vraiment besoin d'un owner.", "Je crée peu de statuts, mais des statuts compris par tout le monde.", "Je garde ClickUp pour l'exécution, pas pour la documentation longue.", "Je mets les SOP et décisions durables dans Notion."],
      workflowEn: ["I list workstreams that truly need an owner.", "I create few statuses, but statuses everyone understands.", "I keep ClickUp for execution, not long documentation.", "I put durable SOPs and decisions in Notion."],
    },
    {
      title: "Automatisation de back-office",
      titleEn: "Back-office automation",
      description: "Automatiser sans documentation, c'est juste déplacer le problème dans une boîte noire. Pour un freelance ops, la maintenance fait partie du livrable.",
      descriptionEn: "Automating without documentation just moves the problem into a black box. For an ops freelancer, maintenance is part of the deliverable.",
      toolSlugs: ["make", "notion"],
      workflow: ["Je dessine le flux avant d'ouvrir Make.", "Je commence par un scénario que je peux expliquer en deux minutes.", "Je teste avec un vrai cas client, pas avec une donnée parfaite.", "Je documente quoi faire quand le scénario casse."],
      workflowEn: ["I sketch the flow before opening Make.", "I start with a scenario I can explain in two minutes.", "I test with a real client case, not perfect data.", "I document what to do when the scenario breaks."],
    },
    {
      title: "Gestion administrative",
      titleEn: "Administrative management",
      description: "L'administratif doit rester un garde-fou, pas ton deuxième métier. L'idée est de savoir où tu en es sans construire un ERP miniature.",
      descriptionEn: "Admin should remain a guardrail, not your second job. The idea is to know where you stand without building a miniature ERP.",
      toolSlugs: ["indy", "stripe"],
      workflow: ["Je suis les encaissements sans refaire une compta parallèle.", "Je catégorise les dépenses pendant qu'elles sont encore fraîches.", "Je garde un œil sur la marge réelle par mission.", "Je prépare les déclarations avant que ça devienne urgent."],
      workflowEn: ["I track payments without rebuilding parallel accounting.", "I categorize expenses while they are still fresh.", "I keep an eye on real margin by mission.", "I prepare declarations before they become urgent."],
    },
  ],
  "solo-zero-bloat": [
    {
      title: "Vendre une offre simple",
      titleEn: "Sell a simple offer",
      description: "Au début, tu n'as pas besoin d'un tunnel complet. Tu as besoin d'une offre claire, d'un moyen de qualifier, et d'un moyen d'encaisser.",
      descriptionEn: "At the beginning, you do not need a full funnel. You need a clear offer, a way to qualify, and a way to get paid.",
      toolSlugs: ["notion", "tally", "stripe"],
      workflow: ["Je décris l'offre dans une page simple, sans site complet si ce n'est pas nécessaire.", "Je qualifie la demande avec Tally pour éviter les appels inutiles.", "J'envoie un paiement clair quand la valeur est comprise.", "Je livre proprement dans un dossier partagé."],
      workflowEn: ["I describe the offer in a simple page, without a full site if not needed.", "I qualify the request with Tally to avoid useless calls.", "I send a clear payment link when value is understood.", "I deliver cleanly in a shared folder."],
    },
    {
      title: "Gérer les fichiers client",
      titleEn: "Manage client files",
      description: "Le bon outil de fichiers est souvent celui que le client ouvre sans réfléchir. Drive n'est pas glamour, mais il évite beaucoup de friction.",
      descriptionEn: "The right file tool is often the one the client opens without thinking. Drive is not glamorous, but it avoids a lot of friction.",
      toolSlugs: ["google-drive", "notion"],
      workflow: ["Je crée un dossier par client, pas par humeur du jour.", "Je nomme les livrables pour qu'ils soient compréhensibles six mois plus tard.", "Je garde le contexte dans Notion et les fichiers dans Drive.", "Je nettoie ou archive quand la mission se termine."],
      workflowEn: ["I create one folder per client, not per mood of the day.", "I name deliverables so they still make sense six months later.", "I keep context in Notion and files in Drive.", "I clean or archive when the mission ends."],
    },
    {
      title: "Suivre sans CRM",
      titleEn: "Track without a CRM",
      description: "Un CRM trop tôt donne l'impression d'être structuré, mais il ajoute souvent plus de saisie que de ventes. Une table claire suffit tant que le volume est faible.",
      descriptionEn: "A CRM too early gives the feeling of structure, but often adds more data entry than sales. A clear table is enough while volume is low.",
      toolSlugs: ["notion", "tally"],
      workflow: ["Je note le prospect, la source et la prochaine action.", "Je garde une vue simple des relances de la semaine.", "Je supprime les opportunités mortes au lieu de les laisser gonfler la base.", "Je passe à un CRM seulement quand je perds vraiment le fil."],
      workflowEn: ["I note the prospect, source, and next action.", "I keep a simple view of this week's follow-ups.", "I remove dead opportunities instead of letting them inflate the base.", "I move to a CRM only when I truly lose track."],
    },
  ],
  "automation-light": [
    {
      title: "Collecte de leads",
      titleEn: "Lead collection",
      description: "Une bonne automatisation commence souvent par un bon formulaire. Si l'entrée est propre, le reste devient beaucoup plus simple.",
      descriptionEn: "A good automation often starts with a good form. If the input is clean, everything else becomes much simpler.",
      toolSlugs: ["tally", "make", "notion"],
      workflow: ["Je structure le formulaire autour des décisions à prendre.", "Je déclenche Make seulement après une soumission complète.", "J'envoie une notification utile, pas un bruit de plus.", "Je crée une ligne de suivi lisible dans Notion."],
      workflowEn: ["I structure the form around decisions to make.", "I trigger Make only after a complete submission.", "I send a useful notification, not more noise.", "I create a readable tracking row in Notion."],
    },
    {
      title: "Base de données légère",
      titleEn: "Light database",
      description: "Airtable se justifie quand tu manipules de vraies données, pas quand tu veux juste une jolie table. Sinon, Notion reste souvent suffisant.",
      descriptionEn: "Airtable is justified when you manipulate real data, not when you just want a prettier table. Otherwise, Notion is often enough.",
      toolSlugs: ["airtable", "make"],
      workflow: ["Je définis les champs qui servent vraiment au pilotage.", "Je crée des vues pour des décisions, pas pour décorer.", "Je connecte seulement les entrées stables.", "Je nettoie chaque mois pour éviter la base poubelle."],
      workflowEn: ["I define fields that truly support decisions.", "I create views for decisions, not decoration.", "I connect only stable inputs.", "I clean monthly to avoid a junk database."],
    },
    {
      title: "Reporting mensuel",
      titleEn: "Monthly reporting",
      description: "Le reporting ne mérite d'être automatisé que quand tu sais déjà ce que tu veux raconter. Sinon tu automatises juste de la confusion.",
      descriptionEn: "Reporting deserves automation only when you already know what you want to say. Otherwise you just automate confusion.",
      toolSlugs: ["make", "notion"],
      workflow: ["Je stabilise le format à la main sur deux ou trois cycles.", "Je récupère seulement les données vraiment lues.", "Je génère une synthèse courte.", "Je relis avant envoi, parce que l'automatisation n'assume pas la responsabilité."],
      workflowEn: ["I stabilize the format manually over two or three cycles.", "I collect only data people actually read.", "I generate a short summary.", "I review before sending, because automation does not carry responsibility."],
    },
  ],
  "client-delivery": [
    {
      title: "Réduire les réunions",
      titleEn: "Reduce meetings",
      description: "Une vidéo asynchrone doit faire gagner une réunion, pas créer un contenu de plus à regarder. Elle doit amener une réponse claire.",
      descriptionEn: "An async video should save a meeting, not create one more piece of content to watch. It must lead to a clear answer.",
      toolSlugs: ["loom", "notion"],
      workflow: ["Je prépare trois points maximum.", "J'enregistre une vidéo courte, centrée sur la décision.", "Je demande une réponse structurée au client.", "J'archive la décision dans la page projet."],
      workflowEn: ["I prepare three points max.", "I record a short video centered on the decision.", "I ask the client for a structured answer.", "I archive the decision in the project page."],
    },
    {
      title: "Centraliser les livrables",
      titleEn: "Centralize deliverables",
      description: "Drive et Notion sont utiles ensemble si chacun garde son rôle. Sinon tu crées deux endroits où chercher la même information.",
      descriptionEn: "Drive and Notion are useful together if each keeps its role. Otherwise you create two places to search for the same information.",
      toolSlugs: ["google-drive", "notion"],
      workflow: ["Je mets les fichiers dans Drive.", "Je décris le contexte, les versions et les décisions dans Notion.", "Je lien les livrables finaux au bon endroit.", "Je ferme la mission avec une synthèse propre."],
      workflowEn: ["I put files in Drive.", "I describe context, versions, and decisions in Notion.", "I link final deliverables in the right place.", "I close the mission with a clean summary."],
    },
    {
      title: "Planifier sans friction",
      titleEn: "Schedule without friction",
      description: "La planification est un détail qui peut manger beaucoup d'énergie. Mais un outil de rendez-vous doit rester invisible, pas devenir un portail client.",
      descriptionEn: "Scheduling is a detail that can eat a lot of energy. But a scheduling tool should stay invisible, not become a client portal.",
      toolSlugs: ["calendly", "notion"],
      workflow: ["Je limite les types d'appel pour ne pas créer un menu inutile.", "Je propose le lien quand il évite vraiment des allers-retours.", "Je rattache le rendez-vous au contexte projet.", "Je supprime les créneaux ou workflows qui ne servent plus."],
      workflowEn: ["I limit meeting types to avoid creating a useless menu.", "I share the link when it truly avoids back-and-forth.", "I attach the meeting to project context.", "I remove slots or workflows that no longer help."],
    },
  ],
};
