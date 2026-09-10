import { createContext, useContext, useLayoutEffect } from "react";

export interface TopbarBreadcrumbItem {
  label: string;
  href?: string;
}

interface TopbarBreadcrumbContextValue {
  setBreadcrumb: (items: TopbarBreadcrumbItem[] | null) => void;
}

export const TopbarBreadcrumbContext = createContext<TopbarBreadcrumbContextValue | null>(null);

/** Registers `items` as the sticky topbar's breadcrumb for as long as the calling page is mounted. */
export function useTopbarBreadcrumb(items: TopbarBreadcrumbItem[] | null) {
  const ctx = useContext(TopbarBreadcrumbContext);
  const key = items ? JSON.stringify(items) : "";

  // Layout effect, not a passive one: it must commit before the browser
  // paints so the topbar never flashes its search-bar fallback for a frame
  // while the page's breadcrumb is still registering.
  useLayoutEffect(() => {
    if (!ctx) return;
    ctx.setBreadcrumb(items && items.length > 0 ? items : null);
    return () => ctx.setBreadcrumb(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, key]);
}
