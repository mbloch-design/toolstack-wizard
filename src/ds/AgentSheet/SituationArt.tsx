/**
 * PROPOSITION (19/11/2026), à valider par Michael : les illustrations dessinées des cartes de situation des fiches MCP.
 * Pas branché sur AgentSheet : la planche est dans SituationArt.stories.tsx.
 *
 * Une scène est un petit fragment réel du résultat (la page résumée, la base de factures, le post et sa story…), décrit
 * une fois en formes simples ; chaque direction de style le rend à sa manière. Ainsi les trois directions montrent le même
 * sujet, et une scène nouvelle se dessine une seule fois pour toutes. Jamais de texte dans l'image : les lignes d'écriture
 * sont des traits. SVG inline, `aria-hidden` : le titre et la demande de la carte disent déjà tout.
 */
import type { CSSProperties } from "react";
import styles from "./SituationArt.module.css";

export type Tone = "paper" | "sky" | "butter" | "coral" | "mint" | "pink";
type Shape = { fill: Tone; accent?: boolean };
export type Part =
  | (Shape & { el: "rect"; x: number; y: number; w: number; h: number; r?: number; rotate?: number })
  | (Shape & { el: "circle"; cx: number; cy: number; r: number })
  | (Shape & { el: "path"; d: string })
  /** A stroke only: a line of writing, a tick, a hand, an arrow. */
  | { el: "line"; d: string; rotate?: [number, number, number] };

export type Scene = { plate: Exclude<Tone, "paper">; parts: Part[] };

