// Genere par scripts/gen-native-prices.mjs depuis src/data/pricing_truth.csv.
// Ne pas editer a la main : relancer le script apres avoir verifie un tarif.
//
// Chaque entree est un prix releve sur la page officielle de l'editeur, avec sa
// devise reelle et la date du releve. C'est la seule source de devise native
// consideree comme attestee.

export type NativePriceRecord = {
  amount: number;
  currency: "EUR" | "USD" | "GBP";
  verifiedOn: string;
};

export const NATIVE_PRICES: Record<string, NativePriceRecord> = {
  "1password": { amount: 3.99, currency: "USD", verifiedOn: "2026-03-13" },
  "adobe-after-effects": { amount: 26.21, currency: "EUR", verifiedOn: "2026-03-13" },
  "adobe-cc": { amount: 78.65, currency: "EUR", verifiedOn: "2026-03-13" },
  "adobe-illustrator": { amount: 26.21, currency: "EUR", verifiedOn: "2026-03-13" },
  "adobe-photoshop": { amount: 26.21, currency: "EUR", verifiedOn: "2026-03-13" },
  "adobe-premiere-pro": { amount: 26.21, currency: "EUR", verifiedOn: "2026-03-13" },
  "airtable": { amount: 24, currency: "USD", verifiedOn: "2026-03-13" },
  "asana": { amount: 10.99, currency: "USD", verifiedOn: "2026-03-13" },
  "basecamp": { amount: 15, currency: "USD", verifiedOn: "2026-03-13" },
  "beehiiv": { amount: 43, currency: "USD", verifiedOn: "2026-03-13" },
  "cal-com": { amount: 12, currency: "USD", verifiedOn: "2026-03-13" },
  "calendly": { amount: 10, currency: "USD", verifiedOn: "2026-03-13" },
  "canva": { amount: 13, currency: "USD", verifiedOn: "2026-03-13" },
  "chatgpt": { amount: 20, currency: "USD", verifiedOn: "2026-03-13" },
  "claude": { amount: 20, currency: "USD", verifiedOn: "2026-03-13" },
  "clickup": { amount: 7, currency: "USD", verifiedOn: "2026-03-13" },
  "convertkit": { amount: 33, currency: "USD", verifiedOn: "2026-03-13" },
  "cursor": { amount: 20, currency: "USD", verifiedOn: "2026-03-13" },
  "elevenlabs": { amount: 5, currency: "USD", verifiedOn: "2026-03-13" },
  "figma": { amount: 15, currency: "EUR", verifiedOn: "2026-03-13" },
  "github-copilot": { amount: 10, currency: "USD", verifiedOn: "2026-03-13" },
  "grammarly": { amount: 30, currency: "USD", verifiedOn: "2026-03-13" },
  "linear": { amount: 10, currency: "USD", verifiedOn: "2026-03-13" },
  "loom": { amount: 18, currency: "USD", verifiedOn: "2026-03-13" },
  "mailchimp": { amount: 13, currency: "USD", verifiedOn: "2026-03-13" },
  "make": { amount: 9, currency: "USD", verifiedOn: "2026-03-13" },
  "midjourney": { amount: 10, currency: "USD", verifiedOn: "2026-03-13" },
  "notion": { amount: 11.5, currency: "EUR", verifiedOn: "2026-03-13" },
  "obsidian": { amount: 5, currency: "USD", verifiedOn: "2026-03-13" },
  "perplexity": { amount: 20, currency: "USD", verifiedOn: "2026-03-13" },
  "raycast": { amount: 10, currency: "USD", verifiedOn: "2026-03-13" },
  "shopify": { amount: 29, currency: "USD", verifiedOn: "2026-03-13" },
  "slack": { amount: 8.75, currency: "USD", verifiedOn: "2026-03-13" },
  "superhuman": { amount: 30, currency: "USD", verifiedOn: "2026-03-13" },
  "todoist": { amount: 5, currency: "USD", verifiedOn: "2026-03-13" },
  "toggl": { amount: 9, currency: "USD", verifiedOn: "2026-03-13" },
  "trello": { amount: 10, currency: "USD", verifiedOn: "2026-03-13" },
  "webflow": { amount: 14, currency: "USD", verifiedOn: "2026-03-13" },
  "zapier": { amount: 19.99, currency: "USD", verifiedOn: "2026-03-13" },
};
