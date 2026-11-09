import type { CSSProperties, ReactNode } from "react";
import styles from "./Segmented.module.css";

type Option<T extends string> = { value: T; label: ReactNode; ariaLabel?: string };

/** A segmented picker: one thumb that slides from option to option with a light spring. Fixed size, nothing moves around it. */
export default function Segmented<T extends string>({ options, value, onChange, label }: { options: Option<T>[]; value: T; onChange: (value: T) => void; label: string }) {
  const index = Math.max(0, options.findIndex((option) => option.value === value));
  return (
    <div className={styles.segmented} role="group" aria-label={label} style={{ "--n": options.length, "--i": index } as CSSProperties}>
      <span className={styles.thumb} aria-hidden="true" />
      {options.map((option) => (
        <button key={option.value} type="button" className={styles.option} aria-pressed={option.value === value} aria-label={option.ariaLabel} onClick={() => onChange(option.value)}>{option.label}</button>
      ))}
    </div>
  );
}
