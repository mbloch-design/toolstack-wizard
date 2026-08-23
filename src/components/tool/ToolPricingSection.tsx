import type { Tool } from "@/data/types";
import { CreditCard, Sparkles, Package } from "lucide-react";
import { hasGenuineFreeTier } from "@/lib/pricing";
import { relExterne } from "@/lib/externalLink";

// Slug de bundle -> nom lisible (ex. "adobe-creative-cloud" -> "Adobe Creative Cloud").
const humanizeSlug = (s: string) =>
  s.split("-").map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(" ");

interface Props {
  tool: Tool;
  displayPrice: number;
  lang?: string;
  t: (fr: string, en: string) => string;
}

export default function ToolPricingSection({ tool, displayPrice, lang, t }: Props) {
  const pricing = lang === "en" && tool.pricingEn ? tool.pricingEn : tool.pricing;
  // Variante de prix dans la langue de la page (résumés/plans localisés) ; repli sûr sur pricing_v5.
  const pv5 = lang === "en" && tool.pricing_v5En ? tool.pricing_v5En : tool.pricing_v5;
  const canonicalPlans = pv5?.plans || [];
  // Texte de carte gratuite qualifié (licence vs coût total) fourni par la projection canonique.
  const freeCard = (pv5 as { free_plan_card?: string } | undefined)?.free_plan_card || null;
  const hasFree = hasGenuineFreeTier(pricing?.free);
  const hasPaid = pricing?.paid && !pricing.paid.toLowerCase().includes("non public");
  const verifiedOn = pv5?.verified_on;
  const officialUrl = pv5?.official_source_url;

  const formatNativeAmount = (amount: number, currency: string | null) => new Intl.NumberFormat(
    lang === "en" ? "en-US" : "fr-FR",
    { style: "currency", currency: currency || "EUR", maximumFractionDigits: 2 },
  ).format(amount);

  const bundleParent = tool.bundle_parent;
  const parentLang = lang === "en" ? "en" : "fr";

  return (
    <section className="td-pricing">
      {bundleParent && canonicalPlans.length === 0 && (
        <a className="td-pricing-bundle-note" href={`/${parentLang}/tool/${bundleParent}`}>
          <Package aria-hidden />
          <span>
            {t(
              `Cet outil est inclus dans ${humanizeSlug(bundleParent)}. Voir les tarifs et les plans sur la fiche de la suite.`,
              `This tool is included in ${humanizeSlug(bundleParent)}. See pricing and plans on the suite's page.`,
            )}
          </span>
        </a>
      )}
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
                  {plan.isFree
                    ? (plan.pricingUnit === "open_source" ? t("Open source", "Open source") : t("Gratuit", "Free"))
                    : plan.displayName}
                </span>
                {(plan.isFree || plan.nativeAmount != null) && (
                  <strong className="td-pricing-price">
                    {plan.isFree ? "0 €" : formatNativeAmount(plan.nativeAmount!, plan.nativeCurrency)}
                    {plan.isFree && plan.pricingUnit === "open_source" && <small>{t(" licence", " license")}</small>}
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
                  ? (freeCard
                      ?? (plan.pricingUnit === "open_source"
                            ? t("Licence open source — infrastructure et exploitation à votre charge",
                                "Open-source license — infrastructure and operations on you")
                            : t("Plan gratuit durable", "Permanent free plan")))
                  : [
                      plan.billingCommitment === "annual_prepaid"
                        ? t("abonnement annuel payé d’avance", "annual subscription paid upfront")
                        : null,
                      plan.taxInclusion === "ttc" ? t("TVA comprise", "tax included") : null,
                      plan.pricingUnit === "site" ? t("par site", "per site") : null,
                    ].filter(Boolean).join(" · ")}
              </p>
              {plan.detailsSourceUrl && (
                <a className="td-pricing-plan-source" href={plan.detailsSourceUrl} target="_blank" rel={relExterne("source")}>
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
                {pv5?.compare_plan_name || t("Plan payant", "Paid plan")}
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
            <a href={officialUrl} target="_blank" rel={relExterne("source")}>
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
