import type { Tool } from "@/data/types";

interface Props {
  tool: Tool;
  lang: string;
  t: (fr: string, en: string) => string;
}

type CostRow = { team: string; plan: string; monthlyUsd: string; annualUsd: string; verdictFr: string; verdictEn: string };

const HEADCOUNTS = [1, 3, 10, 50];

function verdictForMonthly(monthlyEur: number): { fr: string; en: string } {
  if (monthlyEur < 50) return { fr: "Coût limité", en: "Limited cost" };
  if (monthlyEur < 300) return { fr: "Budget à valider", en: "Worth a budget check" };
  return { fr: "Décision budget sérieuse", en: "Serious budget decision" };
}

/**
 * Real cost by team size — same visual convention as ToolComparisonTable
 * (border-collapse table, var(--color-border)/var(--color-surface-soft)).
 *
 * Uses pricing_v5.costTable when a tool has hand-curated rows (Starter vs
 * Advanced tiers, real-world headcounts). When that's absent, auto-
 * generates a simpler table from pricing_v5.compare_price_monthly_eur for
 * any seat-priced tool (compare_plan_kind === "seat") - one tier, four
 * headcounts (1/3/10/50), numeric cost-tier verdicts instead of curated
 * ones. That covers ~250 seat-priced tools with zero per-tool authoring;
 * returns null for everything else (flat-rate, usage-based, or unpriced
 * tools, where multiplying by headcount wouldn't mean anything).
 */
export default function ToolCostBreakdownTable({ tool, lang, t }: Props) {
  const pv5 = (tool as any).pricing_v5;
  const curatedRows = pv5?.costTable as CostRow[] | undefined;

  const rows: CostRow[] | undefined = curatedRows?.length
    ? curatedRows
    : pv5?.compare_plan_kind === "seat" && typeof pv5?.compare_price_monthly_eur === "number" && pv5.compare_price_monthly_eur > 0
    ? HEADCOUNTS.map((n) => {
        const monthly = pv5.compare_price_monthly_eur * n;
        const annual = monthly * 12;
        const v = verdictForMonthly(monthly);
        return {
          team: n === 1 ? t("Solo", "Solo") : t(`${n} personnes`, `${n} people`),
          plan: pv5.compare_plan_name || t("Standard", "Standard"),
          monthlyUsd: `~${Math.round(monthly)} €`,
          annualUsd: `~${Math.round(annual)} €`,
          verdictFr: v.fr,
          verdictEn: v.en,
        };
      })
    : undefined;

  if (!rows?.length) return null;
  const note = curatedRows?.length
    ? (lang === "en" ? pv5?.costTableNoteEn : pv5?.costTableNoteFr)
    : t(
        "Estimation calculée à partir du prix par utilisateur affiché, à vérifier sur la page officielle selon facturation mensuelle/annuelle et promotions éventuelles.",
        "Estimate calculated from the displayed per-user price - check the official page for monthly/annual billing and any current promotions.",
      );
  const deName = /^[aeiouyàâéèêëîïôûü]/i.test(tool.name) ? `d'${tool.name}` : `de ${tool.name}`;

  return (
    <div style={{ marginTop: 32 }}>
      <p style={{ fontFamily: "var(--font-brand)", fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-text)", marginBottom: 16 }}>
        {t(`Le vrai coût ${deName} selon la taille d'équipe`, `${tool.name}'s real cost by team size`)}
      </p>
      <div className="overflow-x-auto" style={{ borderRadius: 12, border: "1px solid var(--color-border)" }}>
        <table className="w-full min-w-[560px] border-collapse" style={{ fontFamily: "var(--font-ui)", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-soft)", fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--color-muted)" }}>
              <th className="py-3 px-4 text-left font-semibold">{t("Équipe", "Team")}</th>
              <th className="py-3 px-4 text-left font-semibold">{t("Plan", "Plan")}</th>
              <th className="py-3 px-4 text-right font-semibold">{t("Coût mensuel", "Monthly cost")}</th>
              <th className="py-3 px-4 text-right font-semibold">{t("Coût annuel", "Annual cost")}</th>
              <th className="py-3 px-4 text-left font-semibold">{t("Verdict", "Verdict")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="last:border-0" style={{ borderBottom: "1px solid var(--color-border-soft)" }}>
                <td className="py-3 px-4" style={{ fontWeight: 500, color: "var(--color-text)" }}>{row.team}</td>
                <td className="py-3 px-4" style={{ color: "var(--color-muted)" }}>{row.plan}</td>
                <td className="py-3 px-4 text-right tabular-nums" style={{ color: "var(--color-text)" }}>{row.monthlyUsd}</td>
                <td className="py-3 px-4 text-right tabular-nums" style={{ fontWeight: 600, color: "var(--color-text-strong)" }}>{row.annualUsd}</td>
                <td className="py-3 px-4" style={{ color: "var(--color-muted)" }}>{lang === "en" ? row.verdictEn : row.verdictFr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && (
        <p style={{ fontFamily: "var(--font-ui)", fontSize: 12, color: "var(--color-muted-light)", marginTop: 10 }}>
          {note}
        </p>
      )}
      {(() => {
        const tcoExample = lang === "en" ? pv5?.tcoExampleEn : pv5?.tcoExampleFr;
        if (!tcoExample) return null;
        return (
          <div style={{ marginTop: 16, padding: "14px 18px", border: "1px solid var(--color-border)", borderRadius: 10, background: "var(--color-surface-soft)" }}>
            <p style={{ fontFamily: "var(--font-mono, ui-monospace)", fontSize: 12, color: "var(--color-muted)", marginBottom: 8 }}>
              {t(
                "Coût total = Coût SaaS + (Temps de configuration × Taux horaire) / 12 + Maintenance mensuelle × Taux horaire",
                "Total cost = SaaS cost + (Setup time × Hourly rate) / 12 + Monthly maintenance × Hourly rate",
              )}
            </p>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: 13, lineHeight: 1.55, color: "var(--color-text)" }}>
              {tcoExample}
            </p>
          </div>
        );
      })()}
    </div>
  );
}
