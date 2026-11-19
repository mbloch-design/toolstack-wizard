/**
 * The pencil kit (19/11/2026): the ink, the fills, and the small pieces every scene reuses (a face, two legs and their
 * shoes, lines of writing, a sheet that stands up). Scenes compose them in the 240 × 150 drawing space.
 */
import type { ReactNode } from "react";

export type Touch = "sky" | "butter" | "coral" | "mint";
export const TOUCH: Record<Touch, string> = {
  sky: "var(--tt-pal-sky)", butter: "var(--tt-pal-butter)", coral: "var(--tt-pal-coral)", mint: "var(--tt-pal-mint)",
};

/** The ink: the page's, so the drawing turns to chalk in dark mode by itself. */
export const line = { fill: "none", stroke: "currentColor", strokeWidth: 4.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
export const fine = { ...line, strokeWidth: 3 };
export const ink = { fill: "currentColor" } as const;
/** A shape that hides what is behind it: the card's own grey, never a box. */
// Token colours go in `style`, never in an attribute (DESIGN_SYSTEM, « Couleur et image »: an attribute takes no var()).
export const hide = { ...line, style: { fill: "var(--tt-tile)" } } as const;
export const touch = (tone: Touch) => ({ ...line, style: { fill: TOUCH[tone] } });

/** A small black shoe, toe to the right (flip with scale(-1 1) about its heel). */
export const shoe = (x: number, y: number, flip = false) => (
  <path d={`M${x} ${y}c0 -6 6 -7 9 -4c3 1 7 1 8 4z`} {...ink} {...line} transform={flip ? `translate(${2 * x + 17} 0) scale(-1 1)` : undefined} />
);

/** `box`: the ink's bounds in the 240 × 150 drawing space (measured with getBBox, line excluded), to crop each scene
 *  to its own ink so it starts on the text's left edge. */
/** `gag`: the joke in one sentence (French), for the reviewer and whoever draws the next scene; the card never says it. */
export type Scene = { box: [number, number, number, number]; touch: Touch; gag: string; draw: (t: Touch) => ReactNode };


/** Two eyes and a mouth, centred on (x, y): the mood says the gag. */
export type Mood = "smile" | "worry" | "flat" | "sleep" | "wow" | "smug" | "grin";
export function face(x: number, y: number, mood: Mood = "smile", gap = 7) {
  const eyes = mood === "sleep"
    ? <path d={`M${x - gap - 3} ${y}q3 3 6 0M${x + gap - 3} ${y}q3 3 6 0`} {...fine} />
    : mood === "smug"
      ? <path d={`M${x - gap - 3} ${y}h6M${x + gap - 3} ${y}h6`} {...fine} />
      : <><circle cx={x - gap} cy={y} r={mood === "wow" ? 3 : 2.4} {...ink} /><circle cx={x + gap} cy={y} r={mood === "wow" ? 3 : 2.4} {...ink} /></>;
  const m = y + 9;
  const mouth = {
    smile: `M${x - 5} ${m}q5 5 10 0`,
    grin: `M${x - 6} ${m - 1}q6 8 12 0z`,
    worry: `M${x - 6} ${m + 1}q3 -3 6 0q3 3 6 0`,
    flat: `M${x - 4} ${m}h8`,
    sleep: `M${x - 3} ${m}q3 2 6 0`,
    wow: `M${x} ${m + 2}m-3 0a3 3.5 0 1 0 6 0a3 3.5 0 1 0 -6 0`,
    smug: `M${x - 5} ${m}q6 3 10 -2`,
  }[mood];
  return <>{eyes}<path d={mouth} {...fine} /></>;
}

/** Two legs from the bottom edge of a body at (x1, y) and (x2, y), `len` long, shoes out. */
export function legs(x1: number, x2: number, y: number, len = 12) {
  return (
    <>
      <path d={`M${x1} ${y}v${len}M${x2} ${y}v${len}`} {...line} />
      {shoe(x1 - 8, y + len + 1, true)}{shoe(x2 - 1, y + len + 1)}
    </>
  );
}

/** Lines of writing: n strokes from (x, y), w long, a step apart, each a little shorter than the last. */
export function lines(x: number, y: number, w: number, n = 2, step = 7) {
  const d = Array.from({ length: n }, (_, i) => `M${x} ${y + i * step}h${Math.round(w * (1 - i * 0.18))}`).join("");
  return <path d={d} {...fine} />;
}

/** A sheet that stands: a page with a face, optional writing, on two legs. `fill` is a Touch to colour it. */
export function sheet(x: number, y: number, w: number, h: number, mood: Mood = "smile", fill?: Touch, write = true) {
  return (
    <>
      <path d={`M${x} ${y}H${x + w}V${y + h}H${x}Z`} {...(fill ? touch(fill) : hide)} />
      {write && lines(x + 7, y + 8, w - 16)}
      {face(x + w / 2, y + h * 0.55, mood, Math.min(7, w / 5))}
      {legs(x + w * 0.32, x + w * 0.68, y + h)}
    </>
  );
}

/** A speech bubble, its tail at the lower left. */
export function bubble(x: number, y: number, w: number, h: number, fill?: Touch) {
  const r = Math.min(12, h / 2);
  return <path d={`M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + 16}l-10 8v-8A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`} {...(fill ? touch(fill) : hide)} />;
}

/** An envelope. */
export function envelope(x: number, y: number, w: number, h: number, fill?: Touch) {
  return <><path d={`M${x} ${y}H${x + w}V${y + h}H${x}Z`} {...(fill ? touch(fill) : hide)} /><path d={`M${x} ${y}L${x + w / 2} ${y + h * 0.55}L${x + w} ${y}`} {...fine} /></>;
}

/** Motion: three short dashes behind something that moves left to right, ending at (x, y). */
export function speed(x: number, y: number) {
  return <path d={`M${x - 18} ${y}h14M${x - 22} ${y + 12}h14M${x - 16} ${y + 24}h12`} {...fine} />;
}
