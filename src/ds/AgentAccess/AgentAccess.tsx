import type { ReactNode } from "react";
import type { AgentAccess as AgentAccessData } from "@/data/types";
import { typo, type Advice } from "@/lib/agents";
import { LinkArrow, linkClass } from "../Button/Button";
import { agentVerdict, type Lang } from "./agentVerdict";
import Prompt from "../Prompt/Prompt";
import styles from "./AgentAccess.module.css";

/** A tool of the same category that plugs in, offered when this one does not. */
export type AgentAlternative = { slug: string; name: string; logo: ReactNode };

/*
 * The gateway on a tool page (step 2, 17/11/2026): short, in the tool page's grammar, no card and no grey.
 * One verdict in the section's vocabulary of consequence, one request you could type, « Brancher Notion à votre
 * assistant → » to the server sheet. Nothing the page already says (plan only when it restricts access).
 * « none »: one sentence and two or three tools of the same category that plug in. Not checked: the page renders
 * nothing at all.
 */
export default function AgentAccess({ access, lang, toolName, advice, after = false, alternatives = [], renderSheetLink, renderToolLink }: {
  access: AgentAccessData;
  lang: Lang;
  /** The tool's name (« Notion »), said in the verdict and the link. */
  toolName: string;
  /** ToolTrim's words for the lead server (example requests), from src/data/agents/advice.json. */
  advice?: Advice;
  /** The block follows « Les IA qui comptent ici »: it opens on a one-sentence transition, never a second title. */
  after?: boolean;
  /** For « none »: tools of the same category that plug in. */
  alternatives?: AgentAlternative[];
  /** The router link to a server sheet (/mcp/:slug); Storybook gives a plain anchor. */
  renderSheetLink?: (slug: string, className: string, content: ReactNode) => ReactNode;
  /** The router link to a tool page (/tool/:slug); Storybook gives a plain anchor. */
  renderToolLink?: (slug: string, className: string, content: ReactNode) => ReactNode;
}) {
  const t = (fr: string, en: string) => typo(lang === "en" ? en : fr);
  const sheetLink = renderSheetLink ?? ((slug: string, className: string, content: ReactNode) => <a className={className} href={`/${lang}/mcp/${slug}`}>{content}</a>);
  const toolLink = renderToolLink ?? ((slug: string, className: string, content: ReactNode) => <a className={className} href={`/${lang}/tool/${slug}`}>{content}</a>);
  const linked = access.servers.filter((server) => server.mcpSlug);
  const example = advice?.examples?.[0];

  if (access.mcp === "none") {
    return (
      <div className={styles.block} data-agent-access="none" data-after={after || undefined}>
        <p className={styles.verdict}>{t(`${toolName} ne se branche pas à un assistant IA.`, `${toolName} does not plug into an AI assistant.`)}</p>
        {alternatives.length > 0 && <>
          <p className={styles.text}>{t("Ces outils de la même catégorie se branchent :", "These tools of the same category plug in:")}</p>
          <ul className={styles.alternatives}>
            {alternatives.slice(0, 3).map((tool) => (
              <li key={tool.slug}>{toolLink(tool.slug, styles.alternative, <>{tool.logo}<span className={styles.alternativeName}>{tool.name}</span></>)}</li>
            ))}
          </ul>
        </>}
      </div>
    );
  }

  return (
    <div className={styles.block} data-agent-access={access.mcp} data-after={after || undefined}>
      {after && <p className={styles.text}>{t(`Et votre propre assistant ? Il peut travailler directement dans ${toolName}.`, `And your own assistant? It can work directly in ${toolName}.`)}</p>}
      <p className={styles.verdict}>{typo(agentVerdict(access, lang))}</p>
      {example && <Prompt text={lang === "en" ? example.en : example.fr} lang={lang} />}
      {linked.length > 0 && (
        <ul className={styles.links}>
          {linked.map((server) => (
            <li key={server.mcpSlug}>{sheetLink(server.mcpSlug!, linkClass(), <>
              {linked.length > 1 ? t(`Brancher ${toolName} : ${server.name}`, `Plug in ${toolName}: ${server.name}`) : t(`Brancher ${toolName} à votre assistant`, `Plug ${toolName} into your assistant`)}<LinkArrow shown />
            </>)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
