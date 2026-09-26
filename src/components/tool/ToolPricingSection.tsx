import type { Tool } from "@/data/types";
import { CreditCard, Sparkles, Package } from "@/lib/icons";
import { hasGenuineFreeTier, isPriceUndisclosed } from "@/lib/pricing";
import { relExterne, safeExternalUrl } from "@/lib/externalLink";
import { localizePlanName } from "@/lib/planNames";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrencyAmount } from "@/lib/currency";
import { resolveDisplayPrice } from "@/lib/nativePricing";

// Slug de bundle -> nom lisible (ex. "adobe-creative-cloud" -> "Adobe Creative Cloud").
const humanizeSlug = (s: string) =>
  s.split("-").map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(" ");

interface Props {
  tool: Tool;
  displayPrice: number;
  lang?: string;
  t: (fr: string, en: string) => string;
}

// Marqueurs francais sans equivalent anglais : leur presence dans un champ
// cense etre traduit signale une copie du texte source.
const FRENCH_MARKERS = new RegExp([
  "\\/mois", "par mois", "par an\\b", "factur", "utilisateur", "gratuit", "mensuel", "annuel",
  "abonnement", "tous les", "environ", "à partir de", "sur devis", "offres?\\b", "voir la fiche",
  "en entrée", "en sortie", "selon le", "selon la", "page officielle", "sièges?\\b", "licence",
  "au-delà", "puis\\b", "jusqu", "chaque", "poste\\b",
].join("|"), "i");

function isUntranslated(en: { free?: string; paid?: string } | null | undefined, fr: { free?: string; paid?: string } | null | undefined): boolean {
  if (!en?.paid || !fr?.paid) return false;
  return en.paid === fr.paid && FRENCH_MARKERS.test(en.paid);
}

