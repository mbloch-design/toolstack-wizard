import { lazy } from "react";

// Detail templates are already server-rendered on direct visits. Keeping them
// as route chunks in the browser prevents every visitor from downloading all
// three templates in the application entry bundle.
export const ToolDetailPage = lazy(() => import("@/pages/ToolDetailPage"));
export const ComparePage = lazy(() => import("@/pages/ComparePage"));
export const GuideDetailPage = lazy(() => import("@/pages/GuideDetailPage"));
