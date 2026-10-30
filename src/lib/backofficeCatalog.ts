/** Shared JSON-only contract. Provider credentials and persistence stay server-side. */
export type CatalogTool = Record<string, unknown> & {
  id: string;
  slug: string;
  name: string;
};
export type CatalogDraftSummary = {
  slug: string;
  name: string;
  version: number;
  updatedAt: string;
  fields: string[];
};
export type CatalogWorkspace = {
  revision: number;
  tools: {
    slug: string;
    name: string;
    category: string;
    draft: CatalogDraftSummary | null;
  }[];
  drafts: CatalogDraftSummary[];
  total: number;
  page: number;
  pageSize: number;
  headSha: string;
  capabilities?: import("./catalogPolicy.js").CatalogCapabilities;
};
export type CatalogEditorDetail = {
  tool: CatalogTool;
  published: CatalogTool;
  baseHash: string;
  version: number;
  draft: CatalogDraftSummary | null;
  conflict: boolean;
  capabilities?: import("./catalogPolicy.js").CatalogCapabilities;
  validation?: import("./catalogValidation.js").CatalogValidationIssue[];
};
export type CatalogPublication = {
  commitSha: string;
  commitUrl: string;
  published: number;
  cleanupPending: boolean;
};
export {
  CATALOG_FIELD_REGISTRY,
  catalogFieldAt,
  CATALOG_BILLING_PERIODS,
} from "./catalogFieldRegistry.js";
export { catalogCapabilities, isCatalogPathAllowed } from "./catalogPolicy.js";
export type { CatalogCapabilities } from "./catalogPolicy.js";
export {
  initializeCatalogPriceObservations,
  updateCatalogPriceObservation,
  resolveCatalogComparison,
} from "./catalogPriceObservations.js";
export {
  validateCatalogDraft,
  validateCatalogPublication,
  validateCatalogPublication as validateCatalogTool,
  catalogValidationIssues,
  CatalogValidationError,
} from "./catalogValidation.js";
export type { CatalogValidationIssue } from "./catalogValidation.js";
import { catalogSchema, catalogFieldAt } from "./catalogFieldRegistry.js";
export const EDITABLE_CATALOG_FIELDS = Object.keys(catalogSchema);
export function isEditableCatalogPath(
  path: readonly (string | number)[],
): boolean {
  return !!catalogFieldAt(path)?.editable;
}
export function changedCatalogFields(
  base: CatalogTool,
  value: CatalogTool,
): string[] {
  return [...new Set([...Object.keys(base), ...Object.keys(value)])]
    .filter((key) => JSON.stringify(base[key]) !== JSON.stringify(value[key]))
    .sort();
}
