import { useParams, Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useToolPair, useToolSummaries } from "@/hooks/useSupabaseData";
import { useEffect, useMemo, useState, useRef, type MouseEvent } from "react";
import { ArrowRight } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import ToolComparisonTable from "@/components/tool/ToolComparisonTable";
import FaqBlock from "@/components/FaqBlock";
import Breadcrumb from "@/components/Breadcrumb";
import { setSeoTags, setMeta, setJsonLd, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";
import type { Tool } from "@/data/types";
import { FEATURED_COMPARISONS as COMPARISONS } from "@/data/comparisons";
import { BATTLE_COMPARISON_DATA, type BattleComparisonSlug } from "@/data/comparisonBattles";

/* ─── Helpers ────────────────────────────────────────────────────────────── */
// findTool removed — useToolPair now resolves slugs directly via targeted query.
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
interface CompareFaqItem { q: string; qEn: string; a: string; aEn: string; theme?: string; themeEn?: string; }
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
  /* ── Editorial signature ── */
  checkedAt?: string; // ISO date "YYYY-MM-DD" — when the verdict was last reviewed
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
  /* ── Quick decision tree (hero) ── */
  quickDecisionTree?: Array<{condition: string; conditionEn: string; answer: string; answerEn: string}>;
  /* ── Section intro overrides ── */
  criteriaIntro?: string; criteriaIntroEn?: string;
  featuresIntro?: string; featuresIntroEn?: string;
  tippingIntro?: string; tippingIntroEn?: string;
  risksIntro?: string; risksIntroEn?: string;
  faqIntro?: string; faqIntroEn?: string;
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
  checkedAt?: string;
  lastUpdatedAt?: string;
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
    : (comparison.decisiveCriteria || []).map((c) => ({
        title: c.label,
        toolA: c.toolA,
        toolB: c.toolB,
        decision: c.decision,
      }));
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
    checkedAt: data.checkedAt,
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
    "Copilot s'installe en 2 minutes sans rien changer à votre éditeur. Cursor vous demande de changer d'IDE. Ce n'est pas une différence de features — c'est une question de jusqu'où vous voulez que l'IA entre dans votre façon de coder.",
  framingEn:
    "Copilot installs in 2 minutes without changing your editor. Cursor asks you to switch IDEs. This isn't a feature difference — it's about how far you want AI to go in how you code.",

  aglanceHeroBrief:
    "Sur JetBrains ou Visual Studio : Copilot, point final. Vous copiez-collez depuis l'interface d'un LLM vers votre éditeur tous les jours : Cursor résout ça nativement. Vous payez déjà Claude Pro ou ChatGPT Plus pour coder : Cursor les remplace probablement.",

  verdictShort:
    "Solo sur VS Code, features entières, facture variable acceptable ? Cursor. JetBrains, Visual Studio, équipe ou budget fixe ? Copilot.",
  verdictShortEn:
    "Solo on VS Code, shipping entire features, comfortable with variable billing? Cursor. JetBrains, Visual Studio, team or fixed budget? Copilot.",

  finalRecommendation:
    "Copilot par défaut pour les équipes, les agences, et quiconque est sur JetBrains ou Visual Studio. Si vous êtes solo sur VS Code et que vous copiez-collez depuis l'interface d'un LLM vers votre éditeur — Cursor résout ce problème et revient souvent moins cher que Copilot + ChatGPT Plus ensemble.",
  finalRecommendationEn:
    "Copilot by default for teams, agencies, and anyone on JetBrains or Visual Studio. If you're solo on VS Code and copy-pasting from an LLM web interface to your editor — Cursor solves that and often costs less than Copilot + ChatGPT Plus combined.",

  quickVerdictA:
    "Votre équipe est sur JetBrains, IntelliJ ou Visual Studio. Ou vous avez un budget mensuel strict et n'avez pas envie de surveiller une facture variable.",
  quickVerdictAEn:
    "Your team is on JetBrains, IntelliJ or Visual Studio. Or you have a strict monthly budget and don't want to track variable billing.",
  quickVerdictB:
    "Vous êtes solo sur VS Code, vous modifiez plusieurs fichiers liés en même temps, et vous payez déjà ChatGPT Plus ou Claude Pro pour du code.",
  quickVerdictBEn:
    "You're solo on VS Code, edit multiple linked files at once, and already pay for ChatGPT Plus or Claude Pro for coding.",
  quickVerdictAvoid:
    "Vous travaillez dans des environnements de défense ou air-gapped sans accès cloud. Aucun des deux ne fonctionne dans ce contexte.",
  quickVerdictAvoidEn:
    "You work in defense or air-gapped environments without cloud access. Neither tool works in that context.",

  verdictCardTitleA: "L'extension universelle",
  verdictCardTitleAEn: "The universal extension",
  verdictCardTextA:
    "Votre IDE reste le même. Prix fixe, zéro friction d'adoption.",
  verdictCardTextAEn:
    "Your IDE stays the same. Fixed price, zero adoption friction.",
  verdictCardTitleB: "L'IDE IA natif",
  verdictCardTitleBEn: "The AI-native IDE",
  verdictCardTextB:
    "Composer coordonne plusieurs fichiers à la fois. Pour un dev solo qui shippe, la différence est palpable.",
  verdictCardTextBEn:
    "Composer coordinates multiple files at once. For a solo dev shipping features, the difference is real.",
  verdictWarning:
    "Vous payez déjà Claude Pro ou ChatGPT Plus pour coder ? Cursor les intègre nativement. Cursor Pro (20$) + annuler Claude/ChatGPT revient souvent moins cher que Copilot (10$) + garder les deux.",
  verdictWarningEn:
    "Already paying Claude Pro or ChatGPT Plus to code? Cursor includes both natively. Cursor Pro ($20) + canceling Claude/ChatGPT often costs less than Copilot ($10) + keeping both.",

  toolADesc:
    "Copilot s'installe comme n'importe quelle extension — VS Code, JetBrains, Visual Studio. Vous ne changez rien à votre workflow, vous ajoutez de l'intelligence dessus. C'est son argument central : zéro friction d'adoption, prix fixe à 10$/mois, compatible avec l'IDE que votre équipe utilise déjà.",
  toolADescEn:
    "Copilot installs like any extension — VS Code, JetBrains, Visual Studio. You change nothing about your workflow, you layer intelligence on top. That's its core argument: zero adoption friction, fixed price at $10/mo, compatible with whatever IDE your team already uses.",
  toolAUseCases: [
    "Autocomplétion dans votre IDE actuel sans rien changer",
    "Pull Requests générées de A à Z",
    "Code reviews automatisées via GitHub Actions, le système d'automatisation intégré à GitHub",
    "Équipes sur JetBrains (IntelliJ, WebStorm, PyCharm) ou Visual Studio. Cursor ne tourne pas sur ces IDEs, Copilot s'y installe en extension.",
    "Budget mensuel fixe à 10$ sans variable",
  ],
  toolAUseCasesEn: [
    "Autocomplete in your current IDE without changing anything",
    "End-to-end Pull Request generation",
    "Automated code reviews via GitHub Actions, GitHub's built-in automation system",
    "Teams on JetBrains (IntelliJ, WebStorm, PyCharm) or Visual Studio. Cursor doesn't run on these IDEs, Copilot installs as an extension.",
    "Fixed $10/mo budget without surprises",
  ],

  toolBDesc:
    "Cursor n'est pas une extension — c'est un IDE entier, fork de VS Code, conçu dès le départ pour l'IA. Son outil Composer coordonne des modifications sur plusieurs fichiers simultanément, ce que Copilot ne fait pas aussi bien. Pour un développeur solo qui génère des features entières avec un agent, la différence est palpable. Le coût : vous changez d'éditeur et vous surveillez votre facture.",
  toolBDescEn:
    "Cursor isn't an extension — it's a full IDE, a VS Code fork, designed from the ground up for AI. Its Composer tool coordinates changes across multiple files at once, something Copilot handles less fluidly. For a solo developer generating entire features with an agent, the difference is real. The cost: you switch editors and you watch your bill.",
  toolBUseCases: [
    "Modifications multi-fichiers coordonnées via Composer",
    "Accès direct à Claude et GPT-4o sans copier-coller",
    "Remplace ChatGPT Plus ou Claude Pro pour les tâches de code",
    "Agents autonomes sur de gros refactors, dont Bugbot (détection automatique de bugs) et Cloud Agents (agents qui tournent sans supervision)",
    "Ghost Mode, le mode sans cloud de Cursor : tout est traité sur votre machine, rien n'est envoyé à un serveur externe",
  ],
  toolBUseCasesEn: [
    "Coordinated multi-file edits via Composer",
    "Direct access to Claude and GPT-4o without copy-pasting",
    "Replaces ChatGPT Plus or Claude Pro for coding",
    "Autonomous agents for large refactors, including Bugbot (automatic bug detection) and Cloud Agents (agents that run without supervision)",
    "Ghost Mode, Cursor's cloud-free mode: everything processed on your machine, nothing sent to an external server",
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
      toolA: "Fixe à 10$/mois", toolAEn: "Fixed at $10/mo",
      toolB: "Hybride : 20$/mois + consommation API", toolBEn: "Hybrid: $20/mo + API usage",
      winner: "A", verdictLabel: "Copilot", verdictLabelEn: "Copilot" },
    { criterion: "Confidentialité du code", criterionEn: "Code privacy",
      toolA: "Entraînement activé par défaut (opt-out requis)", toolAEn: "Training on by default (opt-out required)",
      toolB: "Privacy Mode (données non stockées) et Ghost Mode (100% local) disponibles", toolBEn: "Privacy Mode (data not stored) and Ghost Mode (100% local) available",
      winner: "B", verdictLabel: "Cursor", verdictLabelEn: "Cursor" },
    { criterion: "Prise en main", criterionEn: "Setup",
      toolA: "Extension : 2 minutes", toolAEn: "Extension: 2 minutes",
      toolB: "Changement d'IDE requis", toolBEn: "IDE switch required",
      winner: "A", verdictLabel: "Copilot", verdictLabelEn: "Copilot" },
    { criterion: "Génération de PR", criterionEn: "PR generation",
      toolA: "Oui, de A à Z", toolAEn: "Yes, end-to-end",
      toolB: "Via Composer (multi-fichiers)", toolBEn: "Via Composer (multi-file)",
      winner: "tie", verdictLabel: "Égalité", verdictLabelEn: "Tie" },
  ],

  prosA: [
    "Fonctionne dans tous les IDEs — aucun changement d'environnement",
    "Prix fixe à 10$/mois, aucune facture surprise",
    "Pull requests générées de A à Z",
    "Plan Business : données non utilisées pour l'entraînement, inclus d'office",
  ],
  prosAEn: [
    "Works in all IDEs — no environment change",
    "Fixed $10/mo, no surprise bill",
    "End-to-end Pull Request generation",
    "Business plan: data not used for training, included by default",
  ],
  limitsA: [
    "L'agent multi-fichiers reste moins fluide que Composer de Cursor",
    "Plans individuels : entraînement sur vos données activé par défaut depuis 2026 — opt-out manuel requis",
    "Code reviews automatisées consomment des minutes GitHub Actions payantes",
  ],
  limitsAEn: [
    "Multi-file agent less fluid than Cursor's Composer",
    "Individual plans: data training enabled by default since 2026 — manual opt-out required",
    "Automated code reviews consume paid GitHub Actions minutes",
  ],
  prosB: [
    "Composer : modifications multi-fichiers coordonnées par un agent, nativement",
    "Intègre Claude et GPT-4o — remplace souvent ChatGPT Plus pour le code",
    "Ghost Mode (100% local) pour les projets sous NDA",
    "IDE pensé pour l'IA depuis le premier jour, pas adapté après coup",
  ],
  prosBEn: [
    "Composer: agent-coordinated multi-file edits, natively",
    "Includes Claude and GPT-4o — often replaces ChatGPT Plus for coding",
    "Ghost Mode (100% local) for NDA projects",
    "IDE designed for AI from day one, not retrofitted",
  ],
  limitsB: [
    "Facturation variable : une session agent intensive peut coûter 10-20$ sans que vous le voyiez venir",
    "Nécessite de changer d'IDE — incompatible avec JetBrains et Visual Studio",
    "Les fichiers .cursorrules, la configuration propre à Cursor, ne migrent pas vers d'autres éditeurs. Vous créez une dépendance.",
    "Bugbot facturé séparément des plans Pro et Pro+",
  ],
  limitsBEn: [
    "Variable billing: an intensive agent session can cost $10-20 without warning",
    "Requires an IDE switch — incompatible with JetBrains and Visual Studio",
    ".cursorrules files, Cursor's proprietary configuration, don't migrate to other editors. You're creating a dependency.",
    "Bugbot billed separately from Pro and Pro+ plans",
  ],

  decisionRows: [
    { context: "Tu es sur JetBrains, IntelliJ ou Visual Studio",
      contextEn: "You're on JetBrains, IntelliJ or Visual Studio",
      choice: "GitHub Copilot — Cursor ne supporte pas ces IDEs",
      choiceEn: "GitHub Copilot — Cursor doesn't support these IDEs" },
    { context: "Tu veux un budget mensuel fixe sans variable",
      contextEn: "You want a fixed monthly budget without variables",
      choice: "GitHub Copilot",
      choiceEn: "GitHub Copilot" },
    { context: "Tu modifies plusieurs fichiers liés en même temps tous les jours",
      contextEn: "You edit multiple linked files at once every day",
      choice: "Cursor — Composer est fait pour ça",
      choiceEn: "Cursor — Composer is built for this" },
    { context: "Tu copies-colles depuis Claude.ai ou ChatGPT vers ton éditeur tous les jours",
      contextEn: "You copy-paste from Claude.ai or ChatGPT to your editor daily",
      choice: "Cursor — Composer fait ça nativement",
      choiceEn: "Cursor — Composer does this natively" },
    { context: "Tu travailles en grande entreprise avec des contraintes de sécurité",
      contextEn: "You work in a large company with security constraints",
      choice: "GitHub Copilot Business",
      choiceEn: "GitHub Copilot Business" },
    { context: "Tu paies déjà ChatGPT Plus ou Claude Pro pour coder",
      contextEn: "You already pay ChatGPT Plus or Claude Pro to code",
      choice: "Cursor Pro — il les remplace, le calcul change",
      choiceEn: "Cursor Pro — it replaces both, the math changes" },
  ],

  decisiveCriteria: [
    {
      title: "Compatibilité IDE",
      titleEn: "IDE compatibility",
      toolA: "Copilot s'installe en extension dans tous les IDEs — JetBrains, Visual Studio, VS Code, CLI.",
      toolAEn: "Copilot installs as an extension in all IDEs — JetBrains, Visual Studio, VS Code, CLI.",
      toolB: "Cursor est un fork de VS Code. JetBrains et Visual Studio ne sont pas supportés.",
      toolBEn: "Cursor is a VS Code fork. JetBrains and Visual Studio are not supported.",
      decision: "Sur JetBrains : décision prise. Copilot, point final.",
      decisionEn: "On JetBrains: decision made. Copilot, full stop.",
    },
    {
      title: "Modèle de prix",
      titleEn: "Pricing model",
      toolA: "Abonnement fixe à 10$/mois. Vous savez ce que vous payez avant de coder.",
      toolAEn: "Fixed subscription at $10/mo. You know what you're paying before you code.",
      toolB: "20$/mois + consommation selon les modèles. Une session agent peut coûter 10-20$ seule.",
      toolBEn: "$20/mo + usage based on models. One agent session can cost $10-20 alone.",
      decision: "Copilot si le budget est une contrainte. Cursor si vous supprimez votre abonnement Claude ou ChatGPT Plus — le calcul s'inverse.",
      decisionEn: "Copilot if budget is a constraint. Cursor if you cancel your Claude or ChatGPT Plus sub — the math flips.",
    },
    {
      title: "Travail multi-fichiers",
      titleEn: "Multi-file work",
      toolA: "Possible via mode agent, mais moins fluide. Copilot coordonne moins bien des modifications liées entre plusieurs fichiers.",
      toolAEn: "Possible via agent mode, but less fluid. Copilot handles linked changes across files less smoothly.",
      toolB: "Composer est conçu pour ça. Il coordonne des modifications sur plusieurs fichiers simultanément, avec un contexte partagé.",
      toolBEn: "Composer is built for this. It coordinates changes across multiple files at once, with shared context.",
      decision: "Cursor si les refactors multi-fichiers sont quotidiens. Copilot si vous travaillez surtout fichier par fichier.",
      decisionEn: "Cursor if multi-file refactors are daily. Copilot if you mostly work file by file.",
    },
    {
      title: "Confidentialité",
      titleEn: "Privacy",
      toolA: "Plans individuels (Free et Pro) : entraînement sur vos données activé par défaut depuis 2026. Opt-out manuel dans les paramètres GitHub.",
      toolAEn: "Individual plans (Free and Pro): training on your data enabled by default since 2026. Manual opt-out in GitHub settings.",
      toolB: "Privacy Mode désactive l'envoi de données. Ghost Mode traite tout en local — aucune donnée ne quitte votre machine.",
      toolBEn: "Privacy Mode disables data sending. Ghost Mode processes everything locally — no data leaves your machine.",
      decision: "Copilot Business pour les équipes (opt-out inclus d'office). Cursor Ghost Mode pour les projets sous NDA en solo.",
      decisionEn: "Copilot Business for teams (opt-out included). Cursor Ghost Mode for solo NDA projects.",
    },
  ],

  tippingPoint: {
    title: "Le moment où Cursor devient évident",
    titleEn: "The moment Cursor becomes obvious",
    defaultChoice:
      "Copilot à 10$/mois. Compatible partout, prix fixe, zéro friction. C'est le point de départ raisonnable pour la majorité des développeurs.",
    defaultChoiceEn:
      "Copilot at $10/mo. Compatible everywhere, fixed price, zero friction. The sensible starting point for most developers.",
    switchWhen:
      "Le jour où vous réalisez que vous passez plus de temps à copier-coller entre l'interface d'un LLM et votre éditeur qu'à écrire du code. Composer fait exactement ça — sans changer de fenêtre.",
    switchWhenEn:
      "The day you realize you spend more time copy-pasting between an LLM web interface and your editor than actually writing code. Composer does exactly this — without switching windows.",
    signals: [
      "vous copiez-collez depuis Claude.ai ou ChatGPT vers votre éditeur plusieurs fois par jour",
      "vous faites des refactors sur 3+ fichiers liés et vous devez tout coordonner manuellement",
      "vous travaillez sur VS Code et n'y êtes pas attaché à vie",
      "vous payez déjà Claude Pro ou ChatGPT Plus pour coder — Cursor les remplace",
    ],
    signalsEn: [
      "you copy-paste from Claude.ai or ChatGPT to your editor multiple times a day",
      "you refactor across 3+ linked files and handle all coordination manually",
      "you mostly use VS Code and aren't attached to it long-term",
      "you already pay Claude Pro or ChatGPT Plus for coding — Cursor replaces them",
    ],
  },

  costReality: [
    {
      label: "Prix de base",
      labelEn: "Base price",
      toolA: "Pro à 10$/mois (ou 8,33$ en annuel). Pro+ à 39$/mois.",
      toolAEn: "Pro at $10/mo (or $8.33 annually). Pro+ at $39/mo.",
      toolB: "Pro à 20$/mois. Pro+ à 60$/mois. Ultra à 200$/mois. Teams à 40$/utilisateur.",
      toolBEn: "Pro at $20/mo. Pro+ at $60/mo. Ultra at $200/mo. Teams at $40/user.",
      recommendation:
        "Copilot Pro est difficile à battre sur le prix brut. Mais si Cursor remplace votre abonnement Claude ou ChatGPT Plus, le calcul s'inverse : Cursor Pro (20$) vs Copilot (10$) + ChatGPT Plus (20$) = 10$ d'économies.",
      recommendationEn:
        "Copilot Pro is hard to beat on raw price. But if Cursor replaces your Claude or ChatGPT Plus sub, the math flips: Cursor Pro ($20) vs Copilot ($10) + ChatGPT Plus ($20) = $10 savings.",
    },
    {
      label: "Plan gratuit",
      labelEn: "Free plan",
      toolA: "50 requêtes premium par mois. Ça fond en une demi-matinée de développement sérieux.",
      toolAEn: "50 premium requests/month. Gone in half a serious morning of development.",
      toolB: "Juste suffisant pour tester l'interface quelques heures. Inexploitable au quotidien.",
      toolBEn: "Just enough to test the interface for a few hours. Unusable daily.",
      recommendation:
        "Les deux plans gratuits sont des freemium au sens strict. Pour un usage professionnel, prévoir un plan payant dès le départ.",
      recommendationEn:
        "Both free plans are freemium in the strict sense. Budget for a paid plan from day one for any professional use.",
    },
    {
      label: "Coût réel vs coût affiché",
      labelEn: "Real cost vs listed price",
      toolA:
        "Les code reviews automatisées consomment des minutes GitHub Actions payantes depuis juin 2026 — non incluses dans le forfait.",
      toolAEn:
        "Automated code reviews consume paid GitHub Actions minutes since June 2026 — not included in the subscription.",
      toolB:
        "Les modèles frontières en mode manuel dévident vos crédits vite. Une session Cloud Agent sur un refactor complexe : comptez 10-20$ seule. Bugbot facturé en plus.",
      toolBEn:
        "Frontier models in manual mode drain credits fast. One Cloud Agent session on a complex refactor: budget $10-20 alone. Bugbot billed on top.",
      recommendation:
        "Sur Cursor : activez le mode Auto, il sélectionne les modèles les moins coûteux par défaut. Sur Copilot : vérifiez votre consommation GitHub Actions si vous utilisez les code reviews.",
      recommendationEn:
        "On Cursor: enable Auto mode, it selects the cheapest models by default. On Copilot: check your GitHub Actions usage if you use code reviews.",
    },
  ],

  tooltrimRisks: [
    {
      mistake: "Ne pas faire l'opt-out sur Copilot individuel",
      mistakeEn: "Not opting out on individual Copilot plans",
      consequence:
        "Depuis 2026, GitHub utilise vos données de code pour entraîner ses modèles par défaut sur les plans Free et Pro.",
      consequenceEn:
        "Since 2026, GitHub uses your code data to train its models by default on Free and Pro plans.",
      recommendation:
        "Allez dans vos paramètres GitHub → Copilot → désactivez 'Allow GitHub to use my code snippets' dès l'inscription. Ou prenez un plan Business.",
      recommendationEn:
        "Go to GitHub settings → Copilot → disable 'Allow GitHub to use my code snippets' on signup. Or use a Business plan.",
    },
    {
      mistake: "Payer Cursor + ChatGPT Plus + Claude Pro en même temps",
      mistakeEn: "Paying Cursor + ChatGPT Plus + Claude Pro simultaneously",
      consequence:
        "Beaucoup de développeurs cumulent 3 abonnements IA sans réaliser que Cursor en intègre deux nativement.",
      consequenceEn:
        "Many developers stack 3 AI subscriptions without realizing Cursor natively includes two of them.",
      recommendation:
        "Si vous prenez Cursor, testez 1 mois sans ChatGPT Plus ni Claude Pro. Pour les tâches de code, Cursor les remplace dans la plupart des cas.",
      recommendationEn:
        "If you take Cursor, test 1 month without ChatGPT Plus and Claude Pro. For coding tasks, Cursor replaces them in most cases.",
    },
    {
      mistake: "Laisser un agent Cursor tourner sans surveiller",
      mistakeEn: "Letting a Cursor agent run unsupervised",
      consequence:
        "Les Cloud Agents et Bugbot consomment des crédits API réels. Une boucle d'agent sur un refactor complexe peut coûter 20-50$ sans notification proactive.",
      consequenceEn:
        "Cloud Agents and Bugbot consume real API credits. An agent loop on a complex refactor can cost $20-50 with no proactive notification.",
      recommendation:
        "Activez le mode Auto (sélection automatique des modèles économiques) pour les sessions normales. Réservez les modèles frontières manuels aux refactors que vous supervisez activement.",
      recommendationEn:
        "Enable Auto mode for normal sessions. Reserve manual frontier models for refactors you're actively supervising.",
    },
  ],

  profiles: [
    { persona: "Freelance solo sur VS Code", personaEn: "Solo freelancer on VS Code",
      choice: "Cursor",
      reason:
        "Composer change concrètement la façon de travailler sur plusieurs fichiers. Si vous êtes sur VS Code et que vous générez des features entières, ce n'est pas une promesse — c'est un gain visible dès la première semaine.",
      reasonEn:
        "Composer concretely changes how you work across multiple files. If you're on VS Code and generating entire features, this isn't a promise — it's a visible gain from the first week.",
      limit:
        "Surveillez votre facture. Une semaine de travail intensif avec des agents peut coûter 30-50$ de plus que le forfait de base.",
      limitEn:
        "Watch your bill. One intense week with agents can cost $30-50 more than the base plan." },
    { persona: "Développeur en agence", personaEn: "Agency developer",
      choice: "GitHub Copilot",
      reason:
        "Budget prévisible, compatible avec tous les IDEs de l'équipe, plan Business avec opt-out d'entraînement inclus d'office. C'est l'outil sans discussion pour les équipes.",
      reasonEn:
        "Predictable budget, compatible with all team IDEs, Business plan with training opt-out included by default. No debate needed for teams.",
      limit:
        "L'agent multi-fichiers reste moins fluide que Cursor. Pour des refactors complexes sur une grosse codebase, vous sentirez la différence.",
      limitEn:
        "Multi-file agent still less fluid than Cursor. For complex refactors on a large codebase, you'll feel the gap." },
    { persona: "Développeur sous NDA strict", personaEn: "Strict NDA developer",
      choice: "Cursor Ghost Mode",
      reason:
        "Ghost Mode traite tout en local — aucune donnée ne sort de votre machine. C'est la seule option pour les projets où le code ne peut pas toucher un serveur tiers.",
      reasonEn:
        "Ghost Mode processes everything locally — no data leaves your machine. The only viable option for projects where code can't touch a third-party server.",
      limit:
        "Performances sensiblement réduites par rapport aux modèles cloud frontières. Vous échangez la confidentialité contre la qualité des suggestions.",
      limitEn:
        "Noticeably lower performance than cloud frontier models. You trade privacy for suggestion quality." },
    { persona: "Développeur sur JetBrains", personaEn: "JetBrains developer",
      choice: "GitHub Copilot",
      reason:
        "Cursor ne supporte pas JetBrains — ce n'est pas un manque de features, c'est une contrainte architecturale. Copilot est la seule option viable.",
      reasonEn:
        "Cursor doesn't support JetBrains — not a missing feature, an architectural constraint. Copilot is the only viable option.",
      limit:
        "Pas d'accès à Composer. Si vous en avez besoin, la seule alternative est de migrer votre workflow vers VS Code.",
      limitEn:
        "No access to Composer. If you need it, the only path is migrating your workflow to VS Code." },
  ],

  pricingFraming:
    "Copilot reste un abonnement logiciel classique. Cursor ressemble de plus en plus à un revendeur d'API cloud déguisé en éditeur de code.",
  pricingFramingEn:
    "Copilot is still a classic software subscription. Cursor increasingly looks like a cloud API reseller disguised as a code editor.",

  pricingToolANotes:
    "Plan Free (gratuit, limité à 50 requêtes/mois). **Pro à 10$/mois** (8,33$ en annuel). Pro+ à **39$/mois**. Business et Enterprise avec confidentialité garantie.",
  pricingToolANotesEn:
    "Free plan (limited to 50 requests/month). **Pro at $10/mo** ($8.33 annually). Pro+ at **$39/mo**. Business and Enterprise with guaranteed privacy.",

  pricingToolBNotes:
    "Plan Hobby gratuit mais inexploitable. **Pro à 20$/mois** + consommation variable. Pro+ à **60$/mois**. Ultra à **200$/mois**. Teams à **40$/utilisateur/mois**. Bugbot facturé séparément.",
  pricingToolBNotesEn:
    "Hobby free plan, unusable daily. **Pro at $20/mo** + variable consumption. Pro+ at **$60/mo**. Ultra at **$200/mo**. Teams at **$40/user/mo**. Bugbot billed separately.",

  pricingReco:
    "Si vous partez de zéro, Copilot Pro à 10$ est difficile à battre. Si vous prenez Cursor, testez d'abord sans ChatGPT Plus ni Claude Pro — pour les tâches de code, Cursor les remplace dans la plupart des cas. Calcul réel : Cursor Pro (20$) vs Copilot (10$) + ChatGPT Plus (20$) = 10$ d'économies pour un outil plus intégré.",
  pricingRecoEn:
    "Starting from scratch, Copilot Pro at $10 is hard to beat. If you take Cursor, test it first without ChatGPT Plus or Claude Pro — for coding tasks, Cursor replaces them in most cases. Real math: Cursor Pro ($20) vs Copilot ($10) + ChatGPT Plus ($20) = $10 savings for a more integrated tool.",

  chooseAIfList: [
    "Votre équipe est sur JetBrains, Visual Studio ou un IDE non-VS Code",
    "Vous avez besoin d'un budget mensuel fixe et prévisible",
    "Vous travaillez dans une grande entreprise avec des contraintes de sécurité",
  ],
  chooseBIfList: [
    "Vous êtes solo sur VS Code et modifiez plusieurs fichiers liés en même temps tous les jours",
    "Vous copiez-collez depuis l'interface web d'un LLM vers votre éditeur régulièrement",
    "Vous payez déjà ChatGPT Plus ou Claude Pro pour coder — Cursor les remplace",
  ],
  avoidAIfList: [
    "Vous refusez de gérer un opt-out manuel pour protéger votre code (entraînement activé par défaut sur les plans individuels depuis 2026).",
  ],
  avoidBIfList: [
    "Vous avez un budget strict et fuyez la facturation variable.",
    "Vous ne voulez pas quitter votre éditeur actuel, quel qu'il soit.",
  ],
  avoidBothIfList: [
    "Vous travaillez dans des environnements de défense ou air-gapped sans accès cloud. Les deux outils sont inutilisables dans ce contexte.",
  ],

  criteriaIntro:
    "Deux de ces quatre critères suffisent à trancher dans la quasi-totalité des cas. L'IDE que vous utilisez déjà et votre rapport à la facturation variable — tout le reste est secondaire. Les deux autres critères entrent en jeu selon votre contexte spécifique.",
  criteriaIntroEn:
    "Two of these four criteria are enough to decide in almost every case. The IDE you already use and your relationship to variable billing — everything else is secondary. The other two criteria come into play depending on your specific context.",

  featuresIntro:
    "Ce tableau répond à une seule question : dans votre situation, lequel des deux gagne ? Si plusieurs lignes pointent dans la même direction, votre décision est déjà prise. La colonne 'Verdict' résume l'essentiel.",
  featuresIntroEn:
    "This table answers one question: in your situation, which one wins? If multiple rows point the same direction, your decision is already made. The Verdict column captures what matters.",

  tippingIntro:
    "La plupart des gens qui hésitent entre les deux outils ont déjà leur réponse — ils ne l'ont pas encore formulée clairement. Le seuil de bascule, c'est le moment où Cursor cesse d'être 'intéressant' et devient 'évident'. Voici comment l'identifier.",
  tippingIntroEn:
    "Most people who hesitate between the two tools already have their answer — they just haven't put it into words yet. The tipping point is the moment when Cursor stops being 'interesting' and becomes 'obvious'. Here's how to identify it.",

  risksIntro:
    "Ces trois erreurs arrivent souvent dans les 30 premiers jours. Elles ne concernent pas des cas rares — ce sont les retours les plus fréquents sur ces deux outils. Vaut mieux les connaître avant de payer.",
  risksIntroEn:
    "These three mistakes happen often in the first 30 days. They're not edge cases — they're the most common feedback we see on both tools. Better to know them before you pay.",

  faqIntro:
    "Les questions ci-dessous sont celles que les développeurs posent après avoir lu les pages de vente — pas avant. Ce sont les doutes qui subsistent quand on a déjà compris l'essentiel.",
  faqIntroEn:
    "The questions below are the ones developers ask after reading the sales pages — not before. They're the doubts that remain once you already understand the basics.",

  aglanceBestForA: "Équipes, JetBrains, budget fixe",
  aglanceBestForB: "Solo VS Code, multi-fichiers, remplace ChatGPT Plus",
  aglanceBudget: "Copilot 10$ fixe vs Cursor 20$ + variable",
  aglanceRisk: "Facture Cursor variable — agent sans surveillance",
  aglanceDefaultLabel: "Copilot par défaut",
  aglanceLevel: "Copilot : extension en 2 min. Cursor : changement d'IDE.",
  aglanceHeroPromise:
    "Copilot s'adapte à votre workflow. Cursor vous demande de le reconstruire autour de l'IA.",
  aglancePositionA: "L'extension universelle",
  aglancePositionB: "L'IDE IA natif",
  aglanceContract:
    "Ne choisissez pas selon la liste de features. Choisissez selon votre IDE, votre budget, et si vous copiez-collez du code depuis une interface web tous les jours.",

  quickDecisionTree: [
    {
      condition: "Vous utilisez JetBrains ou un autre IDE",
      conditionEn: "You use JetBrains or another IDE",
      answer: "Copilot",
      answerEn: "Copilot",
    },
    {
      condition: "Vous voulez un budget fixe sans surprises",
      conditionEn: "You want a predictable fixed budget",
      answer: "Copilot",
      answerEn: "Copilot",
    },
    {
      condition: "Vous modifiez plusieurs fichiers liés chaque jour",
      conditionEn: "You edit multiple linked files every day",
      answer: "Cursor",
      answerEn: "Cursor",
    },
    {
      condition: "Vous payez déjà ChatGPT Plus pour coder",
      conditionEn: "You already pay ChatGPT Plus for coding",
      answer: "Cursor à la place",
      answerEn: "Cursor instead",
    },
    {
      condition: "Votre code est sous NDA strict",
      conditionEn: "Your code is under strict NDA",
      answer: "Cursor Ghost Mode",
      answerEn: "Cursor Ghost Mode",
    },
  ],

  alternatives: [
    { slug: "codeium", name: "Codeium (Windsurf)",
      reason: "Alternative gratuite pour l'autocomplétion dans tous les IDEs. Sans abonnement obligatoire.",
      reasonEn: "Free alternative for autocomplete in all IDEs. No mandatory subscription.",
      price: "Gratuit" },
    { slug: "tabnine", name: "Tabnine",
      reason: "100% local pour les équipes qui refusent le cloud par principe ou par contrat.",
      reasonEn: "100% local for teams that refuse cloud by principle or contract.",
      price: "Gratuit / 12$/mois" },
  ],

  faq: [
    {
      q: "Si je prends Cursor, est-ce que j'annule Claude Pro ?",
      qEn: "If I get Cursor, should I cancel Claude Pro?",
      a: "Probablement, pour les tâches de code. Cursor intègre Claude nativement — vous n'avez pas besoin d'ouvrir l'interface web. Pour d'autres usages (rédaction, analyse, conversations longues), Claude Pro reste utile. Testez 1 mois sans Claude Pro après avoir pris Cursor : vous verrez rapidement si vous y revenez.",
      aEn: "Probably, for coding tasks. Cursor integrates Claude natively — no need to open the web interface. For other uses (writing, analysis, long conversations), Claude Pro stays useful. Test 1 month without Claude Pro after getting Cursor: you'll quickly see if you go back to it.",
    },
    {
      q: "Combien coûte vraiment une journée active sur Cursor Pro ?",
      qEn: "What does an active day on Cursor Pro actually cost?",
      a: "En mode Auto (modèles légers par défaut), une journée normale rentre dans le forfait à 20$. Le problème vient des modèles frontières en mode manuel et des agents. Une session Cloud Agent sur un refactor complexe peut consommer 10-20$ seule. Si vous laissez Bugbot analyser tout votre codebase, c'est facturé en plus. Activez Auto et réservez les modèles lourds aux tâches que vous supervisez.",
      aEn: "In Auto mode (lightweight models by default), a normal day fits within the $20 plan. The issue comes from manual frontier models and agents. One Cloud Agent session on a complex refactor can consume $10-20 alone. Running Bugbot on your whole codebase is billed on top. Enable Auto, reserve heavy models for tasks you're actively watching.",
    },
    {
      q: "Copilot peut-il faire la même chose que Composer de Cursor ?",
      qEn: "Can Copilot do the same thing as Cursor's Composer?",
      a: "Partiellement. Copilot a un mode agent qui peut modifier plusieurs fichiers, mais le contexte partagé entre fichiers est moins robuste. Composer a été conçu pour ça depuis le premier jour — il coordonne les modifications avec un état global du projet. Pour des refactors simples sur 2-3 fichiers, Copilot suffit. Pour des refactors profonds sur une codebase entière, Cursor prend l'avantage.",
      aEn: "Partially. Copilot has an agent mode that can edit multiple files, but shared context across files is less robust. Composer was designed for this from day one — it coordinates changes with a global project state. For simple refactors across 2-3 files, Copilot works fine. For deep refactors across an entire codebase, Cursor wins.",
    },
    {
      q: "Mes extensions VS Code marchent dans Cursor ?",
      qEn: "Do my VS Code extensions work in Cursor?",
      a: "La grande majorité, oui. Cursor est un fork de VS Code — le marketplace d'extensions est compatible. Quelques extensions payantes avec vérification de licence peuvent poser problème, mais c'est rare. Vos raccourcis, thèmes et configurations migrent aussi. La transition prend en général 1-2 jours pour retrouver son setup habituel.",
      aEn: "The vast majority, yes. Cursor is a VS Code fork — the extension marketplace is compatible. A few paid extensions with license verification can cause issues, but it's rare. Your keybindings, themes and configs migrate too. The transition typically takes 1-2 days to get back to your usual setup.",
    },
    {
      q: "GitHub Copilot s'entraîne-t-il vraiment sur mon code ?",
      qEn: "Does GitHub Copilot really train on my code?",
      a: "Sur les plans Free et Pro (individuels), oui par défaut depuis 2026. GitHub a modifié ses conditions pour utiliser les données des plans individuels pour l'entraînement de ses modèles, sauf opt-out explicite. Allez dans vos paramètres GitHub → Copilot → désactivez 'Allow GitHub to use my code snippets for product improvements'. Sur le plan Business, c'est désactivé par défaut.",
      aEn: "On Free and Pro (individual) plans, yes by default since 2026. GitHub changed its terms to use individual plan data for model training, unless you explicitly opt out. Go to GitHub settings → Copilot → disable 'Allow GitHub to use my code snippets for product improvements'. On the Business plan, it's disabled by default.",
    },
  ],
};

