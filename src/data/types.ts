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

// ─── Personas ───
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

export type UserType = "solo" | "team-2-5" | "team-5-10" | "startup-10+";
export type JobRole = "writer" | "consultant" | "tech" | "designer" | "content-creator" | "other";
export type MainGoal = "reduce-costs" | "reduce_costs" | "save-time" | "save_time" | "simplify" | "simplify_stack" | "find-better" | "find_better_tools";
export type AIUsageLevel = "intensive" | "occasional" | "none" | "want_to_start";

export interface SelectedTool {
  toolId: string;
  monthlyCost: number;
  usage: "low" | "medium" | "high";
}

export interface SelectorFormData {
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

export interface ScoredTool {
  tool: Tool;
  pertinenceScore: number;
  valueIndex: number;
  finalScore: number;
  valueCreated: number;
  action: "recommend" | "cancel" | "neutral";
  cancelReason?: string;
  cancelType?: "doublon" | "inadequate";
  replacedBy?: string;
  freeAlt?: Tool | null;
}

export interface SelectorResults {
  scoredTools: ScoredTool[];
  recommended: ScoredTool[];
  toCancel: ScoredTool[];
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
