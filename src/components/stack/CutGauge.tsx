import type { CSSProperties } from "react";

/**
 * La jauge de coupe (système ToolTrim, `.tt-cutgauge`) : ce qu'on garde en
 * encre, ce qui peut tomber en pointillé orange, les ciseaux du signe à la
 * frontière. Montrée seulement quand un montant est à examiner.
 */
export default function CutGauge({ total, toReview, format, t }: { total: number; toReview: number; format: (n: number) => string; t: (fr: string, en: string) => string }) {
  const share = Math.min(1, Math.max(0, toReview / total));
  return <div className="mf-cutgauge">
    <div className="tt-cutgauge" style={{ "--v": share.toFixed(3) } as CSSProperties} role="img"
      aria-label={t(`${format(total - toReview)} gardés, ${format(toReview)} à examiner`, `${format(total - toReview)} kept, ${format(toReview)} to review`)}>
      <span className="tt-cutgauge-keep" />
      <span className="tt-cutgauge-mark" aria-hidden="true"><svg viewBox="60 60 255 255"><path d="M293.43,198.56l-153.81.02c-5.35,19.07-23.03,30.9-42,28.7-19.28-2.24-33.97-18.54-34.17-37.990-.21-19.32,14.06-35.99,33.29-38.65,19.23-2.66,37.46,9.17,42.84,28.54l34.77-.05.05-34.75c-19.04-5.35-30.840-23-28.65-41.98,2.22-19.27,18.54-33.97,37.98-34.16,19.34-.19,35.98,14.05,38.66,33.29,2.68,19.23-9.16,37.42-28.53,42.86l.07,34.81,99.23.04c5.68.11,9.79,4.13,9.95,9.32.15,4.74-3.16,10.01-9.68,10.01ZM195.08,90.97c-9.66-6.63-21.85-3.24-27.38,5.67-5.42,8.73-3.11,20.35,5.46,26.15,8.7,5.9,20.97,3.84,26.91-4.94,5.67-8.38,4.41-20.42-4.99-26.88ZM113.08,173.01c-9.75-6.64-21.88-3.25-27.41,5.66-5.44,8.76-3.08,20.31,5.45,26.16,8.72,5.98,20.88,3.92,26.91-4.98,5.58-8.25,4.34-20.52-4.95-26.85Z"/><path d="M193.84,297.5c0,6.19-4.14,10.15-9.28,10.39-5.35.25-10.08-3.91-10.09-9.93v-70.44c0-5.650,4.16-9.71,9.24-9.93,5.35-.23,10.09,3.93,10.09,9.93l.03,69.98Z"/></svg></span>
      <span className="tt-cutgauge-cut" />
    </div>
    <p className="tt-cutgauge-legend" aria-hidden="true"><span>{t(`Gardé · ${format(total - toReview)}`, `Kept · ${format(total - toReview)}`)}</span><span>{t(`À examiner · ${format(toReview)}`, `To review · ${format(toReview)}`)}</span></p>
  </div>;
}
