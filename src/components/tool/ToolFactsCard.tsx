import { Link } from "react-router-dom";
import type { Tool, Category } from "@/data/types";
import { ExternalLink } from "lucide-react";

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

/**
 * Structured facts card — stable key-value pairs for machine consumption.
 * Rendered as a <dl> for maximum semantic clarity.
 */
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

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-lg font-bold tracking-tighter">
        {t(`Fiche technique — ${tool.name}`, `${tool.name} — Key Facts`)}
      </h2>
      <dl className="mt-4 divide-y divide-border/50 text-sm">
        <Fact label={t("Nom", "Name")} value={tool.name} />
        <Fact label={t("Catégorie", "Category")}>
          {category ? (
            <Link to={`${prefix}/category/${category.slug}`} className="text-primary hover:underline">
              {categoryLabel}
            </Link>
          ) : "—"}
        </Fact>
        <Fact label={t("Prix de départ", "Starting price")} value={displayPrice === 0 ? t("Gratuit", "Free") : `${displayPrice}€/${t("mois", "mo")}`} />
        <Fact label={t("Modèle tarifaire", "Pricing model")} value={pricingModel} />
        <Fact label={t("Essai gratuit", "Free trial")} value={tool.pricing?.free ? t("Oui", "Yes") : t("Non", "No")} />
        <Fact label={t("Idéal pour", "Best for")} value={idealFor} />
        <Fact label={t("Cas à éviter", "When to avoid")} value={avoidText} />
        {alternatives.length > 0 && (
          <Fact label={t("Alternatives principales", "Main alternatives")}>
            {alternatives.slice(0, 4).map((alt, i) => (
              <span key={alt.id}>
                {i > 0 && ", "}
                <Link to={`${prefix}/tool/${alt.slug}`} className="text-primary hover:underline">{alt.name}</Link>
              </span>
            ))}
          </Fact>
        )}
        <Fact label={t("Dernière vérification du prix", "Price last verified")} value={verifiedOn} />
        <Fact label={t("Dernière mise à jour de la fiche", "Last updated")} value={verifiedOn} />
        {(tool.websiteUrl || tool.affiliateLink) && (
          <Fact label={t("Site officiel", "Official website")}>
            <a href={tool.websiteUrl || tool.affiliateLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline">
              {t("Visiter", "Visit")} <ExternalLink className="h-3 w-3" />
            </a>
          </Fact>
        )}
      </dl>
    </div>
  );
}

function Fact({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="font-medium text-right">{children || value || "—"}</dd>
    </div>
  );
}
