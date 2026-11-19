/*
 * Words of a server sheet that ToolTrim composes from its data (S1 bis, 17/11/2026): the tool list by topic,
 * short source labels, and the whole sheet as Markdown for an assistant. The topics are ToolTrim's own
 * classification, made from each tool's name and line; the vendors do not group their tools this way.
 */
import type { AgentCapabilityKind } from "@/data/types";
import { KIND_WORDS, PLAN_WORDS, RISK_ORDER, SAFEGUARD_WORDS, TRANSPORT_WORDS, authWords, say, typo, type Lang, type McpSheet, type Pair } from "@/lib/agents";

type Tool = NonNullable<McpSheet["tools"]>[number];
const P = (fr: string, en: string): Pair => ({ fr, en });

/** Topics in the order a freelancer reads them; the first rule that matches a tool's name or line wins. */
const TOPICS: { id: string; words: Pair; test: RegExp }[] = [
  { id: "money", words: P("Argent et paiements", "Money and payments"), test: /balance|money|transfer|currency|payout|refund|treasury|recipient|invoice/i },
  { id: "comments", words: P("Commentaires et discussions", "Comments and discussions"), test: /comment|discussion|repl(y|ies)|reaction|suggested.?edit/i },
  { id: "skills", words: P("Skills et agents", "Skills and agents"), test: /skill|agent|session|(^|[-_ ])ask[-_ ]|_ai\b|generative|guidance|instructions/i },
  { id: "files", words: P("Fichiers et images", "Files and images"), test: /file|asset|upload|attachment|image|background|layer|video|export|download|screenshot/i },
  { id: "calendar", words: P("Agenda et rendez-vous", "Calendar and meetings"), test: /event|meeting|calendar|schedul|availab|busy|invitee|no.?show|routing|location/i },
  { id: "people", words: P("Personnes et accès", "People and access"), test: /user|team|group|member|share|role|permission|invit|owner|organi[sz]ation|self\b|whoami|access|connection/i },
  { id: "tasks", words: P("Tâches et suivi du temps", "Tasks and time tracking"), test: /task|time.?(entry|track)|tracking|checklist|dependenc|tag/i },
  { id: "posts", words: P("Publications et réseaux", "Posts and networks"), test: /post|social|channel|idea|blog|campaign|email|message|chat/i },
  { id: "shop", words: P("Boutique", "Store"), test: /product|order|customer|inventory|collection|discount|shop|(^|[-_ ])store|theme|domain/i },
  { id: "forms", words: P("Formulaires", "Forms"), test: /(^|[-_ ])forms?([-_ ]|$)/i },
  { id: "automations", words: P("Automatisations", "Automations"), test: /automation|scenario|zap|webhook|workflow|trigger|(^|[-_ ])actions?([-_ ]|$)/i },
  { id: "stats", words: P("Statistiques et rapports", "Stats and reports"), test: /report|analytic|metric|stat|insight|funnel|conversion|realtime|aeo|seo|keyword/i },
  { id: "design", words: P("Designs et tableaux", "Designs and boards"), test: /design|brand|canvas|frame|(^|[-_ ])boards?([-_ ]|$)|component|style|variable|shader|figjam|diagram|svg|font|interaction|element|code.?connect|librar|plugin/i },
  { id: "databases", words: P("Bases et vues", "Databases and views"), test: /database|data.?source|view|table|record|base|field|schema|query|sql|crm|propert|pipeline|segment|cms|object/i },
  { id: "pages", words: P("Pages et dossiers", "Pages and folders"), test: /page|folder|doc|note|wiki|content|site|sitemap|backlink|version/i },
  { id: "search", words: P("Recherche et documentation", "Search and documentation"), test: /search|fetch|docs?\b|documentation|guide|help|feedback|planner/i },
];
const OTHER = { id: "other", words: P("Autres actions", "Other actions") };

export interface ToolTopic { id: string; words: Pair; tools: Tool[] }

/** The tools grouped by topic, each topic riskiest-first inside, topics in reading order. */
export function toolTopics(tools: Tool[]): ToolTopic[] {
  const groups = new Map<string, ToolTopic>();
  for (const tool of tools) {
    const topic = TOPICS.find((candidate) => candidate.test.test(tool.name)) ?? TOPICS.find((candidate) => candidate.test.test(tool.en)) ?? OTHER;
    if (!groups.has(topic.id)) groups.set(topic.id, { id: topic.id, words: topic.words, tools: [] });
    groups.get(topic.id)!.tools.push(tool);
  }
  const rank = (kind: AgentCapabilityKind) => RISK_ORDER.indexOf(kind);
  return [...TOPICS, OTHER].flatMap((topic) => groups.get(topic.id) ?? []).map((group) => ({ ...group, tools: [...group.tools].sort((a, b) => rank(a.kind) - rank(b.kind)) }));
}


