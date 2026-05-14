import { Link } from "react-router-dom";
import ToolLogo from "@/components/ToolLogo";
import type { Tool } from "@/data/types";

/* ─────────────────────────────────────────────────────────────────────────────
   ToolCard — editorial directory card system
   3 variants:
     "default"   — compact grid card (ToolsPage, CategoryPage grid)
     "featured"  — highlighted card (Editor's picks, homepage)
     "list-row"  — horizontal ranking row (CategoryPage list, rankings)
───────────────────────────────────────────────────────────────────────────── */

interface ToolCardProps {
  tool: Tool;
  prefix: string;
  t: (fr: string | React.ReactNode, en: string | React.ReactNode) => string | React.ReactNode;
  variant?: "default" | "featured" | "list-row";
  categoryLabel?: string;
  rank?: number;               // list-row only
  lang?: "fr" | "en";
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function getPriceInfo(tool: Tool): { label: string; labelEn: string } {
  const hasFree = !!(tool.pricing?.free
    && !tool.pricing.free.toLowerCase().includes("no free")
    && !tool.pricing.free.toLowerCase().includes("aucun")
    && !tool.pricing.free.toLowerCase().includes("pas de"));
  const hasPaid = !!(tool.pricing?.paid);
  const isFree     = tool.defaultMonthlyPrice === 0 && !hasPaid;
  const isFreemium = hasFree && hasPaid;

  if (isFree)      return { label: "Gratuit", labelEn: "Free" };
  if (isFreemium)  return { label: "Freemium", labelEn: "Freemium" };
  if (tool.pricing_v5?.compare_price_monthly_eur) {
    const p = tool.pricing_v5.compare_price_monthly_eur;
    return { label: `${p}€/mois`, labelEn: `€${p}/mo` };
  }
  if (tool.defaultMonthlyPrice > 0) {
    return { label: `${tool.defaultMonthlyPrice}€/mois`, labelEn: `€${tool.defaultMonthlyPrice}/mo` };
  }
  return { label: "N/A", labelEn: "N/A" };
}

const TYPE_LABELS: Record<string, { fr: string; en: string }> = {
  ia:        { fr: "IA",       en: "AI"      },
  metier:    { fr: "Métier",   en: "Core"    },
  gestion:   { fr: "Gestion",  en: "Mgmt"   },
  plugin:    { fr: "Plugin",   en: "Plugin"  },
  satellite: { fr: "Satellite",en: "Satellite"},
};

function getTypeLabel(tool: Tool, lang = "fr") {
  const entry = TYPE_LABELS[tool.tool_type];
  if (!entry) return tool.tool_type ?? "Outil";
  return lang === "en" ? entry.en : entry.fr;
}

function isFeaturedTool(tool: Tool) {
  return tool.prescription_quality === "ferme";
}

/* ── Default Card ─────────────────────────────────────────────────────────── */

function DefaultCard({ tool, prefix, t, categoryLabel, lang = "fr" }: Omit<ToolCardProps, "variant" | "rank">) {
  const featured = isFeaturedTool(tool);
  const price    = getPriceInfo(tool);
  const typeLabel = getTypeLabel(tool, lang);
  const isIa = tool.tool_type === "ia";
  const description = t(tool.shortDescription, (tool as any).shortDescriptionEn || tool.shortDescription) as string;
  const verdictText = tool.verdict?.threshold;

  // Max 3 badges: price type, tool type if IA, pick if featured
  const badges: { label: string; cls: string }[] = [];
  if (price.label !== "N/A") {
    badges.push({ label: lang === "en" ? price.labelEn : price.label, cls: "tc-badge" });
  }
  if (isIa) {
    badges.push({ label: "IA", cls: "tc-badge tc-badge--ia" });
  }
  if (featured) {
    badges.push({ label: lang === "en" ? "ToolTrim Pick" : "ToolTrim Pick", cls: "tc-badge tc-badge--pick" });
  }

  return (
    <Link
      to={`${prefix}/tool/${tool.slug || tool.id}`}
      className={`tc-card${featured ? " tc-card--featured" : ""}`}
    >
      {/* Header: logo + type label */}
      <div className="tc-card-header">
        <div className="tc-logo">
          <ToolLogo tool={tool} size={44} />
        </div>
        <span className="tc-type-label">{typeLabel.toUpperCase()}</span>
      </div>

      {/* Body */}
      <div className="tc-card-body">
        <h3 className="tc-name">{tool.name}</h3>
        {categoryLabel && <p className="tc-category">{categoryLabel}</p>}
        {description && <p className="tc-description">{description}</p>}
        {verdictText && <p className="tc-verdict">{verdictText}</p>}
      </div>

      {/* Footer */}
      <div className="tc-card-footer">
        {/* Metadata */}
        <div className="tc-meta">
          <div className="tc-meta-item">
            <span className="tc-meta-label">PLAN</span>
            <span className="tc-meta-value">{lang === "en" ? price.labelEn : price.label}</span>
          </div>
          <div className="tc-meta-item">
            <span className="tc-meta-label">TYPE</span>
            <span className="tc-meta-value">{typeLabel}</span>
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="tc-badges">
            {badges.map(b => (
              <span key={b.label} className={b.cls}>{b.label}</span>
            ))}
          </div>
        )}

