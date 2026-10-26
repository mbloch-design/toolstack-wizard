import { useEffect } from "react";

/** BrowserRouter has no data-router blocker. Capture POP before its listener,
 * restore its indexed history entry, and keep the mounted editor untouched. */
export function useCatalogExitGuard(dirty: boolean, onBlocked: () => void) {
  useEffect(() => {
    if (!dirty) return;
    const state = window.history.state as { idx?: number } | null;
    const location = window.location.href;
    let restoring = false;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const linkClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      )
        return;
      const link = (event.target as Element)?.closest?.("a[href]");
      const signOut = (event.target as Element)?.closest?.(
        ".bo-account-toolbar .bo-signout",
      );
      if (
        !signOut &&
        (!(link instanceof HTMLAnchorElement) ||
          link.target === "_blank" ||
          link.hasAttribute("download"))
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      onBlocked();
    };
    const pop = (event: PopStateEvent) => {
      event.stopImmediatePropagation();
      if (restoring && window.location.href === location) {
        restoring = false;
        return;
      }
      const next = event.state as { idx?: number } | null;
      const delta =
        typeof state?.idx === "number" && typeof next?.idx === "number"
          ? state.idx - next.idx
          : 0;
      onBlocked();
      if (delta) {
        restoring = true;
        history.go(delta);
      } else {
        history.pushState(state, "", location);
        restoring = false;
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", linkClick, true);
    window.addEventListener("popstate", pop, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", linkClick, true);
      window.removeEventListener("popstate", pop, true);
    };
  }, [dirty, onBlocked]);
}
