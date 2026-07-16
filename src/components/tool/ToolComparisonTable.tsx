import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Tool } from "@/data/types";
import ToolLogo from "@/components/ToolLogo";
import { ArrowRight, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { computeToolTrimScore, starFill } from "@/lib/toolTrimScore";
import { hasGenuineFreeTier } from "@/lib/pricing";

interface Props {
  tool: Tool;
  alternatives: Tool[];
  prefix: string;
  lang: string;
  t: (fr: string, en: string) => string;
}

function hasFreeplan(tool: any): boolean {
  return hasGenuineFreeTier(tool.pricing?.free);
}

function Stars({ score }: { score: number }) {
  return (
    <div className="td-compare-stars" aria-label={`${score.toFixed(1)} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 12 12" fill={starFill(i, score)} aria-hidden>
          <path d="M6 1l1.3 2.6L10 4l-2 1.9.5 2.7L6 7.4 3.5 8.6 4 5.9 2 4l2.7-.4z" />
        </svg>
      ))}
    </div>
  );
}

export default function ToolComparisonTable({ tool, alternatives, prefix, lang, t }: Props) {
  // Take current tool + top 4 alternatives
  const rows = [tool, ...alternatives.slice(0, 4)];
  const railRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  if (rows.length < 2) return null;

  const updateActiveIndex = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const cards = Array.from(rail.querySelectorAll<HTMLElement>(".td-compare-card"));
    if (!cards.length) return;
    const index = cards.reduce((nearest, card, i) =>
      Math.abs(card.offsetLeft - rail.scrollLeft) < Math.abs(cards[nearest].offsetLeft - rail.scrollLeft) ? i : nearest, 0);
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    rail.addEventListener("scroll", updateActiveIndex, { passive: true });
    window.addEventListener("resize", updateActiveIndex);
    return () => {
      rail.removeEventListener("scroll", updateActiveIndex);
      window.removeEventListener("resize", updateActiveIndex);
    };
  }, [updateActiveIndex]);

  const goTo = (index: number) => {
    const rail = railRef.current;
    const card = rail?.querySelectorAll<HTMLElement>(".td-compare-card")[index];
    if (!rail || !card) return;
    rail.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
    setActiveIndex(index);
  };

  return (
    <div className="td-compare">
      <div className="td-compare-controls">
        <div className="td-compare-controls-actions">
          <button type="button" onClick={() => goTo(Math.max(0, activeIndex - 1))} disabled={activeIndex === 0} aria-label={t("Alternative précédente", "Previous alternative")}>
            <ChevronLeft aria-hidden />
          </button>
          <button type="button" onClick={() => goTo(Math.min(rows.length - 1, activeIndex + 1))} disabled={activeIndex === rows.length - 1} aria-label={t("Alternative suivante", "Next alternative")}>
            <ChevronRight aria-hidden />
          </button>
        </div>
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
            goTo(Math.max(0, activeIndex - 1));
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            goTo(Math.min(rows.length - 1, activeIndex + 1));
          }
        }}
      >
        {rows.map((row, idx) => {
              const isCurrentTool = idx === 0;
              const ts = computeToolTrimScore(row);
              const free = hasFreeplan(row);
              const price = (row as any).pricing_v5?.compare_price_monthly_eur ?? row.defaultMonthlyPrice ?? 0;
              const desc = lang === "en" && (row as any).shortDescriptionEn ? (row as any).shortDescriptionEn : row.shortDescription;
              const cover = (row.ogImageUrl ?? (row as any).og_image_url ?? (row as any).gallery_images?.[0]) as string | undefined;

              return (
                <article
                  key={row.id}
                  className={`td-compare-card${isCurrentTool ? " td-compare-card--current" : ""}${cover ? " td-compare-card--with-media" : ""}`}
                >
                  {cover && (
                    isCurrentTool ? (
                      <div className="td-compare-card-media">
                        <img src={cover} alt={t(`Aperçu de ${row.name}`, `${row.name} preview`)} loading="lazy" />
                      </div>
                    ) : (
                      <Link className="td-compare-card-media" to={`${prefix}/tool/${(row as any).slug || row.id}`} aria-label={t(`Voir la fiche ${row.name}`, `View ${row.name}`)}>
                        <img src={cover} alt={t(`Aperçu de ${row.name}`, `${row.name} preview`)} loading="lazy" />
                      </Link>
                    )
                  )}
                  <div className="td-compare-card-body">
                  <header className="td-compare-card-head">
                    <ToolLogo tool={row as any} size={30} className="rounded-md" />
                    <div className="td-compare-card-identity">
                        {isCurrentTool ? (
                          <p className="td-compare-card-name">
                            {row.name}
                            <span className="td-compare-current-badge">
                              {t("Actuel", "Current")}
                            </span>
                          </p>
                        ) : (
                          <Link
                            to={`${prefix}/tool/${(row as any).slug || row.id}`}
                            className="td-compare-card-name td-compare-card-link"
                          >
                            {row.name}
                          </Link>
                        )}
                        {desc && <p className="td-compare-card-desc">{desc}</p>}
                    </div>
                    {!isCurrentTool && <ArrowRight className="td-compare-card-arrow" aria-hidden />}
                  </header>

                  <div className="td-compare-score-row">
                    <Stars score={ts.score} />
                    <strong>{ts.score.toFixed(1)}</strong>
                    <span>{t("Score ToolTrim", "ToolTrim score")}</span>
                  </div>

                  <dl className="td-compare-facts">
                    <div>
                      <dt>{t("Prix mensuel", "Monthly price")}</dt>
                      <dd>{price === 0 ? t("Gratuit", "Free") : `${Math.round(price)}€`}</dd>
                    </div>
                    <div>
                      <dt>{t("Plan gratuit", "Free plan")}</dt>
                      <dd className="td-compare-fact-icon">{free ? <><Check aria-hidden />{t("Inclus", "Included")}</> : t("Non", "No")}</dd>
                    </div>
                  </dl>
                  </div>
                </article>
              );
            })}
      </div>

      <div className="td-compare-dots" aria-label={t("Choisir une carte", "Choose a card")}>
        {rows.map((row, index) => (
          <button key={row.id} type="button" className={index === activeIndex ? "is-active" : ""} onClick={() => goTo(index)} aria-label={t(`Afficher ${row.name}`, `Show ${row.name}`)} aria-current={index === activeIndex ? "true" : undefined} />
        ))}
      </div>

    </div>
  );
}
