import type { HTMLAttributes } from "react";
import { displayFigure } from "../figure";
import { Odometer } from "../Gesture/Gesture";
import styles from "./Amount.module.css";

export type AmountProps = Omit<HTMLAttributes<HTMLSpanElement>, "className" | "children"> & {
  /** Already formatted by the caller (« 1 234,50 € », « $49 »). */
  value: string;
  /** « /mois », « /mo », « par an »: smaller, in the reading face, never on its own line. */
  unit?: string;
  /** hero: the one figure of a page. figure: the total of a card. amount: a line of a list. */
  size?: "hero" | "figure" | "amount";
  /** overlap: money that gathers dust (Vos usages). */
  tone?: "ink" | "overlap" | "gain";
  /** Save (planche, « Huit gestes »): when the value changes, it rolls digit by digit like a counter. */
  roll?: boolean;
};

/** A sum and its unit, unbreakable. Thousands use a thin space so the figure reads as one block. */
export default function Amount({ value, unit, size = "amount", tone = "ink", roll = false, ...rest }: AmountProps) {
  return (
    <span className={styles.amount} data-size={size} data-tone={tone} data-nowrap="" {...rest}>
      {roll ? <Odometer value={value} /> : displayFigure(value)}{unit && <small className={styles.unit}>{unit}</small>}
    </span>
  );
}
