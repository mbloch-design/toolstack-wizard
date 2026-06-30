import { useMemo } from "react";
import type { DiagnosticResult, Tool } from "@/types/diagnostic";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Layers3,
  MessageSquare,
  Palette,
  SearchCheck,
  Share2,
  ShieldAlert,
  Sparkles,
  Target,
} from "lucide-react";
import DashPdfExport from "./DashPdfExport";
import ToolLogo from "@/components/ToolLogo";
import { classifyCreativeWorkflowTools } from "@/lib/creativeAdaptiveEngine";
import {
  formatMoney,
  formatMonthlyTotal,
  getMonthlyBudgetBreakdown,
  getPricingAudit,
  getPricingCaptureSummary,
} from "@/utils/diagnosticPricing";
import { translateHealthLabel } from "@/utils/diagnosticLabels";
import { buildDiagnosticDecisionPlan } from "@/utils/diagnosticDecisionPlan";

type Tab = "overview" | "gaspillage" | "stack" | "optimiser" | "actions";

interface Props {
  result: DiagnosticResult;
  t: (fr: string, en: string) => string;
  onShare?: () => void;
  onNavigate?: (tab: Tab) => void;
  onTrack?: (eventName: string, eventPayload?: Record<string, unknown>) => void;
}

type PriorityItem = {
  id: string;
  label: string;
  detail: string;
  tool?: Tool;
  savings: number;
  kind: "now" | "check" | "later";
};

function getName(result: DiagnosticResult) {
  return result.sessionState.firstName?.trim();
}

function getGoalLabel(goal: DiagnosticResult["sessionState"]["stackGoal"], t: Props["t"]) {
  if (goal === "reduce_costs") return t("Réduire les coûts", "Reduce costs");
  if (goal === "save_time") return t("Gagner du temps", "Save time");
  if (goal === "simplify") return t("Simplifier", "Simplify");
  if (goal === "quality") return t("Mieux choisir", "Choose better");
  return t("Clarifier la stack", "Clarify the stack");
}

function buildThesis(result: DiagnosticResult, t: Props["t"]) {
  const name = getName(result);
  const introFr = name ? `${name}, ` : "";
  const introEn = name ? `${name}, ` : "";
  const duplicateCount = result.insights.metrics.duplicateCount;
  const dormantCount = result.insights.metrics.dormantCount;
  const risk = result.insights.primaryRisk;

  if (result.sessionState.persona === "SOFIA") {
    const highAiFinding = result.insights.aiAnalysis.findings.find(
      (finding) => finding.severity === "high"
    );
    if (highAiFinding) {
      return t(
        `${introFr}le point prioritaire est de sécuriser la place de l’IA dans ta chaîne créative avant de chercher un nouvel outil.`,
        `${introEn}the priority is to secure AI's role in your creative chain before looking for another tool.`
      );
    }
    const satelliteCount = getCreativeWorkflowStages(result, t).find((stage) => stage.id === "accelerate")?.tools.length || 0;
    if (satelliteCount > 0) {
      return t(
        `${introFr}le vrai sujet est la fluidité de ta chaîne créative, pas seulement le nombre d’outils.`,
        `${introEn}the real topic is the flow of your creative chain, not just the number of tools.`
      );
    }
    return t(
      `${introFr}ta stack créative dépend surtout des outils principaux. Il faut vérifier les ressources, la diffusion, les validations et les archives autour.`,
      `${introEn}your creative stack mostly depends on core tools. We need to check resources, publishing, review workflows and archives around them.`
    );
  }

  if (duplicateCount >= 2) {
    return t(
      `${introFr}le vrai sujet n’est pas d’ajouter des outils, mais de réduire les chevauchements.`,
      `${introEn}the real topic is not adding more tools, but reducing overlap.`
    );
  }
  if (result.estimatedWaste > 0) {
    return t(
      `${introFr}ta stack fonctionne, mais une partie du budget peut être récupérée sans tout casser.`,
      `${introEn}your stack works, but part of the budget can be recovered without breaking everything.`
    );
  }
  if (risk?.severity === "high") {
    return t(
      `${introFr}le point prioritaire est la sécurité et la maîtrise des accès.`,
      `${introEn}the priority is security and access control.`
    );
  }
  if (dormantCount > 0) {
    return t(
      `${introFr}ta stack a surtout besoin d’un nettoyage des outils peu utilisés.`,
      `${introEn}your stack mostly needs a cleanup of low-usage tools.`
    );
  }
  return t(
    `${introFr}ta stack est plutôt cohérente. Le meilleur gain vient maintenant de la clarifier.`,
    `${introEn}your stack is mostly coherent. The best gain now is to clarify it.`
  );
}

