import type { Tool } from "@/data/types";
import { resolveMonthlyPrice } from "@/lib/pricing";
import { CheckCircle2, CircleAlert } from "lucide-react";

interface Props {
  tool: Tool;
  lang: string;
  t: (fr: string, en: string) => string;
  keepText?: string;
  challengeText?: string;
}

/**
 * Twin "profitable if / too expensive if" card grid. Distinct from the
 * "Décision rapide" keepIf/avoidIf block above it on the page — concrete
 * usage thresholds rather than the short quick-decision reasoning, so the
 * page doesn't repeat the same argument twice.
 *
 * Uses verdict.profitableIf/tooExpensiveIf when curated (Asana-style,
 * feature-fit specific). When absent, auto-generates a usage-frequency /
 * cost-vs-time angle from defaultMonthlyPrice + betterAlternative/
 * freeAlternative - deliberately a different axis from keepIf/avoidIf
 * (which is about feature fit), so the auto-generated fallback doesn't
 * duplicate "Décision rapide" either. Renders for any priced tool;
 * returns null only for free tools with nothing to compare against.
 */
export default function ToolProfitabilityBlock({ tool, lang, t, keepText, challengeText }: Props) {
  const verdict = lang === "en" && tool.verdictEn ? tool.verdictEn : tool.verdict;
  const curatedProfitable = verdict?.profitableIf;
  const curatedTooExpensive = verdict?.tooExpensiveIf;

  const price = resolveMonthlyPrice(tool);
  const ba = (tool as any).betterAlternative;
  const altReason = lang === "en"
    ? (ba?.performanceGainEn || ba?.reasonEn || ba?.performanceGain || ba?.reason)
    : (ba?.performanceGain || ba?.reason);
  const freeAlt = tool.freeAlternative;

  const profitableIf = curatedProfitable?.length
    ? curatedProfitable
    : price > 0
    ? [
        t("Tu l'utilises au moins une fois par semaine", "You use it at least once a week"),
        t(`Le coût mensuel (${Math.round(price)}€) reste minime comparé au temps que ça te fait gagner`, `The monthly cost (€${Math.round(price)}) is small next to the time it saves you`),
      ]
    : undefined;

  const tooExpensiveIf = curatedTooExpensive?.length
    ? curatedTooExpensive
    : price > 0
    ? [
        t("Tu l'utilises moins d'une fois par mois", "You use it less than once a month"),
        altReason
          ? t(`Une alternative moins chère couvre déjà l'essentiel : ${altReason}`, `A cheaper alternative already covers the essentials: ${altReason}`)
          : freeAlt
          ? t(`${freeAlt} (gratuit) couvre déjà l'essentiel pour un usage occasionnel`, `${freeAlt} (free) already covers the essentials for occasional use`)
          : t("Une simple version gratuite ou un outil déjà dans ta stack ferait l'affaire", "A simple free version or a tool already in your stack would do"),
      ]
    : undefined;

  if (!keepText && !challengeText && !profitableIf?.length && !tooExpensiveIf?.length) return null;

  const twoCols = Boolean((keepText || profitableIf?.length) && (challengeText || tooExpensiveIf?.length));

  return (
    <section className="td-profitability">
      <div className={twoCols ? "td-profit-grid td-profit-grid--two" : "td-profit-grid"}>
      {(keepText || profitableIf?.length) ? (
        <div className="td-profit-card td-profit-card--positive">
          <div className="td-profit-card-head"><CheckCircle2 aria-hidden /><p>{t("À garder si", "Keep if")}</p></div>
          {keepText && <p className="td-profit-fit">{keepText}</p>}
          {profitableIf?.length ? <div className="td-profit-threshold">
            <span>{t(`${tool.name} devient rentable quand`, `${tool.name} becomes worthwhile when`)}</span>
            <ul className="td-judgment">
            {profitableIf.map((item) => (
              <li key={item} className="td-judgment-item td-judgment-item--pro">
                <span className="td-judgment-marker td-judgment-marker--pro" aria-hidden="true">+</span>
                <span className="td-judgment-text">{item}</span>
              </li>
            ))}
            </ul>
          </div> : null}
        </div>
      ) : null}
      {(challengeText || tooExpensiveIf?.length) ? (
        <div className="td-profit-card td-profit-card--negative">
          <div className="td-profit-card-head"><CircleAlert aria-hidden /><p>{t("À challenger si", "Challenge if")}</p></div>
          {challengeText && <p className="td-profit-fit">{challengeText}</p>}
          {tooExpensiveIf?.length ? <div className="td-profit-threshold">
            <span>{t(`${tool.name} devient trop cher quand`, `${tool.name} becomes too expensive when`)}</span>
            <ul className="td-judgment">
            {tooExpensiveIf.map((item) => (
              <li key={item} className="td-judgment-item td-judgment-item--con">
                <span className="td-judgment-marker td-judgment-marker--con" aria-hidden="true">−</span>
                <span className="td-judgment-text">{item}</span>
              </li>
            ))}
            </ul>
          </div> : null}
        </div>
      ) : null}
      </div>
    </section>
  );
}
