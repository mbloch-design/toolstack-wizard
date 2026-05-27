import type {
  DiagnosticFocusArea,
  DiagnosticInsights,
  DiagnosticRiskFlag,
  DiagnosticResult,
  FunctionalCoverageItem,
  Persona,
  Prescription,
  SessionState,
  StackMaturityId,
  StackProfileId,
  Tool,
} from "@/types/diagnostic";

type ToolScoreMap = Map<string, { pertinence: number; valueIndex: number; scoreFinal: number }>;

type BuildInsightsInput = {
  sessionState: SessionState;
  toolScores: ToolScoreMap;
  prescriptions: DiagnosticResult["prescriptions"];
  recommendations: Tool[];
  healthScore: number;
  stackTotalCost: number;
  estimatedWaste: number;
  optimizedCost: number;
  annualSavings: number;
};

const PERSONA_COPY: Record<Persona, { labelFr: string; labelEn: string; angleFr: string; angleEn: string }> = {
  THEO: {
    labelFr: "Tech / Dev",
    labelEn: "Tech / Dev",
    angleFr: "prioriser les outils qui automatisent, livrent et fiabilisent",
    angleEn: "prioritize tools that automate, ship, and stabilize",
  },
  SOFIA: {
    labelFr: "Creatif",
    labelEn: "Creative",
    angleFr: "garder une chaine creative fluide sans empiler les abonnements",
    angleEn: "keep a fluid creative chain without piling up subscriptions",
  },
  MARC: {
    labelFr: "Conseil",
    labelEn: "Consulting",
    angleFr: "separer acquisition, production client et reporting",
    angleEn: "separate acquisition, client delivery, and reporting",
  },
  ALIX: {
    labelFr: "Content / Createur",
    labelEn: "Content / Creator",
    angleFr: "reduire la friction entre idee, production et publication",
    angleEn: "reduce friction between idea, production, and publishing",
  },
  CLAIRE: {
    labelFr: "Ops / Business",
    labelEn: "Ops / Business",
    angleFr: "clarifier les outils de pilotage, execution et transmission",
    angleEn: "clarify steering, execution, and handoff tools",
  },
};

const PROFILE_COPY: Record<StackProfileId, { labelFr: string; labelEn: string; summaryFr: string; summaryEn: string }> = {
  healthy: {
    labelFr: "Stack saine",
    labelEn: "Healthy stack",
    summaryFr: "La base est cohérente. Le travail se joue surtout sur quelques ajustements.",
    summaryEn: "The foundation is coherent. The work is mostly about a few adjustments.",
  },
  bloated: {
    labelFr: "Stack trop lourde",
    labelEn: "Bloated stack",
    summaryFr: "Tu paies probablement trop d'outils pour trop peu d'usage réel.",
    summaryEn: "You are probably paying for too many tools for too little actual usage.",
  },
  overlap_heavy: {
    labelFr: "Stack redondante",
    labelEn: "Overlap-heavy stack",
    summaryFr: "Plusieurs outils couvrent les mêmes besoins. C'est là que le gain est le plus rapide.",
    summaryEn: "Several tools cover the same needs. That is where the quickest gain is.",
  },
  under_instrumented: {
    labelFr: "Stack fragile",
    labelEn: "Fragile stack",
    summaryFr: "La stack est légère, mais certains maillons clés peuvent manquer pour tenir la charge.",
    summaryEn: "The stack is light, but some core links may be missing to handle the workload.",
  },
  high_leverage: {
    labelFr: "Stack à fort levier",
    labelEn: "High-leverage stack",
    summaryFr: "La stack a du potentiel: quelques arbitrages peuvent créer un vrai gain.",
    summaryEn: "The stack has potential: a few decisions can create meaningful upside.",
  },
};

