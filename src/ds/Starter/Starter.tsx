import Logo from "../Logo/Logo";
import type { LogoTool } from "@/lib/useToolLogoSource";
import styles from "./Starter.module.css";

/** One tool in the stack: the tool, two free seats beside it, and the way to add the next one. */
export default function Starter({ lang, tool, onAddTool, localLogosOnly = false }: { lang: "fr" | "en"; tool?: LogoTool; onAddTool: () => void; localLogosOnly?: boolean }) {
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const plus = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
  return (
    <article className={styles.starter} data-card="starter">
      <span className={styles.seats} aria-hidden="true">
        {tool && <span className={styles.seat} data-on=""><Logo tool={tool} size={32} localOnly={localLogosOnly} /></span>}
        <span className={styles.seat}>{plus}</span>
        <span className={styles.seat}>{plus}</span>
      </span>
      <h2 className={styles.titleM}>{t("Votre stack prend forme.", "Your stack is taking shape.")}</h2>
      <p className={styles.text}>{t("Un outil, c’est un début. Ajoutez les autres : dès deux, on repère ce qui se recoupe et ce que ça coûte.", "One tool is a start. Add the others: from two on, we spot what overlaps and what it costs.")}</p>
      <button type="button" className={styles.primary} onClick={onAddTool}>{plus}{t("Ajouter un autre outil", "Add another tool")}</button>
    </article>
  );
}
