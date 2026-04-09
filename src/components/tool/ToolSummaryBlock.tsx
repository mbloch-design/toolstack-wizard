import { Link } from "react-router-dom";
import type { Tool, Category } from "@/data/types";

interface Props {
  tool: Tool;
  category: Category | undefined;
  alternatives: Tool[];
  displayPrice: number;
  lang: string;
  prefix: string;
  t: (fr: string, en: string) => string;
}

/**
 * Machine-readable summary block — plain HTML text, no interactive elements.
 * Designed for LLM extraction, RAG retrieval, and SEO snippet generation.
 */
export default function ToolSummaryBlock({ tool, category, alternatives, displayPrice, lang, prefix, t }: Props) {
  const categoryLabel = category
    ? t(
        category.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "").toLowerCase(),
        (category.nameEn || category.name).toLowerCase()
      )
    : t("productivité", "productivity");

  const idealFor = tool.soloRelevance
    ? t("freelances et indépendants", "freelancers and solopreneurs")
    : tool.teamRelevance
    ? t("équipes et startups", "teams and startups")
    : t("professionnels", "professionals");

  const avoidCases = tool.verdict?.avoidIf?.length
    ? (Array.isArray(tool.verdict.avoidIf) ? tool.verdict.avoidIf : [tool.verdict.avoidIf]).filter(Boolean).slice(0, 2).join("; ")
    : null;

  const topAlts = alternatives.slice(0, 4).map(a => a.name).join(", ");

  const verdictText = (lang === "en" && tool.verdictEn?.threshold) ? tool.verdictEn.threshold : (tool.verdict?.threshold || (lang === "en" && tool.shortDescriptionEn ? tool.shortDescriptionEn : tool.shortDescription) || "");

  return (
    <section
      aria-label={t("Résumé", "Summary")}
      className="rounded-xl border border-border bg-secondary/20 p-5"
      itemScope
      itemType="https://schema.org/SoftwareApplication"
    >
      <h2 className="sr-only">{t(`Résumé de ${tool.name}`, `${tool.name} Summary`)}</h2>
      <meta itemProp="name" content={tool.name} />
      <meta itemProp="applicationCategory" content="BusinessApplication" />
      <meta itemProp="operatingSystem" content="Web" />

      <dl className="space-y-2 text-sm leading-relaxed">
        <div className="flex flex-wrap gap-x-1">
          <dt className="font-semibold text-foreground">{tool.name}</dt>
          <dd className="text-muted-foreground">
            {t(`est un outil de ${categoryLabel}.`, `is a ${categoryLabel} tool.`)}
          </dd>
        </div>

        <div className="flex flex-wrap gap-x-1">
          <dt className="font-semibold text-foreground">{t("Prix à partir de", "Price from")}</dt>
          <dd className="text-muted-foreground">
            {displayPrice === 0
              ? t("gratuit", "free")
              : `${displayPrice}€/${t("mois", "mo")}`}
            {tool.pricing_v5?.compare_plan_name && ` (${tool.pricing_v5.compare_plan_name})`}.
          </dd>
        </div>

        <div className="flex flex-wrap gap-x-1">
          <dt className="font-semibold text-foreground">{t("Idéal pour", "Best for")}</dt>
          <dd className="text-muted-foreground">{idealFor}.</dd>
        </div>

        {avoidCases && (
          <div className="flex flex-wrap gap-x-1">
            <dt className="font-semibold text-foreground">{t("À éviter si", "Avoid if")}</dt>
            <dd className="text-muted-foreground">{avoidCases}.</dd>
          </div>
        )}

        {topAlts && (
          <div className="flex flex-wrap gap-x-1">
            <dt className="font-semibold text-foreground">{t("Alternatives fréquentes", "Common alternatives")}</dt>
            <dd className="text-muted-foreground">
              {alternatives.slice(0, 4).map((alt, i) => (
                <span key={alt.id}>
                  {i > 0 && ", "}
                  <Link to={`${prefix}/tool/${alt.slug}`} className="text-primary hover:underline">{alt.name}</Link>
                </span>
              ))}.
            </dd>
          </div>
        )}

        <div className="flex flex-wrap gap-x-1">
          <dt className="font-semibold text-foreground">{t("Verdict ToolTrim", "ToolTrim Verdict")}</dt>
          <dd className="text-muted-foreground">{verdictText}</dd>
        </div>
      </dl>
    </section>
  );
}
