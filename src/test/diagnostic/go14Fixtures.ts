import type {
  DiagnosticData,
} from "@/utils/scoring";
import type {
  DiscoveryQuestion,
  DoubleRule,
  Persona,
  SessionState,
  StackMaturityId,
  StackProfileId,
  Tool,
} from "@/types/diagnostic";

type ScenarioExpectation = {
  healthMin?: number;
  healthMax?: number;
  healthLabel?: "Optimisée" | "Correcte" | "À revoir" | "Critique";
  profileIn?: StackProfileId[];
  maturityIn?: StackMaturityId[];
  minAnnualSavings?: number;
  maxAnnualSavings?: number;
  minConfidence?: number;
  reviewRequired?: boolean;
  mustIncludeRiskIds?: string[];
  mustIncludeSignalIds?: string[];
};

export type Go14Scenario = {
  id: string;
  title: string;
  sessionState: SessionState;
  expected: ScenarioExpectation;
};

function personaScores(
  values: Partial<Record<Persona, number>>
): Record<Persona, number> {
  return {
    THEO: values.THEO ?? 50,
    SOFIA: values.SOFIA ?? 50,
    MARC: values.MARC ?? 50,
    ALIX: values.ALIX ?? 50,
    CLAIRE: values.CLAIRE ?? 50,
  };
}

function tool(input: {
  id: string;
  name: string;
  price: number;
  toolType?: Tool["tool_type"];
  category?: string;
  needs?: string[];
  usage?: Tool["usage"];
  prescriptionQuality?: Tool["prescription_quality"];
  iaUseCase?: string;
  forceSilence?: boolean;
  pertinence?: Partial<Record<Persona, number>>;
}): Tool {
  return {
    id: input.id,
    name: input.name,
    price: input.price,
    category: input.category ?? "general",
    functional_needs: input.needs ?? ["general"],
    tool_type: input.toolType ?? "satellite",
    usage: input.usage ?? "medium",
    prescription_quality: input.prescriptionQuality ?? "oui",
    ia_use_case: input.iaUseCase,
    force_silence: input.forceSilence ?? false,
    pertinence_by_persona: personaScores(input.pertinence ?? {}),
  };
}

