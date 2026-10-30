import type {
  CatalogTool,
  CatalogValidationIssue,
} from "@/lib/backofficeCatalog";
import type { CatalogCapabilities } from "@/lib/catalogPolicy";
import { isCatalogPathAllowed } from "@/lib/catalogPolicy";
import { catalogFieldAt, type CatalogField } from "@/lib/catalogFieldRegistry";
import {
  PRICE_FACT_FIELDS,
  updateCatalogPriceObservation,
} from "@/lib/catalogPriceObservations";
import type { Category, Tool, Lang } from "@/data/types";

export type CatalogPath = readonly (string | number)[];
export type CatalogChange = {
  path: CatalogPath;
  value: unknown;
  remove?: boolean;
};
export type CatalogEditingValue = {
  lang?: Lang;
  value: CatalogTool;
  /** Immutable saved-source snapshots. Never inferred from the mapped public Tool. */
  base: CatalogTool;
  published: CatalogTool;
  capabilities: CatalogCapabilities;
  issues: CatalogValidationIssue[];
  onChange: (path: CatalogPath, value: unknown) => void;
  onRemove: (path: CatalogPath) => void;
  /** Use one atomic session update for linked prices and reference replacement. */
  onChanges?: (changes: CatalogChange[]) => void;
  categories: Pick<Category, "id" | "name" | "slug" | "nameEn">[];
  tools: Pick<
    Tool,
    | "id"
    | "slug"
    | "name"
    | "covers"
    | "functional_needs"
    | "personas"
    | "verticals"
  >[];
};

