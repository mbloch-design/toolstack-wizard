import { useParams, Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools } from "@/hooks/useSupabaseData";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { ChevronDown } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";
import type { Tool } from "@/data/types";
import { FEATURED_COMPARISONS as COMPARISONS } from "@/data/comparisons";
import { BATTLE_COMPARISON_DATA, type BattleComparisonSlug } from "@/data/comparisonBattles";

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function findTool(tools: Tool[], idOrSlug: string): Tool | undefined {
  return tools.find((t) => t.id === idOrSlug || t.slug === idOrSlug);
}
function getPrice(tool: Tool): string {
  const v5 = tool.pricing_v5?.compare_price_monthly_eur;
  if (v5 != null && v5 > 0) return `${v5}€/mois`;
  if (tool.defaultMonthlyPrice > 0) return `${tool.defaultMonthlyPrice}€/mois`;
  return "Gratuit";
}
function getPriceNum(tool: Tool): number {
  return tool.pricing_v5?.compare_price_monthly_eur || tool.defaultMonthlyPrice || 0;
}
function getLearningCurve(row?: CompareTableRow, lang: "fr" | "en" = "fr"): string {
  if (!row) return lang === "fr" ? "À cadrer" : "Scope first";
  return lang === "fr" ? `${row.toolA} / ${row.toolB}` : `${row.toolAEn} / ${row.toolBEn}`;
}
function getToolTrimRisk(content: CompareEditorialContent, lang: "fr" | "en"): string {
  return lang === "fr" ? content.quickVerdictAvoid : content.quickVerdictAvoidEn;
}
function getToolBestFor(content: CompareEditorialContent, side: "A" | "B", lang: "fr" | "en"): string {
  if (side === "A") {
    const useCases = lang === "fr" ? content.toolAUseCases : content.toolAUseCasesEn;
    return useCases[0] || (lang === "fr" ? content.quickVerdictA : content.quickVerdictAEn);
  }
  const useCases = lang === "fr" ? content.toolBUseCases : content.toolBUseCasesEn;
  return useCases[0] || (lang === "fr" ? content.quickVerdictB : content.quickVerdictBEn);
}
function getDefaultChoice(content: CompareEditorialContent, toolA: Tool, toolB: Tool, lang: "fr" | "en"): string {
  const signal = [
    lang === "fr" ? content.finalRecommendation : content.finalRecommendationEn,
    lang === "fr" ? content.tippingPoint.defaultChoice : content.tippingPoint.defaultChoiceEn,
  ].join(" ").toLowerCase();
  if (signal.includes(toolA.name.toLowerCase())) return toolA.name;
  if (signal.includes(toolB.name.toLowerCase())) return toolB.name;
  const priceA = getPriceNum(toolA);
  const priceB = getPriceNum(toolB);
  if (priceA !== priceB) return priceA <= priceB ? toolA.name : toolB.name;
  return lang === "fr" ? "Selon usage" : "By use case";
}
function getCriterionLevels(criterion: CompareDecisiveCriterion, toolA: Tool, toolB: Tool, lang: "fr" | "en") {
  const decision = (lang === "fr" ? criterion.decision : criterion.decisionEn).toLowerCase();
  const hasA = decision.includes(toolA.name.toLowerCase());
  const hasB = decision.includes(toolB.name.toLowerCase());
  if (hasA && !hasB) return { toolA: "advantage", toolB: "sufficient", winner: "A" as const };
  if (hasB && !hasA) return { toolA: "sufficient", toolB: "advantage", winner: "B" as const };
  return { toolA: "context", toolB: "context", winner: "tie" as const };
}
function getLevelLabel(level: "advantage" | "sufficient" | "context", lang: "fr" | "en"): string {
  if (level === "advantage") return lang === "fr" ? "Avantage" : "Advantage";
  if (level === "sufficient") return lang === "fr" ? "Suffisant" : "Enough";
  return lang === "fr" ? "Dépend" : "Depends";
}
function getBudgetSignal(_toolA: Tool, _toolB: Tool, lang: "fr" | "en"): string {
  // Return an editorial signal, not a raw price benchmark.
  // Enriched pages override this via aglanceBudget in the battle JSON.
  return lang === "fr"
    ? "Comparer le plan utile, pas l'entrée"
    : "Compare by actual plan, not entry price";
}
function getDecisionTableRows(rows: CompareTableRow[]): CompareTableRow[] {
  const preferred = [
    "Usage principal",
    "Meilleur pour",
    "Limite principale",
    "Prise en main",
    "Collaboration équipe",
    "Automatisations",
    "Budget solo / gratuit",
    "Base de données structurée",
    "Scalabilité des données",
    "Prix de départ",
  ];
  const selected = preferred
    .map((criterion) => rows.find((row) => row.criterion === criterion))
    .filter((row): row is CompareTableRow => Boolean(row));
  const seen = new Set(selected.map((row) => row.criterion));
  rows.forEach((row) => {
    if (selected.length < 9 && !seen.has(row.criterion)) selected.push(row);
  });
  return selected.slice(0, 9);
}
function getPitfalls(content: CompareEditorialContent, toolA: Tool, toolB: Tool, lang: "fr" | "en"): string[] {
  const avoid = lang === "fr" ? content.quickVerdictAvoid : content.quickVerdictAvoidEn;
  const limitsA = lang === "fr" ? content.limitsA : content.limitsAEn;
  const limitsB = lang === "fr" ? content.limitsB : content.limitsBEn;
  const fallback = lang === "fr"
    ? [
        `Choisir ${toolA.name} ou ${toolB.name} pour une seule tâche simple.`,
        "Payer trop tôt pour des automatisations ou fonctions avancées.",
        "Garder deux outils qui couvrent la même étape du workflow.",
      ]
    : [
        `Choosing ${toolA.name} or ${toolB.name} for one simple task.`,
        "Paying too early for automations or advanced features.",
        "Keeping two tools that cover the same workflow step.",
      ];
  return [avoid, ...limitsA.slice(0, 2), ...limitsB.slice(0, 2), ...fallback]
    .filter(Boolean)
    .slice(0, 5);
}

/* ─── Editorial content types ────────────────────────────────────────────── */
interface CompareTableRow {
  criterion: string; criterionEn: string;
  toolA: string; toolAEn: string;
  toolANote?: string; toolANoteEn?: string;
  toolB: string; toolBEn: string;
  toolBNote?: string; toolBNoteEn?: string;
  winner: "A" | "B" | "tie"; verdictLabel: string; verdictLabelEn: string;
}
/** Battle JSON cell value — either a flat string or a structured title+note */
type BattleRowCellValue = string | { title: string; note?: string };
function cellTitle(v: BattleRowCellValue): string {
  return typeof v === "string" ? v : v.title;
}
function cellNote(v: BattleRowCellValue): string | undefined {
  return typeof v === "string" ? undefined : v.note;
}
interface CompareProfile {
  persona: string; personaEn: string;
  choice: string; reason: string; reasonEn: string;
  limit: string; limitEn: string;
}
interface CompareFaqItem { q: string; qEn: string; a: string; aEn: string; }
interface CompareAlt { slug: string; name: string; reason: string; reasonEn: string; price?: string; }
interface CompareDecisionRow {
  context: string; contextEn: string;
  choice: string; choiceEn: string;
}
interface CompareDecisiveCriterion {
  title: string; titleEn: string;
  toolA: string; toolAEn: string;
  toolB: string; toolBEn: string;
  decision: string; decisionEn: string;
}
interface CompareTippingPoint {
  title: string; titleEn: string;
  defaultChoice: string; defaultChoiceEn: string;
  switchWhen: string; switchWhenEn: string;
  signals: string[]; signalsEn: string[];
}
interface CompareCostRealityRow {
  label: string; labelEn: string;
  toolA: string; toolAEn: string;
  toolB: string; toolBEn: string;
  recommendation: string; recommendationEn: string;
}
interface CompareRiskPoint {
  mistake: string; mistakeEn: string;
  consequence: string; consequenceEn: string;
  recommendation: string; recommendationEn: string;
}

interface CompareEditorialContent {
  /* ── Hero framing ── */
  framing: string; framingEn: string;
  verdictShort: string; verdictShortEn: string;
  finalRecommendation: string; finalRecommendationEn: string;
  /* ── Quick verdict (VS module + verdict section) ── */
  quickVerdictA: string; quickVerdictAEn: string;
  quickVerdictB: string; quickVerdictBEn: string;
  quickVerdictAvoid: string; quickVerdictAvoidEn: string;
  /* ── Tool overview (new) ── */
  toolADesc: string; toolADescEn: string;
  toolAUseCases: string[]; toolAUseCasesEn: string[];
  toolBDesc: string; toolBDescEn: string;
  toolBUseCases: string[]; toolBUseCasesEn: string[];
  /* ── Comparison table ── */
  tableRows: CompareTableRow[];
  /* ── Pros + cons ── */
  prosA: string[]; prosAEn: string[];
  limitsA: string[]; limitsAEn: string[];
  prosB: string[]; prosBEn: string[];
  limitsB: string[]; limitsBEn: string[];
  /* ── Decision rows (new) ── */
  decisionRows: CompareDecisionRow[];
  decisiveCriteria: CompareDecisiveCriterion[];
  tippingPoint: CompareTippingPoint;
  costReality: CompareCostRealityRow[];
  tooltrimRisks: CompareRiskPoint[];
  /* ── Profiles ── */
  profiles: CompareProfile[];
  /* ── Pricing ── */
  pricingFraming: string; pricingFramingEn: string;
  pricingToolANotes: string; pricingToolANotesEn: string;
  pricingToolBNotes: string; pricingToolBNotesEn: string;
  pricingReco: string; pricingRecoEn: string;
  /* ── Structured verdict bullet lists (from verdict object) ── */
  chooseAIfList: string[];
  chooseBIfList: string[];
  avoidAIfList: string[];
  avoidBIfList: string[];
  avoidBothIfList: string[];
  /* ── Hero signal overrides (from tooltrimAtAGlance) ── */
  aglanceBestForA?: string;
  aglanceBestForB?: string;
  aglanceBudget?: string;
  aglanceRisk?: string;
  aglanceDefaultLabel?: string;
  aglanceLevel?: string;
  aglanceHeroPromise?: string;
  aglanceHeroBrief?: string;   // short editorial context paragraph below the subtitle
  aglancePositionA?: string;
  aglancePositionB?: string;
  aglanceContract?: string;
  /* ── Verdict card content (2-card layout) ── */
  verdictCardTitleA?: string; verdictCardTitleAEn?: string;
  verdictCardTitleB?: string; verdictCardTitleBEn?: string;
  verdictCardTextA?: string; verdictCardTextAEn?: string;
  verdictCardTextB?: string; verdictCardTextBEn?: string;
  verdictWarning?: string; verdictWarningEn?: string;
  /* ── Alternatives + FAQ ── */
  alternatives: CompareAlt[];
  faq: CompareFaqItem[];
}

interface BattleFit {
  fit: string;
  reason: string;
}
interface BattleUseCaseScore {
  useCase: string;
  toolA: BattleFit;
  toolB: BattleFit;
  winner: "toolA" | "toolB" | "tie" | "depends";
  tooltrimDecision: string;
}
interface BattleRawData {
  slug: string;
  tooltrimAtAGlance?: {
    defaultChoice?: string;
    defaultChoiceLabel?: string;
    bestForToolA?: string;
    bestForToolB?: string;
    budgetReality?: string;
    budgetShort?: string;
    complexity?: string;
    complexityLabel?: string;
    mainRisk?: string;
    decisionSummary?: string;
    heroPromise?: string;
    heroBrief?: string;         // editorial context paragraph shown below the subtitle
    heroPositionA?: string;
    heroPositionB?: string;
    heroContract?: string;
    /* ── Verdict card overrides ── */
    verdictCardTitleA?: string;   // card title for toolA choice card (e.g. "Le choix polyvalent")
    verdictCardTitleB?: string;   // card title for toolB choice card
    verdictCardTextA?: string;    // card body for toolA (1 short sentence)
    verdictCardTextB?: string;    // card body for toolB
    verdictWarning?: string;      // full-width warning: don't pay for both
  };
  verdict?: {
    summary?: string;
    chooseAIf?: string[];
    chooseBIf?: string[];
    avoidAIf?: string[];
    avoidBIf?: string[];
    avoidBothIf?: string[];
    finalRecommendation?: string;
  };
  pricingComparison?: {
    entryLevel?: { toolA?: string; toolB?: string };
    freePlanReality?: { toolA?: string; toolB?: string };
    whenPaidBecomesNecessary?: { toolA?: string; toolB?: string };
    hiddenCosts?: { toolA?: string; toolB?: string };
    costRecommendations?: {
      freePlan?: string;
      whenPaying?: string;
      hiddenCost?: string;
    };
    tooltrimNote?: string;
  };
  tools: {
    toolA: {
      name: string;
      coreStrengths?: string[];
      coreLimits?: string[];
      freePlan?: { summary?: string };
      paidPlans?: Array<{ name: string; priceMonthly: number | null; currency: string; billingUnit?: string }>;
    };
    toolB: {
      name: string;
      coreStrengths?: string[];
      coreLimits?: string[];
      freePlan?: { summary?: string };
      paidPlans?: Array<{ name: string; priceMonthly: number | null; currency: string; billingUnit?: string }>;
    };
  };
  comparison: {
    falseSimilarity?: string;
    mainDifference: string;
    decisionSummary: string;
    finalRecommendation?: string;
    chooseAIf: string[];
    chooseBIf: string[];
    avoidBothIf?: string[];
    scoreByUseCase?: BattleUseCaseScore[];
    decisiveCriteria?: Array<{
      label: string;
      toolA: string;
      toolB: string;
      decision: string;
    }>;
    tippingPoint?: {
      defaultPosition?: string;
      switchWhen?: string;
      keepBothIf?: string;
      warning?: string;
      examples?: string[];
    };
    costReality?: {
      toolA?: {
        freePlanReality?: string;
        whenPaidBecomesNecessary?: string;
        hiddenCost?: string;
        pricingRisk?: string;
      };
      toolB?: {
        freePlanReality?: string;
        whenPaidBecomesNecessary?: string;
        hiddenCost?: string;
        pricingRisk?: string;
      };
      duplicateCostWarning?: string;
      tooltrimNote?: string;
    };
    pitfalls?: Array<{
      title: string;
      consequence: string;
      recommendation: string;
    }>;
  };
  comparisonRows?: Array<{
    criterion: string;
    toolA: BattleRowCellValue;
    toolB: BattleRowCellValue;
    tooltrimDecision: string;
    showInMainTable?: boolean;
  }>;
  related?: {
    alternatives?: Array<string | { name: string; reason?: string; reasonEn?: string }>;
    otherComparisons?: string[];
  };
  faq?: Array<{
    question: string;
    answer: string;
  }>;
}

