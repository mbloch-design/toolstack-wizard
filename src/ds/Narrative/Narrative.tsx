import { useLayoutEffect, useRef, type ReactNode, type Ref } from "react";
import styles from "./Narrative.module.css";

/*
 * Ma stack told as one story: the hero states the premise, each chapter opens with a sentence that
 * takes up a figure of the previous one, and the thread (the cut line of the planche, blue to violet)
 * comes back before each of them: « le hero et chaque coupe sont le même fil ».
 */

/** The cut line in the aura's colours, drifting slowly. Its only use: to say « the story goes on ». */
export function Thread({ width }: { width?: string }) {
  return <span className={styles.thread} style={width ? { width } : undefined} aria-hidden="true" />;
}

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

/** A section of the story: one title (42), the sentence that takes the story on under it (16), then its content. Never two titles. */
export function StoryChapter({ sentence, lead, children, label }: { sentence: ReactNode; lead?: ReactNode; children?: ReactNode; label?: string }) {
  return (
    <section className={styles.chapter} aria-label={label} data-chapter="">
      <div className={styles.head}>
        <h2 className={styles.sentence}>{sentence}</h2>
        {lead && <p className={styles.lead}>{lead}</p>}
      </div>
      {children}
    </section>
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
