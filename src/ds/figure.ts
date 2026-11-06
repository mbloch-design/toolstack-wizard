/**
 * Large figures in Uncut Sans (validated by Michael on 06/11/2026): the formatter's narrow
 * no-break space (U+202F) measures under 5 px at 42 px, so « 1 249 € » reads « 1249 € ».
 * A thin space (U+2009) keeps the thousands apart. Only for figures set on one line (white-space: nowrap).
 */
export const displayFigure = (text: string) => text.replace(/ /g, " ");
