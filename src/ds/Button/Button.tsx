import { forwardRef, type ButtonHTMLAttributes, type PointerEvent, type ReactNode } from "react";
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

/** The shooting star (planche): a point of light running round the lead's edge at a steady pace, on hover only. */
function Spark() {
  return <svg className={styles.spark} aria-hidden="true"><rect pathLength="100" /><rect className={styles.sparkGlow} pathLength="100" /></svg>;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = "secondary", size = "md", icon, pressed, arrow, children, type = "button", onPointerMove, onPointerLeave, ...rest }, ref) {
  const lead = variant === "primary";
  return (
    <button ref={ref} type={type} className={styles.button} data-variant={variant} data-size={size} aria-pressed={pressed}
      onPointerMove={lead ? (event) => { followPointer(event); onPointerMove?.(event); } : onPointerMove}
      onPointerLeave={lead ? (event) => { releasePointer(event); onPointerLeave?.(event); } : onPointerLeave} {...rest}>
      {lead && <Spark />}
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
