import { useId, useState, type ReactNode } from "react";
import {
  STACK_CALL_WORDS, assistantLabel, guardOf, assistantWords, assistantsOf, plugSteps, riskSentence, say,
  type CardFact, type Lang, type McpCard, type Need, type StackCall,
} from "@/lib/agents";
import { BarChart3, Bot, Clock3, FolderKanban, Globe, Handshake, Laptop2, Lightbulb, Megaphone, Palette, Search, ShieldCheck, Sparkles, UserRound, Wallet, Wrench } from "@/lib/icons";
import { ButtonArrow, LinkArrow, buttonAttrs, linkClass } from "../Button/Button";
import { LinkRow, LinkRows } from "../Catalog/Catalog";
import Prompt from "../Prompt/Prompt";
import styles from "./AgentHub.module.css";

/*
 * The hub /agents (S1 bis, 17/11/2026; layout pass the same day): it starts from the person, not the list. What do
 * you want your assistant to do (a need leads to one tool, the request you could type, the risk in words, three
 * steps and « Brancher Calendly → »); what your stack can plug in; where to start. The full list comes after.
 */

/** A router link to a sheet; attrs carry a button's look (buttonAttrs) when the link is the block's action. */
type SheetLink = (slug: string, className: string, content: ReactNode, attrs?: Record<string, string>) => ReactNode;
type LinkAttrs = { className: string } & Record<string, string>;
const split = ({ className, ...attrs }: LinkAttrs) => [className, attrs] as const;

const NEED_ICONS: Record<string, ReactNode> = {
  meetings: <Clock3 />, notes: <Search />, payments: <Wallet />, traffic: <BarChart3 />,
  social: <Megaphone />, projects: <FolderKanban />, visuals: <Palette />, clients: <Handshake />,
};

/** « Que voulez-vous que votre assistant fasse ? »: needs as a compact grid of choices, the advice under the choice. */
export function NeedPicker({ needs, cards, lang, toolName, logo, renderSheetLink }: {
  needs: Need[];
  cards: McpCard[];
  lang: Lang;
  /** The catalogue name of a tool (« Notion »), from its slug. */
  toolName: (toolSlug: string) => string;
  /** The system's Logo for a tool slug. */
  logo: (toolSlug: string, size?: 24 | 40) => ReactNode;
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
      <div className={styles.needs} role="group" aria-label={t("Besoins", "Needs")}>
        {needs.map((n) => (
          <button key={n.id} type="button" className={styles.need} aria-pressed={n.id === need.id} aria-controls={panel} onClick={() => setCurrent(n.id)}>
            <span className={styles.needIcon} aria-hidden="true">{NEED_ICONS[n.id] ?? <Bot />}</span>{say(lang, n)}
          </button>
        ))}
      </div>
      <div id={panel} aria-live="polite">
        <NeedAdvice need={need} card={card} also={need.also.flatMap((slug) => cards.filter((c) => c.slug === slug))}
          lang={lang} toolName={toolName} logo={logo} renderSheetLink={renderSheetLink} />
      </div>
    </div>
  );
}

