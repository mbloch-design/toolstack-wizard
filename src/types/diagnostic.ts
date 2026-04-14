export type Persona = "THEO" | "SOFIA" | "MARC" | "ALIX" | "CLAIRE";

export interface SessionState {
  firstName: string;
  tjm: number;
  language: "fr" | "en";
  persona: Persona;
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
  discoveryAnswers: Map<string, number>;
  closingAnswers: [string, string, string];
}

export interface Tool {
  id: string;
  name: string;
  name_en?: string;
  price: number;
  category: string;
  functional_needs: string[];
  pertinence_by_persona?: Record<Persona, number>;
  tool_type: "core" | "satellite" | "gestion" | "ia";
  ia_use_case?: string;
  usage: "high" | "medium" | "low" | "dormant";
  prescription_quality: "ferme" | "question" | "oui";
  freeAlternative?: string;
  downgrade_plan?: {
    available: boolean;
    fromPrice: number;
    toPrice: number;
    plan: string;
  };
  better_alternative?: string;
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
  type: "doublon" | "doublon-ia" | "dormant" | "inadapté";
  verdict: "cancel" | "review" | "downgrade";
  message: string;
  savingsEstimate: number;
}
