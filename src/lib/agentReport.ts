import mcpIndex from "@/data/agents/mcp_index.json";
import checkedNone from "@/data/agents/checked_none.json";
import type { AgentCapabilityKind } from "@/data/types";
import { CONSEQUENCE, say, typo, type CardFact, type Lang, type McpCard, type McpSheet } from "@/lib/agents";

/*
 * The hub as a report (step 4, 17/11/2026): for one assistant and a set of tools, where each tool stands and what the
 * assistant could do there at worst. Everything comes from the agents data; a tool without data is « not checked »,
 * never classed by guess.
 */
export type HubAssistant = "claude" | "chatgpt" | "gemini" | "copilot" | "other";
export const HUB_ASSISTANTS: HubAssistant[] = ["claude", "chatgpt", "gemini", "copilot", "other"];
const ASSISTANT_NAMES: Record<Exclude<HubAssistant, "other">, string> = { claude: "Claude", chatgpt: "ChatGPT", gemini: "Gemini", copilot: "Copilot" };

/** In the report's order: one click, to set up, documented for other assistants only, no official server, not checked. */
export type ToolStatus = "one_click" | "configure" | "elsewhere" | "none" | "unchecked";
export const STATUS_ORDER: ToolStatus[] = ["one_click", "configure", "elsewhere", "none", "unchecked"];
/** Gravest first: what the report says first. */
export const GRAVITY: AgentCapabilityKind[] = ["pay", "delete", "send", "write", "read"];

export const SERVERS = mcpIndex as McpCard[];
const NONE = new Set(checkedNone as string[]);

/** A tool's lead server: online first (Figma has two). */
export const serverOf = (toolSlug: string) => SERVERS.filter((card) => card.host_tool === toolSlug)
  .sort((a, b) => Number(b.transport === "remote") - Number(a.transport === "remote"))[0] as McpCard | undefined;

/** The tools ToolTrim has checked: those with an official server, then those checked without one. */
export const checkedTools = () => [...new Set([...SERVERS.map((card) => card.host_tool), ...NONE])];

/** The assistant's value as the server sheet stores it (same key, tooltrim.agents.client), and back. */
export const fromStoredClient = (stored: string | null): HubAssistant | null =>
  stored ? ((HUB_ASSISTANTS as string[]).includes(stored) ? (stored as HubAssistant) : "other") : null;
export const toStoredClient = (assistant: HubAssistant) => (assistant === "other" ? "any" : assistant);

export interface ReportRow { slug: string; status: ToolStatus; card?: McpCard; gravest?: AgentCapabilityKind }

/** Where one tool stands for one assistant, from the data only. */
export function toolStatus(slug: string, assistant: HubAssistant): ReportRow {
  const card = serverOf(slug);
  if (!card) return { slug, status: NONE.has(slug) ? "none" : "unchecked" };
  const gravest = GRAVITY.find((kind) => card.kinds.includes(kind));
  const oneClick = assistant !== "other" && card.one_click.includes(assistant);
  const documented = card.setup?.some((way) => way.assistant === assistant) ?? false;
  const status: ToolStatus = oneClick ? "one_click" : documented ? "configure" : "elsewhere";
  return { slug, status, card, ...(gravest ? { gravest } : {}) };
}

/** The rows in the report's order; inside a status, the gravest consequence first, then the stack's order. */
export function reportRows(slugs: string[], assistant: HubAssistant): ReportRow[] {
  const rank = (row: ReportRow) => [STATUS_ORDER.indexOf(row.status), row.gravest ? GRAVITY.indexOf(row.gravest) : GRAVITY.length];
  return [...new Set(slugs)].map((slug) => toolStatus(slug, assistant))
    .map((row, index) => ({ row, index }))
    .sort((a, b) => { const [x, y] = [rank(a.row), rank(b.row)]; return x[0] - y[0] || x[1] - y[1] || a.index - b.index; })
    .map(({ row }) => row);
}

export const isPlugged = (row: ReportRow) => row.status === "one_click" || row.status === "configure";

const CONSEQUENCE_VERB: Record<AgentCapabilityKind, [string, string, string, string]> = {
  pay: ["peut engager un paiement", "peuvent engager un paiement", "can make a payment", "can make a payment"],
  delete: ["peut supprimer des données", "peuvent supprimer des données", "can delete data", "can delete data"],
  send: ["peut envoyer en votre nom", "peuvent envoyer en votre nom", "can send in your name", "can send in your name"],
  write: ["peut modifier vos données", "peuvent modifier vos données", "can edit your data", "can edit your data"],
  read: ["est en lecture seule", "sont en lecture seule", "is read only", "are read only"],
};

