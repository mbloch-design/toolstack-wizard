import { formatAmount } from "@/lib/currencyRates";
import type { BudgetProps, BudgetTool } from "./Budget";

type Lang = BudgetProps["lang"];
/** Monthly amount: a number, 0 for a free tool, null for a price not known yet. */
type Line = [name: string, slug: string | undefined, monthly: number | null];

/** Amounts written by the site's own formatter. */
const money = (lang: Lang, currency: "EUR" | "USD", amount: number) => formatAmount(amount, currency, lang);

/** A stack from real catalogue tools, most expensive first, as the page sorts them. */
function stack(lang: Lang, lines: Line[], { currency = "EUR", unsure = { prices: 0, plans: 0 }, rateDate = null }: { currency?: "EUR" | "USD"; unsure?: BudgetProps["unsure"]; rateDate?: string | null } = {}): BudgetProps {
  const sorted = [...lines].sort((a, b) => (b[2] ?? 0) - (a[2] ?? 0));
  const tools: BudgetTool[] = sorted.map(([name, slug, monthly]) => ({ id: slug ?? name, name, slug, paid: monthly === null ? null : monthly > 0 }));
  const total = sorted.reduce((sum, [, , monthly]) => sum + (monthly ?? 0), 0);
  const [leadName, , leadAmount] = sorted[0];
  return {
    lang, tools, unsure, rateDate,
    // The macro view rounds to whole units, as the page will: no cents after a conversion.
    monthly: total > 0 ? money(lang, currency, Math.round(total)) : null,
    yearly: total > 0 ? money(lang, currency, Math.round(total * 12)) : null,
    lead: total > 0 && leadAmount ? { name: leadName, share: Math.round((leadAmount / total) * 100) } : null,
  };
}

const TWELVE: Line[] = [
  ["Notion", "notion", 36], ["Figma", "figma", 15], ["Canva", "canva", 12], ["ChatGPT", "chatgpt", 20],
  ["Airtable", "airtable", 24], ["Calendly", "calendly", 10], ["Loom", "loom", 15], ["Mailchimp", "mailchimp", 13],
  ["Make", "make", 9], ["n8n", "n8n", 0], ["Pipedrive", "pipedrive", 14], ["Stripe", "stripe", 0],
];

/** Every state the card must hold, from the worst data first. */
export const budgetStates = {
  one: (lang: Lang) => stack(lang, [["Vercel", "vercel", 100]], { currency: "USD" }),
  three: (lang: Lang) => stack(lang, [["Notion", "notion", 36], ["Figma", "figma", 15], ["Slack", "slack", 8]]),
  twelve: (lang: Lang) => stack(lang, TWELVE),
  longNames: (lang: Lang) => stack(lang, [["Microsoft Dynamics 365 Finance and Operations", undefined, 180], ["CallTrackingMetrics", undefined, 79], ["Notion", "notion", 36]]),
  partial: (lang: Lang) => stack(lang, [["Notion", "notion", 36], ["Figma", "figma", null], ["Canva", "canva", null], ["Airtable", "airtable", null], ["Loom", "loom", 15]], { unsure: { prices: 2, plans: 1 } }),
  nothingKnown: (lang: Lang) => stack(lang, [["Notion", "notion", null], ["Figma", "figma", null], ["Canva", "canva", null]], { unsure: { prices: 2, plans: 1 } }),
  converted: (lang: Lang) => stack(lang, [["Adobe Illustrator", "adobe-illustrator", 19.75], ["Adobe Photoshop", "adobe-photoshop", 17.17], ["Figma", "figma", 13.74]], { rateDate: lang === "fr" ? "27 août 2026" : "27 August 2026" }),
  dollars: (lang: Lang) => stack(lang, [["Vercel", "vercel", 20], ["Supabase", "supabase", 25], ["Stripe", "stripe", 0]], { currency: "USD" }),
  bigAmounts: (lang: Lang) => stack(lang, [["Microsoft Dynamics 365 Finance and Operations", undefined, 1100], ["Notion", "notion", 149]]),
} satisfies Record<string, (lang: Lang) => BudgetProps>;
