import { useEffect, useRef } from "react";

const ACTIVE = "[aria-pressed='true'], [aria-checked='true'], .tt-pill--active, .is-active, .gi-filter-pill--active";

/**
 * The sliding white thumb of the site's filter rails (same as Explorer's
 * segmented control). Drop it as the first child of any `.tt-rail`: it finds
 * the active item itself and glides to it, so pages keep their own filter
 * logic and markup. Purely decorative.
 */
export default function RailThumb() {
  const thumbRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const thumb = thumbRef.current;
    const rail = thumb?.parentElement;
    if (!thumb || !rail) return;
    const place = () => {
      const active = rail.querySelector<HTMLElement>(ACTIVE);
      if (!active || active === thumb) { thumb.style.opacity = "0"; return; }
      thumb.style.opacity = "1";
      thumb.style.width = `${active.offsetWidth}px`;
      thumb.style.transform = `translateX(${active.offsetLeft}px)`;
    };
    place();
    // First placement without a slide, then every change glides.
    requestAnimationFrame(() => thumb.classList.add("is-ready"));
    const mutations = new MutationObserver(place);
    mutations.observe(rail, { attributes: true, subtree: true, childList: true, attributeFilter: ["class", "aria-pressed", "aria-checked"] });
    const sizes = new ResizeObserver(place);
    sizes.observe(rail);
    return () => { mutations.disconnect(); sizes.disconnect(); };
  }, []);

  return <span ref={thumbRef} className="tt-rail-thumb" aria-hidden />;
}
