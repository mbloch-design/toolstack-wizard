import type { Tool } from "@/data/types";
import { resolveMonthlyPrice } from "@/lib/pricing";
import { useEffect, useRef, useState } from "react";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrencyAmount } from "@/lib/currency";
import { resolveDisplayPrice } from "@/lib/nativePricing";

interface Props {
  tool: Tool;
  lang: string;
  t: (fr: string, en: string) => string;
  keepItems?: string[];
  challengeItems?: string[];
  pros?: string[];
  cons?: string[];
}

// Curated reasons are stored as sentences ("You want X.", "Y.;") and used to
// be glued with ". ", which printed "X.. Y". One clean sentence per line.
function cleanReason(text: string) {
  const trimmed = text.trim().replace(/[\s.;,:]+$/u, "");
  if (!trimmed) return "";
  return /[?!]$/u.test(trimmed) ? trimmed : `${trimmed}.`;
}

/** One marker system for the whole page: a check for what argues for the tool, a dash
 *  against. Drawn inline (pathLength 1) so the reveal can trace the stroke. */
function Marker({ tone }: { tone: "pro" | "con" }) {
  return tone === "pro"
    ? <span className="td-judgment-marker td-judgment-marker--pro" aria-hidden="true">
        <svg viewBox="0 0 16 16" fill="none"><path d="M3.2 8.6 6.4 11.6 12.8 4.6" pathLength={1} /></svg>
      </span>
    : <span className="td-judgment-marker td-judgment-marker--con" aria-hidden="true">
        <svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10" pathLength={1} /></svg>
      </span>;
}

