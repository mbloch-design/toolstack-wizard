/*
 * Words of a server sheet that ToolTrim composes from its data (S1 bis, 17/11/2026): the tool list by topic,
 * short source labels, and the whole sheet as Markdown for an assistant. The topics are ToolTrim's own
 * classification, made from each tool's name and line; the vendors do not group their tools this way.
 */
import type { AgentCapabilityKind } from "@/data/types";
import { KIND_WORDS, PLAN_WORDS, RISK_ORDER, SAFEGUARD_WORDS, TRANSPORT_WORDS, authWords, type Lang, type McpSheet, type Pair } from "@/lib/agents";

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

/** The risk a line carries, said as a verb; nothing for reading. */
export const RISK_PILL: Partial<Record<AgentCapabilityKind, Pair>> = {
  pay: P("Paie", "Pays"), delete: P("Supprime", "Deletes"), send: P("Envoie", "Sends"), write: P("Modifie", "Edits"),
};

/** « 70 actions, dont 5 qui suppriment » / « 15 actions, dont 3 qui paient ». */
export function toolsSummary(tools: Tool[], lang: Lang) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const count = (kind: AgentCapabilityKind) => tools.filter((tool) => tool.kind === kind).length;
  const total = t(`${tools.length} action${tools.length > 1 ? "s" : ""}`, `${tools.length} action${tools.length > 1 ? "s" : ""}`);
  const verbs: [AgentCapabilityKind, string, string, string, string][] = [
    ["pay", "qui paie", "qui paient", "that pays", "that pay"], ["delete", "qui supprime", "qui suppriment", "that deletes", "that delete"],
    ["send", "qui envoie", "qui envoient", "that sends", "that send"], ["write", "qui modifie", "qui modifient", "that edits", "that edit"],
  ];
  const lead = verbs.find(([kind]) => count(kind) > 0);
  if (!lead) return t(`${total}, toutes en lecture`, `${total}, all reading only`);
  const [kind, one, many, oneEn, manyEn] = lead;
  const n = count(kind);
  return t(`${total}, dont ${n} ${n > 1 ? many : one}`, `${total}, ${n} of which ${n > 1 ? manyEn : oneEn}`);
}

/** A source, short and in the reader's language (« Liste des outils »), with its domain; the vendor's title stays in the data. */
export function sourceLinks(sources: { label: string; url: string }[], lang: Lang) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const short = (label: string, url: string) => {
    const said = `${label} ${url}`;
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
    for (const row of sheet.install) lines.push("", `### ${row.client}`, "", row.type === "steps" ? row.value : `\`\`\`${row.type === "config" ? "json" : ""}\n${row.value}\n\`\`\``);
  }
  if (sheet.examples?.length) lines.push("", `## ${t("Demandes types", "Example requests")}`, "", ...sheet.examples.map((e) => `- ${say(e)}`));
  lines.push("", `## Sources`, "", ...sheet.sources.map((s) => `- [${s.label}](${s.url})`), "");
  return lines.join("\n");
}
