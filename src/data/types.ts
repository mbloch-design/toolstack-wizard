export interface Category {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
}

export interface ToolVerdict {
  keepIf: string;
  avoidIf: string;
  threshold: string;
}

export interface Tool {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  shortDescription: string;
  shortDescriptionEn?: string;
  description: string;
  pricing: "free" | "paid" | "freemium";
  defaultMonthlyPrice: number;
  verdict: ToolVerdict;
  pros: string[];
  cons: string[];
  relevantFor: string[];
  websiteUrl: string;
  affiliateLink: string;
  logo: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  titleEn?: string;
  excerpt: string;
  excerptEn?: string;
  date: string;
  category: string;
  tags: string[];
  toolId?: string;
  readingTime: number;
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
