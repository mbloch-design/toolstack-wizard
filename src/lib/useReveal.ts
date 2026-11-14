import { useCallback } from "react";

/**
 * Cards arrive, they do not pop (13/11/2026, Michael: « une apparition légère, mais assumée et fluide »).
 * An element waits unseen until it comes into view, then rises into place once (html[data-reveal-on] and
 * [data-reveal] in index.css). Cards that come into view together arrive one after another, a beat apart.
 * Without IntersectionObserver, or with reduced motion, nothing is ever hidden.
 */
const STEP_MS = 50;
const MAX_DELAY_MS = 300;
let observer: IntersectionObserver | null | undefined;

function shared(): IntersectionObserver | null {
  if (observer !== undefined) return observer;
  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined"
    || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return (observer = null);
  document.documentElement.dataset.revealOn = "";
  observer = new IntersectionObserver((entries) => {
    let order = 0;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target as HTMLElement;
      observer!.unobserve(el);
      el.style.setProperty("--reveal-delay", `${Math.min(order++ * STEP_MS, MAX_DELAY_MS)}ms`);
      el.dataset.reveal = "in";
      el.addEventListener("animationend", () => { el.dataset.reveal = "done"; el.style.removeProperty("--reveal-delay"); }, { once: true });
    }
  }, { rootMargin: "0px 0px -6% 0px", threshold: 0.01 });
  return observer;
}

/** Ref for an element that should arrive when it comes into view. */
export function useReveal<T extends HTMLElement>() {
  return useCallback((el: T | null) => {
    const io = shared();
    if (!el || !io || el.dataset.reveal) return;
    // Only what is on screen when it mounts (the first view, a new filter) arrives. Content met while scrolling is
    // already there: hiding it left blank sections during a fast scroll (13/11/2026).
    const box = el.getBoundingClientRect();
    if (box.top > window.innerHeight || box.bottom < 0) { el.dataset.reveal = "done"; return; }
    el.dataset.reveal = "wait";
    io.observe(el);
  }, []);
}
