import type { Tool } from "@/data/types";

export interface ToolFaqEntry {
  q: string;
  a: string;
}

/**
 * Single source of truth for the tool-page FAQ: same 6 questions/answers,
 * same order, used by both the rendered FAQ (ToolFAQSection) and the
 * FAQPage JSON-LD (ToolJsonLd). Previously duplicated verbatim in both
 * files — any edit to one and not the other would mismatch Google's
 * FAQPage rich-result requirement that schema match visible content.
 */
export function buildToolFaqs(
  tool: Tool,
  lang: string,
  displayPrice: number,
  verifiedOn: string,
  alternatives: Tool[]
): ToolFaqEntry[] {
  const isFr = lang !== "en";
  const freeAlts = alternatives.filter((a) => a.defaultMonthlyPrice === 0).slice(0, 3);
  const topAlts = alternatives.slice(0, 5).map((a) => a.name).join(", ");
  const plan = tool.pricing_v5?.compare_plan_name
    ? isFr ? ` (plan ${tool.pricing_v5.compare_plan_name})` : ` (${tool.pricing_v5.compare_plan_name} plan)`
    : "";

  const faqs: ToolFaqEntry[] = [
    {
      q: isFr ? `À quoi sert ${tool.name} ?` : `What is ${tool.name} used for?`,
      a: (lang === "en" && (tool as any).shortDescriptionEn ? (tool as any).shortDescriptionEn : tool.shortDescription) ||
        (isFr ? `${tool.name} est un outil de productivité SaaS.` : `${tool.name} is a SaaS productivity tool.`),
    },
    {
      q: isFr ? `Combien coûte ${tool.name} ?` : `How much does ${tool.name} cost?`,
      a: isFr
        ? `${tool.name} coûte ${displayPrice === 0 ? "0€ (gratuit)" : `${displayPrice}€/mois`}${plan}. Prix vérifié le ${verifiedOn}.`
        : `${tool.name} costs ${displayPrice === 0 ? "€0 (free)" : `€${displayPrice}/month`}${plan}. Price verified on ${verifiedOn}.`,
    },
    {
      q: isFr ? `${tool.name} est-il adapté aux débutants ?` : `Is ${tool.name} suitable for beginners?`,
      a: (() => {
        if (tool.soloRelevance === "high") {
          return isFr
            ? `${tool.name} est particulièrement adapté aux freelances et indépendants.`
            : `${tool.name} is particularly suited for freelancers and solopreneurs.`;
        }
        if (tool.teamRelevance === "high" && tool.soloRelevance !== "high") {
          return isFr
            ? `${tool.name} est avant tout pensé pour les équipes plutôt que pour un usage en solo.`
            : `${tool.name} is built mainly for teams rather than solo use.`;
        }
        return isFr
          ? `${tool.name} convient à la plupart des professionnels. Consultez la section "Pour qui" pour plus de détails.`
          : `${tool.name} suits most professionals. See the "Who is it for" section for details.`;
      })(),
    },
    {
      q: isFr ? `${tool.name} vaut-il son prix ?` : `Is ${tool.name} worth the price?`,
      // Optional per-tool override so this FAQ answer isn't a verbatim
      // repeat of the verdict text already shown higher on the page
      // (hero, "Décision rapide"). Falls back to threshold for every tool
      // without one, so this stays additive, not a behavior change.
      a: ((lang === "en" && (tool.verdictEn as any)?.faqPriceAnswer) ? (tool.verdictEn as any).faqPriceAnswer : (tool.verdict as any)?.faqPriceAnswer) ||
        ((lang === "en" && tool.verdictEn?.threshold) ? tool.verdictEn.threshold : tool.verdict?.threshold) ||
        (isFr ? "Cela dépend de votre usage. Consultez notre verdict ci-dessus." : "It depends on your usage. See our verdict above."),
    },
    {
      q: isFr ? `Quelles sont les meilleures alternatives à ${tool.name} ?` : `What are the best alternatives to ${tool.name}?`,
      a: topAlts
        ? (isFr
          ? `Les principales alternatives à ${tool.name} sont : ${topAlts}.${freeAlts.length > 0 ? ` Alternatives gratuites : ${freeAlts.map((a) => a.name).join(", ")}.` : ""}`
          : `The main alternatives to ${tool.name} are: ${topAlts}.${freeAlts.length > 0 ? ` Free alternatives: ${freeAlts.map((a) => a.name).join(", ")}.` : ""}`)
        : (isFr ? "Aucune alternative directe référencée." : "No direct alternative listed."),
    },
  ];

  if (tool.freeAlternative) {
    faqs.push({
      q: isFr ? `Existe-t-il une alternative gratuite à ${tool.name} ?` : `Is there a free alternative to ${tool.name}?`,
      a: isFr
        ? `Oui, ${tool.freeAlternative} est une alternative gratuite à ${tool.name}.`
        : `Yes, ${tool.freeAlternative} is a free alternative to ${tool.name}.`,
    });
  }

  return faqs;
}
