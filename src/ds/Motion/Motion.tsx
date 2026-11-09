import { useEffect, useRef, type ReactNode } from "react";
import styles from "./Motion.module.css";

/**
 * Height that opens without measuring: the grid goes from 0fr to 1fr. The content stays mounted
 * (nothing pops in) and turns inert once folded, for the keyboard and screen readers.
 */
export function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className={styles.collapse} data-open={open || undefined} {...(!open ? { inert: "" } : {})} aria-hidden={!open || undefined}>
      <div className={styles.inner}>{children}</div>
    </div>
  );
}

/**
 * A figure that changes: a short fade up, or a counter roll when the direction is known (seats + / −).
 * Never on first paint, never a scale that would move the line.
 */
export function ValueChange({ value, children, direction }: { value: string | number; children: ReactNode; direction?: "up" | "down" }) {
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; }, []);
  return <span key={String(value)} className={styles.value} data-changed={mounted.current ? (direction ?? "fade") : undefined}>{children}</span>;
}
