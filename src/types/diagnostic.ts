export type Persona = "THEO" | "SOFIA" | "MARC" | "ALIX" | "CLAIRE";

export interface SessionState {
  firstName: string;
  tjm: number;
  language: "fr" | "en";
  persona: Persona;
  personaConfidence?: "clear" | "hybrid" | "unsure";
  stackGoal?: "reduce_costs" | "save_time" | "simplify" | "quality";
  complementarySkills: Persona[];
  primarySpecialty?: string;
  complementarySpecialties?: string[];
  email?: string;
  emailPreferences?: {
    summary: boolean;
    actions: boolean;
    checkIn: boolean;
  };
  apiSpendTranche?: "low" | "mid" | "high" | "premium" | "unknown";
  selectedTools: Tool[];
  selectionCoverage?: {
    covered: string[];
    skipped: string[];
    confidence: "low" | "medium" | "high";
  };
  discoveryAnswers: Map<string, number>;
  closingAnswers: [string, string, string];
}

export interface Tool {
  id: string;
  slug?: string;
  name: string;
  name_en?: string;
  logo?: string;
  websiteUrl?: string;
  affiliateLink?: string;
  price: number;
  category: string;
  functional_needs: string[];
  pertinence_by_persona?: Record<Persona, number>;
  tool_type: "core" | "satellite" | "gestion" | "ia";
  ia_use_case?: string;
  usage: "high" | "medium" | "low" | "dormant";
  prescription_quality: "ferme" | "question" | "oui";
  pricing?: {
    free?: string;
    paid?: string;
  } | null;
  pricingEn?: {
    free?: string;
    paid?: string;
  } | null;
  freeAlternative?: string;
  downgrade_plan?: {
    available: boolean;
    fromPrice: number;
    toPrice: number;
    plan: string;
    freeTier?: string | null;
  };
  better_alternative?: string;
  pricing_v5?: {
    compare_price_monthly_eur?: number;
    compare_plan_name?: string;
    compare_plan_kind?: string;
    price_reliability?: string;
    usage_sensitive?: boolean;
    location_sensitive?: boolean;
    cautions?: string[];
    source_domain?: string;
    verified_on?: string;
    official_source_url?: string;
    verification_status?: string;
  } | null;
  force_silence: boolean;
  bundle_parent?: string;
  /** Runtime flag: true when this tool is included via a selected bundle parent */
  includedInBundle?: boolean;
  /** Runtime: name of the bundle parent that includes this tool */
  includedVia?: string;
}

export interface Cluster {
  persona: Persona;
  order: number;
  question: string;
  question_en?: string;
  why: string;
  cols: number;
  tool_ids: string[];
}

export interface DoubleRule {
  ids: string[];
  message: string;
  savings: number;
  category: string;
}

export interface DiscoveryQuestion {
  id: string;
  persona: Persona | "ALL";
  question: string;
  subtitle: string;
  options: { label: string; impact: "keep" | "review" | "cancel"; affectedTools?: string[] }[];
  condition_tool_ids: string[];
  condition_type: "any" | "all";
}

export interface DiagnosticResult {
  sessionId: string;
  userId?: string;
  sessionState: SessionState;
  toolScores: Map<string, { pertinence: number; valueIndex: number; scoreFinal: number }>;
  doublons: DoubleRule[];
  prescriptions: { phase1: Prescription[]; phase2: Prescription[]; phase3: Prescription[] };
  recommendations: Tool[];
  insights: DiagnosticInsights;
  healthScore: number;
  healthLabel: "Optimisée" | "Correcte" | "À revoir" | "Critique";
  stackTotalCost: number;
  estimatedWaste: number;
  optimizedCost: number;
  hoursRecoverable: number;
  annualSavings: number;
}

