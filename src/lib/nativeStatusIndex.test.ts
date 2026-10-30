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
      ]),
    );
    execFileSync(process.execPath, [resolve("scripts/gen-tools-index.mjs")], {
      cwd: root,
    });
    const [quote, paid, legacy, free] = JSON.parse(
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
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
