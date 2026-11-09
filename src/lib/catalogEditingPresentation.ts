import type { ReactNode } from "react";
/** Render-only optional seam. Public routes do not import the authoring schema or controls. */
export type CatalogEditingPresentation = {
  layout: {
    privateFiche: string;
    heroCard: string;
    planHead: string;
    planName: string;
    planPrice: string;
    priceEditor: string;
    planCondition: string;
    planSettings: string;
  };
  note: (content: ReactNode) => ReactNode;
  field: (
    path: readonly (string | number)[],
    inherited?: ReactNode,
  ) => ReactNode;
  block: (
    roots: string[],
    title: string,
    options?: { advanced?: boolean; inHero?: boolean; omit?: string[] },
  ) => ReactNode;
  planDetails: (root: string, index: number) => ReactNode;
  planActions: (root: string, index: number) => ReactNode;
  planCollection: (root: string) => ReactNode;
  priceSummary: (currency: string) => ReactNode;
};
