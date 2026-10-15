// Slack's audited catalogue supports these two paths. Do not pad the page
// with unrelated tools; require both actual destinations instead of a count.
export function auditExplorerRelatedPaths(slug, paths) {
  const related = new Set([...paths].filter(path => path !== slug));
  if (slug === "slack") {
    const expected = ["discord", "microsoft-teams"];
    return expected.every(path => related.has(path))
      ? null : "missing an audited Slack related-tool path (discord, microsoft-teams)";
  }
  return related.size >= 3 ? null : "fewer than 3 crawlable related-tool paths";
}
