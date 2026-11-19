/*
 * The agents section (S1, 16/11/2026): official MCP servers and skills of the catalogue's tools.
 * Data: research/mcp and research/skills, projected by scripts/project-agents.mjs into src/data/agents/.
 * Closed vocabularies: scripts/lib/agent-access.mjs.
 */
import type { AgentCapabilityKind } from "@/data/types";

export type Pair = { fr: string; en: string };
export type Assistant = "claude" | "chatgpt" | "gemini" | "copilot" | "other";
/** An install row: the vendor's own text to copy (command, address, configuration), or steps to read, in both languages (step 9). */
export type InstallRow = { client: string; type: "command" | "url" | "config"; value: string } | { client: string; type: "steps"; value: Pair };
export type CopyRow = Extract<InstallRow, { value: string }>;
/** A row whose value is the vendor's text to copy (not steps to read). */
export const isCopyRow = (row: InstallRow): row is CopyRow => row.type !== "steps";

export interface McpSheet {
  slug: string; name: string; publisher: string; official: true; host_tool: string; category: string | null;
  summary: Pair; verified_on: string; status?: "ga" | "beta";
  /** The search snippet, 140 to 155 signs (step 9). */
  meta_description: Pair;
  /** Projected: the host tool's name in the catalogue, and its social image when one is local (step 9). */
  host_name?: string; og_image?: string;
  /** One sentence written for the card. */
  card?: Pair;
  /** ToolTrim's words (S1 bis): example requests, for whom it is and is not. */
  examples?: Pair[]; for?: Pair; not_for?: Pair;
  /** Gestures to stay in control, the plan in plain words, first requests, what to check when it fails (vendor docs). */
  control?: { title: Pair; icon: "account" | "admin" | "cut" | "confirm" | "limit" | "read" | "cost" | "log"; fr: string; en: string }[]; plan_words?: { common: Pair; advanced?: Pair };
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
  /** A freelancer's advice to another (19/11/2026): sourced, never « tested »; the verdict leads the sheet. */
  advice?: McpAdvice;
}

export type SituationIcon = "meeting" | "week" | "invoice" | "post" | "deck" | "feedback" | "link" | "unpaid";
/** A situation's pencil scene (19/11), drawn in src/ds/AgentSheet/SituationArt.tsx; the guard (scripts/lib/agent-access.mjs,
 *  SITUATION_SCENES) holds the same list. A situation without one keeps its icon round. */
export type SituationScene = "notion-meeting" | "notion-week" | "notion-invoice" | "canva-post" | "canva-deck" | "canva-feedback" | "stripe-invoice" | "stripe-link" | "stripe-unpaid";
export type AdviceIcon = "title" | "database" | "approve" | "suggest" | "click" | "guest" | "slow" | "limit" | "rights" | "brief" | "refine" | "copy" | "brand" | "settings" | "draft" | "credits" | "link" | "admin" | "sandbox" | "amount" | "key" | "mail" | "invoice" | "confirm" | "blocked" | "session";
export type Sourced = Pair & { title: Pair; source: string; community?: boolean; icon: AdviceIcon };
export interface McpAdvice {
  verdict: Pair & { source: string };
  /** The peer's introduction to « D'un free à l'autre »: the scene, in a human voice. */
  intro: Pair;
  situations: { title: Pair; ask: Pair; gain: Pair; source: string; icon: SituationIcon; scene?: SituationScene }[];
  tips: Sourced[];
  pitfalls: (Sourced & { workaround?: Pair })[];
  sources: { label: string; url: string }[];
}

export interface SkillSheet {
  slug: string; name: string; publisher: string; official: true; host_tool: string; server: string | null; category: string | null;
  summary: Pair; agents: string[]; install: InstallRow[]; requires?: Pair; verified_on: string; status?: "ga" | "beta";
  host_name?: string; og_image?: string;
  docs_url: string; sources: { label: string; url: string }[];
  /** Step 9 (18/11/2026), from the vendor's pages: what it does for you, a request to try, the search snippet, a readable name. */
  use_case?: Pair; example?: Pair; meta_description?: Pair; display_name?: Pair;
}

/** A skill's name for people: its readable name when it has one, else its own. */
export const skillTitle = (skill: Pick<SkillSheet, "name" | "display_name">, lang: Lang) => (skill.display_name ? (lang === "en" ? skill.display_name.en : skill.display_name.fr) : skill.name);

/**
 * A skill a non-developer can use (step 5, 17/11): nothing to install, it ships with the connected server (Notion
 * Skills, Zapier's). The others go through a coding tool (a command, a plugin, a file): they are « pour développeurs ».
 */
export const forEveryone = (skill: Pick<SkillSheet, "install">) => !skill.install.length;

/**
 * A skill card's foot (step 5, 17/11): where it goes, the decision a reader makes. « Sans installation » when it ships
 * with the server; otherwise the coding tools the vendor documents (« Dans Claude Code, Codex, Cursor »), four named
 * at most. Never « Savoir-faire » or the vendor, already on the card.
 */
