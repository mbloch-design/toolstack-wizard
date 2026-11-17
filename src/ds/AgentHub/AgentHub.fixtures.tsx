import type { ReactNode } from "react";
import mcpIndex from "@/data/agents/mcp_index.json";
import type { McpCard } from "@/lib/agents";
import Logo from "../Logo/Logo";

/** The projected server cards (17/11/2026), as the page reads them. */
export const cards = mcpIndex as McpCard[];

const NAMES: Record<string, string> = {
  notion: "Notion", stripe: "Stripe", calendly: "Calendly", "google-analytics": "Google Analytics", buffer: "Buffer", clickup: "ClickUp",
  canva: "Canva", hubspot: "HubSpot", airtable: "Airtable", slack: "Slack", shopify: "Shopify", ahrefs: "Ahrefs", miro: "Miro", figma: "Figma",
  hotjar: "Hotjar", tally: "Tally", webflow: "Webflow", zapier: "Zapier", make: "Make", milanote: "Milanote", trello: "Trello",
};
export const toolName = (slug: string) => NAMES[slug] ?? slug;
export const logo = (slug: string, size: 24 | 40 = 24): ReactNode => <Logo tool={{ name: toolName(slug), slug }} size={size} localOnly />;
const a = (className: string, href: string, content: ReactNode) => <a className={className} href={href}>{content}</a>;
export const links = {
  renderSheetLink: (slug: string, className: string, content: ReactNode) => a(className, `/fr/mcp/${slug}`, content),
  renderToolLink: (slug: string, className: string, content: ReactNode) => a(className, `/fr/tool/${slug}`, content),
  renderReportLink: (_name: string, className: string, content: ReactNode) => a(className, "/fr/contact", content),
};

/** A stack of nine tools mixing every status: one click, to set up, elsewhere, no official server, not checked. */
export const STACK = ["notion", "stripe", "hotjar", "slack", "canva", "google-analytics", "milanote", "trello", "figma"];
