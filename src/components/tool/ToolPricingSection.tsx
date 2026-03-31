import type { Tool } from "@/data/types";
import { Check, AlertTriangle } from "lucide-react";

interface Props {
  tool: Tool;
  displayPrice: number;
  verifiedOn: string;
  sourceDomain: string | undefined;
  prefix: string;
  t: (fr: string, en: string) => string;
}

/**
 * Pricing section with verified data, source attribution and freshness signals.
 */
export default function ToolPricingSection({ tool, displayPrice, verifiedOn, sourceDomain, prefix, t }: Props) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-bold tracking-tighter">
        {t(`Prix de ${tool.name}`, `${tool.name} Pricing`)}
      </h2>

      <div className="mt-4 space-y-3 text-sm">
        {tool.pricing?.free && (
          <div className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-keep" />
            <div>
              <span className="font-medium">{t("Offre gratuite", "Free plan")}</span>
              <p className="text-muted-foreground">{tool.pricing.free}</p>
            </div>
          </div>
        )}
        {tool.pricing?.paid && (
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-base">💳</span>
            <div>
              <span className="font-medium">{t("Offre payante", "Paid plan")}</span>
              <p className="text-muted-foreground">{tool.pricing.paid}</p>
            </div>
          </div>
        )}

        {displayPrice > 0 && (
          <p className="pt-3 border-t border-border/50">
            {t("À partir de", "Starting from")} <strong className="text-foreground text-base">{displayPrice}€/{t("mois", "mo")}</strong>
            {tool.pricing_v5?.compare_plan_name && (
              <span className="text-muted-foreground"> ({tool.pricing_v5.compare_plan_name})</span>
            )}
          </p>
        )}

        {/* Trust signals */}
        <div className="pt-3 border-t border-border/50 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {t("Prix vérifié le", "Price verified on")} {verifiedOn}
          </span>
          {sourceDomain && (
            <a href={tool.pricing_v5?.official_source_url || `https://${sourceDomain}`}
              target="_blank" rel="noopener noreferrer"
              className="text-primary hover:underline">
              {t("Source :", "Source:")} {sourceDomain}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
