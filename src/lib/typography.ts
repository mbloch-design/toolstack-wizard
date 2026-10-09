/**
 * Display-only typography: straight double quotes become curly ones (French
 * guillemets on French pages). Stored titles and SEO tags stay untouched.
 * French guillemets take non-breaking spaces so « and » never wrap away from
 * their word.
 */
const NBSP = " ";

export function smartQuotes(text: string, lang: string): string {
  if (!text || !text.includes('"')) return text;
  let open = true;
  return text
    .replace(/"\s*/g, (match, offset: number, whole: string) => {
      const opening = open;
      open = !open;
      if (lang !== "fr") return opening ? "“" : `”${match.length > 1 ? " " : ""}`;
      // Drop any space typed inside the quotes, then pad with non-breaking ones.
      if (opening) return `«${NBSP}`;
      const trailing = match.length > 1 || /\s/.test(whole[offset + 1] ?? "") ? " " : "";
      return `${NBSP}»${trailing}`;
    })
    .replace(/\s+ »/g, `${NBSP}»`);
}

/**
 * French typography for display text (art direction review, 9 Oct 2026):
 * a narrow no-break space before ? ! ; and a no-break space before : and
 * inside « », typographic apostrophes, and "e-commerce" kept on one line.
 * Applied at render time, so editorial data stays as written. No-op in
 * English.
 */
const NNBSP = "\u202F";

export function frenchTypography(text: string | null | undefined, lang: string): string {
  if (!text) return text || "";
  if (lang !== "fr") return text;
  return text
    .replace(/\s+([?!;])/g, `${NNBSP}$1`)
    .replace(/\s+:(?!\/\/)/g, `${NBSP}:`)
    .replace(/«\s*/g, `«${NBSP}`)
    .replace(/\s*»/g, `${NBSP}»`)
    .replace(/(\p{L})'(\p{L})/gu, "$1’$2")
    .replace(/\be-commerce\b/gi, (match) => match.replace("-", "\u2011"));
}

/** Curly quotes, then French spacing: the one call for display strings. */
export function displayText(text: string | null | undefined, lang: string): string {
  return frenchTypography(smartQuotes(text || "", lang), lang);
}
