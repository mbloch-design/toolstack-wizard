import { forwardRef, useState, type ButtonHTMLAttributes, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { ArrowRight } from "@/lib/icons";
import styles from "./Button.module.css";

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  /** primary: the one action of a block (ink). secondary: any other (grey). raised: a secondary on colour or light (page white, hairline). quiet: a text action with a drawn line. */
  variant?: "primary" | "secondary" | "raised" | "quiet";
  size?: "md" | "lg";
  icon?: ReactNode;
  /** A toggle (« Modifier » / « Terminé »): pressed turns ink. */
  pressed?: boolean;
  /** The planche's lead: an arrow after the label, replaced by its twin on hover (it goes somewhere). */
  arrow?: boolean;
  children: ReactNode;
};

/** Every button of the system: one font (label), one radius (pill), one set of states. */
/** Two arrows in a window: on hover the first leaves right, the second comes in from the left. */
function Arrow() {
  return <span className={styles.arrow} aria-hidden="true"><span className={styles.arrowOut}><ArrowRight /></span><span className={styles.arrowIn}><ArrowRight /></span></span>;
}

/** The lead's light follows the pointer. */
function followPointer(event: PointerEvent<HTMLElement>) {
  const box = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - box.left, y = event.clientY - box.top;
  event.currentTarget.style.setProperty("--tt-mx", `${x}px`);
  event.currentTarget.style.setProperty("--tt-my", `${y}px`);
  // Attraction (planche): 3 px toward the pointer, never more.
  event.currentTarget.style.setProperty("--tt-pull-x", `${((x / box.width) - 0.5) * 6}px`);
  event.currentTarget.style.setProperty("--tt-pull-y", `${((y / box.height) - 0.5) * 6}px`);
}
function releasePointer(event: PointerEvent<HTMLElement>) {
  event.currentTarget.style.setProperty("--tt-pull-x", "0px");
  event.currentTarget.style.setProperty("--tt-pull-y", "0px");
}

/* The trail, from the planche (tooltrim-system.js): [offset behind the head, violet→blue mix in %, opacity, width];
   a mix of -1 is the white core. Cosine windows, so both ends fade softly. */
type SparkRow = [offset: number, mix: number, opacity: number, width: number];
const SPARK_GLOW: SparkRow[] = [[-4.0,100,0.0,1.0],[-3.52,92,0.004,1.02],[-3.05,84,0.013,1.06],[-2.57,76,0.028,1.12],[-2.1,68,0.046,1.18],[-1.62,60,0.068,1.25],[-1.14,52,0.094,1.32],[-0.67,44,0.123,1.4],[-0.19,36,0.155,1.48],[0.29,28,0.189,1.57],[0.76,20,0.225,1.66],[1.24,12,0.263,1.75],[1.71,4,0.303,1.85],[2.19,-1,0.343,1.94],[2.67,-1,0.384,2.03],[3.14,-1,0.425,2.12],[3.62,-1,0.466,2.21],[4.1,-1,0.506,2.3],[4.57,-1,0.546,2.38],[5.05,-1,0.584,2.46],[5.52,-1,0.621,2.54],[6.0,-1,0.656,2.61],[6.48,-1,0.689,2.68],[6.95,-1,0.719,2.74],[7.43,-1,0.747,2.8],[7.9,-1,0.772,2.85],[8.38,-1,0.794,2.89],[8.86,-1,0.812,2.93],[9.33,-1,0.827,2.95],[9.81,-1,0.838,2.98],[10.29,-1,0.846,2.99],[10.76,-1,0.85,3.0],[11.24,-1,0.85,3.0],[11.71,-1,0.846,2.99],[12.19,-1,0.838,2.98],[12.67,-1,0.827,2.95],[13.14,-1,0.812,2.93],[13.62,-1,0.794,2.89],[14.1,-1,0.772,2.85],[14.57,-1,0.747,2.8],[15.05,-1,0.719,2.74],[15.52,-1,0.689,2.68],[16.0,-1,0.656,2.61],[16.48,-1,0.621,2.54],[16.95,-1,0.584,2.46],[17.43,-1,0.546,2.38],[17.9,-1,0.506,2.3],[18.38,-1,0.466,2.21],[18.86,-1,0.425,2.12],[19.33,-1,0.384,2.03],[19.81,-1,0.343,1.94],[20.29,4,0.303,1.85],[20.76,12,0.263,1.75],[21.24,20,0.225,1.66],[21.71,28,0.189,1.57],[22.19,36,0.155,1.48],[22.67,44,0.123,1.4],[23.14,52,0.094,1.32],[23.62,60,0.068,1.25],[24.1,68,0.046,1.18],[24.57,76,0.028,1.12],[25.05,84,0.013,1.06],[25.52,92,0.004,1.02],[26.0,100,0.0,1.0]];
const SPARK_CORE: SparkRow[] = [[0.0,100,0.0,0.6],[0.37,91,0.0,0.6],[0.75,83,0.003,0.6],[1.12,74,0.008,0.6],[1.49,66,0.018,0.61],[1.86,57,0.031,0.62],[2.24,49,0.049,0.64],[2.61,40,0.072,0.66],[2.98,32,0.1,0.68],[3.36,23,0.134,0.72],[3.73,15,0.172,0.76],[4.1,6,0.214,0.8],[4.47,-1,0.261,0.85],[4.85,-1,0.311,0.91],[5.22,-1,0.365,0.97],[5.59,-1,0.42,1.04],[5.97,-1,0.478,1.11],[6.34,-1,0.536,1.18],[6.71,-1,0.594,1.26],[7.08,-1,0.651,1.33],[7.46,-1,0.706,1.4],[7.83,-1,0.759,1.47],[8.2,-1,0.808,1.54],[8.58,-1,0.853,1.6],[8.95,-1,0.893,1.65],[9.32,-1,0.927,1.7],[9.69,-1,0.956,1.74],[10.07,-1,0.977,1.77],[10.44,-1,0.992,1.79],[10.81,-1,0.999,1.8],[11.19,-1,0.999,1.8],[11.56,-1,0.992,1.79],[11.93,-1,0.977,1.77],[12.31,-1,0.956,1.74],[12.68,-1,0.927,1.7],[13.05,-1,0.893,1.65],[13.42,-1,0.853,1.6],[13.8,-1,0.808,1.54],[14.17,-1,0.759,1.47],[14.54,-1,0.706,1.4],[14.92,-1,0.651,1.33],[15.29,-1,0.594,1.26],[15.66,-1,0.536,1.18],[16.03,-1,0.478,1.11],[16.41,-1,0.42,1.04],[16.78,-1,0.365,0.97],[17.15,-1,0.311,0.91],[17.53,-1,0.261,0.85],[17.9,6,0.214,0.8],[18.27,15,0.172,0.76],[18.64,23,0.134,0.72],[19.02,32,0.1,0.68],[19.39,40,0.072,0.66],[19.76,49,0.049,0.64],[20.14,57,0.031,0.62],[20.51,66,0.018,0.61],[20.88,74,0.008,0.6],[21.25,83,0.003,0.6],[21.63,91,0.0,0.6],[22.0,100,0.0,0.6]];
/** Finer than the planche (Michael, 11/11: « plus fine et délicate »): every segment drawn at 55 % of its width. */
const SPARK_FINE = 0.55;
const sparkStroke = (mix: number) => mix < 0 ? "var(--tt-edge-head)" : `color-mix(in oklch, var(--tt-edge-3), var(--tt-edge-2) ${mix}%)`;
function SparkTrail({ rows, glow }: { rows: SparkRow[]; glow?: boolean }) {
  return (
    <svg className={styles.spark} data-glow={glow || undefined} aria-hidden="true">
      {rows.map(([offset, mix, opacity, width]) => <rect key={offset} pathLength={100}
        style={{ "--o": offset, stroke: sparkStroke(mix), strokeOpacity: opacity, strokeWidth: width * SPARK_FINE } as CSSProperties} />)}
    </svg>
  );
}
/**
 * The shooting star (planche): on hover, a 1 px P3 rim drifts along the pill and a soft trail of light runs round
 * it at a steady pace, a blurred flare under a white core. Nothing is drawn before the first hover.
 */
