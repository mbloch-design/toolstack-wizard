/** Fail the build when its SSR bundle cannot render a required page family. */
export function assertSsrRenderers(module, names) {
  for (const name of names) {
    if (typeof module[name] !== "function") throw new Error(`Missing SSR renderer: ${name}`);
  }
}

/** Inspect only rendered root content; scripts and noscript are not SSR proof. */
export function inspectSsrContent(html) {
  const visibleHtml = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  const opening = /<div\b[^>]*\bid=["']root["'][^>]*>/i.exec(visibleHtml);
  if (!opening) return ["SSR root is missing"];
  const start = opening.index + opening[0].length;
  const divs = /<div\b[^>]*>|<\/div\s*>/gi;
  divs.lastIndex = start;
  let depth = 1;
  let closing;
  for (let token; (token = divs.exec(visibleHtml));) {
    depth += /^<\//.test(token[0]) ? -1 : 1;
    if (depth === 0) { closing = token.index; break; }
  }
  if (closing === undefined) return ["SSR root is unclosed"];
  const root = visibleHtml.slice(start, closing);
  const text = (markup) => markup.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]*>/g, "").replace(/&(?:nbsp|#160|#x[aA]0);/g, " ").trim();
  if (!text(root)) return ["SSR root has no rendered text"];
  const headings = [...root.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/gi)];
  if (headings.length !== 1 || !text(headings[0]?.[1] ?? "")) return ["SSR page must contain exactly one non-empty H1"];
  return [];
}

/** Copy tool data before projecting the JSON hydration payload. */
export function projectToolBootstrap(tool) {
  const out = { ...tool };
  // Only legacy transport fields audited as unused by tool-page consumers.
  // Catalogue sources and localized facts needed for SSR parity stay intact.
  for (const key of ["description", "research", "lifecycle", "website", "verdictFr", "pivot_integration_source", "relevantForEn"]) {
    delete out[key];
  }
  return out;
}
