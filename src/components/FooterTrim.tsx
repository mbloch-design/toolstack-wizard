import { useEffect, useRef, useState } from "react";
import ToolLogo from "@/components/ToolLogo";

/**
 * The footer's twist (Michael, 8 Oct 2026): "Choisir, pas empiler." acted
 * out. Five project tools that do the same job sit in a messy pile; when the
 * footer comes into view the pile folds into a single neutral tile with a
 * check. No brand is ever shown as the one kept: the gesture is choosing,
 * not a recommendation. It folds once per page; hover reopens the pile,
 * leaving folds it again. Purely decorative (design review, 8 Oct 2026):
 * the tagline carries the meaning, the actions next to it carry the links.
 *
 * Client-only: the prerendered HTML holds an empty box of the same size
 * (the footer repeats on 13,000+ pages, and the HTML budget counts every
 * byte). With reduced motion the pile is simply shown folded.
 */

// Five tools the catalogue lists as alternatives to one another.
const PILE = [
  { id: "asana", slug: "asana", name: "Asana" },
  { id: "trello", slug: "trello", name: "Trello" },
  { id: "monday", slug: "monday", name: "Monday.com", websiteUrl: "https://monday.com" },
  { id: "jira", slug: "jira", name: "Jira" },
  { id: "clickup", slug: "clickup", name: "ClickUp", websiteUrl: "https://clickup.com" },
];
const TILT = [-7, 5, -3, 8, -5];

export default function FooterTrim() {
  const ref = useRef<HTMLSpanElement>(null);
  const [trimmed, setTrimmed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [still, setStill] = useState(false);
  useEffect(() => { setMounted(true); setStill(!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches); }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node || !mounted) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setTrimmed(true); return; }
    let timer = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      timer = window.setTimeout(() => setTrimmed(true), 400);
      observer.disconnect();
    }, { threshold: 0.6 });
    observer.observe(node);
    return () => { observer.disconnect(); window.clearTimeout(timer); };
  }, [mounted]);

  return (
    <span ref={ref} className="tt-trim" data-trimmed={trimmed ? "" : undefined} aria-hidden="true"
      onMouseEnter={still ? undefined : () => setTrimmed(false)} onMouseLeave={still ? undefined : () => setTrimmed(true)}>
      <span className="tt-trim-pile">
        {mounted && <>{PILE.map((tool, index) => (
          <span key={tool.id} className="tt-trim-tile" style={{ "--i": index, "--r": `${TILT[index]}deg` } as React.CSSProperties}>
            <ToolLogo tool={tool} size={40} />
          </span>
        ))}
        <span className="tt-trim-one">
          <svg viewBox="0 0 16 16" width="18" height="18"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span></>}
      </span>
    </span>
  );
}
