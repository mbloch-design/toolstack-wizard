/**
 * The AppShellV2 layout (home, tools, stacks, comparatifs, guides, tool
 * detail...) scrolls inside #main-content rather than the document/window,
 * so its rounded top-left corner stays put instead of scrolling away.
 * Legacy-chrome routes (diagnostic, back-office) don't have that element
 * and keep scrolling the window normally — these helpers fall back to
 * window in that case, so the same call site works in both contexts.
 */
function getScrollEl(): HTMLElement | null {
  const el = document.getElementById("main-content");
  if (!el) return null;
  // On mobile #main-content is CSS-overridden back to overflow-y: visible
  // (normal document scroll, sidebar collapses into a top row) — only
  // treat it as the scroll container when it's actually the one scrolling.
  const overflowY = window.getComputedStyle(el).overflowY;
  return overflowY === "auto" || overflowY === "scroll" ? el : null;
}

export function scrollToTop(behavior: ScrollBehavior = "auto") {
  const el = getScrollEl();
  if (el) el.scrollTo({ top: 0, behavior });
  else window.scrollTo({ top: 0, behavior });
}

export function scrollToY(top: number, behavior: ScrollBehavior = "auto") {
  const el = getScrollEl();
  if (el) el.scrollTo({ top: Math.max(0, top), behavior });
  else window.scrollTo({ top: Math.max(0, top), behavior });
}

export function getScrollTop(): number {
  const el = getScrollEl();
  return el ? el.scrollTop : window.scrollY;
}

/** Attach a scroll listener to whichever element actually scrolls. */
export function onScroll(handler: () => void, options?: AddEventListenerOptions): () => void {
  const el = getScrollEl();
  const target: HTMLElement | Window = el || window;
  target.addEventListener("scroll", handler, options);
  return () => target.removeEventListener("scroll", handler, options);
}

/** scrollTop / scrollable-height of whichever element actually scrolls. */
export function getScrollMetrics(): { scrollTop: number; scrollableHeight: number } {
  const el = getScrollEl();
  if (el) {
    return { scrollTop: el.scrollTop, scrollableHeight: el.scrollHeight - el.clientHeight };
  }
  return {
    scrollTop: window.scrollY,
    scrollableHeight: document.documentElement.scrollHeight - window.innerHeight,
  };
}
