import { useId } from "react";
import Logo from "../Logo/Logo";
import { displayFigure } from "../figure";
import styles from "./Budget.module.css";

export type BudgetTool = { id: string; name: string; slug?: string; logo?: string; paid: boolean | null };
export type BudgetProps = {
  lang: "fr" | "en";
  /** The whole stack, most expensive first. paid: null while its price is not known. */
  tools: BudgetTool[];
  /** Formatted monthly and yearly totals in whole units (a macro view has no cents); null when no price is known yet. */
  monthly: string | null;
  yearly: string | null;
  /** The biggest subscription and its share of the total (0 to 100), for the one line of humour. */
  lead: { name: string; share: number } | null;
  /** What the decisions already saved each month, formatted; null when nothing yet. */
  saved?: string | null;
  /** Prices and plans still to confirm. */
  unsure: { prices: number; plans: number };
  /** Reference date of the currency conversion, already written out, when one took place. */
  rateDate: string | null;
  /** The trust line opens the next open question of the decision card. */
  onConfirmNext?: () => void;
  /** Nothing known yet: ask for the first plan. */
  onStart?: () => void;
  /** Logos load from our own files only (Storybook, tests). */
  localLogosOnly?: boolean;
};

// Logos on one row: 8 when the card is wide, 5 on a phone; the rest is a +N tile.
const WIDE_LOGOS = 8;
const NARROW_LOGOS = 5;
const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

/** The macro view of Ma stack: what the stack is, what it costs, and how far the figure can be trusted. */
export default function Budget({ lang, tools, monthly, yearly, lead, saved = null, unsure, rateDate, onConfirmNext, onStart, localLogosOnly = false }: BudgetProps) {
  const titleId = useId();
  const fr = lang === "fr";
  const t = (a: string, b: string) => (fr ? a : b);
  const paid = tools.filter((tool) => tool.paid === true).length;
  const free = tools.filter((tool) => tool.paid === false).length;
  const toConfirm = unsure.prices + unsure.plans;
  // Questions are counted, not tools: two questions on one tool must not make the count negative.
  const known = Math.max(0, tools.length - toConfirm);

  // One line of humour, read from the biggest subscription. The tool is the cost, never the payer.
  const quip = !lead ? null
    : tools.length === 1 ? t("Un seul abonnement, et il fait tout le travail.", "One subscription doing all the work.")
    : lead.share >= 75 ? t(`${lead.name} fait presque toute la note à lui seul.`, `${lead.name} is almost the whole bill on its own.`)
    : lead.share >= 50 ? t(`${lead.name} pèse plus de la moitié de la note à lui seul.`, `${lead.name} is over half the bill on its own.`)
    : t("Pas de tyran dans la stack.", "No tyrant in this stack.");

  // What the stack is made of, always in the same pattern; one phrase when every tool is paid.
  const unknown = tools.length - paid - free;
  const composition = paid === tools.length
    ? t(`${plural(tools.length, "outil")} payant${tools.length > 1 ? "s" : ""}`, `${tools.length} paid tool${tools.length > 1 ? "s" : ""}`)
    : [
      fr ? plural(tools.length, "outil") : plural(tools.length, "tool"),
      paid > 0 && (fr ? plural(paid, "payant") : `${paid} paid`),
      free > 0 && (fr ? plural(free, "gratuit") : `${free} free`),
      unknown > 0 && t(`${unknown} à préciser`, `${unknown} to check`),
    ].filter(Boolean).join(" · ");

  const left = [
    unsure.prices > 0 && (fr ? `${unsure.prices} prix` : plural(unsure.prices, "price")),
    unsure.plans > 0 && (fr ? plural(unsure.plans, "formule") : plural(unsure.plans, "plan")),
  ].filter(Boolean).join(t(" et ", " and "));

  // The stack first, in every state: it is the one thing the page always knows.
  const stack = (
    <div className={styles.stack}>
      <ul className={styles.logos} aria-label={t("Les outils de la stack", "The tools in the stack")}>
        {tools.slice(0, WIDE_LOGOS).map((tool, index) => (
          <li key={tool.id} title={tool.name} data-wide-only={index >= NARROW_LOGOS && tools.length > NARROW_LOGOS + 1 ? "" : undefined}>
            <Logo tool={tool} localOnly={localLogosOnly} />
            <span className={styles.srOnly}>{tool.name}</span>
          </li>
        ))}
        {tools.length > NARROW_LOGOS + 1 && <li className={styles.more} data-narrow-only="" aria-hidden="true">+{tools.length - NARROW_LOGOS}</li>}
        {tools.length > WIDE_LOGOS && <li className={styles.more} data-wide-only="" aria-hidden="true">+{tools.length - WIDE_LOGOS}</li>}
      </ul>
      <p className={styles.note}>{composition}</p>
    </div>
  );

  return (
    <article className={styles.card} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.eyebrow}>{t("Votre stack", "Your stack")}</h2>

      {monthly ? (
        <div className={styles.total}>
          <p className={styles.figure} data-nowrap="">{displayFigure(monthly)}<small className={styles.unit}>{t("/mois", "/mo")}</small></p>
          <p className={styles.text}>
            <b className={styles.strong}>{t("Soit ", "That's ")}<span data-nowrap="">{yearly}</span>{t(" par an.", " a year.")}</b>
            {quip && <> {quip}</>}
          </p>
          {saved && <p className={styles.gain}>
            <svg className={styles.gainMark} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
            <span>{t("Vous économisez déjà ", "You're already saving ")}<span data-nowrap="">{saved}</span>{t(" par mois.", " a month.")}</span>
          </p>}
        </div>
      ) : stack}

      {monthly ? stack : (
        <div className={styles.start}>
          <h3 className={styles.titleM}>{t("On fait les comptes ?", "Let's talk budget.")}</h3>
          <p className={styles.text}>{t("Dites-nous quelle formule vous utilisez. Promis, pas de tableur.", "Tell us which plan you use. No spreadsheet required, promise.")}</p>
          <button type="button" className={styles.primary} onClick={onStart}>{t("Préciser ma première formule", "Choose my first plan")}</button>
        </div>
      )}

      {tools.length > 0 && monthly && (toConfirm > 0 ? (
        <button type="button" className={styles.trust} onClick={onConfirmNext}>
          <svg className={styles.ring} viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="18" r="15" />
            <circle cx="18" cy="18" r="15" style={{ strokeDasharray: `${(known / tools.length) * 94.2} 94.2` }} />
          </svg>
          <span className={styles.trustText}>
            <span className={styles.label}>{fr ? `${plural(known, "outil")} sur ${tools.length} renseigné${known > 1 ? "s" : ""}` : `${known} of ${plural(tools.length, "tool")} priced`}</span>
            <span className={styles.note}>{t(`Confirmer ${left}`, `Confirm ${left}`)}</span>
          </span>
          <svg className={styles.chevron} viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      ) : (
        <p className={styles.trust}>
          <span className={styles.check} aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          </span>
          <span className={styles.note}>{t("Budget renseigné", "Budget recorded")}</span>
        </p>
      ))}

      {rateDate && <p className={styles.note}>{t(`Montants convertis au taux de référence du ${rateDate}.`, `Amounts converted at the reference rate of ${rateDate}.`)}</p>}
    </article>
  );
}
