import { Link } from "react-router-dom";
import type { Tool, Category } from "@/data/types";
import { ExternalLink, Tag, DollarSign, Users, AlertTriangle, ArrowRightLeft, CalendarCheck, Globe } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import { getCategoryIcon } from "@/lib/categoryIcons";

interface Props {
  tool: Tool;
  category: Category | undefined;
  alternatives: Tool[];
  displayPrice: number;
  verifiedOn: string;
  lang: string;
  prefix: string;
  t: (fr: string, en: string) => string;
}

export default function ToolFactsCard({ tool, category, alternatives, displayPrice, verifiedOn, lang, prefix, t }: Props) {
  const categoryLabel = category
    ? t(category.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, ""), category.nameEn || category.name)
    : "—";

  const pricingModel = tool.pricing?.free && tool.pricing?.paid
    ? "Freemium"
    : tool.pricing?.free
    ? t("Gratuit", "Free")
    : t("Payant", "Paid");

  const idealFor = [
    tool.soloRelevance && t("Freelances", "Freelancers"),
    tool.teamRelevance && t("Équipes", "Teams"),
  ].filter(Boolean).join(", ") || t("Professionnels", "Professionals");

  const avoidText = tool.verdict?.avoidIf?.length
    ? (Array.isArray(tool.verdict.avoidIf) ? tool.verdict.avoidIf : [tool.verdict.avoidIf]).filter(Boolean)[0]
    : "—";

  const CategoryIcon = category ? getCategoryIcon(category.id || category.slug) : Tag;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header with logo */}
      <div className="flex items-center gap-4 p-5 pb-4 border-b border-border/50 bg-muted/30">
        <ToolLogo tool={tool} size={48} className="rounded-xl shadow-sm" />
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight truncate">{tool.name}</h2>
          {category && (
            <Link to={`${prefix}/category/${category.slug}`}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mt-0.5">
              <CategoryIcon className="h-3 w-3" />
              {categoryLabel}
            </Link>
          )}
        </div>
      </div>

      {/* Facts grid */}
      <dl className="divide-y divide-border/40 text-sm">
        <Fact icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} label={t("Prix de départ", "Starting price")}>
          <span className="font-semibold text-foreground">
            {displayPrice === 0 ? t("Gratuit", "Free") : `${Math.round(displayPrice)}€/${t("mois", "mo")}`}
          </span>
        </Fact>

        <Fact icon={<Tag className="h-4 w-4 text-muted-foreground" />} label={t("Modèle tarifaire", "Pricing model")}>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            pricingModel === "Freemium"
              ? "bg-optimize/10 text-optimize"
              : pricingModel === t("Gratuit", "Free")
              ? "bg-keep/10 text-keep"
              : "bg-muted text-muted-foreground"
          }`}>
            {pricingModel}
          </span>
        </Fact>

        <Fact icon={<Users className="h-4 w-4 text-muted-foreground" />} label={t("Idéal pour", "Best for")}>
          <span className="font-medium">{idealFor}</span>
        </Fact>

        <Fact icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />} label={t("À éviter si", "Avoid if")}>
          <span className="text-muted-foreground">{avoidText}</span>
        </Fact>

        {alternatives.length > 0 && (
          <div className="px-5 py-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
              <dt className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {t("Alternatives", "Alternatives")}
              </dt>
            </div>
            <dd className="flex flex-wrap gap-2">
              {alternatives.slice(0, 4).map((alt) => (
                <Link key={alt.id} to={`${prefix}/tool/${alt.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs font-medium hover:border-primary/30 hover:bg-primary/5 transition-all">
                  <ToolLogo tool={alt} size={16} className="rounded" />
                  {alt.name}
                </Link>
              ))}
            </dd>
          </div>
        )}

        <Fact icon={<CalendarCheck className="h-4 w-4 text-muted-foreground" />} label={t("Prix vérifié le", "Price verified")}>
          <time dateTime={verifiedOn} className="text-muted-foreground tabular-nums">{verifiedOn}</time>
        </Fact>

        {(tool.websiteUrl || tool.affiliateLink) && (
          <div className="px-5 py-3.5">
            <a href={tool.websiteUrl || tool.affiliateLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary/10 text-primary font-medium text-sm py-2.5 hover:bg-primary/20 transition-colors">
              <Globe className="h-4 w-4" />
              {t("Voir le site officiel", "Visit official website")}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </dl>
    </div>
  );
}

function Fact({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      {icon}
      <dt className="text-xs text-muted-foreground font-medium flex-1 min-w-0">{label}</dt>
      <dd className="text-right shrink-0">{children}</dd>
    </div>
  );
}
