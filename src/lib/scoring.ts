import type {
  Tool, SelectorFormData, ScoredTool, SelectorResults,
  Fiche, PrescriptionType, MigrationGuide,
  TjmRange, VerticalWeight,
} from "@/data/types";
import { TJM_OPTIONS, TIME_WEIGHTS } from "@/data/types";
import { verticals as VERTICALS } from "@/data/content";

/* ── helpers ── */

function getTjmMedian(tjm: TjmRange | null): number {
  if (!tjm) return 200;
  return TJM_OPTIONS.find((o) => o.value === tjm)?.median || 200;
}

function normalizeGoal(goal: string | null): string | null {
  if (!goal) return null;
  const map: Record<string, string> = {
    "reduce-costs": "reduce_costs", "reduce_costs": "reduce_costs",
    "save-time": "save_time", "save_time": "save_time",
    "simplify": "simplify_stack", "simplify_stack": "simplify_stack",
    "find-better": "find_better_tools", "find_better_tools": "find_better_tools",
  };
  return map[goal] || goal;
}

/* ═══════════════ SCORING v4 ═══════════════ */

interface UserProfile {
  verticals: { id: string; weight: number }[];
  tjm: number;
  phase: string | null;
  techMaturity: string | null;
  mainGoal: string | null;
}

function buildProfile(form: SelectorFormData): UserProfile {
  const tjmMedian = getTjmMedian(form.tjm);
  return {
    verticals: form.verticals.map((v) => ({ id: v.id, weight: v.weight })),
    tjm: tjmMedian,
    phase: form.projectPhase,
    techMaturity: form.techMaturity,
    mainGoal: normalizeGoal(form.mainGoal),
  };
}

/** Score a tool for a single vertical (0–1) */
function scoreToolForVertical(tool: Tool, verticalId: string, profile: UserProfile): number {
  if (!tool.verticals || !tool.verticals.includes(verticalId)) return 0;

  let score = 0.3; // base: tool is in the right vertical

  // +0.2 — coverage of functional_needs
  const vertical = VERTICALS[verticalId];
  if (vertical) {
    const verticalNeeds = vertical.functional_needs || [];
    const toolNeeds = tool.functional_needs || [];
    const coverage = toolNeeds.filter((n) => verticalNeeds.includes(n)).length;
    const coverageRatio = coverage / Math.max(verticalNeeds.length, 1);
    score += coverageRatio * 0.2;
  }

  // +0.2 — main goal
  const mainGoal = profile.mainGoal;
  if (mainGoal === "reduce_costs" && tool.defaultMonthlyPrice === 0) score += 0.2;
  if (mainGoal === "save_time" && (tool.timeGainedHoursPerMonth || 0) >= 5) score += 0.2;
  if (mainGoal === "simplify_stack" && (tool.covers?.length || 0) >= 3) score += 0.2;
  if (mainGoal === "find_better_tools") score += 0.1;

  // +0.15 — phase
  if (profile.phase === "lancement" && tool.pricing?.free) score += 0.15;
  if (profile.phase === "croissance" && tool.functional_needs?.includes("automatisation")) score += 0.15;
  if (profile.phase === "regime") score += 0.05;

  // +0.1 — tech maturity
  if (profile.techMaturity === "zero-config") {
    const avoidText = (tool.verdict?.avoidIf || []).join(" ").toLowerCase();
    if (!avoidText.includes("configuration") && !avoidText.includes("complexe")) {
      score += 0.1;
    } else {
      score -= 0.15;
    }
  }

  // +0.05 — tool_type/vertical coherence bonus
  if (tool.tool_type === "ia" && ["ai-builder", "developpeur-solo"].includes(verticalId)) score += 0.05;
  if (tool.tool_type === "gestion" && ["consultant-b2b", "daf-finance", "manager-dsi"].includes(verticalId)) score += 0.05;

  return Math.max(0, Math.min(1, score));
}

