import * as v from "valibot";

export const decimalAmount = v.pipe(v.string(), v.regex(/^\d{1,12}(?:\.\d{1,6})?$/));
export const identifier = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/));

export const publicUrl = v.pipe(v.string(), v.maxLength(2048), v.check((value) => {
  if (!/^https?:\/\//i.test(value) || /[\s\\]/u.test(value)) return false;
  try {
    const url = new URL(value);
    return !url.username && !url.password;
  } catch {
    return false;
  }
}));

const observationDate = v.pipe(v.string(), v.check((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    && date.toISOString().slice(0, 10) === value
    && value <= new Date().toISOString().slice(0, 10);
}));

export const priceOptionSchema = v.strictObject({
  id: identifier,
  type: v.picklist(["free", "paid", "quote", "usage", "unknown"]),
  amount: v.nullable(decimalAmount),
  currency: v.nullable(v.pipe(v.string(), v.regex(/^[A-Z]{3}$/))),
  period: v.nullable(v.picklist(["month", "year", "one_time", "usage"])),
  unit: v.nullable(v.pipe(v.string(), v.maxLength(80))),
  commitment: v.nullable(v.picklist(["none", "monthly", "annual_prepaid"])),
  tax: v.picklist(["included", "excluded", "unknown"]),
  market: v.nullable(v.pipe(v.string(), v.regex(/^[A-Z]{2}$/))),
  offerLocale: v.nullable(v.pipe(v.string(), v.regex(/^[a-z]{2,3}(?:-[A-Z]{2})?$/))),
  sourceUrl: v.nullable(publicUrl),
  observedOn: v.nullable(observationDate),
});

export type PriceOption = v.InferOutput<typeof priceOptionSchema>;

function annualToMonthly(amount: string): string {
  const [whole, fraction = ""] = amount.split(".");
  const micros = BigInt(whole + fraction.padEnd(6, "0"));
  const rounded = ((micros + 6n) / 12n).toString().padStart(7, "0");
  const tail = rounded.slice(-6).replace(/0+$/, "");
  return rounded.slice(0, -6) + (tail ? "." + tail : "");
}

const labels = {
  en: { free: "Free", quote: "Contact for pricing", usage: "Usage based", unknown: "Price unavailable",
    month: "per month", year: "per year", one_time: "one-time payment", annual_prepaid: "per month, billed yearly" },
  fr: { free: "Gratuit", quote: "Sur devis", usage: "Selon l’utilisation", unknown: "Prix non renseigné",
    month: "par mois", year: "par an", one_time: "paiement unique", annual_prepaid: "par mois, facturé à l’année" },
};

export function pricePresentation(option: PriceOption, locale: "fr" | "en") {
  const copy = labels[locale];
  if (option.type !== "paid") {
    return { amountLabel: copy[option.type], billingLabel: "", monthlyEquivalent: null };
  }
  const { amount, currency, period } = option;
  if (!amount || !currency || !period || period === "usage") {
    return { amountLabel: copy.unknown, billingLabel: "", monthlyEquivalent: null };
  }
  const [whole, fraction = ""] = amount.split(".");
  const language = locale === "en" ? "en-IE" : "fr-FR";
  const currencyDigits = new Intl.NumberFormat(language, { style: "currency", currency })
    .resolvedOptions().minimumFractionDigits ?? 0;
  const digits = Math.max(currencyDigits, fraction.length);
  const formatter = new Intl.NumberFormat(language, {
    style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits,
  });
  // Format the integer and inject the exact decimal digits.
  const amountLabel = formatter.formatToParts(BigInt(whole)).map((part) =>
    part.type === "fraction" ? fraction.padEnd(digits, "0") : part.value,
  ).join("");
  return {
    amountLabel,
    billingLabel: period === "month" && option.commitment === "annual_prepaid"
      ? copy.annual_prepaid : copy[period],
    monthlyEquivalent: period === "year" ? annualToMonthly(amount) : period === "month" ? amount : null,
  };
}
