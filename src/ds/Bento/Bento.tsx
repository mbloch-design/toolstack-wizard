import type { CSSProperties, ReactNode } from "react";
import Logo from "../Logo/Logo";
import type { LogoTool } from "@/lib/useToolLogoSource";
import styles from "./Bento.module.css";

/**
 * The living bento of Ma stack: tiles of different widths on a 12-column grid, each one fact.
 * Two tiles always stay (the stack, the split); question tiles come while there is something to
 * refine and leave when there is nothing left to ask, so the page gets shorter as one plays.
 */
export default function Bento({ label, children }: { label: string; children: ReactNode }) {
  return <section className={styles.bento} aria-label={label} data-bento="" data-board="">{children}</section>;
}

/**
 * A row of the bento, always the same height. Its tiles share the width by their span; when one
 * opens, it takes most of the width and the others narrow. The bento never grows.
 */
export function BentoRow({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}

/**
 * One fact: a small label top left, a picture top right, the statement in large at the bottom,
 * its state under it. A question tile puts its question between the two.
 */
export function Tile({ span, label, art, statement, status, children, tone = "tile", leaving, detail, open = false, onToggle, moreLabel, lessLabel, condensed = false, card, footer }: {
  /** Columns out of 12 on a wide bento; every tile takes the full width on a phone. */
  span: 4 | 5 | 6 | 7 | 8 | 12;
  label: ReactNode; art?: ReactNode; statement?: ReactNode;
  status?: { text: ReactNode; done?: boolean };
  children?: ReactNode;
  /** question: the tile asks something; it lifts off the page a little. */
  tone?: "tile" | "question";
  /** The tile is on its way out (its last question was answered). */
  leaving?: boolean;
  /** The whole module behind the fact: open, the tile takes the full width and shows it in place. */
  detail?: ReactNode;
  open?: boolean;
  onToggle?: () => void;
  moreLabel?: string;
  lessLabel?: string;
  /** Another tile of the row is open: this one narrows to its label and statement. */
  condensed?: boolean;
  /** For the page and its tests: data-card="price". */
  card?: string;
  /** Under the state line: what to do next about this fact (« Confirmer 2 prix »). */
  footer?: ReactNode;
}) {
  const toggleMore = detail && onToggle && <button type="button" className={styles.toggle} aria-expanded={open} onClick={onToggle}>{open ? lessLabel : moreLabel}<svg viewBox="0 0 24 24" aria-hidden="true"><path d={open ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} /></svg></button>;
  if (open && detail) return (
    <article className={styles.tile} data-open="" data-tone={tone} data-card={card} style={{ "--span": span } as CSSProperties}>
      <span className={styles.srOnly}>{label}</span>
      <div className={styles.detail}>{detail}</div>
      {toggleMore}
    </article>
  );
  return (
    <article className={styles.tile} data-span={span} data-tone={tone} data-card={card} data-leaving={leaving || undefined} data-condensed={condensed || undefined} style={{ "--span": span } as CSSProperties}>
      <div className={styles.top}><span className={styles.label}>{label}</span>{art && <span className={styles.art} aria-hidden="true">{art}</span>}</div>
      {children && <div className={styles.body}>{children}{!statement && !status && toggleMore}</div>}
      {(statement || status) && <div className={styles.foot}>
        {statement && <p className={styles.statement}>{statement}</p>}
        {status && <p className={styles.status} data-done={status.done || undefined}>
          {status.done && <svg className={styles.check} viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
          {status.text}
        </p>}
        {footer}
        {toggleMore}
      </div>}
    </article>
  );
}

/** The stack as a fan of logos: the tiles lean like a hand of cards, and open when the tile is hovered. */
export function LogoFan({ tools, localOnly = false }: { tools: LogoTool[]; localOnly?: boolean }) {
  const shown = tools.slice(0, 5);
  return <span className={styles.fan}>{shown.map((tool, at) => <span key={tool.name} style={{ "--i": at - (shown.length - 1) / 2 } as CSSProperties}><Logo tool={tool} size={40} localOnly={localOnly} /></span>)}</span>;
}

/** A small ring of the areas, the picture of the split tile. */
export function MiniRing({ parts }: { parts: { color: string; share: number }[] }) {
  let start = 0;
  return (
    <svg className={styles.ring} viewBox="0 0 48 48">
      {parts.map((part, at) => {
        const length = Math.max(0, part.share * 125.6 - 4);
        const circle = <circle key={at} cx="24" cy="24" r="20" style={{ stroke: part.color, strokeDasharray: `${length} 125.6`, strokeDashoffset: -start }} />;
        start += part.share * 125.6;
        return circle;
      })}
    </svg>
  );
}

/** The answers of a question tile, side by side: a name and what it costs. One tap answers. */
export function Answers({ label, children }: { label: string; children: ReactNode }) {
  return <div className={styles.answers} role="group" aria-label={label}>{children}</div>;
}

export function Answer({ name, amount, onClick }: { name: string; amount?: ReactNode; onClick: () => void }) {
  return <button type="button" className={styles.answer} onClick={onClick}><span className={styles.answerName}>{name}</span>{amount && <span className={styles.answerAmount}>{amount}</span>}</button>;
}

/** The question of a tile, with the thing it is about. */
export function Question({ media, children }: { media?: ReactNode; children: ReactNode }) {
  return <p className={styles.question}>{media && <span className={styles.questionMedia} aria-hidden="true">{media}</span>}<span>{children}</span></p>;
}
