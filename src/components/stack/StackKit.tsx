import { forwardRef, useEffect, useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { Link } from "@/lib/routerLinks";
import ToolLogo from "@/components/ToolLogo";
import { CheckCircle2, ChevronRight, TrendingDown, TrendingUp } from "@/lib/icons";
import type { ToolSummary } from "@/hooks/useSupabaseData";

// Ma stack's small component kit (documented in docs/DESIGN_SYSTEM.md, "Kit
// Ma stack"). One component, one job, one affordance:
// - read only, never reacting to the pointer: Card, Figure, Trend,
//   RankedBars, Meter, AppIconRow, Footnote;
// - acts on the stack: Button (a pill, dark when it is the answer);
// - goes somewhere: LinkRow (a row with a chevron), TextLink (underlined);
// - changes the view: Segmented (a raised thumb in a track);
// - opens a tool: ActionRow (a row with its price and a chevron).

/** Groups one answer: a title (with its line icon in a tinted circle), then its content. Static. */
export function Card({ title, icon, tone, hero, children, className }: { title: string; icon?: ReactNode; tone?: "blue" | "orange" | "green"; hero?: ReactNode; children?: ReactNode; className?: string }) {
  return <article className={`mk-card${hero ? " mk-card--hero" : ""}${className ? ` ${className}` : ""}`} data-tone={tone}>
    {/* The card's hero: ToolTrim cream, its title, its figure, its sentence. */}
    <div className="mk-card-hero">
      <h2 className="mk-card-title">{icon && <span className="mk-card-icon" data-tone={tone} aria-hidden="true">{icon}</span>}{title}</h2>
      {hero}
    </div>
    <div className="mk-card-body">{children}</div>
  </article>;
}

/** The one figure of a card, with its unit. Never clickable. */
export function Figure({ value, unit, tone }: { value: string; unit?: string; tone?: "good" | "watch" }) {
  return <p className="mk-figure" data-tone={tone}><Odometer text={value} />{unit && <small>{unit}</small>}</p>;
}

/**
 * A figure that lands like an odometer (Michael, 22/10/2026): each digit is a
 * column that rolls to its value, units last and longest, so the number
 * settles from left to right. Every digit rolls up from 0 on first display;
 * after a decision only the digits that change move. Columns are keyed from
 * the right, so "7 €" becoming "24 €" keeps its units column and adds a tens
 * column that rolls in from 0. Screen readers get the plain text.
 */
export function Odometer({ text }: { text: string }) {
  const chars = [...text];
  const digits = chars.filter((c) => /\d/.test(c)).length;
  let seen = 0;
  return <span className="mk-odo" role="text" aria-label={text}>{chars.map((c, i) => {
    const key = chars.length - i;
    if (!/\d/.test(c)) return <span key={`s${key}`} className="mk-odo-sym" aria-hidden="true">{c}</span>;
    const place = digits - 1 - seen++;
    return <OdoColumn key={`d${key}`} digit={Number(c)} place={place} />;
  })}</span>;
}

function OdoColumn({ digit, place }: { digit: number; place: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof requestAnimationFrame === "undefined") { setShown(digit); return; }
    const frame = requestAnimationFrame(() => setShown(digit));
    return () => cancelAnimationFrame(frame);
  }, [digit]);
  return <span className="mk-odo-col" aria-hidden="true">
    <span className="mk-odo-strip" style={{ transform: `translateY(${-shown * 10}%)`, transitionDuration: `${720 + place * 160}ms`, transitionDelay: `${place * 70}ms` }}>
      {"0123456789".split("").map((n) => <span key={n}>{n}</span>)}
    </span>
  </span>;
}

/**
 * What moved, what to watch or a settled state, in one short line. Read only.
 * The icon says which: an arrow only for a real change of amount (down: a
 * saving, up: an amount to review), a tick for a state that is settled.
 */