/** Composite score: MAX weighted across all profile verticals */
function scoreToolForProfile(tool: Tool, profile: UserProfile): number {
  if (!tool.verticals || tool.verticals.length === 0) {
    // Fallback for tools without verticals: use legacy personas
    if (tool.personas && tool.personas.length > 0) return 30;
    return 0;
  }

  if (profile.verticals.length === 0) {
    // No verticals selected — check if tool has any verticals at all
    return tool.verticals.length > 0 ? 20 : 0;
  }

  const verticalScores = profile.verticals.map(({ id, weight }) => {
    if (!tool.verticals.includes(id)) return 0;
    const baseScore = scoreToolForVertical(tool, id, profile);
    return baseScore * weight;
  });

  const maxScore = Math.max(...verticalScores, 0);
  return Math.min(Math.round(maxScore * 100), 100);
}

/** Value index (0–100) */
function valueIndex(tool: Tool, profile: UserProfile): { valueIndex: number; valueCreated: number } {
  if (!profile.tjm || profile.tjm === 0) return { valueIndex: 0, valueCreated: 0 };
  const tjmH = profile.tjm / 8;
  const hours = tool.timeGainedHoursPerMonth || 0;
  const valueCreated = hours * tjmH;
  const cost = tool.defaultMonthlyPrice + 1;
  const raw = valueCreated / cost;
  const normalized = Math.min(Math.round((raw / 50) * 100), 100);
  return { valueIndex: normalized, valueCreated: Math.round(valueCreated) };
}

/** Final composite score */
function scoreFinal(tool: Tool, profile: UserProfile): number {
  const pertinence = scoreToolForProfile(tool, profile);
  const { valueIndex: vi } = valueIndex(tool, profile);
  if (!profile.tjm || profile.tjm === 0) return pertinence;
  return Math.round(pertinence * 0.6 + vi * 0.4);
}

/* ═══════════════ ANOMALY DETECTION ═══════════════ */

interface DoublonResult {
  type: "doublon";
  loser: Tool;
  winner: Tool;
  sharedNeeds: string[];
  message: string;
}

interface DoublonIAResult {
  type: "doublon-ia";
  useCase: string;
  tools: Tool[];
  message: string;
}

function detectDoublons(currentTools: Tool[], profile: UserProfile): DoublonResult[] {
  const doublons: DoublonResult[] = [];
  const compared = new Set<string>();

  for (let i = 0; i < currentTools.length; i++) {
    for (let j = i + 1; j < currentTools.length; j++) {
      const a = currentTools[i];
      const b = currentTools[j];
      const key = [a.id, b.id].sort().join("--");
      if (compared.has(key)) continue;
      compared.add(key);

      const needsA = new Set(a.functional_needs || a.covers || []);
      const needsB = new Set(b.functional_needs || b.covers || []);
      const intersection = [...needsA].filter((n) => needsB.has(n));

      // Doublon if 2+ shared needs AND same tool_type
      if (intersection.length >= 2 && a.tool_type === b.tool_type) {
        const scoreA = scoreFinal(a, profile);
        const scoreB = scoreFinal(b, profile);
        const [winner, loser] = scoreA >= scoreB ? [a, b] : [b, a];

        if (!doublons.find((d) => d.loser.id === loser.id)) {
          doublons.push({
            type: "doublon",
            loser,
            winner,
            sharedNeeds: intersection,
            message: `${winner.name} couvre déjà : ${intersection.join(", ")}. ${loser.name} devient redondant.`,
          });
        }
      }
    }
  }
  return doublons;
}

function detectDoublonsIA(currentTools: Tool[]): DoublonIAResult[] {
  const iaTools = currentTools.filter((t) => t.tool_type === "ia" && t.ia_use_case?.length);
  const useCaseMap: Record<string, Tool[]> = {};

  for (const tool of iaTools) {
    for (const useCase of tool.ia_use_case!) {
      if (!useCaseMap[useCase]) useCaseMap[useCase] = [];
      useCaseMap[useCase].push(tool);
    }
  }

  const doublons: DoublonIAResult[] = [];
  for (const [useCase, tools] of Object.entries(useCaseMap)) {
    if (tools.length >= 2) {
      doublons.push({
        type: "doublon-ia",
        useCase,
        tools,
        message: `${tools.length} outils IA pour "${useCase}" : ${tools.map((t) => t.name).join(", ")}`,
      });
    }
  }
  return doublons;
}