const MATURITY_COPY: Record<StackMaturityId, { labelFr: string; labelEn: string; summaryFr: string; summaryEn: string }> = {
  emerging: {
    labelFr: "En construction",
    labelEn: "Emerging",
    summaryFr: "Le socle existe, mais il manque encore de structure.",
    summaryEn: "The foundation exists, but it still needs structure.",
  },
  structured: {
    labelFr: "Structurée",
    labelEn: "Structured",
    summaryFr: "Les briques principales sont là. Il faut maintenant mieux arbitrer.",
    summaryEn: "The main building blocks are there. The next step is sharper tradeoffs.",
  },
  overbuilt: {
    labelFr: "Sur-équipée",
    labelEn: "Overbuilt",
    summaryFr: "La stack couvre beaucoup de besoins, parfois au prix de trop de complexité.",
    summaryEn: "The stack covers many needs, sometimes at the cost of too much complexity.",
  },
  optimized: {
    labelFr: "Optimisée",
    labelEn: "Optimized",
    summaryFr: "La stack est bien calibrée par rapport au profil et au coût.",
    summaryEn: "The stack is well calibrated against the profile and cost.",
  },
};

const EXPECTED_NEEDS: Record<Persona, string[]> = {
  THEO: ["code", "deploy", "automation", "analytics", "ai"],
  SOFIA: ["design", "image", "video", "asset", "client"],
  MARC: ["crm", "proposal", "project", "meeting", "reporting"],
  ALIX: ["writing", "publishing", "newsletter", "social", "analytics"],
  CLAIRE: ["project", "documentation", "automation", "finance", "communication"],
};

function allPrescriptions(prescriptions: DiagnosticResult["prescriptions"]) {
  return [...prescriptions.phase1, ...prescriptions.phase2, ...prescriptions.phase3];
}

function sumSavings(items: Prescription[]) {
  return items.reduce((sum, item) => sum + Number(item.savingsEstimate || 0), 0);
}

function severityRank(flag: DiagnosticRiskFlag) {
  if (flag.severity === "high") return 3;
  if (flag.severity === "medium") return 2;
  return 1;
}

function normalizeToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toLabel(value: string) {
  const clean = normalizeToken(value);
  if (!clean) return "General";
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function getToolNeeds(tool: Tool) {
  const needs = tool.functional_needs.filter(Boolean);
  if (needs.length > 0) return needs;
  if (tool.category) return [tool.category];
  return ["general"];
}

function buildCoverage(tools: Tool[], persona: Persona): FunctionalCoverageItem[] {
  const map = new Map<string, FunctionalCoverageItem>();

  for (const tool of tools) {
    for (const rawNeed of getToolNeeds(tool)) {
      const key = normalizeToken(rawNeed);
      if (!key) continue;
      const current =
        map.get(key) ||
        ({
          key,
          label: toLabel(rawNeed),
          toolCount: 0,
          monthlyCost: 0,
          toolNames: [],
          status: "covered",
        } satisfies FunctionalCoverageItem);

      current.toolCount += 1;
      current.monthlyCost += tool.includedInBundle ? 0 : Number(tool.price || 0);
      current.toolNames.push(tool.name);
      map.set(key, current);
    }
  }

  const expectedMissing = EXPECTED_NEEDS[persona]
    .filter((expected) => {
      const normalizedExpected = normalizeToken(expected);
      return !Array.from(map.keys()).some((key) => key.includes(normalizedExpected) || normalizedExpected.includes(key));
    })
    .map(
      (need) =>
        ({
          key: normalizeToken(need),
          label: toLabel(need),
          toolCount: 0,
          monthlyCost: 0,
          toolNames: [],
          status: "missing",
        } satisfies FunctionalCoverageItem)
    );

  const actual = Array.from(map.values()).map((item) => ({
    ...item,
    monthlyCost: Math.round(item.monthlyCost * 100) / 100,
    toolNames: item.toolNames.slice(0, 6),
    status: item.toolCount >= 3 && item.monthlyCost >= 20 ? "overcovered" : "covered",
  } satisfies FunctionalCoverageItem));

  return [...actual, ...expectedMissing]
    .sort((a, b) => {
      const statusWeight = (item: FunctionalCoverageItem) =>
        item.status === "overcovered" ? 3 : item.status === "missing" ? 2 : 1;
      return (
        statusWeight(b) - statusWeight(a) ||
        b.toolCount - a.toolCount ||
        b.monthlyCost - a.monthlyCost ||
        a.label.localeCompare(b.label)
      );
    })
    .slice(0, 10);
}

function buildRiskFlags(input: BuildInsightsInput, coverage: FunctionalCoverageItem[]): DiagnosticRiskFlag[] {
  const prescriptions = allPrescriptions(input.prescriptions);
  const duplicateItems = prescriptions.filter((p) => p.type === "doublon" || p.type === "doublon-ia");
  const dormantItems = prescriptions.filter((p) => p.type === "dormant");
  const inadaptedItems = prescriptions.filter((p) => p.type === "inadapté");
  const duplicateSavings = sumSavings(duplicateItems);
  const dormantSavings = sumSavings(dormantItems);
  const wasteRatio = input.stackTotalCost > 0 ? input.estimatedWaste / input.stackTotalCost : 0;
  const flags: DiagnosticRiskFlag[] = [];

  if (duplicateItems.length > 0) {
    flags.push({
      id: "duplicate_spend",
      severity: duplicateItems.length >= 2 || duplicateSavings >= 40 ? "high" : "medium",
      labelFr: "Dépenses en doublon",
      labelEn: "Duplicate spend",
      detailFr: `${duplicateItems.length} arbitrage(s) de doublon détecté(s).`,
      detailEn: `${duplicateItems.length} duplicate tradeoff(s) detected.`,
      actionFr: "Commencer par choisir l'outil qui reste dans chaque usage.",
      actionEn: "Start by choosing which tool stays for each use case.",
      impactMonthly: Math.round(duplicateSavings),
    });
  }

  if (dormantItems.length > 0) {
    flags.push({
      id: "unused_spend",
      severity: dormantSavings >= 30 ? "high" : "medium",
      labelFr: "Outils peu utilisés",
      labelEn: "Low-usage tools",
      detailFr: `${dormantItems.length} outil(s) semblent dormants ou sous-utilisés.`,
      detailEn: `${dormantItems.length} tool(s) look dormant or underused.`,
      actionFr: "Vérifier l'usage réel avant renouvellement.",
      actionEn: "Check real usage before renewal.",
      impactMonthly: Math.round(dormantSavings),
    });
  }

  if (wasteRatio >= 0.3 && input.estimatedWaste > 0) {
    flags.push({
      id: "waste_burden",
      severity: wasteRatio >= 0.45 ? "high" : "medium",
      labelFr: "Poids budgétaire élevé",
      labelEn: "High budget load",
      detailFr: `${Math.round(wasteRatio * 100)}% du coût mensuel est récupérable.`,
      detailEn: `${Math.round(wasteRatio * 100)}% of monthly cost is recoverable.`,
      actionFr: "Traiter d'abord les actions avec économie directe.",
      actionEn: "Tackle direct-savings actions first.",
      impactMonthly: Math.round(input.estimatedWaste),
    });
  }

  if (inadaptedItems.length >= 2) {
    flags.push({
      id: "low_fit",
      severity: "medium",
      labelFr: "Fit persona faible",
      labelEn: "Low persona fit",
      detailFr: `${inadaptedItems.length} outil(s) collent mal au profil déclaré.`,
      detailEn: `${inadaptedItems.length} tool(s) do not fit the declared persona well.`,
      actionFr: "Comparer ces outils avec des alternatives plus proches du métier.",
      actionEn: "Compare these tools with alternatives closer to the job.",
    });
  }

  const expensiveLowFit = input.sessionState.selectedTools.filter((tool) => {
    const score = input.toolScores.get(tool.id)?.scoreFinal ?? 100;
    return Number(tool.price || 0) >= 60 && score < 55;
  });
  if (expensiveLowFit.length > 0) {
    flags.push({
      id: "premium_mismatch",
      severity: "high",
      labelFr: "Plan premium à challenger",
      labelEn: "Premium plan to challenge",
      detailFr: `${expensiveLowFit.length} outil(s) chers ont un score d'adéquation faible.`,
      detailEn: `${expensiveLowFit.length} expensive tool(s) have a low fit score.`,
      actionFr: "Tester downgrade ou alternative avant d'ajouter un nouvel outil.",
      actionEn: "Test downgrade or replacement before adding another tool.",
      impactMonthly: Math.round(expensiveLowFit.reduce((sum, tool) => sum + Number(tool.price || 0), 0)),
    });
  }

  if (input.sessionState.persona === "THEO" && ["high", "premium"].includes(input.sessionState.apiSpendTranche || "")) {
    flags.push({
      id: "api_spend_watch",
      severity: input.sessionState.apiSpendTranche === "premium" ? "high" : "medium",
      labelFr: "Coût API à surveiller",
      labelEn: "API spend to watch",
      detailFr: "Le budget API peut masquer une part importante du coût réel.",
      detailEn: "API budget can hide a meaningful part of the real cost.",
      actionFr: "Créer un suivi mensuel par usage et par modèle.",
      actionEn: "Create monthly tracking by use case and model.",
    });
  }

  if (input.sessionState.selectedTools.length < 4) {
    flags.push({
      id: "missing_foundation",
      severity: "low",
      labelFr: "Socle encore léger",
      labelEn: "Light foundation",
      detailFr: "La stack est courte: certains usages clés peuvent rester manuels.",
      detailEn: "The stack is short: some core workflows may remain manual.",
      actionFr: "Ne pas ajouter au hasard: compléter seulement les maillons manquants.",
      actionEn: "Do not add randomly: only complete the missing links.",
    });
  }

  const overcovered = coverage.filter((item) => item.status === "overcovered");
  if (overcovered.length > 0) {
    flags.push({
      id: "overcovered_need",
      severity: overcovered.length >= 2 ? "medium" : "low",
      labelFr: "Usage sur-équipé",
      labelEn: "Over-equipped use case",
      detailFr: `${overcovered[0].label} concentre ${overcovered[0].toolCount} outils.`,
      detailEn: `${overcovered[0].label} concentrates ${overcovered[0].toolCount} tools.`,
      actionFr: "Rationaliser cet usage avant de toucher au reste.",
      actionEn: "Rationalize this use case before touching the rest.",
      impactMonthly: Math.round(overcovered[0].monthlyCost),
    });
  }

  return flags
    .sort((a, b) => severityRank(b) - severityRank(a) || Number(b.impactMonthly || 0) - Number(a.impactMonthly || 0))
    .slice(0, 6);
}

function chooseProfile(input: BuildInsightsInput, coverage: FunctionalCoverageItem[]): StackProfileId {
  const prescriptions = allPrescriptions(input.prescriptions);
  const duplicateCount = prescriptions.filter((p) => p.type === "doublon" || p.type === "doublon-ia").length;
  const wasteRatio = input.stackTotalCost > 0 ? input.estimatedWaste / input.stackTotalCost : 0;
  const overcoveredCount = coverage.filter((item) => item.status === "overcovered").length;
  const toolCount = input.sessionState.selectedTools.length;

  if (toolCount <= 3) return "under_instrumented";
  if (wasteRatio >= 0.35 || (input.stackTotalCost >= 200 && input.estimatedWaste >= 60)) return "bloated";
  if (duplicateCount >= 2 || overcoveredCount >= 2) return "overlap_heavy";
  if (input.healthScore >= 80 && input.annualSavings < 300) return "healthy";
  return "high_leverage";
}

function chooseMaturity(input: BuildInsightsInput, riskFlags: DiagnosticRiskFlag[]): StackMaturityId {
  const hasHighRisk = riskFlags.some((flag) => flag.severity === "high");
  const toolCount = input.sessionState.selectedTools.length;
  const wasteRatio = input.stackTotalCost > 0 ? input.estimatedWaste / input.stackTotalCost : 0;

  if (input.healthScore >= 80 && !hasHighRisk) return "optimized";
  if (wasteRatio >= 0.35 || toolCount >= 14) return "overbuilt";
  if (toolCount >= 6 && input.healthScore >= 55) return "structured";
  return "emerging";
}

function buildFocusAreas(input: BuildInsightsInput, riskFlags: DiagnosticRiskFlag[], coverage: FunctionalCoverageItem[]): DiagnosticFocusArea[] {
  const focus: DiagnosticFocusArea[] = [];
  const primary = riskFlags[0];

  if (primary) {
    focus.push({
      id: `risk_${primary.id}`,
      priority: primary.severity === "high" ? "high" : "medium",
      labelFr: primary.labelFr,
      labelEn: primary.labelEn,
      actionFr: primary.actionFr,
      actionEn: primary.actionEn,
    });
  }

  const overcovered = coverage.find((item) => item.status === "overcovered");
  if (overcovered) {
    focus.push({
      id: `coverage_${overcovered.key}`,
      priority: "medium",
      labelFr: `Clarifier ${overcovered.label}`,
      labelEn: `Clarify ${overcovered.label}`,
      actionFr: `Décider quels outils restent sur ${overcovered.label.toLowerCase()}.`,
      actionEn: `Decide which tools stay for ${overcovered.label.toLowerCase()}.`,
    });
  }

  const missing = coverage.find((item) => item.status === "missing");
  if (missing) {
    focus.push({
      id: `missing_${missing.key}`,
      priority: "low",
      labelFr: `Compléter ${missing.label}`,
      labelEn: `Complete ${missing.label}`,
      actionFr: "Ajouter seulement si ce besoin bloque déjà l'exécution.",
      actionEn: "Add only if this need is already blocking execution.",
    });
  }

  if (input.recommendations.length > 0) {
    focus.push({
      id: "optional_upgrade",
      priority: "low",
      labelFr: "Explorer les alternatives utiles",
      labelEn: "Explore useful alternatives",
      actionFr: `Tester ${input.recommendations[0].name} seulement après les économies immédiates.`,
      actionEn: `Test ${input.recommendations[0].name} only after direct savings.`,
    });
  }

  if (focus.length === 0) {
    focus.push({
      id: "quarterly_review",
      priority: "low",
      labelFr: "Revue trimestrielle",
      labelEn: "Quarterly review",
      actionFr: "Repasser le diagnostic dans 3 mois pour éviter la dérive.",
      actionEn: "Run the diagnostic again in 3 months to avoid drift.",
    });
  }

  return focus.slice(0, 4);
}

export function buildDiagnosticInsights(input: BuildInsightsInput): DiagnosticInsights {
  const prescriptions = allPrescriptions(input.prescriptions);
  const coverage = buildCoverage(input.sessionState.selectedTools, input.sessionState.persona);
  const riskFlags = buildRiskFlags(input, coverage);
  const profileId = chooseProfile(input, coverage);
  const maturityId = chooseMaturity(input, riskFlags);
  const paidTools = input.sessionState.selectedTools.filter((tool) => !tool.includedInBundle && Number(tool.price || 0) > 0);
  const wasteRatio = input.stackTotalCost > 0 ? input.estimatedWaste / input.stackTotalCost : 0;

  return {
    profile: {
      id: profileId,
      ...PROFILE_COPY[profileId],
    },
    maturity: {
      id: maturityId,
      ...MATURITY_COPY[maturityId],
    },
    personaContext: {
      persona: input.sessionState.persona,
      ...PERSONA_COPY[input.sessionState.persona],
    },
    primaryRisk: riskFlags[0] || null,
    riskFlags,
    functionalCoverage: coverage,
    focusAreas: buildFocusAreas(input, riskFlags, coverage),
    metrics: {
      toolCount: input.sessionState.selectedTools.length,
      paidToolCount: paidTools.length,
      stackCost: input.stackTotalCost,
      optimizedCost: input.optimizedCost,
      wasteRatio: Math.round(wasteRatio * 100) / 100,
      duplicateCount: prescriptions.filter((p) => p.type === "doublon" || p.type === "doublon-ia").length,
      dormantCount: prescriptions.filter((p) => p.type === "dormant").length,
      reviewCount: prescriptions.filter((p) => p.verdict === "review" || p.verdict === "downgrade").length,
      highCostToolCount: paidTools.filter((tool) => Number(tool.price || 0) >= 60).length,
    },
    generatedAt: new Date().toISOString(),
  };
}
