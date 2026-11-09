import { useId, useState, type CSSProperties } from "react";
import Logo from "../Logo/Logo";
import { displayFigure } from "../figure";
import Amount from "../Amount/Amount";
import styles from "./Split.module.css";

export type SplitTool = { id: string; name: string; slug?: string; logo?: string; amount: number };
export type SplitArea = { id: string; label: string; color: string; amount: number; tools: SplitTool[] };
export type SplitProps = {
  lang: "fr" | "en";
  /** The paid areas of the stack; the card sorts them and groups the 6th onwards into « Autres ». */
  areas: SplitArea[];
  /** The site's formatter, in the display currency. */
  format: (amount: number) => string;
  /** Names of the tools without a price yet, left out of the figures. */
  unpriced: string[];
  /** Reference date of the currency conversion, already written out, when one took place. */
  rateDate: string | null;
  /** Logos load from our own files only (Storybook, tests). */
  localLogosOnly?: boolean;
};

const SHOWN_AREAS = 5;
/** « Canva, Loom et Zapier », and « Canva, Loom et 3 autres » past three names. */
const list = (names: string[], and: string) => {
  const shown = names.length > 3 ? [...names.slice(0, 2), and === "et" ? `${names.length - 2} autres` : `${names.length - 2} others`] : names;
  return shown.length > 1 ? `${shown.slice(0, -1).join(", ")} ${and} ${shown[shown.length - 1]}` : shown[0];
};

