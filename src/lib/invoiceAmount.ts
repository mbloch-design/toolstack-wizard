/** Parse a non-negative invoice amount without guessing a currency or using JS number syntax.
 * Decimal point/comma are accepted to cents. Grouped numbers follow the UI locale:
 * 1,234.56 in English; 1 234,56 (also non-breaking spaces) in French.
 */
export function parseInvoiceAmount(text: string, lang: 'fr' | 'en'): number | null {
  const input = text.trim();
  const french = /^(?:\d+|[1-9]\d{0,2}(?:[ \u00a0\u202f]\d{3})+)(?:[.,]\d{1,2})?$/;
  const english = /^(?:(?:\d+|[1-9]\d{0,2}(?:,\d{3})+)(?:\.\d{1,2})?|\d+,\d{1,2})$/;
  if (!(lang === 'fr' ? french : english).test(input)) return null;
  const normalized = lang === 'fr'
    ? input.replace(/[ \u00a0\u202f]/g, '').replace(',', '.')
    : /^\d+,\d{1,2}$/.test(input) ? input.replace(',', '.') : input.replace(/,/g, '');
  const amount = Number(normalized);
  return Number.isFinite(amount) && Number.isSafeInteger(Math.round(amount * 100)) ? amount : null;
}
