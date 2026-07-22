import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import PinToolButton from "@/components/PinToolButton";
import ToolCardImage from "@/components/tool/ToolCardImage";
import ToolLogo from "@/components/ToolLogo";
import { hasGenuineFreeTier, isFreemiumPricing } from "@/lib/pricing";
import type { Tool } from "@/data/types";

/* ─────────────────────────────────────────────────────────────────────────────
   ToolCardEditorial — main catalog grid card (ToolsPage).
   Kept deliberately minimal: at the browsing/discovery stage a visitor needs
   just enough to decide whether to click through, not the full fiche. Cover
   image, name, category, one line of "why", price, CTA.
───────────────────────────────────────────────────────────────────────────── */

export type ToolCardEditorialTool = Pick<
  Tool,
  | "id"
  | "name"
  | "categoryId"
  | "shortDescription"
  | "pricing"
  | "defaultMonthlyPrice"
  | "affiliateLink"
> & Partial<Pick<
  Tool,
  | "slug"
  | "shortDescriptionEn"
  | "websiteUrl"
  | "ogImageUrl"
  | "logo"
  | "pricing_v5"
  | "prescription_quality"
>>;

interface ToolCardEditorialProps {
  tool: ToolCardEditorialTool;
  prefix: string;
  t: (fr: string, en: string) => string;
  categoryLabel?: string;
  lang?: "fr" | "en";
  variant?: "default" | "compact";
  showPin?: boolean;
  to?: string;
  linkState?: unknown;
  selected?: boolean;
  showPrice?: boolean;
  typeLabel?: string;
  contextRole?: string;
  contextLabel?: string;
  exploreHref?: string;
  exploreState?: unknown;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function getPlanLabel(tool: ToolCardEditorialTool, lang: "fr" | "en"): string {
  if (isFreemiumPricing(tool.pricing)) return "Freemium";
  if (hasGenuineFreeTier(tool.pricing?.free)) return lang === "fr" ? "Gratuit" : "Free";
  if (tool.pricing_v5?.compare_price_monthly_eur) {
    const p = tool.pricing_v5.compare_price_monthly_eur;
    return lang === "fr" ? `${p} €/mois` : `€${p}/mo`;
  }
  if (tool.defaultMonthlyPrice > 0) {
    return lang === "fr" ? `${tool.defaultMonthlyPrice} €/mois` : `€${tool.defaultMonthlyPrice}/mo`;
  }
  return "N/A";
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function ToolCardEditorial({
  tool,
  prefix,
  t,
  categoryLabel,
  lang = "fr",
  variant = "default",
  showPin = true,
  to,
  linkState,
  selected = false,
  showPrice = true,
  typeLabel,
  contextRole,
  contextLabel,
  exploreHref,
  exploreState,
}: ToolCardEditorialProps) {
  const plan = getPlanLabel(tool, lang);
  const compact = variant === "compact";

  const description = t(
    tool.shortDescription,
    tool.shortDescriptionEn ?? tool.shortDescription,
  ) as string;

  const toolHref = to || `${prefix}/tool/${tool.slug ?? tool.id}`;

  /* Stack cards are interaction-heavy and intentionally remain compact.
     The catalog variant below adopts a media-card anatomy: thumbnail first,
     then logo + identity + contextual actions, like a useful editorial
     equivalent of a YouTube card. */
  if (compact) {
    return (
      <div className="tool-pin-wrap tool-pin-wrap--compact">
        {showPin && <PinToolButton slug={tool.slug ?? tool.id} label={tool.name} t={t} compact labelMode="short" />}
        <Link
          to={toolHref}
          state={linkState}
          className={`tce-card tce-card--compact${selected ? " is-selected" : ""}`}
          aria-current={selected ? "true" : undefined}
        >
          <ToolCardImage tool={tool} logoSize={36} />
          <div className="tce-body">
            <div className="tce-title-row">
              <h3 className="tce-name">{tool.name}</h3>
              {showPrice && <span className="tce-price">{plan}</span>}
            </div>
            {(typeLabel || categoryLabel) && <p className="tce-category">{typeLabel || categoryLabel}</p>}
            {description && <p className="tce-compact-description">{description}</p>}
            {contextRole && (
              <p className="tce-context-role">
                <span>{contextLabel || t("Sert à", "Used to")}</span>
                <strong>{contextRole}</strong>
              </p>
            )}
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="tool-pin-wrap">
      <article className={`tce-card tce-card--media${selected ? " is-selected" : ""}`}>
        <Link className="tce-cover-link" to={toolHref} state={linkState} aria-label={tool.name}>
          <ToolCardImage
            tool={tool}
            logoSize={44}
            overlayMode="static"
            overlay={(
              <div className="tce-cover-meta">
                {tool.prescription_quality === "ferme" && <span className="tce-cover-pick">ToolTrim Pick</span>}
                {showPrice && plan !== "N/A" && <span className="tce-cover-price">{plan}</span>}
              </div>
            )}
          />
        </Link>

        <div className="tce-body">
          <div className="tce-identity-row">
            <ToolLogo tool={tool} size={40} className="tce-logo" />
            <div className="tce-identity-copy">
              <Link className="tce-name-link" to={toolHref} state={linkState}>
                <h3 className="tce-name">{tool.name}</h3>
              </Link>
              {(typeLabel || categoryLabel) && <p className="tce-category">{typeLabel || categoryLabel}</p>}
            </div>
            <div className="tce-actions" aria-label={t(`Actions pour ${tool.name}`, `Actions for ${tool.name}`)}>
              {exploreHref && (
                <Link
                  to={exploreHref}
                  state={exploreState}
                  className="tce-card-action"
                  aria-label={t(`Explorer autour de ${tool.name}`, `Explore around ${tool.name}`)}
                  title={t("Explorer les outils associés", "Explore related tools")}
                >
                  <Compass size={17} aria-hidden />
                </Link>
              )}
              {showPin && <PinToolButton slug={tool.slug ?? tool.id} label={tool.name} t={t} compact inline labelMode="icon" />}
            </div>
          </div>
          {description && <p className="tce-summary">{description}</p>}
        </div>
      </article>
    </div>
  );
}

export default ToolCardEditorial;
