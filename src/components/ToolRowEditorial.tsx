import { Link } from "react-router-dom";
import ToolLogo from "@/components/ToolLogo";
import { hasGenuineFreeTier, isFreemiumPricing } from "@/lib/pricing";
import type { Tool } from "@/data/types";

/* ─────────────────────────────────────────────────────────────────────────────
   ToolRowEditorial — editorial list row for category rankings and alternatives.
   Uses tcr-* CSS. Replaces ToolCard "list-row" variant across listing pages.
───────────────────────────────────────────────────────────────────────────── */

interface ToolRowEditorialProps {
  tool: Tool;
  prefix: string;
  t: (fr: string, en: string) => string;
  rank?: number;
  categoryLabel?: string;
  lang?: "fr" | "en";
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function getScore(tool: Tool): string {
  const q = tool.prescription_quality;
  if (q === "ferme")    return "4.6";
  if (q === "question") return "3.8";
  if (q === "silence")  return "3.2";
  return "4.1";
}

function getPriceLabel(tool: Tool, lang: "fr" | "en"): string {
  if (isFreemiumPricing(tool.pricing)) return "Freemium";
  if (hasGenuineFreeTier(tool.pricing?.free)) return lang === "fr" ? "Gratuit" : "Free";
  if (tool.pricing_v5?.compare_price_monthly_eur) {
    const p = tool.pricing_v5.compare_price_monthly_eur;
    return `${lang === "fr" ? "" : "€"}${p}${lang === "fr" ? " €/mois" : "/mo"}`;
  }
  if (tool.defaultMonthlyPrice > 0) {
    return `${tool.defaultMonthlyPrice}${lang === "fr" ? " €/mois" : "€/mo"}`;
  }
  return "N/A";
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function ToolRowEditorial({
  tool,
  prefix,
  t,
  rank,
  categoryLabel,
  lang = "fr",
}: ToolRowEditorialProps) {
  const score  = getScore(tool);
  const price  = getPriceLabel(tool, lang);
  const isPick = tool.prescription_quality === "ferme";

  const description = t(
    tool.shortDescription,
    (tool as any).shortDescriptionEn ?? tool.shortDescription,
  ) as string;

  // Prefer a short verdict threshold; fall back to description
  const verdictRaw = tool.verdict?.threshold ?? "";
  const excerpt = verdictRaw
    ? (verdictRaw.length > 110 ? verdictRaw.slice(0, 108) + "…" : verdictRaw)
    : description;

  return (
    <Link to={`${prefix}/tool/${tool.slug ?? tool.id}`} className="tcr-row">

      {/* Rank */}
      {rank !== undefined && (
        <span className="tcr-rank">{rank}</span>
      )}

      {/* Logo */}
      <div className="tcr-logo">
        <ToolLogo tool={tool} size={24} />
      </div>

      {/* Content */}
      <div className="tcr-content">
        <p className="tcr-name">
          {tool.name}
          {isPick && <span className="tcr-pick">Pick</span>}
        </p>
        {categoryLabel && <p className="tcr-category">{categoryLabel}</p>}
        {excerpt && <p className="tcr-excerpt">{excerpt}</p>}
      </div>

      {/* Right section */}
      <div className="tcr-right">
        <span className="tcr-score">
          {score}<span className="tcr-score-denom"> /5</span>
        </span>
        <span className="tcr-price">{price}</span>
        <span className="tcr-cta">
          {t("Voir", "View")}
          <span className="tcr-cta-arrow" aria-hidden>→</span>
        </span>
      </div>

    </Link>
  );
}

export default ToolRowEditorial;
