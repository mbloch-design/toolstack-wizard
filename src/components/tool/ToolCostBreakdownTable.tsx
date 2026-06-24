import type { Tool } from "@/data/types";

interface Props {
  tool: Tool;
  lang: string;
  t: (fr: string, en: string) => string;
}

/**
 * Real cost by team size — same visual convention as ToolComparisonTable
 * (border-collapse table, var(--color-border)/var(--color-surface-soft)).
 * Returns null when the tool has no pricing_v5.costTable, so it's silently
 * absent everywhere except the tools it's written for.
 */
export default function ToolCostBreakdownTable({ tool, lang, t }: Props) {
  const rows = (tool as any).pricing_v5?.costTable as
    | { team: string; plan: string; monthlyUsd: string; annualUsd: string; verdictFr: string; verdictEn: string }[]
    | undefined;
  if (!rows?.length) return null;
  const note = lang === "en" ? (tool as any).pricing_v5?.costTableNoteEn : (tool as any).pricing_v5?.costTableNoteFr;

  return (
    <div style={{ marginTop: 32 }}>
      <p style={{ fontFamily: "var(--font-brand)", fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-text)", marginBottom: 16 }}>
        {t(`Le vrai coût de ${tool.name} selon la taille d'équipe`, `${tool.name}'s real cost by team size`)}
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
    </div>
  );
}
