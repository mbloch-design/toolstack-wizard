import FaqBlock from "@/components/FaqBlock";
import type { Tool } from "@/data/types";
import { DollarSign, GitCompare, Lightbulb, ShieldCheck, Users } from "lucide-react";
import { buildToolFaqs } from "@/lib/toolFaq";

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
 * Content is always visible in HTML (not hidden behind JS). Questions/
 * answers come from buildToolFaqs, the single source also used by the
 * FAQPage JSON-LD (ToolJsonLd) so the two can never drift out of sync.
 */
export default function ToolFAQSection({ tool, displayPrice, verifiedOn, alternatives, lang, t }: Props) {
  const faqs = buildToolFaqs(tool, lang, displayPrice, verifiedOn, alternatives);

  return (
    <section className="td-tool-faq">
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
