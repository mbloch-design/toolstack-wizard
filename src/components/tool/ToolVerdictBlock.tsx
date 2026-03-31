import type { Tool } from "@/data/types";
import { Check, X } from "lucide-react";

interface Props {
  tool: Tool;
  t: (fr: string, en: string) => string;
}

/**
 * Verdict section with citation-friendly sentences.
 * Uses explicit H2 with tool name for semantic retrieval.
 */
export default function ToolVerdictBlock({ tool, t }: Props) {
  const keepItems = (Array.isArray(tool.verdict?.keepIf) ? tool.verdict.keepIf : [tool.verdict?.keepIf]).filter(Boolean);
  const avoidItems = (Array.isArray(tool.verdict?.avoidIf) ? tool.verdict.avoidIf : [tool.verdict?.avoidIf]).filter(Boolean);

  return (
    <section className="rounded-xl border border-primary/20 bg-accent/30 p-6">
      <h2 className="text-lg font-bold tracking-tighter">
        {t(`Notre avis sur ${tool.name}`, `Our verdict on ${tool.name}`)}
      </h2>

      {/* Citation-friendly verdict paragraph */}
      {tool.verdict?.threshold && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t(
            `ToolTrim recommande ${tool.name} dans le cas où : `,
            `ToolTrim recommends ${tool.name} when: `
          )}
          {tool.verdict.threshold}
        </p>
      )}

      {/* Prescription block */}
      {tool.prescription_quality === "ferme" && tool.prescription_output && (
        <div className="mt-3 rounded-lg bg-secondary/40 p-3 text-sm">
          <p className="font-medium text-foreground">
            {t("Notre recommandation :", "Our recommendation:")} {
              tool.prescription_output.action === "replace-cheaper" || tool.prescription_output.action === "replace-better"
                ? t(`remplacer par ${tool.prescription_output.replacement_tool}`, `replace with ${tool.prescription_output.replacement_tool}`)
                : tool.prescription_output.action === "cancel"
                ? t("résilier cet abonnement", "cancel this subscription")
                : tool.prescription_output.mode
            }
          </p>
          {tool.prescription_output.gain_monthly_eur > 0 && (
            <p className="mt-1 text-keep font-medium">
              {t("Économie potentielle", "Potential savings")}: +{tool.prescription_output.gain_monthly_eur}€/{t("mois", "mo")}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-keep">
            {t(`Quand choisir ${tool.name}`, `When to choose ${tool.name}`)}
          </h3>
          <ul className="mt-2 space-y-1.5">
            {keepItems.map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-keep" />
                <span>{t(`${tool.name} est pertinent quand `, `${tool.name} is relevant when `)}{item.charAt(0).toLowerCase() + item.slice(1)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-cancel">
            {t(`Quand éviter ${tool.name}`, `When to avoid ${tool.name}`)}
          </h3>
          <ul className="mt-2 space-y-1.5">
            {avoidItems.map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-cancel" />
                <span>{t(`${tool.name} est moins adapté si `, `${tool.name} is less suited if `)}{item.charAt(0).toLowerCase() + item.slice(1)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
