import { useState } from "react";
import { Check, Copy } from "@/lib/icons";
import styles from "./Prompt.module.css";

type Lang = "fr" | "en";

/*
 * A request to the assistant that ToolTrim proposes (Michael, 17/11/2026: « quand on dit ce genre de chose, je veux
 * bien un bouton pour le copier-coller »). The request in words, between guillemets, then a discreet « Copier la
 * demande » (44 of touch area) with « Copié » said to screen readers. Only the request is copied, never the guillemets.
 */
export default function Prompt({ text, lang, size = "reading" }: {
  /** The request itself, without guillemets. */
  text: string;
  lang: Lang;
  /** reading: 17, a card's request; lead: 21, the hub's recommendation. */
  size?: "reading" | "lead";
}) {
  const [copied, setCopied] = useState(false);
  const fr = lang !== "en";
  const done = fr ? "Copié" : "Copied";
  const copy = () => {
    void navigator.clipboard?.writeText(text).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <div className={styles.prompt}>
      <p className={styles.words} data-size={size}>{fr ? `« ${text} »` : `“${text}”`}</p>
      <button type="button" className={styles.copy} onClick={copy}>
        <span className={styles.icon} aria-hidden="true">{copied ? <Check /> : <Copy />}</span>
        {copied ? done : fr ? "Copier la demande" : "Copy the request"}
      </button>
      <span className={styles.srOnly} aria-live="polite">{copied ? done : ""}</span>
    </div>
  );
}
