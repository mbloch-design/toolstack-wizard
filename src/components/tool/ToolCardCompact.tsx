import { ArrowRight, Compass } from "lucide-react";
import { Link } from "react-router-dom";
import ToolLogo from "@/components/ToolLogo";
import { getToolPresentation } from "@/lib/toolPresentation";

interface ToolCardCompactTool {
  id: string;
  slug?: string;
  name?: string;
  shortDescription?: string;
  shortDescriptionEn?: string;
  defaultMonthlyPrice?: number;
  pricing?: { free?: string; paid?: string } | null;
  pricing_v5?: { compare_price_monthly_eur?: number | null } | null;
  logo?: string;
}

interface ToolCardCompactProps {
  tool: ToolCardCompactTool;
  prefix: string;
  lang: "fr" | "en";
  t: (fr: string, en: string) => string;
  exploreHref?: string;
  exploreState?: unknown;
}

/** Compact discovery row used when the image-led media card is too large. */
export function ToolCardCompact({
  tool,
  prefix,
  lang,
  t,
  exploreHref,
  exploreState,
}: ToolCardCompactProps) {
  const presentation = getToolPresentation(tool, lang);
  const { slug, name, description } = presentation;

  return (
    <article className="tcc-card">
      <Link
        to={`${prefix}/tool/${slug}`}
        className="tcc-primary-link"
        aria-label={t(`Voir la fiche de ${name}`, `View ${name}`)}
      />
      <ToolLogo tool={{ ...tool, name }} size={36} className="tcc-logo" />
      <div className="tcc-copy">
        <h3 className="tcc-name">{name}</h3>
        {description && <p className="tcc-description">{description}</p>}
      </div>
      {presentation.monthlyPrice > 0 && (
        <span className="tcc-price">{presentation.planLabel}</span>
      )}
      <ArrowRight className="tcc-arrow" size={15} aria-hidden />
      {exploreHref && (
        <Link
          to={exploreHref}
          state={exploreState}
          className="tcc-explore"
          aria-label={t(`Explorer autour de ${name}`, `Explore around ${name}`)}
          title={t("Explorer autour", "Explore around")}
        >
          <Compass size={16} aria-hidden />
        </Link>
      )}
    </article>
  );
}

export default ToolCardCompact;
