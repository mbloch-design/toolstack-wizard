import { describe, expect, it } from "vitest";
import {
  mergeAnonymousDraft, normalizePersonalStack, personalStackFingerprint,
  PersonalStackValidationError, validatePersonalStack, type PersonalStackV4,
} from "./personalStack";
import { createDefaultToolCartState, pinToolInState } from "./stackState";
import { decisionSavingInCurrency } from "./stackDecisions";

const at = "2026-10-19T09:00:00.000Z";
const choice = { source: "custom" as const, amount: 42.5, currency: "EUR" as const, period: "monthly" as const, seats: 2, perSeat: true };
function stack(slugs: string[] = []): PersonalStackV4 {
  return {
    version: 4,
    selection: slugs.reduce((state, slug) => pinToolInState(state, slug, [], at), createDefaultToolCartState()),
    billing: { paid: [], reviewed: [], choices: {} },
    decisions: {},
  };
}

describe("personal stack snapshot", () => {
  it("round trips selection, paid/reviewed declarations, exact choices and historical decisions", () => {
    const input = stack(["unknown-archived-tool"]);
    input.billing = { paid: ["unknown-archived-tool"], reviewed: ["free-tool"], choices: { "unknown-archived-tool": choice } };
    input.decisions = { "a|b": { kind: "keep-one", kept: "a", removed: "b", saving: 12, at } };
    const output = validatePersonalStack(JSON.parse(JSON.stringify(input)));
    expect(output).toEqual(input);
    expect(decisionSavingInCurrency(output.decisions["a|b"], "EUR")).toBeNull();
  });

  it("wraps legacy v3 selection without inventing billing data or touching separate local stores", () => {
    const selection = stack(["legacy-tool"]).selection;
    expect(normalizePersonalStack(selection)).toEqual({ version: 4, selection, billing: { paid: [], reviewed: [], choices: {} }, decisions: {} });
  });

  it("recovers valid records independently and deduplicates without discarding declared amounts", () => {
    const input = stack(["a"]);
    const output = normalizePersonalStack({ ...input,
      selection: { ...input.selection, toolEntries: [...input.selection.toolEntries, ...input.selection.toolEntries], pinnedToolSlugs: ["a", "a"] },
      billing: { paid: ["a", "a", 3], reviewed: ["a", "a"], choices: { a: choice, broken: { ...choice, amount: Infinity } } },
      decisions: { "a|b": { kind: "keep-one", kept: "a", removed: "b", saving: 3, at }, broken: { saving: NaN } },
    });
    expect(output.selection.pinnedToolSlugs).toEqual(["a"]);
    expect(output.billing).toEqual({ paid: ["a"], reviewed: ["a"], choices: { a: choice } });
    expect(Object.keys(output.decisions)).toEqual(["a|b"]);
    expect(normalizePersonalStack(null).selection.toolEntries).toEqual([]);
  });

  it("recovers valid billing from a damaged v4 envelope whose selection was lost", () => {
    const result = normalizePersonalStack({ version: 4, billing: { paid: ["a"], reviewed: ["a"], choices: { a: choice } } });
    expect(result.billing).toEqual({ paid: ["a"], reviewed: ["a"], choices: { a: choice } });
    expect(result.selection.toolEntries).toEqual([]);
  });

  it.each([NaN, Infinity, -Infinity, -1])("rejects invalid server plan amount %s with a typed error", (amount) => {
    const input = stack(["a"]);
    input.billing.choices.a = { ...choice, amount };
    expect(() => validatePersonalStack(input)).toThrow(PersonalStackValidationError);
    try { validatePersonalStack(input); } catch (error) {
      expect(error).toMatchObject({ code: "INVALID_PERSONAL_STACK", path: "billing.choices.a" });
    }
  });

  it.each([{ currency: "CAD" }, { period: "weekly" }, { seats: 0 }, { seats: 1.5 }, { seats: Infinity }, { perSeat: "yes" }, { source: "other" }])("rejects invalid choice fields %j", (fields) => {
    const input = stack(["a"]);
    input.billing.choices.a = { ...choice, ...fields } as typeof choice;
    expect(() => validatePersonalStack(input)).toThrow(PersonalStackValidationError);
  });

  it.each([
    { version: 3 }, { selection: null }, { billing: { paid: [], reviewed: [], choices: [] } },
    { decisions: { bad: { kind: "keep-one", kept: "a", removed: "b", saving: Infinity, at } } },
  ])("rejects malformed envelopes instead of silently repairing server writes %j", (fields) => {
    expect(() => validatePersonalStack({ ...stack(), ...fields })).toThrow(PersonalStackValidationError);
  });

  it("rejects malformed selection metadata instead of silently dropping a user's assignment", () => {
    const input = stack(["a"]);
    input.selection.toolEntries[0].needIds = ["missing-need"];
    expect(() => validatePersonalStack(input)).toThrow(PersonalStackValidationError);
    input.selection.toolEntries[0].needIds = [];
    input.selection.needs[0].order = NaN;
    expect(() => validatePersonalStack(input)).toThrow(PersonalStackValidationError);
  });

  it("accepts zero-cost annual choices and supported currencies without changing declared amounts", () => {
    const input = stack(["free", "usd", "gbp"]);
    input.billing.choices = {
      free: { ...choice, amount: 0, period: "annual" },
      usd: { ...choice, currency: "USD", amount: 119.99 },
      gbp: { ...choice, currency: "GBP", amount: 17.5 },
    };
    expect(validatePersonalStack(input).billing.choices).toEqual(input.billing.choices);
  });

  it("fingerprints all personal values independently of object insertion order and set order", () => {
    const input = stack(["a", "b"]);
    input.billing = { paid: ["a", "b"], reviewed: ["b", "a"], choices: { a: choice, b: { ...choice, amount: 7 } } };
    const reordered = JSON.parse(JSON.stringify(input, (_key, value) => value && typeof value === "object" && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).reverse()) : value)) as PersonalStackV4;
    reordered.billing.paid.reverse();
    reordered.billing.reviewed.reverse();
    expect(personalStackFingerprint(reordered)).toBe(personalStackFingerprint(input));
    reordered.billing.choices.a.amount = 43;
    expect(personalStackFingerprint(reordered)).not.toBe(personalStackFingerprint(input));
    expect(personalStackFingerprint(stack(["b", "a"]))).not.toBe(personalStackFingerprint(stack(["a", "b"])));
  });
});

