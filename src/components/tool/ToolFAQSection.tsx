import FaqBlock from "@/components/FaqBlock";
import type { Tool } from "@/data/types";
import { DollarSign, GitCompare, Lightbulb, ShieldCheck, Users } from "lucide-react";

interface Props {
  tool: Tool;
  displayPrice: number;
  verifiedOn: string;
  alternatives: Tool[];
  lang: string;
  t: (fr: string, en: string) => string;
}

/**
 * FAQ section rendered as open <details> elements for accessibility + SEO.
 * Content is always visible in HTML (not hidden behind JS).
 */
export default function ToolFAQSection({ tool, displayPrice, verifiedOn, alternatives, lang, t }: Props) {
  const freeAlts = alternatives.filter(a => a.defaultMonthlyPrice === 0).slice(0, 3);
  const topAlts = alternatives.slice(0, 5).map(a => a.name).join(", ");

  const faqs: { q: string; a: string }[] = [
    {
      q: t(`À quoi sert ${tool.name} ?`, `What is ${tool.name} used for?`),
      a: (lang === "en" && tool.shortDescriptionEn ? tool.shortDescriptionEn : tool.shortDescription) ||
         t(`${tool.name} est un outil de productivité SaaS.`, `${tool.name} is a SaaS productivity tool.`),
    },
    {
      q: t(`Combien coûte ${tool.name} ?`, `How much does ${tool.name} cost?`),
      a: t(
        `${tool.name} coûte ${displayPrice === 0 ? "0€ (gratuit)" : `${displayPrice}€/mois`}${tool.pricing_v5?.compare_plan_name ? ` (plan ${tool.pricing_v5.compare_plan_name})` : ""}. Prix vérifié le ${verifiedOn}.`,
        `${tool.name} costs ${displayPrice === 0 ? "€0 (free)" : `€${displayPrice}/month`}${tool.pricing_v5?.compare_plan_name ? ` (${tool.pricing_v5.compare_plan_name} plan)` : ""}. Price verified on ${verifiedOn}.`
      ),
    },
    {
      q: t(`${tool.name} est-il adapté aux débutants ?`, `Is ${tool.name} suitable for beginners?`),
      a: tool.soloRelevance
        ? t(
            `${tool.name} est particulièrement adapté aux freelances et indépendants. ${tool.soloRelevance}`,
            `${tool.name} is particularly suited for freelancers and solopreneurs. ${tool.soloRelevance}`
          )
        : t(
            `${tool.name} convient à la plupart des professionnels. Consultez la section "Pour qui" pour plus de détails.`,
            `${tool.name} suits most professionals. See the "Who is it for" section for details.`
          ),
    },
    {
      q: t(`${tool.name} vaut-il son prix ?`, `Is ${tool.name} worth the price?`),
      a: ((lang === "en" && tool.verdictEn?.threshold) ? tool.verdictEn.threshold : tool.verdict?.threshold) || t(
        `Cela dépend de votre usage. Consultez notre verdict ci-dessus.`,
        `It depends on your usage. See our verdict above.`
      ),
    },
    {
      q: t(`Quelles sont les meilleures alternatives à ${tool.name} ?`, `What are the best alternatives to ${tool.name}?`),
      a: topAlts
        ? t(
            `Les principales alternatives à ${tool.name} sont : ${topAlts}.${freeAlts.length > 0 ? ` Alternatives gratuites : ${freeAlts.map(a => a.name).join(", ")}.` : ""}`,
            `The main alternatives to ${tool.name} are: ${topAlts}.${freeAlts.length > 0 ? ` Free alternatives: ${freeAlts.map(a => a.name).join(", ")}.` : ""}`
          )
        : t("Aucune alternative directe référencée.", "No direct alternative listed."),
    },
  ];

  // Add conditional FAQ about free alternative
  if (tool.freeAlternative) {
    faqs.push({
      q: t(`Existe-t-il une alternative gratuite à ${tool.name} ?`, `Is there a free alternative to ${tool.name}?`),
      a: t(
        `Oui, ${tool.freeAlternative} est une alternative gratuite à ${tool.name}.`,
        `Yes, ${tool.freeAlternative} is a free alternative to ${tool.name}.`
      ),
    });
  }

  return (
    <section>
      <FaqBlock
        size="compact"
        eyebrow={t("FAQ outil", "Tool FAQ")}
        title={t(`Questions fréquentes sur ${tool.name}`, `Frequently asked questions about ${tool.name}`)}
        description={t(
          "Prix, usage, alternatives et contexte : les réponses utiles avant d'ajouter un outil de plus à ta stack.",
          "Pricing, usage, alternatives, and context: useful answers before adding one more tool to your stack."
        )}
        items={faqs.map((faq, index) => ({
          question: faq.q,
          answer: faq.a,
          icon: [Lightbulb, DollarSign, Users, ShieldCheck, GitCompare][index] || ShieldCheck,
        }))}
        openCount={2}
      />
    </section>
  );
}
