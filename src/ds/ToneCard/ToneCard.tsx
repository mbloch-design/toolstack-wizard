import type { ReactNode } from "react";
import styles from "./ToneCard.module.css";

/*
 * A verdict on the white sheet (17/11/2026, « Notre avis »; calmed 19/11, « trop de box »): no ground, a hairline above;
 * the icon of 24 in its colour, the title as a marker, the text at 21 in full.
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