describe("explicit anonymous draft merge", () => {
  it("keeps saved entries and billing, imports declarations only for newly added tools", () => {
    const saved = stack(["a"]);
    saved.billing.choices.a = choice;
    const draft = stack(["a", "b"]);
    draft.selection.toolEntries[0].intent = "wishlist";
    draft.billing = { paid: ["a", "b", "orphan"], reviewed: ["a", "b"], choices: { a: { ...choice, amount: 99 }, b: { ...choice, amount: 7 }, orphan: choice } };
    const savedBefore = JSON.stringify(saved);
    const draftBefore = JSON.stringify(draft);
    const output = mergeAnonymousDraft(saved, draft);
    expect(output.selection.pinnedToolSlugs).toEqual(["a", "b"]);
    expect(output.selection.toolEntries[0].intent).toBe("stack");
    expect(output.billing).toEqual({ paid: ["b"], reviewed: ["b"], choices: { a: choice, b: { ...choice, amount: 7 } } });
    expect(JSON.stringify(saved)).toBe(savedBefore);
    expect(JSON.stringify(draft)).toBe(draftBefore);
  });

  it("remaps colliding custom needs deterministically without overwriting either label or existing draft IDs", () => {
    const saved = stack(["a"]);
    const draft = stack(["b"]);
    saved.selection.needs.push({ id: "custom-work", labelFr: "Travail", labelEn: "Work", source: "custom", order: 90 });
    draft.selection.needs.push({ id: "custom-work", labelFr: "Autre", labelEn: "Other", source: "custom", order: 90 }, { id: "custom-work-2", labelFr: "Libre", labelEn: "Free", source: "custom", order: 100 });
    draft.selection.toolEntries[0].needIds = ["custom-work", "custom-work-2"];
    const merged = mergeAnonymousDraft(saved, draft);
    expect(merged.selection.toolEntries[1].needIds).toEqual(["custom-work-3", "custom-work-2"]);
    expect(merged.selection.needs.find(n => n.id === "custom-work")?.labelFr).toBe("Travail");
    expect(merged.selection.needs.find(n => n.id === "custom-work-3")?.labelFr).toBe("Autre");
    expect(personalStackFingerprint(mergeAnonymousDraft(merged, draft))).toBe(personalStackFingerprint(merged));
  });

  it("only imports decisions consistent with saved pairs and the retained selection", () => {
    const saved = stack(["a"]);
    saved.decisions["a|b"] = { kind: "keep-one", kept: "a", removed: "b", saving: 4, at };
    const draft = stack(["b", "c"]);
    draft.decisions = {
      "b|a": { kind: "keep-one", kept: "b", removed: "a", saving: 8, at },
      "a|c": { kind: "keep-one", kept: "c", removed: "a", saving: 9, at },
      "c|d": { kind: "keep-one", kept: "c", removed: "d", saving: 5, at },
      "a|b": { kind: "keep-both", kept: "a", saving: 0, at },
      "c|x": { kind: "keep-both", kept: "c", saving: 0, at },
    };
    const output = mergeAnonymousDraft(saved, draft);
    expect(output.decisions).toEqual({ "a|b": saved.decisions["a|b"], "c|d": draft.decisions["c|d"] });
  });

  it("resolves duplicate incoming decision pairs consistently regardless of object insertion order", () => {
    const draft = stack(["a"]);
    draft.decisions = {
      "b|a": { kind: "replace", kept: "a", removed: "b", saving: 20, at },
      "a|b": { kind: "keep-one", kept: "a", removed: "b", saving: 10, at },
    };
    const reordered = { ...draft, decisions: Object.fromEntries(Object.entries(draft.decisions).reverse()) };
    expect(personalStackFingerprint(mergeAnonymousDraft(stack(), draft)))
      .toBe(personalStackFingerprint(mergeAnonymousDraft(stack(), reordered)));
  });
});
