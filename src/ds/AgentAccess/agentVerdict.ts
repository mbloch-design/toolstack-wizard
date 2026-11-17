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

const ONE_CLICK = ["connector", "plugin"];
const ASSISTANT_NAMES = { claude: "Claude", chatgpt: "ChatGPT", gemini: "Gemini", copilot: "Copilot" } as const;
export const actionVerbs = {
  read: ["lire", "read"], write: ["modifier", "edit"], delete: ["supprimer", "delete"],
  send: ["envoyer ou publier", "send or publish"], pay: ["payer", "pay"],
} as const;

/** « a, b et c » / « a, b and c ». */
export function joinWords(words: string[], lang: Lang, last = pick(lang, "et", "and")) {
  return words.length < 2 ? words.join("") : `${words.slice(0, -1).join(", ")} ${last} ${words[words.length - 1]}`;
}

const CONSEQUENCE_WORDS = {
  pay: ["Peut engager un paiement.", "Can make a payment."],
  delete: ["Peut supprimer des données.", "Can delete data."],
  send: ["Peut envoyer en votre nom.", "Can send in your name."],
  write: ["Peut modifier vos données.", "Can edit your data."],
  read: ["En lecture seule : sans effet sur vos données.", "Read only: no effect on your data."],
} as const;

/** Where it plugs in, as a sentence: « Se branche en un clic à Claude, ChatGPT et Gemini. » */
function plugs(access: AgentAccess, lang: Lang) {
  const setup = access.setup ?? [];
  const named = (Object.keys(ASSISTANT_NAMES) as (keyof typeof ASSISTANT_NAMES)[])
    .filter((assistant) => setup.some((way) => way.assistant === assistant && ONE_CLICK.includes(way.how)))
    .map((assistant) => ASSISTANT_NAMES[assistant]);
  if (named.length) return pick(lang, `Se branche en un clic à ${joinWords(named, lang)}.`, `Plugs into ${joinWords(named, lang)} in one click.`);
  if (setup.some((way) => way.how === "url")) return pick(lang, "Se branche à votre assistant avec l'adresse de son serveur.", "Plugs into your assistant with its server address.");
  if (setup.some((way) => way.how === "local")) return pick(lang, "S'installe sur votre ordinateur pour votre assistant.", "Installs on your computer for your assistant.");
  return pick(lang, "Se branche à votre assistant.", "Plugs into your assistant.");
}

/**
 * The gateway's verdict in the section's vocabulary of consequence (step 2, 17/11): where it plugs in, the gravest
 * thing it can do, and the plan only when the plan restricts it.
 * « Se branche en un clic à Claude, ChatGPT et Gemini. Peut supprimer des données. »
 */
export function agentVerdict(access: AgentAccess, lang: Lang): string {
  if (access.mcp === "none") return pick(lang, "Ne se branche pas à un assistant IA.", "Does not plug into an AI assistant.");
  const server = leadServer(access.servers);
  const kinds = (["pay", "delete", "send", "write", "read"] as const).filter((kind) => access.capabilities?.some((line) => line.kind === kind));
  const gravest = kinds[0] ?? (server.access === "read_write" ? "write" : server.access === "read" ? "read" : undefined);
  const said = [plugs(access, lang)];
  if (gravest) said.push(pick(lang, CONSEQUENCE_WORDS[gravest][0], CONSEQUENCE_WORDS[gravest][1]));
  else if (server.access === "docs_only") said.push(pick(lang, "Lit seulement sa documentation.", "Reads its documentation only."));
  if (server.plan === "paid") said.push(pick(lang, "Forfait payant requis.", "Paid plan required."));
  if (server.plan === "specific") said.push(pick(lang, "Certains forfaits seulement.", "Some plans only."));
  return said.join(" ");
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
