import type { ReactNode } from "react";
import styles from "./Choice.module.css";

export type ChoiceProps = {
  /** What stands for the choice: a tool's logo, two logos, or a plan's icon. */
  media: ReactNode;
  /** Two overlapping logos (« keep both »). */
  pair?: boolean;
  name: ReactNode;
  /** A short tag after the name (« Le moins cher »). */
  tag?: string;
  note?: ReactNode;
  /** The amount on the right, already formatted; a saving reads with a green arrow. */
  amount: ReactNode;
  saving?: boolean;
  /** After an answer: the chosen row rings, the others step back. */
  state?: "kept" | "gone";
  /** A check on the media of the chosen row. */
  checked?: boolean;
  /** Plans are radios; a duplicate's answers are buttons. */
  role?: "radio";
  disabled?: boolean;
  ariaLabel?: string;
  onClick: () => void;
  /** Shows what the answer would do to the budget, before choosing. */
  onPreview?: (on: boolean) => void;
  "data-plan"?: string;
};

/** One answer as a row: media, name and what it means, the amount on the right. */
export default function Choice({ media, pair, name, tag, note, amount, saving, state, checked, role, disabled, ariaLabel, onClick, onPreview, ...rest }: ChoiceProps) {
  return (
    <button type="button" className={styles.choice} role={role} aria-checked={role === "radio" ? state === "kept" : undefined} aria-label={ariaLabel}
      data-state={state} disabled={disabled} onClick={onClick} data-plan={rest["data-plan"]}
      onPointerEnter={() => onPreview?.(true)} onPointerLeave={() => onPreview?.(false)} onFocus={() => onPreview?.(true)} onBlur={() => onPreview?.(false)}>
      <span className={pair ? styles.logos : styles.media} aria-hidden={pair || undefined}>
        {media}
        {checked && <span className={styles.check} aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>}
      </span>
      <span className={styles.text}>
        <span className={styles.name}><span>{name}</span>{tag && <span className={styles.tag}>{tag}</span>}</span>
        {note && <span className={styles.note}>{note}</span>}
      </span>
      <span className={styles.amount} data-nowrap="">
        {saving && <svg className={styles.savingMark} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6" /></svg>}
        <span>{amount}</span>
      </span>
    </button>
  );
}

/** The group the rows sit in: a narrow group puts the amount under the text. */
export function Choices({ children, label, radio }: { children: ReactNode; label?: string; radio?: boolean }) {
  return <div className={styles.choices} role={radio ? "radiogroup" : undefined} aria-label={label}>{children}</div>;
}

/** A plan's icon on the logo tile, so plans and tools share one column. */
export function IconTile({ children }: { children: ReactNode }) {
  return <span className={styles.iconTile} aria-hidden="true">{children}</span>;
}
