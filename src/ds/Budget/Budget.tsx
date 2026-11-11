import { useId, type ReactNode } from "react";
import Logo from "../Logo/Logo";
import Button from "../Button/Button";
import Amount from "../Amount/Amount";
import styles from "./Budget.module.css";

export type BudgetTool = { id: string; name: string; slug?: string; logo?: string; paid: boolean | null };
export type BudgetProps = {
  lang: "fr" | "en";
  /** The whole stack, most expensive first. paid: null while its price is not known. */
  tools: BudgetTool[];
  /** Formatted monthly and yearly totals (whole units after a conversion, invoice cents otherwise); null when no price is known yet. */
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
  /** card: a tile of the board. hero: the opening of the page, without a box: the figure leads, the stack sits beside it. */
  variant?: "card" | "hero";
  /** Hero only: the greeting above the title, and the rare action beside the stack. */
  greeting?: ReactNode;
  aside?: ReactNode;
  /** Inside an opened bento tile: no title nor figure (the tile shows them), the whole stack and how far it is known. */
  dense?: boolean;
};

// Logos on one row, at every width: the row holds 9 tiles on a wide card, 6 on a phone, 5 on a very narrow card;
// past that, the last tile becomes « +N ».
const SLOTS = { wide: 9, mid: 6, small: 5 } as const;
const shownAt = (count: number, slots: number) => (count <= slots ? count : slots - 1);
const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

/** The macro view of Ma stack: what the stack is, what it costs, and how far the figure can be trusted. */
export default function Budget({ lang, tools, monthly, yearly, lead, saved = null, unsure, rateDate, onConfirmNext, onStart, localLogosOnly = false, variant = "card", greeting, aside, dense = false }: BudgetProps) {
  const hero = variant === "hero";
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
    <div className={styles.stack} data-stack="">
      <ul className={styles.logos} aria-label={t("Les outils de la stack", "The tools in the stack")}>
        {tools.slice(0, shownAt(tools.length, SLOTS.wide)).map((tool, index) => (
          <li key={tool.id} title={tool.name} data-out-mid={index >= shownAt(tools.length, SLOTS.mid) ? "" : undefined} data-out-small={index >= shownAt(tools.length, SLOTS.small) ? "" : undefined}>
            <Logo tool={tool} localOnly={localLogosOnly} />
            <span className={styles.srOnly}>{tool.name}</span>
          </li>
        ))}
        {(Object.keys(SLOTS) as (keyof typeof SLOTS)[]).map((tier) => tools.length > SLOTS[tier] && (
          <li key={tier} className={styles.more} data-tier={tier} aria-hidden="true">+{tools.length - (SLOTS[tier] - 1)}</li>
        ))}
      </ul>
      <p className={styles.note}>{composition}</p>
    </div>
  );

  const Heading = hero ? "h1" : "h2";
  return (
    <article className={hero ? styles.hero : styles.card} aria-labelledby={titleId} data-variant={variant} data-dense={dense || undefined}>
      <div className={styles.lead}>
      {hero && greeting && <p className={styles.greeting}>{greeting}</p>}
      <Heading id={titleId} className={styles.eyebrow}>{hero ? t("Ma stack", "My stack") : t("Votre stack", "Your stack")}</Heading>

      {monthly ? (
        <div className={styles.total}>
          <p className={styles.figure}><Amount size={hero ? "hero" : "figure"} value={monthly} unit={t("/mois", "/mo")} /></p>
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

      {!hero && (monthly ? stack : (
        <div className={styles.start}>
          <h3 className={styles.titleM}>{t("On fait les comptes ?", "Let's talk budget.")}</h3>
          <p className={styles.text}>{t("Dites-nous quelle formule vous utilisez. Promis, pas de tableur.", "Tell us which plan you use. No spreadsheet required, promise.")}</p>
          <Button variant="primary" onClick={onStart}>{t("Préciser ma première formule", "Choose my first plan")}</Button>
        </div>
      ))}

      {!hero && tools.length > 0 && monthly && <BudgetTrust lang={lang} known={known} total={tools.length} left={toConfirm > 0 ? left : null} onConfirmNext={onConfirmNext} />}

      {rateDate && <p className={styles.note}>{t(`Montants convertis au taux de référence du ${rateDate}.`, `Amounts converted at the reference rate of ${rateDate}.`)}</p>}
      </div>
      {hero && (monthly ? stack : (
        <div className={styles.start}>
          <h2 className={styles.titleM}>{t("On fait les comptes ?", "Let's talk budget.")}</h2>
          <p className={styles.text}>{t("Dites-nous quelle formule vous utilisez. Promis, pas de tableur.", "Tell us which plan you use. No spreadsheet required, promise.")}</p>
          <Button variant="primary" onClick={onStart}>{t("Préciser ma première formule", "Choose my first plan")}</Button>
        </div>
      ))}
      {hero && aside && <div className={styles.side}>{aside}</div>}
    </article>
  );
}

/**
 * How far the figure can be trusted: a ring that fills as prices are known and opens the next
 * question, or a check once everything is known. In the card, or heading the page's action chapter.
 */
export function BudgetTrust({ lang, known, total, left, onConfirmNext }: { lang: "fr" | "en"; known: number; total: number; left: string | null; onConfirmNext?: () => void }) {
  const fr = lang === "fr";
  const t = (a: string, b: string) => (fr ? a : b);
  if (!left) return (
    <p className={styles.trust}>
      <span className={styles.check} aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
      <span className={styles.note}>{t("Budget renseigné", "Budget recorded")}</span>
    </p>
  );
  return (
    <button type="button" className={styles.trust} onClick={onConfirmNext}>
      <svg className={styles.ring} viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r="15" />
        <circle cx="18" cy="18" r="15" style={{ strokeDasharray: `${(known / total) * 94.2} 94.2` }} />
      </svg>
      <span className={styles.trustText}>
        <span className={styles.label}>{fr ? `${plural(known, "outil")} sur ${total} renseigné${known > 1 ? "s" : ""}` : `${known} of ${plural(total, "tool")} priced`}</span>
        <span className={styles.note}>{t(`Confirmer ${left}`, `Confirm ${left}`)}</span>
      </span>
      <svg className={styles.chevron} viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
    </button>
  );
}