const labels: Record<string, string> = {
  name: "Nom",
  category: "Catégorie",
  shortDescription: "Description courte · français",
  shortDescriptionEn: "Description courte · anglais",
  description: "Présentation complémentaire · français",
  descriptionEn: "Présentation complémentaire · anglais",
  longDescription: "Analyse détaillée · français",
  longDescriptionEn: "Analyse détaillée · anglais",
  tagline: "Signature",
  fr: "Français",
  en: "Anglais",
  tool_type: "Type d’outil",
  soloRelevance: "Pertinence en solo",
  teamRelevance: "Pertinence en équipe",
  substitution_cluster_v2: "Groupe de substitution",
  bundle_parent: "Suite parente",
  host_app: "Application hôte",
  freeAlternative: "Alternative gratuite",
  pros: "Points forts · français",
  prosEn: "Points forts · anglais",
  cons: "Limites · français",
  consEn: "Limites · anglais",
  useCases: "Usages concrets · français",
  useCasesEn: "Usages concrets · anglais",
  relevantFor: "Publics · français",
  relevantForEn: "Publics · anglais",
  functional_needs: "Besoins fonctionnels",
  personas: "Profils",
  covers: "Fonctionnalités couvertes",
  verticals: "Métiers",
  integrates_with: "Intégrations",
  complements: "Outils complémentaires",
  substitutable: "Peut être remplacé",
  force_silence: "Suspendre les recommandations",
  pivot_integration_source: "Source d’intégration principale",
  prescription_block_reasons: "Motifs de réserve",
  prescription_context_questions: "Questions de contexte",
  websiteUrl: "Site officiel",
  affiliateLink: "Lien commercial",
  affiliateCtaLabelFr: "Libellé du lien · français",
  affiliateCtaLabelEn: "Libellé du lien · anglais",
  affiliateDisclosureFr: "Information commerciale · français",
  affiliateDisclosureEn: "Information commerciale · anglais",
  promoCode: "Code promotionnel",
  promoDescriptionFr: "Promotion · français",
  promoDescriptionEn: "Promotion · anglais",
  logo: "URL du logo",
  ogImageUrl: "Image de couverture",
  galleryImages: "Galerie",
  defaultMonthlyPrice: "Prix mensuel historique en euros",
  timeGainedHoursPerMonth: "Temps gagné par mois (heures)",
  pricing: "Texte tarifaire · français",
  pricingEn: "Texte tarifaire · anglais",
  pricing_v5: "Tarification · français",
  pricing_v5En: "Tarification · anglais",
  free: "Offre gratuite",
  paid: "Offre payante",
  plans: "Offres",
  planKey: "Identifiant stable de l’offre",
  displayName: "Nom de l’offre",
  nativeAmount: "Montant",
  nativeCurrency: "Devise",
  priceStatus: "Type de prix",
  billingPeriod: "Période de facturation",
  billingCommitment: "Engagement",
  isFree: "Offre gratuite permanente",
  isComparePlan: "Prix de référence ToolTrim",
  featureHighlights: "Fonctionnalités de l’offre",
  summary: "Résumé",
  pricingUnit: "Unité facturée",
  observedMarket: "Marché observé",
  observedLocale: "Langue de la source",
  detailsSourceUrl: "Source officielle de l’offre",
  priceObservationId: "Observation de prix partagée",
  observedOn: "Date d’observation",
  lastConfirmedOn: "Dernière confirmation",
  taxInclusion: "Taxes",
  comingSoon: "Offre à venir",
  compare_plan_name: "Nom du prix de comparaison historique",
  compare_plan_kind: "Modèle du prix historique",
  price_reliability: "Fiabilité du prix",
  verification_status: "État de vérification",
  source_domain: "Domaine de la source",
  tcoExampleFr: "Exemple de coût total · français",
  tcoExampleEn: "Exemple de coût total · anglais",
  free_plan_card: "Précision sur l’offre gratuite · français",
  free_plan_cardEn: "Précision sur l’offre gratuite · anglais",
  billing_model: "Modèle de facturation",
  currency: "Devise historique",
  price_original_currency: "Devise du montant d’origine",
  plan_name: "Nom de l’offre historique",
  reliability: "Fiabilité",
  billing_note: "Précision sur la facturation",
  free_tier_note: "Précision sur le palier gratuit",
  currency_original: "Devise d’origine",
  costTableNoteFr: "Note du tableau des coûts · français",
  costTableNoteEn: "Note du tableau des coûts · anglais",
  compare_price_monthly_eur: "Prix mensuel de comparaison en euros",
  price_original: "Montant d’origine",
  conversion_rate_to_eur: "Taux historique vers l’euro",
  monthly_eur: "Montant mensuel en euros",
  annual_monthly_eur: "Équivalent mensuel annuel en euros",
  minSeats: "Nombre minimum de sièges",
  location_sensitive: "Prix dépendant du pays",
  usage_sensitive: "Prix dépendant de l’usage",
  free_tier: "Palier gratuit",
  showCostTable: "Afficher le tableau des coûts",
  official_source_url: "Source officielle des tarifs",
  source_url: "URL de la source",
  affiliate_url: "Lien commercial dédié aux tarifs",
  verified_on: "Date de vérification",
  cautions: "Précautions · français",
  cautionsEn: "Précautions · anglais",
  billing_options: "Options de facturation",
  label_fr: "Libellé · français",
  label_en: "Libellé · anglais",
  value: "Valeur",
  needs_verification: "À vérifier",
  price_monthly_eur: "Coût mensuel en euros",
  costTable: "Tableau des coûts",
  annualUsd: "Coût annuel en dollars",
  monthlyUsd: "Coût mensuel en dollars",
  plan: "Offre · français",
  planEn: "Offre · anglais",
  team: "Équipe · français",
  teamEn: "Équipe · anglais",
  verdictFr: "Avis · français",
  verdict: "Verdict · français",
  verdictEn: "Verdict · anglais",
  keepIf: "À garder si",
  avoidIf: "À éviter si",
  threshold: "Conclusion",
  profileTable: "Recommandations par profil",
  profile: "Profil",
  recommendation: "Recommandation",
  billingTraps: "Pièges de facturation",
  faqPriceAnswer: "Réponse à la question du prix",
  profitableIf: "Rentable si",
  tooExpensiveIf: "Trop cher si",
  label: "Libellé",
  score: "Note éditoriale historique",
  toolTrimRating: "Notation ToolTrim",
  puissance: "Puissance",
  reversibilite: "Réversibilité",
  simplicite: "Simplicité",
  utilisation: "Utilisation",
  valeurAjoutee: "Valeur ajoutée",
  evidence: "Preuves · français",
  evidenceEn: "Preuves · anglais",
  notedOn: "Date de notation",
  lastActivityVerifiedOn: "Activité produit vérifiée le",
  ia_use_case: "Usage de l’IA",
  alternatives: "Alternatives",
  reason: "Motif · français",
  reasonEn: "Motif · anglais",
  articles: "Articles associés",
  slug: "Identifiant de page",
  title: "Titre",
  excerpt: "Extrait",
  betterAlternative: "Alternative recommandée",
  tool: "Outil",
  performanceGain: "Gain de performance · français",
  performanceGainEn: "Gain de performance · anglais",
  saving: "Économie mensuelle",
  downgradePlan: "Passage à une offre inférieure",
  available: "Disponible",
  freeTier: "Palier gratuit cible",
  migrationGuide: "Migration",
  dataLoss: "Risques de perte de données",
  steps: "Étapes",
  timeEstimate: "Durée estimée",
  relations: "Relations",
  confidence: "Niveau de confiance",
  kind: "Nature de la relation",
  needKeys: "Besoins concernés",
  targetToolId: "Outil lié",
  lifecycle: "Cycle de vie",
  checkedOn: "Date de contrôle",
  note: "Note",
  text: "Texte",
  status: "Statut",
  decision_policy_v3: "Règles de recommandation",
  auto_cancel_allowed: "Autoriser la résiliation automatique",
  auto_downgrade_allowed: "Autoriser le déclassement automatique",
  auto_replace_allowed: "Autoriser le remplacement automatique",
  requires_context_questions: "Poser des questions de contexte",
  default_decision_lane: "Orientation par défaut",
  never_auto_cancel_reason: "Motif interdisant la résiliation automatique",
  seo: "Référencement",
  metaDescription: "Description générale · français",
  metaDescriptionEn: "Description générale · anglais",
  metaTitle: "Titre général",
  presentationTitleFr: "Titre de présentation · français",
  presentationTitleEn: "Titre de présentation · anglais",
  idealForFr: "Public idéal · français",
  idealForEn: "Public idéal · anglais",
  presentationMetaDescriptionFr: "Description de présentation · français",
  presentationMetaDescriptionEn: "Description de présentation · anglais",
  prixTitleFr: "Titre des tarifs · français",
  prixTitleEn: "Titre des tarifs · anglais",
  prixMetaDescriptionFr: "Description des tarifs · français",
  prixMetaDescriptionEn: "Description des tarifs · anglais",
  altTitleFr: "Titre des alternatives · français",
  altTitleEn: "Titre des alternatives · anglais",
  altMetaDescriptionFr: "Description des alternatives · français",
  altMetaDescriptionEn: "Description des alternatives · anglais",
  avisTitleFr: "Titre de l’avis · français",
  avisTitleEn: "Titre de l’avis · anglais",
  avisMetaDescriptionFr: "Description de l’avis · français",
  avisMetaDescriptionEn: "Description de l’avis · anglais",
  aiAngle: "Angle éditorial sur l’IA",
  aiTools: "Outils IA associés",
  augmentFr: "Augmenter · français",
  augmentEn: "Augmenter · anglais",
  replaceFr: "Remplacer · français",
  replaceEn: "Remplacer · anglais",
  stance: "Position éditoriale",
  id: "Identifiant catalogue",
  research: "Dossier de recherche",
  prescription_output: "Résultat de recommandation calculé",
  prescription_quality: "Qualité de recommandation calculée",
  bestFor: "Ancien public cible",
  tags: "Anciens mots-clés",
  nameEn: "Ancien nom anglais",
  categoryId: "Ancienne catégorie",
  gallery_images: "Ancienne galerie",
  link: "Ancien lien",
  website: "Ancien site",
  lifecycleStatus: "Ancien état du cycle de vie",
  pricingTiers: "Anciens tarifs",
};
const englishLabels: Record<string, string> = {
  pricing_v5: "Pricing · French",
  pricing_v5En: "Pricing · English",
  toolTrimRating: "ToolTrim rating",
  tool_type: "Tool type",
  ia_use_case: "AI use case",
  valeurAjoutee: "Added value",
  simplicite: "Simplicity",
  utilisation: "Fit for purpose",
  puissance: "Performance",
  reversibilite: "Reversibility",
  evidence: "Evidence · French",
  evidenceEn: "Evidence · English",
  pricing: "Pricing description · French",
  pricingEn: "Pricing description · English",
  pros: "Strengths · French",
  prosEn: "Strengths · English",
  cons: "Limitations · French",
  consEn: "Limitations · English",
  relevantFor: "Audience · French",
  relevantForEn: "Audience · English",
  verdict: "Verdict · French",
  verdictEn: "Verdict · English",
  displayName: "Offer name",
  nativeAmount: "Amount",
  nativeCurrency: "Currency",
  isComparePlan: "ToolTrim reference price",
  priceStatus: "Price type",
  detailsSourceUrl: "Official offer source",
  priceObservationId: "Shared price observation",
  planKey: "Stable offer identity",
  prescription_block_reasons: "Reasons to withhold a recommendation",
  prescription_context_questions: "Context questions",
  force_silence: "Suspend recommendations",
  pivot_integration_source: "Primary integration source",
  decision_policy_v3: "Recommendation rules",
  substitution_cluster_v2: "Substitution group",
  pricingUnit: "Billing unit",
  taxInclusion: "Taxes",
  compare_plan_name: "Legacy comparison offer name",
  compare_plan_kind: "Legacy comparison price model",
  compare_price_monthly_eur: "Monthly comparison price in euros",
  source_domain: "Source domain",
  verified_on: "Verification date",
  official_source_url: "Official pricing source",
  affiliate_url: "Commercial pricing link",
  source_url: "Source URL",
  billing_options: "Billing options",
  free_plan_card: "Free offer clarification · French",
  free_plan_cardEn: "Free offer clarification · English",
  tcoExampleFr: "Total cost example · French",
  tcoExampleEn: "Total cost example · English",
  monthly_eur: "Monthly amount in euros",
  annual_monthly_eur: "Annual monthly equivalent in euros",
  price_original: "Original amount",
  price_original_currency: "Original currency",
  conversion_rate_to_eur: "Historical euro conversion rate",
  nameEn: "Legacy English name",
  bestFor: "Legacy audience",
  tags: "Legacy keywords",
  categoryId: "Legacy category",
  gallery_images: "Legacy gallery",
  link: "Legacy link",
  website: "Legacy website",
  lifecycleStatus: "Legacy lifecycle status",
  pricingTiers: "Legacy prices",
  prescription_output: "Generated recommendation",
  prescription_quality: "Generated recommendation quality",
  seo: "Search metadata",
  ogImageUrl: "Cover image",
  logo: "Logo URL",
  fr: "French",
  en: "English",
};
export const catalogText = (
  context: Pick<CatalogEditingValue, "lang">,
  fr: string,
  en: string,
) => (context.lang === "en" ? en : fr);
export function catalogFieldLabel(
  path: CatalogPath,
  lang: "fr" | "en" = "fr",
): string {
  const last = path[path.length - 1];
  if (typeof last === "number") return lang === "en" ? "Item" : "Élément";
  if (lang === "fr") return labels[last] ?? "Information éditoriale";
  if (englishLabels[last]) return englishLabels[last];
  const phrase = last
    .replace(/^prix/, "pricing")
    .replace(/^alt(?=[A-Z])/, "alternatives")
    .replace(/^avis/, "review")
    .replace(/Fr$/, " · French")
    .replace(/En$/, " · English")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ");
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}
export const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
export function catalogValueAt(value: unknown, path: CatalogPath): unknown {
  return path.reduce<unknown>(
    (current, key) =>
      record(current) || Array.isArray(current)
        ? (current as Record<string | number, unknown>)[key]
        : undefined,
    value,
  );
}
export function defaultValue(schema: CatalogField): unknown {
  return schema.kind === "array"
    ? []
    : schema.kind === "object"
      ? {}
      : schema.kind === "boolean"
        ? false
        : schema.kind === "number"
          ? null
          : "";
}
export function canEdit(
  context: CatalogEditingValue,
  path: CatalogPath,
): boolean {
  if (!isCatalogPathAllowed(context.capabilities, path)) return false;
  return path.slice(0, -1).every((_, i) => {
    const ancestor = path.slice(0, i + 1),
      value = catalogValueAt(context.value, ancestor);
    return (
      value != null || isCatalogPathAllowed(context.capabilities, ancestor)
    );
  });
}
export function differences(
  before: unknown,
  after: unknown,
  path: CatalogPath = [],
): CatalogChange[] {
  if (Object.is(before, after)) return [];
  if (record(before) && record(after))
    return [
      ...new Set([...Object.keys(before), ...Object.keys(after)]),
    ].flatMap((key) => differences(before[key], after[key], [...path, key]));
  if (
    Array.isArray(before) &&
    Array.isArray(after) &&
    before.length === after.length
  )
    return after.flatMap((value, index) =>
      differences(before[index], value, [...path, index]),
    );
  return JSON.stringify(before) === JSON.stringify(after)
    ? []
    : [
        {
          path,
          value: after,
          ...(after === undefined ? { remove: true } : {}),
        },
      ];
}
export function applyChanges(
  context: CatalogEditingValue,
  changes: CatalogChange[],
) {
  const permitted = changes.every(
    (change) =>
      canEdit(context, change.path) ||
      (context.capabilities.canPublishAll &&
        change.path.at(-1) === "priceObservationId"),
  );
  if (!permitted) return false;
  if (context.onChanges) context.onChanges(changes);
  else
    changes.forEach((change) =>
      change.remove
        ? context.onRemove(change.path)
        : context.onChange(change.path, change.value),
    );
  return true;
}
export function priceChange(
  context: CatalogEditingValue,
  path: CatalogPath,
  next: unknown,
) {
  const [root, collection, index, key] = path;
  if (
    (root !== "pricing_v5" && root !== "pricing_v5En") ||
    collection !== "plans" ||
    typeof index !== "number" ||
    typeof key !== "string"
  )
    return false;
  if (
    ![...PRICE_FACT_FIELDS, "isComparePlan"].includes(
      key as (typeof PRICE_FACT_FIELDS)[number],
    )
  )
    return false;
  const plan = catalogValueAt(context.value, [root, "plans", index]);
  if (!record(plan)) return false;
  const patch: Record<string, unknown> = { [key]: next };
  // Once a price fact changes, persist its intent; opening the fiche does nothing.
  patch.priceStatus =
    key === "priceStatus"
      ? next
      : (plan.priceStatus ??
        (plan.isFree
          ? "free"
          : Number(plan.nativeAmount) > 0 ||
              (key === "nativeAmount" && Number(next) > 0)
            ? "paid"
            : "unknown"));
  if (key === "priceStatus") {
    if (next === "free")
      Object.assign(patch, {
        nativeAmount: 0,
        isFree: true,
        isComparePlan: false,
      });
    else if (next === "quote" || next === "unknown")
      Object.assign(patch, {
        nativeAmount: null,
        isFree: false,
        isComparePlan: false,
      });
    else if (next === "usage")
      Object.assign(patch, { isFree: false, billingPeriod: "usage" });
    else Object.assign(patch, { isFree: false });
  }
  if (key === "isFree")
    Object.assign(
      patch,
      next
        ? { priceStatus: "free", nativeAmount: 0, isComparePlan: false }
        : { priceStatus: Number(plan.nativeAmount) > 0 ? "paid" : "unknown" },
    );
  const updated = updateCatalogPriceObservation(
    context.value,
    root,
    index,
    patch,
  );
  if (["quote", "unknown", "free"].includes(String(patch.priceStatus))) {
    const sharedId = catalogValueAt(updated, [
      root,
      "plans",
      index,
      "priceObservationId",
    ]);
    if (sharedId)
      for (const pricingRoot of ["pricing_v5", "pricing_v5En"]) {
        const rows = catalogValueAt(updated, [pricingRoot, "plans"]);
        if (Array.isArray(rows))
          rows.forEach((row) => {
            if (record(row) && row.priceObservationId === sharedId)
              row.isComparePlan = false;
          });
      }
  }
  if (key === "isComparePlan" && next === true) {
    // One reference per real currency, including the other language. Proven duplicates retain their shared identity.
    const sharedId = catalogValueAt(updated, [
      root,
      "plans",
      index,
      "priceObservationId",
    ]);
    for (const pricingRoot of ["pricing_v5", "pricing_v5En"]) {
      const plans = catalogValueAt(updated, [pricingRoot, "plans"]);
      if (Array.isArray(plans))
        plans.forEach((candidate, i) => {
          if (
            record(candidate) &&
            candidate.nativeCurrency === plan.nativeCurrency &&
            !(pricingRoot === root && i === index) &&
            (!sharedId || candidate.priceObservationId !== sharedId)
          )
            candidate.isComparePlan = false;
        });
    }
  }
  return applyChanges(context, differences(context.value, updated))
    ? true
    : "forbidden";
}

