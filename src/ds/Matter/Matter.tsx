import styles from "./Matter.module.css";

/*
 * The matter of a glass slab (M01, 16/11/2026, after Figma's progressive background blur): sharp coloured lights at the
 * bottom of the slab, then five layers of background blur, each stronger and revealed lower down, so the glass is clear
 * at the top where the words are and the colours melt into one another towards the bottom. The gradient comes from
 * the matter, not from a drawn ramp. A fine grain on top, never blurred, gives the frosted glass its touch. On an HDR screen
 * the point of light glows past the interface white. Its colours are the slab's range (--tt-slab-teal, -aqua, -blue), set by its host.
 */
const STEPS = [1, 2, 3, 4, 5];

export default function Matter() {
  return (
    <span className={styles.matter} aria-hidden="true">
      <span className={styles.lights} />
      {STEPS.map((step) => <span key={step} className={styles.blur} data-step={step} />)}
      <span className={styles.glow} />
      <span className={styles.grain} />
    </span>
  );
}
