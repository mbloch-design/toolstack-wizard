/**
 * The pencil scenes of the MCP sheets' situation cards (19/11/2026). Michael's direction: « tracé crayon, scène ou dessin
 * avec de l'autodérision et du second degré » ; then « parfait, go sur ça ». A situation names its scene in its data
 * (advice.situations[].scene); SituationCard draws it in place of the icon round.
 *
 * Chaque scène est un petit gag sur la vie de free (la facture qui court après le client, les factures qui attendent sur
 * un banc jusqu'à la barbe…). Trait épais à la main, quasi monochrome, des aplats d'encre ponctuels, au plus une touche
 * de la palette par dessin. Le crayon est simulé : un filtre de déplacement fait trembler le trait, une texture de bruit
 * le grène. Jamais de texte dans l'image ; SVG inline, `aria-hidden`.
 */
import { useId, type ReactNode } from "react";
import type { SituationScene } from "@/lib/agents";
import styles from "./SituationArt.module.css";

export type Touch = "sky" | "butter" | "coral" | "mint";
const TOUCH: Record<Touch, string> = {
  sky: "var(--tt-pal-sky)", butter: "var(--tt-pal-butter)", coral: "var(--tt-pal-coral)", mint: "var(--tt-pal-mint)",
};

/** The ink: the page's, so the drawing turns to chalk in dark mode by itself. */
const line = { fill: "none", stroke: "currentColor", strokeWidth: 4.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const fine = { ...line, strokeWidth: 3 };
const ink = { fill: "currentColor" } as const;
/** A shape that hides what is behind it: the card's own grey, never a box. */
// Token colours go in `style`, never in an attribute (DESIGN_SYSTEM, « Couleur et image »: an attribute takes no var()).
const hide = { ...line, style: { fill: "var(--tt-tile)" } } as const;
const touch = (tone: Touch) => ({ ...line, style: { fill: TOUCH[tone] } });

/** A small black shoe, toe to the right (flip with scale(-1 1) about its heel). */
const shoe = (x: number, y: number, flip = false) => (
  <path d={`M${x} ${y}c0 -6 6 -7 9 -4c3 1 7 1 8 4z`} {...ink} {...line} transform={flip ? `translate(${2 * x + 17} 0) scale(-1 1)` : undefined} />
);

/** `box`: the ink's bounds in the 240 × 150 drawing space (measured with getBBox, line excluded), to crop each scene
 *  to its own ink so it starts on the text's left edge. */
type Scene = { box: [number, number, number, number]; touch: Touch; draw: (t: Touch) => ReactNode };

/** The nine pilot situations (research/mcp/{notion,canva,stripe}-mcp.json, advice.situations, in order). */
export const SCENES = {
  /** Notion · Rendez-vous client: the assistant dives head first into the Notion attic; the one page that
   *  matters flies out. */
  "notion-meeting": { box: [34, 17, 208, 140], touch: "butter", draw: (t) => (
    <>
      <path d="M34 44L55 37L61 58L40 64Z" {...hide} />
      <path d="M41 47l12 -4M43 53l10 -3" {...fine} />
      <path d="M178 30L201 36L196 57L173 51Z" {...hide} />
      <path d="M180 38l13 3M178 44l11 3" {...fine} />
      <path d="M100 74C98 60 95 50 93 39M114 74C116 60 119 50 122 40" {...line} />
      <path d="M84 40c-1 -8 10 -10 13 -3c2 4 -6 6 -13 3z" {...ink} {...line} />
      <path d="M118 40c0 -8 11 -9 13 -2c1 4 -7 5 -13 2z" {...ink} {...line} />
      <path d="M70 80L150 80L145 69L77 70Z" {...ink} {...line} />
      <path d="M70 80L48 71L56 58L77 70M150 80L172 71L167 57L145 69" {...line} />
      <path d="M70 80L150 80L150 134L70 134Z" {...hide} />
      <path d="M90 96l40 0M84 104l10 0" {...fine} />
      <path d="M178 84L203 79L208 104L183 109Z" {...touch(t)} />
      <path d="M184 90l15 -3M186 97l14 -3" {...fine} />
      <path d="M62 30q5 -7 12 -5M166 24q4 -7 11 -6M168 96q-6 -2 -10 2" {...fine} />
      <path d="M60 140H162" {...fine} />
    </>
  ) },
  /** Notion · Point de la semaine: the week walks in, dragging its blocked task like a ball and chain. */
  "notion-week": { box: [16, 33, 170, 137], touch: "coral", draw: (t) => (
    <>
      <path d="M48 92C44 100 40 108 36 114" {...fine} />
      <circle cx="45" cy="98" r="3" {...fine} /><circle cx="40" cy="106" r="3" {...fine} /><circle cx="36" cy="114" r="3" {...fine} />
      <circle cx="28" cy="125" r="12" {...touch(t)} />
      <path d="M72 40L132 38L134 104L70 106Z" {...hide} />
      <path d="M80 34v10M124 33v10M71 58H133M91 58V105M112 58V104M71 82H133" {...fine} />
      <path d="M75 68l4 5l7 -9M96 66l4 5l7 -9" {...fine} />
      <circle cx="95" cy="48" r="2.4" {...ink} /><circle cx="110" cy="48" r="2.4" {...ink} />
      <path d="M140 44q3 6 0 9q-3 -3 0 -9M146 56q2 4 0 6q-2 -2 0 -6" {...fine} />
      <path d="M71 72C60 76 53 84 48 92" {...line} />
      <path d="M134 70C146 66 152 72 156 66" {...line} />
      <path d="M90 106L84 128M114 105L121 126" {...line} />
      {shoe(75, 129)}{shoe(118, 127)}
      <path d="M150 116q10 -2 20 2M156 124q8 -1 14 1" {...fine} />
    </>
  ) },
  /** Notion · Factures impayées: the invoice runs after the client, who is already leaving the frame. */
  "notion-invoice": { box: [22, 26, 251, 124], touch: "butter", draw: (t) => (
    <>
      <path d="M26 62H46M22 76H42M28 90H48" {...fine} />
      <path d="M60 46L104 40L112 100L68 106Z" {...touch(t)} />
      <path d="M70 54l26 -4M71 61l20 -3" {...fine} />
      <path d="M75 70l8 2M99 66l-8 3" {...fine} />
      <circle cx="81" cy="76" r="2.4" {...ink} /><circle cx="95" cy="74" r="2.4" {...ink} />
      <path d="M82 86q6 5 11 -1" {...fine} />
      <path d="M109 68C122 64 132 60 144 58M144 58l6 -5M144 58l8 0M144 58l6 5" {...line} />
      <path d="M80 105L70 124L60 121M98 103L110 117L124 112" {...line} />
      {shoe(46, 122)}{shoe(122, 112)}
      <circle cx="214" cy="36" r="10" {...hide} />
      <path d="M202 52C208 48 222 48 228 52L226 86L202 86Z" {...hide} />
      <path d="M226 62L234 72" {...line} />
      <rect x="226" y="72" width="14" height="11" rx="2" {...ink} {...line} />
      <path d="M200 84L190 110L180 110M210 84L222 106L236 102" {...line} />
      {shoe(165, 111, true)}{shoe(234, 103)}
      <path d="M182 52H194M178 64H192M184 76H196" {...fine} />
    </>
  ) },
  /** Canva · Post et story: the square post and its tall twin, same face, same sun, one embarrassed. */
  "canva-post": { box: [40, 6, 198, 138], touch: "butter", draw: (t) => (
    <>
      <path d="M40 64L100 62L101 122L41 123Z" {...hide} />
      <circle cx="88" cy="74" r="5" {...touch(t)} />
      <circle cx="61" cy="86" r="2.4" {...ink} /><circle cx="79" cy="86" r="2.4" {...ink} />
      <path d="M61 100q9 7 18 0" {...fine} />
      <path d="M56 123v12M84 122v12" {...line} />
      {shoe(48, 136, true)}{shoe(83, 135)}
      <path d="M140 22L178 21L179 124L141 125Z" {...hide} />
      <circle cx="170" cy="32" r="5" {...touch(t)} />
      <circle cx="152" cy="48" r="2.4" {...ink} /><circle cx="166" cy="48" r="2.4" {...ink} />
      <path d="M152 62q7 -4 14 0" {...fine} />
      <path d="M182 58q4 2 6 6" {...fine} />
      <path d="M141 72C126 66 112 64 101 72" {...line} />
      <path d="M152 125v12M168 124v12" {...line} />
      {shoe(144, 138, true)}{shoe(167, 137)}
      <path d="M152 12l7 -6l7 6" {...fine} />
      <path d="M190 32h8M190 112h8M130 32h-6M130 112h-6" {...fine} />
    </>
  ) },
  /** Canva · Présentation client: the crumpled notes go in the mincer, a neat slide comes out. */
  "canva-deck": { box: [22, 29, 191, 128], touch: "mint", draw: (t) => (
    <>
      <path d="M92 66L80 34H142L130 66" {...hide} />
      <path d="M98 40c-2 -10 12 -14 18 -8c8 -2 11 10 2 12c-4 7 -17 5 -20 -4z" {...line} />
      <path d="M104 37l6 4l4 -6M108 44l4 -2" {...fine} />
      <path d="M84 66H136V96H84Z" {...hide} />
      <path d="M100 79l4 2l-4 2M120 79l-4 2l4 2" {...fine} />
      <path d="M136 80H156V60H166" {...line} />
      <circle cx="170" cy="60" r="4.5" {...ink} />
      <path d="M84 75H70V89H84" {...line} />
      <path d="M96 96L90 126M124 96L130 126M80 128H140" {...line} />
      <path d="M22 94L64 89L67 119L25 123Z" {...touch(t)} />
      <path d="M34 114v-7M42 113v-13M50 112v-9M58 111v-15" {...line} />
      <path d="M60 80l5 -5M54 74l2 -7M66 86l7 -2" {...fine} />
      <path d="M178 66q5 -4 2 -10M184 72q8 -4 6 -14" {...fine} />
    </>
  ) },
  /** Canva · Retours client: the slide buried under comments, a hand waving from the pile. */
  "canva-feedback": { box: [36, 30, 220, 136], touch: "butter", draw: (t) => (
    <>
      <path d="M36 98H204V136H36Z" {...hide} />
      <path d="M58 116l14 -10l12 8l10 -6l14 8" {...fine} />
      <rect x="44" y="70" width="48" height="28" rx="12" {...hide} />
      <rect x="132" y="72" width="46" height="26" rx="12" {...hide} />
      <rect x="86" y="58" width="52" height="30" rx="13" {...hide} />
      <path d="M100 88l-4 10l12 -10" {...hide} />
      <rect x="62" y="36" width="44" height="26" rx="12" {...touch(t)} />
      <path d="M70 62l-2 9l10 -9" {...touch(t)} />
      <rect x="116" y="30" width="44" height="26" rx="12" {...hide} />
      <rect x="152" y="50" width="38" height="22" rx="11" {...hide} />
      {[[78, 49], [84, 49], [90, 49], [130, 43], [138, 43], [146, 43], [104, 73], [112, 73], [120, 73]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2" {...ink} />)}
      <path d="M186 96C192 86 194 78 196 66" {...line} />
      <path d="M190 66c-1 -10 12 -11 12 -1M191 60v-9M196 58v-11M201 60v-8" {...line} />
      <path d="M208 52q5 2 6 8M210 44q8 3 10 12" {...fine} />
    </>
  ) },
  /** Stripe · Nouvelle facture: the draft, knees knocking, under the magnifying glass of the review. */
  "stripe-invoice": { box: [57, 22, 204, 134], touch: "sky", draw: (t) => (
    <>
      <path d="M70 56H112V122H70Z" {...hide} />
      <path d="M76 64H100M76 70H92" {...fine} />
      <circle cx="84" cy="82" r="5" {...fine} /><circle cx="99" cy="82" r="5" {...fine} />
      <circle cx="85" cy="83" r="2" {...ink} /><circle cx="98" cy="83" r="2" {...ink} />
      <path d="M83 98q3 -3 6 0q3 3 6 0q3 -3 6 0" {...fine} />
      <path d="M82 122l5 10M100 122l-5 10" {...line} />
      {shoe(72, 134, true)}{shoe(94, 134)}
      <path d="M62 60q-3 6 0 9q3 -3 0 -9M58 76q-2 4 0 6q2 -2 0 -6" {...fine} />
      <path d="M172 90L204 122" {...line} strokeWidth={7} />
      <circle cx="150" cy="66" r="30" {...touch(t)} />
      <path d="M128 66q22 -18 44 0q-22 18 -44 0" {...hide} />
      <circle cx="146" cy="68" r="6" {...ink} />
      <path d="M128 50q-4 -6 -2 -12M150 30q2 -6 8 -8" {...fine} />
    </>
  ) },
  /** Stripe · Lien de paiement: fishing for a payment, the link as the hook, a coin that wonders. */
  "stripe-link": { box: [8, 30, 207, 146], touch: "butter", draw: (t) => (
    <>
      <path d="M58 82q10 -6 20 0t20 0t20 0t20 0t20 0t20 0t20 0" {...fine} />
      <path d="M18 138L120 30" {...line} />
      <circle cx="38" cy="117" r="6" {...line} />
      <path d="M120 30C126 50 128 68 130 84" {...fine} />
      <rect x="125" y="83" width="10" height="18" rx="5" {...line} />
      <rect x="125" y="95" width="10" height="18" rx="5" {...line} />
      <circle cx="178" cy="106" r="16" {...touch(t)} />
      <circle cx="171" cy="101" r="2.4" {...ink} />
      <path d="M163 110q3 2 6 0M194 106l13 -10v20z" {...line} />
      <circle cx="160" cy="92" r="2" {...fine} /><circle cx="165" cy="86" r="1.5" {...fine} />
      <path d="M8 146c4 -12 16 -12 18 -2" {...line} />
    </>
  ) },
  /** Stripe · Impayés: the open invoices wait on a bench, long enough to grow a beard. */
  "stripe-unpaid": { box: [28, 10, 212, 136], touch: "coral", draw: (t) => (
    <>
      <circle cx="120" cy="22" r="12" {...touch(t)} />
      <path d="M120 22V14M120 22L126 26" {...fine} />
      <path d="M34 74H206M40 74V102M200 74V102M28 102H212M40 102V132M200 102V132" {...line} />
      <path d="M54 56H86V102H54Z" {...hide} />
      <path d="M61 72h6M73 72h6M64 86h12" {...fine} />
      <path d="M104 50H136V102H104Z" {...hide} />
      <circle cx="113" cy="66" r="2.4" {...ink} /><circle cx="127" cy="66" r="2.4" {...ink} />
      <path d="M108 76C106 104 118 124 120 136C122 124 134 104 132 76C126 82 114 82 108 76Z" {...hide} />
      <path d="M114 90l4 10M126 92l-3 10M120 104v12" {...fine} />
      <path d="M154 56H186V102H154Z" {...hide} />
      <path d="M161 72q3 3 6 0M173 72q3 3 6 0" {...fine} />
      <path d="M62 102v16M78 102v16M160 102v16M178 102v16" {...line} />
      {shoe(54, 119, true)}{shoe(77, 119)}{shoe(152, 119, true)}{shoe(177, 119)}
      <path d="M212 104l-14 14M212 104v14M212 104h-14M204 110q4 4 8 1" {...fine} />
    </>
  ) },
} satisfies Record<SituationScene, Scene>;

export type SceneId = SituationScene;

/** The pencil: the line trembles (a low-frequency displacement), then a fine noise eats into it (the grain). */
function Pencil({ id }: { id: string }) {
  return (
    <filter id={id} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="wobble" />
      <feDisplacementMap in="SourceGraphic" in2="wobble" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="shaky" />
      <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="9" result="noise" />
      <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -3 0 0 0 2.75" result="grain" />
      <feComposite in="shaky" in2="grain" operator="in" />
    </filter>
  );
}

/**
 * One scale for every scene: the band is BAND drawing units high (the tallest ink, 132, plus the line), shown at the
 * card's fixed height. Each scene is cropped to its ink on the left, so it starts on the text's edge, and stands on the
 * band's floor, so every drawing sits on the same line, 24 above the eyebrow.
 */
const BAND = 140;
const EDGE = 2.1; // on the left, half the line: the ink's outer edge lands on the text's edge
const PAD = 4; // elsewhere, half the line plus the pencil's tremble

export default function SituationArt({ scene, pencil = true }: { scene: SceneId; pencil?: boolean }) {
  const id = `pencil-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const data: Scene = SCENES[scene];
  const [x0, , x1, y1] = data.box;
  const viewBox = `${x0 - EDGE} ${y1 + PAD - BAND} ${x1 - x0 + EDGE + PAD} ${BAND}`;
  return (
    <svg className={styles.sketch} viewBox={viewBox} preserveAspectRatio="xMinYMax meet" aria-hidden="true" focusable="false">
      {pencil && <defs><Pencil id={id} /></defs>}
      <g filter={pencil ? `url(#${id})` : undefined}>{data.draw(data.touch)}</g>
    </svg>
  );
}
