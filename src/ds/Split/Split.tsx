import { useId, useState, type CSSProperties } from "react";
import CutGauge from "../CutGauge/CutGauge";
import Logo from "../Logo/Logo";
import styles from "./Split.module.css";

export type SplitTool = { id: string; name: string; slug?: string; logo?: string; amount: number };
export type SplitArea = { id: string; label: string; color: string; amount: number; tools: SplitTool[] };
export type SplitProps = {
  lang: "fr" | "en";
  /** The paid areas of the stack; the card sorts them and groups the 6th onwards into « Autres ». */
  areas: SplitArea[];
  /** The site's formatter, in the display currency. */
  format: (amount: number) => string;
  /** Tools without a price yet, left out of the figures. */
  unpriced: number;
  /** Reference date of the currency conversion, already written out, when one took place. */
  rateDate: string | null;
  /** Amount at stake in the duplicates, and the way to the decision. */
  review: { amount: number; onReview: () => void } | null;
  /** Logos load from our own files only (Storybook, tests). */
  localLogosOnly?: boolean;
};

const SHOWN_AREAS = 5;

/** Where the money goes: by area, then tool by tool, with what is at stake. */
export default function Split({ lang, areas, format, unpriced, rateDate, review, localLogosOnly = false }: SplitProps) {
  const fr = lang === "fr";
  const t = (a: string, b: string) => (fr ? a : b);
  const id = useId();

  // Biggest first; past five areas, the smallest share one « Autres » line.
  const sorted = [...areas].filter((area) => area.amount > 0).sort((a, b) => b.amount - a.amount);
  const rest = sorted.slice(SHOWN_AREAS - 1);
  const shown: SplitArea[] = sorted.length > SHOWN_AREAS
    ? [...sorted.slice(0, SHOWN_AREAS - 1), { id: "others", label: t("Autres", "Other"), color: "var(--tt-area-other)", amount: rest.reduce((sum, area) => sum + area.amount, 0), tools: rest.flatMap((area) => area.tools) }]
    : sorted;
  const total = shown.reduce((sum, area) => sum + area.amount, 0);
  const [open, setOpen] = useState<string | null>(shown[0]?.id ?? null);

  const percent = (amount: number) => {
    const value = total > 0 ? (amount / total) * 100 : 0;
    if (value > 0 && value < 1) return fr ? "< 1 %" : "< 1%";
    return fr ? `${Math.round(value)} %` : `${Math.round(value)}%`;
  };

  const lead = shown[0];
  const leadShare = lead && total > 0 ? Math.round((lead.amount / total) * 100) : 0;
  const title = !lead ? "" : shown.length === 1 ? t(`Tout passe par ${lead.label}.`, `Everything goes through ${lead.label}.`)
    : leadShare >= 50 ? t(`${lead.label} prend ${leadShare} % du budget.`, `${lead.label} takes ${leadShare}% of the budget.`)
    : t(`${shown.length} domaines se partagent le budget.`, `${shown.length} areas share the budget.`);
  // One line of humour, read from how concentrated the money is.
  const quip = shown.length === 1 ? t("Spécialiste, et fier de l'être.", "A specialist, and proud of it.")
    : leadShare >= 75 ? t("Le reste fait de la figuration.", "The rest are extras.")
    : leadShare >= 50 ? t("Il a le sens des priorités.", "It knows its priorities.")
    : t("Aucun ne fait la loi.", "None of them calls the shots.");

  return (
    <article className={styles.card} aria-labelledby={`${id}-title`}>
      <div className={styles.head}>
        <h2 id={`${id}-title`} className={styles.eyebrow}>{t("Répartition", "Split")}</h2>
        <p className={styles.amount} data-nowrap="">{format(total)}<small className={styles.unit}>{t("/mois", "/mo")}</small></p>
      </div>

      <div className={styles.reading}>
        <h3 className={styles.titleM}>{title}</h3>
        <p className={styles.text}>{quip}</p>
      </div>

      {review && review.amount > 0 && <CutGauge lang={lang} kept={Math.max(0, total - review.amount)} cut={Math.min(review.amount, total)} format={format} onReview={review.onReview} />}

      <div className={styles.bar} role="img" aria-label={shown.map((area) => `${area.label} ${percent(area.amount)}`).join(", ")}>
        {shown.map((area) => <i key={area.id} style={{ "--f": area.amount, "--c": area.color } as CSSProperties} data-on={open === area.id ? "" : undefined} />)}
      </div>

      <ul className={styles.areas}>
        {shown.map((area) => {
          const expanded = open === area.id;
          const tools = [...area.tools].sort((a, b) => b.amount - a.amount);
          return (
            <li key={area.id} className={styles.area} style={{ "--c": area.color } as CSSProperties}>
              <button type="button" className={styles.areaRow} aria-expanded={expanded} aria-controls={`${id}-${area.id}`} onClick={() => setOpen(expanded ? null : area.id)}>
                <i className={styles.dot} aria-hidden="true" />
                <span className={styles.label}>{area.label}</span>
                <span className={styles.figures}>
                  <span className={styles.areaAmount} data-nowrap="">{format(area.amount)}</span>
                  <span className={styles.share} data-nowrap="">{percent(area.amount)}</span>
                </span>
                <svg className={styles.chevron} viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {expanded && (
                <ul id={`${id}-${area.id}`} className={styles.tools}>
                  {tools.map((tool) => (
                    <li key={tool.id} className={styles.tool}>
                      <Logo tool={tool} size={24} localOnly={localLogosOnly} />
                      <span className={styles.toolName}>{tool.name}</span>
                      <span className={styles.toolAmount} data-nowrap="">{format(tool.amount)}</span>
                      <span className={styles.share} data-nowrap="">{percent(tool.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      {(unpriced > 0 || rateDate) && (
        <div className={styles.notes}>
          {unpriced > 0 && <p className={styles.note}>{fr ? `${unpriced} outil${unpriced > 1 ? "s" : ""} sans prix ${unpriced > 1 ? "ne sont" : "n'est"} pas compté${unpriced > 1 ? "s" : ""}.` : `${unpriced} tool${unpriced > 1 ? "s" : ""} without a price ${unpriced > 1 ? "are" : "is"} not counted.`}</p>}
          {rateDate && <p className={styles.note}>{t(`Montants convertis au taux de référence du ${rateDate}.`, `Amounts converted at the reference rate of ${rateDate}.`)}</p>}
        </div>
      )}
    </article>
  );
}