const TOOLS: Tool[] = [
  tool({
    id: "chatgpt",
    name: "ChatGPT",
    price: 20,
    toolType: "ia",
    category: "ai-general",
    needs: ["ai", "writing", "analysis"],
    iaUseCase: "assistant",
    pertinence: { THEO: 88, ALIX: 85, MARC: 74 },
  }),
  tool({
    id: "claude",
    name: "Claude",
    price: 20,
    toolType: "ia",
    category: "ai-general",
    needs: ["ai", "writing", "analysis"],
    iaUseCase: "assistant",
    pertinence: { THEO: 86, ALIX: 80, MARC: 70 },
  }),
  tool({
    id: "perplexity",
    name: "Perplexity",
    price: 20,
    toolType: "ia",
    category: "ai-general",
    needs: ["ai", "research", "analysis"],
    iaUseCase: "research",
    pertinence: { THEO: 84, MARC: 74, ALIX: 68 },
  }),
  tool({
    id: "zapier",
    name: "Zapier",
    price: 29,
    category: "automation",
    needs: ["automation", "ops"],
    pertinence: { THEO: 82, CLAIRE: 78, MARC: 65 },
  }),
  tool({
    id: "make",
    name: "Make",
    price: 20,
    category: "automation",
    needs: ["automation", "ops"],
    pertinence: { THEO: 80, CLAIRE: 75, MARC: 60 },
  }),
  tool({
    id: "notion",
    name: "Notion",
    price: 10,
    category: "project",
    needs: ["documentation", "project", "organization"],
    pertinence: { CLAIRE: 86, MARC: 72, SOFIA: 62 },
  }),
  tool({
    id: "jira",
    name: "Jira",
    price: 8,
    category: "project",
    needs: ["project", "tracking"],
    pertinence: { THEO: 82, CLAIRE: 76 },
  }),
  tool({
    id: "vercel",
    name: "Vercel",
    price: 20,
    category: "deploy",
    needs: ["deploy", "hosting"],
    pertinence: { THEO: 86, CLAIRE: 44 },
  }),
  tool({
    id: "netlify",
    name: "Netlify",
    price: 19,
    category: "deploy",
    needs: ["deploy", "hosting"],
    pertinence: { THEO: 80, CLAIRE: 40 },
  }),
  tool({
    id: "figma",
    name: "Figma",
    price: 15,
    category: "design",
    needs: ["design", "asset"],
    pertinence: { SOFIA: 96, ALIX: 66, THEO: 20 },
  }),
  tool({
    id: "canva",
    name: "Canva",
    price: 12,
    category: "design",
    needs: ["design", "social", "asset"],
    pertinence: { SOFIA: 90, ALIX: 80 },
  }),
  tool({
    id: "adobe-premiere",
    name: "Adobe Premiere",
    price: 23,
    category: "video",
    needs: ["video", "creation"],
    pertinence: { SOFIA: 88, ALIX: 76 },
  }),
  tool({
    id: "hubspot",
    name: "HubSpot",
    price: 30,
    category: "crm",
    needs: ["crm", "sales"],
    pertinence: { MARC: 90, CLAIRE: 70 },
  }),
  tool({
    id: "pipedrive",
    name: "Pipedrive",
    price: 19,
    category: "crm",
    needs: ["crm", "sales"],
    pertinence: { MARC: 86, CLAIRE: 62 },
  }),
  tool({
    id: "mailchimp",
    name: "Mailchimp",
    price: 25,
    category: "newsletter",
    needs: ["newsletter", "publishing"],
    pertinence: { ALIX: 92, MARC: 58 },
  }),
  tool({
    id: "convertkit",
    name: "ConvertKit",
    price: 29,
    category: "newsletter",
    needs: ["newsletter", "publishing"],
    pertinence: { ALIX: 90, MARC: 50 },
  }),
  tool({
    id: "1password",
    name: "1Password",
    price: 4,
    category: "security",
    needs: ["security", "password"],
    pertinence: { THEO: 88, CLAIRE: 70, MARC: 50 },
  }),
  tool({
    id: "quickbooks",
    name: "QuickBooks",
    price: 25,
    category: "finance",
    needs: ["finance", "accounting"],
    pertinence: { CLAIRE: 95, MARC: 68 },
  }),
  tool({
    id: "google-drive",
    name: "Google Drive",
    price: 12,
    category: "storage",
    needs: ["storage", "documentation"],
    forceSilence: true,
    pertinence: { CLAIRE: 76, SOFIA: 54, MARC: 60 },
  }),
];

const TOOL_MAP = new Map(TOOLS.map((current) => [current.id, current]));

function pickTools(ids: string[]) {
  return ids.map((id) => {
    const found = TOOL_MAP.get(id);
    if (!found) {
      throw new Error(`Unknown tool id in GO14 fixtures: ${id}`);
    }
    return found;
  });
}

export const GO14_DOUBLON_RULES: DoubleRule[] = [
  {
    ids: ["chatgpt", "claude"],
    message: "Deux LLM premium en parallele",
    savings: 20,
    category: "ai-general",
  },
  {
    ids: ["zapier", "make"],
    message: "Deux outils automation redondants",
    savings: 20,
    category: "automation",
  },
  {
    ids: ["vercel", "netlify"],
    message: "Deux hebergeurs en doublon",
    savings: 19,
    category: "deploy",
  },
  {
    ids: ["hubspot", "pipedrive"],
    message: "Deux CRM superposes",
    savings: 19,
    category: "crm",
  },
  {
    ids: ["mailchimp", "convertkit"],
    message: "Deux outils newsletter superposes",
    savings: 25,
    category: "newsletter",
  },
];

