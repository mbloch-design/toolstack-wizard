import { useId, type ReactNode } from "react";
import type { AgentCapabilityKind } from "@/data/types";
import { CONSEQUENCE, say, typo, type CardFact, type Lang } from "@/lib/agents";
import { CheckCircle2, Code2, CreditCard, Eye, Info, Mail, Pencil, Settings2, Trash2, Wrench, Zap } from "@/lib/icons";
import Prompt from "../Prompt/Prompt";
import styles from "./AgentHub.module.css";

/*
 * The agents section's pieces (step 8, 18/11/2026): the hub is on the catalogue's template (CatalogToolbar, media cards,
 * ToolRow); here, what a server says on a shelf row, the recipes, and the sheet cards. The report on a stack lives in
 * Ma stack (agentReport).
 */

const KIND_ICON: Record<AgentCapabilityKind, ReactNode> = { pay: <CreditCard />, delete: <Trash2 />, send: <Mail />, write: <Pencil />, read: <Eye /> };

export interface RecipeItem {
  id: string;
  /** The request to copy, in the page's language. */
  request: string;
  /** The two tools, each with its logo and the gravest consequence of what the recipe does there. */
  sides: { name: string; logo: ReactNode; gravest?: AgentCapabilityKind }[];
}

/**
 * Recipes between two tools of the stack (step 6, 18/11/2026): the two logos, the request to copy, then what each side
 * can do at worst, in the section's vocabulary of consequence. Three at most; the page decides which.
 */
export function RecipeCards({ items, lang }: { items: RecipeItem[]; lang: Lang }) {
  const t = (fr: string, en: string) => typo(lang === "en" ? en : fr);
  return (
    <ul className={styles.recipes} aria-label={t("Avec deux de vos outils", "With two of your tools")}>
      {items.map((item) => (
        <li key={item.id} className={styles.recipe} data-recipe={item.id}>
          <span className={styles.recipeLogos} aria-hidden="true">{item.sides.map((side) => <span key={side.name} className={styles.logo}>{side.logo}</span>)}</span>
          <Prompt text={typo(item.request)} lang={lang} />
          <ul className={styles.recipeSides} aria-label={t("Ce que chaque outil peut faire", "What each tool can do")}>
            {item.sides.map((side) => side.gravest && (
              <li key={side.name} className={styles.consequence} data-alert={side.gravest === "delete" || side.gravest === "pay" || undefined}>
                <span className={styles.consequenceIcon} aria-hidden="true">{KIND_ICON[side.gravest]}</span>{side.name}{lang === "en" ? ": " : "\u00a0: "}{lower(say(lang, CONSEQUENCE[side.gravest]))}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

const FACT_ICONS: Record<CardFact["kind"], ReactNode> = {
  one_click: <Zap aria-hidden="true" />, configure: <Settings2 aria-hidden="true" />, elsewhere: <Info aria-hidden="true" />,
  pay: <CreditCard aria-hidden="true" />, delete: <Trash2 aria-hidden="true" />, send: <Mail aria-hidden="true" />, write: <Pencil aria-hidden="true" />, read: <Eye aria-hidden="true" />,
  install: <Code2 aria-hidden="true" />, ready: <CheckCircle2 aria-hidden="true" />, tool: <Wrench aria-hidden="true" />,
};


/** The consequences worth a word on a row (step 8, 18/11/2026): deleting, paying, sending in your name. */
const GRAVE: AgentCapabilityKind[] = ["pay", "delete", "send"];
type StatusKind = "one_click" | "configure" | "elsewhere";

/**
 * What a server or a skill says on the catalogue's row (step 8; one line, step 8d — Michael on Webflow: « mauvaise
 * mise en page »): its card sentence, then one quiet line of meta, its pieces joined by « · », at most one 16 px icon.
 * For a server, the status said for the assistant it names (« Non documenté pour Claude »; Claude when none is chosen)
 * and, only when it is grave, the consequence as its mark in the alert colour (its words read aloud and on hover), so
 * the line holds in the narrowest row. For a skill, where it works.
 */
export function AgentRowNote({ summary, status, assistant = "Claude", gravest, meta, lang }: { summary?: string; status?: StatusKind;
  /** The assistant the status speaks for, by name; null for « Autre » (« votre assistant »). */
  assistant?: string | null;
  gravest?: AgentCapabilityKind;
  /** A skill's one fact instead of the status (« Sans installation », « Dans Claude Code, Cursor »). */
  meta?: CardFact; lang: Lang }) {
  const t = (fr: string, en: string) => typo(lang === "en" ? en : fr);
  const grave = gravest && GRAVE.includes(gravest) ? gravest : undefined;
  const who = assistant ?? t("votre assistant", "your assistant");
  const statusText = status && { one_click: t(`En un clic avec ${who}`, `One click with ${who}`), configure: t(`À configurer pour ${who}`, `To set up for ${who}`), elsewhere: t(`Non documenté pour ${who}`, `Not documented for ${who}`) }[status];
  const pieces = [
    statusText && <span key="status" className={styles.rowFact} data-status={status}>{statusText}</span>,
    meta && <span key="meta" className={styles.rowFact} data-meta={meta.kind}>{meta.text}</span>,
    // The grave consequence as its mark alone, so the meta holds one line; its words for assistive tech and on hover.
    grave && <span key="grave" className={styles.rowFact} data-alert={grave === "delete" || grave === "pay" || undefined} data-grave={grave} title={say(lang, CONSEQUENCE[grave])}>{KIND_ICON[grave]}<span className={styles.srOnly}>{say(lang, CONSEQUENCE[grave])}</span></span>,
  ].filter(Boolean);
  return <>
    {summary && <span className={styles.rowSummary}>{summary}</span>}
    {pieces.length > 0 && <span className={styles.rowMeta}>{pieces.map((piece, index) => <span key={index} className={styles.rowPiece}>{index > 0 && <span aria-hidden="true">{" · "}</span>}{piece}</span>)}</span>}
  </>;
}

