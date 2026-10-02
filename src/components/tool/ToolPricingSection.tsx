import type { Tool } from "@/data/types";
import { ExternalLink, Package } from "@/lib/icons";
import { hasGenuineFreeTier, isPriceUndisclosed } from "@/lib/pricing";
import { relPourLienOutil, safeExternalUrl } from "@/lib/externalLink";
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
  const affiliateUrl = safeExternalUrl(tool.affiliateLink);
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

  // Un seul lien officiel pour toute la section (il était répété sous chaque
  // plan) et la date de vérification à côté.
  const officialUrl = affiliateUrl || safeExternalUrl(pv5?.official_source_url) || null;
  const verifiedOn = pv5?.verified_on || null;
  const formatDay = (iso: string) =>
    new Intl.DateTimeFormat(lang === "en" ? "en-US" : "fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${iso}T00:00:00`));
  const freeLabel = (unit?: string | null) =>
    unit === "open_source" ? t("Open source", "Open source") : unit === "trial" ? t("Essai gratuit", "Free trial") : t("Gratuit", "Free");

  // Plans côte à côte, en colonnes égales : nom, prix et sa condition, puis ce
  // que le plan apporte. Le plan qui fixe le « Dès … » de la fiche est repéré.
  // La grille se règle sur la largeur réelle de la section (requêtes de
  // conteneur, cf. index.css) : colonnes d'au moins 220 px, lignes
  // équilibrées ; défilement horizontal sur mobile seulement.
  type Column = {
    key: string; name: string; price: string | null; unit: string | null;
    condition: string | null; features: string[]; reference: boolean; free: boolean; soon: boolean;
  };
  const columns: Column[] = canonicalPlans.length > 0
    ? canonicalPlans.map((plan) => ({
        key: plan.planKey,
        name: plan.isFree ? freeLabel(plan.pricingUnit) : plan.displayName,
        price: plan.isFree && plan.pricingUnit === "trial"
          ? plan.displayName
          : plan.isFree
            ? formatCurrencyAmount(0, currency, lang || "fr")
            : plan.nativeAmount != null ? formatNativeAmount(plan.nativeAmount, plan.nativeCurrency) : null,
        unit: plan.isFree
          ? (plan.pricingUnit === "open_source" ? t("licence", "license") : null)
          : plan.billingPeriod === "monthly" ? t("/mois", "/mo") : plan.billingPeriod === "annual" ? t("/an", "/yr") : null,
        condition: plan.comingSoon
          ? t("Pas encore disponible à l’achat", "Not purchasable yet")
          : plan.isFree && plan.pricingUnit === "trial"
            ? t("Essai temporaire, sans forfait gratuit permanent", "Temporary trial, no permanent free plan")
            : plan.isFree
              ? (freeCard ?? (plan.pricingUnit === "open_source"
                  ? t("Infrastructure et exploitation à votre charge", "Infrastructure and operations on you")
                  : t("Plan gratuit durable", "Permanent free plan")))
              : [
                  plan.billingCommitment === "annual_prepaid" ? t("Facturé à l’année", "Billed annually") : null,
                  plan.summary,
                  plan.taxInclusion === "ttc" ? t("TVA comprise", "Tax included") : null,
                  plan.pricingUnit === "site" ? t("Par site", "Per site") : null,
                ].filter(Boolean).join(" · ") || null,
        features: (plan.featureHighlights || []).slice(0, 3),
        reference: !plan.isFree && plan === preferredCompare && canonicalPlans.filter((p) => !p.isFree).length > 1,
        free: !!plan.isFree,
        soon: !!plan.comingSoon,
      }))
    : [
        ...(hasFree ? [{
          key: "free", name: t("Gratuit", "Free"), price: formatCurrencyAmount(0, currency, lang || "fr"), unit: null,
          condition: pricing?.free || null, features: [], reference: false, free: true, soon: false,
        }] : []),
        ...((hasPaid || displayPrice > 0) ? [{
          key: "paid",
          name: isOneTime ? t("Licence à vie", "Lifetime license") : localizePlanName(pv5?.compare_plan_name, lang || "fr") || t("Plan payant", "Paid plan"),
          price: displayPrice > 0
            ? `${pv5?.usage_sensitive ? t("dès ", "from ") : ""}${displayPaidPrice.converted ? "≈ " : ""}${formatCurrencyAmount(displayPaidPrice.amount, displayPaidPrice.nativePrice ? displayPaidPrice.currency : currency, lang || "fr")}`
            : null,
          unit: displayPrice > 0 ? (isOneTime ? t("achat unique", "one-time") : t("/mois", "/mo")) : null,
          condition: hasPaid ? pricing?.paid || null : null, features: [], reference: false, free: false, soon: false,
        }] : []),
      ];

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
        <p className="td-plans-empty">
          <strong>{undisclosed ? t("Tarif non communiqué", "Price not public") : t("Tarifs", "Pricing")}</strong>
          {pricingSentence || t(
            "L'éditeur ne publie pas de grille tarifaire. Vérifie le prix sur la page officielle avant de t'engager.",
            "The vendor doesn't publish a price list. Check the official page before committing.",
          )}
        </p>
      )}
      {hasPlanCards && columns.length > 0 && (
        <div className="td-plans" data-plans={Math.min(columns.length, 8)} role="list">
          {columns.map((column) => (
            <article
              key={column.key}
              role="listitem"
              className={`td-plan${column.reference ? " td-plan--reference" : ""}${column.soon ? " td-plan--soon" : ""}`}
            >
              <header className="td-plan-head">
                <h3 className="td-plan-name">{column.name}</h3>
                {column.reference && <span className="td-plan-badge">{t("Prix retenu par ToolTrim", "ToolTrim reference price")}</span>}
                {column.soon && <span className="td-plan-badge">{t("Bientôt", "Coming soon")}</span>}
              </header>
              {column.price && (
                <p className="td-plan-price">
                  <strong>{column.price}</strong>
                  {column.unit && <span>{column.unit}</span>}
                </p>
              )}
              {column.condition && <p className="td-plan-condition">{column.condition}</p>}
              {column.features.length > 0 && (
                <ul className="td-plan-features">
                  {column.features.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
      {(officialUrl || verifiedOn) && (
        <p className="td-plans-foot">
          {officialUrl && (
            <a href={officialUrl} target="_blank" rel={relPourLienOutil(officialUrl, tool.affiliateLink, tool.websiteUrl)}>
              {t("Tarifs officiels", "Official pricing")}
              <ExternalLink aria-hidden />
            </a>
          )}
          {verifiedOn && <span>{t(`Vérifiés le ${formatDay(verifiedOn)}`, `Checked on ${formatDay(verifiedOn)}`)}</span>}
        </p>
      )}
    </section>
  );
}
