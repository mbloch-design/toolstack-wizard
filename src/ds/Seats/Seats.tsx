import { useState } from "react";
import styles from "./Seats.module.css";

export type SeatsProps = {
  lang: "fr" | "en";
  /** The per-user plan picked in step 1. */
  plan: string;
  seats: number;
  onChange: (seats: number) => void;
  /** The plan's monthly price for this many people, formatted (never a rounded unit price times seats). */
  total: string;
  onConfirm: () => void;
  onChangePlan: () => void;
};

const PRESETS = [1, 2, 5, 10, 25];
const DRAWN = 12;

/** Step 2 of a per-user plan: how many people. Usual team sizes in one tap, a stepper to fine-tune. */
export default function Seats({ lang, plan, seats, onChange, total, onConfirm, onChangePlan }: SeatsProps) {
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en);
  // At the floor the stepper answers with a smile instead of going dead.
  const [nudge, setNudge] = useState(false);
  const set = (n: number) => onChange(Math.min(500, Math.max(1, n)));
  return (
    <div className={styles.seats} data-seats="">
      <p className={styles.plan}>
        <span><b className={styles.strong}>{plan}</b> · {t("facturé par personne", "billed per person")}</span>
        <button type="button" className={styles.link} onClick={onChangePlan}>{t("Changer", "Change")}</button>
      </p>
      <p className={styles.question}>{t("Vous êtes combien à l’utiliser ?", "How many of you use it?")}</p>
      <div className={styles.row}>
        <div className={styles.presets} role="group" aria-label={t("Tailles d’équipe", "Team sizes")}>
          {PRESETS.map((n) => <button key={n} type="button" aria-pressed={seats === n} onClick={() => set(n)}>{n}</button>)}
        </div>
        <div className={styles.stepper} data-nope={nudge ? "" : undefined} role="group" aria-label={t("Nombre de personnes", "Number of people")} onAnimationEnd={() => setNudge(false)}>
          <button type="button" aria-disabled={seats <= 1} aria-label={t("Une personne de moins", "One fewer")}
            onClick={() => { if (seats <= 1) { setNudge(false); requestAnimationFrame(() => setNudge(true)); return; } setNudge(false); set(seats - 1); }}>−</button>
          <output aria-live="polite">{seats}</output>
          <button type="button" aria-label={t("Une personne de plus", "One more")} onClick={() => set(seats + 1)}>+</button>
        </div>
        <button type="button" className={styles.primary} onClick={onConfirm}>{t("Valider", "Confirm")}</button>
      </div>
      <p className={styles.nudge} aria-live="polite">{nudge ? t("Il faut bien quelqu’un pour payer.", "Someone has to pay.") : ""}</p>
      {/* The team, drawn: one figure per person. */}
      <div className={styles.crew} aria-hidden="true">
        <span className={styles.people}>
          {Array.from({ length: Math.min(seats, DRAWN) }, (_, index) => <i key={index}><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></svg></i>)}
          {seats > DRAWN && <em>+{seats - DRAWN}</em>}
        </span>
        <span className={styles.sum}>{t(`${seats} personne${seats > 1 ? "s" : ""}`, `${seats} ${seats > 1 ? "people" : "person"}`)} · <b className={styles.strong} data-nowrap="">{total}</b>{t("/mois", "/mo")}</span>
      </div>
    </div>
  );
}
