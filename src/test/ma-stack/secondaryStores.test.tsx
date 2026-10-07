// @vitest-environment jsdom
import * as React from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";
import * as decisionLibrary from "@/lib/stackDecisions";
import type { useStackPaidPlans } from "@/hooks/useStackPaidPlans";
import type { useStackDecisions } from "@/hooks/useStackDecisions";

const PAID = "tooltrim-ma-stack-paid-plans-v1";
const REVIEWED = "tooltrim-ma-stack-freemium-reviewed-v1";
const DECISIONS = "tooltrim-ma-stack-decisions-v1";
const keptBoth = { kind: "keep-both", kept: "notion", saving: 0, at: "2026-10-07T00:00:00Z" };

function contexts() {
  const values = new Map<string, string>();
  let blocked = false;
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem(key: string, value: string) { if (blocked) throw new Error("blocked"); values.set(key, value); },
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  };
  function tab() {
    const listeners = new Set<(event: { key: string | null; storageArea: unknown }) => void>();
    const toasts: Array<{ action: { onClick: () => void } }> = [];
    const pins: string[] = [];
    const browser = {
      localStorage: storage,
      addEventListener: (_type: string, listener: (event: { key: string | null; storageArea: unknown }) => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: (event: { key: string | null; storageArea: unknown }) => void) => listeners.delete(listener),
    };
    function load(file: string) {
      const exports: Record<string, unknown> = {};
      const javascript = ts.transpileModule(readFileSync(resolve(process.cwd(), "src/hooks", file), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      }).outputText;
      runInNewContext(javascript, {
        exports, window: browser,
        require(id: string) {
          if (id === "react") return React;
          if (id === "sonner") return { toast: (_message: unknown, options: typeof toasts[number]) => toasts.push(options) };
          if (id === "@/lib/stackDecisions") return decisionLibrary;
          if (id === "@/lib/analytics") return { trackEvent() {} };
          if (id === "@/hooks/useStackPins") return { useStackPins: () => ({
            state: { toolEntries: [{ toolSlug: "canva" }] },
            pinTool: (slug: string) => pins.push(`pin:${slug}`),
            unpinTool: (slug: string) => pins.push(`remove:${slug}`),
            restoreTool: (entry: { toolSlug: string }) => pins.push(`restore:${entry.toolSlug}`),
          }) };
          throw new Error(`Unexpected dependency: ${id}`);
        },
      });
      return exports;
    }
    return {
      paid: load("useStackPaidPlans.ts").useStackPaidPlans as typeof useStackPaidPlans,
      decisions: load("useStackDecisions.ts").useStackDecisions as typeof useStackDecisions,
      notify: (key: string | null, storageArea: unknown = storage) => listeners.forEach(listener => listener({ key, storageArea })),
      toasts, pins,
    };
  }
  return { storage, a: tab(), b: tab(), blockWrites: () => { blocked = true; } };
}

const t = (fr: string) => fr;
afterEach(cleanup);

