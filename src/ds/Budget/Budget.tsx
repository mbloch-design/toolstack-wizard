import styles from "./Budget.module.css";

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

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
