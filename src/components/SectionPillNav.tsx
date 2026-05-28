import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";

export interface PillNavSection {
  id: string;
  label: string;
}

interface SectionPillNavProps {
  /** In-page sections to anchor to. */
  sections: PillNavSection[];
  /** Short label inside the left logo block (e.g. "TT", "VS"). */
  logoLabel: string;
  /** Destination of the logo block (usually the parent index). */
  logoTo: string;
  /** Accessible label for the logo block. */
  logoAriaLabel: string;
  /** Accessible label for the nav landmark. */
  ariaLabel: string;
  /**
   * CSS selector for the hero element. The capsule stays hidden while the
   * hero is on screen and fades in once it scrolls out of view.
   */
  heroSelector: string;
}

/**
 * Shared floating capsule nav used across detail pages (tool / stack /
 * comparatif). Self-contained: tracks the active section with an
 * IntersectionObserver, reveals itself when the hero scrolls away, and
 * supports ←/→ keyboard cycling.
 */
export default function SectionPillNav({
  sections,
  logoLabel,
  logoTo,
  logoAriaLabel,
  ariaLabel,
  heroSelector,
}: SectionPillNavProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [visible, setVisible] = useState(false);
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  useEffect(() => {
    if (sections.length === 0) return;
    const nodes = sections
      .map((section) => document.getElementById(section.id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (nodes.length === 0) return;

    const updateActive = () => {
      let current = nodes[0].id;
      nodes.forEach((node) => {
        if (node.getBoundingClientRect().top <= 180) current = node.id;
      });
      setActiveId(current);
    };

    const sectionObserver = new IntersectionObserver(updateActive, {
      rootMargin: "-160px 0px -58% 0px",
      threshold: [0, 0.2, 0.45],
    });
    nodes.forEach((node) => sectionObserver.observe(node));
    updateActive();

    const hero = document.querySelector(heroSelector);
    const heroObserver = hero
      ? new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), { threshold: 0 })
      : null;
    if (hero && heroObserver) heroObserver.observe(hero);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const currentIdx = sections.findIndex((s) => s.id === activeIdRef.current);
      const next = e.key === "ArrowRight"
        ? sections[Math.min(currentIdx + 1, sections.length - 1)]
        : sections[Math.max(currentIdx - 1, 0)];
      if (!next || next.id === activeIdRef.current) return;
      document.getElementById(next.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(next.id);
    };
    document.addEventListener("keydown", handleKey);

    return () => {
      sectionObserver.disconnect();
      heroObserver?.disconnect();
      document.removeEventListener("keydown", handleKey);
    };
  }, [sections, heroSelector]);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  };

  if (sections.length === 0) return null;

  return (
    <nav
      className={`tt-pillnav${visible ? "" : " tt-pillnav--hidden"}`}
      aria-label={ariaLabel}
    >
      <Link to={logoTo} className="tt-pillnav-logo" aria-label={logoAriaLabel}>
        {logoLabel}
      </Link>
      <div className="tt-pillnav-items">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className={`tt-pillnav-item${activeId === section.id ? " tt-pillnav-item--active" : ""}`}
            aria-current={activeId === section.id ? "page" : undefined}
            onClick={(event) => handleClick(event, section.id)}
          >
            {section.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
