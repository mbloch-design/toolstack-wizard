import type { PricingDetail } from "@/lib/toolPricingDetail";

interface AnswerProps {
  detail: PricingDetail;
}

/** One sentence that answers « how much does X cost », above the plan cards. */
export function ToolPricingAnswer({ detail }: AnswerProps) {
  return <p className="td-pricing-answer">{detail.answer}</p>;
}

interface DetailProps {
  detail: PricingDetail;
  toolName: string;
  t: (fr: string, en: string) => string;
}

/**
 * What only the pricing sub-page carries: a per-seat cost example and a
 * pricing FAQ, both derived from the verified plan grid (src/lib/toolPricingDetail.ts).
 * The FAQ matches the FAQPage JSON-LD emitted by the prerender for this page.
 */
export function ToolPricingExtras({ detail, toolName, t }: DetailProps) {
  return (
    <>
      {detail.seatCosts.length > 0 && (
        <section className="td-seat-costs" aria-labelledby="td-seat-costs-title">
          <h3 id="td-seat-costs-title" className="td-subtitle">
            {t(`Combien pour une équipe ?`, `What does a team pay?`)}
          </h3>
          <table className="td-seat-table">
            <caption>
              {t(
                `Offre ${detail.seatPlanName}, calculé à partir du prix publié par l’éditeur, hors taxes.`,
                `${detail.seatPlanName} plan, calculated from the vendor’s published price, before tax.`,
              )}
            </caption>
            <thead>
              <tr>
                <th scope="col">{t("Utilisateurs", "Users")}</th>
                <th scope="col">{t("Par mois", "Per month")}</th>
                {detail.seatCosts.some((row) => row.yearly) && <th scope="col">{t("Par an", "Per year")}</th>}
              </tr>
            </thead>
            <tbody>
              {detail.seatCosts.map((row) => (
                <tr key={row.seats}>
                  <th scope="row">{row.seats}</th>
                  <td>{row.monthly}</td>
                  {row.yearly && <td>{row.yearly}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      <section className="td-pricing-faq" aria-labelledby="td-pricing-faq-title">
        <h3 id="td-pricing-faq-title" className="td-subtitle">
          {t(`Prix de ${toolName} : questions fréquentes`, `${toolName} pricing: common questions`)}
        </h3>
        <div className="td-faq-list">
          {detail.faq.map((item, index) => (
            <details key={item.q} open={index < 2}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
