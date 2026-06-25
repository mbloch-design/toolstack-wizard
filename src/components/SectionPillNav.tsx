import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import pictoLogo from "@/assets/picto-logo.svg";

export interface PillNavSection {
  id: string;
  label: string;
}

interface SectionPillNavProps {
  /** In-page sections to anchor to. */
  sections: PillNavSection[];
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
  /**
   * Optional click handler. Return `true` to signal the selection was handled
   * externally (e.g. routed to a dedicated URL) and skip the internal smooth
   * scroll. Return falsy / omit to keep the default anchor-scroll behavior.
   */
  onSelect?: (id: string) => boolean | void;
}

/**
 * Shared floating capsule nav used across detail pages (tool / stack /
 * comparatif). Self-contained: tracks the active section with an
 * IntersectionObserver, reveals itself when the hero scrolls away, and
 * supports ←/→ keyboard cycling.
 */
export default function SectionPillNav({
  sections,
  logoTo,
  logoAriaLabel,
  ariaLabel,
  heroSelector,
  onSelect,
}: SectionPillNavProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [visible, setVisible] = useState(false);
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  // While a click/keyboard nav is scrolling toward a target section, the
  // IntersectionObserver still fires for every section the viewport passes
  // over mid-scroll — without this lock, the active pill would flicker
  // through unrelated sections during the animation instead of jumping
  // straight to the clicked one. Cleared once the observer confirms we've
  // actually arrived, with a timeout fallback in case a short/last section
  // never reports an exact match (e.g. the page doesn't scroll that far).
  const pendingIdRef = useRef<string | null>(null);
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goToSection = (id: string) => {
    setActiveId(id);
    pendingIdRef.current = id;
    if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current);
    pendingTimeoutRef.current = setTimeout(() => { pendingIdRef.current = null; }, 1000);
    if (onSelectRef.current?.(id)) return;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
      if (pendingIdRef.current && pendingIdRef.current !== current) return;
      pendingIdRef.current = null;
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
      goToSection(next.id);
    };
    document.addEventListener("keydown", handleKey);

    return () => {
      sectionObserver.disconnect();
      heroObserver?.disconnect();
      document.removeEventListener("keydown", handleKey);
    };
  }, [sections, heroSelector]);

  useEffect(() => () => { if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current); }, []);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    goToSection(id);
  };

  if (sections.length === 0) return null;

  return (
    <nav
      className={`tt-pillnav${visible ? "" : " tt-pillnav--hidden"}`}
      aria-label={ariaLabel}
    >
      <Link to={logoTo} className="tt-pillnav-logo" aria-label={logoAriaLabel}>
        <img src={pictoLogo} alt="" className="tt-pillnav-logo-img" />
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