function allPrescriptions(result: DiagnosticResult) {
  return [
    ...result.prescriptions.phase1,
    ...result.prescriptions.phase2,
    ...result.prescriptions.phase3,
  ];
}

function getPriorityItems(result: DiagnosticResult, t: Props["t"]): PriorityItem[] {
  return buildDiagnosticDecisionPlan(result).map((decision, index) => ({
    id: decision.id,
    label: t(decision.labelFr, decision.labelEn),
    detail: t(decision.detailFr, decision.detailEn),
    tool: decision.tool,
    savings: decision.savings,
    kind: index === 0 ? "now" : index === 1 ? "check" : "later",
  }));
}

function getToolGroups(result: DiagnosticResult) {
  const prescriptions = allPrescriptions(result);
  const challengedIds = new Set(prescriptions.map((item) => item.toolId));
  const selected = result.sessionState.selectedTools.map((tool) => ({
    tool,
    score: result.toolScores.get(tool.id)?.scoreFinal ?? 50,
    challenged: challengedIds.has(tool.id),
  }));

  return {
    core: selected.filter((item) => item.score >= 70 && !item.challenged).slice(0, 5),
    review: selected.filter((item) => item.challenged || item.score < 70).slice(0, 5),
  };
}

const CREATIVE_STAGE_DEFS = [
  {
    id: "produce",
    Icon: Palette,
    labelFr: "Produire",
    labelEn: "Produce",
    detailFr: "Outils qui fabriquent les livrables : design, image, vidéo, photo, 3D, espaces ou audio.",
    detailEn: "Tools that create deliverables: design, image, video, photo, 3D, spaces or audio.",
  },
  {
    id: "accelerate",
    Icon: Layers3,
    labelFr: "Accélérer",
    labelEn: "Accelerate",
    detailFr: "Satellites qui font gagner du temps : plugins, presets, templates, assets.",
    detailEn: "Satellites that save time: plugins, presets, templates, assets.",
  },
  {
    id: "review",
    Icon: MessageSquare,
    labelFr: "Valider",
    labelEn: "Review",
    detailFr: "Brief, feedback, livraison, archives et passage de relais.",
    detailEn: "Briefs, feedback, delivery, archives and handoff.",
  },
  {
    id: "publish",
    Icon: Share2,
    labelFr: "Diffuser",
    labelEn: "Publish",
    detailFr: "Planification, hébergement, distribution et mesure des contenus.",
    detailEn: "Scheduling, hosting, distribution and content measurement.",
  },
  {
    id: "secure",
    Icon: ShieldAlert,
    labelFr: "Sécuriser",
    labelEn: "Secure",
    detailFr: "Licences, droits d’usage, plans payés et coûts à préciser.",
    detailEn: "Licenses, usage rights, paid plans and costs to clarify.",
  },
] as const;

function getCreativeWorkflowStages(result: DiagnosticResult, _t: Props["t"]) {
  const classified = classifyCreativeWorkflowTools(
    result.sessionState.selectedTools,
    result.sessionState.toolUsageMap
  );
  return CREATIVE_STAGE_DEFS.map((stage) => {
    return {
      ...stage,
      tools: classified[stage.id].slice(0, 8),
    };
  });
}