function ReasonList({ items, tone }: { items: string[]; tone: "pro" | "con" }) {
  return (
    <ul className="td-judgment td-profit-fit">
      {items.map((item) => (
        <li key={item} className={`td-judgment-item td-judgment-item--${tone}`}>
          <Marker tone={tone} />
          <span className="td-judgment-text">{item}</span>
        </li>
      ))}
    </ul>
  );
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
/** Break-even, live: the minutes a month the tool must save to pay for itself at
 *  the reader's own hourly value. Plain arithmetic on the displayed price. */
function BreakEven({ amount, priceLabel, currencyLabel, toolName, t }: { amount: number; priceLabel: string; currencyLabel: string; toolName: string; t: Props["t"] }) {
  const [rate, setRate] = useState(40);
  const minutes = Math.max(1, Math.round((amount / rate) * 60));
  const time = minutes < 60
    ? `${minutes} min`
    : `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${String(minutes % 60).padStart(2, "0")}` : ""}`;
  return (
    <div className="td-breakeven">
      <p className="td-procon-threshold-label">{t("Rentable dès", "Pays off from")}</p>
      {/* Read in thinking order: the answer, its unit, then why (both figures follow the slider). */}
      <p className="td-breakeven-hero">
        <strong className="td-breakeven-value" key={time}>{time}</strong>
        <span>{t("gagnées par mois", "saved a month")}</span>
      </p>
      <p className="td-breakeven-line">
        {t(`${toolName} coûte ${priceLabel}/mois. Si ton heure vaut ${rate} ${currencyLabel}, ces ${time} suffisent à le rembourser.`,
           `${toolName} costs ${priceLabel}/month. If your hour is worth ${currencyLabel}${rate}, those ${time} cover it.`)}
      </p>
      <label className="td-breakeven-control">
        <span>{t("Ton heure vaut", "Your hour is worth")}</span>
        <input type="range" min={10} max={150} step={5} value={rate} onChange={(event) => setRate(Number(event.target.value))} />
        <output>{t(`${rate} ${currencyLabel}/h`, `${currencyLabel}${rate}/h`)}</output>
      </label>
    </div>
  );
}

/** The markers trace in sequence, once, when the sheet first comes into view. */
function ProconSheet({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  // "static" is the prerendered state: everything visible. Only a sheet that is
  // still below the fold gets "armed" (hidden, waiting to animate); anything
  // already on screen, or without IntersectionObserver, stays as rendered.
  const [phase, setPhase] = useState<"static" | "armed" | "in">("static");
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    if (node.getBoundingClientRect().top < window.innerHeight) return;
    setPhase("armed");
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setPhase("in"); observer.disconnect(); }
    }, { threshold: 0, rootMargin: "0px 0px -15% 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`td-procon-sheet${phase === "static" ? "" : ` is-${phase}`}`}>
      <div className="td-procon">{children}</div>
    </div>
  );
}

export default function ToolProfitabilityBlock({ tool, lang, t, keepItems = [], challengeItems = [], pros = [], cons = [] }: Props) {
  const keepReasons = keepItems.map(cleanReason).filter(Boolean);
  const challengeReasons = challengeItems.map(cleanReason).filter(Boolean);
  const { currency } = useCurrency();
  const verdict = lang === "en" ? tool.verdictEn : tool.verdict;
  const curatedProfitable = verdict?.profitableIf;
  const curatedTooExpensive = verdict?.tooExpensiveIf;

  const price = resolveMonthlyPrice(tool);
  const resolvedPrice = resolveDisplayPrice(tool, price, currency);
  const displayPrice = `${resolvedPrice.converted ? "≈ " : ""}${formatCurrencyAmount(resolvedPrice.amount, resolvedPrice.nativePrice ? resolvedPrice.currency : currency, lang)}`;
  const ba = (tool as any).betterAlternative;
  const altReason = lang === "en"
    ? (ba?.performanceGainEn || ba?.reasonEn)
    : (ba?.performanceGain || ba?.reason);
  const freeAlt = tool.freeAlternative;

  const profitableIf = curatedProfitable?.length
    ? curatedProfitable
    : price > 0
    ? [
        t("Tu l'utilises au moins une fois par semaine", "You use it at least once a week"),
        t(
          `Le coût mensuel (${displayPrice}) reste minime comparé au temps que ça te fait gagner`,
          `The monthly cost (${displayPrice}) is small next to the time it saves you`,
        ),
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

  const forItems = [...pros, ...keepReasons];
  const againstItems = [...cons, ...challengeReasons];
  if (!forItems.length && !againstItems.length && !profitableIf?.length && !tooExpensiveIf?.length) return null;

  // One open two-column sheet: what argues for the tool, what argues against,
  // each closed by the usage threshold where it pays off or costs too much.
  const breakEven = price > 0 && resolvedPrice.amount > 0 ? (
    <BreakEven
      amount={resolvedPrice.amount}
      priceLabel={displayPrice}
      currencyLabel={formatCurrencyAmount(0, resolvedPrice.nativePrice ? resolvedPrice.currency : currency, lang).replace(/[\d\s.,]/g, "")}
      toolName={tool.name}
      t={t}
    />
  ) : null;

  const column = (tone: "pro" | "con", title: string, subtitle: string, items: string[], thresholdLabel: string, threshold?: string[]) =>
    (items.length || threshold?.length || (tone === "pro" && breakEven)) ? (
      <div className={`td-procon-col td-procon-col--${tone}`}>
        <h3 className="td-procon-title">{title} <span className="tt-title-muted">{subtitle}</span></h3>
        {items.length > 0 && <ReasonList items={items} tone={tone} />}
        {tone === "pro" && breakEven ? breakEven : threshold?.length ? (
          <div className="td-procon-threshold">
            <p className="td-procon-threshold-label">{thresholdLabel}</p>
            <ReasonList items={threshold} tone={tone} />
          </div>
        ) : null}
      </div>
    ) : null;

  return (
    <ProconSheet>
      {column("pro", t("Pour.", "For."), t("Ce qui joue en sa faveur.", "What works in its favour."), forItems, t("Rentable si", "Worth it if"), profitableIf)}
      {column("con", t("Contre.", "Against."), t("Ce qu’il faut anticiper.", "What to plan for."), againstItems, t("Trop cher si", "Too expensive if"), tooExpensiveIf)}
    </ProconSheet>
  );
}
