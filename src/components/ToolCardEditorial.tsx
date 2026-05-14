import { Link } from "react-router-dom";
import ToolLogo from "@/components/ToolLogo";
import type { Tool } from "@/data/types";

/* ─────────────────────────────────────────────────────────────────────────────
   ToolCardEditorial — benchmark editorial card
   Reference design for ToolTrim's curated tool entries.
   Uses Framer as the primary example / validation case.
   Once validated, will replace ToolCard "default" variant across all grids.
───────────────────────────────────────────────────────────────────────────── */

interface ToolCardEditorialProps {
  tool: Tool;
  prefix: string;
  t: (fr: string | React.ReactNode, en: string | React.ReactNode) => string | React.ReactNode;
  categoryLabel?: string;
  lang?: "fr" | "en";
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

/**
 * Derive a display score from prescription_quality.
 * ToolTrim has no stored numeric score — this maps editorial quality to a
 * legible number. Replace with a stored score field once one exists.
 */
function getScore(tool: Tool): string {
  const q = tool.prescription_quality;
  if (q === "ferme")    return "4.6";
  if (q === "question") return "3.8";
  if (q === "silence")  return "3.2";
  return "4.1"; // "oui" and any other value
}

/**
 * Extract the first sentence of the verdict threshold as a short score caption.
 * Truncates at 90 chars to stay single-line in most card widths.
 */
function getShortVerdict(text: string): string {
  const first = text.split(/(?<=[.!?])\s/)[0] ?? text;
  if (first.length <= 90) return first;
  return first.slice(0, 88) + "…";
}

function getPricingMeta(tool: Tool, lang: "fr" | "en") {
  const hasFree = !!(
    tool.pricing?.free &&
    !tool.pricing.free.toLowerCase().includes("no free") &&
    !tool.pricing.free.toLowerCase().includes("aucun") &&
    !tool.pricing.free.toLowerCase().includes("pas de")
  );
  const hasPaid = !!(tool.pricing?.paid);
  const isFreeOnly  = tool.defaultMonthlyPrice === 0 && !hasPaid;
  const isFreemium  = hasFree && hasPaid;

  // PLAN: cheapest entry point
  const plan = hasFree
    ? (lang === "fr" ? "Gratuit" : "Free")
    : tool.pricing_v5?.compare_price_monthly_eur
      ? `${lang === "fr" ? "" : "€"}${tool.pricing_v5.compare_price_monthly_eur}${lang === "fr" ? " €/mois" : "/mo"}`
      : tool.defaultMonthlyPrice > 0
        ? `${tool.defaultMonthlyPrice}${lang === "fr" ? " €/mois" : "€/mo"}`
        : (lang === "fr" ? "N/A" : "N/A");

  // MODÈLE: pricing structure
  const model = isFreeOnly  ? (lang === "fr" ? "Gratuit"     : "Free")
              : isFreemium  ? "Freemium"
              : (lang === "fr" ? "Abonnement" : "Subscription");

  return { plan, model };
}

const TYPE_LABELS: Record<string, { fr: string; en: string }> = {
  ia:        { fr: "IA",       en: "AI"     },
  metier:    { fr: "Métier",   en: "Tool"   },
  gestion:   { fr: "Gestion",  en: "Mgmt"  },
  plugin:    { fr: "Plugin",   en: "Plugin" },
  satellite: { fr: "Satellite",en: "Add-on" },
};

function getTypeLabel(tool: Tool, lang: "fr" | "en") {
  const entry = TYPE_LABELS[tool.tool_type];
  if (!entry) return tool.tool_type?.toUpperCase() ?? "OUTIL";
  return (lang === "en" ? entry.en : entry.fr).toUpperCase();
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function ToolCardEditorial({
  tool,
  prefix,
  t,
  categoryLabel,
  lang = "fr",
}: ToolCardEditorialProps) {
  const score        = getScore(tool);
  const isPick       = tool.prescription_quality === "ferme";
  const isAi         = tool.tool_type === "ia";
  const typeLabel    = getTypeLabel(tool, lang);
  const { plan, model } = getPricingMeta(tool, lang);

  const verdictFull  = lang === "en"
    ? (tool.verdictEn?.threshold ?? tool.verdict?.threshold ?? "")
    : (tool.verdict?.threshold ?? "");
  const shortVerdict = verdictFull ? getShortVerdict(verdictFull) : "";

  const description = t(
    tool.shortDescription,
    (tool as any).shortDescriptionEn ?? tool.shortDescription,
  ) as string;

  return (
    <Link
      to={`${prefix}/tool/${tool.slug ?? tool.id}`}
      className="tce-card"
    >
      {/* ── Top row: logo + type + pick ── */}
      <div className="tce-header">
        <div className="tce-logo">
          <ToolLogo tool={tool} size={28} />
        </div>
        <div className="tce-header-right">
          <span className="tce-type-label">{typeLabel}</span>
          {isPick && <span className="tce-pick-badge">Pick</span>}
        </div>
      </div>

      {/* ── Name + category + description ── */}
      <div className="tce-body">
        <h3 className="tce-name">{tool.name}</h3>
        {categoryLabel && (
          <p className="tce-category">{categoryLabel}</p>
        )}
        {description && (
          <p className="tce-description">{description}</p>
        )}
      </div>

      {/* ── Score block ── */}
      <div className="tce-score-block">
        <p className="tce-score-label">
          {t("TOOLTRIM SCORE", "TOOLTRIM SCORE")}
        </p>
        <div className="tce-score-row">
          <span className="tce-score-number">{score}</span>
          <span className="tce-score-denom">/5</span>
        </div>
        {shortVerdict && (
          <p className="tce-verdict">{shortVerdict}</p>
        )}
      </div>

      {/* ── Metadata ── */}
      <div className="tce-meta">
        <div className="tce-meta-item">
          <span className="tce-meta-label">{t("PLAN", "PLAN")}</span>
          <span className="tce-meta-value">{plan}</span>
        </div>
        <div className="tce-meta-item">
          <span className="tce-meta-label">{t("MODÈLE", "MODEL")}</span>
          <span className="tce-meta-value">{model}</span>
        </div>
        <div className="tce-meta-item">
          <span className="tce-meta-label">IA</span>
          <span className="tce-meta-value">
            {isAi ? t("Oui", "Yes") : t("Non", "No")}
          </span>
        </div>
      </div>

      {/* ── CTA ── */}
      <span className="tce-cta">
        {t("Voir l'outil", "View tool")}
        <span className="tce-cta-arrow" aria-hidden>→</span>
      </span>
    </Link>
  );
}

export default ToolCardEditorial;
