import type {
  Tool, SelectorFormData, ScoredTool, SelectorResults,
  Fiche, PrescriptionType, MigrationGuide,
  TjmRange, VerticalWeight, PrescriptionQuality, TechMaturity,
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

function getImplicitGoal(tjm: string | null, phase: string | null): string {
  if (phase === 'lancement') return 'reduce_costs';
  if (phase === 'regime') return 'reduce_costs';
  if (tjm === 'gt600' || tjm === '400-600') return 'save_time';
  return 'reduce_costs';
}

function buildProfile(form: SelectorFormData): UserProfile {
  const tjmMedian = getTjmMedian(form.tjm);
  return {
    verticals: form.verticals.map((v) => ({ id: v.id, weight: v.weight })),
    tjm: tjmMedian,
    phase: form.projectPhase,
    techMaturity: form.techMaturity,
    mainGoal: form.mainGoal ? normalizeGoal(form.mainGoal) : getImplicitGoal(form.tjm, form.projectPhase),
  };
}

/** Score a tool for a single vertical (0–1) */
function scoreToolForVertical(tool: Tool, verticalId: string, profile: UserProfile): number {
  if (!tool.verticals || !tool.verticals.includes(verticalId)) return 0;

  let score = 0.3;

  const vertical = VERTICALS[verticalId];
  if (vertical) {
    const verticalNeeds = vertical.functional_needs || [];
    const toolNeeds = tool.functional_needs || [];
    const coverage = toolNeeds.filter((n) => verticalNeeds.includes(n)).length;
    const coverageRatio = coverage / Math.max(verticalNeeds.length, 1);
    score += coverageRatio * 0.2;
  }

  const mainGoal = profile.mainGoal;
  if (mainGoal === "reduce_costs" && tool.defaultMonthlyPrice === 0) score += 0.2;
  if (mainGoal === "save_time" && (tool.timeGainedHoursPerMonth || 0) >= 5) score += 0.2;
  if (mainGoal === "simplify_stack" && (tool.covers?.length || 0) >= 3) score += 0.2;
  if (mainGoal === "find_better_tools") score += 0.1;

  if (profile.phase === "lancement" && tool.pricing?.free) score += 0.15;
  if (profile.phase === "croissance" && tool.functional_needs?.includes("automatisation")) score += 0.15;
  if (profile.phase === "regime") score += 0.05;

  if (profile.techMaturity === "zero-config") {
    const avoidText = (tool.verdict?.avoidIf || []).join(" ").toLowerCase();
    if (!avoidText.includes("configuration") && !avoidText.includes("complexe")) {
      score += 0.1;
    } else {
      score -= 0.15;
    }
  }

  if (tool.tool_type === "ia" && ["ai-builder", "developpeur-solo"].includes(verticalId)) score += 0.05;
  if (tool.tool_type === "gestion" && ["consultant-b2b", "daf-finance", "manager-dsi"].includes(verticalId)) score += 0.05;

  return Math.max(0, Math.min(1, score));
}

function scoreToolForProfile(tool: Tool, profile: UserProfile): number {
  if (!tool.verticals || tool.verticals.length === 0) {
    if (tool.personas && tool.personas.length > 0) return 30;
    return 0;
  }
  if (profile.verticals.length === 0) {
    return tool.verticals.length > 0 ? 20 : 0;
  }
  const verticalScores = profile.verticals.map(({ id, weight }) => {
    if (!tool.verticals.includes(id)) return 0;
    return scoreToolForVertical(tool, id, profile) * weight;
  });
  return Math.min(Math.round(Math.max(...verticalScores, 0) * 100), 100);
}

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

function scoreFinal(tool: Tool, profile: UserProfile): number {
  const pertinence = scoreToolForProfile(tool, profile);
  const { valueIndex: vi } = valueIndex(tool, profile);
  if (!profile.tjm || profile.tjm === 0) return pertinence;
  return Math.round(pertinence * 0.6 + vi * 0.4);
}

/* ═══════════════ V10 PRESCRIPTION LOGIC ═══════════════ */

/* Tools that should NEVER receive a prescription — infrastructure/payment */
const FORCE_SILENCE_IDS = ['stripe', 'google-drive', 'paypal', 'google-analytics'];

/**
 * Effective prescription quality, applying overrides.
 */
function effectivePrescriptionQuality(tool: Tool): PrescriptionQuality {
  if (FORCE_SILENCE_IDS.includes(tool.id)) return "silence";
  // Price < 2€ → not worth prescribing
  const price = tool.pricing_v5?.compare_price_monthly_eur ?? tool.defaultMonthlyPrice ?? 0;
  if (price > 0 && price < 2) return "silence";
  return tool.prescription_quality;
}

/**
 * Can this tool receive a prescription?
 * NEVER prescribe on silence, metier, or plugin.
 */
function canPrescribe(tool: Tool): boolean {
  if (effectivePrescriptionQuality(tool) === "silence") return false;
  if (tool.tool_type === "metier") return false;
  return true;
}

/**
 * Build a "ferme" prescription directly from prescription_output
 */
function buildFermePrescription(
  tool: Tool,
  allTools: Tool[],
  lang: "fr" | "en"
): Fiche | null {
  const po = tool.prescription_output;
  if (!po) return null;
  const isFr = lang === "fr";

  const altTool = allTools.find((t) => t.id === po.replacement_tool || t.slug === po.replacement_tool);
  const gain = po.gain_monthly_eur;
  const isUpgrade = gain < 0;

  let type: PrescriptionType = "replace-cheaper";
  if (po.mode === "replace_for_performance" || po.mode === "replace_for_performance_or_fit") {
    type = "replace-better";
  } else if (po.mode === "replace_for_simplicity") {
    type = "replace-better";
  }

  // Translate mode to human-readable
  const MODE_LABELS: Record<string, { fr: string; en: string }> = {
    'replace_for_cost': { fr: 'Moins cher pour le même usage', en: 'Cheaper for the same use' },
    'replace_for_performance_or_fit': { fr: 'Plus adapté à ton profil', en: 'Better suited to your profile' },
    'replace_for_simplicity': { fr: 'Simplifie ta stack', en: 'Simplifies your stack' },
    'replace_for_deeper_editor_ai': { fr: 'Plus puissant pour ton usage', en: 'More powerful for your use' },
    'replace_if_already_paying_ai_generalist': { fr: 'Déjà couvert par ton abonnement IA', en: 'Already covered by your AI subscription' },
    'replace_for_cost_or_complexity': { fr: 'Moins cher et plus simple', en: 'Cheaper and simpler' },
  };
  const modeLabel = MODE_LABELS[po.mode]?.[isFr ? 'fr' : 'en'] || po.mode.replace(/_/g, " ");

  const diagnostic = isFr
    ? `${tool.name} peut être remplacé par ${altTool?.name || po.replacement_tool}. ${modeLabel}.`
    : `${tool.name} can be replaced by ${altTool?.name || po.replacement_tool}. ${modeLabel}.`;

  const prescription = isUpgrade
    ? (isFr ? `Passer à ${altTool?.name || po.replacement_tool} (meilleur outil, même budget)` : `Switch to ${altTool?.name || po.replacement_tool} (better tool, same budget)`)
    : (isFr ? `Remplacer par ${altTool?.name || po.replacement_tool}` : `Replace with ${altTool?.name || po.replacement_tool}`);

  return {
    type,
    tool,
    diagnostic,
    prescription,
    alternative: altTool || null,
    gain: Math.max(gain, 0),
    badge: "Doublon",
    migrationGuide: tool.migrationGuide || null,
    // V10 enrichments from prescription_output
    gainMonthly: gain,
    gainAnnual: po.gain_annual_eur,
    priceTool: po.price_tool_eur,
    priceAlt: po.price_alt_eur,
    verifiedOn: po.verified_on,
  };
}

/* ═══════════════ SECTION 5: TJM-BASED SORT ═══════════════ */

function sortPrescriptionsByTjm(fiches: Fiche[], tjm: TjmRange | null): Fiche[] {
  if (tjm === "gt600" || tjm === "400-600") {
    // High TJM: hide tiny gains (<5€) unless upgrade (negative gain)
    const filtered = fiches.filter((f) => {
      const g = f.gainMonthly ?? f.gain;
      return Math.abs(g) >= 5 || g < 0;
    });
    // Upgrades first, then by absolute gain descending
    return filtered.sort((a, b) => {
      const ga = a.gainMonthly ?? a.gain;
      const gb = b.gainMonthly ?? b.gain;
      if (ga < 0 && gb >= 0) return -1;
      if (ga >= 0 && gb < 0) return 1;
      return Math.abs(gb) - Math.abs(ga);
    });
  }
  // Default: sort by gain descending
  return [...fiches].sort((a, b) => {
    const ga = a.gainMonthly ?? a.gain;
    const gb = b.gainMonthly ?? b.gain;
    return gb - ga;
  });
}

/* ═══════════════ SECTION 6: MATURITY FILTER ═══════════════ */

const REQUIRES_INTERMEDIATE = ['cal-com', 'posthog', 'metabase', 'retool', 'sentry', 'github', 'vercel', 'datadog'];
const REQUIRES_EXPERT = ['whisper', 'stable-diffusion', 'flux'];

export function needsMaturityWarning(altId: string, maturity: TechMaturity | string | null): boolean {
  if (!maturity) return false;
  if (maturity === 'expert') return false;
  if (maturity === 'intermediaire') return REQUIRES_EXPERT.includes(altId);
  // zero-config: warn for both intermediate and expert tools
  return REQUIRES_INTERMEDIATE.includes(altId) || REQUIRES_EXPERT.includes(altId);
}

/* ═══════════════ ANOMALY DETECTION (kept for non-prescription tools) ═══════════════ */

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

/**
 * V10: Detect doublons using substitution_cluster_v2 first, then fallback to functional_needs
 */
function detectDoublons(currentTools: Tool[], profile: UserProfile): DoublonResult[] {
  const doublons: DoublonResult[] = [];
  const compared = new Set<string>();

  // Phase 1: cluster-based detection
  const clusterMap: Record<string, Tool[]> = {};
  for (const t of currentTools) {
    if (t.substitution_cluster_v2) {
      if (!clusterMap[t.substitution_cluster_v2]) clusterMap[t.substitution_cluster_v2] = [];
      clusterMap[t.substitution_cluster_v2].push(t);
    }
  }
  for (const [, clusterTools] of Object.entries(clusterMap)) {
    if (clusterTools.length < 2) continue;
    const sorted = [...clusterTools].sort((a, b) => scoreFinal(b, profile) - scoreFinal(a, profile));
    const winner = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      const loser = sorted[i];
      const key = [winner.id, loser.id].sort().join("--");
      if (compared.has(key)) continue;
      compared.add(key);
      if (!canPrescribe(loser)) continue;
      const sharedNeeds = (winner.functional_needs || []).filter((n) =>
        (loser.functional_needs || []).includes(n)
      );
      doublons.push({
        type: "doublon", loser, winner, sharedNeeds,
        message: `${winner.name} couvre déjà : ${sharedNeeds.join(", ")}. ${loser.name} devient redondant.`,
      });
    }
  }

  // Phase 2: functional_needs fallback (only for tools not already in a cluster doublon)
  const doublonIds = new Set(doublons.map((d) => d.loser.id));
  for (let i = 0; i < currentTools.length; i++) {
    for (let j = i + 1; j < currentTools.length; j++) {
      const a = currentTools[i];
      const b = currentTools[j];
      if (doublonIds.has(a.id) || doublonIds.has(b.id)) continue;
      const key = [a.id, b.id].sort().join("--");
      if (compared.has(key)) continue;
      compared.add(key);

      const needsA = new Set(a.functional_needs || a.covers || []);
      const needsB = new Set(b.functional_needs || b.covers || []);
      const intersection = [...needsA].filter((n) => needsB.has(n));

      const overlapThreshold = (a.tool_type === 'plugin' || b.tool_type === 'plugin') ? 1 : 2;
      if (intersection.length >= overlapThreshold && a.tool_type === b.tool_type) {
        const scoreA = scoreFinal(a, profile);
        const scoreB = scoreFinal(b, profile);
        const [winner, loser] = scoreA >= scoreB ? [a, b] : [b, a];
        if (!canPrescribe(loser)) continue;
        if (!doublons.find((d) => d.loser.id === loser.id)) {
          doublons.push({
            type: "doublon", loser, winner, sharedNeeds: intersection,
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
        type: "doublon-ia", useCase, tools,
        message: `${tools.length} outils IA pour "${useCase}" : ${tools.map((t) => t.name).join(", ")}`,
      });
    }
  }
  return doublons;
}

function detectDormants(currentTools: Tool[], form: SelectorFormData): Tool[] {
  return currentTools.filter((tool) => {
    if (!canPrescribe(tool)) return false;
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
  currentTools: Tool[], profile: UserProfile,
  doublonIds: Set<string>, dormantIds: Set<string>
): Tool[] {
  return currentTools.filter((tool) => {
    if (!canPrescribe(tool)) return false;
    if (doublonIds.has(tool.id)) return false;
    if (dormantIds.has(tool.id)) return false;
    return scoreFinal(tool, profile) < 40;
  });
}

/* ═══════════════ PRESCRIPTION BUILDER ═══════════════ */

/**
 * Get a human-readable prescription reason (no raw scores).
 */
function getPrescriptionDiagnostic(
  tool: Tool, reason: "doublon" | "doublon-ia" | "dormant" | "inadapted",
  winner: Tool | null, profile: UserProfile, allTools: Tool[], lang: "fr" | "en"
): string {
  const isFr = lang === "fr";

  if (reason === "doublon" && winner) {
    return isFr
      ? `${winner.name} couvre déjà les mêmes besoins. ${tool.name} devient redondant.`
      : `${winner.name} already covers the same needs. ${tool.name} becomes redundant.`;
  }

  if (reason === "doublon-ia") {
    return isFr
      ? "Tu paies deux fois pour le même usage IA."
      : "You're paying twice for the same AI use case.";
  }

  if (reason === "dormant") {
    return isFr
      ? "Tu l'utilises rarement — ce coût n'est pas justifié."
      : "You rarely use it — this cost isn't justified.";
  }

  // inadapted — use verdict or functional reason, never raw score
  if (tool.freeAlternative) {
    return isFr
      ? "Une alternative gratuite couvre les mêmes besoins."
      : "A free alternative covers the same features.";
  }

  if (tool.verdict?.avoidIf?.[0]) {
    return tool.verdict.avoidIf[0];
  }

  return isFr
    ? "Cet outil n'est pas dans tes priorités actuelles."
    : "This tool isn't in your current priorities.";
}

function buildPrescription(
  tool: Tool, reason: "doublon" | "doublon-ia" | "dormant" | "inadapted",
  winner: Tool | null, profile: UserProfile, allTools: Tool[], lang: "fr" | "en"
): Fiche {
  const isFr = lang === "fr";
  const diagnostic = getPrescriptionDiagnostic(tool, reason, winner, profile, allTools, lang);

  if (reason === "dormant" && !tool.freeAlternative && !tool.betterAlternative) {
    return {
      type: "cancel", tool, diagnostic,
      prescription: isFr ? `Annuler ${tool.name}` : `Cancel ${tool.name}`,
      gain: tool.defaultMonthlyPrice, badge: "Dormant",
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

  if (tool.freeAlternative && tool.freeAlternative !== tool.id) {
    const altTool = allTools.find((t) => t.id === tool.freeAlternative);
    return {
      type: "replace-cheaper", tool, diagnostic,
      prescription: isFr ? `Remplacer par ${altTool?.name || tool.freeAlternative} (gratuit)` : `Replace with ${altTool?.name || tool.freeAlternative} (free)`,
      alternative: altTool || null,
      gain: tool.defaultMonthlyPrice,
      badge: reason === "doublon" ? "Doublon" : reason === "doublon-ia" ? "Doublon IA" : "Inadapté",
      migrationGuide: tool.migrationGuide || null,
    };
  }

  if (tool.betterAlternative) {
    const altTool = allTools.find((t) => t.id === tool.betterAlternative!.tool);
    const netGain = tool.defaultMonthlyPrice - (altTool?.defaultMonthlyPrice || 0);
    return {
      type: "replace-better", tool, diagnostic,
      prescription: isFr ? `Passer à ${altTool?.name || tool.betterAlternative.tool}` : `Switch to ${altTool?.name || tool.betterAlternative.tool}`,
      alternative: altTool || null, gain: netGain,
      badge: reason === "doublon" ? "Doublon" : "Inadapté",
      migrationGuide: tool.migrationGuide || null,
    };
  }

  if (tool.downgradePlan?.available) {
    return {
      type: "downgrade", tool, diagnostic,
      prescription: isFr ? `Passer au plan gratuit (${tool.downgradePlan.freeTier})` : `Switch to free plan (${tool.downgradePlan.freeTier})`,
      gain: tool.defaultMonthlyPrice, badge: "Inadapté",
    };
  }

  return {
    type: "cancel", tool, diagnostic,
    prescription: isFr ? `Annuler ${tool.name}` : `Cancel ${tool.name}`,
    gain: tool.defaultMonthlyPrice,
    badge: reason === "doublon" ? "Doublon" : reason === "doublon-ia" ? "Doublon IA" : reason === "dormant" ? "Dormant" : "Inadapté",
  };
}

/* ═══════════════ STACK HEALTH SCORE V10 ═══════════════ */

function computeStackHealth(
  currentTools: Tool[],
  prescriptions: Fiche[],
  doublonsIA: DoublonIAResult[],
  questionTools: Tool[],
): { score: number; label: string; color: string } {
  if (!currentTools || currentTools.length === 0) {
    return { score: 100, label: "Non évalué", color: "gray" };
  }

  let score = 100;

  // -10 per prescription (Phase 1 + Phase 3), max 30
  const allPrescriptionsCount = prescriptions.length;
  score -= Math.min(allPrescriptionsCount * 10, 30);

  // -5 per question tool (max 20)
  score -= Math.min(questionTools.length * 5, 20);

  // -8 per IA doublon (max 24)
  score -= Math.min(doublonsIA.length * 8, 24);

  const finalScore = Math.max(0, Math.min(100, score));
  if (finalScore >= 80) return { score: finalScore, label: "Optimisée", color: "green" };
  if (finalScore >= 60) return { score: finalScore, label: "Correcte", color: "blue" };
  if (finalScore >= 40) return { score: finalScore, label: "À revoir", color: "orange" };
  return { score: finalScore, label: "Critique", color: "red" };
}

/* ═══════════════ MAIN EXPORT ═══════════════ */

export function computeStackHealthScore(
  currentToolIds: string[], allTools: Tool[],
  scoreMap: Map<string, number>, _personaKey: string
): number {
  if (currentToolIds.length === 0) return -1;
  let health = 100;
  const currentTools = currentToolIds.map((id) => allTools.find((t) => t.id === id)).filter(Boolean) as Tool[];

  // Cluster-based doublon
  const clusters: Record<string, Tool[]> = {};
  for (const t of currentTools) {
    if (t.substitution_cluster_v2) {
      if (!clusters[t.substitution_cluster_v2]) clusters[t.substitution_cluster_v2] = [];
      clusters[t.substitution_cluster_v2].push(t);
    }
  }
  for (const [, tools] of Object.entries(clusters)) {
    if (tools.length >= 2) health -= 10;
  }

  // Ferme prescriptions penalty
  for (const t of currentTools) {
    if (effectivePrescriptionQuality(t) === "ferme") health -= 5;
  }

  // No IA doublon bonus
  const iaTools = currentTools.filter((t) => t.tool_type === "ia" && t.ia_use_case?.length);
  const useCases = new Set<string>();
  let hasDupIA = false;
  for (const t of iaTools) {
    for (const uc of t.ia_use_case!) {
      if (useCases.has(uc)) { hasDupIA = true; break; }
      useCases.add(uc);
    }
    if (hasDupIA) break;
  }
  if (!hasDupIA) health += 5;

  return Math.max(0, Math.min(100, health));
}

/**
 * Compute total monthly stack cost using pricing_v5, with bundle deduplication.
 */
function computeTotalStackCost(currentToolObjs: Tool[]): number {
  const bundleParentsInStack = new Set(currentToolObjs.map(t => t.id));
  return currentToolObjs.reduce((sum, tool) => {
    // If tool has a bundle_parent and that parent is in the stack, skip (already counted)
    if (tool.bundle_parent && bundleParentsInStack.has(tool.bundle_parent)) {
      return sum;
    }
    const price = tool.pricing_v5?.compare_price_monthly_eur
      ?? tool.defaultMonthlyPrice
      ?? 0;
    return sum + price;
  }, 0);
}

export function generateScoringResults(
  form: SelectorFormData, allTools: Tool[], lang: "fr" | "en" = "fr"
): SelectorResults {
  const profile = buildProfile(form);
  const isTjmZero = profile.tjm === 0;
  const currentToolIds = form.currentTools.map((ct) => ct.toolId);
  const hasCurrentTools = currentToolIds.length > 0;

  // Score every tool
  const scoredTools: ScoredTool[] = allTools.map((tool) => {
    const pertinenceScore = scoreToolForProfile(tool, profile);
    const { valueIndex: vi, valueCreated: vc } = valueIndex(tool, profile);
    const finalScore = isTjmZero
      ? pertinenceScore
      : Math.round(pertinenceScore * 0.6 + vi * 0.4);

    return {
      tool, pertinenceScore,
      valueIndex: isTjmZero ? 0 : vi,
      finalScore,
      valueCreated: isTjmZero ? 0 : Math.min(vc, 2000),
      action: "neutral" as ScoredTool["action"],
      cancelReason: undefined, cancelType: undefined,
      replacedBy: undefined, freeAlt: null, fiche: null,
    };
  });

  const scoreMap = new Map<string, number>();
  scoredTools.forEach((s) => scoreMap.set(s.tool.id, s.finalScore));

  const currentToolObjs = currentToolIds
    .map((id) => allTools.find((t) => t.id === id))
    .filter(Boolean) as Tool[];

  // ── FICHES: V10 PRESCRIPTION-FIRST LOGIC ──
  const fiches: Fiche[] = [];
  const prescribedIds = new Set<string>();

  // Phase 1: "ferme" prescriptions — direct from prescription_output
  for (const tool of currentToolObjs) {
    if (effectivePrescriptionQuality(tool) === "ferme" && canPrescribe(tool)) {
      const fiche = buildFermePrescription(tool, allTools, lang);
      if (fiche) {
        fiches.push(fiche);
        prescribedIds.add(tool.id);
      }
    }
  }

  // Phase 1b: Filter out tools that ARE the replacement_tool of another prescription
  const replacementToolIds = new Set(
    fiches
      .map(f => f.tool.prescription_output?.replacement_tool)
      .filter(Boolean) as string[]
  );
  // Remove fiches where the tool itself is a recommended replacement
  const filteredFiches = fiches.filter(f => !replacementToolIds.has(f.tool.id));
  fiches.length = 0;
  fiches.push(...filteredFiches);
  // Update prescribedIds
  prescribedIds.clear();
  fiches.forEach(f => prescribedIds.add(f.tool.id));

  // Phase 2: "question" tools — flagged but no prescription yet
  // (handled in UI — the ScoredTool will carry prescription_quality = "question")

  // Phase 3: anomaly detection for remaining prescribable tools
  const remainingTools = currentToolObjs.filter((t) => !prescribedIds.has(t.id) && canPrescribe(t));
  const doublons = detectDoublons(remainingTools, profile);
  const doublonsIA = detectDoublonsIA(currentToolObjs); // detect across all for banner
  const dormants = detectDormants(remainingTools, form);

  const doublonIds = new Set(doublons.map((d) => d.loser.id));
  const doublonIALosers = new Set<string>();
  for (const dia of doublonsIA) {
    const sorted = [...dia.tools].sort((a, b) => scoreFinal(b, profile) - scoreFinal(a, profile));
    for (let i = 1; i < sorted.length; i++) {
      if (!doublonIds.has(sorted[i].id) && !prescribedIds.has(sorted[i].id) && canPrescribe(sorted[i])) {
        doublonIALosers.add(sorted[i].id);
      }
    }
  }
  const dormantIds = new Set(dormants.map((d) => d.id));
  const inadapted = detectInadapted(remainingTools, profile, new Set([...doublonIds, ...doublonIALosers]), dormantIds);

  for (const d of doublons) {
    fiches.push(buildPrescription(d.loser, "doublon", d.winner, profile, allTools, lang));
    prescribedIds.add(d.loser.id);
  }
  for (const toolId of doublonIALosers) {
    const tool = currentToolObjs.find((t) => t.id === toolId);
    if (tool) {
      fiches.push(buildPrescription(tool, "doublon-ia", null, profile, allTools, lang));
      prescribedIds.add(tool.id);
    }
  }
  for (const tool of dormants) {
    if (!prescribedIds.has(tool.id)) {
      fiches.push(buildPrescription(tool, "dormant", null, profile, allTools, lang));
      prescribedIds.add(tool.id);
    }
  }
  for (const tool of inadapted) {
    fiches.push(buildPrescription(tool, "inadapted", null, profile, allTools, lang));
    prescribedIds.add(tool.id);
  }

  // V10 Section 6: Add maturity warnings to fiches
  for (const fiche of fiches) {
    if (fiche.alternative && needsMaturityWarning(fiche.alternative.id, form.techMaturity)) {
      fiche.maturityWarning = true;
    }
  }

  // V10 Section 5: Sort fiches by TJM logic
  const sortedFiches = sortPrescriptionsByTjm(fiches, form.tjm);
  fiches.length = 0;
  fiches.push(...sortedFiches);

  // Mark cancellations on scored tools
  for (const scored of scoredTools) {
    if (!prescribedIds.has(scored.tool.id)) continue;
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
    if (scored.tool.freeAlternative && scored.tool.freeAlternative !== scored.tool.id) {
      const alt = allTools.find((t) => t.id === scored.tool.freeAlternative || t.slug === scored.tool.freeAlternative);
      if (alt) scored.freeAlt = alt;
    }
  }

  // Count "question" tools for UI (using effective quality)
  const questionTools = currentToolObjs.filter(
    (t) => effectivePrescriptionQuality(t) === "question" && canPrescribe(t) && !prescribedIds.has(t.id)
  );

  // Recommendations — exclude tools from doublon clusters
  const doublonClusters = new Set<string>();
  for (const dia of doublonsIA) {
    for (const t of dia.tools) {
      if (t.substitution_cluster_v2) doublonClusters.add(t.substitution_cluster_v2);
    }
  }
  for (const d of doublons) {
    if (d.loser.substitution_cluster_v2) doublonClusters.add(d.loser.substitution_cluster_v2);
  }

  for (const s of scoredTools) {
    if (!currentToolIds.includes(s.tool.id) && s.finalScore > 60) {
      if (["satellite", "gestion", "ia"].includes(s.tool.tool_type)) {
        // Exclude tools from doublon clusters
        if (!doublonClusters.has(s.tool.substitution_cluster_v2 || "")) {
          s.action = "recommend";
        }
      }
    }
  }
  const highRecommended = scoredTools.filter((s) => s.action === "recommend" && s.finalScore > 60);
  if (highRecommended.length < 3) {
    for (const s of scoredTools) {
      if (s.action === "neutral" && !currentToolIds.includes(s.tool.id) && s.finalScore > 45) {
        if (["satellite", "gestion", "ia"].includes(s.tool.tool_type)) {
          if (!doublonClusters.has(s.tool.substitution_cluster_v2 || "")) {
            s.action = "recommend";
          }
        }
      }
    }
  }
  const recommended2 = scoredTools.filter((s) => s.action === "recommend");
  if (recommended2.length < 3) {
    const remaining = scoredTools
      .filter((s) => s.action === "neutral" && !currentToolIds.includes(s.tool.id) && !doublonClusters.has(s.tool.substitution_cluster_v2 || ""))
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 6 - recommended2.length);
    for (const s of remaining) s.action = "recommend";
  }

  const toCancel = scoredTools.filter((s) => s.action === "cancel").sort((a, b) => a.finalScore - b.finalScore);
  const recommended = scoredTools.filter((s) => s.action === "recommend").sort((a, b) => b.finalScore - a.finalScore).slice(0, 6);

  // Stack health V10 — new formula
  const healthResult = computeStackHealth(currentToolObjs, fiches, doublonsIA, questionTools);

  // V10 Section 9: Certified savings = ALL fiches with positive gain (Phase 1 + Phase 3)
  const certifiedSavingsMonthly = fiches.reduce((sum, f) => {
    const gain = f.gainMonthly ?? f.gain;
    return sum + Math.max(gain, 0);
  }, 0);
  const totalSavingsMonthly = Math.round(certifiedSavingsMonthly * 100) / 100;

  // Find most recent verified_on date across all fiches
  const verifiedDates = fiches.map((f) => f.verifiedOn).filter(Boolean) as string[];
  const latestVerifiedOn = verifiedDates.length > 0 ? verifiedDates.sort().reverse()[0] : null;
  const hasAiDoublon = doublonsIA.length > 0;
  const personaMessage = buildPersonaMessage(form, lang);

  // Compute total stack cost with pricing_v5 and bundle dedup
  const totalStackCost = computeTotalStackCost(currentToolObjs);

  return {
    scoredTools, recommended, toCancel, fiches,
    stackHealthScore: hasCurrentTools ? healthResult.score : -1,
    totalSavingsMonthly,
    totalSavingsAnnual: Math.round(totalSavingsMonthly * 12),
    personaMessage, hasCurrentTools, isTjmZero,
    isStackFree: hasCurrentTools && currentToolObjs.every((t) => (t.pricing_v5?.compare_price_monthly_eur ?? t.defaultMonthlyPrice ?? 0) === 0),
    hasAiDoublon,
    fewRecommendations: highRecommended.length < 3,
    questionTools,
    latestVerifiedOn,
    totalStackCost,
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
  return isFr ? `Analyse optimisée pour : ${joined}.` : `Analysis optimized for: ${joined}.`;
}