        {/* CTA */}
        <span className="tc-cta">
          {t("Voir l'outil", "View tool")} <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}

/* ── Featured Card (larger, stronger CTA) ───────────────────────────────── */

function FeaturedCard({ tool, prefix, t, categoryLabel, lang = "fr" }: Omit<ToolCardProps, "variant" | "rank">) {
  const price    = getPriceInfo(tool);
  const typeLabel = getTypeLabel(tool, lang);
  const isIa = tool.tool_type === "ia";
  const description = t(tool.shortDescription, (tool as any).shortDescriptionEn || tool.shortDescription) as string;
  const verdictText = tool.verdict?.threshold;

  return (
    <Link
      to={`${prefix}/tool/${tool.slug || tool.id}`}
      className="tc-card tc-card--featured"
    >
      {/* Header */}
      <div className="tc-card-header">
        <div className="tc-logo tc-logo--lg">
          <ToolLogo tool={tool} size={56} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <span className="tc-type-label">{typeLabel.toUpperCase()}</span>
          <span className="tc-badge tc-badge--pick">ToolTrim Pick</span>
        </div>
      </div>

      {/* Body */}
      <div className="tc-card-body">
        <h3 className="tc-name">{tool.name}</h3>
        {categoryLabel && <p className="tc-category">{categoryLabel}</p>}
        {description && (
          <p className="tc-description" style={{ marginTop: 20, WebkitLineClamp: 3 }}>
            {description}
          </p>
        )}
        {verdictText && <p className="tc-verdict">{verdictText}</p>}
      </div>

      {/* Footer */}
      <div className="tc-card-footer">
        <div className="tc-meta">
          <div className="tc-meta-item">
            <span className="tc-meta-label">PLAN</span>
            <span className="tc-meta-value">{lang === "en" ? price.labelEn : price.label}</span>
          </div>
          {isIa && (
            <div className="tc-meta-item">
              <span className="tc-meta-label">TYPE</span>
              <span className="tc-meta-value" style={{ color: "hsl(var(--primary))" }}>IA</span>
            </div>
          )}
        </div>

        <span className="tc-cta-btn">
          {t("Voir l'outil", "View tool")} <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}

/* ── List Row (rankings) ─────────────────────────────────────────────────── */

function ListRow({ tool, prefix, t, categoryLabel, rank, lang = "fr" }: Omit<ToolCardProps, "variant">) {
  const featured = isFeaturedTool(tool);
  const price    = getPriceInfo(tool);
  const isIa     = tool.tool_type === "ia";
  const verdictText = tool.verdict?.threshold;
  const description = t(tool.shortDescription, (tool as any).shortDescriptionEn || tool.shortDescription) as string;

  return (
    <Link
      to={`${prefix}/tool/${tool.slug || tool.id}`}
      className="tc-list-row"
    >
      {/* Rank */}
      {rank !== undefined && (
        <span className="tc-list-rank">{rank}</span>
      )}

      {/* Logo */}
      <div className="tc-logo" style={{ flexShrink: 0 }}>
        <ToolLogo tool={tool} size={44} />
      </div>

      {/* Name + category */}
      <div className="tc-list-info" style={{ minWidth: 140, maxWidth: 200 }}>
        <span className="tc-list-name">{tool.name}</span>
        {categoryLabel && <span className="tc-list-category">{categoryLabel}</span>}
      </div>

      {/* Verdict / description */}
      <span className="tc-list-verdict" style={{ flex: 2 }}>
        {verdictText || description}
      </span>

      {/* Right: badges + price + cta */}
      <div className="tc-list-right">
        {isIa && (
          <span className="tc-badge tc-badge--ia">IA</span>
        )}
        {featured && (
          <span className="tc-badge tc-badge--pick">Pick</span>
        )}
        <span className="tc-meta-value" style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", minWidth: 60, textAlign: "right" }}>
          {lang === "en" ? price.labelEn : price.label}
        </span>
        <span className="tc-list-cta">
          {t("Voir", "View")} <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}

/* ── Export ──────────────────────────────────────────────────────────────── */

export function ToolCard({ variant = "default", ...props }: ToolCardProps) {
  if (variant === "featured") return <FeaturedCard {...props} />;
  if (variant === "list-row") return <ListRow {...props} />;
  return <DefaultCard {...props} />;
}

export default ToolCard;
