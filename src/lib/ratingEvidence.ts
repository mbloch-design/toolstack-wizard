/** A trailing source note belongs in the info popover, not the visible verdict. */
export function splitRatingEvidence(value: string): { finding: string; source: string | null } {
  const text = value.trim();
  const match = /(?:^|\s)(Sources?\s*:\s*[\s\S]+)$/i.exec(text);
  if (!match || match.index === 0) return { finding: text, source: null };
  const finding = text.slice(0, match.index).trim();
  return finding ? { finding, source: match[1].trim() } : { finding: text, source: null };
}