/**
 * The report in one sentence, from the rows only:
 * « 4 de vos 9 outils se branchent à Claude, dont 3 en un clic. 1 peut engager un paiement. »
 */
export function reportVerdict(rows: ReportRow[], assistant: HubAssistant, lang: Lang): string {
  const en = lang === "en";
  // A tool not checked yet is never counted (step 3, 18/11): the sentence says how many are left aside.
  const checked = rows.filter((row) => row.status !== "unchecked");
  const waiting = rows.length - checked.length;
  const tail = waiting ? ` ${waiting} ${en ? `tool${waiting > 1 ? "s" : ""} not checked yet` : `outil${waiting > 1 ? "s" : ""} pas encore vérifié${waiting > 1 ? "s" : ""}`}.` : "";
  // A figure never ends a line apart from its word (« 1 peut engager… »).
  const tie = (text: string) => typo(text).replace(/(\d) /g, "$1\u00a0");
  if (!checked.length) return tie(en ? "None of your tools is checked yet." : "Aucun de vos outils n'est encore vérifié.");
  const total = checked.length;
  const plugged = checked.filter(isPlugged);
  const oneClick = checked.filter((row) => row.status === "one_click").length;
  const to = assistant === "other" ? (en ? "your assistant" : "à votre assistant") : en ? ASSISTANT_NAMES[assistant] : `à ${ASSISTANT_NAMES[assistant]}`;
  const of = en ? (total === 1 ? "your tool" : `of your ${total} tools`) : total === 1 ? "votre outil" : `de vos ${total} outils`;
  if (!plugged.length) {
    return tie((en
      ? `${total === 1 ? "Your tool does not plug" : `None of your ${total} tools plugs`} into ${to} yet.`
      : total === 1 ? `Votre outil ne se branche pas encore ${to}.` : `Aucun de vos ${total} outils ne se branche encore ${to}.`) + tail);
  }
  const n = plugged.length;
  let first = en
    ? `${total === 1 ? "Your tool plugs" : `${n} ${of} plug${n === 1 ? "s" : ""}`} into ${to}`
    : `${total === 1 ? "Votre outil se branche" : `${n} ${of} se branche${n === 1 ? "" : "nt"}`} ${to}`;
  if (oneClick === n) first += en ? (n === 1 ? ", in one click" : ", all in one click") : n === 1 ? ", en un clic" : ", tous en un clic";
  else if (oneClick > 0) first += en ? `, ${oneClick} of them in one click` : `, dont ${oneClick} en un clic`;
  const gravest = GRAVITY.find((kind) => plugged.some((row) => row.gravest === kind));
  let second = "";
  if (gravest) {
    const count = plugged.filter((row) => row.gravest === gravest).length;
    const [one, many, oneEn, manyEn] = CONSEQUENCE_VERB[gravest];
    second = ` ${count} ${en ? (count === 1 ? oneEn : manyEn) : count === 1 ? one : many}.`;
  }
  return tie(`${first}.${second}${tail}`);
}

/**
 * A server card's foot, for the assistant you chose (step 4, 17/11; every server card of the site): « En un clic avec
 * Claude » or « À configurer » (or that the vendor does not document it), then the gravest consequence.
 */
export function serverFoot(server: { setup?: McpSheet["setup"]; kinds: AgentCapabilityKind[] }, assistant: HubAssistant, lang: Lang): CardFact[] {
  const en = lang === "en";
  const name = assistant === "other" ? null : ASSISTANT_NAMES[assistant];
  const oneClick = assistant !== "other" && (server.setup?.some((way) => way.assistant === assistant && (way.how === "connector" || way.how === "plugin")) ?? false);
  const documented = server.setup?.some((way) => way.assistant === assistant) ?? false;
  const status: CardFact = oneClick ? { kind: "one_click", text: en ? `One click with ${name}` : `En un clic avec ${name}` }
    : documented ? { kind: "configure", text: en ? "To set up" : "À configurer" }
    : { kind: "elsewhere", text: name ? (en ? `Not documented for ${name}` : `Non documenté pour ${name}`) : (en ? "Not documented for your assistant" : "Non documenté pour votre assistant") };
  const gravest = GRAVITY.find((kind) => server.kinds.includes(kind));
  return [status, ...(gravest ? [{ kind: gravest, text: say(lang, CONSEQUENCE[gravest]) }] : [])];
}
