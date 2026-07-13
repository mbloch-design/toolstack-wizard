import { Link } from "react-router-dom";
import PinToolButton from "@/components/PinToolButton";
import ToolCardImage from "@/components/tool/ToolCardImage";
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
}: ToolCardEditorialProps) {
  const plan = getPlanLabel(tool, lang);
  const compact = variant === "compact";

  const description = t(
    tool.shortDescription,
    tool.shortDescriptionEn ?? tool.shortDescription,
  ) as string;

  return (
    <div className={`tool-pin-wrap${compact ? " tool-pin-wrap--compact" : ""}`}>
      {showPin && <PinToolButton slug={tool.slug ?? tool.id} label={tool.name} t={t} compact labelMode="short" />}
      <Link
        to={to || `${prefix}/tool/${tool.slug ?? tool.id}`}
        state={linkState}
        className={`tce-card${compact ? " tce-card--compact" : ""}${selected ? " is-selected" : ""}`}
        aria-current={selected ? "true" : undefined}
      >
      {/* Cover: OG image, falls back to centered logo. Description + CTA
          live in the image overlay (hidden at rest, revealed on hover/focus
          via .tce-card:hover/:focus-visible) so hover-only info never
          changes the card's own height. */}
      <ToolCardImage
        tool={tool}
        logoSize={36}
        overlay={compact ? undefined : (
          <>
            {description && <p className="tce-description">{description}</p>}
            <span className="tce-cta">
              {t("Voir l'outil", "View tool")}
              <span className="tce-cta-arrow" aria-hidden>→</span>
            </span>
          </>
        )}
      />

      {/* ── Name + price (same line) + category ── */}
      <div className="tce-body">
        <div className="tce-title-row">
          <h3 className="tce-name">{tool.name}</h3>
          {showPrice && <span className="tce-price">{plan}</span>}
        </div>
        {(typeLabel || categoryLabel) && (
          <p className="tce-category">{typeLabel || categoryLabel}</p>
        )}
        {compact && description && <p className="tce-compact-description">{description}</p>}
        {compact && contextRole && (
          <p className="tce-context-role">
            <span>{t("Sert à", "Used to")}</span>
            <strong>{contextRole}</strong>
          </p>
        )}
      </div>
      </Link>
    </div>
  );
}

export default ToolCardEditorial;
