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
  /** One sentence written for the card. */
  card?: Pair;
  /** ToolTrim's words (S1 bis): example requests, for whom it is and is not. */
  examples?: Pair[]; for?: Pair; not_for?: Pair;
  /** Gestures to stay in control, the plan in plain words, first requests, what to check when it fails (vendor docs). */
  control?: Pair[]; plan_words?: { common: Pair; advanced?: Pair };
  first_requests?: { read: Pair[]; write?: { ask: Pair; check: Pair } }; troubleshoot?: Pair[];
  transport?: "remote" | "local"; auth?: ("oauth" | "key" | "none")[]; access?: "read" | "read_write" | "docs_only";
  plan: "all" | "paid" | "specific" | "unknown"; plan_note?: Pair;
  capabilities?: { kind: AgentCapabilityKind; fr: string; en: string }[];
  setup?: { assistant: Assistant; how: "connector" | "plugin" | "url" | "local" }[];
  safeguards?: ("human_confirmation" | "admin_controls" | "scoped_keys" | "no_delete")[];
  tools?: { name: string; kind: AgentCapabilityKind; fr: string; en: string }[]; tools_note?: Pair;
  install: InstallRow[]; clients?: string[]; skills?: string[]; note?: Pair;
  /** Claude's directory page: « Ouvrir dans Claude » and the month added (never the tool list). */
  claude_directory?: { url: string; added: string; read_on: string };
  docs_url: string; sources: { label: string; url: string }[];
}

export interface SkillSheet {
  slug: string; name: string; publisher: string; official: true; host_tool: string; server: string | null; category: string | null;
  summary: Pair; agents: string[]; install: InstallRow[]; requires?: Pair; verified_on: string; status?: "ga" | "beta";
  docs_url: string; sources: { label: string; url: string }[];
}

