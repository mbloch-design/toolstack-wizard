import type { ReactNode } from "react";
import Logo from "../Logo/Logo";
import Tag from "../Tag/Tag";
import type { LogoTool } from "@/lib/useToolLogoSource";
import styles from "./MediaCard.module.css";

export type MediaCardProps = {
  lang: "fr" | "en";
  tool: LogoTool;
  /** The tool's picture (the page passes its screenshot component). Without it, the card is the tool alone on a raised tile. */
  image?: ReactNode;
  /** Shown as the first tag (never inline after the name: it would orphan its separator when the name wraps). */
  category?: string;
  /** Short facts after the category: price, free plan, sponsored. The system's Tag. */
  tags?: ReactNode;
  /** l: the catalogue's card. s: a denser card for rails and side columns (the reason holds one line). */
  size?: "l" | "s";
  reason?: string;
  /** The card is a link; the page passes its router link, given the card's class and content. */
  renderLink: (className: string, content: ReactNode) => ReactNode;
  /** Add to the stack, from a round button on the picture (a button never lives inside a link). */
  add?: { state: "idle" | "pending" | "added"; onAdd: (origin: HTMLElement) => void; disabled?: boolean };
  localLogosOnly?: boolean;
  /** Stable hook for the page and its tests (the tool's slug). */
  dataTool?: string;
};

/** A tool to discover: its picture, the tool, why it is here; the add button sits on the picture. */
export default function MediaCard({ lang, tool, image, category, tags, size = "l", reason, renderLink, add, localLogosOnly = false, dataTool }: MediaCardProps) {
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const content = <>
    {image && <span className={styles.shot} data-tt-tilt="">{image}</span>}
    <span className={styles.id}><Logo tool={tool} size={image ? 24 : 40} localOnly={localLogosOnly} /><span className={styles.label}>{tool.name}</span></span>
    {(category || tags) && <span className={styles.tags}>{category && <Tag on={image ? "card" : "tile"}>{category}</Tag>}{tags}</span>}
    {reason && <span className={styles.reason}>{reason}</span>}
  </>;
  return (
    <li className={styles.slot} data-size={size} data-bare={image ? undefined : ""} data-discovery-tool={dataTool}>
      {renderLink(styles.card, content)}
      {add && <button type="button" className={styles.action} data-media-add="" disabled={add.state !== "idle" || add.disabled} aria-busy={add.state === "pending" || undefined}
        aria-label={add.state === "pending" ? t(`Ajout de ${tool.name} en cours`, `Adding ${tool.name}`) : add.state === "added" ? t(`${tool.name} ajouté à ma stack`, `${tool.name} added to my stack`) : t(`Ajouter ${tool.name} à ma stack`, `Add ${tool.name} to my stack`)}
        title={add.state === "pending" ? t("Ajout en cours", "Adding") : add.state === "added" ? t("Dans ma stack", "In my stack") : t("Ajouter à ma stack", "Add to my stack")}
        onClick={(event) => { event.preventDefault(); event.stopPropagation(); add.onAdd(event.currentTarget.closest("li")!); }}>
        <svg viewBox="0 0 24 24" aria-hidden="true">{add.state === "added" ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : add.state === "pending" ? <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v4h-4" /> : <path d="M12 5v14M5 12h14" />}</svg>
      </button>}
    </li>
  );
}

/** The row of media cards. */
export function MediaCards({ label, children, listRef, size = "l" }: { label: string; children: ReactNode; listRef?: React.Ref<HTMLUListElement>; size?: "l" | "s" }) {
  return <ul ref={listRef} className={styles.cards} data-size={size} aria-label={label}>{children}</ul>;
}
