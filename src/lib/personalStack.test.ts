import { describe, expect, it } from "vitest";
import {
  mergeAnonymousDraft, normalizePersonalStack, normalizeStoredPersonalStack, personalStackFingerprint,
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
    usage: {},
    trade: null,
    dailyRate: null,
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
    expect(normalizePersonalStack(selection)).toEqual({ version: 4, selection, billing: { paid: [], reviewed: [], choices: {} }, decisions: {}, usage: {}, trade: null, dailyRate: null });
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

  it.each([
    { assignmentMode: ["manual"] }, { assignmentMode: ["auto"] }, { assignmentMode: ["pending"] },
    { assignmentMode: null }, { assignmentMode: 1 }, { assignmentMode: true },
  ])("rejects a non-string assignmentMode $assignmentMode", ({ assignmentMode }) => {
    const input = stack(["a"]);
    const malformed = {
      ...input,
      selection: { ...input.selection, toolEntries: [{ ...input.selection.toolEntries[0], assignmentMode }] },
    };
    expect(() => validatePersonalStack(malformed)).toThrow(PersonalStackValidationError);
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

describe("tool usage levels", () => {
  it("round trips five levels of use and reads a snapshot saved before usage existed as empty", () => {
    const input = stack(["figma", "slack"]);
    input.usage = { figma: 5, slack: 1 };
    expect(validatePersonalStack(JSON.parse(JSON.stringify(input))).usage).toEqual({ figma: 5, slack: 1 });
    const { usage: _, ...older } = input;
    expect(validatePersonalStack(JSON.parse(JSON.stringify(older))).usage).toEqual({});
    expect(normalizeStoredPersonalStack(JSON.parse(JSON.stringify(older))).usage).toEqual({});
  });

  it("recovers valid levels, reads the three earlier words as levels and drops the rest", () => {
    const output = normalizePersonalStack({ ...stack(["a"]), usage: { a: 4, b: "light", c: "normal", d: "full", e: 0, f: 6, g: 2.5, h: "often", "": 3 } });
    expect(output.usage).toEqual({ a: 4, b: 1, c: 3, d: 5 });
    expect(normalizePersonalStack({ ...stack(["a"]), usage: ["a"] }).usage).toEqual({});
  });

  it("rejects a write with a level outside 1 to 5, a fraction, a word or a non-record", () => {
    for (const usage of [{ a: 0 }, { a: 6 }, { a: 2.5 }, { a: "full" }, ["a"], null]) {
      expect(() => validatePersonalStack({ ...stack(["a"]), usage })).toThrow(PersonalStackValidationError);
    }
  });

  it("keeps the account's answers and imports a draft's answers only for its selected, unrated tools", () => {
    const saved = stack(["a", "b"]);
    saved.usage = { a: 2 };
    const draft = stack(["a", "b", "c"]);
    draft.usage = { a: 5, b: 4, c: 1, gone: 3 };
    expect(mergeAnonymousDraft(saved, draft).usage).toEqual({ a: 2, b: 4, c: 1 });
  });

  it("changes the fingerprint when an answer changes", () => {
    const a = stack(["a"]), b = stack(["a"]);
    b.usage = { a: 3 };
    expect(personalStackFingerprint(a)).not.toBe(personalStackFingerprint(b));
  });
});

describe("explicit anonymous draft merge", () => {
  it("explicitly fills unrecorded legacy billing while preserving recorded free and chosen plans", () => {
    const saved = stack(["legacy", "free", "paid", "chosen", "paid-free"]);
    saved.billing.reviewed = ["free"];
    saved.billing.paid = ["paid", "paid-free"];
    saved.billing.choices.chosen = choice;
    const draft = stack(["legacy", "free", "paid", "chosen", "paid-free"]);
    draft.billing = { paid: ["legacy", "free", "paid", "chosen"], reviewed: ["legacy", "free", "paid", "chosen", "paid-free"], choices: {
      legacy: { ...choice, amount: 12 }, free: { ...choice, amount: 99 },
      paid: { ...choice, amount: 25 }, chosen: { ...choice, amount: 77 }, "paid-free": { ...choice, amount: 0 },
    } };
    const merged = mergeAnonymousDraft(saved, draft);
    expect(merged.billing.paid).toEqual(["paid", "paid-free", "legacy"]);
    expect(merged.billing.choices).toEqual({ legacy: draft.billing.choices.legacy, paid: draft.billing.choices.paid, chosen: choice });
    expect(merged.billing.reviewed).toEqual(["free", "legacy"]);
  });

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


describe("stored personal stack recognition", () => {
  it.each([
    null, [[]], {}, { version: 3 }, { version: 5, pinnedToolSlugs: [] },
    { version: 3, pinnedToolSlugs: null }, { version: 3, toolEntries: {} },
    { version: 4, selection: null }, { version: 4, selection: {} },
    { ...stack(), selection: { ...stack().selection, version: 5 } },
    { ...stack(), selection: { ...stack().selection, needs: null } },
    { ...stack(), billing: null }, { ...stack(), billing: { paid: [], reviewed: [], choices: [] } },
    { ...stack(), decisions: null },
  ])("rejects an unrecognizable stored source %j rather than claiming an empty stack", input => {
    expect(() => normalizeStoredPersonalStack(input)).toThrow();
  });

  it.each([
    { version: 3, pinnedToolSlugs: [] }, { pinnedToolSlugs: [] },
    { version: 3, toolEntries: [] }, stack().selection, stack(),
  ])("accepts a genuine empty stored selection %j", input => {
    expect(normalizeStoredPersonalStack(input).selection.toolEntries).toEqual([]);
  });

  it("recovers recognized legacy references individually without catalogue lookup or source rewriting", () => {
    const input = { version: 3, pinnedToolSlugs: ["unknown-json-reference", null, " padded-reference ", "unknown-json-reference"] };
    const before = JSON.stringify(input);
    const output = normalizeStoredPersonalStack(input);
    expect(output.selection.pinnedToolSlugs).toEqual(["unknown-json-reference", " padded-reference "]);
    expect(output.billing).toEqual({ paid: [], reviewed: [], choices: {} });
    expect(JSON.stringify(input)).toBe(before);
  });
});

describe("trade", () => {
  it("round trips a known trade, reads older snapshots as null and rejects unknown values", () => {
    const input = stack(["a"]);
    expect(validatePersonalStack(JSON.parse(JSON.stringify({ ...input, trade: "designer" }))).trade).toBe("designer");
    expect(validatePersonalStack(JSON.parse(JSON.stringify({ ...input, trade: null }))).trade).toBeNull();
    const { trade: _, ...older } = input;
    expect(validatePersonalStack(JSON.parse(JSON.stringify(older))).trade).toBeNull();
    expect(() => validatePersonalStack({ ...input, trade: "astronaut" })).toThrow();
    expect(() => validatePersonalStack({ ...input, trade: 3 })).toThrow();
    expect(normalizePersonalStack({ ...input, trade: "astronaut" }).trade).toBeNull();
  });
  it("keeps the account's trade when merging a draft, and takes the draft's when the account has none", () => {
    expect(mergeAnonymousDraft({ ...stack(["a"]), trade: "ops" }, { ...stack(["b"]), trade: "dev" }).trade).toBe("ops");
    expect(mergeAnonymousDraft(stack(["a"]), { ...stack(["b"]), trade: "dev" }).trade).toBe("dev");
  });
});

describe("daily rate", () => {
  it("round trips a rate, reads older snapshots as null and rejects invalid values", () => {
    const input = stack(["a"]);
    expect(validatePersonalStack(JSON.parse(JSON.stringify({ ...input, dailyRate: { amount: 450, currency: "EUR" } }))).dailyRate).toEqual({ amount: 450, currency: "EUR" });
    const { dailyRate: _, ...older } = input;
    expect(validatePersonalStack(JSON.parse(JSON.stringify(older))).dailyRate).toBeNull();
    for (const bad of [{ amount: 0, currency: "EUR" }, { amount: 100001, currency: "EUR" }, { amount: "450", currency: "EUR" }, { amount: 450, currency: "JPY" }, 450]) {
      expect(() => validatePersonalStack({ ...input, dailyRate: bad })).toThrow();
    }
  });
  it("keeps the account's rate when merging a draft", () => {
    const rate = { amount: 500, currency: "EUR" as const };
    expect(mergeAnonymousDraft({ ...stack(["a"]), dailyRate: rate }, { ...stack(["b"]), dailyRate: { amount: 300, currency: "USD" } }).dailyRate).toEqual(rate);
    expect(mergeAnonymousDraft(stack(["a"]), { ...stack(["b"]), dailyRate: rate }).dailyRate).toEqual(rate);
  });
});
