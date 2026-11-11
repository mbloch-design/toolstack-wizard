import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import styles from "./Segmented.module.css";

type Option<T extends string> = { value: T; label: ReactNode; ariaLabel?: string };

/**
 * A segmented picker: one thumb that slides from option to option with a light spring. Each option takes the width of
 * its own label (never a share that a long label overflows); the thumb is set on the chosen option's real box.
 */
export default function Segmented<T extends string>({ options, value, onChange, label }: { options: Option<T>[]; value: T; onChange: (value: T) => void; label: string }) {
  const index = Math.max(0, options.findIndex((option) => option.value === value));
  const group = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const node = group.current;
    if (!node) return;
    const place = () => {
      const chosen = node.querySelectorAll<HTMLButtonElement>("button")[index];
      if (chosen) setThumb({ left: chosen.offsetLeft, width: chosen.offsetWidth });
    };
    place();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(place) : null;
    observer?.observe(node);
    return () => observer?.disconnect();
  }, [index, options.length]);
  return (
    <div ref={group} className={styles.segmented} role="group" aria-label={label}
      style={(thumb ? { "--thumb-x": `${thumb.left}px`, "--thumb-w": `${thumb.width}px` } : { "--n": options.length, "--i": index }) as unknown as CSSProperties}>
      <span className={styles.thumb} data-measured={thumb ? "" : undefined} aria-hidden="true" />
      {options.map((option) => (
        <button key={option.value} type="button" className={styles.option} aria-pressed={option.value === value} aria-label={option.ariaLabel} onClick={() => onChange(option.value)}>{option.label}</button>
      ))}
    </div>
  );
}
