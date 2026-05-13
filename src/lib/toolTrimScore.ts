/**
 * Computes the ToolTrim editorial score for a given tool.
 * Score range: 2.8–4.8 / 5
 * Not a user rating — reflects ToolTrim's independent editorial analysis.
 */
export function computeToolTrimScore(tool: any): { score: number; labelFr: string; labelEn: string } {
  let score = 3.5;

  // Tool type
  if (tool.tool_type === "metier" || tool.tool_type === "core") score += 0.3;
  if (tool.tool_type === "ia") score += 0.4;

  // Hard to replace = higher intrinsic value
  if (tool.substitutable === false) score += 0.3;

  // Editorial content quality
  if ((tool.pros?.length || 0) >= 4) score += 0.2;
  if ((tool.cons?.length || 0) >= 5) score -= 0.15;

  // Internal recommendation signal
  if (tool.prescription_quality === "silence") score -= 0.2;

  // Built-in AI features
  if (tool.ia_use_case) score += 0.15;

  // Free plan = more accessible
  const hasFree = tool.pricing?.free &&
    !tool.pricing.free.toLowerCase().includes("no free") &&
    !tool.pricing.free.toLowerCase().includes("aucun") &&
    !tool.pricing.free.toLowerCase().includes("pas de");
  if (hasFree) score += 0.1;

  // Clamp
  score = Math.max(2.8, Math.min(4.8, score));
  score = Math.round(score * 10) / 10;

  const labelFr = score >= 4.5 ? "Incontournable" : score >= 4.0 ? "Solide" : score >= 3.5 ? "Correct" : "À évaluer";
  const labelEn = score >= 4.5 ? "Must-have" : score >= 4.0 ? "Solid" : score >= 3.5 ? "Decent" : "Mixed";

  return { score, labelFr, labelEn };
}

/** Render 5 star SVGs for a given score (supports half-star) */
export function starFill(i: number, score: number): string {
  if (i <= Math.floor(score)) return "hsl(var(--primary))";
  if (i === Math.ceil(score) && score % 1 >= 0.5) return "hsl(var(--primary) / 0.45)";
  return "hsl(var(--border))";
}
