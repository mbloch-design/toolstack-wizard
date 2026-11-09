import { useState } from "react";
import { ValueChange } from "../Motion/Motion";
import styles from "./Stepper.module.css";

const icon = (d: string) => <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>;

/**
 * A count to fine-tune: − and +, the number rolls the way it moves. At the floor, « − » says no
 * with a small shake instead of going dead (onRefuse lets the caller add a word).
 */
export default function Stepper({ value, onChange, min = 1, max = 500, label, lessLabel, moreLabel, onRefuse }: {
  value: number; onChange: (value: number) => void; min?: number; max?: number;
  label: string; lessLabel: string; moreLabel: string; onRefuse?: () => void;
}) {
  const [direction, setDirection] = useState<"up" | "down">("up");
  // Two alternating names replay the shake without remounting, so focus stays on the button.
  const [refused, setRefused] = useState(0);
  const step = (delta: 1 | -1) => {
    const next = value + delta;
    if (next < min || next > max) { setRefused((n) => n + 1); onRefuse?.(); return; }
    setDirection(delta > 0 ? "up" : "down");
    onChange(next);
  };
  return (
    <div className={styles.stepper} role="group" aria-label={label} data-refused={refused === 0 ? undefined : refused % 2 ? "a" : "b"}>
      <button type="button" className={styles.button} aria-label={lessLabel} aria-disabled={value <= min} onClick={() => step(-1)}>{icon("M5 12h14")}</button>
      <output className={styles.value} aria-live="polite"><ValueChange value={value} direction={direction}>{value}</ValueChange></output>
      <button type="button" className={styles.button} aria-label={moreLabel} aria-disabled={value >= max} onClick={() => step(1)}>{icon("M12 5v14M5 12h14")}</button>
    </div>
  );
}