function asEnglishCopy(value: string): string {
  return value;
}
function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
function getBattleWinner(decision: string, toolAName: string, toolBName: string): CompareTableRow["winner"] {
  const normalized = decision.toLowerCase();
  const hasA = normalized.includes(toolAName.toLowerCase());
  const hasB = normalized.includes(toolBName.toLowerCase());
  if (hasA && !hasB) return "A";
  if (hasB && !hasA) return "B";
  return "tie";
}
function formatPlanSummary(tool: BattleRawData["tools"]["toolA"]): string {
  const free = tool.freePlan?.summary || "Plan gratuit ou prix à vérifier selon volume.";
  const firstPaid = tool.paidPlans?.find((plan) => plan.priceMonthly && plan.priceMonthly > 0);
  if (!firstPaid) return free;
  return `${free} Premier plan payant : ${firstPaid.priceMonthly} ${firstPaid.currency}/mois.`;
}
function buildBattleEditorialContent(data: BattleRawData): CompareEditorialContent {
  const toolAName = data.tools.toolA.name;
  const toolBName = data.tools.toolB.name;
  const comparison = data.comparison;
  const avoidBoth = comparison.avoidBothIf?.[0] || "Aucun des deux si le besoin principal n'est pas encore récurrent.";
  const scoreCriteria = comparison.scoreByUseCase?.length
    ? comparison.scoreByUseCase.map((score) => ({
        title: score.useCase,
        toolA: score.toolA.reason,
        toolB: score.toolB.reason,
        decision: score.tooltrimDecision,
      }))
    : comparison.decisiveCriteria || [];
  const tableRows = (data.comparisonRows || [])
    .filter((row) => row.showInMainTable !== false)
    .slice(0, 8)
    .map((row) => {
      const winner = getBattleWinner(row.tooltrimDecision, toolAName, toolBName);
      const aTitle = cellTitle(row.toolA);
      const aNoteRaw = cellNote(row.toolA);
      const bTitle = cellTitle(row.toolB);
      const bNoteRaw = cellNote(row.toolB);
      return {
        criterion: row.criterion,
        criterionEn: asEnglishCopy(row.criterion),
        toolA: aTitle,
        toolAEn: asEnglishCopy(aTitle),
        toolANote: aNoteRaw,
        toolANoteEn: aNoteRaw ? asEnglishCopy(aNoteRaw) : undefined,
        toolB: bTitle,
        toolBEn: asEnglishCopy(bTitle),
        toolBNote: bNoteRaw,
        toolBNoteEn: bNoteRaw ? asEnglishCopy(bNoteRaw) : undefined,
        winner,
        verdictLabel: row.tooltrimDecision,
        verdictLabelEn: asEnglishCopy(row.tooltrimDecision),
      };
    });
  const fallbackRows = scoreCriteria.slice(0, 8).map((criterion) => {
    const winner = getBattleWinner(criterion.decision, toolAName, toolBName);
    return {
      criterion: criterion.title,
      criterionEn: asEnglishCopy(criterion.title),
      toolA: criterion.toolA,
      toolAEn: asEnglishCopy(criterion.toolA),
      toolB: criterion.toolB,
      toolBEn: asEnglishCopy(criterion.toolB),
      winner,
      verdictLabel: criterion.decision,
      verdictLabelEn: asEnglishCopy(criterion.decision),
    };
  });
  const cost = comparison.costReality;
  const pc = data.pricingComparison;
  const verd = data.verdict;
  const aglance = data.tooltrimAtAGlance;
  const tipping = comparison.tippingPoint;
  const alternatives = (data.related?.alternatives || []).slice(0, 6);

  return {
    framing: comparison.falseSimilarity || comparison.mainDifference,
    framingEn: asEnglishCopy(comparison.falseSimilarity || comparison.mainDifference),
    verdictShort: verd?.summary || comparison.decisionSummary,
    verdictShortEn: asEnglishCopy(verd?.summary || comparison.decisionSummary),
    finalRecommendation: verd?.finalRecommendation || comparison.finalRecommendation || comparison.decisionSummary,
    finalRecommendationEn: asEnglishCopy(verd?.finalRecommendation || comparison.finalRecommendation || comparison.decisionSummary),
    quickVerdictA: (verd?.chooseAIf ?? comparison.chooseAIf).join(" "),
    quickVerdictAEn: asEnglishCopy((verd?.chooseAIf ?? comparison.chooseAIf).join(" ")),
    quickVerdictB: (verd?.chooseBIf ?? comparison.chooseBIf).join(" "),
    quickVerdictBEn: asEnglishCopy((verd?.chooseBIf ?? comparison.chooseBIf).join(" ")),
    quickVerdictAvoid: (verd?.avoidBothIf?.[0]) ?? avoidBoth,
    quickVerdictAvoidEn: asEnglishCopy((verd?.avoidBothIf?.[0]) ?? avoidBoth),
    toolADesc: data.tools.toolA.coreStrengths?.join(" ") || comparison.chooseAIf.join(" "),
    toolADescEn: asEnglishCopy(data.tools.toolA.coreStrengths?.join(" ") || comparison.chooseAIf.join(" ")),
    toolAUseCases: comparison.chooseAIf,
    toolAUseCasesEn: comparison.chooseAIf.map(asEnglishCopy),
    toolBDesc: data.tools.toolB.coreStrengths?.join(" ") || comparison.chooseBIf.join(" "),
    toolBDescEn: asEnglishCopy(data.tools.toolB.coreStrengths?.join(" ") || comparison.chooseBIf.join(" ")),
    toolBUseCases: comparison.chooseBIf,
    toolBUseCasesEn: comparison.chooseBIf.map(asEnglishCopy),
    tableRows: tableRows.length > 0 ? tableRows : fallbackRows,
    prosA: data.tools.toolA.coreStrengths?.slice(0, 4) || comparison.chooseAIf,
    prosAEn: (data.tools.toolA.coreStrengths?.slice(0, 4) || comparison.chooseAIf).map(asEnglishCopy),
    limitsA: data.tools.toolA.coreLimits?.slice(0, 4) || [],
    limitsAEn: (data.tools.toolA.coreLimits?.slice(0, 4) || []).map(asEnglishCopy),
    prosB: data.tools.toolB.coreStrengths?.slice(0, 4) || comparison.chooseBIf,
    prosBEn: (data.tools.toolB.coreStrengths?.slice(0, 4) || comparison.chooseBIf).map(asEnglishCopy),
    limitsB: data.tools.toolB.coreLimits?.slice(0, 4) || [],
    limitsBEn: (data.tools.toolB.coreLimits?.slice(0, 4) || []).map(asEnglishCopy),
    decisionRows: [
      ...comparison.chooseAIf.slice(0, 3).map((context) => ({ context, contextEn: asEnglishCopy(context), choice: toolAName, choiceEn: toolAName })),
      ...comparison.chooseBIf.slice(0, 3).map((context) => ({ context, contextEn: asEnglishCopy(context), choice: toolBName, choiceEn: toolBName })),
    ],
    decisiveCriteria: scoreCriteria.slice(0, 6).map((criterion) => ({
      title: criterion.title,
      titleEn: asEnglishCopy(criterion.title),
      toolA: criterion.toolA,
      toolAEn: asEnglishCopy(criterion.toolA),
      toolB: criterion.toolB,
      toolBEn: asEnglishCopy(criterion.toolB),
      decision: criterion.decision,
      decisionEn: asEnglishCopy(criterion.decision),
    })),
    tippingPoint: {
      title: "Le seuil de bascule",
      titleEn: "The tipping point",
      defaultChoice: tipping?.defaultPosition || comparison.decisionSummary,
      defaultChoiceEn: asEnglishCopy(tipping?.defaultPosition || comparison.decisionSummary),
      switchWhen: tipping?.switchWhen || comparison.mainDifference,
      switchWhenEn: asEnglishCopy(tipping?.switchWhen || comparison.mainDifference),
      signals: [tipping?.keepBothIf, tipping?.warning, ...(tipping?.examples || [])].filter((item): item is string => Boolean(item)).slice(0, 5),
      signalsEn: [tipping?.keepBothIf, tipping?.warning, ...(tipping?.examples || [])].filter((item): item is string => Boolean(item)).slice(0, 5).map(asEnglishCopy),
    },
    costReality: [
      {
        label: "Plan gratuit",
        labelEn: "Free plan",
        toolA: pc?.freePlanReality?.toolA || cost?.toolA?.freePlanReality || data.tools.toolA.freePlan?.summary || "À vérifier selon volume.",
        toolAEn: asEnglishCopy(pc?.freePlanReality?.toolA || cost?.toolA?.freePlanReality || data.tools.toolA.freePlan?.summary || "Check by volume."),
        toolB: pc?.freePlanReality?.toolB || cost?.toolB?.freePlanReality || data.tools.toolB.freePlan?.summary || "À vérifier selon volume.",
        toolBEn: asEnglishCopy(pc?.freePlanReality?.toolB || cost?.toolB?.freePlanReality || data.tools.toolB.freePlan?.summary || "Check by volume."),
        recommendation: pc?.costRecommendations?.freePlan || "Le gratuit suffit pour tester si le besoin reste ponctuel et sans volume client.",
        recommendationEn: asEnglishCopy(pc?.costRecommendations?.freePlan || "Free is enough to test when the need stays occasional and low volume."),
      },
      {
        label: "Quand payer",
        labelEn: "When to pay",
        toolA: pc?.whenPaidBecomesNecessary?.toolA || cost?.toolA?.whenPaidBecomesNecessary || formatPlanSummary(data.tools.toolA),
        toolAEn: asEnglishCopy(pc?.whenPaidBecomesNecessary?.toolA || cost?.toolA?.whenPaidBecomesNecessary || formatPlanSummary(data.tools.toolA)),
        toolB: pc?.whenPaidBecomesNecessary?.toolB || cost?.toolB?.whenPaidBecomesNecessary || formatPlanSummary(data.tools.toolB),
        toolBEn: asEnglishCopy(pc?.whenPaidBecomesNecessary?.toolB || cost?.toolB?.whenPaidBecomesNecessary || formatPlanSummary(data.tools.toolB)),
        recommendation: pc?.costRecommendations?.whenPaying || "Passe au payant quand la limite bloque un usage hebdomadaire clair.",
        recommendationEn: asEnglishCopy(pc?.costRecommendations?.whenPaying || "Move to paid when a limit blocks a clear weekly use."),
      },
      {
        label: "Coût caché",
        labelEn: "Hidden cost",
        toolA: pc?.hiddenCosts?.toolA || cost?.toolA?.hiddenCost || cost?.toolA?.pricingRisk || "Temps de setup et maintenance.",
        toolAEn: asEnglishCopy(pc?.hiddenCosts?.toolA || cost?.toolA?.hiddenCost || cost?.toolA?.pricingRisk || "Setup and maintenance time."),
        toolB: pc?.hiddenCosts?.toolB || cost?.toolB?.hiddenCost || cost?.toolB?.pricingRisk || "Temps de setup et maintenance.",
        toolBEn: asEnglishCopy(pc?.hiddenCosts?.toolB || cost?.toolB?.hiddenCost || cost?.toolB?.pricingRisk || "Setup and maintenance time."),
        recommendation: pc?.costRecommendations?.hiddenCost || "Surveille surtout le temps de setup, les doublons et la maintenance.",
        recommendationEn: asEnglishCopy(pc?.costRecommendations?.hiddenCost || "Watch setup time, duplicates, and maintenance first."),
      },
    ],
    tooltrimRisks: (comparison.pitfalls || []).map((pitfall) => ({
      mistake: pitfall.title,
      mistakeEn: asEnglishCopy(pitfall.title),
      consequence: pitfall.consequence,
      consequenceEn: asEnglishCopy(pitfall.consequence),
      recommendation: pitfall.recommendation,
      recommendationEn: asEnglishCopy(pitfall.recommendation),
    })),
    profiles: [],
    pricingFraming: pc?.tooltrimNote || cost?.tooltrimNote || comparison.mainDifference,
    pricingFramingEn: asEnglishCopy(pc?.tooltrimNote || cost?.tooltrimNote || comparison.mainDifference),
    pricingToolANotes: pc?.entryLevel?.toolA || formatPlanSummary(data.tools.toolA),
    pricingToolANotesEn: asEnglishCopy(pc?.entryLevel?.toolA || formatPlanSummary(data.tools.toolA)),
    pricingToolBNotes: pc?.entryLevel?.toolB || formatPlanSummary(data.tools.toolB),
    pricingToolBNotesEn: asEnglishCopy(pc?.entryLevel?.toolB || formatPlanSummary(data.tools.toolB)),
    pricingReco: cost?.duplicateCostWarning || pc?.tooltrimNote || "Vérifier le coût réel selon volume, sièges et usage hebdomadaire.",
    pricingRecoEn: asEnglishCopy(cost?.duplicateCostWarning || pc?.tooltrimNote || "Check real cost by volume, seats, and weekly usage."),
    /* ── Structured verdict bullet lists ── */
    chooseAIfList: verd?.chooseAIf ?? comparison.chooseAIf,
    chooseBIfList: verd?.chooseBIf ?? comparison.chooseBIf,
    avoidAIfList: verd?.avoidAIf ?? [],
    avoidBIfList: verd?.avoidBIf ?? [],
    avoidBothIfList: verd?.avoidBothIf ?? comparison.avoidBothIf ?? [],
    /* ── Hero signal overrides from tooltrimAtAGlance ── */
    aglanceBestForA: aglance?.bestForToolA,
    aglanceBestForB: aglance?.bestForToolB,
    aglanceBudget: aglance?.budgetShort,
    aglanceRisk: aglance?.mainRisk,
    aglanceDefaultLabel: aglance?.defaultChoiceLabel,
    aglanceLevel: aglance?.complexityLabel,
    aglanceHeroPromise: aglance?.heroPromise,
    aglanceHeroBrief: aglance?.heroBrief,
    aglancePositionA: aglance?.heroPositionA,
    aglancePositionB: aglance?.heroPositionB,
    aglanceContract: aglance?.heroContract,
    /* ── Verdict card fields — explicit overrides first, then first decisive sentence ── */
    verdictCardTitleA: aglance?.verdictCardTitleA,
    verdictCardTitleAEn: asEnglishCopy(aglance?.verdictCardTitleA || ""),
    verdictCardTitleB: aglance?.verdictCardTitleB,
    verdictCardTitleBEn: asEnglishCopy(aglance?.verdictCardTitleB || ""),
    verdictCardTextA: aglance?.verdictCardTextA || verd?.chooseAIf?.[0] || comparison.chooseAIf[0],
    verdictCardTextAEn: asEnglishCopy(aglance?.verdictCardTextA || verd?.chooseAIf?.[0] || comparison.chooseAIf[0]),
    verdictCardTextB: aglance?.verdictCardTextB || verd?.chooseBIf?.[0] || comparison.chooseBIf[0],
    verdictCardTextBEn: asEnglishCopy(aglance?.verdictCardTextB || verd?.chooseBIf?.[0] || comparison.chooseBIf[0]),
    verdictWarning: aglance?.verdictWarning || verd?.avoidBothIf?.[0] || comparison.avoidBothIf?.[0] || "Garde les deux uniquement si les usages sont vraiment distincts.",
    verdictWarningEn: asEnglishCopy(aglance?.verdictWarning || verd?.avoidBothIf?.[0] || comparison.avoidBothIf?.[0] || "Keep both only if the use cases are genuinely distinct."),
    alternatives: alternatives.map((alt) => {
      const name = typeof alt === "string" ? alt : alt.name;
      const reason = typeof alt === "object" && alt.reason
        ? alt.reason
        : "Option proche à regarder si le duel ne colle pas à ton usage.";
      const reasonEn = typeof alt === "object" && alt.reasonEn
        ? alt.reasonEn
        : "Nearby option to check if this battle does not fit your use case.";
      return { slug: slugifyName(name), name, reason, reasonEn };
    }),
    faq: (data.faq || []).map((item) => ({
      q: item.question,
      qEn: asEnglishCopy(item.question),
      a: item.answer,
      aEn: asEnglishCopy(item.answer),
    })),
  };
}

