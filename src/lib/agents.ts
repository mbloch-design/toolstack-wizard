/*
 * The agents section (S1, 16/11/2026): official MCP servers and skills of the catalogue's tools.
 * Data: research/mcp and research/skills, projected by scripts/project-agents.mjs into src/data/agents/.
 * Closed vocabularies: scripts/lib/agent-access.mjs.
 */
import type { AgentCapabilityKind } from "@/data/types";

export type Pair = { fr: string; en: string };
export type Assistant = "claude" | "chatgpt" | "gemini" | "copilot" | "other";
export type InstallRow = { client: string; type: "command" | "url" | "config" | "steps"; value: string };

export interface McpSheet {
  slug: string; name: string; publisher: string; official: true; host_tool: string; category: string | null;
  summary: Pair; verified_on: string; status?: "ga" | "beta";
  transport?: "remote" | "local"; auth?: ("oauth" | "key" | "none")[]; access?: "read" | "read_write" | "docs_only";
  plan: "all" | "paid" | "specific" | "unknown"; plan_note?: Pair;
  capabilities?: { kind: AgentCapabilityKind; fr: string; en: string }[];
  setup?: { assistant: Assistant; how: "connector" | "plugin" | "url" | "local" }[];
  safeguards?: ("human_confirmation" | "admin_controls" | "scoped_keys" | "no_delete")[];
  tools?: { name: string; kind: AgentCapabilityKind; fr: string; en: string }[]; tools_note?: Pair;
  install: InstallRow[]; clients?: string[]; skills?: string[]; note?: Pair;
  docs_url: string; sources: { label: string; url: string }[];
}

export interface SkillSheet {
  slug: string; name: string; publisher: string; official: true; host_tool: string; server: string | null; category: string | null;
  summary: Pair; agents: string[]; install: InstallRow[]; requires?: Pair; verified_on: string; status?: "ga" | "beta";
  docs_url: string; sources: { label: string; url: string }[];
}

export interface McpCard {
  slug: string; name: string; publisher: string; host_tool: string; category: string | null; summary: Pair;
  status?: "ga" | "beta"; transport?: "remote" | "local"; auth?: ("oauth" | "key" | "none")[]; access?: string;
  plan: McpSheet["plan"]; kinds: AgentCapabilityKind[]; one_click: Assistant[]; clients?: string[];
  tools: number; skills: number; verified_on: string;
}

export interface SkillCard {
  slug: string; name: string; publisher: string; host_tool: string; server: string | null; category: string | null;
  summary: Pair; agents: string[]; verified_on: string;
}

export type Lang = "fr" | "en";
export const say = (lang: Lang, pair: Pair | readonly [string, string]) =>
  Array.isArray(pair) ? (lang === "en" ? pair[1] : pair[0]) : lang === "en" ? (pair as Pair).en : (pair as Pair).fr;

/** Names of the clients the vendors name; anything else is shown as written. */
const CLIENT_NAMES: Record<string, string> = {
  claude: "Claude", chatgpt: "ChatGPT", gemini: "Gemini", copilot: "Copilot", "claude-code": "Claude Code", cursor: "Cursor",
  "vs-code": "VS Code", codex: "Codex", replit: "Replit", linear: "Linear", warp: "Warp", devin: "Devin", antigravity: "Antigravity",
  lovable: "Lovable", perplexity: "Perplexity", grok: "Grok", notion: "Notion", zapier: "Zapier", slack: "Slack", clickup: "ClickUp",
};
export const clientName = (slug: string, lang: Lang) =>
  slug === "any" ? (lang === "en" ? "Any MCP client" : "Tout client MCP") : CLIENT_NAMES[slug] ?? slug;

export const KIND_WORDS: Record<AgentCapabilityKind, readonly [string, string]> = {
  read: ["Lire", "Read"], write: ["Créer et modifier", "Create and edit"], delete: ["Supprimer", "Delete"],
  send: ["Envoyer, publier", "Send, publish"], pay: ["Payer", "Pay"],
};
/** Riskiest first: what a freelancer checks before connecting. */
export const RISK_ORDER: AgentCapabilityKind[] = ["pay", "delete", "send", "write", "read"];

export const TRANSPORT_WORDS = { remote: ["À distance", "Remote"], local: ["Sur votre ordinateur", "On your computer"] } as const;
export const AUTH_WORDS = { oauth: ["Compte (OAuth)", "Account (OAuth)"], key: ["Clé d'API", "API key"], none: ["Aucune", "None"] } as const;
export const PLAN_WORDS = {
  all: ["Tous les forfaits", "Every plan"], paid: ["Forfaits payants", "Paid plans"],
  specific: ["Certains forfaits", "Some plans"], unknown: ["Forfait non précisé", "Plan not stated"],
} as const;
export const HOW_WORDS = {
  connector: ["connecteur intégré", "built-in connector"], plugin: ["application à ajouter", "app to add"],
  url: ["adresse du serveur à coller", "server address to paste"], local: ["installation sur l'ordinateur", "install on your computer"],
} as const;
export const SAFEGUARD_WORDS = {
  human_confirmation: ["Confirmation avant certaines actions", "Asks before some actions"],
  admin_controls: ["Réglages pour l'administrateur", "Admin controls"],
  scoped_keys: ["Accès limitable à une partie du compte", "Access can be limited to part of the account"],
  no_delete: ["Aucune suppression possible", "Cannot delete"],
} as const;
