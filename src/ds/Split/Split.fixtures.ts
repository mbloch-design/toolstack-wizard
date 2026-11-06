import { formatAmount } from "@/lib/currencyRates";
import type { SplitArea, SplitProps } from "./Split";

type Lang = SplitProps["lang"];
type Tool = [name: string, slug: string | undefined, monthly: number];
type Area = [label: [fr: string, en: string], tools: Tool[]];

/** Areas from real catalogue tools, coloured in the page's order. */
function split(lang: Lang, list: Area[], { currency = "EUR", unpriced = 0, converted = false, review = 0 }: { currency?: "EUR" | "USD"; unpriced?: number; converted?: boolean; review?: number } = {}): SplitProps {
  const areas: SplitArea[] = list.map(([label, tools], index) => ({
    id: label[1].toLowerCase(),
    label: lang === "fr" ? label[0] : label[1],
    color: `var(--tt-area-${index + 1})`,
    amount: tools.reduce((sum, [, , monthly]) => sum + monthly, 0),
    tools: tools.map(([name, slug, amount]) => ({ id: slug ?? name, name, slug, amount })),
  }));
  return { lang, areas, unpriced, review: review > 0 ? { amount: review, onReview: () => {} } : null, format: (amount) => formatAmount(amount, currency, lang), rateDate: converted ? (lang === "fr" ? "27\u00a0août\u00a02026" : "27\u00a0August\u00a02026") : null };
}

const ORGANISE: [string, string] = ["Organiser", "Organise"];
const CREATE: [string, string] = ["Créer", "Create"];
const TALK: [string, string] = ["Communiquer", "Communicate"];
const SELL: [string, string] = ["Vendre", "Sell"];
const AUTOMATE: [string, string] = ["Automatiser", "Automate"];
const AI: [string, string] = ["IA", "AI"];
const FINANCE: [string, string] = ["Finance", "Finance"];

/** Every state the card must hold, from the worst data first. */
export const splitStates = {
  oneTool: (lang: Lang) => split(lang, [[CREATE, [["Figma", "figma", 15]]]]),
  threeAreas: (lang: Lang) => split(lang, [[ORGANISE, [["Notion", "notion", 36]]], [CREATE, [["Figma", "figma", 15], ["Canva", "canva", 12]]], [TALK, [["Slack", "slack", 8]]]]),
  twelveTools: (lang: Lang) => split(lang, [
    [ORGANISE, [["Notion", "notion", 36], ["Airtable", "airtable", 24], ["Calendly", "calendly", 10]]],
    [CREATE, [["Figma", "figma", 15], ["Canva", "canva", 12], ["Loom", "loom", 15]]],
    [AI, [["ChatGPT", "chatgpt", 20]]],
    [SELL, [["Pipedrive", "pipedrive", 14], ["Mailchimp", "mailchimp", 13], ["Stripe", "stripe", 0.99]]],
    [AUTOMATE, [["Make", "make", 9], ["n8n", "n8n", 20]]],
  ]),
  sevenAreas: (lang: Lang) => split(lang, [
    [ORGANISE, [["Notion", "notion", 36]]], [CREATE, [["Figma", "figma", 15]]], [AI, [["ChatGPT", "chatgpt", 20]]],
    [SELL, [["Pipedrive", "pipedrive", 14]]], [AUTOMATE, [["Make", "make", 9]]], [TALK, [["Slack", "slack", 8]]], [FINANCE, [["Stripe", "stripe", 2]]],
  ]),
  tinyArea: (lang: Lang) => split(lang, [[FINANCE, [["Microsoft Dynamics 365 Finance and Operations", undefined, 1100]]], [ORGANISE, [["Notion", "notion", 8]]]]),
  withReview: (lang: Lang) => split(lang, [[ORGANISE, [["Notion", "notion", 36], ["Airtable", "airtable", 24]]], [CREATE, [["Figma", "figma", 15], ["Canva", "canva", 12]]]], { review: 24 }),
  unpriced: (lang: Lang) => split(lang, [[ORGANISE, [["Notion", "notion", 36]]], [CREATE, [["Figma", "figma", 15]]]], { unpriced: 3 }),
  converted: (lang: Lang) => split(lang, [[CREATE, [["Adobe Illustrator", "adobe-illustrator", 19.75], ["Adobe Photoshop", "adobe-photoshop", 17.17], ["Figma", "figma", 13.74]]], [ORGANISE, [["Notion", "notion", 9.5]]]], { converted: true }),
  dollars: (lang: Lang) => split(lang, [[AUTOMATE, [["Vercel", "vercel", 20], ["Supabase", "supabase", 25]]], [SELL, [["Stripe", "stripe", 0.99]]]], { currency: "USD", review: 20 }),
} satisfies Record<string, (lang: Lang) => SplitProps>;
