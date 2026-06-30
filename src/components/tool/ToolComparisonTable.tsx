import { Link } from "react-router-dom";
import type { Tool } from "@/data/types";
import ToolLogo from "@/components/ToolLogo";
import { Check, X, Minus } from "lucide-react";
import { computeToolTrimScore, starFill } from "@/lib/toolTrimScore";

interface Props {
  tool: Tool;
  alternatives: Tool[];
  prefix: string;
  lang: string;
  t: (fr: string, en: string) => string;
}

function hasFreeplan(tool: any): boolean {
  const free = tool.pricing?.free || "";
  const lower = free.toLowerCase();
  return !!free && !lower.includes("no free") && !lower.includes("aucun") && !lower.includes("pas de") && !lower.includes("non communiqué");
}

function prescriptionLabel(action: string | undefined): string {
  switch (action) {
    case "keep": return "Garder";
    case "cancel": return "Résilier";
    case "replace-cheaper":
    case "replace_for_cost":
    case "replace-better":
    case "replace_for_features": return "Remplacer";
    case "downgrade": return "Dégrader";
    default: return "À évaluer";
  }
}

function Stars({ score, size = 3 }: { score: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`h-${size} w-${size}`} viewBox="0 0 12 12" fill={starFill(i, score)}>
          <path d="M6 1l1.3 2.6L10 4l-2 1.9.5 2.7L6 7.4 3.5 8.6 4 5.9 2 4l2.7-.4z" />
        </svg>
      ))}
    </div>
  );
}

export default function ToolComparisonTable({ tool, alternatives, prefix, lang, t }: Props) {
  // Take current tool + top 4 alternatives
  const rows = [tool, ...alternatives.slice(0, 4)];
  if (rows.length < 2) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Table — responsive via horizontal scroll on mobile.
          (Parent section already renders the eyebrow + title.) */}
      <div className="overflow-x-auto" style={{ borderRadius: 12, border: "1px solid var(--color-border)" }}>
        <table className="w-full min-w-[560px] border-collapse" style={{ fontFamily: "var(--font-ui)", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-soft)", fontFamily: "var(--font-ui)", fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--color-muted)" }}>
              <th className="py-3 px-4 text-left font-semibold w-40">{t("Outil", "Tool")}</th>
              <th className="py-3 px-4 text-right font-semibold">{t("Prix/mois", "Price/mo")}</th>
              <th className="py-3 px-4 text-center font-semibold">{t("Gratuit", "Free plan")}</th>
              <th className="py-3 px-4 text-center font-semibold">{t("Score TT", "TT Score")}</th>
              <th className="py-3 px-4 text-center font-semibold">{t("Remplaçable", "Replaceable")}</th>
              <th className="py-3 px-4 text-center font-semibold">{t("Verdict", "Verdict")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isCurrentTool = idx === 0;
              const ts = computeToolTrimScore(row);
              const free = hasFreeplan(row);
              const price = (row as any).pricing_v5?.compare_price_monthly_eur ?? row.defaultMonthlyPrice ?? 0;
              const prescription = (row as any).prescription_output?.action;
              const substitutable = (row as any).substitutable;
              const verdictLabel = prescriptionLabel(prescription);

              return (
                <tr
                  key={row.id}
                  className="last:border-0"
                  style={{ borderBottom: "1px solid var(--color-border-soft)", background: isCurrentTool ? "var(--color-surface-soft)" : "transparent" }}
                >
                  {/* Tool name + one-line description — folds in what used
                      to be a separate card grid below (ToolAlternativesSection),
                      so the same info doesn't appear in two visual formats. */}
                  <td className="py-3 px-4">
                    <div className="flex items-start gap-2.5">
                      <ToolLogo tool={row as any} size={24} className="rounded-md shrink-0" style={{ marginTop: 1 }} />
                      <div className="min-w-0">
                        {isCurrentTool ? (
                          <span style={{ fontWeight: 600, color: "var(--color-text)" }} className="truncate block max-w-[160px]">
                            {row.name}
                            <span style={{ marginLeft: 6, border: "1px solid var(--color-border-strong)", borderRadius: 999, padding: "1px 6px", fontSize: 9, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--color-text-strong)", verticalAlign: "middle" }}>
                              {t("Actuel", "Current")}
                            </span>
                          </span>
                        ) : (
                          <Link
                            to={`${prefix}/tool/${(row as any).slug || row.id}`}
                            className="td-synth-link truncate block max-w-[160px]"
                            style={{ fontWeight: 500 }}
                          >
                            {row.name}
                          </Link>
                        )}
                        {(() => {
                          const desc = lang === "en" && (row as any).shortDescriptionEn ? (row as any).shortDescriptionEn : row.shortDescription;
                          if (!desc) return null;
                          return (
                            <p
                              className="truncate max-w-[200px]"
                              style={{ fontFamily: "var(--font-ui)", fontSize: 11, color: "var(--color-muted-light)", marginTop: 2 }}
                            >
                              {desc}
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="py-3 px-4 text-right tabular-nums">
                    {price === 0 ? (
                      <span style={{ fontWeight: 600, color: "var(--color-text-strong)" }}>{t("Gratuit", "Free")}</span>
                    ) : (
                      <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{Math.round(price)}€</span>
                    )}
                  </td>

                  {/* Free plan */}
                  <td className="py-3 px-4 text-center">
                    {free ? (
                      <Check className="h-4 w-4 mx-auto" style={{ color: "var(--color-text-strong)" }} />
                    ) : (
                      <Minus className="h-4 w-4 mx-auto" style={{ color: "var(--color-border)" }} />
                    )}
                  </td>

                  {/* Score */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col items-center gap-0.5">
                      <Stars score={ts.score} size={3} />
                      <span
                        className="text-[10px] font-mono font-bold tabular-nums"
                        style={{ color: "var(--color-muted)" }}
                      >
                        {ts.score.toFixed(1)}
                      </span>
                    </div>
                  </td>

                  {/* Replaceable */}
                  <td className="py-3 px-4 text-center">
                    {substitutable === false ? (
                      <X className="h-4 w-4 mx-auto" style={{ color: "var(--color-muted-light)" }} />
                    ) : substitutable === true ? (
                      <Check className="h-4 w-4 mx-auto" style={{ color: "var(--color-text-strong)" }} />
                    ) : (
                      <Minus className="h-4 w-4 mx-auto" style={{ color: "var(--color-border)" }} />
                    )}
                  </td>

                  {/* Verdict pill */}
                  <td className="py-3 px-4 text-center">
                    {prescription ? (
                      <span
                        style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, border: "1px solid var(--color-border)", padding: "2px 10px", fontFamily: "var(--font-ui)", fontSize: 12, fontWeight: 600, color: "var(--color-text)", whiteSpace: "nowrap" }}
                      >
                        {t(verdictLabel, verdictLabel)}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--color-muted-light)" }}>n/a</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p style={{ fontFamily: "var(--font-mono, ui-monospace)", fontSize: 11, color: "var(--color-muted-light)" }}>
        {t("Score ToolTrim · Analyse éditoriale indépendante · Pas un score utilisateur", "ToolTrim Score · Independent editorial analysis · Not a user rating")}
      </p>
    </div>
  );
}
