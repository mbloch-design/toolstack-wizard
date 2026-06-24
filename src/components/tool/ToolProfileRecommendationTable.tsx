import type { Tool } from "@/data/types";

interface Props {
  tool: Tool;
  lang: string;
  t: (fr: string, en: string) => string;
}

/**
 * "Who should pick what" table — which alternative fits which profile,
 * instead of presenting a single alternative as universally best. Returns
 * null when the tool has no verdict.profileTable, silently absent on every
 * tool besides the ones it's written for.
 */
export default function ToolProfileRecommendationTable({ tool, lang, t }: Props) {
  const verdict = lang === "en" && tool.verdictEn ? tool.verdictEn : tool.verdict;
  const rows = verdict?.profileTable;
  if (!rows?.length) return null;

  return (
    <div style={{ marginTop: 32 }}>
      <p style={{ fontFamily: "var(--font-brand)", fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-text)", marginBottom: 16 }}>
        {t("Quel profil doit choisir quoi", "Which profile should pick what")}
      </p>
      <div className="overflow-x-auto" style={{ borderRadius: 12, border: "1px solid var(--color-border)" }}>
        <table className="w-full min-w-[480px] border-collapse" style={{ fontFamily: "var(--font-ui)", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-soft)", fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--color-muted)" }}>
              <th className="py-3 px-4 text-left font-semibold">{t("Profil", "Profile")}</th>
              <th className="py-3 px-4 text-left font-semibold">{t("Recommandation", "Recommendation")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="last:border-0" style={{ borderBottom: "1px solid var(--color-border-soft)" }}>
                <td className="py-3 px-4" style={{ fontWeight: 500, color: "var(--color-text)" }}>{row.profile}</td>
                <td className="py-3 px-4" style={{ color: "var(--color-muted)" }}>{row.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