function detectDormants(currentTools: Tool[], form: SelectorFormData): Tool[] {
  return currentTools.filter((tool) => {
    const stackEntry = form.currentTools.find((s) => s.toolId === tool.id);
    if (!stackEntry || stackEntry.usage !== "low") return false;
    if (tool.defaultMonthlyPrice === 0) return false;

    const otherTools = currentTools.filter((t) => t.id !== tool.id);
    const toolNeeds = new Set(tool.functional_needs || []);
    return otherTools.some((other) => {
      const otherNeeds = new Set(other.functional_needs || []);
      return [...toolNeeds].some((n) => otherNeeds.has(n));
    });
  });
}

function detectInadapted(
  currentTools: Tool[],
  profile: UserProfile,
  doublonIds: Set<string>,
  dormantIds: Set<string>
): Tool[] {
  return currentTools.filter((tool) => {
    if (doublonIds.has(tool.id)) return false;
    if (dormantIds.has(tool.id)) return false;
    if (tool.tool_type === "metier") return false;
    if (tool.tool_type === "plugin") return false;
    return scoreFinal(tool, profile) < 40;
  });
}

/* ═══════════════ PRESCRIPTION BUILDER ═══════════════ */

function buildPrescription(
  tool: Tool,
  reason: "doublon" | "doublon-ia" | "dormant" | "inadapted",
  winner: Tool | null,
  profile: UserProfile,
  allTools: Tool[],
  lang: "fr" | "en"
): Fiche {
  const isFr = lang === "fr";

  // TYPE 1 — Cancel without replacing (dormant with no alternative)
  if (reason === "dormant" && !tool.freeAlternative && !tool.betterAlternative) {
    return {
      type: "cancel",
      tool,
      diagnostic: isFr ? "Vous l'utilisez rarement. Ce coût n'est pas justifié." : "You rarely use it. This cost isn't justified.",
      prescription: isFr ? `Annuler ${tool.name}` : `Cancel ${tool.name}`,
      gain: tool.defaultMonthlyPrice,
      badge: "Dormant",
      migrationGuide: {
        steps: [
          isFr ? `Allez dans les paramètres de ${tool.name}` : `Go to ${tool.name} settings`,
          isFr ? "Section Billing → Annuler" : "Billing section → Cancel",
        ],
        timeEstimate: "5 minutes",
        dataLoss: isFr ? "Pensez à exporter vos données avant" : "Export your data first",
      },
    };
  }

  // TYPE 2 — Replace with free alternative
  if (tool.freeAlternative && tool.freeAlternative !== tool.id) {
    const altTool = allTools.find((t) => t.id === tool.freeAlternative);
    return {
      type: "replace-cheaper",
      tool,
      diagnostic: reason === "doublon"
        ? (isFr ? `${winner?.name || "Un autre outil"} couvre déjà ces besoins.` : `${winner?.name || "Another tool"} already covers these needs.`)
        : (isFr ? "Une alternative gratuite couvre les mêmes fonctionnalités." : "A free alternative covers the same features."),
      prescription: isFr ? `Remplacer par ${altTool?.name || tool.freeAlternative} (gratuit)` : `Replace with ${altTool?.name || tool.freeAlternative} (free)`,
      alternative: altTool || null,
      gain: tool.defaultMonthlyPrice,
      badge: reason === "doublon" ? "Doublon" : reason === "doublon-ia" ? "Doublon IA" : "Inadapté",
      migrationGuide: tool.migrationGuide || null,
    };
  }

  // TYPE 3 — Replace with better alternative
  if (tool.betterAlternative) {
    const altTool = allTools.find((t) => t.id === tool.betterAlternative!.tool);
    const netGain = tool.defaultMonthlyPrice - (altTool?.defaultMonthlyPrice || 0);
    return {
      type: "replace-better",
      tool,
      diagnostic: tool.betterAlternative.performanceGain || (isFr ? `${altTool?.name} est plus adapté à votre profil.` : `${altTool?.name} is better suited to your profile.`),
      prescription: isFr ? `Passer à ${altTool?.name || tool.betterAlternative.tool}` : `Switch to ${altTool?.name || tool.betterAlternative.tool}`,
      alternative: altTool || null,
      gain: netGain,
      badge: reason === "doublon" ? "Doublon" : "Inadapté",
      migrationGuide: tool.migrationGuide || null,
    };
  }

  // TYPE 4 — Downgrade plan
  if (tool.downgradePlan?.available) {
    return {
      type: "downgrade",
      tool,
      diagnostic: isFr ? "Votre usage ne justifie pas le plan payant." : "Your usage doesn't justify the paid plan.",
      prescription: isFr ? `Passer au plan gratuit (${tool.downgradePlan.freeTier})` : `Switch to free plan (${tool.downgradePlan.freeTier})`,
      gain: tool.defaultMonthlyPrice,
      badge: "Inadapté",
    };
  }

  // Fallback — cancel
  return {
    type: "cancel",
    tool,
    diagnostic: isFr
      ? `Score faible pour votre profil (${Math.round(scoreFinal(tool, profile))}/100).`
      : `Low score for your profile (${Math.round(scoreFinal(tool, profile))}/100).`,
    prescription: isFr ? `Annuler ${tool.name}` : `Cancel ${tool.name}`,
    gain: tool.defaultMonthlyPrice,
    badge: reason === "doublon" ? "Doublon" : reason === "doublon-ia" ? "Doublon IA" : reason === "dormant" ? "Dormant" : "Inadapté",
  };
}

