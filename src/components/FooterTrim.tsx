import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ToolLogo from "@/components/ToolLogo";

/**
 * The footer's twist (Michael, 8 Oct 2026): "Choisir, pas empiler." acted
 * out. Five project tools that do the same job sit in a messy pile; when the
 * footer comes into view the pile is trimmed down to one, a check draws on
 * it. Hover reopens the pile, leaving trims it again. The tool kept changes
 * at each trim, so the animation never reads as a recommendation. Links to
 * Ma stack, where the trimming is done for real.
 *
 * The prerendered HTML shows the pile; trimming starts on the client only.
 * With reduced motion the pile is simply shown trimmed.
 */

// Five tools the catalogue lists as alternatives to one another.
const PILE = [
  { id: "asana", slug: "asana", name: "Asana" },
  { id: "trello", slug: "trello", name: "Trello" },
  { id: "monday", slug: "monday", name: "Monday.com", websiteUrl: "https://monday.com" },
  { id: "jira", slug: "jira", name: "Jira" },
  { id: "clickup", slug: "clickup", name: "ClickUp", websiteUrl: "https://clickup.com" },
];

interface Props { to: string; t: (fr: string, en: string) => string }

export default function FooterTrim({ to, t }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [trimmed, setTrimmed] = useState(false);
  const [kept, setKept] = useState(PILE.length - 1);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setTrimmed(true); return; }
    let timer = 0;
    const observer = new IntersectionObserver(([entry]) => {
      window.clearTimeout(timer);
      if (entry.isIntersecting) timer = window.setTimeout(() => setTrimmed(true), 500);
      else { setTrimmed(false); setKept((index) => (index + 1) % PILE.length); }
    }, { threshold: 0.6 });
    observer.observe(node);
    return () => { observer.disconnect(); window.clearTimeout(timer); };
  }, []);

  const reopen = () => setTrimmed(false);
  const trim = () => { setKept((index) => (index + 1) % PILE.length); setTrimmed(true); };

  return (
    <Link ref={ref} to={to} className="tt-trim" data-trimmed={trimmed ? "" : undefined}
      onMouseEnter={reopen} onMouseLeave={trim} onFocus={reopen} onBlur={trim}
      title={t("5 outils, un seul besoin : gardez-en un", "5 tools, one job: keep one")}
      aria-label={t("Cinq outils pour un même besoin : gardez-en un, dans Ma stack", "Five tools for one job: keep one, in My stack")}>
      <span className="tt-trim-pile" aria-hidden="true">
        {PILE.map((tool, index) => (
          <span key={tool.id} className="tt-trim-tile" data-kept={index === kept ? "" : undefined}
            style={{ "--i": index, "--r": `${[-7, 5, -3, 8, -5][index]}deg` } as React.CSSProperties}>
            <ToolLogo tool={tool} size={40} />
          </span>
        ))}
        <span className="tt-trim-check"><svg viewBox="0 0 16 16" width="12" height="12"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
      </span>
    </Link>
  );
}
