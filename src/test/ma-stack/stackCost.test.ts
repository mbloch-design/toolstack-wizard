// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { monthlyFromChoice, toolMonthlyCost } from "@/lib/stackCost";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { updatePersonalStack } from "@/lib/personalStackStore";
import toolsIndex from "@/data/tools_index.json";

const tool = (slug: string, extra: Partial<ToolSummary> = {}) => ({
  id: slug, slug, name: slug, categoryId: "ia", pricing: { free: "", paid: "" }, ...extra,
} as ToolSummary);

describe("attested prices shared with tool pages", () => {
  it.each(["claude", "perplexity"])("keeps %s free until declared paid, then uses its attested monthly price", (slug) => {
    const item = tool(slug);
    expect(toolMonthlyCost(item, () => false, "en")).toEqual({ kind: "freemium-free" });
    expect(toolMonthlyCost(item, () => true, "en")).toEqual({ kind: "paid", monthly: 20, currency: "USD", declared: true, source: "catalog" });
  });
  it("resolves the actual Claude and Perplexity catalogue records despite their missing plan grids", () => {
    for (const slug of ["claude", "perplexity"]) {
      const item = toolsIndex.find((item) => item.slug === slug) as ToolSummary;
      expect(item).toBeTruthy();
      expect(toolMonthlyCost(item, () => false, "en")).toEqual({ kind: "freemium-free" });
      expect(toolMonthlyCost(item, () => true, "en")).toMatchObject({ kind: "paid", monthly: 20, currency: "USD" });
    }
  });
  it("prefers the canonical annual plan over the older monthly fallback", () => {
    const item = tool("perplexity", { pricing: { free: "Free", paid: "Pro" }, nativePrices: [{ amount: 240, currency: "EUR", period: "annual" }] });
    expect(toolMonthlyCost(item, () => true, "fr")).toEqual({ kind: "paid", monthly: 20, currency: "EUR", declared: true, source: "catalog" });
  });
  it("never replaces an undisclosed price or a one-time plan with the older fallback", () => {
    expect(toolMonthlyCost(tool("claude", { priceUndisclosed: true }), () => true, "en")).toEqual({ kind: "unknown" });
    expect(toolMonthlyCost(tool("claude", { nativePrices: [{ amount: 100, currency: "USD", period: "once" }] }), () => true, "en")).toEqual({ kind: "unknown" });
  });
  it("does not infer an amount from editorial pricing or a normalized euro amount", () => {
    expect(toolMonthlyCost(tool("not-in-attested-prices", { defaultMonthlyPrice: 20, pricing: { free: "", paid: "$20/month" } }), () => true, "en")).toEqual({ kind: "unknown" });
  });
});

describe("monthlyFromChoice", () => {
  it("keeps a monthly amount as is", () => {
    expect(monthlyFromChoice({ source: "custom", amount: 8.75, currency: "EUR", period: "monthly" })).toBe(8.75);
  });
  it("spreads an annual amount over twelve months", () => {
    expect(monthlyFromChoice({ source: "custom", amount: 120, currency: "USD", period: "annual" })).toBe(10);
  });
  it("multiplies a per-user plan by its seats", () => {
    expect(monthlyFromChoice({ source: "plan", label: "Business", amount: 15, currency: "EUR", period: "monthly", perSeat: true, seats: 3 })).toBe(45);
    expect(monthlyFromChoice({ source: "plan", label: "Team", amount: 144, currency: "USD", period: "annual", perSeat: true, seats: 2 })).toBe(24);
  });
  it("ignores seats on a flat plan and never goes below one seat", () => {
    expect(monthlyFromChoice({ source: "plan", amount: 20, currency: "EUR", period: "monthly", seats: 5 })).toBe(20);
    expect(monthlyFromChoice({ source: "plan", amount: 20, currency: "EUR", period: "monthly", perSeat: true, seats: 0 })).toBe(20);
  });
  it("honors an explicit free choice instead of falling back to the catalogue", () => {
    updatePersonalStack(current => ({ ...current, billing: { ...current.billing, choices: { claude: { source: "custom", amount: 0, currency: "EUR", period: "monthly" } } } }));
    expect(toolMonthlyCost(tool("claude"), () => true, "en")).toEqual({ kind: "free" });
  });
  afterEach(() => updatePersonalStack(current => ({ ...current, billing: { ...current.billing, choices: {} } })));
  it("accepts explicit zero monthly and annual amounts", () => {
    expect(monthlyFromChoice({ source: "custom", amount: 0, currency: "EUR", period: "monthly" })).toBe(0);
    expect(monthlyFromChoice({ source: "plan", amount: 0, currency: "USD", period: "annual", perSeat: true, seats: 3 })).toBe(0);
  });
  it.each([-1, NaN, Infinity, -Infinity])("rejects invalid amount %s", amount => {
    expect(monthlyFromChoice({ source: "custom", amount, currency: "EUR", period: "monthly" })).toBeNull();
  });
  it("rejects an unsupported currency", () => {
    expect(monthlyFromChoice({ source: "custom", amount: 10, currency: "INR" as never, period: "monthly" })).toBeNull();
  });
});
