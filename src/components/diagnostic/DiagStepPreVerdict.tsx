import { useState } from "react";
import { ArrowRight, CheckCircle2, Layers3, Mail, MessageSquare, Palette, RotateCcw, Share2, ShieldAlert, Sparkles, TrendingDown } from "@/lib/icons";
import type { DiagnosticResult, SessionState } from "@/types/diagnostic";
import { formatMonthlyTotal, getPricingCaptureSummary } from "@/utils/diagnosticPricing";
import { classifyCreativeWorkflowTools } from "@/lib/creativeAdaptiveEngine";
import { translateHealthLabel } from "@/utils/diagnosticLabels";

interface Props {
  session: SessionState;
  result: DiagnosticResult;
  onUpdate: (patch: Partial<SessionState>) => void;
  onNext: () => void;
  onPrev: () => void;
  t: (fr: string, en: string) => string;
}

function getToolName(result: DiagnosticResult, toolId: string) {
  return result.sessionState.selectedTools.find((tool) => tool.id === toolId)?.name || toolId;
}

export function isValidReportEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function shouldBlockOptionalReportEmail(wantsEmail: boolean, value: string) {
  const emailValue = value.trim();
  return wantsEmail && Boolean(emailValue) && !isValidReportEmail(emailValue);
}

export default function DiagStepPreVerdict({ session, result, onUpdate, onNext, onPrev, t }: Props) {
  const [email, setEmail] = useState(session.email || "");
  const [emailError, setEmailError] = useState("");
  const [wantsEmail, setWantsEmail] = useState(Boolean(session.email?.trim()));
  const allPrescriptions = [
    ...result.prescriptions.phase1,
    ...result.prescriptions.phase2,
    ...result.prescriptions.phase3,
  ];
  const topActions = allPrescriptions.slice(0, 3);
  const duplicateCount = result.insights.metrics.duplicateCount;
  const reviewCount = result.insights.metrics.reviewCount;
  const monthlyCostLabel = formatMonthlyTotal(session.selectedTools, t, session.commercialContracts);
  const pricingSummary = getPricingCaptureSummary(session.selectedTools, session.commercialContracts);
  const hasEmail = Boolean(session.email?.trim());
  const emailValue = email.trim();
  const isCreative = session.persona === "SOFIA";
  const creativeWorkflow = classifyCreativeWorkflowTools(session.selectedTools, session.toolUsageMap);
  const aiAnalysis = result.insights.aiAnalysis;
  const healthLabel = translateHealthLabel(result.healthLabel, t);
  const profileLabel = session.language === "en"
    ? result.insights.profile.labelEn
    : result.insights.profile.labelFr;
  const attentionItems = [
    ...result.insights.answerSignals
      .filter((signal) =>
        signal.source === "workflow" &&
        signal.impact === "review" &&
        signal.severity !== "low"
      )
      .map((signal) => ({
        id: signal.id,
        title: t(signal.labelFr, signal.labelEn),
        detail: t(signal.detailFr, signal.detailEn),
        badge: signal.severity === "high"
          ? t("à sécuriser", "secure now")
          : t("à cadrer", "needs framing"),
      })),
    ...topActions.map((item) => ({
      id: `${item.toolId}-${item.type}`,
      title: getToolName(result, item.toolId),
      detail: item.message,
      badge: item.savingsEstimate > 0
        ? item.type === "pricing-tier"
          ? t("plan à vérifier", "plan to check")
          : t("impact à vérifier", "impact to check")
        : "",
    })),
  ].filter(
    (item, index, list) =>
      list.findIndex((candidate) => candidate.id === item.id) === index
  ).slice(0, 3);

  const openRestitution = () => {
    const shouldSendEmail = wantsEmail && Boolean(emailValue);
    if (shouldBlockOptionalReportEmail(wantsEmail, emailValue)) {
      setEmailError(t("Email invalide", "Invalid email"));
      return;
    }
    onUpdate({
      email: shouldSendEmail ? emailValue : session.email,
      emailPreferences: {
        summary: shouldSendEmail,
        actions: session.emailPreferences?.actions ?? false,
        checkIn: session.emailPreferences?.checkIn ?? false,
      },
    });
    onNext();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
        <div className="space-y-3">
          <p className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase text-primary">
            {t("Diagnostic prêt", "Diagnostic ready")}
          </p>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            {isCreative
              ? t("Ta chaîne créative est prête à lire.", "Your creative chain is ready to read.")
              : t("On a trouvé les signaux importants.", "We found the important signals.")}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            {isCreative
              ? t(
                  "Je vais lire le flux complet : production, plugins, ressources, diffusion, archives, droits, validation client et plans payés. Le but n’est pas de couper vite, mais de comprendre ce qui soutient réellement tes livrables.",
                  "I will read the full flow: production, plugins, resources, publishing, archives, rights, client review and paid plans. The goal is not to cut fast, but to understand what truly supports your deliverables."
                )
              : t(
                  "Voici la lecture rapide avant la restitution. L'objectif maintenant : te donner un plan clair, pas une liste de chiffres.",
                  "Here is the quick read before the restitution. The goal now is to give you a clear plan, not a list of numbers."
                )}
          </p>
        </div>

        <div className="diagnostic-dark-panel p-5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {t("Score provisoire", "Provisional score")}
          </p>
          <div className="mt-3 flex items-end gap-2">
            <span className="font-mono text-5xl font-bold text-foreground">{result.healthScore}</span>
            <span className="pb-2 text-sm text-muted-foreground">/100</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">{healthLabel}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {profileLabel}
          </p>
        </div>
      </div>

      <section className={`grid gap-3 ${isCreative ? "md:grid-cols-6" : "md:grid-cols-4"}`}>
        {isCreative ? (
          <>
            <MetricCard
              Icon={Palette}
              label={t("Production", "Production")}
              value={String(creativeWorkflow.produce.length)}
              detail={t("outils métier captés", "core creative tools")}
            />
            <MetricCard
              Icon={Layers3}
              label={t("Satellites", "Satellites")}
              value={String(creativeWorkflow.accelerate.length)}
              detail={t("plugins, assets, presets", "plugins, assets, presets")}
            />
            <MetricCard
              Icon={Share2}
              label={t("Diffusion", "Publishing")}
              value={String(creativeWorkflow.publish.length)}
              detail={t("publication et distribution", "publishing and distribution")}
            />
            <MetricCard
              Icon={MessageSquare}
              label={t("Validation", "Review")}
              value={String(creativeWorkflow.review.length)}
              detail={t("client, livraison, preuves", "client, delivery, proof")}
            />
            <MetricCard
              Icon={Sparkles}
              label={t("Capacités IA", "AI capabilities")}
              value={String(aiAnalysis.capabilityCount)}
              detail={t(
                `${aiAnalysis.objectiveCount} étape(s) concernée(s)`,
                `${aiAnalysis.objectiveCount} step(s) involved`
              )}
            />
            <MetricCard
              Icon={ShieldAlert}
              label={t("Accès/prix à préciser", "Access/pricing to clarify")}
              value={String(pricingSummary.needsVerificationCount)}
              detail={t("contrats, prix et licences", "contracts, pricing and licenses")}
            />
          </>
        ) : (
          <>
            <MetricCard
              Icon={CheckCircle2}
              label={t("Outils analysés", "Tools analyzed")}
              value={String(session.selectedTools.length)}
              detail={t("stack actuelle", "current stack")}
            />
            <MetricCard
              Icon={TrendingDown}
              label={t("Budget capté", "Captured budget")}
              value={`${monthlyCostLabel}/${t("mois", "mo")}`}
              detail={t("montants déclarés", "declared amounts")}
            />
            <MetricCard
              Icon={RotateCcw}
              label={t("Doublons", "Duplicates")}
              value={String(duplicateCount)}
              detail={t("à arbitrer", "to decide")}
            />
            <MetricCard
              Icon={ShieldAlert}
              label={t("Prix et plans", "Prices and plans")}
              value={String(pricingSummary.needsVerificationCount)}
              detail={t("à confirmer", "to confirm")}
            />
          </>
        )}
      </section>

      {isCreative && (
        <section className="diagnostic-card p-5">
          <p className="text-sm font-semibold text-foreground">
            {t("Lecture créative retenue", "Creative read")}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <CreativeReadCard
              label={t("1. Produire", "1. Produce")}
              detail={t("Les outils qui fabriquent vraiment tes livrables.", "The tools that actually produce your deliverables.")}
            />
            <CreativeReadCard
              label={t("2. Accélérer", "2. Accelerate")}
              detail={t("Plugins, templates, presets et assets qui évitent le travail répétitif.", "Plugins, templates, presets and assets that remove repetitive work.")}
            />
            <CreativeReadCard
              label={t("3. Diffuser", "3. Publish")}
              detail={t("Publication, hébergement, distribution et mesure des contenus.", "Publishing, hosting, distribution and content measurement.")}
            />
            <CreativeReadCard
              label={t("4. Sécuriser", "4. Secure")}
              detail={t("Validation client, droits d’usage, prix réels et licences.", "Client review, usage rights, real pricing and licenses.")}
            />
          </div>
        </section>
      )}

      <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div className="diagnostic-card p-5">
          <p className="text-sm font-semibold text-foreground">{t("Ce qui mérite attention", "What deserves attention")}</p>
          <div className="mt-4 space-y-3">
            {attentionItems.length > 0 ? (
              attentionItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                    {item.badge && (
                      <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
                {t(
                  "Pas de suppression évidente. Le rapport va surtout clarifier ce qu'il faut garder et surveiller.",
                  "No obvious removal. The report will mostly clarify what to keep and watch."
                )}
              </div>
            )}
          </div>
        </div>

        <div className="diagnostic-card p-5">
          <p className="text-sm font-semibold text-foreground">{t("Lecture ToolTrim", "ToolTrim read")}</p>
          <div className="mt-4 space-y-3 text-sm">
            <VerdictLine
              label={t("Profil", "Profile")}
              value={session.language === "en" ? result.insights.profile.labelEn : result.insights.profile.labelFr}
            />
            <VerdictLine
              label={t("Maturité", "Maturity")}
              value={session.language === "en" ? result.insights.maturity.labelEn : result.insights.maturity.labelFr}
            />
            <VerdictLine
              label={t("À revoir", "To review")}
              value={`${reviewCount} ${t("signal(aux)", "signal(s)")}`}
            />
          </div>
          <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={wantsEmail}
                    onChange={(event) => {
                      setWantsEmail(event.target.checked);
                      setEmailError("");
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-foreground">
                      {t("M’envoyer une copie du rapport", "Send me a copy of the report")}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {t(
                        "Optionnel. La restitution s'ouvre dans tous les cas.",
                        "Optional. The restitution opens either way."
                      )}
                    </span>
                  </span>
                </label>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t(
                    "Tu pourras revenir au plan d'action et exporter le PDF depuis la restitution.",
                    "You can come back to the action plan and export the PDF from the restitution."
                  )}
                </p>
                <input
                  id="diagnostic-report-email-inline"
                  name="report-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (event.target.value.trim()) setWantsEmail(true);
                    setEmailError("");
                  }}
                  onKeyDown={(event) => event.key === "Enter" && openRestitution()}
                  placeholder={hasEmail ? session.email : "sofia@exemple.com"}
                  maxLength={255}
                  className="mt-3 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!wantsEmail}
                />
                {emailError && <p className="mt-2 text-xs text-destructive">{emailError}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="h-11 rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-muted"
        >
          {t("Retour", "Back")}
        </button>
        <button
          type="button"
          onClick={openRestitution}
          className="diagnostic-primary-action inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold"
        >
          {wantsEmail && emailValue ? t("Envoyer le rapport et ouvrir", "Send report and open") : t("Ouvrir ma restitution", "Open my restitution")}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function MetricCard({
  Icon,
  label,
  value,
  detail,
}: {
  Icon: typeof CheckCircle2;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="diagnostic-soft-card p-4">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 break-words font-mono text-xl font-bold text-foreground md:text-2xl">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function VerdictLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right font-semibold text-foreground">{value}</span>
    </div>
  );
}

function CreativeReadCard({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-sm font-bold text-foreground">{label}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail}</p>
    </div>
  );
}
