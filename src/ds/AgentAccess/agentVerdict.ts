import type { AgentAccess, AgentServer } from "@/data/types";

export type Lang = "fr" | "en";
const pick = (lang: Lang, fr: string, en: string) => (lang === "en" ? en : fr);

const MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const parts = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return { y, m, d }; };

/** « 16 novembre 2026 » / « 16 November 2026 ». */
export function longDate(iso: string, lang: Lang) {
  const { y, m, d } = parts(iso);
  return `${d} ${(lang === "en" ? MONTHS_EN : MONTHS_FR)[m - 1]} ${y}`;
}

/** « 16/11 » / « 16 November »: the date of a « none » verdict. */
function shortDate(iso: string, lang: Lang) {
  const { m, d } = parts(iso);
  return lang === "en" ? `${d} ${MONTHS_EN[m - 1]}` : `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

const ACCESS_RANK = { docs_only: 0, read: 1, read_write: 2 } as const;
const PLAN_RANK = { unknown: 0, specific: 1, paid: 2, all: 3 } as const;

/** The server the verdict speaks for: the widest access, then the widest plan, then nothing to install. */
export function leadServer(servers: AgentServer[]) {
  const score = (server: AgentServer) => [server.access ? ACCESS_RANK[server.access] : -1, PLAN_RANK[server.plan], server.transport === "local" ? 0 : 1];
  return [...servers].sort((a, b) => {
    const [x, y] = [score(a), score(b)];
    return y[0] - x[0] || y[1] - x[1] || y[2] - x[2];
  })[0];
}

const COUNT_FR = ["", "", "Deux", "Trois", "Quatre"];
const COUNT_EN = ["", "", "Two", "Three", "Four"];

const ONE_CLICK = ["connector", "plugin"];
const ASSISTANT_NAMES = { claude: "Claude", chatgpt: "ChatGPT", gemini: "Gemini", copilot: "Copilot" } as const;
const KIND_ORDER = ["read", "write", "delete", "send", "pay"] as const;
export const actionVerbs = {
  read: ["lire", "read"], write: ["modifier", "edit"], delete: ["supprimer", "delete"],
  send: ["envoyer ou publier", "send or publish"], pay: ["payer", "pay"],
} as const;

/** « a, b et c » / « a, b and c ». */
export function joinWords(words: string[], lang: Lang, last = pick(lang, "et", "and")) {
  return words.length < 2 ? words.join("") : `${words.slice(0, -1).join(", ")} ${last} ${words[words.length - 1]}`;
}
const raise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Where the assistant reaches it from: « depuis Claude ou ChatGPT en un clic », or how else. */
function reach(access: AgentAccess, lang: Lang) {
  const setup = access.setup ?? [];
  const named = (Object.keys(ASSISTANT_NAMES) as (keyof typeof ASSISTANT_NAMES)[])
    .filter((assistant) => setup.some((way) => way.assistant === assistant && ONE_CLICK.includes(way.how)))
    .map((assistant) => ASSISTANT_NAMES[assistant]);
  if (named.length) return pick(lang, `depuis ${joinWords(named, lang, "ou")} en un clic`, `from ${joinWords(named, lang, "or")} in one click`);
  if (setup.some((way) => way.how === "url")) return pick(lang, "en ajoutant l'adresse de son serveur à votre assistant", "by adding its server address to your assistant");
  if (setup.some((way) => way.how === "local")) return pick(lang, "une fois installé sur votre ordinateur", "once installed on your computer");
  return null;
}

/** What the vendor documents as a safeguard, said once: the confirmation first, or that there is none. */
function guard(access: AgentAccess, lang: Lang) {
  if (!access.safeguards) return null;
  if (access.safeguards.includes("human_confirmation")) return pick(lang, "confirmation demandée avant certaines actions", "asks before some actions");
  if (access.safeguards.length === 0) return pick(lang, "aucun garde-fou documenté par l'éditeur", "no safeguard documented by the vendor");
  if (access.safeguards.includes("no_delete")) return pick(lang, "aucune suppression possible", "cannot delete");
  return null;
}

const PLAN_WORDS = {
  all: ["sur tous les forfaits", "on every plan"], paid: ["sur les forfaits payants", "on paid plans"],
  specific: ["sur certains forfaits", "on some plans"], unknown: null,
} as const;

/**
 * One sentence that says the decision, composed from the fields only:
 * « Depuis Claude ou ChatGPT en un clic, votre assistant peut lire, modifier et supprimer, sur tous les forfaits ;
 *   aucun garde-fou documenté par l'éditeur. »
 */
export function agentVerdict(access: AgentAccess, lang: Lang): string {
  if (access.mcp === "none") return pick(lang, `Pas de serveur MCP officiel au ${shortDate(access.verifiedOn, lang)}.`, `No official MCP server as of ${shortDate(access.verifiedOn, lang)}.`);
  const server = leadServer(access.servers);
  const kinds = KIND_ORDER.filter((kind) => access.capabilities?.some((line) => line.kind === kind));
  let can: string;
  const readOnly = kinds.length === 1 && kinds[0] === "read";
  if (readOnly) can = pick(lang, "votre assistant peut seulement lire", "your assistant can only read");
  else if (kinds.length) can = pick(lang, `votre assistant peut ${joinWords(kinds.map((kind) => actionVerbs[kind][0]), lang)}`, `your assistant can ${joinWords(kinds.map((kind) => actionVerbs[kind][1]), lang)}`);
  else if (server.access === "read_write") can = pick(lang, "votre assistant peut lire et modifier", "your assistant can read and edit");
  else if (server.access === "read") can = pick(lang, "votre assistant peut lire", "your assistant can read");
  else if (server.access === "docs_only") can = pick(lang, "votre assistant peut consulter sa documentation", "your assistant can read its documentation");
  else can = pick(lang, "votre assistant peut s'y connecter", "your assistant can connect to it");
  const where = reach(access, lang);
  const said = [where ? `${raise(where)}, ${can}` : raise(can)];
  const plan = PLAN_WORDS[server.plan];
  if (plan) said.push(pick(lang, plan[0], plan[1]));
  if (server.clients?.length) said.push(pick(lang, "depuis certains assistants seulement", "from some assistants only"));
  if (access.status === "beta") said.push(pick(lang, "en bêta", "in beta"));
  // Read-only already says it cannot delete.
  const safe = readOnly && access.safeguards?.length ? null : guard(access, lang);
  let sentence = `${said.join(", ")}${safe ? `${pick(lang, "\u00a0; ", "; ")}${safe}` : ""}.`;
  const count = access.servers.length;
  if (count > 1) sentence += ` ${pick(lang, `${COUNT_FR[count] ?? count} serveurs officiels.`, `${COUNT_EN[count] ?? count} official servers.`)}`;
  return sentence;
}

/** The words of each fact, FR/EN. */
export const factWords = {
  transport: {
    remote: ["À distance, rien à installer", "Remote, nothing to install"],
    local: ["Sur votre ordinateur, à installer", "On your computer, to install"],
  },
  access: {
    read_write: ["Lecture et écriture", "Read and write"],
    read: ["Lecture seule", "Read only"],
    docs_only: ["Documentation seulement", "Documentation only"],
  },
  auth: {
    // Lower case: joined in a sentence (« Connexion à votre compte ou clé d'API »), its first letter raised.
    oauth: ["connexion à votre compte", "sign in to your account"],
    key: ["clé d'API", "API key"],
    none: ["aucune", "none"],
  },
  kind: {
    read: ["Lire", "Read"],
    write: ["Créer et modifier", "Create and edit"],
    delete: ["Supprimer", "Delete"],
    send: ["Envoyer, publier", "Send, publish"],
    pay: ["Payer", "Pay"],
  },
  how: {
    connector: ["connecteur intégré", "built-in connector"],
    plugin: ["application à ajouter", "app to add"],
    url: ["adresse du serveur à coller", "server address to paste"],
    local: ["installation sur l'ordinateur", "install on your computer"],
  },
  safeguard: {
    human_confirmation: ["confirmation avant certaines actions", "asks before some actions"],
    admin_controls: ["réglages pour l'administrateur", "admin controls"],
    scoped_keys: ["accès limitable à une partie du compte", "access can be limited to part of the account"],
    no_delete: ["aucune suppression possible", "cannot delete"],
  },
  plan: {
    all: ["Tous les forfaits", "Every plan"],
    paid: ["Forfaits payants", "Paid plans"],
    specific: ["Certains forfaits", "Some plans"],
    unknown: ["Non précisé par l'éditeur", "Not stated by the vendor"],
  },
} as const;

export const say = (lang: Lang, words: readonly [string, string]) => (lang === "en" ? words[1] : words[0]);
