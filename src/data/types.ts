export interface Category {
  id: string;
  slug: string;
  name: string;
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  tools?: string[];
}

export interface ToolVerdict {
  keepIf: string[];
  avoidIf: string[];
  threshold: string;
}

export interface ToolPricing {
  free: string;
  paid: string;
}

export interface ToolArticle {
  slug: string;
  title: string;
  excerpt: string;
}

export interface ToolSeo {
  metaDescription: string;
}

export interface BetterAlternative {
  tool: string;
  reason: string;
  saving: number;
  performanceGain: string | null;
}

export interface MigrationGuide {
  steps: string[];
  timeEstimate: string;
  dataLoss: string;
}

export interface DowngradePlan {
  available: boolean;
  freeTier: string | null;
}

export type ToolType = "metier" | "plugin" | "ia" | "gestion" | "satellite";
export type PrescriptionQuality = "ferme" | "question" | "silence";

export interface PrescriptionOutput {
  action: string;
  replacement_tool: string;
  mode: string;
  confidence: string;
  gain_monthly_eur: number;
  gain_annual_eur: number;
  price_tool_eur: number;
  price_alt_eur: number;
  verified_on: string;
}

export interface Tool {
  id: string;
  slug?: string;
  name: string;
  categoryId: string;
  shortDescription: string;
  shortDescriptionEn?: string;
  longDescription?: string;
  description?: string;
  pricing: ToolPricing;
  defaultMonthlyPrice: number;
  verdict: ToolVerdict;
  pros: string[];
  cons: string[];
  useCases?: string[];
  covers?: string[];
  relevantFor: string[];
  personas?: string[];
  websiteUrl?: string;
  affiliateLink: string;
  logo?: string;
  soloRelevance?: string;
  teamRelevance?: string;
  alternatives?: string[];
  seo?: ToolSeo;
  articles?: ToolArticle[];
  timeGainedHoursPerMonth?: number;
  freeAlternative?: string | null;
  // v4 fields
  tool_type: ToolType;
  substitutable: boolean;
  host_app?: string | null;
  bundle_parent?: string | null;
  verticals: string[];
  functional_needs: string[];
  ia_use_case?: string[] | null;
  betterAlternative?: BetterAlternative | null;
  migrationGuide?: MigrationGuide | null;
  downgradePlan?: DowngradePlan | null;
  // v10 prescription fields
  prescription_quality: PrescriptionQuality;
  prescription_output?: PrescriptionOutput | null;
  prescription_block_reasons?: string[];
  prescription_context_questions?: string[];
  substitution_cluster_v2?: string | null;
}

export interface BlogPost {
  slug: string;
  title: string;
  titleEn?: string;
  excerpt: string;
  excerptEn?: string;
  date: string;
  category: string;
  tags?: string[];
  toolId?: string;
  readingTime?: number;
  readTime?: string;
}

// ─── Vertical System ───
export type VerticalFamily = "creatif" | "tech" | "conseil" | "content" | "business";

export interface Vertical {
  id: string;
  family: VerticalFamily;
  label: string;
  functional_needs: string[];
}

export const VERTICAL_FAMILIES: { value: VerticalFamily; emoji: string; label: string; labelEn: string }[] = [
  { value: "creatif", emoji: "🎨", label: "Créatif", labelEn: "Creative" },
  { value: "tech", emoji: "💻", label: "Tech", labelEn: "Tech" },
  { value: "conseil", emoji: "💼", label: "Conseil", labelEn: "Consulting" },
  { value: "content", emoji: "📝", label: "Content", labelEn: "Content" },
  { value: "business", emoji: "📊", label: "Business", labelEn: "Business" },
];

