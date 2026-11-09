import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import styles from "./Button.module.css";

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  /** primary: the one action of a block (ink). secondary: any other (grey). quiet: a text action with a drawn line. */
  variant?: "primary" | "secondary" | "quiet";
  size?: "md" | "lg";
  icon?: ReactNode;
  /** A toggle (« Modifier » / « Terminé »): pressed turns ink. */
  pressed?: boolean;
  children: ReactNode;
};

/** Every button of the system: one font (label), one radius (pill), one set of states. */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = "secondary", size = "md", icon, pressed, children, type = "button", ...rest }, ref) {
  return (
    <button ref={ref} type={type} className={styles.button} data-variant={variant} data-size={size} aria-pressed={pressed} {...rest}>
      {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </button>
  );
});
export default Button;

/** A round button with only an icon: on a picture (« + »), or beside a field. It always has a name. */
export function IconButton({ label, icon, tone = "raised", size = 44, ...rest }: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { label: string; icon: ReactNode; tone?: "raised" | "grey"; size?: 32 | 40 | 44 }) {
  return <button type="button" className={styles.iconButton} data-tone={tone} data-size={size} aria-label={label} title={rest.title ?? label} {...rest}><span aria-hidden="true">{icon}</span></button>;
}

export type LinkTone = "label" | "quiet" | "inline";
/** A text link, as a link or a button. label: an action beside a title. quiet: reads as text (« Plus tard »).
    inline: inside a sentence, always underlined so it never relies on colour. Router links take the class. */
export function linkClass(tone: LinkTone = "label") {
  return tone === "label" ? styles.link : `${styles.link} ${styles[tone]}`;
}
export function TextButton({ tone, children, type = "button", ...rest }: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & { tone?: LinkTone; children: ReactNode }) {
  return <button type={type} className={linkClass(tone)} {...rest}>{children}</button>;
}

/** A link that looks like a button (router links): spread on the link. */
export function buttonAttrs(variant: "primary" | "secondary" = "secondary", size: "md" | "lg" = "md") {
  return { className: styles.button, "data-variant": variant, "data-size": size } as const;
}
