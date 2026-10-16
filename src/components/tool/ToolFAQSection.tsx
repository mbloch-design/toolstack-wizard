import type { Tool } from "@/data/types";
import { buildToolFaqs } from "@/lib/toolFaq";

interface Props {
  tool: Tool;
  displayPrice: number;
  verifiedOn: string | null;
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
      <header className="td-faq-heading">
        <h2 className="td-title">{t("Questions fréquentes.", "Frequently asked questions.")} <span className="tt-title-muted">{t(`Ce qu’on nous demande sur ${tool.name}.`, `What people ask about ${tool.name}.`)}</span></h2>
      </header>
      <div className="td-faq-list">
        {faqs.map((faq, index) => (
          <details key={faq.q} open={index < 2}>
            <summary>{faq.q}</summary>
            <p>{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