export interface Prescription {
  toolId: string;
  type: "doublon" | "doublon-ia" | "dormant" | "inadapté" | "pricing-tier";
  verdict: "cancel" | "review" | "downgrade";
  message: string;
  savingsEstimate: number;
  pricingContext?: {
    currentPlan?: string;
    targetPlan?: string;
    hasFreeTier?: boolean;
    reliability?: string;
    sourceDomain?: string;
    reason: "free_tier" | "downgrade_plan" | "usage_sensitive_price" | "free_alternative";
  };
}

export type DiagnosticSeverity = "low" | "medium" | "high";
export type StackProfileId =
  | "healthy"
  | "bloated"
  | "overlap_heavy"
  | "under_instrumented"
  | "high_leverage";
export type StackMaturityId = "emerging" | "structured" | "overbuilt" | "optimized";

export interface DiagnosticRiskFlag {
  id: string;
  severity: DiagnosticSeverity;
  labelFr: string;
  labelEn: string;
  detailFr: string;
  detailEn: string;
  actionFr: string;
  actionEn: string;
  impactMonthly?: number;
}

export interface FunctionalCoverageItem {
  key: string;
  label: string;
  toolCount: number;
  monthlyCost: number;
  toolNames: string[];
  status: "missing" | "covered" | "overcovered";
}

export interface DiagnosticFocusArea {
  id: string;
  priority: DiagnosticSeverity;
  labelFr: string;
  labelEn: string;
  actionFr: string;
  actionEn: string;
}

export interface DiagnosticAnswerSignal {
  id: string;
  source: "onboarding" | "discovery" | "closing";
  severity: DiagnosticSeverity;
  labelFr: string;
  labelEn: string;
  detailFr: string;
  detailEn: string;
  actionFr: string;
  actionEn: string;
  toolIds?: string[];
  impact?: "keep" | "review" | "cancel";
}

export interface DiagnosticConfidence {
  score: number;
  labelFr: string;
  labelEn: string;
  summaryFr: string;
  summaryEn: string;
}

export type DiagnosticCalibrationDimension =
  | "confidence"
  | "score"
  | "savings"
  | "coverage"
  | "actions"
  | "data";

export interface DiagnosticCalibrationFlag {
  id: string;
  dimension: DiagnosticCalibrationDimension;
  severity: DiagnosticSeverity;
  labelFr: string;
  labelEn: string;
  detailFr: string;
  detailEn: string;
  actionFr: string;
  actionEn: string;
}

export interface DiagnosticCalibration {
  score: number;
  reviewRequired: boolean;
  labelFr: string;
  labelEn: string;
  summaryFr: string;
  summaryEn: string;
  flags: DiagnosticCalibrationFlag[];
}

export interface DiagnosticInsights {
  profile: {
    id: StackProfileId;
    labelFr: string;
    labelEn: string;
    summaryFr: string;
    summaryEn: string;
  };
  maturity: {
    id: StackMaturityId;
    labelFr: string;
    labelEn: string;
    summaryFr: string;
    summaryEn: string;
  };
  personaContext: {
    persona: Persona;
    labelFr: string;
    labelEn: string;
    angleFr: string;
    angleEn: string;
  };
  primaryRisk: DiagnosticRiskFlag | null;
  riskFlags: DiagnosticRiskFlag[];
  functionalCoverage: FunctionalCoverageItem[];
  focusAreas: DiagnosticFocusArea[];
  answerSignals: DiagnosticAnswerSignal[];
  confidence: DiagnosticConfidence;
  calibration: DiagnosticCalibration;
  metrics: {
    toolCount: number;
    paidToolCount: number;
    stackCost: number;
    optimizedCost: number;
    wasteRatio: number;
    duplicateCount: number;
    dormantCount: number;
    reviewCount: number;
    pricingTierCount: number;
    highCostToolCount: number;
    activeDiscoveryCount: number;
    answeredDiscoveryCount: number;
    answeredClosingCount: number;
    protectedToolCount: number;
    challengedToolCount: number;
  };
  generatedAt: string;
}