/* ─── Notion vs Airtable editorial content ───────────────────────────────── */
const NOTION_VS_AIRTABLE: CompareEditorialContent = {
  framing:
    "Deux outils puissants, deux logiques très différentes : Notion organise l'information, Airtable structure les données.",
  framingEn:
    "Two powerful tools, two very different logics: Notion organizes information, Airtable structures data.",

  verdictShort:
    "Choisis Notion si tu veux centraliser notes, docs, projets et contenus. Choisis Airtable si tu dois gérer des bases de données, des vues, des statuts ou des workflows plus structurés.",
  verdictShortEn:
    "Choose Notion if you want to centralize notes, docs, projects and content. Choose Airtable if you need to manage databases, views, statuses or more structured workflows.",
  finalRecommendation:
    "Pour un freelance solo, ToolTrim recommande Notion par défaut. Airtable devient meilleur quand la donnée, les vues et les statuts pilotent vraiment le workflow.",
  finalRecommendationEn:
    "For a solo freelancer, ToolTrim recommends Notion by default. Airtable becomes better when data, views, and statuses truly drive the workflow.",

  quickVerdictA:
    "Tu veux un espace flexible pour écrire, organiser, documenter et gérer des projets légers.",
  quickVerdictAEn:
    "You want a flexible space to write, organize, document and manage lightweight projects.",
  quickVerdictB:
    "Tu veux structurer des données, créer des vues, filtrer, automatiser et piloter des workflows.",
  quickVerdictBEn:
    "You want to structure data, create views, filter, automate and drive workflows.",
  quickVerdictAvoid:
    "Tu cherches un outil simple pour une seule tâche : les deux peuvent devenir trop lourds si le besoin est mal cadré.",
  quickVerdictAvoidEn:
    "You are looking for a simple single-task tool: both can become too heavy if the need is poorly scoped.",

  /* ── Tool overview ── */
  toolADesc:
    "Notion sert à organiser l'information : notes, documents, projets, contenus et bases simples. C'est un espace flexible qui centralise tout ce qu'une équipe ou un individu a besoin de savoir.",
  toolADescEn:
    "Notion is for organizing information: notes, documents, projects, content and simple databases. It's a flexible space that centralizes everything a team or individual needs to know.",
  toolAUseCases: [
    "Documentation et wiki interne",
    "Notes et organisation personnelle",
    "Gestion de projets légère",
    "Calendrier éditorial et contenus",
    "Briefs et livrables clients",
  ],
  toolAUseCasesEn: [
    "Documentation and internal wiki",
    "Notes and personal organization",
    "Lightweight project management",
    "Editorial calendar and content",
    "Client briefs and deliverables",
  ],
  toolBDesc:
    "Airtable sert à structurer des données : bases, vues filtrées, statuts, automatisations et workflows opérationnels. C'est un outil plus puissant que Notion pour gérer des volumes de données ou des process complexes.",
  toolBDescEn:
    "Airtable is for structuring data: databases, filtered views, statuses, automations and operational workflows. It's more powerful than Notion for managing data volumes or complex processes.",
  toolBUseCases: [
    "Bases de données structurées",
    "Vues filtrées et kanban",
    "Suivi opérationnel et statuts",
    "Automatisations de process",
    "Reporting et pipelines",
  ],
  toolBUseCasesEn: [
    "Structured databases",
    "Filtered views and kanban",
    "Operational tracking and statuses",
    "Process automations",
    "Reporting and pipelines",
  ],

  tableRows: [
    { criterion: "Organisation personnelle", criterionEn: "Personal organization",
      toolA: "Excellent", toolAEn: "Excellent",
      toolB: "Possible, mais limité", toolBEn: "Possible, but limited",
      winner: "A", verdictLabel: "Notion", verdictLabelEn: "Notion" },
    { criterion: "Documentation", criterionEn: "Documentation",
      toolA: "Très fort", toolAEn: "Very strong",
      toolB: "Possible, moins naturel", toolBEn: "Possible, less natural",
      winner: "A", verdictLabel: "Notion", verdictLabelEn: "Notion" },
    { criterion: "Gestion de projet légère", criterionEn: "Lightweight project mgmt",
      toolA: "Très bon", toolAEn: "Very good",
      toolB: "Bon", toolBEn: "Good",
      winner: "A", verdictLabel: "Notion", verdictLabelEn: "Notion" },
    { criterion: "Base de données structurée", criterionEn: "Structured database",
      toolA: "Moyen", toolAEn: "Average",
      toolB: "Excellent", toolBEn: "Excellent",
      winner: "B", verdictLabel: "Airtable", verdictLabelEn: "Airtable" },
    { criterion: "Automatisations", criterionEn: "Automations",
      toolA: "Limitées", toolAEn: "Limited",
      toolB: "Puissantes", toolBEn: "Powerful",
      winner: "B", verdictLabel: "Airtable", verdictLabelEn: "Airtable" },
    { criterion: "Collaboration équipe", criterionEn: "Team collaboration",
      toolA: "Bon", toolAEn: "Good",
      toolB: "Très bon", toolBEn: "Very good",
      winner: "B", verdictLabel: "Airtable", verdictLabelEn: "Airtable" },
    { criterion: "Templates disponibles", criterionEn: "Templates",
      toolA: "Très riche", toolAEn: "Very rich",
      toolB: "Bon", toolBEn: "Good",
      winner: "A", verdictLabel: "Notion", verdictLabelEn: "Notion" },
    { criterion: "Prise en main", criterionEn: "Learning curve",
      toolA: "Modérée", toolAEn: "Moderate",
      toolB: "Complexe", toolBEn: "Complex",
      winner: "A", verdictLabel: "Notion", verdictLabelEn: "Notion" },
    { criterion: "Scalabilité des données", criterionEn: "Data scalability",
      toolA: "Limitée", toolAEn: "Limited",
      toolB: "Bonne", toolBEn: "Good",
      winner: "B", verdictLabel: "Airtable", verdictLabelEn: "Airtable" },
    { criterion: "Budget solo / gratuit", criterionEn: "Solo / free budget",
      toolA: "Plan gratuit généreux", toolAEn: "Generous free plan",
      toolB: "Limites rapides", toolBEn: "Quick limitations",
      winner: "A", verdictLabel: "Notion", verdictLabelEn: "Notion" },
  ],

  /* ── Pros ── */
  prosA: [
    "Flexible et adaptable à presque tous les usages",
    "Excellent pour écrire, documenter et organiser des contenus",
    "Prise en main accessible avec de nombreux templates",
    "Plan gratuit généreux pour un usage solo ou une petite équipe",
  ],
  prosAEn: [
    "Flexible and adaptable to almost any use case",
    "Excellent for writing, documenting and organizing content",
    "Accessible onboarding with many templates",
    "Generous free plan for solo or small team use",
  ],
  prosB: [
    "Structure de données robuste avec liens entre tables",
    "Vues multiples puissantes : kanban, grille, galerie, formulaire",
    "Automatisations natives efficaces sur les plans payants",
    "Meilleur pour des workflows opérationnels à plusieurs",
  ],
  prosBEn: [
    "Robust data structure with table links",
    "Powerful multiple views: kanban, grid, gallery, form",
    "Effective native automations on paid plans",
    "Better for multi-person operational workflows",
  ],

  /* ── Limits ── */
  limitsA: [
    "Peut devenir un fourre-tout sans structure éditoriale claire",
    "Bases de données moins puissantes qu'un vrai outil de données",
    "Automatisations limitées selon le plan",
    "Risque de sur-documenter et de perdre du temps à organiser",
  ],
  limitsAEn: [
    "Can become a catch-all without clear editorial structure",
    "Databases less powerful than a dedicated data tool",
    "Automations limited depending on the plan",
    "Risk of over-documenting and spending time organizing",
  ],
  limitsB: [
    "Peut être trop structuré pour un usage simple",
    "Courbe d'apprentissage plus élevée que Notion",
    "Coût qui grimpe vite avec les workflows avancés",
    "Moins naturel pour écrire, documenter ou naviguer dans du texte",
  ],
  limitsBEn: [
    "Can be overly structured for simple use cases",
    "Steeper learning curve than Notion",
    "Costs escalate quickly with advanced workflows",
    "Less natural for writing, documenting or navigating text",
  ],

  /* ── Decision rows ── */
  decisionRows: [
    {
      context: "Ton besoin principal est d'écrire, documenter ou organiser de l'information",
      contextEn: "Your primary need is to write, document or organize information",
      choice: "Notion", choiceEn: "Notion",
    },
    {
      context: "Tu dois suivre des données, des statuts, des opérations ou des pipelines",
      contextEn: "You need to track data, statuses, operations or pipelines",
      choice: "Airtable", choiceEn: "Airtable",
    },
    {
      context: "Ton équipe a besoin de vues filtrées, formulaires et automatisations",
      contextEn: "Your team needs filtered views, forms and automations",
      choice: "Airtable", choiceEn: "Airtable",
    },
    {
      context: "Tu veux centraliser notes, idées, projets et contenus en un seul espace",
      contextEn: "You want to centralize notes, ideas, projects and content in one space",
      choice: "Notion", choiceEn: "Notion",
    },
    {
      context: "Tu cherches un outil simple pour une seule tâche ponctuelle",
      contextEn: "You need a simple tool for a single specific task",
      choice: "Aucun des deux — cherche une alternative plus légère",
      choiceEn: "Neither — look for a lighter alternative",
    },
  ],

  decisiveCriteria: [
    {
      title: "Structure des données",
      titleEn: "Data structure",
      toolA: "Notion suffit pour bases simples, contenus mixtes et suivi léger.",
      toolAEn: "Notion is enough for simple databases, mixed content, and light tracking.",
      toolB: "Airtable devient plus solide dès que relations, vues et statuts deviennent centraux.",
      toolBEn: "Airtable becomes stronger when relations, views, and statuses become central.",
      decision: "Airtable si la donnée pilote le workflow.",
      decisionEn: "Airtable if data drives the workflow.",
    },
    {
      title: "Documentation",
      titleEn: "Documentation",
      toolA: "Notion est plus naturel pour écrire, relier et partager des docs.",
      toolAEn: "Notion is more natural for writing, linking, and sharing docs.",
      toolB: "Airtable peut stocker du contexte, mais l'expérience reste moins éditoriale.",
      toolBEn: "Airtable can store context, but the experience is less editorial.",
      decision: "Notion si le contenu est le livrable principal.",
      decisionEn: "Notion if content is the main deliverable.",
    },
    {
      title: "Automatisation",
      titleEn: "Automation",
      toolA: "Notion couvre quelques automatisations, mais reste limité pour des process avancés.",
      toolAEn: "Notion covers some automation, but stays limited for advanced processes.",
      toolB: "Airtable est plus pertinent pour formulaires, vues, règles et opérations répétées.",
      toolBEn: "Airtable is more relevant for forms, views, rules, and repeated operations.",
      decision: "Airtable si l'opération doit se répéter chaque semaine.",
      decisionEn: "Airtable if the operation repeats every week.",
    },
    {
      title: "Coût réel",
      titleEn: "Real cost",
      toolA: "Le plan gratuit ou Plus suffit souvent longtemps pour un solo.",
      toolAEn: "The free or Plus plan is often enough for a solo user for a long time.",
      toolB: "Airtable devient vite payant dès que volume, collaborateurs ou automatisations augmentent.",
      toolBEn: "Airtable gets paid quickly when volume, collaborators, or automations increase.",
      decision: "Notion tant que le besoin reste personnel ou documentaire.",
      decisionEn: "Notion while the need stays personal or documentation-focused.",
    },
  ],

  tippingPoint: {
    title: "Le seuil de bascule",
    titleEn: "The tipping point",
    defaultChoice: "Choisis Notion par défaut si tu centralises surtout notes, docs, process et suivi léger.",
    defaultChoiceEn: "Choose Notion by default if you mostly centralize notes, docs, processes, and light tracking.",
    switchWhen: "Passe à Airtable quand tu gères plusieurs bases reliées, des vues par statut, des formulaires ou des automatisations récurrentes.",
    switchWhenEn: "Switch to Airtable when you manage several linked bases, status views, forms, or recurring automations.",
    signals: [
      "plus de 3 bases relationnelles",
      "plusieurs vues par équipe ou client",
      "statuts et automatisations au cœur du suivi",
      "volume de données trop lourd pour une page Notion",
    ],
    signalsEn: [
      "more than 3 relational bases",
      "several views by team or client",
      "statuses and automations drive tracking",
      "data volume too heavy for a Notion page",
    ],
  },

  costReality: [
    {
      label: "Coût affiché",
      labelEn: "Listed cost",
      toolA: "Gratuit puis 12€/mois/membre sur Plus.",
      toolAEn: "Free, then €12/month/member on Plus.",
      toolB: "Gratuit limité, puis 20€/mois/siège sur Team.",
      toolBEn: "Limited free plan, then €20/month/seat on Team.",
      recommendation: "Compare surtout le nombre de sièges et d'automatisations.",
      recommendationEn: "Compare seats and automations first.",
    },
    {
      label: "Plan gratuit",
      labelEn: "Free plan",
      toolA: "Souvent suffisant pour solo, docs et bases légères.",
      toolAEn: "Often enough for solo, docs, and light databases.",
      toolB: "Utile pour tester, mais vite limité par volume et collaboration.",
      toolBEn: "Useful for testing, but quickly limited by volume and collaboration.",
      recommendation: "Ne paie Airtable que si la structure apporte un vrai gain.",
      recommendationEn: "Only pay for Airtable if structure brings a real gain.",
    },
    {
      label: "Coût caché",
      labelEn: "Hidden cost",
      toolA: "Temps perdu si l'espace devient un fourre-tout.",
      toolAEn: "Lost time if the workspace becomes a catch-all.",
      toolB: "Temps de setup, nettoyage des champs et maintenance des vues.",
      toolBEn: "Setup time, field cleanup, and view maintenance.",
      recommendation: "Auditer dès que l'outil demande plus de maintenance que d'usage.",
      recommendationEn: "Audit as soon as the tool needs more maintenance than use.",
    },
  ],

  tooltrimRisks: [
    {
      mistake: "Confondre doc et base métier",
      mistakeEn: "Confusing docs and business databases",
      consequence: "Tu peux choisir Airtable pour écrire des docs, ou Notion pour piloter une donnée trop structurée.",
      consequenceEn: "You may choose Airtable for docs, or Notion for data that is too structured.",
      recommendation: "Pars du livrable principal : contenu ou donnée.",
      recommendationEn: "Start from the main deliverable: content or data.",
    },
    {
      mistake: "Payer Airtable trop tôt",
      mistakeEn: "Paying for Airtable too early",
      consequence: "Le coût grimpe avant que le workflow ne soit réellement stable.",
      consequenceEn: "Cost rises before the workflow is truly stable.",
      recommendation: "Teste d'abord le besoin sur un flux simple.",
      recommendationEn: "Test the need on a simple flow first.",
    },
    {
      mistake: "Garder les deux pour le même usage",
      mistakeEn: "Keeping both for the same use",
      consequence: "Les docs, statuts et bases se dupliquent vite.",
      consequenceEn: "Docs, statuses, and databases quickly duplicate.",
      recommendation: "Attribue un rôle unique à chaque outil ou coupe l'un des deux.",
      recommendationEn: "Give each tool a single role or cut one.",
    },
  ],

  profiles: [
    { persona: "Freelance créatif", personaEn: "Creative freelancer",
      choice: "Notion",
      reason: "Plus simple pour organiser contenus, notes, briefs, projets et livrables sans créer une architecture trop lourde.",
      reasonEn: "Simpler for organizing content, notes, briefs, projects and deliverables without creating overly heavy architecture.",
      limit: "Les bases de données Notion suffisent pour des listes simples, mais pas pour des workflows complexes.",
      limitEn: "Notion databases are fine for simple lists, but not for complex workflows." },
    { persona: "Consultant", personaEn: "Consultant",
      choice: "Notion",
      reason: "Gestion de mission, notes, docs et suivi client sans complexité excessive.",
      reasonEn: "Engagement management, notes, docs and client tracking without excessive complexity.",
      limit: "Dès que le nombre de clients et missions augmente, Airtable devient plus adapté pour le suivi structuré.",
      limitEn: "As clients and engagements grow, Airtable becomes more suitable for structured tracking." },
    { persona: "Ops / COO", personaEn: "Ops / COO",
      choice: "Airtable",
      reason: "Plus solide pour suivre des données, construire des vues, gérer des statuts et structurer des process.",
      reasonEn: "More robust for tracking data, building views, managing statuses and structuring processes.",
      limit: "Airtable monte vite en coût dès qu'on ajoute des collaborateurs ou des automatisations avancées.",
      limitEn: "Airtable costs escalate quickly when adding collaborators or advanced automations." },
    { persona: "Équipe produit", personaEn: "Product team",
      choice: "Airtable",
      reason: "Roadmap, tickets, vues kanban et données structurées pour piloter un produit en équipe.",
      reasonEn: "Roadmap, tickets, kanban views and structured data to manage a product as a team.",
      limit: "Pour la documentation technique et les specs, Notion reste plus adapté en parallèle.",
      limitEn: "For technical documentation and specs, Notion remains more suitable in parallel." },
    { persona: "Créateur de contenu", personaEn: "Content creator",
      choice: "Notion",
      reason: "Backlog éditorial, calendrier, recyclage et base de contenus centralisée.",
      reasonEn: "Editorial backlog, calendar, repurposing and centralized content base.",
      limit: "Pour gérer des commandes, des livrables multiples ou un suivi client structuré, Airtable prend le relais.",
      limitEn: "For managing orders, multiple deliverables or structured client tracking, Airtable takes over." },
    { persona: "Petite agence", personaEn: "Small agency",
      choice: "Airtable",
      reason: "Suivi clients, projets, statuts et reporting pour plusieurs personnes simultanément.",
      reasonEn: "Client tracking, projects, statuses and reporting for multiple people simultaneously.",
      limit: "Le coût par siège peut devenir élevé rapidement — vérifier le plan Team avant de s'engager.",
      limitEn: "Per-seat cost can rise quickly — check the Team plan before committing." },
  ],

  pricingFraming:
    "Notion peut être plus accessible si tu restes sur un usage personnel ou une petite équipe. Airtable peut devenir plus cher dès que les besoins de collaboration, d'automatisation ou de volume augmentent.",
  pricingFramingEn:
    "Notion can be more accessible if you stay on personal or small team use. Airtable can get expensive once collaboration, automation or volume needs grow.",

  pricingToolANotes:
    "Plan gratuit généreux pour usage personnel. Plan Plus à **12€/mois/membre**, Business à **18€/mois/membre**. Automatisations limitées sur le plan gratuit.",
  pricingToolANotesEn:
    "Generous free plan for personal use. Plus plan at **€12/month/member**, Business at **€18/month/member**. Automations limited on free plan.",

  pricingToolBNotes:
    "Plan gratuit limité rapidement (5 éditeurs, 1 000 enregistrements). Team à **20€/mois/siège**, Business à **45€/mois/siège**. Automatisations et vues avancées sur plans payants.",
  pricingToolBNotesEn:
    "Free plan hits limits quickly (5 editors, 1,000 records). Team at **€20/month/seat**, Business at **€45/month/seat**. Advanced automations and views on paid plans.",

  pricingReco:
    "Pour un solo ou une petite équipe ≤ 3 personnes : Notion est moins cher. Au-delà, comparer selon les usages réels.",
  pricingRecoEn:
    "For solo or small team ≤ 3 people: Notion is cheaper. Beyond that, compare based on actual use.",

  /* ── Structured verdict bullet lists ── */
  chooseAIfList: [
    "Documentation et wiki interne",
    "Notes et organisation personnelle",
    "Gestion de projets légère",
  ],
  chooseBIfList: [
    "Bases de données structurées et vues filtrées",
    "Automatisations de process",
    "Reporting et pipelines",
  ],
  avoidAIfList: [
    "Tu dois gérer des volumes de données ou des workflows complexes.",
  ],
  avoidBIfList: [
    "Tu cherches un espace d'écriture et d'organisation flexible.",
  ],
  avoidBothIfList: [
    "Tu cherches un outil simple pour une seule tâche : les deux peuvent devenir trop lourds.",
  ],
  /* ── Hero signal overrides ── */
  aglanceBestForA: "Docs, notes, wikis et projets légers",
  aglanceBestForB: "Bases de données, vues et workflows",
  aglanceBudget: "Notion moins cher pour solo/petite équipe",
  aglanceRisk: "Ne pas mélanger les deux rôles",
  aglanceDefaultLabel: "Notion par défaut pour centraliser",
  aglanceLevel: "Notion accessible, Airtable complexe",
  aglanceHeroPromise: "Un espace pour penser. Une base pour piloter.",
  aglancePositionA: "L'espace d'organisation",
  aglancePositionB: "La base de données",
  aglanceContract: "Ne choisis pas l'outil le plus complet. Choisis celui qui structure le livrable le plus central de ton travail.",

  alternatives: [
    { slug: "coda", name: "Coda", reason: "Entre document et base de données, souvent bon compromis entre les deux.", reasonEn: "Between document and database, often a good compromise between the two." },
    { slug: "clickup", name: "ClickUp", reason: "Plus orienté gestion de projet, avec vue tâches, sprints et reporting.", reasonEn: "More project-management oriented, with task view, sprints and reporting.", price: "Gratuit / 7€+/mois" },
    { slug: "google-sheets", name: "Google Sheets", reason: "Plus simple et gratuit pour des bases de données légères sans apprentissage.", reasonEn: "Simpler and free for lightweight databases without a learning curve.", price: "Gratuit" },
    { slug: "baserow", name: "Baserow", reason: "Alternative open-source orientée base de données, sans les coûts d'Airtable.", reasonEn: "Open-source database-focused alternative without Airtable's costs.", price: "Gratuit / 5€+/mois" },
    { slug: "trello", name: "Trello", reason: "Si le besoin est uniquement visuel et simple, Trello est plus léger.", reasonEn: "If the need is purely visual and simple, Trello is lighter.", price: "Gratuit / 5€+/mois" },
  ],

  faq: [
    { q: "Notion peut-il remplacer Airtable ?",
      qEn: "Can Notion replace Airtable?",
      a: "Oui, pour des besoins légers. Non, si tu dois gérer des données complexes, plusieurs vues filtrées et des automatisations avancées. Les bases de données Notion sont moins puissantes qu'Airtable dès que le volume ou la complexité augmente.",
      aEn: "Yes, for lightweight needs. No, if you need to manage complex data, multiple filtered views and advanced automations. Notion databases are less powerful than Airtable as volume or complexity grows." },
    { q: "Airtable est-il trop complexe pour un freelance ?",
      qEn: "Is Airtable too complex for a freelancer?",
      a: "Pour un freelance avec des besoins simples, oui. Airtable est mieux adapté dès que tu gères des données structurées, des statuts ou plusieurs projets en parallèle. Pour un usage solo simple, Notion ou même Google Sheets suffisent.",
      aEn: "For a freelancer with simple needs, yes. Airtable is better suited when you manage structured data, statuses or multiple parallel projects. For simple solo use, Notion or even Google Sheets are enough." },
    { q: "Lequel choisir pour une base client ?",
      qEn: "Which to choose for a client database?",
      a: "Airtable. Ses vues, filtres et liens entre tables le rendent bien plus adapté pour gérer des contacts, statuts, historiques et pipelines commerciaux.",
      aEn: "Airtable. Its views, filters and table links make it much more suited for managing contacts, statuses, histories and sales pipelines." },
    { q: "Lequel choisir pour écrire et documenter ?",
      qEn: "Which to choose for writing and documentation?",
      a: "Notion. L'éditeur est plus naturel, les docs plus lisibles, et la navigation dans l'information plus fluide. Airtable n'est pas conçu pour la documentation texte.",
      aEn: "Notion. The editor is more natural, documents are more readable, and navigating information is smoother. Airtable is not designed for text documentation." },
    { q: "Lequel est le plus économique ?",
      qEn: "Which is more economical?",
      a: "Notion sur le plan gratuit ou solo. Airtable devient plus cher rapidement dès que tu ajoutes des membres ou des automatisations. Pour une équipe de plus de 3 personnes, comparer les plans payants selon les usages réels.",
      aEn: "Notion on the free or solo plan. Airtable gets more expensive quickly once you add members or automations. For teams over 3 people, compare paid plans based on actual usage." },
  ],
};

