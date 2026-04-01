import type { Tool } from "@/data/types";
import { Check, X, Award, TrendingDown, ArrowRightLeft, Sparkles } from "lucide-react";

interface Props {
  tool: Tool;
  t: (fr: string, en: string) => string;
}

/** Map raw prescription actions to human-readable labels */
function getActionLabel(action: string | undefined, replacement: string | undefined, t: Props["t"]): string | null {
  if (!action) return null;
  switch (action) {
    case "replace-cheaper":
    case "replace_for_cost":
      return replacement
        ? t(`Remplacer par ${replacement} pour réduire les coûts`, `Replace with ${replacement} to reduce costs`)
        : t("Envisager une alternative moins chère", "Consider a cheaper alternative");
    case "replace-better":
    case "replace_for_features":
      return replacement
        ? t(`Migrer vers ${replacement} pour plus de fonctionnalités`, `Migrate to ${replacement} for more features`)
        : t("Envisager une alternative plus complète", "Consider a more complete alternative");
    case "cancel":
      return t("Résilier cet abonnement", "Cancel this subscription");
    case "keep":
      return t("Conserver cet outil", "Keep this tool");
    case "downgrade":
      return t("Passer à un plan inférieur", "Downgrade to a lower plan");
    default:
      return null;
  }
}

function getActionIcon(action: string | undefined) {
  switch (action) {
    case "replace-cheaper":
    case "replace_for_cost":
      return TrendingDown;
    case "replace-better":
    case "replace_for_features":
      return ArrowRightLeft;
    case "keep":
      return Sparkles;
    default:
      return Award;
  }
}

export default function ToolVerdictBlock({ tool, t }: Props) {
  const keepItems = (Array.isArray(tool.verdict?.keepIf) ? tool.verdict.keepIf : [tool.verdict?.keepIf]).filter(Boolean);
  const avoidItems = (Array.isArray(tool.verdict?.avoidIf) ? tool.verdict.avoidIf : [tool.verdict?.avoidIf]).filter(Boolean);

  const prescription = tool.prescription_output;
  const actionLabel = getActionLabel(prescription?.action, prescription?.replacement_tool, t);
  const ActionIcon = getActionIcon(prescription?.action);
  const gain = prescription?.gain_monthly_eur;

  return (
    <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-accent/40 via-card to-accent/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-4">
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
          <Award className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-lg font-bold tracking-tight">
          {t(`Notre avis sur ${tool.name}`, `Our verdict on ${tool.name}`)}
        </h2>
      </div>

      <div className="px-6 pb-6 space-y-5">
        {/* Verdict paragraph */}
        {tool.verdict?.threshold && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(
              `ToolTrim recommande ${tool.name} dans le cas où : `,
              `ToolTrim recommends ${tool.name} when: `
            )}
            {tool.verdict.threshold}
          </p>
        )}

        {/* Prescription card */}
        {tool.prescription_quality === "ferme" && actionLabel && (
          <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 shrink-0 mt-0.5">
              <ActionIcon className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {t("Notre recommandation", "Our recommendation")}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">{actionLabel}</p>
              {gain != null && gain > 0 && (
                <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-keep/10 text-keep px-3 py-1 text-xs font-semibold">
                  <TrendingDown className="h-3 w-3" />
                  {t("Économie potentielle", "Potential savings")}: +{Math.round(gain)}€/{t("mois", "mo")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Keep / Avoid grid */}
        {(keepItems.length > 0 || avoidItems.length > 0) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {keepItems.length > 0 && (
              <div className="rounded-xl border border-keep/15 bg-keep/5 p-4">
                <h3 className="text-sm font-semibold text-keep flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  {t(`Quand choisir ${tool.name}`, `When to choose ${tool.name}`)}
                </h3>
                <ul className="mt-3 space-y-2">
                  {keepItems.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-keep/60" />
                      <span>{t(`${tool.name} est pertinent quand `, `${tool.name} is relevant when `)}{item.charAt(0).toLowerCase() + item.slice(1)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {avoidItems.length > 0 && (
              <div className="rounded-xl border border-cancel/15 bg-cancel/5 p-4">
                <h3 className="text-sm font-semibold text-cancel flex items-center gap-2">
                  <X className="h-4 w-4" />
                  {t(`Quand éviter ${tool.name}`, `When to avoid ${tool.name}`)}
                </h3>
                <ul className="mt-3 space-y-2">
                  {avoidItems.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                      <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cancel/60" />
                      <span>{t(`${tool.name} est moins adapté si `, `${tool.name} is less suited if `)}{item.charAt(0).toLowerCase() + item.slice(1)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
