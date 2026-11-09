import type { CatalogChange } from "@/components/backoffice/catalogEditingModel";
import type { CatalogTool } from "@/lib/backofficeCatalog";
import { controlCopy } from "../Controls/Controls.fixtures";

// Selected Notion catalogue fields used by the editor. The empty draft
// deliberately exercises a state outside published data.
const plusPlan = {
  planKey: "plus",
  displayName: "Plus",
  summary: "11,50 €/mois sans engagement. Par utilisateur.",
  detailsSourceUrl: "https://www.notion.com/pricing",
  pricingUnit: "seat",
  isFree: false,
  isComparePlan: true,
  nativeAmount: 9.5,
  nativeCurrency: "EUR",
  billingPeriod: "monthly",
  billingCommitment: "annual_prepaid",
  taxInclusion: "unknown",
  observedMarket: "EU",
  observedOn: "2026-09-25",
  lastConfirmedOn: "2026-09-25",
};

export const notionRecord = {
  id: "notion",
  slug: "notion",
  name: "Notion",
  category: "organization",
  shortDescription: controlCopy.fr.descriptionValue,
  shortDescriptionEn: controlCopy.en.descriptionValue,
  websiteUrl: "https://notion.so",
  pros: [
    "Le plan gratuit est vraiment utilisable durablement pour une personne seule, pas un essai limité.",
    "Export complet de l’espace de travail vers des formats ouverts (HTML, Markdown, CSV) sur tous les plans.",
  ],
  prosEn: [
    "Free plan is genuinely usable long-term for a solo individual, not a crippled trial.",
    "Full workspace export to open formats (HTML, Markdown, CSV) on every plan.",
  ],
  pricing_v5: { plans: [plusPlan] },
  pricing_v5En: { plans: [{ ...plusPlan, summary: "€11.50/mo billed monthly. Per user." }] },
} satisfies CatalogTool;

export const emptyRecord = {
  id: "empty-fixture",
  slug: "empty-fixture",
  name: "",
  category: "organization",
} satisfies CatalogTool;


// Keep the Storybook controls interactive with an isolated in-memory draft.
export function changeStoryRecord(record: CatalogTool, changes: CatalogChange[]): CatalogTool {
  const next = structuredClone(record);
  for (const { path, value, remove } of changes) {
    let parent: Record<string | number, unknown> = next;
    for (const [index, key] of path.slice(0, -1).entries()) {
      parent[key] ??= typeof path[index + 1] === "number" ? [] : {};
      parent = parent[key] as typeof parent;
    }
    const key = path.at(-1)!;
    if (remove) delete parent[key];
    else parent[key] = value;
  }
  return next;
}