function getBudgetRead(
  selectedTools: Tool[],
  contracts: DiagnosticResult["sessionState"]["commercialContracts"],
  t: Props["t"]
) {
  const breakdown = getMonthlyBudgetBreakdown(selectedTools, contracts);
  const hasUnconfirmedAmount = breakdown.hasToVerify;
  const label = hasUnconfirmedAmount
    ? breakdown.confirmedEur > 0
      ? t("Budget déclaré + estimé", "Declared + estimated budget")
      : t("Budget à confirmer", "Budget to confirm")
    : t("Budget déclaré", "Declared budget");

  return {
    breakdown,
    label,
    evidenceLabel: hasUnconfirmedAmount
      ? t("Budget à confirmer", "Budget to confirm")
      : t("Budget capté", "Captured budget"),
    stableDetail: hasUnconfirmedAmount
      ? t(
          "Ce montant mélange des prix catalogue ou modes à vérifier : il sert de repère, pas de dépense déclarée.",
          "This amount mixes catalog prices or modes to check: use it as a guide, not as declared spend."
        )
      : t("Pas de gaspillage évident détecté dans les plans déclarés.", "No obvious waste detected in the declared plans."),
  };
}

function getEvidence(
  result: DiagnosticResult,
  t: Props["t"],
  monthlyCostLabel: string,
  budgetRead: ReturnType<typeof getBudgetRead>
) {
  const risk = result.insights.primaryRisk;
  return [
    {
      id: "budget",
      Icon: CircleDollarSign,
      label: budgetRead.evidenceLabel,
      value: `${monthlyCostLabel}/${t("mois", "mo")}`,
      detail: result.estimatedWaste > 0
        ? t("Des gains semblent possibles, mais les montants doivent rester liés aux vrais plans déclarés.", "Potential gains exist, but amounts must stay tied to the real declared plans.")
        : budgetRead.stableDetail,
    },
    {
      id: "coverage",
      Icon: Layers3,
      label: t("Couverture métier", "Work coverage"),
      value: `${result.insights.functionalCoverage.filter((item) => item.status === "covered").length}/${result.insights.functionalCoverage.length}`,
      detail: t("Zones couvertes par au moins un outil.", "Areas covered by at least one tool."),
    },
    {
      id: "confidence",
      Icon: SearchCheck,
      label: t("Fiabilité", "Reliability"),
      value: `${result.insights.confidence.score}/100`,
      detail: t(result.insights.confidence.summaryFr, result.insights.confidence.summaryEn),
    },
    {
      id: "risk",
      Icon: ShieldAlert,
      label: t("Risque principal", "Primary risk"),
      value: risk ? t(risk.labelFr, risk.labelEn) : t("Aucun signal rouge", "No red flag"),
      detail: risk ? t(risk.detailFr, risk.detailEn) : t("Rien de bloquant dans les réponses captées.", "Nothing blocking in the captured answers."),
    },
];
}

function formatEstimatedSavings(item: PriorityItem, t: Props["t"]) {
  if (item.savings <= 0) return null;
  const currency = item.tool?.priceCurrency || item.tool?.catalogMonthlyPriceCurrency;
  const label = `${formatMoney(Math.round(item.savings), currency)}/${t("mois", "mo")}`;
  if (currency) return label;
  return `${label} · ${t("montant à préciser", "amount to clarify")}`;
}

