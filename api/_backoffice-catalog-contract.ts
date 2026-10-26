import { createHash } from "node:crypto";
import { AccountApiError } from "./_account-auth.js";
import {
  changedCatalogFields,
  type CatalogTool,
  type CatalogDraftSummary,
} from "../src/lib/backofficeCatalog.js";
export const CATALOG_REPO = "mbloch-design/toolstack-wizard";
export const CATALOG_PATH = "src/data/tools_v4.json";
export const CATALOG_BRANCH = "main";
export const catalogError = (status = 503, code = "CATALOG_UNAVAILABLE") =>
  new AccountApiError(status, code);
function canonical(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canonical);
  if (v && typeof v === "object")
    return Object.fromEntries(
      Object.entries(v)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, x]) => [k, canonical(x)]),
    );
  return v;
}
export function catalogHash(v: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(canonical(v)))
    .digest("hex");
}
export function validSlug(v: unknown): v is string {
  return typeof v === "string" && /^[a-z0-9][a-z0-9-]{0,159}$/.test(v);
}
export type CatalogDraft = {
  slug: string;
  version: number;
  baseHash: string;
  base: CatalogTool;
  value: CatalogTool;
  updatedAt: string;
};
export function draftSummary(d: CatalogDraft): CatalogDraftSummary {
  return {
    slug: d.slug,
    name: d.value.name,
    version: d.version,
    updatedAt: d.updatedAt,
    fields: changedCatalogFields(d.base, d.value),
  };
}
