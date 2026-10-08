import { describe, expect, it } from "vitest";
import { monthlyFromChoice } from "@/lib/stackCost";

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
  it("rejects an empty amount or an unsupported currency", () => {
    expect(monthlyFromChoice({ source: "custom", amount: 0, currency: "EUR", period: "monthly" })).toBeNull();
    expect(monthlyFromChoice({ source: "custom", amount: 10, currency: "INR" as never, period: "monthly" })).toBeNull();
  });
});
