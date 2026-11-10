import { Activity, Database, FileText, Layers3, Users, ShieldAlert, Home } from "@/lib/icons";
import type { BackofficeNavigationModel, BackofficeSection } from "@/components/backoffice/backofficeNavigation";
import styles from "./BackofficeNavigation.module.css";

const entries = [
  ["overview", "Vue d’ensemble", "Overview", Activity],
  ["catalog", "Fiches", "Records", FileText],
  ["users", "Utilisateurs", "Users", Users],
  ["stacks", "Stacks et outils", "Stacks and tools", Layers3],
  ["usage", "Activité", "Activity", Activity],
  ["sources", "Sources", "Sources", Database],
  ["diagnostic", "Diagnostic", "Diagnostic", ShieldAlert],
] as const;
export function BackofficeNavigation({ section, onNavigate, lang, homeHref, onDone, onBlocked, collapsed = false }: Partial<BackofficeNavigationModel> & { lang: "fr" | "en"; homeHref: string; onDone?: () => void; onBlocked?: () => void; collapsed?: boolean }) {
  return <nav className={styles.navigation} aria-label={lang === "fr" ? "Navigation du back-office" : "Back-office navigation"}>
    {onNavigate && entries.map(([id, fr, en, Icon], index) => <button key={id} type="button" className={styles.item} data-secondary={index === 5 || undefined} aria-current={section === id ? "page" : undefined} aria-label={lang === "fr" ? fr : en} title={collapsed ? (lang === "fr" ? fr : en) : undefined} onClick={() => void onNavigate(id as BackofficeSection).then((ok) => { if (ok) onDone?.(); else onBlocked?.(); })}><Icon size={18} aria-hidden /><span className={collapsed ? styles.collapsed : undefined}>{lang === "fr" ? fr : en}</span></button>)}
    <a href={homeHref} className={styles.item}><Home size={18} aria-hidden /><span className={collapsed ? styles.collapsed : undefined}>{lang === "fr" ? "Retour au site" : "Back to site"}</span></a>
  </nav>;
}
