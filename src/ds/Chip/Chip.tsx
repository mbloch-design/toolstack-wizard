import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Chip.module.css";

export type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  /** A filter or a preset is pressed (ink); an answer (Vos usages) is not a toggle and leaves it out. */
  pressed?: boolean;
  /** A filter draws a check when pressed. */
  check?: boolean;
  /** How many items the filter keeps; alert rings it in orange (overlaps to look at). */
  count?: number;
  alert?: boolean;
  /** sm: a row of filters. md: an answer or a preset, the size of a fingertip. */
  size?: "sm" | "md";
  /** cut: the answer that removes, its hover turns orange. */
  tone?: "ink" | "cut";
  children: ReactNode;
};

/** An outlined pill: a filter, a team size, an answer. Same font and outline everywhere; pressed turns ink. */
export default function Chip({ pressed, check, count, alert, size = "sm", tone = "ink", children, type = "button", ...rest }: ChipProps) {
  return (
    <button type={type} className={styles.chip} data-size={size} data-tone={tone} data-check={check ? "" : undefined} data-alert={alert ? "" : undefined} aria-pressed={pressed} {...rest}>
      {children}{count !== undefined && <span className={styles.count}>{count}</span>}
    </button>
  );
}

export function Chips({ label, children }: { label: string; children: ReactNode }) {
  return <div className={styles.chips} role="group" aria-label={label}>{children}</div>;
}

/** A chip that is a link (a sibling page in a rail): spread on the router link; the current page reads as pressed. */
export function chipLinkAttrs(current: boolean) {
  return { className: styles.chip, "data-size": "sm", "aria-current": current ? ("page" as const) : undefined };
}