/** « 70 actions : 4 suppriment des données, 2 envoient en votre nom, 26 modifient, 38 en lecture seule ». */
export function toolsSummary(tools: Tool[], lang: Lang) {
  const count = (kind: AgentCapabilityKind) => tools.filter((tool) => tool.kind === kind).length;
  const words: Record<AgentCapabilityKind, [string, string, string, string]> = {
    delete: ["supprime des données", "suppriment des données", "deletes data", "delete data"],
    pay: ["engage un paiement", "engagent un paiement", "makes a payment", "make a payment"],
    send: ["envoie en votre nom", "envoient en votre nom", "sends in your name", "send in your name"],
    write: ["modifie", "modifient", "edits", "edit"],
    read: ["en lecture seule", "en lecture seule", "read only", "read only"],
  };
  const parts = (["delete", "pay", "send", "write", "read"] as const).filter((kind) => count(kind) > 0).map((kind) => {
    const n = count(kind);
    const [one, many, oneEn, manyEn] = words[kind];
    return `${n} ${lang === "en" ? (n > 1 ? manyEn : oneEn) : n > 1 ? many : one}`;
  });
  const total = `${tools.length} action${tools.length > 1 ? "s" : ""}`;
  return lang === "en" ? `${total}: ${parts.join(", ")}` : typo(`${total} : ${parts.join(", ")}`);
}

/** A source, short and in the reader's language (« Liste des outils »), with its domain; the vendor's title stays in the data. */
export function sourceLinks(sources: { label: string; url: string }[], lang: Lang) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const short = (label: string, url: string) => {
    const said = `${label} ${url}`;
    if (/claude\.ai\/directory/.test(url)) return t("Répertoire Claude", "Claude directory");
    if (/supported tools|tools?\b|reference/i.test(label)) return t("Liste des outils", "List of tools");
    if (/github|readme|repo/i.test(said)) return t("Code source", "Source code");
    if (/skill/i.test(label)) return t("Skills", "Skills");
    if (/plan|pricing|faq/i.test(label)) return t("Connexion et forfaits", "Connection and plans");
    if (/connect|setup|set up|get started|getting started|quickstart|install|plugin|client/i.test(label)) return t("Connexion", "Connection");
    if (/access|permission|security|trust|privacy/i.test(label)) return t("Accès et sécurité", "Access and security");
    if (/changelog|blog|announc|launch|news/i.test(said)) return t("Annonce", "Announcement");
    return t("Présentation", "Overview");
  };
  // Near-duplicates merge: the same page, or the same short label on the same site (Notion's two « Supported tools »).
  const seen = new Set<string>();
  return sources.flatMap((source) => {
    let domain = "";
    try { domain = new URL(source.url).hostname.replace(/^www\./, ""); } catch { domain = ""; }
    const label = short(source.label, source.url);
    const keys = [source.url.replace(/#.*$/, ""), `${label}@${domain}`];
    if (keys.some((key) => seen.has(key))) return [];
    keys.forEach((key) => seen.add(key));
    return [{ label, domain, url: source.url, title: source.label }];
  });
}

/** Whole days between two ISO dates. */
export const daysBetween = (from: string, to: Date) => Math.max(0, Math.floor((to.getTime() - new Date(`${from}T00:00:00`).getTime()) / 86_400_000));
export function freshness(verifiedOn: string, now: Date, lang: Lang) {
  const days = daysBetween(verifiedOn, now);
  if (lang === "en") return days === 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`;
  return days === 0 ? "aujourd'hui" : days === 1 ? "il y a 1 jour" : `il y a ${days} jours`;
}

/** The sheet as Markdown, for an assistant: what it does, how to plug it, the risk, the safeguards, the sources. */
export function sheetMarkdown(sheet: McpSheet, { toolName, url, lang }: { toolName: string; url: string; lang: Lang }) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const say = (pair: Pair | readonly [string, string]) => (Array.isArray(pair) ? (lang === "en" ? pair[1] : pair[0]) : lang === "en" ? (pair as Pair).en : (pair as Pair).fr);
  const lines = [
    `# ${t(`Brancher ${toolName} à votre assistant IA`, `Plug ${toolName} into your AI assistant`)} (${sheet.name})`,
    "",
    say(sheet.summary),
    "",
    `- ${t("Éditeur", "Publisher")} : ${sheet.publisher}`,
    ...(sheet.transport ? [`- ${t("Connexion", "Connection")} : ${say(TRANSPORT_WORDS[sheet.transport])}`] : []),
    ...(sheet.auth?.length ? [`- ${t("Compte", "Account")} : ${authWords(sheet.auth, lang)}`] : []),
    `- ${t("Forfait", "Plan")} : ${say(PLAN_WORDS[sheet.plan])}${sheet.plan_note ? ` (${say(sheet.plan_note)})` : ""}`,
    `- ${t("Vérifié le", "Checked on")} ${sheet.verified_on} — ${url}`,
  ];
  if (sheet.capabilities?.length) {
    lines.push("", `## ${t("Ce qu'il peut faire", "What it can do")}`, "");
    for (const kind of RISK_ORDER) for (const line of sheet.capabilities.filter((c) => c.kind === kind)) lines.push(`- ${say(KIND_WORDS[kind])} : ${say(line)}`);
  }
  if (sheet.safeguards) lines.push("", `## ${t("Garde-fous", "Safeguards")}`, "", sheet.safeguards.length ? sheet.safeguards.map((s) => `- ${say(SAFEGUARD_WORDS[s])}`).join("\n") : `- ${t("Aucun documenté par l'éditeur", "None documented by the vendor")}`);
  if (sheet.install.length) {
    lines.push("", `## ${t("Installation (copiée de la documentation de l'éditeur)", "Install (copied from the vendor's documentation)")}`);
    for (const row of sheet.install) lines.push("", `### ${row.client}`, "", row.type === "steps" ? say(row.value) : `\`\`\`${row.type === "config" ? "json" : ""}\n${row.value}\n\`\`\``);
  }
  if (sheet.examples?.length) lines.push("", `## ${t("Demandes types", "Example requests")}`, "", ...sheet.examples.map((e) => `- ${say(e)}`));
  lines.push("", `## Sources`, "", ...sheet.sources.map((s) => `- [${s.label}](${s.url})`), "");
  return lines.join("\n");
}

