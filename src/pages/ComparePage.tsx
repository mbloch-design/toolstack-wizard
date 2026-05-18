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
function getBudgetSignal(toolA: Tool, toolB: Tool, lang: "fr" | "en"): string {
  const prices = [getPriceNum(toolA), getPriceNum(toolB)].filter((price) => price > 0);
  if (prices.length === 0) return lang === "fr" ? "Plans gratuits possibles" : "Free plans possible";
  return lang === "fr"
    ? `à partir de ${Math.min(...prices)}€/mois`
    : `from €${Math.min(...prices)}/month`;
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
  toolB: string; toolBEn: string;
  winner: "A" | "B" | "tie"; verdictLabel: string; verdictLabelEn: string;
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
    toolA: string;
    toolB: string;
    tooltrimDecision: string;
    showInMainTable?: boolean;
  }>;
  related?: {
    alternatives?: string[];
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
      return {
        criterion: row.criterion,
        criterionEn: asEnglishCopy(row.criterion),
        toolA: row.toolA,
        toolAEn: asEnglishCopy(row.toolA),
        toolB: row.toolB,
        toolBEn: asEnglishCopy(row.toolB),
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
  const tipping = comparison.tippingPoint;
  const alternatives = [
    ...(data.related?.alternatives || []),
    ...(data.related?.otherComparisons || []),
  ].slice(0, 6);

  return {
    framing: comparison.falseSimilarity || comparison.mainDifference,
    framingEn: asEnglishCopy(comparison.falseSimilarity || comparison.mainDifference),
    verdictShort: comparison.decisionSummary,
    verdictShortEn: asEnglishCopy(comparison.decisionSummary),
    finalRecommendation: comparison.finalRecommendation || comparison.decisionSummary,
    finalRecommendationEn: asEnglishCopy(comparison.finalRecommendation || comparison.decisionSummary),
    quickVerdictA: comparison.chooseAIf.join(" "),
    quickVerdictAEn: asEnglishCopy(comparison.chooseAIf.join(" ")),
    quickVerdictB: comparison.chooseBIf.join(" "),
    quickVerdictBEn: asEnglishCopy(comparison.chooseBIf.join(" ")),
    quickVerdictAvoid: avoidBoth,
    quickVerdictAvoidEn: asEnglishCopy(avoidBoth),
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
        toolA: cost?.toolA?.freePlanReality || data.tools.toolA.freePlan?.summary || "À vérifier selon volume.",
        toolAEn: asEnglishCopy(cost?.toolA?.freePlanReality || data.tools.toolA.freePlan?.summary || "Check by volume."),
        toolB: cost?.toolB?.freePlanReality || data.tools.toolB.freePlan?.summary || "À vérifier selon volume.",
        toolBEn: asEnglishCopy(cost?.toolB?.freePlanReality || data.tools.toolB.freePlan?.summary || "Check by volume."),
        recommendation: cost?.tooltrimNote || "Ne paie que si l'usage est régulier et distinct.",
        recommendationEn: asEnglishCopy(cost?.tooltrimNote || "Only pay when usage is regular and distinct."),
      },
      {
        label: "Quand payer",
        labelEn: "When to pay",
        toolA: cost?.toolA?.whenPaidBecomesNecessary || formatPlanSummary(data.tools.toolA),
        toolAEn: asEnglishCopy(cost?.toolA?.whenPaidBecomesNecessary || formatPlanSummary(data.tools.toolA)),
        toolB: cost?.toolB?.whenPaidBecomesNecessary || formatPlanSummary(data.tools.toolB),
        toolBEn: asEnglishCopy(cost?.toolB?.whenPaidBecomesNecessary || formatPlanSummary(data.tools.toolB)),
        recommendation: cost?.duplicateCostWarning || "Auditer avant de payer les deux.",
        recommendationEn: asEnglishCopy(cost?.duplicateCostWarning || "Audit before paying for both."),
      },
      {
        label: "Coût caché",
        labelEn: "Hidden cost",
        toolA: cost?.toolA?.hiddenCost || cost?.toolA?.pricingRisk || "Temps de setup et maintenance.",
        toolAEn: asEnglishCopy(cost?.toolA?.hiddenCost || cost?.toolA?.pricingRisk || "Setup and maintenance time."),
        toolB: cost?.toolB?.hiddenCost || cost?.toolB?.pricingRisk || "Temps de setup et maintenance.",
        toolBEn: asEnglishCopy(cost?.toolB?.hiddenCost || cost?.toolB?.pricingRisk || "Setup and maintenance time."),
        recommendation: cost?.duplicateCostWarning || "Le coût réel inclut le doublon et le temps perdu.",
        recommendationEn: asEnglishCopy(cost?.duplicateCostWarning || "Real cost includes duplication and lost time."),
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
    pricingFraming: cost?.tooltrimNote || comparison.mainDifference,
    pricingFramingEn: asEnglishCopy(cost?.tooltrimNote || comparison.mainDifference),
    pricingToolANotes: formatPlanSummary(data.tools.toolA),
    pricingToolANotesEn: asEnglishCopy(formatPlanSummary(data.tools.toolA)),
    pricingToolBNotes: formatPlanSummary(data.tools.toolB),
    pricingToolBNotesEn: asEnglishCopy(formatPlanSummary(data.tools.toolB)),
    pricingReco: cost?.duplicateCostWarning || "Vérifier le coût réel selon volume, sièges et usage hebdomadaire.",
    pricingRecoEn: asEnglishCopy(cost?.duplicateCostWarning || "Check real cost by volume, seats, and weekly usage."),
    alternatives: alternatives.map((name) => ({
      slug: slugifyName(name),
      name,
      reason: "Option proche à regarder si le duel ne colle pas à ton usage.",
      reasonEn: "Nearby option to check if this battle does not fit your use case.",
    })),
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

/* ─── Editorial content registry ─────────────────────────────────────────── */
const EDITORIAL_CONTENT: Record<string, CompareEditorialContent> = {
  "notion-vs-airtable": NOTION_VS_AIRTABLE,
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
      "@type": "Article",
      headline: title,
      description: desc,
      url,
      author: { "@type": "Organization", name: "ToolTrim", url: SEO_BASE },
      publisher: { "@type": "Organization", name: "ToolTrim", url: SEO_BASE },
      datePublished: "2026-03-13",
      inLanguage: lang,
    });
    return () => cleanupSeo(["compare-jsonld"]);
  }, [toolA, toolB, lang, slugPair]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #DADAD4", borderTopColor: "#222222", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!parsedPair || !toolA || !toolB) {
    return (
      <div style={{ maxWidth: 600, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-ui)", fontSize: 15, color: "#6F6F68", marginBottom: 16 }}>
          {t("Comparatif non trouvé.", "Comparison not found.")}
        </p>
        <Link to={`${prefix}/comparatifs`} style={{ fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 600, color: "#222222", textDecoration: "underline" }}>
          {t("Voir tous les comparatifs", "See all comparisons")}
        </Link>
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
  const learningCurveRow = content.tableRows.find((row) => row.criterion === "Prise en main" || row.criterionEn === "Learning curve");
  const decisionTableRows = getDecisionTableRows(content.tableRows);
  const bestForA = getToolBestFor(content, "A", lang);
  const bestForB = getToolBestFor(content, "B", lang);
  const defaultChoice = getDefaultChoice(content, toolA, toolB, lang);
  const budgetSignal = getBudgetSignal(toolA, toolB, lang);
  const levelSignal = getLearningCurve(learningCurveRow, lang);
  const riskSignal = getToolTrimRisk(content, lang);
  const fallbackPitfalls = getPitfalls(content, toolA, toolB, lang);

  // Find alternative tools from the loaded tools list
  const altTools = content.alternatives.map((alt) => ({
    ...alt,
    tool: tools.find((t) => t.slug === alt.slug || t.id === alt.slug),
  }));
  const navSections: CompareNavSection[] = [
    { id: "verdict", label: t("Verdict", "Verdict") },
    { id: "scores", label: t("Scores", "Scores") },
    { id: "comparaison", label: t("Comparer", "Compare") },
    { id: "seuil", label: t("Seuil", "Threshold") },
    { id: "cout", label: t("Coût", "Cost") },
    { id: "vigilance", label: t("Erreurs", "Mistakes") },
    ...(altTools.length > 0 ? [{ id: "alternatives", label: t("Alternatives", "Alternatives") }] : []),
    { id: "faq", label: "FAQ" },
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

          <span className="cp-eyebrow">COMPARATIF</span>

          <h1 className="cp-hero-title">
            {toolA.name} vs {toolB.name}.
          </h1>

          <p className="cp-hero-promise">{framing}</p>

          <div className="cp-battle-stage" aria-label={t("Battle utile", "Useful battle")}>
            <article className="cp-battle-card">
              <div className="cp-battle-card-head">
                <div className="cp-battle-logo"><ToolLogo tool={toolA} size={34} /></div>
                <div>
                  <p className="cp-battle-name">{toolA.name}</p>
                  <span className="cp-battle-label">{t("Recommandé pour", "Recommended for")}</span>
                </div>
              </div>
              <p className="cp-battle-best">{bestForA}</p>
              <div className="cp-battle-fit">
                <span>{t("Signal d'adéquation", "Fit signal")}</span>
                <strong>{t("Fort selon usage", "Strong by use case")}</strong>
              </div>
            </article>

            <div className="cp-battle-center" aria-label={t("Verdict ToolTrim", "ToolTrim verdict")}>
              <span>VS</span>
              <p>{t("Verdict ToolTrim", "ToolTrim verdict")}</p>
              <strong>{lang === "fr" ? content.finalRecommendation : content.finalRecommendationEn}</strong>
            </div>

            <article className="cp-battle-card">
              <div className="cp-battle-card-head">
                <div className="cp-battle-logo"><ToolLogo tool={toolB} size={34} /></div>
                <div>
                  <p className="cp-battle-name">{toolB.name}</p>
                  <span className="cp-battle-label">{t("Recommandé pour", "Recommended for")}</span>
                </div>
              </div>
              <p className="cp-battle-best">{bestForB}</p>
              <div className="cp-battle-fit">
                <span>{t("Signal d'adéquation", "Fit signal")}</span>
                <strong>{t("Fort selon usage", "Strong by use case")}</strong>
              </div>
            </article>
          </div>

          <div className="cp-hero-fact-sheet" aria-label={t("Résumé du choix", "Decision summary")}>
            <div className="cp-hero-fact">
              <span>{t("Par défaut", "Default")}</span>
              <p>{defaultChoice}</p>
            </div>
            <div className="cp-hero-fact cp-hero-fact--wide">
              <span>{toolA.name}</span>
              <p>{bestForA}</p>
            </div>
            <div className="cp-hero-fact cp-hero-fact--wide">
              <span>{toolB.name}</span>
              <p>{bestForB}</p>
            </div>
            <div className="cp-hero-fact">
              <span>{t("Budget", "Budget")}</span>
              <p>{budgetSignal}</p>
            </div>
            <div className="cp-hero-fact">
              <span>{t("Niveau", "Level")}</span>
              <p>{levelSignal}</p>
            </div>
            <div className="cp-hero-fact cp-hero-fact--wide">
              <span>{t("Point d'attention", "Watchout")}</span>
              <p>{riskSignal}</p>
            </div>
          </div>
        </div>
      </section>

      <CompareStickyNav sections={navSections} prefix={prefix} />

      {/* ── Verdict rapide ─────────────────────────────────────────────────── */}
      <section id="verdict" className="cp-section scroll-mt-20">
        <div className="cp-container">
          <span className="cp-eyebrow">{t("01 — Verdict", "01 — Verdict")}</span>
          <p className="cp-title">{t("Le choix rapide.", "The quick choice.")}</p>
          <p className="cp-section-intro">{verdictShort}</p>
          <p className="cp-final-recommendation">
            <span>{t("Recommandation ToolTrim", "ToolTrim recommendation")}</span>
            {lang === "fr" ? content.finalRecommendation : content.finalRecommendationEn}
          </p>
          <div className="cp-verdict-grid">
            <div className="cp-verdict-col">
              <p className="cp-verdict-label">{t("Choisis", "Choose")} {toolA.name} {t("si…", "if…")}</p>
              <p className="cp-verdict-text">
                {lang === "fr" ? content.quickVerdictA : content.quickVerdictAEn}
              </p>
            </div>
            <div className="cp-verdict-col">
              <p className="cp-verdict-label">{t("Choisis", "Choose")} {toolB.name} {t("si…", "if…")}</p>
              <p className="cp-verdict-text">
                {lang === "fr" ? content.quickVerdictB : content.quickVerdictBEn}
              </p>
            </div>
            <div className="cp-verdict-col">
              <p className="cp-verdict-label">{t("Évite les deux si…", "Avoid both if…")}</p>
              <p className="cp-verdict-text">
                {lang === "fr" ? content.quickVerdictAvoid : content.quickVerdictAvoidEn}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Scores par usage ──────────────────────────────────────────────── */}
      <section id="scores" className="cp-section scroll-mt-20">
        <div className="cp-container">
          <span className="cp-eyebrow">{t("02 — Scores par usage", "02 — Usage scores")}</span>
          <p className="cp-title">{t("Où chaque outil prend l'avantage.", "Where each tool takes the lead.")}</p>
          <div className="cp-score-list">
            {content.decisiveCriteria.slice(0, 6).map((criterion) => {
              const levels = getCriterionLevels(criterion, toolA, toolB, lang);
              return (
                <article key={criterion.title} className="cp-score-row">
                  <div className="cp-score-main">
                    <p className="cp-score-title">{lang === "fr" ? criterion.title : criterion.titleEn}</p>
                    <p className="cp-score-decision">
                      <span>{t("Décision ToolTrim", "ToolTrim decision")}</span>
                      {lang === "fr" ? criterion.decision : criterion.decisionEn}
                    </p>
                  </div>
                  <div className="cp-score-tools">
                    <div className={`cp-score-tool${levels.winner === "A" ? " cp-score-tool--winner" : ""}`}>
                      <div className="cp-score-tool-head">
                        <span>{toolA.name}</span>
                        <strong className={`cp-score-level cp-score-level--${levels.toolA}`}>
                          {getLevelLabel(levels.toolA, lang)}
                        </strong>
                      </div>
                      <p>{lang === "fr" ? criterion.toolA : criterion.toolAEn}</p>
                    </div>
                    <div className={`cp-score-tool${levels.winner === "B" ? " cp-score-tool--winner" : ""}`}>
                      <div className="cp-score-tool-head">
                        <span>{toolB.name}</span>
                        <strong className={`cp-score-level cp-score-level--${levels.toolB}`}>
                          {getLevelLabel(levels.toolB, lang)}
                        </strong>
                      </div>
                      <p>{lang === "fr" ? criterion.toolB : criterion.toolBEn}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Tableau comparatif ─────────────────────────────────────────────── */}
      <section id="comparaison" className="cp-section scroll-mt-20">
        <div className="cp-container">
          <span className="cp-eyebrow">{t("03 — Comparaison", "03 — Comparison")}</span>
          <p className="cp-title">{t("Comparer selon le vrai usage.", "Compare based on real use.")}</p>
          <div className="cp-table">
            <div className="cp-table-head">
              <span className="cp-table-head-cell">{t("Critère", "Criterion")}</span>
              <span className="cp-table-head-cell">{toolA.name}</span>
              <span className="cp-table-head-cell">{toolB.name}</span>
              <span className="cp-table-head-cell">{t("Verdict", "Verdict")}</span>
            </div>
            {decisionTableRows.map((row) => (
              <div key={row.criterion} className="cp-table-row">
                <span className="cp-table-cell" data-label="">
                  {lang === "fr" ? row.criterion : row.criterionEn}
                </span>
                <span className={`cp-table-cell${row.winner === "A" ? " cp-table-cell--win" : ""}`} data-label={toolA.name}>
                  {lang === "fr" ? row.toolA : row.toolAEn}
                </span>
                <span className={`cp-table-cell${row.winner === "B" ? " cp-table-cell--win" : ""}`} data-label={toolB.name}>
                  {lang === "fr" ? row.toolB : row.toolBEn}
                </span>
                <span className="cp-table-cell cp-table-verdict" data-label={t("Verdict", "Verdict")}>
                  {lang === "fr" ? row.verdictLabel : row.verdictLabelEn}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Seuil de bascule ──────────────────────────────────────────────── */}
      <section id="seuil" className="cp-section scroll-mt-20">
        <div className="cp-container">
          <span className="cp-eyebrow">{t("04 — Seuil de bascule", "04 — Tipping point")}</span>
          <p className="cp-title">{lang === "fr" ? content.tippingPoint.title : content.tippingPoint.titleEn}</p>
          <div className="cp-tipping-panel">
            <div>
              <span>{t("Par défaut", "Default")}</span>
              <p>{lang === "fr" ? content.tippingPoint.defaultChoice : content.tippingPoint.defaultChoiceEn}</p>
            </div>
            <div>
              <span>{t("Passe à l'autre si", "Switch when")}</span>
              <p>{lang === "fr" ? content.tippingPoint.switchWhen : content.tippingPoint.switchWhenEn}</p>
            </div>
          </div>
          <ul className="cp-tipping-signals">
            {(lang === "fr" ? content.tippingPoint.signals : content.tippingPoint.signalsEn).map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Coût réel ─────────────────────────────────────────────────────── */}
      <section id="cout" className="cp-section scroll-mt-20">
        <div className="cp-container">
          <span className="cp-eyebrow">{t("05 — Coût réel", "05 — Real cost")}</span>
          <p className="cp-title">{t("Ce que tu paies vraiment.", "What you really pay for.")}</p>
          <p className="cp-section-intro">
            {lang === "fr" ? content.pricingFraming : content.pricingFramingEn}
          </p>
          <div className="cp-cost-grid">
            {content.costReality.map((row) => (
              <article key={row.label} className="cp-cost-row">
                <p className="cp-cost-label">{lang === "fr" ? row.label : row.labelEn}</p>
                <div>
                  <span>{toolA.name}</span>
                  <p>{lang === "fr" ? row.toolA : row.toolAEn}</p>
                </div>
                <div>
                  <span>{toolB.name}</span>
                  <p>{lang === "fr" ? row.toolB : row.toolBEn}</p>
                </div>
                <p className="cp-cost-reco">{lang === "fr" ? row.recommendation : row.recommendationEn}</p>
              </article>
            ))}
          </div>
          <div className="cp-cost-note">
            <span>{t("Recommandation ToolTrim", "ToolTrim recommendation")}</span>
            <p>{lang === "fr" ? content.pricingReco : content.pricingRecoEn}</p>
          </div>
        </div>
      </section>

      {/* ── Points de vigilance ───────────────────────────────────────────── */}
      <section id="vigilance" className="cp-section scroll-mt-20">
        <div className="cp-container">
          <span className="cp-eyebrow">{t("06 — Erreurs fréquentes", "06 — Common mistakes")}</span>
          <p className="cp-title">{t("Les erreurs de choix fréquentes.", "Common decision mistakes.")}</p>
          <div className="cp-watchout-list">
            {(content.tooltrimRisks.length > 0 ? content.tooltrimRisks : fallbackPitfalls.map((pitfall) => ({
              mistake: pitfall,
              mistakeEn: pitfall,
              consequence: "",
              consequenceEn: "",
              recommendation: "",
              recommendationEn: "",
            }))).slice(0, 5).map((risk, i) => (
              <article key={`${risk.mistake}-${i}`} className="cp-watchout-row cp-watchout-row--rich">
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="cp-watchout-title">{lang === "fr" ? risk.mistake : risk.mistakeEn}</p>
                  {(lang === "fr" ? risk.consequence : risk.consequenceEn) && (
                    <p className="cp-watchout-copy">{lang === "fr" ? risk.consequence : risk.consequenceEn}</p>
                  )}
                  {(lang === "fr" ? risk.recommendation : risk.recommendationEn) && (
                    <p className="cp-watchout-reco">{lang === "fr" ? risk.recommendation : risk.recommendationEn}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Alternatives ───────────────────────────────────────────────────── */}
      {altTools.length > 0 && (
        <section id="alternatives" className="cp-section scroll-mt-20">
          <div className="cp-container">
            <span className="cp-eyebrow">{t("07 — Pour aller plus loin", "07 — Next options")}</span>
            <p className="cp-title">
              {t("Si aucun des deux ne colle.", "If neither one fits.")}
            </p>
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
                    <div className="cp-alt-logo" style={{ background: "#F8F8F4" }}>
                      <span style={{ fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 700, color: "#9A9A92" }}>
                        {alt.name.slice(0, 2).toUpperCase()}
                      </span>
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

      {/* ── CTA band ───────────────────────────────────────────────────────── */}
      <div className="cp-cta-band">
        <div className="cp-container">
          <span className="cp-eyebrow">{t("Diagnostic", "Diagnostic")}</span>
          <p style={{
            fontFamily: "var(--font-brand)",
            fontSize: "clamp(1.75rem, 4vw, 3.5rem)",
            fontWeight: 600, letterSpacing: "-0.055em",
            lineHeight: 0.98, color: "#222222",
            maxWidth: 720, marginBottom: 16,
          }}>
            {t(
              `${toolA.name} ou ${toolB.name} sont déjà dans ta stack ?`,
              `${toolA.name} or ${toolB.name} already in your stack?`,
            )}
          </p>
          <p style={{
            fontFamily: "var(--font-ui)", fontSize: 17, lineHeight: 1.5,
            color: "#6F6F68", maxWidth: 540, marginBottom: 32,
            letterSpacing: "-0.015em",
          }}>
            {t(
              "Analyse tes outils actuels et vérifie si tu n'as pas déjà plusieurs outils qui font le même travail.",
              "Audit your current tools and check if you already have overlapping subscriptions.",
            )}
          </p>
          <Link
            to={`${prefix}/selector?from=${slugPair}`}
            style={{
              display: "inline-flex", alignItems: "center",
              height: 48, padding: "0 22px",
              background: "#222222", color: "#FFFFFF",
              borderRadius: 8, fontFamily: "var(--font-ui)",
              fontSize: 15, fontWeight: 500,
              letterSpacing: "-0.01em", textDecoration: "none",
              transition: "background 160ms ease-out",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#000000"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#222222"; }}
          >
            {t("Analyser ma stack →", "Analyze my stack →")}
          </Link>
        </div>
      </div>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section id="faq" className="cp-section cp-section--last scroll-mt-20">
        <div className="cp-container">
          <span className="cp-eyebrow">{altTools.length > 0 ? "08 — FAQ" : "07 — FAQ"}</span>
          <p className="cp-title">
            {t("Questions fréquentes.", "Frequently asked questions.")}
          </p>
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
            flexShrink: 0, color: "#9A9A92",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 160ms",
          }}
        />
      </summary>
      <p className="cp-faq-answer">{answer}</p>
    </details>
  );
}

export default ComparePage;
