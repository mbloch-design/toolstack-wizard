import { useId, useState, type ReactNode } from "react";
import type { AgentCapabilityKind } from "@/data/types";
import { CONSEQUENCE, say, typo, type CardFact, type Lang } from "@/lib/agents";
import type { ToolStatus } from "@/lib/agentReport";
import { Bot, Check, CreditCard, Eye, Info, Mail, Pencil, Settings2, Sparkles, Trash2, Wrench, Zap } from "@/lib/icons";
import { LinkArrow, linkClass } from "../Button/Button";
import Field from "../Field/Field";
import Prompt from "../Prompt/Prompt";
import styles from "./AgentHub.module.css";

/*
 * The hub /agents as a report (step 4, 17/11/2026): your assistant, your tools, one sentence that sums it up, one
 * row per tool (where it stands, the gravest thing the assistant could do there, a request to copy, « Brancher → »),
 * then every tool that plugs in, by family. No need picker, no technical filter, no skills.
 */

type RenderLink = (slug: string, className: string, content: ReactNode) => ReactNode;

export interface ChecklistTool { slug: string; name: string; logo: ReactNode }

/** One of the hub's two questions (« Votre assistant », « Vos outils »): its words, then its control. */
export function HubQuestion({ title, note, children }: { title: string; note?: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <section className={styles.question} aria-labelledby={id}>
      <div className={styles.questionHead}>
        <h2 id={id} className={styles.questionTitle}>{title}</h2>
        {note && <p className={styles.questionNote}>{note}</p>}
      </div>
      {children}
    </section>
  );
}

/** The two questions together: side by side when there is room, the first screen on a phone. */
export function HubQuestions({ children }: { children: ReactNode }) {
  return <div className={styles.questions}>{children}</div>;
}

/**
 * « Vos outils » without a stack: the checked tools as a grid of logos to tick, and the catalogue in a search field.
 * Ticking never writes Ma stack; the page offers that separately.
 */
export function ToolChecklist({ tools, catalogue = [], selected, onToggle, lang }: {
  /** The tools ToolTrim has checked, always shown. */
  tools: ChecklistTool[];
  /** The rest of the catalogue, reached by search. */
  catalogue?: ChecklistTool[];
  selected: string[];
  onToggle: (slug: string) => void;
  lang: Lang;
}) {
  const t = (fr: string, en: string) => typo(lang === "en" ? en : fr);
  const [query, setQuery] = useState("");
  const shown = new Set(tools.map((tool) => tool.slug));
  const needle = query.trim().toLowerCase();
  // A tool ticked from the search stays in view, after the checked ones.
  const extra = catalogue.filter((tool) => !shown.has(tool.slug) && (selected.includes(tool.slug) || (needle.length > 1 && tool.name.toLowerCase().includes(needle))));
  const tile = (tool: ChecklistTool) => {
    const on = selected.includes(tool.slug);
    return (
      <li key={tool.slug}>
        <button type="button" className={styles.check} aria-pressed={on} onClick={() => onToggle(tool.slug)}>
          <span className={styles.logo} aria-hidden="true">{tool.logo}</span>
          <span className={styles.checkName}>{tool.name}</span>
          <span className={styles.checkMark} aria-hidden="true">{on && <Check />}</span>
        </button>
      </li>
    );
  };
  return (
    <div className={styles.checklist}>
      <ul className={styles.checks} aria-label={t("Outils vérifiés", "Checked tools")}>{tools.map(tile)}</ul>
      {catalogue.length > 0 && (
        <Field type="search" label={t("Un autre outil ?", "Another tool?")} placeholder={t("Chercher dans le catalogue", "Search the catalogue")}
          value={query} onChange={(event) => setQuery(event.target.value)} />
      )}
      {extra.length > 0 && <ul className={styles.checks} aria-label={t("Du catalogue", "From the catalogue")}>{extra.slice(0, 12).map(tile)}</ul>}
    </div>
  );
}

const KIND_ICON: Record<AgentCapabilityKind, ReactNode> = { pay: <CreditCard />, delete: <Trash2 />, send: <Mail />, write: <Pencil />, read: <Eye /> };

export interface ReportItem {
  slug: string;
  name: string;
  logo: ReactNode;
  status: ToolStatus;
  /** The server sheet the row leads to. */
  sheet?: string;
  gravest?: AgentCapabilityKind;
  /** A request to copy, from ToolTrim's words for the server. */
  request?: string;
  /** For a tool without an official server: one of its own alternatives that plugs in. */
  alternative?: { slug: string; name: string; logo: ReactNode };
}