export function catalogIssueMessage(
  code: string,
  lang: "fr" | "en" = "fr",
): string {
  const messages: Record<string, [string, string]> = {
    SOURCE_REQUIRED: [
      "Ajouter une source officielle.",
      "Add an official source.",
    ],
    SOURCE_DATE_REQUIRED: [
      "Renseigner la date de la source.",
      "Enter the source date.",
    ],
    PRICE_STATUS_REQUIRED: [
      "Préciser le type de prix.",
      "Choose the price type.",
    ],
    REQUIRED: ["Renseigner ce champ.", "Complete this field."],
    CATEGORY_REQUIRED: [
      "Choisir une catégorie existante.",
      "Choose an existing category.",
    ],
    CURRENCY_REQUIRED: [
      "Préciser la devise du montant publié.",
      "Specify the published price currency.",
    ],
    PAID_PRICE_REQUIRED: [
      "Une offre payante exige un montant positif et une période.",
      "A paid offer requires a positive amount and billing period.",
    ],
    FREE_PRICE_REQUIRED: [
      "Une offre gratuite exige un montant nul et le statut gratuit.",
      "A free offer requires a zero amount and free status.",
    ],
    NON_NUMERIC_PRICE_REQUIRED: [
      "Un tarif non communiqué ou sur devis ne porte pas de montant ni de prix de référence.",
      "An undisclosed or quoted price has no amount or comparison reference.",
    ],
    RATING_EVIDENCE_REQUIRED: [
      "Ajouter une preuve pour ce critère.",
      "Add evidence for this criterion.",
    ],
    RATING_DATE_REQUIRED: [
      "Préciser la date de notation.",
      "Enter the rating date.",
    ],
    DUPLICATE_CURRENCY_REFERENCE: [
      "Choisir un seul prix de référence pour cette devise.",
      "Choose one reference price for this currency.",
    ],
    LINKED_FACTS_DIVERGE: [
      "Les observations liées doivent porter les mêmes faits de prix.",
      "Linked observations must retain the same price facts.",
    ],
    USAGE_UNIT_REQUIRED: [
      "Préciser l’unité d’usage facturée.",
      "Specify the billed usage unit.",
    ],
  };
  return (
    messages[code]?.[lang === "en" ? 1 : 0] ??
    (lang === "en"
      ? "This value needs correction before publication."
      : "Cette valeur doit être corrigée avant publication.")
  );
}

/** Describe the current locale fallback without materializing a translated raw value. */
export function catalogInheritedText(
  value: unknown,
  path: CatalogPath,
): string {
  if (
    catalogValueAt(value, path) != null ||
    !path.some((part) => typeof part === "string" && part.endsWith("En"))
  )
    return "";
  const flatten = (item: unknown): string[] =>
    Array.isArray(item)
      ? item.flatMap(flatten)
      : record(item)
        ? Object.values(item).flatMap(flatten)
        : typeof item === "string" && item.trim()
          ? [item]
          : [];
  for (const replacement of ["Fr", ""]) {
    const candidate = catalogValueAt(
      value,
      path.map((part) =>
        typeof part === "string" && part.endsWith("En")
          ? part.slice(0, -2) + replacement
          : part,
      ),
    );
    const text = flatten(candidate).join(" · ");
    if (text) return text;
  }
  return "";
}
