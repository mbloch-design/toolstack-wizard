import { useState } from "react";
import { Check, Copy } from "@/lib/icons";
import styles from "./CopyText.module.css";

/*
 * A technical name that copies itself with one click (Michael, 17/11/2026): an action's identifier, a slug, an
 * address. The name is the button (« Copier notion-delete-pages »); a faint copy icon sits at its right, full on hover and
 * focus, the background takes a light tint of the system and the pointer becomes a hand; after the click the icon turns to a
 * check and « Copié » is said for 2 s. 44 of touch height on a phone, without making the line look taller.
 */
export default function CopyText({ value, lang }: { value: string; lang: "fr" | "en" }) {
  const [copied, setCopied] = useState(false);
  const fr = lang !== "en";
  const copy = () => {
    void navigator.clipboard?.writeText(value).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <span className={styles.wrap}>
      <button type="button" className={styles.copy} data-copied={copied || undefined} onClick={copy} aria-label={fr ? `Copier ${value}` : `Copy ${value}`}>
        <code className={styles.value}>{value}</code>
        <span className={styles.icon} aria-hidden="true">{copied ? <Check /> : <Copy />}</span>
      </button>
      <span className={styles.srOnly} aria-live="polite">{copied ? (fr ? "Copié" : "Copied") : ""}</span>
    </span>
  );
}
