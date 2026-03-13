import type { Tool, SelectorFormData, ScoredTool, SelectorResults, Persona, TjmRange } from "@/data/types";
import { TJM_OPTIONS } from "@/data/types";

function getTjmMedian(tjm: TjmRange | null): number {
  if (!tjm) return 200;
  const opt = TJM_OPTIONS.find((o) => o.value === tjm);
  return opt?.median || 200;
}

// Normalize mainGoal values (support both dash and underscore variants)
function normalizeGoal(goal: string | null): string | null {
  if (!goal) return null;
  const map: Record<string, string> = {
    "reduce-costs": "reduce_costs",
    "reduce_costs": "reduce_costs",
    "save-time": "save_time",
    "save_time": "save_time",
    "simplify": "simplify_stack",
    "simplify_stack": "simplify_stack",
    "find-better": "find_better_tools",
    "find_better_tools": "find_better_tools",
  };
  return map[goal] || goal;
}

function computePertinenceScore(tool: Tool, form: SelectorFormData): number {
  const personaKey = (form.persona || "").toLowerCase();
  const mainGoal = normalizeGoal(form.mainGoal);
  const phase = form.projectPhase;
  const maturity = form.techMaturity;
  const aiUsageLevel = form.aiUsageLevel;

  // Exclude tools without personas or not matching persona
  if (!tool.personas || tool.personas.length === 0) return 0;
  if (!tool.personas.includes(personaKey)) return 0;

  let score = 30; // base if persona matches

  // +20 pts mainGoal
  if (mainGoal === "reduce_costs" && tool.defaultMonthlyPrice === 0) score += 20;
  if (mainGoal === "save_time" && (tool.timeGainedHoursPerMonth || 0) >= 5) score += 20;
  if (mainGoal === "simplify_stack" && (tool.covers?.length || 0) >= 3) score += 20;
  if (mainGoal === "find_better_tools") score += 10;

  // +15 pts aiUsageLevel
  if (aiUsageLevel === "intensive" && tool.categoryId === "ai-general") score += 15;

  // +15 pts project_phase
  if (phase === "lancement" && tool.pricing?.free) score += 15;
  if (phase === "croissance") {
    const covers = (tool.covers || []).map((c) => c.toLowerCase());
    if (covers.includes("automatisation") || covers.includes("automation")) score += 15;
  }

  // +10 pts tech_maturity
  if (maturity === "zero-config") {
    const avoidIf = (tool.verdict?.avoidIf || []).join(" ").toLowerCase();
    if (!avoidIf.includes("configuration") && !avoidIf.includes("complexe")) score += 10;
    else score -= 15;
  }

  // +10 pts persona-specific categories
  if (personaKey === "alix" && tool.categoryId === "ai-general") score += 10;
  if (personaKey === "sofia" && tool.categoryId === "finance") score += 10;
  if (personaKey === "claire" && ["finance", "analytics", "security"].includes(tool.categoryId)) score += 10;
  if (personaKey === "marc" && ["project-management", "security", "communication-team"].includes(tool.categoryId)) score += 10;
  if (personaKey === "theo" && ["automation", "nocode-web", "analytics"].includes(tool.categoryId)) score += 10;

  return Math.min(score, 100);
}

function computeValueIndex(tool: Tool, tjmMedian: number): { valueIndex: number; valueCreated: number } {
  if (tjmMedian === 0) return { valueIndex: 0, valueCreated: 0 };
  const tjmH = tjmMedian / 8;
  const hours = tool.timeGainedHoursPerMonth || 0;
  const valueCreated = hours * tjmH;
  const raw = valueCreated / (tool.defaultMonthlyPrice + 1);
  // Normalisation étalée : plafond à 50
  const normalized = Math.min((raw / 50) * 100, 100);
  return { valueIndex: Math.round(normalized), valueCreated: Math.round(valueCreated) };
}

interface DoublonResult {
  tool: Tool;
  scoreFinal: number;
  reason: "doublon";
  replacedBy: string;
  message: string;
}

