import type { Tool } from "@/data/types";
import { Check, ShieldCheck, CreditCard, Coins } from "lucide-react";

interface Props {
  tool: Tool;
  displayPrice: number;
  verifiedOn: string;
  sourceDomain: string | undefined;
  prefix: string;
  lang?: string;
  t: (fr: string, en: string) => string;
}

/**
 * Pricing section with eyebrow label, verified data, source attribution and freshness signals.
 */
export default function ToolPricingSection({ tool, displayPrice, verifiedOn, sourceDomain, prefix, lang, t }: Props) {
  const pricing = lang === "en" && tool.pricingEn ? tool.pricingEn : tool.pricing;

  return (
    <section className="space-y-4">
      {/* Eyebrow */}
      <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: "hsl(var(--primary))" }}>
        <CreditCard className="h-3.5 w-3.5" />
        {t("Tarification", "Pricing")}
      </p>

      {/* Main heading */}
      <h2 className="font-display" style={{ fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
        {t(`Prix de ${tool.name}`, `${tool.name} pricing`)}
      </h2>

      {/* Plans card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 text-sm">
        {pricing?.free && (
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-keep/10 shrink-0">
              <Check className="h-3.5 w-3.5 text-keep" />
            </div>
            <div>
              <p className="font-medium">{t("Offre gratuite", "Free plan")}</p>
              <p className="mt-0.5 text-muted-foreground leading-relaxed">{pricing.free}</p>
            </div>
          </div>
        )}

        {pricing?.paid && (
          <div className={`flex items-start gap-3${pricing?.free ? " pt-3 border-t border-border/50" : ""}`}>
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/8 shrink-0">
              <Coins className="h-3.5 w-3.5 text-primary/70" />
            </div>
            <div>
              <p className="font-medium">{t("Offre payante", "Paid plan")}</p>
              <p className="mt-0.5 text-muted-foreground leading-relaxed">{pricing.paid}</p>
            </div>
          </div>
        )}

        {displayPrice > 0 && (
          <div className="pt-4 border-t border-border/50">
            <p className="text-muted-foreground">
              {t("À partir de", "Starting from")}{" "}
              <strong className="text-foreground text-base font-bold">
                {displayPrice}€<span className="text-sm font-medium">/{t("mois", "mo")}</span>
              </strong>
              {tool.pricing_v5?.compare_plan_name && (
                <span className="text-muted-foreground text-xs ml-1.5">({tool.pricing_v5.compare_plan_name})</span>
              )}
            </p>
          </div>
        )}

        {/* Trust signals */}
        <div className="pt-3 border-t border-border/50 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 text-keep/80 font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t("Prix vérifié le", "Price verified on")} {verifiedOn}
          </span>
          {sourceDomain && (
            <a
              href={tool.pricing_v5?.official_source_url || `https://${sourceDomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {t("Source :", "Source:")} {sourceDomain}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