export function Trend({ tone, icon, children }: { tone: "good" | "watch" | "neutral"; icon?: "down" | "up" | "check"; children: ReactNode }) {
  const Icon = icon === "down" ? TrendingDown : icon === "up" ? TrendingUp : icon === "check" ? CheckCircle2 : null;
  return <p className="mk-trend" data-tone={tone}>{Icon && <Icon size={14} aria-hidden />}<span>{children}</span></p>;
}

/** An app icon on its white tile, optionally with a status badge. */
export function AppIcon({ tool, large, status }: { tool: ToolSummary; large?: boolean; status?: "ok" | "wait" }) {
  return <span className={`mk-app${large ? " mk-app--lg" : ""}`} data-status={status}><ToolLogo tool={tool} size={large ? 40 : 28} /></span>;
}

/** Amounts compared as shares of their total, the largest first. Read only. */
export function RankedBars({ rows }: { rows: { id: string; tool: ToolSummary; label: string; share: number; tag?: string }[] }) {
  return <ul className="mk-bars">{rows.map((row, index) => <li key={row.id} style={{ ["--w" as string]: `${row.share * 100}%`, ["--i" as string]: index }}>
    <AppIcon tool={row.tool} />
    <span className="mk-bars-body">
      <span className="mk-bars-head"><span>{row.tool.name}{row.tag && <em>{row.tag}</em>}</span><b>{row.label}<small>{Math.round(row.share * 100)} %</small></b></span>
      <span className="mk-bars-track" aria-hidden="true"><i /></span>
    </span>
  </li>)}</ul>;
}

/** A row that opens one place: full-width hover and a chevron say so. */
export function LinkRow({ to, lead, title, sub, onClick }: { to: string; lead: ReactNode; title: ReactNode; sub?: ReactNode; onClick?: () => void }) {
  return <Link className="mk-row" to={to} onClick={onClick}>
    <span className="mk-row-lead" aria-hidden="true">{lead}</span>
    <span className="mk-row-text"><span>{title}</span>{sub && <small>{sub}</small>}</span>
    <ChevronRight size={16} aria-hidden className="mk-row-chevron" />
  </Link>;
}

/** Two app icons around a swap badge: a pair that may overlap. */
export function Duo({ a, b, large }: { a: ToolSummary; b: ToolSummary; large?: boolean }) {
  return <span className={`mk-duo${large ? " mk-duo--lg" : ""}`}><AppIcon tool={a} large={large} /><b>⇄</b><AppIcon tool={b} large={large} /></span>;
}

/** Who is in a set, with each one's status when it has one. Read only. */
export function AppIconRow({ items, max = 24 }: { items: { tool: ToolSummary; ok?: boolean; title: string }[]; max?: number }) {
  return <ul className="mk-icons" aria-hidden="true">
    {items.slice(0, max).map((item, index) => <li key={item.tool.id} title={item.title} style={{ ["--i" as string]: index }}><AppIcon tool={item.tool} status={item.ok === undefined ? undefined : item.ok ? "ok" : "wait"} /></li>)}
    {items.length > max && <li className="mk-icons-more">+{items.length - max}</li>}
  </ul>;
}

/** Progress towards a whole, its figure at the end. Read only. */
export function Meter({ value, label }: { value: number; label: string }) {
  return <div className="mk-meter" aria-hidden="true"><span><i style={{ width: `${Math.round(value * 100)}%` }} /></span><b>{label}</b></div>;
}

/** The quiet last line of a card, under a hairline. */
export function Footnote({ children }: { children: ReactNode }) {
  return <p className="mk-foot">{children}</p>;
}

/** Acts on the stack. Primary is the expected answer, secondary the others. */
export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary"; icon?: ReactNode }>(
  function Button({ variant = "secondary", icon, children, className, ...rest }, ref) {
    return <button ref={ref} type="button" {...rest} className={`mk-button ${variant === "primary" ? "tt-button-primary" : "tt-button-secondary"}${className ? ` ${className}` : ""}`} data-variant={variant}>{icon}{children}</button>;
  });

