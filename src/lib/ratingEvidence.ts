/** A trailing source note belongs in the info popover, not the visible verdict. */
export function splitRatingEvidence(value: string): { finding: string; source: string | null } {
  const text = value.trim();
  const match = /(?:^|\s)(Sources?\s*:\s*[\s\S]+)$/i.exec(text);
  if (!match || match.index === 0) return { finding: text, source: null };
  const finding = text.slice(0, match.index).trim();
  return finding ? { finding, source: match[1].trim() } : { finding: text, source: null };
}

/** Merge repeated citations, keeping a shared date only once. */
export function collectRatingSources(values: string[]): string[] {
  const groups = new Map<string, Set<string>>();
  for (const value of values) {
    const source = splitRatingEvidence(value).source?.replace(/^Sources?\s*:\s*/i, "");
    if (!source) continue;
    const match = /^(.*),\s*(\d{1,2}\s+\S+\s+\d{4}|\d{4}-\d{2}-\d{2})\.?$/.exec(source);
    const date = match?.[2] ?? "";
    const citations = groups.get(date) ?? new Set<string>();
    for (const citation of (match?.[1] ?? source).split(/\s+(?:et|and)\s+/)) citations.add(citation);
    groups.set(date, citations);
  }
  return [...groups].map(([date, citations]) => `${[...citations].join(" · ")}${date ? `, ${date}` : ""}`);
}
