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
  const canonicalPlans = tool.pricing_v5?.plans || [];
  const hasFree = hasGenuineFreeTier(pricing?.free);
  const hasPaid = pricing?.paid && !pricing.paid.toLowerCase().includes("non public");
  const verifiedOn = tool.pricing_v5?.verified_on;
  const officialUrl = tool.pricing_v5?.official_source_url;

  const formatNativeAmount = (amount: number, currency: string | null) => new Intl.NumberFormat(
    lang === "en" ? "en-US" : "fr-FR",
    { style: "currency", currency: currency || "EUR", maximumFractionDigits: 2 },
  ).format(amount);

  return (
    <section className="td-pricing">
      {canonicalPlans.length > 0 ? (
        <div className="td-pricing-plans td-pricing-plans--catalog">
          {canonicalPlans.map((plan) => (
            <article
              className={`td-pricing-plan${plan.isFree ? " td-pricing-plan--free" : ""}`}
              key={plan.planKey}
            >
              <div className="td-pricing-plan-head">
                <span className="td-pricing-plan-name">
                  {plan.isFree ? <Sparkles aria-hidden /> : <CreditCard aria-hidden />}
                  {plan.isFree ? t("Gratuit", "Free") : plan.displayName}
                </span>
                {(plan.isFree || plan.nativeAmount != null) && (
                  <strong className="td-pricing-price">
                    {plan.isFree ? "0 €" : formatNativeAmount(plan.nativeAmount!, plan.nativeCurrency)}
                    {!plan.isFree && plan.billingPeriod === "monthly" && <small>/{t("mois", "mo")}</small>}
                  </strong>
                )}
              </div>
              {plan.summary && <p className="td-pricing-plan-summary">{plan.summary}</p>}
              {plan.featureHighlights && plan.featureHighlights.length > 0 && (
                <ul className="td-pricing-plan-highlights">
                  {plan.featureHighlights.slice(0, 3).map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              )}
              <p className="td-pricing-plan-meta">
                {plan.isFree
                  ? t("Plan gratuit durable", "Permanent free plan")
                  : [
                      plan.billingCommitment === "annual_prepaid"
                        ? t("abonnement annuel payé d’avance", "annual subscription paid upfront")
                        : null,
                      plan.taxInclusion === "ttc" ? t("TVA comprise", "tax included") : null,
                      plan.pricingUnit === "site" ? t("par site", "per site") : null,
                    ].filter(Boolean).join(" · ")}
              </p>
              {plan.detailsSourceUrl && (
                <a className="td-pricing-plan-source" href={plan.detailsSourceUrl} target="_blank" rel="noopener noreferrer">
                  {t("Détail officiel de l’offre", "Official plan details")}
                </a>
              )}
            </article>
          ))}
        </div>
      ) : (
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
      )}

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
