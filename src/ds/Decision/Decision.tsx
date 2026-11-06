import { useId, type ReactNode } from "react";
import styles from "./Decision.module.css";

export type DecisionLink = { label: string; onClick: () => void; quiet?: boolean };
export type DecisionProps = {
  lang: "fr" | "en";
  eyebrow: string;
  /** Where this question sits in the run; the track shows up to eight steps. */
  step?: { current: number; total: number };
  /** The tool in question, beside the question. */
  media?: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
  /** The answers: choice rows, a stepper, an amount to type. */
  children?: ReactNode;
  /** Ways to look or defer, at the foot on the left. */
  links?: DecisionLink[];
  /** The budget the answer leads to, at the foot on the right. */
  preview?: { label: string; value: ReactNode; delta?: { text: string; down: boolean } | null };
  /** Lights up when another card sends a question here. */
  flash?: boolean;
  /** Kind of question, for tests and the page. */
  kind?: string;
};

/** The decision card: one question at a time, its answers, and what they do to the budget. */
export default function Decision({ lang, eyebrow, step, media, title, detail, children, links = [], preview, flash, kind }: DecisionProps) {
  const id = useId();
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en);
  return (
    <section className={styles.card} aria-labelledby={`${id}-title`} data-flash={flash ? "" : undefined} data-kind={kind}>
      <div className={styles.head}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        {step && step.total > 1 && (
          <p className={styles.steps} aria-label={t(`Étape ${step.current} sur ${step.total}`, `Step ${step.current} of ${step.total}`)}>
            {step.total <= 8 && <span className={styles.track} aria-hidden="true">{Array.from({ length: step.total }, (_, index) => <i key={index} data-on={index < step.current ? "" : undefined} />)}</span>}
            <span aria-hidden="true">{t(`${step.current} sur ${step.total}`, `${step.current} of ${step.total}`)}</span>
          </p>
        )}
      </div>

      <div className={styles.question}>
        {media && <span className={styles.media} aria-hidden="true">{media}</span>}
        <h3 id={`${id}-title`} className={styles.title}>{title}</h3>
      </div>
      {detail && <p className={styles.detail}>{detail}</p>}

      {children}

      {(links.length > 0 || preview) && (
        <div className={styles.foot}>
          <div className={styles.links}>
            {links.map((link) => <button key={link.label} type="button" className={styles.link} data-quiet={link.quiet ? "" : undefined} onClick={link.onClick}>{link.label}</button>)}
          </div>
          {preview && (
            <p className={styles.preview} aria-live="polite">
              <span className={styles.note}>{preview.label}</span>
              <span className={styles.previewValue} data-nowrap="">{preview.value}</span>
              {preview.delta && <span key={preview.delta.text} className={styles.delta}>
                <svg viewBox="0 0 24 24" aria-hidden="true" data-down={preview.delta.down ? "" : undefined}><path d={preview.delta.down ? "M12 5v14M6 13l6 6 6-6" : "M12 19V5M6 11l6-6 6 6"} /></svg>
                {preview.delta.text}
              </span>}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/** Nothing left to decide: the card rests instead of vanishing. */
export function DecisionRest({ lang, history, onAddTool }: { lang: "fr" | "en"; history?: ReactNode; onAddTool: () => void }) {
  const id = useId();
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en);
  return (
    <section className={styles.card} data-done="" aria-labelledby={`${id}-title`}>
      <div className={styles.head}><p className={styles.eyebrow}>{t("Votre décision", "Your decision")}</p></div>
      <p className={styles.restTitle} id={`${id}-title`}>
        <span className={styles.restCheck} aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
        {t("Rien à trancher.", "Nothing to decide.")}
      </p>
      <p className={styles.detail}>{t("Chaque outil a trouvé sa place. Profitez-en, ça ne dure jamais très longtemps.", "Every tool has found its place. Enjoy it, it never lasts long.")}</p>
      {history && <div className={styles.history}>{history}</div>}
      <div className={styles.foot}><div className={styles.links}><button type="button" className={styles.link} onClick={onAddTool}>{t("Ajouter un outil", "Add a tool")}</button></div></div>
    </section>
  );
}
