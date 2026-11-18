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
 * What a server or a skill says on the catalogue's row (step 8; Michael, 18/11: « ce n'est pas cohérent avec la finesse
 * du site »): its card sentence, then one quiet line of meta with 16 px icons — the status for your assistant (« En un
 * clic », « À configurer », « Non documenté ») and, only when it is grave, what it could do at worst; for a skill, where
 * it works. No « Par X · Officiel » (every sheet is official, said once in the page's lead), no foot of two lines.
 */
export function AgentRowNote({ summary, status, gravest, meta, lang }: { summary?: string; status?: StatusKind; gravest?: AgentCapabilityKind;
  /** A skill's one fact instead of the status (« Sans installation », « Dans Claude Code, Cursor »). */
  meta?: CardFact; lang: Lang }) {
  const t = (fr: string, en: string) => typo(lang === "en" ? en : fr);
  const grave = gravest && GRAVE.includes(gravest) ? gravest : undefined;
  const statusText = status && { one_click: t("En un clic", "One click"), configure: t("À configurer", "To set up"), elsewhere: t("Non documenté", "Not documented") }[status];
  return <>
    {summary && <span className={styles.rowSummary}>{summary}</span>}
    {(status || grave || meta) && <span className={styles.rowMeta}>
      {status && <span className={styles.rowFact} data-status={status}>{FACT_ICONS[status]}{statusText}</span>}
      {meta && <span className={styles.rowFact} data-meta={meta.kind}>{FACT_ICONS[meta.kind]}{meta.text}</span>}
      {grave && <span className={styles.rowFact} data-alert={grave === "delete" || grave === "pay" || undefined} data-grave={grave}>{KIND_ICON[grave]}{say(lang, CONSEQUENCE[grave])}</span>}
    </span>}
  </>;
}
