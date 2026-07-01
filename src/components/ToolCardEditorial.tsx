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
  const isPick = tool.prescription_quality === "ferme";
  const plan   = getPlanLabel(tool, lang);

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

      {/* ── Name + category + description ── */}
      <div className="tce-body">
        {isPick && <span className="tce-pick-badge">Pick</span>}
        <h3 className="tce-name">{tool.name}</h3>
        {categoryLabel && (
          <p className="tce-category">{categoryLabel}</p>
        )}
        {description && (
          <p className="tce-description">{description}</p>
        )}
      </div>

      {/* ── Footer: price + CTA ── */}
      <div className="tce-footer">
        <span className="tce-price">{plan}</span>
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