export interface McpCard {
  slug: string; name: string; publisher: string; host_tool: string; category: string | null; summary: Pair; card?: Pair;
  status?: "ga" | "beta"; transport?: "remote" | "local"; auth?: ("oauth" | "key" | "none")[]; access?: string;
  plan: McpSheet["plan"]; kinds: AgentCapabilityKind[]; capability_kinds: AgentCapabilityKind[]; one_click: Assistant[]; clients?: string[];
  setup?: McpSheet["setup"]; safeguards?: McpSheet["safeguards"]; for?: Pair; not_for?: Pair;
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

// Surface words without jargon (S1 bis): « en ligne », « connexion à votre compte », never « distant » or « OAuth ».
export const TRANSPORT_WORDS = { remote: ["En ligne", "Online"], local: ["Sur votre ordinateur", "On your computer"] } as const;
export const AUTH_WORDS = { oauth: ["Connexion à votre compte", "Sign in to your account"], key: ["Clé d'accès", "Access key"], none: ["Aucune", "None"] } as const;
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

/** A need of the hub (research/agents/needs.json, projected): it leads to a server sheet and quotes one of its requests. */
export interface Need { id: string; fr: string; en: string; server: string; example: Pair; also: string[] }
/** ToolTrim's words for one server, read by the tool page's gateway: one request, for whom. */
export interface Advice { examples?: Pair[]; for?: Pair }

const ASSISTANT_NAMES = { claude: "Claude", chatgpt: "ChatGPT", gemini: "Gemini", copilot: "Copilot" } as const;
const ASSISTANT_ORDER: Assistant[] = ["claude", "chatgpt", "gemini", "copilot", "other"];
type Setup = NonNullable<McpSheet["setup"]>;

/** The assistants the vendor documents, Claude and ChatGPT first, « another assistant » last. */
export const assistantsOf = (setup: Setup | undefined) => ASSISTANT_ORDER.filter((a) => setup?.some((way) => way.assistant === a));
export const assistantLabel = (assistant: Assistant, lang: Lang) =>
  assistant === "other" ? (lang === "en" ? "Another assistant" : "Un autre assistant") : ASSISTANT_NAMES[assistant];
/** « Claude, ChatGPT ou Gemini »: the named assistants only. */
export function assistantWords(setup: Setup | undefined, lang: Lang) {
  const named = assistantsOf(setup).filter((a) => a !== "other").map((a) => ASSISTANT_NAMES[a as keyof typeof ASSISTANT_NAMES]);
  if (!named.length) return setup?.length ? (lang === "en" ? "Any assistant that accepts a server address" : "Tout assistant qui accepte l'adresse d'un serveur") : null;
  const last = named.pop()!;
  return named.length ? `${named.join(", ")} ${lang === "en" ? "or" : "ou"} ${last}` : last;
}

/**
 * Plugging in three steps, composed from the documented way (connector, app, address, install) and sign-in.
 * Empty when the vendor documents no way for this assistant.
 */
export function plugSteps(sheet: Pick<McpSheet, "setup" | "auth">, assistant: Assistant, toolName: string, lang: Lang): string[] {
  const way = sheet.setup?.find((w) => w.assistant === assistant);
  if (!way) return [];
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const who = assistant === "other" ? t("votre assistant", "your assistant") : ASSISTANT_NAMES[assistant];
  const first = {
    connector: t(`Dans ${who}, ouvrez la liste des connecteurs et choisissez ${toolName}.`, `In ${who}, open the list of connectors and pick ${toolName}.`),
    plugin: t(`Dans ${who}, ajoutez l'application ${toolName} depuis la liste des applications.`, `In ${who}, add the ${toolName} app from the list of apps.`),
    url: t(`Copiez l'adresse du serveur, en fin de fiche, et ajoutez-la à ${who} comme connecteur personnalisé.`, `Copy the server address, at the end of this page, and add it to ${who} as a custom connector.`),
    local: t(`Installez le serveur sur votre ordinateur avec les instructions de fin de fiche, puis déclarez-le dans ${who}.`, `Install the server on your computer with the instructions at the end of this page, then declare it in ${who}.`),
  }[way.how];
  const auth = sheet.auth ?? [];
  const second = auth.includes("oauth")
    ? t(`Connectez-vous à votre compte ${toolName} et lisez les accès demandés avant d'accepter.`, `Sign in to your ${toolName} account and read the access requested before accepting.`)
    : auth.includes("key")
      ? t(`Créez une clé d'accès dans ${toolName} et collez-la quand ${who} la demande.`, `Create an access key in ${toolName} and paste it when ${who} asks for it.`)
      : t(`Autorisez l'accès à votre compte ${toolName} quand ${who} le demande.`, `Allow access to your ${toolName} account when ${who} asks.`);
  const third = t("Commencez par une demande qui ne fait que lire, puis élargissez.", "Start with a request that only reads, then widen.");
  return [first, second, third];
}

type Guarded = { kinds: AgentCapabilityKind[]; safeguards?: McpSheet["safeguards"]; status?: "ga" | "beta" };
/** What the risk is said from: the capability lines a card shows (its tools only when it has none). */
export const guardOf = (card: McpCard): Guarded => ({ kinds: card.capability_kinds, safeguards: card.safeguards, status: card.status });
/** The risk in one sentence, from the riskiest documented action. */
export function riskSentence({ kinds, safeguards, status }: Guarded, lang: Lang) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const asks = safeguards?.includes("human_confirmation");
  let said: string;
  if (kinds.includes("pay")) said = asks ? t("Peut déplacer de l'argent, après votre confirmation.", "Can move money, after your confirmation.") : t("Peut payer en votre nom.", "Can pay in your name.");
  else if (kinds.includes("send")) said = asks ? t("Peut publier ou envoyer en votre nom ; il demande confirmation avant certaines actions.", "Can publish or send in your name; it asks before some actions.") : t("Peut publier ou envoyer en votre nom, sans confirmation documentée.", "Can publish or send in your name, with no documented confirmation.");
  else if (kinds.includes("delete")) said = t("Peut supprimer : commencez par des demandes qui ne font que lire.", "Can delete: start with requests that only read.");
  else if (kinds.includes("write")) said = t("Peut créer et modifier, pas supprimer.", "Can create and edit, not delete.");
  else if (kinds.includes("read")) said = t("Ne fait que lire : rien n'est modifié.", "Only reads: nothing is changed.");
  else said = t("Ce qu'il peut faire n'est pas détaillé par l'éditeur.", "What it can do is not detailed by the vendor.");
  return status === "beta" ? `${said} ${t("En bêta.", "In beta.")}` : said;
}

