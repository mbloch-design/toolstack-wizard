import { Link } from "react-router-dom";
import type { Tool, Category } from "@/data/types";
import { stripLeadingEmoji } from "@/lib/text";
import { formatPriceLabel } from "@/lib/toolUtils";
import { useCurrency } from "@/hooks/useCurrency";

// Cache-bust marker (2026-06-24): forcing this module's content hash to
// change after a build showed seo.idealForFr correct in the embedded
// __SSR_TOOL__ JSON but rendered as the generic fallback in the visible
// markup, despite a fresh local rebuild of the same data being correct.
// Suspected stale build-cache artifact specific to the deploy pipeline.

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
  const { currency } = useCurrency();
  const categoryLabel = category
    ? t(
        stripLeadingEmoji(category.name, category.id).toLowerCase(),
        stripLeadingEmoji(category.nameEn, stripLeadingEmoji(category.name, category.id)).toLowerCase()
      )
    : t("productivité", "productivity");

  const idealForOverride = lang === "en" ? tool.seo?.idealForEn : tool.seo?.idealForFr;
  const idealFor = idealForOverride
    ? idealForOverride
    : tool.soloRelevance === "high" && tool.teamRelevance !== "high"
    ? t("freelances et indépendants", "freelancers and solopreneurs")
    : tool.teamRelevance === "high"
    ? t("équipes et startups", "teams and startups")
    : tool.soloRelevance === "high"
    ? t("freelances et indépendants", "freelancers and solopreneurs")
    : t("professionnels", "professionals");

  const avoidIfRaw = lang === "en" ? tool.verdictEn?.avoidIf : tool.verdict?.avoidIf;
  const avoidCases = avoidIfRaw?.length
    ? (Array.isArray(avoidIfRaw) ? avoidIfRaw : [avoidIfRaw]).filter(Boolean).slice(0, 2).join("; ")
    : null;

  const topAlts = alternatives.slice(0, 4).map(a => a.name).join(", ");

  const fullVerdictText = lang === "en"
    ? (tool.verdictEn?.threshold || tool.shortDescriptionEn || "")
    : (tool.verdict?.threshold || tool.shortDescription || "");
  // First sentence only when it's the full multi-sentence threshold — this
  // row sits right after "Décision rapide" already showed it in full, a
  // few screens up at most. Site-wide, all 1109 tools.
  const verdictText = fullVerdictText.split(/(?<=[.!?])\s+/)[0] || fullVerdictText;

  // This block restates category/price/idealFor/avoidIf/alternatives/
  // verdict — all of which the page already says, in more detail, in
  // dedicated sections just before or after it. Useful as a single
  // consolidated block for LLM extraction and SEO snippets (its original
  // purpose), but reading it as a normal visible section means a human
  // hits the same facts a second time right where they just read them.
  // Keep the structured recap in the document for extraction without adding
  // a sixth, repetitive information surface to the human reading path.
  return (
    <section
      className="sr-only"
      itemScope
      itemType="https://schema.org/SoftwareApplication"
    >
      <h2>{t(`Résumé de ${tool.name}`, `${tool.name} Summary`)}</h2>
      <meta itemProp="name" content={tool.name} />
      <meta itemProp="applicationCategory" content="BusinessApplication" />
      <meta itemProp="operatingSystem" content="Web" />

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
            {formatPriceLabel(tool, displayPrice, t, currency, lang)}
            {tool.pricing_v5?.compare_plan_name && ` (${tool.pricing_v5.compare_plan_name})`}.
          </dd>
        </div>

        <div className="td-synth-row">
          <dt className="td-synth-dt">{t("Idéal pour", "Best for")}</dt>
          <dd className="td-synth-dd">{idealFor}{idealForOverride ? "" : "."}</dd>
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
