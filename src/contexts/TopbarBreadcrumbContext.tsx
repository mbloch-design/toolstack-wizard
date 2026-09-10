import { createContext, useContext, useEffect } from "react";

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

  useEffect(() => {
    if (!ctx) return;
    ctx.setBreadcrumb(items && items.length > 0 ? items : null);
    return () => ctx.setBreadcrumb(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, key]);
}
