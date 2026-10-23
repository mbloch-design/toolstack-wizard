import type { StackPersona } from "@/data/stacks";

/**
 * For each trade, the tools that come up most often in ToolTrim's curated
 * stacks for that trade (stacks-catalog-index.json, counted 23/10/2026, ties
 * broken by slug). The onboarding shows them first; only tools present in
 * the catalogue are displayed. Recount when the curated stacks change a lot.
 */
export const TRADE_TOOLS: Record<StackPersona, string[]> = {
  dev: ["github", "next-js", "cursor", "supabase", "vercel", "python", "stripe", "typescript", "fastapi", "make", "node-js", "posthog", "react", "sentry", "webflow"],
  designer: ["adobe-illustrator", "figma", "sketchup-pro", "adobe-photoshop", "d5-render", "indesign", "milanote", "rhino", "autocad", "blender", "canva", "vectorworks", "capcut", "davinci-resolve", "keynote"],
  consultant: ["notion", "airtable", "miro", "excel", "hubspot", "typeform", "ga4", "power-bi", "calendly", "folk", "google-docs", "google-workspace", "pipedrive", "powerpoint", "canva"],
  content: ["notion", "canva", "capcut", "descript", "figma", "adobe-premiere-pro", "metricool", "adobe-lightroom", "beehiiv", "buffer", "circle", "instagram", "riverside", "substack", "youtube-studio"],
  ops: ["notion", "airtable", "clickup", "google-sheets", "monday", "hubspot", "make", "slack", "asana", "gorgias", "hotjar", "lemlist", "looker-studio", "pipedrive", "shopify"],
  solo: ["notion", "airtable", "stripe", "tally", "calendly", "google-workspace", "indy", "canva", "chatgpt", "google-drive", "framer", "perplexity", "qonto", "beehiiv", "clickup"],
};
