import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Tag.module.css";

export type TagProps = Omit<HTMLAttributes<HTMLSpanElement>, "className"> & {
  /** neutral: a fact (« Le moins cher »). ok: in use. overlap: does the same job as another tool. */
  /** neutral, ok (gain), overlap (duplicate); the three verbs of a verdict: keep (ink), swap (blue), add (green). */
  tone?: "neutral" | "ok" | "overlap" | "keep" | "swap" | "add";
  /** The surface under it: a tag on a grey tile turns white to stay visible. */
  on?: "card" | "tile";
  children: ReactNode;
};

/** A short fact after a name. Ink text on a light tint: the colour is never the only signal, the words say it. */
export default function Tag({ tone = "neutral", on = "card", children, ...rest }: TagProps) {
  return <span className={styles.tag} data-tone={tone} data-on={on} {...rest}>{children}</span>;
}