/* ─── GitHub Copilot vs Cursor editorial content ─────────────────────────── */
const GITHUB_COPILOT_VS_CURSOR: CompareEditorialContent = {
  framing:
    "Extension universelle ou IDE conçu pour l'IA. L'un s'installe dans votre IDE existant, l'autre vous demande d'en changer.",
  framingEn:
    "Universal extension or AI-native IDE. One installs into your existing editor, the other asks you to switch.",

  verdictShort:
    "Freelance solo qui veut shipper vite et accepte une facture variable ? Cursor. Grande entreprise, JetBrains ou Visual Studio, budget fixe à 10$ ? Copilot.",
  verdictShortEn:
    "Solo freelancer who wants to ship fast and accepts a variable bill? Cursor. Large company, JetBrains or Visual Studio, fixed $10 budget? Copilot.",

  finalRecommendation:
    "ToolTrim recommande Copilot par défaut pour les agences, les entreprises, et les développeurs sur JetBrains ou Visual Studio. Si vous êtes solo et prêt à changer d'IDE, Cursor et son Composer changent concrètement la façon dont on travaille sur plusieurs fichiers.",
  finalRecommendationEn:
    "ToolTrim recommends Copilot by default for agencies, enterprises, and developers on JetBrains or Visual Studio. If you're solo and ready to switch IDEs, Cursor and its Composer concretely change how you work across multiple files.",

  quickVerdictA:
    "Vous êtes sur JetBrains, Visual Studio ou un IDE que vous ne voulez pas quitter, et vous avez besoin d'un budget mensuel prévisible.",
  quickVerdictAEn:
    "You're on JetBrains, Visual Studio or an IDE you don't want to leave, and need a predictable monthly budget.",
  quickVerdictB:
    "Vous êtes développeur solo et passez beaucoup de temps à modifier du code sur plusieurs fichiers simultanément.",
  quickVerdictBEn:
    "You're a solo developer and spend a lot of time editing code across multiple files at once.",
  quickVerdictAvoid:
    "Vous travaillez dans des environnements de défense ou 'air-gapped' où aucune requête cloud n'est autorisée.",
  quickVerdictAvoidEn:
    "You work in defense or air-gapped environments where no cloud requests are allowed.",

  toolADesc:
    "GitHub Copilot est une extension IA qui se greffe à votre IDE existant. Elle fonctionne partout — VS Code, JetBrains, Visual Studio — sans vous demander de changer vos habitudes. Son modèle à prix fixe en fait l'option par défaut pour les équipes et les développeurs qui veulent un coût prévisible.",
  toolADescEn:
    "GitHub Copilot is an AI extension that plugs into your existing IDE. It works everywhere — VS Code, JetBrains, Visual Studio — without asking you to change your habits. Its fixed-price model makes it the default for teams who want predictable costs.",
  toolAUseCases: [
    "Autocomplétion dans votre IDE actuel",
    "Génération de Pull Requests de A à Z",
    "Code reviews automatisées",
    "Équipes sur JetBrains ou Visual Studio",
    "Budget mensuel fixe et prévisible",
  ],
  toolAUseCasesEn: [
    "Autocomplete in your current IDE",
    "End-to-end Pull Request generation",
    "Automated code reviews",
    "Teams on JetBrains or Visual Studio",
    "Fixed and predictable monthly budget",
  ],

  toolBDesc:
    "Cursor est un éditeur de code conçu dès le départ pour l'IA, pas adapté après coup. Son outil Composer coordonne des modifications sur plusieurs fichiers en même temps. Pour un développeur solo prêt à changer d'IDE, il remplace le copier-coller quotidien entre Claude.ai et votre éditeur.",
  toolBDescEn:
    "Cursor is a code editor designed from the ground up for AI, not retrofitted. Its Composer tool coordinates changes across multiple files at once. For a solo developer ready to switch, it replaces daily copy-pasting between Claude.ai and your editor.",
  toolBUseCases: [
    "Modification multi-fichiers via Composer",
    "Accès direct aux modèles frontières (Claude, GPT-4o)",
    "Cloud Agents et Bugbot autonomes",
    "Développement solo fullstack ou front-end",
    "Remplacement de l'interface web Claude pour le code",
  ],
  toolBUseCasesEn: [
    "Multi-file editing via Composer",
    "Direct access to frontier models (Claude, GPT-4o)",
    "Autonomous Cloud Agents and Bugbot",
    "Solo fullstack or front-end development",
    "Replaces Claude web interface for coding",
  ],

  tableRows: [
    { criterion: "Compatibilité IDE", criterionEn: "IDE compatibility",
      toolA: "Tous les IDEs majeurs", toolAEn: "All major IDEs",
      toolB: "Cursor uniquement (fork VS Code)", toolBEn: "Cursor only (VS Code fork)",
      winner: "A", verdictLabel: "Copilot", verdictLabelEn: "Copilot" },
    { criterion: "Manipulation multi-fichiers", criterionEn: "Multi-file editing",
      toolA: "Partielle via mode agent", toolAEn: "Partial via agent mode",
      toolB: "Native via Composer", toolBEn: "Native via Composer",
      winner: "B", verdictLabel: "Cursor", verdictLabelEn: "Cursor" },
    { criterion: "Modèle de prix", criterionEn: "Pricing model",
      toolA: "Abonnement fixe (10$/mois)", toolAEn: "Fixed subscription ($10/mo)",
      toolB: "Hybride : abonnement + consommation API", toolBEn: "Hybrid: subscription + API usage",
      winner: "A", verdictLabel: "Copilot", verdictLabelEn: "Copilot" },
    { criterion: "Confidentialité du code", criterionEn: "Code privacy",
      toolA: "Opt-out requis (plans individuels)", toolAEn: "Opt-out required (individual plans)",
      toolB: "Privacy Mode et Ghost Mode disponibles", toolBEn: "Privacy Mode and Ghost Mode available",
      winner: "B", verdictLabel: "Cursor", verdictLabelEn: "Cursor" },
    { criterion: "Prise en main", criterionEn: "Ease of setup",
      toolA: "Très simple (extension)", toolAEn: "Very simple (extension)",
      toolB: "Modérée (changement d'IDE)", toolBEn: "Moderate (IDE switch required)",
      winner: "A", verdictLabel: "Copilot", verdictLabelEn: "Copilot" },
    { criterion: "Génération de PR", criterionEn: "PR generation",
      toolA: "Oui, de A à Z", toolAEn: "Yes, end-to-end",
      toolB: "Via Composer (multi-fichiers)", toolBEn: "Via Composer (multi-file)",
      winner: "tie", verdictLabel: "Égalité", verdictLabelEn: "Tie" },
  ],

  prosA: [
    "Fonctionne dans tous les IDEs — aucun changement d'environnement requis",
    "Prix fixe à 10$/mois, sans surprise en fin de mois",
    "Pull requests générées de A à Z",
    "Plan Business avec confidentialité garantie pour les équipes",
  ],
  prosAEn: [
    "Works in all IDEs — no environment change required",
    "Fixed price at $10/mo, no end-of-month surprises",
    "End-to-end Pull Request generation",
    "Business plan with guaranteed privacy for teams",
  ],
  limitsA: [
    "L'agent passe moins bien d'un fichier à l'autre que celui de Cursor",
    "Entraînement sur vos données activé par défaut (opt-out requis sur les plans individuels)",
    "Les code reviews automatisées consomment des minutes GitHub Actions payantes",
  ],
  limitsAEn: [
    "Agent handles cross-file tasks less fluidly than Cursor",
    "Training on your data enabled by default (opt-out required on individual plans)",
    "Automated code reviews consume paid GitHub Actions minutes",
  ],
  prosB: [
    "IDE pensé pour l'IA dès le départ, pas adapté après coup",
    "Composer : modification multi-fichiers coordonnée par un agent",
    "Accès natif aux modèles frontières sans copier-coller",
    "Ghost Mode (100% local) pour les projets sous NDA",
  ],
  prosBEn: [
    "IDE designed for AI from the ground up, not retrofitted",
    "Composer: agent-coordinated multi-file editing",
    "Native access to frontier models without copy-pasting",
    "Ghost Mode (100% local) for NDA projects",
  ],
  limitsB: [
    "Facturation usage-based difficile à prévoir pour les utilisateurs intensifs",
    "Nécessite de changer d'IDE — incompatible avec JetBrains ou Visual Studio",
    "Les workflows .cursorrules ne migrent pas vers d'autres éditeurs",
    "Bugbot facturé séparément des plans Pro/Pro+",
  ],
  limitsBEn: [
    "Usage-based billing hard to predict for heavy users",
    "Requires an IDE switch — incompatible with JetBrains or Visual Studio",
    ".cursorrules workflows don't migrate to other editors",
    "Bugbot billed separately from Pro/Pro+ plans",
  ],

  decisionRows: [
    { context: "Tu es sur JetBrains, IntelliJ ou Visual Studio",
      contextEn: "You're on JetBrains, IntelliJ or Visual Studio",
      choice: "GitHub Copilot", choiceEn: "GitHub Copilot" },
    { context: "Tu veux un budget mensuel fixe et prévisible",
      contextEn: "You want a fixed, predictable monthly budget",
      choice: "GitHub Copilot", choiceEn: "GitHub Copilot" },
    { context: "Tu modifies du code sur plusieurs fichiers en même temps tous les jours",
      contextEn: "You edit code across multiple files at once every day",
      choice: "Cursor", choiceEn: "Cursor" },
    { context: "Tu copies-colles constamment depuis l'interface web de Claude vers ton éditeur",
      contextEn: "You constantly copy-paste from Claude's web interface to your editor",
      choice: "Cursor — Composer le fait nativement", choiceEn: "Cursor — Composer does this natively" },
    { context: "Tu travailles en grande entreprise avec des contraintes de sécurité",
      contextEn: "You work in a large company with security constraints",
      choice: "GitHub Copilot Business", choiceEn: "GitHub Copilot Business" },
    { context: "Tu veux la confidentialité maximale sans plan Enterprise",
      contextEn: "You want maximum privacy without an Enterprise plan",
      choice: "Cursor Ghost Mode", choiceEn: "Cursor Ghost Mode" },
  ],

  decisiveCriteria: [
    {
      title: "Compatibilité IDE",
      titleEn: "IDE compatibility",
      toolA: "Copilot s'installe en extension dans tous les IDEs — JetBrains, Visual Studio, VS Code.",
      toolAEn: "Copilot installs as an extension in all IDEs — JetBrains, Visual Studio, VS Code.",
      toolB: "Cursor est un fork de VS Code. JetBrains et Visual Studio ne sont pas supportés.",
      toolBEn: "Cursor is a VS Code fork. JetBrains and Visual Studio are not supported.",
      decision: "Copilot si vous ne voulez pas changer d'IDE.",
      decisionEn: "Copilot if you don't want to switch IDEs.",
    },
    {
      title: "Modèle de prix",
      titleEn: "Pricing model",
      toolA: "Prix fixe à 10$/mois. Prévisible, sans surprise.",
      toolAEn: "Fixed price at $10/mo. Predictable, no surprises.",
      toolB: "Abonnement + consommation API selon les modèles utilisés. La facture varie.",
      toolBEn: "Subscription + API usage based on models used. The bill varies.",
      decision: "Copilot si le budget est une contrainte. Cursor si l'usage justifie la variabilité.",
      decisionEn: "Copilot if budget is a constraint. Cursor if usage justifies variability.",
    },
    {
      title: "Confidentialité",
      titleEn: "Privacy",
      toolA: "Entraînement activé par défaut sur les plans individuels — opt-out manuel requis.",
      toolAEn: "Training enabled by default on individual plans — manual opt-out required.",
      toolB: "Privacy Mode et Ghost Mode (100% local) disponibles pour tous les plans.",
      toolBEn: "Privacy Mode and Ghost Mode (100% local) available on all plans.",
      decision: "Copilot Business pour les agences. Cursor Ghost Mode pour la paranoïa freelance.",
      decisionEn: "Copilot Business for agencies. Cursor Ghost Mode for privacy-conscious freelancers.",
    },
    {
      title: "Multi-fichiers",
      titleEn: "Multi-file editing",
      toolA: "Possible via mode agent, mais moins fluide que Cursor.",
      toolAEn: "Possible via agent mode, but less fluid than Cursor.",
      toolB: "Composer coordonne des modifications sur plusieurs fichiers simultanément.",
      toolBEn: "Composer coordinates changes across multiple files at once.",
      decision: "Cursor si le travail multi-fichiers est quotidien.",
      decisionEn: "Cursor if multi-file work is daily.",
    },
  ],

  tippingPoint: {
    title: "Le seuil de bascule",
    titleEn: "The tipping point",
    defaultChoice: "GitHub Copilot par défaut. Compatible avec tous les IDEs, prévisible à 10$/mois.",
    defaultChoiceEn: "GitHub Copilot by default. Compatible with all IDEs, predictable at $10/mo.",
    switchWhen:
      "Vous passez plus de temps à copier-coller depuis l'interface web de Claude vers votre IDE qu'à coder. Composer de Cursor fait ça nativement.",
    switchWhenEn:
      "You spend more time copy-pasting from Claude's web interface to your IDE than coding. Cursor's Composer does this natively.",
    signals: [
      "copier-coller quotidien entre Claude.ai et votre éditeur",
      "modifications fréquentes sur 3+ fichiers liés en même temps",
      "refactors multi-fichiers qui prennent des heures manuellement",
      "vous avez déjà testé VS Code et n'y êtes pas attaché",
    ],
    signalsEn: [
      "daily copy-pasting between Claude.ai and your editor",
      "frequent changes across 3+ linked files at once",
      "multi-file refactors that take hours manually",
      "you've used VS Code before and aren't attached to it",
    ],
  },

  costReality: [
    {
      label: "Prix de base",
      labelEn: "Base price",
      toolA: "Pro à 10$/mois. Pro+ à 39$/mois.",
      toolAEn: "Pro at $10/mo. Pro+ at $39/mo.",
      toolB: "Pro à 20$/mois. Pro+ à 60$/mois. Ultra à 200$/mois.",
      toolBEn: "Pro at $20/mo. Pro+ at $60/mo. Ultra at $200/mo.",
      recommendation: "Copilot Pro est difficile à battre sur le rapport qualité/prix.",
      recommendationEn: "Copilot Pro is hard to beat on value for money.",
    },
    {
      label: "Plan gratuit",
      labelEn: "Free plan",
      toolA: "50 requêtes premium/mois. Ça fond en une matinée de développement sérieux.",
      toolAEn: "50 premium requests/month. Gone in one serious morning of development.",
      toolB: "Inexploitable au quotidien. Suffisant pour tester l'interface quelques heures.",
      toolBEn: "Unusable daily. Enough to test the interface for a few hours.",
      recommendation: "Ne comptez pas sur le plan gratuit pour un usage professionnel.",
      recommendationEn: "Don't count on the free plan for professional use.",
    },
    {
      label: "Coût caché",
      labelEn: "Hidden cost",
      toolA: "Les code reviews automatisées consomment des minutes GitHub Actions payantes depuis juin 2026.",
      toolAEn: "Automated code reviews consume paid GitHub Actions minutes since June 2026.",
      toolB: "Les modèles frontières en mode manuel dévident votre pool de crédits. Bugbot est facturé en plus.",
      toolBEn: "Frontier models in manual mode drain your credit pool. Bugbot is billed on top.",
      recommendation: "Sur Cursor, activez le mode Auto pour limiter la consommation de crédits.",
      recommendationEn: "On Cursor, enable Auto mode to limit credit consumption.",
    },
  ],

  tooltrimRisks: [
    {
      mistake: "Laisser Copilot s'entraîner sur votre code",
      mistakeEn: "Letting Copilot train on your code",
      consequence: "Vos snippets propriétaires alimentent les modèles de GitHub par défaut sur les plans individuels.",
      consequenceEn: "Your proprietary snippets feed GitHub's models by default on individual plans.",
      recommendation: "Désactivez le partage de données dans vos paramètres GitHub dès l'inscription, ou prenez un plan Business.",
      recommendationEn: "Disable data sharing in your GitHub settings on signup, or use a Business plan.",
    },
    {
      mistake: "Cumuler inutilement les abonnements IA",
      mistakeEn: "Stacking AI subscriptions unnecessarily",
      consequence: "Payer ChatGPT Plus (20$) + Copilot (10$) + Cursor (20$) simultanément.",
      consequenceEn: "Paying ChatGPT Plus ($20) + Copilot ($10) + Cursor ($20) simultaneously.",
      recommendation: "Cursor intègre déjà GPT-4o et Claude. Il remplace souvent ChatGPT Plus pour les tâches de code.",
      recommendationEn: "Cursor already includes GPT-4o and Claude. It often replaces ChatGPT Plus for coding tasks.",
    },
    {
      mistake: "Ignorer la facture usage-based de Cursor",
      mistakeEn: "Ignoring Cursor's usage-based billing",
      consequence: "La facture monte vite si vous laissez des agents lourds tourner en boucle.",
      consequenceEn: "The bill rises quickly if you let heavy agents run in loops.",
      recommendation: "Activez le mode Auto et surveillez votre consommation dans les paramètres Cursor.",
      recommendationEn: "Enable Auto mode and monitor your usage in Cursor settings.",
    },
  ],

  profiles: [
    { persona: "Freelance solo fullstack", personaEn: "Solo fullstack freelancer",
      choice: "Cursor",
      reason: "Composer change la façon dont on travaille sur plusieurs fichiers. Pour quelqu'un qui génère des features entières, c'est un gain réel.",
      reasonEn: "Composer changes how you work across multiple files. For someone shipping entire features, it's a real gain.",
      limit: "La facture peut surprendre. Surveiller l'usage des agents en boucle.",
      limitEn: "The bill can surprise you. Keep an eye on looping agent usage." },
    { persona: "Développeur en agence", personaEn: "Agency developer",
      choice: "GitHub Copilot",
      reason: "Budget prévisible, compatible avec tous les IDEs de l'équipe, plan Business avec opt-out d'entraînement inclus.",
      reasonEn: "Predictable budget, compatible with all team IDEs, Business plan with training opt-out included.",
      limit: "L'agent multi-fichiers reste moins fluide que Cursor.",
      limitEn: "Multi-file agent still less fluid than Cursor." },
    { persona: "Développeur sous NDA", personaEn: "Developer working under NDA",
      choice: "Cursor Ghost Mode",
      reason: "Ghost Mode traite tout en local — aucune donnée envoyée en dehors de votre machine.",
      reasonEn: "Ghost Mode processes everything locally — no data leaves your machine.",
      limit: "Performances réduites par rapport aux modèles cloud frontières.",
      limitEn: "Reduced performance compared to cloud frontier models." },
    { persona: "Entreprise / JetBrains", personaEn: "Enterprise / JetBrains",
      choice: "GitHub Copilot Business",
      reason: "Seul Copilot supporte nativement IntelliJ, PyCharm et les autres IDEs JetBrains.",
      reasonEn: "Only Copilot natively supports IntelliJ, PyCharm and other JetBrains IDEs.",
      limit: "Les code reviews automatisées consomment des minutes Actions payantes depuis 2026.",
      limitEn: "Automated code reviews consume paid Actions minutes since 2026." },
  ],

  pricingFraming:
    "Copilot reste un abonnement logiciel classique. Cursor ressemble de plus en plus à un revendeur d'API cloud déguisé en éditeur de code.",
  pricingFramingEn:
    "Copilot is still a classic software subscription. Cursor increasingly resembles a cloud API reseller disguised as a code editor.",

  pricingToolANotes:
    "Plan Free (gratuit, limité). **Pro à 10$/mois** (ou ~8,33$ en annuel). Pro+ à **39$/mois**. Business et Enterprise disponibles.",
  pricingToolANotesEn:
    "Free plan (limited). **Pro at $10/mo** (or ~$8.33 annually). Pro+ at **$39/mo**. Business and Enterprise available.",

  pricingToolBNotes:
    "Plan Hobby gratuit mais inexploitable. **Pro à 20$/mois**. Pro+ à **60$/mois**. Ultra à **200$/mois**. Teams à **40$/utilisateur/mois**. Bugbot facturé en plus.",
  pricingToolBNotesEn:
    "Hobby free plan, unusable daily. **Pro at $20/mo**. Pro+ at **$60/mo**. Ultra at **$200/mo**. Teams at **$40/user/mo**. Bugbot billed separately.",

  pricingReco:
    "Si le budget est une contrainte, Copilot Pro à 10$/mois est difficile à battre. Si vous êtes solo et que Composer justifie le coût, Cursor Pro à 20$ reste raisonnable — mais activez le mode Auto pour les modèles frontières.",
  pricingRecoEn:
    "If budget is a constraint, Copilot Pro at $10/mo is hard to beat. If you're solo and Composer justifies the cost, Cursor Pro at $20 stays reasonable — but enable Auto mode for frontier models.",

  chooseAIfList: [
    "Votre équipe est sur JetBrains, Visual Studio ou un IDE non-VS Code",
    "Vous avez besoin d'un budget mensuel fixe et prévisible",
    "Vous travaillez dans une grande entreprise avec des contraintes de sécurité",
  ],
  chooseBIfList: [
    "Vous êtes développeur solo et modifiez du code sur plusieurs fichiers tous les jours",
    "Vous voulez accéder aux modèles frontières sans copier-coller depuis une interface web",
    "Vous êtes prêt à changer d'IDE pour un workflow IA plus intégré",
  ],
  avoidAIfList: [
    "Vous refusez de devoir faire un opt-out manuel pour protéger votre code (activé par défaut en 2026).",
  ],
  avoidBIfList: [
    "Vous avez un budget strict et fuyez la facturation à la consommation.",
    "Vous ne voulez pas quitter votre setup actuel — VS Code, JetBrains, peu importe.",
  ],
  avoidBothIfList: [
    "Vous travaillez dans des environnements de défense ou 'air-gapped' où aucune requête cloud n'est autorisée.",
  ],

  aglanceBestForA: "Compatibilité universelle, prix fixe",
  aglanceBestForB: "Multi-fichiers natif, modèles frontières",
  aglanceBudget: "Copilot moins cher et plus prévisible",
  aglanceRisk: "Facture Cursor variable, opt-out Copilot",
  aglanceDefaultLabel: "Copilot par défaut pour compatibilité",
  aglanceLevel: "Copilot simple à installer, Cursor demande un changement d'IDE",
  aglanceHeroPromise: "Extension universelle ou IDE conçu pour l'IA.",
  aglancePositionA: "L'extension universelle",
  aglancePositionB: "L'IDE IA natif",
  aglanceContract: "Ne choisis pas selon les features. Choisis selon ton IDE, ton budget et la fréquence des modifications multi-fichiers.",

  alternatives: [
    { slug: "codeium", name: "Codeium (Windsurf)",
      reason: "Alternative gratuite à Copilot pour l'autocomplétion basique dans tous les IDEs.",
      reasonEn: "Free Copilot alternative for basic autocomplete in all IDEs.",
      price: "Gratuit" },
    { slug: "tabnine", name: "Tabnine",
      reason: "Option 100% locale pour les équipes qui refusent catégoriquement le cloud.",
      reasonEn: "100% local option for teams that refuse cloud entirely.",
      price: "Gratuit / 12$/mois" },
  ],

  faq: [
    { q: "Cursor est-il vraiment différent de GitHub Copilot ?",
      qEn: "Is Cursor really different from GitHub Copilot?",
      a: "Oui. Copilot est une extension qui s'ajoute à votre IDE. Cursor est un IDE entier conçu autour de l'IA. La différence principale : Composer de Cursor coordonne des modifications sur plusieurs fichiers simultanément, ce que Copilot fait moins bien.",
      aEn: "Yes. Copilot is an extension added to your IDE. Cursor is a full IDE designed around AI. The key difference: Cursor's Composer coordinates changes across multiple files at once, something Copilot handles less fluidly." },
    { q: "Peut-on utiliser Cursor avec JetBrains ?",
      qEn: "Can you use Cursor with JetBrains?",
      a: "Non. Cursor est un fork de VS Code. Si vous êtes sur IntelliJ, PyCharm ou WebStorm, seul GitHub Copilot supporte nativement ces IDEs.",
      aEn: "No. Cursor is a VS Code fork. If you're on IntelliJ, PyCharm or WebStorm, only GitHub Copilot natively supports these IDEs." },
    { q: "GitHub Copilot s'entraîne-t-il sur mon code ?",
      qEn: "Does GitHub Copilot train on my code?",
      a: "Sur les plans individuels (Free et Pro), l'entraînement sur vos données est activé par défaut depuis 2026. Vous devez faire un opt-out manuel dans les paramètres GitHub. Sur le plan Business, l'entraînement est désactivé par défaut.",
      aEn: "On individual plans (Free and Pro), training on your data is enabled by default since 2026. You must manually opt out in GitHub settings. On the Business plan, training is disabled by default." },
    { q: "Cursor est-il moins cher que GitHub Copilot ?",
      qEn: "Is Cursor cheaper than GitHub Copilot?",
      a: "Non. Copilot Pro coûte 10$/mois avec un prix fixe. Cursor Pro coûte 20$/mois, plus une facturation variable selon les modèles utilisés. Pour un budget limité, Copilot est l'option plus prévisible.",
      aEn: "No. Copilot Pro costs $10/mo with a fixed price. Cursor Pro costs $20/mo, plus variable billing based on models used. For a limited budget, Copilot is the more predictable option." },
    { q: "Faut-il payer ChatGPT Plus en plus de Cursor ?",
      qEn: "Do you need to pay for ChatGPT Plus on top of Cursor?",
      a: "Non. Cursor intègre déjà GPT-4o et Claude nativement. Pour les tâches de code, Cursor peut remplacer votre abonnement ChatGPT Plus. Inutile de payer les deux.",
      aEn: "No. Cursor already includes GPT-4o and Claude natively. For coding tasks, Cursor can replace your ChatGPT Plus subscription. No need to pay for both." },
  ],
};

