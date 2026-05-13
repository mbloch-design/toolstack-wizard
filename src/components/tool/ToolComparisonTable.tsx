import { Link } from "react-router-dom";
import type { Tool } from "@/data/types";
import ToolLogo from "@/components/ToolLogo";
import { Check, X, ArrowRightLeft, Minus } from "lucide-react";
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

function prescriptionColor(action: string | undefined): { bg: string; text: string; label: string } {
  switch (action) {
    case "keep":
      return { bg: "hsl(var(--keep) / 0.1)", text: "hsl(var(--keep))", label: "Garder" };
    case "cancel":
      return { bg: "hsl(var(--cancel) / 0.1)", text: "hsl(var(--cancel))", label: "Résilier" };
    case "replace-cheaper":
    case "replace_for_cost":
    case "replace-better":
    case "replace_for_features":
      return { bg: "hsl(var(--optimize) / 0.1)", text: "hsl(var(--optimize))", label: "Remplacer" };
    case "downgrade":
      return { bg: "hsl(var(--savings) / 0.1)", text: "hsl(var(--savings))", label: "Dégrader" };
    default:
      return { bg: "hsl(var(--border))", text: "hsl(var(--muted-foreground))", label: "À évaluer" };
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
    <div className="space-y-4">
      {/* Eyebrow */}
      <p
        className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5"
        style={{ color: "hsl(var(--primary))" }}
      >
        <ArrowRightLeft className="h-3.5 w-3.5" />
        {t("Tableau comparatif", "Comparison table")}
      </p>

      <h2
        className="font-display"
        style={{ fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-0.02em" }}
      >
        {t(`${tool.name} vs alternatives`, `${tool.name} vs alternatives`)}
      </h2>

      {/* Table — responsive via horizontal scroll on mobile */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[560px] text-sm border-collapse">
          <thead>
            <tr className="border-b border-border" style={{ background: "hsl(var(--muted) / 0.5)" }}>
              <th className="py-3 px-4 text-left font-semibold text-foreground w-40">
                {t("Outil", "Tool")}
              </th>
              <th className="py-3 px-4 text-right font-semibold text-foreground">
                {t("Prix/mois", "Price/mo")}
              </th>
              <th className="py-3 px-4 text-center font-semibold text-foreground">
                {t("Gratuit", "Free plan")}
              </th>
              <th className="py-3 px-4 text-center font-semibold text-foreground">
                {t("Score TT", "TT Score")}
              </th>
              <th className="py-3 px-4 text-center font-semibold text-foreground">
                {t("Remplaçable", "Replaceable")}
              </th>
              <th className="py-3 px-4 text-center font-semibold text-foreground">
                {t("Verdict", "Verdict")}
              </th>
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
              const pc = prescriptionColor(prescription);

              return (
                <tr
                  key={row.id}
                  className={`border-b border-border last:border-0 transition-colors ${isCurrentTool ? "" : "hover:bg-muted/30"}`}
                  style={isCurrentTool ? { background: "hsl(var(--primary) / 0.04)" } : {}}
                >
                  {/* Tool name */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <ToolLogo tool={row as any} size={24} className="rounded-md shrink-0" />
                      {isCurrentTool ? (
                        <span className="font-semibold text-foreground truncate max-w-[100px]">
                          {row.name}
                          <span
                            className="ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold align-middle"
                            style={{
                              background: "hsl(var(--primary) / 0.12)",
                              color: "hsl(var(--primary))",
                            }}
                          >
                            {t("Actuel", "Current")}
                          </span>
                        </span>
                      ) : (
                        <Link
                          to={`${prefix}/tool/${(row as any).slug || row.id}`}
                          className="font-medium text-foreground hover:text-primary transition-colors truncate max-w-[100px]"
                        >
                          {row.name}
                        </Link>
                      )}
                    </div>
                  </td>

                  {/* Price */}
                  <td className="py-3 px-4 text-right tabular-nums">
                    {price === 0 ? (
                      <span className="font-semibold" style={{ color: "hsl(var(--keep))" }}>
                        {t("Gratuit", "Free")}
                      </span>
                    ) : (
                      <span className="font-semibold text-foreground">
                        {Math.round(price)}€
                      </span>
                    )}
                  </td>

                  {/* Free plan */}
                  <td className="py-3 px-4 text-center">
                    {free ? (
                      <Check className="h-4 w-4 mx-auto" style={{ color: "hsl(var(--keep))" }} />
                    ) : (
                      <Minus className="h-4 w-4 mx-auto" style={{ color: "hsl(var(--border))" }} />
                    )}
                  </td>

                  {/* Score */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col items-center gap-0.5">
                      <Stars score={ts.score} size={3} />
                      <span
                        className="text-[10px] font-mono font-bold tabular-nums"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        {ts.score.toFixed(1)}
                      </span>
                    </div>
                  </td>

                  {/* Replaceable */}
                  <td className="py-3 px-4 text-center">
                    {substitutable === false ? (
                      <X className="h-4 w-4 mx-auto" style={{ color: "hsl(var(--cancel) / 0.6)" }} />
                    ) : substitutable === true ? (
                      <Check className="h-4 w-4 mx-auto" style={{ color: "hsl(var(--keep))" }} />
                    ) : (
                      <Minus className="h-4 w-4 mx-auto" style={{ color: "hsl(var(--border))" }} />
                    )}
                  </td>

                  {/* Verdict pill */}
                  <td className="py-3 px-4 text-center">
                    {prescription ? (
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{ background: pc.bg, color: pc.text }}
                      >
                        {t(pc.label, pc.label)}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground) / 0.6)", fontFamily: "'DM Mono', monospace" }}>
        {t("Score ToolTrim · Analyse éditoriale indépendante · Pas un score utilisateur", "ToolTrim Score · Independent editorial analysis · Not a user rating")}
      </p>
    </div>
  );
}