/** The nine pilot situations (research/mcp/{notion,canva,stripe}-mcp.json, advice.situations, in order). */
export const SCENES = {
  /** Notion · Préparer un rendez-vous client: the summarised page, its decision highlighted, the date beside it. */
  "notion-meeting": { plate: "sky", parts: [
    { el: "rect", x: 60, y: 22, w: 92, h: 100, r: 6, fill: "paper" },
    { el: "line", d: "M74 40H124M74 52H138M74 64H116" },
    { el: "rect", x: 70, y: 74, w: 74, h: 14, r: 4, fill: "butter", accent: true },
    { el: "line", d: "M76 81H134M74 102H122" },
    { el: "rect", x: 134, y: 58, w: 52, h: 48, r: 8, fill: "sky" },
    { el: "line", d: "M134 72H186M148 53V63M172 53V63" },
    { el: "circle", cx: 160, cy: 89, r: 6, fill: "coral" },
  ] },
  /** Notion · Faire le point de la semaine: the week's board, two cards done, one blocked. */
  "notion-week": { plate: "sky", parts: [
    { el: "rect", x: 40, y: 26, w: 160, h: 90, r: 8, fill: "paper" },
    { el: "line", d: "M93 38V104M147 38V104" },
    { el: "rect", x: 50, y: 40, w: 34, h: 16, r: 4, fill: "mint" },
    { el: "rect", x: 50, y: 62, w: 34, h: 16, r: 4, fill: "mint" },
    { el: "line", d: "M60 48l3 3l7 -7M60 70l3 3l7 -7" },
    { el: "rect", x: 103, y: 40, w: 34, h: 16, r: 4, fill: "coral", accent: true },
    { el: "line", d: "M120 44V49M120 52.5V53" },
    { el: "rect", x: 103, y: 62, w: 34, h: 16, r: 4, fill: "sky" },
    { el: "rect", x: 157, y: 40, w: 34, h: 16, r: 4, fill: "butter" },
    { el: "line", d: "M162 92H186M162 100H180" },
  ] },
  /** Notion · Suivre les factures impayées: the invoices database, one status switched to « À relancer ». */
  "notion-invoice": { plate: "butter", parts: [
    { el: "rect", x: 36, y: 28, w: 168, h: 84, r: 8, fill: "paper" },
    { el: "line", d: "M36 56H204M36 84H204M48 42H100M48 70H92M48 98H104" },
    { el: "rect", x: 144, y: 35, w: 48, h: 14, r: 7, fill: "mint" },
    { el: "rect", x: 144, y: 63, w: 48, h: 14, r: 7, fill: "butter", accent: true },
    { el: "rect", x: 144, y: 91, w: 48, h: 14, r: 7, fill: "mint" },
    { el: "line", d: "M134 64.5A6 6 0 1 0 134 75.5M134 60.5V64.5H130" },
  ] },
  /** Canva · Un post, puis sa version story: the square post, then the same layout standing up. */
  "canva-post": { plate: "pink", parts: [
    { el: "rect", x: 40, y: 34, w: 72, h: 72, r: 6, fill: "paper" },
    { el: "circle", cx: 62, cy: 56, r: 9, fill: "butter" },
    { el: "path", d: "M48 98L72 72L88 88L98 78L104 98Z", fill: "sky" },
    { el: "line", d: "M120 70H140M135 65l5 5l-5 5" },
    { el: "rect", x: 150, y: 18, w: 52, h: 104, r: 8, fill: "paper" },
    { el: "circle", cx: 168, cy: 44, r: 8, fill: "butter", accent: true },
    { el: "path", d: "M156 110L174 86L186 98L194 90L196 110Z", fill: "sky" },
  ] },
  /** Canva · Une présentation client tirée de vos notes: notes, then a slide, then the PDF. */
  "canva-deck": { plate: "mint", parts: [
    { el: "rect", x: 32, y: 32, w: 60, h: 78, r: 5, fill: "paper" },
    { el: "line", d: "M42 48H80M42 58H76M42 68H82M42 78H70M42 88H78" },
    { el: "line", d: "M100 66H120M115 61l5 5l-5 5" },
    { el: "rect", x: 128, y: 30, w: 82, h: 54, r: 5, fill: "paper" },
    { el: "rect", x: 140, y: 58, w: 9, h: 16, r: 1.5, fill: "sky" },
    { el: "rect", x: 154, y: 50, w: 9, h: 24, r: 1.5, fill: "mint" },
    { el: "rect", x: 168, y: 42, w: 9, h: 32, r: 1.5, fill: "coral" },
    { el: "line", d: "M186 44H200M186 52H196" },
    { el: "path", d: "M156 92H182L190 100V120H156Z", fill: "pink", accent: true },
    { el: "line", d: "M182 92V100H190" },
  ] },
  /** Canva · Faire le point sur les retours d'un client: the slide and its comments, one resolved. */
  "canva-feedback": { plate: "butter", parts: [
    { el: "rect", x: 36, y: 36, w: 120, h: 78, r: 6, fill: "paper" },
    { el: "rect", x: 48, y: 48, w: 48, h: 54, r: 4, fill: "sky" },
    { el: "line", d: "M106 56H142M106 66H136M106 76H140" },
    { el: "path", d: "M148 20h44a8 8 0 0 1 8 8v14a8 8 0 0 1 -8 8h-30l-10 8v-8h-4a8 8 0 0 1 -8 -8v-14a8 8 0 0 1 8 -8z", fill: "butter", accent: true },
    { el: "line", d: "M150 31H186M150 39H174" },
    { el: "path", d: "M166 72h30a8 8 0 0 1 8 8v12a8 8 0 0 1 -8 8h-22l-10 8v-8h0a8 8 0 0 1 -8 -8v-12a8 8 0 0 1 8 -8z", fill: "mint" },
    { el: "line", d: "M172 86l4 4l8 -8" },
  ] },
  /** Stripe · Préparer une facture: the draft, its total, the magnifying glass of the review. */
  "stripe-invoice": { plate: "mint", parts: [
    { el: "rect", x: 66, y: 18, w: 86, h: 104, r: 6, fill: "paper" },
    { el: "rect", x: 78, y: 30, w: 24, h: 10, r: 3, fill: "sky" },
    { el: "line", d: "M78 54H138M78 64H128M78 74H134" },
    { el: "rect", x: 78, y: 90, w: 60, h: 16, r: 4, fill: "mint" },
    { el: "line", d: "M86 98H112M174 102L190 118" },
    { el: "circle", cx: 164, cy: 92, r: 15, fill: "butter", accent: true },
  ] },
  /** Stripe · Créer un lien de paiement: the payment page and the link that carries it. */
  "stripe-link": { plate: "sky", parts: [
    { el: "rect", x: 36, y: 32, w: 104, h: 76, r: 8, fill: "paper" },
    { el: "line", d: "M50 50H100M50 60H88" },
    { el: "rect", x: 50, y: 80, w: 56, h: 16, r: 8, fill: "mint", accent: true },
    { el: "line", d: "M158 66H182A10 10 0 0 1 182 86H158A10 10 0 0 1 158 66Z", rotate: [-40, 170, 76] },
    { el: "line", d: "M176 48H200A10 10 0 0 1 200 68H176A10 10 0 0 1 176 48Z", rotate: [-40, 188, 58] },
  ] },
  /** Stripe · Savoir qui ne vous a pas encore payé: the open invoices fanned out, one overdue, the clock. */
  "stripe-unpaid": { plate: "coral", parts: [
    { el: "rect", x: 40, y: 40, w: 64, h: 80, r: 6, fill: "paper" },
    { el: "line", d: "M48 52H76" },
    { el: "rect", x: 82, y: 30, w: 64, h: 80, r: 6, fill: "paper" },
    { el: "line", d: "M90 42H116" },
    { el: "rect", x: 124, y: 20, w: 64, h: 80, r: 6, fill: "paper" },
    { el: "line", d: "M136 36H170M136 46H162" },
    { el: "rect", x: 136, y: 74, w: 40, h: 12, r: 3, fill: "coral", accent: true },
    { el: "circle", cx: 186, cy: 100, r: 16, fill: "butter" },
    { el: "line", d: "M186 91V100L193 104" },
  ] },
} satisfies Record<string, Scene>;

