import type { Tool } from "@/data/types";

interface Props {
  tool: Tool;
  alternatives?: Tool[];
  lang: string;
  t: (fr: string, en: string) => string;
}

type ProfileRow = { profile: string; recommendation: string };

/**
 * "Who should pick what" table — which alternative fits which profile,
 * instead of presenting a single alternative as universally best.
 *
 * Uses verdict.profileTable when curated (Asana-style: specific, nuanced
 * rows). When that's absent, auto-generates 3 rows from data every tool
 * already has - soloRelevance/teamRelevance plus the resolved alternatives
 * list - so this renders for any of the ~300 tools with at least one
 * alternative, not just hand-written ones. Returns null when there's
 * neither curated data nor enough to derive a fallback from.
 */
export default function ToolProfileRecommendationTable({ tool, alternatives = [], lang, t }: Props) {
  const verdict = lang === "en" && tool.verdictEn ? tool.verdictEn : tool.verdict;
  const curatedRows = verdict?.profileTable;

  const rows: ProfileRow[] | undefined = curatedRows?.length
    ? curatedRows
    : (() => {
        if (!alternatives.length) return undefined;
        const cheapest = [...alternatives].sort((a, b) => (a.defaultMonthlyPrice || 0) - (b.defaultMonthlyPrice || 0))[0];
        const cheapestFree = alternatives.find((a) => (a.defaultMonthlyPrice || 0) === 0);
        const better = (tool as any).betterAlternative?.tool
          ? alternatives.find((a) => a.id === (tool as any).betterAlternative.tool || (a as any).slug === (tool as any).betterAlternative.tool)
          : undefined;

        const soloPick = tool.soloRelevance === "high" ? tool.name : (cheapestFree || cheapest)?.name;
        const teamPick = tool.teamRelevance === "high" ? tool.name : (better || cheapest)?.name;
        const budgetPick = (better || cheapest)?.name;
        if (!soloPick && !teamPick && !budgetPick) return undefined;

        const out: ProfileRow[] = [];
        if (soloPick) out.push({ profile: t("Solo / freelance", "Solo / freelance"), recommendation: t(`${soloPick} suffit souvent`, `${soloPick} is often enough`) });
        if (teamPick) out.push({ profile: t("Équipe", "Team"), recommendation: t(`${teamPick} peut se justifier`, `${teamPick} can be justified`) });
        if (budgetPick && budgetPick !== soloPick) out.push({ profile: t("Budget serré", "Tight budget"), recommendation: t(`Challenger avec ${budgetPick}`, `Challenge it with ${budgetPick}`) });
        return out;
      })();

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
