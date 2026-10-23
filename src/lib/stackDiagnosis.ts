import type { ToolSummary } from "@/hooks/useSupabaseData";

// The decisions left on a stack, in the order they change the result:
// freemium plans set the cost and the overlaps, then the pairs, then the
// prices nobody has entered yet.
export type DecisionStep =
  | { kind: "freemium"; tools: ToolSummary[] }
  | { kind: "pairs"; count: number; amountToReview: number }
  | { kind: "prices"; tools: ToolSummary[] };

export interface StackDiagnosis { steps: DecisionStep[]; settled: boolean }

export function stackDiagnosis(input: { pairs: number; amountToReview: number; unreviewedFreemium: ToolSummary[]; unknownPrice: ToolSummary[] }): StackDiagnosis {
  const steps: DecisionStep[] = [];
  if (input.unreviewedFreemium.length > 0) steps.push({ kind: "freemium", tools: input.unreviewedFreemium });
  if (input.pairs > 0) steps.push({ kind: "pairs", count: input.pairs, amountToReview: input.amountToReview });
  if (input.unknownPrice.length > 0) steps.push({ kind: "prices", tools: input.unknownPrice });
  return { steps, settled: steps.length === 0 };
}

export function stackVerdict(pairs: number, lang: "fr" | "en"): string {
  if (pairs === 0) return lang === "fr" ? "Aucun doublon à trancher." : "No overlap to settle.";
  const s = pairs > 1 ? "s" : "";
  return lang === "fr" ? `${pairs} doublon${s} possible${s} à trancher.` : `${pairs} possible overlap${s} to settle.`;
}
