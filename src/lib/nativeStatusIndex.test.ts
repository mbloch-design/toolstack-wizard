import { expect, it } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { mapToolFromJson } from "./toolFromJson";
import { toolPriceFacts } from "./toolSeo";
import { toolPriceLine } from "./toolPriceLine";
import { hasFreePlan } from "./catalogFilters";
it("builds light public prices from explicit intent and extended periods without legacy fallthrough", () => {
  const root = mkdtempSync(resolve(tmpdir(), "tooltrim-index-intent-"));
  try {
    mkdirSync(resolve(root, "src/data"), { recursive: true });
    const fixture = (
      id: string,
      status?: string,
      amount: number | null = null,
      period = "monthly",
    ) => ({
      id,
      slug: id,
      name: id,
      defaultMonthlyPrice: 999,
      pricing_v5: {
        compare_price_monthly_eur: 999,
        plans: [
          {
            planKey: "p",
            displayName: "Current",
            nativeAmount: amount,
            nativeCurrency: "EUR",
            billingPeriod: period,
            isComparePlan: true,
            isFree: false,
            ...(status ? { priceStatus: status } : {}),
          },
        ],
      },
    });
    writeFileSync(
      resolve(root, "src/data/tools_v4.json"),
      JSON.stringify([
        fixture("quote", "quote", 0),
        fixture("paid", "paid", 240, "year"),
        fixture("legacy", undefined, 12),
        {
          ...fixture("free", "free", 0),
          pricing: { free: "", paid: "Old paid" },
        },
        fixture("unknown", "unknown", null),
        fixture("usage", "usage", 12, "usage"),
        fixture("once", "paid", 120, "one_time"),
        {
          ...fixture("dollars", "paid", 120, "year"),
          pricing_v5: {
            plans: [
              {
                ...fixture("x", "paid", 120, "year").pricing_v5.plans[0],
                nativeCurrency: "USD",
              },
            ],
          },
        },
      ]),
    );
    execFileSync(process.execPath, [resolve("scripts/gen-tools-index.mjs")], {
      cwd: root,
    });
    const [quote, paid, legacy, free, unknown, usage, once, dollars] =
      JSON.parse(
        readFileSync(resolve(root, "src/data/tools_index.json"), "utf8"),
      );
    expect(quote.priceUndisclosed).toBe(true);
    expect(quote.hasConfirmedFreePlan).toBe(false);
    expect(quote.nativePrices).toBeUndefined();
    expect(quote.compareMonthlyPrice).toBe(0);
    expect(quote.defaultMonthlyPrice).toBeUndefined();
    expect(paid.compareMonthlyPrice).toBe(20);
    expect(paid.nativePrices).toEqual([
      { amount: 240, currency: "EUR", period: "annual" },
    ]);
    expect(free.hasConfirmedFreePlan).toBe(true);
    expect(free.compareMonthlyPrice).toBe(0);
    expect(legacy.compareMonthlyPrice).toBe(999);
    expect(legacy.defaultMonthlyPrice).toBe(999);
    for (const row of [unknown, usage]) {
      expect(row.priceUndisclosed).toBe(true);
      expect(row.compareMonthlyPrice).toBe(0);
      expect(row.nativePrices).toBeUndefined();
      expect(row.defaultMonthlyPrice).toBeUndefined();
      expect(hasFreePlan(row)).toBe(false);
    }
    expect(once.nativePrices).toEqual([
      { amount: 120, currency: "EUR", period: "once" },
    ]);
    expect(dollars.nativePrices).toEqual([
      { amount: 120, currency: "USD", period: "annual" },
    ]);
    expect(dollars.compareMonthlyPrice).toBeUndefined();
    expect(dollars.defaultMonthlyPrice).toBeUndefined();
    const inputs = JSON.parse(
      readFileSync(resolve(root, "src/data/tools_v4.json"), "utf8"),
    );
    for (const index of [0, 4, 5]) {
      const mapped = mapToolFromJson(inputs[index]);
      expect(toolPriceFacts(mapped).hasPrice).toBe(false);
      expect(toolPriceLine(mapped, "en", (_, en) => en).priceLine).not.toMatch(
        /999|Free/,
      );
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it("retains absent-status foreign currency native entries in the generated index", () => {
  const root = mkdtempSync(resolve(tmpdir(), "tooltrim-native-legacy-"));
  try {
    mkdirSync(resolve(root, "src/data"), { recursive: true });
    writeFileSync(
      resolve(root, "src/data/tools_v4.json"),
      JSON.stringify([
        {
          id: "cad-legacy",
          slug: "cad-legacy",
          name: "CAD legacy",
          pricing_v5: {
            plans: [
              {
                planKey: "cad",
                isComparePlan: true,
                nativeAmount: 120,
                nativeCurrency: "CAD",
                billingPeriod: "monthly",
              },
            ],
          },
        },
      ]),
    );
    execFileSync(process.execPath, [resolve("scripts/gen-tools-index.mjs")], {
      cwd: root,
    });
    const [row] = JSON.parse(
      readFileSync(resolve(root, "src/data/tools_index.json"), "utf8"),
    );
    expect(row.nativePrices).toEqual([
      { amount: 120, currency: "CAD", period: "monthly" },
    ]);
    expect(row).not.toHaveProperty("hasConfirmedFreePlan");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
