import { Link } from "react-router-dom";
import PinToolButton from "@/components/PinToolButton";
import ToolCardImage from "@/components/tool/ToolCardImage";
import { hasGenuineFreeTier } from "@/lib/pricing";
import type { Tool } from "@/data/types";

/* ─────────────────────────────────────────────────────────────────────────────
   ToolCardEditorial — main catalog grid card (ToolsPage).
   Kept deliberately minimal: at the browsing/discovery stage a visitor needs
   just enough to decide whether to click through, not the full fiche. Cover
   image, name, category, one line of "why", price, CTA.
───────────────────────────────────────────────────────────────────────────── */

interface ToolCardEditorialProps {
  tool: Tool;
  prefix: string;
  t: (fr: string, en: string) => string;
  categoryLabel?: string;
  lang?: "fr" | "en";
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function getPlanLabel(tool: Tool, lang: "fr" | "en"): string {
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
}: ToolCardEditorialProps) {
  const plan = getPlanLabel(tool, lang);

  const description = t(
    tool.shortDescription,
    (tool as any).shortDescriptionEn ?? tool.shortDescription,
  ) as string;

  return (
    <div className="tool-pin-wrap">
      <PinToolButton slug={tool.slug ?? tool.id} label={tool.name} t={t} compact labelMode="short" />
      <Link
        to={`${prefix}/tool/${tool.slug ?? tool.id}`}
        className="tce-card"
      >
      {/* Cover: OG image, falls back to centered logo. Description + CTA
          live in the image overlay (hidden at rest, revealed on hover/focus
          via .tce-card:hover/:focus-visible) so hover-only info never
          changes the card's own height. */}
      <ToolCardImage
        tool={tool}
        logoSize={36}
        overlay={
          <>
            {description && <p className="tce-description">{description}</p>}
            <span className="tce-cta">
              {t("Voir l'outil", "View tool")}
              <span className="tce-cta-arrow" aria-hidden>→</span>
            </span>
          </>
        }
      />

      {/* ── Name + price (same line) + category ── */}
      <div className="tce-body">
        <div className="tce-title-row">
          <h3 className="tce-name">{tool.name}</h3>
          <span className="tce-price">{plan}</span>
        </div>
        {categoryLabel && (
          <p className="tce-category">{categoryLabel}</p>
        )}
      </div>
      </Link>
    </div>
  );
}

export default ToolCardEditorial;