function detectDoublons(
  currentTools: Tool[],
  scoreMap: Map<string, number>
): DoublonResult[] {
  const toCancel: DoublonResult[] = [];
  for (let i = 0; i < currentTools.length; i++) {
    for (let j = i + 1; j < currentTools.length; j++) {
      const coversA = currentTools[i].covers || [];
      const coversB = currentTools[j].covers || [];
      const intersection = coversA.filter((c) => coversB.includes(c));
      if (intersection.length >= 2) {
        const scoreA = scoreMap.get(currentTools[i].id) || 0;
        const scoreB = scoreMap.get(currentTools[j].id) || 0;
        const loser = scoreA <= scoreB ? currentTools[i] : currentTools[j];
        const winner = loser === currentTools[i] ? currentTools[j] : currentTools[i];
        // Don't add duplicates
        if (!toCancel.find((d) => d.tool.id === loser.id)) {
          toCancel.push({
            tool: loser,
            scoreFinal: scoreMap.get(loser.id) || 0,
            reason: "doublon",
            replacedBy: winner.name,
            message: `${winner.name} couvre déjà vos besoins. ${loser.name} devient redondant.`,
          });
        }
      }
    }
  }
  return toCancel;
}

function getPersonaMessage(persona: Persona | null, lang: "fr" | "en"): string {
  if (lang === "en") {
    const msgs: Record<string, string> = {
      sofia: "Here's how much your stack really costs in billable days.",
      marc: "Here are the orphan licenses and redundancies detected in your stack.",
      theo: "Here's your monthly SaaS Burn and how to reduce it without losing velocity.",
      alix: "Here are the AI duplicates in your stack and the agents with the best ROI.",
      claire: "Here's a consolidated view of your software spending and reduction levers.",
    };
    return msgs[persona || ""] || "";
  }
  const msgs: Record<string, string> = {
    sofia: "Voici combien votre stack vous coûte réellement en jours facturables.",
    marc: "Voici les licences orphelines et redondances détectées dans votre stack.",
    theo: "Voici votre Burn SaaS mensuel et comment le réduire sans perdre en vélocité.",
    alix: "Voici les doublons IA dans votre stack et les agents au meilleur ROI.",
    claire: "Voici une vue consolidée de vos dépenses logicielles et les leviers de réduction.",
  };
  return msgs[persona || ""] || "";
}

export function computeStackHealthScore(
  currentToolIds: string[],
  allTools: Tool[],
  scoreMap: Map<string, number>,
  personaKey: string
): number {
  if (currentToolIds.length === 0) return -1;

  let health = 100;
  const currentTools = currentToolIds
    .map((id) => allTools.find((t) => t.id === id))
    .filter(Boolean) as Tool[];

  // Detect doublons
  const doublons = detectDoublons(currentTools, scoreMap);
  health -= doublons.length * 10;

  // -5 per inadequate tool (score < 40, not already a doublon)
  const doublonIds = new Set(doublons.map((d) => d.tool.id));
  for (const t of currentTools) {
    if (doublonIds.has(t.id)) continue;
    if ((scoreMap.get(t.id) || 0) < 40) health -= 5;
  }

  // -5 per expensive tool (>20€) without free alternative
  for (const t of currentTools) {
    if (t.defaultMonthlyPrice > 20 && !t.freeAlternative) health -= 5;
  }

  return Math.max(0, Math.min(100, health));
}