/* ═══════════════ STACK HEALTH SCORE ═══════════════ */

function computeStackHealth(
  currentTools: Tool[],
  doublons: DoublonResult[],
  doublonsIA: DoublonIAResult[],
  dormants: Tool[],
  inadapted: Tool[],
  profile: UserProfile
): { score: number; label: string; color: string } {
  if (!currentTools || currentTools.length === 0) {
    return { score: 100, label: "Non évalué", color: "gray" };
  }

  let score = 100;
  score -= Math.min(doublons.length * 10, 30);
  score -= Math.min(doublonsIA.length * 8, 24);
  score -= Math.min(dormants.length * 5, 20);
  score -= Math.min(inadapted.length * 5, 20);

  // Bonus if stack is coherent
  const nonMetier = currentTools.filter((t) => t.tool_type !== "metier");
  if (nonMetier.length > 0) {
    const avgScore = nonMetier.reduce((sum, t) => sum + scoreFinal(t, profile), 0) / nonMetier.length;
    if (avgScore > 70) score += 5;
  }

  const finalScore = Math.max(0, Math.min(100, score));
  if (finalScore >= 80) return { score: finalScore, label: "Excellente", color: "green" };
  if (finalScore >= 60) return { score: finalScore, label: "Correcte", color: "blue" };
  if (finalScore >= 40) return { score: finalScore, label: "À revoir", color: "orange" };
  return { score: finalScore, label: "Critique", color: "red" };
}

/* ═══════════════ MAIN EXPORT ═══════════════ */

export function computeStackHealthScore(
  currentToolIds: string[],
  allTools: Tool[],
  scoreMap: Map<string, number>,
  _personaKey: string
): number {
  if (currentToolIds.length === 0) return -1;
  let health = 100;
  const currentTools = currentToolIds.map((id) => allTools.find((t) => t.id === id)).filter(Boolean) as Tool[];

  // Simple doublon check for health score
  for (let i = 0; i < currentTools.length; i++) {
    for (let j = i + 1; j < currentTools.length; j++) {
      const needsA = currentTools[i].functional_needs || currentTools[i].covers || [];
      const needsB = currentTools[j].functional_needs || currentTools[j].covers || [];
      const overlap = needsA.filter((n) => needsB.includes(n));
      if (overlap.length >= 2 && currentTools[i].tool_type === currentTools[j].tool_type) health -= 10;
    }
  }

  for (const t of currentTools) {
    if ((scoreMap.get(t.id) || 0) < 40 && t.tool_type !== "metier" && t.tool_type !== "plugin") health -= 5;
  }

  return Math.max(0, Math.min(100, health));
}