export const FAMILY_ACTIVITIES: Record<VerticalFamily, { label: string; labelEn: string; verticals: string[] }[]> = {
  creatif: [
    { label: "Je crée des visuels et identités", labelEn: "I create visuals and identities", verticals: ["graphiste-da"] },
    { label: "Je monte et anime des vidéos", labelEn: "I edit and animate videos", verticals: ["motion-video"] },
    { label: "Je retouche des photos", labelEn: "I retouch photos", verticals: ["photographe"] },
    { label: "Je conçois des interfaces", labelEn: "I design interfaces", verticals: ["ux-ui"] },
    { label: "Je fais de l'illustration", labelEn: "I illustrate", verticals: ["illustrateur"] },
    { label: "Je conçois des espaces / scènes", labelEn: "I design spaces / scenes", verticals: ["architecte-bim", "scenographe"] },
  ],
  tech: [
    { label: "Je développe des produits", labelEn: "I develop products", verticals: ["developpeur-solo"] },
    { label: "Je gère une équipe technique", labelEn: "I manage a tech team", verticals: ["cto-lead-tech"] },
    { label: "Je travaille sur la data", labelEn: "I work on data", verticals: ["data-analyst"] },
    { label: "Je gère un produit digital", labelEn: "I manage a digital product", verticals: ["product-manager"] },
    { label: "Je construis avec l'IA", labelEn: "I build with AI", verticals: ["ai-builder"] },
  ],
  conseil: [
    { label: "Je conseille des clients B2B", labelEn: "I advise B2B clients", verticals: ["consultant-b2b"] },
    { label: "Je forme ou coach des clients", labelEn: "I train or coach clients", verticals: ["coach-formateur"] },
    { label: "Je recrute ou gère les RH", labelEn: "I recruit or manage HR", verticals: ["rh-recruteur"] },
  ],
  content: [
    { label: "Je crée du contenu vidéo / photo", labelEn: "I create video/photo content", verticals: ["createur-contenu"] },
    { label: "J'écris des newsletters", labelEn: "I write newsletters", verticals: ["newslettiste-auteur"] },
    { label: "Je fais un podcast", labelEn: "I produce a podcast", verticals: ["podcasteur"] },
    { label: "Je gère des réseaux sociaux", labelEn: "I manage social media", verticals: ["community-manager"] },
  ],
  business: [
    { label: "Je développe un SaaS", labelEn: "I develop a SaaS", verticals: ["fondateur-saas"] },
    { label: "Je vends en ligne", labelEn: "I sell online", verticals: ["ecommercant"] },
    { label: "Je manage une équipe", labelEn: "I manage a team", verticals: ["manager-dsi"] },
    { label: "Je gère les finances", labelEn: "I manage finances", verticals: ["daf-finance"] },
  ],
};

export type TimeWeight = "principal" | "secondaire" | "occasionnel";
export const TIME_WEIGHTS: Record<TimeWeight, number> = {
  principal: 1.0,
  secondaire: 0.5,
  occasionnel: 0.2,
};

export const TIME_WEIGHT_OPTIONS: { value: TimeWeight; label: string; labelEn: string; desc: string; descEn: string }[] = [
  { value: "principal", label: "Principal", labelEn: "Primary", desc: "50%+ de mon temps", descEn: "50%+ of my time" },
  { value: "secondaire", label: "Secondaire", labelEn: "Secondary", desc: "20-50%", descEn: "20-50%" },
  { value: "occasionnel", label: "Occasionnel", labelEn: "Occasional", desc: "Moins de 20%", descEn: "Less than 20%" },
];

// ─── Legacy Personas (kept for compat) ───
export type Persona = "sofia" | "marc" | "theo" | "alix" | "claire";

export const PERSONAS: { value: Persona; emoji: string; name: string; desc: string; descEn: string }[] = [
  { value: "sofia", emoji: "💼", name: "Sofia", desc: "Freelance — je facture des clients en direct", descEn: "Freelancer — I invoice clients directly" },
  { value: "marc", emoji: "🏢", name: "Marc", desc: "DSI / Manager — je gère une équipe et des licences", descEn: "CTO / Manager — I manage a team and licenses" },
  { value: "theo", emoji: "🚀", name: "Théo", desc: "Fondateur startup — je surveille mon Burn SaaS", descEn: "Startup founder — I track my SaaS Burn" },
  { value: "alix", emoji: "🤖", name: "Alix", desc: "Solopreneur IA — j'utilise des agents et outils IA intensivement", descEn: "AI Solopreneur — I use AI agents and tools intensively" },
  { value: "claire", emoji: "📊", name: "Claire", desc: "DAF / Finance — je consolide les dépenses logicielles", descEn: "CFO / Finance — I consolidate software spending" },
];

// ─── TJM ───
export type TjmRange = "lt200" | "200-400" | "400-600" | "gt600" | "none";
export const TJM_OPTIONS: { value: TjmRange; label: string; labelEn: string; median: number }[] = [
  { value: "lt200", label: "Moins de 200€", labelEn: "Less than €200", median: 150 },
  { value: "200-400", label: "200–400€", labelEn: "€200–400", median: 300 },
  { value: "400-600", label: "400–600€", labelEn: "€400–600", median: 500 },
  { value: "gt600", label: "Plus de 600€", labelEn: "More than €600", median: 700 },
  { value: "none", label: "Je ne facture pas à la journée", labelEn: "I don't bill by the day", median: 0 },
];

