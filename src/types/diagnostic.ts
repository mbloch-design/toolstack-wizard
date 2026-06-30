export type Persona = "THEO" | "SOFIA" | "MARC" | "ALIX" | "CLAIRE";

export type ToolBillingChoice =
  | "free"
  | "paid"
  | "team"
  | "single_app"
  | "bundle"
  | "included"
  | "one_time"
  | "usage"
  | "credits"
  | "marketplace"
  | "custom_quote"
  | "unknown";

export type ToolBillingModel =
  | "free"
  | "subscription"
  | "seat"
  | "team"
  | "bundle"
  | "one_time"
  | "usage_based"
  | "credits"
  | "marketplace"
  | "custom_quote"
  | "included";

export interface ToolBillingOption {
  value: ToolBillingChoice;
  label_fr: string;
  label_en: string;
  price_monthly_eur?: number | null;
  price_original?: number | null;
  currency?: string | null;
  note_fr?: string;
  note_en?: string;
  needs_verification?: boolean;
}

export type ToolRelationKind =
  | "plugin_of"
  | "included_in"
  | "complements"
  | "alternative_to"
  | "integrates_with";

export interface ToolRelation {
  kind: ToolRelationKind;
  targetToolId: string;
  needKeys?: string[];
  confidence?: "catalog" | "curated" | "inferred";
}

export type WorkflowMethod = "tool" | "manual" | "mixed" | "outsourced" | "unknown";

export type AiContributionMode =
  | "none"
  | "integrated"
  | "external"
  | "mixed"
  | "automated"
  | "unknown";

export type AiCapabilityId =
  | "research_ideation"
  | "generate_text"
  | "generate_visual"
  | "generate_layout"
  | "generate_code"
  | "generate_3d"
  | "organize_classify"
  | "transcribe_translate"
  | "edit_enhance"
  | "remove_extend"
  | "animate"
  | "render_upscale"
  | "analyze_validate"
  | "automate_workflow"
  | "other";

export type AiActorSource = "integrated" | "external" | "automation";
export type AiUsageFrequency = "occasional" | "regular" | "systematic";
export type AiUsageConstraint =
  | "none"
  | "credits"
  | "quota"
  | "reliability"
  | "privacy"
  | "rights"
  | "unknown";

export interface AiWorkflowActor {
  id: string;
  source: AiActorSource;
  toolId?: string;
  /** Optional named AI capability used inside the host application (for example Firefly in Photoshop). */
  featureToolId?: string;
  featureName?: string;
  capabilityIds: AiCapabilityId[];
  frequency?: AiUsageFrequency;
  constraints?: AiUsageConstraint[];
  handlesSensitiveData?: boolean;
  notes?: string;
}

export interface WorkflowUsage {
  id: string;
  objectiveId: string;
  objectiveLabelFr: string;
  objectiveLabelEn: string;
  method: WorkflowMethod;
  toolIds: string[];
  customMethod?: string;
  aiMode: AiContributionMode;
  aiToolIds: string[];
  aiActors?: AiWorkflowActor[];
  aiNotes?: string;
  importance?: "low" | "medium" | "high" | "critical";
  frequency?: "rare" | "monthly" | "weekly" | "daily";
  satisfaction?: "good" | "acceptable" | "friction" | "blocked";
}

export type CommercialAccessMode =
  | "suite"
  | "mixed"
  | "single_products"
  | "team_employer"
  | "client_paid"
  | "included_elsewhere"
  | "free"
  | "usage_based"
  | "one_time"
  | "unknown";

export type CommercialPayer = "self" | "employer" | "client" | "shared" | "unknown";

export type AiAllowanceStatus =
  | "enough"
  | "sometimes_limited"
  | "frequently_limited"
  | "extra_purchases"
  | "unknown";

