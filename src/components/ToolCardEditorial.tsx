import { Link } from "react-router-dom";
import PinToolButton from "@/components/PinToolButton";
import ToolCardImage from "@/components/tool/ToolCardImage";
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
  const hasFree = !!(
    tool.pricing?.free &&
    !tool.pricing.free.toLowerCase().includes("no free") &&
    !tool.pricing.free.toLowerCase().includes("aucun") &&
    !tool.pricing.free.toLowerCase().includes("pas de")
  );
  if (hasFree) return lang === "fr" ? "Gratuit" : "Free";
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
      {/* Cover: OG image, falls back to centered logo */}
      <ToolCardImage tool={tool} logoSize={36} />

      {/* ── Name + price (same line) + category ── */}
      <div className="tce-body">
        <div className="tce-title-row">
          <h3 className="tce-name">{tool.name}</h3>
          <span className="tce-price">{plan}</span>
        </div>
        {categoryLabel && (
          <p className="tce-category">{categoryLabel}</p>
        )}
        {/* Description: hidden at rest, revealed on hover/focus — keeps the
            base card short while the "why" is still one hover away. */}
        {description && (
          <p className="tce-description">{description}</p>
        )}
      </div>

      {/* ── Footer: CTA only — price moved up next to the title ── */}
      <div className="tce-footer">
        <span className="tce-cta">
          {t("Voir l'outil", "View tool")}
          <span className="tce-cta-arrow" aria-hidden>→</span>
        </span>
      </div>
      </Link>
    </div>
  );
}

export default ToolCardEditorial;
