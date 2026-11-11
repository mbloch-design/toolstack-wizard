import { useLayoutEffect, useRef, type ReactNode, type Ref } from "react";
import styles from "./Narrative.module.css";

/*
 * Ma stack told as one story: the hero states the premise, the bento's tiles are its chapters, each
 * section carries one title and the story's sentence under it.
 */

/**
 * The premise, without a box, in three levels: a marker line (greeting and the page's name in small
 * capitals), one whole sentence in display (« 8 outils, 78 € par mois. »), one reading line under it.
 * The aura, the page's one dose of light, stays on the right, never under the words.
 */
export function StoryHero({ greeting, eyebrow, titleRef, title, lead, aside }: {
  greeting?: ReactNode; eyebrow: string; titleRef?: Ref<HTMLHeadingElement>;
  /** One sentence; wrap the amount in <Key> to give it the brand's colour. */
  title: ReactNode;
  lead?: ReactNode;
  /** The hero's action. */
  aside?: ReactNode;
}) {
  // The light reaches the window's right edge, past the page's margin and whatever centres the page.
  const hero = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const node = hero.current;
    if (!node) return;
    const measure = () => node.style.setProperty("--bleed", `${Math.max(0, document.documentElement.clientWidth - node.getBoundingClientRect().right)}px`);
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);
  return (
    <header ref={hero} className={styles.hero} data-hero="" data-pagehead="">
      <span className={styles.aura} aria-hidden="true" />
      <p className={styles.eyebrow}>{greeting && <span data-greeting="">{greeting}</span>}{greeting && <span aria-hidden="true"> · </span>}<span>{eyebrow}</span></p>
      <h1 ref={titleRef} tabIndex={-1} className={styles.premise}>{title}</h1>
      {lead && <p className={styles.after}>{lead}</p>}
      {aside && <div className={styles.afterRow}>{aside}</div>}
    </header>
  );
}

/** A figure of the story that matters (« 46 % », « 24 €/mois »): it takes the brand's colour. */
export function Key({ children, tone = "brand" }: { children: ReactNode; tone?: "brand" | "gain" | "overlap" }) {
  return <span className={styles.key} data-tone={tone}>{children}</span>;
}

/** The gain, as the story's ending: the figure in large with the mint echo of the planche breathing behind it. */
export function Ending({ figure, children }: { figure: ReactNode; children?: ReactNode }) {
  return (
    <div className={styles.ending}>
      <span className={styles.echo}><span className={styles.bloom} aria-hidden="true" /><span className={styles.endFigure}>{figure}</span></span>
      {children}
    </div>
  );
}
