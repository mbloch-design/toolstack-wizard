import type { Tool } from "@/data/types";
import { ExternalLink, Package } from "@/lib/icons";
import { hasConfirmedFreeTier, hasGenuineFreeTier, isPlaceholderPricingText, isPriceUndisclosed } from "@/lib/pricing";
import { relPourLienOutil, safeExternalUrl } from "@/lib/externalLink";
import { localizePlanName } from "@/lib/planNames";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrencyAmount } from "@/lib/currency";
import { formatToolPrice } from "@/lib/currencyRates";

// Slug de bundle -> nom lisible (ex. "adobe-creative-cloud" -> "Adobe Creative Cloud").
const humanizeSlug = (s: string) =>
  s.split("-").map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(" ");

interface Props {
  tool: Tool;
  displayPrice: number;
  lang?: string;
  t: (fr: string, en: string) => string;
  onOfficialClick?: () => void;
}

/** A plan's content is often one long comma list. Split it into short lines at
 *  ";" and at commas outside parentheses and numbers ("11,50 €" stays whole). */
export function splitPlanFeature(text: string): string[] {
  // Split on top-level separators only: nothing inside parentheses, no decimal commas.
  const splitTop = (input: string, isSeparator: (char: string, i: number) => boolean) => {
    const parts: string[] = [];
    let depth = 0;
    let current = "";
    for (let i = 0; i < input.length; i += 1) {
      const char = input[i];
      if (char === "(") depth += 1;
      if (char === ")") depth = Math.max(0, depth - 1);
      if (depth === 0 && isSeparator(char, i)) { parts.push(current); current = ""; continue; }
      current += char;
    }
    parts.push(current);
    return parts.map((part) => part.trim()).filter(Boolean);
  };
  const words = (part: string) => part.split(/\s+/).filter(Boolean).length;
  const lines = splitTop(text, (char, i) => char === ";" || (char === "." && text[i + 1] === " " && /[A-ZÀ-Ý]/.test(text[i + 2] || "")))
    .flatMap((segment) => {
      const items = splitTop(segment, (char, i) => char === "," && !/\d/.test(segment[i - 1] || "") && segment[i + 1] === " ");
      // A comma list is split only when it is a true enumeration of features:
      // - every item has two words or more (lone names like "Illustrator" belong to "including A, B, C");
      // - the first item does not end on a preposition + one word ("in image, video and sound");
      // - the last item is short (a long tail carries the verb for the whole list).
      const enumeration = items.length > 1
        && items.every((item) => words(item) >= 2)
        && !/\b(en|dont|de|du|des|avec|pour|comme|including|such as|like|in|of|with|for)\s+\S+$/i.test(items[0])
        && words(items[items.length - 1]) <= 6;
      return enumeration ? items : [segment];
    }).map((part) => part.replace(/^(et|and)\s+/i, "").replace(/[.;,]+$/, "").trim())
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase() + part.slice(1));
  return lines.length > 1 ? lines : [text];
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

export default function ToolPricingSection({ tool, displayPrice, lang, t, onOfficialClick }: Props) {
  const { currency } = useCurrency();
  // `pricingEn` existe sur 837 outils, mais 169 d'entre eux en sont une copie
  // mot pour mot du francais : le texte n'a jamais ete traduit. On le detecte
  // et on retombe sur la formulation generique anglaise plutot que de servir un
  // paragraphe francais a un lecteur anglophone. Le prix chiffre du plan de
  // comparaison, lui, reste affiche par ailleurs.
  const enFallback = {
    free: tool.pricing?.free
      ? (hasConfirmedFreeTier(tool) ? "Free plan available." : "")
      : "",
    paid: tool.pricing?.paid && !isPlaceholderPricingText(tool.pricing.paid) ? "Paid plans available. See the official pricing source for details." : "",
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
  // Bulk placeholders (« Gratuit ou open source selon usage », « Options
  // payantes possibles… ») are not facts: no card is drawn from them.
  const hasFree = hasConfirmedFreeTier(tool) && !isPlaceholderPricingText(pricing?.free);
  const hasPaid = pricing?.paid && !pricing.paid.toLowerCase().includes("non public") && !isPlaceholderPricingText(pricing.paid);
  const affiliateUrl = safeExternalUrl(pv5?.affiliate_url) || safeExternalUrl(tool.affiliateLink);
  const isOneTime = pv5?.compare_plan_kind === "one_time";
  // Même calcul que le titre et la description (toolSeo.ts) : le montant
  // publié par l'éditeur dans sa devise, sans conversion. Le bloc convertissait
  // (resolveDisplayPrice) : « $149 » dans les tarifs sous un titre « €149 ».
  const paidPrice = formatToolPrice(tool, displayPrice, lang === "en" ? "USD" : "EUR", lang || "fr");

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
            // Free plan in the vendor's own currency: "0 $US" next to "15 $US".
            ? formatCurrencyAmount(0, (canonicalPlans.find((p) => !p.isFree && p.nativeCurrency)?.nativeCurrency as typeof currency) || currency, lang || "fr")
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
            ? `${pv5?.usage_sensitive ? t("dès ", "from ") : ""}${paidPrice.text}`
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
              {/* Every card keeps the same four rows (head, price, condition, features),
                  even when one is empty, so rows line up across cards. */}
              {column.price ? (
                <p className="td-plan-price">
                  <strong>{column.price}</strong>
                  {column.unit && <span>{column.unit}</span>}
                </p>
              ) : <span className="td-plan-slot" aria-hidden="true" />}
              {column.condition ? <p className="td-plan-condition">{column.condition}</p> : <span className="td-plan-slot" aria-hidden="true" />}
              {column.features.length > 0 ? (
                <ul className="td-plan-features">
                  {column.features.flatMap(splitPlanFeature).map((line) => <li key={line}>{line}</li>)}
                </ul>
              ) : <span className="td-plan-slot" aria-hidden="true" />}
            </article>
          ))}
        </div>
      )}
      {(officialUrl || verifiedOn) && (
        <p className="td-plans-foot">
          {verifiedOn && <span>{t(`Vérifiés le ${formatDay(verifiedOn)}`, `Checked on ${formatDay(verifiedOn)}`)}</span>}
          {officialUrl && (
            <a href={officialUrl} target="_blank" rel={relPourLienOutil(officialUrl, affiliateUrl, tool.websiteUrl)} onClick={onOfficialClick}>
              {t("Tarifs officiels", "Official pricing")}
              <ExternalLink aria-hidden />
            </a>
          )}
        </p>
      )}
    </section>
  );
}
