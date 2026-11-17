import { useId, useState, type ReactNode } from "react";
import {
  STACK_CALL_WORDS, assistantLabel, guardOf, assistantWords, assistantsOf, plugSteps, riskSentence, say,
  type Lang, type McpCard, type Need, type StackCall,
} from "@/lib/agents";
import Chip, { Chips } from "../Chip/Chip";
import { LinkArrow, linkClass } from "../Button/Button";
import { LinkRow, LinkRows } from "../Catalog/Catalog";
import styles from "./AgentHub.module.css";

/*
 * The hub /agents (S1 bis, 17/11/2026): it starts from the person, not the list. What do you want your assistant
 * to do (a need leads to one tool, the request you could type, the risk in words, three steps and the sheet);
 * what your stack can plug in; where to start. The full list comes after, on the page.
 */

type SheetLink = (slug: string, className: string, content: ReactNode) => ReactNode;

/** « Que voulez-vous que votre assistant fasse ? »: one need at a time, its advice under the choice. */
export function NeedPicker({ needs, cards, lang, toolName, logo, renderSheetLink }: {
  needs: Need[];
  cards: McpCard[];
  lang: Lang;
  /** The catalogue name of a tool (« Notion »), from its slug. */
  toolName: (toolSlug: string) => string;
  /** The system's Logo for a tool slug, 24 px. */
  logo: (toolSlug: string) => ReactNode;
  renderSheetLink: SheetLink;
}) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const [current, setCurrent] = useState(needs[0]?.id);
  const panel = useId();
  const need = needs.find((n) => n.id === current) ?? needs[0];
  const card = need && cards.find((c) => c.slug === need.server);
  if (!need || !card) return null;
  return (
    <div className={styles.picker}>
      <Chips label={t("Besoins", "Needs")}>
        {needs.map((n) => (
          <Chip key={n.id} size="md" pressed={n.id === need.id} aria-controls={panel} onClick={() => setCurrent(n.id)}>{say(lang, n)}</Chip>
        ))}
      </Chips>
      <div id={panel} aria-live="polite">
        <NeedAdvice need={need} card={card} also={need.also.flatMap((slug) => cards.filter((c) => c.slug === slug))}
          lang={lang} toolName={toolName} logo={logo} renderSheetLink={renderSheetLink} />
      </div>
    </div>
  );
}

/** One need's advice: the tool, the request you could type, with which assistant, the risk, our view, three steps. */
function NeedAdvice({ need, card, also, lang, toolName, logo, renderSheetLink }: {
  need: Need; card: McpCard; also: McpCard[]; lang: Lang;
  toolName: (toolSlug: string) => string; logo: (toolSlug: string) => ReactNode; renderSheetLink: SheetLink;
}) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const name = toolName(card.host_tool);
  const assistant = assistantsOf(card.setup)[0];
  const steps = assistant ? plugSteps(card, assistant, name, lang) : [];
  const assistants = assistantWords(card.setup, lang);
  const titleId = useId();
  return (
    <article className={styles.advice} aria-labelledby={titleId} data-need={need.id}>
      <header className={styles.adviceHead}>
        <span className={styles.logo} aria-hidden="true">{logo(card.host_tool)}</span>
        <h3 id={titleId} className={styles.title}>{t(`Branchez ${name} à votre assistant`, `Plug ${name} into your assistant`)}</h3>
      </header>
      <figure className={styles.request}>
        <figcaption className={styles.term}>{t("Vous pourrez lui demander", "You could ask it")}</figcaption>
        <blockquote className={styles.requestText}>{t(`« ${need.example.fr} »`, `“${need.example.en}”`)}</blockquote>
      </figure>
      <dl className={styles.facts}>
        {assistants && <Row label={t("Avec", "With")} value={assistants} />}
        <Row label={t("Le risque", "The risk")} value={riskSentence(guardOf(card), lang)} />
        {card.for && <Row label={t("Notre avis", "Our view")} value={t(`Utile si ${lower(card.for.fr)}`, `Useful if ${lower(card.for.en)}`)} />}
      </dl>
      {steps.length > 0 && assistant && (
        <div className={styles.group}>
          <p className={styles.term}>{t(`En 3 étapes, avec ${assistantLabel(assistant, lang)}`, `In 3 steps, with ${assistantLabel(assistant, lang)}`)}</p>
          <Steps steps={steps} />
        </div>
      )}
      <div className={styles.links}>
        {renderSheetLink(card.slug, linkClass(), <>{t(`Tout savoir pour brancher ${name}`, `All about plugging in ${name}`)}<LinkArrow /></>)}
        {also.length > 0 && (
          <p className={styles.note}>
            {t("Aussi pour ce besoin : ", "Also for this need: ")}
            {also.map((other, i) => (
              <span key={other.slug}>{i > 0 && ", "}{renderSheetLink(other.slug, linkClass("inline"), toolName(other.host_tool))}</span>
            ))}
          </p>
        )}
      </div>
    </article>
  );
}

function Steps({ steps }: { steps: string[] }) {
  return <ol className={styles.steps}>{steps.map((step) => <li key={step} className={styles.step}>{step}</li>)}</ol>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className={styles.row}><dt className={styles.term}>{label}</dt><dd className={styles.value}>{value}</dd></div>;
}
const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

export interface StackAgentItem {
  /** The tool's catalogue slug. */
  slug: string;
  name: string;
  icon: ReactNode;
  call: StackCall;
  /** Its server, when it has one. */
  card?: McpCard;
}

/**
 * « Avec votre stack »: the tools of Ma stack and our call on each (plug it, with care, not yet).
 * Without a stack: a short invitation, never an empty block.
 */