export const GO14_DISCOVERY_QUESTIONS: DiscoveryQuestion[] = [
  {
    id: "dq_ai_usage",
    persona: "ALL",
    question: "Frequence usage IA",
    subtitle: "Confirme la valeur des IA selectionnees",
    options: [
      { label: "Quotidien", impact: "keep" },
      { label: "Hebdo", impact: "review" },
      { label: "Rare", impact: "cancel" },
    ],
    condition_tool_ids: ["chatgpt", "claude", "perplexity"],
    condition_type: "any",
  },
  {
    id: "dq_automation_depth",
    persona: "ALL",
    question: "Volume d'automations",
    subtitle: "Zapier / Make",
    options: [
      { label: "10+ actifs", impact: "keep" },
      { label: "3-9", impact: "review" },
      { label: "0-2", impact: "cancel" },
    ],
    condition_tool_ids: ["zapier", "make"],
    condition_type: "any",
  },
  {
    id: "dq_design_depth",
    persona: "SOFIA",
    question: "Profondeur design",
    subtitle: "Design system et assets",
    options: [
      { label: "Usage pro fort", impact: "keep" },
      { label: "Usage moyen", impact: "review" },
      { label: "Usage basique", impact: "cancel" },
    ],
    condition_tool_ids: ["figma", "canva", "adobe-premiere"],
    condition_type: "any",
  },
  {
    id: "dq_crm_depth",
    persona: "MARC",
    question: "Volume pipeline CRM",
    subtitle: "Deals actifs",
    options: [
      { label: "20+ deals", impact: "keep" },
      { label: "5-19 deals", impact: "review" },
      { label: "<5 deals", impact: "cancel" },
    ],
    condition_tool_ids: ["hubspot", "pipedrive"],
    condition_type: "any",
  },
  {
    id: "dq_newsletter_depth",
    persona: "ALIX",
    question: "Volume newsletter",
    subtitle: "Base abonnes",
    options: [
      { label: "5000+ abonnes", impact: "keep" },
      { label: "500-5000 abonnes", impact: "review" },
      { label: "<500 abonnes", impact: "cancel" },
    ],
    condition_tool_ids: ["mailchimp", "convertkit"],
    condition_type: "any",
  },
  {
    id: "dq_ops_scope",
    persona: "CLAIRE",
    question: "Portee equipe projet",
    subtitle: "Usage operations",
    options: [
      { label: "5+ utilisateurs", impact: "keep" },
      { label: "2-4 utilisateurs", impact: "review" },
      { label: "Solo", impact: "cancel" },
    ],
    condition_tool_ids: ["notion", "jira", "quickbooks"],
    condition_type: "any",
  },
];

export const GO14_DIAGNOSTIC_DATA: DiagnosticData = {
  allTools: TOOLS,
  doublonRules: GO14_DOUBLON_RULES,
  discoveryQuestions: GO14_DISCOVERY_QUESTIONS,
};

function answerMap(answers: Record<string, number>) {
  return new Map<string, number>(Object.entries(answers));
}

function session(input: {
  firstName: string;
  persona: Persona;
  tjm: number;
  toolIds: string[];
  discoveryAnswers?: Record<string, number>;
  closingAnswers?: [string, string, string];
  apiSpendTranche?: SessionState["apiSpendTranche"];
}): SessionState {
  return {
    firstName: input.firstName,
    tjm: input.tjm,
    language: "fr",
    persona: input.persona,
    complementarySkills: [],
    selectedTools: pickTools(input.toolIds),
    discoveryAnswers: answerMap(input.discoveryAnswers ?? {}),
    closingAnswers:
      input.closingAnswers ??
      [
        "Je verifie mes lignes tous les mois",
        "Non",
        "J'utilise un gestionnaire",
      ],
    apiSpendTranche: input.apiSpendTranche ?? "mid",
  };
}

