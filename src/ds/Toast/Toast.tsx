import type { ReactNode } from "react";
import styles from "./Toast.module.css";

/** A welcome that lands: the person's logos drop into place, two short lines, a small burst. */
export default function WelcomeToast({ logos, title, detail }: { logos: ReactNode[]; title: string; detail: string }) {
  return (
    <div className={styles.toast} role="status">
      <span className={styles.logos} aria-hidden="true">{logos.slice(0, 4).map((logo, at) => <span key={at} style={{ animationDelay: `${120 + at * 90}ms` }}>{logo}</span>)}</span>
      <span className={styles.words}><b className={styles.title}>{title}</b><small className={styles.detail}>{detail}</small></span>
      <span className={styles.spark} aria-hidden="true">{Array.from({ length: 6 }, (_, at) => <i key={at} style={{ ["--a" as string]: `${at * 60}deg` }} />)}</span>
    </div>
  );
}