/** One need's advice: the tool, the request you could type, three facts, three steps, « Brancher Calendly → ». */
function NeedAdvice({ need, card, also, lang, toolName, logo, renderSheetLink }: {
  need: Need; card: McpCard; also: McpCard[]; lang: Lang;
  toolName: (toolSlug: string) => string; logo: (toolSlug: string, size?: 24 | 40) => ReactNode; renderSheetLink: SheetLink;
}) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const name = toolName(card.host_tool);
  const assistant = assistantsOf(card.setup)[0];
  const steps = assistant ? plugSteps(card, assistant, name, lang) : [];
  const assistants = assistantWords(card.setup, lang);
  const titleId = useId();
  const [buttonClass, buttonRest] = split(buttonAttrs("primary") as unknown as LinkAttrs);
  return (
    <article className={styles.advice} aria-labelledby={titleId} data-need={need.id}>
      <header className={styles.adviceHead}>
        <span className={styles.logo} aria-hidden="true">{logo(card.host_tool, 40)}</span>
        <h3 id={titleId} className={styles.title}>{name}</h3>
      </header>
      <figure className={styles.request}>
        <figcaption className={styles.term}>{t("Vous pourrez lui demander", "You could ask it")}</figcaption>
        <Prompt text={lang === "en" ? need.example.en : need.example.fr} lang={lang} size="lead" />
      </figure>
      <ul className={styles.factLine}>
        {assistants && <li className={styles.fact}><Bot aria-hidden="true" /><span><span className={styles.srOnly}>{t("Avec : ", "With: ")}</span>{assistants}</span></li>}
        <li className={styles.fact}><ShieldCheck aria-hidden="true" /><span><span className={styles.srOnly}>{t("Le risque : ", "The risk: ")}</span>{riskSentence(guardOf(card), lang)}</span></li>
        {card.for && <li className={styles.fact}><Lightbulb aria-hidden="true" /><span>{t(`Utile si ${lower(card.for.fr)}`, `Useful if ${lower(card.for.en)}`)}</span></li>}
      </ul>
      {steps.length > 0 && assistant && (
        <div className={styles.group}>
          <p className={styles.term}>{t(`En 3 étapes, avec ${assistantLabel(assistant, lang)}`, `In 3 steps, with ${assistantLabel(assistant, lang)}`)}</p>
          <Steps steps={steps} />
        </div>
      )}
      <div className={styles.actions}>
        {renderSheetLink(card.slug, buttonClass, <><span>{t(`Brancher ${name}`, `Plug in ${name}`)}</span><ButtonArrow /></>, buttonRest)}
        {also.length > 0 && (
          <div className={styles.also}>
            <p className={styles.note}>{t("Aussi pour ce besoin", "Also for this need")}</p>
            <ul className={styles.alsoList}>
              {also.map((other) => (
                <li key={other.slug}>{renderSheetLink(other.slug, styles.alsoCard, <>
                  <span className={styles.logo} aria-hidden="true">{logo(other.host_tool)}</span><span className={styles.alsoName}>{toolName(other.host_tool)}</span><LinkArrow />
                </>)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}

function Steps({ steps }: { steps: string[] }) {
  return <ol className={styles.steps}>{steps.map((step) => <li key={step} className={styles.step}>{step}</li>)}</ol>;
}

const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
/** A link that looks like a button: its class, its content, the button's data attributes. */
function buttonLink(variant: "primary" | "secondary", content: ReactNode) {
  const [className, attrs] = split(buttonAttrs(variant) as unknown as LinkAttrs);
  return [className, content, attrs] as const;
}

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
  renderStackLink: (className: string, content: ReactNode, attrs?: Record<string, string>) => ReactNode;
}) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  if (!items) {
    return (
      <div className={styles.invite}>
        <p className={styles.text}>{t("Ajoutez vos outils dans Ma stack : nous vous dirons lesquels brancher à votre assistant, et avec quelle prudence.", "Add your tools to My stack: we will tell you which ones to plug into your assistant, and with how much care.")}</p>
        {renderStackLink(...buttonLink("secondary", <><span>{t("Composer ma stack", "Build my stack")}</span><ButtonArrow /></>))}
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
 * A sheet as a card (server, skill or the host tool): logo, name, « Par Notion · Officiel », one sentence on two
 * lines, two facts with icons at the foot; an action under the link when the page gives one (« Ajouter à ma stack »).
 */
export function AgentCard({ icon, name, by, summary, facts, renderLink, action }: {
  icon: ReactNode; name: string; by: string;
  /** One sentence written for the card, shown on two lines at most. */
  summary?: string;
  /** Two facts at the card's foot, each with its icon, so every foot lines up. */
  facts?: CardFact[];
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
        {facts?.length ? <span className={styles.cardFacts}>{facts.map((fact) => <span key={fact.text} className={styles.cardFact}>{FACT_ICONS[fact.kind]}{fact.text}</span>)}</span> : null}
      </>)}
      {action && <div className={styles.cardAction}>{action}</div>}
    </li>
  );
}

const FACT_ICONS: Record<CardFact["kind"], ReactNode> = {
  online: <Globe aria-hidden="true" />, local: <Laptop2 aria-hidden="true" />, account: <UserRound aria-hidden="true" />,
  skill: <Sparkles aria-hidden="true" />, tool: <Wrench aria-hidden="true" />, assistant: <Bot aria-hidden="true" />,
};

export function AgentCards({ label, flat = false, children }: { label: string;
  /** The sheet's one card shape (step 1 bis): light grey on a white band, no shadow, three columns. */
  flat?: boolean; children: ReactNode }) {
  return <ul className={styles.cards} data-flat={flat || undefined} aria-label={label}>{children}</ul>;
}

/** Filters in labelled groups (« Comment », « Avec quel assistant »): they wrap, never a rail that overflows. */
export function FilterGroups({ groups }: { groups: { label: string; chips: ReactNode }[] }) {
  return (
    <div className={styles.filterGroups}>
      {groups.map((group) => (
        <div key={group.label} className={styles.filterGroup} role="group" aria-label={group.label}>
          <p className={styles.note} aria-hidden="true">{group.label}</p>
          <div className={styles.filterChips}>{group.chips}</div>
        </div>
      ))}
    </div>
  );
}
