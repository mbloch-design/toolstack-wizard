import { useCallback, useEffect, useRef, useState } from "react";
import type { Tool } from "@/data/types";
import { CarouselControls } from "@/components/CarouselControls";
import { Link } from "@/lib/routerLinks";
import ToolLogo from "@/components/ToolLogo";
import { getToolPresentation } from "@/lib/toolPresentation";
import { computeToolTrimScore } from "@/lib/toolTrimScore";
import { hasGenuineFreeTier } from "@/lib/pricing";
import { formatToolPrice } from "@/lib/currencyRates";
import { trackEvent } from "@/lib/analytics";

interface Props {
  tool: Tool;
  alternatives: Tool[];
  prefix: string;
  lang: string;
  t: (fr: string, en: string) => string;
  includeCurrent?: boolean;
}

export default function ToolComparisonTable({ tool, alternatives, prefix, lang, t, includeCurrent = false }: Props) {
  // The reader is already on this tool's page: by default only the
  // alternatives are shown, each as a decision card (score, entry price, role).
  const rows = includeCurrent ? [tool, ...alternatives.slice(0, 5)] : alternatives.slice(0, 6);
  const railRef = useRef<HTMLDivElement>(null);
  const stopsRef = useRef<number[]>([0]);
  const [activeIndex, setActiveIndex] = useState(0);
  // Pages are groups of cards that fit one viewport width, not one dot per
  // card — with 4-5 cards and 2-3 visible at once, a dot per card wildly
  // overcounts how many times you'd actually need to scroll. Each page's
  // target is a real card's offsetLeft (a valid scroll-snap stop): with
  // scroll-snap-type: mandatory, an arbitrary computed offset gets silently
  // rejected/reverted by the browser because it isn't a snap point.
  const [pageCount, setPageCount] = useState(1);

  const updateFromScroll = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const cards = Array.from(rail.querySelectorAll<HTMLElement>(".td-compare-card"));
    if (!cards.length) return;
    const stops = [cards[0].offsetLeft];
    for (const card of cards) {
      const end = card.offsetLeft + card.offsetWidth;
      if (end - stops[stops.length - 1] > rail.clientWidth) {
        stops.push(card.offsetLeft);
      }
    }
    stopsRef.current = stops;
    setPageCount(stops.length);
    const nearest = stops.reduce((best, stop, i) =>
      Math.abs(stop - rail.scrollLeft) < Math.abs(stops[best] - rail.scrollLeft) ? i : best, 0);
    setActiveIndex(nearest);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    updateFromScroll();
    rail.addEventListener("scroll", updateFromScroll, { passive: true });
    window.addEventListener("resize", updateFromScroll);
    return () => {
      rail.removeEventListener("scroll", updateFromScroll);
      window.removeEventListener("resize", updateFromScroll);
    };
  }, [updateFromScroll]);

  if (rows.length < 1) return null;

  const goTo = (index: number) => {
    const rail = railRef.current;
    const stops = stopsRef.current;
    const clamped = Math.max(0, Math.min(stops.length - 1, index));
    if (!rail) return;
    rail.scrollTo({ left: stops[clamped], behavior: "smooth" });
    setActiveIndex(clamped);
  };

  const fr = lang !== "en";
  return (
    <div className="td-compare">
      <div
        className="td-compare-grid"
        ref={railRef}
        role="region"
        aria-roledescription={t("carrousel", "carousel")}
        aria-label={t("Alternatives à comparer", "Alternatives to compare")}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") { event.preventDefault(); goTo(activeIndex - 1); }
          if (event.key === "ArrowRight") { event.preventDefault(); goTo(activeIndex + 1); }
        }}
      >
        {rows.map((row) => {
          const presentation = getToolPresentation(row, fr ? "fr" : "en");
          const score = computeToolTrimScore(row);
          const scoreLabel = fr ? score.labelFr : score.labelEn;
          // A comparable price line: "Free, then from X/mo" rather than a bare "Freemium".
          const free = hasGenuineFreeTier(row.pricing?.free);
          const oneTime = row.pricing_v5?.compare_plan_kind === "one_time";
          const paid = !oneTime && presentation.monthlyPrice > 0
            ? `${formatToolPrice(row, presentation.monthlyPrice, fr ? "EUR" : "USD", fr ? "fr" : "en").text}/${fr ? "mois" : "mo"}`
            : null;
          const priceLine = oneTime
            ? presentation.planLabel
            : free && paid ? t(`Gratuit, puis dès ${paid}`, `Free, then from ${paid}`)
            : free ? t("Gratuit", "Free")
            : paid ? t(`Dès ${paid}`, `From ${paid}`)
            : null;
          return (
            <Link
              key={row.id}
              to={`${prefix}/tool/${row.slug ?? row.id}`}
              className="td-compare-card td-alt-card"
              onClick={() => trackEvent("alternative_click", { tool_slug: tool.slug || tool.id, to_slug: row.slug || row.id, source: "alternatives_cards" })}
            >
              <span className="td-alt-card-head">
                <ToolLogo tool={row} size={40} className="td-alt-card-logo" />
                <span className="td-alt-card-name">{row.name}</span>
              </span>
              <span className="td-alt-card-facts">
                {score.score > 0 && <span><strong>{fr ? score.score.toFixed(1).replace(".", ",") : score.score.toFixed(1)}</strong>/5 · {scoreLabel}</span>}
                {priceLine && <span>{priceLine}</span>}
              </span>
              {presentation.description && <span className="td-alt-card-desc">{presentation.description}</span>}
            </Link>
          );
        })}
      </div>
      <div className="td-compare-controls">
        <CarouselControls
          onPrevious={() => goTo(activeIndex - 1)}
          onNext={() => goTo(activeIndex + 1)}
          previousDisabled={activeIndex === 0}
          nextDisabled={activeIndex === pageCount - 1}
          previousLabel={t("Alternatives précédentes", "Previous alternatives")}
          nextLabel={t("Alternatives suivantes", "Next alternatives")}
        />
      </div>
    </div>
  );
}
