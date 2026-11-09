import { createContext, useContext } from "react";

export type BackofficeSection = "overview" | "catalog" | "users" | "stacks" | "usage" | "sources" | "diagnostic";
const sections: BackofficeSection[] = ["overview", "catalog", "users", "stacks", "usage", "sources", "diagnostic"];
export function readBackofficeSection(search: string): BackofficeSection {
  const value = new URLSearchParams(search).get("view");
  return sections.find((section) => section === value) ?? "overview";
}
export type BackofficeNavigationModel = { section: BackofficeSection; onNavigate(section: BackofficeSection): Promise<boolean> };
export const BackofficeNavigationContext = createContext<((model: BackofficeNavigationModel | null) => void) | null>(null);
export const useBackofficeNavigationPublisher = () => useContext(BackofficeNavigationContext);
