import { useMemo } from "react";
import type { SessionState, DoubleRule } from "@/types/diagnostic";
import { formatMonthlyTotal } from "@/utils/diagnosticPricing";

interface Props {
  session: SessionState;
  doublonRules: DoubleRule[];
  t: (fr: string, en: string) => string;
}

export default function DiagRightPanel({ session, doublonRules, t }: Props) {
  const selectedIds = useMemo(
    () => new Set(session.selectedTools.map((t) => t.id)),
    [session.selectedTools]
  );

  const totalCostLabel = useMemo(
    () => formatMonthlyTotal(session.selectedTools, t, session.commercialContracts),
    [session.commercialContracts, session.selectedTools, t]
  );

  const activeDoublons = useMemo(
    () => doublonRules.filter((r) => r.ids.every((id) => selectedIds.has(id))),
    [doublonRules, selectedIds]
  );

  const doublonSavings = useMemo(
    () => activeDoublons.reduce((sum, r) => sum + r.savings, 0),
    [activeDoublons]
  );

  if (session.selectedTools.length === 0) return null;

  return (
    <aside className="hidden lg:block w-72 shrink-0">
      <div className="sticky top-20 rounded-xl border border-border bg-card p-5 space-y-5">
        <h3 className="font-bold text-foreground text-sm">
          {t("Ta stack actuelle", "Your current stack")}
        </h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("Outils", "Tools")}</span>
            <span className="font-mono font-semibold text-foreground">{session.selectedTools.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("Coût mensuel", "Monthly cost")}</span>
            <span className="font-mono font-semibold text-foreground">{totalCostLabel}</span>
          </div>
          {doublonSavings > 0 && (
            <div className="flex justify-between text-destructive">
              <span>{t("Gaspillage", "Waste")}</span>
              <span className="font-mono font-semibold">+{doublonSavings}€</span>
            </div>
          )}
        </div>

        {/* Doublons list */}
        {activeDoublons.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs font-semibold text-destructive uppercase tracking-wide">
              {t("Doublons détectés", "Duplicates detected")}
            </p>
            {activeDoublons.map((d, i) => (
              <div
                key={i}
                className={`rounded-lg px-3 py-2 text-xs ${
                  d.savings >= 20
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800"
                }`}
              >
                <p className="font-medium">{d.message}</p>
                <p className="font-mono mt-0.5">{d.savings}€/{t("mois", "mo")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
