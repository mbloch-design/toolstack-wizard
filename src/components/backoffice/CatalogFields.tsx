import { Button, Input, Select, Textarea, Field } from "@/components/ui/primitives";
import { isEditableCatalogPath } from "@/lib/backofficeCatalog";
import { useId } from "react";
import { useLang } from "@/hooks/useLang";

const LABELS: Record<string, [string, string]> = {
  name: ["Nom", "Name"],
  nameEn: ["Nom anglais", "English name"],
  category: ["Catégorie", "Category"],
  description: ["Description", "Description"],
  descriptionEn: ["Description anglaise", "English description"],
  shortDescription: ["Description courte", "Short description"],
  shortDescriptionEn: [
    "Description courte anglaise",
    "English short description",
  ],
  longDescription: ["Analyse éditoriale", "Editorial analysis"],
  longDescriptionEn: [
    "Analyse éditoriale anglaise",
    "English editorial analysis",
  ],
  pros: ["Points forts", "Strengths"],
  prosEn: ["Points forts anglais", "English strengths"],
  cons: ["Limites", "Limitations"],
  consEn: ["Limites en anglais", "English limitations"],
  useCases: ["Cas d’usage", "Use cases"],
  useCasesEn: ["Cas d’usage anglais", "English use cases"],
  relevantFor: ["Pour qui", "Audience"],
  relevantForEn: ["Pour qui en anglais", "English audience"],
  verdict: ["Verdict français", "French verdict"],
  verdictEn: ["Verdict anglais", "English verdict"],
  keepIf: ["À garder si", "Keep if"],
  avoidIf: ["À éviter si", "Avoid if"],
  threshold: ["Seuil de décision", "Decision threshold"],
  profitableIf: ["Rentable si", "Worth it if"],
  tooExpensiveIf: ["Trop cher si", "Too expensive if"],
  profileTable: ["Profils et recommandations", "Profiles and recommendations"],
  profile: ["Profil", "Profile"],
  recommendation: ["Recommandation", "Recommendation"],
  billingTraps: ["Points de vigilance", "Billing traps"],
  title: ["Titre", "Title"],
  text: ["Texte", "Text"],
  faqPriceAnswer: ["Réponse FAQ sur le prix", "Pricing FAQ answer"],
  seo: ["Référencement", "SEO"],
  metaDescription: ["Méta-description", "Meta description"],
  pricing: ["Résumé des prix français", "French pricing summary"],
  pricingEn: ["Résumé des prix anglais", "English pricing summary"],
  free: ["Offre gratuite", "Free offer"],
  paid: ["Offre payante", "Paid offer"],
  pricing_v5: ["Tarifs vérifiés français", "French verified pricing"],
  pricing_v5En: ["Tarifs vérifiés anglais", "English verified pricing"],
  defaultMonthlyPrice: [
    "Ancien montant mensuel de référence",
    "Legacy reference monthly amount",
  ],
  plans: ["Offres", "Plans"],
  planKey: ["Identifiant de l’offre", "Plan key"],
  displayName: ["Nom de l’offre", "Plan name"],
  summary: ["Résumé", "Summary"],
  featureHighlights: ["Fonctionnalités incluses", "Included features"],
  detailsSourceUrl: ["Source des détails", "Details source"],
  pricingUnit: ["Unité de facturation", "Pricing unit"],
  isFree: ["Offre gratuite", "Free plan"],
  isComparePlan: ["Offre de référence pour la comparaison", "Comparison plan"],
  nativeAmount: ["Montant natif", "Native amount"],
  nativeCurrency: ["Devise native", "Native currency"],
  billingPeriod: ["Période de facturation", "Billing period"],
  billingCommitment: ["Engagement", "Commitment"],
  taxInclusion: ["Taxes incluses", "Tax inclusion"],
  observedMarket: ["Marché observé", "Observed market"],
  observedLocale: ["Langue observée", "Observed locale"],
  observedOn: ["Date du relevé", "Observed on"],
  lastConfirmedOn: ["Dernière confirmation", "Last confirmed"],
  comingSoon: ["À venir", "Coming soon"],
  compare_price_monthly_eur: [
    "Montant mensuel de comparaison en EUR",
    "Comparison monthly amount in EUR",
  ],
  compare_plan_name: ["Offre de comparaison", "Comparison offer"],
  compare_plan_kind: ["Type d’offre de comparaison", "Comparison offer type"],
  price_reliability: ["Fiabilité du prix", "Price reliability"],
  verification_status: ["État de vérification", "Verification status"],
  verified_on: ["Date de vérification", "Verification date"],
  official_source_url: ["Source officielle", "Official source"],
  source_domain: ["Domaine de la source", "Source domain"],
  location_sensitive: ["Varie selon le pays", "Location dependent"],
  usage_sensitive: ["Varie selon l’usage", "Usage dependent"],
  cautions: ["Réserves tarifaires", "Pricing cautions"],
  websiteUrl: ["Site officiel", "Official website"],
  affiliateLink: ["Lien affilié", "Affiliate link"],
  logo: ["Logo", "Logo"],
  ogImageUrl: ["Image de présentation", "Presentation image"],
  galleryImages: ["Galerie", "Gallery"],
  alternatives: ["Slugs des alternatives", "Alternative slugs"],
};
export function catalogFieldLabel(key: string, lang: string): string {
  const pair = LABELS[key];
  if (pair) return pair[lang === "fr" ? 0 : 1];
  const match =
    /^(presentation|prix|alt|avis|faq)(Title|MetaDescription)(Fr|En)$/.exec(
      key,
    );
  if (match) {
    const section = (
      {
        presentation: "Présentation",
        prix: "Prix",
        alt: "Alternatives",
        avis: "Avis",
        faq: "FAQ",
      } as Record<string, string>
    )[match[1]];
    return `${section} · ${match[2] === "Title" ? "Titre" : "Méta-description"} · ${match[3].toUpperCase()}`;
  }
  return key.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ");
}
const numericKeys = new Set([
  "nativeAmount",
  "compare_price_monthly_eur",
  "defaultMonthlyPrice",
]);
const booleanKeys = new Set([
  "isFree",
  "isComparePlan",
  "comingSoon",
  "location_sensitive",
  "usage_sensitive",
]);
function structuredDefault(field: string): Record<string, unknown> | null {
  if (field === "pricing" || field === "pricingEn")
    return { free: "", paid: "" };
  if (field === "pricing_v5" || field === "pricing_v5En")
    return { official_source_url: "", verified_on: "", plans: [] };
  if (field === "verdict" || field === "verdictEn")
    return { keepIf: [], avoidIf: [], threshold: "" };
  if (field === "seo") return { metaDescription: "" };
  return null;
}
function emptyOf(value: unknown, key: string): unknown {
  if (key === "billingTraps") return { title: "", text: "" };
  if (key === "plans")
    return {
      planKey: "",
      displayName: "",
      summary: "",
      featureHighlights: [],
      detailsSourceUrl: "",
      pricingUnit: null,
      isFree: false,
      isComparePlan: false,
      nativeAmount: null,
      nativeCurrency: null,
      billingPeriod: null,
      taxInclusion: "unknown",
      observedOn: null,
    };
  if (Array.isArray(value)) return [];
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, emptyOf(v, k)]),
    );
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  if (value === null) return null;
  return "";
}
/** Structured inputs preserve original objects and empty/null values; no JSON document editing. */
export function CatalogField({
  field,
  value,
  onChange,
  label,
  depth = 0,
  path,
}: {
  field: string;
  value: unknown;
  onChange: (value: unknown) => void;
  label?: string;
  depth?: number;
  path?: readonly (string | number)[];
}) {
  const { lang, t } = useLang();
  const id = useId();
  const title = label ?? catalogFieldLabel(field, lang);
  const fieldPath = path ?? [field];
  if (!isEditableCatalogPath(fieldPath))
    return (
      <div className="bo-catalog-field">
        <strong>
          {title} · {t("Lecture seule", "Read only")}
        </strong>
        <CatalogValue value={value} />
      </div>
    );
  const initial = structuredDefault(field);
  if (
    initial &&
    (value === null || typeof value !== "object" || Array.isArray(value))
  )
    return (
      <div className="bo-catalog-field">
        <strong>{title}</strong>
        <CatalogValue value={value} />
        <Button variant="quiet"
          type="button"
          onClick={() => onChange(initial)}
        >
          {t("Créer les champs structurés", "Create structured fields")}
        </Button>
      </div>
    );
  if (depth > 9)
    return (
      <p>
        {t(
          "Champ trop imbriqué : conservé sans modification.",
          "Deeply nested field: preserved unchanged.",
        )}
      </p>
    );
  if (Array.isArray(value))
    return (
      <fieldset className="bo-catalog-fieldset">
        <legend>{title}</legend>
        {value.map((item, index) => (
          <div className="bo-catalog-array-row" key={index}>
            <CatalogField
              field={field === "plans" ? "plan" : field}
              value={item}
              depth={depth + 1}
              path={[...fieldPath, index]}
              label={`${title} ${index + 1}`}
              onChange={(next) =>
                onChange(value.map((v, i) => (i === index ? next : v)))
              }
            />
            <Button variant="quiet"
              type="button"
              aria-label={t(
                `Retirer ${title} ${index + 1}`,
                `Remove ${title} ${index + 1}`,
              )}
              onClick={() => onChange(value.filter((_, i) => i !== index))}
            >
              {t("Retirer", "Remove")}
            </Button>
          </div>
        ))}
        <Button variant="quiet"
          type="button"
          onClick={() => onChange([...value, emptyOf(value[0], field)])}
        >
          {t(`Ajouter : ${title}`, `Add: ${title}`)}
        </Button>
      </fieldset>
    );
  if (value && typeof value === "object")
    return (
      <fieldset className="bo-catalog-fieldset">
        <legend>{title}</legend>
        {Object.entries(value).map(([key, child]) => (
          <CatalogField
            key={key}
            field={key}
            value={child}
            depth={depth + 1}
            path={[...fieldPath, key]}
            onChange={(next) => onChange({ ...value, [key]: next })}
          />
        ))}
      </fieldset>
    );
  const bool = typeof value === "boolean" || booleanKeys.has(field);
  const number = typeof value === "number" || numericKeys.has(field);
  return (
    <Field className="bo-catalog-field" label={title}>
      {bool ? (
        <Select
          id={id}
          value={value === null ? "" : String(value)}
          onChange={(event) =>
            onChange(
              event.target.value === "" ? null : event.target.value === "true",
            )
          }
        >
          <option value="">{t("Non renseigné", "Not provided")}</option>
          <option value="true">{t("Oui", "Yes")}</option>
          <option value="false">{t("Non", "No")}</option>
        </Select>
      ) : number ? (
        <Input
          id={id}
          type="number"
          min="0"
          step="any"
          value={value === null ? "" : String(value ?? "")}
          onChange={(event) =>
            onChange(
              event.target.value === "" ? null : Number(event.target.value),
            )
          }
        />
      ) : (
        <Textarea
          id={id}
          rows={
            /longDescription/.test(field)
              ? 9
              : /summary|Description|threshold|text/.test(field)
                ? 3
                : 2
          }
          value={typeof value === "string" ? value : ""}
          placeholder={
            value === null ? t("Non renseigné", "Not provided") : undefined
          }
          onChange={(event) =>
            onChange(
              value === null && event.target.value === ""
                ? null
                : event.target.value,
            )
          }
        />
      )}
    </Field>
  );
}
export function CatalogValue({ value }: { value: unknown }) {
  const { lang, t } = useLang();
  if (value === null || value === undefined || value === "")
    return <span>{t("Non renseigné", "Not provided")}</span>;
  if (Array.isArray(value))
    return value.length ? (
      <ul>
        {value.map((v, i) => (
          <li key={i}>
            <CatalogValue value={v} />
          </li>
        ))}
      </ul>
    ) : (
      <span>{t("Aucun élément", "No entries")}</span>
    );
  if (typeof value === "object")
    return (
      <dl>
        {Object.entries(value).map(([k, v]) => (
          <div key={k}>
            <dt>{catalogFieldLabel(k, lang)}</dt>
            <dd>
              <CatalogValue value={v} />
            </dd>
          </div>
        ))}
      </dl>
    );
  return (
    <span className="bo-catalog-prose">
      {typeof value === "boolean"
        ? value
          ? t("Oui", "Yes")
          : t("Non", "No")
        : String(value)}
    </span>
  );
}
