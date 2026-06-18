import { readFileSync, writeFileSync } from "node:fs";

const file = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(file, "utf8"));

function option(value, label_fr, label_en, extra = {}) {
  return { value, label_fr, label_en, ...extra };
}

function updateTool(id, updater) {
  const tool = tools.find((entry) => entry.id === id);
  if (!tool) {
    throw new Error(`Tool not found: ${id}`);
  }
  tool.pricing_v5 = updater(tool.pricing_v5 || {});
}

updateTool("frame-io", (pricing) => ({
  ...pricing,
  billing_model: "seat",
  billing_options: [
    option("free", "Free", "Free", { price_monthly_eur: 0 }),
    option("paid", "Pro", "Pro", { price_monthly_eur: 15, price_original: 15, currency: "USD" }),
    option("team", "Team / Adobe inclus", "Team / Adobe included", { needs_verification: true }),
    option("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
  ],
}));

updateTool("brevo", (pricing) => ({
  ...pricing,
  billing_model: "usage_based",
  billing_options: [
    option("free", "Free", "Free", { price_monthly_eur: 0 }),
    option("usage", "Starter email", "Starter email", { price_monthly_eur: 9, currency: "EUR" }),
    option("custom_quote", "Business / Enterprise", "Business / Enterprise", { needs_verification: true }),
    option("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
  ],
}));

updateTool("hubspot", (pricing) => ({
  ...pricing,
  billing_model: "custom_quote",
  billing_options: [
    option("free", "Free tools", "Free tools", { price_monthly_eur: 0 }),
    option("custom_quote", "Starter / Pro / Hub", "Starter / Pro / Hub", { needs_verification: true }),
    option("included", "Inclus équipe", "Included by team", { price_monthly_eur: 0 }),
    option("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
  ],
}));

updateTool("loom", (pricing) => ({
  ...pricing,
  billing_model: "seat",
  billing_options: [
    option("free", "Starter", "Starter", { price_monthly_eur: 0 }),
    option("paid", "Business", "Business", { price_monthly_eur: 18, price_original: 18, currency: "USD" }),
    option("team", "Enterprise / équipe", "Enterprise / team", { needs_verification: true }),
    option("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
  ],
}));

updateTool("stripe", (pricing) => ({
  ...pricing,
  billing_model: "usage_based",
  billing_options: [
    option("usage", "Commission Stripe", "Stripe fees", {
      price_monthly_eur: 0,
      note_fr: "Commission variable selon le volume",
      note_en: "Variable fee based on volume",
      needs_verification: true,
    }),
    option("custom_quote", "Contrat enterprise", "Enterprise contract", { needs_verification: true }),
    option("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
  ],
}));

updateTool("indy", (pricing) => ({
  ...pricing,
  billing_model: "subscription",
  billing_options: [
    option("paid", "Indy", "Indy", { price_monthly_eur: 20, currency: "EUR" }),
    option("included", "Payé pour moi", "Paid for me", { price_monthly_eur: 0 }),
    option("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
  ],
}));

updateTool("pixieset", (pricing) => ({
  ...pricing,
  billing_model: "subscription",
  billing_options: [
    option("free", "Free", "Free", { price_monthly_eur: 0 }),
    option("paid", "Client Gallery / Studio", "Client Gallery / Studio", { price_monthly_eur: 12, currency: "USD", needs_verification: true }),
    option("team", "Pack studio", "Studio bundle", { needs_verification: true }),
    option("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
  ],
}));

updateTool("framer", (pricing) => ({
  ...pricing,
  billing_model: "subscription",
  billing_options: [
    option("free", "Free", "Free", { price_monthly_eur: 0 }),
    option("paid", "Mini", "Mini", { price_monthly_eur: 5, currency: "EUR" }),
    option("team", "Pro / Team", "Pro / Team", { needs_verification: true }),
    option("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
  ],
}));

updateTool("dropbox", (pricing) => ({
  ...pricing,
  billing_model: "subscription",
  billing_options: [
    option("free", "Basic", "Basic", { price_monthly_eur: 0 }),
    option("paid", "Plus", "Plus", { price_monthly_eur: 12, price_original: 12, currency: "USD" }),
    option("team", "Business", "Business", { needs_verification: true }),
    option("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
  ],
}));

updateTool("google-drive", (pricing) => ({
  ...pricing,
  billing_model: "subscription",
  billing_options: [
    option("free", "Free", "Free", { price_monthly_eur: 0 }),
    option("paid", "Google One 100 Go", "Google One 100 GB", { price_monthly_eur: 1.73, currency: "EUR" }),
    option("included", "Inclus Google Workspace", "Included with Google Workspace", { price_monthly_eur: 0 }),
    option("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
  ],
}));

updateTool("notion", (pricing) => ({
  ...pricing,
  billing_model: "seat",
  billing_options: [
    option("free", "Free", "Free", { price_monthly_eur: 0 }),
    option("paid", "Plus", "Plus", { price_monthly_eur: 10, price_original: 10, currency: "USD" }),
    option("team", "Business", "Business", { price_monthly_eur: 15, price_original: 15, currency: "USD" }),
    option("included", "Inclus équipe", "Included by team", { price_monthly_eur: 0 }),
    option("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
  ],
}));

updateTool("milanote", (pricing) => ({
  ...pricing,
  billing_model: "subscription",
  billing_options: [
    option("free", "Free", "Free", { price_monthly_eur: 0 }),
    option("paid", "Pro", "Pro", { price_monthly_eur: 8, currency: "EUR" }),
    option("team", "Team", "Team", { needs_verification: true }),
    option("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
  ],
}));

updateTool("mailerlite", (pricing) => ({
  ...pricing,
  billing_model: "usage_based",
  billing_options: [
    option("free", "Free", "Free", { price_monthly_eur: 0 }),
    option("usage", "Growing Business", "Growing Business", { needs_verification: true }),
    option("custom_quote", "Advanced / Enterprise", "Advanced / Enterprise", { needs_verification: true }),
    option("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
  ],
}));

updateTool("posthog", (pricing) => ({
  ...pricing,
  billing_model: "usage_based",
  billing_options: [
    option("free", "Free", "Free", { price_monthly_eur: 0 }),
    option("usage", "Usage-based", "Usage-based", { needs_verification: true }),
    option("custom_quote", "Enterprise", "Enterprise", { needs_verification: true }),
    option("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
  ],
}));

updateTool("hotjar", (pricing) => ({
  ...pricing,
  billing_model: "subscription",
  billing_options: [
    option("free", "Basic", "Basic", { price_monthly_eur: 0 }),
    option("paid", "Plus", "Plus", { price_monthly_eur: 32, price_original: 32, currency: "USD" }),
    option("team", "Business", "Business", { needs_verification: true }),
    option("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
  ],
}));

writeFileSync(file, `${JSON.stringify(tools, null, 2)}\n`);
console.log("GO71 pricing data patched.");
