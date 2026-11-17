import type { ReactNode } from "react";
import mcpIndex from "@/data/agents/mcp_index.json";
import needsData from "@/data/agents/needs.json";
import { guardOf, stackCall, type McpCard, type Need } from "@/lib/agents";
import Logo from "../Logo/Logo";
import type { StackAgentItem } from "./AgentHub";

/** The projected hub data (needs and server cards, 17/11/2026), as the page reads it. */
export const cards = mcpIndex as McpCard[];
export const needs = needsData as Need[];

const NAMES: Record<string, string> = {
  notion: "Notion", stripe: "Stripe", calendly: "Calendly", "google-analytics": "Google Analytics", buffer: "Buffer", clickup: "ClickUp",
  canva: "Canva", hubspot: "HubSpot", airtable: "Airtable", slack: "Slack", shopify: "Shopify", ahrefs: "Ahrefs", miro: "Miro", figma: "Figma",
  hotjar: "Hotjar", tally: "Tally", webflow: "Webflow", zapier: "Zapier", make: "Make",
};
export const toolName = (slug: string) => NAMES[slug] ?? slug;
export const logo = (slug: string, size: 24 | 40 = 24): ReactNode => <Logo tool={{ name: toolName(slug), slug }} size={size} localOnly />;
const a = (className: string, href: string, content: ReactNode) => <a className={className} href={href}>{content}</a>;
export const links = {
  renderSheetLink: (slug: string, className: string, content: ReactNode, attrs?: Record<string, string>) => <a className={className} href={`/fr/mcp/${slug}`} {...attrs}>{content}</a>,
  renderToolLink: (slug: string, className: string, content: ReactNode) => a(className, `/fr/tool/${slug}`, content),
  renderStackLink: (className: string, content: ReactNode, attrs?: Record<string, string>) => <a className={className} href="/fr/ma-stack" {...attrs}>{content}</a>,
  renderGuideLink: (className: string, content: ReactNode) => a(className, "/fr/guide/mcp-freelances-non-developpeurs", content),
};

/** A stack of five tools: three plug in (one with care), Hotjar has no official server. */
const item = (slug: string): StackAgentItem => {
  const card = cards.find((c) => c.host_tool === slug);
  return { slug, name: toolName(slug), icon: logo(slug), call: stackCall(card ? guardOf(card) : null), ...(card ? { card } : {}) };
};
export const stackItems = ["notion", "stripe", "calendly", "slack", "hotjar"].map(item);