/** Goes to a secondary place, or a secondary action in a footer: underlined text. */
export function TextLink({ to, onClick, children, className }: { to?: string; onClick?: () => void; children: ReactNode; className?: string }) {
  const cls = `mk-link${className ? ` ${className}` : ""}`;
  return to ? <Link className={cls} to={to} onClick={onClick}>{children}</Link> : <button type="button" className={cls} onClick={onClick}>{children}</button>;
}

/**
 * Changes the view, never the data: a raised thumb in a track. "tabs" drives
 * a panel (arrow keys move between options), "toggle" filters a list.
 */
export function Segmented<T extends string>({ label, options, value, onChange, mode = "tabs", controls, className }: {
  label: string; options: { id: T; label: ReactNode; count?: number }[]; value: T | null; onChange: (id: T) => void; mode?: "tabs" | "toggle"; controls?: string; className?: string;
}) {
  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    if (mode !== "tabs") return;
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const index = Math.max(0, options.findIndex((option) => option.id === value));
    const next = options[(index + step + options.length) % options.length].id;
    onChange(next);
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-id="${next}"]`)?.focus();
  }
  return <div className={`mk-segmented${className ? ` ${className}` : ""}`} role={mode === "tabs" ? "tablist" : "group"} aria-label={label} onKeyDown={onKey}>
    {options.map((option) => {
      const on = value === option.id;
      return <button key={option.id} type="button" data-id={option.id} onClick={() => onChange(option.id)}
        {...(mode === "tabs" ? { role: "tab", "aria-selected": on, "aria-controls": controls, tabIndex: on || (value === null && option === options[0]) ? 0 : -1 } : { "aria-pressed": on })}>
        {option.label}{option.count !== undefined && <span>{option.count}</span>}
      </button>;
    })}
  </div>;
}

/** Opens a tool: icon, name and detail, its value on the right, a chevron. */
export function ActionRow({ lead, name, sub, end, endTone, onClick, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & {
  lead: ReactNode; name: ReactNode; sub?: ReactNode; /** Right-hand value, e.g. a price. */ end?: ReactNode; endTone?: "watch" | "muted"; children?: ReactNode;
}) {
  return <button type="button" {...rest} className={`mk-row mk-row--action${className ? ` ${className}` : ""}`} onClick={onClick}>
    <span className="mk-row-lead" aria-hidden="true">{lead}</span>
    <span className="mk-row-text"><span>{name}</span>{sub && <small>{sub}</small>}</span>
    {end !== undefined && <span className="mk-row-value" data-tone={endTone}>{end}</span>}
    <ChevronRight size={16} aria-hidden className="mk-row-chevron" />
    {children}
  </button>;
}

/** A settled fact in a list: same layout as LinkRow, but it opens nothing. */
export function Row({ lead, title, sub }: { lead: ReactNode; title: ReactNode; sub?: ReactNode }) {
  return <div className="mk-row mk-row--static">
    <span className="mk-row-lead" aria-hidden="true">{lead}</span>
    <span className="mk-row-text"><span>{title}</span>{sub && <small>{sub}</small>}</span>
  </div>;
}

type Slice = { id: string; label: string; amount: number; color: string; value: string; sub?: string };
/**
 * Where a total goes, the way a portfolio is shown: a small ring split by
 * class (one segment per area, a 2px gap between), set beside the card's
 * figure. Read only; pointing at a segment names it.
 */
export function Donut({ slices, label }: { slices: Slice[]; label: string }) {
  const sum = slices.reduce((acc, slice) => acc + slice.amount, 0);
  const r = 40, c = 2 * Math.PI * r, gap = slices.length > 1 ? 3 : 0;
  let offset = 0;
  return <svg className="mk-donut" viewBox="0 0 100 100" role="img" aria-label={label}>
    <circle className="mk-donut-track" cx="50" cy="50" r={r} />
    {sum > 0 && slices.map((slice, index) => {
      const length = Math.max(0, (slice.amount / sum) * c - gap);
      const dash = <circle key={slice.id} cx="50" cy="50" r={r} strokeDasharray={`${length} ${c - length}`} strokeDashoffset={-offset}
        transform="rotate(-90 50 50)" style={{ stroke: slice.color, ["--i" as string]: index }}><title>{`${slice.label} · ${slice.value}`}</title></circle>;
      offset += (slice.amount / sum) * c;
      return dash;
    })}
  </svg>;
}

/** The few classes that weigh most, each with its colour, amount and share. Read only. */
export function Legend({ slices, max = 3, more }: { slices: Slice[]; max?: number; more?: (count: number) => ReactNode }) {
  const sum = slices.reduce((acc, slice) => acc + slice.amount, 0);
  return <ul className="mk-legend">
    {slices.slice(0, max).map((slice) => <li key={slice.id}>
      <i style={{ background: slice.color }} aria-hidden="true" />
      <span title={slice.sub}>{slice.label}</span>
      <b>{slice.value}</b><small>{sum > 0 ? Math.round((slice.amount / sum) * 100) : 0} %</small>
    </li>)}
    {slices.length > max && more && <li className="mk-legend-more">{more(slices.length - max)}</li>}
  </ul>;
}

type RadarAxis = { id: string; label: string; amount: number; value: string; color: string };
/**
 * Where a budget goes across verticals, as a radar: one axis per area, the
 * shape reaching out as far as the area weighs (relative to the heaviest).
 * Rings at 25 % steps, a dot per area in its colour, the label and amount at
 * each tip. Read only; each tip names its area and amount.
 */
export function Radar({ axes, label, bare }: { axes: RadarAxis[]; label: string; /** No labels at the tips: a list beside it is the legend. */ bare?: boolean }) {
  const size = 300, c = size / 2, r = bare ? 130 : 96;
  const max = Math.max(1, ...axes.map((axis) => axis.amount));
  const n = axes.length;
  const at = (i: number, k: number) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return [c + Math.cos(a) * r * k, c + Math.sin(a) * r * k] as const;
  };
  // Square-root scale (area reads as amount) with a small floor, so one heavy
  // area does not flatten the others into the centre.
  const k = (amount: number) => 0.1 + 0.9 * Math.sqrt(amount / max);
  const shape = axes.map((axis, i) => at(i, k(axis.amount)).join(",")).join(" ");
  return <svg className="mk-radar" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
    <defs>
      <linearGradient id="mk-radar-fill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--color-chart-create)" /><stop offset=".55" stopColor="var(--color-chart-automation)" /><stop offset="1" stopColor="var(--color-chart-market)" /></linearGradient>
    </defs>
    {[0.25, 0.5, 0.75, 1].map((ring) => <polygon key={ring} className="mk-radar-ring" points={axes.map((_, i) => at(i, ring).join(",")).join(" ")} />)}
    {axes.map((axis, i) => { const [x, y] = at(i, 1); return <line key={axis.id} className="mk-radar-axis" x1={c} y1={c} x2={x} y2={y} />; })}
    <g className="mk-radar-shape" style={{ transformOrigin: `${c}px ${c}px` }}>
      <polygon points={shape} fill="url(#mk-radar-fill)" />
      {axes.map((axis, i) => { const [x, y] = at(i, k(axis.amount)); return <circle key={axis.id} cx={x} cy={y} r={axis.amount > 0 ? 2.6 : 1.6} fill={axis.amount > 0 ? axis.color : "var(--color-chart-empty)"}><title>{`${axis.label} · ${axis.value}`}</title></circle>; })}
    </g>
    {!bare && axes.map((axis, i) => {
      const [x, y] = at(i, 1.16);
      const anchor = Math.abs(x - c) < 8 ? "middle" : x > c ? "start" : "end";
      return <g key={axis.id} className="mk-radar-label" data-empty={axis.amount > 0 ? undefined : ""}>
        <text x={x} y={axis.value ? y - 2 : y + 4} textAnchor={anchor} dominantBaseline="middle">{axis.label}</text>
        {axis.value && <text x={x} y={y + 12} textAnchor={anchor} className="mk-radar-value">{axis.value}</text>}
      </g>;
    })}
  </svg>;
}