/* ─── Editorial content registry ─────────────────────────────────────────── */
const EDITORIAL_CONTENT: Record<string, CompareEditorialContent> = {
  "notion-vs-airtable": NOTION_VS_AIRTABLE,
  "github-copilot-vs-cursor": GITHUB_COPILOT_VS_CURSOR,
};

// Generic, non-distinguishing keepIf/avoidIf phrases ("Usage régulier",
// "Budget serré"...) found across many fiches — too short/generic to ever
// be a real reason to pick one tool over its direct competitor.
const GENERIC_CRITERION_RE = /^(usage (régulier|ponctuel|fréquent|occasionnel)|fonctionnalités? (essentielles?|de base|basiques?)|budget (serré|limité)|regular usage|occasional use|frequent use|essential features|basic features|tight budget|limited budget)$/i;

function isGenericCriterion(text: string | undefined): boolean {
  if (!text) return true;
  const normalized = text.trim().toLowerCase();
  if (!normalized) return true;
  if (GENERIC_CRITERION_RE.test(normalized)) return true;
  return normalized.split(/\s+/).length <= 3;
}

// Picks the index of the first entry in `list` that is neither a literal
// duplicate of an entry in `otherList` nor a generic, non-distinguishing
// phrase — i.e. an actual reason to prefer this tool over the other.
function pickDistinctIndex(list: string[], otherList: string[]): number {
  const normalize = (s: string) => s.trim().toLowerCase();
  const otherSet = new Set(otherList.filter(Boolean).map(normalize));
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item || otherSet.has(normalize(item)) || isGenericCriterion(item)) continue;
    return i;
  }
  return -1;
}