const HOOK_KINDS = ["read", "write", "delete", "send", "pay"] as const;
const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
const DATA_VERBS = { read: ["lire", "read"], write: ["modifier", "edit"], delete: ["supprimer", "delete"] } as const;
const PLAN_PHRASE = { all: ["Le serveur est disponible sur tous les forfaits.", "The server is available on every plan."], paid: ["Le serveur demande un forfait payant.", "The server needs a paid plan."], specific: ["Le serveur n'est disponible que sur certains forfaits.", "The server is only available on some plans."], unknown: null } as const;

/**
 * The hook under the title, composed from the data only (17/11; rewritten 19/11 after the proofreading: every sentence
 * has its subject and its verb, every verb its object). « Dans Notion, votre assistant peut lire, modifier et supprimer
 * vos données. Côté forfait : fonctionne sur tous les forfaits Notion. Le branchement se fait en un clic depuis Claude,
 * ChatGPT ou Gemini. »
 */
export function hookSentence(sheet: McpSheet, toolName: string, lang: Lang) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const join = (list: string[], last: string) => (list.length < 2 ? list.join("") : `${list.slice(0, -1).join(", ")} ${last} ${list[list.length - 1]}`);
  const has = (kind: (typeof HOOK_KINDS)[number]) => !!sheet.capabilities?.some((line) => line.kind === kind);
  const dataVerbs = (["read", "write", "delete"] as const).filter(has).map((kind) => (lang === "en" ? DATA_VERBS[kind][1] : DATA_VERBS[kind][0]));
  const parts = [
    dataVerbs.length ? t(`${join(dataVerbs, "et")} vos données`, `${join(dataVerbs, "and")} your data`) : null,
    has("send") ? t("agir en votre nom (envoyer, publier ou partager)", "act on your behalf (send, publish or share)") : null,
    has("pay") ? t("engager des paiements", "make payments") : null,
  ].filter(Boolean) as string[];
  const can = parts.length === 1 && dataVerbs.length === 1 && has("read")
    ? t(`Dans ${toolName}, votre assistant peut lire vos données, sans rien y modifier.`, `In ${toolName}, your assistant can read your data without changing anything.`)
    : parts.length ? t(`Dans ${toolName}, votre assistant peut ${join(parts, "et")}.`, `In ${toolName}, your assistant can ${join(parts, "and")}.`)
      : t(`Votre assistant peut travailler dans ${toolName}.`, `Your assistant can work in ${toolName}.`);
  const ways = (["claude", "chatgpt", "gemini", "copilot"] as const).filter((a) => sheet.setup?.some((w) => w.assistant === a && (w.how === "connector" || w.how === "plugin")));
  const names = ways.map((a) => ({ claude: "Claude", chatgpt: "ChatGPT", gemini: "Gemini", copilot: "Copilot" })[a]);
  const path = names.length ? t(`Le branchement se fait en un clic depuis ${join(names, "ou")}.`, `Connecting takes one click from ${join(names, "or")}.`)
    : sheet.transport === "local" ? t("Le serveur tourne sur votre ordinateur.", "The server runs on your computer.")
      : sheet.install.some((row) => row.client === "any" && row.type === "url") ? t("Le branchement se fait en ajoutant l'adresse du serveur à votre assistant.", "You connect it by adding the server's address to your assistant.") : null;
  const planWords = sheet.plan_words ? say(lang, sheet.plan_words.common).replace(/\.$/, "") : null;
  const plan = planWords ? t(`Côté forfait : ${lowerFirst(planWords)}.`, `Plans: ${lowerFirst(planWords)}.`) : (PLAN_PHRASE[sheet.plan]?.[lang === "en" ? 1 : 0] ?? null);
  return [can, plan, path].filter(Boolean).join(" ");
}
