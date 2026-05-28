import { Link } from "react-router-dom";
import type { Tool, Category } from "@/data/types";
import { stripLeadingEmoji } from "@/lib/text";

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
        stripLeadingEmoji(category.name, category.id).toLowerCase(),
        stripLeadingEmoji(category.nameEn, stripLeadingEmoji(category.name, category.id)).toLowerCase()
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
      className="td-synthesis"
      itemScope
      itemType="https://schema.org/SoftwareApplication"
    >
      <h2 className="sr-only">{t(`Résumé de ${tool.name}`, `${tool.name} Summary`)}</h2>
      <meta itemProp="name" content={tool.name} />
      <meta itemProp="applicationCategory" content="BusinessApplication" />
      <meta itemProp="operatingSystem" content="Web" />

      <span className="td-synth-eyebrow">{t("En bref", "In short")}</span>

      <dl className="td-synth-dl">
        <div className="td-synth-row">
          <dt className="td-synth-dt">{t("Catégorie", "Category")}</dt>
          <dd className="td-synth-dd">
            {t(`Outil de ${categoryLabel}.`, `${categoryLabel} tool.`)}
          </dd>
        </div>

        <div className="td-synth-row">
          <dt className="td-synth-dt">{t("Prix à partir de", "Price from")}</dt>
          <dd className="td-synth-dd">
            {displayPrice === 0
              ? t("Gratuit", "Free")
              : `${displayPrice}€/${t("mois", "mo")}`}
            {tool.pricing_v5?.compare_plan_name && ` (${tool.pricing_v5.compare_plan_name})`}.
          </dd>
        </div>

        <div className="td-synth-row">
          <dt className="td-synth-dt">{t("Idéal pour", "Best for")}</dt>
          <dd className="td-synth-dd">{idealFor}.</dd>
        </div>

        {avoidCases && (
          <div className="td-synth-row">
            <dt className="td-synth-dt">{t("À éviter si", "Avoid if")}</dt>
            <dd className="td-synth-dd">{avoidCases}.</dd>
          </div>
        )}

        {topAlts && (
          <div className="td-synth-row">
            <dt className="td-synth-dt">{t("Alternatives", "Alternatives")}</dt>
            <dd className="td-synth-dd">
              {alternatives.slice(0, 4).map((alt, i) => (
                <span key={alt.id}>
                  {i > 0 && ", "}
                  <Link to={`${prefix}/tool/${alt.slug}`} className="td-synth-link">{alt.name}</Link>
                </span>
              ))}.
            </dd>
          </div>
        )}

        <div className="td-synth-row">
          <dt className="td-synth-dt">{t("Verdict ToolTrim", "ToolTrim verdict")}</dt>
          <dd className="td-synth-dd">{verdictText}</dd>
        </div>
      </dl>
    </section>
  );
}
