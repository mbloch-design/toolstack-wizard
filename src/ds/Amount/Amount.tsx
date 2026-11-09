import type { HTMLAttributes } from "react";
import { displayFigure } from "../figure";
import styles from "./Amount.module.css";

export type AmountProps = Omit<HTMLAttributes<HTMLSpanElement>, "className" | "children"> & {
  /** Already formatted by the caller (« 1 234,50 € », « $49 »). */
  value: string;
  /** « /mois », « /mo », « par an »: smaller, in the reading face, never on its own line. */
  unit?: string;
  /** figure: the total of a card. amount: a line of a list. */
  size?: "figure" | "amount";
  /** overlap: money that gathers dust (Vos usages). */
  tone?: "ink" | "overlap";
};

/** A sum and its unit, unbreakable. Thousands use a thin space so the figure reads as one block. */
export default function Amount({ value, unit, size = "amount", tone = "ink", ...rest }: AmountProps) {
  return (
    <span className={styles.amount} data-size={size} data-tone={tone} data-nowrap="" {...rest}>
      {displayFigure(value)}{unit && <small className={styles.unit}>{unit}</small>}
    </span>
  );
}
