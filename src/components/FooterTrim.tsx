import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ToolLogo from "@/components/ToolLogo";

/**
 * The footer's twist (Michael, 8 Oct 2026): "Choisir, pas empiler." acted
 * out. Five project tools that do the same job sit in a messy pile; when the
 * footer comes into view the pile folds into a single neutral tile with a
 * check. No brand is ever shown as the one kept: the gesture is choosing,
 * not a recommendation. Hover reopens the pile, leaving folds it again.
 * Links to Ma stack, where the trimming is done for real.
 *
 * The prerendered HTML shows the pile; folding starts on the client only.
 * With reduced motion the pile is simply shown folded.
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

interface Props { to: string; t: (fr: string, en: string) => string }

export default function FooterTrim({ to, t }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [trimmed, setTrimmed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setTrimmed(true); return; }
    let timer = 0;
    const observer = new IntersectionObserver(([entry]) => {
      window.clearTimeout(timer);
      if (entry.isIntersecting) timer = window.setTimeout(() => setTrimmed(true), 500);
      else setTrimmed(false);
    }, { threshold: 0.6 });
    observer.observe(node);
    return () => { observer.disconnect(); window.clearTimeout(timer); };
  }, []);

  return (
    <Link ref={ref} to={to} className="tt-trim" data-trimmed={trimmed ? "" : undefined}
      onMouseEnter={() => setTrimmed(false)} onMouseLeave={() => setTrimmed(true)}
      onFocus={() => setTrimmed(false)} onBlur={() => setTrimmed(true)}
      title={t("5 outils, un seul besoin : gardez-en un", "5 tools, one job: keep one")}
      aria-label={t("Cinq outils pour un même besoin : gardez-en un, dans Ma stack", "Five tools for one job: keep one, in My stack")}>
      <span className="tt-trim-pile" aria-hidden="true">
        {PILE.map((tool, index) => (
          <span key={tool.id} className="tt-trim-tile" style={{ "--i": index, "--r": `${TILT[index]}deg` } as React.CSSProperties}>
            <ToolLogo tool={tool} size={40} />
          </span>
        ))}
        <span className="tt-trim-one">
          <svg viewBox="0 0 16 16" width="18" height="18"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
      </span>
    </Link>
  );
}