export type SceneId = keyof typeof SCENES;

/**
 * The three directions.
 * - ink: « Encre et aplat » — a fine night line (1.5) over pastel fills set a hair off (2 px), as a riso print; on bone.
 * - flat: « Aplats posés » — fills only, no outline, writing as short ink bars; on the scene's soft palette tone.
 * - line: « Trait seul » — one line in the page's ink, a single pastel accent, no plate; the size of a large pictogram.
 */
export type Direction = "ink" | "flat" | "line";

const FILL: Record<Tone, string> = {
  paper: "var(--tt-pal-paper)", sky: "var(--tt-pal-sky)", butter: "var(--tt-pal-butter)", coral: "var(--tt-pal-coral)",
  mint: "var(--tt-pal-mint)", pink: "var(--tt-pal-pink)",
};
const PLATE: Record<Scene["plate"], string> = {
  sky: "var(--tt-pal-sky-soft)", butter: "var(--tt-pal-butter-soft)", coral: "var(--tt-pal-coral-soft)",
  mint: "var(--tt-pal-mint-soft)", pink: "var(--tt-pal-pink-soft)",
};
/** The plates stay light in dark mode (as Ma stack's tiles): their ink is the fixed night, never the page's ink. */
const NIGHT = "var(--tt-pal-night)";
const CAST = "color-mix(in oklch, var(--tt-pal-night) 12%, transparent)";

function shape(part: Exclude<Part, { el: "line" }>, props: Record<string, string | number>, key: string | number) {
  if (part.el === "rect") {
    const transform = part.rotate ? `rotate(${part.rotate} ${part.x + part.w / 2} ${part.y + part.h / 2})` : undefined;
    return <rect key={key} x={part.x} y={part.y} width={part.w} height={part.h} rx={part.r ?? 0} transform={transform} {...props} />;
  }
  if (part.el === "circle") return <circle key={key} cx={part.cx} cy={part.cy} r={part.r} {...props} />;
  return <path key={key} d={part.d} {...props} />;
}

const turn = (part: Extract<Part, { el: "line" }>) => (part.rotate ? `rotate(${part.rotate.join(" ")})` : undefined);

function render(scene: Scene, direction: Direction) {
  const stroke = { vectorEffect: "non-scaling-stroke", strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return scene.parts.flatMap((part, i) => {
    if (direction === "ink") {
      if (part.el === "line") return [<path key={i} d={part.d} transform={turn(part)} fill="none" stroke={NIGHT} strokeWidth={1.5} {...stroke} />];
      // The fill set a hair off its line (paper stays in register: it is the sheet, not an ink).
      const offset = part.fill === "paper" ? undefined : "translate(2.5 2.5)";
      return [
        <g key={`${i}f`} transform={offset}>{shape(part, { fill: FILL[part.fill] }, 0)}</g>,
        shape(part, { fill: "none", stroke: NIGHT, strokeWidth: 1.5, ...stroke }, `${i}s`),
      ];
    }
    if (direction === "flat") {
      if (part.el === "line") return [<path key={i} d={part.d} transform={turn(part)} fill="none" stroke={NIGHT} strokeWidth={3} {...stroke} />];
      // Paper on paper (stacked invoices, a card over a page) needs an edge without a line: a flat cast, 3 below.
      const cast = part.fill === "paper" ? [<g key={`${i}c`} transform="translate(0 3)">{shape(part, { fill: CAST }, 0)}</g>] : [];
      return [...cast, shape(part, { fill: FILL[part.fill] }, i)];
    }
    if (part.el === "line") return [<path key={i} d={part.d} transform={turn(part)} fill="none" stroke="currentColor" strokeWidth={1.5} {...stroke} />];
    return [shape(part, { fill: part.accent ? FILL[part.fill] : "var(--tt-tile)", stroke: "currentColor", strokeWidth: 1.5, ...stroke }, i)];
  });
}

export default function SituationArt({ scene, direction, style }: { scene: SceneId; direction: Direction; style?: CSSProperties }) {
  const data: Scene = SCENES[scene];
  if (direction === "line") {
    return (
      <svg className={styles.line} viewBox="24 10 192 120" aria-hidden="true" focusable="false" style={style}>
        {render(data, direction)}
      </svg>
    );
  }
  const plate = direction === "ink" ? "var(--tt-pal-bone)" : PLATE[data.plate];
  return (
    <svg className={styles.plate} viewBox="0 0 240 140" aria-hidden="true" focusable="false" style={{ background: plate, ...style }}>
      {render(data, direction)}
    </svg>
  );
}
