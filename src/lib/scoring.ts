import type { Tool, SelectorFormData, ScoredTool, SelectorResults, Persona, TjmRange } from "@/data/types";
import { TJM_OPTIONS } from "@/data/types";

function getTjmMedian(tjm: TjmRange | null): number {
  if (!tjm) return 200; // fallback
  const opt = TJM_OPTIONS.find((o) => o.value === tjm);
  return opt?.median || 200;
}

function computePertinenceScore(tool: Tool, form: SelectorFormData): number {
  let score = 0;
  const persona = form.persona;
  const mainGoal = form.mainGoal;
  const phase = form.projectPhase;
  const maturity = form.techMaturity;

  // +25 if persona maps to relevantFor
  const personaToRole: Record<string, string[]> = {
    sofia: ["writer", "consultant", "content-creator", "other", "solo", "all"],
    marc: ["tech", "consultant", "other", "all"],
    theo: ["tech", "designer", "content-creator", "all"],
    alix: ["tech", "content-creator", "all"],
    claire: ["consultant", "other", "all"],
  };
  const roles = personaToRole[persona || ""] || [];
  if (roles.some((r) => tool.relevantFor.includes(r))) score += 25;

  // +20 based on mainGoal
  if (mainGoal === "reduce-costs" && tool.defaultMonthlyPrice === 0) score += 20;
  if (mainGoal === "save-time" && (tool.timeGainedHoursPerMonth || 0) >= 5) score += 20;
  if (mainGoal === "simplify" && (tool.covers || []).length > 3) score += 20;

  // +15 persona-specific
  if (persona === "alix" && tool.categoryId === "ai-general") score += 15;
  if (persona === "sofia" && (tool.relevantFor.includes("solo") || tool.relevantFor.includes("all") || tool.relevantFor.includes("writer"))) score += 15;

  // +10 phase bonuses
  if (phase === "lancement" && tool.pricing?.free) score += 10;
  if (phase === "croissance") {
    const covers = (tool.covers || []).map((c) => c.toLowerCase());
    if (covers.includes("automatisation") || covers.includes("automation")) score += 10;
  }

  // Tech maturity
  const avoidIf = (tool.verdict?.avoidIf || []).map((s) => s.toLowerCase()).join(" ");
  if (maturity === "zero-config") {
    const hasComplex = avoidIf.includes("configuration") || avoidIf.includes("complexe");
    if (!hasComplex) score += 10;
    else score -= 15;
  }

  return Math.max(0, Math.min(100, score));
}

function computeValueIndex(tool: Tool, tjmMedian: number): { valueIndex: number; valueCreated: number } {
  const tjmH = tjmMedian / 8;
  const hours = tool.timeGainedHoursPerMonth || 0;
  const valueCreated = hours * tjmH;
  const raw = valueCreated / (tool.defaultMonthlyPrice + 1);
  const normalized = Math.min((raw / 30) * 100, 100);
  return { valueIndex: Math.round(normalized), valueCreated: Math.round(valueCreated) };
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
  scoredMap: Map<string, ScoredTool>
): number {
  if (currentToolIds.length === 0) return -1; // no stack declared

  let health = 100;

  // Get current tools data
  const currentTools = currentToolIds.map((id) => allTools.find((t) => t.id === id)).filter(Boolean) as Tool[];

  // -10 per redundancy (2 tools with >=2 common covers)
  for (let i = 0; i < currentTools.length; i++) {
    for (let j = i + 1; j < currentTools.length; j++) {
      const coversA = currentTools[i].covers || [];
      const coversB = currentTools[j].covers || [];
      const common = coversA.filter((c) => coversB.includes(c));
      if (common.length >= 2) health -= 10;
    }
  }

  // -5 per tool with finalScore < 40
  for (const id of currentToolIds) {
    const scored = scoredMap.get(id);
    if (scored && scored.finalScore < 40) health -= 5;
  }

  // -5 per paid tool >20€ without free alternative
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
  const currentToolIds = form.currentTools.map((ct) => ct.toolId);
  const hasCurrentTools = currentToolIds.length > 0;

  // Score every tool
  const scoredTools: ScoredTool[] = allTools.map((tool) => {
    const pertinenceScore = computePertinenceScore(tool, form);
    const { valueIndex, valueCreated } = computeValueIndex(tool, tjmMedian);
    const finalScore = Math.round(pertinenceScore * 0.6 + valueIndex * 0.4);

    let action: ScoredTool["action"] = "neutral";
    let cancelReason: string | undefined;
    let freeAlt: Tool | null = null;

    // Only mark as cancel if it's in the user's current tools
    if (currentToolIds.includes(tool.id)) {
      if (finalScore < 40) {
        action = "cancel";
        cancelReason = lang === "fr"
          ? `Score faible (${finalScore}/100) pour votre profil.`
          : `Low score (${finalScore}/100) for your profile.`;
      }
      if (tool.freeAlternative) {
        const alt = allTools.find((t) => t.id === tool.freeAlternative || t.slug === tool.freeAlternative);
        if (alt) {
          const altCovers = alt.covers || [];
          const toolCovers = tool.covers || [];
          const commonCovers = toolCovers.filter((c) => altCovers.includes(c));
          if (commonCovers.length > 0) {
            action = "cancel";
            freeAlt = alt;
            cancelReason = lang === "fr"
              ? `Vous pourriez économiser ${tool.defaultMonthlyPrice}€/mois en passant à ${alt.name}.`
              : `You could save €${tool.defaultMonthlyPrice}/mo by switching to ${alt.name}.`;
          }
        }
      }
    }

    if (finalScore > 60 && !currentToolIds.includes(tool.id)) {
      action = "recommend";
    }

    return { tool, pertinenceScore, valueIndex, finalScore, valueCreated, action, cancelReason, freeAlt };
  });

  // Build scored map
  const scoredMap = new Map<string, ScoredTool>();
  scoredTools.forEach((s) => scoredMap.set(s.tool.id, s));

  const toCancel = scoredTools.filter((s) => s.action === "cancel").sort((a, b) => a.finalScore - b.finalScore);
  const recommended = scoredTools
    .filter((s) => s.action === "recommend")
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 6);

  const stackHealthScore = computeStackHealthScore(currentToolIds, allTools, scoredMap);
  const totalSavingsMonthly = toCancel.reduce((sum, s) => sum + (s.tool.defaultMonthlyPrice || 0), 0);

  return {
    scoredTools,
    recommended,
    toCancel,
    stackHealthScore,
    totalSavingsMonthly,
    totalSavingsAnnual: totalSavingsMonthly * 12,
    personaMessage: getPersonaMessage(form.persona, lang),
    hasCurrentTools,
  };
}
