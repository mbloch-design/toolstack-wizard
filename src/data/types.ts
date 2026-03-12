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

export type UserType = "solo" | "team-2-5" | "team-5-10" | "startup-10+";
export type JobRole = "writer" | "consultant" | "tech" | "designer" | "content-creator" | "other";
export type MainGoal = "reduce-costs" | "save-time" | "simplify" | "find-better";
export type AIUsageLevel = "intensive" | "occasional" | "none" | "want_to_start";

export interface SelectedTool {
  toolId: string;
  monthlyCost: number;
  usage: "low" | "medium" | "high";
}

export interface SelectorFormData {
  userType: UserType | null;
  jobRole: JobRole | null;
  mainGoal: MainGoal | null;
  currentTools: SelectedTool[];
  aiUsageLevel: AIUsageLevel | null;
  email: string;
  firstName: string;
  marketingOptIn: boolean;
}

export interface ToolRecommendation {
  tool: Tool;
  score: number;
  reason: string;
  action: "keep" | "cancel" | "switch" | "add";
  switchTo?: Tool;
  savingsMonthly?: number;
}

export interface SelectorResults {
  recommended: ToolRecommendation[];
  toCancel: ToolRecommendation[];
  toKeep: ToolRecommendation[];
  toAdd: ToolRecommendation[];
  totalSavingsMonthly: number;
}

export type Lang = "fr" | "en";
