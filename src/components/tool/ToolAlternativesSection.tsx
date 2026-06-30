import type { Tool, Category } from "@/data/types";

interface Props {
  tool: Tool;
  category: Category | undefined;
  alternatives: Tool[];
  prefix: string;
  lang: string;
  t: (fr: string, en: string) => string;
}

/**
 * Free/cheaper tally line only. Used to be a full card grid (description +
 * top pro + price per alternative), but ToolComparisonTable's "Tool name"
 * column now carries the one-line description too, so the same info was
 * showing up in two visual formats back to back. Cut to the one thing the
 * table doesn't already say: how many alternatives are free or cheaper.
 */
export default function ToolAlternativesSection({ tool, alternatives, t }: Props) {
  if (alternatives.length === 0) return null;

  const freeAlts = alternatives.filter(a => a.defaultMonthlyPrice === 0);
  const cheaperAlts = alternatives.filter(a => a.defaultMonthlyPrice > 0 && a.defaultMonthlyPrice < tool.defaultMonthlyPrice);
  if (freeAlts.length === 0 && cheaperAlts.length === 0) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
      {freeAlts.length > 0 && (
        <span style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--color-muted)" }}>
          <strong style={{ color: "hsl(var(--keep))" }}>{freeAlts.length}</strong> {t("alternatives gratuites", "free alternatives")}
        </span>
      )}
      {cheaperAlts.length > 0 && (
        <span style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--color-muted)" }}>
          <strong style={{ color: "hsl(var(--optimize))" }}>{cheaperAlts.length}</strong> {t("alternatives moins chères", "cheaper alternatives")}
        </span>
      )}
    </div>
  );
}
