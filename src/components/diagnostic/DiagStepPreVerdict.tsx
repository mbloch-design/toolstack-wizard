import { useState } from "react";
import { ArrowRight, CheckCircle2, Mail, RotateCcw, ShieldAlert, TrendingDown } from "lucide-react";
import type { DiagnosticResult, SessionState } from "@/types/diagnostic";

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
  const dormantCount = result.insights.metrics.dormantCount;
  const reviewCount = result.insights.metrics.reviewCount;
  const hasEmail = Boolean(session.email?.trim());
  const emailValue = email.trim();
  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const openDashboard = () => {
    if (wantsEmail && !isValidEmail(emailValue)) {
      setEmailError(t("Email invalide", "Invalid email"));
      return;
    }
    onUpdate({
      email: wantsEmail && emailValue ? emailValue : session.email,
      emailPreferences: {
        summary: wantsEmail && Boolean(emailValue),
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
          <p className="inline-flex rounded-md border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase text-primary">
            {t("Diagnostic prêt", "Diagnostic ready")}
          </p>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            {t("On a trouvé les signaux importants.", "We found the important signals.")}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            {t(
              "Voici la lecture rapide avant le dashboard. L’objectif maintenant : te donner un plan clair, pas une liste de chiffres.",
              "Here is the quick read before the dashboard. The goal now is to give you a clear plan, not a list of numbers."
            )}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {t("Score provisoire", "Provisional score")}
          </p>
          <div className="mt-3 flex items-end gap-2">
            <span className="font-mono text-5xl font-bold text-foreground">{result.healthScore}</span>
            <span className="pb-2 text-sm text-muted-foreground">/100</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">{result.healthLabel}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {result.insights.profile.labelFr}
          </p>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard
          Icon={CheckCircle2}
          label={t("Outils analysés", "Tools analyzed")}
          value={String(session.selectedTools.length)}
          detail={t("stack actuelle", "current stack")}
        />
        <MetricCard
          Icon={TrendingDown}
          label={t("Économie annuelle", "Annual saving")}
          value={`${Math.round(result.annualSavings)}€`}
          detail={t("potentiel estimé", "estimated potential")}
        />
        <MetricCard
          Icon={RotateCcw}
          label={t("Doublons", "Duplicates")}
          value={String(duplicateCount)}
          detail={t("à arbitrer", "to decide")}
        />
        <MetricCard
          Icon={ShieldAlert}
          label={t("Risques", "Risks")}
          value={String(result.insights.riskFlags.length)}
          detail={t("dans la stack", "in the stack")}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground">{t("Ce qui mérite attention", "What deserves attention")}</p>
          <div className="mt-4 space-y-3">
            {topActions.length > 0 ? (
              topActions.map((item) => (
                <div key={`${item.toolId}-${item.type}`} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{getToolName(result, item.toolId)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.message}</p>
                    </div>
                    {item.savingsEstimate > 0 && (
                      <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                        {Math.round(item.savingsEstimate)}€/{t("mois", "mo")}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                {t(
                  "Pas de suppression évidente. Le rapport va surtout clarifier ce qu'il faut garder et surveiller.",
                  "No obvious removal. The report will mostly clarify what to keep and watch."
                )}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
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
              value={`${reviewCount + dormantCount} ${t("signal(aux)", "signal(s)")}`}
            />
          </div>
          <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-4">
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
                        "Optionnel. Le dashboard s’ouvre dans tous les cas.",
                        "Optional. The dashboard opens either way."
                      )}
                    </span>
                  </span>
                </label>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t(
                    "Tu pourras revenir au plan d’action et exporter le PDF depuis le dashboard.",
                    "You can come back to the action plan and export the PDF from the dashboard."
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
                  onKeyDown={(event) => event.key === "Enter" && openDashboard()}
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
          className="h-11 rounded-md border border-border px-5 text-sm font-medium text-foreground hover:bg-muted"
        >
          {t("Retour", "Back")}
        </button>
        <button
          type="button"
          onClick={openDashboard}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground"
        >
          {wantsEmail && emailValue ? t("Envoyer le rapport et ouvrir", "Send report and open") : t("Ouvrir mon dashboard", "Open my dashboard")}
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
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 font-mono text-2xl font-bold text-foreground">{value}</p>
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
