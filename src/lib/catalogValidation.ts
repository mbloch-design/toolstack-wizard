import type { CatalogTool } from "./backofficeCatalog.js";
import { catalogSchema, type CatalogField } from "./catalogFieldRegistry.js";
import {
  catalogCapabilities,
  isCatalogPathAllowed,
  type CatalogCapabilities,
} from "./catalogPolicy.js";
import {
  catalogPlanRows,
  initializeCatalogPriceObservations,
  PRICE_FACT_FIELDS,
  priceEqual as equal,
  priceRecord as record,
  resolveCatalogComparison,
} from "./catalogPriceObservations.js";
export type CatalogValidationIssue = {
  path: string;
  code: string;
  severity: "error" | "warning";
  stage: "draft" | "publish";
};
export class CatalogValidationError extends Error {
  readonly code = "INVALID_CATALOG_TOOL";
  constructor(readonly issues: CatalogValidationIssue[] = []) {
    super("INVALID_CATALOG_TOOL");
  }
}
type Path = (string | number)[];
const issue = (
  path: Path | string,
  code: string,
  stage: "draft" | "publish" = "draft",
): CatalogValidationIssue => ({
  path: Array.isArray(path) ? path.join(".") : path,
  code,
  severity: "error",
  stage,
});
function safeTree(
  value: unknown,
  path: Path = [],
  depth = 0,
): CatalogValidationIssue[] {
  if (depth > 24) return [issue(path, "MAX_DEPTH")];
  if (value === null || typeof value === "boolean" || typeof value === "string")
    return [];
  if (typeof value === "number")
    return Number.isFinite(value)
      ? []
      : [issue(path, "FINITE_NUMBER_REQUIRED")];
  if (Array.isArray(value))
    return value.length > 1000
      ? [issue(path, "TOO_MANY_ITEMS")]
      : value.flatMap((v, i) => safeTree(v, [...path, i], depth + 1));
  if (
    !record(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))
  )
    return [issue(path, "JSON_VALUE_REQUIRED")];
  return Object.entries(value).flatMap(([k, v]) =>
    ["__proto__", "prototype", "constructor"].includes(k)
      ? [issue([...path, k], "UNSAFE_KEY")]
      : safeTree(v, [...path, k], depth + 1),
  );
}
function scalarValid(schema: CatalogField, v: unknown): boolean {
  if (v === null) return !!schema.nullable;
  if (schema.kind === "text") return typeof v === "string" && v.length <= 60000;
  if (schema.kind === "number")
    return (
      typeof v === "number" &&
      Number.isFinite(v) &&
      v >= (schema.min ?? 0) &&
      (!schema.integer || Number.isInteger(v)) &&
      (schema.max === undefined || v <= schema.max)
    );
  if (schema.kind === "boolean") return typeof v === "boolean";
  if (schema.kind === "enum")
    return typeof v === "string" && (v === "" || !!schema.options?.includes(v));
  if (schema.kind === "date")
    return (
      typeof v === "string" &&
      (v === "" ||
        (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
          Number.isFinite(Date.parse(v)) &&
          new Date(v).toISOString().slice(0, 10) === v))
    );
  if (schema.kind === "url" || schema.kind === "media") {
    if (typeof v !== "string") return false;
    if (v === "" || (schema.kind === "media" && /^\/(?!\/)[^\s]*$/.test(v)))
      return true;
    try {
      const u = new URL(v);
      return (
        ["https:", "http:"].includes(u.protocol) && !u.username && !u.password
      );
    } catch {
      return false;
    }
  }
  return false;
}
/** Removing a container cannot silently erase protected descendants. */
function removalIssues(
  schema: CatalogField,
  old: unknown,
  path: Path,
  capabilities: CatalogCapabilities,
): CatalogValidationIssue[] {
  if (old == null) return [];
  if (!isCatalogPathAllowed(capabilities, path))
    return [issue(path, "DELETE_FORBIDDEN")];
  if (schema.kind === "union") {
    const matching = schema.variants?.find((v) =>
      record(old)
        ? v.kind === "object"
        : Array.isArray(old)
          ? v.kind === "array"
          : v.kind === "text",
    );
    return matching ? removalIssues(matching, old, path, capabilities) : [];
  }
  if (schema.kind === "object" && record(old))
    return Object.entries(old).flatMap(([key, value]) => {
      const child = Object.prototype.hasOwnProperty.call(schema.children, key)
        ? schema.children![key]
        : undefined;
      return child
        ? removalIssues(child, value, [...path, key], capabilities)
        : [issue([...path, key], "PROTECTED_PATH")];
    });
  if (schema.kind === "array" && Array.isArray(old))
    return old.flatMap((value, i) =>
      removalIssues(schema.item!, value, [...path, i], capabilities),
    );
  return [];
}
function shape(
  schema: CatalogField,
  v: unknown,
  b: unknown,
  path: Path,
  capabilities: CatalogCapabilities,
): CatalogValidationIssue[] {
  if (equal(v, b)) return [];
  if (
    (v === undefined ||
      v === null ||
      (schema.kind === "union" && record(b) && !record(v))) &&
    b != null
  ) {
    const removed = removalIssues(schema, b, path, capabilities);
    if (removed.length) return removed;
  }
  if (v === undefined)
    return schema.optional && isCatalogPathAllowed(capabilities, path)
      ? []
      : [issue(path, "DELETE_FORBIDDEN")];
  if (v === null)
    return schema.nullable && isCatalogPathAllowed(capabilities, path)
      ? []
      : [issue(path, "NULL_FORBIDDEN")];
  if (schema.kind === "union") {
    const results = (schema.variants ?? []).map((s) =>
      shape(s, v, b, path, capabilities),
    );
    return (
      results.find((r) => !r.length) ??
      results[0] ?? [issue(path, "INVALID_TYPE")]
    );
  }
  if (schema.kind === "object") {
    if (!record(v)) return [issue(path, "OBJECT_REQUIRED")];
    const old = record(b) ? b : {};
    return [...new Set([...Object.keys(v), ...Object.keys(old)])].flatMap(
      (k) => {
        if (equal(v[k], old[k])) return [];
        // The identity pass below verifies deterministic initialization against base evidence.
        if (
          k === "priceObservationId" &&
          path[path.length - 2] === "plans" &&
          capabilities.canPublishAll
        )
          return typeof v[k] === "string"
            ? []
            : [issue([...path, k], "OBSERVATION_IDENTITY_PROTECTED")];
        const child = Object.prototype.hasOwnProperty.call(schema.children, k)
          ? schema.children![k]
          : undefined;
        return child
          ? shape(child, v[k], old[k], [...path, k], capabilities)
          : [issue([...path, k], "PROTECTED_PATH")];
      },
    );
  }
  if (schema.kind === "array") {
    if (!Array.isArray(v) || v.length > 100)
      return [issue(path, "ARRAY_REQUIRED")];
    const old = Array.isArray(b) ? b : [];
    // A narrow child grant cannot authorize reordering, insertion or deletion of rows.
    if (
      (v.length !== old.length ||
        v.some(
          (x, i) =>
            record(x) &&
            x.planKey !== undefined &&
            x.planKey !== (record(old[i]) ? old[i].planKey : undefined),
        )) &&
      !isCatalogPathAllowed(capabilities, path)
    )
      return [issue(path, "PATH_FORBIDDEN")];
    return v.flatMap((x, i) => {
      const previous =
        path[path.length - 1] === "plans" && record(x)
          ? old.find((p) => record(p) && p.planKey === x.planKey)
          : old[i];
      return shape(schema.item!, x, previous, [...path, i], capabilities);
    });
  }
  if (!isCatalogPathAllowed(capabilities, path))
    return [issue(path, "PATH_FORBIDDEN")];
  return scalarValid(schema, v) ? [] : [issue(path, "INVALID_VALUE")];
}
function draftIssues(
  base: CatalogTool,
  value: unknown,
  capabilities: CatalogCapabilities,
): CatalogValidationIssue[] {
  const safe = safeTree(value);
  if (safe.length) return safe;
  if (!record(value)) return [issue("", "OBJECT_REQUIRED")];
  const issues: CatalogValidationIssue[] = [];
  if (!capabilities.canSaveDraft) issues.push(issue("", "SAVE_FORBIDDEN"));
  for (const k of ["id", "slug"])
    if (value[k] !== base[k]) issues.push(issue(k, "IDENTITY_PROTECTED"));
  if (typeof value.name !== "string")
    issues.push(issue("name", "TEXT_REQUIRED"));
  for (const k of new Set([...Object.keys(value), ...Object.keys(base)])) {
    if (equal(value[k], base[k])) continue;
    if (!Object.prototype.hasOwnProperty.call(catalogSchema, k)) {
      issues.push(issue(k, "PROTECTED_PATH"));
      continue;
    }
    issues.push(
      ...shape(catalogSchema[k], value[k], base[k], [k], capabilities),
    );
  }
  if (issues.length) return issues;
  const allowedRows = catalogPlanRows(initializeCatalogPriceObservations(base));
  const rows = catalogPlanRows(value as CatalogTool);
  for (const row of rows) {
    const prior = allowedRows.find(
      (r) => r.root === row.root && r.plan.planKey === row.plan.planKey,
    );
    if (
      !equal(row.plan.priceObservationId, prior?.plan.priceObservationId) &&
      row.plan.priceObservationId !== undefined
    )
      issues.push(
        issue(
          `${row.path}.priceObservationId`,
          "OBSERVATION_IDENTITY_PROTECTED",
        ),
      );
    if (
      prior?.plan.priceObservationId &&
      base[row.root] &&
      catalogPlanRows(base).some(
        (r) =>
          r.root === row.root &&
          r.plan.planKey === row.plan.planKey &&
          r.plan.priceObservationId,
      ) &&
      !row.plan.priceObservationId
    )
      issues.push(
        issue(
          `${row.path}.priceObservationId`,
          "OBSERVATION_IDENTITY_PROTECTED",
        ),
      );
    if (row.plan.priceObservationId) {
      const peers = rows.filter(
        (r) => r.plan.priceObservationId === row.plan.priceObservationId,
      );
      if (
        peers.some(
          (r) =>
            r.plan.planKey !== row.plan.planKey ||
            PRICE_FACT_FIELDS.some((k) => !equal(r.plan[k], row.plan[k])),
        )
      )
        issues.push(issue(row.path, "LINKED_FACTS_DIVERGE"));
    }
  }
  return issues;
}
export function validateCatalogDraft(
  base: CatalogTool,
  value: unknown,
  capabilities = catalogCapabilities({ isAdmin: true }),
): CatalogTool {
  const issues = draftIssues(base, value, capabilities);
  if (issues.length) throw new CatalogValidationError(issues);
  return JSON.parse(JSON.stringify(value)) as CatalogTool;
}
const nonempty = (v: unknown): v is string =>
  typeof v === "string" && !!v.trim();
