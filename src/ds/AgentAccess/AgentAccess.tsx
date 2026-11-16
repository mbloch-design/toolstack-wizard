import { useId } from "react";
import type { AgentAccess as AgentAccessData, AgentServer } from "@/data/types";
import { LinkArrow, linkClass } from "../Button/Button";
import { agentVerdict, factWords, joinWords, longDate, say, type Lang } from "./agentVerdict";
import styles from "./AgentAccess.module.css";

/*
 * What an AI assistant can do in the tool, as a decision: one sentence composed from the fields, then the
 * facts, the date they were checked and the vendor's documentation. No badge, no client logo, no install
 * command (docs/ROADMAP.md, « Axe agentique et MCP »). The page gives the title and renders nothing
 * without a block: absent means not checked, « none » means checked and none found.
 */
export default function AgentAccess({ access, toolName, lang, clientName = (slug) => slug }: {
  access: AgentAccessData;
  toolName: string;
  lang: Lang;
  /** The catalogue name of a client slug (« vs-code » → « VS Code »). */
  clientName?: (slug: string) => string;
}) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const note = lang === "en" ? access.noteEn ?? access.note : access.note;
  const several = access.servers.length > 1;
  const date = longDate(access.verifiedOn, lang);

  return (
    <div className={styles.block} data-agent-access={access.mcp}>
      <div className={styles.lead}>
        <p className={styles.verdict}>{agentVerdict(access, lang)}</p>
        {note && <p className={styles.text}>{note}</p>}
      </div>

      <ToolFacts access={access} lang={lang} />

      {access.servers.length > 0 && (
        <div className={styles.servers} data-several={several || undefined}>
          {access.servers.map((server) => <Server key={server.name} server={server} toolName={toolName} titled={several} lang={lang} clientName={clientName} />)}
        </div>
      )}

      {access.mcp === "none" && (
        <div className={styles.group}>
          <p className={styles.eyebrow}>{t("Où nous avons cherché", "Where we looked")}</p>
          <ul className={styles.sources}>
            {access.sources.map((source) => (
              <li key={source.url}><a className={linkClass("quiet")} href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a></li>
            ))}
          </ul>
        </div>
      )}

      <p className={styles.meta}>
        {access.mcp === "none"
          ? t(`Vérifié le ${date} chez l'éditeur.`, `Checked on ${date} with the vendor.`)
          : t(`Vérifié le ${date} sur la documentation de l'éditeur. L'assistant n'a jamais plus de droits que votre compte.`, `Checked on ${date} against the vendor's documentation. The assistant never has more rights than your account.`)}
      </p>
    </div>
  );
}

const KIND_ORDER = ["read", "write", "delete", "send", "pay"] as const;
const ASSISTANTS = { claude: ["Claude", "Claude"], chatgpt: ["ChatGPT", "ChatGPT"], gemini: ["Gemini", "Gemini"], copilot: ["Copilot", "Copilot"], other: ["Autres assistants", "Other assistants"] } as const;

/** What the assistant can do in the tool, how to plug it, what holds it back: the tool-level facts. */
function ToolFacts({ access, lang }: { access: AgentAccessData; lang: Lang }) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const capabilities = KIND_ORDER.flatMap((kind) => (access.capabilities ?? []).filter((line) => line.kind === kind));
  const rows: { label: string; value: string }[] = capabilities.map((line) => ({ label: say(lang, factWords.kind[line.kind]), value: lang === "en" ? line.en : line.fr }));
  if (access.setup?.length) {
    // One line per way of plugging it: « Claude, Gemini : connecteur intégré ».
    const ways = (Object.keys(factWords.how) as (keyof typeof factWords.how)[]).flatMap((how) => {
      const who = access.setup!.filter((way) => way.how === how).map((way) => say(lang, ASSISTANTS[way.assistant]));
      return who.length ? [`${joinWords(who, lang, t("et", "and"))}${t("\u00a0: ", ": ")}${say(lang, factWords.how[how])}`] : [];
    });
    rows.push({ label: t("Branchement", "Setup"), value: ways.join(t("\u00a0; ", "; ")) });
  }
  if (access.safeguards) {
    const words = access.safeguards.map((value) => say(lang, factWords.safeguard[value]));
    rows.push({ label: t("Garde-fous", "Safeguards"), value: words.length ? sentenceCase(words.join(", ")) : t("Aucun documenté par l'éditeur", "None documented by the vendor") });
  }
  if (!rows.length) return null;
  return (
    <section className={styles.tool} aria-label={t("Ce que l'assistant peut faire", "What the assistant can do")}>
      <dl className={styles.facts}>
        {rows.map((row, index) => (
          <div key={`${row.label}-${index}`} className={styles.row}>
            <dt className={styles.term}>{row.label}</dt>
            <dd className={styles.value}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Server({ server, toolName, titled, lang, clientName }: { server: AgentServer; toolName: string; titled: boolean; lang: Lang; clientName: (slug: string) => string }) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const titleId = useId();
  const planNote = lang === "en" ? server.planNoteEn ?? server.planNote : server.planNote;
  const rows: { label: string; value: string; detail?: string }[] = [];
  if (server.transport) rows.push({ label: t("Connexion", "Connection"), value: say(lang, factWords.transport[server.transport]) });
  rows.push({ label: t("Accès", "Access"), value: server.access ? say(lang, factWords.access[server.access]) : say(lang, factWords.plan.unknown) });
  if (server.auth?.length) rows.push({ label: t("Identification", "Sign-in"), value: sentenceCase(server.auth.map((value) => say(lang, factWords.auth[value])).join(t(" ou ", " or "))) });
  const plan = say(lang, factWords.plan[server.plan]);
  rows.push({ label: t("Forfait", "Plan"), value: plan, detail: planNote && withoutEcho(planNote, plan) });
  if (server.clients?.length) rows.push({ label: t("Assistants", "Assistants"), value: `${server.clients.map(clientName).join(", ")} ${t("seulement", "only")}` });

  return (
    <section className={styles.server} aria-labelledby={titled ? titleId : undefined} aria-label={titled ? undefined : server.name}>
      {titled && <h3 id={titleId} className={styles.eyebrow}>{server.name}</h3>}
      <dl className={styles.facts}>
        {rows.map((row) => (
          <div key={row.label} className={styles.row}>
            <dt className={styles.term}>{row.label}</dt>
            <dd className={styles.value}>{row.value}{row.detail && <span className={styles.detail}>{row.detail}</span>}</dd>
          </div>
        ))}
      </dl>
      <a className={linkClass()} href={server.docsUrl} target="_blank" rel="noopener noreferrer" aria-label={t(`Documentation de l'éditeur : ${server.name} (${toolName})`, `Vendor documentation: ${server.name} (${toolName})`)}>
        {t("Documentation de l'éditeur", "Vendor documentation")}<LinkArrow />
      </a>
    </section>
  );
}

const sentenceCase = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
/** A plan note often opens on the value it details as its own sentence (« Tous les forfaits. Jetons… »): said once.
    Only a whole sentence goes; « Tous les forfaits, mais… » stays as written. */
const withoutEcho = (note: string, value: string) => {
  const echo = new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.\\s+`, "i");
  return note.replace(echo, "") || note;
};