export function generateScoringResults(
  form: SelectorFormData,
  allTools: Tool[],
  lang: "fr" | "en" = "fr"
): SelectorResults {
  const profile = buildProfile(form);
  const isTjmZero = profile.tjm === 0;
  const currentToolIds = form.currentTools.map((ct) => ct.toolId);
  const hasCurrentTools = currentToolIds.length > 0;
  const isFr = lang === "fr";

  // Score every tool
  const scoredTools: ScoredTool[] = allTools.map((tool) => {
    const pertinenceScore = scoreToolForProfile(tool, profile);
    const { valueIndex: vi, valueCreated: vc } = valueIndex(tool, profile);
    const finalScore = isTjmZero
      ? pertinenceScore
      : Math.round(pertinenceScore * 0.6 + vi * 0.4);

    return {
      tool,
      pertinenceScore,
      valueIndex: isTjmZero ? 0 : vi,
      finalScore,
      valueCreated: isTjmZero ? 0 : Math.min(vc, 2000),
      action: "neutral" as ScoredTool["action"],
      cancelReason: undefined,
      cancelType: undefined,
      replacedBy: undefined,
      freeAlt: null,
      fiche: null,
    };
  });

  const scoreMap = new Map<string, number>();
  scoredTools.forEach((s) => scoreMap.set(s.tool.id, s.finalScore));

  const currentToolObjs = currentToolIds
    .map((id) => allTools.find((t) => t.id === id))
    .filter(Boolean) as Tool[];

  // ── ANOMALY DETECTION ──
  const doublons = detectDoublons(currentToolObjs, profile);
  const doublonsIA = detectDoublonsIA(currentToolObjs);
  const dormants = detectDormants(currentToolObjs, form);

  const doublonIds = new Set(doublons.map((d) => d.loser.id));
  const doublonIALosers = new Set<string>();
  for (const dia of doublonsIA) {
    // The lowest scoring tool is the loser
    const sorted = [...dia.tools].sort((a, b) => scoreFinal(b, profile) - scoreFinal(a, profile));
    for (let i = 1; i < sorted.length; i++) {
      if (!doublonIds.has(sorted[i].id)) doublonIALosers.add(sorted[i].id);
    }
  }
  const dormantIds = new Set(dormants.map((d) => d.id));
  const inadapted = detectInadapted(currentToolObjs, profile, new Set([...doublonIds, ...doublonIALosers]), dormantIds);

  // ── BUILD FICHES ──
  const fiches: Fiche[] = [];

  for (const d of doublons) {
    fiches.push(buildPrescription(d.loser, "doublon", d.winner, profile, allTools, lang));
  }
  for (const toolId of doublonIALosers) {
    const tool = currentToolObjs.find((t) => t.id === toolId);
    if (tool) fiches.push(buildPrescription(tool, "doublon-ia", null, profile, allTools, lang));
  }
  for (const tool of dormants) {
    if (!doublonIds.has(tool.id) && !doublonIALosers.has(tool.id)) {
      fiches.push(buildPrescription(tool, "dormant", null, profile, allTools, lang));
    }
  }
  for (const tool of inadapted) {
    fiches.push(buildPrescription(tool, "inadapted", null, profile, allTools, lang));
  }

  // Sort fiches by gain desc
  fiches.sort((a, b) => b.gain - a.gain);

  // Mark cancellations on scored tools
  const allCancelIds = new Set([
    ...doublonIds,
    ...doublonIALosers,
    ...dormantIds,
    ...inadapted.map((t) => t.id),
  ]);

  for (const scored of scoredTools) {
    if (!allCancelIds.has(scored.tool.id)) continue;
    scored.action = "cancel";
    const fiche = fiches.find((f) => f.tool.id === scored.tool.id);
    scored.fiche = fiche || null;
    scored.cancelReason = fiche?.diagnostic;
    if (doublonIds.has(scored.tool.id)) {
      scored.cancelType = "doublon";
      const d = doublons.find((x) => x.loser.id === scored.tool.id);
      scored.replacedBy = d?.winner.name;
    } else if (doublonIALosers.has(scored.tool.id)) {
      scored.cancelType = "doublon-ia";
    } else if (dormantIds.has(scored.tool.id)) {
      scored.cancelType = "dormant";
    } else {
      scored.cancelType = "inadequate";
    }

    // Free alternative
    if (scored.tool.freeAlternative && scored.tool.freeAlternative !== scored.tool.id) {
      const alt = allTools.find((t) => t.id === scored.tool.freeAlternative || t.slug === scored.tool.freeAlternative);
      if (alt) scored.freeAlt = alt;
    }
  }

  // Recommendations: tools NOT in current stack, NOT metier/plugin, score > 60
  for (const s of scoredTools) {
    if (!currentToolIds.includes(s.tool.id) && s.finalScore > 60) {
      // Filter: only satellite, gestion, ia for recommendations
      if (["satellite", "gestion", "ia"].includes(s.tool.tool_type)) {
        s.action = "recommend";
      }
    }
  }

  // Cas 3: if fewer than 3 recommendations, lower threshold
  const highRecommended = scoredTools.filter((s) => s.action === "recommend" && s.finalScore > 60);
  if (highRecommended.length < 3) {
    for (const s of scoredTools) {
      if (s.action === "neutral" && !currentToolIds.includes(s.tool.id) && s.finalScore > 45) {
        if (["satellite", "gestion", "ia"].includes(s.tool.tool_type)) {
          s.action = "recommend";
        }
      }
    }
  }
  // If still < 3, show top 6
  const recommended2 = scoredTools.filter((s) => s.action === "recommend");
  if (recommended2.length < 3) {
    const remaining = scoredTools
      .filter((s) => s.action === "neutral" && !currentToolIds.includes(s.tool.id))
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 6 - recommended2.length);
    for (const s of remaining) s.action = "recommend";
  }

  const toCancel = scoredTools.filter((s) => s.action === "cancel").sort((a, b) => a.finalScore - b.finalScore);
  const recommended = scoredTools.filter((s) => s.action === "recommend").sort((a, b) => b.finalScore - a.finalScore).slice(0, 6);

  // Stack health
  const healthResult = computeStackHealth(currentToolObjs, doublons, doublonsIA, dormants, inadapted, profile);
  const totalSavingsMonthly = fiches.reduce((sum, f) => sum + Math.max(f.gain, 0), 0);

  // AI doublon detection
  const hasAiDoublon = doublonsIA.length > 0;

  // Persona message (derived from family + verticals)
  const personaMessage = buildPersonaMessage(form, lang);

  return {
    scoredTools,
    recommended,
    toCancel,
    fiches,
    stackHealthScore: hasCurrentTools ? healthResult.score : -1,
    totalSavingsMonthly,
    totalSavingsAnnual: totalSavingsMonthly * 12,
    personaMessage,
    hasCurrentTools,
    isTjmZero,
    isStackFree: hasCurrentTools && currentToolObjs.every((t) => t.defaultMonthlyPrice === 0),
    hasAiDoublon,
    fewRecommendations: highRecommended.length < 3,
  };
}

function buildPersonaMessage(form: SelectorFormData, lang: "fr" | "en"): string {
  const isFr = lang === "fr";
  if (!form.family) {
    return isFr ? "Voici votre analyse de stack personnalisée." : "Here's your personalized stack analysis.";
  }
  const verticalLabels = form.verticals.map((v) => VERTICALS[v.id]?.label).filter(Boolean);
  if (verticalLabels.length === 0) {
    return isFr ? "Voici votre analyse de stack personnalisée." : "Here's your personalized stack analysis.";
  }
  const joined = verticalLabels.join(", ");
  return isFr
    ? `Analyse optimisée pour : ${joined}.`
    : `Analysis optimized for: ${joined}.`;
}
