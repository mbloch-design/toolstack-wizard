import type { DiagnosticResult } from "@/types/diagnostic";

type Translate = (fr: string, en: string) => string;

export function translateHealthLabel(
  label: DiagnosticResult["healthLabel"],
  t: Translate
) {
  if (label === "Optimisée") return t("Optimisée", "Optimized");
  if (label === "Correcte") return t("Correcte", "Good");
  if (label === "À revoir") return t("À revoir", "Needs review");
  return t("Critique", "Critical");
}