export const GO14_SCENARIOS: Go14Scenario[] = [
  {
    id: "theo-cost-overlap",
    title: "THEO: stack redondante, cout eleve, signaux de reduction clairs",
    sessionState: session({
      firstName: "Theo",
      persona: "THEO",
      tjm: 700,
      apiSpendTranche: "premium",
      toolIds: [
        "chatgpt",
        "claude",
        "perplexity",
        "zapier",
        "make",
        "notion",
        "jira",
        "vercel",
        "netlify",
      ],
      discoveryAnswers: {
        dq_ai_usage: 2,
        dq_automation_depth: 2,
      },
      closingAnswers: ["Je ne regarde jamais", "Oui probablement", "Gratuit"],
    }),
    expected: {
      healthMax: 60,
      profileIn: ["bloated", "overlap_heavy"],
      minAnnualSavings: 600,
      minConfidence: 70,
      mustIncludeRiskIds: ["duplicate_spend", "waste_burden", "api_spend_watch"],
      mustIncludeSignalIds: ["closing_billing_blind_spot", "closing_annual_lock_in"],
    },
  },
  {
    id: "sofia-lean-healthy",
    title: "SOFIA: stack creative compacte et saine",
    sessionState: session({
      firstName: "Sofia",
      persona: "SOFIA",
      tjm: 420,
      toolIds: ["figma", "canva", "notion", "1password", "google-drive"],
      discoveryAnswers: {
        dq_design_depth: 0,
      },
      closingAnswers: [
        "Je controle mes paiements chaque mois",
        "Non",
        "J'utilise deja 1Password",
      ],
    }),
    expected: {
      healthMin: 80,
      profileIn: ["healthy", "high_leverage"],
      maxAnnualSavings: 250,
      minConfidence: 65,
      reviewRequired: false,
    },
  },
  {
    id: "marc-under-instrumented",
    title: "MARC: base legere et faible instrumentation",
    sessionState: session({
      firstName: "Marc",
      persona: "MARC",
      tjm: 350,
      toolIds: ["notion", "hubspot", "1password"],
      discoveryAnswers: {
        dq_crm_depth: 1,
      },
      closingAnswers: [
        "Je verifie de temps en temps",
        "Non",
        "J'utilise un gestionnaire",
      ],
    }),
    expected: {
      profileIn: ["under_instrumented"],
      healthMin: 80,
      healthMax: 100,
      minConfidence: 60,
      reviewRequired: false,
    },
  },
  {
    id: "alix-newsletter-lockin",
    title: "ALIX: stack content avec lock-in annuel et doublons newsletter",
    sessionState: session({
      firstName: "Alix",
      persona: "ALIX",
      tjm: 300,
      toolIds: ["chatgpt", "mailchimp", "convertkit", "notion", "canva"],
      discoveryAnswers: {
        dq_ai_usage: 1,
        dq_newsletter_depth: 2,
      },
      closingAnswers: [
        "Peut etre, je ne sais plus",
        "Oui",
        "Je n'en ai pas",
      ],
    }),
    expected: {
      healthMax: 75,
      profileIn: ["bloated", "overlap_heavy", "high_leverage"],
      minAnnualSavings: 250,
      minConfidence: 70,
      mustIncludeSignalIds: [
        "closing_billing_blind_spot",
        "closing_annual_lock_in",
        "closing_password_foundation",
      ],
    },
  },
  {
    id: "claire-ops-structured",
    title: "CLAIRE: stack operations structuree mais avec zones de revue",
    sessionState: session({
      firstName: "Claire",
      persona: "CLAIRE",
      tjm: 500,
      toolIds: ["notion", "jira", "quickbooks", "zapier", "google-drive"],
      discoveryAnswers: {
        dq_automation_depth: 1,
        dq_ops_scope: 1,
      },
      closingAnswers: [
        "Je verifie mes paiements",
        "Non",
        "J'utilise un gestionnaire",
      ],
    }),
    expected: {
      healthMin: 70,
      healthMax: 100,
      maturityIn: ["structured", "optimized", "overbuilt"],
      minConfidence: 70,
      reviewRequired: false,
    },
  },
  {
    id: "theo-fragile-confidence",
    title: "THEO: peu de reponses discovery, actions fortes, calibration prudente",
    sessionState: session({
      firstName: "Theo-lite",
      persona: "THEO",
      tjm: 650,
      apiSpendTranche: "high",
      toolIds: ["chatgpt", "claude", "zapier", "make", "vercel", "netlify"],
      discoveryAnswers: {},
      closingAnswers: ["", "", ""],
    }),
    expected: {
      healthMax: 75,
      profileIn: ["bloated", "overlap_heavy", "high_leverage"],
      minAnnualSavings: 300,
      minConfidence: 45,
      reviewRequired: true,
      mustIncludeRiskIds: ["duplicate_spend"],
    },
  },
];