/** Where the money goes: by area, then tool by tool. */
export default function Split({ lang, areas, format, unpriced, rateDate, localLogosOnly = false }: SplitProps) {
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
  const focus = shown.find((area) => area.id === open);

  const percent = (amount: number) => {
    const value = total > 0 ? (amount / total) * 100 : 0;
    if (value > 0 && value < 1) return fr ? "< 1 %" : "<1%";
    return fr ? `${Math.round(value)} %` : `${Math.round(value)}%`;
  };

  const lead = shown[0];
  const leadShare = lead && total > 0 ? Math.round((lead.amount / total) * 100) : 0;
  const title = !lead ? "" : shown.length === 1 ? t(`Tout passe par ${lead.label}.`, `Everything goes through ${lead.label}.`)
    : leadShare >= 50 ? t(`${lead.label} prend ${leadShare} % du budget.`, `${lead.label} takes ${leadShare}% of the budget.`)
    : t(`${sorted.length} domaines se partagent le budget.`, `${sorted.length} areas share the budget.`);
  // One line of humour, read from how concentrated the money is.
  const quip = shown.length === 1 ? t("Spécialiste, et fier de l’être.", "A specialist, and proud of it.")
    : leadShare >= 75 ? t("Le reste fait de la figuration.", "The rest are extras.")
    : leadShare >= 50 ? t("Il a le sens des priorités.", "It knows its priorities.")
    : t("Aucun ne fait la loi.", "None of them calls the shots.");

  return (
    <article className={styles.card} aria-labelledby={`${id}-title`}>
      <div className={styles.head}>
        <h2 id={`${id}-title`} className={styles.eyebrow}>{t("Répartition", "Split")}</h2>
        <p className={styles.amount}><Amount value={format(total)} unit={t("/mois", "/mo")} /></p>
      </div>

      <div className={styles.layout}>
      <div className={styles.overview}>
        <div className={styles.reading}>
          <h3 className={styles.titleM}>{title}</h3>
          <p className={styles.text}>{quip}</p>
        </div>

        {/* Wide card: a ring with the total at its heart. Narrow card: one bar. Same segments, same open area. */}
        <div className={styles.ring} role="img" aria-label={shown.map((area) => `${area.label} ${percent(area.amount)}`).join(", ")}>
          <svg viewBox="0 0 120 120" aria-hidden="true">
            {(() => {
              const circumference = 2 * Math.PI * 50, gap = shown.length > 1 ? 3 : 0;
              let start = 0;
              return shown.map((area) => {
                const length = total > 0 ? (area.amount / total) * circumference : 0;
                // The open area's slice is pulled out of the ring, along the middle of its arc.
                const middle = ((start + length / 2) / circumference) * 2 * Math.PI;
                // A segment opens its area, like its row in the list (the list stays the keyboard path).
                const arc = <circle key={area.id} cx="60" cy="60" r="50" style={{ "--c": area.color, "--dx": `${(Math.cos(middle) * 7).toFixed(2)}px`, "--dy": `${(Math.sin(middle) * 7).toFixed(2)}px` } as CSSProperties} data-on={open === area.id ? "" : undefined}
                  strokeDasharray={`${Math.max(length - gap, 1)} ${circumference}`} strokeDashoffset={-start} onClick={() => setOpen(area.id)} />;
                start += length;
                return arc;
              });
            })()}
          </svg>
          {/* The heart of the ring follows the open area; with none open, the total. */}
          <span className={styles.ringTotal} key={focus?.id ?? "total"}>
            {focus ? <>
              <span className={styles.note}>{focus.label}</span>
              <span className={styles.ringAmount} data-nowrap="">{displayFigure(format(focus.amount))}</span>
              <span className={styles.note} data-nowrap="">{percent(focus.amount)}{t(" du budget", " of the budget")}</span>
            </> : <>
              <span className={styles.ringAmount} data-nowrap="">{displayFigure(format(total))}</span>
              <span className={styles.note}>{t("par mois", "a month")}</span>
            </>}
          </span>
        </div>

        <div className={styles.bar} role="img" aria-label={shown.map((area) => `${area.label} ${percent(area.amount)}`).join(", ")}>
          {shown.map((area) => <i key={area.id} style={{ "--f": area.amount, "--c": area.color } as CSSProperties} data-on={open === area.id ? "" : undefined} />)}
        </div>
      </div>

      <div className={styles.detail}>

      <ul className={styles.areas}>
        {shown.map((area) => {
          const expanded = open === area.id;
          const tools = [...area.tools].sort((a, b) => b.amount - a.amount);
          return (
            <li key={area.id} className={styles.area} style={{ "--c": area.color } as CSSProperties}>
              <button type="button" className={styles.areaRow} aria-expanded={expanded} aria-controls={`${id}-${area.id}`} onClick={() => setOpen(expanded ? null : area.id)}>
                <i className={styles.dot} aria-hidden="true" />
                <span className={styles.label}>{area.label}</span>
                {/* Closed, on a wide card: who is inside, at a glance. */}
                <span className={styles.peek} aria-hidden="true" data-hidden={expanded ? "" : undefined}>
                  {tools.slice(0, 3).map((tool) => <Logo key={tool.id} tool={tool} size={24} localOnly={localLogosOnly} />)}
                </span>
                <span className={styles.figures}>
                  <span className={styles.areaAmount} data-nowrap="">{format(area.amount)}</span>
                  <span className={styles.share} data-nowrap="">{percent(area.amount)}</span>
                </span>
                <svg className={styles.chevron} viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {expanded && (
                <ul id={`${id}-${area.id}`} className={styles.tools}>
                  {tools.map((tool) => (
                    <li key={tool.id} className={styles.tool} title={tool.name}>
                      <Logo tool={tool} size={24} localOnly={localLogosOnly} />
                      <span className={styles.toolCell}>
                        <span className={styles.toolName}>{tool.name}</span>
                        {/* Wide card: the tool's weight in its area, in the area's colour. */}
                        {tools.length > 1 && <span className={styles.toolBar} aria-hidden="true"><i style={{ "--w": `${(tool.amount / Math.max(...tools.map((other) => other.amount))) * 100}%` } as CSSProperties} /></span>}
                      </span>
                      {/* One tool in the area: its figures are the area's, said once. */}
                      {tools.length > 1 && <>
                        <span className={styles.toolAmount} data-nowrap="">{format(tool.amount)}</span>
                        <span className={styles.share} data-nowrap="">{percent(tool.amount)}</span>
                      </>}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      </div>
      </div>

      {(unpriced.length > 0 || rateDate) && (
        <div className={styles.notes}>
          {unpriced.length > 0 && <p className={styles.note}>{fr
            ? `${list(unpriced, "et")} ${unpriced.length > 1 ? "n’ont" : "n’a"} pas encore de prix : ${unpriced.length > 1 ? "ils ne sont pas comptés" : "il n’est pas compté"}.`
            : `${list(unpriced, "and")} ${unpriced.length > 1 ? "have" : "has"} no price yet, so ${unpriced.length > 1 ? "they are" : "it is"} not counted.`}</p>}
          {rateDate && <p className={styles.note}>{t(`Montants convertis au taux de référence du ${rateDate}.`, `Amounts converted at the reference rate of ${rateDate}.`)}</p>}
        </div>
      )}
    </article>
  );
}
