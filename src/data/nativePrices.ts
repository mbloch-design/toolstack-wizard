// Genere par scripts/gen-native-prices.mjs depuis src/data/pricing_truth.csv.
// Ne pas editer a la main : relancer le script apres avoir verifie un tarif.
//
// Chaque entree est un prix releve sur la page officielle de l'editeur, avec sa
// devise reelle et la date du releve. C'est la seule source de devise native
// consideree comme attestee.

export type NativePriceRecord = {
  amount: number;
  currency: "EUR" | "USD" | "GBP";
  period: "monthly" | "annual" | "once";
  freeCoreAvailable: boolean | null;
  verifiedOn: string;
  /** Read explicitly on the vendor's official pricing page: wins over the catalogue. */
  official: boolean;
};

export const NATIVE_PRICES: Record<string, NativePriceRecord> = {
  "1password": { amount: 3.99, currency: "USD", period: "monthly", freeCoreAvailable: false, verifiedOn: "2026-03-13", official: false },
  "activecampaign": { amount: 15, currency: "USD", period: "monthly", freeCoreAvailable: false, verifiedOn: "2026-09-26", official: true },
  "adcreative-ai": { amount: 39, currency: "USD", period: "monthly", freeCoreAvailable: false, verifiedOn: "2026-09-26", official: true },
  "adobe-after-effects": { amount: 26.21, currency: "EUR", period: "monthly", freeCoreAvailable: false, verifiedOn: "2026-03-13", official: true },
  "adobe-cc": { amount: 78.65, currency: "EUR", period: "monthly", freeCoreAvailable: false, verifiedOn: "2026-03-13", official: true },
  "adobe-illustrator": { amount: 26.21, currency: "EUR", period: "monthly", freeCoreAvailable: false, verifiedOn: "2026-03-13", official: true },
  "adobe-photoshop": { amount: 26.21, currency: "EUR", period: "monthly", freeCoreAvailable: false, verifiedOn: "2026-03-13", official: true },
  "adobe-premiere-pro": { amount: 26.21, currency: "EUR", period: "monthly", freeCoreAvailable: false, verifiedOn: "2026-03-13", official: true },
  "airtable": { amount: 24, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: true },
  "asana": { amount: 10.99, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: false },
  "basecamp": { amount: 15, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: true },
  "beehiiv": { amount: 43, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: true },
  "cal-com": { amount: 12, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: true },
  "calendly": { amount: 10, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: true },
  "canva": { amount: 13, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: false },
  "chatgpt": { amount: 20, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: true },
  "claude": { amount: 20, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: true },
  "clickup": { amount: 7, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: true },
  "coast": { amount: 4, currency: "USD", period: "monthly", freeCoreAvailable: null, verifiedOn: "2026-10-15", official: true },
  "convertkit": { amount: 33, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-09-26", official: true },
  "cursor": { amount: 20, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: false },
  "docyt": { amount: 299, currency: "USD", period: "monthly", freeCoreAvailable: false, verifiedOn: "2026-10-15", official: true },
  "elevenlabs": { amount: 5, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: true },
  "figma": { amount: 15, currency: "EUR", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: true },
  "github-copilot": { amount: 10, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: true },
  "grammarly": { amount: 30, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: true },
  "granola": { amount: 14, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-10-16", official: true },
  "linear": { amount: 10, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: true },
  "loom": { amount: 18, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: true },
  "loox": { amount: 14.99, currency: "USD", period: "monthly", freeCoreAvailable: false, verifiedOn: "2026-10-15", official: true },
  "mailchimp": { amount: 13, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: false },
  "make": { amount: 9, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: true },
  "midjourney": { amount: 10, currency: "USD", period: "monthly", freeCoreAvailable: false, verifiedOn: "2026-03-13", official: true },
  "notion": { amount: 11.5, currency: "EUR", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: true },
  "obsidian": { amount: 5, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: true },
  "pagefly": { amount: 24, currency: "USD", period: "monthly", freeCoreAvailable: null, verifiedOn: "2026-10-15", official: true },
  "perplexity": { amount: 20, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: true },
  "pixelmator-pro": { amount: 49.99, currency: "USD", period: "once", freeCoreAvailable: false, verifiedOn: "2026-10-16", official: true },
  "planoly": { amount: 14, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-10-15", official: true },
  "raycast": { amount: 10, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: true },
  "shopify": { amount: 29, currency: "USD", period: "monthly", freeCoreAvailable: false, verifiedOn: "2026-03-13", official: false },
  "shotdeck": { amount: 12.95, currency: "USD", period: "monthly", freeCoreAvailable: false, verifiedOn: "2026-10-16", official: true },
  "slack": { amount: 8.75, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: true },
  "superhuman": { amount: 30, currency: "USD", period: "monthly", freeCoreAvailable: false, verifiedOn: "2026-03-13", official: true },
  "todoist": { amount: 5, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: true },
  "toggl": { amount: 9, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: false },
  "trello": { amount: 10, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: true },
  "vcita": { amount: 420, currency: "USD", period: "annual", freeCoreAvailable: false, verifiedOn: "2026-10-16", official: true },
  "webflow": { amount: 14, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: true },
  "zapier": { amount: 19.99, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: true },
};
