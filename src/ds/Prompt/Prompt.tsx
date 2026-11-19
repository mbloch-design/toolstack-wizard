import { useState, type ReactNode } from "react";
import { Check, Copy } from "@/lib/icons";
import Button from "../Button/Button";
import styles from "./Prompt.module.css";

type Lang = "fr" | "en";

/*
 * A request to the assistant that ToolTrim proposes (17/11/2026: « je veux bien un bouton pour le copier-coller »;
 * 18/11, step 8c: « plus de structure et de contraste »). It reads as the message you will send: in a bubble on a wash
 * of ink, the chosen assistant's mark at its left, the words in full ink, no guillemets (the bubble says it is a
 * message). Under it an optional note (« À vérifier »), then « Copier la demande », the system's secondary button, at
 * the foot: in a row of cards whose content stretches, the buttons line up. « Copié » is said to screen readers.
 */
export default function Prompt({ text, lang, size = "reading", tone = "wash", mark, note }: {
  /** The request itself. */
  text: string;
  lang: Lang;
  /** reading: 17, a step's request; lead: 21, a card's request, the message to send. */
  size?: "reading" | "lead";
  /** wash: the message on a wash of ink (a step's request). sent (19/11): the reader's own message as a chat shows it,
   *  ink ground, light words, its lower corner pinched; the anchor of a situation card. */
  tone?: "wash" | "sent";
  /** The chosen assistant's mark (20 px), at the message's left, as in a conversation. */
  mark?: ReactNode;
  /** What to check after sending it, between the message and the button. */
  note?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const fr = lang !== "en";
  const done = fr ? "Copié" : "Copied";
  const copy = () => {
    void navigator.clipboard?.writeText(text).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <div className={styles.prompt} data-prompt="">
      <div className={styles.message} data-tone={tone}>
        {mark && <span className={styles.mark} aria-hidden="true">{mark}</span>}
        <p className={styles.words} data-size={size}>{text}</p>
      </div>
      {note}
      <div className={styles.action} data-foot="">
        <Button variant="secondary" icon={copied ? <Check /> : <Copy />} onClick={copy}>{copied ? done : fr ? "Copier la demande" : "Copy the request"}</Button>
      </div>
      <span className={styles.srOnly} aria-live="polite">{copied ? done : ""}</span>
    </div>
  );
}