function dedupeAgainst(list: string[], otherList: string[]): string[] {
  const normalize = (s: string) => s.trim().toLowerCase();
  const otherSet = new Set(otherList.filter(Boolean).map(normalize));
  return list.filter((item) => item && !otherSet.has(normalize(item)));
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function isPerSeatPricing(tool: Tool): boolean {
  const text = `${tool.pricing?.paid || ""} ${tool.pricing?.free || ""}`.toLowerCase();
  return /par utilisateur|\/\s*utilisateur|per[\s-]?user|\/\s*user|per[\s-]?seat|\/\s*seat/.test(text);
}

function hasAutomationFocus(tool: Tool): boolean {
  const needs = (tool.functional_needs || []).map((n) => n.toLowerCase());
  return needs.some((n) => /automat|api|int[ée]gration|integration|workflow/.test(n));
}

// Asymmetric fallback when neither tool's keepIf list has anything
// distinguishing left after dedup/generic filtering — derives a reason
// from real catalog signals instead of repeating the same generic line
// for both tools.
// Returns a bare condition clause (no tool name, no leading "si"/"if") —
// callers embed it after "Choisis X si <clause>." / "X fits if <clause>",
// matching the shape of a real verdict.keepIf entry.
function fallbackStrength(tool: Tool, lang: "fr" | "en"): string {
  if (hasAutomationFocus(tool)) {
    return lang === "fr"
      ? "tu as besoin d'automatisations, d'intégrations API ou de flux de travail personnalisés"
      : "you need automations, API integrations, or custom workflows";
  }
  if (!isPerSeatPricing(tool)) {
    return lang === "fr"
      ? "tu veux centraliser les échanges d'équipe à coût mensuel fixe"
      : "you want to centralize team communication at a fixed monthly cost";
  }
  return lang === "fr"
    ? "son usage couvre ton besoin principal"
    : "its use case covers your main need";
}

function whenToPayCopy(price: number, perSeat: boolean, lang: "fr" | "en"): string {
  if (lang === "fr") {
    return perSeat
      ? `Passe au payant quand le coût par utilisateur (dès ${price}€/mois/personne) dépasse ce que l'équipe veut payer.`
      : `Passe au payant quand le plan gratuit bloque un usage régulier (à partir de ${price}€/mois, sans coût par siège).`;
  }
  return perSeat
    ? `Move to paid when the per-user cost (from €${price}/month/user) exceeds what the team is willing to pay.`
    : `Move to paid when the free plan blocks regular usage (from €${price}/month, no per-seat cost).`;
}

function hiddenCostCopy(perSeat: boolean, lang: "fr" | "en"): string {
  if (lang === "fr") {
    return perSeat
      ? "Le coût grimpe à chaque utilisateur ajouté, surtout si l'équipe grandit."
      : "Le tarif fixe peut cacher des limites de volume, de stockage ou de fonctionnalités avancées.";
  }
  return perSeat
    ? "Cost rises with every added user, especially as the team grows."
    : "The flat price can hide limits on volume, storage, or advanced features.";
}

/* ─── Auto-generate fallback content from tool data ─────────────────────── */
function buildFallbackContent(toolA: Tool, toolB: Tool, lang: "fr" | "en"): CompareEditorialContent {
  const priceA = getPriceNum(toolA);
  const priceB = getPriceNum(toolB);
  const aFerme = toolA.prescription_quality === "ferme";
  const bFerme = toolB.prescription_quality === "ferme";

  const keepsA = toolA.verdict?.keepIf || [];
  const keepsB = toolB.verdict?.keepIf || [];
  // Separate English-sourced arrays — verdictShortEn/finalRecommendationEn
  // used to read keepsA/keepsB (the French arrays) directly, so the English
  // version of a comparison page could show French text mid-sentence.
  const keepsAEn = toolA.verdictEn?.keepIf || keepsA;
  const keepsBEn = toolB.verdictEn?.keepIf || keepsB;

  // Mutual-exclusion: each tool's "primary reason" must not be a literal
  // duplicate of the other tool's, and must not be a generic placeholder
  // phrase ("Usage régulier" etc). Falls back to a data-derived asymmetric
  // reason (pricing model / automation focus) when nothing distinguishing
  // survives the filter.
  const idxA = pickDistinctIndex(keepsA, keepsB);
  const idxB = pickDistinctIndex(keepsB, keepsA);
  const primaryKeepA = idxA >= 0 ? keepsA[idxA] : undefined;
  const primaryKeepB = idxB >= 0 ? keepsB[idxB] : undefined;
  const primaryKeepAEn = idxA >= 0 ? (keepsAEn[idxA] || keepsA[idxA]) : undefined;
  const primaryKeepBEn = idxB >= 0 ? (keepsBEn[idxB] || keepsB[idxB]) : undefined;

  // Bare clause form — for embedding after "Choisis X si <clause>." / "X fits if <clause>".
  const effectiveKeepA = primaryKeepA || fallbackStrength(toolA, "fr");
  const effectiveKeepB = primaryKeepB || fallbackStrength(toolB, "fr");
  const effectiveKeepAEn = primaryKeepAEn || fallbackStrength(toolA, "en");
  const effectiveKeepBEn = primaryKeepBEn || fallbackStrength(toolB, "en");
  // Standalone sentence form — for table cells (decisiveCriteria, profiles)
  // shown on their own, not embedded after "si"/"if".
  const standaloneKeepA = primaryKeepA || `${toolA.name} convient si ${effectiveKeepA}.`;
  const standaloneKeepB = primaryKeepB || `${toolB.name} convient si ${effectiveKeepB}.`;
  const standaloneKeepAEn = primaryKeepAEn || `${toolA.name} fits if ${effectiveKeepAEn}.`;
  const standaloneKeepBEn = primaryKeepBEn || `${toolB.name} fits if ${effectiveKeepBEn}.`;

  // Same mutual-exclusion treatment for avoidIf ("Risque de surdimensionnement").
  const avoidsA = toolA.verdict?.avoidIf || [];
  const avoidsB = toolB.verdict?.avoidIf || [];
  const avoidsAEn = toolA.verdictEn?.avoidIf || avoidsA;
  const avoidsBEn = toolB.verdictEn?.avoidIf || avoidsB;
  const avoidIdxA = pickDistinctIndex(avoidsA, avoidsB);
  const avoidIdxB = pickDistinctIndex(avoidsB, avoidsA);
  const effectiveAvoidA = avoidIdxA >= 0 ? avoidsA[avoidIdxA] : `À éviter si tu n'utilises qu'une petite partie de ${toolA.name}.`;
  const effectiveAvoidB = avoidIdxB >= 0 ? avoidsB[avoidIdxB] : `À éviter si tu n'utilises qu'une petite partie de ${toolB.name}.`;
  const effectiveAvoidAEn = avoidIdxA >= 0 ? (avoidsAEn[avoidIdxA] || avoidsA[avoidIdxA]) : `Avoid if you only use a small part of ${toolA.name}.`;
  const effectiveAvoidBEn = avoidIdxB >= 0 ? (avoidsBEn[avoidIdxB] || avoidsB[avoidIdxB]) : `Avoid if you only use a small part of ${toolB.name}.`;

  const aPerSeat = isPerSeatPricing(toolA);
  const bPerSeat = isPerSeatPricing(toolB);

  return {
    framing: `${toolA.name} et ${toolB.name} : deux approches différentes pour des besoins proches.`,
    framingEn: `${toolA.name} and ${toolB.name}: two different approaches for similar needs.`,
    verdictShort: `Choisis ${toolA.name} si ${effectiveKeepA.toLowerCase()}. Choisis ${toolB.name} si ${effectiveKeepB.toLowerCase()}.`,
    verdictShortEn: `Choose ${toolA.name} if ${effectiveKeepAEn.toLowerCase()}. Choose ${toolB.name} if ${effectiveKeepBEn.toLowerCase()}.`,
    finalRecommendation: `ToolTrim recommande ${toolA.name} si ${effectiveKeepA.toLowerCase()}. ${toolB.name} devient meilleur si ${effectiveKeepB.toLowerCase()}.`,
    finalRecommendationEn: `ToolTrim recommends ${toolA.name} if ${effectiveKeepAEn.toLowerCase()}. ${toolB.name} becomes better if ${effectiveKeepBEn.toLowerCase()}.`,
    quickVerdictA: dedupeAgainst(keepsA, keepsB).slice(0, 2).join(". ") || effectiveKeepA,
    quickVerdictAEn: dedupeAgainst(keepsAEn, keepsBEn).slice(0, 2).join(". ") || effectiveKeepAEn,
    quickVerdictB: dedupeAgainst(keepsB, keepsA).slice(0, 2).join(". ") || effectiveKeepB,
    quickVerdictBEn: dedupeAgainst(keepsBEn, keepsAEn).slice(0, 2).join(". ") || effectiveKeepBEn,
    quickVerdictAvoid: `Les deux outils ont des limites — choisis selon ton usage, pas selon les features.`,
    quickVerdictAvoidEn: `Both tools have limitations — choose based on your use case, not feature lists.`,

    toolADesc: toolA.shortDescription || `${toolA.name} est un outil conçu pour ${effectiveKeepA.toLowerCase()}.`,
    toolADescEn: toolA.shortDescriptionEn || `${toolA.name} is a tool designed for ${effectiveKeepAEn.toLowerCase()}.`,
    toolAUseCases: (toolA.useCases || toolA.covers || []).slice(0, 5).map(String),
    toolAUseCasesEn: (toolA.useCasesEn || toolA.useCases || toolA.covers || []).slice(0, 5).map(String),
    toolBDesc: toolB.shortDescription || `${toolB.name} est un outil conçu pour ${effectiveKeepB.toLowerCase()}.`,
    toolBDescEn: toolB.shortDescriptionEn || `${toolB.name} is a tool designed for ${effectiveKeepBEn.toLowerCase()}.`,
    toolBUseCases: (toolB.useCases || toolB.covers || []).slice(0, 5).map(String),
    toolBUseCasesEn: (toolB.useCasesEn || toolB.useCases || toolB.covers || []).slice(0, 5).map(String),

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
    prosAEn: (toolA.prosEn || toolA.pros || []).slice(0, 4).map(String),
    limitsA: (toolA.cons || []).slice(0, 4).map(String),
    limitsAEn: (toolA.consEn || toolA.cons || []).slice(0, 4).map(String),
    prosB: (toolB.pros || []).slice(0, 4).map(String),
    prosBEn: (toolB.prosEn || toolB.pros || []).slice(0, 4).map(String),
    limitsB: (toolB.cons || []).slice(0, 4).map(String),
    limitsBEn: (toolB.consEn || toolB.cons || []).slice(0, 4).map(String),

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
        toolA: standaloneKeepA,
        toolAEn: standaloneKeepAEn,
        toolB: standaloneKeepB,
        toolBEn: standaloneKeepBEn,
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
        toolA: effectiveAvoidA,
        toolAEn: effectiveAvoidAEn,
        toolB: effectiveAvoidB,
        toolBEn: effectiveAvoidBEn,
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
        toolA: whenToPayCopy(priceA, aPerSeat, "fr"),
        toolAEn: whenToPayCopy(priceA, aPerSeat, "en"),
        toolB: whenToPayCopy(priceB, bPerSeat, "fr"),
        toolBEn: whenToPayCopy(priceB, bPerSeat, "en"),
        recommendation: "Ne paie pas pour une fonctionnalité que tu n'utilises pas chaque semaine.",
        recommendationEn: "Do not pay for a feature you do not use weekly.",
      },
      {
        label: "Coût caché",
        labelEn: "Hidden cost",
        toolA: hiddenCostCopy(aPerSeat, "fr"),
        toolAEn: hiddenCostCopy(aPerSeat, "en"),
        toolB: hiddenCostCopy(bPerSeat, "fr"),
        toolBEn: hiddenCostCopy(bPerSeat, "en"),
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
        reason: aFerme ? standaloneKeepA : standaloneKeepB,
        reasonEn: aFerme ? standaloneKeepAEn : standaloneKeepBEn,
        limit: aFerme ? effectiveAvoidA : effectiveAvoidB,
        limitEn: aFerme ? effectiveAvoidAEn : effectiveAvoidBEn },
    ],

    pricingFraming: `${toolA.name} et ${toolB.name} ont des modèles de prix différents. Vérifiez les plans officiels avant de décider.`,
    pricingFramingEn: `${toolA.name} and ${toolB.name} have different pricing models. Check official plans before deciding.`,
    pricingToolANotes: priceA === 0 ? "Plan gratuit disponible." : `À partir de **${priceA}€/mois**.`,
    pricingToolANotesEn: priceA === 0 ? "Free plan available." : `From **€${priceA}/month**.`,
    pricingToolBNotes: priceB === 0 ? "Plan gratuit disponible." : `À partir de **${priceB}€/mois**.`,
    pricingToolBNotesEn: priceB === 0 ? "Free plan available." : `From **€${priceB}/month**.`,
    pricingReco: `Comparer les plans payants selon vos besoins réels.`,
    pricingRecoEn: `Compare paid plans based on your actual needs.`,
    /* ── Structured verdict bullet lists (fallback: derive from keepsA/B,
       deduplicated against the other tool's list — see pickDistinctIndex) ── */
    chooseAIfList: (dedupeAgainst(keepsA, keepsB).length ? dedupeAgainst(keepsA, keepsB) : [capitalize(effectiveKeepA)]).slice(0, 3).map(String),
    chooseBIfList: (dedupeAgainst(keepsB, keepsA).length ? dedupeAgainst(keepsB, keepsA) : [capitalize(effectiveKeepB)]).slice(0, 3).map(String),
    avoidAIfList: (dedupeAgainst(avoidsA, avoidsB).length ? dedupeAgainst(avoidsA, avoidsB) : [effectiveAvoidA]).slice(0, 2).map(String),
    avoidBIfList: (dedupeAgainst(avoidsB, avoidsA).length ? dedupeAgainst(avoidsB, avoidsA) : [effectiveAvoidB]).slice(0, 2).map(String),
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
        a: `Prends ${toolA.name} si ${effectiveKeepA.toLowerCase()}. Prends ${toolB.name} si ${effectiveKeepB.toLowerCase()}.`,
        aEn: `Choose ${toolA.name} if ${effectiveKeepAEn.toLowerCase()}. Choose ${toolB.name} if ${effectiveKeepBEn.toLowerCase()}.` },
    ],
  };
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
const ComparePage = () => {
  const { slugPair } = useParams<{ slugPair: string }>();
  const { lang, t, prefix } = useLang();
  const [staleLoading, setStaleLoading] = useState(false);

  const parsedPair = useMemo(() => {
    if (!slugPair) return null;
    const featured = COMPARISONS.find((c) => c.slugPair === slugPair);
    if (featured) return { idA: featured.toolA, idB: featured.toolB };
    const parts = slugPair.split("-vs-");
    if (parts.length === 2) return { idA: parts[0], idB: parts[1] };
    return null;
  }, [slugPair]);

  const { toolA, toolB, loading } = useToolPair(parsedPair?.idA, parsedPair?.idB);
  // Lightweight summaries for alternative tools lookup (slug/name/logo only).
  // Already statically loaded — no extra network or chunk cost.
  const { tools: toolSummaries } = useToolSummaries();

  // Resolved early (static JSON, no async) so SEO effects can read battle metadata.
  const battleDataForSeo = useMemo(() => {
    if (!slugPair || !(slugPair in BATTLE_COMPARISON_DATA)) return undefined;
    return BATTLE_COMPARISON_DATA[slugPair as BattleComparisonSlug] as BattleRawData;
  }, [slugPair]);

  // Network error detection: if still loading after 10s, show recovery state
  useEffect(() => {
    if (!loading) { setStaleLoading(false); return; }
    const timer = setTimeout(() => setStaleLoading(true), 10000);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (!toolA || !toolB) return;
    const year = new Date().getFullYear();
    const title = lang === "fr"
      ? `${toolA.name} vs ${toolB.name} ${year} — comparatif, prix et verdict | ToolTrim`
      : `${toolA.name} vs ${toolB.name} ${year} — comparison, pricing & verdict | ToolTrim`;

    // Decision-framing description: verb-driven, no audience assumption, no hardcoded copy.
    const decisionLine = battleDataForSeo
      ? (lang === "fr"
          ? (battleDataForSeo.comparison.decisionSummary || battleDataForSeo.comparison.mainDifference)
          : (battleDataForSeo.comparison.decisionSummary || battleDataForSeo.comparison.mainDifference))
      : (lang === "fr" ? "Deux logiques différentes, un seul bon choix selon ton usage." : "Two different logics, one right choice for your use case.");
    const desc = lang === "fr"
      ? `${toolA.name} vs ${toolB.name} : ${decisionLine} Prix réels, verdict ToolTrim et critères de décision.`
      : `${toolA.name} vs ${toolB.name}: ${decisionLine} Real pricing, ToolTrim verdict and decision criteria.`;

    const url = `${SEO_BASE}/${lang}/comparatif/${slugPair}`;
    setSeoTags({ title, description: desc, url, locale: lang === "fr" ? "fr_FR" : "en_US" });
    setHreflang(`/${lang}/comparatif/${slugPair}`);

    // Per-page AI summary for GEO/generative engines.
    const aiSummary = battleDataForSeo
      ? `ToolTrim compares ${toolA.name} and ${toolB.name} with human-verified pricing. ${battleDataForSeo.comparison.decisionSummary}`
      : `ToolTrim compares ${toolA.name} and ${toolB.name} with human-verified pricing.`;
    setMeta("ai-summary", aiSummary);

    // Freshness signal for AI crawlers — use most specific date available.
    const verifiedDate = battleDataForSeo
      ? (battleDataForSeo.lastUpdatedAt || battleDataForSeo.checkedAt || "")
      : "";
    if (verifiedDate) setMeta("data-verified-date", verifiedDate);

    // Rich schema: Article (editorial content) + SoftwareApplication (the two tools).
    const datePublished = battleDataForSeo?.checkedAt || year.toString();
    const dateModified = battleDataForSeo?.lastUpdatedAt || battleDataForSeo?.checkedAt || year.toString();
    const comparatifsLabel = lang === "fr" ? "Comparatifs" : "Comparisons";
    const comparatifsPath = `${SEO_BASE}/${lang}/comparatifs`;
    setJsonLd("compare-jsonld", {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          "@id": `${url}#article`,
          "headline": title,
          "description": desc,
          "url": url,
          "datePublished": datePublished,
          "dateModified": dateModified,
          "inLanguage": lang,
          "author": { "@type": "Organization", "name": "ToolTrim", "url": SEO_BASE },
          "publisher": { "@type": "Organization", "name": "ToolTrim", "url": SEO_BASE },
          "about": [
            {
              "@type": "SoftwareApplication",
              "name": toolA.name,
              ...(toolA.websiteUrl ? { "url": toolA.websiteUrl } : {}),
            },
            {
              "@type": "SoftwareApplication",
              "name": toolB.name,
              ...(toolB.websiteUrl ? { "url": toolB.websiteUrl } : {}),
            },
          ],
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "ToolTrim", "item": `${SEO_BASE}/${lang}` },
            { "@type": "ListItem", "position": 2, "name": comparatifsLabel, "item": comparatifsPath },
            { "@type": "ListItem", "position": 3, "name": `${toolA.name} vs ${toolB.name}`, "item": url },
          ],
        },
      ],
    });
    return () => {
      cleanupSeo(["compare-jsonld", "compare-faq-jsonld"]);
    };
  }, [toolA, toolB, lang, slugPair, battleDataForSeo]);

  if (loading && staleLoading) {
    return (
      <div className="cp-not-found">
        <div className="cp-not-found-inner">
          <span className="cp-eyebrow">{t("Problème de connexion", "Connection issue")}</span>
          <h1 className="cp-not-found-title">
            {t("Le serveur ne répond pas. Réessaye dans un instant.", "Server isn't responding. Try again in a moment.")}
          </h1>
          <p className="cp-not-found-body">
            {t(
              "Vérifie ta connexion internet et réessaie. Si le problème persiste, consulte la liste des comparatifs.",
              "Check your internet connection and try again. If it persists, browse all comparisons."
            )}
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="tt-button-primary" onClick={() => window.location.reload()}>
              {t("Réessayer", "Try again")}
            </button>
            <Link to={`${prefix}/comparatifs`} className="tt-button-secondary">
              {t("Voir tous les comparatifs", "See all comparisons")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label={t("Chargement en cours", "Loading")}>
        <div style={{ width: 32, height: 32, borderRadius: "var(--radius-circle)", border: "3px solid #DADAD4", borderTopColor: "#222222", animation: "spin 0.8s linear infinite" }} aria-hidden="true" />
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
            {t("Ce comparatif n'existe pas.", "This comparison doesn't exist.")}
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
  const heroDek = content.aglanceHeroPromise || framing;
  const showFundamental = heroDek.trim().toLocaleLowerCase() !== framing.trim().toLocaleLowerCase();
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
  const isRepeatedCriterion = (fr: string, en: string) =>
    /co[uû]t|prix|usage principal/i.test(fr) || /cost|price|primary use/i.test(en);
  const decisiveCriteriaForDisplay = content.decisiveCriteria.filter(
    (criterion) => !isRepeatedCriterion(criterion.title, criterion.titleEn),
  );
  const decisionRowsForDisplay = decisionTableRows.filter(
    (row) => !isRepeatedCriterion(row.criterion, row.criterionEn),
  );
  const bestForA = content.aglanceBestForA || getToolBestFor(content, "A", lang);
  const bestForB = content.aglanceBestForB || getToolBestFor(content, "B", lang);
  const defaultChoice = content.aglanceDefaultLabel || getDefaultChoice(content, toolA, toolB, lang);
  const budgetSignal = content.aglanceBudget || getBudgetSignal(toolA, toolB, lang);
  const levelSignal = content.aglanceLevel || getLearningCurve(learningCurveRow, lang);
  const riskSignal = content.aglanceRisk || getToolTrimRisk(content, lang);
  /* Hero duel — Sprint 62/66 */
  // Position labels (small uppercase, 10px) — only use explicit values, NOT bestForA fallback (too long)
  const heroPositionA = content.aglancePositionA ?? null;
  const heroPositionB = content.aglancePositionB ?? null;
  const fallbackPitfalls = getPitfalls(content, toolA, toolB, lang);

  // Find alternative tools from the lightweight summaries index.
  // ToolLogo only reads {slug, name, logo, websiteUrl, affiliateLink, ...} —
  // all present in ToolSummary, so no need to load the full 3.3MB catalog.
  const altTools = content.alternatives.map((alt) => ({
    ...alt,
    tool: toolSummaries.find((t) => t.slug === alt.slug || t.id === alt.slug),
  }));
  const resolvedAltTools = altTools.flatMap((alt) => alt.tool ? [alt.tool] : []);
  const hasComparaisonSection = decisiveCriteriaForDisplay.length > 0 || decisionRowsForDisplay.length > 0;

  return (
    <div className="min-h-screen cp-page-light">

      {/* Reading progress — CSS-only scroll-driven editorial signal. Gracefully
          invisible on browsers without animation-timeline support. */}
      <div className="cp-reading-progress" aria-hidden="true" />

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="cp-hero">
        <div className="cp-hero-inner">
          <div className="cp-hero-meta">
            <Breadcrumb items={[
              { label: t("Comparatifs", "Comparisons"), href: `${prefix}/comparatifs` },
              { label: `${toolA.name} vs ${toolB.name}` },
            ]} includeSchema={false} />
            {content.checkedAt && (() => {
              const d = new Date(content.checkedAt);
              const monthFr = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
              const monthEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              const label = lang === "fr"
                ? `Vérifié · ${monthFr[d.getMonth()]} ${d.getFullYear()}`
                : `Reviewed · ${monthEn[d.getMonth()]} ${d.getFullYear()}`;
              return (
                <time className="cp-hero-checked" dateTime={content.checkedAt} aria-label={lang === "fr" ? `Verdict vérifié en ${monthFr[d.getMonth()]} ${d.getFullYear()}` : `Verdict reviewed in ${monthEn[d.getMonth()]} ${d.getFullYear()}`}>
                  {label}
                </time>
              );
            })()}
          </div>

          <div className="cp-hero-layout">
            <div className="cp-hero-duel">
              <h1 className="cp-hero-title">
                <span className="cp-hero-title-tool">
                  <ToolLogo tool={toolA} size={56} className="cp-hero-title-logo" aria-hidden="true" />
                  {toolA.name}
                </span>
                <span className="cp-hero-title-vs" aria-hidden="true">vs</span>
                <span className="cp-hero-title-tool">
                  <ToolLogo tool={toolB} size={56} className="cp-hero-title-logo" aria-hidden="true" />
                  {toolB.name}<span aria-hidden="true">.</span>
                </span>
              </h1>
              <p className="cp-article-dek">{heroDek}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="cp-product-shell">
        <main className="cp-product-main">

      {showFundamental && (
        <section className="cp-section cp-fundamental-section">
          <div className="cp-container">
            <div className="cp-matrix-header">
              <span className="cp-eyebrow">{t("En bref", "In short")}</span>
              <h2 className="cp-title">{t("La différence fondamentale.", "The fundamental difference.")}</h2>
            </div>
            <p className="cp-fundamental-copy">{framing}</p>
          </div>
        </section>
      )}

      <section id="decision" className="cp-section scroll-mt-20">
        <div className="cp-container">
          <div className="cp-matrix-header">
            <span className="cp-eyebrow">{t("Selon ton usage", "By use case")}</span>
            <h2 className="cp-title">{t("Quel outil choisir ?", "Which tool should you choose?")}</h2>
          </div>
          <div className="cp-choose-grid">
            <div>
              <h3>{t("Choisis", "Choose")} {toolA.name} {t("si…", "if…")}</h3>
              <ul>
                {(lang === "fr" ? content.chooseAIfList : content.toolAUseCasesEn).slice(0, 5).map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
            <div>
              <h3>{t("Choisis", "Choose")} {toolB.name} {t("si…", "if…")}</h3>
              <ul>
                {(lang === "fr" ? content.chooseBIfList : content.toolBUseCasesEn).slice(0, 5).map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Coût réel — matrice financière ───────────────────────────────── */}
      <section id="cout" className="cp-section cp-section--cost scroll-mt-20">
        <div className="cp-container">

          {/* Full-width header: counter → eyebrow → title → framing → reco */}
          <div className="cp-matrix-header">
            <span className="cp-eyebrow">{t("Coût réel", "Real cost")}</span>
            <h2 className="cp-title">{t("Ce que tu paies vraiment.", "What you really pay for.")}</h2>
          </div>

          {/* Grille 3 colonnes : critère | outil A | outil B */}
          <div className="cp-compare-table" role="table" aria-label={t("Comparaison des coûts", "Cost comparison")}>
            <div className="cp-compare-header" role="row">
              <div className="cp-compare-header-label" role="columnheader" aria-hidden="true" />
              <div className="cp-compare-header-tool" role="columnheader">
                <ToolLogo tool={toolA} size={40} aria-hidden="true" />
                <span className="cp-compare-header-name">{toolA.name}</span>
              </div>
              <div className="cp-compare-header-tool" role="columnheader">
                <ToolLogo tool={toolB} size={40} aria-hidden="true" />
                <span className="cp-compare-header-name">{toolB.name}</span>
              </div>
            </div>
            {content.costReality.map((row, index) => (
              <div key={row.label} className="cp-compare-row" role="row">
                <div className="cp-compare-row-label" role="cell">
                  <p className="cp-compare-row-title">{lang === "fr" ? row.label : row.labelEn}</p>
                  <p className="cp-compare-row-verdict">{lang === "fr" ? row.recommendation : row.recommendationEn}</p>
                </div>
                <div className="cp-compare-row-tool cp-compare-row-tool--eq" role="cell">
                  <span className="cp-compare-cell-tool" aria-hidden="true">
                    <ToolLogo tool={toolA} size={20} />{toolA.name}
                  </span>
                  <p className="cp-compare-row-tool-val">{lang === "fr" ? row.toolA : row.toolAEn}</p>
                </div>
                <div className="cp-compare-row-tool cp-compare-row-tool--eq" role="cell">
                  <span className="cp-compare-cell-tool" aria-hidden="true">
                    <ToolLogo tool={toolB} size={20} />{toolB.name}
                  </span>
                  <p className="cp-compare-row-tool-val">{lang === "fr" ? row.toolB : row.toolBEn}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 04 Comparaison — critères décisionnels ────────────────────────── */}
      {hasComparaisonSection && (
        <section id="comparaison" className="cp-section scroll-mt-20">
          <div className="cp-container">
            <div className="cp-matrix-header">
              <span className="cp-eyebrow">{t("Comparer", "Compare")}</span>
              <h2 className="cp-title">{t("Les critères qui font la différence.", "The criteria that make the difference.")}</h2>
            </div>

            <div className="cp-compare-table" role="table" aria-label={t("Comparaison détaillée", "Detailed comparison")}>
              <div className="cp-compare-header" role="row">
                <div className="cp-compare-header-label" role="columnheader" aria-hidden="true" />
                <div className="cp-compare-header-tool" role="columnheader">
                  <ToolLogo tool={toolA} size={40} aria-hidden="true" />
                  <span className="cp-compare-header-name">{toolA.name}</span>
                </div>
                <div className="cp-compare-header-tool" role="columnheader">
                  <ToolLogo tool={toolB} size={40} aria-hidden="true" />
                  <span className="cp-compare-header-name">{toolB.name}</span>
                </div>
              </div>

              {/* Prefer decisiveCriteria (editorial, win/loss). Fallback to tableRows. */}
              {decisiveCriteriaForDisplay.length > 0
                ? decisiveCriteriaForDisplay.slice(0, 5).map((criterion, index) => {
                    const levels = getCriterionLevels(criterion, toolA, toolB, lang);
                    return (
                      <div key={criterion.title} className="cp-compare-row" role="row">
                        <div className="cp-compare-row-label" role="cell">
                          <p className="cp-compare-row-title">{lang === "fr" ? criterion.title : criterion.titleEn}</p>
                          <p className="cp-compare-row-verdict">{lang === "fr" ? criterion.decision : criterion.decisionEn}</p>
                        </div>
                        <div className={`cp-compare-row-tool${levels.winner === "A" ? " cp-compare-row-tool--win" : ""}`} role="cell">
                          {levels.winner === "A" && <span className="sr-only">{t("Recommandé : ", "Recommended: ")}</span>}
                          <span className="cp-compare-cell-tool" aria-hidden="true">
                            <ToolLogo tool={toolA} size={20} />{toolA.name}
                          </span>
                          <p className="cp-compare-row-tool-val">{lang === "fr" ? criterion.toolA : criterion.toolAEn}</p>
                        </div>
                        <div className={`cp-compare-row-tool${levels.winner === "B" ? " cp-compare-row-tool--win" : ""}`} role="cell">
                          {levels.winner === "B" && <span className="sr-only">{t("Recommandé : ", "Recommended: ")}</span>}
                          <span className="cp-compare-cell-tool" aria-hidden="true">
                            <ToolLogo tool={toolB} size={20} />{toolB.name}
                          </span>
                          <p className="cp-compare-row-tool-val">{lang === "fr" ? criterion.toolB : criterion.toolBEn}</p>
                        </div>
                      </div>
                    );
                  })
                : decisionRowsForDisplay.slice(0, 5).map((row, index) => {
                    const aTitle = lang === "fr" ? row.toolA : row.toolAEn;
                    const aNote = lang === "fr" ? row.toolANote : row.toolANoteEn;
                    const bTitle = lang === "fr" ? row.toolB : row.toolBEn;
                    const bNote = lang === "fr" ? row.toolBNote : row.toolBNoteEn;
                    const crit = lang === "fr" ? row.criterion : row.criterionEn;
                    const verdict = lang === "fr" ? row.verdictLabel : row.verdictLabelEn;
                    return (
                      <div key={row.criterion} className="cp-compare-row" role="row">
                        <div className="cp-compare-row-label" role="cell">
                          <p className="cp-compare-row-title">{crit}</p>
                          {verdict && <p className="cp-compare-row-verdict">{verdict}</p>}
                        </div>
                        <div className={`cp-compare-row-tool${row.winner === "A" ? " cp-compare-row-tool--win" : ""}`} role="cell">
                          {row.winner === "A" && <span className="sr-only">{t("Recommandé : ", "Recommended: ")}</span>}
                          <span className="cp-compare-cell-tool" aria-hidden="true">
                            <ToolLogo tool={toolA} size={20} />{toolA.name}
                          </span>
                          <p className="cp-compare-row-tool-val">{aTitle}</p>
                          {aNote && <p className="cp-compare-row-tool-note">{aNote}</p>}
                        </div>
                        <div className={`cp-compare-row-tool${row.winner === "B" ? " cp-compare-row-tool--win" : ""}`} role="cell">
                          {row.winner === "B" && <span className="sr-only">{t("Recommandé : ", "Recommended: ")}</span>}
                          <span className="cp-compare-cell-tool" aria-hidden="true">
                            <ToolLogo tool={toolB} size={20} />{toolB.name}
                          </span>
                          <p className="cp-compare-row-tool-val">{bTitle}</p>
                          {bNote && <p className="cp-compare-row-tool-note">{bNote}</p>}
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          </div>
        </section>
      )}

      {/* ── 05 FAQ ────────────────────────────────────────────────────────── */}
      {content.faq.length > 0 && (
        <section id="doutes" className="cp-section cp-section--last scroll-mt-20">
          <div className="cp-container">
            <div className="cp-matrix-header">
              <span className="cp-eyebrow">{t("Questions", "Questions")}</span>
              <h2 className="cp-title">{t("Questions fréquentes.", "Frequently asked questions.")}</h2>
            </div>

            <FaqBlock
              size="compact"
              eyebrow=""
              title=""
              description=""
              items={content.faq.map((item) => ({
                question: lang === "fr" ? item.q : item.qEn,
                answer: lang === "fr" ? item.a : item.aEn,
              }))}
              openCount={1}
            />

          </div>
        </section>
      )}

      {/* ── 06 Points de vigilance ────────────────────────────────────────── */}
      {content.tooltrimRisks.length > 0 && (
        <section id="vigilance" className="cp-section scroll-mt-20">
          <div className="cp-container">
            <div className="cp-matrix-header">
              <span className="cp-eyebrow">{t("Avant de choisir", "Before choosing")}</span>
              <h2 className="cp-title">{t("Les pièges à éviter.", "Pitfalls to avoid.")}</h2>
            </div>
            <div className="cp-limites-risks">
              {content.tooltrimRisks.slice(0, 3).map((risk, i) => (
                <article key={`${risk.mistake}-${i}`} className="cp-limites-risk-row">
                  <div className="cp-risk-side cp-risk-side--avoid">
                    <span className="cp-risk-label">{t("À éviter", "Avoid")}</span>
                    <p className="cp-limites-risk-title">{lang === "fr" ? risk.mistake : risk.mistakeEn}</p>
                  </div>
                  <ArrowRight className="cp-risk-arrow" aria-hidden="true" />
                  <div className="cp-risk-side">
                    <span className="cp-risk-label">{t("À faire", "Do this")}</span>
                    <p className="cp-limites-risk-fix">
                      {lang === "fr" ? risk.recommendation : risk.recommendationEn}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 07 Alternatives ───────────────────────────────────────────────── */}
      {resolvedAltTools.length > 0 && (
        <section id="alternatives" className="cp-section cp-section--last scroll-mt-20">
          <div className="cp-container">
            <div className="cp-matrix-header">
              <span className="cp-eyebrow">{t("Alternatives", "Alternatives")}</span>
              <h2 className="cp-title">{t("Si aucun des deux ne colle.", "If neither one fits.")}</h2>
            </div>
            <ToolComparisonTable
              tool={toolA}
              alternatives={resolvedAltTools}
              prefix={prefix}
              lang={lang}
              t={t}
              includeCurrent={false}
            />
          </div>
        </section>
      )}

        </main>

        <aside className="cp-decision-sidebar" aria-label={t("Décision ToolTrim", "ToolTrim decision") as string}>
          <div className="cp-decision-sidebar-tools">
            <span><ToolLogo tool={toolA} size={32} />{toolA.name}</span>
            <span className="cp-decision-sidebar-vs">vs</span>
            <span><ToolLogo tool={toolB} size={32} />{toolB.name}</span>
          </div>
          <span className="cp-eyebrow">{t("Verdict ToolTrim", "ToolTrim verdict")}</span>
          <p className="cp-decision-sidebar-verdict">{verdictShort}</p>
          <div className="cp-decision-sidebar-choices">
            <div>
              <strong>{t("Choix par défaut", "Default choice")}</strong>
              <span>{lang === "fr" ? content.tippingPoint.defaultChoice : content.tippingPoint.defaultChoiceEn}</span>
            </div>
            <div>
              <strong>{t("Changer si", "Switch when")}</strong>
              <span>{lang === "fr" ? content.tippingPoint.switchWhen : content.tippingPoint.switchWhenEn}</span>
            </div>
          </div>
          <div className="cp-decision-sidebar-links">
            <Link to={`${prefix}/tool/${toolA.slug || toolA.id}`}>{t("Voir", "View")} {toolA.name}</Link>
            <Link to={`${prefix}/tool/${toolB.slug || toolB.id}`}>{t("Voir", "View")} {toolB.name}</Link>
          </div>
        </aside>
      </div>

      {/* ── Methodology footnote ───────────────────────────────────────────── */}
      <div className="cp-methodology-note">
        <Link to={`${prefix}/methodology`} className="cp-methodology-link">
          {t("Comment ToolTrim évalue les outils →", "How ToolTrim evaluates tools →")}
        </Link>
      </div>

    </div>
  );
};

export default ComparePage;
