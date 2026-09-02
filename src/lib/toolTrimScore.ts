import { hasGenuineFreeTier } from "./pricing";
import type { ToolTrimRating } from "@/data/types";

export interface ToolTrimScoreResult {
  score: number;
  labelFr: string;
  labelEn: string;
  source: "v2" | "legacy";
}

// Band vocabulary and cutoffs follow Trustpilot's TrustScore convention
// (Bad/Poor/Average/Great/Excellent), adopted so the wording stays legible
// once the v2 axis average can actually fall below the legacy score's old
// 2.8 floor.
const labelsFor = (score: number) => ({
  labelFr: score >= 4.3 ? "Excellent" : score >= 3.8 ? "Très bon" : score >= 2.8 ? "Moyen" : score >= 1.8 ? "Médiocre" : "Mauvais",
  labelEn: score >= 4.3 ? "Excellent" : score >= 3.8 ? "Great" : score >= 2.8 ? "Average" : score >= 1.8 ? "Poor" : "Bad",
});

const STALE_THRESHOLD_DAYS = 365;

/**
 * v2 score: plain average of five 1-5 axes graded from citable evidence
 * (valeurAjoutee, simplicite, utilisation, puissance, reversibilite) — see
 * ToolTrimRating in data/types.ts for what each axis means and why pros/cons
 * counts and free-tier presence were dropped (they measured editorial effort
 * and pricing model, not tool quality). Returns null when any axis is still
 * unrated: an incomplete rating must never surface a number, so callers fall
 * back to computeLegacyToolTrimScore until every axis has evidence.
 */
export function computeToolTrimScoreV2(rating: ToolTrimRating | null | undefined): ToolTrimScoreResult | null {
  if (!rating) return null;
  const axes = [rating.valeurAjoutee, rating.simplicite, rating.utilisation, rating.puissance, rating.reversibilite];
  if (axes.some((axis) => axis == null)) return null;

  let score = axes.reduce((sum, axis) => sum + (axis as number), 0) / axes.length;

  if (rating.lastActivityVerifiedOn) {
    const daysSince = (Date.now() - new Date(rating.lastActivityVerifiedOn).getTime()) / 86_400_000;
    if (daysSince > STALE_THRESHOLD_DAYS) score = Math.min(score, 3.5);
  }

  score = Math.round(score * 10) / 10;
  return { score, ...labelsFor(score), source: "v2" };
}

/**
 * Legacy heuristic, kept as a fallback for the ~1150 tools not yet rated on
 * the five-axis grid. Score range: 2.8–4.8 / 5.
 */
function computeLegacyToolTrimScore(tool: any): ToolTrimScoreResult {
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
  if (hasGenuineFreeTier(tool.pricing?.free)) score += 0.1;

  // Clamp
  score = Math.max(2.8, Math.min(4.8, score));
  score = Math.round(score * 10) / 10;

  return { score, ...labelsFor(score), source: "legacy" };
}

/**
 * Single entry point used by the page and JSON-LD: prefers the five-axis v2
 * rating once complete, otherwise falls back to the legacy heuristic.
 */
export function computeToolTrimScore(tool: any): ToolTrimScoreResult {
  return computeToolTrimScoreV2(tool?.toolTrimRating) ?? computeLegacyToolTrimScore(tool);
}

/** Render 5 star SVGs for a given score (supports half-star) */
export function starFill(i: number, score: number): string {
  if (i <= Math.floor(score)) return "hsl(var(--primary))";
  if (i === Math.ceil(score) && score % 1 >= 0.5) return "hsl(var(--primary) / 0.45)";
  return "hsl(var(--border))";
}
