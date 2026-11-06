import { useId } from "react";
import Logo from "../Logo/Logo";
import styles from "./Budget.module.css";

export type BudgetTool = { id: string; name: string; slug?: string; logo?: string; paid: boolean | null };
export type BudgetProps = {
  lang: "fr" | "en";
  /** The whole stack, most expensive first. paid: null while its price is not known. */
  tools: BudgetTool[];
  /** Formatted monthly and yearly totals; null when no price is known yet. */
  monthly: string | null;
  yearly: string | null;
  /** The biggest subscription and its share of the total (0 to 100), for the one line of humour. */
  lead: { name: string; share: number } | null;
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

const SHOWN_LOGOS = 8;
const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

/** The macro view of Ma stack: what the stack is, what it costs, and how far the figure can be trusted. */
export default function Budget({ lang, tools, monthly, yearly, lead, unsure, rateDate, onConfirmNext, onStart, localLogosOnly = false }: BudgetProps) {
  const titleId = useId();
  const fr = lang === "fr";
  const t = (a: string, b: string) => (fr ? a : b);
  const paid = tools.filter((tool) => tool.paid === true).length;
  const free = tools.filter((tool) => tool.paid === false).length;
  const toConfirm = unsure.prices + unsure.plans;
  const known = tools.length - toConfirm;

  const quip = !lead ? null
    : tools.length === 1 ? t("Un seul abonnement, et il fait tout le travail.", "One subscription doing all the work.")
    : lead.share >= 75 ? t(`${lead.name} en paie presque tout à lui seul.`, `${lead.name} pays for almost all of it.`)
    : lead.share >= 50 ? t(`${lead.name} en paie plus de la moitié à lui seul.`, `${lead.name} pays for over half of it.`)
    : t("Pas de tyran dans la stack.", "No tyrant in this stack.");

  // What the stack is made of. When every tool is paid (or every one free), one phrase says it.
  const unknown = tools.length - paid - free;
  const s = tools.length > 1 ? "s" : "";
  const composition = unknown === 0 && (paid === 0 || free === 0)
    ? t(`${tools.length} outil${s} ${paid > 0 ? "payant" : "gratuit"}${s}`, `${tools.length} ${paid > 0 ? "paid" : "free"} tool${s}`)
    : [
      fr ? plural(tools.length, "outil") : plural(tools.length, "tool"),
      paid > 0 && (fr ? plural(paid, "payant") : `${paid} paid`),
      free > 0 && (fr ? plural(free, "gratuit") : `${free} free`),
    ].filter(Boolean).join(" · ");

  const left = [
    unsure.prices > 0 && (fr ? `${unsure.prices} prix` : plural(unsure.prices, "price")),
    unsure.plans > 0 && (fr ? plural(unsure.plans, "formule") : plural(unsure.plans, "plan")),
  ].filter(Boolean).join(t(" et ", " and "));

  return (
    <article className={styles.card} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.eyebrow}>{t("Votre stack", "Your stack")}</h2>

      {monthly ? (
        <div className={styles.total}>
          <p className={styles.figure} data-nowrap="">{monthly}<small className={styles.unit}>{t("/mois", "/mo")}</small></p>
          <p className={styles.text}>
            <b className={styles.strong}>{t("Soit ", "That is ")}<span data-nowrap="">{yearly}</span>{t(" par an.", " a year.")}</b>
            {quip && <> {quip}</>}
          </p>
        </div>
      ) : (
        <div className={styles.start}>
          <h3 className={styles.titleM}>{t("On fait les comptes ?", "Let's talk budget.")}</h3>
          <p className={styles.text}>{t("Dites-nous quelle formule vous utilisez. Promis, pas de tableur.", "Tell us which plan you use. No spreadsheet required, promise.")}</p>
          <button type="button" className={styles.button} onClick={onStart}>{t("Préciser ma première formule", "Choose my first plan")}</button>
        </div>
      )}

      <div className={styles.stack}>
        <ul className={styles.logos} aria-label={t("Les outils de la stack", "The tools in the stack")}>
          {tools.slice(0, SHOWN_LOGOS).map((tool) => (
            <li key={tool.id} title={tool.name}>
              <Logo tool={tool} localOnly={localLogosOnly} />
              <span className={styles.srOnly}>{tool.name}</span>
            </li>
          ))}
          {tools.length > SHOWN_LOGOS && <li className={styles.more}>+{tools.length - SHOWN_LOGOS}</li>}
        </ul>
        <p className={styles.note}>{composition}</p>
      </div>

      {tools.length > 0 && monthly && (toConfirm > 0 ? (
        <button type="button" className={styles.trust} onClick={onConfirmNext}>
          <svg className={styles.ring} viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="18" r="15" />
            <circle cx="18" cy="18" r="15" style={{ strokeDasharray: `${(Math.max(known, 0) / tools.length) * 94.2} 94.2` }} />
          </svg>
          <span className={styles.trustText}>
            <span className={styles.label}>{fr ? `${plural(known, "outil")} sur ${tools.length} renseigné${known > 1 ? "s" : ""}` : `${known} of ${plural(tools.length, "tool")} priced`}</span>
            <span className={styles.note}>{t(`${left} à confirmer`, `${left} to confirm`)}</span>
          </span>
        </button>
      ) : (
        <p className={styles.trust}>
          <span className={styles.check} aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          </span>
          <span className={styles.label}>{t("Budget renseigné", "Budget recorded")}</span>
        </p>
      ))}

      {rateDate && <p className={styles.note}>{t(`Montants convertis au taux de référence du ${rateDate}.`, `Amounts converted at the reference rate of ${rateDate}.`)}</p>}
    </article>
  );
}
