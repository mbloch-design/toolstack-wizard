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
    <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Plan cards (parent section already renders the eyebrow + title) */}
      <div style={{ display: "grid", gridTemplateColumns: hasFree && hasPaid ? "repeat(auto-fit, minmax(240px, 1fr))" : "1fr", gap: 12 }}>

        {/* Free plan card */}
        {hasFree && (
          <div style={{ border: "1px solid var(--color-border-strong)", borderRadius: 12, padding: 20, background: "var(--color-surface-soft)", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 600, color: "var(--color-text-strong)" }}>
                <Sparkles style={{ width: 15, height: 15, color: "var(--color-text-strong)" }} />
                {t("Gratuit", "Free")}
              </span>
              <span style={{ fontFamily: "var(--font-mono, ui-monospace)", fontSize: 13, fontWeight: 700, color: "var(--color-text-strong)" }}>0 €</span>
            </div>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: 14, lineHeight: 1.5, color: "var(--color-muted)" }}>
              {pricing?.free}
            </p>
          </div>
        )}

        {/* Paid plan card */}
        {(hasPaid || displayPrice > 0) && (
          <div style={{ border: "1px solid var(--color-border)", borderRadius: 12, padding: 20, background: "var(--color-surface)", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>
                <CreditCard style={{ width: 15, height: 15, color: "var(--color-muted)" }} />
                {tool.pricing_v5?.compare_plan_name || t("Plan payant", "Paid plan")}
              </span>
              {displayPrice > 0 && (
                <span style={{ fontFamily: "var(--font-mono, ui-monospace)", fontSize: 15, fontWeight: 700, color: "var(--color-text-strong)", letterSpacing: "-0.02em" }}>
                  {displayPrice}€<span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-muted-light)" }}>/{t("mois", "mo")}</span>
                </span>
              )}
            </div>
            {hasPaid && (
              <p style={{ fontFamily: "var(--font-ui)", fontSize: 14, lineHeight: 1.5, color: "var(--color-muted)" }}>
                {pricing?.paid}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Cautions — cautionsEn used on the English page when present; falls
          back to the French caution rather than rendering nothing, since
          most of the catalog has no English version of this field yet. */}
      {(() => {
        const pv5 = tool.pricing_v5 as any;
        const caution = lang === "en" ? (pv5?.cautionsEn?.[0] ?? pv5?.cautions?.[0]) : pv5?.cautions?.[0];
        if (!caution) return null;
        return (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, border: "1px solid var(--color-border)", borderRadius: 8, padding: "12px 16px", background: "var(--color-surface-soft)" }}>
            <Check style={{ marginTop: 2, width: 14, height: 14, flexShrink: 0, color: "var(--color-muted)" }} />
            <p style={{ fontFamily: "var(--font-ui)", fontSize: 14, lineHeight: 1.5, color: "var(--color-muted)" }}>
              {caution}
            </p>
          </div>
        );
      })()}

      {/* Trust footer */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, borderTop: "1px solid var(--color-border-soft)", paddingTop: 16 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-ui)", fontSize: 12, fontWeight: 500, color: "var(--color-muted)" }}>
          <ShieldCheck style={{ width: 14, height: 14 }} />
          {t("Prix vérifié le", "Price verified on")} {verifiedOn}
          {sourceDomain && <span style={{ color: "var(--color-muted-light)" }}>· {sourceDomain}</span>}
        </span>

        {officialUrl && (
          <a href={officialUrl} target="_blank" rel="noopener noreferrer" className="td-chip" style={{ fontSize: 12 }}>
            {t("Voir tous les plans", "See all plans")}
            <ExternalLink />
          </a>
        )}
      </div>
    </section>
  );
}