export default function DashOverview({ result, t, onShare, onNavigate, onTrack }: Props) {
  const isCreative = result.sessionState.persona === "SOFIA";
  const thesis = useMemo(() => buildThesis(result, t), [result, t]);
  const priorityItems = useMemo(() => getPriorityItems(result, t), [result, t]);
  const toolGroups = useMemo(() => getToolGroups(result), [result]);
  const creativeWorkflow = useMemo(() => getCreativeWorkflowStages(result, t), [result, t]);
  const aiAnalysis = result.insights.aiAnalysis;
  const profile = result.insights.profile;
  const maturity = result.insights.maturity;
  const healthLabel = translateHealthLabel(result.healthLabel, t);
  const hasWaste = result.estimatedWaste > 0;
  const selectedTools = result.sessionState.selectedTools;
  const monthlyCostLabel = useMemo(
    () => formatMonthlyTotal(selectedTools, t, result.sessionState.commercialContracts),
    [result.sessionState.commercialContracts, selectedTools, t]
  );
  const budgetRead = useMemo(
    () => getBudgetRead(selectedTools, result.sessionState.commercialContracts, t),
    [result.sessionState.commercialContracts, selectedTools, t]
  );
  const pricingSummary = useMemo(
    () => getPricingCaptureSummary(selectedTools, result.sessionState.commercialContracts),
    [result.sessionState.commercialContracts, selectedTools]
  );
  const pricingToolsToCheck = useMemo(
    () => selectedTools.filter((tool) => getPricingAudit(tool, t).needsVerification).slice(0, 4),
    [selectedTools, t]
  );
  const evidence = useMemo(
    () => getEvidence(result, t, monthlyCostLabel, budgetRead),
    [budgetRead, result, t, monthlyCostLabel]
  );
  const goalLabel = getGoalLabel(result.sessionState.stackGoal, t);
  const coverage = result.sessionState.selectionCoverage;
  const coveredCount = coverage?.covered.length || result.insights.functionalCoverage.filter((item) => item.status === "covered").length;
  const totalCoverage = Math.max(coverage ? coverage.covered.length + coverage.skipped.length : result.insights.functionalCoverage.length, 1);
  const readingSteps = isCreative
    ? [
        t("Chaîne créative", "Creative chain"),
        t("Arbitrages utiles", "Useful tradeoffs"),
        t("Preuves et licences", "Evidence and licenses"),
      ]
    : [
        t("Ce que j’ai compris", "What I understood"),
        t("La première décision", "The first decision"),
        t("Les preuves utiles", "Useful evidence"),
      ];

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <div className="space-y-3">
          <p className="inline-flex w-fit rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            {t("Rapport d’audit", "Audit report")}
          </p>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight text-foreground md:text-5xl">
            {thesis}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            {t(
              "Je te donne d’abord la lecture utile, puis les preuves. L’objectif n’est pas de tout regarder, mais de savoir quoi décider.",
              "I give you the useful read first, then the evidence. The goal is not to inspect everything, but to know what to decide."
            )}
          </p>
        </div>

        <ReadingPath
          steps={readingSteps}
          t={t}
        />

        <div className="grid gap-3 md:grid-cols-[1fr_0.8fr]">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              {t("Ce que j’ai compris", "What I understood")}
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <ReportLine
                label={t("Profil", "Profile")}
                value={t(result.insights.personaContext.labelFr, result.insights.personaContext.labelEn)}
              />
              <ReportLine
                label={t("Priorité", "Priority")}
                value={goalLabel}
              />
              <ReportLine
                label={t("Stack captée", "Captured stack")}
                value={`${selectedTools.length} ${t("outil(s)", "tool(s)")}`}
              />
              <ReportLine
                label={budgetRead.label}
                value={`${monthlyCostLabel}/${t("mois", "mo")}`}
              />
            </div>
            <div className="mt-4 rounded-md bg-muted/35 p-3 text-sm leading-relaxed text-muted-foreground">
              {t(
                `${coveredCount}/${totalCoverage} zones de travail ont été vérifiées. La suite du rapport s’appuie sur cette lecture, pas sur une moyenne générique.`,
                `${coveredCount}/${totalCoverage} work areas were checked. The rest of the report uses that read, not a generic average.`
              )}
            </div>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-primary">
                  {t("Verdict", "Verdict")}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-foreground">{healthLabel}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(profile.summaryFr, profile.summaryEn)}
                </p>
              </div>
              <div className="rounded-lg bg-background/80 px-3 py-2 text-right">
                <p className="font-mono text-3xl font-bold text-foreground">{result.healthScore}</p>
                <p className="text-[11px] font-semibold uppercase text-muted-foreground">/100</p>
              </div>
            </div>
            <div className="mt-4 rounded-md bg-background/65 p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                {t("Première décision", "First decision")}
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {priorityItems[0]?.label || t("Lire le plan d’action", "Read the action plan")}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {priorityItems[0]?.detail || t("Le diagnostic n’a pas trouvé de correction urgente.", "The diagnostic found no urgent fix.")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.("actions")}
              className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              {t("Voir le plan d’action", "View action plan")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {isCreative && (
        <section className="space-y-3">
          <SectionHeader
            eyebrow={t("Lecture créative", "Creative read")}
            title={t("Ta stack comme une chaîne de production", "Your stack as a production chain")}
            description={t(
              "Je sépare les outils de production des maillons qui font vraiment la différence : plugins, assets, diffusion, archives, validation et licences.",
              "I separate the obvious core tools from the peripheral pieces that really matter: plugins, assets, publishing, archives, review and licenses."
            )}
          />
          <div className="grid gap-3 md:grid-cols-2">
            {creativeWorkflow.map((stage) => (
              <CreativeWorkflowCard key={stage.id} stage={stage} t={t} />
            ))}
          </div>
        </section>
      )}

      {(aiAnalysis.actorCount > 0 || aiAnalysis.findings.length > 0) && (
        <AiWorkflowRead analysis={aiAnalysis} t={t} />
      )}

      <section className="grid gap-3 md:grid-cols-3">
        <ContextCard
          label={t("Angle retenu", "Selected angle")}
          value={t(result.insights.personaContext.labelFr, result.insights.personaContext.labelEn)}
          detail={t(result.insights.personaContext.angleFr, result.insights.personaContext.angleEn)}
        />
        <ContextCard
          label={t("Couverture vérifiée", "Checked coverage")}
          value={`${coveredCount}/${totalCoverage}`}
          detail={t(`${coveredCount}/${totalCoverage} zones de travail vérifiées.`, `${coveredCount}/${totalCoverage} work areas checked.`)}
          tools={selectedTools.slice(0, 8)}
        />
        <ContextCard
          label={t("Maturité", "Maturity")}
          value={t(maturity.labelFr, maturity.labelEn)}
          detail={t(maturity.summaryFr, maturity.summaryEn)}
        />
      </section>

      {pricingSummary.needsVerificationCount > 0 && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase text-amber-900">
                {t("Prix à confirmer", "Prices to confirm")}
              </p>
              <h2 className="mt-2 text-xl font-bold text-foreground">
                {t("Je sépare le verdict du budget incertain.", "I separate the verdict from uncertain budget.")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-amber-900/80">
                {t(
                  `${pricingSummary.needsVerificationCount} point(s) de prix ou d'accès restent à préciser. Les décisions restent valables, mais les gains doivent être vérifiés avec les vrais contrats.`,
                  `${pricingSummary.needsVerificationCount} pricing or access point(s) still need clarification. Decisions still stand, but gains should be checked against the real contracts.`
                )}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {pricingToolsToCheck.map((tool) => {
                const audit = getPricingAudit(tool, t);
                return (
                  <div key={tool.id} className="rounded-md border border-amber-200 bg-background/70 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <ToolLogo tool={tool} size={26} className="rounded-md" />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{tool.name}</span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-amber-900">{audit.label}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{audit.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <SectionHeader
          eyebrow={t("Les preuves", "The evidence")}
          title={t("Pourquoi ce verdict ?", "Why this verdict?")}
          description={t(
            "Ces signaux expliquent la lecture, sans te noyer dans les détails.",
            "These signals explain the read without drowning you in details."
          )}
        />
        <div className="grid gap-3 md:grid-cols-2">
          {evidence.map((item) => (
            <div key={item.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
                  <item.Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-base font-bold text-foreground">{item.value}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader
          eyebrow={t("Priorités", "Priorities")}
          title={t("Dans quel ordre agir ?", "What order should you act in?")}
          description={t(
            "La valeur du diagnostic est ici : réduire le choix à quelques décisions concrètes.",
            "The diagnostic value is here: reducing choice to a few concrete decisions."
          )}
        />
        <div className="space-y-2">
          {priorityItems.length > 0 ? (
            priorityItems.map((item, index) => (
              <PriorityRow key={item.id} item={item} index={index} t={t} />
            ))
          ) : (
            <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              {t("Aucune action urgente. On peut surtout documenter et surveiller la stack.", "No urgent action. Mostly document and monitor the stack.")}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader
          eyebrow={t("Carte de stack", "Stack map")}
          title={t("Ce que je garderais au centre", "What I would keep at the center")}
          description={t(
            "On sépare les outils qui semblent porter ton activité de ceux qui méritent une vérification.",
            "We separate tools that seem to carry your work from those that deserve a check."
          )}
        />
        <div className="grid gap-3 lg:grid-cols-2">
          <ToolGroup
            title={t("Socle utile", "Useful core")}
            empty={t("Pas encore de socle évident.", "No obvious core yet.")}
            items={toolGroups.core}
            tone="keep"
          />
          <ToolGroup
            title={t("À clarifier", "To clarify")}
            empty={t("Aucun outil à challenger fortement.", "No tool strongly challenged.")}
            items={toolGroups.review}
            tone="review"
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader
          eyebrow={t("Explorer", "Explore")}
          title={t("Si tu veux creuser", "If you want to go deeper")}
          description={t(
            "Les anciennes vues deviennent des annexes : utiles, mais pas nécessaires pour comprendre l’essentiel.",
            "The former views become appendices: useful, but not required to understand the essentials."
          )}
        />
        <div className="grid gap-2 md:grid-cols-2">
          <ExploreButton
            Icon={Target}
            label={t("Plan d’action", "Action plan")}
            detail={t("Les décisions à prendre dans l’ordre.", "The decisions to make in order.")}
            onClick={() => onNavigate?.("actions")}
          />
          <ExploreButton
            Icon={ClipboardCheck}
            label={t("Analyse des outils", "Tool analysis")}
            detail={t("Ce qu’on garde, vérifie ou remplace.", "What to keep, review or replace.")}
            onClick={() => onNavigate?.("stack")}
          />
          <ExploreButton
            Icon={ShieldAlert}
            label={t("Points à revoir", "Points to review")}
            detail={t("Doublons, abonnements inutiles, risques.", "Duplicates, unused subscriptions, risks.")}
            onClick={() => onNavigate?.("gaspillage")}
          />
          <ExploreButton
            Icon={Sparkles}
            label={t("Alternatives", "Alternatives")}
            detail={t("Options possibles si tu veux optimiser.", "Possible options if you want to optimize.")}
            onClick={() => onNavigate?.("optimiser")}
          />
        </div>
      </section>

      <section className="flex flex-wrap gap-3 border-t border-border pt-5">
        <button
          type="button"
          onClick={onShare}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
        >
          <Share2 className="h-4 w-4" />
          {t("Partager la restitution", "Share restitution")}
        </button>
        <DashPdfExport
          result={result}
          t={t}
          variant="outline"
          onExport={() => onTrack?.("restitution_pdf_export_clicked", { trigger: "overview" })}
        />
        {hasWaste && (
          <button
            type="button"
            onClick={() => onNavigate?.("gaspillage")}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
          >
            {t("Voir les gains récupérables", "View recoverable gains")}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </section>
    </div>
  );
}

function AiWorkflowRead({
  analysis,
  t,
}: {
  analysis: DiagnosticResult["insights"]["aiAnalysis"];
  t: Props["t"];
}) {
  const reviewFindings = analysis.findings.filter(
    (finding) => finding.reviewRecommended
  );

  return (
    <section className="space-y-3">
      <SectionHeader
        eyebrow={t("Lecture IA", "AI read")}
        title={t(
          "Ce que l’IA fait réellement dans ta chaîne",
          "What AI actually does in your workflow"
        )}
        description={t(
          "Je sépare les capacités utilisées, leurs fournisseurs et les points à cadrer. L’objectif n’est pas de compter les logos IA.",
          "I separate used capabilities, their providers, and what needs framing. The goal is not to count AI logos."
        )}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <ContextCard
          label={t("Étapes concernées", "AI-enabled steps")}
          value={String(analysis.objectiveCount)}
          detail={t(
            `${analysis.capabilityCount} capacité(s) précise(s) cartographiée(s).`,
            `${analysis.capabilityCount} precise capability or capabilities mapped.`
          )}
        />
        <ContextCard
          label={t("Acteurs IA", "AI actors")}
          value={String(analysis.actorCount)}
          detail={t(
            `${analysis.actorOccurrenceCount} intervention(s) répartie(s) dans la chaîne.`,
            `${analysis.actorOccurrenceCount} intervention or interventions across the workflow.`
          )}
        />
        <ContextCard
          label={t("À cadrer", "Needs framing")}
          value={String(reviewFindings.length)}
          detail={t(
            "Risques, chevauchements ou étapes fragiles déclarés par l’utilisateur.",
            "Risks, overlaps, or fragile steps declared by the user."
          )}
        />
      </div>

      {analysis.globalActors.length > 0 && (
        <div className="grid gap-3 lg:grid-cols-2">
          {analysis.globalActors.slice(0, 6).map((actor) => (
            <div
              key={actor.actorKey}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {actor.toolName}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                        {t(actor.sourceLabelFr, actor.sourceLabelEn)}
                        {actor.hostToolName && actor.hostToolName !== actor.toolName
                          ? ` · ${t("dans", "in")} ${actor.hostToolName}`
                          : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                      {actor.objectiveCount} {t(
                        actor.objectiveCount > 1 ? "étapes" : "étape",
                        actor.objectiveCount > 1 ? "steps" : "step"
                      )}
                    </span>
                  </div>

                  <p className="mt-2 text-[11px] font-medium text-primary">
                    {t(actor.accessLabelFr, actor.accessLabelEn)}
                    {actor.commercialContractName
                      ? ` · ${actor.commercialContractName}`
                      : ""}
                    {actor.allowanceLabelFr
                      ? ` · ${t(
                          actor.allowanceLabelFr,
                          actor.allowanceLabelEn || actor.allowanceLabelFr
                        )}`
                      : ""}
                    {Number(actor.variableMonthlyCost || 0) > 0
                      ? ` · +${actor.variableMonthlyCost} €/mois`
                      : ""}
                  </p>

                  <div className="mt-3 space-y-2">
                    {actor.roles.map((role) => (
                      <div
                        key={`${actor.actorKey}-${role.objectiveId}`}
                        className="rounded-md border border-border bg-muted/20 px-3 py-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {t(role.objectiveLabelFr, role.objectiveLabelEn)}
                          </p>
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {t(role.sourceLabelFr, role.sourceLabelEn)}
                            {role.frequencyLabelFr
                              ? ` · ${t(
                                  role.frequencyLabelFr,
                                  role.frequencyLabelEn || role.frequencyLabelFr
                                )}`
                              : ""}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {(role.capabilityLabelsFr.length > 0
                            ? role.capabilityLabelsFr
                            : [t("Rôle à préciser", "Role to clarify")]
                          ).map((label, index) => (
                            <span
                              key={`${actor.actorKey}-${role.objectiveId}-${index}`}
                              className="rounded-full bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground"
                            >
                              {role.capabilityLabelsEn[index]
                                ? t(label, role.capabilityLabelsEn[index])
                                : label}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewFindings.length > 0 && (
        <div className="space-y-2">
          {reviewFindings.slice(0, 4).map((finding) => (
            <div
              key={finding.id}
              className={`rounded-lg border p-4 ${
                finding.severity === "high"
                  ? "border-red-200 bg-red-50"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-orange-700" />
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {t(finding.labelFr, finding.labelEn)}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t(finding.detailFr, finding.detailEn)}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">
                    {t(finding.actionFr, finding.actionEn)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase text-primary">{eyebrow}</p>
      <h2 className="text-xl font-bold text-foreground md:text-2xl">{title}</h2>
      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function ReadingPath({
  steps,
  t,
}: {
  steps: string[];
  t: Props["t"];
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          {t("Lecture en 3 minutes", "3-minute read")}
        </p>
        <div className="flex flex-wrap gap-2">
          {steps.map((step, index) => (
            <span key={step} className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background font-mono text-[10px] text-muted-foreground">
                {index + 1}
              </span>
              {step}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-muted/25 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ContextCard({
  label,
  value,
  detail,
  tools,
}: {
  label: string;
  value: string;
  detail: string;
  tools?: Tool[];
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
      {tools && tools.length > 0 && (
        <div className="mt-3 flex -space-x-2">
          {tools.map((tool) => (
            <ToolLogo
              key={tool.id}
              tool={tool}
              size={30}
              className="rounded-md border-2 border-card bg-background"
            />
          ))}
        </div>
      )}
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail}</p>
    </div>
  );
}

function CreativeWorkflowCard({
  stage,
  t,
}: {
  stage: ReturnType<typeof getCreativeWorkflowStages>[number];
  t: Props["t"];
}) {
  const Icon = stage.Icon;
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-foreground">{t(stage.labelFr, stage.labelEn)}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(stage.detailFr, stage.detailEn)}</p>
            </div>
            <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-bold text-foreground">
              {stage.tools.length}
            </span>
          </div>
          {stage.tools.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {stage.tools.map((tool) => (
                <span key={tool.id} className="inline-flex max-w-full items-center gap-2 rounded-md border border-border bg-background px-2 py-1">
                  <ToolLogo tool={tool} size={20} className="rounded" />
                  <span className="truncate text-xs font-semibold text-foreground">{tool.name}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-md bg-muted/35 px-3 py-2 text-xs font-medium text-muted-foreground">
              {t("Aucun outil capté ici. À confirmer si cette étape existe dans ton activité.", "No tool captured here. Confirm whether this step exists in your work.")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PriorityRow({ item, index, t }: { item: PriorityItem; index: number; t: Props["t"] }) {
  const label =
    item.kind === "now"
      ? t("Maintenant", "Now")
      : item.kind === "check"
        ? t("Cette semaine", "This week")
        : t("Ensuite", "Later");
  const savingsLabel = formatEstimatedSavings(item, t);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">{label}</span>
            {savingsLabel && (
              <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                {savingsLabel}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-start gap-3">
            {item.tool && <ToolLogo tool={item.tool} size={34} className="rounded-md" />}
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{item.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
            </div>
          </div>
        </div>
        <CheckCircle2 className="hidden h-5 w-5 shrink-0 text-primary sm:block" />
      </div>
    </div>
  );
}

function ToolGroup({
  title,
  empty,
  items,
  tone,
}: {
  title: string;
  empty: string;
  items: Array<{ tool: Tool; score: number; challenged: boolean }>;
  tone: "keep" | "review";
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {items.length === 0 ? (
        <p className="mt-3 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map(({ tool, score }) => (
            <div key={tool.id} className="flex items-center gap-3 rounded-md bg-muted/30 px-3 py-2">
              <ToolLogo tool={tool} size={32} className="rounded-md" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{tool.name}</span>
              <span className={tone === "keep" ? "text-xs font-semibold text-primary" : "text-xs font-semibold text-orange-600"}>
                {score}/100
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExploreButton({
  Icon,
  label,
  detail,
  onClick,
}: {
  Icon: typeof Target;
  label: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[86px] items-center gap-3 rounded-lg border border-border bg-card p-4 text-left hover:border-primary/40 hover:bg-muted/30"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{detail}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}