/* ─── Editorial content registry ─────────────────────────────────────────── */
const EDITORIAL_CONTENT: Record<string, CompareEditorialContent> = {
  "notion-vs-airtable": NOTION_VS_AIRTABLE,
  "github-copilot-vs-cursor": GITHUB_COPILOT_VS_CURSOR,
};

/* ─── Auto-generate fallback content from tool data ─────────────────────── */
function buildFallbackContent(toolA: Tool, toolB: Tool, lang: "fr" | "en"): CompareEditorialContent {
  const priceA = getPriceNum(toolA);
  const priceB = getPriceNum(toolB);
  const aFerme = toolA.prescription_quality === "ferme";
  const bFerme = toolB.prescription_quality === "ferme";

  const keepsA = toolA.verdict?.keepIf || [];
  const keepsB = toolB.verdict?.keepIf || [];

  return {
    framing: `${toolA.name} et ${toolB.name} : deux approches différentes pour des besoins proches.`,
    framingEn: `${toolA.name} and ${toolB.name}: two different approaches for similar needs.`,
    verdictShort: keepsA[0] && keepsB[0]
      ? `Choisis ${toolA.name} si ${keepsA[0].toLowerCase()}. Choisis ${toolB.name} si ${keepsB[0].toLowerCase()}.`
      : `Le choix dépend de ton usage principal.`,
    verdictShortEn: keepsA[0] && keepsB[0]
      ? `Choose ${toolA.name} if ${keepsA[0].toLowerCase()}. Choose ${toolB.name} if ${keepsB[0].toLowerCase()}.`
      : `The choice depends on your primary use case.`,
    finalRecommendation: keepsA[0] && keepsB[0]
      ? `ToolTrim recommande ${toolA.name} si ${keepsA[0].toLowerCase()}. ${toolB.name} devient meilleur si ${keepsB[0].toLowerCase()}.`
      : `ToolTrim recommande de choisir selon ton usage principal, ton budget réel et le niveau de structure nécessaire.`,
    finalRecommendationEn: keepsA[0] && keepsB[0]
      ? `ToolTrim recommends ${toolA.name} if ${keepsA[0].toLowerCase()}. ${toolB.name} becomes better if ${keepsB[0].toLowerCase()}.`
      : `ToolTrim recommends choosing by primary use case, real budget, and required structure level.`,
    quickVerdictA: keepsA.slice(0, 2).join(". ") || `Tu veux utiliser ${toolA.name} comme outil principal.`,
    quickVerdictAEn: (toolA.verdictEn?.keepIf || keepsA).slice(0, 2).join(". ") || `You want to use ${toolA.name} as your main tool.`,
    quickVerdictB: keepsB.slice(0, 2).join(". ") || `Tu veux utiliser ${toolB.name} comme outil principal.`,
    quickVerdictBEn: (toolB.verdictEn?.keepIf || keepsB).slice(0, 2).join(". ") || `You want to use ${toolB.name} as your main tool.`,
    quickVerdictAvoid: `Les deux outils ont des limites — choisis selon ton usage, pas selon les features.`,
    quickVerdictAvoidEn: `Both tools have limitations — choose based on your use case, not feature lists.`,

    toolADesc: toolA.shortDescription || `${toolA.name} est un outil conçu pour ${(toolA.verdict?.keepIf?.[0] || "optimiser votre productivité").toLowerCase()}.`,
    toolADescEn: toolA.shortDescriptionEn || `${toolA.name} is a tool designed for ${(toolA.verdictEn?.keepIf?.[0] || "boosting your productivity").toLowerCase()}.`,
    toolAUseCases: (toolA.useCases || toolA.covers || []).slice(0, 5).map(String),
    toolAUseCasesEn: (toolA.useCases || toolA.covers || []).slice(0, 5).map(String),
    toolBDesc: toolB.shortDescription || `${toolB.name} est un outil conçu pour ${(toolB.verdict?.keepIf?.[0] || "optimiser votre productivité").toLowerCase()}.`,
    toolBDescEn: toolB.shortDescriptionEn || `${toolB.name} is a tool designed for ${(toolB.verdictEn?.keepIf?.[0] || "boosting your productivity").toLowerCase()}.`,
    toolBUseCases: (toolB.useCases || toolB.covers || []).slice(0, 5).map(String),
    toolBUseCasesEn: (toolB.useCases || toolB.covers || []).slice(0, 5).map(String),

    tableRows: [
      { criterion: "Prise en main", criterionEn: "Ease of use",
        toolA: aFerme ? "Bonne" : "Correcte", toolAEn: aFerme ? "Good" : "Fair",
        toolB: bFerme ? "Bonne" : "Correcte", toolBEn: bFerme ? "Good" : "Fair",
        winner: aFerme && !bFerme ? "A" : bFerme && !aFerme ? "B" : "tie",
        verdictLabel: aFerme && !bFerme ? toolA.name : bFerme && !aFerme ? toolB.name : "Égalité",
        verdictLabelEn: aFerme && !bFerme ? toolA.name : bFerme && !aFerme ? toolB.name : "Tie" },
      { criterion: "Prix de départ", criterionEn: "Starting price",
        toolA: priceA === 0 ? "Gratuit" : `${priceA}€/mois`,
        toolAEn: priceA === 0 ? "Free" : `€${priceA}/mo`,
        toolB: priceB === 0 ? "Gratuit" : `${priceB}€/mois`,
        toolBEn: priceB === 0 ? "Free" : `€${priceB}/mo`,
        winner: priceA <= priceB ? "A" : "B",
        verdictLabel: priceA <= priceB ? toolA.name : toolB.name,
        verdictLabelEn: priceA <= priceB ? toolA.name : toolB.name },
    ],

    prosA: (toolA.pros || []).slice(0, 4).map(String),
    prosAEn: (toolA.pros || []).slice(0, 4).map(String),
    limitsA: (toolA.cons || []).slice(0, 4).map(String),
    limitsAEn: (toolA.cons || []).slice(0, 4).map(String),
    prosB: (toolB.pros || []).slice(0, 4).map(String),
    prosBEn: (toolB.pros || []).slice(0, 4).map(String),
    limitsB: (toolB.cons || []).slice(0, 4).map(String),
    limitsBEn: (toolB.cons || []).slice(0, 4).map(String),

    decisionRows: [
      {
        context: `Tu veux utiliser ${toolA.name} comme outil principal`,
        contextEn: `You want to use ${toolA.name} as your main tool`,
        choice: toolA.name, choiceEn: toolA.name,
      },
      {
        context: `Tu veux utiliser ${toolB.name} comme outil principal`,
        contextEn: `You want to use ${toolB.name} as your main tool`,
        choice: toolB.name, choiceEn: toolB.name,
      },
      {
        context: `Ton budget est limité`,
        contextEn: `Your budget is limited`,
        choice: priceA <= priceB ? toolA.name : toolB.name,
        choiceEn: priceA <= priceB ? toolA.name : toolB.name,
      },
    ],

    decisiveCriteria: [
      {
        title: "Usage principal",
        titleEn: "Primary use case",
        toolA: keepsA[0] || `${toolA.name} convient si son usage couvre ton besoin principal.`,
        toolAEn: (toolA.verdictEn?.keepIf?.[0]) || `${toolA.name} fits if its use case covers your main need.`,
        toolB: keepsB[0] || `${toolB.name} convient si son usage couvre ton besoin principal.`,
        toolBEn: (toolB.verdictEn?.keepIf?.[0]) || `${toolB.name} fits if its use case covers your main need.`,
        decision: "Choisir l'outil qui couvre le flux le plus fréquent, pas celui qui a le plus de fonctions.",
        decisionEn: "Choose the tool that covers the most frequent workflow, not the one with the most features.",
      },
      {
        title: "Coût réel",
        titleEn: "Real cost",
        toolA: priceA === 0 ? "Plan gratuit possible selon volume." : `Payant à prévoir dès ${priceA}€/mois.`,
        toolAEn: priceA === 0 ? "Free plan possible depending on volume." : `Paid plan starts around €${priceA}/month.`,
        toolB: priceB === 0 ? "Plan gratuit possible selon volume." : `Payant à prévoir dès ${priceB}€/mois.`,
        toolBEn: priceB === 0 ? "Free plan possible depending on volume." : `Paid plan starts around €${priceB}/month.`,
        decision: "Auditer si le coût monte avant que l'usage soit hebdomadaire.",
        decisionEn: "Audit if cost rises before weekly usage is real.",
      },
      {
        title: "Risque de surdimensionnement",
        titleEn: "Overbuilding risk",
        toolA: (toolA.verdict?.avoidIf?.[0]) || "À éviter si tu n'utilises qu'une petite partie de l'outil.",
        toolAEn: (toolA.verdictEn?.avoidIf?.[0]) || "Avoid if you only use a small part of the tool.",
        toolB: (toolB.verdict?.avoidIf?.[0]) || "À éviter si tu n'utilises qu'une petite partie de l'outil.",
        toolBEn: (toolB.verdictEn?.avoidIf?.[0]) || "Avoid if you only use a small part of the tool.",
        decision: "Le meilleur choix est souvent le plus petit outil qui couvre le besoin réel.",
        decisionEn: "The best choice is often the smallest tool that covers the real need.",
      },
    ],

    tippingPoint: {
      title: "Le seuil de bascule",
      titleEn: "The tipping point",
      defaultChoice: `Choisis ${priceA <= priceB ? toolA.name : toolB.name} par défaut si le besoin est simple et le budget serré.`,
      defaultChoiceEn: `Choose ${priceA <= priceB ? toolA.name : toolB.name} by default if the need is simple and budget is tight.`,
      switchWhen: `Passe à ${priceA <= priceB ? toolB.name : toolA.name} quand le gain de structure, de collaboration ou d'automatisation justifie le coût.`,
      switchWhenEn: `Switch to ${priceA <= priceB ? toolB.name : toolA.name} when structure, collaboration, or automation gains justify the cost.`,
      signals: [
        "usage hebdomadaire réel",
        "plusieurs personnes concernées",
        "automatisations ou intégrations nécessaires",
        "temps de setup inférieur au temps gagné",
      ],
      signalsEn: [
        "real weekly usage",
        "several people involved",
        "automations or integrations required",
        "setup time lower than time saved",
      ],
    },

    costReality: [
      {
        label: "Prix affiché",
        labelEn: "Listed price",
        toolA: priceA === 0 ? "Gratuit ou prix à vérifier selon plan." : `À partir de ${priceA}€/mois.`,
        toolAEn: priceA === 0 ? "Free or price to check by plan." : `From €${priceA}/month.`,
        toolB: priceB === 0 ? "Gratuit ou prix à vérifier selon plan." : `À partir de ${priceB}€/mois.`,
        toolBEn: priceB === 0 ? "Free or price to check by plan." : `From €${priceB}/month.`,
        recommendation: "Vérifier le prix selon sièges, volume et options réellement utilisées.",
        recommendationEn: "Check price by seats, volume, and options actually used.",
      },
      {
        label: "Quand payer",
        labelEn: "When to pay",
        toolA: "Quand le plan gratuit bloque un usage fréquent.",
        toolAEn: "When the free plan blocks frequent usage.",
        toolB: "Quand le plan gratuit bloque un usage fréquent.",
        toolBEn: "When the free plan blocks frequent usage.",
        recommendation: "Ne paie pas pour une fonctionnalité que tu n'utilises pas chaque semaine.",
        recommendationEn: "Do not pay for a feature you do not use weekly.",
      },
      {
        label: "Coût caché",
        labelEn: "Hidden cost",
        toolA: "Setup, migration, formation ou maintenance du workspace.",
        toolAEn: "Setup, migration, training, or workspace maintenance.",
        toolB: "Setup, migration, formation ou maintenance du workspace.",
        toolBEn: "Setup, migration, training, or workspace maintenance.",
        recommendation: "Le coût réel inclut le temps passé à maintenir l'outil.",
        recommendationEn: "Real cost includes time spent maintaining the tool.",
      },
    ],

    tooltrimRisks: [
      {
        mistake: "Choisir le plus complet",
        mistakeEn: "Choosing the most complete tool",
        consequence: "Tu paies et configures plus que ce que ton usage réel demande.",
        consequenceEn: "You pay for and configure more than your real use requires.",
        recommendation: "Choisis le plus petit outil qui couvre le flux principal.",
        recommendationEn: "Choose the smallest tool that covers the main workflow.",
      },
      {
        mistake: "Décider au prix marketing",
        mistakeEn: "Deciding from marketing price",
        consequence: "Le vrai coût peut venir des sièges, volumes, automatisations ou du temps de setup.",
        consequenceEn: "The real cost can come from seats, volume, automations, or setup time.",
        recommendation: "Compare le coût à ton usage hebdomadaire réel.",
        recommendationEn: "Compare cost to your real weekly usage.",
      },
      {
        mistake: "Garder deux outils qui se chevauchent",
        mistakeEn: "Keeping two overlapping tools",
        consequence: "Les données, tâches ou décisions se retrouvent en double.",
        consequenceEn: "Data, tasks, or decisions become duplicated.",
        recommendation: "Attribue un rôle clair à chaque outil ou coupe le doublon.",
        recommendationEn: "Give each tool a clear role or cut the duplicate.",
      },
    ],

    profiles: [
      { persona: "Solo / Freelance", personaEn: "Solo / Freelancer",
        choice: aFerme ? toolA.name : toolB.name,
        reason: keepsA[0] || `${toolA.name} convient mieux pour un usage solo.`,
        reasonEn: (toolA.verdictEn?.keepIf?.[0]) || `${toolA.name} suits solo use better.`,
        limit: (toolA.verdict?.avoidIf?.[0]) || "À vérifier selon ton usage exact.",
        limitEn: (toolA.verdictEn?.avoidIf?.[0]) || "Check based on your exact use case." },
    ],

    pricingFraming: `${toolA.name} et ${toolB.name} ont des modèles de prix différents. Vérifiez les plans officiels avant de décider.`,
    pricingFramingEn: `${toolA.name} and ${toolB.name} have different pricing models. Check official plans before deciding.`,
    pricingToolANotes: priceA === 0 ? "Plan gratuit disponible." : `À partir de **${priceA}€/mois**.`,
    pricingToolANotesEn: priceA === 0 ? "Free plan available." : `From **€${priceA}/month**.`,
    pricingToolBNotes: priceB === 0 ? "Plan gratuit disponible." : `À partir de **${priceB}€/mois**.`,
    pricingToolBNotesEn: priceB === 0 ? "Free plan available." : `From **€${priceB}/month**.`,
    pricingReco: `Comparer les plans payants selon vos besoins réels.`,
    pricingRecoEn: `Compare paid plans based on your actual needs.`,
    /* ── Structured verdict bullet lists (fallback: derive from keepsA/B) ── */
    chooseAIfList: (toolA.verdict?.keepIf || keepsA).slice(0, 3).map(String),
    chooseBIfList: (toolB.verdict?.keepIf || keepsB).slice(0, 3).map(String),
    avoidAIfList: (toolA.verdict?.avoidIf || []).slice(0, 2).map(String),
    avoidBIfList: (toolB.verdict?.avoidIf || []).slice(0, 2).map(String),
    avoidBothIfList: [],
    /* ── Hero signal overrides (none for fallback) ── */
    aglanceBestForA: undefined,
    aglanceBestForB: undefined,
    aglanceBudget: undefined,
    aglanceRisk: undefined,
    aglanceDefaultLabel: undefined,
    aglanceLevel: undefined,
    aglanceHeroPromise: undefined,
    aglancePositionA: undefined,
    aglancePositionB: undefined,
    aglanceContract: undefined,
    alternatives: [],
    faq: [
      { q: `${toolA.name} ou ${toolB.name} — lequel est moins cher ?`,
        qEn: `${toolA.name} or ${toolB.name} — which is cheaper?`,
        a: `${toolA.name} coûte ${getPrice(toolA)} et ${toolB.name} coûte ${getPrice(toolB)}.`,
        aEn: `${toolA.name} costs ${getPrice(toolA)} and ${toolB.name} costs ${getPrice(toolB)}.` },
      { q: `${toolA.name} vs ${toolB.name} — lequel choisir ?`,
        qEn: `${toolA.name} vs ${toolB.name} — which to choose?`,
        a: `${keepsA[0] ? `Prends ${toolA.name} si ${keepsA[0].toLowerCase()}. ` : ""}${keepsB[0] ? `Prends ${toolB.name} si ${keepsB[0].toLowerCase()}.` : ""}`,
        aEn: `${keepsA[0] ? `Choose ${toolA.name} if ${keepsA[0].toLowerCase()}. ` : ""}${keepsB[0] ? `Choose ${toolB.name} if ${keepsB[0].toLowerCase()}.` : ""}` },
    ],
  };
}

