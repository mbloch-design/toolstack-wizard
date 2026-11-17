import catalog from "@/data/agents/catalog.json";
import type { McpSheet, SkillSheet } from "@/lib/agents";

const servers = catalog.servers as McpSheet[];
const skills = catalog.skills as SkillSheet[];
const server = (slug: string) => servers.find((s) => s.slug === slug)!;
const skill = (slug: string) => skills.find((s) => s.slug === slug)!;

/** Real sheets from the projected catalogue (vendor docs, 16/11/2026), worst cases included. */
export const sheetStates = {
  /** 70 tools, every kind but pay, admin controls. */
  notion: server("notion-mcp"),
  /** The remote one of Figma's two servers: restricted clients, a beta write. */
  figma: server("figma-mcp"),
  /** The desktop one: local, read-only, some plans. */
  figmaDesktop: server("figma-mcp-desktop"),
  /** Moves money, with human confirmation; beta. */
  stripe: server("stripe-mcp"),
  /** ChatGPT documented only as « address to paste »: the card uses the address and ChatGPT's own steps. */
  buffer: server("buffer-mcp"),
  /** A Gemini command with no Gemini documentation we could read: the card says so, never guesses. */
  miro: server("miro-mcp"),
  /** Reading only: every action tagged « Lit », no risk filter to offer. */
  googleAnalytics: server("google-analytics-mcp"),
  /** Paid plans, no tool list published, no safeguard documented. */
  ahrefs: server("ahrefs-mcp"),
};

export const skillStates = {
  /** A skill with an install line and a seat requirement. */
  figmaUse: skill("figma-use"),
  /** Nothing to install: a page in the workspace. */
  notionSkills: skill("notion-skills"),
};
