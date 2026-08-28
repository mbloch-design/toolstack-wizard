import { useCallback, useEffect, useRef, useState } from "react";
import type { Tool } from "@/data/types";
import { CarouselControls, CarouselPagination } from "@/components/CarouselControls";
import ToolCardEditorial from "@/components/ToolCardEditorial";

interface Props {
  tool: Tool;
  alternatives: Tool[];
  prefix: string;
  lang: string;
  t: (fr: string, en: string) => string;
  includeCurrent?: boolean;
}

export default function ToolComparisonTable({ tool, alternatives, prefix, lang, t, includeCurrent = true }: Props) {
  // Product pages compare the current tool with alternatives. Editorial
  // comparisons reuse the same module but only display the alternatives.
  const rows = includeCurrent ? [tool, ...alternatives.slice(0, 4)] : alternatives.slice(0, 4);
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

  if (rows.length < 2) return null;

  const goTo = (index: number) => {
    const rail = railRef.current;
    const stops = stopsRef.current;
    const clamped = Math.max(0, Math.min(stops.length - 1, index));
    if (!rail) return;
    rail.scrollTo({ left: stops[clamped], behavior: "smooth" });
    setActiveIndex(clamped);
  };

  return (
    <div className="td-compare">
      <div className="td-compare-controls">
        <CarouselControls
          onPrevious={() => goTo(activeIndex - 1)}
          onNext={() => goTo(activeIndex + 1)}
          previousDisabled={activeIndex === 0}
          nextDisabled={activeIndex === pageCount - 1}
          previousLabel={t("Alternative précédente", "Previous alternative")}
          nextLabel={t("Alternative suivante", "Next alternative")}
        />
      </div>
      <div
        className="td-compare-grid"
        ref={railRef}
        role="region"
        aria-roledescription={t("carrousel", "carousel")}
        aria-label={t("Alternatives à comparer", "Alternatives to compare")}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            goTo(activeIndex - 1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            goTo(activeIndex + 1);
          }
        }}
      >
        {rows.map((row, idx) => {
          const isCurrentTool = includeCurrent && idx === 0;
          return (
            <div key={row.id} className={`td-compare-card${isCurrentTool ? " td-compare-card--current" : ""}`}>
              {isCurrentTool && (
                <span className="td-compare-current-badge">{t("Actuel", "Current")}</span>
              )}
              <ToolCardEditorial
                tool={row}
                prefix={prefix}
                t={t}
                lang={lang === "en" ? "en" : "fr"}
                variant="media"
                showPin={false}
                showPrice
              />
            </div>
          );
        })}
      </div>

      <CarouselPagination
        current={activeIndex}
        total={pageCount}
        onChange={goTo}
        label={t("Choisir une page", "Choose a page")}
        pageLabel={(index) => t(`Aller à la page ${index + 1}`, `Go to page ${index + 1}`)}
      />

    </div>
  );
}
