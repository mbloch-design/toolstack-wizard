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
import { useId } from "react";
import type { SituationScene } from "@/lib/agents";
import type { Scene } from "./scenes/kit";
import { LOT1 } from "./scenes/lot1";
import { LOT2 } from "./scenes/lot2";
import { LOT3 } from "./scenes/lot3";
import { LOT4 } from "./scenes/lot4";
import { PILOTS } from "./scenes/pilots";
import styles from "./SituationArt.module.css";

/** Every scene, by the id a situation names in its data (advice.situations[].scene). */
export const SCENES = {
  ...PILOTS,
  ...LOT1,
  ...LOT2,
  ...LOT3,
  ...LOT4,
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
