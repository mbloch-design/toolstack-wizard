import { useMemo } from "react";
import type { DiagnosticResult, Prescription, Tool } from "@/types/diagnostic";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Layers3,
  SearchCheck,
  Share2,
  ShieldAlert,
  Sparkles,
  Target,
} from "lucide-react";
import DashPdfExport from "./DashPdfExport";
import ToolLogo from "@/components/ToolLogo";

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

function translateHealthLabel(label: DiagnosticResult["healthLabel"], t: Props["t"]) {
  if (label === "Optimisée") return t("Optimisée", "Optimized");
  if (label === "Correcte") return t("Correcte", "Good");
  if (label === "À revoir") return t("À revoir", "Needs review");
  return t("Critique", "Critical");
}

function buildThesis(result: DiagnosticResult, t: Props["t"]) {
  const name = getName(result);
  const introFr = name ? `${name}, ` : "";
  const introEn = name ? `${name}, ` : "";
  const duplicateCount = result.insights.metrics.duplicateCount;
  const dormantCount = result.insights.metrics.dormantCount;
  const risk = result.insights.primaryRisk;

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
  const toolMap = new Map(result.sessionState.selectedTools.map((tool) => [tool.id, tool]));
  const prescriptions = allPrescriptions(result)
    .slice()
    .sort((a, b) => b.savingsEstimate - a.savingsEstimate);

  const items = prescriptions.slice(0, 3).map((item, index) => {
    const tool = toolMap.get(item.toolId);
    const label =
      item.verdict === "cancel"
        ? t(`Décider si ${tool?.name ?? item.toolId} doit rester`, `Decide whether ${tool?.name ?? item.toolId} should stay`)
        : item.verdict === "downgrade"
          ? t(`Vérifier le plan de ${tool?.name ?? item.toolId}`, `Review ${tool?.name ?? item.toolId} plan`)
          : t(`Clarifier l’usage de ${tool?.name ?? item.toolId}`, `Clarify ${tool?.name ?? item.toolId} usage`);

    return {
      id: `${item.toolId}-${item.type}-${index}`,
      label,
      detail: item.message,
      tool,
      savings: item.savingsEstimate,
      kind: index === 0 ? "now" : index === 1 ? "check" : "later",
    } satisfies PriorityItem;
  });

  if (items.length >= 3) return items;

  result.insights.focusAreas.slice(0, 3 - items.length).forEach((focus) => {
    items.push({
      id: focus.id,
      label: t(focus.labelFr, focus.labelEn),
      detail: t(focus.actionFr, focus.actionEn),
      savings: 0,
      kind: items.length === 0 ? "now" : items.length === 1 ? "check" : "later",
    });
  });

  return items;
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

function getEvidence(result: DiagnosticResult, t: Props["t"]) {
  const risk = result.insights.primaryRisk;
  return [
    {
      id: "budget",
      Icon: CircleDollarSign,
      label: t("Budget lisible", "Budget read"),
      value: `${result.stackTotalCost}€/${t("mois", "mo")}`,
      detail: result.estimatedWaste > 0
        ? t(`${Math.round(result.estimatedWaste)}€ récupérables par mois.`, `${Math.round(result.estimatedWaste)}€ recoverable per month.`)
        : t("Pas de gaspillage évident détecté.", "No obvious waste detected."),
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

export default function DashOverview({ result, t, onShare, onNavigate, onTrack }: Props) {
  const thesis = useMemo(() => buildThesis(result, t), [result, t]);
  const priorityItems = useMemo(() => getPriorityItems(result, t), [result, t]);
  const evidence = useMemo(() => getEvidence(result, t), [result, t]);
  const toolGroups = useMemo(() => getToolGroups(result), [result]);
  const profile = result.insights.profile;
  const maturity = result.insights.maturity;
  const healthLabel = translateHealthLabel(result.healthLabel, t);
  const hasWaste = result.estimatedWaste > 0;

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <div className="space-y-3">
          <p className="inline-flex w-fit rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            {t("Restitution ToolTrim", "ToolTrim restitution")}
          </p>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight text-foreground md:text-5xl">
            {thesis}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            {t(
              "Je ne te montre pas tout d’un coup. On commence par la décision à prendre, puis les preuves qui expliquent le verdict.",
              "I am not showing everything at once. We start with the decision to make, then the evidence behind the verdict."
            )}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_0.8fr]">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  {t("Verdict", "Verdict")}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-5xl font-bold text-foreground">{result.healthScore}</span>
                  <div>
                    <p className="text-lg font-bold text-foreground">{healthLabel}</p>
                    <p className="text-sm text-muted-foreground">{t(profile.labelFr, profile.labelEn)}</p>
                  </div>
                </div>
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {t(profile.summaryFr, profile.summaryEn)}
                </p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 text-sm">
                <p className="font-semibold text-foreground">{t("Maturité", "Maturity")}</p>
                <p className="mt-1 text-muted-foreground">{t(maturity.labelFr, maturity.labelEn)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
            <p className="text-xs font-semibold uppercase text-primary">
              {t("Action naturelle", "Natural next step")}
            </p>
            <h2 className="mt-2 text-xl font-bold text-foreground">
              {priorityItems[0]?.label || t("Lire le plan d’action", "Read the action plan")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {priorityItems[0]?.detail || t("Le diagnostic n’a pas trouvé de correction urgente.", "The diagnostic found no urgent fix.")}
            </p>
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

function PriorityRow({ item, index, t }: { item: PriorityItem; index: number; t: Props["t"] }) {
  const label =
    item.kind === "now"
      ? t("Maintenant", "Now")
      : item.kind === "check"
        ? t("Cette semaine", "This week")
        : t("Ensuite", "Later");

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">{label}</span>
            {item.savings > 0 && (
              <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                {Math.round(item.savings)}€/{t("mois", "mo")}
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