// ─── Project Phase ───
export type ProjectPhase = "lancement" | "croissance" | "regime";
export const PHASE_OPTIONS: { value: ProjectPhase; emoji: string; label: string; labelEn: string; desc: string; descEn: string }[] = [
  { value: "lancement", emoji: "🌱", label: "En lancement", labelEn: "Launching", desc: "Je construis, j'explore", descEn: "I'm building, exploring" },
  { value: "croissance", emoji: "📈", label: "En croissance", labelEn: "Growing", desc: "J'optimise, j'automatise", descEn: "I'm optimizing, automating" },
  { value: "regime", emoji: "⚡", label: "En régime", labelEn: "Steady state", desc: "Je maintiens, je consolide", descEn: "I'm maintaining, consolidating" },
];

// ─── Tech Maturity ───
export type TechMaturity = "zero-config" | "intermediaire" | "expert";
export const MATURITY_OPTIONS: { value: TechMaturity; emoji: string; label: string; labelEn: string; desc: string; descEn: string }[] = [
  { value: "zero-config", emoji: "🔌", label: "Zéro config", labelEn: "Zero config", desc: "Je veux que ça marche sans réglages", descEn: "I want it to work out of the box" },
  { value: "intermediaire", emoji: "🔧", label: "Intermédiaire", labelEn: "Intermediate", desc: "J'accepte une courbe d'apprentissage courte", descEn: "I accept a short learning curve" },
  { value: "expert", emoji: "⚙️", label: "Expert", labelEn: "Expert", desc: "Je configure et j'automatise tout", descEn: "I configure and automate everything" },
];

export type MainGoal = "reduce-costs" | "reduce_costs" | "save-time" | "save_time" | "simplify" | "simplify_stack" | "find-better" | "find_better_tools";
export type AIUsageLevel = "intensive" | "occasional" | "none" | "want_to_start";

export interface VerticalWeight {
  id: string;
  weight: number;
  timeWeight: TimeWeight;
}

export interface SelectedTool {
  toolId: string;
  monthlyCost: number;
  usage: "low" | "medium" | "high";
}

export interface SelectorFormData {
  // v4 composite profile
  family: VerticalFamily | null;
  verticals: VerticalWeight[];
  // legacy (kept for backward compat)
  persona: Persona | null;
  mainGoal: MainGoal | null;
  currentTools: SelectedTool[];
  aiUsageLevel: AIUsageLevel | null;
  tjm: TjmRange | null;
  projectPhase: ProjectPhase | null;
  techMaturity: TechMaturity | null;
  email: string;
  firstName: string;
  marketingOptIn: boolean;
}

// ─── Prescription System ───
export type PrescriptionType = "cancel" | "replace-cheaper" | "replace-better" | "downgrade";

export interface Fiche {
  type: PrescriptionType;
  tool: Tool;
  diagnostic: string;
  prescription: string;
  alternative?: Tool | null;
  gain: number;
  migrationGuide?: MigrationGuide | null;
  badge?: "Doublon" | "Dormant" | "Inadapté" | "Doublon IA";
}

export interface ScoredTool {
  tool: Tool;
  pertinenceScore: number;
  valueIndex: number;
  finalScore: number;
  valueCreated: number;
  action: "recommend" | "cancel" | "neutral";
  cancelReason?: string;
  cancelType?: "doublon" | "doublon-ia" | "dormant" | "inadequate";
  replacedBy?: string;
  freeAlt?: Tool | null;
  fiche?: Fiche | null;
}

export interface SelectorResults {
  scoredTools: ScoredTool[];
  recommended: ScoredTool[];
  toCancel: ScoredTool[];
  fiches: Fiche[];
  stackHealthScore: number;
  totalSavingsMonthly: number;
  totalSavingsAnnual: number;
  personaMessage: string;
  hasCurrentTools: boolean;
  isTjmZero?: boolean;
  isStackFree?: boolean;
  hasAiDoublon?: boolean;
  fewRecommendations?: boolean;
}

// Legacy types kept for compat
export interface ToolRecommendation {
  tool: Tool;
  score: number;
  reason: string;
  action: "keep" | "cancel" | "switch" | "add";
  switchTo?: Tool;
  savingsMonthly?: number;
}

export type Lang = "fr" | "en";
export type UserType = "solo" | "team-2-5" | "team-5-10" | "startup-10+";
export type JobRole = "writer" | "consultant" | "tech" | "designer" | "content-creator" | "other";
