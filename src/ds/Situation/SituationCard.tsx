import { useState } from "react";
import { BarChart3, Check, ClipboardCheck, Clock3, Copy, Database, FileText, Globe, Handshake, Link2, Mail, Megaphone, MessageSquare, MessagesSquare, Palette, Receipt, Search, Share2, ShoppingCart, Wallet, Workflow, ListChecks as Checklist } from "@/lib/icons";
import { say, typo, type Lang, type McpAdvice } from "@/lib/agents";
import { IconButton } from "../Button/Button";
import SituationArt from "./SituationArt";
import styles from "./SituationCard.module.css";

const SITUATION_ICON = { meeting: <Handshake />, week: <Checklist />, invoice: <Receipt />, post: <Megaphone />, deck: <FileText />, feedback: <MessageSquare />, link: <Link2 />, unpaid: <Wallet /> , chat: <MessagesSquare />, design: <Palette />, chart: <BarChart3 />, shop: <ShoppingCart />, automation: <Workflow />, task: <Checklist />, email: <Mail />, form: <ClipboardCheck />, web: <Globe />, doc: <FileText />, search: <Search />, data: <Database />, social: <Share2 />, calendar: <Clock3 />} as const;

/** A situation with a scene (19/11) shows its pencil drawing in place of the icon round, in the same row: a band of 96
 *  on the text's left edge, 24 above the eyebrow. Without one, the round stays. */
export function SituationCard({ situation, lang, pencil = true }: { situation: McpAdvice["situations"][number]; lang: Lang; pencil?: boolean }) {
  const t = (fr: string, en: string) => typo(lang === "en" ? en : fr);
  const [copied, setCopied] = useState(false);
  const words = lang === "en" ? situation.ask.en : situation.ask.fr;
  const copy = () => { void navigator.clipboard?.writeText(words).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 2000); }); };
  return (
    <li className={styles.situation} data-situation="">
      {situation.scene
        ? <SituationArt scene={situation.scene} pencil={pencil} />
        : <span className={styles.situationIcon} data-palette="sky" aria-hidden="true">{SITUATION_ICON[situation.icon]}</span>}
      <p className={styles.situationEyebrow}>{say(lang, situation.title)}</p>
      <h3 className={styles.situationHeadline}>{say(lang, situation.gain)}</h3>
      <p className={styles.situationMessage}>{words}</p>
      <div className={styles.situationAction}>
        <IconButton tone="grey" label={copied ? t("Copié", "Copied") : t("Copier la demande", "Copy the request")} icon={copied ? <Check /> : <Copy />} onClick={copy} />
        <span className={styles.srOnly} aria-live="polite">{copied ? t("Copié", "Copied") : ""}</span>
      </div>
    </li>
  );
}
