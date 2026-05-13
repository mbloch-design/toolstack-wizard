import type { Tool } from "@/data/types";
import { Check, ShieldCheck, CreditCard, ExternalLink, Sparkles } from "lucide-react";

interface Props {
  tool: Tool;
  displayPrice: number;
  verifiedOn: string;
  sourceDomain: string | undefined;
  prefix: string;
  lang?: string;
  t: (fr: string, en: string) => string;
}

function isNoFree(text: string | undefined): boolean {
  if (!text) return true;
  const lower = text.toLowerCase();
  return (
    lower.includes("no free") ||
    lower.includes("aucun") ||
    lower.includes("pas de") ||
    lower.includes("non communiqué") ||
    lower.includes("essai gratuit") // trial only, not free plan
  );
}

export default function ToolPricingSection({ tool, displayPrice, verifiedOn, sourceDomain, prefix, lang, t }: Props) {
  const pricing = lang === "en" && tool.pricingEn ? tool.pricingEn : tool.pricing;
  const hasFree = pricing?.free && !isNoFree(pricing.free);
  const hasPaid = pricing?.paid && !pricing.paid.toLowerCase().includes("non public");
  const officialUrl = tool.pricing_v5?.official_source_url || (sourceDomain ? `https://${sourceDomain}` : null);

  return (
    <section className="space-y-4">
      {/* Eyebrow */}
      <p
        className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5"
        style={{ color: "hsl(var(--primary))" }}
      >
        <CreditCard className="h-3.5 w-3.5" />
        {t("Tarification", "Pricing")}
      </p>

      {/* Heading */}
      <h2
        className="font-display"
        style={{ fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-0.02em" }}
      >
        {t(`Prix de ${tool.name}`, `${tool.name} pricing`)}
      </h2>

      {/* Plan cards */}
      <div className={`grid gap-3 ${hasFree && hasPaid ? "sm:grid-cols-2" : "grid-cols-1"}`}>

        {/* Free plan card */}
        {hasFree && (
          <div
            className="rounded-xl border p-5 flex flex-col gap-3"
            style={{
              borderColor: "hsl(var(--keep) / 0.3)",
              background: "hsl(var(--keep) / 0.04)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: "hsl(var(--keep) / 0.12)" }}
                >
                  <Sparkles className="h-3.5 w-3.5" style={{ color: "hsl(var(--keep))" }} />
                </div>
                <span className="text-sm font-semibold" style={{ color: "hsl(var(--keep))" }}>
                  {t("Gratuit", "Free")}
                </span>
              </div>
              <span
                className="rounded-full border px-2.5 py-0.5 text-xs font-bold"
                style={{
                  borderColor: "hsl(var(--keep) / 0.25)",
                  color: "hsl(var(--keep))",
                  background: "hsl(var(--keep) / 0.08)",
                }}
              >
                0 €
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
              {pricing?.free}
            </p>
          </div>
        )}

        {/* Paid plan card */}
        {(hasPaid || displayPrice > 0) && (
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: "hsl(var(--primary) / 0.1)" }}
                >
                  <CreditCard className="h-3.5 w-3.5" style={{ color: "hsl(var(--primary))" }} />
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {tool.pricing_v5?.compare_plan_name || t("Plan payant", "Paid plan")}
                </span>
              </div>
              {displayPrice > 0 && (
                <div className="text-right">
                  <span
                    className="font-mono text-base font-black"
                    style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.02em" }}
                  >
                    {displayPrice}€
                  </span>
                  <span className="text-xs" style={{ color: "hsl(var(--muted-foreground) / 0.6)" }}>
                    /{t("mois", "mo")}
                  </span>
                </div>
              )}
            </div>
            {hasPaid && (
              <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                {pricing?.paid}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Cautions */}
      {(tool.pricing_v5?.cautions?.length ?? 0) > 0 && (
        <div
          className="rounded-lg border px-4 py-3 flex items-start gap-2.5 text-sm"
          style={{
            borderColor: "hsl(var(--border))",
            background: "hsl(var(--muted) / 0.4)",
          }}
        >
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--muted-foreground))" }} />
          <p style={{ color: "hsl(var(--muted-foreground))" }}>
            {tool.pricing_v5!.cautions![0]}
          </p>
        </div>
      )}

      {/* Trust footer */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"
        style={{ borderColor: "hsl(var(--border) / 0.6)" }}
      >
        <span
          className="flex items-center gap-1.5 text-xs font-medium"
          style={{ color: "hsl(var(--keep) / 0.8)" }}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          {t("Prix vérifié le", "Price verified on")} {verifiedOn}
          {sourceDomain && (
            <span style={{ color: "hsl(var(--muted-foreground))" }}>· {sourceDomain}</span>
          )}
        </span>

        {officialUrl && (
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/30 hover:text-primary"
            style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'DM Sans', sans-serif" }}
          >
            {t("Voir tous les plans", "See all plans")}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </section>
  );
}
