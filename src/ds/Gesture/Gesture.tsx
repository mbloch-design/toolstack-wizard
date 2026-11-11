import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { Scissors } from "@/lib/icons";
import { Ending } from "../Narrative/Narrative";
import Amount from "../Amount/Amount";
import styles from "./Gesture.module.css";

/**
 * The planche's gestures (« Huit gestes, à jouer »). Each plays once when its moment comes, then calm returns.
 * Only transform and opacity; all of them rest under prefers-reduced-motion.
 */

/** Keep: the stamp lands, the tile takes the hit. */
export function Stamp({ play, label, children }: { play: boolean; label: string; children: ReactNode }) {
  return (
    <span className={styles.stamp} data-play={play || undefined}>
      <span className={styles.stampHit}>{children}</span>
      {play && <span className={styles.stampMark}>{label}</span>}
    </span>
  );
}

/** A duplicate: the two come together, recognise each other, one stays. */
export function Meet({ play, kept, left, right, badge }: { play: boolean; kept: "left" | "right"; left: ReactNode; right: ReactNode; badge: string }) {
  return (
    <span className={styles.meet} data-play={play || undefined} data-kept={kept}>
      <span className={styles.meetBadge} aria-hidden="true">{badge}</span>
      <span className={styles.meetLeft}>{left}</span>
      <span className={styles.meetRight}>{right}</span>
    </span>
  );
}

/** Save: the price rolls digit by digit, like a counter. Digits that do not change stay still. */
export function Odometer({ value, label }: { value: string; label?: string }) {
  const chars = [...value];
  return (
    <span className={styles.odometer} aria-label={label ?? value} role="text">
      {chars.map((char, index) => /\d/.test(char)
        ? <span key={index} className={styles.digit} aria-hidden="true"><span className={styles.reel} style={{ "--d": Number(char) } as CSSProperties}>{"0123456789".split("").map((digit) => <i key={digit}>{digit}</i>)}</span></span>
        : <span key={index} aria-hidden="true">{char}</span>)}
    </span>
  );
}