export function generateScoringResults(
  form: SelectorFormData,
  allTools: Tool[],
  lang: "fr" | "en" = "fr"
): SelectorResults {
  const tjmMedian = getTjmMedian(form.tjm);
  const isTjmZero = tjmMedian === 0;
  const currentToolIds = form.currentTools.map((ct) => ct.toolId);
  const hasCurrentTools = currentToolIds.length > 0;
  const personaKey = (form.persona || "").toLowerCase();

  // Score every tool
  const scoredTools: ScoredTool[] = allTools.map((tool) => {
    const pertinenceScore = computePertinenceScore(tool, form);
    const { valueIndex, valueCreated } = computeValueIndex(tool, tjmMedian);
    // If TJM = 0, finalScore = pertinenceScore only
    const finalScore = isTjmZero
      ? pertinenceScore
      : Math.round(pertinenceScore * 0.6 + valueIndex * 0.4);

    return {
      tool,
      pertinenceScore,
      valueIndex: isTjmZero ? 0 : valueIndex,
      finalScore,
      valueCreated: isTjmZero ? 0 : Math.min(valueCreated, 2000), // Cap at 2000€
      action: "neutral" as ScoredTool["action"],
      cancelReason: undefined as string | undefined,
      cancelType: undefined as ScoredTool["cancelType"],
      replacedBy: undefined as string | undefined,
      freeAlt: null as Tool | null,
    };
  });

  // Build score map for current tools
  const scoreMap = new Map<string, number>();
  scoredTools.forEach((s) => scoreMap.set(s.tool.id, s.finalScore));

  // Get current tool objects
  const currentToolObjs = currentToolIds
    .map((id) => allTools.find((t) => t.id === id))
    .filter(Boolean) as Tool[];

  // Step 1: Detect doublons in current stack
  const doublons = detectDoublons(currentToolObjs, scoreMap);
  const doublonIds = new Set(doublons.map((d) => d.tool.id));

  // Step 2: Detect genuinely inadequate tools
  const genuinelyInadequate = currentToolObjs.filter((tool) => {
    if (doublonIds.has(tool.id)) return false;
    const hasOverlap = currentToolObjs.some(
      (other) =>
        other.id !== tool.id &&
        (other.covers || []).filter((c) => (tool.covers || []).includes(c)).length >= 1
    );
    const toolScore = scoreMap.get(tool.id) || 0;
    return toolScore < 40 && !hasOverlap && !tool.personas?.includes(personaKey);
  });

  // Mark cancellations on scored tools
  for (const d of doublons) {
    const scored = scoredTools.find((s) => s.tool.id === d.tool.id);
    if (scored) {
      scored.action = "cancel";
      scored.cancelType = "doublon";
      scored.replacedBy = d.replacedBy;
      scored.cancelReason = lang === "fr"
        ? d.message
        : `${d.replacedBy} already covers your needs. ${d.tool.name} is redundant.`;
    }
  }
  for (const tool of genuinelyInadequate) {
    const scored = scoredTools.find((s) => s.tool.id === tool.id);
    if (scored) {
      scored.action = "cancel";
      scored.cancelType = "inadequate";
      scored.cancelReason = lang === "fr"
        ? `Score faible (${scored.finalScore}/100) pour votre profil.`
        : `Low score (${scored.finalScore}/100) for your profile.`;
    }
  }

  // Free alternative: only if freeAlternative is non-null and different from tool slug
  for (const s of scoredTools) {
    if (s.action === "cancel" && s.tool.freeAlternative && s.tool.freeAlternative !== s.tool.slug && s.tool.freeAlternative !== s.tool.id) {
      const alt = allTools.find((t) => t.id === s.tool.freeAlternative || t.slug === s.tool.freeAlternative);
      if (alt) s.freeAlt = alt;
    }
  }

  // Recommendations: tools not in current stack with score > 60
  for (const s of scoredTools) {
    if (!currentToolIds.includes(s.tool.id) && s.finalScore > 60) {
      s.action = "recommend";
    }
  }

  // Cas 3: if fewer than 3 recommended tools with score > 60, lower threshold to 40
  const highRecommended = scoredTools.filter((s) => s.action === "recommend" && s.finalScore > 60);
  if (highRecommended.length < 3) {
    for (const s of scoredTools) {
      if (s.action === "neutral" && !currentToolIds.includes(s.tool.id) && s.finalScore > 40) {
        s.action = "recommend";
      }
    }
  }

  // Cas 6: Claire without tools — filter recommendations to specific categories
  if (personaKey === "claire" && !hasCurrentTools) {
    for (const s of scoredTools) {
      if (s.action === "recommend" && !["finance", "analytics", "security"].includes(s.tool.categoryId)) {
        s.action = "neutral";
      }
    }
  }

  const toCancel = scoredTools
    .filter((s) => s.action === "cancel")
    .sort((a, b) => a.finalScore - b.finalScore);
  const recommended = scoredTools
    .filter((s) => s.action === "recommend")
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 6);

  const stackHealthScore = computeStackHealthScore(currentToolIds, allTools, scoreMap, personaKey);
  const totalSavingsMonthly = toCancel.reduce((sum, s) => sum + (s.tool.defaultMonthlyPrice || 0), 0);

  // Cas 7: Alix with 2+ AI tools
  const aiToolsInStack = currentToolObjs.filter((t) => t.categoryId === "ai-general");
  const hasAiDoublon = personaKey === "alix" && aiToolsInStack.length >= 2;

  return {
    scoredTools,
    recommended,
    toCancel,
    stackHealthScore,
    totalSavingsMonthly,
    totalSavingsAnnual: totalSavingsMonthly * 12,
    personaMessage: getPersonaMessage(form.persona, lang),
    hasCurrentTools,
    isTjmZero,
    isStackFree: hasCurrentTools && currentToolObjs.every((t) => t.defaultMonthlyPrice === 0),
    hasAiDoublon,
    fewRecommendations: highRecommended.length < 3,
  };
}
