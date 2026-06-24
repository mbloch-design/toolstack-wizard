import type { Tool } from "@/data/types";

interface Props {
  tool: Tool;
  lang: string;
  t: (fr: string, en: string) => string;
}

/**
 * Twin "profitable if / too expensive if" card grid. Distinct from the
 * "Décision rapide" keepIf/avoidIf block above it on the page — concrete
 * usage thresholds rather than the short quick-decision reasoning, so the
 * page doesn't repeat the same argument twice. Returns null (renders
 * nothing) when the tool has no profitableIf/tooExpensiveIf data, so it's
 * silently absent on every tool besides the ones it's written for.
 */
export default function ToolProfitabilityBlock({ tool, lang, t }: Props) {
  const verdict = lang === "en" && tool.verdictEn ? tool.verdictEn : tool.verdict;
  const profitableIf = verdict?.profitableIf;
  const tooExpensiveIf = verdict?.tooExpensiveIf;
  if (!profitableIf?.length && !tooExpensiveIf?.length) return null;

  const twoCols = !!profitableIf?.length && !!tooExpensiveIf?.length;

  return (
    <div
      className={twoCols ? "td-profit-grid td-profit-grid--two" : "td-profit-grid"}
      style={{ gap: 24 }}
    >
      {profitableIf?.length ? (
        <div style={{ border: "1px solid var(--color-border)", borderRadius: 12, padding: 24 }}>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-text-strong)", marginBottom: 14 }}>
            {t(`${tool.name} est rentable si…`, `${tool.name} is worth it if…`)}
          </p>
          <ul className="td-judgment">
            {profitableIf.map((item) => (
              <li key={item} className="td-judgment-item td-judgment-item--pro">
                <span className="td-judgment-marker td-judgment-marker--pro" aria-hidden="true">+</span>
                <span className="td-judgment-text">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {tooExpensiveIf?.length ? (
        <div style={{ border: "1px solid var(--color-border)", borderRadius: 12, padding: 24 }}>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 14 }}>
            {t(`${tool.name} est probablement trop cher si…`, `${tool.name} is probably too expensive if…`)}
          </p>
          <ul className="td-judgment">
            {tooExpensiveIf.map((item) => (
              <li key={item} className="td-judgment-item td-judgment-item--con">
                <span className="td-judgment-marker td-judgment-marker--con" aria-hidden="true">−</span>
                <span className="td-judgment-text">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