/** Hover: the card leans toward you, a sheen follows the pointer. */
export function Tilt({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const move = (event: PointerEvent<HTMLSpanElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width, y = (event.clientY - box.top) / box.height;
    event.currentTarget.style.setProperty("--rx", `${(0.5 - y) * 8}deg`);
    event.currentTarget.style.setProperty("--ry", `${(x - 0.5) * 10}deg`);
    event.currentTarget.style.setProperty("--sx", `${x * 100}%`);
    event.currentTarget.style.setProperty("--sy", `${y * 100}%`);
  };
  const leave = () => { ref.current?.style.setProperty("--rx", "0deg"); ref.current?.style.setProperty("--ry", "0deg"); };
  return <span ref={ref} className={styles.tilt} onPointerMove={move} onPointerLeave={leave}>{children}<span className={styles.sheen} aria-hidden="true" /></span>;
}

/** The trim: what goes falls; one tool may cling a moment first (one per gesture). */
/** How long a fall lasts before the item can leave the list. */
export const fallDuration = 600;
export function Fall({ leaving, cling = false, children }: { leaving: boolean; cling?: boolean; children: ReactNode }) {
  return <span className={styles.fall} data-leaving={leaving ? (cling ? "cling" : "fall") : undefined}>{children}</span>;
}

const still = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** The saving counts up once the cut lands, ease-out, as on the planche. */
function useCountUp(to: number, start: boolean, delay: number) {
  const [value, setValue] = useState(start ? to : 0);
  useEffect(() => {
    if (!start) { setValue(0); return; }
    if (still()) { setValue(to); return; }
    let frame = 0;
    const t0 = performance.now() + delay;
    const step = (now: number) => { const k = Math.min(1, Math.max(0, (now - t0) / 500)); setValue(Math.round(to * (1 - (1 - k) ** 3))); if (k < 1) frame = requestAnimationFrame(step); };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [to, start, delay]);
  return value;
}

export type TrimTool = { id: string; node: ReactNode; cut?: "fall" | "cling" };

/**
 * The ToolTrim sign as scissors: two rings for the handles, two blades crossing on one pivot.
 * Each half (a ring and the opposite blade) turns on the pivot, so they really open and close.
 */
function Blades() {
  return (
    <svg viewBox="0 0 48 32" aria-hidden="true">
      <g className={styles.halfA}><circle cx="8.5" cy="7.5" r="5" /><path d="M12.6 10.4 L24 16 L45.5 20.2" /></g>
      <g className={styles.halfB}><circle cx="8.5" cy="24.5" r="5" /><path d="M12.6 21.6 L24 16 L45.5 11.8" /></g>
      <circle className={styles.pivot} cx="24" cy="16" r="1.8" />
    </svg>
  );
}

/**
 * The trim, the signature gesture (planche, « Le geste signature »). The scissors travel the cut line and stop
 * under each tool that goes: one snip, the tool falls (one clings a moment first). Then what stays closes ranks
 * and the saving counts up. Kept for the moment ToolTrim makes you gain something.
 */
export function Trim({ tools, cut, total, saved, format, unit, restSentence, sentence, clingSay }: {
  tools: TrimTool[]; cut: boolean;
  /** What the stack costs before the cut: the figure at rest, so the box reads whole before and after. */
  total: number;
  saved: number; format: (value: number) => string; unit: string;
  /** Under the cost at rest (« 5 outils, dont 2 font doublon. »). */
  restSentence: string;
  sentence: string; clingSay: string;
}) {
  const row = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0);
  const [snip, setSnip] = useState(0);
  const [gone, setGone] = useState<string[]>([]);
  const [phase, setPhase] = useState<"rest" | "cutting" | "settled">(cut ? "settled" : "rest");
  useEffect(() => {
    if (!cut) { setPhase("rest"); setGone([]); setX(0); return; }
    const cuts = tools.filter((tool) => tool.cut);
    if (still() || !row.current) { setGone(cuts.map((tool) => tool.id)); setPhase("settled"); return; }
    const box = row.current.getBoundingClientRect();
    const centre = (id: string) => { const node = row.current?.querySelector<HTMLElement>(`[data-trim-id="${CSS.escape(id)}"]`); const r = node?.getBoundingClientRect(); return r ? r.left + r.width / 2 - box.left : 0; };
    const stops = cuts.map((tool) => ({ id: tool.id, at: centre(tool.id), cling: tool.cut === "cling" }));
    const timers: number[] = [];
    let t = 60;
    setPhase("cutting"); setGone([]); setX(0);
    for (const stop of stops) {
      timers.push(window.setTimeout(() => setX(stop.at), t));
      t += 300;
      timers.push(window.setTimeout(() => setSnip((n) => n + 1), t));
      t += 90;
      timers.push(window.setTimeout(() => setGone((ids) => [...ids, stop.id]), t));
      t += stop.cling ? 620 : 60;
    }
    timers.push(window.setTimeout(() => setX(box.width), t));
    t += 320;
    timers.push(window.setTimeout(() => setPhase("settled"), t));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [cut]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = useCountUp(saved, phase === "settled", 200);
  return (
    <div className={styles.trim} data-phase={phase}>
      <div className={styles.trimStage}>
        <div ref={row} className={styles.trimRow}>
          {tools.map((tool) => (
            <span key={tool.id} className={styles.trimTool} data-trim-id={tool.id} data-cut={tool.cut} data-gone={gone.includes(tool.id) ? (tool.cut === "cling" ? "cling" : "fall") : undefined}>
              {tool.cut === "cling" && <span className={styles.clingSay} aria-hidden="true">{clingSay}</span>}
              {tool.node}
            </span>
          ))}
        </div>
        <div className={styles.cutline} aria-hidden="true" style={{ "--x": `${x}px` } as CSSProperties}>
          <span className={styles.cutDone} />
          <span className={styles.scissors} data-snip={snip === 0 ? undefined : snip % 2 ? "odd" : "even"}><Blades /></span>
        </div>
      </div>
      {/* Before and after share one place: the cost at rest, the saving once cut. */}
      <div className={styles.trimResult} aria-live="polite">
        <span className={styles.trimBefore} aria-hidden={phase === "settled"}>
          <Amount size="figure" value={format(total)} unit={unit} />
          <p className={styles.trimSentence}>{restSentence}</p>
        </span>
        <span className={styles.trimAfter} aria-hidden={phase !== "settled"}>
          <Ending figure={<Amount size="figure" tone="gain" value={`−${format(shown)}`} unit={unit} />} />
          <p className={styles.trimSentence}>{sentence}</p>
        </span>
      </div>
    </div>
  );
}
