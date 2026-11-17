import type { ReactNode } from "react";
import type { AgentAccess as AgentAccessData } from "@/data/types";
import type { Advice } from "@/lib/agents";
import { LinkArrow, linkClass } from "../Button/Button";
import { agentVerdict, factWords, leadServer, longDate, say, type Lang } from "./agentVerdict";
import { CONSEQUENCE } from "@/lib/agents";
import Prompt from "../Prompt/Prompt";
import styles from "./AgentAccess.module.css";

/*
 * The gateway on a tool page (S1, 16/11/2026; tone of S1 bis, 17/11): one verdict sentence, a request you could
 * type, our view, three facts and « Brancher Notion à votre assistant », the link to the server sheet.
 * No badge, no client logo. The page renders nothing without a block: absent means not checked,
 * « none » means checked and none found.
 */
export default function AgentAccess({ access, lang, toolName, advice, renderSheetLink }: {
  access: AgentAccessData;
  lang: Lang;
  /** The tool's name (« Notion »), said in the link and the « none » verdict. */
  toolName: string;
  /** ToolTrim's words for the lead server (example requests, for whom), from src/data/agents/advice.json. */
  advice?: Advice;
  /** The router link to a server sheet (/mcp/:slug); Storybook gives a plain anchor. */
  renderSheetLink?: (slug: string, className: string, content: ReactNode) => ReactNode;
}) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const note = lang === "en" ? access.noteEn ?? access.note : access.note;
  const date = longDate(access.verifiedOn, lang);
  const link = renderSheetLink ?? ((slug: string, className: string, content: ReactNode) => <a className={className} href={`/${lang}/mcp/${slug}`}>{content}</a>);
  const linked = access.servers.filter((server) => server.mcpSlug);

  return (
    <div className={styles.block} data-agent-access={access.mcp}>
      <div className={styles.lead}>
        <p className={styles.verdict}>{access.mcp === "none"
          ? t(`${toolName} ne se branche pas encore officiellement à un assistant IA.`, `${toolName} does not plug into an AI assistant officially yet.`)
          : agentVerdict(access, lang)}</p>
        {note && <p className={styles.text}>{note}</p>}
      </div>

      {access.mcp === "official" && advice?.examples?.[0] && (
        <figure className={styles.request}>
          <figcaption className={styles.eyebrow}>{t("Vous pourrez lui demander", "You could ask it")}</figcaption>
          <Prompt text={lang === "en" ? advice.examples[0].en : advice.examples[0].fr} lang={lang} />
        </figure>
      )}
      {access.mcp === "official" && advice?.for && (
        <p className={styles.text}><span className={styles.strong}>{t("Notre avis : ", "Our view: ")}</span>{t(`utile si ${lower(advice.for.fr)}`, `useful if ${lower(advice.for.en)}`)}</p>
      )}

      {access.mcp === "official" && <GatewayFacts access={access} lang={lang} />}

      {linked.length > 0 && (
        <ul className={styles.links}>
          {linked.map((server) => (
            <li key={server.mcpSlug}>{link(server.mcpSlug!, linkClass(), <>
              {linked.length > 1 ? t(`Brancher ${toolName} : ${server.name}`, `Plug in ${toolName}: ${server.name}`) : t(`Brancher ${toolName} à votre assistant`, `Plug ${toolName} into your assistant`)}<LinkArrow />
            </>)}</li>
          ))}
        </ul>
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
const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
const raise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
/** A plan note often opens on the value it details as its own sentence (« Tous les forfaits. Jetons… »): said once. */
const withoutEcho = (note: string, value: string) => note.replace(new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.\\s+`, "i"), "") || note;

/** Three facts: what it can do, on which plan, what holds it back. */
function GatewayFacts({ access, lang }: { access: AgentAccessData; lang: Lang }) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const server = leadServer(access.servers);
  const kinds = KIND_ORDER.filter((kind) => access.capabilities?.some((line) => line.kind === kind));
  const rows: { label: string; value: string; detail?: string }[] = [];
  // The section's one vocabulary of consequence, gravest first (17/11).
  if (kinds.length) rows.push({ label: t("Actions", "Actions"), value: [...kinds].reverse().map((kind) => (lang === "en" ? CONSEQUENCE[kind][1] : CONSEQUENCE[kind][0])).join(" · ") });
  const planNote = lang === "en" ? server.planNoteEn ?? server.planNote : server.planNote;
  const plan = say(lang, factWords.plan[server.plan]);
  rows.push({ label: t("Forfait", "Plan"), value: plan, detail: planNote && withoutEcho(planNote, plan) });
  if (access.safeguards) {
    const words = access.safeguards.map((value) => say(lang, factWords.safeguard[value]));
    rows.push({ label: t("Garde-fous", "Safeguards"), value: words.length ? raise(words.join(", ")) : t("Aucun documenté par l'éditeur", "None documented by the vendor") });
  }
  return (
    <dl className={styles.facts}>
      {rows.map((row) => (
        <div key={row.label} className={styles.row}>
          <dt className={styles.term}>{row.label}</dt>
          <dd className={styles.value}>{row.value}{row.detail && <span className={styles.detail}>{row.detail}</span>}</dd>
        </div>
      ))}
    </dl>
  );
}
