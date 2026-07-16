import type { Tool } from "@/data/types";
import { CreditCard, Sparkles } from "lucide-react";
import { hasGenuineFreeTier } from "@/lib/pricing";

interface Props {
  tool: Tool;
  displayPrice: number;
  lang?: string;
  t: (fr: string, en: string) => string;
}

export default function ToolPricingSection({ tool, displayPrice, lang, t }: Props) {
  const pricing = lang === "en" && tool.pricingEn ? tool.pricingEn : tool.pricing;
  const hasFree = hasGenuineFreeTier(pricing?.free);
  const hasPaid = pricing?.paid && !pricing.paid.toLowerCase().includes("non public");
  const verifiedOn = tool.pricing_v5?.verified_on;
  const officialUrl = tool.pricing_v5?.official_source_url;

  return (
    <section className="td-pricing">
      <div className={`td-pricing-plans${hasFree && hasPaid ? " td-pricing-plans--split" : ""}`}>

        {/* Free plan card */}
        {hasFree && (
          <article className="td-pricing-plan td-pricing-plan--free">
            <div className="td-pricing-plan-head">
              <span className="td-pricing-plan-name">
                <Sparkles aria-hidden />
                {t("Gratuit", "Free")}
              </span>
              <strong className="td-pricing-price">0 €</strong>
            </div>
            <p className="td-pricing-copy">{pricing?.free}</p>
          </article>
        )}

        {/* Paid plan card */}
        {(hasPaid || displayPrice > 0) && (
          <article className="td-pricing-plan">
            <div className="td-pricing-plan-head">
              <span className="td-pricing-plan-name">
                <CreditCard aria-hidden />
                {tool.pricing_v5?.compare_plan_name || t("Plan payant", "Paid plan")}
              </span>
              {displayPrice > 0 && (
                <strong className="td-pricing-price">
                  {displayPrice}€<small>/{t("mois", "mo")}</small>
                </strong>
              )}
            </div>
            {hasPaid && <p className="td-pricing-copy">{pricing?.paid}</p>}
          </article>
        )}
      </div>

      {(verifiedOn || officialUrl) && (
        <p className="td-pricing-evidence">
          {officialUrl ? (
            <a href={officialUrl} target="_blank" rel="noopener noreferrer">
              {t("Source tarifaire officielle", "Official pricing source")}
            </a>
          ) : t("Tarif vérifié par ToolTrim", "Pricing verified by ToolTrim")}
          {verifiedOn && (
            <>
              <span aria-hidden>·</span>
              {t("vérifié le", "verified on")} <time dateTime={verifiedOn}>{verifiedOn}</time>
            </>
          )}
        </p>
      )}

    </section>
  );
}