export interface CommercialContract {
  id: string;
  familyId: string;
  familyName: string;
  accessMode: CommercialAccessMode;
  planId?: string;
  planLabel?: string;
  payer: CommercialPayer;
  productIds: string[];
  monthlyPrice?: number;
  aiAllowanceStatus?: AiAllowanceStatus;
  variableMonthlyPrice?: number;
  currency?: string;
  confirmed: boolean;
}

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
  toolUsageMap?: Record<string, string[]>;
  workflowUsages?: WorkflowUsage[];
  commercialContracts?: CommercialContract[];
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
  adaptiveDiscoveryQuestions?: DiscoveryQuestion[];
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
  priceCurrency?: string;
  category: string;
  functional_needs: string[];
  verticals?: string[];
  host_app?: string | null;
  alternatives?: string[];
  complements?: string[];
  integrates_with?: string[];
  relations?: ToolRelation[];
  provider_id?: string;
  commercial_family?: string;
  substitution_cluster_v2?: string | null;
  pertinence_by_persona?: Record<Persona, number>;
  tool_type: "core" | "metier" | "satellite" | "gestion" | "ia" | "plugin" | "specialise" | "bundle";
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
    billing_model?: ToolBillingModel;
    billing_options?: ToolBillingOption[];
    price_original?: number;
    price_original_currency?: string;
    currency?: string;
    conversion_rate_to_eur?: number;
    price_reliability?: string;
    usage_sensitive?: boolean;
    location_sensitive?: boolean;
    cautions?: string[];
    source_domain?: string;
    verified_on?: string;
    official_source_url?: string;
    verification_status?: string;
  } | null;
  selectedOffer?: ToolBillingChoice;
  catalogMonthlyPrice?: number;
  catalogMonthlyPriceCurrency?: string;
  selectedPriceIsEstimate?: boolean;
  force_silence: boolean;
  bundle_parent?: string;
  /** Runtime flag: true when this tool is included via a selected bundle parent */
  includedInBundle?: boolean;
  /** Runtime: name of the bundle parent that includes this tool */
  includedVia?: string;
  /** Runtime: commercial contract carrying this product's cost */
  commercialContractId?: string;
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
  questionEn?: string;
  subtitle: string;
  subtitleEn?: string;
  options: { label: string; labelEn?: string; impact: "keep" | "review" | "cancel"; affectedTools?: string[] }[];
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
  recommendationEvidence?: Record<string, {
    needId?: string;
    labelFr: string;
    labelEn: string;
    reasonFr: string;
    reasonEn: string;
    confidence: "low" | "medium" | "high";
  }>;
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
  source: "onboarding" | "workflow" | "discovery" | "closing";
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

export type AiDiagnosticFindingKind =
  | "overlap"
  | "risk"
  | "access_gap"
  | "usage_pressure"
  | "mapping_gap"
  | "automation_opportunity";

export type AiAccessStatus =
  | "included"
  | "included_limited"
  | "separate_subscription"
  | "usage_based"
  | "sponsored"
  | "free"
  | "unresolved";

export interface AiDiagnosticActorSummary {
  id: string;
  actorKey: string;
  source: AiActorSource;
  sourceLabelFr: string;
  sourceLabelEn: string;
  toolId?: string;
  toolName: string;
  hostToolName?: string;
  featureToolId?: string;
  featureName?: string;
  accessStatus: AiAccessStatus;
  accessLabelFr: string;
  accessLabelEn: string;
  commercialContractId?: string;
  commercialContractName?: string;
  allowanceStatus?: AiAllowanceStatus;
  allowanceLabelFr?: string;
  allowanceLabelEn?: string;
  variableMonthlyCost?: number;
  capabilityIds: AiCapabilityId[];
  capabilityLabelsFr: string[];
  capabilityLabelsEn: string[];
  frequency?: AiUsageFrequency;
  frequencyLabelFr?: string;
  frequencyLabelEn?: string;
  constraints: AiUsageConstraint[];
  handlesSensitiveData: boolean;
}

export interface AiDiagnosticActorRole {
  objectiveId: string;
  objectiveLabelFr: string;
  objectiveLabelEn: string;
  source: AiActorSource;
  sourceLabelFr: string;
  sourceLabelEn: string;
  capabilityIds: AiCapabilityId[];
  capabilityLabelsFr: string[];
  capabilityLabelsEn: string[];
  frequency?: AiUsageFrequency;
  frequencyLabelFr?: string;
  frequencyLabelEn?: string;
}

export interface AiDiagnosticGlobalActorSummary
  extends AiDiagnosticActorSummary {
  sources: AiActorSource[];
  objectiveCount: number;
  roles: AiDiagnosticActorRole[];
}

export interface AiDiagnosticWorkflowSummary {
  objectiveId: string;
  objectiveLabelFr: string;
  objectiveLabelEn: string;
  mode: AiContributionMode;
  actors: AiDiagnosticActorSummary[];
}

export interface AiDiagnosticFinding {
  id: string;
  kind: AiDiagnosticFindingKind;
  severity: DiagnosticSeverity;
  labelFr: string;
  labelEn: string;
  detailFr: string;
  detailEn: string;
  actionFr: string;
  actionEn: string;
  objectiveId: string;
  objectiveIds?: string[];
  objectiveLabelsFr?: string[];
  objectiveLabelsEn?: string[];
  occurrenceCount?: number;
  toolIds: string[];
  actorIds?: string[];
  actorKeys?: string[];
  capabilityId?: AiCapabilityId;
  reviewRecommended: boolean;
}

export interface DiagnosticAiAnalysis {
  objectiveCount: number;
  actorCount: number;
  actorOccurrenceCount: number;
  capabilityCount: number;
  integratedActorCount: number;
  externalActorCount: number;
  automationActorCount: number;
  systematicActorCount: number;
  constrainedActorCount: number;
  resolvedAccessCount: number;
  unresolvedAccessCount: number;
  globalActors: AiDiagnosticGlobalActorSummary[];
  workflows: AiDiagnosticWorkflowSummary[];
  findings: AiDiagnosticFinding[];
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
  aiAnalysis: DiagnosticAiAnalysis;
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
    aiObjectiveCount: number;
    aiActorCount: number;
    aiCapabilityCount: number;
    aiRiskCount: number;
    aiOverlapCount: number;
  };
  generatedAt: string;
}