export function StackAgents({ items, lang, renderSheetLink, renderToolLink, renderStackLink }: {
  /** null: the visitor has no stack yet; []: none of its tools has been checked. */
  items: StackAgentItem[] | null;
  lang: Lang;
  renderSheetLink: SheetLink;
  renderToolLink: (slug: string, className: string, content: ReactNode) => ReactNode;
  renderStackLink: (className: string, content: ReactNode) => ReactNode;
}) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  if (!items) {
    return (
      <div className={styles.invite}>
        <p className={styles.text}>{t("Ajoutez vos outils dans Ma stack : nous vous dirons lesquels brancher à votre assistant, et avec quelle prudence.", "Add your tools to My stack: we will tell you which ones to plug into your assistant, and with how much care.")}</p>
        {renderStackLink(linkClass(), <>{t("Composer ma stack", "Build my stack")}<LinkArrow /></>)}
      </div>
    );
  }
  if (!items.length) {
    return <p className={styles.text}>{t("Nous n'avons pas encore vérifié les outils de votre stack. La liste complète, plus bas, dit ce qui se branche aujourd'hui.", "We have not checked the tools of your stack yet. The full list, further down, says what plugs in today.")}</p>;
  }
  const plugged = items.filter((item) => item.card).length;
  const order: StackCall[] = ["plug", "careful", "not_yet"];
  const sorted = order.flatMap((call) => items.filter((item) => item.call === call));
  return (
    <div className={styles.stack}>
      <p className={styles.text}>{plugged === 0
        ? t("Aucun de vos outils ne se branche encore officiellement à un assistant.", "None of your tools plugs into an assistant officially yet.")
        : t(`${plugged} de vos ${items.length} outils se branche${plugged > 1 ? "nt" : ""} à votre assistant.`, `${plugged} of your ${items.length} tools plug${plugged > 1 ? "" : "s"} into your assistant.`)}</p>
      <LinkRows>
        {sorted.map((item) => {
          const detail = item.card ? (item.card.for ? t(`Utile si ${lower(item.card.for.fr)}`, `Useful if ${lower(item.card.for.en)}`) : riskSentence(guardOf(item.card), lang))
            : t("Pas de branchement officiel vérifié chez l'éditeur.", "No official connection checked with the vendor.");
          return (
            <LinkRow key={item.slug} name={item.name} icon={item.icon} detail={detail} note={say(lang, STACK_CALL_WORDS[item.call])}
              renderLink={(className, content) => item.card ? renderSheetLink(item.card.slug, className, content) : renderToolLink(item.slug, className, content)} />
          );
        })}
      </LinkRows>
    </div>
  );
}

/** « Par où commencer »: three habits, then the guide. */
export function StartHere({ lang, renderGuideLink }: { lang: Lang; renderGuideLink: (className: string, content: ReactNode) => ReactNode }) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const points = [
    [t("Choisir son assistant", "Pick your assistant"), t("Claude et ChatGPT branchent en un clic la plupart des outils de cette page ; Gemini et Copilot, quelques-uns. Gardez celui que vous utilisez déjà.", "Claude and ChatGPT plug most tools on this page in one click; Gemini and Copilot, a few. Keep the one you already use.")],
    [t("Brancher d'abord en lecture", "Plug in for reading first"), t("Les premiers jours, demandez des résumés, des recherches, des chiffres. Vous verrez ce que l'assistant comprend de vos outils.", "For the first days, ask for summaries, searches, figures. You will see what the assistant understands of your tools.")],
    [t("Garder la main", "Stay in control"), t("Avant d'accepter, lisez ce qu'il peut modifier, supprimer ou payer. L'assistant n'a jamais plus de droits que votre compte.", "Before accepting, read what it can edit, delete or pay. The assistant never has more rights than your account.")],
  ];
  return (
    <div className={styles.start}>
      <ol className={styles.points}>
        {points.map(([title, text]) => (
          <li key={title} className={styles.point}>
            <p className={styles.pointTitle}>{title}</p>
            <p className={styles.text}>{text}</p>
          </li>
        ))}
      </ol>
      {renderGuideLink(linkClass(), <>{t("Le guide pour freelances non-développeurs", "The guide for non-developer freelancers")}<LinkArrow /></>)}
    </div>
  );
}

/**
 * A sheet as a card (server, skill or the host tool): logo, name, « Par Notion · Officiel », a summary on 2-3 lines,
 * two facts; an action beside the link when the page gives one (« Ajouter à ma stack »).
 */
export function AgentCard({ icon, name, by, summary, facts, renderLink, action }: {
  icon: ReactNode; name: string; by: string; summary?: string; facts?: string[];
  renderLink: (className: string, content: ReactNode) => ReactNode;
  action?: ReactNode;
}) {
  return (
    <li className={styles.cardSlot}>
      {renderLink(styles.agentCard, <>
        <span className={styles.cardHead}>
          <span className={styles.logo} aria-hidden="true">{icon}</span>
          <span className={styles.cardNames}><span className={styles.cardName}>{name}</span><span className={styles.cardBy}>{by}</span></span>
        </span>
        {summary && <span className={styles.cardSummary}>{summary}</span>}
        {facts?.length ? <span className={styles.cardFacts}>{facts.map((fact) => <span key={fact}>{fact}</span>)}</span> : null}
      </>)}
      {action && <div className={styles.cardAction}>{action}</div>}
    </li>
  );
}

export function AgentCards({ label, children }: { label: string; children: ReactNode }) {
  return <ul className={styles.cards} aria-label={label}>{children}</ul>;
}