export default function ToolPricingSection({ tool, displayPrice, lang, t }: Props) {
  const { currency } = useCurrency();
  // `pricingEn` existe sur 837 outils, mais 169 d'entre eux en sont une copie
  // mot pour mot du francais : le texte n'a jamais ete traduit. On le detecte
  // et on retombe sur la formulation generique anglaise plutot que de servir un
  // paragraphe francais a un lecteur anglophone. Le prix chiffre du plan de
  // comparaison, lui, reste affiche par ailleurs.
  const enFallback = {
    free: tool.pricing?.free
      ? (hasGenuineFreeTier(tool.pricing.free) ? "Free plan available." : "No permanent free plan.")
      : "",
    paid: tool.pricing?.paid ? "Paid plans available. See the official pricing source for details." : "",
  };
  const pricing = lang === "en"
    ? (isUntranslated(tool.pricingEn, tool.pricing) ? enFallback : (tool.pricingEn || enFallback))
    : tool.pricing;
  // Variante de prix dans la langue de la page (résumés/plans localisés) ; repli sûr sur pricing_v5.
  const pv5 = lang === "en" && tool.pricing_v5En ? tool.pricing_v5En : tool.pricing_v5;
  // A tool can publish the same plan in more than one real currency (lemlist:
  // $69 for a US account, 69 EUR for a euro-zone account — two genuine vendor
  // prices, not a conversion). Both carry isComparePlan so price resolution
  // can pick the right one per page language; showing both as separate cards
  // here would just be confusing, so only the one matching the page currency
  // survives — the other stays in data for the summary price elsewhere.
  const allPlans = pv5?.plans || [];
  const compareCandidates = allPlans.filter((p) => p.isComparePlan && !p.isFree);
  const preferredCompare = compareCandidates.find((p) => p.nativeCurrency === currency) || compareCandidates[0];
  const canonicalPlans = allPlans.filter((p) => !p.isComparePlan || p.isFree || p === preferredCompare);
  // Texte de carte gratuite qualifié (licence vs coût total) fourni par la projection canonique.
  const freeCard = (pv5 as { free_plan_card?: string } | undefined)?.free_plan_card || null;
  const hasFree = hasGenuineFreeTier(pricing?.free);
  const hasPaid = pricing?.paid && !pricing.paid.toLowerCase().includes("non public");
  const verifiedOn = pv5?.verified_on;
  const officialUrl = safeExternalUrl(pv5?.official_source_url);
  const isOneTime = pv5?.compare_plan_kind === "one_time";
  const displayPaidPrice = resolveDisplayPrice(tool, displayPrice, currency);

  // Toujours le montant publié par l'éditeur, dans sa devise réelle : jamais
  // de conversion, cf. resolveDisplayPrice/formatToolPrice.
  const formatNativeAmount = (amount: number, nativeCurrency: string | null) => {
    const source = nativeCurrency === "USD" || nativeCurrency === "EUR" || nativeCurrency === "GBP" ? nativeCurrency : "EUR";
    return formatCurrencyAmount(amount, source, lang || "fr");
  };

  // 71 tools store pricing as a single sentence rather than {free, paid};
  // it used to be ignored, leaving the section with only a source link.
  // Typed as {free, paid}, but stored as a plain string on those 71 tools.
  const rawPricing: unknown = lang === "en" ? (tool.pricingEn ?? tool.pricing) : tool.pricing;
  const pricingSentence = typeof rawPricing === "string" ? rawPricing.trim() : "";
  const undisclosed = isPriceUndisclosed(tool);
  const hasPlanCards = canonicalPlans.length > 0 || hasFree || hasPaid || displayPrice > 0;

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
      {!hasPlanCards && !(bundleParent && canonicalPlans.length === 0) && (
        <div className="td-pricing-plans">
          <article className="td-pricing-plan">
            <div className="td-pricing-plan-head">
              <span className="td-pricing-plan-name">
                <CreditCard aria-hidden />
                {undisclosed ? t("Tarif non communiqué", "Price not public") : t("Tarifs", "Pricing")}
              </span>
            </div>
            <p className="td-pricing-copy">
              {pricingSentence || t(
                "L'éditeur ne publie pas de grille tarifaire. Vérifie le prix sur la page officielle avant de t'engager.",
                "The vendor doesn't publish a price list. Check the official page before committing.",
              )}
            </p>
          </article>
        </div>
      )}
      {!hasPlanCards ? null : canonicalPlans.length > 0 ? (
        <div className="td-pricing-plans td-pricing-plans--catalog">
          {canonicalPlans.map((plan) => (
            <article
              className={`td-pricing-plan${plan.isFree ? " td-pricing-plan--free" : ""}${plan.comingSoon ? " td-pricing-plan--soon" : ""}`}
              key={plan.planKey}
            >
              <div className="td-pricing-plan-head">
                <span className="td-pricing-plan-name">
                  {plan.isFree ? <Sparkles aria-hidden /> : <CreditCard aria-hidden />}
                  {plan.isFree
                    ? (plan.pricingUnit === "open_source" ? t("Open source", "Open source") : plan.pricingUnit === "trial" ? t("Essai gratuit", "Free trial") : t("Gratuit", "Free"))
                    : plan.displayName}
                  {plan.comingSoon && <span className="td-pricing-plan-soon-badge">{t("Bientôt", "Coming soon")}</span>}
                </span>
                {(plan.isFree || plan.nativeAmount != null) && (
                  <strong className="td-pricing-price">
                    {plan.isFree && plan.pricingUnit === "trial" ? plan.displayName : plan.isFree ? formatCurrencyAmount(0, currency, lang || "fr") : formatNativeAmount(plan.nativeAmount!, plan.nativeCurrency)}
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
                {plan.comingSoon
                  ? t("Pas encore disponible à l’achat", "Not purchasable yet")
                  : plan.isFree && plan.pricingUnit === "trial"
                  ? t("Essai temporaire, sans forfait gratuit permanent", "Temporary trial, no permanent free plan")
                  : plan.isFree
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
              {plan.detailsSourceUrl && !plan.comingSoon && (
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
              <strong className="td-pricing-price">{formatCurrencyAmount(0, currency, lang || "fr")}</strong>
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
                {isOneTime ? t("Licence à vie", "Lifetime license") : localizePlanName(pv5?.compare_plan_name, lang || "fr") || t("Plan payant", "Paid plan")}
              </span>
              {displayPrice > 0 && (
                <strong className="td-pricing-price">
                  {pv5?.usage_sensitive && <small>{t("à partir de ", "from ")}</small>}
                  {displayPaidPrice.converted ? "≈ " : ""}{formatCurrencyAmount(displayPaidPrice.amount, displayPaidPrice.nativePrice ? displayPaidPrice.currency : currency, lang || "fr")}
                  <small>{isOneTime ? ` · ${t("achat unique", "one-time")}` : `/${t("mois", "mo")}`}</small>
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
