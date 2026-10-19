import { normalizeToolCartState, type ToolCartState, type StackNeed } from "./stackState";
import type { PlanChoice } from "./stackPlanChoice";
import { normalizeStackDecisions, type StackDecision } from "./stackDecisions";
import { isCurrency } from "./currencyRates";

export type PersonalStackV4 = {
  version: 4;
  selection: ToolCartState;
  billing: { paid: string[]; reviewed: string[]; choices: Record<string, PlanChoice> };
  decisions: Record<string, StackDecision>;
};

export type PersonalStackRecord = {
  state: PersonalStackV4;
  revision: number;
  updatedAt: string;
};

export class PersonalStackValidationError extends Error {
  readonly code = "INVALID_PERSONAL_STACK";
  constructor(readonly path: string) {
    super(`Invalid personal stack: ${path}`);
    this.name = "PersonalStackValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter(isString))] : [];
}

function isPlanChoice(value: unknown): value is PlanChoice {
  return isRecord(value)
    && (value.source === "plan" || value.source === "custom")
    && (value.label === undefined || typeof value.label === "string")
    && typeof value.amount === "number" && Number.isFinite(value.amount) && value.amount >= 0
    && isCurrency(value.currency)
    && (value.period === "monthly" || value.period === "annual")
    && (value.seats === undefined || (typeof value.seats === "number" && Number.isSafeInteger(value.seats) && value.seats > 0))
    && (value.perSeat === undefined || typeof value.perSeat === "boolean");
}

function copyChoice(choice: PlanChoice): PlanChoice {
  return {
    source: choice.source, amount: choice.amount, currency: choice.currency, period: choice.period,
    ...(choice.label !== undefined ? { label: choice.label } : {}),
    ...(choice.seats !== undefined ? { seats: choice.seats } : {}),
    ...(choice.perSeat !== undefined ? { perSeat: choice.perSeat } : {}),
  };
}

/** Pure recovery: never reads localStorage or resolves tool slugs against a catalogue. */
export function normalizePersonalStack(input: unknown): PersonalStackV4 {
  const envelope = isRecord(input) && (input.version === 4 || "selection" in input) ? input : null;
  const billing = envelope && isRecord(envelope.billing) ? envelope.billing : {};
  const choices = isRecord(billing.choices) ? billing.choices : {};
  const decisions = normalizeStackDecisions(envelope?.decisions);
  return {
    version: 4,
    selection: normalizeToolCartState(envelope ? envelope.selection : input),
    billing: {
      paid: strings(billing.paid),
      reviewed: strings(billing.reviewed),
      choices: Object.fromEntries(Object.entries(choices).filter(([slug, value]) => isString(slug) && isPlanChoice(value))
        .map(([slug, value]) => [slug, copyChoice(value as PlanChoice)])),
    },
    // Keep missing currencies missing: consumers must treat those savings as historical.
    decisions: Object.fromEntries(Object.entries(decisions).map(([key, decision]) => [key, {
      kind: decision.kind, kept: decision.kept, saving: decision.saving, at: decision.at,
      ...(decision.removed !== undefined ? { removed: decision.removed } : {}),
      ...(decision.savingCurrency !== undefined ? { savingCurrency: decision.savingCurrency } : {}),
    }])),
  };
}

function requireValid(condition: unknown, path: string): asserts condition {
  if (!condition) throw new PersonalStackValidationError(path);
}

/** Server writes reject bad records before the tolerant normalizer can discard them. */
export function validatePersonalStack(input: unknown): PersonalStackV4 {
  requireValid(isRecord(input) && input.version === 4, "version");
  const selection = input.selection;
  requireValid(isRecord(selection) && selection.version === 3, "selection");
  requireValid(Array.isArray(selection.needs), "selection.needs");
  for (const need of selection.needs) {
    requireValid(isRecord(need) && isString(need.id) && isString(need.labelFr) && isString(need.labelEn)
      && typeof need.order === "number" && Number.isFinite(need.order)
      && (need.source === "custom" || need.source === "suggested"), "selection.needs");
  }
  requireValid(isStringArray(selection.pinnedToolSlugs), "selection.pinnedToolSlugs");
  requireValid(Array.isArray(selection.toolEntries), "selection.toolEntries");
  const knownNeeds = new Set(normalizeToolCartState(selection).needs.map(need => need.id));
  for (const entry of selection.toolEntries) {
    requireValid(isRecord(entry) && isString(entry.toolSlug) && isStringArray(entry.needIds)
      && entry.needIds.every(id => knownNeeds.has(id))
      && typeof entry.addedAt === "string" && Number.isFinite(Date.parse(entry.addedAt))
      && (entry.assignmentMode === "pending" || entry.assignmentMode === "auto" || entry.assignmentMode === "manual")
      && (entry.intent === "stack" || entry.intent === "wishlist"), "selection.toolEntries");
  }
  const billing = input.billing;
  requireValid(isRecord(billing), "billing");
  requireValid(isStringArray(billing.paid), "billing.paid");
  requireValid(isStringArray(billing.reviewed), "billing.reviewed");
  requireValid(isRecord(billing.choices), "billing.choices");
  for (const [slug, value] of Object.entries(billing.choices)) {
    requireValid(isString(slug) && isPlanChoice(value), `billing.choices.${slug}`);
  }
  requireValid(isRecord(input.decisions), "decisions");
  const decisions = normalizeStackDecisions(input.decisions);
  for (const key of Object.keys(input.decisions)) {
    requireValid(isString(key) && Object.hasOwn(decisions, key), `decisions.${key}`);
  }
  return normalizePersonalStack(input);
}

function sameNeed(a: StackNeed, b: StackNeed): boolean {
  return a.source === b.source && a.labelFr === b.labelFr && a.labelEn === b.labelEn;
}

function decisionPair(key: string, decision: StackDecision): string {
  return (decision.removed ? [decision.kept, decision.removed] : key.split("|")).sort().join("|");
}

/** Explicit addition after account recovery. Existing tool declarations always win. */
export function mergeAnonymousDraft(saved: PersonalStackV4, draft: PersonalStackV4): PersonalStackV4 {
  const retained = normalizePersonalStack(saved);
  const incoming = normalizePersonalStack(draft);
  const savedSlugs = new Set(retained.selection.pinnedToolSlugs);
  const additions = incoming.selection.toolEntries.filter(entry => !savedSlugs.has(entry.toolSlug));
  const newSlugs = new Set(additions.map(entry => entry.toolSlug));
  const unspecifiedBilling = (slug: string) => newSlugs.has(slug) || (savedSlugs.has(slug)
    && !retained.billing.paid.includes(slug) && !retained.billing.reviewed.includes(slug)
    && !Object.hasOwn(retained.billing.choices, slug));
  const importChoice = (slug: string) => newSlugs.has(slug) || (savedSlugs.has(slug)
    && !Object.hasOwn(retained.billing.choices, slug)
    // An explicit free answer wins, as does a paid answer over a conflicting free draft.
    && (!retained.billing.reviewed.includes(slug) || retained.billing.paid.includes(slug))
    && !(retained.billing.paid.includes(slug) && incoming.billing.reviewed.includes(slug) && !incoming.billing.paid.includes(slug)));
  const needs = [...retained.selection.needs];
  // Reserve draft IDs too so remapping cannot steal a later incoming need's identity.
  const reserved = new Set([...needs, ...incoming.selection.needs].map(need => need.id));
  const needIds = new Map<string, string>();
  for (const need of incoming.selection.needs) {
    const existing = needs.find(item => item.id === need.id);
    if (!existing) {
      needs.push(need);
      needIds.set(need.id, need.id);
    } else if (sameNeed(existing, need) || need.source !== "custom") {
      needIds.set(need.id, existing.id);
    } else {
      // Reuse an earlier import on retries instead of duplicating the renamed need.
      const imported = needs.find(item => item.id.startsWith(`${need.id}-`) && sameNeed(item, need));
      let id = imported?.id;
      if (!id) {
        let suffix = 2;
        while (reserved.has(`${need.id}-${suffix}`)) suffix++;
        id = `${need.id}-${suffix}`;
        reserved.add(id);
        needs.push({ ...need, id });
      }
      needIds.set(need.id, id);
    }
  }
  const toolEntries = [...retained.selection.toolEntries, ...additions.map(entry => ({
    ...entry, needIds: entry.needIds.map(id => needIds.get(id) ?? id),
  }))];
  const selected = new Set(toolEntries.map(entry => entry.toolSlug));
  const decisions = { ...retained.decisions };
  const savedPairs = new Set(Object.entries(decisions).map(([key, decision]) => decisionPair(key, decision)));
  for (const [key, decision] of Object.entries(incoming.decisions).sort(([a], [b]) => a.localeCompare(b))) {
    const pair = decisionPair(key, decision);
    const consistent = decision.kind === "keep-both"
      ? pair.split("|").every(slug => selected.has(slug))
      : selected.has(decision.kept) && !selected.has(decision.removed!);
    if (Object.hasOwn(decisions, key) || savedPairs.has(pair) || !consistent) continue;
    decisions[key] = decision;
    savedPairs.add(pair);
  }
  return normalizePersonalStack({
    version: 4,
    selection: { ...retained.selection, needs, toolEntries, pinnedToolSlugs: [...selected] },
    billing: {
      paid: [...retained.billing.paid, ...incoming.billing.paid.filter(unspecifiedBilling)],
      reviewed: [...retained.billing.reviewed, ...incoming.billing.reviewed.filter(unspecifiedBilling)],
      choices: Object.fromEntries([
        ...Object.entries(incoming.billing.choices).filter(([slug]) => importChoice(slug)),
        ...Object.entries(retained.billing.choices),
      ]),
    },
    decisions,
  });
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (isRecord(value)) return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}

/** Canonical serialized value, deliberately not a security hash. Tool order remains meaningful. */
export function personalStackFingerprint(state: PersonalStackV4): string {
  const normalized = normalizePersonalStack(state);
  normalized.billing.paid.sort();
  normalized.billing.reviewed.sort();
  normalized.selection.toolEntries.forEach(entry => entry.needIds.sort());
  return JSON.stringify(canonical(normalized));
}
