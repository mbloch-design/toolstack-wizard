import type { ReactNode } from "react";
import styles from "./ToneCard.module.css";

/*
 * A verdict card on the white sheet (17/11/2026, « Notre avis »): a soft gain or caution tint, never the navigation's
 * grey; an icon of 24 in a round of 48, a title, the text at 21 in full. Two side by side share their height.
 */
export default function ToneCard({ tone, icon, title, children }: { tone: "gain" | "caution"; icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className={styles.card} data-tone={tone}>
      <span className={styles.icon} aria-hidden="true">{icon}</span>
      <p className={styles.title}>{title}</p>
      <p className={styles.text}>{children}</p>
    </div>
  );
}

export function ToneCards({ children }: { children: ReactNode }) {
  return <div className={styles.cards}>{children}</div>;
}