interface CompareNavSection {
  id: string;
  label: string;
}

function CompareStickyNav({ sections, prefix }: { sections: CompareNavSection[]; prefix: string }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sections.length === 0) return;
    const nodes = sections
      .map((section) => document.getElementById(section.id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (nodes.length === 0) return;

    const updateActive = () => {
      let current = nodes[0].id;
      nodes.forEach((node) => {
        if (node.getBoundingClientRect().top <= 180) current = node.id;
      });
      setActiveId(current);
    };

    const sectionObserver = new IntersectionObserver(updateActive, {
      rootMargin: "-160px 0px -58% 0px",
      threshold: [0, 0.2, 0.45],
    });
    nodes.forEach((node) => sectionObserver.observe(node));
    updateActive();

    const hero = document.querySelector(".cp-hero");
    const heroObserver = hero
      ? new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), { threshold: 0 })
      : null;
    if (hero && heroObserver) heroObserver.observe(hero);

    return () => {
      sectionObserver.disconnect();
      heroObserver?.disconnect();
    };
  }, [sections]);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  };

  return (
    <nav className={`compare-sticky-nav${visible ? "" : " compare-sticky-nav--hidden"}`} aria-label="Navigation du comparatif">
      <Link to={`${prefix}/comparatifs`} className="compare-sticky-nav-logo" aria-label="Retour aux comparatifs">
        VS
      </Link>
      <div className="compare-sticky-nav-items">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className={`compare-sticky-nav-item${activeId === section.id ? " compare-sticky-nav-item--active" : ""}`}
            aria-current={activeId === section.id ? "page" : undefined}
            onClick={(event) => handleClick(event, section.id)}
          >
            {section.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
const ComparePage = () => {
  const { slugPair } = useParams<{ slugPair: string }>();
  const { lang, t, prefix } = useLang();
  const { tools, loading } = useTools();

  const parsedPair = useMemo(() => {
    if (!slugPair) return null;
    const featured = COMPARISONS.find((c) => c.slugPair === slugPair);
    if (featured) return { idA: featured.toolA, idB: featured.toolB };
    const parts = slugPair.split("-vs-");
    if (parts.length === 2) return { idA: parts[0], idB: parts[1] };
    return null;
  }, [slugPair]);

  const toolA = useMemo(() => parsedPair ? findTool(tools, parsedPair.idA) : undefined, [tools, parsedPair]);
  const toolB = useMemo(() => parsedPair ? findTool(tools, parsedPair.idB) : undefined, [tools, parsedPair]);

  useEffect(() => {
    if (!toolA || !toolB) return;
    const year = new Date().getFullYear();
    const title = lang === "fr"
      ? `${toolA.name} vs ${toolB.name} ${year} — comparatif, prix et verdict | ToolTrim`
      : `${toolA.name} vs ${toolB.name} ${year} — comparison, pricing & verdict | ToolTrim`;
    const desc = lang === "fr"
      ? `${toolA.name} ou ${toolB.name} ? Comparatif complet : logiques différentes, profils adaptés, prix réels et verdict ToolTrim. Décide en 5 minutes.`
      : `${toolA.name} or ${toolB.name}? Full comparison: different logics, profiles, real pricing and ToolTrim verdict. Decide in 5 minutes.`;
    const url = `${SEO_BASE}/${lang}/comparatif/${slugPair}`;
    setSeoTags({ title, description: desc, url, locale: lang === "fr" ? "fr_FR" : "en_US" });
    setHreflang(`/${lang}/comparatif/${slugPair}`);
    setJsonLd("compare-jsonld", {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: title,
      description: desc,
      url,
      numberOfItems: 2,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: toolA.name, url: `${SEO_BASE}/${lang}/tool/${toolA.slug}` },
        { "@type": "ListItem", position: 2, name: toolB.name, url: `${SEO_BASE}/${lang}/tool/${toolB.slug}` },
      ],
      author: { "@type": "Organization", name: "ToolTrim", url: SEO_BASE },
      publisher: { "@type": "Organization", name: "ToolTrim", url: SEO_BASE },
      datePublished: "2026-03-13",
      inLanguage: lang,
    });
    return () => cleanupSeo(["compare-jsonld", "compare-faq-jsonld"]);
  }, [toolA, toolB, lang, slugPair]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label={t("Chargement en cours", "Loading")}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #DADAD4", borderTopColor: "#222222", animation: "spin 0.8s linear infinite" }} aria-hidden="true" />
        <span className="sr-only">{t("Chargement en cours…", "Loading…")}</span>
      </div>
    );
  }

  if (!parsedPair || !toolA || !toolB) {
    return (
      <div className="cp-not-found">
        <div className="cp-not-found-inner">
          <span className="cp-eyebrow">{t("Comparatif introuvable", "Comparison not found")}</span>
          <h1 className="cp-not-found-title">
            {t("Ce comparatif n'existe pas encore.", "This comparison doesn't exist yet.")}
          </h1>
          <p className="cp-not-found-body">
            {t(
              "Le duel que tu cherches n'est pas encore dans notre base. Consulte la liste des comparatifs disponibles.",
              "The matchup you're looking for isn't in our database yet. Browse the available comparisons."
            )}
          </p>
          <Link to={`${prefix}/comparatifs`} className="tt-button-primary">
            {t("Voir tous les comparatifs →", "See all comparisons →")}
          </Link>
        </div>
      </div>
    );
  }

  const battleData = slugPair && slugPair in BATTLE_COMPARISON_DATA
    ? BATTLE_COMPARISON_DATA[slugPair as BattleComparisonSlug] as BattleRawData
    : undefined;
  const content = battleData
    ? buildBattleEditorialContent(battleData)
    : EDITORIAL_CONTENT[slugPair ?? ""] ?? buildFallbackContent(toolA, toolB, lang);

  const framing = lang === "fr" ? content.framing : content.framingEn;
  const verdictShort = lang === "fr" ? content.verdictShort : content.verdictShortEn;
  /* Verdict 2-card layout */
  const verdictCardTitleA = lang === "fr" ? (content.verdictCardTitleA ?? "") : (content.verdictCardTitleAEn ?? "");
  const verdictCardTitleB = lang === "fr" ? (content.verdictCardTitleB ?? "") : (content.verdictCardTitleBEn ?? "");
  const verdictCardTextA = lang === "fr"
    ? (content.verdictCardTextA || content.chooseAIfList[0] || "")
    : (content.verdictCardTextAEn || content.chooseAIfList[0] || "");
  const verdictCardTextB = lang === "fr"
    ? (content.verdictCardTextB || content.chooseBIfList[0] || "")
    : (content.verdictCardTextBEn || content.chooseBIfList[0] || "");
  const verdictWarningText = lang === "fr"
    ? (content.verdictWarning || content.quickVerdictAvoid)
    : (content.verdictWarningEn || content.quickVerdictAvoidEn);
  const learningCurveRow = content.tableRows.find((row) => row.criterion === "Prise en main" || row.criterionEn === "Learning curve");
  const decisionTableRows = getDecisionTableRows(content.tableRows);
  const bestForA = content.aglanceBestForA || getToolBestFor(content, "A", lang);
  const bestForB = content.aglanceBestForB || getToolBestFor(content, "B", lang);
  const defaultChoice = content.aglanceDefaultLabel || getDefaultChoice(content, toolA, toolB, lang);
  const budgetSignal = content.aglanceBudget || getBudgetSignal(toolA, toolB, lang);
  const levelSignal = content.aglanceLevel || getLearningCurve(learningCurveRow, lang);
  const riskSignal = content.aglanceRisk || getToolTrimRisk(content, lang);
  /* Hero duel — Sprint 62/66 */
  const heroPromise = content.aglanceHeroPromise || framing;
  // Position labels (small uppercase, 10px) — only use explicit values, NOT bestForA fallback (too long)
  const heroPositionA = content.aglancePositionA ?? null;
  const heroPositionB = content.aglancePositionB ?? null;
  const heroContract = content.aglanceContract || (lang === "fr" ? content.finalRecommendation : content.finalRecommendationEn);
  const fallbackPitfalls = getPitfalls(content, toolA, toolB, lang);

  // Find alternative tools from the loaded tools list
  const altTools = content.alternatives.map((alt) => ({
    ...alt,
    tool: tools.find((t) => t.slug === alt.slug || t.id === alt.slug),
  }));
  const navSections: CompareNavSection[] = [
    { id: "criteres", label: t("Critères", "Criteria") },
    { id: "cout", label: t("Coût", "Cost") },
    { id: "features", label: t("Tableau", "Table") },
    { id: "seuil", label: t("Seuil", "Threshold") },
    { id: "vigilance", label: t("Attention", "Watchout") },
    ...(altTools.length > 0 ? [{ id: "alternatives", label: t("Alternatives", "Alternatives") }] : []),
    ...(content.faq.length > 0 ? [{ id: "faq", label: "FAQ" }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="cp-hero">
        <div className="cp-hero-inner">
          <nav className="cp-breadcrumb" aria-label="Breadcrumb">
            <Link to={`${prefix}/comparatifs`}>{t("Comparatifs", "Comparisons")}</Link>
            <span>/</span>
            <span>{toolA.name} vs {toolB.name}</span>
          </nav>

          <span className="cp-eyebrow">{t("COMPARATIF", "COMPARISON")}</span>

          <h1 className="cp-hero-title">
            {toolA.name} vs {toolB.name}.
          </h1>

          <p className="cp-hero-promise">{heroPromise}</p>

          {/* Face-à-face duel — enhanced with verdict card content */}
          <div className="cp-hero-duel" aria-label={t("Face-à-face des deux outils", "Head-to-head comparison")}>
            <article className="cp-hero-duel-card">
              <div className="cp-hero-duel-head">
                <ToolLogo tool={toolA} size={48} className="cp-hero-duel-logo" />
                <div>
                  {heroPositionA && <p className="cp-hero-duel-position">{heroPositionA}</p>}
                  <h2 className="cp-hero-duel-name">{toolA.name}</h2>
                </div>
              </div>
              {verdictCardTitleA && (
                <p className="cp-hero-duel-verdict-title">{verdictCardTitleA}</p>
              )}
              <p className="cp-hero-duel-desc">{verdictCardTextA || bestForA}</p>
            </article>

            <div className="cp-hero-duel-vs" aria-hidden="true"><span>VS</span></div>

            <article className="cp-hero-duel-card cp-hero-duel-card--right">
              <div className="cp-hero-duel-head">
                <ToolLogo tool={toolB} size={48} className="cp-hero-duel-logo" />
                <div>
                  {heroPositionB && <p className="cp-hero-duel-position">{heroPositionB}</p>}
                  <h2 className="cp-hero-duel-name">{toolB.name}</h2>
                </div>
              </div>
              {verdictCardTitleB && (
                <p className="cp-hero-duel-verdict-title">{verdictCardTitleB}</p>
              )}
              <p className="cp-hero-duel-desc">{verdictCardTextB || bestForB}</p>
            </article>
          </div>

          {content.aglanceHeroBrief && (
            <p className="cp-hero-brief">{content.aglanceHeroBrief}</p>
          )}

          {/* Callout : règle anti-doublon */}
          <div className="compare-verdict-callout">
            <span className="tt-fact-label">
              {t("Ne paie pas les deux sans règle claire", "Don't pay for both without a clear rule")}
            </span>
            <p className="tt-body-large">{verdictWarningText}</p>
          </div>

          {/* Micro-fiche courte — 3 cellules */}
          <div className="cp-hero-microfact" aria-label={t("Signaux clés", "Key signals")}>
            <div className="cp-hero-microfact-cell">
              <span>{t("Par défaut", "Default")}</span>
              <p>{defaultChoice}</p>
            </div>
            <div className="cp-hero-microfact-cell">
              <span>{t("Coût réel", "Real cost")}</span>
              <p>{budgetSignal}</p>
            </div>
            <div className="cp-hero-microfact-cell">
              <span>{t("Risque", "Risk")}</span>
              <p>{riskSignal}</p>
            </div>
          </div>
        </div>
      </section>

      <CompareStickyNav sections={navSections} prefix={prefix} />

      {/* ── 01 Critères décisionnels — matrice de décision ─────────────── */}
      <section id="criteres" className="cp-section scroll-mt-20">
        <div className="cp-container">

          {/* Full-width header: counter → eyebrow → title → intro */}
          <div className="cp-matrix-header">
            <span className="cp-section-counter" aria-hidden="true">01</span>
            <span className="cp-eyebrow">{t("Critères décisionnels", "Decision criteria")}</span>
            <h2 className="cp-title">{t("Les critères qui changent le choix.", "The criteria that change the choice.")}</h2>
            <p className="cp-matrix-intro">
              {t(
                "Pas les features les plus visibles. Les critères qui changent vraiment la décision.",
                "Not the most visible features. The criteria that actually change the decision.",
              )}
            </p>
          </div>

          {/* Full-width criterion table — Awwwards bordered grid (Sprint 75) */}
          <div className="cp-criterion-table">
              {/* Column headers — tool names */}
              <div className="cp-crit-table-head">
                <div className="cp-crit-table-th">
                  <ToolLogo tool={toolA} size={16} className="flex-shrink-0" />
                  <span>{toolA.name}</span>
                </div>
                <div className="cp-crit-table-th">
                  <ToolLogo tool={toolB} size={16} className="flex-shrink-0" />
                  <span>{toolB.name}</span>
                </div>
              </div>
              {/* Criterion blocks: label+verdict row / tool cells row */}
              {content.decisiveCriteria.slice(0, 6).map((criterion) => {
                const levels = getCriterionLevels(criterion, toolA, toolB, lang);
                return (
                  <div key={criterion.title} className="cp-crit-table-block">
                    <div className="cp-crit-table-label-row">
                      <span className="cp-crit-table-label">
                        {lang === "fr" ? criterion.title : criterion.titleEn}
                      </span>
                      <p className="cp-crit-table-decision">
                        {lang === "fr" ? criterion.decision : criterion.decisionEn}
                      </p>
                    </div>
                    <div className="cp-crit-table-tools">
                      <div className={`cp-crit-table-tool${levels.winner === "A" ? " cp-crit-table-tool--winner" : ""}`}>
                        <span className="cp-crit-table-mobile-label">{toolA.name}</span>
                        <p className="cp-crit-table-tool-text">{lang === "fr" ? criterion.toolA : criterion.toolAEn}</p>
                      </div>
                      <div className={`cp-crit-table-tool${levels.winner === "B" ? " cp-crit-table-tool--winner" : ""}`}>
                        <span className="cp-crit-table-mobile-label">{toolB.name}</span>
                        <p className="cp-crit-table-tool-text">{lang === "fr" ? criterion.toolB : criterion.toolBEn}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* ── 03 Coût réel — matrice financière ────────────────────────────── */}
      <section id="cout" className="cp-section cp-section--cost scroll-mt-20">
        <div className="cp-container">

          {/* Full-width header: counter → eyebrow → title → framing → reco */}
          <div className="cp-matrix-header">
            <span className="cp-section-counter" aria-hidden="true">02</span>
            <span className="cp-eyebrow">{t("Coût réel", "Real cost")}</span>
            <h2 className="cp-title">{t("Ce que tu paies vraiment.", "What you really pay for.")}</h2>
            <p className="cp-matrix-intro">
              {lang === "fr" ? content.pricingFraming : content.pricingFramingEn}
            </p>
            <div className="cp-cost-reco">
              <span className="tt-fact-label">
                {t("Recommandation ToolTrim", "ToolTrim recommendation")}
              </span>
              <p className="tt-body-large">{lang === "fr" ? content.pricingReco : content.pricingRecoEn}</p>
            </div>
          </div>

          {/* Full-width criterion table — Awwwards bordered grid (Sprint 75) */}
          <div className="cp-criterion-table">
              {/* Column headers — tool names */}
              <div className="cp-crit-table-head">
                <div className="cp-crit-table-th">
                  <ToolLogo tool={toolA} size={16} className="flex-shrink-0" />
                  <span>{toolA.name}</span>
                </div>
                <div className="cp-crit-table-th">
                  <ToolLogo tool={toolB} size={16} className="flex-shrink-0" />
                  <span>{toolB.name}</span>
                </div>
              </div>
              {/* Cost blocks: label+recommendation row / tool cells row */}
              {content.costReality.map((row) => (
                <div key={row.label} className="cp-crit-table-block">
                  <div className="cp-crit-table-label-row">
                    <span className="cp-crit-table-label">
                      {lang === "fr" ? row.label : row.labelEn}
                    </span>
                    <p className="cp-crit-table-decision">
                      {lang === "fr" ? row.recommendation : row.recommendationEn}
                    </p>
                  </div>
                  <div className="cp-crit-table-tools">
                    <div className="cp-crit-table-tool">
                      <span className="cp-crit-table-mobile-label">{toolA.name}</span>
                      <p className="cp-crit-table-tool-text">{lang === "fr" ? row.toolA : row.toolAEn}</p>
                    </div>
                    <div className="cp-crit-table-tool">
                      <span className="cp-crit-table-mobile-label">{toolB.name}</span>
                      <p className="cp-crit-table-tool-text">{lang === "fr" ? row.toolB : row.toolBEn}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* ── 04 Ce qui change vraiment le choix ────────────────────────────── */}
      {decisionTableRows.length > 0 && (
        <section id="features" className="cp-section scroll-mt-20">
          <div className="cp-container">
            <span className="cp-section-counter" aria-hidden="true">03</span>
            <span className="cp-eyebrow">{t("Critères décisifs", "Decisive criteria")}</span>
            <h2 className="cp-title">{t("Ce qui change vraiment le choix.", "What actually changes the decision.")}</h2>
            <div className="cp-verdict-legend" aria-hidden="true">
              <span className="cp-verdict-legend-tool">
                <ToolLogo tool={toolA} size={14} className="flex-shrink-0" />
                {toolA.name}
              </span>
              <span className="cp-verdict-legend-vs">vs</span>
              <span className="cp-verdict-legend-tool">
                <ToolLogo tool={toolB} size={14} className="flex-shrink-0" />
                {toolB.name}
              </span>
            </div>
            <div className="cp-verdict-list" role="list">
              {decisionTableRows.map((row, index) => {
                const aTitle = lang === "fr" ? row.toolA : row.toolAEn;
                const aNote = lang === "fr" ? row.toolANote : row.toolANoteEn;
                const bTitle = lang === "fr" ? row.toolB : row.toolBEn;
                const bNote = lang === "fr" ? row.toolBNote : row.toolBNoteEn;
                const crit = lang === "fr" ? row.criterion : row.criterionEn;
                const verdict = lang === "fr" ? row.verdictLabel : row.verdictLabelEn;
                return (
                  <div key={row.criterion} className="cp-verdict-item" role="listitem">
                    {/* Left: criterion + tool answers */}
                    <div className="cp-verdict-item-left">
                      <span className="cp-verdict-item-num">{String(index + 1).padStart(2, "0")}</span>
                      <p className="cp-verdict-item-criterion">{crit}</p>
                      <div className="cp-verdict-item-tools">
                        <div className={`cp-verdict-item-tool${row.winner === "A" ? " cp-verdict-item-tool--win" : ""}`}>
                          <span className="cp-verdict-item-tool-name">{toolA.name}</span>
                          <span className="cp-verdict-item-tool-value">{aTitle}</span>
                          {aNote && <span className="cp-verdict-item-tool-note">{aNote}</span>}
                        </div>
                        <div className={`cp-verdict-item-tool${row.winner === "B" ? " cp-verdict-item-tool--win" : ""}`}>
                          <span className="cp-verdict-item-tool-name">{toolB.name}</span>
                          <span className="cp-verdict-item-tool-value">{bTitle}</span>
                          {bNote && <span className="cp-verdict-item-tool-note">{bNote}</span>}
                        </div>
                      </div>
                    </div>
                    {/* Right: verdict statement */}
                    <div className="cp-verdict-item-right">
                      <p className="cp-verdict-item-verdict">{verdict}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── 05 Seuil de bascule ───────────────────────────────────────────── */}
      <section id="seuil" className="cp-section cp-section--tipping scroll-mt-20">
        <div className="cp-container">
          <div className="cp-matrix-header">
            <span className="cp-section-counter" aria-hidden="true">04</span>
            <span className="cp-eyebrow">{t("Seuil de bascule", "Tipping point")}</span>
            <h2 className="cp-title">{lang === "fr" ? content.tippingPoint.title : content.tippingPoint.titleEn}</h2>
            <p className="cp-matrix-intro">
              {t(
                "Un seul critère suffit à faire basculer le choix. Voici la logique.",
                "One criterion is enough to tip the decision. Here's the logic."
              )}
            </p>
          </div>

          {/* Directional flow card */}
          <div className="cp-tipping-card">
            <div className="cp-tipping-card-state">
              <span className="tt-fact-label">{t("Par défaut", "Default")}</span>
              <p className="cp-tipping-card-text">
                {lang === "fr" ? content.tippingPoint.defaultChoice : content.tippingPoint.defaultChoiceEn}
              </p>
            </div>
            <div className="cp-tipping-card-arrow" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="cp-tipping-card-state cp-tipping-card-state--switch">
              <span className="tt-fact-label">{t("Bascule si", "Switch when")}</span>
              <p className="cp-tipping-card-text">
                {lang === "fr" ? content.tippingPoint.switchWhen : content.tippingPoint.switchWhenEn}
              </p>
            </div>
          </div>

          {/* Numbered rules */}
          {(lang === "fr" ? content.tippingPoint.signals : content.tippingPoint.signalsEn).length > 0 && (
            <div className="cp-tipping-rules">
              <span className="tt-fact-label cp-tipping-rules-heading">{t("À retenir", "Key rules")}</span>
              <ol className="cp-tipping-rules-list">
                {(lang === "fr" ? content.tippingPoint.signals : content.tippingPoint.signalsEn).slice(0, 3).map((signal, i) => (
                  <li key={i} className="cp-tipping-rule">
                    <span className="cp-tipping-rule-num">{String(i + 1).padStart(2, "0")}</span>
                    <p>{signal}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* CTA */}
          <div className="cp-tipping-cta">
            <Link to={`${prefix}/selector?from=${slugPair}`} className="tt-button-light">
              {t("Vérifier ma stack →", "Check my stack →")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── 06 Points de vigilance ────────────────────────────────────────── */}
      <section id="vigilance" className="cp-section scroll-mt-20">
        <div className="cp-container">
          <div className="cp-matrix-header">
            <span className="cp-section-counter" aria-hidden="true">05</span>
            <span className="cp-eyebrow">{t("Attention", "Watchout")}</span>
            <h2 className="cp-title">{t("Les erreurs de choix fréquentes.", "Common decision mistakes.")}</h2>
            <p className="cp-matrix-intro">
              {t(
                "Le mauvais choix coûte rarement seulement un abonnement. Il coûte surtout de la clarté, du temps et de la concentration.",
                "The wrong choice rarely costs just a subscription. It mostly costs clarity, time, and focus."
              )}
            </p>
          </div>
          <div className="cp-pitfall-grid">
            {(content.tooltrimRisks.length > 0 ? content.tooltrimRisks : fallbackPitfalls.map((pitfall) => ({
              mistake: pitfall,
              mistakeEn: pitfall,
              consequence: "",
              consequenceEn: "",
              recommendation: "",
              recommendationEn: "",
            }))).slice(0, 3).map((risk, i) => (
              <article key={`${risk.mistake}-${i}`} className="cp-pitfall-card">
                <span className="cp-pitfall-index">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="cp-pitfall-title">{lang === "fr" ? risk.mistake : risk.mistakeEn}</h3>
                {(lang === "fr" ? risk.consequence : risk.consequenceEn) && (
                  <p className="cp-pitfall-consequence">{lang === "fr" ? risk.consequence : risk.consequenceEn}</p>
                )}
                {(lang === "fr" ? risk.recommendation : risk.recommendationEn) && (
                  <div className="cp-pitfall-fix">
                    <span className="tt-fact-label">{t("Correction ToolTrim", "ToolTrim fix")}</span>
                    <p>{lang === "fr" ? risk.recommendation : risk.recommendationEn}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 07 Alternatives ────────────────────────────────────────────────── */}
      {altTools.length > 0 && (
        <section id="alternatives" className="cp-section scroll-mt-20">
          <div className="cp-container">
            <span className="cp-section-counter" aria-hidden="true">06</span>
            <span className="cp-eyebrow">{t("Pour aller plus loin", "Next options")}</span>
            <h2 className="cp-title cp-title--section-lead">
              {t("Si aucun des deux ne colle.", "If neither one fits.")}
            </h2>
            <div>
              {altTools.map((alt) => (
                alt.tool ? (
                  <Link key={alt.slug} to={`${prefix}/tool/${alt.tool.slug}`} className="cp-alt-row">
                    <div className="cp-alt-logo"><ToolLogo tool={alt.tool} size={24} /></div>
                    <div className="cp-alt-content">
                      <p className="cp-alt-name">{alt.tool.name}</p>
                      <p className="cp-alt-reason">{lang === "fr" ? alt.reason : alt.reasonEn}</p>
                    </div>
                    <div className="cp-alt-right">
                      {alt.price && <span className="cp-alt-price">{alt.price}</span>}
                      <span className="cp-alt-cta">{t("Voir la fiche", "See review")} →</span>
                    </div>
                  </Link>
                ) : (
                  <div key={alt.slug} className="cp-alt-row" style={{ cursor: "default" }}>
                    <div className="cp-alt-logo">
                      <ToolLogo tool={{ name: alt.name, slug: slugifyName(alt.name) }} size={24} />
                    </div>
                    <div className="cp-alt-content">
                      <p className="cp-alt-name">{alt.name}</p>
                      <p className="cp-alt-reason">{lang === "fr" ? alt.reason : alt.reasonEn}</p>
                    </div>
                    {alt.price && <div className="cp-alt-right"><span className="cp-alt-price">{alt.price}</span></div>}
                  </div>
                )
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      {content.faq.length > 0 && (
        <section id="faq" className="cp-section cp-section--last scroll-mt-20">
          <div className="cp-container">
            <span className="cp-section-counter" aria-hidden="true">{altTools.length > 0 ? "07" : "06"}</span>
            <span className="cp-eyebrow">FAQ</span>
            <h2 className="cp-title cp-title--section-lead">
              {t("Questions fréquentes.", "Frequently asked questions.")}
            </h2>
            <div>
              {content.faq.map((item, i) => (
                <FaqItem
                  key={i}
                  question={lang === "fr" ? item.q : item.qEn}
                  answer={lang === "fr" ? item.a : item.aEn}
                  defaultOpen={i === 0}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA diagnostic ─────────────────────────────────────────────────── */}
      <div className="cp-cta-band">
        <div className="cp-container">
          <span className="cp-eyebrow">{t("Diagnostic", "Diagnostic")}</span>
          <p className="tt-cta-title">
            {t(
              `${toolA.name} ou ${toolB.name} sont déjà dans ta stack ?`,
              `${toolA.name} or ${toolB.name} already in your stack?`,
            )}
          </p>
          <p className="cp-cta-band-desc">
            {t(
              "Analyse tes outils actuels et vérifie si tu n'as pas déjà plusieurs outils qui font le même travail.",
              "Audit your current tools and check if you already have overlapping subscriptions.",
            )}
          </p>
          <Link to={`${prefix}/selector?from=${slugPair}`} className="tt-button-primary">
            {t("Analyser ma stack →", "Analyze my stack →")}
          </Link>
        </div>
      </div>

    </div>
  );
};

/* ─── FAQ Item ───────────────────────────────────────────────────────────── */
function FaqItem({ question, answer, defaultOpen = false }: { question: string; answer: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details className="cp-faq-item" open={defaultOpen} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary className="cp-faq-summary">
        <span>{question}</span>
        <ChevronDown
          size={16}
          style={{
            flexShrink: 0, color: "var(--color-muted-light, #9A9A92)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 160ms ease-out",
          }}
        />
      </summary>
      <p className="cp-faq-answer">{answer}</p>
    </details>
  );
}

export default ComparePage;