function Spark() {
  return <><span className={styles.edge} aria-hidden="true" /><SparkTrail rows={SPARK_GLOW} glow /><SparkTrail rows={SPARK_CORE} /></>;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = "secondary", size = "md", icon, pressed, arrow, children, type = "button", onPointerMove, onPointerLeave, ...rest }, ref) {
  const lead = variant === "primary";
  const [armed, setArmed] = useState(false);
  return (
    <button ref={ref} type={type} className={styles.button} data-variant={variant} data-size={size} aria-pressed={pressed}
      onPointerMove={lead ? (event) => { if (!armed) setArmed(true); followPointer(event); onPointerMove?.(event); } : onPointerMove}
      onPointerLeave={lead ? (event) => { releasePointer(event); onPointerLeave?.(event); } : onPointerLeave} {...rest}>
      {lead && armed && <Spark />}
      {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
      <span>{children}</span>
      {arrow && <Arrow />}
    </button>
  );
});
export default Button;

/** A round button with only an icon: on a picture (« + »), or beside a field. It always has a name. */
export const IconButton = forwardRef<HTMLButtonElement, Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { label: string; icon: ReactNode; tone?: "raised" | "grey" | "quiet" | "ink" | "done"; size?: 32 | 40 | 44 }>(
  function IconButton({ label, icon, tone = "raised", size = 44, ...rest }, ref) {
    return <button ref={ref} type="button" className={styles.iconButton} data-tone={tone} data-size={size} aria-label={label} title={rest.title ?? label} {...rest}><span aria-hidden="true">{icon}</span></button>;
  });

export type LinkTone = "label" | "quiet" | "inline" | "danger";
/** A text link, as a link or a button. label: an action beside a title. quiet: reads as text (« Plus tard »).
    inline: inside a sentence, always underlined so it never relies on colour. danger: let something go (« Retirer de ma stack »).
    Router links take the class. */
export function linkClass(tone: LinkTone = "label") {
  return tone === "label" ? styles.link : `${styles.link} ${styles[tone]}`;
}
/** arrow: a link that leads somewhere shows its arrow on hover (planche, « link »). */
export function TextButton({ tone, arrow, children, type = "button", ...rest }: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & { tone?: LinkTone; arrow?: boolean; children: ReactNode }) {
  return <button type={type} className={linkClass(tone)} {...rest}>{children}{arrow && <LinkArrow />}</button>;
}
/** The arrow of a link that leads somewhere, for router links too. */
export function LinkArrow() {
  return <span className={styles.linkArrow} aria-hidden="true"><ArrowRight /></span>;
}

/** A link that looks like a button (router links): spread on the link. */
export function buttonAttrs(variant: "primary" | "secondary" | "raised" = "secondary", size: "md" | "lg" = "md") {
  return { className: styles.button, "data-variant": variant, "data-size": size } as const;
}