export function skillFoot(skill: { everyone?: boolean; install?: InstallRow[]; agents: string[] }, lang: Lang): CardFact[] {
  const en = lang === "en";
  const everyone = skill.everyone ?? (skill.install ? forEveryone({ install: skill.install }) : false);
  if (everyone) return [{ kind: "ready", text: en ? "No install" : "Sans installation" }];
  const tools = skill.agents.filter((a) => a !== "any").map((a) => clientName(a, lang));
  // Four or fewer are all named; past that, three and how many more (« et 3 autres »).
  const more = tools.length - 3;
  const named = tools.length > 4 ? `${tools.slice(0, 3).join(", ")}${en ? ` and ${more} more` : ` et ${more} autres`}` : tools.join(", ");
  return [{ kind: "install", text: tools.length ? (en ? `In ${named}` : `Dans ${named}`) : (en ? "In a coding tool" : "Dans un outil de code") }];
}

export interface McpCard {
  slug: string; name: string; publisher: string; host_tool: string; host_name?: string; category: string | null; summary: Pair; card?: Pair;
  status?: "ga" | "beta"; transport?: "remote" | "local"; auth?: ("oauth" | "key" | "none")[]; access?: string;
  plan: McpSheet["plan"]; kinds: AgentCapabilityKind[]; capability_kinds: AgentCapabilityKind[]; one_click: Assistant[]; clients?: string[];
  setup?: McpSheet["setup"]; safeguards?: McpSheet["safeguards"]; for?: Pair; not_for?: Pair;
  tools: number; skills: number;
  /** How many of the catalogue's stacks hold the host tool (the hub's « À la une » order). */
  in_stacks: number;
  verified_on: string;
}

export interface SkillCard {
  slug: string; name: string; publisher: string; host_tool: string; server: string | null; category: string | null;
  summary: Pair; agents: string[]; verified_on: string; display_name?: Pair;
  /** Usable without a coding tool (forEveryone, projected). */
  everyone: boolean;
}

export type Lang = "fr" | "en";
/**
 * French typography for everything the section renders: a non-breaking space inside « » and before : ; ? !, so a
 * guillemet or a colon never ends up alone at a line's start or end (17/11). English text is left as it is.
 */
export const typo = (text: string) => text
  .replace(/« /g, "«\u00a0").replace(/ »/g, "\u00a0»")
  .replace(/ ([:;?!])/g, "\u00a0$1");
export const say = (lang: Lang, pair: Pair | readonly [string, string]) =>
  typo(Array.isArray(pair) ? (lang === "en" ? pair[1] : pair[0]) : lang === "en" ? (pair as Pair).en : (pair as Pair).fr);

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

/**
 * A fact at a card's foot; the card draws the icon of its kind. A server card says how it plugs into your assistant
 * and the gravest thing it can do (step 4, 17/11: no technical words such as « En ligne » or « Votre compte »).
 */
export type CardFact = { kind: "one_click" | "configure" | "elsewhere" | AgentCapabilityKind | "install" | "ready" | "tool"; text: string };
/** A card sentence fits two lines of the narrowest card, a media card in a row of four (step 8d); the research validator holds the same 50. */
export const CARD_MAX = 50;
/** A card says one sentence: the summary's first, never cut mid-sentence by the card. */
export const cardSentence = (text: string) => text.match(/^.+?[.!?](\s|$)/)?.[0].trim() ?? text;
/** A card's sentence from text not written for cards (a skill's summary, a tool's description): its first sentence when that fits, or none, never cut. */
export const cardLine = (text?: string) => { if (!text) return undefined; const first = cardSentence(text); return first.length <= CARD_MAX ? first : undefined; };
/** ToolTrim's name for a server: the tool's name, or « Figma, application de bureau » when the tool has two. */
export function serverName(card: Pick<McpCard, "transport" | "name">, toolName: string, hasSibling: boolean, lang: Lang) {
  if (!hasSibling) return toolName;
  if (card.transport === "local") return lang === "en" ? `${toolName}, desktop app` : `${toolName}, application de bureau`;
  if (card.transport === "remote") return lang === "en" ? `${toolName}, online` : `${toolName}, en ligne`;
  return card.name;
}
/** « Par Notion · Officiel ». */
export const byLine = (publisher: string, lang: Lang) => (lang === "en" ? `By ${publisher} · Official` : `Par ${publisher} · Officiel`);

/**
 * One vocabulary of consequence for the whole section, said from the person's side (Michael, 17/11): it replaces
 * « Lit / Modifie / Supprime / Envoie / Paie » everywhere (action list, « Garder la main », request cards, hub, gateway).
 */
export const CONSEQUENCE: Record<AgentCapabilityKind, readonly [string, string]> = {
  read: ["Lecture seule", "Read only"],
  write: ["Modifie vos données", "Edits your data"],
  send: ["Envoie en votre nom", "Sends in your name"],
  delete: ["Supprime des données", "Deletes data"],
  pay: ["Engage un paiement", "Makes a payment"],
};
/** Gravest first: what the list and the risk chapter show first. */
export const CONSEQUENCE_ORDER: AgentCapabilityKind[] = ["delete", "pay", "send", "write", "read"];
