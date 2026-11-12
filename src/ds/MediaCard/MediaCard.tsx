import type { ReactNode } from "react";
import Logo from "../Logo/Logo";
import type { LogoTool } from "@/lib/useToolLogoSource";
import styles from "./MediaCard.module.css";

export type MediaCardProps = {
  lang: "fr" | "en";
  tool: LogoTool;
  /** The tool's picture (the page passes its screenshot component). Without it, the card is the tool alone on a raised tile. */
  image?: ReactNode;
  /** What the tool is. Opens the quiet line of facts under the name. */
  category?: string;
  /** The price, already worded (« Dès 10 €/mois », « Gratuit »). Closes the line of facts; free reads in green. */
  price?: { label: string; free?: boolean };
  /** The one exceptional qualifier (« Sponsorisé »): a glass pill on the picture, outside the text. */
  badge?: string;
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
export default function MediaCard({ lang, tool, image, category, price, badge, size = "l", reason, renderLink, add, localLogosOnly = false, dataTool }: MediaCardProps) {
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const content = <>
    {image && <span className={styles.shot} data-tt-tilt="">{image}{badge && <span className={styles.badge}>{badge}</span>}</span>}
    {/* One accent, the name. The logo hangs on its first line; the facts and the reason follow, quieter. */}
    <span className={styles.id}>
      <Logo tool={tool} size={image ? 24 : 40} localOnly={localLogosOnly} />
      <span className={styles.name}>{tool.name}</span>
    </span>
    {(category || price || (!image && badge)) && <span className={styles.facts}>
      {category && <span className={styles.fact}>{category}</span>}
      {price && <span className={styles.fact} data-free={price.free ? "" : undefined}>{price.label}</span>}
      {!image && badge && <span className={styles.fact}>{badge}</span>}
    </span>}
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