/** The report: one row per tool, in the order of the rows given (one click, to set up, elsewhere, none, not checked). */
export function StackReport({ items, assistant, lang, renderSheetLink, renderToolLink, renderReportLink }: {
  items: ReportItem[];
  /** The assistant's name in the rows (« Claude »), or null for « Autre ». */
  assistant: string | null;
  lang: Lang;
  renderSheetLink: RenderLink;
  renderToolLink: RenderLink;
  /** « Signaler cet outil »: the contact page, the tool named in the subject. */
  renderReportLink: (name: string, className: string, content: ReactNode) => ReactNode;
}) {
  const t = (fr: string, en: string) => typo(lang === "en" ? en : fr);
  const status = (item: ReportItem) => ({
    one_click: assistant ? t(`En un clic depuis ${assistant}`, `One click from ${assistant}`) : t("En un clic", "One click"),
    configure: assistant ? t(`À configurer dans ${assistant}`, `To set up in ${assistant}`) : t("À configurer dans votre assistant", "To set up in your assistant"),
    elsewhere: assistant ? t(`L'éditeur ne documente pas ${assistant}`, `The vendor does not document ${assistant}`) : t("L'éditeur ne documente pas votre assistant", "The vendor does not document your assistant"),
    none: t("Pas de branchement officiel", "No official connection"),
    unchecked: t("Pas encore vérifié", "Not checked yet"),
  })[item.status];
  return (
    <ul className={styles.report} aria-label={t("Vos outils", "Your tools")}>
      {items.map((item) => (
        <li key={item.slug} className={styles.reportRow} data-status={item.status}>
          <div className={styles.reportHead}>
            <span className={styles.logo} aria-hidden="true">{item.logo}</span>
            <span className={styles.reportNames}>
              <span className={styles.reportName}>{item.name}</span>
              <span className={styles.reportStatus}>{status(item)}</span>
            </span>
          </div>
          {item.gravest && (
            <p className={styles.consequence} data-alert={item.gravest === "delete" || item.gravest === "pay" || undefined}>
              <span className={styles.consequenceIcon} aria-hidden="true">{KIND_ICON[item.gravest]}</span>{say(lang, CONSEQUENCE[item.gravest])}
            </p>
          )}
          {/* The status already says it does not plug in: only its own alternative that does, when it has one. */}
          {item.status === "none" && item.alternative && (
            <p className={styles.reportText}>{t("Une alternative qui se branche : ", "An alternative that plugs in: ")}{renderToolLink(item.alternative.slug, linkClass("inline"), item.alternative.name)}.</p>
          )}
          {item.request && <div className={styles.reportRequest}><Prompt text={item.request} lang={lang} /></div>}
          {(item.sheet || item.status === "unchecked") && (
            <div className={styles.reportAction}>
              {item.sheet && renderSheetLink(item.sheet, linkClass(), <>{t("Brancher", "Plug in")}<span className={styles.srOnly}> {item.name}</span><LinkArrow shown /></>)}
              {item.status === "unchecked" && renderReportLink(item.name, linkClass("quiet"), <>{t("Signaler cet outil", "Report this tool")}<span className={styles.srOnly}> : {item.name}</span></>)}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

/** One catalogue category of the full list: its name and count, then its cards. */
export function AgentShelf({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  const id = useId();
  return (
    <section className={styles.shelf} aria-labelledby={id}>
      <h3 id={id} className={styles.shelfTitle}>{title} <span className={styles.shelfCount}>{count}</span></h3>
      {children}
    </section>
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
  /** Two facts at the card's foot, each with its icon, so every foot lines up: for a server, how it plugs into your assistant and the gravest consequence. */
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
        {facts?.length ? <span className={styles.cardFacts}>{facts.map((fact) => <span key={fact.text} className={styles.cardFact} data-alert={fact.kind === "delete" || fact.kind === "pay" || undefined}>{FACT_ICONS[fact.kind]}{fact.text}</span>)}</span> : null}
      </>)}
      {action && <div className={styles.cardAction}>{action}</div>}
    </li>
  );
}

const FACT_ICONS: Record<CardFact["kind"], ReactNode> = {
  one_click: <Zap aria-hidden="true" />, configure: <Settings2 aria-hidden="true" />, elsewhere: <Info aria-hidden="true" />,
  pay: <CreditCard aria-hidden="true" />, delete: <Trash2 aria-hidden="true" />, send: <Mail aria-hidden="true" />, write: <Pencil aria-hidden="true" />, read: <Eye aria-hidden="true" />,
  skill: <Sparkles aria-hidden="true" />, tool: <Wrench aria-hidden="true" />, assistant: <Bot aria-hidden="true" />,
};


export function AgentCards({ label, flat = false, children }: { label: string;
  /** The sheet's one card shape (step 1 bis): white, resting shadow, three columns. */
  flat?: boolean; children: ReactNode }) {
  return <ul className={styles.cards} data-flat={flat || undefined} aria-label={label}>{children}</ul>;
}