describe("Ma stack secondary stores across tabs", () => {
  it("updates paid/reviewed choices from storage events and preserves remote choices on writes", () => {
    const { a, b, storage } = contexts();
    const hookA = renderHook(a.paid);
    const hookB = renderHook(b.paid);
    act(() => { hookB.result.current.setPaid("notion", true); hookB.result.current.markReviewed(["notion"]); a.notify(PAID); a.notify(REVIEWED); });
    expect(hookA.result.current.isPaid("notion")).toBe(true);
    expect(hookA.result.current.isReviewed("notion")).toBe(true);
    act(() => { hookA.result.current.setPaid("figma", true); hookA.result.current.markReviewed(["figma"]); b.notify(PAID); b.notify(REVIEWED); });
    expect(hookB.result.current.paid).toEqual(["notion", "figma"]);
    expect(JSON.parse(storage.getItem(REVIEWED)!)).toEqual(["notion", "figma"]);
  });

  it("rereads paid/reviewed persistence before a mutation even when the remote event is delayed", () => {
    const { a, b, storage } = contexts();
    const hookA = renderHook(a.paid);
    const hookB = renderHook(b.paid);
    act(() => { hookB.result.current.setPaid("notion", true); hookB.result.current.markReviewed(["notion"]); });
    act(() => { hookA.result.current.setPaid("figma", true); hookA.result.current.markReviewed(["figma"]); });
    expect(JSON.parse(storage.getItem(PAID)!)).toEqual(["notion", "figma"]);
    expect(JSON.parse(storage.getItem(REVIEWED)!)).toEqual(["notion", "figma"]);
  });

  it("notifies every subscriber even if one rerender already refreshed the cached snapshot", () => {
    const { a, storage } = contexts();
    const first = renderHook(a.paid);
    const second = renderHook(a.paid);
    const firstDecisions = renderHook(() => a.decisions(t, String, "EUR"));
    const secondDecisions = renderHook(() => a.decisions(t, String, "EUR"));
    storage.setItem(PAID, JSON.stringify(["notion"]));
    storage.setItem(DECISIONS, JSON.stringify({ "notion|obsidian": keptBoth }));
    first.rerender(); firstDecisions.rerender();
    act(() => { a.notify(PAID); a.notify(DECISIONS); });
    expect(second.result.current.paid).toEqual(["notion"]);
    expect(secondDecisions.result.current.decisions).toHaveProperty("notion|obsidian");
  });

  it("refreshes decisions across tabs and preserves another pair during decide and undo", () => {
    const { a, b, storage } = contexts();
    const hookA = renderHook(() => a.decisions(t, String, "EUR"));
    const hookB = renderHook(() => b.decisions(t, String, "USD"));
    act(() => { hookB.result.current.decide("keep-both", { slug: "notion", name: "Notion" }, { slug: "obsidian", name: "Obsidian" }, 0, "stack"); a.notify(DECISIONS); });
    expect(hookA.result.current.decisions["notion|obsidian"]).toMatchObject({ kind: "keep-both" });
    act(() => { hookA.result.current.decide("replace", { slug: "figma", name: "Figma" }, { slug: "canva", name: "Canva" }, 9, "compare"); });
    expect(JSON.parse(storage.getItem(DECISIONS)!)).toHaveProperty("notion|obsidian");
    expect(a.pins).toEqual(["pin:figma", "remove:canva"]);
    act(() => { a.toasts.at(-1)!.action.onClick(); b.notify(DECISIONS); });
    expect(a.pins).toEqual(["pin:figma", "remove:canva", "restore:canva", "remove:figma"]);
    expect(hookB.result.current.decisions).toHaveProperty("notion|obsidian");
    expect(hookB.result.current.decisions).not.toHaveProperty("canva|figma");
  });

  it("rereads decisions before writes and reopen when a storage event has not arrived", () => {
    const { a, b, storage } = contexts();
    const hookA = renderHook(() => a.decisions(t, String, "EUR"));
    const hookB = renderHook(() => b.decisions(t, String, "USD"));
    act(() => hookB.result.current.decide("keep-both", { slug: "notion", name: "Notion" }, { slug: "obsidian", name: "Obsidian" }, 0, "stack"));
    act(() => hookA.result.current.decide("keep-both", { slug: "figma", name: "Figma" }, { slug: "canva", name: "Canva" }, 0, "stack"));
    expect(JSON.parse(storage.getItem(DECISIONS)!)).toHaveProperty("notion|obsidian");
    act(() => hookB.result.current.reopen("notion", "obsidian"));
    expect(JSON.parse(storage.getItem(DECISIONS)!)).toHaveProperty("canva|figma");
  });

  it("filters corrupt individual decisions while preserving valid and legacy amounts", () => {
    const { a, storage } = contexts();
    storage.setItem(DECISIONS, JSON.stringify({
      "notion|obsidian": keptBoth,
      "canva|figma": { kind: "keep-one", kept: "figma", removed: "canva", saving: 9, at: "2026-10-07T00:00:00Z" },
      nullRecord: null, array: [], invalidKind: { ...keptBoth, kind: "surprise" }, negative: { ...keptBoth, saving: -1 },
      missingRemoved: { ...keptBoth, kind: "replace" }, invalidCurrency: { ...keptBoth, savingCurrency: "XYZ" }, missingKept: { ...keptBoth, kept: "" },
    }));
    const { result } = renderHook(() => a.decisions(t, String, "EUR"));
    expect(Object.keys(result.current.decisions)).toEqual(["notion|obsidian", "canva|figma"]);
    expect(decisionLibrary.decisionSavingInCurrency(result.current.decisions["canva|figma"], "USD")).toBeNull();
    act(() => { storage.setItem(DECISIONS, "not-json"); a.notify(DECISIONS); });
    expect(result.current.decisions).toEqual({});
  });

  it("keeps snapshots stable on rerender and unrelated events, and responds to clear", () => {
    const { a, storage } = contexts();
    const paid = renderHook(a.paid);
    const decisions = renderHook(() => a.decisions(t, String, "EUR"));
    act(() => { paid.result.current.setPaid("notion", true); decisions.result.current.decide("keep-both", { slug: "notion", name: "Notion" }, { slug: "obsidian", name: "Obsidian" }, 0, "stack"); });
    const paidSnapshot = paid.result.current.paid;
    const decisionsSnapshot = decisions.result.current.decisions;
    act(() => { a.notify("unrelated"); a.notify(PAID, {}); a.notify(DECISIONS, {}); });
    paid.rerender(); decisions.rerender();
    expect(paid.result.current.paid).toBe(paidSnapshot);
    expect(decisions.result.current.decisions).toBe(decisionsSnapshot);
    act(() => { storage.clear(); a.notify(null); });
    expect(paid.result.current.paid).toEqual([]);
    expect(decisions.result.current.decisions).toEqual({});
  });

  it("keeps session choices when persistence is blocked", () => {
    const { a, blockWrites } = contexts();
    const paid = renderHook(a.paid);
    const decisions = renderHook(() => a.decisions(t, String, "EUR"));
    blockWrites();
    act(() => { paid.result.current.setPaid("notion", true); paid.result.current.setPaid("figma", true); decisions.result.current.decide("keep-both", { slug: "notion", name: "Notion" }, { slug: "obsidian", name: "Obsidian" }, 0, "stack"); });
    paid.rerender(); decisions.rerender();
    expect(paid.result.current.paid).toEqual(["notion", "figma"]);
    expect(decisions.result.current.decisions).toHaveProperty("notion|obsidian");
  });
});
