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
