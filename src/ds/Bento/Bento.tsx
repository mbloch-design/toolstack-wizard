import type { CSSProperties, ReactNode } from "react";
import Logo from "../Logo/Logo";
import { TextButton } from "../Button/Button";
import Chip, { Chips } from "../Chip/Chip";
import type { LogoTool } from "@/lib/useToolLogoSource";
import styles from "./Bento.module.css";
import Matter from "../Matter/Matter";

/**
 * The living bento of Ma stack: tiles of different widths on a 12-column grid, each one fact.
 * Two tiles always stay (the stack, the split); question tiles come while there is something to
 * refine and leave when there is nothing left to ask, so the page gets shorter as one plays.
 */
export default function Bento({ label, children, compact = false }: { label: string; children: ReactNode;
  /** Figures only (the dashboard, M01): rows as tall as their content, no empty floor. */
  compact?: boolean }) {
  return <section className={styles.bento} aria-label={label} data-bento="" data-board="" data-compact={compact || undefined}>{children}</section>;
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
export function Tile({ span, label, art, statement, status, children, tone = "tile", leaving, detail, open = false, onToggle, moreLabel, lessLabel, condensed = false, card, footer, wash, bloom, hero = false }: {
  /** Columns out of 12 on a wide bento; every tile takes the full width on a phone. */
  span: 4 | 5 | 6 | 7 | 8 | 12;
  label: ReactNode; art?: ReactNode; statement?: ReactNode;
  status?: { text: ReactNode; done?: boolean };
  children?: ReactNode;
  /** question: the tile asks something; it lifts off the page a little. smoke: the page's call to act, in the
   *  smoked glass of the floating bar, light moving inside it (M01). */
  tone?: "tile" | "question" | "smoke";
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
  /** Up to three colours washed very softly inside the tile, from its top right (the site's diffuse light, M01):
   *  the trades it covers, orange while things are to settle, green once settled. */
  wash?: string[];
  /** Two colours of light rising from the bottom of a white tile, very diffuse (the site's references, M01). */
  bloom?: [string, string];
  /** One big figure, centred, with its caption: the tile is the number. */
  hero?: boolean;
}) {
  const toggleMore = detail && onToggle && <span className={styles.toggle}><TextButton aria-expanded={open} onClick={onToggle}>{open ? lessLabel : moreLabel}<svg viewBox="0 0 24 24" aria-hidden="true"><path d={open ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} /></svg></TextButton></span>;
  if (open && detail) return (
    <article className={styles.tile} data-open="" data-tone={tone} data-card={card} style={{ "--span": span } as CSSProperties}>
      <span className={styles.srOnly}>{label}</span>
      <div className={styles.detail}>{detail}</div>
      {toggleMore}
    </article>
  );
  return (
    <article className={styles.tile} data-span={span} data-tone={tone} data-card={card} data-leaving={leaving || undefined} data-condensed={condensed || undefined} data-wash={wash?.length ? "" : undefined}
      data-bloom={bloom ? "" : undefined} data-hero={hero || undefined}
      style={{ "--span": span, ...(wash?.length ? { "--w1": wash[0], "--w2": wash[1] ?? wash[0], "--w3": wash[2] ?? wash[1] ?? wash[0] } : {}), ...(bloom ? { "--b1": bloom[0], "--b2": bloom[1] } : {}) } as CSSProperties}>
      {bloom && <Matter />}
      <div className={styles.top}><span className={styles.label}>{label}</span>{art && <span className={styles.art} aria-hidden="true">{art}</span>}</div>
      {children && <div className={styles.body}>{children}{!statement && !status && toggleMore}</div>}
      {(statement || status) && <div className={styles.foot}>
        {statement && <p className={styles.statement}>{statement}</p>}
        {status && <p className={styles.status} data-done={status.done || undefined}>
          {status.done && <svg className={styles.check} viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
          {status.text}
        </p>}
        {footer && <div className={styles.footer}>{footer}</div>}
        {toggleMore}
      </div>}
    </article>
  );
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

/** The answers of a question tile: the system's chips, the size of a fingertip. One tap answers. */
export function Answers({ label, children }: { label: string; children: ReactNode }) {
  return <Chips label={label}>{children}</Chips>;
}

export function Answer({ name, onClick, tone = "ink" }: { name: string; onClick: () => void; tone?: "ink" | "cut" }) {
  return <Chip size="md" tone={tone} onClick={onClick}>{name}</Chip>;
}

/** The question of a tile, with the thing it is about. */
export function Question({ media, children }: { media?: ReactNode; children: ReactNode }) {
  return <p className={styles.question}>{media && <span className={styles.questionMedia} aria-hidden="true">{media}</span>}<span>{children}</span></p>;
}

/** A pictogram in a glossy pastille (M01): light from the top, the tile's colour behind it. */
export function GlassIcon({ children, color = "var(--tt-brand)" }: { children: ReactNode; color?: string }) {
  return <span className={styles.glassIcon} style={{ "--g": color } as CSSProperties} aria-hidden="true">{children}</span>;
}