/** Our call on a tool of the visitor's stack: plug it, plug it with care, or not yet. */
export type StackCall = "plug" | "careful" | "not_yet";
export function stackCall(card: Guarded | null): StackCall {
  if (!card) return "not_yet";
  if (card.status === "beta" || card.kinds.includes("pay")) return "careful";
  if (card.kinds.includes("send") && !card.safeguards?.includes("human_confirmation")) return "careful";
  return "plug";
}
export const STACK_CALL_WORDS: Record<StackCall, readonly [string, string]> = {
  plug: ["À brancher", "Plug it in"], careful: ["Avec prudence", "With care"], not_yet: ["Pas encore", "Not yet"],
};

/** « Connexion à votre compte ou clé d'accès »: the sign-in ways in one phrase. */
export const authWords = (auth: NonNullable<McpSheet["auth"]>, lang: Lang) =>
  auth.map((a, i) => { const word = say(lang, AUTH_WORDS[a]); return i ? word.charAt(0).toLowerCase() + word.slice(1) : word; }).join(lang === "en" ? " or " : " ou ");

/** The sign-in in a card's few words: « Compte », « Clé d'accès », « Compte ou clé ». */
const shortAuth = (auth: NonNullable<McpCard["auth"]>, lang: Lang) => {
  const account = auth.includes("oauth"), key = auth.includes("key");
  if (account && key) return lang === "en" ? "Account or key" : "Compte ou clé";
  if (account) return lang === "en" ? "Your account" : "Votre compte";
  if (key) return lang === "en" ? "Access key" : "Clé d'accès";
  return lang === "en" ? "No sign-in" : "Sans connexion";
};
/** A fact at a card's foot; the card draws the icon of its kind (the same icons as the sheet's facts line). */
export type CardFact = { kind: "online" | "local" | "account" | "skill" | "tool" | "assistant"; text: string };
/** The two facts of a server card: where it runs, which account. */
export function serverFacts(card: Pick<McpCard, "transport" | "auth">, lang: Lang): CardFact[] {
  return [
    ...(card.transport ? [{ kind: card.transport === "local" ? "local" as const : "online" as const, text: say(lang, TRANSPORT_WORDS[card.transport]) }] : []),
    ...(card.auth?.length ? [{ kind: "account" as const, text: shortAuth(card.auth, lang) }] : []),
  ];
}
/** A card says one sentence: the summary's first, never cut mid-sentence by the card. */
export const cardSentence = (text: string) => text.match(/^.+?[.!?](\s|$)/)?.[0].trim() ?? text;
/** ToolTrim's name for a server: the tool's name, or « Figma, application de bureau » when the tool has two. */
export function serverName(card: Pick<McpCard, "transport" | "name">, toolName: string, hasSibling: boolean, lang: Lang) {
  if (!hasSibling) return toolName;
  if (card.transport === "local") return lang === "en" ? `${toolName}, desktop app` : `${toolName}, application de bureau`;
  if (card.transport === "remote") return lang === "en" ? `${toolName}, online` : `${toolName}, en ligne`;
  return card.name;
}
/** « Par Notion · Officiel ». */
export const byLine = (publisher: string, lang: Lang) => (lang === "en" ? `By ${publisher} · Official` : `Par ${publisher} · Officiel`);