const validDate = (v: unknown) =>
  nonempty(v) && scalarValid({ kind: "date" }, v);
function incompleteFields(
  schema: CatalogField,
  value: unknown,
  base: unknown,
  path: Path,
): CatalogValidationIssue[] {
  if (equal(value, base) || value == null) return [];
  if ((schema.kind === "date" || schema.kind === "enum") && value === "")
    return [issue(path, "INCOMPLETE_VALUE", "publish")];
  if (schema.kind === "object" && record(value))
    return Object.entries(value).flatMap(([key, child]) =>
      Object.prototype.hasOwnProperty.call(schema.children, key)
        ? incompleteFields(
            schema.children![key],
            child,
            record(base) ? base[key] : undefined,
            [...path, key],
          )
        : [],
    );
  if (schema.kind === "array" && Array.isArray(value))
    return value.flatMap((child, index) => {
      const old = Array.isArray(base)
        ? path[path.length - 1] === "plans" && record(child)
          ? base.find((p) => record(p) && p.planKey === child.planKey)
          : base[index]
        : undefined;
      return incompleteFields(schema.item!, child, old, [...path, index]);
    });
  if (schema.kind === "union") {
    const variant = schema.variants?.find((v) =>
      record(value)
        ? v.kind === "object"
        : Array.isArray(value)
          ? v.kind === "array"
          : v.kind === "text",
    );
    return variant ? incompleteFields(variant, value, base, path) : [];
  }
  return [];
}
function publishIssues(
  base: CatalogTool,
  tool: CatalogTool,
): CatalogValidationIssue[] {
  const issues: CatalogValidationIssue[] = Object.entries(
    catalogSchema,
  ).flatMap(([key, schema]) =>
    incompleteFields(schema, tool[key], base[key], [key]),
  );
  const add = (path: string, code: string) =>
    issues.push(issue(path, code, "publish"));
  if (!nonempty(tool.name)) add("name", "REQUIRED");
  if (
    !equal(base.category, tool.category) &&
    (typeof tool.category !== "string" ||
      !/^[a-z0-9][a-z0-9-]{0,100}$/.test(tool.category))
  )
    add("category", "CATEGORY_REQUIRED");
  const rating = tool.toolTrimRating,
    oldRating = base.toolTrimRating;
  if (record(rating))
    for (const key of [
      "puissance",
      "reversibilite",
      "simplicite",
      "utilisation",
      "valeurAjoutee",
    ]) {
      if (
        rating[key] == null ||
        (equal(rating[key], record(oldRating) ? oldRating[key] : undefined) &&
          equal(
            record(rating.evidence) ? rating.evidence[key] : undefined,
            record(oldRating) && record(oldRating.evidence)
              ? oldRating.evidence[key]
              : undefined,
          ) &&
          equal(
            rating.notedOn,
            record(oldRating) ? oldRating.notedOn : undefined,
          ))
      )
        continue;
      if (!record(rating.evidence) || !nonempty(rating.evidence[key]))
        add(`toolTrimRating.evidence.${key}`, "RATING_EVIDENCE_REQUIRED");
      if (!validDate(rating.notedOn))
        add("toolTrimRating.notedOn", "RATING_DATE_REQUIRED");
    }
  const rows = catalogPlanRows(tool),
    oldRows = catalogPlanRows(base);
  for (const root of ["pricing_v5", "pricing_v5En"]) {
    const own = rows.filter((r) => r.root === root),
      previous = oldRows.filter((r) => r.root === root);
    if (
      equal(
        own.map((r) => r.plan),
        previous.map((r) => r.plan),
      )
    )
      continue;
    const keys = new Set<unknown>(),
      currencies = new Set<unknown>();
    for (const row of own) {
      const p = row.plan,
        old = previous.find((r) => r.plan.planKey === p.planKey)?.plan;
      if (
        keys.has(p.planKey) &&
        own.filter((r) => r.plan.planKey === p.planKey).length >
          previous.filter((r) => r.plan.planKey === p.planKey).length
      )
        add(`${row.path}.planKey`, "DUPLICATE_PLAN_KEY");
      keys.add(p.planKey);
      if (!nonempty(p.planKey)) add(`${row.path}.planKey`, "PLAN_KEY_REQUIRED");
      if (p.isComparePlan) {
        if (
          currencies.has(p.nativeCurrency) &&
          !equal(
            own
              .filter(
                (r) =>
                  r.plan.isComparePlan &&
                  r.plan.nativeCurrency === p.nativeCurrency,
              )
              .map((r) => r.plan.planKey)
              .sort(),
            previous
              .filter(
                (r) =>
                  r.plan.isComparePlan &&
                  r.plan.nativeCurrency === p.nativeCurrency,
              )
              .map((r) => r.plan.planKey)
              .sort(),
          )
        )
          add(`${row.path}.isComparePlan`, "DUPLICATE_CURRENCY_REFERENCE");
        currencies.add(p.nativeCurrency);
      }
      if (equal(p, old)) continue;
      if (!nonempty(p.displayName)) add(`${row.path}.displayName`, "REQUIRED");
      const factsChanged =
        !old ||
        [...PRICE_FACT_FIELDS, "isComparePlan"].some(
          (k) => !equal(p[k], old[k]),
        );
      if (!factsChanged) continue;
      if (!nonempty(p.detailsSourceUrl))
        add(`${row.path}.detailsSourceUrl`, "SOURCE_REQUIRED");
      if (!validDate(p.observedOn))
        add(`${row.path}.observedOn`, "SOURCE_DATE_REQUIRED");
      if (
        p.nativeAmount !== null &&
        (typeof p.nativeAmount !== "number" ||
          !nonempty(p.nativeCurrency) ||
          !/^[A-Z]{3}$/.test(p.nativeCurrency))
      )
        add(`${row.path}.nativeCurrency`, "CURRENCY_REQUIRED");
      if (!old)
        for (const k of [
          "nativeAmount",
          "nativeCurrency",
          "isFree",
          "isComparePlan",
        ])
          if (!(k in p)) add(`${row.path}.${k}`, "REQUIRED");
      if (
        p.priceStatus === "paid" &&
        (!(typeof p.nativeAmount === "number" && p.nativeAmount > 0) ||
          p.isFree !== false ||
          !nonempty(p.billingPeriod))
      )
        add(`${row.path}.nativeAmount`, "PAID_PRICE_REQUIRED");
      if (
        p.priceStatus === "free" &&
        (p.nativeAmount !== 0 || p.isFree !== true)
      )
        add(`${row.path}.nativeAmount`, "FREE_PRICE_REQUIRED");
      if (
        ["quote", "unknown"].includes(String(p.priceStatus)) &&
        (p.nativeAmount !== null ||
          p.isFree !== false ||
          p.isComparePlan === true)
      )
        add(`${row.path}.priceStatus`, "NON_NUMERIC_PRICE_REQUIRED");
      if (
        p.priceStatus === "usage" &&
        (p.isFree !== false ||
          !nonempty(p.pricingUnit) ||
          p.billingPeriod !== "usage")
      )
        add(`${row.path}.pricingUnit`, "USAGE_UNIT_REQUIRED");
    }
  }
  for (const root of ["pricing_v5", "pricing_v5En"]) {
    const p = tool[root],
      old = base[root];
    if (!record(p)) continue;
    if (
      [
        "compare_price_monthly_eur",
        "price_original",
        "conversion_rate_to_eur",
        "monthly_eur",
        "annual_monthly_eur",
        "official_source_url",
        "source_url",
        "verified_on",
      ].some((k) => !equal(p[k], record(old) ? old[k] : undefined)) ||
      (root === "pricing_v5" &&
        !equal(base.defaultMonthlyPrice, tool.defaultMonthlyPrice))
    ) {
      if (!nonempty(p.official_source_url ?? p.source_url))
        add(`${root}.official_source_url`, "SOURCE_REQUIRED");
      if (!validDate(p.verified_on))
        add(`${root}.verified_on`, "SOURCE_DATE_REQUIRED");
    }
  }
  if (
    !equal(base.defaultMonthlyPrice, tool.defaultMonthlyPrice) &&
    tool.defaultMonthlyPrice !== undefined &&
    !record(tool.pricing_v5)
  )
    add("pricing_v5.official_source_url", "SOURCE_REQUIRED");
  return issues;
}
export function catalogValidationIssues(
  base: CatalogTool,
  value: unknown,
): CatalogValidationIssue[] {
  const draft = draftIssues(
    base,
    value,
    catalogCapabilities({ isAdmin: true }),
  );
  if (draft.length) return draft;
  const tool = value as CatalogTool,
    issues = publishIssues(base, tool);
  for (const currency of ["EUR", "USD"]) {
    const resolved = resolveCatalogComparison(tool, currency);
    if (resolved.fallback)
      issues.push({
        path: resolved.path ?? "defaultMonthlyPrice",
        code: `PRICE_FALLBACK_${currency}_${resolved.fallback.toUpperCase()}`,
        stage: "publish",
        severity: "warning",
      });
  }
  return issues;
}
export function validateCatalogPublication(
  base: CatalogTool,
  value: unknown,
  capabilities = catalogCapabilities({ isAdmin: true }),
): CatalogTool {
  const tool = validateCatalogDraft(base, value, capabilities),
    issues = publishIssues(base, tool);
  if (issues.length) throw new CatalogValidationError(issues);
  return tool;
}
