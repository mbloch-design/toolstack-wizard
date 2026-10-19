import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Hand-written `seo.*Title*` / `seo.*MetaDescription*` overrides win over the
 * templates of src/lib/toolSeo.ts, so a stale amount in one of them is served
 * as is. On 19/10/2026, 42 of them did: ZBrush, Cinema 4D, Maxon One,
 * Redshift and Red Giant quoted yearly totals in euros for plans published in
 * dollars, and GitLens « Pro at $10/mo » against a verified 8 €.
 *
 * Every amount an override quotes must exist in the tool's verified plans
 * (monthly, yearly or its monthly equivalent), in the plan's own currency.
 */
type Plan = { nativeAmount?: number | null; nativeCurrency?: string | null };
type Tool = {
  slug?: string;
  id?: string;
  seo?: Record<string, unknown>;
  pricing_v5?: { plans?: Plan[] };
  pricing_v5En?: { plans?: Plan[] };
};

const tools = JSON.parse(readFileSync("src/data/tools_v4.json", "utf8")) as Tool[];
const AMOUNT = /(?:([€$£])\s?(\d[\d\s.,]*\d|\d))|(?:(\d[\d\s.,]*\d|\d)\s?([€$£]|EUR|USD))/g;
const CURRENCY: Record<string, string> = { "€": "EUR", EUR: "EUR", $: "USD", USD: "USD", "£": "GBP" };

/** « 1 390,80 », « 1,390.80 », « 430.80 » → 1390.8 / 430.8. */
function parseAmount(raw: string): number {
  const compact = raw.replace(/\s/g, "");
  const decimal = /[.,](\d{1,2})$/.exec(compact);
  const whole = (decimal ? compact.slice(0, -decimal[0].length) : compact).replace(/[.,]/g, "");
  return Number(decimal ? `${whole}.${decimal[1]}` : whole);
}

describe("SEO overrides quoting a price", () => {
  it("quote an amount and a currency taken from the verified plans", () => {
    const offenders: string[] = [];
    for (const tool of tools) {
      const plans = [...(tool.pricing_v5?.plans || []), ...(tool.pricing_v5En?.plans || [])]
        .filter((plan) => plan.nativeAmount != null);
      const amounts = plans.flatMap((plan) => {
        const value = Number(plan.nativeAmount);
        return [value, value * 12, value / 12].map((x) => ({ value: Math.round(x * 100) / 100, currency: plan.nativeCurrency }));
      });
      for (const [key, value] of Object.entries(tool.seo || {})) {
        if (!/(Title|MetaDescription)(Fr|En)$/.test(key) || typeof value !== "string") continue;
        for (const match of value.matchAll(AMOUNT)) {
          const currency = CURRENCY[match[1] || match[4]];
          const amount = parseAmount(match[2] || match[3]);
          const known = amounts.some((entry) => entry.currency === currency && Math.abs(entry.value - amount) < 0.02);
          if (!known) offenders.push(`${tool.slug || tool.id} ${key}: « ${match[0].trim()} »`);
        }
      }
    }
    expect(offenders, "montant ou devise absents de la grille vérifiée : corriger la donnée ou retirer la surcharge").toEqual([]);
  });
});
